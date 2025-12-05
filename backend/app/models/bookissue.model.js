
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
  try {
    console.log("=== issueBook function called ===");
    console.log("Issue Data:", issueData);
    console.log("User ID:", userId);


    const bookCheck = await sql.query(
      `SELECT id, title, isbn, available_copies, total_copies 
       FROM ${schema}.books 
       WHERE id = $1`,
      [issueData.book_id]
    );

    if (bookCheck.rows.length === 0) {
      throw new Error("Book not found or inactive");
    }

    const book = bookCheck.rows[0];
    console.log("Book found:", book.title);


    if (book.available_copies <= 0) {
      throw new Error(`Book "${book.title}" is not available (no copies left)`);
    }


    let issued_to = issueData.issued_to || issueData.card_id;
    if (!issued_to) {
      throw new Error("Library card ID (issued_to) is required");
    }


    console.log("Fetching member details for:", issued_to);
    const memberCheck = await sql.query(
      `SELECT 
        lm.id, 
        lm.card_number, 
        lm.first_name, 
        lm.last_name, 
        lm.allowed_books as personal_allowed,
        lm.subscription_id,
        lm.is_active,
        -- Subscription details
        s."plan_name" as subscription_name,
        s."allowed books" as subscription_allowed_books,
        s.is_active as subscription_active,
        s.start_date as subscription_start,
        s.end_date as subscription_end
       FROM ${schema}.library_members lm
       LEFT JOIN ${schema}.subscriptions s ON lm.subscription_id = s.id
       WHERE lm.id = $1`,
      [issued_to]
    );

    if (memberCheck.rows.length === 0) {
      throw new Error("Library member not found");
    }

    const member = memberCheck.rows[0];
    console.log("Member found:", member.first_name, member.last_name);

    if (!member.is_active) {
      throw new Error("Library member is inactive");
    }


    const duplicateCheck = await sql.query(
      `SELECT id FROM ${schema}.book_issues
       WHERE issued_to = $1 AND book_id = $2 
       AND return_date IS NULL AND status = 'issued'`,
      [issued_to, issueData.book_id]
    );

    if (duplicateCheck.rows.length > 0) {
      throw new Error(`Book "${book.title}" is already issued to this member`);
    }


    console.log("Calculating allowed books...");
    let totalAllowedBooks = 0;
    let subscriptionAllowedBooks = 0;
    let personalAllowedBooks = 0;
    let isSubscriptionActive = false;


    if (member.personal_allowed !== null && member.personal_allowed !== undefined && member.personal_allowed !== '') {
      personalAllowedBooks = parseInt(member.personal_allowed) || 0;
      console.log("Personal allowed books:", personalAllowedBooks);
    }


    if (member.subscription_id && member.subscription_active === true) {

      const currentDate = new Date();
      const startDate = member.subscription_start ? new Date(member.subscription_start) : null;
      const endDate = member.subscription_end ? new Date(member.subscription_end) : null;

      console.log("Subscription dates:", {
        start: startDate,
        end: endDate,
        current: currentDate
      });

      if (startDate && endDate && currentDate >= startDate && currentDate <= endDate) {
        isSubscriptionActive = true;
        subscriptionAllowedBooks = parseInt(member.subscription_allowed_books || 0);
        console.log("Subscription is ACTIVE. Allowed books:", subscriptionAllowedBooks);
      } else {
        console.log("Subscription exists but NOT active within date range");
      }
    } else {
      console.log("No subscription or subscription not active");
    }


    totalAllowedBooks = personalAllowedBooks + subscriptionAllowedBooks;


    if (totalAllowedBooks === 0) {
      totalAllowedBooks = 5;
      personalAllowedBooks = 5;
      console.log("No limits set, using default 5 books");
    }

    console.log("Final allowance calculation:", {
      personal: personalAllowedBooks,
      subscription: subscriptionAllowedBooks,
      subscription_active: isSubscriptionActive,
      total: totalAllowedBooks
    });


    const activeIssuesResult = await sql.query(
      `SELECT COUNT(*) as count FROM ${schema}.book_issues 
       WHERE issued_to = $1 AND return_date IS NULL AND status = 'issued'`,
      [issued_to]
    );

    const currentlyIssuedCount = parseInt(activeIssuesResult.rows[0].count || 0);
    const remainingAllowed = totalAllowedBooks - currentlyIssuedCount;

    console.log("Current issued count:", currentlyIssuedCount);
    console.log("Remaining allowed:", remainingAllowed);


    if (currentlyIssuedCount >= totalAllowedBooks) {
      throw new Error(
        `Member "${member.first_name} ${member.last_name}" has reached the maximum allowed books limit. ` +
        `Currently issued: ${currentlyIssuedCount}, Allowed: ${totalAllowedBooks} ` +
        `(Personal: ${personalAllowedBooks}, Subscription: ${subscriptionAllowedBooks})`
      );
    }


    const settingsCheck = await sql.query(
      `SELECT  fine_per_day FROM ${schema}.library_setting LIMIT 1`
    );

    let durationDays = 15;
    if (settingsCheck.rows.length > 0 && settingsCheck.rows[0].duration_days) {
      durationDays = parseInt(settingsCheck.rows[0].duration_days);
    }


    const issueDate = issueData.issue_date || new Date().toISOString().split('T')[0];
    const dueDateObj = new Date(issueDate);
    dueDateObj.setDate(dueDateObj.getDate() + durationDays);
    const dueDate = issueData.due_date || dueDateObj.toISOString().split('T')[0];

    console.log("Dates:", {
      issue_date: issueDate,
      due_date: dueDate,
      duration_days: durationDays
    });


    let allowanceSource = 'personal';
    let subscriptionIdForRecord = null;

    if (isSubscriptionActive) {

      const subscriptionIssuedRes = await sql.query(
        `SELECT COUNT(*) as sub_count 
         FROM ${schema}.book_issues bi
         WHERE bi.issued_to = $1 
           AND bi.return_date IS NULL 
           AND bi.status = 'issued'
     `,
        [issued_to]
      );

      const subscriptionIssuedCount = parseInt(subscriptionIssuedRes.rows[0].sub_count || 0);


      if (subscriptionIssuedCount < subscriptionAllowedBooks) {
        allowanceSource = 'subscription';
        subscriptionIdForRecord = member.subscription_id;
        console.log("Using subscription allowance. Subscription issued:", subscriptionIssuedCount);
      } else {
        console.log("Subscription allowance exhausted, using personal allowance");
      }
    } else {
      console.log("No active subscription, using personal allowance");
    }


    const issueQuery = `
      INSERT INTO ${schema}.book_issues 
      (book_id, issued_to, issued_by, issue_date, due_date, status, 
        createddate, lastmodifieddate, createdbyid, lastmodifiedbyid) 
      VALUES ($1, $2, $3, $4, $5, $6,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $7, $7) 
      RETURNING *
    `;

    const issueValues = [
      issueData.book_id,
      issued_to,
      userId,
      issueDate,
      dueDate,
      'issued',

      userId
    ];

    console.log("Inserting issue with values:", issueValues);
    const issueResult = await sql.query(issueQuery, issueValues);


    await sql.query(
      `UPDATE ${schema}.books 
       SET available_copies = available_copies - 1,
           lastmodifieddate = CURRENT_TIMESTAMP,
           lastmodifiedbyid = $2
       WHERE id = $1`,
      [issueData.book_id, userId]
    );


    const updatedActiveIssuesResult = await sql.query(
      `SELECT COUNT(*) as count FROM ${schema}.book_issues 
       WHERE issued_to = $1 AND return_date IS NULL AND status = 'issued'`,
      [issued_to]
    );

    const updatedIssuedCount = parseInt(updatedActiveIssuesResult.rows[0].count || 0);

    console.log("Book issued successfully. Updated count:", updatedIssuedCount);


    return {
      ...issueResult.rows[0],
      book_title: book.title,
      book_isbn: book.isbn,
      member_name: `${member.first_name} ${member.last_name}`,
      card_number: member.card_number,
      allowances: {
        personal_allowed: personalAllowedBooks,
        subscription_allowed: subscriptionAllowedBooks,
        subscription_active: isSubscriptionActive,
        subscription_name: member.subscription_name,
        total_allowed: totalAllowedBooks,
        currently_issued: updatedIssuedCount,
        remaining_allowed: totalAllowedBooks - updatedIssuedCount,
        this_issue_used: allowanceSource
      },
      breakdown: {
        before_this_issue: {
          total_issued: currentlyIssuedCount,
          remaining: remainingAllowed
        },
        after_this_issue: {
          total_issued: updatedIssuedCount,
          remaining: totalAllowedBooks - updatedIssuedCount
        }
      }
    };

  } catch (error) {
    console.error("Error in issueBook:", error);
    throw error;
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
    const updateResult = await sql.query(updateQuery, [issueId, returnDate, status, userId || null]);

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


async function getMemberAllowance(cardId) {
  try {
    if (!schema) throw new Error("Schema not initialized. Call init() first.");

    const query = `
      SELECT 
        lm.id, 
        lm.card_number, 
        lm.first_name, 
        lm.last_name,
        COALESCE(NULLIF(lm.allowed_books, ''), '0') as personal_allowed,
        lm.subscription_id,
        s."allowed books" as subscription_allowed_books,
        s.is_active as subscription_active,
        s.start_date,
        s.end_date,
        ls.max_books as system_max
      FROM ${schema}.library_members lm
      LEFT JOIN ${schema}.subscriptions s ON lm.subscription_id = s.id
      LEFT JOIN ${schema}.library_setting ls ON true
      WHERE lm.id = $1
    `;

    const result = await sql.query(query, [cardId]);

    if (result.rows.length === 0) {
      return null;
    }

    const member = result.rows[0];


    const activeIssuesRes = await sql.query(
      `SELECT COUNT(*) as count FROM ${schema}.book_issues 
       WHERE issued_to = $1 AND return_date IS NULL AND status = 'issued'`,
      [cardId]
    );

    const activeIssuesCount = parseInt(activeIssuesRes.rows[0].count || 0);


    let subscriptionAllowed = 0;
    let subscriptionIssued = 0;
    let hasActiveSubscription = false;

    if (member.subscription_id &&
      member.subscription_active === true &&
      member.subscription_allowed_books &&
      member.start_date && member.end_date) {

      const currentDate = new Date();
      const startDate = new Date(member.start_date);
      const endDate = new Date(member.end_date);

      if (currentDate >= startDate && currentDate <= endDate) {
        subscriptionAllowed = parseInt(member.subscription_allowed_books || 0);
        hasActiveSubscription = true;


        const subscriptionIssuedRes = await sql.query(
          `SELECT COUNT(*) as sub_count 
           FROM ${schema}.book_issues bi
           WHERE bi.issued_to = $1 
             AND bi.status = 'issued' 
             AND bi.return_date IS NULL
             AND bi.issue_date >= $2`,
          [cardId, member.start_date]
        );

        subscriptionIssued = parseInt(subscriptionIssuedRes.rows[0].sub_count || 0);
      }
    }

    const personalAllowed = parseInt(member.personal_allowed || 0);
    const personalIssued = activeIssuesCount - subscriptionIssued;
    const systemMax = parseInt(member.system_max || 6);


    let remainingFromSubscription = Math.max(0, subscriptionAllowed - subscriptionIssued);
    let remainingFromPersonal = Math.max(0, personalAllowed - personalIssued);


    let nextBookSource = 'none';
    let canIssueMore = false;

    if (hasActiveSubscription && remainingFromSubscription > 0) {
      nextBookSource = 'subscription';
      canIssueMore = true;
    } else if (remainingFromPersonal > 0) {
      nextBookSource = 'personal';
      canIssueMore = true;
    }

    return {
      member: {
        id: member.id,
        card_number: member.card_number,
        name: `${member.first_name} ${member.last_name}`,
        has_active_subscription: hasActiveSubscription
      },
      allowances: {
        system_max: systemMax,
        subscription: {
          allowed: subscriptionAllowed,
          used: subscriptionIssued,
          remaining: remainingFromSubscription,
          active: hasActiveSubscription,
          start_date: member.start_date,
          end_date: member.end_date
        },
        personal: {
          allowed: personalAllowed,
          used: personalIssued,
          remaining: remainingFromPersonal
        },
        total: {
          allowed: subscriptionAllowed + personalAllowed,
          used: activeIssuesCount,
          remaining: remainingFromSubscription + remainingFromPersonal
        }
      },
      status: {
        can_issue_more: canIssueMore,
        next_book_source: nextBookSource,
        currently_issued: activeIssuesCount
      }
    };
  } catch (error) {
    console.error("Error in getMemberAllowance:", error);
    throw error;
  }
}
async function getIssuedCountByBookId(bookId) {
  try {
    if (!schema) throw new Error("Schema not initialized. Call init() first.");


    const query = `
      SELECT COUNT(*) AS issued_count
      FROM ${schema}.book_issues
      WHERE book_id = $1 AND status = 'issued'
    `;

    const result = await sql.query(query, [bookId]);

    console.log("RRRRRRRRRRRRR", result)
    return parseInt(result.rows[0].issued_count) || 0;
  } catch (error) {
    console.error("Error in getIssuedCountByBookId:", error);
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
  getMemberAllowance,  // New function added
  getIssuedCountByBookId,
};