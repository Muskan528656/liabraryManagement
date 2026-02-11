const { fetchUser } = require("../middleware/fetchuser.js");
const Shelf = require("../models/shelf.model.js");

module.exports = (app) => {
    const { body, validationResult } = require("express-validator");
    const router = require("express").Router();

    // ================= GET GROUPED SHELVES =================
    router.get("/grouped", fetchUser, async (req, res) => {

        try {
            Shelf.init(req.userinfo.tenantcode);
            const data = await Shelf.findGroupedShelves();
            console.log("data=>", data);
            res.json(data);
        } catch (err) {
            console.error("Error fetching grouped shelves:", err);
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

    // ================= GET BY ID =================
    router.get("/:id", fetchUser, async (req, res) => {
        try {
            Shelf.init(req.userinfo.tenantcode);
            const data = await Shelf.findById(req.params.id);

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
            body("shelf_name")
                .notEmpty()
                .withMessage("Shelf name is required")
                .trim(),
            body("shelf_name").notEmpty().withMessage("Name is required"),

            body("sub_shelf")
                .optional()
                .isString()
                .withMessage("Sub shelf must be a string")
                .trim(),

            body("note")
                .optional()
                .isString()
                .withMessage("Note must be a string")
                .trim(),

            body("status")
                .optional()
                .isBoolean()
                .withMessage("Status must be boolean")
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

                const data = await Shelf.create(req.body);
                console.log("Shelf created:", data);

                res.status(201).json({
                    success: true,
                    message: "Shelf created successfully",
                    data: data
                });

            } catch (err) {
                console.error("Error creating shelf:", err);

                if (err.message.includes("zaten mevcut") ||
                    err.message.includes("already exists")) {
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
            body("shelf_name")
                .optional()
                .notEmpty()
                .withMessage("Shelf name cannot be empty if provided")
                // .matches(/^[A-Za-z\s]+$/)
                // .withMessage("Shelf name should not contain numbers")
                .trim(),

            body("sub_shelf")
                .optional()
                .notEmpty()
                .withMessage("Sub shelf cannot be empty if provided")
                // .matches(/^[A-Za-z\s]+$/)
                // .withMessage("Sub shelf should not contain numbers")
                .trim(),

            body("note")
                .optional()
                .notEmpty()
                .withMessage("Note cannot be empty if provided")
                // .matches(/^[A-Za-z\s]+$/)
                // .withMessage("Note should not contain numbers")
                .trim(),


            body("status")
                .optional()
                .isBoolean()
                .withMessage("Status must be boolean")
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

                if (err.message.includes("zaten mevcut") ||
                    err.message.includes("already exists")) {
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

            // Önce rafın var olup olmadığını kontrol et
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