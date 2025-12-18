/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */

const sql = require("./db.js");
const cron = require("node-cron");
const sendMail = require("../utils/mailer");
const { dueTemplate, overdueTemplate } = require("../../app/utils/ReminderTemplate");

let schema = "";

function init(schema_name) {
  schema = schema_name;
}



async function create(submissionData, userId) {
  console.log("Schema initialized for BookSubmission model:", schema);
  try {
    if (!submissionData.issue_id) {
      throw new Error("Issue ID is required");
    }
    if (!userId) {
      throw new Error("Submitted by (librarian) is required");
    }

    const issueQuery = `SELECT * FROM ${schema}.book_issues WHERE id = $1`;
    const issueResult = await sql.query(issueQuery, [submissionData.issue_id]);
    if (issueResult.rows.length === 0) {
      throw new Error("Issue record not found");
    }
    const issue = issueResult.rows[0];

    if (issue.return_date) {
      throw new Error("Book already returned");
    }

    const bookQuery = `SELECT id FROM ${schema}.books WHERE id = $1`;
    const bookResult = await sql.query(bookQuery, [issue.book_id]);
    if (bookResult.rows.length === 0) {
      throw new Error("Book not found");
    }

    const dueDate = new Date(issue.due_date);
    const today = new Date();
    const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));

    let penalty = 0;
    if (daysOverdue > 0) {
      try {

        const penaltySettingsQuery = `SELECT * FROM ${schema}.penalty_masters WHERE is_active = true LIMIT 1`;
        const penaltyResult = await sql.query(penaltySettingsQuery);
        if (penaltyResult.rows.length > 0) {
          const settings = penaltyResult.rows[0];


          if (settings.rate_period === 'day') {
            penalty = settings.rate * daysOverdue;
          } else if (settings.rate_period === 'week') {
            penalty = settings.rate * Math.ceil(daysOverdue / 7);
          } else if (settings.rate_period === 'month') {
            penalty = settings.rate * Math.ceil(daysOverdue / 30);
          }


          if (settings.concession_percentage > 0) {
            penalty = penalty * (1 - settings.concession_percentage / 100);
          }
        }
      } catch (err) {
        console.warn("Could not fetch penalty settings, using 0 penalty");
      }
    }

    if (submissionData.condition_after && submissionData.condition_before) {
      const conditionBefore = submissionData.condition_before.toLowerCase();
      const conditionAfter = submissionData.condition_after.toLowerCase();

      if (conditionAfter === 'damaged' && conditionBefore !== 'damaged') {
        penalty += 500;
      } else if (conditionAfter === 'fair' && conditionBefore === 'good') {
        penalty += 100;
      }
    }

    penalty = Math.round(penalty * 100) / 100;

    const submissionQuery = `INSERT INTO ${schema}.book_submissions 
  (issue_id, book_id, submitted_by, submit_date, condition_before, condition_after, remarks, penalty, createddate , createdbyid,lastmodifiedbyid)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP , $9 , $9)
  RETURNING *`
    const submissionValues = [
      submissionData.issue_id,
      issue.book_id,
      userId,
      submissionData.submit_date || new Date().toISOString().split('T')[0],
      submissionData.condition_before || 'Good',
      submissionData.condition_after || 'Good',
      submissionData.remarks || '',
      penalty,
      userId
    ];

    const submissionResult = await sql.query(submissionQuery, submissionValues);
    const submission = submissionResult.rows[0];

    const returnDate = new Date().toISOString().split('T')[0];
    const updateIssueQuery = `UPDATE ${schema}.book_issues 
                             SET return_date = $2, status = $3, 
                                 lastmodifieddate = CURRENT_TIMESTAMP, lastmodifiedbyid = $4
                             WHERE id = $1`;
    await sql.query(updateIssueQuery, [
      submissionData.issue_id,
      returnDate,
      'returned',
      userId,
    ]);

    await sql.query(`UPDATE ${schema}.books SET available_copies = available_copies + 1 WHERE id = $1`, [issue.book_id]);

    await sql.query("COMMIT");
    return submission;
  } catch (error) {
    await sql.query("ROLLBACK");
    console.error("Error in create submission:", error);
    throw error;
  } finally {

  }
}


