/**
 * Handles all incoming request for /api/purchasevendor endpoint
 * DB table for this demo.vendors (renamed from purchase_vendors)
 * Model used here is purchasevendor.model.js
 * SUPPORTED API ENDPOINTS
 *              GET     /api/purchasevendor
 *              GET     /api/purchasevendor/:id
 *              POST    /api/purchasevendor
 *              PUT     /api/purchasevendor/:id
 *              DELETE  /api/purchasevendor/:id
 *
 *@author     Muskan Khan
@date   DEC,   2025
 * @copyright   www.ibirdsservices.com
 */

const e = require("express");
const { fetchUser } = require("../middleware/fetchuser.js");
const Vendor = require("../models/vendor.model.js");

module.exports = (app) => {
  const { body, validationResult } = require("express-validator");

  var router = require("express").Router();

  // Get all vendors (ADMIN and ADMIN)
  router.get("/", fetchUser,  async (req, res) => {
    try {
      Vendor.init(req.userinfo.tenantcode);
      const vendors = await Vendor.findAll();
      return res.status(200).json(vendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // Get vendor by ID (ADMIN and ADMIN)
  router.get("/:id", fetchUser,async (req, res) => {
    try {
      Vendor.init(req.userinfo.tenantcode);
      const vendor = await Vendor.findById(req.params.id);
      if (!vendor) {
        return res.status(404).json({ errors: "Vendor not found" });
      }
      return res.status(200).json(vendor);
    } catch (error) {
      console.error("Error fetching vendor:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // Create a new vendor (ADMIN and ADMIN)
  router.post(
    "/",
    fetchUser,
  
    [
      // Allow empty name for barcode scanning - will use default in model
      body("name").optional().custom((value) => {
        return true;
      }),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        Vendor.init(req.userinfo.tenantcode);
        
        // Check for duplicate name
        if (req.body.name) {
          const existingVendor = await Vendor.findByName(req.body.name);
          if (existingVendor) {
            return res
              .status(400)
              .json({ errors: "Vendor with this name already exists" });
          }
        }

        const userId = req.userinfo.id;
        const vendor = await Vendor.create(req.body, userId);
        if (!vendor) {
          return res.status(400).json({ errors: "Failed to create vendor" });
        }
        return res.status(200).json({ success: true, data: vendor });
      } catch (error) {
        console.error("Error creating vendor:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );

  // Update vendor by ID (ADMIN and ADMIN)
  router.put(
    "/:id",
    fetchUser,
    
    [
      body("name").notEmpty().withMessage("Name is required"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        Vendor.init(req.userinfo.tenantcode);
        
        // Check if vendor exists
        const existingVendor = await Vendor.findById(req.params.id);
        if (!existingVendor) {
          return res.status(404).json({ errors: "Vendor not found" });
        }

        // Check for duplicate name (excluding current vendor)
        const duplicateVendor = await Vendor.findByName(
          req.body.name,
          req.params.id
        );
        if (duplicateVendor) {
          return res
            .status(400)
            .json({ errors: "Vendor with this name already exists" });
        }

        const userId = req.userinfo.id;
        const vendor = await Vendor.updateById(req.params.id, req.body, userId);
        if (!vendor) {
          return res.status(400).json({ errors: "Failed to update vendor" });
        }
        return res.status(200).json({ success: true, data: vendor });
      } catch (error) {
        console.error("Error updating vendor:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );

  // Delete vendor by ID (ADMIN and ADMIN)
  router.delete("/:id", fetchUser,  async (req, res) => {
    try {
      Vendor.init(req.userinfo.tenantcode);
      const result = await Vendor.deleteById(req.params.id);
      if (!result.success) {
        return res.status(404).json({ errors: result.message });
      }
      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      console.error("Error deleting vendor:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  app.use(process.env.BASE_API_URL + "/api/purchasevendor", router);
};

