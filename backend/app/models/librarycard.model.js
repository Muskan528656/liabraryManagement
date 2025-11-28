// /**
//  * @author      Muskan Khan
//  * @date        DEC, 2025
//  * @copyright   www.ibirdsservices.com
//  */
// const sql = require("./db.js");
// const { getNextAutoNumber } = require("../utils/autoNumber.helper.js");
// let schema = "";

// function init(schema_name) {
//   schema = schema_name;
// }

// // Find all library cards
// async function findAll() {
//   try {
//     const query = `SELECT 
//                     lc.*,
//                     u.firstname || ' ' || u.lastname AS user_name,
//                     u.email AS user_email
//                    FROM ${schema}.library_members lc
//                    LEFT JOIN ${schema}."user"
//                    ORDER BY lc.createddate DESC`;
//     const result = await sql.query(query);
//     return result.rows.length > 0 ? result.rows : [];
//   } catch (error) {
//     console.error("Error in findAll:", error);
//     throw error;
//   }
// }

// // Find library card by ID
// async function findById(id) {
//   try {
//     const query = `SELECT 
//                     lc.*,
//                     u.firstname || ' ' || u.lastname AS user_name,
//                     u.email AS user_email
//                    FROM ${schema}.library_members lc
//                    LEFT JOIN ${schema}."user" u ON lc.user_id = u.id
//                    WHERE lc.id = $1`;
//     const result = await sql.query(query, [id]);
//     if (result.rows.length > 0) {
//       return result.rows[0];
//     }
//     return null;
//   } catch (error) {
//     console.error("Error in findById:", error);
//     throw error;
//   }
// }

// // Find library card by card number
// async function findByCardNumber(cardNumber) {
//   try {
//     const query = `SELECT 
//                     lc.*,
//                     u.firstname || ' ' || u.lastname AS user_name,
//                     u.email AS user_email
//                    FROM ${schema}.library_members lc
//                    LEFT JOIN ${schema}."user" u ON lc.user_id = u.id
//                    WHERE lc.card_number = $1`;
//     const result = await sql.query(query, [cardNumber]);
//     console.log("findByCardNumber result:", result.rows);
//     if (result.rows.length > 0) {
//       return result.rows[0];
//     }
//     return null;
//   } catch (error) {
//     console.error("Error in findByCardNumber:", error);
//     throw error;
//   }
// }

// // Find library card by user ID
// async function findByUserId(userId) {
//   try {
//     const query = `SELECT 
//                     lc.*,
//                     u.firstname || ' ' || u.lastname AS user_name,
//                     u.email AS user_email
//                    FROM ${schema}.library_members lc
//                    LEFT JOIN ${schema}."user" u ON lc.user_id = u.id
//                    WHERE lc.user_id = $1`;
//     const result = await sql.query(query, [userId]);
//     if (result.rows.length > 0) {
//       return result.rows[0];
//     }
//     return null;
//   } catch (error) {
//     console.error("Error in findByUserId:", error);
//     throw error;
//   }
// }

// // Find library card by student ID (for backward compatibility)
// async function findByStudentId(studentId) {
//   return findByUserId(studentId);
// }

// // Generate unique card number
// async function generateCardNumber(userId) {
//   try {
//     return await getNextAutoNumber("library_members", {
//       prefix: "LIB-",
//       digit_count: 6,
//       next_number: "1"
//     }, userId);
//   } catch (error) {
//     console.error("Error generating auto-config card number, using fallback:", error);
//     const prefix = "LIB";
//     const year = new Date().getFullYear();
//     const query = `SELECT COUNT(*) as count FROM ${schema}.library_members WHERE card_number LIKE $1`;
//     const result = await sql.query(query, [`${prefix}${year}%`]);
//     const count = parseInt(result.rows[0]?.count || 0) + 1;
//     return `${prefix}${year}${String(count).padStart(6, '0')}`;
//   }
// }

// // Create a new library card
// async function create(cardData, userId) {
//   try {
//     // Check if user already has a card
//     const user_id = cardData.user_id || cardData.userId || cardData.student_id || cardData.studentId;
//     if (user_id) {
//       const existingCard = await findByUserId(user_id);
//       if (existingCard) {
//         throw new Error("User already has a library card");
//       }
//     }

//     // Generate card number if not provided
//     let cardNumber = cardData.card_number;
//     if (!cardNumber) {
//       cardNumber = await generateCardNumber(userId);
//     }

