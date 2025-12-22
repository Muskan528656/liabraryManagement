/**
 * Handles all incoming request for /api/purchase endpoint
 * DB table for this demo.purchases
 * Model used here is purchase.model.js
 * SUPPORTED API ENDPOINTS
 *              GET     /api/purchase
 *              GET     /api/purchase/stats
 *              GET     /api/purchase/:id
 *              POST    /api/purchase
 *              PUT     /api/purchase/:id
 *              DELETE  /api/purchase/:id
 *
 *@author     Muskan Khan
@date   DEC,   2025
 * @copyright   www.ibirdsservices.com
 */

const e = require("express");
const { fetchUser, checkRole } = require("../middleware/fetchuser.js");
const Purchase = require("../models/purchase.model.js");

module.exports = (app) => {
  const { body, validationResult } = require("express-validator");

  var router = require("express").Router();

  router.get("/", fetchUser, async (req, res) => {
    try {
      console.log("reeeeeeeeeee",req.userinfo.tenantcode)
      Purchase.init(req.userinfo.tenantcode);
      const purchases = await Purchase.findAll();
      return res.status(200).json(purchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

 
  router.get("/stats", fetchUser, async (req, res) => {
    try {
      Purchase.init(req.userinfo.tenantcode);
      const stats = await Purchase.getStatistics();
      return res.status(200).json(stats);
    } catch (error) {
      console.error("Error fetching purchase statistics:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  router.get("/:id", fetchUser, async (req, res) => {
    try {
      Purchase.init(req.userinfo.tenantcode);
      const purchase = await Purchase.findById(req.params.id);
      if (!purchase) {
        return res.status(404).json({ errors: "Purchase not found" });
      }
      return res.status(200).json(purchase);
    } catch (error) {
      console.error("Error fetching purchase:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

 
  router.post(
    "/",
    fetchUser,

    [
      body("vendor_id").notEmpty().isUUID().withMessage("Vendor ID is required and must be a valid UUID"),
      body("book_id").notEmpty().isUUID().withMessage("Book ID is required and must be a valid UUID"),
      body("quantity").notEmpty().isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),
      body("unit_price").optional().isFloat({ min: 0 }).withMessage("Unit price must be a positive number"),
      body("purchase_date").optional().isISO8601().withMessage("Purchase date must be a valid date"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        Purchase.init(req.userinfo.tenantcode);
        const userId = req.userinfo.id;
        const purchase = await Purchase.create(req.body, userId);
        if (!purchase) {
          return res.status(400).json({ errors: "Failed to create purchase" });
        }
        return res.status(200).json({ success: true, data: purchase });
      } catch (error) {
        console.error("Error creating purchase:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );

 
  router.put(
    "/:id",
    fetchUser,
    [
      body("vendor_id").optional().isUUID().withMessage("Vendor ID must be a valid UUID"),
      body("book_id").optional().isUUID().withMessage("Book ID must be a valid UUID"),
      body("quantity").optional().isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),
      body("unit_price").optional().isFloat({ min: 0 }).withMessage("Unit price must be a positive number"),
      body("purchase_date").optional().isISO8601().withMessage("Purchase date must be a valid date"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        Purchase.init(req.userinfo.tenantcode);
        const existingPurchase = await Purchase.findById(req.params.id);
        if (!existingPurchase) {
          return res.status(404).json({ errors: "Purchase not found" });
        }

        const userId = req.userinfo.id;
        const purchase = await Purchase.updateById(req.params.id, req.body, userId);
        if (!purchase) {
          return res.status(400).json({ errors: "Failed to update purchase" });
        }
        return res.status(200).json({ success: true, data: purchase });
      } catch (error) {
        console.error("Error updating purchase:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );

 
  router.delete("/:id", fetchUser, async (req, res) => {
    try {
      Purchase.init(req.userinfo.tenantcode);
      const result = await Purchase.deleteById(req.params.id);
      if (!result.success) {
        return res.status(404).json({ errors: result.message });
      }
      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      console.error("Error deleting purchase:", error);
      return res.status(500).json({ errors: error.message });
    }
  });

  // Get purchase details by book_id
router.get("/book/:bookId", fetchUser, async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!bookId) {
      return res.status(400).json({ errors: "Book ID is required" });
    }

    Purchase.init(req.userinfo.tenantcode);

    const purchase = await Purchase.findByBookId(bookId);

    if (!purchase) {
      return res.status(404).json({ errors: "Purchase not found for this book" });
    }

    return res.status(200).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    console.error("Error fetching purchase by book ID:", error);
    return res.status(500).json({ errors: "Internal server error" });
  }
});

 
  app.use(process.env.BASE_API_URL + "/api/purchase", router);
};