async function findById(id) {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT 
                    bs.*,
                    bi.issued_to,
                    bi.issue_date,
                    bi.due_date,
                    b.title AS book_title,
                    b.isbn AS book_isbn,
                    u.firstname || ' ' || u.lastname AS student_name,
                    u.email AS student_email,
                    submitted_user.firstname || ' ' || submitted_user.lastname AS submitted_by_name
                   FROM ${schema}.book_submissions bs
                   LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
                   LEFT JOIN ${schema}.books b ON bs.book_id = b.id
                   LEFT JOIN ${schema}."user" u ON bi.issued_to = u.id
                   LEFT JOIN ${schema}."user" submitted_user ON bs.submitted_by = submitted_user.id
                   WHERE bs.id = $1`;
    const result = await sql.query(query, [id]);
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error("Error in findById:", error);
    throw error;
  }
}


async function findAll() {
  console.log('schema', schema);
  console.log("findAll called for schema:", schema);

  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT 
                    bs.*,
                    bi.issued_to,
                    bi.issue_date,
                    bi.due_date,
                    b.title AS book_title,
                    b.isbn AS book_isbn,
                    u.firstname || ' ' || u.lastname AS student_name,
                    u.email AS student_email,
                    submitted_user.firstname || ' ' || submitted_user.lastname AS submitted_by_name
                   FROM ${schema}.book_submissions bs
                   LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
                   LEFT JOIN ${schema}.books b ON bs.book_id = b.id
                   LEFT JOIN ${schema}."user" u ON bi.issued_to = u.id
                   LEFT JOIN ${schema}."user" submitted_user ON bs.submitted_by = submitted_user.id
                   ORDER BY bs.createddate DESC`;
    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}


async function findByIssueId(issueId) {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT 
                    bs.*,
                    bi.issued_to,
                    bi.issue_date,
                    bi.due_date,
                    b.title AS book_title,
                    b.isbn AS book_isbn,
                    u.firstname || ' ' || u.lastname AS student_name,
                    u.email AS student_email,
                    submitted_user.firstname || ' ' || submitted_user.lastname AS submitted_by_name
                   FROM ${schema}.book_submissions bs
                   LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
                   LEFT JOIN ${schema}.books b ON bs.book_id = b.id
                   LEFT JOIN ${schema}."user" u ON bi.issued_to = u.id
                   LEFT JOIN ${schema}."user" submitted_user ON bs.submitted_by = submitted_user.id
                   WHERE bs.issue_id = $1`;
    const result = await sql.query(query, [issueId]);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findByIssueId:", error);
    throw error;
  }
}


async function findByBookId(bookId) {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT 
                    bs.*,
                    bi.issued_to,
                    bi.issue_date,
                    bi.due_date,
                    b.title AS book_title,
                    b.isbn AS book_isbn,
                    u.firstname || ' ' || u.lastname AS student_name,
                    u.email AS student_email,
                    submitted_user.firstname || ' ' || submitted_user.lastname AS submitted_by_name
                   FROM ${schema}.book_submissions bs
                   LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
                   LEFT JOIN ${schema}.books b ON bs.book_id = b.id
                   LEFT JOIN ${schema}."user" u ON bi.issued_to = u.id
                   LEFT JOIN ${schema}."user" submitted_user ON bs.submitted_by = submitted_user.id
                   WHERE bs.book_id = $1
                   ORDER BY bs.createddate DESC`;
    const result = await sql.query(query, [bookId]);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findByBookId:", error);
    throw error;
  }
}


