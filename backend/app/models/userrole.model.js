/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 */

const sql = require("./db.js");
let schema = "";

function init(schema_name) {
  this.schema = schema_name;
}

 
async function findAll() {
  try {
    if (!this.schema) throw new Error("Schema not initialized. Call init() first.");

    const query = `SELECT * FROM ${this.schema}.user_role ORDER BY createddate DESC`;
    const result = await sql.query(query);

    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in UserRole.findAll:", error);
    throw error;
  }
}

 
async function findById(id) {
  try {
    const query = `SELECT * FROM ${this.schema}.user_role WHERE id = $1`;
    const result = await sql.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error in UserRole.findById:", error);
    throw error;
  }
}

 
async function create(data) {
  try {
    const query = `
      INSERT INTO ${this.schema}.user_role 
      (role_name, is_active, createdbyid, lastmodifiedbyid)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const values = [
      data.role_name,
      data.is_active ?? true,
      data.createdbyid,
      data.lastmodifiedbyid,
    ];

    const result = await sql.query(query, values);
    console.log('New Role Created:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error("Error in UserRole.create:", error);
    throw error;
  }
}

 
async function update(id, data) {
  try {
    const query = `
      UPDATE ${this.schema}.user_role
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

 
async function remove(id) {
  try {
    const query = `DELETE FROM ${this.schema}.user_role WHERE id = $1 RETURNING *`;
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
