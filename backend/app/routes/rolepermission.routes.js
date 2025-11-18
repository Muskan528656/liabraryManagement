/**
 * Role Permission Routes
 * Handles all permission-related API endpoints
 * 
 * @author Library Management Team
 * @date Jan, 2025
 */

const express = require("express");
const router = express.Router();
const RolePermission = require("../models/rolepermission.model.js");
const { fetchUser, checkRole } = require("../middleware/fetchuser.js");

module.exports = (app) => {
  // Get all permissions (for admin to view/manage)
  router.get("/", fetchUser, checkRole("ADMIN", "ADMIN"), async (req, res) => {
    try {
      RolePermission.init(req.userinfo.tenantcode);
      const permissions = await RolePermission.getAll();
      
      return res.status(200).json({
        success: true,
        permissions: permissions
      });
    } catch (error) {
      console.error("Error fetching permissions:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching permissions",
        error: error.message
      });
    }
  });

  // Get permissions for a specific role
  router.get("/role/:role", fetchUser, checkRole("ADMIN", "ADMIN"), async (req, res) => {
    try {
      const { role } = req.params;
      RolePermission.init(req.userinfo.tenantcode);
      const permissions = await RolePermission.getByRole(role);
      
      return res.status(200).json({
        success: true,
        permissions: permissions
      });
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching role permissions",
        error: error.message
      });
    }
  });

  // Get permission for specific role and module
  router.get("/role/:role/module/:module", fetchUser, async (req, res) => {
    try {
      const { role, module } = req.params;
      RolePermission.init(req.userinfo.tenantcode);
      const permission = await RolePermission.getByRoleAndModule(role, module);
      
      return res.status(200).json({
        success: true,
        permission: permission
      });
    } catch (error) {
      console.error("Error fetching permission:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching permission",
        error: error.message
      });
    }
  });

  // Get current user's role permissions (for sidebar filtering)
  router.get("/current-user", fetchUser, async (req, res) => {
    try {
      const userRole = req.userinfo.userrole;
      RolePermission.init(req.userinfo.tenantcode);
      const permissions = await RolePermission.getByRole(userRole);
      
      return res.status(200).json({
        success: true,
        permissions: permissions
      });
    } catch (error) {
      console.error("Error fetching current user permissions:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching current user permissions",
        error: error.message
      });
    }
  });

  // Create or update a permission
  router.post("/", fetchUser, checkRole("ADMIN", "ADMIN"), async (req, res) => {
    try {
      const { role, module_name, can_create, can_read, can_update, can_delete } = req.body;
      
      if (!role || !module_name) {
        return res.status(400).json({
          success: false,
          message: "role and module_name are required"
        });
      }

      RolePermission.init(req.userinfo.tenantcode);
      const permission = await RolePermission.upsert({
        role,
        module_name,
        can_create: can_create || false,
        can_read: can_read || false,
        can_update: can_update || false,
        can_delete: can_delete || false
      });

      return res.status(200).json({
        success: true,
        permission: permission
      });
    } catch (error) {
      console.error("Error creating/updating permission:", error);
      return res.status(500).json({
        success: false,
        message: "Error creating/updating permission",
        error: error.message
      });
    }
  });

  // Bulk update permissions for a role
  router.put("/role/:role/bulk", fetchUser, checkRole("ADMIN", "ADMIN"), async (req, res) => {
    try {
      const { role } = req.params;
      const { permissions } = req.body;
      
      if (!permissions || !Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: "permissions array is required"
        });
      }

      RolePermission.init(req.userinfo.tenantcode);
      const result = await RolePermission.bulkUpdate(role, permissions);

      return res.status(200).json({
        success: true,
        message: "Permissions updated successfully",
        result: result
      });
    } catch (error) {
      console.error("Error bulk updating permissions:", error);
      return res.status(500).json({
        success: false,
        message: "Error bulk updating permissions",
        error: error.message
      });
    }
  });

  // Update a permission
  router.put("/:id", fetchUser, checkRole("ADMIN", "ADMIN"), async (req, res) => {
    try {
      const { id } = req.params;
      const { can_create, can_read, can_update, can_delete } = req.body;
      
      RolePermission.init(req.userinfo.tenantcode);
      const permission = await RolePermission.update(id, {
        can_create,
        can_read,
        can_update,
        can_delete
      });

      if (!permission) {
        return res.status(404).json({
          success: false,
          message: "Permission not found"
        });
      }

      return res.status(200).json({
        success: true,
        permission: permission
      });
    } catch (error) {
      console.error("Error updating permission:", error);
      return res.status(500).json({
        success: false,
        message: "Error updating permission",
        error: error.message
      });
    }
  });

  // Delete a permission
  router.delete("/:id", fetchUser, checkRole("ADMIN", "ADMIN"), async (req, res) => {
    try {
      const { id } = req.params;
      
      RolePermission.init(req.userinfo.tenantcode);
      const permission = await RolePermission.delete(id);

      if (!permission) {
        return res.status(404).json({
          success: false,
          message: "Permission not found"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Permission deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting permission:", error);
      return res.status(500).json({
        success: false,
        message: "Error deleting permission",
        error: error.message
      });
    }
  });

  app.use(process.env.BASE_API_URL + "/api/role-permissions", router);
};

