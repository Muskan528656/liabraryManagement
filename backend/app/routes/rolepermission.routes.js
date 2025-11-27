/**
 * Role Permission Routes
 * Author: Muskan Khan
 * Date: NOV, 2025
 * Copyright: www.ibirdsservices.com
 */

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const RolePermission = require("../models/rolePermission.model.js");
const { fetchUser } = require("../middleware/fetchuser.js");

module.exports = (app) => {

    // Get all role permissions
    router.get("/", fetchUser, async (req, res) => {
        try {
            const perms = await RolePermission.findAll();
            res.status(200).json({ success: true, data: perms });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get role permission by ID
    router.get("/:id", fetchUser, async (req, res) => {
        try {
            const perm = await RolePermission.findById(req.params.id);
            if (!perm) return res.status(404).json({ success: false, error: "Role permission not found" });
            res.status(200).json({ success: true, data: perm });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Create role permission
    router.post(
        "/",
        fetchUser,
        [body("role_id", "role_id is required").notEmpty()],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(e => e.msg).join(", ");
                return res.status(400).json({ success: false, error: errorMessages });
            }

            try {
                const newPerm = await RolePermission.create(req.body, req.userinfo?.id);
                res.status(200).json({ success: true, data: newPerm });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        }
    );

    // Update role permission
    router.put(
        "/:id",
        fetchUser,
        [body("role_id").optional().notEmpty()],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(e => e.msg).join(", ");
                return res.status(400).json({ success: false, error: errorMessages });
            }

            try {
                const updatedPerm = await RolePermission.updateById(req.params.id, req.body, req.userinfo?.id);
                if (!updatedPerm) return res.status(404).json({ success: false, error: "Role permission not found" });
                res.status(200).json({ success: true, data: updatedPerm });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        }
    );

    // Delete role permission
    router.delete("/:id", fetchUser, async (req, res) => {
        try {
            const result = await RolePermission.deleteById(req.params.id);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Mount the router
    app.use(process.env.BASE_API_URL + "/api/role-permissions", router);
};
