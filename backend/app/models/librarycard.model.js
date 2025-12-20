// /**
//  * @author      Muskan Khan
//  * @date        DEC, 2025
//  */
// const sql = require("./db.js");
// const { generateAutoNumberSafe } = require("../utils/autoNumber.helper.js");

// let schema = "";

// function init(schema_name) {
//   schema = schema_name;
// }

// async function findAll() {
//   try {
//     const query = `
//       SELECT
//         lm.*,
//         CONCAT(u.firstname, ' ', u.lastname) AS user_name,
//         u.email AS user_email,
//         p.plan_name,
//         p.duration_days,
//         ot.label AS type_label
//       FROM ${schema}.library_members lm
//       LEFT JOIN ${schema}."user" u
//         ON lm.createdbyid = u.id
//       LEFT JOIN ${schema}.plan p
//         ON lm.plan_id = p.id
//       LEFT JOIN ${schema}.object_type ot
//         ON lm.type = ot.id
//       ORDER BY lm.createddate DESC;
//     `;

//     const result = await sql.query(query);
//     return result.rows;
//   } catch (error) {
//     console.error("Error in findAll:", error);
//     throw error;
//   }
// }

// async function findById(id) {
//   try {
//     const query = `
//       SELECT
//         lm.*,
//         CONCAT(u.firstname, ' ', u.lastname) AS user_name,
//         u.email AS user_email,
//         p.plan_name,
//         p.duration_days,
//         ot.label AS type_label
//       FROM ${schema}.library_members lm
//       LEFT JOIN ${schema}."user" u
//         ON lm.createdbyid = u.id
//       LEFT JOIN ${schema}.plan p
//         ON lm.plan_id = p.id
//       LEFT JOIN ${schema}.object_type ot
//         ON lm.type = ot.id
//       WHERE lm.id = $1
//     `;

//     const result = await sql.query(query, [id]);
//     return result.rows[0] || null;
//   } catch (error) {
//     console.error("Error in findById:", error);
//     throw error;
//   }
// }

// async function findByCardNumber(cardNumber) {
//   try {
//     const query = `
//       SELECT
//         lm.*,
//         CONCAT(u.firstname, ' ', u.lastname) AS user_name,
//         u.email AS user_email,
//         p.plan_name,
//         p.duration_days,
//         ot.label AS type_label
//       FROM ${schema}.library_members lm
//       LEFT JOIN ${schema}."user" u
//         ON lm.createdbyid = u.id
//       LEFT JOIN ${schema}.plan p
//         ON lm.plan_id = p.id
//       LEFT JOIN ${schema}.object_type ot
//         ON lm.type = ot.id
//       WHERE lm.card_number = $1
//     `;

//     const result = await sql.query(query, [cardNumber]);
//     return result.rows[0] || null;
//   } catch (error) {
//     console.error("Error in findByCardNumber:", error);
//     throw error;
//   }
// }

// async function resolveTypeId(typeName) {
//   if (!typeName) return null;

//   const query = `
//     SELECT id
//     FROM ${schema}.object_type
//     WHERE status = 'Active'
//       AND (
//         LOWER(label) = LOWER($1)
//         OR LOWER(type) = LOWER($1)
//       )
//     LIMIT 1
//   `;

//   const result = await sql.query(query, [typeName.trim()]);

//   return result.rows.length ? result.rows[0].id : null;
// }


// async function create(cardData, userId) {
//   console.log("📥 Model.create() - Received cardData:", {
//     ...cardData,
//     image: cardData.image ? `[${typeof cardData.image} - ${cardData.image.substring(0, 30)}...]` : 'null'
//   });

//   // Generate card number if not provided
//   if (!cardData.card_number) {
//     cardData.card_number = await generateAutoNumberSafe('library_members', userId, 'LIB-', 5);
//     if (!cardData.card_number) {
//       throw new Error("Failed to generate unique card number");
//     }
//   }

//   // Resolve type from name
//   if (cardData.type) {
//     const resolvedTypeId = await resolveTypeId(cardData.type);

//     if (!resolvedTypeId) {
//       throw new Error(`Invalid or inactive type: ${cardData.type}`);
//     }

//     cardData.type_id = resolvedTypeId;
//   }


