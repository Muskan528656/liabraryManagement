

/**
 * Handles all incoming request for /api/bookissue endpoint
 * DB table for this demo.book_issues
 * Model used here is bookissue.model.js
 * SUPPORTED API ENDPOINTS
 *              GET     /api/bookissue
 *              GET     /api/bookissue/active
 *              GET     /api/bookissue/book/:bookId
 *              GET     /api/bookissue/card/:cardId
 *              GET     /api/bookissue/:id
 *              POST    /api/bookissue/issue
 *              POST    /api/bookissue/return/:id
 *              GET     /api/bookissue/penalty/:id
 *              DELETE  /api/bookissue/:id
 *
 * @author     Muskan Khan
 * @date        Jan, 2025
 * @copyright   www.ibirdsservices.com
 */

const e = require("express");
const { fetchUser } = require("../middleware/fetchuser.js");
const BookIssue = require("../models/bookissue.model.js");
const Notification = require("../models/notification.model.js");
const sql = require("../models/db.js")
module.exports = (app) => {
  const { body, validationResult } = require("express-validator");

  var router = require("express").Router();


  router.get("/", fetchUser, async (req, res) => {
    try {
      BookIssue.init(req.userinfo.tenantcode);
      const issues = await BookIssue.findAll();
      return res.status(200).json(issues);
    } catch (error) {
      console.error("Error fetching book issues:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });


  router.get("/active", fetchUser, async (req, res) => {
    try {
      BookIssue.init(req.userinfo.tenantcode);
      const issues = await BookIssue.findActive();
      return res.status(200).json(issues);
    } catch (error) {
      console.error("Error fetching active issues:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });


  router.get("/book/:bookId", fetchUser, async (req, res) => {
    try {
      BookIssue.init(req.userinfo.tenantcode);
      const issues = await BookIssue.findByBookId(req.params.bookId);
      return res.status(200).json(issues);
    } catch (error) {
      console.error("Error fetching book issues:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });


  router.get("/user/:userId", fetchUser, async (req, res) => {
    try {
      BookIssue.init(req.userinfo.tenantcode);
      const issues = await BookIssue.findByUserId(req.params.userId);
      return res.status(200).json(issues);
    } catch (error) {
      console.error("Error fetching user issues:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });


  router.get("/card/:cardId", fetchUser, async (req, res) => {
    try {
      BookIssue.init(req.userinfo.tenantcode);
      const issues = await BookIssue.findByCardId(req.params.cardId);
      return res.status(200).json(issues);
    } catch (error) {
      console.error("Error fetching card issues:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });


  router.get("/:id", fetchUser, async (req, res) => {
    try {
      BookIssue.init(req.userinfo.tenantcode);
      const issue = await BookIssue.findById(req.params.id);
      if (!issue) {
        return res.status(404).json({ errors: "Book issue not found" });
      }
      return res.status(200).json(issue);
    } catch (error) {
      console.error("Error fetching book issue:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });
  router.post(
    "/issue",
    fetchUser,
    [
      body("book_id")
        .notEmpty()
        .isUUID()
        .withMessage("Book ID is required and must be a valid UUID"),
      body("card_id")
        .notEmpty()
        .isUUID()
        .withMessage("Card ID is required and must be a valid UUID"),
      body("issue_date")
        .optional()
        .isISO8601()
        .withMessage("Issue date must be a valid date"),
      body("condition_before")
        .optional()
        .isString()
        .withMessage("Condition must be a string"),
      body("remarks")
        .optional()
        .isString()
        .withMessage("Remarks must be a string")
    ],
    async (req, res) => {
      const startTime = Date.now();
      console.log(" === BOOK ISSUE API CALLED ===");
      console.log(" Request Body:", JSON.stringify(req.body, null, 2));
      console.log(" User Info:", req.userinfo);

      try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          console.warn(" Validation errors:", errors.array());
          return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
          });
        }

        const userId = req.userinfo?.id;
        const tenantcode = req.userinfo?.tenantcode;


        if (!userId) {
          console.error(" User not authenticated");
          return res.status(401).json({
            success: false,
            message: "Authentication required",
            error: "User not authenticated"
          });
        }

        if (!tenantcode) {
          console.error("❌ Tenant code missing");
          return res.status(400).json({
            success: false,
            message: "Tenant configuration error",
            error: "Tenant code is required"
          });
        }


        console.log(" Checking book availability...");
        const bookRes = await sql.query(
          `SELECT id, title, isbn, available_copies, total_copies 
         FROM ${tenantcode}.books 
         WHERE id = $1`,
          [req.body.book_id]
        );

        if (bookRes.rows.length === 0) {
          console.error(" Book not found:", req.body.book_id);
          return res.status(404).json({
            success: false,
            message: "Book not available",
            error: "Book not found or inactive"
          });
        }

        const book = bookRes.rows[0];
        console.log(" Book found:", {
          title: book.title,
          isbn: book.isbn,
          available: book.available_copies
        });

        if (book.available_copies <= 0) {
          console.error("❌ Book not available:", book.title);
          return res.status(400).json({
            success: false,
            message: "Book unavailable",
            error: `Book "${book.title}" is not available (no copies left)`,
            details: {
              book_id: book.id,
              title: book.title,
              available_copies: book.available_copies,
              total_copies: book.total_copies
            }
          });
        }
        const alreadyIssuedRes = await sql.query(
          `SELECT id, issue_date, due_date 
     FROM ${tenantcode}.book_issues 
     WHERE book_id = $1 
       AND issued_to = $2 
       AND return_date IS NULL`,
          [req.body.book_id, req.body.card_id]
        );

        if (alreadyIssuedRes.rows.length > 0) {
          const issued = alreadyIssuedRes.rows[0];

          console.error("❌ Member already has this book issued:", req.body.card_id);

          return res.status(409).json({
            success: false,
            message: "Book already issued to this member",
            error: `This book is already issued and must be returned before issuing again.`,
            code: "BOOK_ALREADY_ISSUED_TO_MEMBER",
            details: {
              issue_id: issued.id,
              issued_on: issued.issue_date,
              due_date: issued.due_date
            }
          });
        }

        const issueData = {
          book_id: req.body.book_id,
          card_id: req.body.card_id,
          issued_to: req.body.card_id,
          issue_date: req.body.issue_date || new Date().toISOString().split("T")[0],
          condition_before: req.body.condition_before || "Good",
          remarks: req.body.remarks || "",
          due_date: req.body.due_date // Optional custom due date
        };

        console.log("📝 Prepared issue data:", issueData);


        console.log("🚀 Initializing BookIssue with tenant:", tenantcode);
        try {
          BookIssue.init(tenantcode);
        } catch (initError) {
          console.error("❌ BookIssue initialization failed:", initError);
          return res.status(500).json({
            success: false,
            message: "Module initialization failed",
            error: initError.message
          });
        }


        console.log(" Calling issueBook...");
        let issue;
        try {
          issue = await BookIssue.issueBook(issueData, userId);
        } catch (issueError) {
          console.error(" IssueBook function error:", issueError);


          const errorMsg = issueError.message.toLowerCase();

          if (errorMsg.includes("already issued")) {
            return res.status(409).json({
              success: false,
              message: "Book already issued",
              error: issueError.message
            });
          }

          if (errorMsg.includes("maximum") || errorMsg.includes("limit") || errorMsg.includes("reached")) {
            return res.status(400).json({
              success: false,
              message: "Book limit reached",
              error: issueError.message,
              code: "BOOK_LIMIT_EXCEEDED"
            });
          }

          if (errorMsg.includes("inactive")) {
            return res.status(400).json({
              success: false,
              message: "Member inactive",
              error: issueError.message,
              code: "MEMBER_INACTIVE"
            });
          }

          if (errorMsg.includes("not found")) {
            return res.status(404).json({
              success: false,
              message: "Member not found",
              error: issueError.message,
              code: "MEMBER_NOT_FOUND"
            });
          }


          throw issueError;
        }


        const processingTime = Date.now() - startTime;
        console.log(`Book issued successfully in ${processingTime}ms`);
        console.log(" Issue details:", {
          issue_id: issue.id,
          book: issue.book_title,
          member: issue.member_name,
          due_date: issue.due_date
        });

        return res.status(200).json({
          success: true,
          message: "Book issued successfully",
          timestamp: new Date().toISOString(),
          processing_time_ms: processingTime,
          data: {
            issue_id: issue.id,
            book: {
              id: issue.book_id,
              title: issue.book_title,
              isbn: issue.book_isbn
            },
            member: {
              id: issue.issued_to,
              name: issue.member_name,
              card_number: issue.card_number
            },
            dates: {
              issued_on: issue.issue_date,
              due_date: issue.due_date,
              return_date: issue.return_date
            },
            limits: issue.allowances,
            status: issue.status
          }
        });

      } catch (error) {
        console.error("=== UNEXPECTED ERROR IN BOOK ISSUE ===");
        console.error(" Error:", error);
        console.error(" Stack:", error.stack);

        const processingTime = Date.now() - startTime;


        if (error.code) {
          console.error(" Database error:", {
            code: error.code,
            detail: error.detail,
            hint: error.hint,
            position: error.position
          });
        }


        if (error.code === '23503') { // Foreign key violation
          return res.status(400).json({
            success: false,
            message: "Reference error",
            error: "Invalid book or member reference",
            details: error.detail,
            code: "INVALID_REFERENCE"
          });
        }

        if (error.code === '23505') { // Unique violation
          return res.status(409).json({
            success: false,
            message: "Duplicate record",
            error: "This book is already issued to this member",
            code: "DUPLICATE_ISSUE"
          });
        }

        if (error.code === '23514') { // Check violation
          return res.status(400).json({
            success: false,
            message: "Constraint violation",
            error: "Invalid data provided",
            details: error.detail,
            code: "CONSTRAINT_VIOLATION"
          });
        }


        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes("schema") ||
          errorMessage.includes("relation") ||
          errorMessage.includes("table") ||
          errorMessage.includes("column")) {

          console.error("🗃️ Database schema error detected");
          return res.status(500).json({
            success: false,
            message: "Database configuration error",
            error: "Required database tables or columns are missing",
            suggestion: "Please contact administrator to verify database setup",
            code: "DB_SCHEMA_ERROR"
          });
        }


        console.error("⚠️ Internal server error:", error.message);
        return res.status(500).json({
          success: false,
          message: "Internal server error",
          error: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong",
          timestamp: new Date().toISOString(),
          processing_time_ms: processingTime,
          request_id: req.id || Math.random().toString(36).substring(7),
          code: "INTERNAL_SERVER_ERROR"
        });
      }
    }
  );


  router.get("/allowance/:cardId", fetchUser, async (req, res) => {
    try {
      BookIssue.init(req.userinfo.tenantcode);
      const allowance = await BookIssue.getMemberAllowance(req.params.cardId);

      if (!allowance) {
        return res.status(404).json({ error: "Member not found" });
      }

      return res.status(200).json({
        success: true,
        data: allowance
      });
    } catch (error) {
      console.error("Error fetching allowance:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });


  router.post(
    "/return/:id",
    fetchUser,

    [
      body("return_date").optional().isISO8601().withMessage("Return date must be a valid date"),
      body("status").optional().isIn(['issued', 'returned', 'lost', 'damaged']).withMessage("Status must be one of: issued, returned, lost, damaged"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        BookIssue.init(req.userinfo.tenantcode);
        const userId = req.user?.id || null;
        const returned = await BookIssue.returnBook(req.params.id, req.body, userId);
        return res.status(200).json({ success: true, data: returned });
      } catch (error) {
        console.error("Error returning book:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );

  router.get("/penalty/:id", fetchUser, async (req, res) => {
    try {
      BookIssue.init(req.userinfo.tenantcode);
      const penalty = await BookIssue.calculatePenalty(req.params.id);
      return res.status(200).json({ success: true, data: penalty });
    } catch (error) {
      console.error("Error calculating penalty:", error);
      return res.status(500).json({ errors: error.message });
    }
  });


  router.post("/payment/:id", fetchUser, async (req, res) => {
    try {
      const { amount, payment_method, payment_date } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ errors: "Invalid payment amount" });
      }

      BookIssue.init(req.userinfo.tenantcode);
      const userId = req.userinfo.id;


      const issue = await BookIssue.findById(req.params.id);
      if (!issue) {
        return res.status(404).json({ errors: "Book issue not found" });
      }


      if (req.userinfo.userrole === "STUDENT" && issue.issued_to !== userId) {
        return res.status(403).json({ errors: "You can only pay for your own fines" });
      }

      const penaltyData = await BookIssue.calculatePenalty(req.params.id);
      const totalPenalty = penaltyData.penalty || 0;


      const currentPaid = issue.paid_amount || 0;
      const currentDue = totalPenalty - currentPaid;

      if (amount > currentDue) {
        return res.status(400).json({ errors: `Payment amount cannot exceed due amount of ₹${currentDue}` });
      }


      const sql = require("../models/db.js");
      const updateQuery = `
        UPDATE ${req.userinfo.tenantcode}.book_issues 
        SET paid_amount = COALESCE(paid_amount, 0) + $1,
            lastmodifieddate = NOW(),
            lastmodifiedbyid = $2
        WHERE id = $3
        RETURNING *
      `;
      const result = await sql.query(updateQuery, [amount, userId, req.params.id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ errors: "Failed to update payment" });
      }

      const updatedIssue = result.rows[0];


      try {
        const Notification = require("../models/notification.model.js");
        Notification.init(req.userinfo.tenantcode);

        const bookTitle = issue.book_title || "Book";
        await Notification.create({
          user_id: issue.issued_to,
          title: "Payment Received",
          message: `Payment of ₹${amount} has been received for the fine on book "${bookTitle}". Remaining due: ₹${(currentDue - amount).toFixed(2)}`,
          type: "fine",
          related_id: issue.id,
          related_type: "book_issue"
        });


        if (req.app.get('io')) {
          const io = req.app.get('io');
          const notification = {
            id: issue.id,
            user_id: issue.issued_to,
            title: "Payment Received",
            message: `Payment of ₹${amount} has been received for the fine on book "${bookTitle}". Remaining due: ₹${(currentDue - amount).toFixed(2)}`,
            type: "fine",
            related_id: issue.id,
            related_type: "book_issue",
            is_read: false,
            created_at: new Date().toISOString()
          };
          io.to(`user_${issue.issued_to}`).emit("new_notification", notification);
          io.to(issue.issued_to).emit("new_notification", notification);
        }
      } catch (notifError) {
        console.error("Error creating payment notification:", notifError);

      }

      return res.status(200).json({
        success: true,
        message: "Payment processed successfully",
        data: {
          ...updatedIssue,
          payment_amount: amount,
          payment_method: payment_method || "cash",
          remaining_due: currentDue - amount
        }
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      return res.status(500).json({ errors: error.message });
    }
  });


  router.delete("/:id", fetchUser, async (req, res) => {
    try {
      BookIssue.init(req.userinfo.tenantcode);
      const result = await BookIssue.deleteById(req.params.id);
      if (!result.success) {
        return res.status(404).json({ errors: result.message });
      }
      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      console.error("Error deleting book issue:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });


  router.get("/:bookId/issued-count", fetchUser, async (req, res) => {
    try {
      const bookId = req.params.bookId;
      console.log("boookid->>>>>>>>", bookId)

      BookIssue.init(req.userinfo.tenantcode);
      const issuedCount = await BookIssue.getIssuedCountByBookId(bookId);

      return res.status(200).json({ issued_count: issuedCount });
    } catch (error) {
      console.error("Error fetching issued count:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  app.use(process.env.BASE_API_URL + "/api/bookissue", router);

};
