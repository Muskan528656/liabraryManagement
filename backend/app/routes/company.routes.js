/**
 * Handles all incoming request for /api/company endpoint
 * DB table for this public.company
 * Model used here is company.model.js
 * SUPPORTED API ENDPOINTS
 *              GET     /api/company
 *              GET     /api/company/:id
 *              POST    /api/company
 *              PUT     /api/company/:id
 *              DELETE  /api/company/:id
 *
 * @author      Your Name
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */

const { fetchUser, checkModulePermission } = require("../middleware/fetchuser.js");
const Company = require("../models/company.model.js");

module.exports = (app) => {
  const { body, validationResult } = require("express-validator");

  var router = require("express").Router();

  // Get all companies
  router.get("/", fetchUser, async (req, res) => {
    try {
      Company.init(req.userinfo.tenantcode);
      const companies = await Company.findAll();
      return res.status(200).json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // Get company by ID
  router.get("/:id", fetchUser, async (req, res) => {
    try {
      Company.init(req.userinfo.tenantcode);
      const company = await Company.findById(req.params.id);
      if (!company) {
        return res.status(404).json({ errors: "Company not found" });
      }
      return res.status(200).json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // Get company by name
  router.get("/name/:name", fetchUser, async (req, res) => {
    try {
      Company.init(req.userinfo.tenantcode);
      const name = decodeURIComponent(req.params.name);
      const company = await Company.findByName(name);
      if (!company) {
        return res.status(404).json({ errors: "Company not found" });
      }
      return res.status(200).json(company);
    } catch (error) {
      console.error("Error fetching company by name:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // Create a new company
  router.post(
    "/",
    fetchUser,
    [
      body("name").notEmpty().withMessage("Company name is required"),
      body("userlicenses").isInt({ min: 0 }).withMessage("User licenses must be a non-negative integer"),
      body("systememail").isEmail().withMessage("Valid system email is required"),
      body("adminemail").isEmail().withMessage("Valid admin email is required"),
      body("isactive").isBoolean().withMessage("isActive must be a boolean value"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        Company.init(req.userinfo.tenantcode);

        // Check for duplicate company name
        const existingCompany = await Company.findByName(req.body.name);
        if (existingCompany) {
          return res
            .status(400)
            .json({ errors: "Company with this name already exists" });
        }

        const userId = req.user?.id || null;
        const company = await Company.create(req.body, userId);
        if (!company) {
          return res.status(400).json({ errors: "Failed to create company" });
        }
        return res.status(201).json({ success: true, data: company });
      } catch (error) {
        console.error("Error creating company:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );

  // Update company by ID
  router.put(
    "/:id",
    fetchUser,
    [
      body("name").notEmpty().withMessage("Company name is required"),
      body("userlicenses").isInt({ min: 0 }).withMessage("User licenses must be a non-negative integer"),
      body("systememail").isEmail().withMessage("Valid system email is required"),
      body("adminemail").isEmail().withMessage("Valid admin email is required"),
      body("isactive").isBoolean().withMessage("isActive must be a boolean value"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        Company.init(req.userinfo.tenantcode);

        // Check if company exists
        const existingCompany = await Company.findById(req.params.id);
        if (!existingCompany) {
          return res.status(404).json({ errors: "Company not found" });
        }

        // Check for duplicate company name (excluding current company)
        const duplicateCompany = await Company.findByName(
          req.body.name,
          req.params.id
        );
        if (duplicateCompany) {
          return res
            .status(400)
            .json({ errors: "Company with this name already exists" });
        }

        const userId = req.user?.id || null;
        const company = await Company.updateById(req.params.id, req.body, userId);
        if (!company) {
          return res.status(400).json({ errors: "Failed to update company" });
        }
        return res.status(200).json({ success: true, data: company });
      } catch (error) {
        console.error("Error updating company:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );

  // Delete company by ID
  router.delete("/:id", fetchUser, async (req, res) => {
    try {
      Company.init(req.userinfo.tenantcode);
      const result = await Company.deleteById(req.params.id);
      if (!result.success) {
        return res.status(404).json({ errors: result.message });
      }
      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      console.error("Error deleting company:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

   app.use( "/api/company", router);
};