
// /**
//  * Handles all incoming request for /api/user endpoint
//  * DB table for this demo.user
//  * Model used here is user.model.js
//  * SUPPORTED API ENDPOINTS
//  *              GET     /api/user
//  *              GET     /api/user/:id
//  *              GET     /api/user/email/:email
//  *              POST    /api/user
//  *              PUT     /api/user/:id
//  *              DELETE  /api/user/:id
//  *
//  *@author     Muskan Khan
// @date   DEC,   2025
//  * @copyright   www.ibirdsservices.com
//  */

// const e = require("express");
// const bcrypt = require("bcryptjs");
// const { fetchUser, checkPermission } = require("../middleware/fetchuser.js");
// const User = require("../models/user.model.js");
// const sql = require("../models/db.js");
// const path = require("path");
// const fs = require("fs");

// module.exports = (app) => {

//   const { body, validationResult } = require("express-validator");

//   var router = require("express").Router();
//   const fileUpload = require("express-fileupload");


//   const multer = require("multer");

//   // ------------------- USER  UPLOAD FOLDER -------------------
//   const userUploadDir = path.join(
//     path.resolve(__dirname, "../../.."),
//     "frontend",
//     "public",
//     "uploads",
//     "users"
//   );

//   if (!fs.existsSync(userUploadDir)) {
//     fs.mkdirSync(userUploadDir, { recursive: true });
//   }

//   // const userUploadDir = "/var/www/html/uploads/users";
//   // if (!fs.existsSync(userUploadDir)) fs.mkdirSync(userUploadDir, { recursive: true });

//   // ------------------- MULTER SETUP -------------------
//   const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, userUploadDir);
//     },
//     filename: (req, file, cb) => {
//       const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//       cb(null, `user-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
//     }
//   });

//   const upload = multer({
//     storage,

//     limits: { fileSize: 5 * 1024 * 1024 },
//     fileFilter: (req, file, cb) => {
//       console.log("UPLOAD FILE:", {
//         originalname: file.originalname,
//         mimetype: file.mimetype
//       });

//       const allowedMimeTypes = [
//         "image/jpeg",
//         "image/jpg",
//         "image/png",
//         "image/gif"
//       ];

//       if (allowedMimeTypes.includes(file.mimetype)) {
//         cb(null, true);
//       } else {
//         cb(new Error("Only JPG, JPEG, PNG, and GIF images are allowed"));
//       }
//     }
//   });





//   router.post("/:id/upload-image", fetchUser, checkPermission("Users", "allow_create"), async (req, res) => {
//     try {
//       if (!req.files?.file) {
//         return res.status(400).json({ errors: "No image file provided" });
//       }

//       const userId = String(req.params.id);


//       if (String(req.userinfo.id) !== userId) {
//         return res.status(403).json({ errors: "Unauthorized access" });
//       }

//       const file = req.files.file;

//       if (file.size > 5 * 1024 * 1024) {
//         return res.status(400).json({ errors: "Image size max 5MB" });
//       }


//       const uploadPath = path.join(
//         __dirname,
//         '../../../frontend/public/uploads',
//         userId
//       );



//       fs.mkdirSync(uploadPath, { recursive: true });

//       const fileExt = path.extname(file.name) || ".jpg";
//       const fileName = `profile_${Date.now()}${fileExt}`;
//       const filePath = path.join(uploadPath, fileName);

//       await file.mv(filePath);

//       const relativePath = `/uploads/${userId}/${fileName}`;

//       return res.status(200).json({
//         success: true,
//         filePath: relativePath,
//       });
//     } catch (error) {
//       console.error("Upload Image Error:", error);
//       return res.status(500).json({ errors: "Internal server error" });
//     }
//   });

//   router.get("/", fetchUser, checkPermission("Users", "allow_view"), async (req, res) => {
//     try {
//       User.init(req.userinfo.tenantcode);
//       const users = await User.findAll();
//       return res.status(200).json(users);
//     } catch (error) {
//       console.error("Error fetching users:", error);
//       return res.status(500).json({ errors: "Internal server error" });
//     }
//   });

