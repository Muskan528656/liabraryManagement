/**
 * Role Permission Model
 * Handles CRUD for role permissions
 * 
 * Author: Muskan Khan
 * Date: NOV, 2025
 * Copyright: www.ibirdsservices.com
 */

const sql = require("./db.js");

function init(schema_name) {
  this.schema = schema_name;
}

 
async function findAll() {
  const query = `SELECT * FROM demo.role_permissions ORDER BY createddate DESC`;
  const result = await sql.query(query);
  return result.rows.length ? result.rows : [];
}

 
async function findById(id) {
  const query = `SELECT * FROM demo.role_permissions WHERE id = $1`;
  const result = await sql.query(query, [id]);
  return result.rows.length ? result.rows[0] : null;
}

 
async function create(data, userId) {
  const query = `
        INSERT INTO demo.role_permissions
        (role_id, createdbyid, lastmodifiedbyid, createddate, lastmodifieddate)
        VALUES ($1, $2, $2, NOW(), NOW())
        RETURNING *
    `;
  const values = [
    data.role_id || null,
    userId || null
  ];
  const result = await sql.query(query, values);
  return result.rows[0] || null;
}

 
async function updateById(id, data, userId) {
  const current = await findById(id);
  if (!current) throw new Error("Role permission not found");

  const query = `
        UPDATE demo.role_permissions
        SET role_id = $2,
            lastmodifiedbyid = $3,
            lastmodifieddate = NOW()
        WHERE id = $1
        RETURNING *
    `;
  const values = [
    id,
    data.role_id ?? current.role_id,
    userId || null
  ];
  const result = await sql.query(query, values);
  return result.rows.length ? result.rows[0] : null;
}

 
async function deleteById(id) {
  const query = `DELETE FROM demo.role_permissions WHERE id = $1 RETURNING *`;
  const result = await sql.query(query, [id]);
  return result.rows.length
    ? { success: true, message: "Role permission deleted successfully" }
    : { success: false, message: "Role permission not found" };
}

module.exports = {
  init,
  findAll,
  findById,
  create,
  updateById,
  deleteById
};
