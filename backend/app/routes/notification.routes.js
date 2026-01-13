/**
 * Notification Routes
 * Single API endpoint for due tomorrow notifications
 *
 * @author Library Management Team
 * @date Jan, 2025
 */

const express = require("express");
const router = express.Router();
const Notification = require("../models/notification.model.js");
const { fetchUser } = require("../middleware/fetchuser.js");

module.exports = (app) => {
  router.get("/due-tomorrow", fetchUser, async (req, res) => {
    try {
      Notification.init(req.userinfo.tenantcode);

      const allNotifications = await Notification.findAll(req.userinfo.id);

      console.log("All Notifications:", allNotifications);

      // Include all unread notifications, not just due reminders
      const unreadNotifications = allNotifications.filter(notification => !notification.is_read);

      const unreadCount = unreadNotifications.length;

      return res.status(200).json({
        success: true,
        notifications: unreadNotifications,
        count: unreadNotifications.length,
        unread_count: unreadCount
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

  router.get("/all", fetchUser, async (req, res) => {
    try {
      Notification.init(req.userinfo.tenantcode);

      const allNotifications = await Notification.findAll(req.userinfo.id);

      console.log("All Notifications:", allNotifications);

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
      console.error("❌ Error fetching all notifications:", error);
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
      console.error("❌ Error marking notification as read:", error);
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
      console.error("❌ Error marking notifications as read:", error);
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
      console.error("❌ Error deleting notification:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete notification",
        error: error.message
      });
    }
  });

  app.use("/api/notifications", router);
};

