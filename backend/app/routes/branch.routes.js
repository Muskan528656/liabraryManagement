/**
 * Handles all incoming request for /api/branch endpoint
 * DB table: ${schema}.branches
 * Model: branch.model.js
 * 
 * SUPPORTED API ENDPOINTS
 *   GET     /api/branch
 *   GET     /api/branch/:id
 *   GET     /api/branch/code/:code
 *   GET     /api/branch/city/:city
 *   GET     /api/branch/country/:country
 *   GET     /api/branch/search
 *   GET     /api/branch/statistics
 *   POST    /api/branch
 *   PUT     /api/branch/:id
 *   PUT     /api/branch/:id/toggle-status
 *   DELETE  /api/branch/:id
 *   POST    /api/branch/bulk
 *
 * @author      Muskan Khan
 * @date        FEB, 2026
 * @copyright   www.ibirdsservices.com
 */

const { fetchUser, checkPermission } = require("../middleware/fetchuser.js");
const Branch = require("../models/branch.model.js");
const { body, validationResult } = require("express-validator");

module.exports = (app) => {

    var router = require("express").Router();

    // ==================== GET ROUTES ====================

    /**
     * GET ALL BRANCHES
     */
    router.get(
        "/",
        fetchUser,
        checkPermission("Branches", "allow_view"),
        async (req, res) => {
            try {
                Branch.init(req.userinfo.tenantcode);
                const branches = await Branch.findAll();
                res.json({
                    success: true,
                    data: branches,
                    count: branches.length
                });
            } catch (err) {
                console.error("Error fetching branches:", err);
                res.status(500).json({
                    success: false,
                    error: "Internal server error"
                });
            }
        }
    );

    /**
     * GET BRANCH STATISTICS
     */
    router.get(
        "/statistics",
        fetchUser,
        checkPermission("Branches", "allow_view"),
        async (req, res) => {
            try {
                Branch.init(req.userinfo.tenantcode);
                const statistics = await Branch.getStatistics();
                res.json({
                    success: true,
                    data: statistics
                });
            } catch (err) {
                console.error("Error fetching branch statistics:", err);
                res.status(500).json({
                    success: false,
                    error: "Internal server error"
                });
            }
        }
    );

    /**
     * SEARCH BRANCHES
     */
    router.get(
        "/search",
        fetchUser,
        checkPermission("Branches", "allow_view"),
        async (req, res) => {
            try {
                const { q } = req.query;

                if (!q) {
                    return res.status(400).json({
                        success: false,
                        error: "Search term is required"
                    });
                }

                Branch.init(req.userinfo.tenantcode);
                const branches = await Branch.search(q);

                res.json({
                    success: true,
                    data: branches,
                    count: branches.length
                });
            } catch (err) {
                console.error("Error searching branches:", err);
                res.status(500).json({
                    success: false,
                    error: "Internal server error"
                });
            }
        }
    );

    /**
     * GET BRANCH BY ID
     */
    router.get(
        "/:id",
        fetchUser,
        checkPermission("Branches", "allow_view"),
        async (req, res) => {
            try {
                Branch.init(req.userinfo.tenantcode);
                const branch = await Branch.findById(req.params.id);

                if (!branch) {
                    return res.status(404).json({
                        success: false,
                        error: "Branch not found"
                    });
                }

                return res.status(200).json({
                    success: true,
                    data: branch
                });

            } catch (error) {
                console.error("Error fetching branch:", error);
                return res.status(500).json({
                    success: false,
                    error: "Internal server error"
                });
            }
        }
    );

    /**
     * GET BRANCH BY CODE
     */
    router.get(
        "/code/:code",
        fetchUser,
        checkPermission("Branches", "allow_view"),
        async (req, res) => {
            try {
                Branch.init(req.userinfo.tenantcode);
                const branchCode = decodeURIComponent(req.params.code);
                const branch = await Branch.findByCode(branchCode);

                if (!branch) {
                    return res.status(404).json({
                        success: false,
                        error: "Branch not found"
                    });
                }

                return res.status(200).json({
                    success: true,
                    data: branch
                });

            } catch (error) {
                console.error("Error fetching branch by code:", error);
                return res.status(500).json({
                    success: false,
                    error: "Internal server error"
                });
            }
        }
    );

    /**
     * GET BRANCHES BY CITY
     */
    router.get(
        "/city/:city",
        fetchUser,
        checkPermission("Branches", "allow_view"),
        async (req, res) => {
            try {
                Branch.init(req.userinfo.tenantcode);
                const city = decodeURIComponent(req.params.city);
                const branches = await Branch.findByCity(city);

                res.json({
                    success: true,
                    data: branches,
                    count: branches.length
                });

            } catch (error) {
                console.error("Error fetching branches by city:", error);
                return res.status(500).json({
                    success: false,
                    error: "Internal server error"
                });
            }
        }
    );

    /**
     * GET BRANCHES BY COUNTRY
     */
    router.get(
        "/country/:country",
        fetchUser,
        checkPermission("Branches", "allow_view"),
        async (req, res) => {
            try {
                Branch.init(req.userinfo.tenantcode);
                const country = decodeURIComponent(req.params.country);
                const branches = await Branch.findByCountry(country);

                res.json({
                    success: true,
                    data: branches,
                    count: branches.length
                });

            } catch (error) {
                console.error("Error fetching branches by country:", error);
                return res.status(500).json({
                    success: false,
                    error: "Internal server error"
                });
            }
        }
    );

    // ==================== POST ROUTES ====================

    /**
     * CREATE NEW BRANCH
     */
    router.post(
        "/",
        fetchUser,
        checkPermission("Branches", "allow_create"),
        [
            body("branch_code")
                .notEmpty()
                .withMessage("Branch code is required")
                .isLength({ min: 2, max: 20 })
                .withMessage("Branch code must be between 2 and 20 characters")
                .matches(/^[A-Z0-9]+$/)
                .withMessage("Branch code must contain only uppercase letters and numbers"),

            body("branch_name")
                .notEmpty()
                .withMessage("Branch name is required")
                .isLength({ min: 3, max: 150 })
                .withMessage("Branch name must be between 3 and 150 characters"),

            body("country")
                .notEmpty()
                .withMessage("Country is required"),

            body("pincode")
                .optional()
                .matches(/^\d{6}$/)
                .withMessage("Pincode must be 6 digits"),

            body("is_active")
                .optional()
                .isBoolean()
                .withMessage("is_active must be a boolean")
        ],
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({
                        success: false,
                        errors: errors.array()
                    });
                }

                Branch.init(req.userinfo.tenantcode);

                // Check for duplicate branch code
                const existingBranch = await Branch.findByCode(req.body.branch_code);
                if (existingBranch) {
                    return res.status(400).json({
                        success: false,
                        error: `Branch with code '${req.body.branch_code}' already exists`
                    });
                }

                const userId = req.userinfo?.id || null;
                const branch = await Branch.create(req.body, userId);

                if (!branch) {
                    return res.status(400).json({
                        success: false,
                        error: "Failed to create branch"
                    });
                }

                return res.status(201).json({
                    success: true,
                    message: "Branch created successfully",
                    data: branch
                });

            } catch (error) {
                console.error("Error creating branch:", error);
                return res.status(500).json({
                    success: false,
                    error: error.message || "Internal server error"
                });
            }
        }
    );

    /**
     * BULK CREATE BRANCHES (Import)
     */
    router.post(
        "/bulk",
        fetchUser,
        checkPermission("Branches", "allow_create"),
        async (req, res) => {
            try {
                Branch.init(req.userinfo.tenantcode);

                const branchesData = req.body;
                if (!Array.isArray(branchesData)) {
                    return res.status(400).json({
                        success: false,
                        error: "Request body must be an array of branch objects"
                    });
                }

                const userId = req.userinfo?.id || null;
                const result = await Branch.bulkCreate(branchesData, userId);

                return res.status(200).json({
                    success: true,
                    message: `Created ${result.success} branches, ${result.failed} failed`,
                    data: result
                });

            } catch (error) {
                console.error("Error in bulk create branches:", error);
                return res.status(500).json({
                    success: false,
                    error: error.message || "Internal server error"
                });
            }
        }
    );

    // ==================== PUT ROUTES ====================

    /**
     * UPDATE BRANCH BY ID
     */
    router.put(
        "/:id",
        fetchUser,
        checkPermission("Branches", "allow_edit"),
        [
            body("branch_code")
                .optional()
                .isLength({ min: 2, max: 20 })
                .withMessage("Branch code must be between 2 and 20 characters")
                .matches(/^[A-Z0-9]+$/)
                .withMessage("Branch code must contain only uppercase letters and numbers"),

            body("branch_name")
                .optional()
                .isLength({ min: 3, max: 150 })
                .withMessage("Branch name must be between 3 and 150 characters"),

            body("pincode")
                .optional()
                .matches(/^\d{6}$/)
                .withMessage("Pincode must be 6 digits"),

            body("is_active")
                .optional()
                .isBoolean()
                .withMessage("is_active must be a boolean")
        ],
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({
                        success: false,
                        errors: errors.array()
                    });
                }

                Branch.init(req.userinfo.tenantcode);

                // Check if branch exists
                const existingBranch = await Branch.findById(req.params.id);
                if (!existingBranch) {
                    return res.status(404).json({
                        success: false,
                        error: "Branch not found"
                    });
                }

                // Check for duplicate branch code if updating
                if (req.body.branch_code && req.body.branch_code !== existingBranch.branch_code) {
                    const duplicateBranch = await Branch.findByCode(req.body.branch_code, req.params.id);
                    if (duplicateBranch) {
                        return res.status(400).json({
                            success: false,
                            error: `Branch with code '${req.body.branch_code}' already exists`
                        });
                    }
                }

                const userId = req.userinfo?.id || null;
                const branch = await Branch.updateById(req.params.id, req.body, userId);

                if (!branch) {
                    return res.status(400).json({
                        success: false,
                        error: "Failed to update branch"
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Branch updated successfully",
                    data: branch
                });

            } catch (error) {
                console.error("Error updating branch:", error);
                return res.status(500).json({
                    success: false,
                    error: error.message || "Internal server error"
                });
            }
        }
    );

    /**
     * TOGGLE BRANCH STATUS
     */
    router.put(
        "/:id/toggle-status",
        fetchUser,
        checkPermission("Branches", "allow_edit"),
        [
            body("is_active")
                .notEmpty()
                .withMessage("is_active is required")
                .isBoolean()
                .withMessage("is_active must be a boolean")
        ],
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({
                        success: false,
                        errors: errors.array()
                    });
                }

                Branch.init(req.userinfo.tenantcode);

                const branch = await Branch.toggleStatus(
                    req.params.id,
                    req.body.is_active,
                    req.userinfo?.id || null
                );

                if (!branch) {
                    return res.status(404).json({
                        success: false,
                        error: "Branch not found"
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: `Branch ${branch.is_active ? 'activated' : 'deactivated'} successfully`,
                    data: branch
                });

            } catch (error) {
                console.error("Error toggling branch status:", error);
                return res.status(500).json({
                    success: false,
                    error: error.message || "Internal server error"
                });
            }
        }
    );

    // ==================== DELETE ROUTES ====================

    /**
     * DELETE BRANCH BY ID
     */
    router.delete(
        "/:id",
        fetchUser,
        checkPermission("Branches", "allow_delete"),
        async (req, res) => {
            try {
                Branch.init(req.userinfo.tenantcode);

                const result = await Branch.deleteById(req.params.id);

                if (!result.success) {
                    return res.status(result.message.includes("not found") ? 404 : 400).json({
                        success: false,
                        error: result.message
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: result.message
                });

            } catch (error) {
                console.error("Error deleting branch:", error);
                return res.status(500).json({
                    success: false,
                    error: error.message || "Internal server error"
                });
            }
        }
    );

    // Register router
    app.use(process.env.BASE_API_URL + "/api/branches", router);
};