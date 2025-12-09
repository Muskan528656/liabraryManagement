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
            const { plan_name, duration_days, allowed_books } = req.body;

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
                createdbyid: createdBy, // Changed from createdby to createdbyid
            });

            return res.status(201).json({
                message: "Plan inserted successfully",
                plan_id: result.id,
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ errors: "Internal Server Error" });
        }
    });




    router.put("/:id", fetchUser, async (req, res) => {
        try {
            const { plan_name, duration_days, is_active, allowed_books } = req.body;
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
                lastmodifiedbyid: lastModifiedBy, // Changed from lastmodifiedby to lastmodifiedbyid
            });

            return res.status(200).json({
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

            await Plan.deletePlan(id);

            return res.status(200).json({ message: "Plan deleted successfully" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ errors: "Internal Server Error" });
        }
    });


    app.use(process.env.BASE_API_URL + "/api/plans", router);
};