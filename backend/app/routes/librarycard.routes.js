/**
 * Handles all incoming request for /api/librarycard endpoint
 * DB table: demo.library_members
 * Model: librarycard.model.js
 * SUPPORTED API ENDPOINTS
 *   GET     /api/librarycard
 *   GET     /api/librarycard/:id
 *   GET     /api/librarycard/card/:cardNumber
 *   GET     /api/librarycard/student/:studentId
 *   POST    /api/librarycard
 *   PUT     /api/librarycard/:id
 *   DELETE  /api/librarycard/:id
 *
 * @author     Muskan Khan
 * @date       DEC, 2025
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { fetchUser } = require("../middleware/fetchuser.js");

const rootDir = path.resolve(__dirname, "../../..");
const frontendPublicDir = path.join(rootDir, "frontend", "public");
const frontendUploadsDir = path.join(frontendPublicDir, "uploads");
const libraryCardUploadDir = path.join(frontendUploadsDir, "librarycards");
const LibraryCard = require("../models/librarycard.model.js");
const { generateAutoNumberSafe } = require("../utils/autoNumber.helper.js");

[frontendPublicDir, frontendUploadsDir, libraryCardUploadDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const deleteFileIfExists = (relativePath = "") => {
  if (!relativePath?.startsWith("/")) return;

  const absPath = path.join(frontendPublicDir, relativePath.slice(1));
  if (fs.existsSync(absPath)) {
    fs.unlinkSync(absPath);
    console.log("🗑️ Deleted old image:", absPath);
  }
};

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, libraryCardUploadDir),
  filename: (_, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `librarycard-${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

// Custom middleware to handle multer errors gracefully
const safeUpload = (fieldName) => {
  return (req, res, next) => {
    if (!req.files || !req.files[fieldName]) {
      return next(); // optional image
    }

    const file = req.files[fieldName];

    if (!file.mimetype.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "Only image files are allowed",
      });
    }

    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return res.status(400).json({
        success: false,
        message: "Image size must be less than 2MB",
      });
    }

    next();
  };
};

const conditionalUpload = (req, res, next) => {
  if (
    req.headers["content-type"] &&
    req.headers["content-type"].includes("multipart/form-data")
  ) {
    upload.single("image")(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err.message);
        // Skip multer on error, continue with request
        return next();
      }
      next();
    });
  } else {
    next();
  }
};

module.exports = (app) => {
  const { body, validationResult } = require("express-validator");
  var router = require("express").Router();

  router.get("/object-types", fetchUser, async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode);
      const records = await LibraryCard.getAllRecords();
      res.status(200).json({
        success: true,
        data: records || [],
        message: "Object types retrieved successfully",
      });
    } catch (error) {
      console.error("❌ Error fetching object types:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  router.get("/auto-config-card", fetchUser, async (req, res) => {
    try {
      const userId = req.userinfo?.id || null;
      const cardNumber = await generateAutoNumberSafe(
        "library_members",
        userId,
        "LIB-",
        5
      );
      res.json({ card_number: cardNumber });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Auto-config failed" });
    }
  });

  router.get("/", fetchUser, async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode);
      const cards = await LibraryCard.findAll();
      return res.status(200).json(cards);
    } catch (error) {
      console.error("Error fetching library cards:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/card/:cardNumber", fetchUser, async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode);
      const card = await LibraryCard.findByCardNumber(req.params.cardNumber);
      if (!card)
        return res.status(404).json({ error: "Library card not found" });
      return res.status(200).json(card);
    } catch (error) {
      console.error("Error fetching library card:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/student/:studentId", fetchUser, async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode);
      const card = await LibraryCard.findByStudentId(req.params.studentId);
      if (!card)
        return res.status(404).json({ error: "Library card not found" });
      return res.status(200).json(card);
    } catch (error) {
      console.error("Error fetching library card:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/:id", fetchUser, async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode);
      const card = await LibraryCard.findById(req.params.id);
      if (!card)
        return res.status(404).json({ error: "Library card not found" });
      return res.status(200).json(card);
    } catch (error) {
      console.error("Error fetching library card:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post(
    "/",
    fetchUser,
    upload.single("image"),
    [
      body("first_name").notEmpty().withMessage("First name is required"),
      body("last_name").notEmpty().withMessage("Last name is required"),
      body("email").optional().isEmail().withMessage("Valid email required"),
      body("phone_number").optional().isString(),
      body("type_id").optional().isString(),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        LibraryCard.init(req.userinfo.tenantcode);
        const userId = req.userinfo?.id || null;
        const cardData = { ...req.body };

        console.log("📥 Creating library card with data:", {
          ...cardData,
          image: cardData.image ? "[IMAGE DATA]" : "null",
        });

        if (req.file) {
          cardData.image = `/uploads/librarycards/${req.file.filename}`;
          console.log("📷 Image uploaded:", cardData.image);
        } else if (req.body.image && req.body.image.startsWith("data:image/")) {
          try {
            const matches = req.body.image.match(/^data:image\/(\w+);base64,/);
            if (matches) {
              const ext = matches[1];
              const base64Data = req.body.image.replace(
                /^data:image\/\w+;base64,/,
                ""
              );
              const buffer = Buffer.from(base64Data, "base64");

              const uniqueFile = `base64-${Date.now()}-${Math.random()
                .toString()
                .slice(2)}.${ext}`;
              const filePath = path.join(libraryCardUploadDir, uniqueFile);

              fs.writeFileSync(filePath, buffer);
              cardData.image = `/uploads/librarycards/${uniqueFile}`;
            }
          } catch (err) {
            console.error("Base64 image error:", err);
            cardData.image = null;
          }
        }

        if (cardData.status !== undefined) {
          cardData.is_active =
            cardData.status === "true" || cardData.status === true;
        }

        if (cardData.plan_id !== undefined) {
          cardData.subscription_id = cardData.plan_id;
          delete cardData.plan_id;
        }

        const card = await LibraryCard.create(cardData, userId);

        return res.status(201).json({
          success: true,
          data: card,
          message: "Library card created successfully",
        });
      } catch (error) {
        console.error("❌ Error creating library card:", error);
        return res.status(500).json({ error: error.message });
      }
    }
  );

  router.put(
    "/:id",
    fetchUser,
    async (req, res) => {
      console.log("🔄 [BACKEND] Starting library card update for ID:", req.params.id);
      console.log("🔄 [BACKEND] Request headers:", {
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length']
      });
      console.log("🔄 [BACKEND] Request body keys:", Object.keys(req.body || {}));
      console.log("🔄 [BACKEND] Request body:", req.body);

      try {
        LibraryCard.init(req.userinfo.tenantcode);

        const card = await LibraryCard.findById(req.params.id);
        if (!card) {
          console.log("❌ [BACKEND] Library card not found for ID:", req.params.id);
          return res
            .status(404)
            .json({ success: false, message: "Library card not found" });
        }

        console.log("📋 [BACKEND] Existing card data:", {
          id: card.id,
          card_number: card.card_number,
          image: card.image,
          user_id: card.user_id
        });

        const userId = req.userinfo.id;
        const data = { ...req.body };

        let oldImagePath = null;

        // Check if this is a multipart request
        const isMultipart = req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data');
        console.log("🔍 [BACKEND] Is multipart request:", isMultipart);

        if (isMultipart) {
          console.log("📎 [BACKEND] Processing multipart data...");
          try {
            // Process multipart data
            await new Promise((resolve, reject) => {
              upload.single("image")(req, res, (err) => {
                if (err) {
                  console.error("❌ [BACKEND] Multer error:", err.message);
                  return reject(err);
                }
                console.log("✅ [BACKEND] Multer processing completed");
                resolve();
              });
            });

            console.log("📎 [BACKEND] After multer - req.file:", req.file ? {
              filename: req.file.filename,
              originalname: req.file.originalname,
              size: req.file.size
            } : null);
            console.log("📎 [BACKEND] After multer - req.body:", req.body);

            // Handle uploaded image
            if (req.file) {
              data.image = `/uploads/librarycards/${req.file.filename}`;
              oldImagePath = card.image;
              console.log("🖼️ [BACKEND] New image uploaded:", data.image);
              console.log("🗑️ [BACKEND] Old image to delete:", oldImagePath);
            } else if (req.body.image === "") {
              // Clear the image if empty string is sent
              data.image = null;
              oldImagePath = card.image;
              console.log("🗑️ [BACKEND] Clearing image (empty string received)");
            } else {
              console.log("📎 [BACKEND] No image change - keeping existing image");
            }
          } catch (multerError) {
            console.error("❌ [BACKEND] Multipart processing error:", multerError);
            // Continue with the request even if multer fails
          }
        } else {
          console.log("📄 [BACKEND] Processing JSON data (no multipart)");
        }

        // Normalize fields
        if (data.status !== undefined) {
          data.is_active = data.status === "true" || data.status === true;
          console.log("🔄 [BACKEND] Normalized status:", data.status, "->", data.is_active);
        }
        if (data.plan_id !== undefined) {
          data.subscription_id = data.plan_id;
          delete data.plan_id;
          console.log("🔄 [BACKEND] Normalized plan_id:", data.plan_id, "-> subscription_id:", data.subscription_id);
        }
        if (data.type_id !== undefined) {
          data.type = data.type_id;
          delete data.type_id;
          console.log("🔄 [BACKEND] Normalized type_id:", data.type_id, "-> type:", data.type);
        }

        const fieldsToUpdate = {
          ...data,
          lastmodifiedbyid: userId,
          lastmodifieddate: new Date(),
        };

        console.log("💾 [BACKEND] Fields to update:", fieldsToUpdate);
        await LibraryCard.updateById(req.params.id, fieldsToUpdate, userId);
        console.log("✅ [BACKEND] Database update completed");

        // Delete old image only after successful update
        if (oldImagePath) {
          console.log("🗑️ [BACKEND] Deleting old image file:", oldImagePath);
          deleteFileIfExists(oldImagePath);
        }

        const updatedCard = await LibraryCard.findById(req.params.id);
        console.log("📋 [BACKEND] Updated card data:", {
          id: updatedCard.id,
          card_number: updatedCard.card_number,
          image: updatedCard.image,
          user_id: updatedCard.user_id
        });

        console.log("✅ [BACKEND] Library card update completed successfully");
        return res
          .status(200)
          .json({
            success: true,
            data: updatedCard,
            message: "Library card updated successfully",
          });
      } catch (err) {
        console.error("❌ [BACKEND] Update error:", err);
        console.error("❌ [BACKEND] Error stack:", err.stack);
        return res.status(500).json({ success: false, message: err.message });
      }
    }
  );

  router.delete("/:id", fetchUser, async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode);

      const card = await LibraryCard.findById(req.params.id);
      if (card && card.image) {
        deleteFileIfExists(card.image);
      }

      const result = await LibraryCard.deleteById(req.params.id);

      if (!result.success) {
        return res.status(404).json({ error: result.message });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("❌ Error deleting library card:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  router.post("/import", fetchUser, async (req, res) => {
    try {
      const { members } = req.body;
      if (!Array.isArray(members)) {
        return res.status(400).json({ error: "Members should be an array" });
      }

      LibraryCard.init(req.userinfo.tenantcode);
      const userId = req.userinfo?.id || null;

      const results = [];
      for (const member of members) {
        try {
          if (!member.card_number) {
            member.card_number = await generateAutoNumberSafe(
              "library_members",
              userId,
              "LIB-",
              5
            );
          }

          const card = await LibraryCard.create(member, userId);
          results.push({ success: true, data: card });
        } catch (error) {
          results.push({
            success: false,
            error: error.message,
            member: {
              ...member,
              card_number: member.card_number || "NOT_GENERATED",
            },
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;

      return res.status(200).json({
        success: true,
        message: `Imported ${successCount} out of ${members.length} members`,
        results,
      });
    } catch (error) {
      console.error("❌ Error importing members:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.use(process.env.BASE_API_URL + "/api/librarycard", router);
};
