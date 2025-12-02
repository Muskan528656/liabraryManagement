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
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const userId = req.userinfo?.id;
        const tenantcode = req.userinfo?.tenantcode;

        if (!userId) {
          return res.status(401).json({ error: "User not authenticated" });
        }


        const bookRes = await sql.query(
          `SELECT id, title FROM ${tenantcode}.books WHERE id = $1`,
          [req.body.book_id]
        );

        if (bookRes.rows.length === 0) {
          return res.status(404).json({ error: "Book not found" });
        }
        const bookTitle = bookRes.rows[0].title;


        const issueCheck = await sql.query(
          `SELECT id 
         FROM ${tenantcode}.book_issues 
         WHERE book_id = $1 
           AND status = 'issued' 
           AND return_date IS NULL`,
          [req.body.book_id]
        );

        if (issueCheck.rows.length > 0) {
          return res.status(400).json({ error: "Book is already issued" });
        }


        const cardRes = await sql.query(
          `SELECT id, card_number, member_name, allowed_books 
         FROM ${tenantcode}.library_members 
         WHERE id = $1`,
          [req.body.card_id]
        );

        if (cardRes.rows.length === 0) {
          return res.status(404).json({ error: "Card not found" });
        }

        const card = cardRes.rows[0];
        const memberAllowedBooks = card.allowed_books || 6;
        const currentIssuesRes = await sql.query(
          `SELECT COUNT(*) as issued_count 
         FROM ${tenantcode}.book_issues 
         WHERE issued_to = $1 
           AND status = 'issued' 
           AND return_date IS NULL`,
          [req.body.card_id]
        );

        const currentlyIssued = parseInt(currentIssuesRes.rows[0].issued_count) || 0;


        if (currentlyIssued >= memberAllowedBooks) {
          return res.status(400).json({
            error: `Member has reached their allowed books limit (${memberAllowedBooks} books). Please return some books before issuing new ones.`,
            details: {
              currently_issued: currentlyIssued,
              member_allowed: memberAllowedBooks
            }
          });
        }

        const issueData = {
          book_id: req.body.book_id,
          issued_to: req.body.card_id,
          issue_date: req.body.issue_date || new Date().toISOString().split("T")[0],
        };

        BookIssue.init(tenantcode);
        const issue = await BookIssue.issueBook(issueData, userId);

      
        const updatedIssuesRes = await sql.query(
          `SELECT COUNT(*) as issued_count 
         FROM ${tenantcode}.book_issues 
         WHERE issued_to = $1 
           AND status = 'issued' 
           AND return_date IS NULL`,
          [req.body.card_id]
        );

        const updatedIssuedCount = parseInt(updatedIssuesRes.rows[0].issued_count) || 0;

        return res.status(200).json({
          success: true,
          message: "Book issued successfully",
          data: {
            ...issue,
            member_name: card.member_name,
            book_title: bookTitle,
            card_number: card.card_number,
            issued_count: updatedIssuedCount,
            remaining_allowed: memberAllowedBooks - updatedIssuedCount
          },
        });
      } catch (error) {
        console.error("Error issuing book:", error);
        return res.status(500).json({
          error: "Internal server error",
          details: error.message,
        });
      }
    }
  );


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


  app.use(process.env.BASE_API_URL + "/api/bookissue", router);

};

