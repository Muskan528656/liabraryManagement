

const sql = require("./db.js");

function init(schema_name, branch_id) {
    this.schema = schema_name;
    this.branchId = branch_id;
}

// Get all permissions with role information
async function findAll() {
    const query = `
        SELECT 
            p.*,
            rp.role_id,
            r.role_name,
            m.name as module_name
        FROM ${this.schema}.permissions p
        LEFT JOIN ${this.schema}.role_permissions rp ON p.id = rp.permission_id
        LEFT JOIN ${this.schema}.user_role r ON rp.role_id = r.id
        LEFT JOIN ${this.schema}.module m ON p.module_id = m.id
        WHERE p.branch_id = $1
        ORDER BY COALESCE(r.role_name, 'No Role'), m.name
    `;
    const result = await sql.query(query, [this.branchId]);
    return result.rows;
}

async function findByRole(roleId) {
    const query = `
        SELECT 
            p.id as permission_id,
            p.module_id,
            m.name as module_name,
            p.allow_view,
            p.allow_create,
            p.allow_edit,
            p.allow_delete
        FROM ${this.schema}.permissions p
        LEFT JOIN ${this.schema}.module m ON p.module_id = m.id
        WHERE p.role_id = $1 AND p.branch_id = $2
        ORDER BY m.name ASC
    `;
    const result = await sql.query(query, [roleId, this.branchId]);
    return result.rows.map(row => ({
        permissionId: row.permission_id,
        moduleId: row.module_id,
        moduleName: row.module_name,
        allowView: row.allow_view,
        allowCreate: row.allow_create,
        allowEdit: row.allow_edit,
        allowDelete: row.allow_delete,
    }));
}

// Create a new permission
async function create(data, userId = null) {
    const query = `
        INSERT INTO ${this.schema}.permissions (
            module_id, 
            allow_view, 
            allow_create, 
            allow_edit, 
            allow_delete, 
            role_id,
            createdbyid,
            lastmodifiedbyid,
            branch_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
    `;

    const values = [
        data.module_id,
        data.allow_view || false,
        data.allow_create || false,
        data.allow_edit || false,
        data.allow_delete || false,
        data.role_id,
        userId,
        userId,
        this.branchId
    ];

    const result = await sql.query(query, values);

    if (data.role_id) {
        await sql.query(
            `INSERT INTO ${this.schema}.role_permissions (role_id, permission_id) VALUES ($1, $2)`,
            [data.role_id, result.rows[0].id]
        );
    }

    return result.rows[0];
}

// Update permission by ID
async function updateById(id, data, userId = null) {
    const query = `
        UPDATE ${this.schema}.permissions
        SET 
            module_id = $2,
            allow_view = $3,
            allow_create = $4,
            allow_edit = $5,
            allow_delete = $6,
            role_id = $7,
            lastmodifiedbyid = $8,
            lastmodifieddate = CURRENT_TIMESTAMP
        WHERE id = $1 AND branch_id = $9
        RETURNING *
    `;

    const values = [
        id,
        data.module_id,
        data.allow_view || false,
        data.allow_create || false,
        data.allow_edit || false,
        data.allow_delete || false,
        data.role_id,
        userId,
        this.branchId
    ];

    const result = await sql.query(query, values);

    if (data.role_id) {

        const existing = await sql.query(
            `SELECT * FROM ${this.schema}.role_permissions WHERE permission_id = $1`,
            [id]
        );

        if (existing.rows.length > 0) {

            await sql.query(
                `UPDATE ${this.schema}.role_permissions SET role_id = $1 WHERE permission_id = $2`,
                [data.role_id, id]
            );
        } else {

            await sql.query(
                `INSERT INTO ${this.schema}.role_permissions (role_id, permission_id) VALUES ($1, $2)`,
                [data.role_id, id]
            );
        }
    }

    return result.rows[0];
}

async function deleteById(id) {

    // First check if permission belongs to this branch
    const check = await sql.query(`SELECT id FROM ${this.schema}.permissions WHERE id = $1 AND branch_id = $2`, [id, this.branchId]);
    if (check.rows.length === 0) {
        return { success: false, message: "Not found or access denied" };
    }

    await sql.query(`DELETE FROM ${this.schema}.role_permissions WHERE permission_id = $1`, [id]);


    const result = await sql.query(
        `DELETE FROM ${this.schema}.permissions WHERE id = $1 AND branch_id = $2 RETURNING *`,
        [id, this.branchId]
    );

    return result.rows.length
        ? { success: true, message: "Permission deleted" }
        : { success: false, message: "Not found" };
}

