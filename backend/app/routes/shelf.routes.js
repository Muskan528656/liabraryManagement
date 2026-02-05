/**
 * Handles all incoming request for /api/shelf endpoint
 * DB table for this public.shelves
 * Model used here is shelf.model.js
 * SUPPORTED API ENDPOINTS
 *              GET     /api/shelf
 *              GET     /api/shelf/:id
 *              POST    /api/shelf
 *              PUT     /api/shelf/:id
 *              DELETE  /api/shelf/:id
 *
 * @author      Muskan Khan
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */

const { fetchUser, checkPermission } = require("../middleware/fetchuser.js");
const Shelf = require("../models/shelf.model.js");

module.exports = (app) => {
    const { body, validationResult } = require("express-validator");
    const router = require("express").Router();

    router.get(
        "/",
        fetchUser,
        // checkPermission("Shelves", "allow_view"),
        async (req, res) => {
            try {
                Shelf.init(req.userinfo.tenantcode);
                const shelves = await Shelf.findAll();
                res.json(shelves);
            } catch (err) {
                console.error(err);
                res.status(500).json({ errors: "Internal server error" });
            }
        }
    );

    router.get(
        "/:id",
        fetchUser,
        // checkPermission("Shelves", "allow_view"),
        async (req, res) => {
            try {
                Shelf.init(req.userinfo.tenantcode);

                const shelf = await Shelf.findById(req.params.id);
                if (!shelf) {
                    return res.status(404).json({ errors: "Shelf not found" });
                }

                res.status(200).json(shelf);
            } catch (error) {
                console.error(error);
                res.status(500).json({ errors: "Internal server error" });
            }
        }
    );

    router.post(
        "/",
        fetchUser,
        // checkPermission("Shelves", "allow_create"),
        [
            body("shelf_name")
                .notEmpty()
                .withMessage("Shelf name is required"),

            body("copies")
                .optional()
                .isInt({ min: 0 })
                .withMessage("Copies must be a non-negative number"),
        ],
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                Shelf.init(req.userinfo.tenantcode);

                const userId = req.userinfo?.id || null;

                const shelf = await Shelf.create(req.body, userId);

                res.status(200).json({
                    success: true,
                    data: shelf,
                });

            } catch (error) {
                console.error(error);
                res.status(500).json({ errors: error.message });
            }
        }
    );

    router.put(
        "/:id",
        fetchUser,
        checkPermission("Shelves", "allow_edit"),
        [
            body("shelf_name")
                .notEmpty()
                .withMessage("Shelf name is required"),
        ],
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                Shelf.init(req.userinfo.tenantcode);

                const existing = await Shelf.findById(req.params.id);
                if (!existing) {
                    return res.status(404).json({ errors: "Shelf not found" });
                }

                const userId = req.userinfo?.id || null;

                const updated = await Shelf.updateById(
                    req.params.id,
                    req.body,
                    userId
                );

                res.status(200).json({
                    success: true,
                    data: updated,
                });

            } catch (error) {
                console.error(error);
                res.status(500).json({ errors: error.message });
            }
        }
    );

    router.delete(
        "/:id",
        fetchUser,
        checkPermission("Shelves", "allow_delete"),
        async (req, res) => {
            try {
                Shelf.init(req.userinfo.tenantcode);

                const result = await Shelf.deleteById(req.params.id);

                if (!result.success) {
                    return res.status(404).json({ errors: result.message });
                }

                res.status(200).json({
                    success: true,
                    message: result.message,
                });

            } catch (error) {
                console.error(error);
                res.status(500).json({ errors: "Internal server error" });
            }
        }
    );

    app.use(process.env.BASE_API_URL + "/api/shelf", router);
};
