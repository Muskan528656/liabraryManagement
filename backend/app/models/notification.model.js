/**
 * Notification Model
 * Handles library notifications (overdue books, reminders, announcements)
 *
 * @author Library
 * @date Jan 2025
 */

const sql = require("./db.js");
const cron = require("node-cron");

let schema = "demo";

// Global variable to store the current logged-in user ID
global.currentLoggedInUserId = null;

function init(schema_name) {
  schema = schema_name || "demo";
}

async function findAll(userId) {
  console.log("Fetching all notifications for user ID:", userId);
  const query = `
    SELECT 
    n.*,                         
    m.first_name, m.last_name
    FROM ${schema}.notifications n
    LEFT JOIN ${schema}.library_members m 
      ON n.member_id = m.id
    WHERE n.user_id = $1
    ORDER BY n.createddate DESC;
  `;

  const result = await sql.query(query, [userId]);
  return result.rows;
}

async function getUnreadCount(userId) {
  const query = `
    SELECT COUNT(*) AS count
    FROM ${schema}.notifications
    WHERE user_id = $1
      AND is_read = false
  `;

  const result = await sql.query(query, [userId]);
  return Number(result.rows[0].count);
}

async function create(notification) {
  console.log("dateed=>", notification);

  const query = `
    INSERT INTO ${schema}.notifications
        (
          user_id,
          member_id,
          book_id,
          message,
          is_read,
          type,
          createddate
        )
        VALUES ($1, $2, $3, $4, false, $5, NOW())
        RETURNING *
        `;
  const result = await sql.query(query, [
    notification.user_id,
    notification.member_id || null,
    notification.book_id || null,
    notification.message,
    notification.type || null,
  ]);

  const createdNotification = result.rows[0];

  // Emit real-time notification to the user
  if (global.io) {
    global.io
      .to(`user_${notification.user_id}`)
      .emit("new_notification", createdNotification);
  }

  return createdNotification;
}

