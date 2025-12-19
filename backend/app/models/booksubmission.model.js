// // /**
// //  * @author      Muskan Khan
// //  * @date        DEC, 2025
// //  * @copyright   www.ibirdsservices.com
// //  */

// // const sql = require("./db.js");
// // const cron = require("node-cron");
// // const sendMail = require("../utils/mailer");
// // const { dueTemplate, overdueTemplate } = require("../../app/utils/ReminderTemplate");

// // let schema = "";

// // function init(schema_name) {
// //   schema = schema_name;
// // }
// // async function create(submissionData, userId) {
// //   if (!schema) throw new Error("Schema not initialized");
// //   if (!submissionData.issue_id) throw new Error("Issue ID required");

// //   const issueRes = await sql.query(
// //     `SELECT bi.*, b.title, b.isbn
// //      FROM ${schema}.book_issues bi
// //      LEFT JOIN ${schema}.books b ON bi.book_id = b.id
// //      WHERE bi.id = $1`,
// //     [submissionData.issue_id]
// //   );

// //   if (!issueRes.rows.length) throw new Error("Issue not found");
// //   const issue = issueRes.rows[0];

// //   if (issue.return_date) throw new Error("Book already returned");

// //   const settingRes = await sql.query(
// //     `SELECT fine_per_day FROM demo.library_setting LIMIT 1`
// //   );
// //   const finePerDay = settingRes.rows.length ? Number(settingRes.rows[0].fine_per_day) : 0;

// //   const today = new Date();
// //   const dueDate = new Date(issue.due_date);
// //   const daysOverdue = Math.max(Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24)), 0);
// //   let totalPenalty = 0;
// //   let penaltyType = null;
// //   let penalties = [];

// //   if (daysOverdue > 0) {
// //     totalPenalty = daysOverdue * finePerDay;

// //     // ✅ Database constraint के according valid value use करें
// //     // Constraint केवल 'late', 'damage', 'lost' allow करता है
// //     penaltyType = "late"; // 'overdue' की जगह 'late' use करें

// //     penalties.push({
// //       type: penaltyType,
// //       amount: totalPenalty,
// //       daysOverdue
// //     });
// //   }

// //   const submissionRes = await sql.query(
// //     `INSERT INTO ${schema}.book_submissions
// //       (issue_id, book_id, submitted_by, submit_date,
// //        condition_before, condition_after, remarks,
// //        days_overdue, createddate, createdbyid)
// //      VALUES ($1,$2,$3,CURRENT_DATE,$4,$5,$6,$7,CURRENT_TIMESTAMP,$3)
// //      RETURNING *`,
// //     [
// //       issue.id,
// //       issue.book_id,
// //       userId,
// //       submissionData.condition_before || "good",
// //       submissionData.condition_after || "good",
// //       submissionData.remarks || "",
// //       daysOverdue
// //     ]
// //   );

// //   const submission = submissionRes.rows[0];

// //   let companyId = null;
// //   if (submissionData.company_id) {
// //     const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// //     if (uuidRegex.test(submissionData.company_id)) companyId = submissionData.company_id;
// //   }

// //   let issuedToValue = issue.issued_to || null;
// //   if (issuedToValue) {
// //     const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// //     if (!uuidRegex.test(issuedToValue)) issuedToValue = null;
// //   }

// //   if (totalPenalty > 0) {
// //     await sql.query(
// //       `INSERT INTO ${schema}.penalty_master
// //        (company_id, penalty_type, book_id, issue_id,
// //         book_title, isbn, issued_to, card_number,
// //         issue_date, due_date,
// //         condition_before, condition_after,
// //         book_amount, createdbyid)
// //        VALUES
// //        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
// //       [
// //         companyId,
// //         penaltyType, // ✅ यहाँ 'late' जाएगा
// //         issue.book_id,
// //         issue.id,
// //         issue.title,
// //         issue.isbn,
// //         issuedToValue,
// //         issue.card_number || null,
// //         issue.issue_date,
// //         issue.due_date,
// //         submissionData.condition_before || "good",
// //         submissionData.condition_after || "good",
// //         totalPenalty,
// //         userId
// //       ]
// //     );
// //   }

// //   await sql.query(
// //     `UPDATE ${schema}.book_issues
// //      SET return_date = CURRENT_DATE, status = 'returned', lastmodifieddate = CURRENT_TIMESTAMP,
// //          lastmodifiedbyid = $2
// //      WHERE id = $1`,
// //     [issue.id, userId]
// //   );

// //   return {
// //     success: true,
// //     message: "Book submitted successfully",
// //     data: {
// //       submission_id: submission.id,
// //       totalPenalty,
// //       penaltyType, // ✅ Response में भी 'late' return होगा
// //       daysOverdue,
// //       penalties
// //     }
// //   };
// // }


// // async function findById(id) {
// //   try {
// //     if (!schema) {
// //       throw new Error("Schema not initialized. Call init() first.");
// //     }
// //     const query = `SELECT 
// //                     bs.*,
// //                     bi.issued_to,
// //                     bi.issue_date,
// //                     bi.due_date,
// //                     b.title AS book_title,
// //                     b.isbn AS book_isbn,
// //                     u.firstname || ' ' || u.lastname AS student_name,
// //                     u.email AS student_email,
// //                     submitted_user.firstname || ' ' || submitted_user.lastname AS submitted_by_name
// //                    FROM ${schema}.book_submissions bs
// //                    LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
// //                    LEFT JOIN ${schema}.books b ON bs.book_id = b.id
// //                    LEFT JOIN ${schema}."user" u ON bi.issued_to = u.id
// //                    LEFT JOIN ${schema}."user" submitted_user ON bs.submitted_by = submitted_user.id
// //                    WHERE bs.id = $1`;
// //     const result = await sql.query(query, [id]);
// //     if (result.rows.length > 0) {
// //       return result.rows[0];
// //     }
// //     return null;
// //   } catch (error) {
// //     console.error("Error in findById:", error);
// //     throw error;
// //   }
// // }

// // async function findAll() {
// //   try {
// //     if (!schema) {
// //       throw new Error("Schema not initialized. Call init() first.");
// //     }
// //     const query = `SELECT 
// //                     bs.*,
// //                     bi.issued_to,
// //                     bi.issue_date,
// //                     bi.due_date,
// //                     b.title AS book_title,
// //                     b.isbn AS book_isbn,
// //                     u.firstname || ' ' || u.lastname AS student_name,
// //                     u.email AS student_email,
// //                     submitted_user.firstname || ' ' || submitted_user.lastname AS submitted_by_name
// //                    FROM ${schema}.book_submissions bs
// //                    LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
// //                    LEFT JOIN ${schema}.books b ON bs.book_id = b.id
// //                    LEFT JOIN ${schema}."user" u ON bi.issued_to = u.id
// //                    LEFT JOIN ${schema}."user" submitted_user ON bs.submitted_by = submitted_user.id
// //                    ORDER BY bs.createddate DESC`;
// //     const result = await sql.query(query);
// //     return result.rows.length > 0 ? result.rows : [];
// //   } catch (error) {
// //     console.error("Error in findAll:", error);
// //     throw error;
// //   }
// // }

// // async function findByIssueId(issueId) {
// //   try {
// //     if (!schema) {
// //       throw new Error("Schema not initialized. Call init() first.");
// //     }
// //     const query = `SELECT 
// //                     bs.*,
// //                     bi.issued_to,
// //                     bi.issue_date,
// //                     bi.due_date,
// //                     b.title AS book_title,
// //                     b.isbn AS book_isbn,
// //                     u.firstname || ' ' || u.lastname AS student_name,
// //                     u.email AS student_email,
// //                     submitted_user.firstname || ' ' || submitted_user.lastname AS submitted_by_name
// //                    FROM ${schema}.book_submissions bs
// //                    LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
// //                    LEFT JOIN ${schema}.books b ON bs.book_id = b.id
// //                    LEFT JOIN ${schema}."user" u ON bi.issued_to = u.id
// //                    LEFT JOIN ${schema}."user" submitted_user ON bs.submitted_by = submitted_user.id
// //                    WHERE bs.issue_id = $1`;
// //     const result = await sql.query(query, [issueId]);
// //     return result.rows.length > 0 ? result.rows : [];
// //   } catch (error) {
// //     console.error("Error in findByIssueId:", error);
// //     throw error;
// //   }
// // }

