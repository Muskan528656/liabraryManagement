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

// Find all users
async function findAll() {
  if (!this.schema) {
    console.error("Error: Schema not initialized in findAll");
    throw new Error("Schema name is not initialized. Please call User.init() first.");
  }
  try {
    const query = `SELECT 
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
                   ORDER BY firstname ASC, lastname ASC`;
    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}

// Find user by ID
async function findById(id) {
  if (!this.schema) {
    console.error("Error: Schema not initialized in findById");
    throw new Error("Schema name is not initialized. Please call User.init() first.");
  }
  try {
    const query = `SELECT * FROM ${this.schema}."user" WHERE id = $1`;
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

// Find user by email
async function findByEmail(email) {
  if (!this.schema) {
    console.error("Error: Schema not initialized in findByEmail");
    throw new Error("Schema name is not initialized. Please call User.init() first.");
  }
  try {
    console.log("Finding user by email:", email);
    console.log("this.schema:", this.schema);
    const query = `SELECT * FROM ${this.schema}."user" WHERE email = $1`;
    const result = await sql.query(query, [email]);
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error("Error in findByEmail:", error);
    throw error;
  }
}

async function create(userData, userId) {
  if (!this.schema) {
    console.error("Error: Schema not initialized in create");
    throw new Error("Schema name is not initialized. Please call User.init() first.");
  }
  try {
    if (userData.email) {
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new Error("User with this email already exists");
      }
    }

    if (!this.schema || this.schema === 'undefined' || this.schema === 'null') {
      console.error("Error: Invalid schema name:", this.schema);
      throw new Error(`Invalid schema name: ${this.schema}. Cannot create user.`);
    }

    if (!userData.companyid) {
      console.error("Error: Company ID is required for user creation");
      throw new Error("Company ID is required for user creation.");
    }

    if (userData.password && !userData.password.startsWith('$2a$') && !userData.password.startsWith('$2b$')) {
      console.warn("Warning: Password does not appear to be hashed. Please hash password before creating user.");
    }

    console.log("Creating user with companyId:", userData.companyid, "in schema:", this.schema);

    const query = `INSERT INTO ${this.schema}."user" 
                   (firstname, lastname, email, password, userrole, phone, whatsapp_number, 
                    country_code, isactive, blocked, companyid, managerid, whatsapp_settings) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
                   RETURNING id, firstname, lastname, email, userrole, phone, whatsapp_number, 
                             country_code, isactive, blocked, companyid, managerid, whatsapp_settings`;
    const values = [
      userData.firstname || "",
      userData.lastname || "",
      userData.email || null,
      userData.password || "",
      userData.userrole || "STUDENT",
      userData.phone || null,
      userData.whatsapp_number || null,
      userData.country_code || null,
      userData.isactive !== undefined ? userData.isactive : true,
      userData.blocked !== undefined ? userData.blocked : false,
      userData.companyid, // Company ID is now mandatory
      userData.managerid || null,
      userData.whatsapp_settings ? JSON.stringify(userData.whatsapp_settings) : null,
    ];
    const result = await sql.query(query, values);
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error("Error in create:", error);
    throw error;
  }
}

// Update user by ID
async function updateById(id, userData, userId) {
  if (!this.schema) {
    console.error("Error: Schema not initialized in updateById");
    throw new Error("Schema name is not initialized. Please call User.init() first.");
  }
  try {
    // Check if email is being changed and if it already exists
    if (userData.email) {
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error("User with this email already exists");
      }
    }

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (userData.firstname !== undefined) {
      updateFields.push(`firstname = $${paramIndex++}`);
      values.push(userData.firstname);
    }
    if (userData.lastname !== undefined) {
      updateFields.push(`lastname = $${paramIndex++}`);
      values.push(userData.lastname);
    }
    if (userData.email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      values.push(userData.email);
    }
    if (userData.password !== undefined) {
      updateFields.push(`password = $${paramIndex++}`);
      values.push(userData.password);
    }
    if (userData.userrole !== undefined) {
      updateFields.push(`userrole = $${paramIndex++}`);
      values.push(userData.userrole);
    }
    if (userData.phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      values.push(userData.phone);
    }
    if (userData.whatsapp_number !== undefined) {
      updateFields.push(`whatsapp_number = $${paramIndex++}`);
      values.push(userData.whatsapp_number);
    }
    if (userData.country_code !== undefined) {
      updateFields.push(`country_code = $${paramIndex++}`);
      values.push(userData.country_code);
    }
    if (userData.isactive !== undefined) {
      updateFields.push(`isactive = $${paramIndex++}`);
      values.push(userData.isactive);
    }
    if (userData.blocked !== undefined) {
      updateFields.push(`blocked = $${paramIndex++}`);
      values.push(userData.blocked);
    }
    if (userData.companyid !== undefined) {
      updateFields.push(`companyid = $${paramIndex++}`);
      values.push(userData.companyid);
    }
    if (userData.managerid !== undefined) {
      updateFields.push(`managerid = $${paramIndex++}`);
      values.push(userData.managerid);
    }
    if (userData.whatsapp_settings !== undefined) {
      updateFields.push(`whatsapp_settings = $${paramIndex++}`);
      values.push(userData.whatsapp_settings ? JSON.stringify(userData.whatsapp_settings) : null);
    }

    if (updateFields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);
    const query = `UPDATE ${this.schema}."user" 
                   SET ${updateFields.join(", ")}
                   WHERE id = $${paramIndex} 
                   RETURNING id, firstname, lastname, email, userrole, phone, whatsapp_number, 
                             country_code, isactive, blocked, companyid, managerid, whatsapp_settings`;
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

// Delete user by ID
async function deleteById(id) {
  if (!this.schema) {
    console.error("Error: Schema not initialized in deleteById");
    throw new Error("Schema name is not initialized. Please call User.init() first.");
  }
  try {
    const query = `DELETE FROM ${this.schema}."user" WHERE id = $1 RETURNING *`;
    const result = await sql.query(query, [id]);
    if (result.rows.length > 0) {
      return { success: true, message: "User deleted successfully" };
    }
    return { success: false, message: "User not found" };
  } catch (error) {
    console.error("Error in deleteById:", error);
    throw error;
  }
}

module.exports = {
  init,
  findAll,
  findById,
  findByEmail,
  create,
  updateById,
  deleteById,
};