async function markAsRead(notificationId, userId) {
  const query = `
    UPDATE ${schema}.notifications
    SET is_read = true
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;

  const result = await sql.query(query, [notificationId, userId]);
  return result.rows[0];
}

async function markAllAsRead(userId) {
  const query = `
    UPDATE ${schema}.notifications
    SET is_read = true, read_at = NOW()
    WHERE user_id = $1 AND is_read = false
    RETURNING *
  `;

  const result = await sql.query(query, [userId]);
  return result.rows;
}

async function markAsReadByRelatedId(userId, bookId, memberId, type) {
  console.log(
    "Marking notifications as read for user ID:",
    userId,
    "book ID:",
    bookId,
    "member ID:",
    memberId,
    "type:",
    type
  );
  const query = `
    UPDATE ${schema}.notifications
    SET is_read = true WHERE user_id = $1 AND member_id = $2 AND book_id = $3 AND type = $4 AND is_read = false
    RETURNING *
  `;

  const result = await sql.query(query, [userId, memberId, bookId, type]);
  return result.rows;
}

async function createBroadcast(userIds, notification) {
  const { title, message, type, related_id, related_type } = notification;

  const values = [];
  const params = [];

  userIds.forEach((userId, i) => {
    const idx = i * 6;
    values.push(
      `($${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6
      }, false, NOW())`
    );
    params.push(
      userId,
      title,
      message,
      type,
      related_id || null,
      related_type || null
    );
  });

  const query = `
    INSERT INTO ${schema}.notifications
    (user_id, title, message, type, related_id, related_type, is_read, createddate)
    VALUES ${values.join(",")}
    RETURNING *
  `;

  const result = await sql.query(query, params);
  return result.rows;
}

async function getOverDueBooks() {
  const query = `
    SELECT
      bi.id AS issue_id,
      bi.user_id,
      bi.book_id,
      bi.issue_date,
      bi.due_date,
      u.email,
      u.firstname,
      u.lastname,
      b.title AS book_title
    FROM ${schema}.book_issues bi
    JOIN ${schema}."user" u ON bi.user_id = u.id
    JOIN ${schema}.books b ON bi.book_id = b.id
    WHERE bi.return_date IS NULL
      AND bi.due_date < CURRENT_DATE
      AND bi.status = 'issued'
    ORDER BY bi.due_date ASC
  `;

  const result = await sql.query(query);
  return result.rows;
}

async function createDueReminderIfTomorrow(
  user_id,
  book_title,
  issue_id,
  due_date,
  app
) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dueDateObj = new Date(due_date);

  if (
    dueDateObj.getFullYear() === tomorrow.getFullYear() &&
    dueDateObj.getMonth() === tomorrow.getMonth() &&
    dueDateObj.getDate() === tomorrow.getDate()
  ) {
    const existing = await sql.query(
      `
      SELECT id
      FROM ${schema}.notifications
      WHERE user_id = $1
        AND related_id = $2
        AND type = 'due_reminder'
        AND DATE(createddate) = CURRENT_DATE
      `,
      [user_id, issue_id]
    );

    if (existing.rows.length === 0) {
      const notification = await create({
        user_id,
        message: `Your book "${book_title}" is due tomorrow. Please return it to avoid penalties.`,
        type: "due_reminder",
        related_id: issue_id,
        related_type: "book_issue",
      });

      if (app?.get("io")) {
        app
          .get("io")
          .to(`user_${user_id}`)
          .emit("new_notification", notification);
      }

      return notification;
    }
  }

  return null;
}



async function checkBooksDueTomorrow() {
  try {

    console.log("🔍 Checking for books due tomorrow...");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const query = `
      SELECT
        bi.id AS issue_id,
        bi.book_id,
        bi.issued_to AS member_id,
        bi.due_date,
        bi.issue_date,
        b.title AS book_title,
        b.isbn AS book_isbn,
        lm.first_name || ' ' || lm.last_name AS member_name,
        lm.card_number,
        lm.email AS member_email,
        bi.status
        FROM ${schema}.book_issues bi
        INNER JOIN ${schema}.books b ON bi.book_id = b.id
        INNER JOIN ${schema}.library_members lm ON bi.issued_to = lm.id
        WHERE DATE(bi.due_date) = $1
        AND bi.return_date IS NULL
        AND bi.status IN ('issued', 'active', NULL)
        AND lm.is_active = true
      ORDER BY bi.due_date ASC
    `;

    const result = await sql.query(query, [tomorrowStr]);

    console.log("result=>", result.rows);
    
    if (result.rows.length === 0) {

      return;
    }


    const currentUserId = global.currentLoggedInUserId;
    console.log("currentUserId", currentUserId);
    if (!currentUserId) {
      return;
    }
    for (const book of result.rows) {
      console.log("book=>", book);
      const existingQuery = `
        SELECT id
        FROM ${schema}.notifications
        WHERE user_id = $1
        AND member_id = $2
          AND book_id = $3
          AND type = 'due_reminder'
          AND DATE(createddate) = CURRENT_DATE
      `;

      const existingResult = await sql.query(existingQuery, [
        currentUserId,
        book.member_id,
        book.book_id
      ]);
      const dueDateStr = new Date(book.due_date).toISOString().split("T")[0];

      if (existingResult.rows.length === 0) {
        const notification = await create({
          user_id: currentUserId,
          member_id: book.member_id,
          book_id: book.book_id,
          message: `Reminder: The book "${book.book_title}" is due for return tomorrow (${dueDateStr}). Please return it to avoid penalties.`,
          type: "due_reminder"
        });

        console.log(`Created notification for logged-in user about book "${book.book_title}"`);
      } else {
        console.log(`Notification already exists for logged-in user about book "${book.book_title}"`);
      }
    }

    console.log("Completed checking books due tomorrow");

  } catch (error) {
    console.error("Error in checkBooksDueTomorrow:", error);
  }
}

cron.schedule('* * * * *', async () => {
  console.log("Running daily cron job: Check books due tomorrow");
  await checkBooksDueTomorrow()

});

async function deleteNotification(notificationId, userId) {
  try {
    const query = `
      DELETE FROM ${schema}.notifications
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await sql.query(query, [notificationId, userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
}

module.exports = {
  init,
  findAll,
  getUnreadCount,
  create,
  markAsRead,
  markAllAsRead,
  markAsReadByRelatedId,
  deleteNotification,
  createBroadcast,
  getOverDueBooks,
  createDueReminderIfTomorrow,
  checkBooksDueTomorrow,
};