// // async function findByBookId(bookId) {
// //   try {
// //     if (!schema) {
// //       throw new Error("Schema not initialized. Call init() first.");
// //     }
// //     const query = `SELECT 
// //                     bs.*,
// //                     bi.issued_to,
// //                     bi.issue_date,
// //                     bi.due_date,
// //                     b.title AS book_title,
// //                     b.isbn AS book_isbn,
// //                     u.firstname || ' ' || u.lastname AS student_name,
// //                     u.email AS student_email,
// //                     submitted_user.firstname || ' ' || submitted_user.lastname AS submitted_by_name
// //                    FROM ${schema}.book_submissions bs
// //                    LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
// //                    LEFT JOIN ${schema}.books b ON bs.book_id = b.id
// //                    LEFT JOIN ${schema}."user" u ON bi.issued_to = u.id
// //                    LEFT JOIN ${schema}."user" submitted_user ON bs.submitted_by = submitted_user.id
// //                    WHERE bs.book_id = $1
// //                    ORDER BY bs.createddate DESC`;
// //     const result = await sql.query(query, [bookId]);
// //     return result.rows.length > 0 ? result.rows : [];
// //   } catch (error) {
// //     console.error("Error in findByBookId:", error);
// //     throw error;
// //   }
// // }

// // async function findByDateRange(startDate, endDate) {
// //   try {
// //     if (!schema) {
// //       throw new Error("Schema not initialized. Call init() first.");
// //     }
// //     const query = `SELECT 
// //                     bs.*,
// //                     bi.issued_to,
// //                     bi.issue_date,
// //                     bi.due_date,
// //                     b.title AS book_title,
// //                     b.isbn AS book_isbn,
// //                     u.firstname || ' ' || u.lastname AS student_name,
// //                     u.email AS student_email,
// //                     submitted_user.firstname || ' ' || submitted_user.lastname AS submitted_by_name
// //                    FROM ${schema}.book_submissions bs
// //                    LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
// //                    LEFT JOIN ${schema}.books b ON bs.book_id = b.id
// //                    LEFT JOIN ${schema}."user" u ON bi.issued_to = u.id
// //                    LEFT JOIN ${schema}."user" submitted_user ON bs.submitted_by = submitted_user.id
// //                    WHERE bs.submit_date >= $1 AND bs.submit_date <= $2
// //                    ORDER BY bs.createddate DESC`;
// //     const result = await sql.query(query, [startDate, endDate]);
// //     return result.rows.length > 0 ? result.rows : [];
// //   } catch (error) {
// //     console.error("Error in findByDateRange:", error);
// //     throw error;
// //   }
// // }

// // async function findByLibrarian(librarianId) {
// //   try {
// //     if (!schema) {
// //       throw new Error("Schema not initialized. Call init() first.");
// //     }
// //     const query = `SELECT 
// //                     bs.*,
// //                     bi.issued_to,
// //                     bi.issue_date,
// //                     bi.due_date,
// //                     b.title AS book_title,
// //                     b.isbn AS book_isbn,
// //                     u.firstname || ' ' || u.lastname AS student_name,
// //                     u.email AS student_email,
// //                     submitted_user.firstname || ' ' || submitted_user.lastname AS submitted_by_name
// //                    FROM ${schema}.book_submissions bs
// //                    LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
// //                    LEFT JOIN ${schema}.books b ON bs.book_id = b.id
// //                    LEFT JOIN ${schema}."user" u ON bi.issued_to = u.id
// //                    LEFT JOIN ${schema}."user" submitted_user ON bs.submitted_by = submitted_user.id
// //                    WHERE bs.submitted_by = $1
// //                    ORDER BY bs.createddate DESC`;
// //     const result = await sql.query(query, [librarianId]);
// //     return result.rows.length > 0 ? result.rows : [];
// //   } catch (error) {
// //     console.error("Error in findByLibrarian:", error);
// //     throw error;
// //   }
// // }

// // async function deleteById(id) {
// //   try {
// //     const query = `DELETE FROM ${schema}.book_submissions WHERE id = $1 RETURNING *`;
// //     const result = await sql.query(query, [id]);
// //     if (result.rows.length > 0) {
// //       return { success: true, message: "Submission deleted successfully" };
// //     }
// //     return { success: false, message: "Submission not found" };
// //   } catch (error) {
// //     console.error("Error in deleteById:", error);
// //     throw error;
// //   }
// // }

// // async function getAllBooks() {
// //   try {
// //     const query = `SELECT 
// //                     bi.*,
// //                     b.title AS book_title,
// //                     b.isbn AS book_isbn,
// //                     issued_to_user.firstname || ' ' || issued_to_user.lastname AS issued_to_name,
// //                     issued_to_user.firstname || ' ' || issued_to_user.lastname AS student_name,
// //                     issued_to_user.email AS issued_to_email,
// //                     issued_by_user.firstname || ' ' || issued_by_user.lastname AS issued_by_name,
// //                     issued_by_user.email AS issued_by_email,
// //                     lc.card_number,
// //                     lc.id AS card_id
// //                    FROM demo.book_issues bi
// //                    LEFT JOIN demo.books b ON bi.book_id = b.id
// //                    LEFT JOIN demo."user" issued_to_user ON bi.issued_to = issued_to_user.id
// //                    LEFT JOIN demo."user" issued_by_user ON bi.issued_by = issued_by_user.id
// //                    LEFT JOIN demo.library_members lc ON bi.issued_to = lc.user_id AND lc.is_active = true
// //                    ORDER BY bi.createddate DESC`;
// //     const result = await sql.query(query);

// //     if (result.rows.length > 0) {
// //       return { success: true, data: result.rows };
// //     }

// //     return { success: false, data: [] };
// //   } catch (error) {
// //     console.error("Data not found:", error);
// //     throw error;
// //   }
// // }

// // async function checkbeforeDue() {
// //   let notifications = [];
// //   try {
// //     const response = await getAllBooks();
// //     const submittedBooks = response.data;

// //     const today = new Date();
// //     const tomorrow = new Date();
// //     tomorrow.setDate(today.getDate() + 1);

// //     notifications = [];

// //     submittedBooks.forEach(book => {
// //       const dueDate = new Date(book.due_date);

// //       if (
// //         dueDate.getFullYear() === tomorrow.getFullYear() &&
// //         dueDate.getMonth() === tomorrow.getMonth() &&
// //         dueDate.getDate() === tomorrow.getDate()
// //       ) {
// //         notifications.push({
// //           message: `Your book is due tomorrow. Please return "${book.book_title}"  to avoid penalties.`,
// //           user: book.issued_by,
// //           due_date: dueDate,
// //           return_date: book.return_date,
// //           type: 'due_date',
// //           quantity: 1,
// //         });
// //       }
// //     });

// //     return notifications;

// //   } catch (error) {
// //     console.error("❌ Error:", error);
// //   }
// // }

// // async function getSubmitCountByBookId(bookId) {
// //   try {
// //     if (!schema) throw new Error("Schema not initialized. Call init() first.");

// //     const query = `
// //       SELECT COUNT(*) AS submit_count
// //       FROM ${schema}.book_issues
// //       WHERE book_id = $1 
// //         AND return_date IS NOT NULL 
// //         AND status = 'returned'
// //     `;
// //     const result = await sql.query(query, [bookId]);

// //     return parseInt(result.rows[0].submit_count) || 0;

// //   } catch (error) {
// //     console.error("Error in getSubmitCountByBookId:", error);
// //     throw error;
// //   }
// // }
// // async function sendDueReminder() {
// //   try {
// //     console.log("🚀 Starting due reminder process...");

// //     // Get tomorrow's date properly
// //     const today = new Date();
// //     const tomorrow = new Date(today);
// //     tomorrow.setDate(today.getDate() + 1);

// //     // Format for database query (YYYY-MM-DD)
// //     const yyyy = tomorrow.getFullYear();
// //     const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
// //     const dd = String(tomorrow.getDate()).padStart(2, "0");
// //     const tomorrowStr = `${yyyy}-${mm}-${dd}`;

// //     console.log(`📅 Looking for books due on: ${tomorrowStr}`);
// //     console.log(`Today: ${today.toISOString().split('T')[0]}`);

