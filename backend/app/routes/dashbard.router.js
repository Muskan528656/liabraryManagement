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

const { fetchUser } = require("../middleware/fetchuser.js");
const Dashboard = require("../models/dashboad.model.js");
console.log('connect dashbard');

module.exports = (app) => {
    var router = require("express").Router();
    router.get("/", fetchUser, async (req, res) => {
        try {

            const result = await Dashboard.fetchAll();
            console.log('dashboard fetch all result', result);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }

    });

    router.get("/stats", async (req, res) => {
        try {
            console.log('stats router connect');

            const result = await Dashboard.getDashboardStats();
            res.status(200).json({ success: true, data: result });

        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    });


 
    router.get("/other-metrics", fetchUser, async (req, res) => {
        try {
            const result = await Dashboard.getOtherMetrics();
            res.status(200).json({ success: true, data: result });

        } catch (error) {
            console.error("Error fetching other metrics:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }

    });


    app.use(process.env.BASE_API_URL + "/api/dashboard", router);
};

