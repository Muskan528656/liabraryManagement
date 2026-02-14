/**
 * @author      iBirds Services
 * @date        JAN, 2026
 * @copyright   www.ibirdsservices.com
 */

const sql = require("./db.js");

let schema = "";
let branchId = null;

function init(schema_name, branch_id = null) {
  schema = schema_name;
  branchId = branch_id;
}

async function create(penaltyData, userId) {
  if (!schema) throw new Error("Schema not initialized");
  
  try {
    const result = await sql.query(
      `INSERT INTO ${schema}.penalty_master 
        (penalty_type, per_day_amount, fixed_amount, max_amount, description, is_active, 
         createddate, createdbyid, branch_id)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7, $8)
       RETURNING *`,
      [
        penaltyData.penalty_type,
        penaltyData.per_day_amount,
        penaltyData.fixed_amount,
        penaltyData.max_amount,
        penaltyData.description,
        penaltyData.is_active !== undefined ? penaltyData.is_active : true,
        userId,
        branchId
      ]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error("Error creating penalty master:", error);
    throw error;
  }
}

async function findById(id) {
  if (!schema) throw new Error("Schema not initialized");
  
  try {
    const result = await sql.query(
      `SELECT * FROM ${schema}.penalty_master 
       WHERE id = $1 AND branch_id = $2`,
      [id, branchId]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error finding penalty master by id:", error);
    throw error;
  }
}

async function getAll(filters = {}) {
  if (!schema) throw new Error("Schema not initialized");
  
  try {
    let query = `SELECT * FROM ${schema}.penalty_master WHERE branch_id = $1`;
    let values = [branchId];
    let paramIndex = 2;
    
    if (filters.penalty_type) {
      query += ` AND penalty_type = $${paramIndex}`;
      values.push(filters.penalty_type);
      paramIndex++;
    }
    
    if (filters.is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      values.push(filters.is_active);
      paramIndex++;
    }
    
    query += ` ORDER BY createddate DESC`;
    
    const result = await sql.query(query, values);
    return result.rows;
  } catch (error) {
    console.error("Error getting all penalty masters:", error);
    throw error;
  }
}

async function update(id, penaltyData, userId) {
  if (!schema) throw new Error("Schema not initialized");
  
  try {
    const result = await sql.query(
      `UPDATE ${schema}.penalty_master 
       SET penalty_type = $1, per_day_amount = $2, fixed_amount = $3, 
           max_amount = $4, description = $5, is_active = $6,
           lastmodifieddate = CURRENT_TIMESTAMP, lastmodifiedbyid = $7
       WHERE id = $8 AND branch_id = $9
       RETURNING *`,
      [
        penaltyData.penalty_type,
        penaltyData.per_day_amount,
        penaltyData.fixed_amount,
        penaltyData.max_amount,
        penaltyData.description,
        penaltyData.is_active,
        userId,
        id,
        branchId
      ]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error("Error updating penalty master:", error);
    throw error;
  }
}

async function deleteById(id, userId) {
  if (!schema) throw new Error("Schema not initialized");
  
  try {
    const result = await sql.query(
      `DELETE FROM ${schema}.penalty_master 
       WHERE id = $1 AND branch_id = $2
       RETURNING *`,
      [id, branchId]
    );
    
    if (result.rows.length === 0) {
      throw new Error("Penalty master not found or not authorized");
    }
    
    return result.rows[0];
  } catch (error) {
    console.error("Error deleting penalty master:", error);
    throw error;
  }
}

module.exports = {
  init,
  create,
  findById,
  getAll,
  update,
  deleteById
};