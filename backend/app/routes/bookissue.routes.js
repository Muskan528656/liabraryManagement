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

module.exports = (app) => {
  const { body, validationResult } = require("express-validator");

  var router = require("express").Router();

  // Get all book issues
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

  // Get active issues (not returned)
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

  // Get issues by book ID
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

  // Get issues by user ID (issued_to)
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

  // Get issues by card ID (for backward compatibility)
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

  // Get book issue by ID
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

  // Issue a book (checkout)
  router.post(
    "/issue",
    fetchUser,

    [
      body("book_id").notEmpty().isUUID().withMessage("Book ID is required and must be a valid UUID"),
      body("issued_to").optional().isUUID().withMessage("Issued to (user ID) must be a valid UUID"),
      body("card_id").optional().isUUID().withMessage("Card ID must be a valid UUID"),
      body("due_date").optional().isISO8601().withMessage("Due date must be a valid date"),
      body("issue_date").optional().isISO8601().withMessage("Issue date must be a valid date"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        // Validate that either issued_to or card_id is provided
        if (!req.body.issued_to && !req.body.issuedTo && !req.body.card_id && !req.body.cardId) {
          return res.status(400).json({ errors: "Either issued_to (user ID) or card_id is required" });
        }

        const userId = req.user?.id || req.userinfo?.id || null;
        BookIssue.init(req.userinfo.tenantcode);
        const issue = await BookIssue.issueBook(req.body, userId);
        
        // Create notification for the user who received the book
        if (issue && issue.issued_to) {
          try {
            Notification.init(req.userinfo.tenantcode);
            
            // Fetch book details to get title
            const sql = require("../models/db.js");
            const bookQuery = await sql.query(
              `SELECT title FROM ${req.userinfo.tenantcode}.books WHERE id = $1`,
              [issue.book_id]
            );
            const bookTitle = bookQuery.rows.length > 0 ? bookQuery.rows[0].title : "Book";
            
            // Format due date
            const dueDate = issue.due_date ? new Date(issue.due_date).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : "N/A";
            
            const notification = await Notification.create({
              user_id: issue.issued_to,
              title: "Book Issued Successfully",
              message: `You have been issued the book "${bookTitle}". Due date: ${dueDate}. Please return it on time to avoid fines.`,
              type: "book_issued",
              related_id: issue.id,
              related_type: "book_issue"
            });

            if (req.app.get('io')) {
              const io = req.app.get('io');
              io.to(`user_${issue.issued_to}`).emit("new_notification", notification);
              io.to(issue.issued_to).emit("new_notification", notification);
              console.log(`📨 Sent book issue notification to user ${issue.issued_to} in rooms: user_${issue.issued_to}, ${issue.issued_to}`);
            } else {
              console.warn("⚠️ Socket.io instance not available for sending notification");
            }
          } catch (notifError) {
            console.error("Error creating notification for book issue:", notifError);
            // Don't fail the book issue if notification fails
          }
        }
        
        return res.status(200).json({ success: true, data: issue });
      } catch (error) {
        console.error("Error issuing book:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );

  // Return a book (checkin)
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
        // Don't fail payment if notification fails
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

  // Delete book issue by ID
  router.delete("/:id", fetchUser,  async (req, res) => {
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

  

  app.use(process.env.BASE_API_URL + "/api/bookissue", router);
};

