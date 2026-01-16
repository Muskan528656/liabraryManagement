/**
 * Notification Model
 * Handles library notifications (overdue books, reminders, announcements)
 *
 * @author Library
 * @date Jan 2025
 */

const sql = require("./db.js");
const cron = require("node-cron");
const sendMail = require("../utils/Mailer.js");
const { dueTemplate } = require("../utils/ReminderTemplate.js");

let schema = "demo";

// Global variable to store the current logged-in user ID
global.currentLoggedInUserId = null;

function init(schema_name) {
  schema = schema_name || "demo";
}

async function findAll() {
  // console.log("Fetching all notifications for user ID:", userId);
  const query = `
    SELECT 
    n.*,                         
    m.first_name, m.last_name
    FROM ${schema}.notifications n
    LEFT JOIN ${schema}.library_members m 
      ON n.member_id = m.id
    ORDER BY n.createddate DESC;
  `;

  const result = await sql.query(query);
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
    notification.memberId || null,
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
  console.log([
     "Marking notifications as read for user ID:", userId,
    "book ID:", bookId,
    "member ID:", memberId,
    "type:", type
  ]);
  const query = `
    UPDATE ${schema}.notifications
    SET is_read = true WHERE user_id = $1 AND member_id = $2 AND book_id = $3 AND type = $4 AND is_read = false
    RETURNING *
  `;

  const result = await sql.query(query, [userId, memberId, bookId, type]);
  console.log("result=>",result.rows);
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

async function createOrUpdateDueScheduler({
  member_id,
  user_id,
  due_date,
  book_id
}) {
  const nextRun = new Date(due_date);
  console.log("nextRun=>",nextRun);
  nextRun.setDate(nextRun.getDate() - 1); // day before due

  if (nextRun < new Date()) {
    nextRun.setMinutes(nextRun.getMinutes() + 1); // run asap
  }

  // 🔍 Check existing scheduler for same member + due_date
  const existing = await sql.query(
    `
    SELECT id, config
    FROM ${schema}.scheduler
    WHERE action_type = 'BOOK_DUE_REMINDER'
      AND is_active = true
      AND config->>'member_id' = $1
      AND config->>'due_date' = $2
    `,
    [member_id, due_date]
  );

  if (existing.rows.length > 0) {
    // ✅ Merge book into existing scheduler
    const scheduler = existing.rows[0];
    const config = scheduler.config;

    if (!config.book_ids.includes(book_id)) {
      config.book_ids.push(book_id);
    }

    await sql.query(
      `
      UPDATE ${schema}.scheduler
      SET config = $1,
          lastmodifieddate = NOW()
      WHERE id = $2
      `,
      [config, scheduler.id]
    );

    return scheduler.id;
  }

  // ✅ Create new scheduler
  await sql.query(
    `
    INSERT INTO ${schema}.scheduler(
      action_type, next_run,is_active, config, createddate )
      VALUES ('BOOK_DUE_REMINDER', $1, true, $2, NOW())
    `,
    [
      nextRun, 
      JSON.stringify({ member_id, user_id, due_date, book_ids: [book_id]})
    ]
  );
}



async function upsertDueDateScheduler({
  due_date,
  member_id,
  user_id,
  book_id
}) {
  const nextRun = new Date(due_date);
  nextRun.setDate(nextRun.getDate() - 1);

  const res = await sql.query(
    `
    SELECT id, config
    FROM ${schema}.scheduler
    WHERE action_type = 'BOOK_DUE_REMINDER'
      AND is_active = true
      AND config->>'due_date' = $1
    `,
    [due_date]
  );

  if (res.rows.length === 0) {

    await sql.query(
      `
      INSERT INTO ${schema}.scheduler
      (action_type, next_run, repeat_type, is_active, config)
      VALUES ('BOOK_DUE_REMINDER', $1, 'once', true, $2)
      `,
      [
        nextRun,
        JSON.stringify({ due_date,
          members: {
            [member_id]: {
              user_id,
              books: [book_id]
            }
          }
        })
      ]
    );
    return;
  }

  const scheduler = res.rows[0];
  const config = scheduler.config;

  if (!config.members[member_id]) {
    config.members[member_id] = {
      user_id,
      books: []
    };
  }

  if (!config.members[member_id].books.includes(book_id)) {
    config.members[member_id].books.push(book_id);
  }

  await sql.query(
    ` UPDATE ${schema}.scheduler SET config = $1, lastmodifieddate = NOW() WHERE id = $2 `,
     [config, scheduler.id]
  );
}

async function sendDueReminderEmail(memberId, books, dueDate) {
  try {

    const memberRes = await sql.query(
      `
      SELECT
        lm.first_name,
        lm.last_name,
        lm.email
      FROM ${schema}.library_members lm
      WHERE lm.id = $1 AND lm.is_active = true
      `,
      [memberId]
    );

    // console.log("memberRes", memberRes.rows);
    if (memberRes.rows.length === 0) {
      console.error(`Member ${memberId} not found or inactive`);
      return;
    }

    const member = memberRes.rows[0];
    // console.log("member=>",member);
    const studentName = `${member.first_name} ${member.last_name}`;
  //  console.log("studentName",studentName)
 
    const booksData = books.map(book => ({
      name: book.title,
      dueDate: dueDate
    }));

    // console.log("bookData", booksData);
    const html = dueTemplate({
      studentName,
      books: booksData
    });

    // console.log("html",html);

    // Send email
    const emailResult = await sendMail({
      to: member.email,
      subject: "📘 Library Book Submission Reminder",
      html
    });

    // console.log("emailResult=>",emailResult);

    // console.log(`Due reminder email sent to ${member.email} for ${books.length} books`);
    return emailResult;

  } catch (error) {
    console.error("Error sending due reminder email:", error);
    throw error;
  }
}


cron.schedule('0 9 * * *', async () => {
  const jobs = await sql.query(`
    SELECT * FROM ${schema}.scheduler WHERE is_active = true
      AND next_run <= NOW()
      AND action_type = 'BOOK_DUE_REMINDER'
    `
  );

  console.log("Processing due reminder jobs:", jobs.rows.length);

  for (const job of jobs.rows) {
    const { due_date, members } = job.config;
    // console.log("Processing job for due_date:", due_date);


    const memberBooksMap = {};

    for (const memberId of Object.keys(members)) {
      const { user_id, books } = members[memberId];
      // console.log(`Processing member ${memberId} with ${books.length} books`);


      if (!memberBooksMap[memberId]) {
        memberBooksMap[memberId] = {
          user_id,
          books: []
        };
      }

      for (const bookId of books) {
      
        const exists = await sql.query(
          `
          SELECT 1 FROM ${schema}.notifications
          WHERE member_id = $1 AND book_id = $2 AND type = 'due_reminder' AND is_read = false
          LIMIT 1
          `,
          [memberId, bookId]
        );

        if (exists.rows.length > 0) {
          console.log(`Notification already exists for member ${memberId}, book ${bookId}`);
          continue;
        }

        const bookRes = await sql.query(
          `SELECT title FROM ${schema}.books WHERE id = $1`,
          [bookId]
        );

        if (!bookRes.rows.length) {
          console.log(`Book ${bookId} not found`);
          continue;
        }

        const book = bookRes.rows[0];

        memberBooksMap[memberId].books.push({
          id: bookId,
          title: book.title
        });

        await create({
          user_id,
          memberId,
          book_id: bookId,
          message: `Reminder: The book "${book.title}" is due for return tomorrow (${due_date}). Please return it to avoid penalties.`,
          type: "due_reminder"
        });

        console.log(`Created notification for member ${memberId}, book "${book.title}"`);
      }
    }

    for (const memberId of Object.keys(memberBooksMap)) {
      const { books } = memberBooksMap[memberId];

      if (books.length > 0) {
        try {
          console.log(`Sending consolidated email to member ${memberId} for ${books.length} books`);
          await sendDueReminderEmail(memberId, books, due_date);
          console.log(`Email sent successfully to member ${memberId}`);
        } catch (emailError) {
          console.error(`Failed to send email to member ${memberId}:`, emailError);
        }
      }
    }

    await sql.query(
      `UPDATE ${schema}.scheduler SET is_active = false, last_run = NOW() WHERE id = $1`,
      [job.id]
    );

    console.log(`Completed processing job ${job.id}`);
  }
});



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
  upsertDueDateScheduler,
  createOrUpdateDueScheduler,
  sendDueReminderEmail
};
