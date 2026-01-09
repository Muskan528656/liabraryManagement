/**
 * Notification Model
 * Handles library notifications (overdue books, book requests, announcements, etc.)
 * 
 * @author Library Management Team
 * @date Jan, 2025
 */

const sql = require("./db.js");

const cron = require("node-cron");

let schema = "";

const Notification = {
  init: function (schema_name) {
    schema = schema_name;
  },


  // findAll: async function (userId, isRead = null) {
  //   let query = `
  //     SELECT * FROM ${schema}.notifications 
  //     WHERE user_id = $1
  //   `;
  //   let params = [userId];

  //   if (isRead !== null) {
  //     query += ` AND is_read = $2`;
  //     params.push(isRead);
  //   }

  //   query += ` ORDER BY created_at DESC`;

  //   try {
  //     const result = await sql.query(query, params);
  //     return result.rows;
  //   } catch (error) {
  //     console.error("Error fetching notifications:", error);
  //     throw error;
  //   }
  // },




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
  },


  getAllBooks: async function () {
    try {
      const query = `SELECT 
                    bi.*,
                    b.title AS book_title,
                    b.isbn AS book_isbn,
                    issued_to_user.firstname || ' ' || issued_to_user.lastname AS issued_to_name,
                    issued_to_user.firstname || ' ' || issued_to_user.lastname AS student_name,
                    issued_to_user.email AS issued_to_email,
                    issued_by_user.firstname || ' ' || issued_by_user.lastname AS issued_by_name,
                    issued_by_user.email AS issued_by_email,
                    lc.card_number,
                    lc.id AS card_id
                   FROM ${schema}.book_issues bi
                   LEFT JOIN ${schema}.books b ON bi.book_id = b.id
                   LEFT JOIN ${schema}."user" issued_to_user ON bi.issued_to = issued_to_user.id
                   LEFT JOIN ${schema}."user" issued_by_user ON bi.issued_by = issued_by_user.id
                   LEFT JOIN ${schema}.library_members lc ON bi.issued_to = lc.user_id AND lc.is_active = true
                   ORDER BY bi.createddate DESC`;
      const result = await sql.query(query);

      if (result.rows.length > 0) {
        return { success: true, data: result.rows };
      }

      return { success: false, data: [] };
    } catch (error) {
      console.error("Data not found:", error);
      throw error;
    }
  },

  checkbeforeDue: async function () {
    let notifications = [];
    try {
      const response = await this.getAllBooks();
      const submittedBooks = response.data;

      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      notifications = [];

      for (const book of submittedBooks) {
        const dueDate = new Date(book.due_date);

        if (
          dueDate.getFullYear() === tomorrow.getFullYear() &&
          dueDate.getMonth() === tomorrow.getMonth() &&
          dueDate.getDate() === tomorrow.getDate()
        ) {

          const existingNotification = await sql.query(
            `SELECT id FROM ${schema}.notifications
           WHERE user_id = $1 AND type = 'due_reminder' AND related_id = $2 AND related_type = 'book_issue'
           AND DATE(created_at) = CURRENT_DATE`,
            [book.issued_to, book.id]
          );

          if (existingNotification.rows.length === 0) {
        
            const notification = await this.create({
              user_id: book.issued_to,
              title: 'Book Due Tomorrow',
              message: `Your book "${book.book_title}" is due tomorrow. Please return it to avoid penalties.`,
              type: 'due_reminder',
              related_id: book.id,
              related_type: 'book_issue'
            });

            notifications.push(notification);
          }
        }
      }

      return notifications;

    } catch (error) {
      console.error("❌ Error in checkbeforeDue:", error);
      throw error;
    }
  }



};





module.exports = Notification;

