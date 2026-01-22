
const express = require('express');
const router = express.Router();
const Publisher = require('../models/Publisher.model.js');
const { fetchUser, checkPermission } = require('../middleware/fetchuser.js');
const { body, validationResult } = require('express-validator');


module.exports = (app) => {


    router.get("/", fetchUser, checkPermission("Publisher", "allow_view"), async (req, res) => {
        try {
            Publisher.init(req.userinfo.tenantcode);
            const data = await Publisher.findAllPublisher(req.query);
            return res.status(200).json({
                success: true,
                data,
                message: data.length ? "Publishers retrieved successfully" : "No publishers found"
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: "Internal Server Error",
                message: error.message
            })

        }
    })


    router.get("/:id", fetchUser, checkPermission("Publisher", "allow_view"), async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "Publisher ID is required"
                });
            }
            Publisher.init(req.userinfo.tenantcode);
            const data = await Publisher.findPublisherById(id);
            return res.status(200).json({
                success: true,
                data,
                message: data ? "Publisher retrieved successfully" : "Publisher not found"
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: "Internal Server Error",
                message: error.message
            })
        }
    })


    router.post("/", fetchUser, checkPermission("Publisher", "allow_create"), [
        body('name', 'Name is required').not().isEmpty(),
        body('email', 'Valid email is required').isEmail(),
        body('phone', 'Phone number is required').isLength({ min: 10, max: 15 }),
        body('city', 'City is required').not().isEmpty(),
        body('country', 'Country is required').not().isEmpty()
    ], async (req, res) => {
 
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
 
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }
        try {
            const userId = req.userinfo.id;
 
 
            Publisher.init(req.userinfo.tenantcode);
            const data = await Publisher.insertPublisher(req.body, userId);
            return res.status(201).json({
                success: true,
                data,
                message: "Publisher inserted successfully"
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: "Internal Server Error",
                message: error.message
            })
        }
    })

 
    router.put("/:id", [
        body("name")
            .trim()
            .notEmpty()
            .withMessage("Name is required"),

        body("email")
            .trim()
            .toLowerCase()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Please enter a valid email address"),

        body("phone")
            .trim()
            .notEmpty()
            .withMessage("Phone is required")
            .isNumeric()
            .withMessage("Phone number must contain only digits")
    ], fetchUser, checkPermission("Publisher", "allow_edit"), async (req, res) => {

        const errors = validationResult(req);
 
        if (!errors.isEmpty()) {
 
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }
        try {

            const { id } = req.params;
            const userId = req.userinfo.id;
            Publisher.init(req.userinfo.tenantcode);
            const data = await Publisher.updatePublisherByid(id, req.body, userId);
            return res.status(200).json({
                success: true,
                data,
                message: "Publisher updated successfully"
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: "Internal Server Error",
                message: error.message
            })
        }
    })


    router.delete("/:id", fetchUser, checkPermission("Publisher", "allow_delete"), async (req, res) => {
        try {
            const { id } = req.params;
            Publisher.init(req.userinfo.tenantcode);
            const result = await Publisher.deletePublisherById(id, req.body);
            if (result.success) {
                return res.status(200).json({
                    success: true,
                    data: result.data,
                    message: result.message || "Publisher deleted successfully"
                });
            } else {
                return res.status(404).json({
                    success: false,
                    error: "Not Found",
                    message: result.message || "Publisher not found"
                });
            }
        } catch (error) {
            console.error("Errorin delete publisher route:", error)
            return res.status(500).json({
                success: false,
                error: "Internal Server Error",
                message: error.message
            })
        }
    });

    app.use(process.env.BASE_API_URL + "/api/publisher", router);
}