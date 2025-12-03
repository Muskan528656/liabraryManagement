
/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 */
const sql = require("./db.js");
let schema = "";
const { generateAutoNumberSafe } = require("../utils/autoNumber.helper.js");
function init(schema_name) {
  schema = schema_name;
}


 
 
 
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



 
 
 
 
 
 
 
 
 
async function create(cardData, userId) {
  console.log("cardData:", cardData);

  if (!cardData.card_number) {
    cardData.card_number = await generateAutoNumberSafe('library_members', userId, 'LIB-', 5);


    if (!cardData.card_number) {
      throw new Error("Failed to generate unique card number");
    }
  }



  try {
    const query = `
      INSERT INTO ${schema}.library_members
      (card_number,is_active, image, subscription_id,
       first_name, last_name, name, email, phone_number, country_code,
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
      cardData.subscription_id || null,
      cardData.first_name || null,
      cardData.last_name || null,
      cardData.name || null,
      cardData.email || null,
      cardData.phone_number || null,
      cardData.country_code || null,
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
      "country_code",
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

async function findByStudentId(studentId) {
  return findByUserId(studentId);
}

async function findByUserId(userId) {
  try {
    const query = `SELECT
                    lc.*,
                    u.firstname || ' ' || u.lastname AS user_name,
                    u.email AS user_email
                   FROM ${schema}.library_members lc
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

module.exports = {
  init,
  findByStudentId,
  findByUserId,
  findAll,
  findById,
  findByCardNumber,
  create,
  updateById,
  deleteById,
};


