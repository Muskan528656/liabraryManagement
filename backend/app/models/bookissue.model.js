const sql = require("./db.js");
const Notification = require("./notification.model.js");
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
                    lm.card_number,
                    lm.first_name || ' ' || lm.last_name AS member_name,
                    lm.id AS card_id,
                    u.firstname || ' ' || u.lastname AS issued_by_name
                   FROM ${schema}.book_issues bi
                   LEFT JOIN ${schema}.books b ON bi.book_id = b.id
                   LEFT JOIN ${schema}.library_members lm ON bi.issued_to = lm.id AND lm.is_active = true
                   LEFT JOIN ${schema}."user" u ON bi.issued_by = u.id
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
                    lm.card_number,
                    lm.first_name || ' ' || lm.last_name AS member_name,
                    lm.id AS card_id
                   FROM ${schema}.book_issues bi
                   LEFT JOIN ${schema}.books b ON bi.book_id = b.id
                   LEFT JOIN ${schema}.library_members lm ON bi.issued_to = lm.id AND lm.is_active = true
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
                    lm.card_number,
                    lm.first_name || ' ' || lm.last_name AS member_name,
                    lm.id AS card_id
                   FROM ${schema}.book_issues bi
                   LEFT JOIN ${schema}.books b ON bi.book_id = b.id
                   LEFT JOIN ${schema}.library_members lm ON bi.issued_to = lm.id AND lm.is_active = true
                   WHERE bi.return_date IS NULL
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
                    lm.card_number,
                    lm.first_name || ' ' || lm.last_name AS member_name,
                    lm.id AS card_id
                   FROM ${schema}.book_issues bi
                   LEFT JOIN ${schema}.books b ON bi.book_id = b.id
                   LEFT JOIN ${schema}.library_members lm ON bi.issued_to = lm.id AND lm.is_active = true
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

    const query = `SELECT 
                    bi.*,
                    b.title AS book_title,
                    b.isbn AS book_isbn
                   FROM ${schema}.book_issues bi
                   LEFT JOIN ${schema}.books b ON bi.book_id = b.id
                   WHERE bi.issued_to = $1 AND bi.return_date IS NULL AND bi.status = 'issued'
                   ORDER BY bi.issue_date DESC`;

    const result = await sql.query(query, [cardId]);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findByCardId:", error);
    throw error;
  }
}
async function issueBook(req) {
 
  console.log("request =>",req.body);
  
  try {
    const tenantcode = req.headers.tenantcode || 'demo';
    schema = tenantcode;

    if (!req.body.card_id) {
      return { success: false, message: "Card ID is required" };
    }
    if (!req.body.book_id) {
      return { success: false, message: "Book ID is required" };
    }

 
    let userId = null;
    if (req.userinfo && req.userinfo.id) {
      userId = req.userinfo.id;
    } else if (req.user && req.user.id) {
      userId = req.user.id;
    } else if (req.headers['x-user-id']) {
      userId = req.headers['x-user-id'];
    } else if (req.auth && req.auth.userId) {
      userId = req.auth.userId;
    } else {
      console.warn("⚠️ No user ID found. Using default user ID 1");
      userId = 1;
    }

 
    const memberRes = await sql.query(
      `SELECT
        m.id AS member_id,
        m.user_id,
        m.card_number,
        m.plan_id,
        p.duration_days,
        p.allowed_books,
        p.max_allowed_books_at_time,
        p.is_active AS plan_active,
        m.first_name,
        m.last_name
       FROM ${schema}.library_members m
       LEFT JOIN ${schema}.plan p ON m.plan_id = p.id
       WHERE m.id = $1 AND m.is_active = true`,
      [req.body.card_id]
    );

    if (memberRes.rows.length === 0) {
      return { success: false, message: "Member not found or inactive" };
    }

    const member = memberRes.rows[0];
 
    console.log("membermember", member);

    if (!member.plan_id) {
      return { success: false, message: "No plan assigned to this member" };
    }

    if (!member.plan_active) {
      return { success: false, message: "Plan is not active" };
    }

    if (!member.allowed_books || member.allowed_books <= 0) {
      return { success: false, message: "This plan does not allow issuing books" };
    }

 
    let dailyLimit = member.max_allowed_books_at_time ? parseInt(member.max_allowed_books_at_time) : 2;
    if (isNaN(dailyLimit) || dailyLimit < 1) {
      dailyLimit = 2; // Default fallback
    }
 

    const issuedRes = await sql.query(
      `SELECT COUNT(*) AS total 
       FROM ${schema}.book_issues 
       WHERE issued_to = $1 AND return_date IS NULL AND status = 'issued'`,
      [req.body.card_id]
    );

    const alreadyIssued = Number(issuedRes.rows[0].total || 0);
 

    if (alreadyIssued >= member.allowed_books) {
      return {
        success: false,
        message: `Total book limit exceeded. You can issue maximum ${member.allowed_books} books total.`
      };
    }

 
 
    const today = new Date().toISOString().split('T')[0];
 

    const dailyIssuedRes = await sql.query(
      `SELECT COUNT(*) AS daily_total 
       FROM ${schema}.book_issues 
       WHERE issued_to = $1 
       AND issue_date = $2 
       AND status = 'issued'
       AND (return_date IS NULL OR return_date > $2)`,
      [req.body.card_id, today]
    );

    const issuedToday = Number(dailyIssuedRes.rows[0].daily_total || 0);
 

    if (issuedToday >= dailyLimit) {
      return {
        success: false,
        message: `Daily limit reached! You can issue maximum ${dailyLimit} books per day. Already issued ${issuedToday} today.`
      };
    }

 
    const bookRes = await sql.query(
      `SELECT * FROM ${schema}.books WHERE id = $1`,
      [req.body.book_id]
    );

    if (bookRes.rows.length === 0) {
      return { success: false, message: "Book not found" };
    }

    const book = bookRes.rows[0];
 
 
 

    if (!book.available_copies || book.available_copies <= 0) {
      return {
        success: false,
        message: "This book is not available. All copies are currently issued."
      };
    }

    if (book.available_copies > book.total_copies) {
      console.warn("Warning: available_copies is greater than total_copies. Resetting...");
      await sql.query(
        `UPDATE ${schema}.books SET available_copies = total_copies WHERE id = $1`,
        [req.body.book_id]
      );
      book.available_copies = book.total_copies;
    }

 
    const memberHasBookRes = await sql.query(
      `SELECT COUNT(*) as count FROM ${schema}.book_issues 
       WHERE book_id = $1 
       AND issued_to = $2 
       AND return_date IS NULL 
       AND status = 'issued'`,
      [req.body.book_id, req.body.card_id]
    );

    if (parseInt(memberHasBookRes.rows[0].count) > 0) {
      return {
        success: false,
        message: "This member already has this book issued. Cannot issue same book again."
      };
    }

 
    const issueDate = req.body.issue_date
      ? new Date(req.body.issue_date)
      : new Date();

    let dueDate;
    if (req.body.due_date) {
      dueDate = new Date(req.body.due_date);
    } else {
      dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + (member.duration_days || 14));
    }

 
 

 
    const issueData = {
      book_id: req.body.book_id,
      issued_to: req.body.card_id,
      issued_by: userId,
      issue_date: issueDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      status: 'issued',
      createdbyid: userId,
      lastmodifiedbyid: userId,
    };

 

 
    const columns = Object.keys(issueData);
    const values = Object.values(issueData);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const insertQuery = `
      INSERT INTO ${schema}.book_issues (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

 
    const insertRes = await sql.query(insertQuery, values);
    const newIssue = insertRes.rows[0];
 

 
    const updateBookQuery = `
      UPDATE ${schema}.books 
      SET 
        available_copies = available_copies - 1,
        lastmodifiedbyid = $2,
        lastmodifieddate = CURRENT_TIMESTAMP
      WHERE id = $1 
      AND available_copies > 0
      RETURNING available_copies, total_copies
    `;

    const updateBookRes = await sql.query(updateBookQuery, [
      req.body.book_id,
      userId
    ]);

    if (updateBookRes.rows.length === 0) {
      await sql.query(`DELETE FROM ${schema}.book_issues WHERE id = $1`, [newIssue.id]);
      return {
        success: false,
        message: "Failed to update book quantity. No available copies left. Issue record deleted."
      };
    }

    const updatedBook = updateBookRes.rows[0];
 

 
    try {
      const updateIssuedCountQuery = `
        UPDATE ${schema}.books 
        SET 
          issued_count = COALESCE(issued_count, 0) + 1,
          lastmodifiedbyid = $2,
          lastmodifieddate = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      await sql.query(updateIssuedCountQuery, [
        req.body.book_id,
        userId
      ]);
 
    } catch (err) {
      console.warn("Could not update issued count:", err.message);
    }

 
    try {
      const updateMemberQuery = `
        UPDATE ${schema}.library_members
        SET
          issued_books_count = COALESCE(issued_books_count, 0) + 1,
          last_issued_date = CURRENT_TIMESTAMP,
          lastmodifiedbyid = $2,
          lastmodifieddate = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      await sql.query(updateMemberQuery, [
        req.body.card_id,
        userId
      ]);

    } catch (err) {
      console.warn("Could not update member issued count:", err.message);
    }

/* =========================
   CREATE DUE REMINDER NOTIFICATION
========================= */
try {
  Notification.init(schema);

  // 📅 Tomorrow date (YYYY-MM-DD)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  // 📅 Due date from request
  const dueDateStr = new Date(req.body.due_date)
    .toISOString()
    .split("T")[0];

  console.log("🔔 Due Date Check:", { dueDateStr, tomorrowStr });

  // ✅ Create notification ONLY if due date is tomorrow
  if (userId && dueDateStr === tomorrowStr) {
    console.log("Creating due reminder notification...");

    // 🛑 Prevent duplicate notification for same book, same user, same day
    const existsRes = await sql.query(
      `
      SELECT id
      FROM ${schema}.notifications
      WHERE user_id = $1
      AND member_id = $2
        AND book_id = $3
        AND type = 'due_reminder'
        AND DATE(createddate) = CURRENT_DATE
      `,
      [userId, member.member_id, newIssue.book_id]
    );

    if (existsRes.rows.length === 0) {

      // // ✅ Insert & RETURN notification
      // const insertRes = await sql.query(
      //   `
      //   INSERT INTO ${schema}.notifications
      //   (
      //     user_id,
      //     member_id,
      //     book_id,
      //     message,
      //     is_read,
      //     type,
      //     createddate
      //   )
      //   VALUES ($1, $2, $3, $4, false, $5, NOW())
      //   RETURNING *
      //   `,
      //   [
      //     userId,
      //     member.member_id,
      //     newIssue.book_id,
      //     `Reminder: The book "${book.title}" is due for return tomorrow (${dueDateStr}). Please return it to avoid penalties.`,
      //     "due_reminder"
      //   ]
      // );


     let notification =  {
         "user_id": userId,
         "member_id": member.member_id,
         "book_id": newIssue.book_id,
         "message" : `Reminder: The book "${book.title}" is due for return tomorrow (${dueDateStr}). Please return it to avoid penalties.`,
          "type": "due_reminder"
        }

        console.log("notification=>",notification);
      Notification.create(notification);
    
      // const notification = insertRes.rows[0];

      // console.log("✅ Due reminder notification created and emitted:", notification.id);
    } else {
      console.log("⚠️ Due reminder already exists for today");
    }
  }

} catch (notifErr) {
  console.error("❌ Error creating due reminder notification:", notifErr);
}
    return {
      success: true,
      message: "Book issued successfully",
      data: {
        ...newIssue,
        member_id: member.member_id,
        user_id: userId,
        book_title: book.title,
        member_name: `${member.first_name} ${member.last_name}`,
        card_number: member.card_number,
        due_date: dueDate.toISOString().split('T')[0],
        book_details: {
          old_available_copies: book.available_copies,
          new_available_copies: updatedBook.available_copies,
          total_copies: updatedBook.total_copies
        },
        limits_info: {
          total_allowed: member.allowed_books,
          currently_issued: alreadyIssued + 1,
          daily_limit: dailyLimit,
          issued_today: issuedToday + 1,
          remaining_today: dailyLimit - (issuedToday + 1)
        }
      }
    };

  } catch (err) {
    console.error("❌ ERROR in issueBook:", err);
    return {
      success: false,
      message: "Error issuing book",
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
  }
}

