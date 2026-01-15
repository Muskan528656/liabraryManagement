const express = require("express");
const router = express.Router();
const { body, param, validationResult } = require("express-validator");
const RolePermission = require("../models/rolepermission.model.js");
const { fetchUser } = require("../middleware/fetchuser.js");

module.exports = (app) => {

    router.get("/", fetchUser, async (req, res) => {
        try {
            const data = await RolePermission.findAll();
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

  
    router.get(
        "/:id",
        fetchUser,
        [param("id").notEmpty()],
        async (req, res) => {
            try {
                const data = await RolePermission.findById(req.params.id);

                if (!data) {
                    return res.status(404).json({
                        success: false,
                        error: "Role permission not found"
                    });
                }

                res.status(200).json({ success: true, data });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        }
    );

    router.post(
        "/",
        fetchUser,
        [
            body("role_id", "role_id is required").notEmpty(),
            body("permission_id", "permission_id is required").notEmpty()
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: errors.array().map(e => e.msg).join(", ")
                });
            }

            try {
                const data = await RolePermission.create(req.body);
                res.status(200).json({ success: true, data });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        }
    );

    router.put(
        "/:id",
        fetchUser,
        [
            param("id").notEmpty(),
            body("role_id").optional().notEmpty(),
            body("permission_id").optional().notEmpty()
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: errors.array().map(e => e.msg).join(", ")
                });
            }

            try {
                const data = await RolePermission.updateById(
                    req.params.id,
                    req.body
                );

                res.status(200).json({ success: true, data });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        }
    );

    router.delete(
        "/:id",
        fetchUser,
        [param("id").notEmpty()],
        async (req, res) => {
            try {
                const result = await RolePermission.deleteById(req.params.id);
                res.status(200).json(result);
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        }
    );
    app.use(
        process.env.BASE_API_URL + "/api/role-permissions",
        router
    );
};
