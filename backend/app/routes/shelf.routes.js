const { fetchUser } = require("../middleware/fetchuser.js");
const Shelf = require("../models/shelf.model.js");

module.exports = (app) => {
    const { body, validationResult } = require("express-validator");
    const router = require("express").Router();

    // ================= GET ALL =================
    router.get("/", fetchUser, async (req, res) => {
        try {
            Shelf.init(req.userinfo.tenantcode);
            const data = await Shelf.findAll();
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ================= GET BY ID =================
    router.get("/:id", fetchUser, async (req, res) => {
        try {
            Shelf.init(req.userinfo.tenantcode);
            const data = await Shelf.findById(req.params.id);

            if (!data)
                return res.status(404).json({ error: "Shelf not found" });

            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ================= CREATE =================
    router.post(
        "/",
        fetchUser,
        async (req, res) => {
            try {
                Shelf.init(req.userinfo.tenantcode);

                const data = await Shelf.create(req.body);

                console.log("SAVED DATA >>>", data);

                res.json(data);

            } catch (err) {
                res.status(400).json({ error: err.message });
            }
        }
    );


    // ================= UPDATE =================
    router.put(
        "/:id",
        fetchUser,
        [
            body("shelf_name")
                .notEmpty()
                .withMessage("Shelf name required"),

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

                Shelf.init(req.userinfo.tenantcode);

                const data = await Shelf.updateById(
                    req.params.id,
                    req.body
                );

                if (!data)
                    return res.status(404).json({ error: "Shelf not found" });

                res.json(data);
            } catch (err) {
                res.status(400).json({ error: err.message });
            }
        }
    );

    // ================= DELETE =================
    router.delete("/:id", fetchUser, async (req, res) => {
        try {
            Shelf.init(req.userinfo.tenantcode);
            await Shelf.deleteById(req.params.id);

            res.json({ message: "Shelf deleted successfully" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.use(process.env.BASE_API_URL + "/api/shelf", router);
};
