/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */
const sql = require("./db.js");
let schema = "";

function init(schema_name) {
  schema = schema_name;
}

// Find all library cards
async function findAll() {
  try {
    const query = `SELECT 
                    lc.*,
                    u.firstname || ' ' || u.lastname AS user_name,
                    u.email AS user_email
                   FROM ${schema}.id_cards lc
                   LEFT JOIN ${schema}."user" u ON lc.user_id = u.id
                   ORDER BY lc.createddate DESC`;
    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}

// Find library card by ID
async function findById(id) {
  try {
    const query = `SELECT 
                    lc.*,
                    u.firstname || ' ' || u.lastname AS user_name,
                    u.email AS user_email
                   FROM ${schema}.id_cards lc
                   LEFT JOIN ${schema}."user" u ON lc.user_id = u.id
                   WHERE lc.id = $1`;
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

// Find library card by card number
async function findByCardNumber(cardNumber) {
  try {
    const query = `SELECT 
                    lc.*,
                    u.firstname || ' ' || u.lastname AS user_name,
                    u.email AS user_email
                   FROM ${schema}.id_cards lc
                   LEFT JOIN ${schema}."user" u ON lc.user_id = u.id
                   WHERE lc.card_number = $1`;
    const result = await sql.query(query, [cardNumber]);
    console.log("findByCardNumber result:", result.rows);
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error("Error in findByCardNumber:", error);
    throw error;
  }
}

// Find library card by user ID
async function findByUserId(userId) {
  try {
    const query = `SELECT 
                    lc.*,
                    u.firstname || ' ' || u.lastname AS user_name,
                    u.email AS user_email
                   FROM ${schema}.id_cards lc
                   LEFT JOIN ${schema}."user" u ON lc.user_id = u.id
                   WHERE lc.user_id = $1`;
    const result = await sql.query(query, [userId]);
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error("Error in findByUserId:", error);
    throw error;
  }
}

// Find library card by student ID (for backward compatibility)
async function findByStudentId(studentId) {
  return findByUserId(studentId);
}

// Generate unique card number
async function generateCardNumber() {
  try {
    const prefix = "LIB";
    const year = new Date().getFullYear();
    const query = `SELECT COUNT(*) as count FROM ${schema}.id_cards WHERE card_number LIKE $1`;
    const result = await sql.query(query, [`${prefix}${year}%`]);
    const count = parseInt(result.rows[0]?.count || 0) + 1;
    return `${prefix}${year}${String(count).padStart(6, '0')}`;
  } catch (error) {
    console.error("Error generating card number:", error);
    throw error;
  }
}

// Create a new library card
async function create(cardData, userId) {
  try {
    // Check if user already has a card
    const user_id = cardData.user_id || cardData.userId || cardData.student_id || cardData.studentId;
    if (user_id) {
      const existingCard = await findByUserId(user_id);
      if (existingCard) {
        throw new Error("User already has a library card");
      }
    }

    // Generate card number if not provided
    let cardNumber = cardData.card_number;
    if (!cardNumber) {
      cardNumber = await generateCardNumber();
    }

    const query = `INSERT INTO ${schema}.id_cards 
                   (user_id, card_number, issue_date, expiry_date, is_active, image, createddate, lastmodifieddate, createdbyid, lastmodifiedbyid) 
                   VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $7, $7) 
                   RETURNING *`;
    const values = [
      user_id || null,
      cardNumber,
      cardData.issue_date || new Date().toISOString().split('T')[0],
      cardData.expiry_date || null,
      cardData.is_active !== undefined ? cardData.is_active : (cardData.status === 'active' ? true : false),
      cardData.image || cardData.image_url || cardData.user_image || null,
      userId || null,
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

// Update library card by ID
async function updateById(id, cardData, userId) {
  try {
    const user_id = cardData.user_id || cardData.userId || cardData.student_id || cardData.studentId;
    
    // Build dynamic query based on provided fields
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (user_id !== undefined) {
      updates.push(`user_id = $${paramIndex++}`);
      values.push(user_id);
    }
    
    if (cardData.issue_date !== undefined) {
      updates.push(`issue_date = $${paramIndex++}`);
      values.push(cardData.issue_date || null);
    }
    
    if (cardData.expiry_date !== undefined) {
      updates.push(`expiry_date = $${paramIndex++}`);
      values.push(cardData.expiry_date || null);
    }
    
    if (cardData.is_active !== undefined || cardData.status !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(cardData.is_active !== undefined ? cardData.is_active : (cardData.status === 'active' ? true : false));
    }
    
    if (cardData.image !== undefined) {
      updates.push(`image = $${paramIndex++}`);
      values.push(cardData.image || cardData.image_url || cardData.user_image || null);
    }
    
    if (updates.length === 0) {
      // No fields to update
      return await findById(id);
    }
    
    updates.push(`lastmodifieddate = CURRENT_TIMESTAMP`);
    updates.push(`lastmodifiedbyid = $${paramIndex++}`);
    values.push(userId || null);
    
    values.push(id); // For WHERE clause
    
    const query = `UPDATE ${schema}.id_cards 
                   SET ${updates.join(', ')}
                   WHERE id = $${paramIndex} 
                   RETURNING *`;
    
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

// Delete library card by ID
async function deleteById(id) {
  try {
    const query = `DELETE FROM ${schema}.id_cards WHERE id = $1 RETURNING *`;
    const result = await sql.query(query, [id]);
    if (result.rows.length > 0) {
      return { success: true, message: "Library card deleted successfully" };
    }
    return { success: false, message: "Library card not found" };
  } catch (error) {
    console.error("Error in deleteById:", error);
    throw error;
  }
}

module.exports = {
  init,
  findAll,
  findById,
  findByCardNumber,
  findByUserId,
  findByStudentId, // For backward compatibility
  generateCardNumber,
  create,
  updateById,
  deleteById,
};

