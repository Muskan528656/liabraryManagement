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

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const dueTomorrowNotifications = allNotifications.filter(notification => {
        if (notification.type === 'due_reminder') {
          const dueDateMatch = notification.message.match(/due for return tomorrow \(([^)]+)\)/);
          if (dueDateMatch) {
            return dueDateMatch[1] === tomorrowStr;
          }
        }
        return false;
      });

      const unreadCount = dueTomorrowNotifications.filter(n => !n.is_read).length;

      return res.status(200).json({
        success: true,
        notifications: dueTomorrowNotifications,
        count: dueTomorrowNotifications.length,
        unread_count: unreadCount
      });
    } catch (error) {
      console.error("❌ Error fetching due tomorrow notifications:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch due tomorrow notifications",
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

  router.put("/mark-read-by-related/:relatedId/:type", fetchUser, async (req, res) => {
    try {
      Notification.init(req.userinfo.tenantcode);

      const { relatedId, type } = req.params;
      const userId = req.userinfo.id;

      const updatedNotifications = await Notification.markAsReadByRelatedId(userId, relatedId, type);

      return res.status(200).json({
        success: true,
        message: "Notifications marked as read",
        notifications: updatedNotifications
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

  app.use("/api/notifications", router);
};

