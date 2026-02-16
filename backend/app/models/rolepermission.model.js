const sql = require("./db.js");

/**
 * Get all role-permission mappings
 */
async function findAll() {
  const query = `
    SELECT *
    FROM ${schema}.role_permissions
    ORDER BY id DESC
  `;
  const result = await sql.query(query);
  return result.rows || [];
}

/**
 * Get mapping by id
 */
async function findById(id) {
  const query = `
    SELECT *
    FROM ${schema}.role_permissions
    WHERE id = $1
  `;
  const result = await sql.query(query, [id]);
  return result.rows[0] || null;
}

/**
 * Get mapping by role + permission
 * (duplicate prevent)
 */
async function findByRoleAndPermission(roleId, permissionId) {
  const query = `
    SELECT *
    FROM ${schema}.role_permissions
    WHERE role_id = $1
      AND permission_id = $2
  `;
  const result = await sql.query(query, [roleId, permissionId]);
  return result.rows[0] || null;
}

/**
 * Create role-permission mapping
 */
async function create(data) {
  if (!data.role_id || !data.permission_id) {
    throw new Error("role_id and permission_id are required");
  }

  // 🔹 Prevent duplicate mapping
  const existing = await findByRoleAndPermission(
    data.role_id,
    data.permission_id
  );

  if (existing) {
    return existing;
  }

  const query = `
    INSERT INTO ${schema}.role_permissions
    (
      role_id,
      permission_id
    )
    VALUES ($1, $2)
    RETURNING *
  `;

  const values = [
    data.role_id,
    data.permission_id
  ];

  const result = await sql.query(query, values);
  return result.rows[0] || null;
}

/**
 * Update mapping
 */
async function updateById(id, data) {
  const current = await findById(id);
  if (!current) {
    throw new Error("Role permission not found");
  }

  const query = `
    UPDATE ${schema}.role_permissions
    SET
      role_id = $2,
      permission_id = $3
    WHERE id = $1
    RETURNING *
  `;

  const values = [
    id,
    data.role_id ?? current.role_id,
    data.permission_id ?? current.permission_id
  ];

  const result = await sql.query(query, values);
  return result.rows[0] || null;
}

/**
 * Delete mapping
 */
async function deleteById(id) {
  const query = `
    DELETE FROM ${schema}.role_permissions
    WHERE id = $1
    RETURNING *
  `;

  const result = await sql.query(query, [id]);

  return result.rows.length
    ? { success: true, message: "Role permission deleted successfully" }
    : { success: false, message: "Role permission not found" };
}

module.exports = {
  findAll,
  findById,
  create,
  updateById,
  deleteById
};
