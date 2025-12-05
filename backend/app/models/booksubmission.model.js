/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */

const sql = require("./db.js");
const cron = require("node-cron");

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

cron.schedule("* * * * *", checkbeforeDue);




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
