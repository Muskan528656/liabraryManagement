/**
 * Subscription Routes
 * Author: Muskan Khan
 * changes: Aabid
 * Date: DEC, 2025
 * Copyright: www.ibirdsservices.com
 */

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Subscription = require("../models/subscription.mode.js");
const { fetchUser } = require("../middleware/fetchuser.js");
const sql = require("../models/db.js");
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
            const sub = await Subscription.finsqlyId(req.params.id);
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
            body("plan_id", "plan_id is required").notEmpty(),
            body("member_id", "member_id is required").notEmpty(),
            body("plan_name", "plan_name is required").notEmpty(),
            body("duration_days").optional().isNumeric(),
            body("allowed_books").optional().isNumeric(),
            body("start_date").optional().isISO8601(),
            body("end_date").optional().isISO8601(),
            body("is_active").optional().isBoolean(),
            body("status").optional().isIn(["active", "inactive", "expired", "cancelled"]),
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(e => e.msg).join(", ");
                return res.status(400).json({ success: false, error: errorMessages });
            }

            try {
                const {
                    plan_id,
                    user_id,
                    card_id,
                    member_id,
                    plan_name,
                    duration_days,
                    allowed_books,
                    start_date,
                    end_date,
                    is_active = true,
                  
                } = req.body;

                console.log("Creating subscription with data:", req.body);


                const planExists = await sql.query(
                    "SELECT id FROM demo.plan WHERE id = $1",
                    [plan_id]
                );

                if (!planExists.rows.length) {
                    return res.status(404).json({
                        success: false,
                        error: "Plan not found"
                    });
                }


                const existingSubscription = await sql.query(
                    `SELECT id FROM demo.subscriptions
                 WHERE member_id = $1
                 AND plan_id = $2
                 AND user_id = $3
                 AND user_id = $4
                 AND duration_days = $5
                 AND is_active = true
                 AND (end_date IS NULL OR end_date > CURRENT_DATE)`,
                    [member_id, plan_id, user_id,card_id, duration_days]
                );

                if (existingSubscription.rows.length > 0) {
                    return res.status(400).json({
                        success: false,
                        error: "Member already has an active subscription for this plan"
                    });
                }


                const subscriptionStartDate = start_date || new Date().toISOString().split('T')[0];

                let subscriptionEndDate = end_date;
                if (!subscriptionEndDate && duration_days) {
                    const end = new Date(subscriptionStartDate);
                    end.setDate(end.getDate() + parseInt(duration_days));
                    subscriptionEndDate = end.toISOString().split('T')[0];
                }


                const subscriptionData = {
                    plan_id,
                    member_id: member_id,
                    user_id,
                    card_id,
                    plan_name,
                    duration_days,
                    allowed_books,
                    start_date: subscriptionStartDate,
                    end_date: subscriptionEndDate,
                    is_active,
                    createdbyid: req.userinfo?.id,
                    lastmodifiedbyid: req.userinfo?.id,
                    createddate: new Date(),
                    lastmodifieddate: new Date(),
                };

                console.log("Prepared subscription data:", subscriptionData);


                const columns = Object.keys(subscriptionData);
                const values = Object.values(subscriptionData);
                const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
                const columnNames = columns.join(', ');

                const insertQuery = `
                INSERT INTO demo.subscriptions (${columnNames})
                VALUES (${placeholders})
                RETURNING *
            `;

                console.log("Insert query:", insertQuery);
                console.log("Values:", values);

                const result = await sql.query(insertQuery, values);
                const newSubscription = result.rows[0];

                console.log("New subscription created:", newSubscription);


                await sql.query(
                    "UPDATE demo.library_members SET plan_id = $1 WHERE id = $2",
                    [plan_id, member_id]
                );

                res.status(201).json({
                    success: true,
                    message: "Subscription created successfully",
                    data: newSubscription
                });

            } catch (error) {
                console.error("Error creating subscription:", error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
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
            body("renewal").optional().isNumeric(),
            body("allowed_books").optional().isNumeric()
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(e => e.msg).join(", ");
                return res.status(400).json({ success: false, error: errorMessages });
            }
            console.log("REq body", req.body)
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
