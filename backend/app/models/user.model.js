

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
        country,
        currency,
        time_zone,
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

async function findByEmail(email, excludeId = null) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }

    console.log("Finding vendor by email:", email, "Excluding ID:", excludeId);
    const cleanEmail = email?.trim();
    console.log("Cleaned email:", cleanEmail);

    let query = `
      SELECT *
      FROM ${this.schema}.user
      WHERE email = $1
    `;
    const params = [cleanEmail];

    if (excludeId) {
      query += ` AND id != $2`;
      params.push(excludeId);
      console.log("queryeeeeee", query)
    }

    console.log("Constructed query:", query);
    console.log("Parameters for query:", params);

    const result = await sql.query(query, params);

    console.log("Query result:", result.rows);
    return result.rows.length > 0 ? result.rows[0] : null;

  } catch (error) {
    console.error("Error in findByName:", error);
    throw error;
  }
}





async function create(userData, userId) {
  if (!this.schema) throw new Error("Schema not initialized. Call User.init() first.");

  try {
    if (userData.email) {
      const existing = await this.findByEmail(userData.email);
      if (existing) throw new Error("User with this email already exists");
    }

    if (!userData.companyid) {
      throw new Error("Company ID is required for user creation.");
    }


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
        country,
        currency,
        time_zone,
        isactive,
        companyid,
        createdbyid,
        lastmodifiedbyid,
        createddate
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
      RETURNING
        id,
        firstname,
        lastname,
        email,
        userrole,
        phone,
        country_code,
        country,
        currency,
        time_zone,
        isactive,
        companyid,
        createdbyid,
        lastmodifiedbyid,
        createddate
    `;

    const values = [
      userData.firstname || "",
      userData.lastname || "",
      userData.email || null,
      userData.password || "",
      userData.userrole || "STUDENT",
      userData.phone || null,
      userData.country_code || null,
      userData.country || null,
      userData.currency || null,
      userData.time_zone || null,
      userData.isactive !== undefined ? userData.isactive : true,
      userData.companyid,
      userId,
      userId,
    ];

    const result = await sql.query(query, values);
    return result.rows.length ? result.rows[0] : null;

  } catch (error) {
    console.error("Error in create:", error);
    throw error;
  }
}


async function updateById(id, userData) {
  if (!this.schema) throw new Error("Schema not initialized. Call User.init() first.");
  try {

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
      if (value !== undefined && value !== null) {
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
    add("country", userData.country);
    add("currency", userData.currency);
    add("time_zone", userData.time_zone);

    add("companyid", userData.companyid);
    add("profile_image", userData.profileImage);


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
        country,
        currency,
        time_zone,
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


module.exports = {
  init,
  findAll,
  findById,
  findByEmail,
  create,
  updateById,
  deleteById,
};
