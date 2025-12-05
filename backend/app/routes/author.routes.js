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


  router.get("/", fetchUser, async (req, res) => {
    try {
      const authors = await Author.findAll();
      return res.status(200).json(authors);
    } catch (error) {
      console.error("Error fetching authors:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });


  router.get("/:id", fetchUser, async (req, res) => {
    try {
        Author.init(req.userinfo.tenantcode);
      const author = await Author.findById(req.params.id);
      if (!author) {
        return res.status(404).json({ errors: "Author not found" });
      }
      return res.status(200).json(author);
    } catch (error) {
      console.error("Error fetching author:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });


  router.post(
    "/",
    fetchUser,

    [

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
        console.log("req.userinfo.tenantcodereq.userinfo.tenantcode", req.userinfo.tenantcode)
        Author.init(req.userinfo.tenantcode);
        const existingAuthor = await Author.findById(req.params.id);
        if (!existingAuthor) {
          return res.status(404).json({ errors: "Author not found" });
        }


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


  router.delete("/:id", fetchUser, async (req, res) => {
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