// //     // Optimized query with proper joins
// //     const query = `
// //       SELECT 
// //         bi.id,
// //         bi.book_id,
// //         bi.issued_to,
// //         bi.due_date,
// //         b.title AS book_title,
// //         COALESCE(b.author, '-') AS author,
// //         COALESCE(u.email, m.email) AS student_email,
// //         COALESCE(
// //           CONCAT(u.first_name, ' ', u.last_name),
// //           CONCAT(m.first_name, ' ', m.last_name),
// //           'Library User'
// //         ) AS student_name
// //       FROM demo.book_issues bi
// //       INNER JOIN demo.books b ON bi.book_id = b.id
// //       LEFT JOIN demo.user u ON bi.issued_to = u.id
// //       LEFT JOIN demo.library_members m ON bi.issued_to = m.id
// //       WHERE DATE(bi.due_date) = $1 
// //         AND bi.return_date IS NULL
// //         AND bi.status IN ('issued', 'active', NULL)
// //       ORDER BY bi.issued_to
// //     `;

// //     console.log("🔍 Executing query for due books...");
// //     const result = await sql.query(query, [tomorrowStr]);
// //     console.log(`📚 Found ${result.rows.length} due books for tomorrow`);

// //     if (result.rows.length === 0) {
// //       console.log("✅ No books due tomorrow.");
// //       return;
// //     }

// //     // Group books by student
// //     const groupedByStudent = {};

// //     for (const book of result.rows) {
// //       const studentId = book.issued_to;

// //       if (!groupedByStudent[studentId]) {
// //         groupedByStudent[studentId] = {
// //           email: book.student_email,
// //           name: book.student_name,
// //           books: []
// //         };
// //       }

// //       groupedByStudent[studentId].books.push({
// //         name: book.book_title,
// //         author: book.author,
// //         dueDate: book.due_date
// //       });
// //     }

// //     console.log(`👥 Found ${Object.keys(groupedByStudent).length} students with due books`);

// //     // Send emails
// //     let emailsSent = 0;
// //     let emailsFailed = 0;

// //     for (const studentId in groupedByStudent) {
// //       const student = groupedByStudent[studentId];

// //       // Check if email exists
// //       if (!student.email) {
// //         console.warn(`⚠️ No email found for student ID: ${studentId} (${student.name})`);
// //         emailsFailed++;
// //         continue;
// //       }

// //       // Validate email format
// //       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// //       if (!emailRegex.test(student.email)) {
// //         console.warn(`⚠️ Invalid email format for ${student.name}: ${student.email}`);
// //         emailsFailed++;
// //         continue;
// //       }

// //       try {
// //         console.log(`📧 Preparing email for: ${student.name} (${student.email})`);
// //         console.log(`   Books due: ${student.books.length}`);

// //         // Create HTML content for email
// //         const html = dueTemplate({
// //           studentName: student.name,
// //           books: student.books,
// //           dueDate: tomorrowStr
// //         });

// //         // Send email
// //         await sendMail({
// //           to: student.email,
// //           subject: `📚 Library Reminder: ${student.books.length} Book(s) Due Tomorrow`,
// //           html: html,
// //           text: `Dear ${student.name},\n\nYou have ${student.books.length} book(s) due tomorrow:\n\n${
// //             student.books.map(book => `• ${book.name} by ${book.author}`).join('\n')
// //           }\n\nPlease return or renew them on time.\n\nLibrary Management System`
// //         });

// //         console.log(`✅ Email sent successfully to: ${student.email}`);
// //         emailsSent++;

// //         // Add small delay to avoid overwhelming email service
// //         await new Promise(resolve => setTimeout(resolve, 1000));

// //       } catch (error) {
// //         console.error(`❌ Failed to send email to ${student.email}:`, error.message);
// //         emailsFailed++;
// //       }
// //     }

// //     // Final report
// //     console.log("\n📊 DUE REMINDER REPORT =====================");
// //     console.log(`Total students found: ${Object.keys(groupedByStudent).length}`);
// //     console.log(`Emails sent successfully: ${emailsSent}`);
// //     console.log(`Emails failed: ${emailsFailed}`);
// //     console.log(`Total books processed: ${result.rows.length}`);
// //     console.log("==========================================\n");

// //   } catch (error) {
// //     console.error("💥 CRITICAL ERROR in sendDueReminder:", error);
// //     console.error("Error details:", {
// //       message: error.message,
// //       stack: error.stack?.split('\n')[0],
// //       timestamp: new Date().toISOString()
// //     });
// //   }
// // }

// // async function sendOverdueReminder() {
// //   try {
// //     console.log("🚨 Starting overdue reminder process...");

// //     // Get today's date
// //     const today = new Date();
// //     const todayStr = today.toISOString().split('T')[0];
// //     console.log(`📅 Today's date: ${todayStr}`);

// //     // Get penalty amount
// //     let penaltyPerDay = 0;
// //     try {
// //       const penaltyQuery = `
// //         SELECT per_day_amount 
// //         FROM demo.penalty_master 
// //         WHERE penalty_type = 'late' 
// //           AND is_active = true
// //         LIMIT 1
// //       `;
// //       const penaltyResult = await sql.query(penaltyQuery);

// //       if (penaltyResult.rows.length > 0) {
// //         penaltyPerDay = parseFloat(penaltyResult.rows[0].per_day_amount) || 0;
// //       }
// //       console.log(`💰 Penalty per day: ₹${penaltyPerDay}`);
// //     } catch (penaltyError) {
// //       console.warn("⚠️ Could not fetch penalty settings, using 0");
// //     }

// //     // Query for overdue books
// //     const query = `
// //       SELECT 
// //         bi.id,
// //         bi.book_id,
// //         bi.issued_to,
// //         bi.due_date,
// //         bi.issue_date,
// //         b.title AS book_title,
// //         COALESCE(u.email, m.email) AS student_email,
// //         COALESCE(
// //           CONCAT(u.first_name, ' ', u.last_name),
// //           CONCAT(m.first_name, ' ', m.last_name),
// //           'Library User'
// //         ) AS student_name
// //       FROM demo.book_issues bi
// //       INNER JOIN demo.books b ON bi.book_id = b.id
// //       LEFT JOIN demo.user u ON bi.issued_to = u.id
// //       LEFT JOIN demo.library_members m ON bi.issued_to = m.id
// //       WHERE DATE(bi.due_date) < $1 
// //         AND bi.return_date IS NULL
// //         AND bi.status IN ('issued', 'active', NULL)
// //       ORDER BY bi.due_date, bi.issued_to
// //     `;

// //     console.log("🔍 Executing query for overdue books...");
// //     const result = await sql.query(query, [todayStr]);
// //     console.log(`📚 Found ${result.rows.length} overdue books`);

// //     if (result.rows.length === 0) {
// //       console.log("✅ No overdue books found.");
// //       return;
// //     }

// //     // Process each overdue book
// //     let emailsSent = 0;
// //     let emailsFailed = 0;

// //     for (const book of result.rows) {
// //       if (!book.student_email) {
// //         console.warn(`⚠️ No email for student ID ${book.issued_to}: ${book.student_name}`);
// //         emailsFailed++;
// //         continue;
// //       }

// //       // Calculate overdue days and penalty
// //       const dueDate = new Date(book.due_date);
// //       const timeDiff = today.getTime() - dueDate.getTime();
// //       const overdueDays = Math.max(0, Math.floor(timeDiff / (1000 * 3600 * 24)));
// //       const penaltyAmount = penaltyPerDay * overdueDays;

// //       console.log(`\n📕 Processing: ${book.book_title}`);
// //       console.log(`   Student: ${book.student_name} (${book.student_email})`);
// //       console.log(`   Due Date: ${book.due_date}`);
// //       console.log(`   Overdue Days: ${overdueDays}`);
// //       console.log(`   Penalty: ₹${penaltyAmount}`);

// //       try {
// //         // Create HTML content for overdue email
// //         const html = overdueTemplate({
// //           studentName: book.student_name,
// //           bookName: book.book_title,
// //           dueDate: book.due_date,
// //           issueDate: book.issue_date,
// //           overdueDays: overdueDays,
// //           penaltyAmount: penaltyAmount,
// //           perDayAmount: penaltyPerDay
// //         });