//   router.get("/:id", fetchUser, checkPermission("Users", "allow_view"), async (req, res) => {
//     try {
//       User.init(req.userinfo.tenantcode);
//       const user = await User.findById(req.params.id);
//       if (!user) {
//         return res.status(404).json({ errors: "User not found" });
//       }
//       return res.status(200).json(user);
//     } catch (error) {
//       console.error("Error fetching user:", error);
//       return res.status(500).json({ errors: "Internal server error" });
//     }
//   });

//   router.get("/email/:email", fetchUser, checkPermission("Users", "allow_view"), async (req, res) => {
//     try {
//       User.init(req.userinfo.tenantcode);
//       const user = await User.findByEmail(req.params.email);
//       if (!user) {
//         return res.status(404).json({ errors: "User not found" });
//       }
//       return res.status(200).json(user);
//     } catch (error) {
//       console.error("Error fetching user:", error);
//       return res.status(500).json({ errors: "Internal server error" });
//     }
//   });
//   router.post(
//     "/",
//     fetchUser, checkPermission("Users", "allow_create"),

//     [
//       body("firstname").notEmpty().withMessage("First name is required"),
//       body("lastname").notEmpty().withMessage("Last name is required"),
//       body("email").optional().isEmail().withMessage("Email must be a valid email address"),
//       body("password").optional().isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
//       body("isactive").optional().isBoolean().withMessage("isactive must be a boolean"),
//     ],
//     async (req, res) => {
//       try {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//           return res.status(400).json({ errors: errors.array() });
//         }

//         const tenantcode = req.userinfo?.tenantcode;
//         const companyid = req.userinfo?.companyid;




//         if (!tenantcode) {
//           console.error("Error: tenantcode is missing from req.userinfo");
//           return res.status(400).json({
//             errors: "Tenant code is required. Please ensure you are authenticated properly."
//           });
//         }


//         let finalCompanyId = companyid;
//         if (!finalCompanyId) {
//           try {
//             const companyCheck = await sql.query(`
//               SELECT c.id FROM public.company c 
//               WHERE LOWER(c.tenantcode) = LOWER($1) AND c.isactive = true
//               LIMIT 1
//             `, [tenantcode]);
//             if (companyCheck.rows.length > 0) {
//               finalCompanyId = companyCheck.rows[0].id;

//             } else {
//               console.error("Company not found for tenantcode:", tenantcode);
//               return res.status(400).json({
//                 errors: "Company not found for the given tenant code."
//               });
//             }
//           } catch (error) {
//             console.error("Error fetching company id from tenantcode:", error);
//             return res.status(500).json({
//               errors: "Failed to fetch company information."
//             });
//           }
//         }

//         User.init(tenantcode);
//         const userId = req.userinfo?.id || null;


//         let hashedPassword = req.body.password;
//         if (req.body.password) {
//           const salt = bcrypt.genSaltSync(10);
//           hashedPassword = bcrypt.hashSync(req.body.password, salt);
//         }




//         const userData = {
//           ...req.body,
//           password: hashedPassword,
//           companyid: finalCompanyId
//         };

//         const user = await User.create(userData, userId);
//         if (!user) {
//           return res.status(400).json({ errors: "Failed to create user" });
//         }
//         return res.status(200).json({ success: true, data: user });
//       } catch (error) {
//         console.error("Error creating user:", error);
//         return res.status(500).json({ errors: error.message });
//       }
//     }
//   );


//   router.put(
//     "/:id",
//     fetchUser,
//     checkPermission("Company", "allow_edit"),
//     upload.single("profile_image"),
//     async (req, res) => {

//       console.log("Updating company ID:", req.params.id, "with data:", req.body);

//       try {
//         User.init(req.userinfo.tenantcode);

//         const existingUser = await User.findById(req.params.id);
//         if (!existingUser) {
//           return res.status(404).json({ errors: "User not found" });
//         }

//         const userId = req.userinfo?.id || null;
//         const userData = { ...req.body };
//         if (userData.isactive !== undefined)
//           userData.isactive = userData.isactive === "true" || userData.isactive === true;

//         if (userData.is_external !== undefined)
//           userData.is_external = userData.is_external === "true" || userData.is_external === true;

//         if (userData.has_wallet !== undefined)
//           userData.has_wallet = userData.has_wallet === "true" || userData.has_wallet === true;

