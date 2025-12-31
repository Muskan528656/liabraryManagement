/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */

const sql = require("./db.js");

function init(schema_name) {
  this.schema = schema_name;
}

 
async function findAll() {
  try {
    const query = `SELECT * FROM demo.authors ORDER BY createddate DESC`;
    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}

 
async function findById(id) {
  try {
    const query = `SELECT * FROM demo.authors WHERE id = $1`;
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

async function create(authorData, userId) {
  try {
    const query = `INSERT INTO demo.authors 
                   (name, email, bio, createddate, lastmodifieddate, createdbyid, lastmodifiedbyid) 
                   VALUES ($1, $2, $3, NOW(), NOW(), $4, $5) 
                   RETURNING *`;

    const values = [
      authorData.name ,
      authorData.email || null,
      authorData.bio || null,
      userId || null,
      userId || null
    ];

    const result = await sql.query(query, values);
    return result.rows[0] || null;

  } catch (error) {
    console.error("Error in create:", error);
    throw error;
  }
}


 
async function updateById(id, authorData, userId) {
  try {
    const query = `UPDATE demo.authors 
                   SET name = $2, email = $3, bio = $4, 
                       lastmodifieddate = NOW(), lastmodifiedbyid = $5
                   WHERE id = $1 
                   RETURNING *`;
    const values = [
      id,
      authorData.name,
      authorData.email || null,
      authorData.bio || null,
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
    const query = `DELETE FROM demo.authors WHERE id = $1 RETURNING *`;
    const result = await sql.query(query, [id]);
    if (result.rows.length > 0) {
      return { success: true, message: "Author deleted successfully" };
    }
    return { success: false, message: "Author not found" };
  } catch (error) {
    console.error("Error in deleteById:", error);
    throw error;
  }
}

 
async function findByEmail(email, excludeId = null) {
  try {
    let query = `SELECT * FROM demo.authors WHERE email = $1`;
    const params = [email];

    if (excludeId) {
      query += ` AND id != $2`;
      params.push(excludeId);
    }

    const result = await sql.query(query, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error in findByEmail:", error);
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
  findByEmail,
};