// //         // Send email
// //         await sendMail({
// //           to: book.student_email,
// //           subject: `⏰ URGENT: Overdue Book "${book.book_title}"`,
// //           html: html,
// //           text: `Dear ${book.student_name},\n\nIMPORTANT: Your book "${book.book_title}" is overdue!\n\n` +
// //                 `Due Date: ${book.due_date}\n` +
// //                 `Days Overdue: ${overdueDays}\n` +
// //                 `Penalty Amount: ₹${penaltyAmount}\n\n` +
// //                 `Please return the book immediately to avoid additional charges.\n\n` +
// //                 `Library Management System`
// //         });

// //         console.log(`✅ Overdue reminder sent to: ${book.student_email}`);
// //         emailsSent++;

// //         // Add delay between emails
// //         await new Promise(resolve => setTimeout(resolve, 1000));

// //       } catch (error) {
// //         console.error(`❌ Failed to send overdue email to ${book.student_email}:`, error.message);
// //         emailsFailed++;
// //       }
// //     }

// //     // Final report
// //     console.log("\n📊 OVERDUE REMINDER REPORT =================");
// //     console.log(`Total overdue books found: ${result.rows.length}`);
// //     console.log(`Overdue emails sent successfully: ${emailsSent}`);
// //     console.log(`Overdue emails failed: ${emailsFailed}`);
// //     console.log("==========================================\n");

// //     // Optional: Update database with penalty if needed
// //     if (penaltyPerDay > 0 && emailsSent > 0) {
// //       try {
// //         const updateQuery = `
// //           UPDATE demo.book_issues 
// //           SET penalty_amount = penalty_amount + $1,
// //               last_reminder_date = CURRENT_DATE
// //           WHERE due_date < $2 
// //             AND return_date IS NULL
// //         `;
// //         await sql.query(updateQuery, [penaltyPerDay, todayStr]);
// //         console.log("✅ Penalty amounts updated in database");
// //       } catch (updateError) {
// //         console.warn("⚠️ Could not update penalty amounts:", updateError.message);
// //       }
// //     }

// //   } catch (error) {
// //     console.error("💥 CRITICAL ERROR in sendOverdueReminder:", error);
// //     console.error("Error details:", {
// //       message: error.message,
// //       stack: error.stack?.split('\n')[0],
// //       timestamp: new Date().toISOString()
// //     });
// //   }
// // }

// // // Helper function to run both reminders
// // async function sendAllReminders() {
// //   console.log("🔄 ===== STARTING ALL LIBRARY REMINDERS =====\n");

// //   const startTime = Date.now();

// //   try {
// //     // Run due reminders
// //     await sendDueReminder();

// //     console.log("\n---\n");

// //     // Run overdue reminders
// //     await sendOverdueReminder();

// //   } catch (error) {
// //     console.error("💥 ERROR in sendAllReminders:", error);
// //   } finally {
// //     const endTime = Date.now();
// //     const duration = (endTime - startTime) / 1000;

// //     console.log(`\n✅ All reminders completed in ${duration.toFixed(2)} seconds`);
// //     console.log("===== END LIBRARY REMINDERS =====\n");
// //   }
// // }


// // async function getPenaltyMasters() {
// //   try {
// //     const query = `
// //       SELECT * FROM ${schema}.penalty_master 
// //       WHERE is_active = true
// //       ORDER BY penalty_type
// //     `;
// //     const result = await sql.query(query);

// //     return {
// //       success: true,
// //       data: result.rows
// //     };
// //   } catch (error) {
// //     console.error("Error fetching penalty masters:", error);
// //     throw error;
// //   }
// // }


// // async function calculatePenalty(issue, conditionAfter, bookAmount) {
// //   // Default penalty
// //   let totalPenalty = 0;
// //   let penaltyType = null;
// //   const penalties = [];

// //   // Fetch active penalty master settings
// //   const penaltyRes = await sql.query(
// //     `SELECT * FROM ${schema}.penalty_master WHERE is_active = true`
// //   );
// //   const masters = {};
// //   penaltyRes.rows.forEach(p => {
// //     masters[p.penalty_type.toLowerCase()] = p;
// //   });

// //   const today = new Date();
// //   const dueDate = new Date(issue.due_date);
// //   const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));

// //   // ✅ 1. Lost Book
// //   if (conditionAfter?.toLowerCase() === "lost") {
// //     penaltyType = "lost";
// //     const amount = bookAmount > 0 ? bookAmount : (issue.price || 500);
// //     totalPenalty += amount;
// //     penalties.push({ type: "LOST", amount, description: "Book lost" });
// //   }

// //   // ✅ 2. Damaged Book
// //   if (conditionAfter?.toLowerCase() === "damaged" && masters['damage']) {
// //     penaltyType = "damage";
// //     const damageAmount = masters['damage'].fixed_amount || (bookAmount * 0.1) || 0;
// //     totalPenalty += damageAmount;
// //     penalties.push({ type: "DAMAGE", amount: damageAmount, description: "Book damaged" });
// //   }

// //   // ✅ 3. Late return
// //   if (daysOverdue > 0 && masters['late']) {
// //     penaltyType = "late";
// //     const perDayAmount = masters['late'].per_day_amount || 0;
// //     const lateAmount = perDayAmount * daysOverdue;
// //     totalPenalty += lateAmount;
// //     penalties.push({
// //       type: "LATE",
// //       amount: lateAmount,
// //       description: `${daysOverdue} day(s) overdue`,
// //       daysOverdue,
// //       perDayAmount
// //     });
// //   }

// //   return { totalPenalty, penaltyType, penalties, daysOverdue };
// // }

// // async function checkOverdueStatus(issueId) {
// //   try {
// //     const issueRes = await sql.query(
// //       `SELECT * FROM ${schema}.book_issues WHERE id = $1`,
// //       [issueId]
// //     );

// //     if (!issueRes.rows.length) {
// //       throw new Error("Issue not found");
// //     }

// //     const issue = issueRes.rows[0];

// //     if (issue.return_date) {
// //       return {
// //         isReturned: true,
// //         message: "Book already returned",
// //         returnDate: issue.return_date
// //       };
// //     }

// //     const today = new Date();
// //     const dueDate = new Date(issue.due_date);
// //     const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
// //     const daysRemaining = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

// //     let status = "ON_TIME";
// //     if (daysOverdue > 0) {
// //       status = "OVERDUE";
// //     } else if (daysRemaining <= 2 && daysRemaining >= 0) {
// //       status = "DUE_SOON";
// //     }

// //     return {
// //       isOverdue: daysOverdue > 0,
// //       daysOverdue: daysOverdue,
// //       daysRemaining: daysRemaining,
// //       status: status,
// //       dueDate: issue.due_date,
// //       today: today.toISOString().split('T')[0],
// //       message: daysOverdue > 0
// //         ? `Book is ${daysOverdue} day(s) overdue`
// //         : daysRemaining >= 0
// //           ? `Due in ${daysRemaining} day(s)`
// //           : "Due date calculation error"
// //     };
// //   } catch (err) {
// //     console.error("Error checking overdue status:", err);
// //     throw err;
// //   }
// // }
// // // cron.schedule("0 9 * * *", sendDueReminder);      // due reminder
// // // cron.schedule("0 10 * * *", sendOverdueReminder); // overdue reminder

// // cron.schedule("*/5 * * * * *", sendDueReminder);      // हर 5 सेकंड
// // cron.schedule("*/5 * * * * *", sendOverdueReminder); // हर 5 सेकंड
// // module.exports = {
// //   init,
// //   create,
// //   findById,
// //   findAll,
// //   findByIssueId,
// //   findByBookId,
// //   findByDateRange,
// //   findByLibrarian,
// //   deleteById,
// //   checkbeforeDue,
// //   getAllBooks,
// //   getSubmitCountByBookId,
// //   getPenaltyMasters,
// //   calculatePenalty,
// //   checkOverdueStatus,
// //   sendDueReminder,
// //   sendOverdueReminder
// // };


// /**
//  * @author      Muskan Khan
//  * @date        DEC, 2025
//  * @copyright   www.ibirdsservices.com
//  */

// const sql = require("./db.js");
// const cron = require("node-cron");
// const sendMail = require("../utils/mailer");
// const { dueTemplate, overdueTemplate } = require("../../app/utils/ReminderTemplate");

// let schema = "";

// function init(schema_name) {
//   schema = schema_name;
// }

// async function create(submissionData, userId) {
//   if (!schema) throw new Error("Schema not initialized");
//   if (!submissionData.issue_id) throw new Error("Issue ID required");

