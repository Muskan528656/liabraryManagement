/**
 * Handles all incoming request for /api/librarycard endpoint
 * DB table for this demo.id_cards
 * Model used here is librarycard.model.js
 * SUPPORTED API ENDPOINTS
 *              GET     /api/librarycard
 *              GET     /api/librarycard/:id
 *              GET     /api/librarycard/card/:cardNumber
 *              GET     /api/librarycard/student/:studentId
 *              POST    /api/librarycard
 *              PUT     /api/librarycard/:id
 *              DELETE  /api/librarycard/:id
 *
 *@author     Muskan Khan
@date   DEC,   2025
 * @copyright   www.ibirdsservices.com
 */

const e = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { fetchUser } = require("../middleware/fetchuser.js");
const LibraryCard = require("../models/librarycard.model.js");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/librarycards');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure directory exists before saving
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);  
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'librarycard-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

module.exports = (app) => {
  const { body, validationResult } = require("express-validator");

  var router = require("express").Router();

  // Get all library cards
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

  // Get library card by ID
  router.get("/:id", fetchUser, async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode);
      const card = await LibraryCard.findById(req.params.id);
      if (!card) {
        return res.status(404).json({ errors: "Library card not found" });
      }
      return res.status(200).json(card);
    } catch (error) {
      console.error("Error fetching library card:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // Get library card by card number
  router.get("/card/:cardNumber", fetchUser, async (req, res) => {
    console.log("Received request for card number:", req.params.cardNumber);
    try {
      LibraryCard.init(req.userinfo.tenantcode);
      const card = await LibraryCard.findByCardNumber(req.params.cardNumber);
      if (!card) {
        return res.status(404).json({ errors: "Library card not found" });
      }
      return res.status(200).json(card);
    } catch (error) {
      console.error("Error fetching library card:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // Get library card by user ID
  router.get("/user/:userId", fetchUser, async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode);
      const card = await LibraryCard.findByUserId(req.params.userId);
      if (!card) {
        return res.status(404).json({ errors: "Library card not found" });
      }
      return res.status(200).json(card);
    } catch (error) {
      console.error("Error fetching library card:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // Get library card by student ID (for backward compatibility)
  router.get("/student/:studentId", fetchUser, async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode);
      const card = await LibraryCard.findByStudentId(req.params.studentId);
      if (!card) {
        return res.status(404).json({ errors: "Library card not found" });
      }
      return res.status(200).json(card);
    } catch (error) {
      console.error("Error fetching library card:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // Create a new library card
  router.post(
    "/",
    fetchUser,
    upload.single('image'),
    [
      body("user_id").optional().isUUID().withMessage("User ID must be a valid UUID"),
      body("card_type_id").optional().isUUID().withMessage("Card type ID must be a valid UUID"),
      body("card_number").optional().isString().withMessage("Card number must be a string"),
      body("issue_date").optional().isISO8601().withMessage("Issue date must be a valid date"),
      body("expiry_date").optional().isISO8601().withMessage("Expiry date must be a valid date"),
      body("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        
        LibraryCard.init(req.userinfo.tenantcode);
        const userId = req.user?.id || null;
        
        // Handle file upload
        const cardData = { ...req.body };
        if (req.file) {
          // Store file path or URL - use relative path from public/uploads
          const fileUrl = `../frontend/public/uploads/librarycards/${req.file.filename}`;

          cardData.image = fileUrl;
        }
        
        const card = await LibraryCard.create(cardData, userId);
        if (!card) {
          return res.status(400).json({ errors: "Failed to create library card" });
        }
        return res.status(200).json({ success: true, data: card });
      } catch (error) {
        console.error("Error creating library card:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );

  // Update library card by ID
  router.put(
    "/:id",
    fetchUser,
    upload.single('image'),
    async (req, res) => {
      try {
        LibraryCard.init(req.userinfo.tenantcode);
        // Check if card exists
        const existingCard = await LibraryCard.findById(req.params.id);
        if (!existingCard) {
          return res.status(404).json({ errors: "Library card not found" });
        }

        const userId = req.user?.id || null;
        
        // Handle file upload
        const cardData = { ...req.body };
        if (req.file) {
          // Store file path or URL - use relative path from public/uploads
          const fileUrl = `../frontend/public/uploads/librarycards/${req.file.filename}`;
          console.log('fileUrl' , fileUrl)
          cardData.image = fileUrl;
        }
        
        const card = await LibraryCard.updateById(req.params.id, cardData, userId);
        if (!card) {
          return res.status(400).json({ errors: "Failed to update library card" });
        }
        return res.status(200).json({ success: true, data: card });
      } catch (error) {
        console.error("Error updating library card:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );

  // Delete library card by ID
  router.delete("/:id", fetchUser, async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode);
      const result = await LibraryCard.deleteById(req.params.id);
      if (!result.success) {
        return res.status(404).json({ errors: result.message });
      }
      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      console.error("Error deleting library card:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  app.use(process.env.BASE_API_URL + "/api/librarycard", router);
};

