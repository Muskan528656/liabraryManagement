

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

const e = require("express");
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
const legacyUploadDir = path.join(__dirname, "../../uploads/librarycards");

const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};
[frontendPublicDir, frontendUploadsDir, libraryCardUploadDir].forEach(ensureDirectory);

const sanitizeRelativePath = (filePath = "") => {
  if (!filePath || typeof filePath !== "string") return null;
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return null;

  let normalized = filePath.replace(/\\/g, "/");
  if (normalized.startsWith("/")) normalized = normalized.slice(1);
  if (!normalized.startsWith("uploads/")) {
    normalized = path.join("uploads", "librarycards", normalized).replace(/\\/g, "/");
  }
  return normalized;
};

const deleteFileIfExists = (filePath = "") => {
  const relativePath = sanitizeRelativePath(filePath);
  if (!relativePath) return;

  const candidatePaths = [
    path.join(frontendPublicDir, relativePath),
    path.join(__dirname, "../../", relativePath),
    path.join(legacyUploadDir, path.basename(relativePath)),
  ];

  const visited = new Set();

  candidatePaths.forEach((absolutePath) => {
    if (!absolutePath || visited.has(absolutePath)) return;
    visited.add(absolutePath);

    try {
      if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
    } catch (err) {
      console.error("Error removing stale library card image:", absolutePath, err.message);
    }
  });
};



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
  router.get("/auto-config-card", async (req, res) => {
    try {

      const cardNumber = await generateAutoNumberSafe("library_members", null);
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
      return res.status(500).json({ errors: "Internal server error" });
    }
  });


  router.get("/:id", fetchUser, async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode);
      const card = await LibraryCard.findById(req.params.id);
      if (!card) return res.status(404).json({ errors: "Library card not found" });
      return res.status(200).json(card);
    } catch (error) {
      console.error("Error fetching library card:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });


  router.get("/card/:cardNumber", fetchUser, async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode);
      const card = await LibraryCard.findByCardNumber(req.params.cardNumber);
      if (!card) return res.status(404).json({ errors: "Library card not found" });
      return res.status(200).json(card);
    } catch (error) {
      console.error("Error fetching library card:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });


  router.get("/student/:studentId", fetchUser, async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode);
      const card = await LibraryCard.findByStudentId(req.params.studentId);
      if (!card) return res.status(404).json({ errors: "Library card not found" });
      return res.status(200).json(card);
    } catch (error) {
      console.error("Error fetching library card:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  router.post(
    "/",
    fetchUser,
    upload.single("image"),
    [
      body("is_active").optional().isBoolean(),
      body("first_name").optional().isString(),
      body("last_name").optional().isString(),
      body("email").optional().isEmail(),
      body("phone_number").optional().isString(),
      body("type").optional().isString(),
      body("plan_id").optional().isUUID(),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
          return res.status(400).json({ errors: errors.array() });

        LibraryCard.init(req.userinfo.tenantcode);
        const userId = req.userinfo?.id || null;

        const cardData = { ...req.body };

        console.log("=== IMAGE HANDLING START ===");




        if (req.file) {
          console.log("📁 Uploaded file detected");

          const uploadedFileName = req.file.filename;
          cardData.image = `/uploads/librarycards/${uploadedFileName}`;

          console.log("➡ Stored:", cardData.image);
        }




        else if (
          req.body.image &&
          typeof req.body.image === "string" &&
          req.body.image.startsWith("data:image/")
        ) {
          console.log("🟡 Base64 detected");

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
              console.log("💾 Base64 saved:", cardData.image);
            }
          } catch (err) {
            console.error("❌ Base64 error:", err);
            cardData.image = null;
          }
        }




        else if (
          req.body.image &&
          typeof req.body.image === "string" &&
          fs.existsSync(req.body.image)
        ) {
          console.log("📂 Local file path detected:", req.body.image);

          const originalPath = req.body.image;
          const ext = path.extname(originalPath) || ".png";

          const newFileName = `copied-${Date.now()}-${Math.random()
            .toString()
            .slice(2)}${ext}`;
          const newFilePath = path.join(libraryCardUploadDir, newFileName);

          fs.copyFileSync(originalPath, newFilePath);

          cardData.image = `/uploads/librarycards/${newFileName}`;

          console.log("📥 Copied local file to upload folder:", cardData.image);
        }





        else if (req.body.image) {
          if (typeof req.body.image === "string") {
            console.log("🔗 URL or string path provided");
            cardData.image = req.body.image.trim();
          } else {
            console.warn("⚠ Ignoring non-string image value:", req.body.image);
            cardData.image = null;
          }
        }




        else {
          console.log("⚠ No image provided");
          cardData.image = null;
        }

        console.log("=== IMAGE HANDLING END ===");


        const card = await LibraryCard.create(cardData, userId);
        const createdCard = await LibraryCard.findById(card.id);

        return res.status(200).json({
          success: true,
          data: createdCard,
          message: "Library card created successfully",
        });
      } catch (error) {
        console.error("❌ Error creating library card:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );









































































































































  router.put("/:id", fetchUser, upload.single('image'), async (req, res) => {
    try {
      console.log("res=>>", req.body);
      LibraryCard.init(req.userinfo.tenantcode);

      const existingCard = await LibraryCard.findById(req.params.id);
      if (!existingCard) return res.status(404).json({ errors: "Library card not found" });

      const userId = req.userinfo?.id || null;
      let cardData = { ...req.body };
      const previousImagePath = existingCard.image;

      console.log("=== LIBRARY CARD UPDATE DEBUG ===");
      console.log("1. Existing card image:", previousImagePath);
      console.log("2. Request body image:", req.body.image);
      console.log("3. Request file exists:", !!req.file);
      console.log("4. Content-Type:", req.headers['content-type']);


      if (cardData.image) {
        console.log("5. Image field value:", cardData.image);
        console.log("6. Image field type:", typeof cardData.image);


        if (typeof cardData.image === 'string' &&
          (cardData.image.includes('{"{}') ||
            cardData.image.includes('{') && cardData.image.includes('}'))) {

          console.log("7. Detected malformed JSON image string");


          const pathMatch = cardData.image.match(/uploads\/[^"{}]+/);
          if (pathMatch) {
            cardData.image = `/${pathMatch[0]}`;
            console.log("8. Extracted path:", cardData.image);
          } else {

            delete cardData.image;
            console.log("9. Removed image field");
          }
        }


        if (cardData.image === '' || cardData.image === 'null') {
          cardData.image = null;
          console.log("10. Set image to null");
        }
      }


      if (req.file) {
        cardData.image = `/uploads/librarycards/${req.file.filename}`;
        console.log("11. New image from file:", cardData.image);
      }



      if (cardData.registration_date) {
        try {
          cardData.registration_date = new Date(cardData.registration_date).toISOString();
        } catch (err) {
          console.log("Date format error:", err.message);
        }
      }

      console.log("12. Final cardData to save:", cardData);


      const card = await LibraryCard.updateById(req.params.id, cardData, userId);
      if (!card) return res.status(400).json({ errors: "Failed to update library card" });


      if (req.file && previousImagePath && previousImagePath !== cardData.image) {

        if (typeof previousImagePath === 'string' && previousImagePath.includes('uploads')) {
          deleteFileIfExists(previousImagePath);
        }
      }


      if (card.image && typeof card.image === 'string' && card.image.includes('{"')) {

        const cleanPath = card.image.replace(/[{}"]/g, '');
        if (cleanPath.includes('uploads')) {
          card.image = cleanPath;
        }
      }

      console.log("13. Response data:", card);
      return res.status(200).json({ success: true, data: card });
    } catch (error) {
      console.error("Error updating library card:", error);
      return res.status(500).json({ errors: error.message });
    }
  });
  router.delete("/:id", fetchUser, async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode);
      const result = await LibraryCard.deleteById(req.params.id);
      if (!result.success) return res.status(404).json({ errors: result.message });
      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      console.error("Error deleting library card:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  app.use(process.env.BASE_API_URL + "/api/librarycard", router);
};