//         const previousImagePath = existingUser.profile_image;

//         if (req.file) {
//           if (previousImagePath) deleteFileIfExists(previousImagePath);
//           userData.profile_image = `/uploads/users/${req.file.filename}`;
//         } else if (userData.profile_image === "null" || userData.profile_image === null) {
//           if (previousImagePath) deleteFileIfExists(previousImagePath);
//           userData.profile_image = null;
//         }

//         const user = await User.updateById(req.params.id, userData, userId);

//         return res.status(200).json({
//           success: true,
//           data: user,
//           message: "User updated successfully"
//         });
//       } catch (error) {
//         console.error(" Error updating user:", error);
//         return res.status(500).json({ errors: error.message });
//       }
//     }
//   );



//   router.delete("/:id", fetchUser, checkPermission("Users", "allow_delete"), async (req, res) => {
//     try {
//       User.init(req.userinfo.tenantcode);
//       const result = await User.deleteById(req.params.id);
//       if (!result.success) {
//         return res.status(404).json({ errors: result.message });
//       }
//       return res.status(200).json({ success: true, message: result.message });
//     } catch (error) {
//       console.error("Error deleting user:", error);
//       return res.status(500).json({ errors: "Internal server error" });
//     }
//   });

//   app.use(process.env.BASE_API_URL + "/api/user", router);
// };




