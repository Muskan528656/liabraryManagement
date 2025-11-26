/**
 * @author     
 * @date        DEC, 2025
 */

const sql = require("./db.js");
let schema = "";

/* ------------------------------------------------------
   INIT SCHEMA
------------------------------------------------------ */
function init(schema_name) {
  schema = schema_name;
  if (!schema) throw new Error("Schema initialization failed.");
}

/* ------------------------------------------------------
   FIND ALL ACTIVE SETTINGS
------------------------------------------------------ */
async function findAll() {
  if (!schema) throw new Error("Schema not initialized.");

  const query = `
      SELECT * 
      FROM ${schema}.library_setting
      WHERE is_active = TRUE
      ORDER BY createddate DESC
    `;

  const result = await sql.query(query);
  return result.rows || [];
}

/* ------------------------------------------------------
   GET ACTIVE SETTING (LATEST)
------------------------------------------------------ */
async function getActiveSetting() {
  if (!schema) throw new Error("Schema not initialized.");

  const query = `
      SELECT *
      FROM ${schema}.library_setting
      WHERE is_active = TRUE
      ORDER BY createddate DESC
      LIMIT 1
    `;

  const result = await sql.query(query);
  return result.rows.length ? result.rows[0] : null;
}

/* ------------------------------------------------------
   GET SETTINGS IN KEY–VALUE FORMAT
------------------------------------------------------ */
async function getAllSettings() {
  if (!schema) throw new Error("Schema not initialized.");

  const row = await getActiveSetting();

  if (!row) {
    return {
      max_books_per_card: 1,
      duration_days: 15,
      fine_per_day: 10,
      renew_limit: 2,
      reservation_limit: 3,
      membership_validity_days: 365,
      issue_permission: true,
      return_permission: true,
      issue_approval_required: false,
      digital_access: false,
      lost_book_fine_percentage: 100,
      max_issue_per_day: 1,
    };
  }

  return {
    max_books_per_card: row.max_books,
    duration_days: row.max_days,
    fine_per_day: parseFloat(row.fine_per_day),
    renew_limit: row.renewal_limit,
    reservation_limit: row.reservation_limit,
    membership_validity_days: row.membership_validity_days,
    issue_permission: row.issue_permission,
    return_permission: row.return_permission,
    issue_approval_required: row.issue_approval_required,
    digital_access: row.digital_access,
    lost_book_fine_percentage: 100,
    max_issue_per_day: 1,
  };
}

/* ------------------------------------------------------
   FIND BY ID
------------------------------------------------------ */
async function findById(id) {
  if (!schema) throw new Error("Schema not initialized.");

  const result = await sql.query(
    `SELECT * FROM ${schema}.library_setting WHERE id = $1`,
    [id]
  );

  return result.rows.length ? result.rows[0] : null;
}

/* ------------------------------------------------------
   CREATE NEW SETTING
------------------------------------------------------ */
async function create(data, userId) {
  if (!schema) throw new Error("Schema not initialized.");

  const query = `
      INSERT INTO ${schema}.library_setting
      (name, price, max_books, max_days, renewal_limit, fine_per_day, 
       reservation_limit, membership_validity_days, issue_permission, 
       return_permission, issue_approval_required, digital_access,
       description, is_active, company_id,
       createddate, lastmodifieddate, createdbyid, lastmodifiedbyid)
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
       $14,$15, NOW(),NOW(),$16,$16)
      RETURNING *
    `;

  const params = [
    data.name || "Default",
    data.price || 0,
    data.max_books || 1,
    data.max_days || 15,
    data.renewal_limit || 2,
    data.fine_per_day || 10,
    data.reservation_limit || 3,
    data.membership_validity_days || 365,
    data.issue_permission ?? true,
    data.return_permission ?? true,
    data.issue_approval_required ?? false,
    data.digital_access ?? false,
    data.description || null,
    data.is_active ?? true,
    data.company_id || null,
    userId || null,
  ];

  const result = await sql.query(query, params);
  return result.rows[0];
}

/* ------------------------------------------------------
   UPDATE BY ID
------------------------------------------------------ */
async function updateById(id, data, userId) {
  if (!schema) throw new Error("Schema not initialized.");

  const query = `
      UPDATE ${schema}.library_setting
      SET name = COALESCE($2, name),
          price = COALESCE($3, price),
          max_books = COALESCE($4, max_books),
          max_days = COALESCE($5, max_days),
          renewal_limit = COALESCE($6, renewal_limit),
          fine_per_day = COALESCE($7, fine_per_day),
          reservation_limit = COALESCE($8, reservation_limit),
          membership_validity_days = COALESCE($9, membership_validity_days),
          is_active = COALESCE($10, is_active),
          lastmodifieddate = NOW(),
          lastmodifiedbyid = $11
      WHERE id = $1
      RETURNING *
    `;

  const params = [
    id,
    data.name,
    data.price,
    data.max_books,
    data.max_days,
    data.renewal_limit,
    data.fine_per_day,
    data.reservation_limit,
    data.membership_validity_days,
    data.is_active,
    userId || null,
  ];

  const result = await sql.query(query, params);
  return result.rows[0];
}


/* ------------------------------------------------------
   CREATE OR UPDATE ACTIVE SETTINGS
------------------------------------------------------ */
async function updateSettings(data, userId) {
  if (!schema) throw new Error("Schema not initialized.");

  const existing = await getActiveSetting();
  if (existing) {
    return await updateById(existing.id, data, userId);
  }
  return await create(data, userId);
}

/* ------------------------------------------------------
   DELETE BY ID
------------------------------------------------------ */
async function deleteById(id) {
  if (!schema) throw new Error("Schema not initialized.");

  const result = await sql.query(
    `DELETE FROM ${schema}.library_setting WHERE id = $1 RETURNING *`,
    [id]
  );

  if (!result.rows.length) {
    return { success: false, message: "Setting not found" };
  }

  return { success: true, message: "Setting deleted successfully" };
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
