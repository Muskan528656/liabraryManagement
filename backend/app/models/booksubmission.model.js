
  /**
   * @author      Muskan Khan
   * @date        DEC, 2025
   * @copyright   www.ibirdsservices.com
   */

  const sql = require("./db.js");
  const cron = require("node-cron");
  const sendMail = require("../utils/Mailer.js");
  const { dueTemplate, overdueTemplate } = require("../../app/utils/ReminderTemplate");
  const { applyMemberTypeFilter } = require("../utils/autoNumber.helper.js");

  let schema = "";
  let branchId = null;
  const emailTracker = {
    due: {},
    overdue: {}
  };
  function init(schema_name, branch_id = null) {
    schema = schema_name;
    branchId = branch_id;
  }
  async function create(submissionData, userId) {
    console.log("submissionData", submissionData);
    if (!schema) throw new Error("Schema not initialized");
    if (!submissionData.issue_id) throw new Error("Issue ID required");

    try {

      const issueRes = await sql.query(
        `SELECT bi.*, b.title, b.isbn
        FROM ${schema}.book_issues bi
        LEFT JOIN ${schema}.books b ON bi.book_id = b.id
        WHERE bi.id = $1 AND bi.branch_id = $2`,
        [submissionData.issue_id, branchId]
      );

      if (!issueRes.rows.length) throw new Error("Issue not found");
      const issue = issueRes.rows[0];


      if (issue.return_date) {
        throw new Error("Book already returned");
      }


      if (issue.status === 'cancelled') {
        console.log("issueueuueeu", issue.status);
        throw new Error("Cancelled issue cannot be submitted");
      }

      const memberRes = await sql.query(
        `SELECT * FROM ${schema}.library_members 
        WHERE id = $1 AND is_active = true AND branch_id = $2`,
        [issue.issued_to, branchId]
      );

      if (!memberRes.rows.length) throw new Error("Library member not found");
      const member = memberRes.rows[0];

      const settingRes = await sql.query(
        `SELECT * FROM ${schema}.library_setting  LIMIT 1`,
      );

      let finePerDay = 5;
      if (settingRes.rows.length > 0) {
        finePerDay = Number(settingRes.rows[0].fine_per_day) || 5;
      }

      const today = new Date();
      const dueDate = new Date(issue.due_date);
      const daysOverdue = Math.max(
        Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24)),
        0
      );

      const conditionBefore = submissionData.condition_before || "Good";
      const conditionAfter = submissionData.condition_after || "Good";
      const conditionAfterLower = conditionAfter.toLowerCase();

      let bookPurchasePrice = 0;
      let purchaseDetails = null;

      if (conditionAfterLower === "lost" || conditionAfterLower === "damaged") {
        const purchaseRes = await sql.query(
          `SELECT unit_price, purchase_date, quantity, total_amount
          FROM ${schema}.purchases 
          WHERE book_id = $1 AND branch_id = $2
          ORDER BY purchase_date DESC, createddate DESC 
          LIMIT 1`,
          [issue.book_id, branchId]
        );

        if (purchaseRes.rows.length > 0) {
          purchaseDetails = purchaseRes.rows[0];
          bookPurchasePrice = purchaseDetails.unit_price || 0;
        } else {
          bookPurchasePrice =
            submissionData.book_price ||
            submissionData.lost_book_price ||
            0;
        }
      }

      let totalPenalty = 0;
      let penaltyType = "none";
      let latePenalty = 0;
      let damageLostPenalty = 0;

      if (daysOverdue > 0) {
        latePenalty = daysOverdue * finePerDay;
        totalPenalty += latePenalty;
        penaltyType = "late";
      }

      if (conditionAfterLower === "lost") {
        damageLostPenalty = bookPurchasePrice;
        totalPenalty += damageLostPenalty;
        penaltyType = "lost";
      } else if (conditionAfterLower === "damaged") {
        damageLostPenalty = bookPurchasePrice * 0.5;
        totalPenalty += damageLostPenalty;
        penaltyType = "damaged";
      }


      const submissionRes = await sql.query(
        `INSERT INTO ${schema}.book_submissions
          (issue_id, book_id, submitted_by, submit_date,
          condition_before, condition_after, remarks,
          days_overdue, penalty, createddate, createdbyid, branch_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CURRENT_TIMESTAMP,$3,$10)
        RETURNING *`,
        [
          issue.id,
          issue.book_id,
          userId,
          submissionData.submit_date
            ? new Date(submissionData.submit_date)
            : new Date(),
          conditionBefore,
          conditionAfter,
          submissionData.remarks || "",
          daysOverdue,
          totalPenalty,
          branchId
        ]
      );

      const submission = submissionRes.rows[0];


      // Update Book Copy status - find the borrowed copy for this book/member
      let copyStatus = 'AVAILABLE';
      if (conditionAfterLower === 'lost') copyStatus = 'LOST';
      if (conditionAfterLower === 'damaged') copyStatus = 'DAMAGED';

      await sql.query(
        `UPDATE ${schema}.book_copy 
        SET status = $2, lastmodifiedbyid = $3, lastmodifieddate = NOW() 
        WHERE id = (
          SELECT id FROM ${schema}.book_copy 
          WHERE book_id = $1 AND status = 'BORROWED' 
          ORDER BY lastmodifieddate ASC
          LIMIT 1
        )`,
        [issue.book_id, copyStatus, userId]
      );

      let issueStatus = 'returned';
      if (conditionAfterLower === 'lost') issueStatus = 'lost';
      else if (conditionAfterLower === 'damaged') issueStatus = 'damaged';

      await sql.query(
        `UPDATE ${schema}.book_issues
        SET return_date = CURRENT_DATE,
            status = $4,
            lastmodifieddate = CURRENT_TIMESTAMP,
            lastmodifiedbyid = $3
        WHERE id = $1 AND branch_id = $2`,
        [issue.id, branchId, userId, issueStatus]
      );

      await sql.query('COMMIT');

      return {
        success: true,
        message: "Book submitted successfully",
        data: {
          submission_id: submission.id,
          totalPenalty,
          penaltyType,
          daysOverdue,
          latePenalty,
          damageLostPenalty
        }
      };

    } catch (error) {
      await sql.query('ROLLBACK');
      console.error("Book submission failed:", error);
      throw error;
    }
  }
  async function findById(id, memberType) {
    try {
      if (!schema) {
        throw new Error("Schema not initialized. Call init() first.");
      }

      let query = `
        SELECT 
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
        WHERE bs.id = $1 AND bs.branch_id = $2
      `;

      let values = [id, branchId];
      const filtered = applyMemberTypeFilter(query, memberType, values);
      query = filtered.query;
      values = filtered.values;

      const result = await sql.query(query, values);

      return result.rows[0] || null;

    } catch (error) {
      console.error("Error in findById:", error);
      throw error;
    }
  }

  async function findAll(filters = {}) {
    try {
      if (!schema) {
        throw new Error("Schema not initialized. Call init() first.");
      }

      let query = `SELECT
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
                  WHERE bs.branch_id = $1`;

      const conditions = [];
      const values = [branchId]; // branch_id is the first parameter
      let paramIndex = 2; // start from 2 since branch_id is $1

      if (filters.memberType && filters.memberType !== "All") {
        conditions.push(`LOWER(lm.library_member_type) = LOWER($${paramIndex})`);
        values.push(filters.memberType);
        paramIndex++;
      }

      // condition_after
      if (filters.condition_after) {
        conditions.push(`bs.condition_after = $${paramIndex}`);
        values.push(filters.condition_after);
        paramIndex++;
      }

      // book title
      if (filters.book_title) {
        conditions.push(`b.title ILIKE $${paramIndex}`);
        values.push(`%${filters.book_title}%`);
        paramIndex++;
      }

      // student name
      if (filters.student_name) {
        conditions.push(`(lm.first_name || ' ' || lm.last_name) ILIKE $${paramIndex}`);
        values.push(`%${filters.student_name}%`);
        paramIndex++;
      }

      // date range
      if (filters.submit_date_from) {
        conditions.push(`bs.submit_date >= $${paramIndex}`);
        values.push(filters.submit_date_from);
        paramIndex++;
      }

      if (filters.submit_date_to) {
        conditions.push(`bs.submit_date <= $${paramIndex}`);
        values.push(filters.submit_date_to);
        paramIndex++;
      }

      // issued_to
      if (filters.issued_to) {
        conditions.push(`bi.issued_to = $${paramIndex}`);
        values.push(filters.issued_to);
        paramIndex++;
      }

      // submitted_by
      if (filters.submitted_by) {
        conditions.push(`bs.submitted_by = $${paramIndex}`);
        values.push(filters.submitted_by);
        paramIndex++;
      }

      // WHERE clause
      if (conditions.length > 0) {
        query += ` AND ${conditions.join(" AND ")}`;
      }

      query += ` ORDER BY bs.createddate DESC`;

      const result = await sql.query(query, values);
      return result.rows || [];

    } catch (error) {
      console.error("Error in findAll:", error);
      throw error;
    }
  }

  // async function findAll(filters = {}) {
  //   try {
  //     if (!schema) {
  //       throw new Error("Schema not initialized. Call init() first.");
  //     }

  //     let query = `SELECT
  //                     bs.*,
  //                     bi.issued_to,
  //                     bi.issue_date,
  //                     bi.due_date,
  //                     b.title AS book_title,
  //                     b.isbn AS book_isbn,
  //                     lm.first_name || ' ' || lm.last_name AS student_name,
  //                     lm.email AS student_email,
  //                     lm.card_number
  //                    FROM ${schema}.book_submissions bs
  //                    LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
  //                    LEFT JOIN ${schema}.books b ON bs.book_id = b.id
  //                    LEFT JOIN ${schema}.library_members lm ON bi.issued_to = lm.id`;

  //     const conditions = [];
  //     const values = [];
  //     let paramIndex = 1;

  //     // Filter by condition_after
  //     if (filters.condition_after) {
  //       conditions.push(`bs.condition_after = $${paramIndex}`);
  //       values.push(filters.condition_after);
  //       paramIndex++;
  //     }

  //     // Filter by book title (partial match)
  //     if (filters.book_title) {
  //       conditions.push(`b.title ILIKE $${paramIndex}`);
  //       values.push(`%${filters.book_title}%`);
  //       paramIndex++;
  //     }

  //     // Filter by student name (partial match)
  //     if (filters.student_name) {
  //       conditions.push(`(lm.first_name || ' ' || lm.last_name) ILIKE $${paramIndex}`);
  //       values.push(`%${filters.student_name}%`);
  //       paramIndex++;
  //     }

  //     // Filter by submit date range
  //     if (filters.submit_date_from) {
  //       conditions.push(`bs.submit_date >= $${paramIndex}`);
  //       values.push(filters.submit_date_from);
  //       paramIndex++;
  //     }

  //     if (filters.submit_date_to) {
  //       conditions.push(`bs.submit_date <= $${paramIndex}`);
  //       values.push(filters.submit_date_to);
  //       paramIndex++;
  //     }

  //     // Filter by issued_to (member ID)
  //     if (filters.issued_to) {
  //       conditions.push(`bi.issued_to = $${paramIndex}`);
  //       values.push(filters.issued_to);
  //       paramIndex++;
  //     }

  //     // Filter by submitted_by (librarian ID)
  //     if (filters.submitted_by) {
  //       conditions.push(`bs.submitted_by = $${paramIndex}`);
  //       values.push(filters.submitted_by);
  //       paramIndex++;
  //     }

  //     // Add WHERE clause if there are conditions
  //     if (conditions.length > 0) {
  //       query += ` WHERE ${conditions.join(' AND ')}`;
  //     }

  //     query += ` ORDER BY bs.createddate DESC`;

  //     const result = await sql.query(query, values);
  //     return result.rows.length > 0 ? result.rows : [];
  //   } catch (error) {
  //     console.error("Error in findAll:", error);
  //     throw error;
  //   }
  // }
  async function cancelIssue(issueId, userId, reason = "Cancelled by librarian") {
    if (!schema) throw new Error("Schema not initialized");



    try {
      await sql.query('BEGIN');




      const issueRes = await sql.query(
        `SELECT * FROM ${schema}.book_issues WHERE id = $1 AND branch_id = $2`,
        [issueId, branchId]
      );

      if (!issueRes.rows.length) {
        throw new Error("Issue not found");
      }

      const issue = issueRes.rows[0];


      if (issue.status && issue.status !== 'issued') {
        throw new Error(`Cannot cancel issue with status: ${issue.status}`);
      }


      let statusUpdated = false;
      let finalStatus = 'cancelled';


      try {


        await sql.query(
          `UPDATE ${schema}.book_issues 
          SET status = 'cancelled',
              return_date = CURRENT_TIMESTAMP,
              lastmodifieddate = CURRENT_TIMESTAMP,
              lastmodifiedbyid = $1,
              remarks = COALESCE(remarks || ' ', '') || 'Cancelled: ' || $2
          WHERE id = $3 AND branch_id = $4`,
          [userId, reason, issueId, branchId]
        );
        statusUpdated = true;

      } catch (statusError) {



        await sql.query(
          `UPDATE ${schema}.book_issues 
          SET status = 'cancelled',
              return_date = CURRENT_TIMESTAMP,
              lastmodifieddate = CURRENT_TIMESTAMP,
              lastmodifiedbyid = $1,
              remarks = COALESCE(remarks || ' ', '') || 'Cancelled: ' || $2
          WHERE id = $3 AND branch_id = $4`,
          [userId, reason, issueId, branchId]
        );
        finalStatus = 'cancelled';
        statusUpdated = true;
      }

      if (!statusUpdated) {
        throw new Error("Failed to update issue status");
      }



      // Find and update a borrowed copy for this book
      await sql.query(
        `UPDATE ${schema}.book_copy 
        SET status = 'AVAILABLE', lastmodifiedbyid = $2, lastmodifieddate = NOW() 
        WHERE id = (
          SELECT id FROM ${schema}.book_copy 
          WHERE book_id = $1 AND status = 'BORROWED' 
          LIMIT 1
        )`,
        [issue.book_id, userId]
      );
      await sql.query(
        `INSERT INTO ${schema}.book_submissions
          (issue_id, book_id, submitted_by, submit_date,
          condition_before, condition_after, remarks,
          days_overdue, penalty, createddate, createdbyid, branch_id)
        VALUES ($1,$2,$3,CURRENT_TIMESTAMP,$4,$5,$6,0,0,CURRENT_TIMESTAMP,$3,$7)`,
        [
          issueId,
          issue.book_id,
          userId,
          issue.condition_before || 'Good',
          finalStatus,
          `Issue ${finalStatus}: ${reason}`,
          branchId
        ]
      );

      await sql.query('COMMIT');


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
      await sql.query('ROLLBACK');
      console.error("Error cancelling issue:", error);
      throw error;
    } finally {
      //do nothing
    }
  }
  async function findByIssueId(issueId, memberType) {
    try {
      let query = `
        SELECT 
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
        WHERE bs.issue_id = $1 AND bs.branch_id = $2
      `;

      let values = [issueId, branchId];

      const filtered = applyMemberTypeFilter(query, memberType, values);
      query = filtered.query;
      values = filtered.values;

      const result = await sql.query(query, values);
      return result.rows;

    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  async function findByBookId(bookId, memberType) {
    try {
      if (!schema) {
        throw new Error("Schema not initialized. Call init() first.");
      }

      let query = `
        SELECT 
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
        WHERE bs.book_id = $1 AND bs.branch_id = $2
      `;

      let values = [bookId, branchId];


      const filtered = applyMemberTypeFilter(query, memberType, values);

      query = filtered.query + ` ORDER BY bs.createddate DESC`;
      values = filtered.values;

      const result = await sql.query(query, values);

      return result.rows || [];

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
                    WHERE bs.submit_date >= $1 AND bs.submit_date <= $2 AND bs.branch_id = $3
                    ORDER BY bs.createddate DESC`;
      const result = await sql.query(query, [startDate, endDate, branchId]);
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
                    WHERE bs.submitted_by = $1 AND bs.branch_id = $2
                    ORDER BY bs.createddate DESC`;
      const result = await sql.query(query, [librarianId, branchId]);
      return result.rows.length > 0 ? result.rows : [];
    } catch (error) {
      console.error("Error in findByLibrarian:", error);
      throw error;
    }
  }

  async function deleteById(id) {
    try {
      const query = `DELETE FROM ${schema}.book_submissions WHERE id = $1 AND branch_id = $2 RETURNING *`;
      const result = await sql.query(query, [id, branchId]);
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
                    FROM ${schema}.book_issues bi
                    LEFT JOIN ${schema}.books b ON bi.book_id = b.id
                    LEFT JOIN ${schema}.library_members lm ON bi.issued_to = lm.id
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
      console.error(" Error:", error);
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
          AND branch_id = $2
      `;
      const result = await sql.query(query, [bookId, branchId]);

      return parseInt(result.rows[0].submit_count) || 0;

    } catch (error) {
      console.error("Error in getSubmitCountByBookId:", error);
      throw error;
    }
  }


  function hasEmailBeenSent(type, key) {
    const today = new Date().toISOString().split('T')[0];
    const trackerKey = `${key}_${today}`;

    if (type === 'due' && emailTracker.due[trackerKey]) {
      return true;
    }
    if (type === 'overdue' && emailTracker.overdue[trackerKey]) {
      return true;
    }


    if (type === 'due') {
      emailTracker.due[trackerKey] = true;
    } else {
      emailTracker.overdue[trackerKey] = true;
    }

    return false;
  }


  function cleanupEmailTracker() {
    const today = new Date().toISOString().split('T')[0];


    Object.keys(emailTracker.due).forEach(key => {
      const keyDate = key.split('_').pop();
      if (keyDate !== today) {
        delete emailTracker.due[key];
      }
    });


    Object.keys(emailTracker.overdue).forEach(key => {
      const keyDate = key.split('_').pop();
      if (keyDate !== today) {
        delete emailTracker.overdue[key];
      }
    });
  }
async function sendDueReminder() {
  try {

    // ✅ Safety check
    if (!schema || !branchId) {
      console.error("Schema or BranchId not initialized in sendDueReminder");
      return;
    }

    cleanupEmailTracker();

    // ✅ Proper date formatting (avoid timezone issues)
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // ✅ SQL Query (FIXED NULL condition)
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
      FROM ${schema}.book_issues bi
      INNER JOIN ${schema}.books b ON bi.book_id = b.id
      INNER JOIN ${schema}.library_members lm ON bi.issued_to = lm.id
      WHERE DATE(bi.due_date) = $1 
        AND bi.return_date IS NULL
        AND (bi.status IN ('issued', 'active') OR bi.status IS NULL)
        AND lm.is_active = true
      ORDER BY lm.email, bi.due_date
    `;

    const result = await sql.query(query, [tomorrowStr]);

    if (!result.rows || result.rows.length === 0) {
      console.log("No due reminders for tomorrow.");
      return;
    }

    // ✅ Group by member
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

    let emailsSent = 0;
    let emailsFailed = 0;
    let emailsSkipped = 0;

    for (const memberId in groupedByMember) {

      const member = groupedByMember[memberId];

      // ✅ Prevent duplicate email
      if (hasEmailBeenSent('due', memberId)) {
        emailsSkipped++;
        continue;
      }

      if (!member.email) {
        console.warn(`No email for member ${member.name}`);
        emailsFailed++;
        continue;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(member.email)) {
        console.warn(`Invalid email for ${member.name}: ${member.email}`);
        emailsFailed++;
        continue;
      }

      try {

        const html = dueTemplate({
          studentName: member.name,
          books: member.books,
          dueDate: tomorrowStr,
          cardNumber: member.card_number
        });

        await sendMail({
          to: member.email,
          subject: `📚 Library Reminder: ${member.books.length} Book(s) Due Tomorrow`,
          html: html,
          text: `
Dear ${member.name},

You have ${member.books.length} book(s) due tomorrow:

${member.books.map(book => `• ${book.name}`).join('\n')}

Due Date: ${tomorrowStr}
Card Number: ${member.card_number || 'N/A'}

Please return or renew them on time.

Library Management System
          `
        });

        emailsSent++;

        // Small delay to avoid mail rate limit
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (mailError) {
        console.error(`Failed to send email to ${member.email}:`, mailError.message);
        emailsFailed++;
      }
    }

    console.log("Due Reminder Summary:", {
      totalMembers: Object.keys(groupedByMember).length,
      emailsSent,
      emailsFailed,
      emailsSkipped
    });

  } catch (error) {
    console.error("CRITICAL ERROR in sendDueReminder:", {
      message: error.message,
      stack: error.stack?.split('\n')[0],
      timestamp: new Date().toISOString()
    });
  }
}

  async function sendOverdueReminder() {
    try {



      cleanupEmailTracker();


      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];



      let penaltyPerDay = 0;
      try {
        const penaltyQuery = `
          SELECT per_day_amount 
          FROM ${schema}.penalty_master 
          WHERE penalty_type = 'late' 
            AND is_active = true
            AND branch_id = $1
          LIMIT 1
        `;
        const penaltyResult = await sql.query(penaltyQuery, [branchId]);

        if (penaltyResult.rows.length > 0) {
          penaltyPerDay = parseFloat(penaltyResult.rows[0].per_day_amount) || 0;
        }

      } catch (penaltyError) {
        console.warn(" Could not fetch penalty settings, using 0");
      }


      const query = ` SELECT
      bi.id,
        bi.book_id,
        bi.issued_to,
        bi.due_date,
        bi.issue_date,
        b.title AS book_title,
          lm.email AS student_email,
            CONCAT(lm.first_name, ' ', lm.last_name) AS student_name,
              lm.card_number
  FROM ${schema}.book_issues bi
  INNER JOIN ${schema}.books b ON bi.book_id = b.id
  INNER JOIN ${schema}.library_members lm ON bi.issued_to = lm.id
  WHERE DATE(bi.due_date) = $1
    AND bi.return_date IS NULL
    AND bi.status IN('issued', 'active', NULL)
    AND lm.is_active = true
  ORDER BY lm.email`;


      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const result = await sql.query(query, [yesterdayStr]);


      if (result.rows.length === 0) {

        return;
      }


      let emailsSent = 0;
      let emailsFailed = 0;
      let emailsSkipped = 0;

      for (const book of result.rows) {
        if (!book.student_email) {
          console.warn(` No email for library member ID ${book.issued_to}: ${book.student_name}`);
          emailsFailed++;
          continue;
        }


        const trackerKey = `${book.issued_to}_${book.id}`;
        if (hasEmailBeenSent('overdue', trackerKey)) {

          emailsSkipped++;
          continue;
        }


        const dueDate = new Date(book.due_date);
        const timeDiff = today.getTime() - dueDate.getTime();
        const overdueDays = Math.max(0, Math.floor(timeDiff / (1000 * 3600 * 24)));
        const penaltyAmount = penaltyPerDay * overdueDays;








        try {

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


          emailsSent++;


          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.error(` Failed to send overdue email to ${book.student_email}:`, error.message);
          emailsFailed++;
        }
      }









    } catch (error) {
      console.error(" CRITICAL ERROR in sendOverdueReminder:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack?.split('\n')[0],
        timestamp: new Date().toISOString()
      });
    }
  }

  async function sendAllReminders() {
    const startTime = Date.now();
    try {
      await sendDueReminder();
      await sendOverdueReminder();
    } catch (error) {
      console.error(" ERROR in sendAllReminders:", error);
    } finally {
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
    }
  }

  async function getPenaltyMasters() {
    try {
      const query = `
        SELECT * FROM ${schema}.penalty_master 
        WHERE is_active = true
          AND branch_id = $1
        ORDER BY penalty_type
      `;
      const result = await sql.query(query, [branchId]);

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

    let totalPenalty = 0;
    let penaltyType = null;
    const penalties = [];


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


    if (conditionAfter?.toLowerCase() === "lost") {
      penaltyType = "lost";
      const amount = bookAmount > 0 ? bookAmount : (issue.price || 500);
      totalPenalty += amount;
      penalties.push({ type: "LOST", amount, description: "Book lost" });
    }


    if (conditionAfter?.toLowerCase() === "damaged" && masters['damage']) {
      penaltyType = "damage";
      const damageAmount = masters['damage'].fixed_amount || (bookAmount * 0.1) || 0;
      totalPenalty += damageAmount;
      penalties.push({ type: "DAMAGE", amount: damageAmount, description: "Book damaged" });
    }


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


// cron.schedule('*/5 * * * * *', sendDueReminder);
// cron.schedule('*/5 * * * * *', sendOverdueReminder);
// cron.schedule("0 0 9 * * *", sendDueReminder);
// cron.schedule("0 0 9 * * *", sendOverdueReminder);

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