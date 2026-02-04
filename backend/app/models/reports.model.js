/**
 * @author      Aabid
 * @date        Jan 2026
 * @copyright   www.ibirdsservices.com
 */
const sql = require("./db.js");

function init(schema_name) {
  this.schema = schema_name;
}

async function findAll() {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT 
            r.id,
            r.report_name,
            r.api_name,
            r.created_date,
            r.description,
            r.created_by,
            u.firstname AS created_by_name
        FROM ${this.schema}.reports r
        INNER JOIN ${this.schema}."user" u 
            ON r.created_by = u.id
        WHERE r.is_active = true
        ORDER BY r.created_date DESC
    `;
    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}

async function findById(id) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT id, report_name, api_name, created_date, created_by, is_active, last_modified_date, company_id
                   FROM ${this.schema}.reports
                   WHERE id = $1 AND is_active = true`;
    const result = await sql.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error in findById:", error);
    throw error;
  }
}

async function create(reportData, userId) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `INSERT INTO ${this.schema}.reports
                   (report_name, api_name, created_by, company_id)
                   VALUES ($1, $2, $3, $4)
                   RETURNING *`;
    const values = [
      reportData.report_name,
      reportData.api_name,
      userId,
      reportData.company_id
    ];
    const result = await sql.query(query, values);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error in create:", error);
    throw error;
  }
}

module.exports = {
  init,
  findAll,
  findById,
  create,
};
