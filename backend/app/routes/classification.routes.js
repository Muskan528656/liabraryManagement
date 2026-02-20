const express = require("express");
const router = express.Router();
const Classification = require("../models/classification.model.js");
const { fetchUser, checkPermission } = require("../middleware/fetchuser.js");
const { body, validationResult } = require("express-validator");

module.exports = (app) => {
    // Init model middleware
    const initModel = (req, res, next) => {
        try {
            Classification.init(req.userinfo.tenantcode, req.branchId);
            next();
        } catch (error) {
            res.status(500).json({ message: "Error initializing model", error: error.message });
        }
    };

    // ================= GET ALL =================
    // router.get("/", fetchUser, initModel, async (req, res) => {
    //     try {
    //         const filters = {
    //             search: req.query.search,
    //             is_active: req.query.is_active,
    //             classification_type: req.query.classification_type
    //         };
    //         const classifications = await Classification.findAll(filters);
    //         res.json(classifications);
    //     } catch (error) {
    //         res.status(500).send(error.message);
    //     }
    // });

    // ================= GET BY TYPE =================
    router.get("/type/:type", fetchUser, initModel, async (req, res) => {
        try {
            const { type } = req.params;
            const classifications = await Classification.getByType(type);
            res.json(classifications);
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    // ================= GET BY ID =================
    router.get("/:id", fetchUser, initModel, async (req, res) => {
        try {
            const classification = await Classification.findById(req.params.id);
            if (!classification) {
                return res.status(404).json({ message: "Classification not found" });
            }
            res.json(classification);
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    // ================= CREATE =================
    router.post(
        "/",
        fetchUser,
        initModel,
        [
            body("classification_type")
                .notEmpty()
                .withMessage("Classification type is required")
                .isIn(["DDC", "LLC"])
                .withMessage("Classification type must be DDC or LLC"),
            body("code")
                .notEmpty()
                .withMessage("Code is required")
                .trim(),
            body("name")
                .notEmpty()
                .withMessage("Name is required")
                .trim(),
            body("classification_from")
                .optional()
                .trim(),
            body("classification_to")
                .optional()
                .trim()
        ],
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                const classification = await Classification.create(req.body, req.userinfo.id);
                res.status(201).json(classification);
            } catch (error) {
                if (error.message.includes("already exists")) {
                    return res.status(409).json({ message: error.message });
                }
                res.status(400).send(error.message);
            }
        }
    );

    // ================= UPDATE =================
    router.put(
        "/:id",
        fetchUser,
        initModel,
        [
            body("classification_type")
                .optional()
                .isIn(["DDC", "LLC"])
                .withMessage("Classification type must be DDC or LLC"),
            body("code")
                .optional()
                .trim(),
            body("name")
                .optional()
                .trim(),
            body("classification_from")
                .optional()
                .trim(),
            body("classification_to")
                .optional()
                .trim()
        ],
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                const classification = await Classification.updateById(
                    req.params.id, 
                    req.body, 
                    req.userinfo.id
                );
                
                if (!classification) {
                    return res.status(404).json({ message: "Classification not found" });
                }
                
                res.json(classification);
            } catch (error) {
                if (error.message.includes("already exists")) {
                    return res.status(409).json({ message: error.message });
                }
                res.status(400).send(error.message);
            }
        }
    );

    // ================= DELETE =================
    router.delete("/:id", fetchUser, initModel, async (req, res) => {
        try {
            const deleted = await Classification.deleteById(req.params.id);
            if (!deleted) {
                return res.status(404).json({ message: "Classification not found" });
            }
            res.json({ message: "Classification deleted successfully" });
        } catch (error) {
            if (error.message.includes("being used")) {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).send(error.message);
        }
    });

    app.use(process.env.BASE_API_URL + "/api/classification", router);
};