//   try {
//     const fields = [
//       "card_number",
//       "is_active",
//       "image",
//       "subscription_id",
//       "first_name",
//       "last_name",
//       "name",
//       "email",
//       "phone_number",
//       "country_code",
//       "registration_date",
//       "type_id",
//       "createddate",
//       "lastmodifieddate",
//       "createdbyid",
//       "lastmodifiedbyid"
//     ];


//     const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

//     const query = `
//       INSERT INTO ${schema}.library_members
//       (${fields.join(", ")})
//       VALUES (${placeholders})
//       RETURNING *
//     `;

//     const imageValue = cardData.hasOwnProperty('image')
//       ? (cardData.image || null)
//       : null;

//     const values = [
//       cardData.card_number,
//       isActive,
//       imageValue,
//       cardData.subscription_id || null,
//       cardData.first_name,
//       cardData.last_name,
//       `${cardData.first_name} ${cardData.last_name}`,
//       cardData.email,
//       cardData.phone_number,
//       cardData.country_code,
//       cardData.registration_date || null,
//       cardData.type_id,
//       userId,
//       userId
//     ];
//     console.log("📋 Inserting values:", {
//       card_number: values[0],
//       type_id: values[10],
//       userId: values[13]
//     });

//     const result = await sql.query(query, values);

//     // Fetch the complete record with joins
//     const completeRecord = await findById(result.rows[0].id);
//     return completeRecord;

//   } catch (error) {
//     console.error("❌ Error in create:", {
//       message: error.message,
//       code: error.code,
//       detail: error.detail,
//       constraint: error.constraint
//     });
//     throw error;
//   }
// }

// async function updateById(id, cardData, userId) {
//   try {
//     const updates = [];
//     const values = [];
//     let idx = 1;

//     // Fields that can be updated
//     const allowedFields = [
//       "card_number",
//       "is_active",
//       "image",
//       "renewal",
//       "subscription_id",
//       "first_name",
//       "last_name",
//       "name",
//       "email",
//       "phone_number",
//       "registration_date",
//       "country_code"
//     ];

//     // Check and prepare type field separately
//     if (cardData.type || cardData.type_id) {
//       const typeInput = cardData.type || cardData.type_id;
//       const resolvedTypeId = await resolveTypeId(typeInput);

//       if (resolvedTypeId) {
//         updates.push("type = $" + idx);
//         values.push(resolvedTypeId);
//         idx++;
//       } else if (typeInput) {
//         throw new Error(`Invalid type: ${typeInput}. Must be a valid type name or id.`);
//       }
//     }

//     // Prepare other fields
//     allowedFields.forEach(field => {
//       if (cardData[field] !== undefined) {
//         updates.push(`${field} = $${idx}`);
//         values.push(cardData[field]);
//         idx++;
//       }
//     });

//     // Add timestamp and user fields
//     updates.push("lastmodifieddate = CURRENT_TIMESTAMP");
//     updates.push(`lastmodifiedbyid = $${idx}`);
//     values.push(userId);
//     idx++;

//     if (updates.length === 0) {
//       return await findById(id); // No changes, return current record
//     }

//     values.push(id);

//     const query = `
//       UPDATE ${schema}.library_members
//       SET ${updates.join(", ")}
//       WHERE id = $${idx}
//       RETURNING *
//     `;

//     console.log("🔄 Updating record ID:", id);

//     const result = await sql.query(query, values);

//     if (result.rows.length === 0) {
//       throw new Error("Record not found");
//     }

//     // Fetch complete updated record
//     const updatedRecord = await findById(id);
//     return updatedRecord;

//   } catch (error) {
//     console.error("Error in updateById:", error);
//     throw error;
//   }
// }

// async function deleteById(id) {
//   try {
//     const query = `
//       DELETE FROM ${schema}.library_members 
//       WHERE id = $1 
//       RETURNING id, card_number, name
//     `;

//     const result = await sql.query(query, [id]);

//     if (result.rows.length > 0) {
//       return {
//         success: true,
//         message: "Library member deleted successfully",
//         data: result.rows[0]
//       };
//     }

//     return {
//       success: false,
//       message: "Record not found"
//     };

