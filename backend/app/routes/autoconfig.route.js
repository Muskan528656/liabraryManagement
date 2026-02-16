/**
 * Auto-Config Routes
 * Author: Muskan Khan
 * Date: DEC, 2025
 * Copyright: www.ibirdsservices.com
 */

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const AutoConfig = require("../models/autoconfig.model.js");
const { fetchUser } = require("../middleware/fetchuser.js");

module.exports = (app) => {

    router.use((req, res, next) => {
        next();
    });

 
    router.get("/", fetchUser, async (req, res) => {
        try {
                 AutoConfig.init(req.userinfo.tenantcode);
            const configs = await AutoConfig.findAll();
            res.status(200).json({
                success: true,
                data: configs,
                message: configs.length ? "Auto configs retrieved successfully" : "No auto configs found"
            });
        } catch (error) {
            console.error("Error fetching auto configs:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
                message: error.message
            });
        }
    });

 
    router.get("/:id", fetchUser, async (req, res) => {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "Config ID is required"
                });
            }
     AutoConfig.init(req.userinfo.tenantcode);
            const config = await AutoConfig.findById(id);
            if (!config) {
                return res.status(404).json({
                    success: false,
                    error: "Auto config record not found"
                });
            }

            res.status(200).json({
                success: true,
                data: config,
                message: "Auto config retrieved successfully"
            });
        } catch (error) {
            console.error("Error fetching auto config:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
                message: error.message
            });
        }
    });

 
    router.post(
        "/",
        fetchUser,
        [
            body("table_name", "table_name is required and must be a string")
                .notEmpty()
                .isString()
                .trim(),
            body("digit_count", "digit_count must be a positive number")
                .optional()
                .isInt({ min: 0 }),
            body("next_number", "next_number must be a string")
                .optional()
                .isString()
                .trim(),
            body("prefix", "prefix must be a string")
                .optional()
                .isString()
                .trim()
                .isLength({ max: 10 })
                .withMessage("Prefix must not exceed 10 characters"),
        ],
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    const errorMessages = errors.array().map(err => `${err.param}: ${err.msg}`).join(", ");
                    return res.status(400).json({
                        success: false,
                        error: "Validation failed",
                        details: errorMessages
                    });
                }

                const userId = req.userinfo?.id;
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        error: "User authentication required"
                    });
                }

                const newConfig = await AutoConfig.create(req.body, userId);

                res.status(201).json({
                    success: true,
                    data: newConfig,
                    message: "Auto config created successfully"
                });
            } catch (error) {
                console.error("Error creating auto config:", error);


                if (error.message && error.message.includes("duplicate key")) {
                    return res.status(409).json({
                        success: false,
                        error: "Auto config for this table already exists"
                    });
                }

                res.status(500).json({
                    success: false,
                    error: "Failed to create auto config",
                    message: error.message
                });
            }
        }
    );

 
    router.put(
        "/:id",
        fetchUser,
        [
            body("table_name")
                .optional()
                .notEmpty()
                .withMessage("table_name cannot be empty")
                .isString()
                .trim(),
            body("digit_count")
                .optional()
                .isInt({ min: 0 })
                .withMessage("digit_count must be a positive number"),
            body("next_number")
                .optional()
                .isString()
                .trim()
                .withMessage("next_number must be a string"),
            body("prefix")
                .optional()
                .isString()
                .trim()
                .isLength({ max: 10 })
                .withMessage("Prefix must not exceed 10 characters"),
        ],
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    const errorMessages = errors.array().map(err => `${err.param}: ${err.msg}`).join(", ");
                    return res.status(400).json({
                        success: false,
                        error: "Validation failed",
                        details: errorMessages
                    });
                }

                const { id } = req.params;
                const userId = req.userinfo?.id;

                if (!id) {
                    return res.status(400).json({
                        success: false,
                        error: "Config ID is required"
                    });
                }

                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        error: "User authentication required"
                    });
                }
     AutoConfig.init(req.userinfo.tenantcode);
                const updatedConfig = await AutoConfig.updateById(id, req.body, userId);
                if (!updatedConfig) {
                    return res.status(404).json({
                        success: false,
                        error: "Auto config record not found"
                    });
                }

                res.status(200).json({
                    success: true,
                    data: updatedConfig,
                    message: "Auto config updated successfully"
                });
            } catch (error) {
                console.error("Error updating auto config:", error);

 
                if (error.message && error.message.includes("duplicate key")) {
                    return res.status(409).json({
                        success: false,
                        error: "Auto config for this table already exists"
                    });
                }

                res.status(500).json({
                    success: false,
                    error: "Failed to update auto config",
                    message: error.message
                });
            }
        }
    );

 
    router.delete("/:id", fetchUser, async (req, res) => {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "Config ID is required"
                });
            }

                 AutoConfig.init(req.userinfo.tenantcode);
            const result = await AutoConfig.deleteById(id);

            if (!result.success) {
                return res.status(404).json({
                    success: false,
                    error: result.message
                });
            }

            res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            console.error("Error deleting auto config:", error);
            res.status(500).json({
                success: false,
                error: "Failed to delete auto config",
                message: error.message
            });
        }
    });

 
    router.get("/table/:tableName", fetchUser, async (req, res) => {
        try {
            const { tableName } = req.params;

            if (!tableName) {
                return res.status(400).json({
                    success: false,
                    error: "Table name is required"
                });
            }
            AutoConfig.init(req.userinfo.tenantcode);

            const config = await AutoConfig.getByTableName(tableName);

            res.status(200).json({
                success: true,
                data: config,
                message: config ? "Auto config found" : "Auto config not found for the specified table"
            });
        } catch (error) {
            console.error("Error fetching auto config by table name:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
                message: error.message
            });
        }
    });
    app.use(process.env.BASE_API_URL + "/api/auto-config", router);
};