/**
 * Handles all incoming request for /api/user endpoint
 * DB table for this demo.user
 * Model used here is user.model.js
 * SUPPORTED API ENDPOINTS
 *              GET     /api/user
 *              GET     /api/user/:id
 *              GET     /api/user/email/:email
 *              POST    /api/user
 *              PUT     /api/user/:id
 *              DELETE  /api/user/:id
 *
 *@author     Muskan Khan
@date   DEC,   2025
 * @copyright   www.ibirdsservices.com
 */

const e = require("express");
const bcrypt = require("bcryptjs");
const { fetchUser } = require("../middleware/fetchuser.js");
const User = require("../models/user.model.js");
const sql = require("../models/db.js");
const path = require("path");
const fs = require("fs");

module.exports = (app) => {
  const { body, validationResult } = require("express-validator");

  var router = require("express").Router();

  router.get("/", fetchUser, async (req, res) => {
    try {
      User.init(req.userinfo.tenantcode);
      const users = await User.findAll();
      return res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  router.get("/:id", fetchUser, async (req, res) => {
    try {
      User.init(req.userinfo.tenantcode);
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ errors: "User not found" });
      }
      return res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  router.get("/email/:email", fetchUser, async (req, res) => {
    try {
      User.init(req.userinfo.tenantcode);
      const user = await User.findByEmail(req.params.email);
      if (!user) {
        return res.status(404).json({ errors: "User not found" });
      }
      return res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  router.post(
    "/",
    fetchUser,

    [
      body("firstname").notEmpty().withMessage("First name is required"),
      body("lastname").notEmpty().withMessage("Last name is required"),
      body("email").optional().isEmail().withMessage("Email must be a valid email address"),
      body("password").optional().isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
      body("isactive").optional().isBoolean().withMessage("isactive must be a boolean"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const tenantcode = req.userinfo?.tenantcode;
        const companyid = req.userinfo?.companyid;
        console.log("Creating user - tenantcode:", tenantcode);
        console.log("Creating user - companyid:", companyid);
        console.log("req.userinfo:", req.userinfo);

        if (!tenantcode) {
          console.error("Error: tenantcode is missing from req.userinfo");
          return res.status(400).json({
            errors: "Tenant code is required. Please ensure you are authenticated properly."
          });
        }

 
        let finalCompanyId = companyid;
        if (!finalCompanyId) {
          try {
            const companyCheck = await sql.query(`
              SELECT c.id FROM public.company c 
              WHERE LOWER(c.tenantcode) = LOWER($1) AND c.isactive = true
              LIMIT 1
            `, [tenantcode]);
            if (companyCheck.rows.length > 0) {
              finalCompanyId = companyCheck.rows[0].id;
              console.log("Fetched companyId from tenantcode:", tenantcode, "Company ID:", finalCompanyId);
            } else {
              console.error("Company not found for tenantcode:", tenantcode);
              return res.status(400).json({
                errors: "Company not found for the given tenant code."
              });
            }
          } catch (error) {
            console.error("Error fetching company id from tenantcode:", error);
            return res.status(500).json({
              errors: "Failed to fetch company information."
            });
          }
        }

        User.init(tenantcode);
        const userId = req.userinfo?.id || null;

 
        let hashedPassword = req.body.password;
        if (req.body.password) {
          const salt = bcrypt.genSaltSync(10);
          hashedPassword = bcrypt.hashSync(req.body.password, salt);
        }



 
        const userData = {
          ...req.body,
          password: hashedPassword,
          companyid: finalCompanyId
        };

        const user = await User.create(userData, userId);
        if (!user) {
          return res.status(400).json({ errors: "Failed to create user" });
        }
        return res.status(200).json({ success: true, data: user });
      } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );

 
  router.put(
    "/:id",
    fetchUser,

    [
      body("email").optional().isEmail().withMessage("Email must be a valid email address"),
      body("password").optional().isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
      body("isactive").optional().isBoolean().withMessage("isactive must be a boolean"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        User.init(req.userinfo.tenantcode);
 
        const existingUser = await User.findById(req.params.id);
        if (!existingUser) {
          return res.status(404).json({ errors: "User not found" });
        }

 
        const updateData = { ...req.body };
        if (updateData.password) {
 
          if (!updateData.password.startsWith('$2a$') && !updateData.password.startsWith('$2b$')) {
            const salt = bcrypt.genSaltSync(10);
            updateData.password = bcrypt.hashSync(updateData.password, salt);
          }
        }

        const userId = req.user?.id || null;
        const user = await User.updateById(req.params.id, updateData, userId);
        if (!user) {
          return res.status(400).json({ errors: "Failed to update user" });
        }
        return res.status(200).json({ success: true, data: user });
      } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );

 
  router.post("/:id/upload-image", fetchUser, async (req, res) => {
    try {
      if (!req.files || !req.files.file) {
        return res.status(400).json({ errors: "No image file provided" });
      }

      const userId = req.params.id;
      const file = req.files.file;

 
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ errors: "Invalid file type. Only JPEG, PNG, and GIF images are allowed." });
      }

 
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return res.status(400).json({ errors: "File size too large. Maximum size is 5MB." });
      }

 
      const uploadPath = path.join(
        process.env.FILE_UPLOAD_PATH || './public',
        req.userinfo.tenantcode,
        'users',
        userId
      );

 
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

 
      const fileExtension = path.extname(file.name) || '.jpg';
      const fileName = `profile${fileExtension}`;
      const filePath = path.join(uploadPath, fileName);

 
      try {
        if (file.mv) {
 
          await new Promise((resolve, reject) => {
            file.mv(filePath, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        } else if (file.data) {
 
          fs.writeFileSync(filePath, file.data);
        } else if (Buffer.isBuffer(file)) {
 
          fs.writeFileSync(filePath, file);
        } else {
          return res.status(400).json({ errors: "Invalid file format" });
        }

 
        const relativePath = `/public/${req.userinfo.tenantcode}/users/${userId}/${fileName}`;
        return res.status(200).json({
          success: true,
          message: "Image uploaded successfully",
          filePath: relativePath
        });
      } catch (saveError) {
        console.error("Error saving file:", saveError);
        return res.status(500).json({ errors: "Failed to save image file" });
      }
    } catch (error) {
      console.error("Error uploading user image:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

 
  router.delete("/:id", fetchUser, async (req, res) => {
    try {
      User.init(req.userinfo.tenantcode);
      const result = await User.deleteById(req.params.id);
      if (!result.success) {
        return res.status(404).json({ errors: result.message });
      }
      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

   app.use(process.env.BASE_API_URL + "/api/user", router);
};

