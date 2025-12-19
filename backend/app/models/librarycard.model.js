
/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 */
const sql = require("./db.js");
let schema = "";
const { generateAutoNumberSafe } = require("../utils/autoNumber.helper.js");
const ObjectType = require("./objecttype.model.js");
function init(schema_name) {
  schema = schema_name;
}

async function findAll() {
  try {
    const query = `
     SELECT
        lc.*,
        u.firstname || ' ' || u.lastname AS user_name,
        u.email AS user_email,
        p.plan_name,
        p.duration_days,
        ot.label AS type
    FROM ${schema}.library_members lc
    LEFT JOIN ${schema}."user" u
        ON lc.createdbyid = u.id
    LEFT JOIN ${schema}.plan p
        ON lc.plan_id = p.id
    LEFT JOIN ${schema}.object_type ot
        ON lc.type_id = ot.id -- Library_members ki type_id ko object_type ki id se join kiya
    ORDER BY lc.createddate DESC;

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
        u.email AS user_email,
        p.plan_name,
        p.duration_days
      FROM ${schema}.library_members lc
      LEFT JOIN ${schema}."user" u
        ON lc.createdbyid = u.id
      LEFT JOIN ${schema}.plan p
        ON lc.plan_id = p.id
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
        u.email AS user_email,
        p.plan_name,
        p.duration_days
      FROM ${schema}.library_members lc
      LEFT JOIN ${schema}."user" u
        ON lc.createdbyid = u.id
      LEFT JOIN ${schema}.plan p
        ON lc.plan_id = p.id
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
  console.log("📥 Model.create() - Received cardData:", {
    ...cardData,
    image: cardData.image ? `${typeof cardData.image} - ${cardData.image.substring(0, 50)}...` : 'null/undefined'
  });


  console.log("🔍 Image field check:", {
    hasImage: 'image' in cardData,
    imageValue: cardData.image,
    imageType: typeof cardData.image,
    imageLength: cardData.image ? cardData.image.length : 0,
    imageFirst100: cardData.image ? cardData.image.substring(0, 100) : 'N/A'
  });


  if (!cardData.card_number) {
    cardData.card_number = await generateAutoNumberSafe('library_members', userId, 'LIB-', 5);
    if (!cardData.card_number) {
      throw new Error("Failed to generate unique card number");
    }
  }

  // Resolve type_id from object_type table if type is provided as string, or use type_id directly
  if (cardData.type_id) {
    // type_id is provided directly, use it
  } else if (cardData.type) {
    try {
      const objectTypes = await ObjectType.getAllRecords();
      const typeRecord = objectTypes.find(ot => ot.name.toLowerCase() === cardData.type.toLowerCase());
      if (typeRecord) {
        cardData.type_id = typeRecord.id;
      } else {
        // If type is a number (id), use it directly
        const typeId = parseInt(cardData.type);
        if (!isNaN(typeId)) {
          cardData.type_id = typeId;
        } else {
          throw new Error(`Invalid type: ${cardData.type}. Must be a valid type name or id.`);
        }
      }
    } catch (error) {
      console.error("Error resolving type_id:", error);
      throw error;
    }
  }

  try {
    const query = `
      INSERT INTO ${schema}.library_members
      (card_number, is_active, image, subscription_id,
       first_name, last_name, name, email, phone_number,
       registration_date, type_id,
       createddate, lastmodifieddate, createdbyid, lastmodifiedbyid)
      VALUES
      ($1, $2, $3, $4, $5,
       $6, $7, $8, $9, $10,
       $11,
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $12, $12)
      RETURNING *
    `;


    const imageValue = cardData.hasOwnProperty('image')
      ? (cardData.image || null)
      : null;

    console.log("💾 Database insert values - Image:", {
      rawValue: cardData.image,
      finalValue: imageValue,
      isNull: imageValue === null,
      isUndefined: imageValue === undefined
    });

    const values = [
      cardData.card_number,
      cardData.is_active ?? true,
      imageValue, // Use the fixed image value
      cardData.subscription_id || null,
      // cardData.plan_id || null,
      cardData.first_name || null,
      cardData.last_name || null,
      cardData.name || null,
      cardData.email || null,
      cardData.phone_number || null,
      cardData.registration_date || null,
      cardData.type_id || null,
      userId,
    ];


    console.log("📋 All insert values:", {
      card_number: values[0],
      is_active: values[1],
      image: values[2],
      subscription_id: values[3],
      // plan_id: values[4],
      first_name: values[5],
      last_name: values[6],
      name: values[7],
      email: values[8],
      phone_number: values[9],
      registration_date: values[10],
      type_id: values[11],
      userId: values[12]
    });

    const result = await sql.query(query, values);



    return result.rows[0] || null;

  } catch (error) {
    console.error("❌ Error in create:", error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
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
      "registration_date",
      "type_id",
      "country_code"
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
    console.log("cardDatacardData", cardData)
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

