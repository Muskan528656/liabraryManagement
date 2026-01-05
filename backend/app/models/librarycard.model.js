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
      LEFT JOIN demo.object_type ot
        ON lm.type_id = ot.id
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
        ON lm.type_id = ot.id
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
        ON lm.subscription_id = p.id
      LEFT JOIN ${schema}.object_type ot
        ON lm.type_id = ot.id
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
  console.log(" Creating library member with data:", cardData);
  /* ================= CARD NUMBER ================= */

  if (!cardData.card_number) {
    cardData.card_number = await generateAutoNumberSafe(
      "library_members",
      userId,
      "LIB-",
      5
    );

    if (!cardData.card_number) {
      throw new Error("Failed to generate unique card number");
    }
  }

  /* ================= RESOLVE TYPE ================= */

  if (cardData.type) {
    const isUUID =
      typeof cardData.type === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        cardData.type
      );

    if (isUUID) {
      cardData.type_id = cardData.type;
    } else {
      const resolvedTypeId = await resolveTypeId(cardData.type);

      if (!resolvedTypeId) {
        throw new Error(`Invalid or inactive type: ${cardData.type}`);
      }

      cardData.type_id = resolvedTypeId;
    }
  }

  try {
    /* ================= FIELDS ================= */

    const fields = [
      "card_number",
      "is_active",
      "image",
      "subscription_id",

      "first_name",
      "last_name",
      "name",
      "father_gurdian_name",
      "parent_contact",
      "dob",

      "email",
      "phone_number",
      "country_code",

      "registration_date",
      "plan_id",
      "type_id",
      "createddate",
      "lastmodifieddate",
      "createdbyid",
      "lastmodifiedbyid",
    ];

    const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ");

    const query = `
      INSERT INTO ${schema}.library_members
      (${fields.join(", ")})
      VALUES (${placeholders})
      RETURNING *
    `;

    /* ================= VALUES ================= */

    const imageValue = cardData.hasOwnProperty("image")
      ? cardData.image || null
      : null;

    const isActive =
      cardData.is_active !== undefined
        ? cardData.is_active
        : cardData.status === true || cardData.status === "true";

    const fullName = `${cardData.first_name || ""} ${
      cardData.last_name || ""
    }`.trim();

    const values = [
      cardData.card_number,
      isActive,
      imageValue,
      cardData.subscription_id || null,

      cardData.first_name || null,
      cardData.last_name || null,
      fullName || null,

      cardData.father_gurdian_name || null,
      cardData.parent_contact || null,
      cardData.dob || null,

      cardData.email || null,
      cardData.phone_number || null,
      cardData.country_code || null,
      cardData.registration_date || null,
      cardData.plan_id || null,
      cardData.type_id || null,
      new Date(),
      new Date(),
      userId,
      userId,
    ];

    console.log("📋 Inserting library member:", {
      card_number: values[0],
      is_active: values[1],
      father_gurdian_name: values[7],
      parent_contact: values[8],
      dob: values[9],
      createdbyid: values[values.length - 2],
    });

    const result = await sql.query(query, values);

    /* ================= RETURN FULL RECORD ================= */

    const completeRecord = await findById(result.rows[0].id);
    return completeRecord;
  } catch (error) {
    console.error("❌ Error in create:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
    });
    throw error;
  }
}
async function updateById(id, cardData, userId) {
  try {
    const updates = [];
    const values = [];
    let idx = 1;

    if (cardData.is_active !== undefined) {
      updates.push("is_active = $" + idx);
      values.push(cardData.is_active);
      idx++;
    }

    if (cardData.type !== undefined) {
      let typeValue = cardData.type;

      if (!isNaN(typeValue) && typeValue !== null && typeValue !== "") {
        typeValue = parseInt(typeValue);
      }

      updates.push("type_id = $" + idx);
      values.push(typeValue);
      idx++;
    }

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
      "country_code",
      "dob",
      "father_gurdian_name",
      "parent_contact",
    ];

    allowedFields.forEach((field) => {
      if (cardData[field] !== undefined) {
        if (field === "name") {
          if (!cardData[field] && cardData.first_name && cardData.last_name) {
            updates.push(`name = $${idx}`);
            values.push(`${cardData.first_name} ${cardData.last_name}`);
            idx++;
          } else if (cardData[field]) {
            updates.push(`name = $${idx}`);
            values.push(cardData[field]);
            idx++;
          }
        } else if (field === "dob" || field === "registration_date") {
          if (cardData[field]) {
            updates.push(`${field} = $${idx}`);
            const dateValue = new Date(cardData[field]);
            values.push(dateValue);
            idx++;
          } else if (cardData[field] === null || cardData[field] === "") {
            updates.push(`${field} = $${idx}`);
            values.push(null);
            idx++;
          }
        } else if (field !== "name") {
          updates.push(`${field} = $${idx}`);
          values.push(cardData[field]);
          idx++;
        }
      }
    });

    updates.push("lastmodifieddate = CURRENT_TIMESTAMP");
    updates.push(`lastmodifiedbyid = $${idx}`);
    values.push(userId);
    idx++;

    if (updates.length === 0) {
      return await findById(id);
    }

    values.push(id);

    const query = `
      UPDATE ${schema}.library_members
      SET ${updates.join(", ")}
      WHERE id = $${idx}
      RETURNING *
    `;

    const result = await sql.query(query, values);

    if (result.rows.length === 0) {
      throw new Error("Record not found");
    }

    const updatedRecord = await findById(id);

    return updatedRecord;
  } catch (error) {
    console.error("❌ Error in updateById:", error);
    throw error;
  }
}

async function resolveTypeId(typeInput) {
  try {
    if (!typeInput) return null;

    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        typeInput
      )
    ) {
      return typeInput;
    }

    const queryById = `
      SELECT id FROM ${schema}.library_member_types 
      WHERE id::text = $1 OR code = $1 OR LOWER(name) = LOWER($1)
    `;

    const resultById = await sql.query(queryById, [typeInput.toString()]);

    if (resultById.rows.length > 0) {
      return resultById.rows[0].id;
    }

    const queryByName = `
      SELECT id FROM ${schema}.library_member_types 
      WHERE LOWER(name) = LOWER($1) OR LOWER(code) = LOWER($1)
    `;

    const resultByName = await sql.query(queryByName, [
      typeInput.toString().toLowerCase(),
    ]);

    if (resultByName.rows.length > 0) {
      return resultByName.rows[0].id;
    }

    console.warn(`❌ Could not resolve type ID for: ${typeInput}`);
    return null;
  } catch (error) {
    console.error("Error resolving type ID:", error);
    return null;
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
        data: result.rows[0],
      };
    }

    return {
      success: false,
      message: "Record not found",
    };
  } catch (error) {
    console.error("Error in deleteById:", error);

    if (error.code === "23503") {
      // foreign_key_violation
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
  search,
};
