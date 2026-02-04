/**

 *
 * @author Library Management Team
 * @date Jan, 2025
 */

const express = require("express");
const router = express.Router();
const Notification = require("../models/notification.model.js");
const User = require("../models/user.model.js");
const { fetchUser } = require("../middleware/fetchuser.js");

module.exports = (app) => {
  router.get("/due-tomorrow", fetchUser, async (req, res) => {
    try {
      Notification.init(req.userinfo.tenantcode);

      userId = req.userinfo.id;

      const allNotifications = await Notification.findAll(userId);

      console.log("All Notifications:", allNotifications);

      const unreadNotifications = allNotifications.filter(notification => !notification.is_read);

      console.log("Unread Notifications:", unreadNotifications);

      const unreadCount = unreadNotifications.length;

      console.log("Unread Count:", unreadCount);

      return res.status(200).json({
        success: true,
        notifications: unreadNotifications,
        count: unreadNotifications.length,
        unread_count: unreadCount
      });
    } catch (error) {
      console.error(" Error fetching notifications:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch notifications",
        error: error.message
      });
    }
  });

  router.get("/all", fetchUser, async (req, res) => {
    try {
      Notification.init(req.userinfo.tenantcode);

      userId = req.userinfo.id;
      const allNotifications = await Notification.findAll(userId);


      const unreadNotifications = allNotifications.filter(notification => !notification.is_read);
      const readNotifications = allNotifications.filter(notification => notification.is_read);

      return res.status(200).json({
        success: true,
        all_notifications: allNotifications,
        unread_notifications: unreadNotifications,
        read_notifications: readNotifications,
        unread_count: unreadNotifications.length,
        read_count: readNotifications.length
      });
    } catch (error) {
      console.error("Error fetching all notifications:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch all notifications",
        error: error.message
      });
    }
  });

  router.put("/:id/read", fetchUser, async (req, res) => {
    try {
      Notification.init(req.userinfo.tenantcode);

      const notificationId = req.params.id;
      const userId = req.userinfo.id;

      const updatedNotification = await Notification.markAsRead(notificationId, userId);

      if (updatedNotification) {
        return res.status(200).json({
          success: true,
          message: "Notification marked as read",
          notification: updatedNotification
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "Notification not found or already read"
        });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to mark notification as read",
        error: error.message
      });
    }
  });

  router.put("/mark-read-by-related/:relatedId/:memberId/:type", fetchUser, async (req, res) => {
    try {
      Notification.init(req.userinfo.tenantcode);

      console.log("req.params=>",req.params);

      const { relatedId, memberId, type } = req.params;
      const userId = req.userinfo.id;

      const updatedNotifications = await Notification.markAsReadByRelatedId(userId, relatedId, memberId, type);

      let unreadNofiticaiton = await Notification.findAll(userId);
      let unreadNotifications = unreadNofiticaiton.filter(
        n => n.is_read === false
      );


      console.log("unread", unreadNotifications);

      return res.status(200).json({
        success: true,
        message: "Notifications marked as read",
        notifications: unreadNotifications
      });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to mark notifications as read",
        error: error.message
      });
    }
  });

  router.delete("/:id", fetchUser, async (req, res) => {
    try {
      Notification.init(req.userinfo.tenantcode);

      const notificationId = req.params.id;
      const userId = req.userinfo.id;

      const deletedNotification = await Notification.deleteNotification(notificationId, userId);

      if (deletedNotification) {
        return res.status(200).json({
          success: true,
          message: "Notification deleted successfully",
          notification: deletedNotification
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "Notification not found or already deleted"
        });
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete notification",
        error: error.message
      });
    }
  });

  router.post("/request-access", fetchUser, async (req, res) => {
    try {
      Notification.init(req.userinfo.tenantcode);
      User.init(req.userinfo.tenantcode);

      const currentUserId = req.userinfo.id;
      const currentUser = await User.findById(currentUserId);

      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: "Current user not found"
        });
      }

      // Find admin users
      const adminUsers = await User.findAll({ userrole: 'ADMIN' });

      if (adminUsers.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No admin users found"
        });
      }

      const username = `${currentUser.firstname} ${currentUser.lastname}`;
      const email = currentUser.email;

      // Create notification for each admin
      const notifications = [];
      for (const admin of adminUsers) {
        const notification = await Notification.create({
          user_id: admin.id,
          // message: `User ${username} (${email}) is requesting access to the system.`,
          message:`User ${username} (${email}) Permission request raised. Pending for your approval.`,
          type: "access_request"
        });
        notifications.push(notification);
      }

      return res.status(200).json({
        success: true,
        message: "Access request sent to system admin",
        notifications: notifications
      });
    } catch (error) {
      console.error("Error sending access request:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to send access request",
        error: error.message
      });
    }
  });

  app.use("/api/notifications", router);
};

