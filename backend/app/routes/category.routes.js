/**
 * Handles all incoming request for /api/category endpoint
 * DB table for this demo.categories
 * Model used here is category.model.js
 * SUPPORTED API ENDPOINTS
 *              GET     /api/category
 *              GET     /api/category/:id
 *              POST    /api/category
 *              PUT     /api/category/:id
 *              DELETE  /api/category/:id
 *
 *@author     Muskan Khan
@date   DEC,   2025
 * @copyright   www.ibirdsservices.com
 */

const e = require("express");
const { fetchUser, checkPermission, } = require("../middleware/fetchuser.js");
const Category = require("../models/category.model.js");

module.exports = (app) => {
  const { body, validationResult } = require("express-validator");

  var router = require("express").Router();


  router.get("/", fetchUser, checkPermission("Categories", "allow_view"), async (req, res) => {
    try {
      const categories = await Category.findAll();
      return res.status(200).json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });


  router.get("/:id", fetchUser, checkPermission("Categories", "allow_view"), async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ errors: "Category not found" });
      }
      return res.status(200).json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });


  router.post(
    "/",
    fetchUser,
    checkPermission("Categories", "allow_create"),
    [

      body("name").optional().custom((value) => {

        return true;
      }),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            errors: errors.array()[0].msg
          });
        }
        const existingCategory = await Category.findByName(req.body.name);
        if (existingCategory) {
          return res
            .status(400)
            .json({ errors: "Category with this name already exists" });
        }

        const userId = req.userinfo?.id || null;
        const category = await Category.create(req.body, userId);
        if (!category) {
          return res.status(400).json({ errors: "Failed to create category" });
        }
        return res.status(200).json({ success: true, data: category });
      } catch (error) {
        console.error("Error creating category:", error);
        console.error("Error stack:", error.stack);
        console.error("Request body:", req.body);
        return res.status(500).json({
          errors: error.message || "Internal server error",
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }
  );


  router.put(
    "/:id",
    fetchUser,
    checkPermission("Categories", "allow_edit"),
    [
      body("name").notEmpty().withMessage("Name is required"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            errors: errors.array()[0].msg
          });
        }

        const existingCategory = await Category.findById(req.params.id);
        if (!existingCategory) {
          return res.status(404).json({ errors: "Category not found" });
        }


        const duplicateCategory = await Category.findByName(
          req.body.name,
          req.params.id
        );
        if (duplicateCategory) {
          return res
            .status(400)
            .json({ errors: "Category with this name already exists" });
        }

        const userId = req.userinfo?.id || null;
        const category = await Category.updateById(req.params.id, req.body, userId);
        if (!category) {
          return res.status(400).json({ errors: "Failed to update category" });
        }
        return res.status(200).json({ success: true, data: category });
      } catch (error) {
        console.error("Error updating category:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );


  router.delete("/:id", checkPermission("Categories", "allow_delete"), fetchUser, async (req, res) => {
    try {
      const result = await Category.deleteById(req.params.id);
      if (!result.success) {
        return res.status(404).json({ errors: result.message });
      }
      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      console.error("Error deleting category:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });


  app.use(process.env.BASE_API_URL + "/api/category", router);
};