/**
 * Handles all incoming request for /api/user endpoint
 * DB table for this demo.user
 * Model used here is user.model.js
 * SUPPORTED API ENDPOINTS
 *              GET     /api/user
 *              GET     /api/user/:id
 *              GET     /api/user/email/:emaila
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
const { fetchUser, checkPermission } = require("../middleware/fetchuser.js");
const User = require("../models/user.model.js");
const sql = require("../models/db.js");
const path = require("path");
const fs = require("fs");

const multer = require("multer");

// ------------------- USER  UPLOAD FOLDER -------------------
const userUploadDir = path.join(
  path.resolve(__dirname, "../../.."),
  "frontend",
  "public",
  "uploads",
  "users"
);

if (!fs.existsSync(userUploadDir)) {
  fs.mkdirSync(userUploadDir, { recursive: true });
}

// const userUploadDir = "/var/www/html/uploads/users";
// if (!fs.existsSync(userUploadDir)) fs.mkdirSync(userUploadDir, { recursive: true });

// ------------------- MULTER SETUP -------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, userUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `user-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const upload = multer({
  storage,
  // limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    console.log("UPLOAD FILE:", {
      originalname: file.originalname,
      mimetype: file.mimetype
    });

    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif"
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, JPEG, PNG, and GIF images are allowed"));
    }
  }
});


module.exports = (app) => {

  const { body, validationResult } = require("express-validator");

  var router = require("express").Router();

  const rootDir = path.resolve(__dirname, "../../..");
  const frontendPublicDir = path.join(rootDir, "frontend", "public");
  const frontendUploadsDir = path.join(frontendPublicDir, "uploads");
  const companyUploadDir = path.join(frontendUploadsDir, "companies");

  const ensureDirectory = (dirPath) => {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  };
  [frontendPublicDir, frontendUploadsDir, companyUploadDir].forEach(ensureDirectory);


  //existfiledelete
  const deleteFileIfExists = (filePath = "") => {
    if (!filePath || typeof filePath !== "string") return;
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) return;

    let normalized = filePath.replace(/\\/g, "/");
    if (normalized.startsWith("/")) normalized = normalized.slice(1);

    const candidatePaths = [
      path.join(frontendPublicDir, normalized),
      path.join(__dirname, "../../", normalized),
      path.join(companyUploadDir, path.basename(normalized)),
    ];

    const visited = new Set();
    candidatePaths.forEach((absolutePath) => {
      if (!absolutePath || visited.has(absolutePath)) return;
      visited.add(absolutePath);

      try {
        if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
      } catch (err) {
        console.error("Error removing company image:", absolutePath, err.message);
      }
    });
  };


  const multer = require("multer");

  // ------------------- USER  UPLOAD FOLDER -------------------
  const userUploadDir = path.join(
    path.resolve(__dirname, "../../.."),
    "frontend",
    "public",
    "uploads",
    "users"
  );

  if (!fs.existsSync(userUploadDir)) {
    fs.mkdirSync(userUploadDir, { recursive: true });
  }

  // const userUploadDir = "/var/www/html/uploads/users";
  // if (!fs.existsSync(userUploadDir)) fs.mkdirSync(userUploadDir, { recursive: true });

  // ------------------- MULTER SETUP -------------------
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, userUploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `user-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
    }
  });

  const upload = multer({
    storage,

    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      console.log("UPLOAD FILE:", {
        originalname: file.originalname,
        mimetype: file.mimetype
      });

      const allowedMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif"
      ];

      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Only JPG, JPEG, PNG, and GIF images are allowed"));
      }
    }
  });





  router.post("/:id/upload-image", fetchUser, checkPermission("Users", "allow_create"), async (req, res) => {
    try {
      if (!req.files?.file) {
        return res.status(400).json({ errors: "No image file provided" });
      }

      const userId = String(req.params.id);

      if (String(req.userinfo.id) !== userId) {
        return res.status(403).json({ errors: "Unauthorized access" });
      }

      const file = req.files.file;

      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ errors: "Image size max 5MB" });
      }

      const uploadPath = path.join(
        __dirname,
        '../../../frontend/public/uploads',
        userId
      );



      fs.mkdirSync(uploadPath, { recursive: true });

      const fileExt = path.extname(file.name) || ".jpg";
      const fileName = `profile_${Date.now()}${fileExt}`;
      const filePath = path.join(uploadPath, fileName);

      await file.mv(filePath);

      const relativePath = `/uploads/${userId}/${fileName}`;

      return res.status(200).json({
        success: true,
        filePath: relativePath,
      });
    } catch (error) {
      console.error("Upload Image Error:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  router.get("/", fetchUser, checkPermission("Users", "allow_view"), async (req, res) => {
    try {
      User.init(req.userinfo.tenantcode);
      const users = await User.findAll();
      return res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  router.get("/:id", fetchUser, checkPermission("Users", "allow_view"), async (req, res) => {
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

  router.get("/email/:email", fetchUser, checkPermission("Users", "allow_view"), async (req, res) => {
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
    fetchUser, checkPermission("Users", "allow_create"),

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
    checkPermission("Company", "allow_edit"),
    upload.single("profile_image"),
    async (req, res) => {

      console.log("Updating company ID:", req.params.id, "with data:", req.body);

      try {
        User.init(req.userinfo.tenantcode);

        const existingUser = await User.findById(req.params.id);

        console.log("Existing User:", existingUser);

        if (!existingUser) {
          return res.status(404).json({ errors: "User not found" });
        }

        const userId = req.userinfo?.id || null;
        const userData = { ...req.body };
        console.log("Received user data for update:", userData);

        if (userData.isactive !== undefined)
          userData.isactive = userData.isactive === "true" || userData.isactive === true;

        if (userData.is_external !== undefined)
          userData.is_external = userData.is_external === "true" || userData.is_external === true;

        if (userData.has_wallet !== undefined)
          userData.has_wallet = userData.has_wallet === "true" || userData.has_wallet === true;


        // const previousImagePath = existingUser.profile_image;

        // Hash password if provided
        if (userData.password) {
          const salt = bcrypt.genSaltSync(10);
          userData.password = bcrypt.hashSync(userData.password, salt);
        }

          const previousImagePath = existingUser.profile_image;

        // const previousImagePath = existingUser.profile_image;


        if (req.file) {
          if (previousImagePath) deleteFileIfExists(previousImagePath);
          userData.profile_image = `/uploads/users/${req.file.filename}`;
        } else if (userData.profile_image === "null" || userData.profile_image === null) {
          if (previousImagePath) deleteFileIfExists(previousImagePath);
          userData.profile_image = null;
        }

        const user = await User.updateById(req.params.id, userData, userId);

        console.log("Updated User:", user);
        if (!user) {
          return res.status(400).json({ errors: "Failed to update user" });
        }


        return res.status(200).json({
          success: true,
          data: user,
          message: "User updated successfully"
        });
      } catch (error) {
        console.error(" Error updating user:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );



  router.delete("/:id", fetchUser, checkPermission("Users", "allow_delete"), async (req, res) => {
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



