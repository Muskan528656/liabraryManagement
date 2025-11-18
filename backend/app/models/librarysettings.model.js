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

// Find all library settings
async function findAll() {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT * FROM ${schema}.library_setting WHERE is_active = true ORDER BY createddate DESC`;
    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}

// Get active library setting (single record)
async function getActiveSetting() {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT * FROM ${schema}.library_setting WHERE is_active = true ORDER BY createddate DESC LIMIT 1`;
    const result = await sql.query(query);
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error("Error in getActiveSetting:", error);
    throw error;
  }
}

// Get all settings as key-value pairs (for backward compatibility)
async function getAllSettings() {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const setting = await getActiveSetting();
    if (!setting) {
      // Return default values if no setting exists
      return {
        max_books_per_card: 1,
        duration_days: 15,
        fine_per_day: 10,
        renew_limit: 2,
        max_issue_per_day: 1,
        lost_book_fine_percentage: 100
      };
    }

    // Map database columns to expected key names
    return {
      max_books_per_card: setting.max_books || 1,
      duration_days: setting.max_days || 15,
      fine_per_day: parseFloat(setting.fine_per_day || 10),
      renew_limit: setting.renewal_limit || 2,
      max_issue_per_day: 1, // Default, can be added to table later
      lost_book_fine_percentage: 100, // Default, can be added to table later
      // Additional fields
      reservation_limit: setting.reservation_limit || 3,
      membership_validity_days: setting.membership_validity_days || 365,
      issue_permission: setting.issue_permission !== undefined ? setting.issue_permission : true,
      return_permission: setting.return_permission !== undefined ? setting.return_permission : true,
      issue_approval_required: setting.issue_approval_required !== undefined ? setting.issue_approval_required : false,
      digital_access: setting.digital_access !== undefined ? setting.digital_access : false
    };
  } catch (error) {
    console.error("Error in getAllSettings:", error);
    throw error;
  }
}

// Find setting by ID
async function findById(id) {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT * FROM ${schema}.library_setting WHERE id = $1`;
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

// Create a new setting
async function create(settingData, userId) {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `INSERT INTO ${schema}.library_setting 
                   (name, price, max_books, max_days, renewal_limit, fine_per_day, 
                    reservation_limit, membership_validity_days, issue_permission, 
                    return_permission, issue_approval_required, digital_access, 
                    description, is_active, company_id, createddate, lastmodifieddate, 
                    createdbyid, lastmodifiedbyid) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 
                           NOW(), NOW(), $16, $16) 
                   RETURNING *`;
    const result = await sql.query(query, [
      settingData.name || 'Default',
      settingData.price || 0,
      settingData.max_books || 1,
      settingData.max_days || 15,
      settingData.renewal_limit || 2,
      settingData.fine_per_day || 10,
      settingData.reservation_limit || 3,
      settingData.membership_validity_days || 365,
      settingData.issue_permission !== undefined ? settingData.issue_permission : true,
      settingData.return_permission !== undefined ? settingData.return_permission : true,
      settingData.issue_approval_required !== undefined ? settingData.issue_approval_required : false,
      settingData.digital_access !== undefined ? settingData.digital_access : false,
      settingData.description || null,
      settingData.is_active !== undefined ? settingData.is_active : true,
      settingData.company_id || null,
      userId || null,
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("Error in create:", error);
    throw error;
  }
}

// Update a setting
async function updateById(id, settingData, userId) {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `UPDATE ${schema}.library_setting 
                   SET name = COALESCE($2, name),
                       price = COALESCE($3, price),
                       max_books = COALESCE($4, max_books),
                       max_days = COALESCE($5, max_days),
                       renewal_limit = COALESCE($6, renewal_limit),
                       fine_per_day = COALESCE($7, fine_per_day),
                       reservation_limit = COALESCE($8, reservation_limit),
                       membership_validity_days = COALESCE($9, membership_validity_days),
                       issue_permission = COALESCE($10, issue_permission),
                       return_permission = COALESCE($11, return_permission),
                       issue_approval_required = COALESCE($12, issue_approval_required),
                       digital_access = COALESCE($13, digital_access),
                       description = COALESCE($14, description),
                       is_active = COALESCE($15, is_active),
                       lastmodifieddate = NOW(),
                       lastmodifiedbyid = $16
                   WHERE id = $1 
                   RETURNING *`;
    const result = await sql.query(query, [
      id,
      settingData.name,
      settingData.price,
      settingData.max_books,
      settingData.max_days,
      settingData.renewal_limit,
      settingData.fine_per_day,
      settingData.reservation_limit,
      settingData.membership_validity_days,
      settingData.issue_permission,
      settingData.return_permission,
      settingData.issue_approval_required,
      settingData.digital_access,
      settingData.description,
      settingData.is_active,
      userId || null,
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("Error in updateById:", error);
    throw error;
  }
}

// Update settings (creates or updates active setting)
async function updateSettings(settingData, userId) {
  const client = await sql.connect();
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    await client.query("BEGIN");

    // Get active setting
    const activeSetting = await getActiveSetting();

    let result;
    if (activeSetting) {
      result = await updateById(activeSetting.id, settingData, userId);
    } else {
      result = await create(settingData, userId);
    }

    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in updateSettings:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Delete setting by ID
async function deleteById(id) {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `DELETE FROM ${schema}.library_setting WHERE id = $1 RETURNING *`;
    const result = await sql.query(query, [id]);
    if (result.rows.length > 0) {
      return { success: true, message: "Setting deleted successfully" };
    }
    return { success: false, message: "Setting not found" };
  } catch (error) {
    console.error("Error in deleteById:", error);
    throw error;
  }
}

module.exports = {
  init,
  findAll,
  getActiveSetting,
  getAllSettings,
  findById,
  create,
  updateById,
  updateSettings,
  deleteById,
};

