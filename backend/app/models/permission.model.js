/**
 * Permissions Model
 * Only essential functions for CRUD and role-permission management
 */

const sql = require("./db.js");

function init(schema_name) {
    this.schema = schema_name;
}

// Get all permissions
async function findAll() {
    const query = `SELECT * FROM demo.permissions ORDER BY name`;
    const result = await sql.query(query);
    return result.rows;
}

// Get permissions assigned to a role
async function findByRole(roleId) {
    const query = `
        SELECT p.* 
        FROM demo.permissions p
        JOIN demo.role_permissions rp ON rp.permission_id = p.id
        WHERE rp.role_id = $1
        ORDER BY p.name
    `;
    const result = await sql.query(query, [roleId]);
    return result.rows;
}

// Create a new permission
async function create(data) {
    const query = `
        INSERT INTO demo.permissions (name)
        VALUES ($1)
        RETURNING *
    `;
    const result = await sql.query(query, [data.name]);
    return result.rows[0];
}

// Update permission name by ID
async function updateById(id, data) {
    const query = `
        UPDATE demo.permissions
        SET name = $2
        WHERE id = $1
        RETURNING *
    `;
    const result = await sql.query(query, [id, data.name]);
    return result.rows[0];
}

// Delete permission by ID
async function deleteById(id) {
    const result = await sql.query(
        `DELETE FROM demo.permissions WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows.length
        ? { success: true, message: "Permission deleted" }
        : { success: false, message: "Not found" };
}

// Assign multiple permissions to a role (role_permissions)
async function updateMultiple(roleId, permissions) {
    // permissions = array of permission IDs
    await sql.query("BEGIN");

    try {
        // Delete old permissions
        await sql.query(`DELETE FROM demo.role_permissions WHERE role_id = $1`, [roleId]);

        // Insert new permissions
        for (const permId of permissions) {
            await sql.query(
                `INSERT INTO demo.role_permissions (role_id, permission_id) VALUES ($1, $2)`,
                [roleId, permId]
            );
        }

        await sql.query("COMMIT");
        return { success: true, message: "Permissions updated for role" };
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
