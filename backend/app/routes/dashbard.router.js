/**
 * Handles all incoming request for /api/dashboard endpoint
 * dashboard related data 
 * dashboard.model.js
 * DB table for this demo.authors
 * SUPPORTED API ENDPOINTS
 *              GET     /api/dashboard/stats
 *              GET     /api/dashboard/other-metrics
 * @author      Aabid
 * @date        Nov, 2025
 * @copyright   www.ibirdsservices.com
 */

const { fetchUser, checkPermission } = require("../middleware/fetchuser.js");
const Dashboard = require("../models/dashboad.model.js");


module.exports = (app) => {
    var router = require("express").Router();
    router.get("/", fetchUser, checkPermission("Dashboard", "allow_view"), async (req, res) => {
        try {
            Dashboard.init(req.userinfo.tenantcode, req.branchId);
            const result = await Dashboard.fetchAll();

            res.status(200).json({ success: true, data: result });
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }

    });

    router.get("/stats", checkPermission("Dashboard", "allow_view"), async (req, res) => {
        try {

            Dashboard.init(req.userinfo.tenantcode, req.branchId);
            const result = await Dashboard.getDashboardStats();

            res.status(200).json({ success: true, data: result });

        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    });



    router.get("/other-metrics", checkPermission("Dashboard", "allow_view"), fetchUser, async (req, res) => {
        try {
             Dashboard.init(req.userinfo.tenantcode, req.branchId);
            const result = await Dashboard.getOtherMetrics();
            res.status(200).json({ success: true, data: result });

        } catch (error) {
            console.error("Error fetching other metrics:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }

    });
    router.get("/dashboard", fetchUser, async (req, res) => {
        try {
            Library.init(req.userinfo.tenantcode, req.branchId);
            const userRole = req.userinfo.userrole?.toUpperCase();

            if (userRole === "STUDENT") {
                const stats = await Library.getStudentDashboardStats(req.userinfo.id);
                return res.status(200).json({ success: true, data: stats, role: "student" });
            }
            const stats = await Library.getDashboardStats();
            return res.status(200).json({ success: true, data: stats, role: "admin" });
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            return res.status(500).json({ success: false, errors: "Internal server error" });
        }
    });


    app.use(process.env.BASE_API_URL + "/api/dashboard", router);
};

