
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
    upload.single('image'),
    [

      body("is_active").optional().isBoolean().withMessage("is_active must be boolean"),
      body("first_name").optional().isString(),
      body("last_name").optional().isString(),
      body("email").optional().isEmail(),
      body("phone_number").optional().isString(),
      body("type").optional().isString(),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        LibraryCard.init(req.userinfo.tenantcode);
        const userId = req.userinfo?.id || null;

        const cardData = { ...req.body };
        if (req.file) cardData.image = `/uploads/librarycards/${req.file.filename}`;

        const card = await LibraryCard.create(cardData, userId);
        if (!card) return res.status(400).json({ errors: "Failed to create library card" });

        return res.status(200).json({ success: true, data: card });
      } catch (error) {
        console.error("Error creating library card:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );


  router.put("/:id", fetchUser, upload.single('image'), async (req, res) => {
    console.log("workingggggggggggggggggg")
    try {
      LibraryCard.init(req.userinfo.tenantcode);

      const existingCard = await LibraryCard.findById(req.params.id);
      if (!existingCard) return res.status(404).json({ errors: "Library card not found" });

      const userId = req.userinfo?.id || null;
      const cardData = { ...req.body };
      const previousImagePath = existingCard.image;

      if (req.file) cardData.image = `/uploads/librarycards/${req.file.filename}`;
   
      const card = await LibraryCard.updateById(req.params.id, cardData, userId);
      if (!card) return res.status(400).json({ errors: "Failed to update library card" });

      if (req.file && previousImagePath && previousImagePath !== cardData.image) {
        deleteFileIfExists(previousImagePath);
      }

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