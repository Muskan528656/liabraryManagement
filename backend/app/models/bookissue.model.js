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

// Find all book issues
async function findAll() {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
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
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}

// Find book issue by ID
async function findById(id) {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
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
                   WHERE bi.id = $1`;
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

// Find active issues (not returned)
async function findActive() {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
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
                   WHERE bi.return_date IS NULL AND bi.status = 'issued'
                   ORDER BY bi.issue_date DESC`;
    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findActive:", error);
    throw error;
  }
}

// Find issues by book ID
async function findByBookId(bookId) {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
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
                   WHERE bi.book_id = $1 AND bi.return_date IS NULL AND bi.status = 'issued'`;
    const result = await sql.query(query, [bookId]);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findByBookId:", error);
    throw error;
  }
}

// Find issues by user ID (issued_to)
async function findByUserId(userId) {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
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
                   WHERE bi.issued_to = $1 AND bi.return_date IS NULL AND bi.status = 'issued'`;
    const result = await sql.query(query, [userId]);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findByUserId:", error);
    throw error;
  }
}

async function findByCardId(cardId) {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const cardQuery = `SELECT user_id FROM ${schema}.library_members WHERE id = $1`;
    const cardResult = await sql.query(cardQuery, [cardId]);
    if (cardResult.rows.length === 0) {
      return [];
    }
    const userId = cardResult.rows[0].user_id;
    return await findByUserId(userId);
  } catch (error) {
    console.error("Error in findByCardId:", error);
    throw error;
  }
}

// Issue a book (checkout)
async function issueBook(issueData, userId) {
  // const sql = await sql.connect();
  try {
    //   await sql.query("BEGIN");

    // Check if book is available
    const bookCheck = await sql.query(`SELECT available_copies FROM ${schema}.books WHERE id = $1`, [issueData.book_id]);
    if (bookCheck.rows.length === 0) {
      throw new Error("Book not found");
    }
    if (bookCheck.rows[0].available_copies <= 0) {
      throw new Error("Book is not available");
    }

    // Get user_id from card_id if provided, otherwise use issued_to directly
    let issued_to = issueData.issued_to || issueData.issuedTo;
    if (!issued_to && (issueData.card_id || issueData.cardId)) {
      const cardQuery = `SELECT user_id FROM ${schema}.library_members WHERE id = $1`;
      const cardResult = await sql.query(cardQuery, [issueData.card_id || issueData.cardId]);
      if (cardResult.rows.length === 0) {
        throw new Error("Library card not found");
      }
      issued_to = cardResult.rows[0].user_id;
    }

    if (!issued_to) {
      throw new Error("User ID (issued_to) is required");
    }

    // Fetch library settings
    const LibrarySettings = require("./librarysettings.model.js");
    LibrarySettings.init(schema);
    const settings = await LibrarySettings.getAllSettings();
    const maxBooksPerCard = parseInt(settings.max_books_per_card || 1);
    const durationDays = parseInt(settings.duration_days || 15);

    // Check how many books are currently issued to this user
    const activeIssuesQuery = `SELECT COUNT(*) as count FROM ${schema}.book_issues 
                               WHERE issued_to = $1 AND return_date IS NULL AND status = 'issued'`;
    const activeIssuesResult = await sql.query(activeIssuesQuery, [issued_to]);
    const activeIssuesCount = parseInt(activeIssuesResult.rows[0].count || 0);

    // Check if user has reached maximum books per card limit
    if (activeIssuesCount >= maxBooksPerCard) {
      throw new Error(`Maximum ${maxBooksPerCard} book(s) can be issued per user. User already has ${activeIssuesCount} book(s) issued.`);
    }

    // **NEW LOGIC: Check if user already got the SAME book today**
    const sameBookTodayQuery = `SELECT COUNT(*) as count FROM ${schema}.book_issues 
                                WHERE issued_to = $1 
                                AND book_id = $2 
                                AND DATE(issue_date) = CURRENT_DATE
                                AND return_date IS NULL 
                                AND status = 'issued'`;
    const sameBookTodayResult = await sql.query(sameBookTodayQuery, [issued_to, issueData.book_id]);
    const sameBookTodayCount = parseInt(sameBookTodayResult.rows[0].count || 0);

    if (sameBookTodayCount > 0) {
      throw new Error(`User can only get 1 copy of the same book per day. This book has already been issued to the user today.`);
    }

    // Calculate due date from settings
    const issueDate = issueData.issue_date || new Date().toISOString().split('T')[0];
    const issueDateObj = new Date(issueDate);
    issueDateObj.setDate(issueDateObj.getDate() + durationDays);
    const dueDate = issueData.due_date || issueDateObj.toISOString().split('T')[0];

    // Create issue record
    const issueQuery = `INSERT INTO ${schema}.book_issues 
                       (book_id, issued_to, issued_by, issue_date, due_date, status, createddate, lastmodifieddate, createdbyid, lastmodifiedbyid) 
                       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $7, $7) 
                       RETURNING *`;
    const issueValues = [
      issueData.book_id,
      issued_to,
      issueData.issued_by || issueData.issuedBy || userId || null,
      issueData.issue_date || new Date().toISOString().split('T')[0],
      dueDate,
      'issued',
      userId || null,
    ];
    const issueResult = await sql.query(issueQuery, issueValues);

    // Update book available copies
    await sql.query(`UPDATE ${schema}.books SET available_copies = available_copies - 1 WHERE id = $1`, [issueData.book_id]);

    // await sql.query("COMMIT");
    return issueResult.rows[0];
  } catch (error) {
    // await sql.query("ROLLBACK");
    console.error("Error in issueBook:", error);
    throw error;
  } finally {
    // sql.release();
  }
}

