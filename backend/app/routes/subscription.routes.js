/**
 * Subscription Routes
 * Author: Muskan Khan
 * Date: DEC, 2025
 * Copyright: www.ibirdsservices.com
 */

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Subscription = require("../models/subscription.mode.js");
const { fetchUser } = require("../middleware/fetchuser.js");

module.exports = (app) => {

    router.get("/", fetchUser, async (req, res) => {
        try {
            const subs = await Subscription.findAll();
            res.status(200).json({ success: true, data: subs });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    router.get("/:id", fetchUser, async (req, res) => {
        try {
            const sub = await Subscription.findById(req.params.id);
            if (!sub) return res.status(404).json({ success: false, error: "Subscription not found" });
            res.status(200).json({ success: true, data: sub });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    router.post(
        "/",
        fetchUser,
        [
            body("plan_name", "plan_name is required").notEmpty(),
            body("start_date").optional().isISO8601(),
            body("end_date").optional().isISO8601(),
            body("is_active").optional().isBoolean(),
            body("allowed_books").optional().isString()
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(e => e.msg).join(", ");
                return res.status(400).json({ success: false, error: errorMessages });
            }

            try {
                const newSub = await Subscription.create(req.body, req.userinfo?.id);
                res.status(200).json({ success: true, data: newSub });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        }
    );


    router.put(
        "/:id",
        fetchUser,
        [
            body("plan_name").optional().notEmpty(),
            body("start_date").optional().isISO8601(),
            body("end_date").optional().isISO8601(),
            body("is_active").optional().isBoolean(),
            body("allowed_books").optional().isString()
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(e => e.msg).join(", ");
                return res.status(400).json({ success: false, error: errorMessages });
            }

            try {
                const updatedSub = await Subscription.updateById(req.params.id, req.body, req.userinfo?.id);
                if (!updatedSub) return res.status(404).json({ success: false, error: "Subscription not found" });
                res.status(200).json({ success: true, data: updatedSub });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        }
    );

    router.delete("/:id", fetchUser, async (req, res) => {
        try {
            const result = await Subscription.deleteById(req.params.id);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

 
    app.use(process.env.BASE_API_URL + "/api/subscriptions", router);
};
