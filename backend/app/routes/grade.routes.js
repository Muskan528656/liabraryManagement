const { fetchUser } = require("../middleware/fetchuser.js");
const GradeSection = require("../models/grademodel.js");

module.exports = (app) => {
    const { body, validationResult } = require("express-validator");
    const router = require("express").Router();

    // ================= GET ALL =================
    router.get("/", fetchUser, async (req, res) => {
        try {
            GradeSection.init(req.userinfo.tenantcode);
            const data = await GradeSection.findAll();
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ================= GET BY ID =================
    router.get("/:id", fetchUser, async (req, res) => {
        try {
            GradeSection.init(req.userinfo.tenantcode);
            const data = await GradeSection.findById(req.params.id);

            if (!data)
                return res.status(404).json({ error: "Grade section not found" });

            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ================= GET BY GRADE NAME =================
    router.get("/grade/:grade_name", fetchUser, async (req, res) => {
        try {
            GradeSection.init(req.userinfo.tenantcode);
            const data = await GradeSection.findByGradeName(req.params.grade_name);
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ================= CREATE =================
    router.post(
        "/",
        fetchUser,
        [
            body("grade_name")
                .notEmpty()
                .withMessage("Grade name is required")
                .isLength({ max: 50 })
                .withMessage("Grade name must be 50 characters or less"),

            body("section_name")
                .notEmpty()
                .withMessage("Section name is required")
                .isLength({ max: 10 })
                .withMessage("Section name must be 10 characters or less"),

            body("status")
                .optional()
                .isBoolean()
                .withMessage("Status must be true/false"),
        ],
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty())
                    return res.status(400).json({ errors: errors.array() });

                GradeSection.init(req.userinfo.tenantcode);

                const data = await GradeSection.create(req.body, req.userinfo.userid);

                res.status(201).json({
                    success: true,
                    message: "Grade section created successfully",
                    data: data
                });

            } catch (err) {
                res.status(400).json({
                    error: err.message || "Failed to create grade section"
                });
            }
        }
    );

    // ================= BULK CREATE SECTIONS =================
    router.post(
        "/bulk",
        fetchUser,
        [
            body("grade_name")
                .notEmpty()
                .withMessage("Grade name is required"),

            body("sections")
                .isArray({ min: 1 })
                .withMessage("Sections must be an array with at least one item"),
        ],
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty())
                    return res.status(400).json({ errors: errors.array() });

                GradeSection.init(req.userinfo.tenantcode);

                const { grade_name, sections } = req.body;
                const data = await GradeSection.bulkCreateSections(
                    grade_name,
                    sections,
                    req.userinfo.userid
                );

                res.status(201).json({
                    success: true,
                    message: "Bulk sections created successfully",
                    data: data
                });
            } catch (err) {
                res.status(400).json({
                    error: err.message || "Failed to create bulk sections"
                });
            }
        }
    );

    // ================= UPDATE =================
    router.put(
        "/:id",
        fetchUser,
        [
            body("grade_name")
                .notEmpty()
                .withMessage("Grade name is required")
                .isLength({ max: 50 })
                .withMessage("Grade name must be 50 characters or less"),

            body("section_name")
                .notEmpty()
                .withMessage("Section name is required")
                .isLength({ max: 10 })
                .withMessage("Section name must be 10 characters or less"),

            body("status")
                .optional()
                .isBoolean()
                .withMessage("Status must be true/false"),
        ],
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty())
                    return res.status(400).json({ errors: errors.array() });

                GradeSection.init(req.userinfo.tenantcode);

                const data = await GradeSection.updateById(
                    req.params.id,
                    req.body,
                    req.userinfo.userid
                );

                if (!data)
                    return res.status(404).json({ error: "Grade section not found" });

                res.json({
                    success: true,
                    message: "Grade section updated successfully",
                    data: data
                });
            } catch (err) {
                res.status(400).json({
                    error: err.message || "Failed to update grade section"
                });
            }
        }
    );

    // ================= DELETE =================
    router.delete("/:id", fetchUser, async (req, res) => {
        try {
            GradeSection.init(req.userinfo.tenantcode);
            await GradeSection.deleteById(req.params.id);

            res.json({
                success: true,
                message: "Grade section deleted successfully"
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ================= SEARCH/QUERY =================
    router.post("/search", fetchUser, async (req, res) => {
        try {
            GradeSection.init(req.userinfo.tenantcode);
            const filters = req.body;
            const data = await GradeSection.search(filters);

            res.json({
                success: true,
                count: data.length,
                data: data
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.use(process.env.BASE_API_URL + "/api/grade-sections", router);
};