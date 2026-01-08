/**
 * Handles all incoming request for /api/vendor endpoint
 * DB table for this demo.vendors (renamed from purchase_vendors)
 * Model used here is vendor.model.js
 * SUPPORTED API ENDPOINTS
 *              GET     /api/vendor
 *              GET     /api/vendor/:id
 *              POST    /api/vendor
 *              PUT     /api/vendor/:id
 *              DELETE  /api/vendor/:id
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


  router.get("/", fetchUser, async (req, res) => {
    try {
      Vendor.init(req.userinfo.tenantcode);
      const vendors = await Vendor.findAll();
      return res.status(200).json(vendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });


  router.get("/:id", fetchUser, async (req, res) => {
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

  router.post(
    "/",
    fetchUser,
    // [
    //   body("name").optional().custom((value) => {
    //     return true;
    //   }),
    // ],
    async (req, res) => {
      try {

        // console.log("Vendor data-->:", req.body);

        // const errors = validationResult(req);

        // console.log("Validation vendor errors:", errors);

        // if (!errors.isEmpty()) {
        //   return res.status(400).json({ errors: errors.array() });
        // }

        Vendor.init(req.userinfo.tenantcode);

        // Check for duplicate vendor by email
        if (req.body.email) {
          const existingVendor = await Vendor.findByEmail(req.body.email);
          if (existingVendor) {
            return res
              .status(400)
              .json({ errors: "Vendor with this email already exists" });
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


  router.put(
    "/:id",
    fetchUser,
    [
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
      // .isLength({ min: 10, max: 10 })
      // .withMessage("Phone number must be 10 digits"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
          return res.status(400).json({
            errors: errors.array()[0].msg
          });
        }

        Vendor.init(req.userinfo.tenantcode);

        const existingVendor = await Vendor.findById(req.params.id);
        if (!existingVendor) {
          return res.status(404).json({
            message: "Vendor not found"
          });
        }

        const duplicateVendor = await Vendor.findByEmail(
          req.body.email,
          req.params.id
        );

        console.log("Duplicate vendor check:", duplicateVendor);

        if (duplicateVendor) {
          return res
            .status(400)
            .json({ errors: "Vendor with this email already exists" });
        } else {

        }

        const userId = req.userinfo.id;
        const vendor = await Vendor.updateById(
          req.params.id,
          req.body,
          userId
        );

        return res.status(200).json({
          success: true,
          data: vendor
        });
      } catch (error) {
        console.error("Error updating vendor:", error);
        return res.status(500).json({
          message: error.message
        });
      }
    }
  );


  router.delete("/:id", fetchUser, async (req, res) => {
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


  app.use(process.env.BASE_API_URL + "/api/vendor", router);

};

