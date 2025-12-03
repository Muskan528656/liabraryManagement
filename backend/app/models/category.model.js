/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */
const sql = require("./db.js");
let schema = "";

function init(schema_name) {
  this.schema = schema_name;
}

 
async function findAll() {
  try {
    const query = `SELECT * FROM demo.categories ORDER BY createddate DESC`;
    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}

 
async function findById(id) {
  try {
    const query = `SELECT * FROM demo.categories WHERE id = $1`;
    const result = await sql.query(query, [id]);
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error("Error in findById:", error);
    throw error;
  }
}

 
async function create(categoryData, userId) {
  try {
    console.log("Creating category with data:", categoryData);
    console.log("User ID:", userId);
    
    const query = `INSERT INTO demo.categories 
                   (name, description, createddate, lastmodifieddate, createdbyid, lastmodifiedbyid) 
                   VALUES ($1, $2, NOW(), NOW(), $3, $3) 
                   RETURNING *`;
 
    const values = [
      categoryData.name || "Scanned Category",
      categoryData.description || null,
      userId || null,
    ];
    
    console.log("SQL Query:", query);
    console.log("Values:", values);
    
    const result = await sql.query(query, values);
    
    console.log("Insert result:", result.rows);
    
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error("Error in create:", error);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error detail:", error.detail);
    throw error;
  }
}

 
async function updateById(id, categoryData, userId) {
  try {
    const query = `UPDATE demo.categories 
                   SET name = $2, description = $3, 
                       lastmodifieddate = NOW(), lastmodifiedbyid = $4
                   WHERE id = $1 
                   RETURNING *`;
    const values = [
      id,
      categoryData.name,
      categoryData.description || null,
      userId || null,
    ];
    const result = await sql.query(query, values);
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error("Error in updateById:", error);
    throw error;
  }
}

 
async function deleteById(id) {
  try {
    const query = `DELETE FROM demo.categories WHERE id = $1 RETURNING *`;
    const result = await sql.query(query, [id]);
    if (result.rows.length > 0) {
      return { success: true, message: "Category deleted successfully" };
    }
    return { success: false, message: "Category not found" };
  } catch (error) {
    console.error("Error in deleteById:", error);
    throw error;
  }
}

 
async function findByName(name, excludeId = null) {
  try {
    let query = `SELECT * FROM demo.categories WHERE name = $1`;
    const params = [name];
    
    if (excludeId) {
      query += ` AND id != $2`;
      params.push(excludeId);
    }
    
    const result = await sql.query(query, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error in findByName:", error);
    throw error;
  }
}

module.exports = {
  init,
  findAll,
  findById,
  create,
  updateById,
  deleteById,
  findByName,
};

