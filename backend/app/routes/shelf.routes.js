const { fetchUser } = require("../middleware/fetchuser.js");
const Shelf = require("../models/shelf.model.js");
const { getNextRackNumber } = require("../utils/autoNumber.helper.js");

module.exports = (app) => {
    const { body, validationResult } = require("express-validator");
    const router = require("express").Router();
    router.get("/grouped", fetchUser, async (req, res) => {
        try {
            Shelf.init(req.userinfo.tenantcode);
            const data = await Shelf.findGrouped();
            res.json(data);
        } catch (err) {
            console.error("Error fetching grouped shelves:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // ================= GET ALL WITH LIVE USAGE =================
    router.get("/with-usage", fetchUser, async (req, res) => {
        try {
            Shelf.init(req.userinfo.tenantcode);
            const branchId = req.branchId || null;
            const data = await Shelf.findAllWithUsage(branchId);
            res.json(data);
        } catch (err) {
            console.error("Error fetching shelves with usage:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // ================= GET ALL =================
    router.get("/", fetchUser, async (req, res) => {
        try {
            Shelf.init(req.userinfo.tenantcode);
            const data = await Shelf.findAll();
            res.json(data);
        } catch (err) {
            console.error("Error fetching shelves:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // ================= GET NEXT RACK NUMBER =================
    router.get("/next-rack/:floor", fetchUser, async (req, res) => {
        try {
            const { floor } = req.params;
            if (!floor) {
                return res.status(400).json({ error: "Floor is required" });
            }
            const nextRack = await getNextRackNumber(floor, req.userinfo.tenantcode);
            res.json({ rack: nextRack });
        } catch (err) {
            console.error("Error generating rack number:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // ================= GET SUGGESTIONS =================
    router.get("/suggestions", fetchUser, async (req, res) => {
        try {
            const { field, search, floor, rack } = req.query;

            if (!field || !search) {
                return res.status(400).json({ error: "Field and search term are required" });
            }

            Shelf.init(req.userinfo.tenantcode);
            const filters = {};
            if (floor) filters.floor = floor;
            if (rack) filters.rack = rack;

            const data = await Shelf.getSuggestions(field, search, filters);
            res.json(data);
        } catch (err) {
            console.error("Error fetching suggestions:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // ================= GET LAST BY FLOOR-RACK-NAME =================
    router.get("/last-by-floor-rack/:floor/:rack/:name", fetchUser, async (req, res) => {
        try {
            const { floor, rack, name } = req.params;

            Shelf.init(req.userinfo.tenantcode);
            const data = await Shelf.getLastByFloorRackName(floor, rack, name);
            res.json(data);
        } catch (err) {
            console.error("Error fetching last shelf:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // ================= GET BY ID =================
    router.get("/:id", fetchUser, async (req, res) => {
        try {
            const { id } = req.params;

            // Validate UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(id)) {
                return res.status(400).json({ error: "Invalid ID format" });
            }

            Shelf.init(req.userinfo.tenantcode);
            const data = await Shelf.findById(id);

            if (!data) {
                return res.status(404).json({ error: "Shelf not found" });
            }

            res.json(data);
        } catch (err) {
            console.error("Error fetching shelf:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // ================= CREATE =================
    router.post(
        "/",
        fetchUser,
        [
            body("name")
                .notEmpty()
                .withMessage("Name is required")
                .trim(),
            body("floor")
                .notEmpty()
                .withMessage("Floor is required")
                .trim(),
            body("rack")
                .notEmpty()
                .withMessage("Rack is required")
                .trim(),
            body("classification_type")
                .optional()
                .trim(),
            body("classification_from")
                .optional()
                .trim(),
            body("classification_to")
                .optional()
                .trim(),
            body("capacity")
                .optional()
                .isInt({ min: 1 })
                .withMessage("Capacity must be a positive integer")
        ],
        async (req, res) => {
            try {
                // Validate request
                const errors = validationResult(req);

                if (!errors.isEmpty()) {
                    return res.status(400).json({
                        errors: errors.array()[0].msg
                    });
                }

                Shelf.init(req.userinfo.tenantcode);

                // Add user info
                req.body.createdbyid = req.userinfo.userId;
                req.body.lastmodifiedbyid = req.userinfo.userId;

                const data = await Shelf.create(req.body);
                console.log("Shelf created:", data);

                res.status(201).json({
                    success: true,
                    message: "Shelf created successfully",
                    data: data
                });

            } catch (err) {
                console.error("Error creating shelf:", err);

                if (err.message.includes("already exists") ||
                    err.message.includes("overlaps")) {
                    return res.status(409).json({
                        error: err.message
                    });
                }

                res.status(400).json({
                    error: err.message || "Failed to create shelf"
                });
            }
        }
    );

    // ================= UPDATE =================
    router.put(
        "/:id",
        fetchUser,
        [
            body("name")
                .optional()
                .notEmpty()
                .withMessage("Name cannot be empty if provided")
                .trim(),
            body("floor")
                .optional()
                .notEmpty()
                .withMessage("Floor cannot be empty if provided")
                .trim(),
            body("rack")
                .optional()
                .notEmpty()
                .withMessage("Rack cannot be empty if provided")
                .trim(),
            body("classification_type")
                .optional()
                .trim(),
            body("classification_from")
                .optional()
                .trim(),
            body("classification_to")
                .optional()
                .trim(),
            body("capacity")
                .optional()
                .isInt({ min: 1 })
                .withMessage("Capacity must be a positive integer")
        ],
        async (req, res) => {
            try {
                // Validate request
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({
                        errors: errors.array()[0].msg
                    });
                }

                if (Object.keys(req.body).length === 0) {
                    return res.status(400).json({
                        error: "No data provided for update"
                    });
                }

                Shelf.init(req.userinfo.tenantcode);

                // Add user info
                req.body.lastmodifiedbyid = req.userinfo.userId;

                const data = await Shelf.updateById(
                    req.params.id,
                    req.body
                );

                if (!data) {
                    return res.status(404).json({ error: "Shelf not found" });
                }

                res.json({
                    success: true,
                    message: "Shelf updated successfully",
                    data: data
                });
            } catch (err) {
                console.error("Error updating shelf:", err);

                if (err.message.includes("already exists") ||
                    err.message.includes("overlaps")) {
                    return res.status(409).json({
                        error: err.message
                    });
                }

                res.status(400).json({
                    error: err.message || "Failed to update shelf"
                });
            }
        }
    );

    // ================= DELETE =================
    router.delete("/:id", fetchUser, async (req, res) => {
        try {
            Shelf.init(req.userinfo.tenantcode);

            // Check if shelf exists
            const shelf = await Shelf.findById(req.params.id);
            if (!shelf) {
                return res.status(404).json({ error: "Shelf not found" });
            }

            await Shelf.deleteById(req.params.id);

            res.json({
                success: true,
                message: "Shelf deleted successfully"
            });
        } catch (err) {
            console.error("Error deleting shelf:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    app.use(process.env.BASE_API_URL + "/api/shelf", router);
};