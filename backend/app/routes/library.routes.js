/**
 * Handles all incoming request for /api/library endpoint
 * Model used here is library.model.js
 * SUPPORTED API ENDPOINTS
 *              GET     /api/library/dashboard
 *
 *@author     Muskan Khan
@date   DEC,   2025
 * @copyright   www.ibirdsservices.com
 */

const e = require("express");
const { fetchUser } = require("../middleware/fetchuser.js");
const Library = require("../models/library.model.js");

module.exports = (app) => {
  var router = require("express").Router();
  router.get("/dashboard", fetchUser, async (req, res) => {
    try {
      Library.init(req.userinfo.tenantcode);
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


  app.use(process.env.BASE_API_URL + "/api/library", router);
};

