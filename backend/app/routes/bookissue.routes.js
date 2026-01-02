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

  router.put(
    "/:id",
    fetchUser,
    [
      body("issue_date").optional().isISO8601().withMessage("Issue date must be a valid date"),
      body("due_date").optional().isISO8601().withMessage("Due date must be a valid date"),
      body("return_date").optional().isISO8601().withMessage("Return date must be a valid date"),
      body("status")
        .optional()
        .isIn(["issued", "lost", "damaged","cancelled"])
        .withMessage("Status must be one of: issued, returned, lost, damaged, cancelled"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const issueId = req.params.id;
        const userId = req.userinfo.id;
        const updateData = req.body;

        BookIssue.init(req.userinfo.tenantcode);

 
        const existingIssue = await BookIssue.findById(issueId);
        if (!existingIssue) {
          return res.status(404).json({
            success: false,
            errors: "Book issue not found",
          });
        }

 
        const updateFields = [];
        const updateValues = [];
        let paramCounter = 1;

 
        updateFields.push(`lastmodifieddate = NOW()`);
        updateFields.push(`lastmodifiedbyid = $${paramCounter}`);
        updateValues.push(userId);
        paramCounter++;

 
        const allowedFields = [
          "issue_date",
          "due_date",
          "return_date",
          "status",
        ];

        allowedFields.forEach((field) => {
          if (updateData[field] !== undefined) {
            updateFields.push(`${field} = $${paramCounter}`);
            updateValues.push(updateData[field]);
            paramCounter++;
          }
        });

        if (updateFields.length === 2) {
          return res.status(400).json({
            success: false,
            errors: "No valid fields provided to update",
          });
        }

        updateValues.push(issueId);

        const updateQuery = `
        UPDATE ${req.userinfo.tenantcode}.book_issues
        SET ${updateFields.join(", ")}
        WHERE id = $${paramCounter}
        RETURNING *
      `;

        const result = await sql.query(updateQuery, updateValues);

        const updatedIssue = result.rows[0];

 
        if (updateData.status && updateData.status !== existingIssue.status) {
          try {
            Notification.init(req.userinfo.tenantcode);

            const message = `Your book issue status has been changed to "${updateData.status}".`;

            await Notification.create({
              user_id: existingIssue.issued_to,
              title: "Book Issue Updated",
              message,
              type: "book_issue",
              related_id: issueId,
              related_type: "book_issue",
            });

            if (req.app.get("io")) {
              req.app
                .get("io")
                .to(`user_${existingIssue.issued_to}`)
                .emit("new_notification", {
                  title: "Book Issue Updated",
                  message,
                });
            }
          } catch (err) {
            console.error("Notification error:", err);
          }
        }

        return res.status(200).json({
          success: true,
          message: "Book issue updated successfully",
          data: updatedIssue,
        });
      } catch (error) {
        console.error("Update error:", error);
        return res.status(500).json({
          success: false,
          errors: "Internal server error",
        });
      }
    }
  );


  router.post("/issue", fetchUser, async (req, res) => {
    try {
 
      BookIssue.init(req.userinfo.tenantcode);
      const result = await BookIssue.issueBook(req);

      return res.status(result.success ? 200 : 400).json(result);

    } catch (error) {
 
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });

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