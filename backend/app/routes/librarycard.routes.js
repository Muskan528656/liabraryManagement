



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
const { fetchUser } = require("../middleware/fetchuser.js");
const LibraryCard = require("../models/librarycard.model.js");
const sql = require("../models/db.js");

require("dotenv").config();

// ------------------- UPLOAD FOLDERS -------------------
const uploadDir = "/var/www/html/uploads/librarycards";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ------------------- MULTER SETUP -------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `librarycard-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  }
});

// ------------------- HELPER -------------------
const deleteFileIfExists = (filePath) => {
  if (!filePath) return;
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join("/var/www/html/uploads", filePath.replace(/^\/uploads\//, ""));
  if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
};


console.log("Multer configured successfully for library cards.");
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
      const cardNumber = await generateAutoNumberSafe("library_members", userId, 'LIB-', 5);
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
      if (!card) return res.status(404).json({ error: "Library card not found" });
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
      if (!card) return res.status(404).json({ error: "Library card not found" });
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
      if (!card) return res.status(404).json({ error: "Library card not found" });
      return res.status(200).json(card);
    } catch (error) {
      console.error("Error fetching library card:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // router.post(
  //   "/",
  //   fetchUser,
  //   upload.single("image"),
  //   [
  //     body("first_name").notEmpty().withMessage("First name is required"),
  //     body("last_name").notEmpty().withMessage("Last name is required"),
  //     body("email").optional().isEmail().withMessage("Valid email required"),
  //     body("phone_number").optional().isString(),
  //     body("type_id").optional().isString(),
  //   ],
  //   async (req, res) => {


  //     try {
  //       const errors = validationResult(req);
  //       if (!errors.isEmpty()) {
  //         return res.status(400).json({ errors: errors.array() });
  //       }

  //       LibraryCard.init(req.userinfo.tenantcode);
  //       const userId = req.userinfo?.id || null;
  //       const cardData = { ...req.body };
  //       const originalPlanId = cardData.plan_id; 


  //       if (req.file) {
  //         cardData.image = `/uploads/librarycards/${req.file.filename}`;

  //       } else if (req.body.image && req.body.image.startsWith("data:image/")) {

  //         try {
  //           const matches = req.body.image.match(/^data:image\/(\w+);base64,/);
  //           if (matches) {
  //             const ext = matches[1];
  //             const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, "");
  //             const buffer = Buffer.from(base64Data, "base64");

  //             const uniqueFile = `base64-${Date.now()}-${Math.random().toString().slice(2)}.${ext}`;
  //             const filePath = path.join(libraryCardUploadDir, uniqueFile);

  //             fs.writeFileSync(filePath, buffer);
  //             cardData.image = `/uploads/librarycards/${uniqueFile}`;
  //           }
  //         } catch (err) {
  //           console.error("Base64 image error:", err);
  //           cardData.image = null;
  //         }
  //       }


  //       if (cardData.status !== undefined) {
  //         cardData.is_active = cardData.status === 'true' || cardData.status === true;
  //       }


  //       if (cardData.plan_id !== undefined) {
  //         cardData.subscription_id = cardData.plan_id;
  //         delete cardData.plan_id;
  //       }

  //       const card = await LibraryCard.create(cardData, userId);

  //       // Create subscription if plan_id was provided
  //       if (originalPlanId) {
  //         try {
  //           // Fetch plan details
  //           const planQuery = `SELECT plan_name, duration_days, allowed_books FROM ${req.userinfo.tenantcode}.plan WHERE id = $1`;
  //           const planResult = await sql.query(planQuery, [originalPlanId]);
  //           if (planResult.rows.length === 0) {
  //             console.error("Plan not found for subscription creation");
  //           } else {
  //             const plan = planResult.rows[0];
  //             const startDate = new Date().toISOString().split('T')[0];
  //             const endDate = new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  //             const subscriptionData = {
  //               plan_id: originalPlanId,
  //               member_id: card.id,
  //               user_id: userId,
  //               card_id: card.id,
  //               plan_name: plan.plan_name,
  //               duration_days: plan.duration_days,
  //               allowed_books: plan.allowed_books,
  //               start_date: startDate,
  //               end_date: endDate,
  //               is_active: true,
  //               createdbyid: userId,
  //               lastmodifiedbyid: userId,
  //               createddate: new Date(),
  //               lastmodifieddate: new Date(),
  //             };

  //             const columns = Object.keys(subscriptionData);
  //             const values = Object.values(subscriptionData);
  //             const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
  //             const columnNames = columns.join(', ');

  //             const insertQuery = `
  //               INSERT INTO ${req.userinfo.tenantcode}.subscriptions (${columnNames})
  //               VALUES (${placeholders})
  //               RETURNING *
  //             `;

  //             await sql.query(insertQuery, values);
  //             console.log("Subscription created successfully for library card");
  //           }
  //         } catch (subError) {
  //           console.error("Error creating subscription:", subError);

  //         }
  //       }

  //       return res.status(201).json({
  //         success: true,
  //         data: card,
  //         message: "Library card created successfully",
  //       });
  //     } catch (error) {
  //       console.error("❌ Error creating library card:", error);
  //       return res.status(500).json({ error: error.message });
  //     }
  //   }
  // );

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
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        LibraryCard.init(req.userinfo.tenantcode);
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


  // router.post(
  //   "/",
  //   fetchUser,
  //   upload.single("image"),
  //   [
  //     body("first_name").notEmpty().withMessage("First name is required"),
  //     body("last_name").notEmpty().withMessage("Last name is required"),
  //     body("email").optional().isEmail().withMessage("Valid email required"),
  //     body("phone_number").optional().isString(),
  //     body("type_id").optional().isString(),
  //   ],
  //   async (req, res) => {
  //     console.log("📥 Received request to create library card:", {
  //       ...req.body,
  //       image: req.file ? "[FILE DATA]" : req.body.image ? "[BASE64 DATA]" : null
  //     });

  //     try {
  //       const errors = validationResult(req);
  //       if (!errors.isEmpty()) {
  //         return res.status(400).json({ errors: errors.array() });
  //       }

  //       LibraryCard.init(req.userinfo.tenantcode);
  //       const userId = req.userinfo?.id || null;
  //       const cardData = { ...req.body };
  //       const originalPlanId = cardData.plan_id; // Store original plan_id for subscription creation

  //       console.log("📥 Creating library card with data:", {
  //         ...cardData,
  //         image: cardData.image ? "[IMAGE DATA]" : "null"
  //       });


  //       if (req.file) {
  //         cardData.image = `/uploads/librarycards/${req.file.filename}`;

  //       } else if (req.body.image && req.body.image.startsWith("data:image/")) {

  //         try {
  //           const matches = req.body.image.match(/^data:image\/(\w+);base64,/);
  //           if (matches) {
  //             const ext = matches[1];
  //             const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, "");
  //             const buffer = Buffer.from(base64Data, "base64");

  //             const uniqueFile = `base64-${Date.now()}-${Math.random().toString().slice(2)}.${ext}`;
  //             const filePath = path.join(libraryCardUploadDir, uniqueFile);

  //             fs.writeFileSync(filePath, buffer);
  //             cardData.image = `/uploads/librarycards/${uniqueFile}`;
  //           }
  //         } catch (err) {
  //           console.error("Base64 image error:", err);
  //           cardData.image = null;
  //         }
  //       }


  //       if (cardData.status !== undefined) {
  //         cardData.is_active = cardData.status === 'true' || cardData.status === true;
  //       }



  //       if (cardData.plan_id !== undefined) {
  //         cardData.subscription_id = cardData.plan_id;

  //       }

  //       cardData.plan_id = originalPlanId;
  //       const card = await LibraryCard.create(cardData, userId);


  //       if (originalPlanId) {
  //         try {

  //           const planQuery = `SELECT plan_name, duration_days, allowed_books FROM ${req.userinfo.tenantcode}.plan WHERE id = $1`;
  //           const planResult = await sql.query(planQuery, [originalPlanId]);
  //           if (planResult.rows.length === 0) {
  //             console.error("Plan not found for subscription creation");
  //           } else {
  //             const plan = planResult.rows[0];
  //             const startDate = new Date().toISOString().split('T')[0];
  //             const endDate = new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  //             const subscriptionData = {
  //               plan_id: originalPlanId,
  //               member_id: card.id,
  //               user_id: userId,
  //               card_id: card.id,
  //               plan_name: plan.plan_name,
  //               duration_days: plan.duration_days,
  //               allowed_books: plan.allowed_books,
  //               start_date: startDate,
  //               end_date: endDate,
  //               is_active: true,
  //               createdbyid: userId,
  //               lastmodifiedbyid: userId,
  //               createddate: new Date(),
  //               lastmodifieddate: new Date(),
  //             };

  //             const columns = Object.keys(subscriptionData);
  //             const values = Object.values(subscriptionData);
  //             const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
  //             const columnNames = columns.join(', ');

  //             const insertQuery = `
  //               INSERT INTO ${req.userinfo.tenantcode}.subscriptions (${columnNames})
  //               VALUES (${placeholders})
  //               RETURNING *
  //             `;

  //             await sql.query(insertQuery, values);
  //             console.log("Subscription created successfully for library card");
  //           }
  //         } catch (subError) {
  //           console.error("Error creating subscription:", subError);

  //         }
  //       }


  //       return res.status(201).json({
  //         success: true,
  //         data: card,
  //         message: "Library card created successfully",

  //       });

  //     } catch (error) {

  //       return res.status(500).json({ error: error.message });
  //     }
  //   }
  // );

  router.put("/:id", fetchUser, upload.single('image'), async (req, res) => {
    try {
      LibraryCard.init(req.userinfo.tenantcode);


      const existingCard = await LibraryCard.findById(req.params.id);
      if (!existingCard) {
        return res.status(404).json({ error: "Library card not found" });
      }

      const userId = req.userinfo?.id || null;
      const cardData = { ...req.body };
      const previousImagePath = existingCard.image;

      if (req.file) {

        if (previousImagePath) {
          deleteFileIfExists(previousImagePath);
        }
        cardData.image = `/uploads/librarycards/${req.file.filename}`;
      } else if (cardData.image === 'null' || cardData.image === null) {
        console.log("else if block for image nullification triggered.");
        if (previousImagePath) {
          deleteFileIfExists(previousImagePath);
        }
        cardData.image = null;
      }


      if (cardData.status !== undefined) {
        cardData.is_active = cardData.status === 'true' || cardData.status === true;
      }


      if (cardData.plan_id !== undefined) {
        cardData.subscription_id = cardData.plan_id;
        delete cardData.plan_id;
      }


      if (cardData.type_id !== undefined && !cardData.type) {
        cardData.type = cardData.type_id;
        delete cardData.type_id;
      }


      if (cardData.first_name || cardData.last_name) {
        const firstName = cardData.first_name || existingCard.first_name;
        const lastName = cardData.last_name || existingCard.last_name;
        cardData.name = `${firstName} ${lastName}`;
      }


      if (cardData.dob) {

        cardData.dob = new Date(cardData.dob);
      }

      if (cardData.registration_date) {

        cardData.registration_date = new Date(cardData.registration_date);
      }


      const fieldsToUpdate = {
        ...cardData,
        lastmodifiedbyid: userId,
        lastmodifieddate: new Date()
      };


      Object.keys(fieldsToUpdate).forEach(key => {
        if (fieldsToUpdate[key] === '' && key !== 'name') {
          fieldsToUpdate[key] = null;
        }
      });




      const updatedCard = await LibraryCard.updateById(req.params.id, fieldsToUpdate, userId);


      const responseCard = {
        ...updatedCard,

        dob: updatedCard.dob ? new Date(updatedCard.dob).toISOString().split('T')[0] : null,
        registration_date: updatedCard.registration_date ? new Date(updatedCard.registration_date).toISOString().split('T')[0] : null,

        plan_id: updatedCard.subscription_id,

        type_id: updatedCard.type
      };

      return res.status(200).json({
        success: true,
        data: responseCard,
        message: "Library card updated successfully",
      });
    } catch (error) {
      console.error("❌ Error updating library card:", error);
      return res.status(500).json({ error: error.message });
    }
  });




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
        data: result.data
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


  // router.post("/import", fetchUser, async (req, res) => {
  //   try {
  //     const { members } = req.body;
  //     if (!Array.isArray(members)) {
  //       return res.status(400).json({ error: "Members should be an array" });
  //     }

  //     LibraryCard.init(req.userinfo.tenantcode);
  //     const userId = req.userinfo?.id || null;

  //     const results = [];
  //     for (const member of members) {
  //       try {

  //         if (!member.card_number) {
  //           member.card_number = await generateAutoNumberSafe('library_members', userId, 'LIB-', 5);
  //         }

  //         const card = await LibraryCard.create(member, userId);
  //         results.push({ success: true, data: card });
  //       } catch (error) {
  //         results.push({
  //           success: false,
  //           error: error.message,
  //           member: { ...member, card_number: member.card_number || 'NOT_GENERATED' }
  //         });
  //       }
  //     }

  //     const successCount = results.filter(r => r.success).length;

  //     return res.status(200).json({
  //       success: true,
  //       message: `Imported ${successCount} out of ${members.length} members`,
  //       results
  //     });
  //   } catch (error) {
  //     console.error("❌ Error importing members:", error);
  //     return res.status(500).json({ error: "Internal server error" });
  //   }
  // });


  app.use(process.env.BASE_API_URL + "/api/librarycard", router);
};



