/**
 * Handles all incoming request for /api/dashboard endpoint
 * dashboard related data 
 * dashboard.model.js
 * DB table for this ${schema}.authors
 * SUPPORTED API ENDPOINTS
 *              GET     /api/dashboard/stats
 *              GET     /api/dashboard/data
 * @author      Aabid
 * @date        Nov, 2025
 * @copyright   www.ibirdsservices.com
 */

const { fetchUser, checkPermission } = require("../middleware/fetchuser.js");
const Dashboard = require("../models/dashboad.model.js");

module.exports = (app) => {
    var router = require("express").Router();

    // Get general dashboard stats (Admin/Generic view)
    router.get("/", fetchUser, checkPermission("Dashboard", "allow_view"), async (req, res) => {
        try {
            Dashboard.init(req.userinfo.tenantcode, req.branchId);
            console.log("Fetching dashboard data for tenant:", req.userinfo.tenantcode);
            console.log("Fetching dashboard data for branch:", req.branchId);

            // Replaced fetchAll with getDashboardStats as fetchAll was removed in new model
            const result = await Dashboard.getDashboardStats();

            res.status(200).json({ success: true, data: result });
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    });

    // Redundant stats endpoint, kept for backward compatibility if needed, mapping to same function
    router.get("/stats", fetchUser, checkPermission("Dashboard", "allow_view"), async (req, res) => {
        try {
            Dashboard.init(req.userinfo.tenantcode, req.branchId);
            const result = await Dashboard.getDashboardStats();

            res.status(200).json({ success: true, data: result });

        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    });

    // Other metrics endpoint (restored for backward compatibility)
    router.get("/other-metrics", fetchUser, checkPermission("Dashboard", "allow_view"), async (req, res) => {
        try {
            Dashboard.init(req.userinfo.tenantcode, req.branchId);
            // Since getOtherMetrics is removed, we return the main stats as fallback to avoid 404
            const result = await Dashboard.getDashboardStats();
            res.status(200).json({ success: true, data: result });

        } catch (error) {
            console.error("Error fetching other metrics:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    });

    // Role-based dashboard data (Student vs Admin) - Restored route path to "/dashboard"
    router.get("/dashboard", fetchUser, async (req, res) => {
        try {
            Dashboard.init(req.userinfo.tenantcode, req.branchId);
            const userRole = req.userinfo.userrole ? req.userinfo.userrole.toUpperCase() : null;

            // Check if user is a student
            // Adjusted logic to check common student role names
            if (userRole === "STUDENT" || userRole === "LIBRARY MEMBER") {
                const stats = await Dashboard.getStudentDashboardStats(req.userinfo.id);
                return res.status(200).json({ success: true, data: stats, role: "student" });
            }

            // For admins/staff
            const stats = await Dashboard.getDashboardStats();
            return res.status(200).json({ success: true, data: stats, role: "admin" });
        } catch (error) {
            console.error("Error fetching role-based dashboard stats:", error);
            return res.status(500).json({ success: false, errors: "Internal server error" });
        }
    });

    app.use(process.env.BASE_API_URL + "/api/dashboard", router);
};
