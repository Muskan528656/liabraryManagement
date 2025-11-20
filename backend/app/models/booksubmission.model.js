/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */

const sql = require("./db.js");
let schema = "";

function init(schema_name) {
  schema = schema_name;
}

// Create book submission record
async function create(submissionData, userId) {
  const client = await sql.connect();
  try {
    await client.query("BEGIN");

  
    if (!submissionData.issue_id) {
      throw new Error("Issue ID is required");
    }
    if (!userId) {
      throw new Error("Submitted by (librarian) is required");
    }

    // Get issue details
    const issueQuery = `SELECT * FROM ${schema}.book_issues WHERE id = $1`;
    const issueResult = await client.query(issueQuery, [submissionData.issue_id]);
    if (issueResult.rows.length === 0) {
      throw new Error("Issue record not found");
    }
    const issue = issueResult.rows[0];

    if (issue.return_date) {
      throw new Error("Book already returned");
    }

    // Get book details to get book_id
    const bookQuery = `SELECT id FROM ${schema}.books WHERE id = $1`;
    const bookResult = await client.query(bookQuery, [issue.book_id]);
    if (bookResult.rows.length === 0) {
      throw new Error("Book not found");
    }

    // Calculate penalty based on overdue days
    const dueDate = new Date(issue.due_date);
    const today = new Date();
    const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));

    let penalty = 0;
    if (daysOverdue > 0) {
      try {
        const penaltySettingsQuery = `SELECT * FROM ${schema}.penalty_masters WHERE is_active = true LIMIT 1`;
        const penaltyResult = await client.query(penaltySettingsQuery);
        if (penaltyResult.rows.length > 0) {
          const settings = penaltyResult.rows[0];
          if (settings.rate_period === 'day') {
            penalty = settings.rate * daysOverdue;
          } else if (settings.rate_period === 'week') {
            penalty = settings.rate * Math.ceil(daysOverdue / 7);
          } else if (settings.rate_period === 'month') {
            penalty = settings.rate * Math.ceil(daysOverdue / 30);
          }

          // Apply concession if any
          if (settings.concession_percentage > 0) {
            penalty = penalty * (1 - settings.concession_percentage / 100);
          }
        }
      } catch (err) {
        console.warn("Could not fetch penalty settings, using 0 penalty");
      }
    }

    // Add penalty for damage condition if condition_after is worse than condition_before
    if (submissionData.condition_after && submissionData.condition_before) {
      const conditionBefore = submissionData.condition_before.toLowerCase();
      const conditionAfter = submissionData.condition_after.toLowerCase();

      if (conditionAfter === 'damaged' && conditionBefore !== 'damaged') {
        // Add additional penalty for damage
        penalty += 500; // Add 500 for damage
      } else if (conditionAfter === 'fair' && conditionBefore === 'good') {
        penalty += 100; // Add 100 for wear
      }
    }

    penalty = Math.round(penalty * 100) / 100;

    // Create submission record
    const submissionQuery = `INSERT INTO ${schema}.book_submissions 
                            (issue_id, book_id, submitted_by, submit_date, condition_before, condition_after, remarks, penalty, created_at)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
                            RETURNING *`;

    const submissionValues = [
      submissionData.issue_id,
      issue.book_id,
      userId,
      submissionData.submit_date || new Date().toISOString().split('T')[0],
      submissionData.condition_before || 'Good',
      submissionData.condition_after || 'Good',
      submissionData.remarks || '',
      penalty,
    ];

    const submissionResult = await client.query(submissionQuery, submissionValues);
    const submission = submissionResult.rows[0];

    // Update issue record to mark as returned
    const returnDate = new Date().toISOString().split('T')[0];
    const updateIssueQuery = `UPDATE ${schema}.book_issues 
                             SET return_date = $2, status = $3, 
                                 lastmodifieddate = CURRENT_TIMESTAMP, lastmodifiedbyid = $4
                             WHERE id = $1`;
    await client.query(updateIssueQuery, [
      submissionData.issue_id,
      returnDate,
      'returned',
      userId,
    ]);

    // Update book available copies
    await client.query(`UPDATE ${schema}.books SET available_copies = available_copies + 1 WHERE id = $1`, [issue.book_id]);

    await client.query("COMMIT");
    return submission;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in create submission:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Find submission by ID
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

// Find all submissions
async function findAll() {
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
                   ORDER BY bs.created_at DESC`;
    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}

// Find submissions by issue ID
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

// Find submissions by book ID
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
                   ORDER BY bs.created_at DESC`;
    const result = await sql.query(query, [bookId]);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findByBookId:", error);
    throw error;
  }
}

// Find submissions by date range
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
                   ORDER BY bs.created_at DESC`;
    const result = await sql.query(query, [startDate, endDate]);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findByDateRange:", error);
    throw error;
  }
}

// Find submissions by librarian (submitted_by)
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
                   ORDER BY bs.created_at DESC`;
    const result = await sql.query(query, [librarianId]);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findByLibrarian:", error);
    throw error;
  }
}

// Delete submission by ID
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
};
