/**
 * Handles all incoming request for /api/bookrequest endpoint
 * DB table for this demo.book_requests
 * Model used here is bookrequest.model.js
 * SUPPORTED API ENDPOINTS
 *              GET     /api/bookrequest
 *              GET     /api/bookrequest/pending
 *              GET     /api/bookrequest/count
 *              GET     /api/bookrequest/user/:userId
 *              GET     /api/bookrequest/:id
 *              POST    /api/bookrequest
 *              POST    /api/bookrequest/approve/:id
 *              POST    /api/bookrequest/reject/:id
 *              POST    /api/bookrequest/cancel/:id
 *
 * @author      Muskan Khan
 * @date        Dec, 2025
 * @copyright   www.ibirdsservices.com
 */

const e = require("express");
const { fetchUser,  } = require("../middleware/fetchuser.js");
const BookRequest = require("../models/bookrequest.model.js");
const Notification = require("../models/notification.model.js");

module.exports = (app) => {
  const { body, validationResult } = require("express-validator");

  var router = require("express").Router();

  // Get all book requests (ADMIN and ADMIN only)
  router.get("/", fetchUser, async (req, res) => {
    try {
      BookRequest.init(req.userinfo.tenantcode);
      const requests = await BookRequest.findAll();
      return res.status(200).json(requests);
    } catch (error) {
      console.error("Error fetching book requests:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // Get pending requests (for notifications - ADMIN and ADMIN only)
  router.get("/pending", fetchUser, async (req, res) => {
    try {
      BookRequest.init(req.userinfo.tenantcode);
      const requests = await BookRequest.findPending();
      return res.status(200).json(requests);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // Get pending count (for notifications - ADMIN and ADMIN only)
  router.get("/count", fetchUser, async (req, res) => {
    try {
      BookRequest.init(req.userinfo.tenantcode);
      const count = await BookRequest.getPendingCount();
      return res.status(200).json({ count });
    } catch (error) {
      console.error("Error fetching pending count:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // Get requests by user ID (users can see their own requests)
  router.get("/user/:userId", fetchUser, async (req, res) => {
    try {
      const userId = req.params.userId;
      const currentUserId = req.userinfo.id;
      const userRole = req.userinfo.userrole;

      // Users can only see their own requests, admins can see all
      if (serRole !== "ADMIN" && userId !== currentUserId) {
        return res.status(403).json({ errors: "Access denied" });
      }

      BookRequest.init(req.userinfo.tenantcode);
      const requests = await BookRequest.findByUserId(userId);
      return res.status(200).json(requests);
    } catch (error) {
      console.error("Error fetching user requests:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // Get book request by ID
  router.get("/:id", fetchUser, async (req, res) => {
    try {
      BookRequest.init(req.userinfo.tenantcode);
      const request = await BookRequest.findById(req.params.id);
      if (!request) {
        return res.status(404).json({ errors: "Book request not found" });
      }

      // Check if user has access to this request
      const currentUserId = req.userinfo.id;
      const userRole = req.userinfo.userrole;
      if (userRole !== "ADMIN" && request.requested_by !== currentUserId) {
        return res.status(403).json({ errors: "Access denied" });
      }

      return res.status(200).json(request);
    } catch (error) {
      console.error("Error fetching book request:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // Create a new book request (USER can request books)
  router.post(
    "/",
    fetchUser,
    [
      body("book_id").notEmpty().isUUID().withMessage("Book ID is required and must be a valid UUID"),
      body("quantity").optional().isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),
      body("request_date").optional().isISO8601().withMessage("Request date must be a valid date"),
      body("language").optional().isISO8601().withMessage("Language "),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        BookRequest.init(req.userinfo.tenantcode);
        const userId = req.userinfo.id;
        const request = await BookRequest.create(req.body, userId);
        if (!request) {
          return res.status(400).json({ errors: "Failed to create book request" });
        }
        
        // Create notification for admins about new book request
        try {
          Notification.init(req.userinfo.tenantcode);
          
          // Fetch book details
          const sql = require("../models/db.js");
          const bookQuery = await sql.query(
            `SELECT title FROM ${req.userinfo.tenantcode}.books WHERE id = $1`,
            [req.body.book_id]
          );
          const bookTitle = bookQuery.rows.length > 0 ? bookQuery.rows[0].title : "Book";
          
          // Fetch user details
          const userQuery = await sql.query(
            `SELECT firstname, lastname FROM ${req.userinfo.tenantcode}."user" WHERE id = $1`,
            [userId]
          );
          const userName = userQuery.rows.length > 0 
            ? `${userQuery.rows[0].firstname} ${userQuery.rows[0].lastname}`.trim()
            : "User";
          
          // Find all ADMIN and ADMIN users to notify
          const adminQuery = await sql.query(
            `SELECT id FROM ${req.userinfo.tenantcode}."user" 
             WHERE userrole IN ('ADMIN', 'ADMIN') AND isactive = true`,
            []
          );
          
          // Get quantity from request
          const requestedQuantity = request.quantity || 1;
          const quantityText = requestedQuantity > 1 ? `${requestedQuantity} copies of` : "";
          
          // Create notification for each admin
          for (const admin of adminQuery.rows) {
            await Notification.create({
              user_id: admin.id,
              title: "New Book Request",
              message: `${userName} has requested ${quantityText} the book "${bookTitle}". Please review and approve or reject the request.`,
              type: "book_request",
              related_id: request.id,
              related_type: "book_request"
            });
            
            // Send real-time notification via socket
            if (req.app.get('io')) {
              const io = req.app.get('io');
              const notification = {
                id: request.id,
                user_id: admin.id,
                title: "New Book Request",
                message: `${userName} has requested ${quantityText} the book "${bookTitle}". Please review and approve or reject the request.`,
                type: "book_request",
                related_id: request.id,
                related_type: "book_request",
                is_read: false,
                created_at: new Date().toISOString()
              };
              io.to(`user_${admin.id}`).emit("new_notification", notification);
              io.to(admin.id).emit("new_notification", notification);
              console.log(`📨 Sent book request notification to admin ${admin.id}`);
            }
          }
        } catch (notifError) {
          console.error("Error creating notification for book request:", notifError);
          // Don't fail the request if notification fails
        }
        
        return res.status(200).json({ success: true, data: request });
      } catch (error) {
        console.error("Error creating book request:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );

  // Approve book request (ADMIN and ADMIN only)
  router.post(
    "/approve/:id",
    fetchUser,
    
    [
      body("approved_quantity").optional().isInt({ min: 1 }).withMessage("Approved quantity must be a positive integer"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        BookRequest.init(req.userinfo.tenantcode);
        const adminUserId = req.userinfo.id;
        const approvedQuantity = req.body.approved_quantity || null; // null means approve all requested
        const approvedRequest = await BookRequest.approveRequest(req.params.id, adminUserId, approvedQuantity);
        
        // Create notification for the user whose request was approved
        try {
          Notification.init(req.userinfo.tenantcode);
          
          // Fetch book details
          const sql = require("../models/db.js");
          const bookQuery = await sql.query(
            `SELECT title FROM ${req.userinfo.tenantcode}.books WHERE id = $1`,
            [approvedRequest.book_id]
          );
          const bookTitle = bookQuery.rows.length > 0 ? bookQuery.rows[0].title : "Book";
          
          // Get approved quantity (use approved_quantity if available, otherwise quantity)
          const finalApprovedQuantity = approvedRequest.approved_quantity || approvedRequest.quantity || 1;
          const requestedQuantity = approvedRequest.quantity || 1;
          const quantityText = finalApprovedQuantity > 1 ? `${finalApprovedQuantity} copies of` : "";
          
          // Check if partial approval
          const isPartialApproval = finalApprovedQuantity < requestedQuantity;
          let message = `Your request for ${quantityText} the book "${bookTitle}" has been approved and ${finalApprovedQuantity > 1 ? 'the books have' : 'the book has'} been issued to you.`;
          
          if (isPartialApproval) {
            message += ` Note: You requested ${requestedQuantity} copies, but only ${finalApprovedQuantity} ${finalApprovedQuantity > 1 ? 'copies were' : 'copy was'} approved due to limited availability.`;
          }
          
          message += " Please check your issued books.";
          
          // Create notification for the user
          const notification = await Notification.create({
            user_id: approvedRequest.requested_by,
            title: isPartialApproval ? "Book Request Partially Approved" : "Book Request Approved",
            message: message,
            type: "book_request",
            related_id: approvedRequest.id,
            related_type: "book_request"
          });
          
          // Send real-time notification via socket
          if (req.app.get('io')) {
            const io = req.app.get('io');
            io.to(`user_${approvedRequest.requested_by}`).emit("new_notification", notification);
            io.to(approvedRequest.requested_by).emit("new_notification", notification);
            console.log(`📨 Sent approval notification to user ${approvedRequest.requested_by}`);
          }
        } catch (notifError) {
          console.error("Error creating notification for approved request:", notifError);
          // Don't fail the approval if notification fails
        }
        
        return res.status(200).json({ success: true, data: approvedRequest });
      } catch (error) {
        console.error("Error approving book request:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );

  // Reject book request (ADMIN and ADMIN only)
  router.post(
    "/reject/:id",
    fetchUser,
    
    [
      body("rejection_reason").optional().isString().withMessage("Rejection reason must be a string"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        BookRequest.init(req.userinfo.tenantcode);
        const adminUserId = req.userinfo.id;
        const rejectedRequest = await BookRequest.rejectRequest(
          req.params.id,
          adminUserId,
          req.body.rejection_reason || req.body.rejectionReason || null
        );
        
        // Create notification for the user whose request was rejected
        try {
          Notification.init(req.userinfo.tenantcode);
          
          // Fetch book details
          const sql = require("../models/db.js");
          const bookQuery = await sql.query(
            `SELECT title FROM ${req.userinfo.tenantcode}.books WHERE id = $1`,
            [rejectedRequest.book_id]
          );
          const bookTitle = bookQuery.rows.length > 0 ? bookQuery.rows[0].title : "Book";
          
          // Create notification for the user
          const notification = await Notification.create({
            user_id: rejectedRequest.requested_by,
            title: "Book Request Rejected",
            message: `Your request for the book "${bookTitle}" has been rejected.${rejectedRequest.rejection_reason ? ` Reason: ${rejectedRequest.rejection_reason}` : ''}`,
            type: "book_request",
            related_id: rejectedRequest.id,
            related_type: "book_request"
          });
          
          // Send real-time notification via socket
          if (req.app.get('io')) {
            const io = req.app.get('io');
            io.to(`user_${rejectedRequest.requested_by}`).emit("new_notification", notification);
            io.to(rejectedRequest.requested_by).emit("new_notification", notification);
            console.log(`📨 Sent rejection notification to user ${rejectedRequest.requested_by}`);
          }
        } catch (notifError) {
          console.error("Error creating notification for rejected request:", notifError);
          // Don't fail the rejection if notification fails
        }
        
        return res.status(200).json({ success: true, data: rejectedRequest });
      } catch (error) {
        console.error("Error rejecting book request:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );

  // Cancel book request (USER can cancel their own requests)
  router.post("/cancel/:id", fetchUser, async (req, res) => {
    try {
      BookRequest.init(req.userinfo.tenantcode);
      const userId = req.userinfo.id;
      const cancelledRequest = await BookRequest.cancelRequest(req.params.id, userId);
      return res.status(200).json({ success: true, data: cancelledRequest });
    } catch (error) {
      console.error("Error cancelling book request:", error);
      return res.status(500).json({ errors: error.message });
    }
  });

  app.use(process.env.BASE_API_URL + "/api/bookrequest", router);
};

