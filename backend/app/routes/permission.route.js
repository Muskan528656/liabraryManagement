/**
 * Permissions Routes
 */

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Permission = require("../models/permission.model.js");
const { fetchUser } = require("../middleware/fetchuser.js");

module.exports = (app) => {

    // fetch all permissions (admin only use)
    router.get("/", fetchUser, async (req, res) => {
        try {
            const perms = await Permission.findAll();
            res.json({ success: true, data: perms });
        } catch (e) {
            res.status(500).json({ success: false, error: e.message });
        }
    });

    // find permissions by role
    router.get("/role/:roleId", fetchUser, async (req, res) => {
        try {
            const perms = await Permission.findByRole(req.params.roleId);
            res.json({ success: true, data: perms });
        } catch (e) {
            res.status(500).json({ success: false, error: e.message });
        }
    });

    // create permission row
    router.post(
        "/",
        fetchUser,
        [
            body("role_id").isUUID(),
            body("module_id").isUUID()
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty())
                return res.status(400).json({ success: false, error: errors.array() });

            try {
                const perm = await Permission.create(req.body, req.userinfo?.id);
                res.json({ success: true, data: perm });
            } catch (e) {
                res.status(500).json({ success: false, error: e.message });
            }
        }
    );
    // ✅ Bulk update permissions for a role
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

    // ✅ Get permissions by role ID
    router.get("/role/:roleId", fetchUser, async (req, res) => {
        try {
            const { roleId } = req.params;
            const permissions = await Permission.findByRoleId(roleId);

            res.json({
                success: true,
                data: permissions
            });
        } catch (e) {
            console.error("Error fetching permissions:", e);
            res.status(500).json({
                success: false,
                error: e.message
            });
        }
    });
    // update flags
    router.put("/:id", fetchUser, async (req, res) => {
        try {
            const perm = await Permission.updateById(req.params.id, req.body, req.userinfo?.id);
            res.json({ success: true, data: perm });
        } catch (e) {
            res.status(500).json({ success: false, error: e.message });
        }
    });

    router.delete("/:id", fetchUser, async (req, res) => {
        try {
            const out = await Permission.deleteById(req.params.id);
            res.json(out);
        } catch (e) {
            res.status(500).json({ success: false, error: e.message });
        }
    });

    app.use(process.env.BASE_API_URL + "/api/permissions", router);
};
