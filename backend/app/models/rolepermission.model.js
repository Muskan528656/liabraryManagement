/**
 * Role Permission Model
 * Handles CRUD permissions for different roles and modules
 * 
 * @author Library Management Team
 * @date Jan, 2025
 */

const sql = require("./db.js");

const RolePermission = {
  // Note: role_permissions table is in public schema, not tenant-specific
  init: function (schema_name) {
  
  },

  // Get all permissions for a role
  getByRole: async function (role) {
    try {
      const result = await sql.query(
        `SELECT * FROM public.role_permissions 
         WHERE role = $1 
         ORDER BY module_name ASC`,
        [role]
      );
      return result.rows;
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      throw error;
    }
  },

  // Get permission for a specific role and module
  getByRoleAndModule: async function (role, moduleName) {
    try {
      const result = await sql.query(
        `SELECT * FROM public.role_permissions 
         WHERE role = $1 AND module_name = $2`,
        [role, moduleName]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error("Error fetching role permission:", error);
      throw error;
    }
  },

  // Get all permissions (for admin to manage)
  getAll: async function () {
    try {
      const result = await sql.query(
        `SELECT * FROM public.role_permissions 
         ORDER BY role, module_name ASC`
      );
      return result.rows;
    } catch (error) {
      console.error("Error fetching all permissions:", error);
      throw error;
    }
  },

  // Create or update permission
  upsert: async function (permission) {
    const { role, module_name, can_create, can_read, can_update, can_delete } = permission;

    try {
      const result = await sql.query(
        `INSERT INTO public.role_permissions 
         (role, module_name, can_create, can_read, can_update, can_delete, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (role, module_name) 
         DO UPDATE SET 
           can_create = EXCLUDED.can_create,
           can_read = EXCLUDED.can_read,
           can_update = EXCLUDED.can_update,
           can_delete = EXCLUDED.can_delete,
           updated_at = NOW()
         RETURNING *`,
        [role, module_name, can_create || false, can_read || false, can_update || false, can_delete || false]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error upserting role permission:", error);
      throw error;
    }
  },

  // Update permission
  update: async function (id, permission) {
    const { can_create, can_read, can_update, can_delete } = permission;

    try {
      const result = await sql.query(
        `UPDATE public.role_permissions 
         SET can_create = $1, can_read = $2, can_update = $3, can_delete = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [can_create || false, can_read || false, can_update || false, can_delete || false, id]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error("Error updating role permission:", error);
      throw error;
    }
  },

  // Delete permission
  delete: async function (id) {
    try {
      const result = await sql.query(
        `DELETE FROM public.role_permissions 
         WHERE id = $1
         RETURNING *`,
        [id]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error("Error deleting role permission:", error);
      throw error;
    }
  },

  // Bulk update permissions for a role
  bulkUpdate: async function (role, permissions) {
    // const client = await sql.connect();
    try {
      // await client.query("BEGIN");

      for (const perm of permissions) {
        await sql.query(
          `INSERT INTO public.role_permissions 
           (role, module_name, can_create, can_read, can_update, can_delete, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (role, module_name) 
           DO UPDATE SET 
             can_create = EXCLUDED.can_create,
             can_read = EXCLUDED.can_read,
             can_update = EXCLUDED.can_update,
             can_delete = EXCLUDED.can_delete,
             updated_at = NOW()`,
          [
            role,
            perm.module_name,
            perm.can_create || false,
            perm.can_read || false,
            perm.can_update || false,
            perm.can_delete || false
          ]
        );
      }

      return { success: true };
    } catch (error) {
      console.error("Error bulk updating permissions:", error);
      throw error;
    } finally {
    }
  }
};

module.exports = RolePermission;

