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
            body("user_id", "user_id is required").notEmpty(),
            body("card_id", "card_id is required").notEmpty(),
            body("plan_name", "plan_name is required").notEmpty(),
            body("duration_days").notEmpty(),
            body("allowed_books").notEmpty(),
            body("start_date").optional().isISO8601(),
            body("end_date").optional().isISO8601(),
            body("is_active").optional().isBoolean()
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
                    is_active = true
                } = req.body;

 

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

                const memberExists = await sql.query(
                    "SELECT id FROM demo.library_members WHERE id = $1",
                    [member_id]
                );

                if (!memberExists.rows.length) {
                    return res.status(404).json({
                        success: false,
                        error: "Member not found"
                    });
                }


                const userExists = await sql.query(
                    "SELECT id FROM demo.library_members WHERE id = $1",
                    [user_id]
                );

                if (!userExists.rows.length) {
                    return res.status(404).json({
                        success: false,
                        error: "User not found"
                    });
                }


                const cardExists = await sql.query(
                    "SELECT id FROM demo.library_members WHERE id = $1",
                    [card_id]
                );

                if (!cardExists.rows.length) {
                    return res.status(404).json({
                        success: false,
                        error: "Library card not found"
                    });
                }


                const existingSubscription = await sql.query(
                    `SELECT id FROM demo.subscriptions
                 WHERE member_id = $1
                 AND is_active = true
                 AND (end_date IS NULL OR end_date > CURRENT_DATE)`,
                    [member_id]
                );

                if (existingSubscription.rows.length > 0) {
                    return res.status(400).json({
                        success: false,
                        error: "Member already has an active subscription"
                    });
                }


                const subscriptionStartDate = start_date || new Date().toISOString().split('T')[0];

                let subscriptionEndDate = end_date;
                if (!subscriptionEndDate && duration_days) {
                    const end = new Date(subscriptionStartDate);
                    end.setDate(end.getDate() + parseInt(duration_days));
                    subscriptionEndDate = end.toISOString().split('T')[0];
                }


 
 
 


                const createdById = req.userinfo?.id;






                let createdByIdValue;


                try {
                    const userQuery = await sql.query(
                        "SELECT id FROM demo.user WHERE id = $1 OR user_id = $1",
                        [createdById]
                    );

                    if (userQuery.rows.length > 0) {
                        createdByIdValue = userQuery.rows[0].id;
 
                    } else {

                        createdByIdValue = createdById;
                    }
                } catch (dbError) {
 
                    createdByIdValue = createdById;
                }


                const subscriptionData = {
                    plan_id,
                    member_id,
                    user_id,
                    card_id,
                    plan_name,
                    duration_days: duration_days || 30,
                    allowed_books: allowed_books || 5,
                    start_date: subscriptionStartDate,
                    end_date: subscriptionEndDate,
                    is_active,
                    createdbyid: createdByIdValue,
                    lastmodifiedbyid: createdByIdValue,
                    createddate: new Date(),
                    lastmodifieddate: new Date(),
                };

 


                const columns = Object.keys(subscriptionData);
                const values = Object.values(subscriptionData);
                const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
                const columnNames = columns.join(', ');

                const insertQuery = `
                INSERT INTO demo.subscriptions (${columnNames})
                VALUES (${placeholders})
                RETURNING *
            `;

 
 


                const result = await sql.query(insertQuery, values);
                const newSubscription = result.rows[0];

 


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
                console.error("Error details:", {
                    code: error.code,
                    message: error.message,
                    detail: error.detail,
                    where: error.where
                });


                if (error.code === '22P02') {

                    const match = error.message.match(/\$(\d+)/);
                    if (match) {
                        const paramIndex = parseInt(match[1]) - 1;
                        console.error(`Parameter $${match[1]} (index ${paramIndex}) is causing the error`);


                        try {
                            const values = Object.values(subscriptionData || {});
                            if (values[paramIndex] !== undefined) {
                                console.error(`Problematic value at index ${paramIndex}:`, values[paramIndex]);
                                console.error(`Type of value:`, typeof values[paramIndex]);
                            }
                        } catch (e) {
                            console.error("Could not get problematic value:", e.message);
                        }
                    }

                    return res.status(400).json({
                        success: false,
                        error: "Invalid input format. Please check all fields.",
                        details: error.message
                    });
                }

                res.status(500).json({
                    success: false,
                    error: "Internal server error",
                    details: error.message
                });
            }
        }
    );

    router.put(
        "/:id",
        fetchUser,
        [
            body("plan_id").optional().isUUID(),
            body("member_id").optional().isUUID(),
            body("user_id").optional().isUUID(),
            body("card_id").optional().isUUID(),
            body("plan_name").optional().notEmpty(),
            body("start_date").optional().isISO8601(),
            body("end_date").optional().isISO8601(),
            body("is_active").optional().isBoolean(),
            body("renewal").optional().isNumeric(),
            body("allowed_books").optional().isNumeric(),
            body("status").optional().isIn(["active", "inactive", "expired", "cancelled"])
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(e => e.msg).join(", ");
                return res.status(400).json({ success: false, error: errorMessages });
            }

 

            try {
                const subscriptionId = req.params.id;


                const subscriptionCheck = await sql.query(
                    "SELECT id FROM demo.subscriptions WHERE id = $1",
                    [subscriptionId]
                );

                if (!subscriptionCheck.rows.length) {
                    return res.status(404).json({
                        success: false,
                        error: "Subscription not found"
                    });
                }


                const modifiedById = req.userinfo?.id;
                let modifiedByIdFormatted = modifiedById;

                if (typeof modifiedById === 'number') {
                    modifiedByIdFormatted = `00000000-0000-0000-0000-${modifiedById.toString().padStart(12, '0')}`;
                } else if (typeof modifiedById === 'string' && !uuidRegex.test(modifiedById)) {
                    modifiedByIdFormatted = `00000000-0000-0000-0000-${modifiedById.padStart(12, '0')}`;
                }


                const updateData = {
                    ...req.body,
                    lastmodifiedbyid: modifiedByIdFormatted, // Use formatted ID
                    lastmodifieddate: new Date()
                };


                Object.keys(updateData).forEach(key => {
                    if (updateData[key] === null || updateData[key] === undefined) {
                        delete updateData[key];
                    }
                });


                const setClause = Object.keys(updateData)
                    .map((key, index) => `${key} = $${index + 2}`)
                    .join(', ');

                const values = [subscriptionId, ...Object.values(updateData)];

                const updateQuery = `
                UPDATE demo.subscriptions 
                SET ${setClause}
                WHERE id = $1
                RETURNING *
            `;

 
 

                const result = await sql.query(updateQuery, values);

                if (result.rows.length === 0) {
                    return res.status(404).json({
                        success: false,
                        error: "Subscription not found"
                    });
                }

                const updatedSubscription = result.rows[0];


                if (req.body.plan_id && req.body.member_id) {
                    await sql.query(
                        "UPDATE demo.library_members SET plan_id = $1 WHERE id = $2",
                        [req.body.plan_id, req.body.member_id]
                    );
                }

                res.status(200).json({
                    success: true,
                    message: "Subscription updated successfully",
                    data: updatedSubscription
                });

            } catch (error) {
                console.error("Error updating subscription:", error);

                if (error.code === '22P02') {
                    return res.status(400).json({
                        success: false,
                        error: "Invalid UUID format in update data",
                        details: error.message
                    });
                }

                res.status(500).json({
                    success: false,
                    error: "Internal server error",
                    details: error.message
                });
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

