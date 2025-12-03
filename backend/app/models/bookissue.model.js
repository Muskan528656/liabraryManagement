const sql = require("./db.js");
let schema = "";

function init(schema_name) {
  schema = schema_name;
}

async function findAll() {
  try {
    if (!schema) throw new Error("Schema not initialized. Call init() first.");

    const query = `SELECT 
                    bi.*,
                    b.title AS book_title,
                    b.isbn AS book_isbn,
                    lc.card_number,
                    lc.first_name || ' ' || lc.last_name AS member_name,
                    lc.id AS card_id,
                    issued_by_user.firstname || ' ' || issued_by_user.lastname AS issued_by_name
                   FROM ${schema}.book_issues bi
                   LEFT JOIN ${schema}.books b ON bi.book_id = b.id
                   LEFT JOIN ${schema}.library_members lc ON bi.issued_to = lc.id AND lc.is_active = true
                   LEFT JOIN ${schema}."user" issued_by_user ON bi.issued_by = issued_by_user.id
                   ORDER BY bi.createddate DESC`;

    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}

async function findById(id) {
  try {
    if (!schema) throw new Error("Schema not initialized. Call init() first.");

    const query = `SELECT 
                    bi.*,
                    b.title AS book_title,
                    b.isbn AS book_isbn,
                    lc.card_number,
                    lc.member_name,
                    lc.id AS card_id
                   FROM ${schema}.book_issues bi
                   LEFT JOIN ${schema}.books b ON bi.book_id = b.id
                   LEFT JOIN ${schema}.library_members lc ON bi.issued_to = lc.id AND lc.is_active = true
                   WHERE bi.id = $1`;

    const result = await sql.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error in findById:", error);
    throw error;
  }
}

async function findActive() {
  try {
    if (!schema) throw new Error("Schema not initialized. Call init() first.");

    const query = `SELECT 
                    bi.*,
                    b.title AS book_title,
                    b.isbn AS book_isbn,
                    lc.card_number,
                    lc.first_name,
                    lc.last_name,
                    lc.id AS card_id
                   FROM ${schema}.book_issues bi
                   LEFT JOIN ${schema}.books b ON bi.book_id = b.id
                   LEFT JOIN ${schema}.library_members lc ON bi.issued_to = lc.id AND lc.is_active = true
                   WHERE bi.return_date IS NULL AND bi.status = 'issued'
                   ORDER BY bi.issue_date DESC`;

    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findActive:", error);
    throw error;
  }
}


async function findByBookId(bookId) {
  try {
    if (!schema) throw new Error("Schema not initialized. Call init() first.");

    const query = `SELECT 
                    bi.*,
                    b.title AS book_title,
                    b.isbn AS book_isbn,
                    lc.card_number,
                    lc.first_name || ' ' || lc.last_name AS member_name,
                    lc.id AS card_id
                   FROM ${schema}.book_issues bi
                   LEFT JOIN ${schema}.books b ON bi.book_id = b.id
                   LEFT JOIN ${schema}.library_members lc ON bi.issued_to = lc.id AND lc.is_active = true
                   WHERE bi.book_id = $1 AND bi.return_date IS NULL AND bi.status = 'issued'`;

    const result = await sql.query(query, [bookId]);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findByBookId:", error);
    throw error;
  }
}

async function findByCardId(cardId) {
  try {
    if (!schema) throw new Error("Schema not initialized. Call init() first.");

    const query = `SELECT * FROM ${schema}.book_issues WHERE issued_to = $1 AND return_date IS NULL AND status = 'issued'`;
    const result = await sql.query(query, [cardId]);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findByCardId:", error);
    throw error;
  }
}






















































async function issueBook(issueData, userId) {
  const client = await sql.getClient();
  
  try {
    await client.query('BEGIN');

    // 1. Book availability check
    const bookCheck = await client.query(
      `SELECT id, title, isbn, available_copies, total_copies 
       FROM ${schema}.books 
       WHERE id = $1 AND is_active = true`,
      [issueData.book_id]
    );

    if (bookCheck.rows.length === 0) {
      throw new Error("Book not found or inactive");
    }

    const book = bookCheck.rows[0];
    
    // Available copies check
    if (book.available_copies <= 0) {
      throw new Error(`Book "${book.title}" is not available (no copies left)`);
    }

    // 2. Member/Library Card check
    let issued_to = issueData.issued_to || issueData.card_id;
    if (!issued_to) {
      throw new Error("Library card ID (issued_to) is required");
    }

    const memberCheck = await client.query(
      `SELECT id, card_number, first_name, last_name, allowed_books, is_active 
       FROM ${schema}.library_members 
       WHERE id = $1`,
      [issued_to]
    );

    if (memberCheck.rows.length === 0) {
      throw new Error("Library member not found");
    }

    const member = memberCheck.rows[0];
    
    if (!member.is_active) {
      throw new Error("Library member is inactive");
    }

    // 3. Duplicate issue check - same book to same member
    const duplicateCheck = await client.query(
      `SELECT id FROM ${schema}.book_issues
       WHERE issued_to = $1 AND book_id = $2 
       AND return_date IS NULL AND status = 'issued'`,
      [issued_to, issueData.book_id]
    );

    if (duplicateCheck.rows.length > 0) {
      throw new Error(`Book "${book.title}" is already issued to this member`);
    }

    // 4. Get library settings
    const settingsCheck = await client.query(
      `SELECT max_books_per_card, duration_days, fine_per_day 
       FROM ${schema}.library_settings 
       LIMIT 1`
    );
    
    const settings = settingsCheck.rows.length > 0 ? settingsCheck.rows[0] : {};
    const maxBooksPerCardFromSettings = parseInt(settings.max_books_per_card || 6);
    const durationDays = parseInt(settings.duration_days || 15);

    // 5. Check member's personal allowed books limit
    const memberAllowedBooks = member.allowed_books || maxBooksPerCardFromSettings;
    
    // Take the minimum between member's allowed books and system max
    const effectiveAllowedBooks = Math.min(memberAllowedBooks, maxBooksPerCardFromSettings);

    // 6. Active issues count for this member
    const activeIssuesResult = await client.query(
      `SELECT COUNT(*) as count FROM ${schema}.book_issues 
       WHERE issued_to = $1 AND return_date IS NULL AND status = 'issued'`,
      [issued_to]
    );

    const activeIssuesCount = parseInt(activeIssuesResult.rows[0].count || 0);

    // Check against effective allowed books
    if (activeIssuesCount >= effectiveAllowedBooks) {
      throw new Error(
        `Maximum ${effectiveAllowedBooks} books can be issued per card. ` +
        `This card already has ${activeIssuesCount} books issued. ` +
        `(Member limit: ${memberAllowedBooks}, System limit: ${maxBooksPerCardFromSettings})`
      );
    }

    // 7. Dates calculation
    const issueDate = issueData.issue_date || new Date().toISOString().split('T')[0];
    const dueDateObj = new Date(issueDate);
    dueDateObj.setDate(dueDateObj.getDate() + durationDays);
    const dueDate = issueData.due_date || dueDateObj.toISOString().split('T')[0];

    // 8. Insert issue record
    const issueQuery = `
      INSERT INTO ${schema}.book_issues 
      (book_id, issued_to, issued_by, issue_date, due_date, status, 
       createddate, lastmodifieddate, createdbyid, lastmodifiedbyid,
       condition_before, remarks) 
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $7, $7, $8, $9) 
      RETURNING *
    `;

    const issueValues = [
      issueData.book_id,
      issued_to,
      userId,
      issueDate,
      dueDate,
      'issued',
      userId,
      issueData.condition_before || 'Good',
      issueData.remarks || ''
    ];

    const issueResult = await client.query(issueQuery, issueValues);

    // 9. Update book available copies
    await client.query(
      `UPDATE ${schema}.books 
       SET available_copies = available_copies - 1,
           lastmodifieddate = CURRENT_TIMESTAMP,
           lastmodifiedbyid = $2
       WHERE id = $1`,
      [issueData.book_id, userId]
    );

    await client.query('COMMIT');
    
    // Return enriched data
    return {
      ...issueResult.rows[0],
      book_title: book.title,
      book_isbn: book.isbn,
      member_name: `${member.first_name} ${member.last_name}`,
      card_number: member.card_number,
      limits: {
        member_allowed: memberAllowedBooks,
        system_max: maxBooksPerCardFromSettings,
        effective_limit: effectiveAllowedBooks
      },
      currently_issued: activeIssuesCount + 1,
      remaining_allowed: effectiveAllowedBooks - (activeIssuesCount + 1)
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error in issueBook:", error);
    throw error;
  } finally {
    client.release();
  }
}
async function returnBook(issueId, returnData, userId) {
  try {
    const issueCheck = await sql.query(`SELECT * FROM ${schema}.book_issues WHERE id = $1`, [issueId]);
    if (issueCheck.rows.length === 0) throw new Error("Issue record not found");
    const issue = issueCheck.rows[0];
    if (issue.return_date) throw new Error("Book already returned");

    const returnDate = returnData.return_date || new Date().toISOString().split('T')[0];
    const status = returnData.status || 'returned';
    const validStatuses = ['issued', 'returned', 'lost', 'damaged'];
    if (!validStatuses.includes(status)) throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);

    const updateQuery = `UPDATE ${schema}.book_issues 
                        SET return_date = $2, status = $3, lastmodifieddate = CURRENT_TIMESTAMP, lastmodifiedbyid = $4
                        WHERE id = $1 RETURNING *`;
    const updateResult = await sql.query(updateQuery, [issueId, returnDate, status, null]);

    if (status === 'returned') {
      await sql.query(`UPDATE ${schema}.books SET available_copies = available_copies + 1 WHERE id = $1`, [issue.book_id]);
    }

    return updateResult.rows[0];
  } catch (error) {
    console.error("Error in returnBook:", error);
    throw error;
  }
}

async function calculatePenalty(issueId) {
  try {
    const issue = await findById(issueId);
    if (!issue || issue.return_date) return { penalty: 0, daysOverdue: 0 };

    const dueDate = new Date(issue.due_date);
    const today = new Date();
    const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
    if (daysOverdue === 0) return { penalty: 0, daysOverdue };

    const LibrarySettings = require("./librarysettings.model.js");
    LibrarySettings.init(schema);
    const settings = await LibrarySettings.getAllSettings();
    const finePerDay = parseFloat(settings.fine_per_day || 10);

    const penalty = finePerDay * daysOverdue;
    return { penalty: Math.round(penalty * 100) / 100, daysOverdue };
  } catch (error) {
    console.error("Error calculating penalty:", error);
    throw error;
  }
}

async function deleteById(id) {
  try {
    const result = await sql.query(`DELETE FROM ${schema}.book_issues WHERE id = $1 RETURNING *`, [id]);
    if (result.rows.length > 0) return { success: true, message: "Book issue deleted successfully" };
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
  findByCardId,
  issueBook,
  returnBook,
  calculatePenalty,
  deleteById,
};