// Return a book (checkin)
async function returnBook(issueId, returnData, userId) {
  // const sql = await sql.connect();
  try {
    // await sql.query("BEGIN");

    // Get issue record
    const issueCheck = await sql.query(`SELECT * FROM ${schema}.book_issues WHERE id = $1`, [issueId]);
    if (issueCheck.rows.length === 0) {
      throw new Error("Issue record not found");
    }
    const issue = issueCheck.rows[0];

    if (issue.return_date) {
      throw new Error("Book already returned");
    }

    const returnDate = returnData.return_date || new Date().toISOString().split('T')[0];
    const status = returnData.status || 'returned';

    // Validate status
    const validStatuses = ['issued', 'returned', 'lost', 'damaged'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Update issue record
    const updateQuery = `UPDATE ${schema}.book_issues 
                        SET return_date = $2, status = $3, 
                            lastmodifieddate = CURRENT_TIMESTAMP, lastmodifiedbyid = $4
                        WHERE id = $1 
                        RETURNING *`;
    const updateResult = await sql.query(updateQuery, [
      issueId,
      returnDate,
      status,
      userId || null,
    ]);

    // Update book available copies only if status is 'returned'
    if (status === 'returned') {
      await sql.query(`UPDATE ${schema}.books SET available_copies = available_copies + 1 WHERE id = $1`, [issue.book_id]);
    }

    // await sql.query("COMMIT");
    return updateResult.rows[0];
  } catch (error) {
    // await sql.query("ROLLBACK");
    console.error("Error in returnBook:", error);
    throw error;
  } finally {
    // sql.release();
  }
}

// Calculate penalty for overdue book
async function calculatePenalty(issueId) {
  try {
    const issue = await findById(issueId);
    if (!issue || issue.return_date) {
      return { penalty: 0, daysOverdue: 0 };
    }

    const dueDate = new Date(issue.due_date);
    const today = new Date();
    const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));

    if (daysOverdue === 0) {
      return { penalty: 0, daysOverdue };
    }

    // Fetch library settings for fine calculation
    const LibrarySettings = require("./librarysettings.model.js");
    LibrarySettings.init(schema);
    const settings = await LibrarySettings.getAllSettings();
    const finePerDay = parseFloat(settings.fine_per_day || 10);

    // Calculate penalty based on fine_per_day setting
    const penalty = finePerDay * daysOverdue;

    return { penalty: Math.round(penalty * 100) / 100, daysOverdue };
  } catch (error) {
    console.error("Error calculating penalty:", error);
    throw error;
  }
}

// Delete book issue by ID
async function deleteById(id) {
  try {
    const query = `DELETE FROM ${schema}.book_issues WHERE id = $1 RETURNING *`;
    const result = await sql.query(query, [id]);
    if (result.rows.length > 0) {
      return { success: true, message: "Book issue deleted successfully" };
    }
    return { success: false, message: "Book issue not found" };
  } catch (error) {
    console.error("Error in deleteById:", error);
    throw error;
  }
}

module.exports = {
  init,
  findAll,
  findById,
  findActive,
  findByBookId,
  findByUserId,
  findByCardId,
  issueBook,
  returnBook,
  calculatePenalty,
  deleteById,
};

