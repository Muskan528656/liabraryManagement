/**
 * Handles all incoming requests for /api/book-submissions endpoint
 * DB table: book_submissions
 * Model used: booksubmission.model.js
 * SUPPORTED API ENDPOINTS
 *              GET     /api/book-submissions
 *              GET     /api/book-submissions/:id
 *              GET     /api/book-submissions/issue/:issueId
 *              GET     /api/book-submissions/date-range
 *              POST    /api/book-submissions
 *              DELETE  /api/book-submissions/:id
 *
 *@author     Muskan Khan
@date   DEC,   2025
 * @copyright   www.ibirdsservices.com
 */

const { fetchUser } = require("../middleware/fetchuser.js");
const BookSubmission = require("../models/booksubmission.model.js");
const Notification = require("../models/notification.model.js");

module.exports = (app) => {
  const { body, validationResult, query } = require("express-validator");

  var router = require("express").Router();

 
  router.get("/", fetchUser, async (req, res) => {
    try {
      console.log("Fetching all book submissions for tenant:", req.userinfo.tenantcode);
      BookSubmission.init(req.userinfo.tenantcode);
      console.log('req.userinfo.tenantcode', req.userinfo.tenantcode);
      
      const submissions = await BookSubmission.findAll();
      return res.status(200).json({ success: true, data: submissions });
    } catch (error) {
      console.error("Error fetching book submissions:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  router.get("/due_notifications", fetchUser, async (req, res) => {

    try {
      const notifications = await BookSubmission.checkbeforeDue();
      
      return res.status(200).json({
        success: true,
        notifications,
      });

    } catch (error) {
      console.error("❌ Error fetching notifications:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch notifications",
        error: error.message
      });
    }
  });


 
  router.get("/:id", fetchUser, async (req, res) => {
    try {
      BookSubmission.init(req.userinfo.tenantcode);
      const submission = await BookSubmission.findById(req.params.id);
      if (!submission) {
        return res.status(404).json({ errors: "Book submission not found" });
      }
      return res.status(200).json({ success: true, data: submission });
    } catch (error) {
      console.error("Error fetching book submission:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

 
  router.get("/issue/:issueId", fetchUser, async (req, res) => {
    try {
      BookSubmission.init(req.userinfo.tenantcode);
      const submissions = await BookSubmission.findByIssueId(req.params.issueId);
      return res.status(200).json({ success: true, data: submissions });
    } catch (error) {
      console.error("Error fetching submissions by issue ID:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

 
  router.get(
    "/date-range",
    fetchUser,
    [
      query("startDate").isISO8601().withMessage("Start date must be a valid date"),
      query("endDate").isISO8601().withMessage("End date must be a valid date"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        BookSubmission.init(req.userinfo.tenantcode);
        const submissions = await BookSubmission.findByDateRange(req.query.startDate, req.query.endDate);
        return res.status(200).json({ success: true, data: submissions });
      } catch (error) {
        console.error("Error fetching submissions by date range:", error);
        return res.status(500).json({ errors: "Internal server error" });
      }
    }
  );

  

 
  router.post(
    "/",
    fetchUser,

    [
      body("issue_id").notEmpty().isUUID().withMessage("Issue ID is required and must be a valid UUID"),
      body("condition_before").optional().isString().trim().withMessage("Condition before must be a string"),
      body("condition_after").optional().isString().trim().withMessage("Condition after must be a string"),
      body("remarks").optional().isString().trim().withMessage("Remarks must be a string"),
      body("submit_date").optional().isISO8601().withMessage("Submit date must be a valid date"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const userId = req.userinfo?.id || req.userinfo?.id || null;
        if (!userId) {
          return res.status(400).json({ errors: "Librarian ID (submitted_by) is required" });
        }

        BookSubmission.init(req.userinfo.tenantcode);

        const submission = await BookSubmission.create(req.body, userId);

        if (submission && submission.issued_to) {
          try {
            Notification.init(req.userinfo.tenantcode);

            const notification = await Notification.create({
              user_id: submission.issued_to,
              title: "Book Return Submitted",
              message: `Your book "${submission.book_title}" has been submitted. Condition: ${submission.condition_after}.${submission.penalty > 0 ? ` Penalty: ₹${submission.penalty}` : ' No fine.'}`,
              type: "book_returned",
              related_id: submission.id,
              related_type: "book_submission"
            });

        
            if (req.app.get('io')) {
              const io = req.app.get('io');
              io.to(`user_${submission.issued_to}`).emit("new_notification", notification);
              io.to(submission.issued_to).emit("new_notification", notification);
            }
          } catch (notifError) {
            console.error("Error creating notification for book submission:", notifError);
            
          }
        }

        return res.status(200).json({ success: true, data: submission, message: "Book submitted successfully" });
      } catch (error) {
        console.error("Error creating book submission:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );

 
  router.delete(
    "/:id",
    fetchUser,

    async (req, res) => {
      try {
        BookSubmission.init(req.userinfo.tenantcode);
        const result = await BookSubmission.deleteById(req.params.id);

        if (result.success) {
          return res.status(200).json(result);
        } else {
          return res.status(404).json(result);
        }
      } catch (error) {
        console.error("Error deleting book submission:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );



  app.use(process.env.BASE_API_URL+ "/api/book_submissions", router);
};
