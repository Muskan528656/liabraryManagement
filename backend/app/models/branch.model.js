/**
 * @author      Library Management System
 * @date        Feb, 2026
 * @copyright   www.ibirdsservices.com
 */

const sql = require("./db.js");
let schema = "";

function init(schema_name) {
  this.schema = schema_name;
}

// Get all branches
async function findAll(filters = {}) {
  if (!this.schema) throw new Error("Schema not initialized. Call Branch.init() first.");

  try {
    let query = `
      SELECT 
        id,
        branch_code,
        branch_name,
        address_line1,
        city,
        state,
        country,
        pincode,
        is_active,
        createddate,
        lastmodifieddate,
        createdbyid,
        lastmodifiedbyid
      FROM ${this.schema}.branches
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    if (filters.is_active !== undefined && filters.is_active !== '') {
      query += ` AND is_active = $${paramIndex}`;
      values.push(filters.is_active === 'true' || filters.is_active === true);
      paramIndex++;
    }

    if (filters.search) {
      query += ` AND (branch_name ILIKE $${paramIndex} OR branch_code ILIKE $${paramIndex})`;
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ` ORDER BY branch_name ASC`;

    const result = await sql.query(query, values);
    return result.rows.length ? result.rows : [];
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}

// Get branch by ID
async function findById(id) {
  if (!this.schema) throw new Error("Schema not initialized. Call Branch.init() first.");

  try {
    const query = `SELECT * FROM ${this.schema}.branches WHERE id = $1`;
    const result = await sql.query(query, [id]);
    return result.rows.length ? result.rows[0] : null;
  } catch (error) {
    console.error("Error in findById:", error);
    throw error;
  }
}

// Get branch by code
async function findByCode(code) {
  if (!this.schema) throw new Error("Schema not initialized. Call Branch.init() first.");

  try {
    const query = `SELECT * FROM ${this.schema}.branches WHERE branch_code = $1`;
    const result = await sql.query(query, [code]);
    return result.rows.length ? result.rows[0] : null;
  } catch (error) {
    console.error("Error in findByCode:", error);
    throw error;
  }
}

// Create new branch
async function create(branchData, userId) {
  if (!this.schema) throw new Error("Schema not initialized. Call Branch.init() first.");

  try {
    // Check if branch code already exists
    const existingBranch = await findByCode(branchData.branch_code);
    if (existingBranch) {
      throw new Error("Branch with this code already exists");
    }

    const query = `
      INSERT INTO ${this.schema}.branches
      (
        branch_code,
        branch_name,
        address_line1,
        city,
        state,
        country,
        pincode,
        is_active,
        createdbyid,
        lastmodifiedbyid
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      branchData.branch_code,
      branchData.branch_name,
      branchData.address_line1 || null,
      branchData.city || null,
      branchData.state || null,
      branchData.country || null,
      branchData.pincode || null,
      branchData.is_active !== undefined ? branchData.is_active : true,
      userId,
      userId
    ];

    const result = await sql.query(query, values);
    return result.rows.length ? result.rows[0] : null;
  } catch (error) {
    console.error("Error in create:", error);
    throw error;
  }
}

// Update branch by ID
async function updateById(id, branchData) {
  if (!this.schema) throw new Error("Schema not initialized. Call Branch.init() first.");

  try {
    // Check if another branch with the same code exists (excluding current branch)
    if (branchData.branch_code) {
      const existingBranch = await findByCode(branchData.branch_code);
      if (existingBranch && existingBranch.id !== id) {
        throw new Error("Branch with this code already exists");
      }
    }

    const updateFields = [];
    const values = [];
    let i = 1;

    const add = (field, value) => {
      if (value !== undefined && value !== null) {
        updateFields.push(`${field} = $${i++}`);
        values.push(value);
      }
    };

    add("branch_code", branchData.branch_code);
    add("branch_name", branchData.branch_name);
    add("address_line1", branchData.address_line1);
    add("city", branchData.city);
    add("state", branchData.state);
    add("country", branchData.country);
    add("pincode", branchData.pincode);
    add("is_active", branchData.is_active);

    if (updateFields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);

    const query = `
      UPDATE ${this.schema}.branches
      SET ${updateFields.join(", ")}, lastmodifiedbyid = $${i}, lastmodifieddate = CURRENT_TIMESTAMP
      WHERE id = $${i + 1}
      RETURNING *
    `;

    const result = await sql.query(query, [...values, branchData.lastmodifiedbyid, id]);

    return result.rows.length ? result.rows[0] : null;
  } catch (error) {
    console.error("Error in updateById:", error);
    throw error;
  }
}

// Delete branch by ID
async function deleteById(id) {
  if (!this.schema) throw new Error("Schema not initialized. Call Branch.init() first.");

  try {
    const query = `DELETE FROM ${this.schema}.branches WHERE id = $1 RETURNING *`;
    const result = await sql.query(query, [id]);

    return result.rows.length
      ? { success: true, message: "Branch deleted successfully", deletedBranch: result.rows[0] }
      : { success: false, message: "Branch not found" };
  } catch (error) {
    console.error("Error in deleteById:", error);
    throw error;
  }
}

// Check if branch exists by ID
async function exists(id) {
  if (!this.schema) throw new Error("Schema not initialized. Call Branch.init() first.");

  try {
    const query = `SELECT 1 FROM ${this.schema}.branches WHERE id = $1`;
    const result = await sql.query(query, [id]);
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error in exists:", error);
    throw error;
  }
}

module.exports = {
  init,
  findAll,
  findById,
  findByCode,
  create,
  updateById,
  deleteById,
  exists
};