//   } catch (error) {
//     console.error("Error in deleteById:", error);

//     // Handle foreign key constraint errors
//     if (error.code === '23503') { // foreign_key_violation
//       throw new Error("Cannot delete member. Related records exist.");
//     }

//     throw error;
//   }
// }

// async function findByStudentId(studentId) {
//   return await findByUserId(studentId);
// }

// async function findByUserId(userId) {
//   try {
//     const query = `
//       SELECT
//         lm.*,
//         CONCAT(u.firstname, ' ', u.lastname) AS user_name,
//         u.email AS user_email
//       FROM ${schema}.library_members lm
//       LEFT JOIN ${schema}."user" u 
//         ON lm.createdbyid = u.id
//       WHERE lm.user_id = $1
//       LIMIT 1
//     `;

//     const result = await sql.query(query, [userId]);
//     return result.rows[0] || null;

//   } catch (error) {
//     console.error("Error in findByUserId:", error);
//     throw error;
//   }
// }

// async function getAllRecords() {
//   try {
//     const query = `
//       SELECT * 
//       FROM demo.object_type 

//     `;

//     const result = await sql.query(query);
//     return result.rows;

//   } catch (error) {
//     console.error("Error in getAllRecords:", error);
//     throw error;
//   }
// }

// // Optional: Add search functionality
// async function search(searchTerm) {
//   try {
//     const query = `
//       SELECT
//         lm.*,
//         CONCAT(u.firstname, ' ', u.lastname) AS user_name,
//         ot.label AS type_label
//       FROM ${schema}.library_members lm
//       LEFT JOIN ${schema}."user" u ON lm.createdbyid = u.id
//       LEFT JOIN ${schema}.object_type ot ON lm.type = ot.id
//       WHERE 
//         lm.card_number ILIKE $1 OR
//         lm.name ILIKE $1 OR
//         lm.email ILIKE $1 OR
//         lm.phone_number ILIKE $1 OR
//         CONCAT(lm.first_name, ' ', lm.last_name) ILIKE $1
//       ORDER BY lm.createddate DESC
//       LIMIT 50
//     `;

//     const result = await sql.query(query, [`%${searchTerm}%`]);
//     return result.rows;

//   } catch (error) {
//     console.error("Error in search:", error);
//     throw error;
//   }
// }

// module.exports = {
//   init,
//   getAllRecords,
//   findByStudentId,
//   findByUserId,
//   findAll,
//   findById,
//   findByCardNumber,
//   create,
//   updateById,
//   deleteById,
//   search
// };


/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 */
const sql = require("./db.js");
const { generateAutoNumberSafe } = require("../utils/autoNumber.helper.js");

let schema = "";

function init(schema_name) {
  schema = schema_name;
}

