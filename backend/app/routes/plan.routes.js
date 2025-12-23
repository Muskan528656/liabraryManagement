/**
 * Handles all incoming requests for /api/plan endpoint
 * DB table: <schema>.plan
 * Model: plan.model.js
 *
 * SUPPORTED API ENDPOINTS
 *    GET     /api/plan
 *    GET     /api/plan/:id
 *    POST    /api/plan
 *    PUT     /api/plan/:id
 *    DELETE  /api/plan/:id
 *
 * @author
 * @date        Jan, 2025
 */

const express = require("express");
const { fetchUser } = require("../middleware/fetchuser.js");
const Plan = require("../models/plan.model.js");
const sql = require("../models/db.js");

module.exports = (app) => {
    const router = express.Router();

    router.get("/", fetchUser, async (req, res) => {
        try {
            Plan.init(req.userinfo.tenantcode);
            const data = await Plan.getAllPlans();
            return res.status(200).json({ success: true, data });
        } catch (err) {
            console.error(err);
            res.status(500).json({ errors: "Internal Server Error" });
        }
    });

    router.get("/:id", fetchUser, async (req, res) => {
        try {
            const id = req.params.id;

            if (!id) {
                return res.status(400).json({ errors: "Plan ID is required" });
            }

            Plan.init(req.userinfo.tenantcode);
            const data = await Plan.getPlanById(id);

            return res.status(200).json({ success: true, data });
        } catch (err) {
            console.error(err);
            res.status(500).json({ errors: "Internal Server Error" });
        }
    });

    router.post("/", fetchUser, async (req, res) => {
        try {
            const { plan_name, duration_days, allowed_books, max_allowed_books_at_time } = req.body;

            if (!plan_name || !duration_days) {
                return res
                    .status(400)
                    .json({ errors: "plan_name and duration_days are required" });
            }

            Plan.init(req.userinfo.tenantcode);

            const createdBy = req.userinfo.id;

            const result = await Plan.insertPlan({
                plan_name,
                duration_days,
                allowed_books: allowed_books || 0,
                max_allowed_books_at_time: max_allowed_books_at_time || 0,
                createdbyid: createdBy,
            });

            return res.status(201).json({
                success: true,
                message: "Plan inserted successfully",
                data: result
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ errors: "Internal Server Error" });
        }
    });

    router.put("/:id", fetchUser, async (req, res) => {
        try {
            const { plan_name, duration_days, is_active, allowed_books, max_allowed_books_at_time } = req.body;
            const id = req.params.id;

            if (!id) {
                return res.status(400).json({ errors: "Plan ID is required" });
            }

            Plan.init(req.userinfo.tenantcode);

            const lastModifiedBy = req.userinfo.id;

 
            const result = await Plan.updatePlan({
                id,
                plan_name,
                is_active,
                duration_days,
                allowed_books,
                max_allowed_books_at_time,
                lastmodifiedbyid: lastModifiedBy,
            });

            const schema = req.userinfo.tenantcode;

 
            const updateFields = {};
            if (plan_name !== undefined) updateFields.plan_name = plan_name;
            if (duration_days !== undefined) updateFields.duration_days = duration_days;
            if (allowed_books !== undefined) updateFields.allowed_books = allowed_books;

            if (Object.keys(updateFields).length > 0) {
                updateFields.lastmodifiedbyid = lastModifiedBy;
                updateFields.lastmodifieddate = new Date();

                const setClause = Object.keys(updateFields).map((key, index) => `"${key}" = $${index + 2}`).join(', ');
                const values = [id, ...Object.values(updateFields)];

                const updateQuery = `UPDATE ${schema}.subscriptions SET ${setClause} WHERE plan_id = $1`;
                await sql.query(updateQuery, values);
            }

 
            if (duration_days !== undefined) {
                const recalcQuery = `
                    UPDATE ${schema}.subscriptions
                    SET end_date = start_date + INTERVAL '${duration_days} days'
                    WHERE plan_id = $1
                `;
                await sql.query(recalcQuery, [id]);
            }

            return res.status(200).json({
                success: true,
                message: "Plan updated successfully",
                data: result,
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ errors: "Internal Server Error" });
        }
    });

    router.delete("/:id", fetchUser, async (req, res) => {
        try {
            const id = req.params.id;

            if (!id) {
                return res.status(400).json({ errors: "Plan ID is required" });
            }

            Plan.init(req.userinfo.tenantcode);

            const result = await Plan.deletePlan(id);

            return res.status(200).json({
                success: true,
                message: "Plan deleted successfully",
                data: result
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ errors: "Internal Server Error" });
        }
    });

    app.use(process.env.BASE_API_URL + "/api/plans", router);
};