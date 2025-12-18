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
  console.log("Creating submission with data:", submissionData, "by user:", userId);
  try {
    if (!schema) throw new Error("Schema not initialized");

    await sql.query("BEGIN");

    if (!submissionData.issue_id) {
      throw new Error("Issue ID is required");
    }
    const checkRes = await sql.query(
      `SELECT return_date FROM ${schema}.book_issues WHERE id = $1`,
      [submissionData.issue_id]
    );

    if (checkRes.rows[0]?.return_date) {
      throw new Error("Book already returned");
    }

    // Get issue details
    const issueRes = await sql.query(
      `SELECT bi.*, b.title AS book_title, b.isbn
       FROM ${schema}.book_issues bi
       JOIN ${schema}.books b ON b.id = bi.book_id
       WHERE bi.id = $1`,
      [submissionData.issue_id]
    );

    if (!issueRes.rows.length) throw new Error("Issue not found");

    const issue = issueRes.rows[0];

    // Calculate days overdue manually in JavaScript
    const today = new Date();
    const dueDate = new Date(issue.due_date);
    const daysOverdue = Math.max(
      0,
      Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
    );

    const conditionAfter = (submissionData.condition_after || "good").toLowerCase();
    const conditionBefore = (submissionData.condition_before || "good").toLowerCase();

    // Get book amount from submission data ONLY
    const bookAmount = submissionData.book_amount || 0;

    // Insert book submission
    const submissionRes = await sql.query(
      `INSERT INTO ${schema}.book_submissions
       (issue_id, book_id, submitted_by, submit_date,
        condition_before, condition_after, remarks,
        days_overdue, createddate, createdbyid)
       VALUES ($1,$2,$3,CURRENT_DATE,$4,$5,$6,$7,CURRENT_TIMESTAMP,$3)
       RETURNING *`,
      [
        issue.id,
        issue.book_id,
        userId,
        conditionBefore,
        conditionAfter,
        submissionData.remarks || "",
        daysOverdue
      ]
    );

    const submission = submissionRes.rows[0];

    // 4️⃣ INSERT INTO penalty_master (ONLY IF REQUIRED)
    let penaltyAmount = 0;
    let penaltyType = null;

    if (conditionAfter === "lost") {
      if (!bookAmount || bookAmount <= 0) {
        throw new Error("Book amount is required for lost book");
      }
      penaltyType = "lost";
      penaltyAmount = bookAmount;
    }

    if (conditionAfter === "damaged") {
      penaltyType = "damage";
      penaltyAmount = submissionData.book_amount || 0;
    }

    if (daysOverdue > 0) {
      penaltyType = "late";
      penaltyAmount = submissionData.book_amount || 0;
    }

    if (penaltyType) {
      // Get company_id from user or use a valid default UUID
      let companyId = null;

      // Check if company_id is a valid UUID
      if (submissionData.company_id) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(submissionData.company_id.toString())) {
          companyId = submissionData.company_id;
        } else {
          console.warn(`Invalid company_id UUID: ${submissionData.company_id}, using NULL`);
        }
      }

      // Validate issued_to as UUID
      let issuedToValue = issue.issued_to;
      if (issuedToValue && typeof issuedToValue === 'string') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(issuedToValue)) {
          console.warn(`Invalid issued_to UUID: ${issuedToValue}, using NULL`);
          issuedToValue = null;
        }
      }

      console.log("Inserting into penalty_master with:", {
        companyId,
        penaltyType,
        bookId: issue.book_id,
        issueId: issue.id,
        issuedToValue,
        penaltyAmount
      });

      await sql.query(
        `INSERT INTO ${schema}.penalty_master
         (company_id, penalty_type, book_id, issue_id,
          book_title, isbn, issued_to, card_number,
          issue_date, due_date,
          condition_before, condition_after,
          book_amount, createdbyid)
         VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          companyId,  // Use NULL if not a valid UUID
          penaltyType,
          issue.book_id,
          issue.id,
          issue.book_title,
          issue.isbn,
          issuedToValue,
          issue.card_number || null,
          issue.issue_date,
          issue.due_date,
          conditionBefore,
          conditionAfter,
          penaltyAmount,
          userId
        ]
      );
    }

    // 5️⃣ Update issue as returned
    await sql.query(
      `UPDATE ${schema}.book_issues
       SET return_date = CURRENT_DATE,
           status = 'returned',
           lastmodifieddate = CURRENT_TIMESTAMP,
           lastmodifiedbyid = $2
       WHERE id = $1`,
      [issue.id, userId]
    );

    // 6️⃣ Increase stock only if GOOD
    if (conditionAfter === "good") {
      await sql.query(
        `UPDATE ${schema}.books
         SET available_copies = available_copies + 1
         WHERE id = $1`,
        [issue.book_id]
      );
    }

    await sql.query("COMMIT");

    return {
      success: true,
      message: "Book submitted successfully",
      data: {
        submission_id: submission.id,
        penalty_type: penaltyType,
        penalty_amount: penaltyAmount,
        days_overdue: daysOverdue,
        condition_after: conditionAfter,
        book_amount: bookAmount
      }
    };

  } catch (err) {
    if (sql) await sql.query("ROLLBACK");
    console.error("Submission error:", err);
    throw err;
  } finally {
    // if (sql) sql.release();
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

    // Fetch penalty master data for late penalty
    let perDayAmount = 0;
    try {
      const penaltyQuery = `
        SELECT per_day_amount 
        FROM demo.penalty_master 
        WHERE penalty_type = 'late' AND is_active = true
        LIMIT 1
      `;
      const penaltyResult = await sql.query(penaltyQuery);
      if (penaltyResult.rows.length > 0) {
        perDayAmount = parseFloat(penaltyResult.rows[0].per_day_amount) || 0;
      }
    } catch (err) {
      console.warn("Could not fetch penalty settings, using 0 penalty per day");
    }

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
      const penalty = perDayAmount * daysOverdue;

      const html = overdueTemplate({
        studentName: student_name,
        bookName: book.book_title,
        dueDate: book.due_date,
        overdueDays: daysOverdue,
        penaltyAmount: penalty,
        perDayAmount: perDayAmount
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

// Get penalty masters for frontend calculation
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

// Calculate penalty for specific issue (for frontend preview)
async function calculatePenalty(issueId, conditionAfter = null, bookAmount = 0) {
  try {
    // Fetch issue details
    const issueRes = await sql.query(
      `SELECT bi.*, b.title, b.isbn, b.price
       FROM ${schema}.book_issues bi
       LEFT JOIN ${schema}.books b ON bi.book_id = b.id
       WHERE bi.id = $1`,
      [issueId]
    );

    if (!issueRes.rows.length) {
      throw new Error("Issue not found");
    }

    const issue = issueRes.rows[0];
    const today = new Date();
    const dueDate = new Date(issue.due_date);

    // Calculate days overdue
    const timeDiff = today - dueDate;
    const daysOverdue = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));

    // Calculate days remaining
    const daysRemaining = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

    // Fetch active penalty settings
    const penaltyMastersRes = await sql.query(
      `SELECT * FROM ${schema}.penalty_master 
       WHERE is_active = true 
       AND (company_id = $1 OR company_id IS NULL) 
       ORDER BY penalty_type`,
      [issue.company_id || 1]
    );

    const masters = {};
    penaltyMastersRes.rows.forEach(p => {
      masters[p.penalty_type.toLowerCase()] = p;
    });

    const penalties = [];
    let totalPenalty = 0;
    let penaltyType = null;

    // Calculate late penalty
    if (daysOverdue > 0 && masters['late']) {
      const lateMaster = masters['late'];
      const perDayAmount = parseFloat(lateMaster.per_day_amount) || 0;
      const fixedLateAmount = parseFloat(lateMaster.fixed_amount) || 0;
      let lateAmount = 0;

      if (perDayAmount > 0) {
        // Per day penalty
        lateAmount = perDayAmount * daysOverdue;
      } else {
        // Fixed penalty for being late
        lateAmount = fixedLateAmount;
      }

      totalPenalty += lateAmount;
      penaltyType = 'late';

      penalties.push({
        type: "LATE_FEE",
        description: `Overdue by ${daysOverdue} day(s)`,
        amount: lateAmount,
        daysOverdue: daysOverdue,
        perDayAmount: perDayAmount,
        isFixed: perDayAmount === 0
      });
    }

    // Calculate damaged penalty
    if (conditionAfter && conditionAfter.toLowerCase() === "damaged" && masters['damage']) {
      const damageMaster = masters['damage'];
      const damageAmount = parseFloat(damageMaster.fixed_amount) ||
        parseFloat(damageMaster.per_day_amount) ||
        (bookAmount * 0.1); // 10% of book amount as default

      totalPenalty += damageAmount;
      penaltyType = 'damage';

      penalties.push({
        type: "DAMAGE_FEE",
        description: "Book damaged",
        amount: damageAmount,
        isFixed: true
      });
    }

    // Calculate lost penalty
    if (conditionAfter && conditionAfter.toLowerCase() === "lost" && masters['lost']) {
      const lostMaster = masters['lost'];
      let lostAmount = 0;

      if (bookAmount > 0) {
        lostAmount = bookAmount; // Full book amount from input
      } else if (issue.price > 0) {
        lostAmount = issue.price; // Use book price from database
      } else if (lostMaster.fixed_amount > 0) {
        lostAmount = parseFloat(lostMaster.fixed_amount);
      } else {
        lostAmount = 500; // Default amount
      }

      totalPenalty += lostAmount;
      penaltyType = 'lost';

      penalties.push({
        type: "LOST_BOOK",
        description: "Book lost - replacement cost",
        amount: lostAmount,
        isFixed: true
      });
    }

    return {
      success: true,
      data: {
        totalPenalty: totalPenalty,
        daysOverdue: daysOverdue,
        daysRemaining: daysRemaining,
        penaltyType: penaltyType,
        isOverdue: daysOverdue > 0,
        detailedPenalties: penalties,
        issue_details: {
          issue_id: issue.id,
          book_title: issue.title,
          due_date: issue.due_date,
          days_since_issue: Math.floor((today - new Date(issue.issue_date)) / (1000 * 60 * 60 * 24)),
          current_date: today.toISOString().split('T')[0]
        }
      }
    };
  } catch (err) {
    console.error("Error calculating penalty:", err);
    throw err;
  }
}

async function checkOverdueStatus(issueId) {
  try {
    const issueRes = await sql.query(
      `SELECT * FROM ${schema}.book_issues WHERE id = $1`,
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
        returnDate: issue.return_date
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

// ------------------------
// Cron job for daily reminders
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
  getAllBooks,
  getSubmitCountByBookId,
  getPenaltyMasters,
  calculatePenalty,
  checkOverdueStatus,
  sendDueReminder,
  sendOverdueReminder
};