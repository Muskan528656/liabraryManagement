
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
const emailTracker = {
  due: {},
  overdue: {}
};

function init(schema_name) {
  schema = schema_name;
}



async function create(submissionData, userId) {
  if (!schema) throw new Error("Schema not initialized");
  if (!submissionData.issue_id) throw new Error("Issue ID required");

  const client = await sql.connect();

  try {
    await client.query('BEGIN');

    console.log("📝 Starting book submission for issue_id:", submissionData.issue_id);
    console.log("📦 Submission data:", submissionData);

    // Get issue details with book title and ISBN from demo.book_issues
    const issueRes = await client.query(
      `SELECT bi.*, b.title, b.isbn, b.available_copies
       FROM demo.book_issues bi
       LEFT JOIN demo.books b ON bi.book_id = b.id
       WHERE bi.id = $1`,
      [submissionData.issue_id]
    );

    if (!issueRes.rows.length) throw new Error("Issue not found");
    const issue = issueRes.rows[0];
    console.log("✅ Issue found:", issue.id, "Book:", issue.title);

    if (issue.return_date) throw new Error("Book already returned");

    // Get library member details from demo.library_members
    const memberRes = await client.query(
      `SELECT * FROM demo.library_members 
       WHERE id = $1 AND is_active = true`,
      [issue.issued_to]
    );

    if (!memberRes.rows.length) throw new Error("Library member not found");
    const member = memberRes.rows[0];
    console.log("✅ Member found:", member.id, "Name:", member.first_name, member.last_name);

    // Get library settings from demo.library_setting
    const settingRes = await client.query(
      `SELECT * FROM demo.library_setting LIMIT 1`
    );

    let finePerDay = 5;
    if (settingRes.rows.length > 0) {
      finePerDay = Number(settingRes.rows[0].fine_per_day) || 5;
    }
    console.log("💰 Fine per day:", finePerDay);

    // Calculate days overdue
    const today = new Date();
    const dueDate = new Date(issue.due_date);
    const daysOverdue = Math.max(Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24)), 0);
    console.log("📅 Days overdue:", daysOverdue);

    // Parse condition from submission data
    const conditionBefore = submissionData.condition_before || "Good";
    const conditionAfter = submissionData.condition_after || "Good";
    const conditionAfterLower = conditionAfter.toLowerCase();
    console.log("📊 Condition - Before:", conditionBefore, "After:", conditionAfter);

    // Fetch LATEST book purchase price from demo.purchases table
    let bookPurchasePrice = 0;
    let purchaseDetails = null;

    if (conditionAfterLower === "lost" || conditionAfterLower === "damaged") {
      try {
        console.log("🔍 Fetching purchase price for book_id:", issue.book_id);

        const purchaseRes = await client.query(
          `SELECT unit_price, purchase_date, quantity, total_amount
           FROM demo.purchases 
           WHERE book_id = $1 
           ORDER BY purchase_date DESC, createddate DESC 
           LIMIT 1`,
          [issue.book_id]
        );

        if (purchaseRes.rows.length > 0) {
          purchaseDetails = purchaseRes.rows[0];
          bookPurchasePrice = purchaseDetails.unit_price || 0;
          console.log("✅ Purchase price found:", bookPurchasePrice);
        } else {
          bookPurchasePrice = submissionData.book_price ||
            submissionData.lost_book_price ||
            0;
          console.log("⚠️ No purchase record, using frontend price:", bookPurchasePrice);
        }
      } catch (error) {
        console.error("❌ Error fetching purchase price:", error);
        bookPurchasePrice = submissionData.book_price ||
          submissionData.lost_book_price ||
          0;
      }
    }

    // Calculate penalties
    let totalPenalty = 0;
    let penaltyType = "none";
    let latePenalty = 0;
    let damageLostPenalty = 0;

    // 1. Late return penalty (if overdue)
    if (daysOverdue > 0) {
      latePenalty = daysOverdue * finePerDay;
      totalPenalty += latePenalty;
      penaltyType = "late";
      console.log("⏰ Late penalty:", latePenalty, "for", daysOverdue, "days");
    }

    // 2. Damage/Lost penalty based on LATEST purchase price
    if (conditionAfterLower === "lost") {
      damageLostPenalty = bookPurchasePrice;
      totalPenalty += damageLostPenalty;
      penaltyType = "lost";
      console.log("💔 Lost penalty:", damageLostPenalty, "based on price:", bookPurchasePrice);
    } else if (conditionAfterLower === "damaged") {
      damageLostPenalty = bookPurchasePrice * 0.5;
      totalPenalty += damageLostPenalty;
      penaltyType = "damaged";
      console.log("🔧 Damage penalty:", damageLostPenalty, "based on price:", bookPurchasePrice);
    }

    console.log("💰 Total penalty:", totalPenalty, "Type:", penaltyType);

    // Insert book submission record into demo.book_submissions
    const submissionRes = await client.query(
      `INSERT INTO demo.book_submissions
        (issue_id, book_id, submitted_by, submit_date,
         condition_before, condition_after, remarks,
         days_overdue, penalty, createddate, createdbyid)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CURRENT_TIMESTAMP,$3)
       RETURNING *`,
      [
        issue.id,
        issue.book_id,
        userId,
        submissionData.submit_date ? new Date(submissionData.submit_date) : new Date(),
        conditionBefore,
        conditionAfter,
        submissionData.remarks || "",
        daysOverdue,
        totalPenalty
      ]
    );

    const submission = submissionRes.rows[0];
    console.log("✅ Book submission created with ID:", submission.id);

    // Update book available copies (only if not lost)
    if (conditionAfterLower !== "lost") {
      await client.query(
        `UPDATE demo.books
         SET available_copies = COALESCE(available_copies, 0) + 1,
             lastmodifieddate = CURRENT_TIMESTAMP,
             lastmodifiedbyid = $2
         WHERE id = $1`,
        [issue.book_id, userId]
      );
      console.log("📚 Available copies increased for book:", issue.book_id);
    } else {
      console.log("⚠️ Book is LOST - available copies NOT increased");
    }

    // Handle company ID
    let companyId = null;
    if (submissionData.company_id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(submissionData.company_id)) {
        companyId = submissionData.company_id;
      }
    }

    // Insert into penalty_master if any penalty exists
    let penaltyMasterId = null;
    if (totalPenalty > 0) {
      try {
        console.log("📝 Inserting into penalty_master with penalty:", totalPenalty);

        const penaltyInsertResult = await client.query(
          `INSERT INTO demo.penalty_master
           (company_id, penalty_type, book_id, issue_id,
            book_title, isbn, issued_to, card_number,
            issue_date, due_date,
            condition_before, condition_after,
            book_amount, per_day_amount,
            createddate, createdbyid, is_paid)
           VALUES
           ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,CURRENT_TIMESTAMP,$15,false)
           RETURNING id`,
          [
            companyId,
            penaltyType,
            issue.book_id,
            issue.id,
            issue.title,
            issue.isbn,
            member.id,
            member.card_number || null,
            issue.issue_date,
            issue.due_date,
            conditionBefore,
            conditionAfter,
            totalPenalty,
            finePerDay,
            userId
          ]
        );

        penaltyMasterId = penaltyInsertResult.rows[0]?.id;
        console.log("✅ Penalty master record created with ID:", penaltyMasterId);
      } catch (error) {
        console.error("❌ Error inserting into penalty_master:", error);
        console.error("Error details:", error.message);
        console.error("SQL State:", error.code);
        // Don't throw error, continue with submission
      }
    } else {
      console.log("✅ No penalty to insert into penalty_master");
    }

    // Update book issue status in demo.book_issues
    let issueStatus = 'returned';
    if (conditionAfterLower === 'lost') {
      issueStatus = 'lost';
    } else if (conditionAfterLower === 'damaged') {
      issueStatus = 'damaged';
    }

    await client.query(
      `UPDATE demo.book_issues
       SET return_date = CURRENT_DATE, 
           status = $3,
           lastmodifieddate = CURRENT_TIMESTAMP,
           lastmodifiedbyid = $2
       WHERE id = $1`,
      [issue.id, userId, issueStatus]
    );

    console.log("✅ Book issue marked as", issueStatus, "ID:", issue.id);

    await client.query('COMMIT');
    console.log("🎉 Transaction completed successfully");

    // Prepare response
    return {
      success: true,
      message: "Book submitted successfully",
      data: {
        submission_id: submission.id,
        totalPenalty: totalPenalty,
        penaltyType: penaltyType,
        daysOverdue: daysOverdue,
        bookPurchasePrice: bookPurchasePrice,
        latePenalty: latePenalty,
        damageLostPenalty: damageLostPenalty,
        member_details: {
          id: member.id,
          name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.name || 'N/A',
          email: member.email || 'N/A',
          card_number: member.card_number || 'N/A'
        },
        book_details: {
          id: issue.book_id,
          title: issue.title || 'N/A',
          isbn: issue.isbn || 'N/A'
        },
        issue_details: {
          id: issue.id,
          issue_date: issue.issue_date,
          due_date: issue.due_date,
          return_date: new Date().toISOString().split('T')[0],
          status: issueStatus
        },
        submission_details: {
          submit_date: submission.submit_date,
          condition_before: conditionBefore,
          condition_after: conditionAfter,
          remarks: submissionData.remarks || ""
        },
        purchase_details: purchaseDetails ? {
          unit_price: purchaseDetails.unit_price,
          purchase_date: purchaseDetails.purchase_date,
          quantity: purchaseDetails.quantity,
          total_amount: purchaseDetails.total_amount
        } : null,
        penalty_details: {
          penalty_master_id: penaltyMasterId,
          fine_per_day: finePerDay,
          total_penalty: totalPenalty
        }
      }
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("💥 Book submission failed:", error);
    console.error("Error stack:", error.stack);

    if (error.message.includes("foreign key constraint")) {
      throw new Error("Database constraint error. Please check if all related records exist.");
    } else if (error.message.includes("connection")) {
      throw new Error("Database connection error. Please try again.");
    }

    throw error;
  } finally {
    client.release();
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
                    lm.first_name || ' ' || lm.last_name AS student_name,
                    lm.email AS student_email,
                    lm.card_number
                   FROM ${schema}.book_submissions bs
                   LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
                   LEFT JOIN ${schema}.books b ON bs.book_id = b.id
                   LEFT JOIN ${schema}.library_members lm ON bi.issued_to = lm.id
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
                    lm.first_name || ' ' || lm.last_name AS student_name,
                    lm.email AS student_email,
                    lm.card_number
                   FROM ${schema}.book_submissions bs
                   LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
                   LEFT JOIN ${schema}.books b ON bs.book_id = b.id
                   LEFT JOIN ${schema}.library_members lm ON bi.issued_to = lm.id
                   ORDER BY bs.createddate DESC`;
    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}
async function cancelIssue(issueId, userId, reason = "Cancelled by librarian") {
  if (!schema) throw new Error("Schema not initialized");

  const client = await sql.connect();

  try {
    await client.query('BEGIN');

    console.log("🔄 Cancelling issue:", issueId);

    // पहले issue की जाँच करें
    const issueRes = await client.query(
      `SELECT * FROM demo.book_issues WHERE id = $1`,
      [issueId]
    );

    if (!issueRes.rows.length) {
      throw new Error("Issue not found");
    }

    const issue = issueRes.rows[0];

    // Check current status
    if (issue.status && issue.status !== 'issued') {
      throw new Error(`Cannot cancel issue with status: ${issue.status}`);
    }

    // TRY-CATCH के साथ पहले 'cancelled' का प्रयास करें
    let statusUpdated = false;
    let finalStatus = 'cancelled';

    try {
      // पहले 'cancelled' status के साथ try करें
      await client.query(
        `UPDATE demo.book_issues 
         SET status = 'cancelled',
             return_date = CURRENT_TIMESTAMP,
             lastmodifieddate = CURRENT_TIMESTAMP,
             lastmodifiedbyid = $1,
             remarks = COALESCE(remarks || ' ', '') || 'Cancelled: ' || $2
         WHERE id = $3`,
        [userId, reason, issueId]
      );
      statusUpdated = true;

    } catch (statusError) {
      // अगर 'cancelled' काम नहीं करता तो 'returned' का प्रयोग करें
      console.log("⚠️ 'cancelled' status not allowed, trying 'returned'");

      await client.query(
        `UPDATE demo.book_issues 
         SET status = 'returned',
             return_date = CURRENT_TIMESTAMP,
             lastmodifieddate = CURRENT_TIMESTAMP,
             lastmodifiedbyid = $1,
             remarks = COALESCE(remarks || ' ', '') || 'Cancelled: ' || $2
         WHERE id = $3`,
        [userId, reason, issueId]
      );
      finalStatus = 'returned';
      statusUpdated = true;
    }

    if (!statusUpdated) {
      throw new Error("Failed to update issue status");
    }

    // books टेबल में available copies बढ़ाएं
    await client.query(
      `UPDATE demo.books
       SET available_copies = COALESCE(available_copies, 0) + 1,
           lastmodifieddate = CURRENT_TIMESTAMP,
           lastmodifiedbyid = $2
       WHERE id = $1`,
      [issue.book_id, userId]
    );

    // Book submission record create करें
    await client.query(
      `INSERT INTO demo.book_submissions
        (issue_id, book_id, submitted_by, submit_date,
         condition_before, condition_after, remarks,
         days_overdue, penalty, createddate, createdbyid)
       VALUES ($1,$2,$3,CURRENT_TIMESTAMP,$4,$5,$6,0,0,CURRENT_TIMESTAMP,$3)`,
      [
        issueId,
        issue.book_id,
        userId,
        issue.condition_before || 'Good',
        finalStatus,  // condition_after में status डालें
        `Issue ${finalStatus}: ${reason}`,
      ]
    );

    await client.query('COMMIT');
    console.log(`✅ Issue ${finalStatus} successfully:`, issueId);

    return {
      success: true,
      message: `Issue ${finalStatus} successfully`,
      data: {
        issue_id: issueId,
        book_id: issue.book_id,
        status: finalStatus,
        cancelled_at: new Date().toISOString(),
        cancelled_by: userId
      }
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Error cancelling issue:", error);
    throw error;
  } finally {
    client.release();
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
                    lm.first_name || ' ' || lm.last_name AS student_name,
                    lm.email AS student_email,
                    lm.card_number
                   FROM ${schema}.book_submissions bs
                   LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
                   LEFT JOIN ${schema}.books b ON bs.book_id = b.id
                   LEFT JOIN ${schema}.library_members lm ON bi.issued_to = lm.id
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
                    lm.first_name || ' ' || lm.last_name AS student_name,
                    lm.email AS student_email,
                    lm.card_number
                   FROM ${schema}.book_submissions bs
                   LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
                   LEFT JOIN ${schema}.books b ON bs.book_id = b.id
                   LEFT JOIN ${schema}.library_members lm ON bi.issued_to = lm.id
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
                    lm.first_name || ' ' || lm.last_name AS student_name,
                    lm.email AS student_email,
                    lm.card_number
                   FROM ${schema}.book_submissions bs
                   LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
                   LEFT JOIN ${schema}.books b ON bs.book_id = b.id
                   LEFT JOIN ${schema}.library_members lm ON bi.issued_to = lm.id
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
                    lm.first_name || ' ' || lm.last_name AS student_name,
                    lm.email AS student_email,
                    lm.card_number
                   FROM ${schema}.book_submissions bs
                   LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
                   LEFT JOIN ${schema}.books b ON bs.book_id = b.id
                   LEFT JOIN ${schema}.library_members lm ON bi.issued_to = lm.id
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
                    lm.first_name || ' ' || lm.last_name AS student_name,
                    lm.email AS student_email,
                    lm.card_number
                   FROM demo.book_issues bi
                   LEFT JOIN demo.books b ON bi.book_id = b.id
                   LEFT JOIN demo.library_members lm ON bi.issued_to = lm.id
                   WHERE lm.is_active = true
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
          message: `Your book is due tomorrow. Please return "${book.book_title}" to avoid penalties.`,
          student_name: book.student_name,
          student_email: book.student_email,
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
}

async function getSubmitCountByBookId(bookId) {
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

// Helper function to check if email already sent today
function hasEmailBeenSent(type, key) {
  const today = new Date().toISOString().split('T')[0];
  const trackerKey = `${key}_${today}`;

  if (type === 'due' && emailTracker.due[trackerKey]) {
    return true;
  }
  if (type === 'overdue' && emailTracker.overdue[trackerKey]) {
    return true;
  }

  // Mark as sent
  if (type === 'due') {
    emailTracker.due[trackerKey] = true;
  } else {
    emailTracker.overdue[trackerKey] = true;
  }

  return false;
}

// Cleanup old tracker entries (older than 1 day)
function cleanupEmailTracker() {
  const today = new Date().toISOString().split('T')[0];

  // Clean due tracker
  Object.keys(emailTracker.due).forEach(key => {
    const keyDate = key.split('_').pop();
    if (keyDate !== today) {
      delete emailTracker.due[key];
    }
  });

  // Clean overdue tracker
  Object.keys(emailTracker.overdue).forEach(key => {
    const keyDate = key.split('_').pop();
    if (keyDate !== today) {
      delete emailTracker.overdue[key];
    }
  });
}

async function sendDueReminder() {
  try {
    console.log("🚀 Starting due reminder process...");

    // Cleanup old tracker entries
    cleanupEmailTracker();

    // Get tomorrow's date properly
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Format for database query (YYYY-MM-DD)
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const todayDateStr = today.toISOString().split('T')[0];

    console.log(`📅 Looking for books due on: ${tomorrowStr}`);
    console.log(`Today: ${todayDateStr}`);

    // Query using library_members table
    const query = `
      SELECT 
        bi.id,
        bi.book_id,
        bi.issued_to,
        bi.due_date,
        b.title AS book_title,
        lm.email AS student_email,
        CONCAT(lm.first_name, ' ', lm.last_name) AS student_name,
        lm.card_number
      FROM demo.book_issues bi
      INNER JOIN demo.books b ON bi.book_id = b.id
      INNER JOIN demo.library_members lm ON bi.issued_to = lm.id
      WHERE DATE(bi.due_date) = $1 
        AND bi.return_date IS NULL
        AND bi.status IN ('issued', 'active', NULL)
        AND lm.is_active = true
      ORDER BY lm.email, bi.due_date
    `;

    console.log("🔍 Executing query for due books...");
    const result = await sql.query(query, [tomorrowStr]);
    console.log(`📚 Found ${result.rows.length} due books for tomorrow`);

    if (result.rows.length === 0) {
      console.log("✅ No books due tomorrow.");
      return;
    }

    // Group books by library member
    const groupedByMember = {};

    for (const book of result.rows) {
      const memberId = book.issued_to;

      if (!groupedByMember[memberId]) {
        groupedByMember[memberId] = {
          email: book.student_email,
          name: book.student_name,
          card_number: book.card_number,
          books: []
        };
      }

      groupedByMember[memberId].books.push({
        name: book.book_title,
        dueDate: book.due_date
      });
    }

    console.log(`👥 Found ${Object.keys(groupedByMember).length} library members with due books`);

    // Send emails
    let emailsSent = 0;
    let emailsFailed = 0;
    let emailsSkipped = 0;

    for (const memberId in groupedByMember) {
      const member = groupedByMember[memberId];

      // Check if email already sent today
      if (hasEmailBeenSent('due', memberId)) {
        console.log(`⏭️ Skipping due reminder for ${member.name} - already sent today`);
        emailsSkipped++;
        continue;
      }

      // Check if email exists
      if (!member.email) {
        console.warn(`⚠️ No email found for library member ID: ${memberId} (${member.name})`);
        emailsFailed++;
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(member.email)) {
        console.warn(`⚠️ Invalid email format for ${member.name}: ${member.email}`);
        emailsFailed++;
        continue;
      }

      try {
        console.log(`📧 Preparing due email for: ${member.name} (${member.email})`);
        console.log(`   Books due: ${member.books.length}`);
        console.log(`   Card Number: ${member.card_number || 'N/A'}`);

        // Create HTML content for email
        const html = dueTemplate({
          studentName: member.name,
          books: member.books,
          dueDate: tomorrowStr,
          cardNumber: member.card_number
        });

        // Send email
        await sendMail({
          to: member.email,
          subject: `📚 Library Reminder: ${member.books.length} Book(s) Due Tomorrow`,
          html: html,
          text: `Dear ${member.name},\n\nYou have ${member.books.length} book(s) due tomorrow:\n\n${member.books.map(book => `• ${book.name}`).join('\n')
            }\n\nDue Date: ${tomorrowStr}\nCard Number: ${member.card_number || 'N/A'}\n\nPlease return or renew them on time.\n\nLibrary Management System`
        });

        console.log(`✅ Due email sent to: ${member.email}`);
        emailsSent++;

        // Add small delay to avoid overwhelming email service
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Failed to send email to ${member.email}:`, error.message);
        emailsFailed++;
      }
    }

    // Final report
    console.log("\n📊 DUE REMINDER REPORT =====================");
    console.log(`Total library members found: ${Object.keys(groupedByMember).length}`);
    console.log(`New emails sent: ${emailsSent}`);
    console.log(`Already sent today: ${emailsSkipped}`);
    console.log(`Emails failed: ${emailsFailed}`);
    console.log(`Total books processed: ${result.rows.length}`);
    console.log("==========================================\n");

  } catch (error) {
    console.error("💥 CRITICAL ERROR in sendDueReminder:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack?.split('\n')[0],
      timestamp: new Date().toISOString()
    });
  }
}