async function findAll() {
  try {
    const query = `
      SELECT
        lm.*,
        CONCAT(u.firstname, ' ', u.lastname) AS user_name,
        u.email AS user_email,
        p.plan_name,
        p.duration_days,
        ot.label AS type_label
      FROM ${schema}.library_members lm
      LEFT JOIN ${schema}."user" u
        ON lm.createdbyid = u.id
      LEFT JOIN ${schema}.plan p
        ON lm.plan_id = p.id
      LEFT JOIN ${schema}.object_type ot
        ON lm.type = ot.id
      ORDER BY lm.createddate DESC;
    `;

    const result = await sql.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}

async function findById(id) {
  try {
    const query = `
      SELECT
        lm.*,
        CONCAT(u.firstname, ' ', u.lastname) AS user_name,
        u.email AS user_email,
        p.plan_name,
        p.duration_days,
        ot.label AS type_label
      FROM ${schema}.library_members lm
      LEFT JOIN ${schema}."user" u
        ON lm.createdbyid = u.id
      LEFT JOIN ${schema}.plan p
        ON lm.plan_id = p.id
      LEFT JOIN ${schema}.object_type ot
        ON lm.type = ot.id
      WHERE lm.id = $1
    `;

    const result = await sql.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error in findById:", error);
    throw error;
  }
}

async function findByCardNumber(cardNumber) {
  try {
    const query = `
      SELECT
        lm.*,
        CONCAT(u.firstname, ' ', u.lastname) AS user_name,
        u.email AS user_email,
        p.plan_name,
        p.duration_days,
        ot.label AS type_label
      FROM ${schema}.library_members lm
      LEFT JOIN ${schema}."user" u
        ON lm.createdbyid = u.id
      LEFT JOIN ${schema}.plan p
        ON lm.plan_id = p.id
      LEFT JOIN ${schema}.object_type ot
        ON lm.type = ot.id
      WHERE lm.card_number = $1
    `;

    const result = await sql.query(query, [cardNumber]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error in findByCardNumber:", error);
    throw error;
  }
}

async function resolveTypeId(typeName) {
  if (!typeName) return null;

  const query = `
    SELECT id
    FROM ${schema}.object_type
    WHERE status = 'Active'
      AND (
        LOWER(label) = LOWER($1)
        OR LOWER(type) = LOWER($1)
      )
    LIMIT 1
  `;

  const result = await sql.query(query, [typeName.trim()]);
  return result.rows.length ? result.rows[0].id : null;
}

async function create(cardData, userId) {
  console.log("📥 Model.create() - Received cardData:", {
    ...cardData,
    image: cardData.image ? `[${typeof cardData.image} - ${cardData.image.substring(0, 30)}...]` : 'null'
  });

  // Generate card number if not provided
  if (!cardData.card_number) {
    cardData.card_number = await generateAutoNumberSafe('library_members', userId, 'LIB-', 5);
    if (!cardData.card_number) {
      throw new Error("Failed to generate unique card number");
    }
  }

  // Resolve type from name
  if (cardData.type) {
    const resolvedTypeId = await resolveTypeId(cardData.type);

    if (!resolvedTypeId) {
      throw new Error(`Invalid or inactive type: ${cardData.type}`);
    }

    cardData.type_id = resolvedTypeId;
  }

  try {
    const fields = [
      "card_number",
      "is_active",
      "image",
      "subscription_id",
      "first_name",
      "last_name",
      "name",
      "email",
      "phone_number",
      "country_code",
      "registration_date",
      "type",
      "createddate",
      "lastmodifieddate",
      "createdbyid",
      "lastmodifiedbyid"
    ];

    const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

    const query = `
      INSERT INTO ${schema}.library_members
      (${fields.join(", ")})
      VALUES (${placeholders})
      RETURNING *
    `;

    const imageValue = cardData.hasOwnProperty('image')
      ? (cardData.image || null)
      : null;

    // ✅ FIXED: Handle is_active properly
    const isActive = cardData.is_active !== undefined
      ? cardData.is_active
      : (cardData.status === 'true' || cardData.status === true);

    const values = [
      cardData.card_number,
      isActive,
      imageValue,
      cardData.subscription_id || null,
      cardData.first_name,
      cardData.last_name,
      `${cardData.first_name} ${cardData.last_name}`,
      cardData.email,
      cardData.phone_number,
      cardData.country_code,
      cardData.registration_date || null,
      cardData.type_id || null,
      new Date(),
      new Date(),
      userId,
      userId
    ];

    console.log("📋 Inserting values:", {
      card_number: values[0],
      is_active: values[1],
      type: values[11],
      createdbyid: values[14]
    });

    const result = await sql.query(query, values);

    // Fetch the complete record with joins
    const completeRecord = await findById(result.rows[0].id);
    return completeRecord;

  } catch (error) {
    console.error("❌ Error in create:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint
    });
    throw error;
  }
}

async function updateById(id, cardData, userId) {
  try {
    const updates = [];
    const values = [];
    let idx = 1;

    // Handle is_active
    if (cardData.is_active !== undefined) {
      updates.push("is_active = $" + idx);
      values.push(cardData.is_active);
      idx++;
    } else if (cardData.status !== undefined) {
      updates.push("is_active = $" + idx);
      values.push(cardData.status === 'true' || cardData.status === true);
      idx++;
    }

    // Check and prepare type field separately
    if (cardData.type) {
      const resolvedTypeId = await resolveTypeId(cardData.type);
      if (resolvedTypeId) {
        updates.push("type = $" + idx);
        values.push(resolvedTypeId);
        idx++;
      } else {
        throw new Error(`Invalid type: ${cardData.type}. Must be a valid type name or id.`);
      }
    }

    // Fields that can be updated
    const allowedFields = [
      "card_number",
      "image",
      "renewal",
      "subscription_id",
      "first_name",
      "last_name",
      "name",
      "email",
      "phone_number",
      "registration_date",
      "country_code"
    ];

    // Prepare other fields
    allowedFields.forEach(field => {
      if (cardData[field] !== undefined) {
        updates.push(`${field} = $${idx}`);
        if (field === 'name' && !cardData[field] && cardData.first_name && cardData.last_name) {
          values.push(`${cardData.first_name} ${cardData.last_name}`);
        } else {
          values.push(cardData[field]);
        }
        idx++;
      }
    });

    // Add timestamp and user fields
    updates.push("lastmodifieddate = CURRENT_TIMESTAMP");
    updates.push(`lastmodifiedbyid = $${idx}`);
    values.push(userId);
    idx++;

    if (updates.length === 0) {
      return await findById(id); // No changes, return current record
    }

    values.push(id);

    const query = `
      UPDATE ${schema}.library_members
      SET ${updates.join(", ")}
      WHERE id = $${idx}
      RETURNING *
    `;

    console.log("🔄 Updating record ID:", id);
    console.log("Query:", query);
    console.log("Values:", values);

    const result = await sql.query(query, values);

    if (result.rows.length === 0) {
      throw new Error("Record not found");
    }

    // Fetch complete updated record
    const updatedRecord = await findById(id);
    return updatedRecord;

  } catch (error) {
    console.error("Error in updateById:", error);
    throw error;
  }
}

async function deleteById(id) {
  try {
    const query = `
      DELETE FROM ${schema}.library_members 
      WHERE id = $1 
      RETURNING id, card_number, name
    `;

    const result = await sql.query(query, [id]);

    if (result.rows.length > 0) {
      return {
        success: true,
        message: "Library member deleted successfully",
        data: result.rows[0]
      };
    }

    return {
      success: false,
      message: "Record not found"
    };

  } catch (error) {
    console.error("Error in deleteById:", error);

    // Handle foreign key constraint errors
    if (error.code === '23503') { // foreign_key_violation
      throw new Error("Cannot delete member. Related records exist.");
    }

    throw error;
  }
}

async function findByStudentId(studentId) {
  return await findByUserId(studentId);
}

async function findByUserId(userId) {
  try {
    const query = `
      SELECT
        lm.*,
        CONCAT(u.firstname, ' ', u.lastname) AS user_name,
        u.email AS user_email
      FROM ${schema}.library_members lm
      LEFT JOIN ${schema}."user" u 
        ON lm.createdbyid = u.id
      WHERE lm.user_id = $1
      LIMIT 1
    `;

    const result = await sql.query(query, [userId]);
    return result.rows[0] || null;

  } catch (error) {
    console.error("Error in findByUserId:", error);
    throw error;
  }
}

async function getAllRecords() {
  try {
    const query = `SELECT * FROM demo.object_type WHERE status = 'Active'`;
    const result = await sql.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error in getAllRecords:", error);
    throw error;
  }
}

async function search(searchTerm) {
  try {
    const query = `
      SELECT
        lm.*,
        CONCAT(u.firstname, ' ', u.lastname) AS user_name,
        ot.label AS type_label
      FROM ${schema}.library_members lm
      LEFT JOIN ${schema}."user" u ON lm.createdbyid = u.id
      LEFT JOIN ${schema}.object_type ot ON lm.type = ot.id
      WHERE 
        lm.card_number ILIKE $1 OR
        lm.name ILIKE $1 OR
        lm.email ILIKE $1 OR
        lm.phone_number ILIKE $1 OR
        CONCAT(lm.first_name, ' ', lm.last_name) ILIKE $1
      ORDER BY lm.createddate DESC
      LIMIT 50
    `;

    const result = await sql.query(query, [`%${searchTerm}%`]);
    return result.rows;

  } catch (error) {
    console.error("Error in search:", error);
    throw error;
  }
}

module.exports = {
  init,
  getAllRecords,
  findByStudentId,
  findByUserId,
  findAll,
  findById,
  findByCardNumber,
  create,
  updateById,
  deleteById,
  search
};