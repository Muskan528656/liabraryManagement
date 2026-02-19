const sql = require("./db.js");
let schema = "";
let branchId = null;

function init(schema_name, branch_id = null) {
  schema = schema_name;
  branchId = branch_id;
}


async function findAll(filters = {}) {
  if (!schema) throw new Error("Schema not initialized. Call User.init() first.");

  try {
    let query = `
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
      FROM ${schema}."user"
      WHERE 1=1 AND branch_id = $1 
    `;

    const values = [filters.branchId]; // Add branchId as the first parameter
    let paramIndex = 2;

    if (filters.isactive !== undefined && filters.isactive !== '') {
      query += ` AND isactive = $${paramIndex}`;
      values.push(filters.isactive === 'true' || filters.isactive === true);
      paramIndex++;
    }

    query += ` ORDER BY firstname ASC, lastname ASC`;

    const result = await sql.query(query, values);
    return result.rows.length ? result.rows : [];
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}




// async function findById(params) {
//   if (!schema) throw new Error("Schema not initialized. Call User.init() first.");

//   try {
//     const query = `SELECT * FROM ${schema}."user" WHERE id = $1 AND branch_id = $2`;
//     const result = await sql.query(query, [params.currentUserId, params.branchId]);
//     return result.rows.length ? result.rows[0] : null;
//   } catch (error) {
//     console.error("Error in findById:", error);
//     throw error;
//   }
// }



async function findById(params) {
  const query = `
    SELECT * FROM ${schema}."user"
    WHERE id = $1 AND branch_id = $2
  `;

  const result = await sql.query(query, [
    params.currentUserId,
    params.branchId
  ]);

  return result.rows.length ? result.rows[0] : null;
}




async function findByEmail(email, excludeId = null) {
  if (!schema) throw new Error("Schema not initialized. Call User.init() first.");

  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }

    console.log("Finding vendor by email:", email, "Excluding ID:", excludeId);
    const cleanEmail = email?.trim();
    console.log("Cleaned email:", cleanEmail);

    let query = `
      SELECT *
      FROM ${schema}.user
      WHERE email = $1 AND branch_id = $2
    `;
    const params = [cleanEmail, branchId];

    if (excludeId) {
      query += ` AND id != $3`;
      params.push(excludeId);
      console.log("queryeeeeee", query)
    }

    console.log("Constructed query:", query);
    console.log("Parameters for query:", params);

    const result = await sql.query(query, params);

    console.log("Query result:", result.rows);
    return result.rows.length > 0 ? result.rows[0] : null;

  } catch (error) {
    console.error("Error in findByEmail:", error);
    throw error;
  }
}




async function create(userData, userId) {
  if (!schema) throw new Error("Schema not initialized. Call User.init() first.");

  try {
    // if (userData.email) {
    //   const existing = await this.findByEmail(userData.email);
    //   if (existing) throw new Error("User with this email already exists");
    // }

    if (!userData.companyid) {
      throw new Error("Company ID is required for user creation.");
    }


    const query = `
      INSERT INTO ${schema}."user"
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
        createddate,
        library_member_type,
        branch_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),$15,$16)
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
        createddate,
        library_member_type
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
      userData.library_member_type,
      branchId
    ];

    const result = await sql.query(query, values);
    return result.rows.length ? result.rows[0] : null;

  } catch (error) {
    console.error("Error in create:", error);
    throw error;
  }
}


// async function updateById(id, userData, userId = null) {
//   if (!schema) throw new Error("Schema not initialized. Call User.init() first.");
//   try {

//     // if (userData.email) {
//     //   console.log("Checking for existing email:", userData.email);
//     //   const existing = await this.findByEmail(userData.email);
//     //   if (existing && existing.id !== id) {
//     //     throw new Error("User with this email already exists");
//     //   }
//     // }

//     const updateFields = [];
//     const values = [];
//     let i = 1;


//     const add = (field, value) => {
//       if (value !== undefined && value !== null) {
//         updateFields.push(`${field} = $${i++}`);
//         values.push(value);
//       }
//     };
//     add("firstname", userData.firstname);
//     add("lastname", userData.lastname);
//     add("email", userData.email);
//     add("password", userData.password);
//     add("userrole", userData.userrole);
//     add("phone", userData.phone);
//     add("country_code", userData.country_code);
//     add("country", userData.country);
//     add("currency", userData.currency);
//     add("time_zone", userData.time_zone);

//     add("companyid", userData.companyid);
//     add("profile_image", userData.profile_image);
//     add("library_member_type", userData.library_member_type);

//     // Add lastmodifiedbyid if userId is provided
//     if (userId) {
//       add("lastmodifiedbyid", userId);
//     }


//     if (updateFields.length === 0) {
//       throw new Error("No fields to update");
//     }


//     values.push(id, branchId); // Add id and branchId to values


//     const query = `
//       UPDATE ${schema}."user"
//       SET ${updateFields.join(", ")}
//       WHERE id = $${i - 1} AND branch_id = $${i}  -- id is second to last, branch_id is last
//       RETURNING
//         id,
//         firstname,
//         lastname,
//         email,
//         password,
//         userrole,
//         phone,
//         country_code,
//         country,
//         currency,
//         time_zone,
//         isactive,
//         companyid,
//         library_member_type,
//         branch_id
//     `;

//     console.log("Query:", query);
//     console.log("Values:", values);

//     const result = await sql.query(query, values);


//     return result.rows.length ? result.rows[0] : null;

//   } catch (error) {
//     console.error("Error in updateById:", error);
//     throw error;
//   }
// }

async function updateById(id, userData, userId = null) {
  if (!schema) throw new Error("Schema not initialized. Call User.init() first.");

  try {
    const updateFields = [];
    const values = [];
    let i = 1;

    const add = (field, value) => {
      if (value !== undefined && value !== null) {
        updateFields.push(`${field} = $${i}`);
        values.push(value);
        i++;
      }
    };

    // Fields
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
    add("profile_image", userData.profile_image);
    add("library_member_type", userData.library_member_type);

    // Modified by
    if (userId) {
      add("lastmodifiedbyid", userId);
    }

    if (updateFields.length === 0) {
      throw new Error("No fields to update");
    }

    // ✅ Correct parameter indexing
    const idParam = i++;
    const branchParam = i++;

    values.push(id, branchId);

    const query = `
      UPDATE ${schema}."user"
      SET ${updateFields.join(", ")}
      WHERE id = $${idParam} AND branch_id = $${branchParam}
      RETURNING
        id,
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
        library_member_type,
        branch_id
    `;

    console.log("Query:", query);
    console.log("Values:", values);
    console.log("Total Params:", values.length);

    const result = await sql.query(query, values);

    return result.rows.length ? result.rows[0] : null;

  } catch (error) {
    console.error("Error in updateById:", error);
    throw error;
  }
}

async function deleteById(id) {
  if (!schema) throw new Error("Schema not initialized. Call User.init() first.");

  try {
    const query = `DELETE FROM ${schema}."user" WHERE id = $1 AND branch_id = $2 RETURNING *`;
    const result = await sql.query(query, [id, branchId]);

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
