/**
 * Permissions Model
 */

const sql = require("./db.js");

function init(schema_name) {
    this.schema = schema_name;
}

async function findAll() {
    const query = `
        SELECT p.*, m.name AS module_name, m.api_name AS module_api_name 
        FROM demo.permissions p
        LEFT JOIN demo.module m ON p.module_id = m.id
        LEFT JOIN demo.user_role r ON p.role_id = r.id
        ORDER BY p.createddate DESC
    `;
    const result = await sql.query(query);
    return result.rows;
}

async function findByRole(roleId) {
    const query = `
        SELECT p.*, m.name AS module_name, m.api_name AS module_api_name
        FROM demo.permissions p
        LEFT JOIN demo.module m ON p.module_id = m.id
        WHERE p.role_id = $1
        ORDER BY m.name
    `;
    const result = await sql.query(query, [roleId]);
    return result.rows;
}

async function findById(id) {
    const query = `
        SELECT p.*, m.name AS module_name, m.api_name AS module_api_name
        FROM demo.permissions p
        LEFT JOIN demo.module m ON p.module_id = m.id
        WHERE p.id = $1
    `;
    const result = await sql.query(query, [id]);
    return result.rows[0] || null;
}

async function create(data, userId) {
    const query = `
        INSERT INTO demo.permissions
        (role_id, module_id, allow_view, allow_create, allow_edit, allow_delete, createdbyid, lastmodifiedbyid)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
        RETURNING *
    `;
    const values = [
        data.role_id,
        data.module_id,
        data.allow_view ?? false,
        data.allow_create ?? false,
        data.allow_edit ?? false,
        data.allow_delete ?? false,
        userId
    ];
    const result = await sql.query(query, values);
    return result.rows[0];
}

async function updateById(id, data, userId) {
    const current = await findById(id);
    if (!current) throw new Error("Permission not found");

    const query = `
        UPDATE demo.permissions
        SET 
            allow_view = $2,
            allow_create = $3,
            allow_edit = $4,
            allow_delete = $5,
            lastmodifiedbyid = $6,
            lastmodifieddate = NOW()
        WHERE id = $1
        RETURNING *
    `;
    const values = [
        id,
        data.allow_view ?? current.allow_view,
        data.allow_create ?? current.allow_create,
        data.allow_edit ?? current.allow_edit,
        data.allow_delete ?? current.allow_delete,
        userId
    ];

    const result = await sql.query(query, values);
    return result.rows[0];
}
// ✅ Find permissions by role ID
async function findByRoleId(roleId) {
    try {
        const query = `
            SELECT p.*, m.module_name, m.module_description
            FROM demo.permissions p
            JOIN demo.modules m ON p.module_id = m.id
            WHERE p.role_id = $1
            ORDER BY m.module_name
        `;

        const result = await sql.query(query, [roleId]);
        return result.rows;
    } catch (error) {
        console.error("Error in Permission.findByRoleId:", error);
        throw error;
    }
}

// ✅ Update multiple permissions for a role
async function updateMultiple(roleId, permissions, userId) {
    try {
        const updatedPermissions = [];

        // Begin transaction
        await sql.query('BEGIN');

        for (const perm of permissions) {
            const { module_id, allow_view, allow_create, allow_edit, allow_delete } = perm;

            // Check if permission already exists
            const existingQuery = `
                SELECT id FROM demo.permissions 
                WHERE role_id = $1 AND module_id = $2
            `;
            const existingResult = await sql.query(existingQuery, [roleId, module_id]);

            if (existingResult.rows.length > 0) {
                // Update existing permission
                const updateQuery = `
                    UPDATE demo.permissions
                    SET 
                        allow_view = $3,
                        allow_create = $4,
                        allow_edit = $5,
                        allow_delete = $6,
                        lastmodifiedbyid = $7,
                        lastmodifieddate = NOW()
                    WHERE role_id = $1 AND module_id = $2
                    RETURNING *
                `;

                const values = [
                    roleId,
                    module_id,
                    allow_view || false,
                    allow_create || false,
                    allow_edit || false,
                    allow_delete || false,
                    userId
                ];

                const result = await sql.query(updateQuery, values);
                updatedPermissions.push(result.rows[0]);
            } else {
                // Insert new permission
                const insertQuery = `
                    INSERT INTO demo.permissions 
                    (role_id, module_id, allow_view, allow_create, allow_edit, allow_delete, createdbyid, lastmodifiedbyid)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
                    RETURNING *
                `;

                const values = [
                    roleId,
                    module_id,
                    allow_view || false,
                    allow_create || false,
                    allow_edit || false,
                    allow_delete || false,
                    userId
                ];

                const result = await sql.query(insertQuery, values);
                updatedPermissions.push(result.rows[0]);
            }
        }

        // Commit transaction
        await sql.query('COMMIT');

        return updatedPermissions;
    } catch (error) {
        // Rollback on error
        await sql.query('ROLLBACK');
        console.error("Error in Permission.updateMultiple:", error);
        throw error;
    }
}
async function deleteById(id) {
    const result = await sql.query(
        `DELETE FROM demo.permissions WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows.length
        ? { success: true, message: "Permission deleted" }
        : { success: false, message: "Not found" };
}

module.exports = {
    init,
    findAll,
    findById,
    findByRole,
    create,
    updateById,
    deleteById
};