async function findByDateRange(startDate, endDate) {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT 
                    bs.*,
                    bi.issued_to,
                    bi.issue_date,
                    bi.due_date,
                    b.title AS book_title,
                    b.isbn AS book_isbn,
                    u.firstname || ' ' || u.lastname AS student_name,
                    u.email AS student_email,
                    submitted_user.firstname || ' ' || submitted_user.lastname AS submitted_by_name
                   FROM ${schema}.book_submissions bs
                   LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
                   LEFT JOIN ${schema}.books b ON bs.book_id = b.id
                   LEFT JOIN ${schema}."user" u ON bi.issued_to = u.id
                   LEFT JOIN ${schema}."user" submitted_user ON bs.submitted_by = submitted_user.id
                   WHERE bs.submit_date >= $1 AND bs.submit_date <= $2
                   ORDER BY bs.createddate DESC`;
    const result = await sql.query(query, [startDate, endDate]);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findByDateRange:", error);
    throw error;
  }
}


async function findByLibrarian(librarianId) {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT 
                    bs.*,
                    bi.issued_to,
                    bi.issue_date,
                    bi.due_date,
                    b.title AS book_title,
                    b.isbn AS book_isbn,
                    u.firstname || ' ' || u.lastname AS student_name,
                    u.email AS student_email,
                    submitted_user.firstname || ' ' || submitted_user.lastname AS submitted_by_name
                   FROM ${schema}.book_submissions bs
                   LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
                   LEFT JOIN ${schema}.books b ON bs.book_id = b.id
                   LEFT JOIN ${schema}."user" u ON bi.issued_to = u.id
                   LEFT JOIN ${schema}."user" submitted_user ON bs.submitted_by = submitted_user.id
                   WHERE bs.submitted_by = $1
                   ORDER BY bs.createddate DESC`;
    const result = await sql.query(query, [librarianId]);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findByLibrarian:", error);
    throw error;
  }
}


async function deleteById(id) {
  try {
    const query = `DELETE FROM ${schema}.book_submissions WHERE id = $1 RETURNING *`;
    const result = await sql.query(query, [id]);
    if (result.rows.length > 0) {
      return { success: true, message: "Submission deleted successfully" };
    }
    return { success: false, message: "Submission not found" };
  } catch (error) {
    console.error("Error in deleteById:", error);
    throw error;
  }
}


async function getAllBooks() {
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
                   FROM demo.book_issues bi
                   LEFT JOIN demo.books b ON bi.book_id = b.id
                   LEFT JOIN demo."user" issued_to_user ON bi.issued_to = issued_to_user.id
                   LEFT JOIN demo."user" issued_by_user ON bi.issued_by = issued_by_user.id
                   LEFT JOIN demo.library_members lc ON bi.issued_to = lc.user_id AND lc.is_active = true
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
}


async function checkbeforeDue() {


  let notifications = [];
  try {
    const response = await getAllBooks();


    const submittedBooks = response.data;

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    notifications = [];

    submittedBooks.forEach(book => {
      const dueDate = new Date(book.due_date);


      if (
        dueDate.getFullYear() === tomorrow.getFullYear() &&
        dueDate.getMonth() === tomorrow.getMonth() &&
        dueDate.getDate() === tomorrow.getDate()
      ) {

        notifications.push({
          message: `Your book is due tomorrow. Please return "${book.book_title}"  to avoid penalties.`,
          user: book.issued_by,
          due_date: dueDate,
          return_date: book.return_date,
          type: 'due_date',
          quantity: 1,
        });
      }
    });


    return notifications;

  } catch (error) {
    console.error("❌ Error:", error);
  }
} async function getSubmitCountByBookId(bookId) {
  try {
    if (!schema) throw new Error("Schema not initialized. Call init() first.");

    const query = `
      SELECT COUNT(*) AS submit_count
      FROM ${schema}.book_issues
      WHERE book_id = $1 
        AND return_date IS NOT NULL 
        AND status = 'returned'
    `;
    const result = await sql.query(query, [bookId]);

    return parseInt(result.rows[0].submit_count) || 0;

  } catch (error) {
    console.error("Error in getSubmitCountByBookId:", error);
    throw error;
  }
}
async function sendDueReminder() {
  try {
    console.log("🔔 Running due reminder test...");

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    const tomorrowStr = `${yyyy}-${mm}-${dd}`;

    const query = `
      SELECT bi.*, b.title AS book_title, b.author_id
      FROM demo.book_issues bi
      LEFT JOIN demo.books b ON bi.book_id = b.id
      WHERE bi.due_date = $1 AND bi.return_date IS NULL
    `;
    const result = await sql.query(query, [tomorrowStr]);

    const groupedByStudent = {};

    for (const book of result.rows) {
      if (!groupedByStudent[book.issued_to]) {
        groupedByStudent[book.issued_to] = [];
      }

      groupedByStudent[book.issued_to].push({
        name: book.book_title,
        author: book.author || "-",
        dueDate: book.due_date,
      });
    }
    for (const issuedTo in groupedByStudent) {
      let student_email = null;
      let student_name = null;

      const userQuery = `
        SELECT *
        FROM demo.library_members
        WHERE id = $1
      `;
      const userResult = await sql.query(userQuery, [issuedTo]);

      if (userResult.rows.length > 0 && userResult.rows[0].email) {
        student_email = userResult.rows[0].email;
        student_name = userResult.rows[0].first_name + ' ' + userResult.rows[0].last_name;
      } else {
        const memberQuery = `
          SELECT email, first_name || ' ' || last_name AS student_name
          FROM demo.library_members
          WHERE id = $1 AND is_active = true
        `;
        const memberResult = await sql.query(memberQuery, [issuedTo]);

        if (memberResult.rows.length > 0) {
          student_email = memberResult.rows[0].email;
          student_name = memberResult.rows[0].student_name;
        }
      }

      if (!student_email) {
        console.warn(` No email found for user: ${issuedTo}`);
        continue;
      }
      console.log(` Sending mail to: ${student_email} for user: ${issuedTo} , student name: ${student_name}`);

      const html = dueTemplate({
        studentName: student_name,
        books: groupedByStudent[issuedTo],
      });

      await sendMail({
        to: student_email,
        subject: "📘 Library Reminder: Books due tomorrow",
        html,
      });

      console.log(`Due reminder sent to ${student_email}`);
    }

  } catch (err) {
    console.error(" Error in due reminder:", err);
  }
}

