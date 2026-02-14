/**
 * Handles all incoming request for /api/reports endpoint
 * DB table for this public.reports
 * Model used here is reports.model.js
 * SUPPORTED API ENDPOINTS
 *              GET     /api/reports
 *              POST    /api/reports
 *
 * @author      Aabid
 * @date        Jan 2026
 * @copyright   www.ibirdsservices.com
 */

const { fetchUser, checkPermission } = require("../middleware/fetchuser.js");
const Report = require("../models/reports.model.js");

module.exports = (app) => {
  const { body, validationResult } = require("express-validator");

  var router = require("express").Router();

  router.get(
    "/",
    fetchUser,
    // checkPermission("Reports", "allow_view"),
    async (req, res) => {
      try {
        Report.init(req.userinfo.tenantcode);
        const reports = await Report.findAll();
        console.log("Reports->>", reports)
        res.json({ records: reports });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );
  router.get(
    "/inactive-books",
    fetchUser,
    checkPermission("Reports", "allow_view"),
    async (req, res) => {
      try {
        Report.init(req.userinfo.tenantcode);

        const data = await Report.getInactiveBooks(req.query);

        return res.status(200).json({
          success: true,
          count: data.length,
          records: data,
        });

      } catch (error) {
        console.error("Inactive Books Error:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  );


  router.get(
    "/book-borrowing",
    fetchUser,
    checkPermission("Reports", "allow_view"),
    async (req, res) => {
      try {
        Report.init(req.userinfo.tenantcode);

        const data = await Report.getBorrowingReport(req.query);

        return res.status(200).json({
          success: true,
          total_records: data.length,
          records: data,
        });

      } catch (error) {
        console.error("Borrowing Report Error:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  );

  router.post(
    "/",
    fetchUser,
    checkPermission("Reports", "allow_create"),
    [
      body("report_name")
        .notEmpty()
        .withMessage("Report name is required"),
      body("api_name")
        .notEmpty()
        .withMessage("API name is required"),
      body("company_id")
        .optional()
        .isUUID()
        .withMessage("Company ID must be a valid UUID"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        Report.init(req.userinfo.tenantcode);

        const userId = req.userinfo?.id || null;
        const report = await Report.create(req.body, userId);
        if (!report) {
          return res.status(400).json({ errors: "Failed to create report" });
        }
        return res.status(200).json({ success: true, data: report });
      } catch (error) {
        console.error("Error creating report:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );






  app.use(process.env.BASE_API_URL + "/api/reports", router);
};
