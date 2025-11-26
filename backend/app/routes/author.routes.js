/**
 * Handles all incoming request for /api/author endpoint
 * DB table for this demo.authors
 * Model used here is author.model.js
 * SUPPORTED API ENDPOINTS
 *              GET     /api/author
 *              GET     /api/author/:id
 *              POST    /api/author
 *              PUT     /api/author/:id
 *              DELETE  /api/author/:id
 *
 * @author      Muskan Khan
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */

const e = require("express");
const { fetchUser } = require("../middleware/fetchuser.js");
const Author = require("../models/author.model.js");

module.exports = (app) => {
  const { body, validationResult } = require("express-validator");

  var router = require("express").Router();

  // Get all authors
  router.get("/", fetchUser, async (req, res) => {
    try {
      const authors = await Author.findAll();
      return res.status(200).json(authors);
    } catch (error) {
      console.error("Error fetching authors:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // Get author by ID
  router.get("/:id", fetchUser, async (req, res) => {
    try {
      const author = await Author.findById(req.params.id);
      console.log("Fetched author:", author);
      if (!author) {
        return res.status(404).json({ errors: "Author not found" });
      }
      return res.status(200).json(author);
    } catch (error) {
      console.error("Error fetching author:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // Create a new author
  router.post(
    "/",
    fetchUser,
  
    [
      // Allow empty name for barcode scanning - will use default in model
      body("name").optional().custom((value) => {
        // Allow null, undefined, or empty string for barcode scans
        return true;
      }),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        // Check for duplicate email if provided
        if (req.body.email) {
          const existingAuthor = await Author.findByEmail(req.body.email);
          if (existingAuthor) {
            return res
              .status(400)
              .json({ errors: "Author with this email already exists" });
          }
        }

        const userId = req.userinfo?.id || null;
        const author = await Author.create(req.body, userId);
        if (!author) {
          return res.status(400).json({ errors: "Failed to create author" });
        }
        return res.status(200).json({ success: true, data: author });
      } catch (error) {
        console.error("Error creating author:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );

  // Update author by ID
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

        // Check if author exists
        const existingAuthor = await Author.findById(req.params.id);
        if (!existingAuthor) {
          return res.status(404).json({ errors: "Author not found" });
        }

        // Check for duplicate email (excluding current author)
        if (req.body.email) {
          const duplicateAuthor = await Author.findByEmail(
            req.body.email,
            req.params.id
          );
          if (duplicateAuthor) {
            return res
              .status(400)
              .json({ errors: "Author with this email already exists" });
          }
        }

        const userId = req.user?.id || null;
        const author = await Author.updateById(req.params.id, req.body, userId);
        if (!author) {
          return res.status(400).json({ errors: "Failed to update author" });
        }
        return res.status(200).json({ success: true, data: author });
      } catch (error) {
        console.error("Error updating author:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );

  // Delete author by ID
  router.delete("/:id", fetchUser,  async (req, res) => {
    try {
      const result = await Author.deleteById(req.params.id);
      if (!result.success) {
        return res.status(404).json({ errors: result.message });
      }
      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      console.error("Error deleting author:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  app.use(process.env.BASE_API_URL + "/api/author", router);
};