async function sendOverdueReminder() {
  try {
    console.log("🚨 Starting overdue reminder process...");

    // Cleanup old tracker entries
    cleanupEmailTracker();

    // Get today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    console.log(`📅 Today's date: ${todayStr}`);

    // Get penalty amount
    let penaltyPerDay = 0;
    try {
      const penaltyQuery = `
        SELECT per_day_amount 
        FROM demo.penalty_master 
        WHERE penalty_type = 'late' 
          AND is_active = true
        LIMIT 1
      `;
      const penaltyResult = await sql.query(penaltyQuery);

      if (penaltyResult.rows.length > 0) {
        penaltyPerDay = parseFloat(penaltyResult.rows[0].per_day_amount) || 0;
      }
      console.log(`💰 Penalty per day: ₹${penaltyPerDay}`);
    } catch (penaltyError) {
      console.warn("⚠️ Could not fetch penalty settings, using 0");
    }

    // Query for overdue books using library_members - SYNTAX CORRECTED
    const query = `
      SELECT 
        bi.id,
        bi.book_id,
        bi.issued_to,
        bi.due_date,
        bi.issue_date,
        b.title AS book_title,
        lm.email AS student_email,
        CONCAT(lm.first_name, ' ', lm.last_name) AS student_name,
        lm.card_number
      FROM demo.book_issues bi
      INNER JOIN demo.books b ON bi.book_id = b.id
      INNER JOIN demo.library_members lm ON bi.issued_to = lm.id
      WHERE DATE(bi.due_date) < $1 
        AND bi.return_date IS NULL
        AND bi.status IN ('issued', 'active', NULL)
        AND lm.is_active = true
      ORDER BY bi.due_date, lm.email
    `;

    console.log("🔍 Executing query for overdue books...");
    const result = await sql.query(query, [todayStr]);
    console.log(`📚 Found ${result.rows.length} overdue books`);

    if (result.rows.length === 0) {
      console.log("✅ No overdue books found.");
      return;
    }

    // Process each overdue book
    let emailsSent = 0;
    let emailsFailed = 0;
    let emailsSkipped = 0;

    for (const book of result.rows) {
      if (!book.student_email) {
        console.warn(`⚠️ No email for library member ID ${book.issued_to}: ${book.student_name}`);
        emailsFailed++;
        continue;
      }

      // Check if email already sent today for this book
      const trackerKey = `${book.issued_to}_${book.id}`;
      if (hasEmailBeenSent('overdue', trackerKey)) {
        console.log(`⏭️ Skipping overdue reminder for ${book.student_name} - book "${book.book_title}" already notified today`);
        emailsSkipped++;
        continue;
      }

      // Calculate overdue days and penalty
      const dueDate = new Date(book.due_date);
      const timeDiff = today.getTime() - dueDate.getTime();
      const overdueDays = Math.max(0, Math.floor(timeDiff / (1000 * 3600 * 24)));
      const penaltyAmount = penaltyPerDay * overdueDays;

      console.log(`\n📕 Processing: ${book.book_title}`);
      console.log(`   Library Member: ${book.student_name} (${book.student_email})`);
      console.log(`   Card Number: ${book.card_number || 'N/A'}`);
      console.log(`   Due Date: ${book.due_date}`);
      console.log(`   Overdue Days: ${overdueDays}`);
      console.log(`   Penalty: ₹${penaltyAmount}`);

      try {
        // Create HTML content for overdue email
        const html = overdueTemplate({
          studentName: book.student_name,
          bookName: book.book_title,
          dueDate: book.due_date,
          issueDate: book.issue_date,
          overdueDays: overdueDays,
          penaltyAmount: penaltyAmount,
          perDayAmount: penaltyPerDay,
          cardNumber: book.card_number
        });

        // Send email
        await sendMail({
          to: book.student_email,
          subject: `⏰ URGENT: Overdue Book "${book.book_title}"`,
          html: html,
          text: `Dear ${book.student_name},\n\nIMPORTANT: Your book "${book.book_title}" is overdue!\n\n` +
            `Card Number: ${book.card_number || 'N/A'}\n` +
            `Due Date: ${book.due_date}\n` +
            `Days Overdue: ${overdueDays}\n` +
            `Penalty Amount: ₹${penaltyAmount}\n\n` +
            `Please return the book immediately to avoid additional charges.\n\n` +
            `Library Management System`
        });

        console.log(`✅ Overdue reminder sent to: ${book.student_email}`);
        emailsSent++;

        // Add delay between emails
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Failed to send overdue email to ${book.student_email}:`, error.message);
        emailsFailed++;
      }
    }

    // Final report
    console.log("\n📊 OVERDUE REMINDER REPORT =================");
    console.log(`Total overdue books found: ${result.rows.length}`);
    console.log(`New emails sent: ${emailsSent}`);
    console.log(`Already sent today: ${emailsSkipped}`);
    console.log(`Emails failed: ${emailsFailed}`);
    console.log("==========================================\n");

  } catch (error) {
    console.error("💥 CRITICAL ERROR in sendOverdueReminder:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack?.split('\n')[0],
      timestamp: new Date().toISOString()
    });
  }
}

// Helper function to run both reminders
async function sendAllReminders() {
  console.log("🔄 ===== STARTING ALL LIBRARY REMINDERS =====\n");

  const startTime = Date.now();

  try {
    // Run due reminders
    await sendDueReminder();

    console.log("\n---\n");

    // Run overdue reminders
    await sendOverdueReminder();

  } catch (error) {
    console.error("💥 ERROR in sendAllReminders:", error);
  } finally {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`\n✅ All reminders completed in ${duration.toFixed(2)} seconds`);
    console.log("===== END LIBRARY REMINDERS =====\n");
  }
}

async function getPenaltyMasters() {
  try {
    const query = `
      SELECT * FROM ${schema}.penalty_master 
      WHERE is_active = true
      ORDER BY penalty_type
    `;
    const result = await sql.query(query);

    return {
      success: true,
      data: result.rows
    };
  } catch (error) {
    console.error("Error fetching penalty masters:", error);
    throw error;
  }
}

async function calculatePenalty(issue, conditionAfter, bookAmount) {
  // Default penalty
  let totalPenalty = 0;
  let penaltyType = null;
  const penalties = [];

  // Fetch active penalty master settings
  const penaltyRes = await sql.query(
    `SELECT * FROM ${schema}.penalty_master WHERE is_active = true`
  );
  const masters = {};
  penaltyRes.rows.forEach(p => {
    masters[p.penalty_type.toLowerCase()] = p;
  });

  const today = new Date();
  const dueDate = new Date(issue.due_date);
  const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));

  // ✅ 1. Lost Book
  if (conditionAfter?.toLowerCase() === "lost") {
    penaltyType = "lost";
    const amount = bookAmount > 0 ? bookAmount : (issue.price || 500);
    totalPenalty += amount;
    penalties.push({ type: "LOST", amount, description: "Book lost" });
  }

  // ✅ 2. Damaged Book
  if (conditionAfter?.toLowerCase() === "damaged" && masters['damage']) {
    penaltyType = "damage";
    const damageAmount = masters['damage'].fixed_amount || (bookAmount * 0.1) || 0;
    totalPenalty += damageAmount;
    penalties.push({ type: "DAMAGE", amount: damageAmount, description: "Book damaged" });
  }

  // ✅ 3. Late return
  if (daysOverdue > 0 && masters['late']) {
    penaltyType = "late";
    const perDayAmount = masters['late'].per_day_amount || 0;
    const lateAmount = perDayAmount * daysOverdue;
    totalPenalty += lateAmount;
    penalties.push({
      type: "LATE",
      amount: lateAmount,
      description: `${daysOverdue} day(s) overdue`,
      daysOverdue,
      perDayAmount
    });
  }

  return { totalPenalty, penaltyType, penalties, daysOverdue };
}

async function checkOverdueStatus(issueId) {
  try {
    const issueRes = await sql.query(
      `SELECT bi.*, lm.email, lm.first_name, lm.last_name
       FROM ${schema}.book_issues bi
       LEFT JOIN ${schema}.library_members lm ON bi.issued_to = lm.id
       WHERE bi.id = $1`,
      [issueId]
    );

    if (!issueRes.rows.length) {
      throw new Error("Issue not found");
    }

    const issue = issueRes.rows[0];

    if (issue.return_date) {
      return {
        isReturned: true,
        message: "Book already returned",
        returnDate: issue.return_date,
        member_name: `${issue.first_name} ${issue.last_name}`,
        member_email: issue.email
      };
    }

    const today = new Date();
    const dueDate = new Date(issue.due_date);
    const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

    let status = "ON_TIME";
    if (daysOverdue > 0) {
      status = "OVERDUE";
    } else if (daysRemaining <= 2 && daysRemaining >= 0) {
      status = "DUE_SOON";
    }

    return {
      isOverdue: daysOverdue > 0,
      daysOverdue: daysOverdue,
      daysRemaining: daysRemaining,
      status: status,
      dueDate: issue.due_date,
      today: today.toISOString().split('T')[0],
      member_name: `${issue.first_name} ${issue.last_name}`,
      member_email: issue.email,
      message: daysOverdue > 0
        ? `Book is ${daysOverdue} day(s) overdue`
        : daysRemaining >= 0
          ? `Due in ${daysRemaining} day(s)`
          : "Due date calculation error"
    };
  } catch (err) {
    console.error("Error checking overdue status:", err);
    throw err;
  }
}

// For testing - run every 5 seconds
// cron.schedule("*/5 * * * * *", sendDueReminder);      // हर 5 सेकंड
// cron.schedule("*/5 * * * * *", sendOverdueReminder); // हर 5 सेकंड

console.log("✅ Cron jobs scheduled - Each member will receive only ONE email per day for each reminder type");

// For production (comment out the above and uncomment below)
/*
cron.schedule("0 9 * * *", sendDueReminder);      // रोज सुबह 9:00 बजे
cron.schedule("0 10 * * *", sendOverdueReminder); // रोज सुबह 10:00 बजे
console.log("✅ Production cron jobs scheduled for 9 AM and 10 AM daily");
*/

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
  getAllBooks,
  getSubmitCountByBookId,
  getPenaltyMasters,
  calculatePenalty,
  checkOverdueStatus,
  sendDueReminder,
  sendOverdueReminder,
  sendAllReminders,
  cancelIssue
};