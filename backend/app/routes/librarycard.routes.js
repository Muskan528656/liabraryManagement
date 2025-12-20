



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
const LibraryCard = require("../models/librarycard.model.js");
const { generateAutoNumberSafe } = require("../utils/autoNumber.helper.js");

const rootDir = path.resolve(__dirname, "../../..");
const frontendPublicDir = path.join(rootDir, "frontend", "public");
const frontendUploadsDir = path.join(frontendPublicDir, "uploads");
const libraryCardUploadDir = path.join(frontendUploadsDir, "librarycards");

// Ensure directories exist
const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};
[frontendPublicDir, frontendUploadsDir, libraryCardUploadDir].forEach(ensureDirectory);

// Delete file helper
const deleteFileIfExists = (filePath = "") => {
  if (!filePath || typeof filePath !== "string") return;

  if (filePath.startsWith('/')) {
    const absolutePath = path.join(frontendPublicDir, filePath.slice(1));
    try {
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        console.log("🗑 Deleted file:", absolutePath);
      }
    } catch (err) {
      console.error("Error deleting file:", err.message);
    }
  }
};

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, libraryCardUploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'librarycard-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

module.exports = (app) => {
  const { body, validationResult } = require("express-validator");
  var router = require("express").Router();

  // ============ GET ROUTES ============

  // GET object types
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

  // GET auto-config card number
  router.get("/auto-config-card", fetchUser, async (req, res) => {
    try {
      const userId = req.userinfo?.id || null;
      const cardNumber = await generateAutoNumberSafe("library_members", userId, 'LIB-', 5);
      res.json({ card_number: cardNumber });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Auto-config failed" });
    }
  });

  // GET all library cards
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

  // GET by card number
  router.get("/card/:cardNumber", fetchUser, async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode);
      const card = await LibraryCard.findByCardNumber(req.params.cardNumber);
      if (!card) return res.status(404).json({ error: "Library card not found" });
      return res.status(200).json(card);
    } catch (error) {
      console.error("Error fetching library card:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET by student ID
  router.get("/student/:studentId", fetchUser, async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode);
      const card = await LibraryCard.findByStudentId(req.params.studentId);
      if (!card) return res.status(404).json({ error: "Library card not found" });
      return res.status(200).json(card);
    } catch (error) {
      console.error("Error fetching library card:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET by ID (MUST BE LAST GET ROUTE)
  router.get("/:id", fetchUser, async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode);
      const card = await LibraryCard.findById(req.params.id);
      if (!card) return res.status(404).json({ error: "Library card not found" });
      return res.status(200).json(card);
    } catch (error) {
      console.error("Error fetching library card:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ POST ROUTES ============

  // POST create new library card
  router.post(
    "/",
    fetchUser,
    upload.single("image"),
    [
      body("first_name").notEmpty().withMessage("First name is required"),
      body("last_name").notEmpty().withMessage("Last name is required"),
      body("email").optional().isEmail().withMessage("Valid email required"),
      body("phone_number").optional().isString(),
      body("type").optional().isString(),
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
          image: cardData.image ? "[IMAGE DATA]" : "null"
        });

        // Handle image
        if (req.file) {
          cardData.image = `/uploads/librarycards/${req.file.filename}`;
          console.log("📷 Image uploaded:", cardData.image);
        } else if (req.body.image && req.body.image.startsWith("data:image/")) {
          // Handle base64 image
          try {
            const matches = req.body.image.match(/^data:image\/(\w+);base64,/);
            if (matches) {
              const ext = matches[1];
              const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, "");
              const buffer = Buffer.from(base64Data, "base64");

              const uniqueFile = `base64-${Date.now()}-${Math.random().toString().slice(2)}.${ext}`;
              const filePath = path.join(libraryCardUploadDir, uniqueFile);

              fs.writeFileSync(filePath, buffer);
              cardData.image = `/uploads/librarycards/${uniqueFile}`;
            }
          } catch (err) {
            console.error("Base64 image error:", err);
            cardData.image = null;
          }
        }

        // Handle is_active from status
        if (cardData.status !== undefined) {
          cardData.is_active = cardData.status === 'true' || cardData.status === true;
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

  // ============ PUT ROUTE ============

  // PUT update library card
  router.put("/:id", fetchUser, upload.single('image'), async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode);

      // Check if card exists
      const existingCard = await LibraryCard.findById(req.params.id);
      if (!existingCard) {
        return res.status(404).json({ error: "Library card not found" });
      }

      const userId = req.userinfo?.id || null;
      const cardData = { ...req.body };
      const previousImagePath = existingCard.image;

      console.log("🔄 Updating library card:", req.params.id);
      console.log("Update data:", cardData);

      // Handle image upload
      if (req.file) {
        // Delete old image if exists
        if (previousImagePath) {
          deleteFileIfExists(previousImagePath);
        }
        cardData.image = `/uploads/librarycards/${req.file.filename}`;
      } else if (cardData.image === 'null' || cardData.image === null) {
        // If image is explicitly set to null, delete old image
        if (previousImagePath) {
          deleteFileIfExists(previousImagePath);
        }
        cardData.image = null;
      }

      // Handle is_active from status
      if (cardData.status !== undefined) {
        cardData.is_active = cardData.status === 'true' || cardData.status === true;
      }

      // Update name if first_name or last_name changed
      if (cardData.first_name || cardData.last_name) {
        const firstName = cardData.first_name || existingCard.first_name;
        const lastName = cardData.last_name || existingCard.last_name;
        cardData.name = `${firstName} ${lastName}`;
      }

      // Update the card
      const updatedCard = await LibraryCard.updateById(req.params.id, cardData, userId);

      return res.status(200).json({
        success: true,
        data: updatedCard,
        message: "Library card updated successfully",
      });
    } catch (error) {
      console.error("❌ Error updating library card:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  // ============ DELETE ROUTE ============

  // DELETE library card
  router.delete("/:id", fetchUser, async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode);

      // Get card before deletion to delete image
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
        data: result.data
      });
    } catch (error) {
      console.error("❌ Error deleting library card:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  // ============ IMPORT ROUTE ============

  // POST import library cards
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
          // Generate card number if not provided
          if (!member.card_number) {
            member.card_number = await generateAutoNumberSafe('library_members', userId, 'LIB-', 5);
          }

          const card = await LibraryCard.create(member, userId);
          results.push({ success: true, data: card });
        } catch (error) {
          results.push({
            success: false,
            error: error.message,
            member: { ...member, card_number: member.card_number || 'NOT_GENERATED' }
          });
        }
      }

      const successCount = results.filter(r => r.success).length;

      return res.status(200).json({
        success: true,
        message: `Imported ${successCount} out of ${members.length} members`,
        results
      });
    } catch (error) {
      console.error("❌ Error importing members:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Register router
  app.use(process.env.BASE_API_URL + "/api/librarycard", router);
};