async function returnBook(issueId, returnData, userId) {
  try {
    if (!schema) throw new Error("Schema not initialized. Call init() first.");


    const issueCheck = await sql.query(
      `SELECT bi.*, b.title as book_title
       FROM ${schema}.book_issues bi
       LEFT JOIN ${schema}.books b ON bi.book_id = b.id
       WHERE bi.id = $1`,
      [issueId]
    );

    if (issueCheck.rows.length === 0) {
      throw new Error("Issue record not found");
    }

    const issue = issueCheck.rows[0];

    if (issue.return_date) {
      throw new Error("Book already returned");
    }

    const returnDate = returnData.return_date || new Date().toISOString().split('T')[0];
    const status = returnData.status || 'returned';


    const validStatuses = ['returned', 'lost', 'damaged'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }


    const updateQuery = `
      UPDATE ${schema}.book_issues 
      SET return_date = $2, 
          status = $3, 
          lastmodifieddate = CURRENT_TIMESTAMP, 
          lastmodifiedbyid = $4
      WHERE id = $1 
      RETURNING *
    `;

    const updateResult = await sql.query(updateQuery, [
      issueId,
      returnDate,
      status,
      userId || 'system'
    ]);

    return updateResult.rows[0];
  } catch (error) {
    console.error("Error in returnBook:", error);
    throw error;
  }
}

