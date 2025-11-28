/**
 * Notification Routes
 * Handles all notification-related API endpoints
 * 
 * @author Library Management Team
 * @date Jan, 2025
 */

const express = require("express");
const router = express.Router();
const Notification = require("../models/notification.model.js");
const { fetchUser } = require("../middleware/fetchuser.js");

module.exports = (app) => {
  // Get all notifications for logged-in user
  router.get("/", fetchUser, async (req, res) => {
    try {
      Notification.init(req.userinfo.tenantcode);
      const { is_read } = req.query;
      
      const isReadFilter = is_read !== undefined ? is_read === 'true' : null;
      const notifications = await Notification.findAll(req.userinfo.id, isReadFilter);
      
      return res.status(200).json({
        success: true,
        notifications: notifications
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching notifications",
        error: error.message
      });
    }
  });


  // Get book submission due notifications
    router.get("/due_notifications", fetchUser, async (req, res) => {
  
    // console.log("Fetching notifications for book submissions nearing due date...");
    // res.send('Notifications endpoint hit')
      try {
        const notifications = await BookSubmission.checkbeforeDue();
        // console.log('notification ', notifications);
        
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

  // Get unread notification count
  router.get("/unread-count", fetchUser, async (req, res) => {
    try {
      Notification.init(req.userinfo.tenantcode);
      const count = await Notification.getUnreadCount(req.userinfo.id);
      
      return res.status(200).json({
        success: true,
        count: count
      });
    } catch (error) {
      console.error("Error getting unread count:", error);
      return res.status(500).json({
        success: false,
        message: "Error getting unread count",
        error: error.message
      });
    }
  });

  // Create a new notification (for admins/librarians)
  router.post("/", fetchUser, async (req, res) => {
    try {
      const { user_id, title, message, type, related_id, related_type } = req.body;
      
      if (!user_id || !title || !message || !type) {
        return res.status(400).json({
          success: false,
          message: "user_id, title, message, and type are required"
        });
      }

      Notification.init(req.userinfo.tenantcode);
      const notification = await Notification.create({
        user_id,
        title,
        message,
        type,
        related_id,
        related_type
      });

      // Emit socket event for real-time notification
      if (req.app.get('io')) {
        req.app.get('io').to(`user_${user_id}`).emit('new_notification', notification);
      }

      return res.status(201).json({
        success: true,
        notification: notification
      });
    } catch (error) {
      console.error("Error creating notification:", error);
      return res.status(500).json({
        success: false,
        message: "Error creating notification",
        error: error.message
      });
    }
  });

  // Mark notification as read
  router.put("/:id/read", fetchUser, async (req, res) => {
    try {
      const { id } = req.params;
      
      Notification.init(req.userinfo.tenantcode);
      const notification = await Notification.markAsRead(id, req.userinfo.id);
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found"
        });
      }

      return res.status(200).json({
        success: true,
        notification: notification
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return res.status(500).json({
        success: false,
        message: "Error marking notification as read",
        error: error.message
      });
    }
  });

  // Mark all notifications as read
  router.put("/read-all", fetchUser, async (req, res) => {
    try {
      Notification.init(req.userinfo.tenantcode);
      const notifications = await Notification.markAllAsRead(req.userinfo.id);
      
      return res.status(200).json({
        success: true,
        count: notifications.length,
        notifications: notifications
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return res.status(500).json({
        success: false,
        message: "Error marking all notifications as read",
        error: error.message
      });
    }
  });

  // Delete a notification
  router.delete("/:id", fetchUser, async (req, res) => {
    try {
      const { id } = req.params;
      
      Notification.init(req.userinfo.tenantcode);
      const notification = await Notification.delete(id, req.userinfo.id);
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Notification deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      return res.status(500).json({
        success: false,
        message: "Error deleting notification",
        error: error.message
      });
    }
  });

  // Broadcast notification to multiple users (for admins)
  router.post("/broadcast", fetchUser, async (req, res) => {
    try {
      const { user_ids, title, message, type, related_id, related_type } = req.body;
      
      if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "user_ids array is required"
        });
      }

      if (!title || !message || !type) {
        return res.status(400).json({
          success: false,
          message: "title, message, and type are required"
        });
      }

      Notification.init(req.userinfo.tenantcode);
      const notifications = await Notification.createBroadcast(user_ids, {
        title,
        message,
        type,
        related_id,
        related_type
      });

      // Emit socket events for real-time notifications
      if (req.app.get('io')) {
        const io = req.app.get('io');
        notifications.forEach(notification => {
          io.to(`user_${notification.user_id}`).emit('new_notification', notification);
        });
      }

      return res.status(201).json({
        success: true,
        count: notifications.length,
        notifications: notifications
      });
    } catch (error) {
      console.error("Error broadcasting notification:", error);
      return res.status(500).json({
        success: false,
        message: "Error broadcasting notification",
        error: error.message
      });
    }
  });

   app.use( "/api/notifications", router);
};