async function updateMultiple(roleId, permissions, userId = null) {
    await sql.query("BEGIN");

    try {
        // Delete permissions only for this branch and role
        // Note: permissions table has role_id, so we can filter by role_id and branch_id
        await sql.query(
            `DELETE FROM ${this.schema}.permissions WHERE role_id = $1 AND branch_id = $2`,
            [roleId, this.branchId]
        );

        // We also need to clean up role_permissions. 
        // Since we just deleted from permissions table, we should delete orphaned role_permissions or filtered by permission ids we just deleted?
        // But the previous code deleted all role_permissions for the roleId.
        // If we only delete permissions for this branch, we should only delete role_permissions linking to those permissions?
        // But wait, role_permissions table doesn't seem to have branch_id.
        // If we delete from permissions table, the foreign key logic might kick in or we end up with orphans.
        // The original code: DELETE FROM role_permissions WHERE role_id = $1. This deletes ALL role associations for that role.
        // If roles are cross-branch (unlikely for multi-tenant strict separation), this is dangerous.
        // Assuming roles are branch specific or at least query context implies branch.

        // Let's assume we should only delete role_permissions where the permission belongs to this branch?
        // Or if we deleted the permission, we must delete the role_permission.
        // But `DELETE FROM permissions` happens first.
        // Actually, original code:
        // DELETE FROM permissions WHERE role_id = $1
        // DELETE FROM role_permissions WHERE role_id = $1

        // If I change to `DELETE FROM permissions WHERE role_id = $1 AND branch_id = $2`
        // It only removes permissions for this branch.
        // Then `DELETE FROM role_permissions WHERE role_id = $1` removes ALL role links for this role?
        // If a role is used across branches (bad design but possible), this would break other branches.
        // BUT, assuming standard multi-tenant, roles are likely tenant/branch scoped.
        // Effectively, just stick to cleaning up what we can.

        // Simplest correct approach if table has foreign keys with cascade: delete from permissions.
        // If not, we manually delete.
        // Let's stick closer to the original logic but adding branch_id constraint to the permissions deletion.

        // To be safe for role_permissions:
        // Maybe we shouldn't wipe all role_permissions for that role if we only wipe permissions for this branch?
        // But we are "replacing" permissions for this role in this branch.
        // If the role exists in this branch context, we probably own the whole role's permissions map.

        await sql.query(
            `DELETE FROM ${this.schema}.role_permissions WHERE role_id = $1 AND permission_id IN (SELECT id FROM ${this.schema}.permissions WHERE branch_id = $2)`,
            [roleId, this.branchId]
        );

        // Now safe to delete permissions
        await sql.query(
            `DELETE FROM ${this.schema}.permissions WHERE role_id = $1 AND branch_id = $2`,
            [roleId, this.branchId]
        );

        const createdPermissions = [];

        for (const perm of permissions) {
            const query = `
                INSERT INTO ${this.schema}.permissions (
                    module_id, 
                    allow_view, 
                    allow_create, 
                    allow_edit, 
                    allow_delete, 
                    role_id,
                    createdbyid,
                    lastmodifiedbyid,
                    branch_id
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `;

            const values = [
                perm.module_id,
                perm.allow_view || false,
                perm.allow_create || false,
                perm.allow_edit || false,
                perm.allow_delete || false,
                roleId,
                userId,
                userId,
                this.branchId
            ];

            const result = await sql.query(query, values);
            const permission = result.rows[0];


            await sql.query(
                `INSERT INTO ${this.schema}.role_permissions (role_id, permission_id,branch_id  ) VALUES ($1, $2,$3)`,
                [roleId, permission.id, this.branchId]
            );

            createdPermissions.push(permission);
        }

        await sql.query("COMMIT");
        return createdPermissions;
    } catch (error) {
        await sql.query("ROLLBACK");
        console.error("Error in updateMultiple:", error);
        throw error;
    }
}


module.exports = {
    init,
    findAll,
    findByRole,
    create,
    updateById,
    deleteById,
    updateMultiple
};