// async function sendDueReminder() {
//   try {
//     console.log("🔔 Running due reminder test...");

//     const today = new Date();
//     const tomorrow = new Date(today);
//     tomorrow.setDate(today.getDate() + 1);

//     const yyyy = tomorrow.getFullYear();
//     const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
//     const dd = String(tomorrow.getDate()).padStart(2, "0");
//     const tomorrowStr = `${yyyy}-${mm}-${dd}`;
//     console.log("🗓 Tomorrow:", tomorrowStr);

//     // 1️⃣ Get all books due tomorrow
//     const query = `
//       SELECT bi.*, b.title AS book_title
//       FROM demo.book_issues bi
//       LEFT JOIN demo.books b ON bi.book_id = b.id
//       WHERE bi.due_date = $1 AND bi.return_date IS NULL
//     `;
//     const result = await sql.query(query, [tomorrowStr]);
//     const dueBooks = result.rows;

//     console.log(`🔔 Found ${dueBooks.length} books due tomorrow.`);

//     for (const book of dueBooks) {
//       let student_email = null;
//       let student_name = null;

//       // 2️⃣ Try to get email from user table
//       const userQuery = `
//         SELECT email, firstname || ' ' || lastname AS student_name
//         FROM demo."user"
//         WHERE id = $1
//       `;
//       const userResult = await sql.query(userQuery, [book.issued_to]);
//       if (userResult.rows.length > 0 && userResult.rows[0].email) {
//         student_email = userResult.rows[0].email;
//         student_name = userResult.rows[0].student_name;
//       } else {

//         const memberQuery = `
//           SELECT *
//           FROM demo.library_members
//           WHERE id = $1 AND is_active = true
//         `;
//         const memberResult = await sql.query(memberQuery, [book.issued_to]);
//         console.log('Member Result:', memberResult.rows);
//         if (memberResult.rows.length > 0 && memberResult.rows[0].email) {
//           student_email = memberResult.rows[0].email;
//           student_name = memberResult.rows[0].student_name;
//         }
//       }

//       if (!student_email) {
//         console.warn(`⚠️ No email found for issued_to: ${book.issued_to}, Book: ${book.book_title}`);
//         continue; // skip this record
//       }

//       console.log(`✉️ Sending mail to: ${student_email}, Book: ${book.book_title}`);

//       const html = dueTemplate({
//         studentName: student_name,
//         bookName: book.book_title,
//         dueDate: book.due_date,
//       });