//   const issueRes = await sql.query(
//     `SELECT bi.*, b.title, b.isbn, b.author
//      FROM ${schema}.book_issues bi
//      LEFT JOIN ${schema}.books b ON bi.book_id = b.id
//      WHERE bi.id = $1`,
//     [submissionData.issue_id]
//   );

//   if (!issueRes.rows.length) throw new Error("Issue not found");
//   const issue = issueRes.rows[0];

//   if (issue.return_date) throw new Error("Book already returned");

//   // Get library member details
//   const memberRes = await sql.query(
//     `SELECT lm.* FROM ${schema}.library_members lm 
//      WHERE lm.id = $1 AND lm.is_active = true`,
//     [issue.issued_to]
//   );

//   if (!memberRes.rows.length) throw new Error("Library member not found");
//   const member = memberRes.rows[0];

//   const settingRes = await sql.query(
//     `SELECT fine_per_day FROM demo.library_setting LIMIT 1`
//   );
//   const finePerDay = settingRes.rows.length ? Number(settingRes.rows[0].fine_per_day) : 0;

//   const today = new Date();
//   const dueDate = new Date(issue.due_date);
//   const daysOverdue = Math.max(Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24)), 0);
//   let totalPenalty = 0;
//   let penaltyType = null;
//   let penalties = [];

//   if (daysOverdue > 0) {
//     totalPenalty = daysOverdue * finePerDay;
//     penaltyType = "late";
//     penalties.push({
//       type: penaltyType,
//       amount: totalPenalty,
//       daysOverdue
//     });
//   }

//   const submissionRes = await sql.query(
//     `INSERT INTO ${schema}.book_submissions
//       (issue_id, book_id, submitted_by, submit_date,
//        condition_before, condition_after, remarks,
//        days_overdue, createddate, createdbyid)
//      VALUES ($1,$2,$3,CURRENT_DATE,$4,$5,$6,$7,CURRENT_TIMESTAMP,$3)
//      RETURNING *`,
//     [
//       issue.id,
//       issue.book_id,
//       userId,
//       submissionData.condition_before || "good",
//       submissionData.condition_after || "good",
//       submissionData.remarks || "",
//       daysOverdue
//     ]
//   );

//   const submission = submissionRes.rows[0];

//   let companyId = null;
//   if (submissionData.company_id) {
//     const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
//     if (uuidRegex.test(submissionData.company_id)) companyId = submissionData.company_id;
//   }

//   if (totalPenalty > 0) {
//     await sql.query(
//       `INSERT INTO ${schema}.penalty_master
//        (company_id, penalty_type, book_id, issue_id,
//         book_title, isbn, issued_to, card_number,
//         issue_date, due_date,
//         condition_before, condition_after,
//         book_amount, createdbyid)
//        VALUES
//        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
//       [
//         companyId,
//         penaltyType,
//         issue.book_id,
//         issue.id,
//         issue.title,
//         issue.isbn,
//         member.id,
//         member.card_number || null,
//         issue.issue_date,
//         issue.due_date,
//         submissionData.condition_before || "good",
//         submissionData.condition_after || "good",
//         totalPenalty,
//         userId
//       ]
//     );
//   }

//   await sql.query(
//     `UPDATE ${schema}.book_issues
//      SET return_date = CURRENT_DATE, status = 'returned', lastmodifieddate = CURRENT_TIMESTAMP,
//          lastmodifiedbyid = $2
//      WHERE id = $1`,
//     [issue.id, userId]
//   );

//   return {
//     success: true,
//     message: "Book submitted successfully",
//     data: {
//       submission_id: submission.id,
//       totalPenalty,
//       penaltyType,
//       daysOverdue,
//       penalties,
//       member_name: `${member.first_name} ${member.last_name}`,
//       member_email: member.email
//     }
//   };
// }

// async function findById(id) {
//   try {
//     if (!schema) {
//       throw new Error("Schema not initialized. Call init() first.");
//     }
//     const query = `SELECT 
//                     bs.*,
//                     bi.issued_to,
//                     bi.issue_date,
//                     bi.due_date,
//                     b.title AS book_title,
//                     b.isbn AS book_isbn,
//                     b.author AS book_author,
//                     lm.first_name || ' ' || lm.last_name AS student_name,
//                     lm.email AS student_email,
//                     lm.card_number,
//                     submitted_user.first_name || ' ' || submitted_user.last_name AS submitted_by_name
//                    FROM ${schema}.book_submissions bs
//                    LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
//                    LEFT JOIN ${schema}.books b ON bs.book_id = b.id
//                    LEFT JOIN ${schema}.library_members lm ON bi.issued_to = lm.id
//                    LEFT JOIN ${schema}.library_members submitted_user ON bs.submitted_by = submitted_user.id
//                    WHERE bs.id = $1`;
//     const result = await sql.query(query, [id]);
//     if (result.rows.length > 0) {
//       return result.rows[0];
//     }
//     return null;
//   } catch (error) {
//     console.error("Error in findById:", error);
//     throw error;
//   }
// }

// async function findAll() {
//   try {
//     if (!schema) {
//       throw new Error("Schema not initialized. Call init() first.");
//     }
//     const query = `SELECT 
//                     bs.*,
//                     bi.issued_to,
//                     bi.issue_date,
//                     bi.due_date,
//                     b.title AS book_title,
//                     b.isbn AS book_isbn,
//                     b.author AS book_author,
//                     lm.first_name || ' ' || lm.last_name AS student_name,
//                     lm.email AS student_email,
//                     lm.card_number,
//                     submitted_user.first_name || ' ' || submitted_user.last_name AS submitted_by_name
//                    FROM ${schema}.book_submissions bs
//                    LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
//                    LEFT JOIN ${schema}.books b ON bs.book_id = b.id
//                    LEFT JOIN ${schema}.library_members lm ON bi.issued_to = lm.id
//                    LEFT JOIN ${schema}.library_members submitted_user ON bs.submitted_by = submitted_user.id
//                    ORDER BY bs.createddate DESC`;
//     const result = await sql.query(query);
//     return result.rows.length > 0 ? result.rows : [];
//   } catch (error) {
//     console.error("Error in findAll:", error);
//     throw error;
//   }
// }

// async function findByIssueId(issueId) {
//   try {
//     if (!schema) {
//       throw new Error("Schema not initialized. Call init() first.");
//     }
//     const query = `SELECT 
//                     bs.*,
//                     bi.issued_to,
//                     bi.issue_date,
//                     bi.due_date,
//                     b.title AS book_title,
//                     b.isbn AS book_isbn,
//                     b.author AS book_author,
//                     lm.first_name || ' ' || lm.last_name AS student_name,
//                     lm.email AS student_email,
//                     lm.card_number,
//                     submitted_user.first_name || ' ' || submitted_user.last_name AS submitted_by_name
//                    FROM ${schema}.book_submissions bs
//                    LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
//                    LEFT JOIN ${schema}.books b ON bs.book_id = b.id
//                    LEFT JOIN ${schema}.library_members lm ON bi.issued_to = lm.id
//                    LEFT JOIN ${schema}.library_members submitted_user ON bs.submitted_by = submitted_user.id
//                    WHERE bs.issue_id = $1`;
//     const result = await sql.query(query, [issueId]);
//     return result.rows.length > 0 ? result.rows : [];
//   } catch (error) {
//     console.error("Error in findByIssueId:", error);
//     throw error;
//   }
// }

// async function findByBookId(bookId) {
//   try {
//     if (!schema) {
//       throw new Error("Schema not initialized. Call init() first.");
//     }
//     const query = `SELECT 
//                     bs.*,
//                     bi.issued_to,
//                     bi.issue_date,
//                     bi.due_date,
//                     b.title AS book_title,
//                     b.isbn AS book_isbn,
//                     b.author AS book_author,
//                     lm.first_name || ' ' || lm.last_name AS student_name,
//                     lm.email AS student_email,
//                     lm.card_number,
//                     submitted_user.first_name || ' ' || submitted_user.last_name AS submitted_by_name
//                    FROM ${schema}.book_submissions bs
//                    LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
//                    LEFT JOIN ${schema}.books b ON bs.book_id = b.id
//                    LEFT JOIN ${schema}.library_members lm ON bi.issued_to = lm.id
//                    LEFT JOIN ${schema}.library_members submitted_user ON bs.submitted_by = submitted_user.id
//                    WHERE bs.book_id = $1
//                    ORDER BY bs.createddate DESC`;
//     const result = await sql.query(query, [bookId]);
//     return result.rows.length > 0 ? result.rows : [];
//   } catch (error) {
//     console.error("Error in findByBookId:", error);
//     throw error;
//   }
// }

