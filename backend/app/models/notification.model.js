/**
 * Notification Model
 * Handles library notifications (overdue books, book requests, announcements, etc.)
 * 
 * @author Library Management Team
 * @date Jan, 2025
 */

const sql = require("./db.js");

let schema = "";

const Notification = {
  init: function (schema_name) {
    schema = schema_name;
  },

  // Get all notifications for a user
  findAll: async function (userId, isRead = null) {
    let query = `
      SELECT * FROM ${schema}.notifications 
      WHERE user_id = $1
    `;
    let params = [userId];

    if (isRead !== null) {
      query += ` AND is_read = $2`;
      params.push(isRead);
    }

    query += ` ORDER BY created_at DESC`;

    try {
      const result = await sql.query(query, params);
      return result.rows;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  // Get unread notification count
  getUnreadCount: async function (userId) {
    try {
      const result = await sql.query(
        `SELECT COUNT(*) as count FROM ${schema}.notifications 
         WHERE user_id = $1 AND is_read = false`,
        [userId]
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error("Error getting unread count:", error);
      throw error;
    }
  },

  // Create a new notification
  create: async function (notification) {
    const { user_id, title, message, type, related_id, related_type } = notification;

    try {
      const result = await sql.query(
        `INSERT INTO ${schema}.notifications 
         (user_id, title, message, type, related_id, related_type, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
         RETURNING *`,
        [user_id, title, message, type, related_id || null, related_type || null]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async function (notificationId, userId) {
    try {
      const result = await sql.query(
        `UPDATE ${schema}.notifications 
         SET is_read = true, read_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [notificationId, userId]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },

  // Mark all notifications as read for a user
  markAllAsRead: async function (userId) {
    try {
      const result = await sql.query(
        `UPDATE ${schema}.notifications 
         SET is_read = true, read_at = NOW()
         WHERE user_id = $1 AND is_read = false
         RETURNING *`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  },

  // Delete a notification
  delete: async function (notificationId, userId) {
    try {
      const result = await sql.query(
        `DELETE FROM ${schema}.notifications 
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [notificationId, userId]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  },

  // Create notification for multiple users (broadcast)
  createBroadcast: async function (userIds, notification) {
    const { title, message, type, related_id, related_type } = notification;
    const values = userIds.map((userId, index) =>
      `($${index * 6 + 1}, $${index * 6 + 2}, $${index * 6 + 3}, $${index * 6 + 4}, $${index * 6 + 5}, $${index * 6 + 6}, false, NOW())`
    ).join(', ');

    const params = [];
    userIds.forEach(userId => {
      params.push(userId, title, message, type, related_id || null, related_type || null);
    });

    try {
      const result = await sql.query(
        `INSERT INTO ${schema}.notifications 
         (user_id, title, message, type, related_id, related_type, is_read, created_at)
         VALUES ${values}
         RETURNING *`,
        params
      );
      return result.rows;
    } catch (error) {
      console.error("Error creating broadcast notification:", error);
      throw error;
    }
  },

  // Get overdue book notifications (for cron job)
  getOverdueBooks: async function () {
    try {
      const result = await sql.query(
        `SELECT 
          bi.id as issue_id,
          bi.user_id,
          bi.book_id,
          bi.issue_date,
          bi.due_date,
          u.email,
          u.firstname,
          u.lastname,
          b.title as book_title
         FROM ${schema}.book_issues bi
         JOIN ${schema}.user u ON bi.user_id = u.id
         JOIN ${schema}.books b ON bi.book_id = b.id
         WHERE bi.return_date IS NULL
           AND bi.due_date < CURRENT_DATE
           AND bi.status = 'issued'
         ORDER BY bi.due_date ASC`
      );
      return result.rows;
    } catch (error) {
      console.error("Error fetching overdue books:", error);
      throw error;
    }
  }
};

module.exports = Notification;

