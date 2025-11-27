/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */

const sql = require("./db.js");
let schema = "";

// Initialize schema
function init(schema_name) {
  this.schema = schema_name;
}

// =======================================================
// Find all users
// =======================================================
async function findAll() {
  if (!this.schema) throw new Error("Schema not initialized. Call User.init() first.");

  try {
    const query = `
      SELECT 
        id,
        firstname,
        lastname,
        email,
        userrole,
        phone,
        country_code,
        isactive,
        companyid
      FROM ${this.schema}."user"
      ORDER BY firstname ASC, lastname ASC
    `;

    const result = await sql.query(query);
    return result.rows.length ? result.rows : [];
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}

// =======================================================
// Find user by ID
// =======================================================
async function findById(id) {
  if (!this.schema) throw new Error("Schema not initialized. Call User.init() first.");

  try {
    const query = `SELECT * FROM ${this.schema}."user" WHERE id = $1`;
    const result = await sql.query(query, [id]);
    return result.rows.length ? result.rows[0] : null;
  } catch (error) {
    console.error("Error in findById:", error);
    throw error;
  }
}

// =======================================================
// Find user by email
// =======================================================
async function findByEmail(email) {
  if (!this.schema) throw new Error("Schema not initialized. Call User.init() first.");

  try {
    const query = `SELECT * FROM ${this.schema}."user" WHERE email = $1`;
    const result = await sql.query(query, [email]);
    return result.rows.length ? result.rows[0] : null;
  } catch (error) {
    console.error("Error in findByEmail:", error);
    throw error;
  }
}

// =======================================================
// Create User
// =======================================================
async function create(userData) {
  if (!this.schema) throw new Error("Schema not initialized. Call User.init() first.");

  try {
    if (userData.email) {
      const existing = await this.findByEmail(userData.email);
      if (existing) throw new Error("User with this email already exists");
    }

    if (!userData.companyid) {
      throw new Error("Company ID is required for user creation.");
    }

    // INSERT (No WhatsApp fields)
    const query = `
      INSERT INTO ${this.schema}."user"
      (
        firstname,
        lastname,
        email,
        password,
        userrole,
        phone,
        country_code,
        isactive,
        companyid
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING
        id,
        firstname,
        lastname,
        email,
        userrole,
        phone,
        country_code,
        isactive,
        companyid
    `;

    const values = [
      userData.firstname || "",
      userData.lastname || "",
      userData.email || null,
      userData.password || "",
      userData.userrole || "STUDENT",
      userData.phone || null,
      userData.country_code || null,
      userData.isactive !== undefined ? userData.isactive : true,
      userData.companyid,
    ];

    const result = await sql.query(query, values);
    return result.rows.length ? result.rows[0] : null;

  } catch (error) {
    console.error("Error in create:", error);
    throw error;
  }
}


// =======================================================
// Update User
// =======================================================
async function updateById(id, userData) {
  if (!this.schema) throw new Error("Schema not initialized. Call User.init() first.");
  try {
    // Check email duplication
    if (userData.email) {
      const existing = await this.findByEmail(userData.email);
      if (existing && existing.id !== id) {
        throw new Error("User with this email already exists");
      }
    }

    const updateFields = [];
    const values = [];
    let i = 1;

    const add = (field, value) => {
      if (value !== undefined) {
        updateFields.push(`${field} = $${i++}`);
        values.push(value);
      }
    };

    add("firstname", userData.firstname);
    add("lastname", userData.lastname);
    add("email", userData.email);
    add("password", userData.password);
    add("userrole", userData.userrole);
    add("phone", userData.phone);
    add("country_code", userData.country_code);
    add("isactive", userData.isactive);
    add("companyid", userData.companyid);

    if (updateFields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);

    const query = `
      UPDATE ${this.schema}."user"
      SET ${updateFields.join(", ")}
      WHERE id = $${i}
      RETURNING
        id,
        firstname,
        lastname,
        email,
        userrole,
        phone,
        country_code,
        isactive,
        companyid
    `;

    const result = await sql.query(query, values);
    return result.rows.length ? result.rows[0] : null;

  } catch (error) {
    console.error("Error in updateById:", error);
    throw error;
  }
}

// =======================================================
// Delete User
// =======================================================
async function deleteById(id) {
  if (!this.schema) throw new Error("Schema not initialized. Call User.init() first.");

  try {
    const query = `DELETE FROM ${this.schema}."user" WHERE id = $1 RETURNING *`;
    const result = await sql.query(query, [id]);

    return result.rows.length
      ? { success: true, message: "User deleted successfully" }
      : { success: false, message: "User not found" };
  } catch (error) {
    console.error("Error in deleteById:", error);
    throw error;
  }
}

// =======================================================
module.exports = {
  init,
  findAll,
  findById,
  findByEmail,
  create,
  updateById,
  deleteById,
};
