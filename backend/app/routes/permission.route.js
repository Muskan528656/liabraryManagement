/**
 * Permissions Routes
 */

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Permission = require("../models/permission.model.js");
const { fetchUser } = require("../middleware/fetchuser.js");

module.exports = (app) => {

    // Get all permissions
    router.get("/", fetchUser, async (req, res) => {
        try {
            const perms = await Permission.findAll();
            res.json({ success: true, data: perms });
        } catch (e) {
            console.error("Error fetching all permissions:", e);
            res.status(500).json({ success: false, error: e.message });
        }
    });

    // Get permissions by roleId
    router.get("/role/:roleId", fetchUser, async (req, res) => {
        try {
            const { roleId } = req.params;

            if (!roleId || !roleId.match(/[0-9a-fA-F-]{36}/)) {
                return res.status(400).json({ success: false, message: "Invalid roleId" });
            }

            const permissions = await Permission.findByRole(roleId);
            res.json({ success: true, data: permissions });
        } catch (e) {
            console.error("Error fetching permissions by role:", e);
            res.status(500).json({ success: false, error: e.message });
        }
    });

    // Update multiple permissions for a role
    router.put("/role/:roleId", fetchUser, async (req, res) => {
        try {
            const { roleId } = req.params;
            const { permissions } = req.body;

            if (!permissions || !Array.isArray(permissions)) {
                return res.status(400).json({
                    success: false,
                    message: "Permissions array is required"
                });
            }

            const result = await Permission.updateMultiple(roleId, permissions, req.userinfo.id);

            res.json({
                success: true,
                message: `${result.length} permissions updated successfully`,
                data: result
            });
        } catch (e) {
            console.error("Error updating permissions:", e);
            res.status(500).json({
                success: false,
                error: e.message
            });
        }
    });

    // Create a single permission
    router.post(
        "/",
        fetchUser,
        [
            body("role_id").isUUID().withMessage("role_id must be UUID"),
            body("module_id").isUUID().withMessage("module_id must be UUID")
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty())
                return res.status(400).json({ success: false, error: errors.array() });

            try {
                const perm = await Permission.create(req.body, req.userinfo?.id);
                res.json({ success: true, data: perm });
            } catch (e) {
                console.error("Error creating permission:", e);
                res.status(500).json({ success: false, error: e.message });
            }
        }
    );

    // Update single permission by ID
    router.put("/:id", fetchUser, async (req, res) => {
        try {
            const perm = await Permission.updateById(req.params.id, req.body, req.userinfo?.id);
            res.json({ success: true, data: perm });
        } catch (e) {
            console.error("Error updating permission:", e);
            res.status(500).json({ success: false, error: e.message });
        }
    });

    // Delete single permission by ID
    router.delete("/:id", fetchUser, async (req, res) => {
        try {
            const out = await Permission.deleteById(req.params.id);
            res.json({ success: true, data: out });
        } catch (e) {
            console.error("Error deleting permission:", e);
            res.status(500).json({ success: false, error: e.message });
        }
    });

    // Mount the router
    app.use(process.env.BASE_API_URL + "/api/permissions", router);
};
