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
const { fetchUser, checkPermission } = require("../middleware/fetchuser.js");
const Plan = require("../models/plan.model.js");
const sql = require("../models/db.js");

const { body, validationResult } = require('express-validator');

module.exports = (app) => {
    const router = express.Router();

    router.get("/", fetchUser, checkPermission("Plan", "allow_view"), async (req, res) => {
        try {
            Plan.init(req.userinfo.tenantcode);
            const data = await Plan.getAllPlans();
            return res.status(200).json({ success: true, data });
        } catch (err) {
            console.error(err);
            res.status(500).json({ errors: "Internal Server Error" });
        }
    });

    router.get("/:id", fetchUser, checkPermission("Plan", "allow_view"), async (req, res) => {
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
    router.post("/", fetchUser, checkPermission("Plan", "allow_create"), async (req, res) => {
        try {
            const { plan_name, duration_days, allowed_books, max_allowed_books_at_time, is_active } = req.body;


            if (!plan_name || !plan_name.trim()) {
                return res.status(400).json({ errors: "Plan name is required" });
            }
            if (!duration_days || duration_days <= 0) {
                return res.status(400).json({ errors: "Duration must be a positive number" });
            }


            if (max_allowed_books_at_time && allowed_books && max_allowed_books_at_time > allowed_books) {
                return res.status(400).json({
                    errors: "Max books allowed at a time cannot be greater than total allowed books"
                });
            }

            Plan.init(req.userinfo.tenantcode);

            const createdBy = req.userinfo.id;

            const result = await Plan.insertPlan({
                plan_name: plan_name.trim(),
                duration_days: parseInt(duration_days),
                allowed_books: allowed_books || 0,
                max_allowed_books_at_time: max_allowed_books_at_time || 0,
                is_active: is_active !== undefined ? is_active : true,
                createdbyid: createdBy,
            });

            return res.status(201).json({
                success: true,
                message: "Plan inserted successfully",
                data: result
            });
        } catch (err) {
            console.error(err);

            if (err.code === '23502') {
                return res.status(400).json({ errors: "Required field cannot be null" });
            }
            if (err.code === '23505') {
                return res.status(400).json({ errors: "Plan with this name already exists" });
            }

            res.status(500).json({ errors: "Internal Server Error" });
        }
    });

    router.put(
        "/:id",
        fetchUser,
        checkPermission("Plan", "allow_edit"),
        async (req, res) => {
            try {
                const { id } = req.params;
                const {
                    plan_name,
                    duration_days,
                    allowed_books,
                    max_allowed_books_at_time,
                    is_active
                } = req.body;

                // duration validation
                if (duration_days !== undefined) {
                    if (duration_days === null || duration_days === "" || duration_days <= 0) {
                        return res.status(400).json({
                            errors: [{
                                msg: "Duration must be a positive number",
                                param: "duration_days"
                            }]
                        });
                    }
                }

                // tenant init
                Plan.init(req.userinfo.tenantcode);

                // max books validation
                if (
                    max_allowed_books_at_time !== undefined &&
                    allowed_books !== undefined
                ) {
                    if (max_allowed_books_at_time > allowed_books) {
                        return res.status(400).json({
                            errors: [{
                                msg: "Max books allowed at a time cannot be greater than total allowed books",
                                param: "max_allowed_books_at_time"
                            }]
                        });
                    }
                }

                const updatedBy = req.userinfo.id;
                const updateData = { id };
                if (plan_name !== undefined) updateData.plan_name = plan_name;
                if (duration_days !== undefined)
                    updateData.duration_days = parseInt(duration_days);
                if (allowed_books !== undefined)
                    updateData.allowed_books = parseInt(allowed_books);
                if (max_allowed_books_at_time !== undefined)
                    updateData.max_allowed_books_at_time = parseInt(
                        max_allowed_books_at_time
                    );
                if (is_active !== undefined) updateData.is_active = is_active;

                updateData.lastmodifiedbyid = updatedBy;
                const fieldsToUpdate = Object.keys(updateData);
                if (fieldsToUpdate.length <= 2) {
                    return res.status(400).json({
                        errors: [{
                            msg: "No valid fields to update",
                            param: "general"
                        }]
                    });
                }

                const result = await Plan.updatePlan(updateData);

                if (!result) {
                    return res.status(404).json({ errors: "Plan not found" });
                }

                return res.status(200).json({
                    success: true,
                    message: "Plan updatedrtrtrt successfully",
                    data: result
                });
            } catch (err) {
                console.error(err);

                if (err.code === '23502') {
                    return res.status(400).json({
                        errors: "Required field cannot be null"
                    });
                }

                return res.status(500).json({
                    errors: "Internal Server Error"
                });
            }
        }
    );


    // router.put("/:id", fetchUser,
    //     [
    //         body("plan_name")
    //             .trim()
    //             .notEmpty()
    //             .withMessage("Plan_Name is required"),

    //     ], async (req, res) => {

    //         const errors = validationResult(req);

    //         if (!errors.isEmpty()) {
    //             return res.status(400).json({
    //                 errors: errors.array()[0].msg
    //             });
    //         }
    //         try {

    //             const { id } = req.params;
    //             const userId = req.userinfo.id;
    //             Plan.init(req.userinfo.tenantcode);

    //             // const duplicateVendor = await Publisher.findByEmail(
    //             //     req.body.email,
    //             //     req.params.id
    //             // );

    //             // console.log("Duplicate vendor check:", duplicateVendor);

    //             // if (duplicateVendor) {
    //             //     return res
    //             //         .status(400)
    //             //         .json({ errors: "Publisher with this email already exists" });
    //             // }

    //             const data = await Plan.updatePlan(id, req.body, userId);
    //             return res.status(200).json({
    //                 success: true,
    //                 data,
    //                 message: "Publisher updated successfully"
    //             });
    //         } catch (error) {
    //             return res.status(500).json({
    //                 success: false,
    //                 error: "Internal Server Error",
    //                 message: error.message
    //             })
    //         }
    //     })


    router.delete("/:id", fetchUser, checkPermission("Plan", "allow_delete"), async (req, res) => {
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