//     const query = `INSERT INTO ${schema}.library_members 
//                    (user_id, card_number, issue_date, expiry_date, is_active, image, first_name, last_name, name, email, phone_number, registration_date, type, renewal, subscription_id, createddate, lastmodifieddate, createdbyid, lastmodifiedbyid) 
//                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $16, $16) 
//                    RETURNING *`;
//     const values = [
//       user_id || null,
//       cardNumber,
//       cardData.issue_date || new Date().toISOString().split('T')[0],
//       cardData.expiry_date || null,
//       cardData.is_active !== undefined ? cardData.is_active : (cardData.status === 'active' ? true : false),
//       cardData.image || cardData.image_url || cardData.user_image || null,
//       cardData.first_name || null,
//       cardData.last_name || null,
//       cardData.name || null,
//       cardData.email || null,
//       cardData.phone_number || null,
//       cardData.registration_date || null,
//       cardData.type || null,
//       cardData.renewal || null,
//       cardData.subscription_id || null,
//       userId || null,
//     ];
//     const result = await sql.query(query, values);
//     if (result.rows.length > 0) {
//       return result.rows[0];
//     }
//     return null;
//   } catch (error) {
//     console.error("Error in create:", error);
//     throw error;
//   }
// }

// // Update library card by ID
// async function updateById(id, cardData, userId) {
//   try {
//     const user_id = cardData.user_id || cardData.userId || cardData.student_id || cardData.studentId;

//     // Build dynamic query based on provided fields
//     const updates = [];
//     const values = [];
//     let paramIndex = 1;

//     if (user_id !== undefined) {
//       updates.push(`user_id = $${paramIndex++}`);
//       values.push(user_id);
//     }

//     if (cardData.issue_date !== undefined) {
//       updates.push(`issue_date = $${paramIndex++}`);
//       values.push(cardData.issue_date || null);
//     }

//     if (cardData.expiry_date !== undefined) {
//       updates.push(`expiry_date = $${paramIndex++}`);
//       values.push(cardData.expiry_date || null);
//     }

//     if (cardData.is_active !== undefined || cardData.status !== undefined) {
//       updates.push(`is_active = $${paramIndex++}`);
//       values.push(cardData.is_active !== undefined ? cardData.is_active : (cardData.status === 'active' ? true : false));
//     }

//     if (cardData.image !== undefined) {
//       updates.push(`image = $${paramIndex++}`);
//       values.push(cardData.image || cardData.image_url || cardData.user_image || null);
//     }

//     if (cardData.first_name !== undefined) {
//       updates.push(`first_name = $${paramIndex++}`);
//       values.push(cardData.first_name || null);
//     }

//     if (cardData.last_name !== undefined) {
//       updates.push(`last_name = $${paramIndex++}`);
//       values.push(cardData.last_name || null);
//     }

//     if (cardData.name !== undefined) {
//       updates.push(`name = $${paramIndex++}`);
//       values.push(cardData.name || null);
//     }

//     if (cardData.email !== undefined) {
//       updates.push(`email = $${paramIndex++}`);
//       values.push(cardData.email || null);
//     }

//     if (cardData.phone_number !== undefined) {
//       updates.push(`phone_number = $${paramIndex++}`);
//       values.push(cardData.phone_number || null);
//     }

//     if (cardData.registration_date !== undefined) {
//       updates.push(`registration_date = $${paramIndex++}`);
//       values.push(cardData.registration_date || null);
//     }

//     if (cardData.type !== undefined) {
//       updates.push(`type = $${paramIndex++}`);
//       values.push(cardData.type || null);
//     }

//     if (cardData.renewal !== undefined) {
//       updates.push(`renewal = $${paramIndex++}`);
//       values.push(cardData.renewal || null);
//     }

//     if (cardData.subscription_id !== undefined) {
//       updates.push(`subscription_id = $${paramIndex++}`);
//       values.push(cardData.subscription_id || null);
//     }

//     if (updates.length === 0) {
//       // No fields to update
//       return await findById(id);
//     }

//     updates.push(`lastmodifieddate = CURRENT_TIMESTAMP`);
//     updates.push(`lastmodifiedbyid = $${paramIndex++}`);
//     values.push(userId || null);

//     values.push(id); // For WHERE clause

//     const query = `UPDATE ${schema}.library_members 
//                    SET ${updates.join(', ')}
//                    WHERE id = $${paramIndex} 
//                    RETURNING *`;
//     const result = await sql.query(query, values);
//     if (result.rows.length > 0) {
//       return result.rows[0];
//     }
//     return null;
//   } catch (error) {
//     console.error("Error in updateById:", error);
//     throw error;
//   }
// }

// // Delete library card by ID
// async function deleteById(id) {
//   try {
//     const query = `DELETE FROM ${schema}.library_members WHERE id = $1 RETURNING *`;
//     const result = await sql.query(query, [id]);
//     if (result.rows.length > 0) {
//       return { success: true, message: "Library card deleted successfully" };
//     }
//     return { success: false, message: "Library card not found" };
//   } catch (error) {
//     console.error("Error in deleteById:", error);
//     throw error;
//   }
// }

// module.exports = {
//   init,
//   findAll,
//   findById,
//   findByCardNumber,
//   findByUserId,
//   findByStudentId, // For backward compatibility
//   generateCardNumber,
//   create,
//   updateById,
//   deleteById,
// };


/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 */
const sql = require("./db.js");
let schema = "";