// async function findByDateRange(startDate, endDate) {
//   try {
//     if (!schema) {
//       throw new Error("Schema not initialized. Call init() first.");
//     }
//     const query = `SELECT 
//                     bs.*,
//                     bi.issued_to,
//                     bi.issue_date,
//                     bi.due_date,
//                     b.title AS book_title,
//                     b.isbn AS book_isbn,
//                     b.author AS book_author,
//                     lm.first_name || ' ' || lm.last_name AS student_name,
//                     lm.email AS student_email,
//                     lm.card_number,
//                     submitted_user.first_name || ' ' || submitted_user.last_name AS submitted_by_name
//                    FROM ${schema}.book_submissions bs
//                    LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
//                    LEFT JOIN ${schema}.books b ON bs.book_id = b.id
//                    LEFT JOIN ${schema}.library_members lm ON bi.issued_to = lm.id
//                    LEFT JOIN ${schema}.library_members submitted_user ON bs.submitted_by = submitted_user.id
//                    WHERE bs.submit_date >= $1 AND bs.submit_date <= $2
//                    ORDER BY bs.createddate DESC`;
//     const result = await sql.query(query, [startDate, endDate]);
//     return result.rows.length > 0 ? result.rows : [];
//   } catch (error) {
//     console.error("Error in findByDateRange:", error);
//     throw error;
//   }
// }

// async function findByLibrarian(librarianId) {
//   try {
//     if (!schema) {
//       throw new Error("Schema not initialized. Call init() first.");
//     }
//     const query = `SELECT 
//                     bs.*,
//                     bi.issued_to,
//                     bi.issue_date,
//                     bi.due_date,
//                     b.title AS book_title,
//                     b.isbn AS book_isbn,
//                     b.author AS book_author,
//                     lm.first_name || ' ' || lm.last_name AS student_name,
//                     lm.email AS student_email,
//                     lm.card_number,
//                     submitted_user.first_name || ' ' || submitted_user.last_name AS submitted_by_name
//                    FROM ${schema}.book_submissions bs
//                    LEFT JOIN ${schema}.book_issues bi ON bs.issue_id = bi.id
//                    LEFT JOIN ${schema}.books b ON bs.book_id = b.id
//                    LEFT JOIN ${schema}.library_members lm ON bi.issued_to = lm.id
//                    LEFT JOIN ${schema}.library_members submitted_user ON bs.submitted_by = submitted_user.id
//                    WHERE bs.submitted_by = $1
//                    ORDER BY bs.createddate DESC`;
//     const result = await sql.query(query, [librarianId]);
//     return result.rows.length > 0 ? result.rows : [];
//   } catch (error) {
//     console.error("Error in findByLibrarian:", error);
//     throw error;
//   }
// }

// async function deleteById(id) {
//   try {
//     const query = `DELETE FROM ${schema}.book_submissions WHERE id = $1 RETURNING *`;
//     const result = await sql.query(query, [id]);
//     if (result.rows.length > 0) {
//       return { success: true, message: "Submission deleted successfully" };
//     }
//     return { success: false, message: "Submission not found" };
//   } catch (error) {
//     console.error("Error in deleteById:", error);
//     throw error;
//   }
// }

// async function getAllBooks() {
//   try {
//     const query = `SELECT 
//                     bi.*,
//                     b.title AS book_title,
//                     b.isbn AS book_isbn,
//                     b.author AS book_author,
//                     lm.first_name || ' ' || lm.last_name AS student_name,
//                     lm.email AS student_email,
//                     lm.card_number,

//                     issued_by_lm.first_name || ' ' || issued_by_lm.last_name AS issued_by_name,
//                     issued_by_lm.email AS issued_by_email
//                    FROM demo.book_issues bi
//                    LEFT JOIN demo.books b ON bi.book_id = b.id
//                    LEFT JOIN demo.library_members lm ON bi.issued_to = lm.id
//                    LEFT JOIN demo.library_members issued_by_lm ON bi.issued_by = issued_by_lm.id
//                    WHERE lm.is_active = true
//                    ORDER BY bi.createddate DESC`;
//     const result = await sql.query(query);

//     if (result.rows.length > 0) {
//       return { success: true, data: result.rows };
//     }

//     return { success: false, data: [] };
//   } catch (error) {
//     console.error("Data not found:", error);
//     throw error;
//   }
// }

// async function checkbeforeDue() {
//   let notifications = [];
//   try {
//     const response = await getAllBooks();
//     const submittedBooks = response.data;

//     const today = new Date();
//     const tomorrow = new Date();
//     tomorrow.setDate(today.getDate() + 1);

//     notifications = [];

//     submittedBooks.forEach(book => {
//       const dueDate = new Date(book.due_date);

//       if (
//         dueDate.getFullYear() === tomorrow.getFullYear() &&
//         dueDate.getMonth() === tomorrow.getMonth() &&
//         dueDate.getDate() === tomorrow.getDate()
//       ) {
//         notifications.push({
//           message: `Your book is due tomorrow. Please return "${book.book_title}" to avoid penalties.`,
//           student_name: book.student_name,
//           student_email: book.student_email,
//           due_date: dueDate,
//           return_date: book.return_date,
//           type: 'due_date',
//           quantity: 1,
//         });
//       }
//     });

//     return notifications;

//   } catch (error) {
//     console.error("❌ Error:", error);
//   }
// }

// async function getSubmitCountByBookId(bookId) {
//   try {
//     if (!schema) throw new Error("Schema not initialized. Call init() first.");

//     const query = `
//       SELECT COUNT(*) AS submit_count
//       FROM ${schema}.book_issues
//       WHERE book_id = $1 
//         AND return_date IS NOT NULL 
//         AND status = 'returned'
//     `;
//     const result = await sql.query(query, [bookId]);

//     return parseInt(result.rows[0].submit_count) || 0;

//   } catch (error) {
//     console.error("Error in getSubmitCountByBookId:", error);
//     throw error;
//   }
// }

// async function sendDueReminder() {
//   try {
//     console.log("🚀 Starting due reminder process...");

//     // Get tomorrow's date properly
//     const today = new Date();
//     const tomorrow = new Date(today);
//     tomorrow.setDate(today.getDate() + 1);

//     // Format for database query (YYYY-MM-DD)
//     const tomorrowStr = tomorrow.toISOString().split('T')[0];

//     console.log(`📅 Looking for books due on: ${tomorrowStr}`);
//     console.log(`Today: ${today.toISOString().split('T')[0]}`);

//     // Query using library_members table - AUTHOR COLUMN REMOVED
//     const query = `
//       SELECT 
//         bi.id,
//         bi.book_id,
//         bi.issued_to,
//         bi.due_date,
//         b.title AS book_title,
//         lm.email AS student_email,
//         CONCAT(lm.first_name, ' ', lm.last_name) AS student_name,
//         lm.card_number

//       FROM demo.book_issues bi
//       INNER JOIN demo.books b ON bi.book_id = b.id
//       INNER JOIN demo.library_members lm ON bi.issued_to = lm.id
//       WHERE DATE(bi.due_date) = $1 
//         AND bi.return_date IS NULL
//         AND bi.status IN ('issued', 'active', NULL)
//         AND lm.is_active = true
//       ORDER BY lm.email, bi.due_date
//     `;

//     console.log("🔍 Executing query for due books...");
//     const result = await sql.query(query, [tomorrowStr]);
//     console.log(`📚 Found ${result.rows.length} due books for tomorrow`);

//     if (result.rows.length === 0) {
//       console.log("✅ No books due tomorrow.");
//       return;
//     }

//     // Group books by library member
//     const groupedByMember = {};

//     for (const book of result.rows) {
//       const memberId = book.issued_to;

//       if (!groupedByMember[memberId]) {
//         groupedByMember[memberId] = {
//           email: book.student_email,
//           name: book.student_name,
//           card_number: book.card_number,
//           phone: book.phone,
//           books: []
//         };
//       }

//       groupedByMember[memberId].books.push({
//         name: book.book_title,
//         dueDate: book.due_date
//       });
//     }

