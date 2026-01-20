
const sql = require("./db.js");

function init(schema_name) {
    this.schema = schema_name;
}

// Get all permissions with role information
async function findAll() {
    const query = `
        SELECT 
            p.*,
            rp.role_id,
            r.role_name,
            m.name as module_name
        FROM demo.permissions p
        LEFT JOIN demo.role_permissions rp ON p.id = rp.permission_id
        LEFT JOIN demo.user_role r ON rp.role_id = r.id
        LEFT JOIN demo.module m ON p.module_id = m.id
        ORDER BY COALESCE(r.role_name, 'No Role'), m.name
    `;
    const result = await sql.query(query);
    return result.rows;
}

async function findByRole(roleId) {
    const query = `
        SELECT 
            p.*,
            m.name as module_name,
            r.role_name
        FROM demo.permissions p
        JOIN demo.role_permissions rp ON rp.permission_id = p.id
        JOIN demo.roles r ON rp.role_id = r.id
        LEFT JOIN demo.modules m ON p.module_id = m.id
        WHERE rp.role_id = $1
        ORDER BY m.name
    `;
    const result = await sql.query(query, [roleId]);
    return result.rows;
}

// Create a new permission
async function create(data, userId = null) {
    const query = `
        INSERT INTO demo.permissions (
            module_id, 
            allow_view, 
            allow_create, 
            allow_edit, 
            allow_delete, 
            role_id,
            createdbyid,
            lastmodifiedbyid
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
        userId
    ];

    const result = await sql.query(query, values);

    if (data.role_id) {
        await sql.query(
            `INSERT INTO demo.role_permissions (role_id, permission_id) VALUES ($1, $2)`,
            [data.role_id, result.rows[0].id]
        );
    }

    return result.rows[0];
}

// Update permission by ID
async function updateById(id, data, userId = null) {
    const query = `
        UPDATE demo.permissions
        SET 
            module_id = $2,
            allow_view = $3,
            allow_create = $4,
            allow_edit = $5,
            allow_delete = $6,
            role_id = $7,
            lastmodifiedbyid = $8,
            lastmodifieddate = CURRENT_TIMESTAMP
        WHERE id = $1
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
        userId
    ];

    const result = await sql.query(query, values);

    if (data.role_id) {

        const existing = await sql.query(
            `SELECT * FROM demo.role_permissions WHERE permission_id = $1`,
            [id]
        );

        if (existing.rows.length > 0) {

            await sql.query(
                `UPDATE demo.role_permissions SET role_id = $1 WHERE permission_id = $2`,
                [data.role_id, id]
            );
        } else {

            await sql.query(
                `INSERT INTO demo.role_permissions (role_id, permission_id) VALUES ($1, $2)`,
                [data.role_id, id]
            );
        }
    }

    return result.rows[0];
}

async function deleteById(id) {
    

    await sql.query(`DELETE FROM demo.role_permissions WHERE permission_id = $1`, [id]);


    const result = await sql.query(
        `DELETE FROM demo.permissions WHERE id = $1 RETURNING *`,
        [id]
    );

    return result.rows.length
        ? { success: true, message: "Permission deleted" }
        : { success: false, message: "Not found" };
}

async function updateMultiple(roleId, permissions, userId = null) {
    await sql.query("BEGIN");

    try {
        await sql.query(
            `DELETE FROM demo.permissions WHERE role_id = $1`,
            [roleId]
        );

        await sql.query(
            `DELETE FROM demo.role_permissions WHERE role_id = $1`,
            [roleId]
        );

        const createdPermissions = [];

        for (const perm of permissions) {
            const query = `
                INSERT INTO demo.permissions (
                    module_id, 
                    allow_view, 
                    allow_create, 
                    allow_edit, 
                    allow_delete, 
                    role_id,
                    createdbyid,
                    lastmodifiedbyid
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
                userId
            ];

            const result = await sql.query(query, values);
            const permission = result.rows[0];


            await sql.query(
                `INSERT INTO demo.role_permissions (role_id, permission_id) VALUES ($1, $2)`,
                [roleId, permission.id]
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