function init(schema_name) {
  schema = schema_name;
}
async function generateCardNumber(userId) {
  try {
    return await getNextAutoNumber(
      "library_members",
      {
        prefix: "LIB-",
        digit_count: 6,
        next_number: "1",
      },
      userId
    );

  } catch (error) {
    console.error("Error generating auto-config card number, using fallback:", error);

    const prefix = "LIB";
    const year = new Date().getFullYear();

    const query = `
      SELECT COUNT(*) AS count
      FROM ${schema}.library_members
      WHERE card_number LIKE $1
    `;

    const result = await sql.query(query, [`${prefix}${year}%`]);

    const count = parseInt(result.rows[0]?.count || 0) + 1;

    return `${prefix}${year}${String(count).padStart(6, "0")}`;
  }
}

// -------------------------------------------
// FIND ALL
// -------------------------------------------
async function findAll() {
  try {
    const query = `
      SELECT 
        lc.*,
        u.firstname || ' ' || u.lastname AS user_name,
        u.email AS user_email
      FROM ${schema}.library_members lc
      LEFT JOIN ${schema}."user" u 
        ON lc.createdbyid = u.id
      ORDER BY lc.createddate DESC
    `;
    const result = await sql.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}

// -------------------------------------------
// FIND BY ID
// -------------------------------------------
async function findById(id) {
  try {
    const query = `
      SELECT 
        lc.*,
        u.firstname || ' ' || u.lastname AS user_name,
        u.email AS user_email
      FROM ${schema}.library_members lc
      LEFT JOIN ${schema}."user" u 
        ON lc.createdbyid = u.id
      WHERE lc.id = $1
    `;
    const result = await sql.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error in findById:", error);
    throw error;
  }
}

// -------------------------------------------
// FIND BY CARD NUMBER
// -------------------------------------------
async function findByCardNumber(cardNumber) {
  try {
    const query = `
      SELECT 
        lc.*,
        u.firstname || ' ' || u.lastname AS user_name,
        u.email AS user_email
      FROM ${schema}.library_members lc
      LEFT JOIN ${schema}."user" u 
        ON lc.createdbyid = u.id
      WHERE lc.card_number = $1
    `;
    const result = await sql.query(query, [cardNumber]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error in findByCardNumber:", error);
    throw error;
  }
}

// -------------------------------------------
// CREATE
// -------------------------------------------
async function create(cardData, userId) {
  try {
    const query = `
      INSERT INTO ${schema}.library_members
      (card_number, is_active, image, renewal, subscription_id,
       first_name, last_name, name, email, phone_number, 
       registration_date, type,
       createddate, lastmodifieddate, createdbyid, lastmodifiedbyid)
      VALUES 
      ($1, $2, $3, $4, $5, 
       $6, $7, $8, $9, $10,
       $11, $12,
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $13, $13)
      RETURNING *
    `;

    const values = [
      cardData.card_number,
      cardData.is_active ?? true,
      cardData.image || null,
      cardData.renewal || null,
      cardData.subscription_id || null,
      cardData.first_name || null,
      cardData.last_name || null,
      cardData.name || null,
      cardData.email || null,
      cardData.phone_number || null,
      cardData.registration_date || null,
      cardData.type || null,
      userId,
    ];

    const result = await sql.query(query, values);
    return result.rows[0] || null;

  } catch (error) {
    console.error("Error in create:", error);
    throw error;
  }
}

// -------------------------------------------
// UPDATE
// -------------------------------------------
async function updateById(id, cardData, userId) {
  try {
    const updates = [];
    const values = [];
    let idx = 1;

    const fields = [
      "card_number",
      "is_active",
      "image",
      "renewal",
      "subscription_id",
      "first_name",
      "last_name",
      "name",
      "email",
      "phone_number",
      "registration_date",
      "type"
    ];

    fields.forEach(f => {
      if (cardData[f] !== undefined) {
        updates.push(`${f} = $${idx}`);
        values.push(cardData[f]);
        idx++;
      }
    });

    updates.push(`lastmodifieddate = CURRENT_TIMESTAMP`);
    updates.push(`lastmodifiedbyid = $${idx}`);
    values.push(userId);
    idx++;

    values.push(id);

    const query = `
      UPDATE ${schema}.library_members
      SET ${updates.join(", ")}
      WHERE id = $${idx}
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;

  } catch (error) {
    console.error("Error in updateById:", error);
    throw error;
  }
}

// -------------------------------------------
// DELETE
// -------------------------------------------
async function deleteById(id) {
  try {
    const query = `DELETE FROM ${schema}.library_members WHERE id = $1 RETURNING *`;
    const result = await sql.query(query, [id]);

    if (result.rows.length) {
      return { success: true, message: "Library member deleted successfully" };
    }
    return { success: false, message: "Record not found" };

  } catch (error) {
    console.error("Error in deleteById:", error);
    throw error;
  }
}

module.exports = {
  init,
  generateCardNumber,
  findAll,
  findById,
  findByCardNumber,
  create,
  updateById,
  deleteById,
};


