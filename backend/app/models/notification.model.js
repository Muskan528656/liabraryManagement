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

let schema = "${schema}";
let branchId = null;

// global.currentLoggedInUserId = null;

function init(schema_name, branch_id = null) {
  schema = schema_name || "${schema}";
  branchId = branch_id;
}

async function findAll(userId) {
  const query = `
    SELECT 
    n.*,                         
    m.first_name, m.last_name
    FROM ${schema}.notifications n
    LEFT JOIN ${schema}.library_members m 
      ON n.member_id = m.id
    WHERE n.user_id = $1 AND n.branch_id = $2
    ORDER BY n.createddate DESC;
  `;

  const result = await sql.query(query,[userId, branchId]);
  return result.rows;
}

async function getUnreadCount(userId) {
  const query = `
    SELECT COUNT(*) AS count
    FROM ${schema}.notifications
    WHERE user_id = $1
      AND is_read = false
      AND branch_id = $2
  `;

  const result = await sql.query(query, [userId, branchId]);
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
          branch_id,
          createddate
        )
        VALUES ($1, $2, $3, $4, false, $5, $6, NOW())
        RETURNING *
        `;
  const result = await sql.query(query, [
    notification.user_id,
    notification.memberId || null,
    notification.book_id || null,
    notification.message,
    notification.type || null,
    branchId
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
    WHERE id = $1 AND user_id = $2 AND branch_id = $3
    RETURNING *
  `;

  const result = await sql.query(query, [notificationId, userId, branchId]);
  return result.rows[0];
}