//     console.log(`👥 Found ${Object.keys(groupedByMember).length} library members with due books`);

//     // Send emails
//     let emailsSent = 0;
//     let emailsFailed = 0;

//     for (const memberId in groupedByMember) {
//       const member = groupedByMember[memberId];

//       // Check if email exists
//       if (!member.email) {
//         console.warn(`⚠️ No email found for library member ID: ${memberId} (${member.name})`);
//         emailsFailed++;
//         continue;
//       }

//       // Validate email format
//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if (!emailRegex.test(member.email)) {
//         console.warn(`⚠️ Invalid email format for ${member.name}: ${member.email}`);
//         emailsFailed++;
//         continue;
//       }

//       try {
//         console.log(`📧 Preparing email for: ${member.name} (${member.email})`);
//         console.log(`   Books due: ${member.books.length}`);
//         console.log(`   Card Number: ${member.card_number || 'N/A'}`);

//         // Create HTML content for email (without author)
//         const html = dueTemplate({
//           studentName: member.name,
//           books: member.books,
//           dueDate: tomorrowStr,
//           cardNumber: member.card_number
//         });

//         // Send email
//         await sendMail({
//           to: member.email,
//           subject: `📚 Library Reminder: ${member.books.length} Book(s) Due Tomorrow`,
//           html: html,
//           text: `Dear ${member.name},\n\nYou have ${member.books.length} book(s) due tomorrow:\n\n${member.books.map(book => `• ${book.name}`).join('\n')
//             }\n\nDue Date: ${tomorrowStr}\nCard Number: ${member.card_number || 'N/A'}\n\nPlease return or renew them on time.\n\nLibrary Management System`
//         });

//         console.log(`✅ Email sent successfully to: ${member.email}`);
//         emailsSent++;

//         // Add small delay to avoid overwhelming email service
//         await new Promise(resolve => setTimeout(resolve, 1000));

//       } catch (error) {
//         console.error(`❌ Failed to send email to ${member.email}:`, error.message);
//         emailsFailed++;
//       }
//     }

//     // Final report
//     console.log("\n📊 DUE REMINDER REPORT =====================");
//     console.log(`Total library members found: ${Object.keys(groupedByMember).length}`);
//     console.log(`Emails sent successfully: ${emailsSent}`);
//     console.log(`Emails failed: ${emailsFailed}`);
//     console.log(`Total books processed: ${result.rows.length}`);
//     console.log("==========================================\n");

//   } catch (error) {
//     console.error("💥 CRITICAL ERROR in sendDueReminder:", error);
//     console.error("Error details:", {
//       message: error.message,
//       stack: error.stack?.split('\n')[0],
//       timestamp: new Date().toISOString()
//     });
//   }
// }

// async function sendOverdueReminder() {
//   try {
//     console.log("🚨 Starting overdue reminder process...");

//     // Get today's date
//     const today = new Date();
//     const todayStr = today.toISOString().split('T')[0];
//     console.log(`📅 Today's date: ${todayStr}`);

//     // Get penalty amount
//     let penaltyPerDay = 0;
//     try {
//       const penaltyQuery = `
//         SELECT per_day_amount 
//         FROM demo.penalty_master 
//         WHERE penalty_type = 'late' 
//           AND is_active = true
//         LIMIT 1
//       `;
//       const penaltyResult = await sql.query(penaltyQuery);

//       if (penaltyResult.rows.length > 0) {
//         penaltyPerDay = parseFloat(penaltyResult.rows[0].per_day_amount) || 0;
//       }
//       console.log(`💰 Penalty per day: ₹${penaltyPerDay}`);
//     } catch (penaltyError) {
//       console.warn("⚠️ Could not fetch penalty settings, using 0");
//     }

//     // Query for overdue books using library_members
//     const query = `
//   SELECT 
//     bi.id,
//     bi.book_id,
//     bi.issued_to,
//     bi.due_date,
//     bi.issue_date,
//     b.title AS book_title,

//     lm.email AS student_email,
//     CONCAT(lm.first_name, ' ', lm.last_name) AS student_name,
//     lm.card_number,

//   FROM demo.book_issues bi, 
//   INNER JOIN demo.books b ON bi.book_id = b.id
//   INNER JOIN demo.library_members lm ON bi.issued_to = lm.id
//   WHERE DATE(bi.due_date) < $1 
//     AND bi.return_date IS NULL
//     AND bi.status IN ('issued', 'active', NULL)
//     AND lm.is_active = true
//   ORDER BY bi.due_date, lm.email
// `;

//     console.log("🔍 Executing query for overdue books...");
//     const result = await sql.query(query, [todayStr]);
//     console.log(`📚 Found ${result.rows.length} overdue books`);

//     if (result.rows.length === 0) {
//       console.log("✅ No overdue books found.");
//       return;
//     }

//     // Process each overdue book
//     let emailsSent = 0;
//     let emailsFailed = 0;

//     for (const book of result.rows) {
//       if (!book.student_email) {
//         console.warn(`⚠️ No email for library member ID ${book.issued_to}: ${book.student_name}`);
//         emailsFailed++;
//         continue;
//       }

//       // Calculate overdue days and penalty
//       const dueDate = new Date(book.due_date);
//       const timeDiff = today.getTime() - dueDate.getTime();
//       const overdueDays = Math.max(0, Math.floor(timeDiff / (1000 * 3600 * 24)));
//       const penaltyAmount = penaltyPerDay * overdueDays;

//       console.log(`\n📕 Processing: ${book.book_title}`);
//       console.log(`   Library Member: ${book.student_name} (${book.student_email})`);
//       console.log(`   Card Number: ${book.card_number || 'N/A'}`);
//       console.log(`   Due Date: ${book.due_date}`);
//       console.log(`   Overdue Days: ${overdueDays}`);
//       console.log(`   Penalty: ₹${penaltyAmount}`);

//       try {
//         // Create HTML content for overdue email
//         const html = overdueTemplate({
//           studentName: book.student_name,
//           bookName: book.book_title,
//           dueDate: book.due_date,
//           issueDate: book.issue_date,
//           overdueDays: overdueDays,
//           penaltyAmount: penaltyAmount,
//           perDayAmount: penaltyPerDay,
//           cardNumber: book.card_number
//         });

//         // Send email
//         await sendMail({
//           to: book.student_email,
//           subject: `⏰ URGENT: Overdue Book "${book.book_title}"`,
//           html: html,
//           text: `Dear ${book.student_name},\n\nIMPORTANT: Your book "${book.book_title}" is overdue!\n\n` +
//             `Card Number: ${book.card_number || 'N/A'}\n` +
//             `Due Date: ${book.due_date}\n` +
//             `Days Overdue: ${overdueDays}\n` +
//             `Penalty Amount: ₹${penaltyAmount}\n\n` +
//             `Please return the book immediately to avoid additional charges.\n\n` +
//             `Library Management System`
//         });

//         console.log(`✅ Overdue reminder sent to: ${book.student_email}`);
//         emailsSent++;

//         // Add delay between emails
//         await new Promise(resolve => setTimeout(resolve, 1000));

//       } catch (error) {
//         console.error(`❌ Failed to send overdue email to ${book.student_email}:`, error.message);
//         emailsFailed++;
//       }
//     }

//     // Final report
//     console.log("\n📊 OVERDUE REMINDER REPORT =================");
//     console.log(`Total overdue books found: ${result.rows.length}`);
//     console.log(`Overdue emails sent successfully: ${emailsSent}`);
//     console.log(`Overdue emails failed: ${emailsFailed}`);
//     console.log("==========================================\n");

//   } catch (error) {
//     console.error("💥 CRITICAL ERROR in sendOverdueReminder:", error);
//     console.error("Error details:", {
//       message: error.message,
//       stack: error.stack?.split('\n')[0],
//       timestamp: new Date().toISOString()
//     });
//   }
// }

// // Helper function to run both reminders
// async function sendAllReminders() {
//   console.log("🔄 ===== STARTING ALL LIBRARY REMINDERS =====\n");

//   const startTime = Date.now();

//   try {
//     // Run due reminders
//     await sendDueReminder();

//     console.log("\n---\n");

//     // Run overdue reminders
//     await sendOverdueReminder();

