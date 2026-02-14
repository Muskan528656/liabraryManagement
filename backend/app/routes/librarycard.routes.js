



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
const { body, validationResult } = require("express-validator");
const { fetchUser, checkPermission } = require("../middleware/fetchuser.js");
const LibraryCard = require("../models/librarycard.model.js");
const sql = require("../models/db.js");
const { applyMemberTypeFilter } = require("../utils/autoNumber.helper.js");

require("dotenv").config();
const uploadDir = path.join(
  __dirname,
  "../../uploads/librarycards"
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// const uploadDir = "/var/www/html/uploads/librarycards";
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `librarycard-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  }
});


const deleteFileIfExists = (filePath) => {
  if (!filePath) return;
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join("/var/www/html/uploads", filePath.replace(/^\/uploads\//, ""));
  if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
};
module.exports = (app) => {


  const { body, validationResult } = require("express-validator");
  var router = require("express").Router();
  router.get("/object-types", fetchUser, checkPermission("Library Members", "allow_view"), async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode, req.branchId);
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


  router.get("/auto-config-card", fetchUser, checkPermission("Library Members", "allow_view"), async (req, res) => {
    try {
      const userId = req.userinfo?.id || null;
      const cardNumber = await generateAutoNumberSafe("library_members", userId, 'LIB-', 5);
      res.json({ card_number: cardNumber });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Auto-config failed" });
    }
  });
  router.get(
    "/",
    fetchUser,
    checkPermission("Library Members", "allow_view"),
    async (req, res) => {
      try {
        LibraryCard.init(req.userinfo.tenantcode, req.branchId);

        const memberType = req.userinfo.library_member_type;

        console.log("Member Type:", memberType);

        const cards = await LibraryCard.findAll(memberType);

        return res.status(200).json(cards);

      } catch (error) {
        console.error("Error fetching library cards:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  );



  router.get("/card/:cardNumber", fetchUser, checkPermission("Library Members", "allow_view"), async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode, req.branchId);
      // const card = await LibraryCard.findByCardNumber(req.params.cardNumber);
      const card = await LibraryCard.findByCardNumber(
        req.params.cardNumber,
        req.userinfo.library_member_type
      );
      if (!card) return res.status(404).json({ error: "Library card not found" });
      return res.status(200).json(card);
    } catch (error) {
      console.error("Error fetching library card:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });


  router.get("/student/:studentId", fetchUser, checkPermission("Library Members", "allow_view"), async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode, req.branchId);
      // const card = await LibraryCard.findByStudentId(req.params.studentId);
      const card = await LibraryCard.findByStudentId(
        req.params.studentId,
        req.userinfo.library_member_type
      );
      if (!card) return res.status(404).json({ error: "Library card not found" });
      return res.status(200).json(card);
    } catch (error) {
      console.error("Error fetching library card:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });


  router.get("/:id", fetchUser, checkPermission("Library Members", "allow_view"), async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode, req.branchId);
      // const card = await LibraryCard.findById(req.params.id);
      const card = await LibraryCard.findById(
        req.params.id,
        req.userinfo.library_member_type
      );
      if (!card) return res.status(404).json({ error: "Library card not found" });
      return res.status(200).json(card);
    } catch (error) {
      console.error("Error fetching library card:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post(
    "/",
    fetchUser, checkPermission("Library Members", "allow_create"),
    upload.single("image"),
    // [
    //   body("first_name").notEmpty().withMessage("First name is required"),
    //   body("last_name").notEmpty().withMessage("Last name is required"),
    //   body("email").optional().isEmail().withMessage("Valid email required"),
    //   body("phone_number").optional().isString(),
    //   body("type_id").optional().isString(),
    // ],
    // [
    //   body("email").optional().custom((value) => {
    //     return true;
    //   }),
    // ],
    async (req, res) => {
      try {
        console.log("Library card creation request body:", req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        LibraryCard.init(req.userinfo.tenantcode, req.branchId);
        const userId = req.userinfo?.id || null;
        const cardData = { ...req.body };
        const originalPlanId = cardData.plan_id;

        // Handle Multer or Base64 image
        if (req.file) {
          cardData.image = `/uploads/librarycards/${req.file.filename}`;
        } else if (cardData.image?.startsWith("data:image/")) {
          try {
            const matches = cardData.image.match(/^data:image\/(\w+);base64,/);
            if (matches) {
              const ext = matches[1];
              const base64Data = cardData.image.replace(/^data:image\/\w+;base64,/, "");
              const buffer = Buffer.from(base64Data, "base64");
              const uniqueFile = `base64-${Date.now()}-${Math.random().toString().slice(2)}.${ext}`;
              const filePath = path.join(uploadDir, uniqueFile);
              fs.writeFileSync(filePath, buffer);
              cardData.image = `/uploads/librarycards/${uniqueFile}`;
            }
          } catch (err) {
            console.error("Base64 image error:", err);
            cardData.image = null;
          }
        }

        if (cardData.status !== undefined) cardData.is_active = cardData.status === "true" || cardData.status === true;
        if (cardData.plan_id !== undefined) cardData.subscription_id = cardData.plan_id;

        cardData.plan_id = originalPlanId;

        const card = await LibraryCard.create(cardData, userId);

        // Create subscription if plan_id exists
        if (originalPlanId) {
          try {
            const planResult = await sql.query(`SELECT plan_name, duration_days, allowed_books FROM ${req.userinfo.tenantcode}.plan WHERE id=$1`, [originalPlanId]);
            if (planResult.rows.length > 0) {
              const plan = planResult.rows[0];
              const startDate = new Date().toISOString().split("T")[0];
              const endDate = new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
              const subscriptionData = {
                plan_id: originalPlanId,
                member_id: card.id,
                user_id: userId,
                card_id: card.id,
                plan_name: plan.plan_name,
                duration_days: plan.duration_days,
                allowed_books: plan.allowed_books,
                start_date: startDate,
                end_date: endDate,
                is_active: true,
                createdbyid: userId,
                lastmodifiedbyid: userId,
                createddate: new Date(),
                lastmodifieddate: new Date(),
              };
              const columns = Object.keys(subscriptionData);
              const values = Object.values(subscriptionData);
              const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
              const insertQuery = `INSERT INTO ${req.userinfo.tenantcode}.subscriptions (${columns.join(",")}) VALUES (${placeholders}) RETURNING *`;
              await sql.query(insertQuery, values);
              console.log("Subscription created successfully for library card");
            }
          } catch (subError) {
            console.error("Subscription creation error:", subError);
          }
        }

        return res.status(201).json({ success: true, data: card, message: "Library card created successfully" });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
      }
    }
  );

  router.put(
    "/:id",
    fetchUser,
    checkPermission("Library Members", "allow_edit"),
    upload.single("image"),
    async (req, res) => {
      try {
         LibraryCard.init(req.userinfo.tenantcode, req.branchId);

        const existingCard = await LibraryCard.findById(req.params.id);
        if (!existingCard) {
          return res.status(404).json({ error: "Library card not found" });
        }

        const userId = req.userinfo?.id || null;
        const cardData = { ...req.body };

        console.log("Incoming body:", cardData);

        const previousImagePath = existingCard.image;

        if (req.file) {
          if (previousImagePath) deleteFileIfExists(previousImagePath);
          cardData.image = `/uploads/librarycards/${req.file.filename}`;
        } else if (cardData.image === "null" || cardData.image === null) {
          if (previousImagePath) deleteFileIfExists(previousImagePath);
          cardData.image = null;
        }


        if (cardData.status !== undefined) {
          cardData.is_active =
            cardData.status === "true" || cardData.status === true;
        }


        if (cardData.plan_id !== undefined) {
          cardData.subscription_id = cardData.plan_id;
          delete cardData.plan_id;
        }


        if (cardData.type_id !== undefined) {
          cardData.type = cardData.type_id;
          delete cardData.type_id;
        }

        if (cardData.first_name || cardData.last_name) {
          cardData.name = `${cardData.first_name || ""} ${cardData.last_name || ""
            }`.trim();
        }
        if (cardData.dob) cardData.dob = new Date(cardData.dob);
        if (cardData.registration_date)
          cardData.registration_date = new Date(cardData.registration_date);

        Object.keys(cardData).forEach((key) => {
          if (cardData[key] === "") cardData[key] = null;
        });
        if (cardData.library_member_type !== undefined) {
          cardData.library_member_type = cardData.library_member_type;
        }
        console.log("cardDatacardDatacardData",cardData)
        const updatedCard = await LibraryCard.updateById(
          req.params.id,
          cardData,
          userId
        );

        return res.status(200).json({
          success: true,
          data: updatedCard,
          message: "Library card updated successfully",
        });
      } catch (error) {
        console.error("❌ Error updating:", error);
        return res.status(500).json({ error: error.message });
      }
    }
  );


  router.delete("/:id", fetchUser, checkPermission("Library Members", "allow_delete"), async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode, req.branchId);


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

  router.post("/import", fetchUser, checkPermission("Library Members", "allow_create"), async (req, res) => {
    try {
      const { members } = req.body;
      if (!Array.isArray(members)) {
        return res.status(400).json({ error: "Members should be an array" });
      }

      LibraryCard.init(req.userinfo.tenantcode, req.branchId);      
      const userId = req.userinfo?.id || null;

      const results = [];
      for (const member of members) {
        try {
          const originalPlanId = member.plan_id;

          if (!member.card_number) {
            member.card_number = await generateAutoNumberSafe('library_members', userId, 'LIB-', 5);
          }

          const card = await LibraryCard.create(member, userId);


          if (originalPlanId) {
            try {

              const planQuery = `SELECT plan_name, duration_days, allowed_books FROM ${req.userinfo.tenantcode}.plan WHERE id = $1`;
              const planResult = await sql.query(planQuery, [originalPlanId]);
              if (planResult.rows.length > 0) {
                const plan = planResult.rows[0];
                const startDate = new Date().toISOString().split('T')[0];
                const endDate = new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                const subscriptionData = {
                  plan_id: originalPlanId,
                  member_id: card.id,
                  user_id: userId,
                  card_id: card.id,
                  plan_name: plan.plan_name,
                  duration_days: plan.duration_days,
                  allowed_books: plan.allowed_books,
                  start_date: startDate,
                  end_date: endDate,
                  is_active: true,
                  createdbyid: userId,
                  lastmodifiedbyid: userId,
                  createddate: new Date(),
                  lastmodifieddate: new Date(),
                };

                const columns = Object.keys(subscriptionData);
                const values = Object.values(subscriptionData);
                const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
                const columnNames = columns.join(', ');

                const insertQuery = `
                  INSERT INTO ${req.userinfo.tenantcode}.subscriptions (${columnNames})
                  VALUES (${placeholders})
                  RETURNING *
                `;

                await sql.query(insertQuery, values);
                console.log("Subscription created successfully for imported library card");
              }
            } catch (subError) {
              console.error("Error creating subscription for imported member:", subError);
            }
          }

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

  app.use(process.env.BASE_API_URL + "/api/librarycard", router);
};