//       await sendMail({
//         to: student_email,
//         subject: `📘 Reminder: "${book.book_title}" is due tomorrow`,
//         html,
//       });

//       console.log(`✅ Test mail sent to ${student_email}`);
//     }

//     console.log(`🔔 Total test reminders processed: ${dueBooks.length}`);
//   } catch (err) {
//     console.error("❌ Error in due reminder test:", err);
//   }
// }
async function sendOverdueReminder() {
  try {
    console.log(" Running overdue reminder test...");

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;
    console.log("🗓 Today:", todayStr);


    const query = `
      SELECT bi.*, b.title AS book_title
      FROM demo.book_issues bi
      LEFT JOIN demo.books b ON bi.book_id = b.id
      WHERE bi.due_date < $1 AND bi.return_date IS NULL
    `;
    const result = await sql.query(query, [todayStr]);
    const overdueBooks = result.rows;

    console.log(`Found ${overdueBooks.length} overdue books.`);

    for (const book of overdueBooks) {
      let student_email = null;
      let student_name = null;

      const userQuery = `
        SELECT email, firstname || ' ' || lastname AS student_name
        FROM demo."user"
        WHERE id = $1
      `;
      const userResult = await sql.query(userQuery, [book.issued_to]);
      if (userResult.rows.length > 0 && userResult.rows[0].email) {
        student_email = userResult.rows[0].email;
        student_name = userResult.rows[0].student_name;
      } else {

        const memberQuery = `
          SELECT email, firstname || ' ' || lastname AS student_name
          FROM demo.library_members
          WHERE user_id = $1 AND is_active = true
        `;
        const memberResult = await sql.query(memberQuery, [book.issued_to]);
        if (memberResult.rows.length > 0 && memberResult.rows[0].email) {
          student_email = memberResult.rows[0].email;
          student_name = memberResult.rows[0].student_name;
        }
      }

      if (!student_email) {
        console.warn(` No email found for issued_to: ${book.issued_to}, Book: ${book.book_title}`);
        continue;
      }

      const dueDate = new Date(book.due_date);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      let penalty = 0;
      try {
        const penaltySettingsQuery = `
          SELECT *
          FROM demo.penalty_masters
          WHERE is_active = true
          LIMIT 1
        `;
        const penaltyResult = await sql.query(penaltySettingsQuery);
        if (penaltyResult.rows.length > 0) {
          const settings = penaltyResult.rows[0];
          if (settings.rate_period === 'day') {
            penalty = settings.rate * daysOverdue;
          } else if (settings.rate_period === 'week') {
            penalty = settings.rate * Math.ceil(daysOverdue / 7);
          } else if (settings.rate_period === 'month') {
            penalty = settings.rate * Math.ceil(daysOverdue / 30);
          }
          if (settings.concession_percentage > 0) {
            penalty = penalty * (1 - settings.concession_percentage / 100);
          }
        }
      } catch (err) {
        console.warn("Could not fetch penalty settings, using 0 penalty");
      }

      const html = overdueTemplate({
        studentName: student_name,
        bookName: book.book_title,
        dueDate: book.due_date,
        overdueDays: daysOverdue,
        penaltyAmount: penalty,
      });

      console.log(`Sending overdue mail to: ${student_email}, Book: ${book.book_title}`);

      await sendMail({
        to: student_email,
        subject: `📕 Overdue Notice: "${book.book_title}"`,
        html,
      });

      console.log(` Overdue mail sent to ${student_email}`);
    }

    console.log(` Total overdue reminders processed: ${overdueBooks.length}`);
  } catch (err) {
    console.error(" Error in overdue reminder test:", err);
  }
}


// ------------------------
// Cron job for daily reminders (actual deployment)
// cron.schedule("*/10 * * * * *", sendDueReminder);
cron.schedule("*/10 * * * *", sendDueReminder);
cron.schedule("0 10 * * *", sendOverdueReminder);




module.exports = {
  init,
  create,
  findById,
  findAll,
  findByIssueId,
  findByBookId,
  findByDateRange,
  findByLibrarian,
  deleteById,
  checkbeforeDue,
  getAllBooks
  , getSubmitCountByBookId
};