//   } catch (error) {
//     console.error("💥 ERROR in sendAllReminders:", error);
//   } finally {
//     const endTime = Date.now();
//     const duration = (endTime - startTime) / 1000;

//     console.log(`\n✅ All reminders completed in ${duration.toFixed(2)} seconds`);
//     console.log("===== END LIBRARY REMINDERS =====\n");
//   }
// }

// async function getPenaltyMasters() {
//   try {
//     const query = `
//       SELECT * FROM ${schema}.penalty_master 
//       WHERE is_active = true
//       ORDER BY penalty_type
//     `;
//     const result = await sql.query(query);

//     return {
//       success: true,
//       data: result.rows
//     };
//   } catch (error) {
//     console.error("Error fetching penalty masters:", error);
//     throw error;
//   }
// }

// async function calculatePenalty(issue, conditionAfter, bookAmount) {
//   // Default penalty
//   let totalPenalty = 0;
//   let penaltyType = null;
//   const penalties = [];

//   // Fetch active penalty master settings
//   const penaltyRes = await sql.query(
//     `SELECT * FROM ${schema}.penalty_master WHERE is_active = true`
//   );
//   const masters = {};
//   penaltyRes.rows.forEach(p => {
//     masters[p.penalty_type.toLowerCase()] = p;
//   });

//   const today = new Date();
//   const dueDate = new Date(issue.due_date);
//   const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));

//   // ✅ 1. Lost Book
//   if (conditionAfter?.toLowerCase() === "lost") {
//     penaltyType = "lost";
//     const amount = bookAmount > 0 ? bookAmount : (issue.price || 500);
//     totalPenalty += amount;
//     penalties.push({ type: "LOST", amount, description: "Book lost" });
//   }

//   // ✅ 2. Damaged Book
//   if (conditionAfter?.toLowerCase() === "damaged" && masters['damage']) {
//     penaltyType = "damage";
//     const damageAmount = masters['damage'].fixed_amount || (bookAmount * 0.1) || 0;
//     totalPenalty += damageAmount;
//     penalties.push({ type: "DAMAGE", amount: damageAmount, description: "Book damaged" });
//   }

//   // ✅ 3. Late return
//   if (daysOverdue > 0 && masters['late']) {
//     penaltyType = "late";
//     const perDayAmount = masters['late'].per_day_amount || 0;
//     const lateAmount = perDayAmount * daysOverdue;
//     totalPenalty += lateAmount;
//     penalties.push({
//       type: "LATE",
//       amount: lateAmount,
//       description: `${daysOverdue} day(s) overdue`,
//       daysOverdue,
//       perDayAmount
//     });
//   }

//   return { totalPenalty, penaltyType, penalties, daysOverdue };
// }

// async function checkOverdueStatus(issueId) {
//   try {
//     const issueRes = await sql.query(
//       `SELECT bi.*, lm.email, lm.first_name, lm.last_name
//        FROM ${schema}.book_issues bi
//        LEFT JOIN ${schema}.library_members lm ON bi.issued_to = lm.id
//        WHERE bi.id = $1`,
//       [issueId]
//     );

//     if (!issueRes.rows.length) {
//       throw new Error("Issue not found");
//     }

//     const issue = issueRes.rows[0];

//     if (issue.return_date) {
//       return {
//         isReturned: true,
//         message: "Book already returned",
//         returnDate: issue.return_date,
//         member_name: `${issue.first_name} ${issue.last_name}`,
//         member_email: issue.email
//       };
//     }

//     const today = new Date();
//     const dueDate = new Date(issue.due_date);
//     const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
//     const daysRemaining = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

//     let status = "ON_TIME";
//     if (daysOverdue > 0) {
//       status = "OVERDUE";
//     } else if (daysRemaining <= 2 && daysRemaining >= 0) {
//       status = "DUE_SOON";
//     }

//     return {
//       isOverdue: daysOverdue > 0,
//       daysOverdue: daysOverdue,
//       daysRemaining: daysRemaining,
//       status: status,
//       dueDate: issue.due_date,
//       today: today.toISOString().split('T')[0],
//       member_name: `${issue.first_name} ${issue.last_name}`,
//       member_email: issue.email,
//       message: daysOverdue > 0
//         ? `Book is ${daysOverdue} day(s) overdue`
//         : daysRemaining >= 0
//           ? `Due in ${daysRemaining} day(s)`
//           : "Due date calculation error"
//     };
//   } catch (err) {
//     console.error("Error checking overdue status:", err);
//     throw err;
//   }
// }

// // Test के लिए 5 सेकंड में (comment करें production में)
// // cron.schedule("*/5 * * * * *", sendDueReminder);      // हर 5 सेकंड
// // cron.schedule("*/5 * * * * *", sendOverdueReminder); // हर 5 सेकंड

// // Production के लिए (uncomment करें जब टेस्ट complete हो जाए)
// // cron.schedule("0 9 * * *", sendDueReminder);      // रोज सुबह 9:00 बजे
// // cron.schedule("0 10 * * *", sendOverdueReminder); // रोज सुबह 10:00 बजे

// module.exports = {
//   init,
//   create,
//   findById,
//   findAll,
//   findByIssueId,
//   findByBookId,
//   findByDateRange,
//   findByLibrarian,
//   deleteById,
//   checkbeforeDue,
//   getAllBooks,
//   getSubmitCountByBookId,
//   getPenaltyMasters,
//   calculatePenalty,
//   checkOverdueStatus,
//   sendDueReminder,
//   sendOverdueReminder,
//   sendAllReminders
// };


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

// Track emails sent today to prevent duplicates
const emailTracker = {
  due: {},    // Format: { "memberId_date": true }
  overdue: {} // Format: { "memberId_bookId_date": true }
};

function init(schema_name) {
  schema = schema_name;
}

async function create(submissionData, userId) {
  if (!schema) throw new Error("Schema not initialized");
  if (!submissionData.issue_id) throw new Error("Issue ID required");

  const issueRes = await sql.query(
    `SELECT bi.*, b.title, b.isbn
     FROM ${schema}.book_issues bi
     LEFT JOIN ${schema}.books b ON bi.book_id = b.id
     WHERE bi.id = $1`,
    [submissionData.issue_id]
  );

  if (!issueRes.rows.length) throw new Error("Issue not found");
  const issue = issueRes.rows[0];

  if (issue.return_date) throw new Error("Book already returned");

  // Get library member details
  const memberRes = await sql.query(
    `SELECT lm.* FROM ${schema}.library_members lm 
     WHERE lm.id = $1 AND lm.is_active = true`,
    [issue.issued_to]
  );

  if (!memberRes.rows.length) throw new Error("Library member not found");
  const member = memberRes.rows[0];

  const settingRes = await sql.query(
    `SELECT fine_per_day FROM demo.library_setting LIMIT 1`
  );
  const finePerDay = settingRes.rows.length ? Number(settingRes.rows[0].fine_per_day) : 0;

  const today = new Date();
  const dueDate = new Date(issue.due_date);
  const daysOverdue = Math.max(Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24)), 0);
  let totalPenalty = 0;
  let penaltyType = null;
  let penalties = [];

  if (daysOverdue > 0) {
    totalPenalty = daysOverdue * finePerDay;
    penaltyType = "late";
    penalties.push({
      type: penaltyType,
      amount: totalPenalty,
      daysOverdue
    });
  }

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
      submissionData.condition_before || "good",
      submissionData.condition_after || "good",
      submissionData.remarks || "",
      daysOverdue
    ]
  );

  const submission = submissionRes.rows[0];

  let companyId = null;
  if (submissionData.company_id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(submissionData.company_id)) companyId = submissionData.company_id;
  }

  if (totalPenalty > 0) {
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
        submissionData.condition_before || "good",
        submissionData.condition_after || "good",
        totalPenalty,
        userId
      ]
    );
  }

  await sql.query(
    `UPDATE ${schema}.book_issues
     SET return_date = CURRENT_DATE, status = 'returned', lastmodifieddate = CURRENT_TIMESTAMP,
         lastmodifiedbyid = $2
     WHERE id = $1`,
    [issue.id, userId]
  );

  return {
    success: true,
    message: "Book submitted successfully",
    data: {
      submission_id: submission.id,
      totalPenalty,
      penaltyType,
      daysOverdue,
      penalties,
      member_name: `${member.first_name} ${member.last_name}`,
      member_email: member.email
    }
  };
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
  sendAllReminders
};