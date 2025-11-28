/**
 * Permissions Routes
 * Author: Muskan Khan
 * Date: NOV, 2025
 * Copyright: www.ibirdsservices.com
 */

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Permission = require("../models/permission.model.js");
const { fetchUser } = require("../middleware/fetchuser.js");

module.exports = (app) => {

    router.get("/", fetchUser, async (req, res) => {
        try {
            const perms = await Permission.findAll();
            res.status(200).json({ success: true, data: perms });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    
    router.get("/:id", fetchUser, async (req, res) => {
        try {
            const perm = await Permission.findById(req.params.id);
            if (!perm) return res.status(404).json({ success: false, error: "Permission not found" });
            res.status(200).json({ success: true, data: perm });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    router.post(
        "/",
        fetchUser,
        [
            body("module_id").optional().isUUID(),
            body("allow_view").optional().isBoolean(),
            body("allow_create").optional().isBoolean(),
            body("allow_edit").optional().isBoolean(),
            body("allow_delete").optional().isBoolean()
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(e => e.msg).join(", ");
                return res.status(400).json({ success: false, error: errorMessages });
            }

            try {
                const newPerm = await Permission.create(req.body, req.userinfo?.id);
                res.status(200).json({ success: true, data: newPerm });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        }
    );

    
    router.put(
        "/:id",
        fetchUser,
        [
            body("module_id").optional().isUUID(),
            body("allow_view").optional().isBoolean(),
            body("allow_create").optional().isBoolean(),
            body("allow_edit").optional().isBoolean(),
            body("allow_delete").optional().isBoolean()
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(e => e.msg).join(", ");
                return res.status(400).json({ success: false, error: errorMessages });
            }

            try {
                const updatedPerm = await Permission.updateById(req.params.id, req.body, req.userinfo?.id);
                if (!updatedPerm) return res.status(404).json({ success: false, error: "Permission not found" });
                res.status(200).json({ success: true, data: updatedPerm });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        }
    );

   
    router.delete("/:id", fetchUser, async (req, res) => {
        try {
            const result = await Permission.deleteById(req.params.id);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

   
    app.use(process.env.BASE_API_URL + "/api/permissions", router);
};