async function markAllAsRead(userId) {
  const query = `
    UPDATE ${schema}.notifications
    SET is_read = true
    WHERE user_id = $1 AND is_read = false AND branch_id = $2
    RETURNING *
  `;

  const result = await sql.query(query, [userId, branchId]);
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
    SET is_read = true WHERE user_id = $1 AND member_id = $2 AND book_id = $3 AND type = $4 AND is_read = false AND branch_id = $5
    RETURNING *
  `;

  const result = await sql.query(query, [userId, memberId, bookId, type, branchId]);
  console.log("result=>", result.rows);
  return result.rows;
}

async function createBroadcast(userIds, notification) {
  const { title, message, type, related_id, related_type } = notification;

  const values = [];
  const params = [];

  userIds.forEach((userId, i) => {
    const idx = i * 7;
    values.push(
      `($${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6
      }, $${idx + 7}, false, NOW())`
    );
    params.push(
      userId,
      title,
      message,
      type,
      related_id || null,
      related_type || null,
      branchId
    );
  });

  const query = `
    INSERT INTO ${schema}.notifications
    (user_id, title, message, type, related_id, related_type, branch_id, is_read, createddate)
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
      AND bi.branch_id = $1
    ORDER BY bi.due_date ASC
  `;

  const result = await sql.query(query, [branchId]);
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
    const existingNotification = await sql.query(
      `SELECT 1 FROM ${schema}.notifications 
      WHERE user_id = $1 
      AND related_id = $2 
      AND type = 'due_reminder' 
      AND is_read = false
      AND branch_id = $3
      LIMIT 1`,
      [user_id, issue_id, branchId]
    );

    if (existingNotification.rows.length > 0) {
      console.log(
        `Notification already exists for user ${user_id} and issue ${issue_id}`
      );
      return;
    }

    const notification = await create({
      user_id,
      title: "Book Due Reminder",
      message: `The book "${book_title}" is due for return tomorrow (${due_date}). Please return it to avoid penalties.`,
      type: "due_reminder",
      related_id: issue_id,
      related_type: "book_issue"
    });

    console.log("Due reminder notification created:", notification);
  }
}

// async function upsertDueDateScheduler(due_date, members, branchId) {
//   const existingJob = await sql.query(
//     `SELECT * FROM ${schema}.scheduler 
//     WHERE action_type = 'BOOK_DUE_REMINDER' 
//     AND config->>'due_date' = $1
//     AND branch_id = $2`,
//     [due_date, branchId]
//   );

//   if (existingJob.rows.length > 0) {
//     const jobId = existingJob.rows[0].id;
//     const updatedConfig = {
//       ...existingJob.rows[0].config,
//       members: { ...existingJob.rows[0].config.members, ...members }
//     };

//     await sql.query(
//       `UPDATE ${schema}.scheduler 
//       SET config = $1, 
//       next_run = $2,
//       updated_at = NOW()
//       WHERE id = $3 AND branch_id = $4`,
//       [updatedConfig, due_date, jobId, branchId]
//     );
//   } else {
//     const config = {
//       due_date,
//       members
//     };

//     await sql.query(
//       `INSERT INTO ${schema}.scheduler 
//       (action_type, config, next_run, is_active, created_at, branch_id) 
//       VALUES ($1, $2, $3, true, NOW(), $4)`,
//       ["BOOK_DUE_REMINDER", config, due_date, branchId]
//     );
//   }
// }


async function upsertDueDateScheduler({
  due_date,
  member_id,
  user_id,
  book_id,
  branch_id,
}) {
  const members = {
    [member_id]: {
      user_id,
      book_id,
      branch_id,
    },
  };

  const existingJob = await sql.query(
    `SELECT *
     FROM ${schema}.scheduler
     WHERE action_type = 'BOOK_DUE_REMINDER'
       AND config->>'due_date' = $1
       AND config->>'branch_id' = $2`,
    [due_date, String(branch_id)]
  );

  if (existingJob.rows.length > 0) {
    const job = existingJob.rows[0];

    const updatedConfig = {
      ...job.config,
      members: {
        ...(job.config?.members || {}),
        ...members,
      },
    };

    await sql.query(
      `UPDATE ${schema}.scheduler
       SET config = $1,
           next_run = $2,
           lastmodifieddate = NOW(),
           lastmodifiedbyid = $3
       WHERE id = $4`,
      [updatedConfig, due_date, user_id, job.id]
    );
  } else {
    const config = {
      due_date,
      branch_id,
      members,
    };

    await sql.query(
      `INSERT INTO ${schema}.scheduler
       (action_type, next_run, is_active,
        description, config,
        createddate, createdbyid,
        lastmodifieddate, lastmodifiedbyid)
       VALUES ($1,$2,true,
               $3,$4,
               NOW(),$5,
               NOW(),$5)`,
      [
        "BOOK_DUE_REMINDER",
        due_date,
        "Automatic reminder for due books",
        config,
        user_id,
      ]
    );
  }
}



async function createOrUpdateDueScheduler(issues) {
  const members = {};
  for (const issue of issues) {
    if (!members[issue.issued_to]) {
      members[issue.issued_to] = {
        user_id: issue.user_id,
        books: []
      };
    }
    members[issue.issued_to].books.push(issue.book_id);
  }

  await upsertDueDateScheduler(issues[0].due_date, members);
}

async function deleteNotification(notificationId, userId) {
  const query = `
    DELETE FROM ${schema}.notifications
    WHERE id = $1 AND user_id = $2 AND branch_id = $3
    RETURNING *
  `;

  const result = await sql.query(query, [notificationId, userId, branchId]);
  return result.rows[0];
}

async function sendDueReminderEmail(memberId, books, dueDate) {
  try {
    const memberRes = await sql.query(
      `SELECT first_name, last_name, email 
      FROM ${schema}.library_members 
      WHERE id = $1 AND is_active = true AND branch_id = $2`,
      [memberId, branchId]
    );

    if (memberRes.rows.length === 0) {
      console.error(`Member ${memberId} not found or inactive`);
      return;
    }

    const member = memberRes.rows[0];

    const studentName = `${member.first_name} ${member.last_name}`;


    const booksData = books.map(book => ({
      name: book.title,
      dueDate: dueDate
    }));


    const html = dueTemplate({
      studentName,
      books: booksData
    });


    const emailResult = await sendMail({
      to: member.email,
      subject: "📘 Library Book Submission Reminder",
      html
    });

    return emailResult;

  } catch (error) {
    console.error("Error sending due reminder email:", error);
    throw error;
  }
}


cron.schedule('* * * * *', async () => {
  const jobs = await sql.query(`
    SELECT * FROM ${schema}.scheduler WHERE is_active = true
      AND next_run <= NOW()
      AND action_type = 'BOOK_DUE_REMINDER'
      AND branch_id = $1
    `,
    [branchId]
  );
  for (const job of jobs.rows) {
    const { due_date, members } = job.config;

    const memberBooksMap = {};
    for (const memberId of Object.keys(members)) {
      const { user_id, books } = members[memberId];


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
          WHERE user_id =$1 AND member_id = $2 AND book_id = $3 AND type = 'due_reminder' AND is_read = false AND branch_id = $4
          LIMIT 1
          `,
          [user_id, memberId, bookId, branchId]
        );

        if (exists.rows.length > 0) {
          console.log(`Notification already exists for member ${memberId}, book ${bookId}`);
          continue;
        }

        const bookRes = await sql.query(
          `SELECT title FROM ${schema}.books WHERE id = $1 AND branch_id = $2`,
          [bookId, branchId]
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
      `UPDATE ${schema}.scheduler SET is_active = false, last_run = NOW() WHERE id = $1 AND branch_id = $2`,
      [job.id, branchId]
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