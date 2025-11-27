/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 */

const sql = require("./db.js");
let schema = "";

function init(schema_name) {
  schema = schema_name;
}

// Get all user roles
async function findAll() {
  try {
    if (!schema) throw new Error("Schema not initialized. Call init() first.");

    const query = `SELECT * FROM ${schema}.user_role ORDER BY createddate DESC`;
    const result = await sql.query(query);

    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in UserRole.findAll:", error);
    throw error;
  }
}

// Get one role by id
async function findById(id) {
  try {
    if (!schema) throw new Error("Schema not initialized. Call init() first.");
    const query = `SELECT * FROM ${schema}.user_role WHERE id = $1`;
    const result = await sql.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error in UserRole.findById:", error);
    throw error;
  }
}

// Insert new role
async function create(data) {
  try {
    const query = `
      INSERT INTO ${schema}.user_role 
      (role_name, is_active, createdbyid, lastmodifiedbyid, createddate, lastmodifieddate)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const values = [
      data.role_name,
      data.is_active ?? true,
      data.createdbyid,
      data.lastmodifiedbyid,
    ];

    const result = await sql.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error in UserRole.create:", error);
    throw error;
  }
}

// Update role
async function update(id, data) {
  try {
    const query = `
      UPDATE ${schema}.user_role
      SET 
        role_name = $1,
        is_active = $2,
        lastmodifiedbyid = $3,
        lastmodifieddate = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *;
    `;

    const values = [
      data.role_name,
      data.is_active,
      data.lastmodifiedbyid,
      id,
    ];

    const result = await sql.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error in UserRole.update:", error);
    throw error;
  }
}

// Delete role
async function remove(id) {
  try {
    if (!schema) throw new Error("Schema not initialized. Call init() first.");
    const query = `DELETE FROM ${schema}.user_role WHERE id = $1 RETURNING *`;
    const result = await sql.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    console.error("Error in UserRole.remove:", error);
    throw error;
  }
}

module.exports = {
  init,
  findAll,
  findById,
  create,
  update,
  remove,
};