async function calculatePenalty(issueId) {
  try {
    if (!schema) throw new Error("Schema not initialized. Call init() first.");

    const issue = await findById(issueId);
    if (!issue || issue.return_date) {
      return { penalty: 0, daysOverdue: 0 };
    }

    const dueDate = new Date(issue.due_date); // expiry_date नहीं, due_date है
    const today = new Date();
    const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));

    if (daysOverdue === 0) {
      return { penalty: 0, daysOverdue: 0 };
    }


    let finePerDay = 10; // Default

    try {
      const settingsRes = await sql.query(
        `SELECT fine_per_day FROM ${schema}.library_settings LIMIT 1`
      );

      if (settingsRes.rows.length > 0 && settingsRes.rows[0].fine_per_day) {
        finePerDay = parseFloat(settingsRes.rows[0].fine_per_day);
      }
    } catch (settingsError) {
 
    }

    const penalty = finePerDay * daysOverdue;
    return {
      penalty: Math.round(penalty * 100) / 100,
      daysOverdue,
      finePerDay,
      dueDate: dueDate.toISOString().split('T')[0]
    };
  } catch (error) {
    console.error("Error calculating penalty:", error);
    throw error;
  }
}

async function deleteById(id) {
  try {
    if (!schema) throw new Error("Schema not initialized. Call init() first.");


    const issueRes = await sql.query(
      `SELECT * FROM ${schema}.book_issues WHERE id = $1`,
      [id]
    );

    if (issueRes.rows.length === 0) {
      return { success: false, message: "Book issue not found" };
    }

    const issue = issueRes.rows[0];


    const deleteResult = await sql.query(
      `DELETE FROM ${schema}.book_issues WHERE id = $1 RETURNING *`,
      [id]
    );

    return {
      success: true,
      message: "Book issue deleted successfully",
      data: deleteResult.rows[0]
    };
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
        lm.allowed_books as personal_allowed,
        lm.subscription_id,
        s.allowed_books as subscription_allowed_books,
        s.is_active as subscription_active,
        s.start_date,
        s.end_date
      FROM ${schema}.library_members lm
      LEFT JOIN ${schema}.subscriptions s ON lm.subscription_id = s.id
      WHERE lm.id = $1 AND lm.is_active = true
    `;

    const result = await sql.query(query, [cardId]);

    if (result.rows.length === 0) {
      return null;
    }

    const member = result.rows[0];


    const activeIssuesRes = await sql.query(
      `SELECT COUNT(*) as count 
       FROM ${schema}.book_issues 
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


    const remainingFromSubscription = Math.max(0, subscriptionAllowed - subscriptionIssued);
    const remainingFromPersonal = Math.max(0, personalAllowed - personalIssued);
    const totalRemaining = remainingFromSubscription + remainingFromPersonal;


    const canIssueMore = totalRemaining > 0;
    const nextBookSource = canIssueMore
      ? (remainingFromSubscription > 0 ? 'subscription' : 'personal')
      : 'none';

    return {
      member: {
        id: member.id,
        card_number: member.card_number,
        name: `${member.first_name} ${member.last_name}`,
        has_active_subscription: hasActiveSubscription
      },
      allowances: {
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
          remaining: totalRemaining
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
      WHERE book_id = $1 AND return_date IS NULL AND status = 'issued'
    `;

    const result = await sql.query(query, [bookId]);
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
  getMemberAllowance,
  getIssuedCountByBookId,
};