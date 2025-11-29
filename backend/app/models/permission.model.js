/**
 * Permissions Model
 * Author: Muskan Khan
 * Date: NOV, 2025
 * Copyright: www.ibirdsservices.com
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
        ORDER BY p.createddate DESC
    `;
    const result = await sql.query(query);
    return result.rows.length ? result.rows : [];
}

 
async function findById(id) {
    const query = `
        SELECT p.*, m.name AS module_name, m.api_name AS module_api_name
        FROM demo.permissions p
        LEFT JOIN demo.module m ON p.module_id = m.id
        WHERE p.id = $1
    `;
    const result = await sql.query(query, [id]);
    return result.rows.length ? result.rows[0] : null;
}

 
async function create(data, userId) {
    const query = `
        INSERT INTO demo.permissions
        (module_id, allow_view, allow_create, allow_edit, allow_delete, createdbyid, lastmodifiedbyid, createddate, lastmodifieddate)
        VALUES ($1, $2, $3, $4, $5, $6, $6, NOW(), NOW())
        RETURNING *
    `;
    const values = [
        data.module_id || null,
        data.allow_view || false,
        data.allow_create || false,
        data.allow_edit || false,
        data.allow_delete || false,
        userId || null
    ];
    const result = await sql.query(query, values);
    return result.rows[0] || null;
}

 
async function updateById(id, data, userId) {
    const current = await findById(id);
    if (!current) throw new Error("Permission not found");

    const query = `
        UPDATE demo.permissions
        SET module_id = $2,
            allow_view = $3,
            allow_create = $4,
            allow_edit = $5,
            allow_delete = $6,
            lastmodifiedbyid = $7,
            lastmodifieddate = NOW()
        WHERE id = $1
        RETURNING *
    `;
    const values = [
        id,
        data.module_id ?? current.module_id,
        data.allow_view ?? current.allow_view,
        data.allow_create ?? current.allow_create,
        data.allow_edit ?? current.allow_edit,
        data.allow_delete ?? current.allow_delete,
        userId || null
    ];
    const result = await sql.query(query, values);
    return result.rows.length ? result.rows[0] : null;
}

 
async function deleteById(id) {
    const query = `DELETE FROM demo.permissions WHERE id = $1 RETURNING *`;
    const result = await sql.query(query, [id]);
    return result.rows.length
        ? { success: true, message: "Permission deleted successfully" }
        : { success: false, message: "Permission not found" };
}

module.exports = {
    init,
    findAll,
    findById,
    create,
    updateById,
    deleteById
};
