/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */
const sql = require("./db.js");
let schema = "";
let branchId = null;

function init(schema_name, branch_id = null) {
  schema = schema_name;
  branchId = branch_id;
}

async function getDashboardStats() {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    console.log("Getting dashboard stats for schema:", schema);
    console.log("Getting dashboard stats for branch:", branchId || "All Branches");
    const totalBooksQuery = `SELECT COUNT(*) as count FROM ${schema}.books WHERE branch_id = $1`;
    const totalBooksResult = await sql.query(totalBooksQuery, [branchId]);
    const totalBooks = parseInt(totalBooksResult.rows[0]?.count || 0);

    const availableBooksQuery = `SELECT SUM(available_copies) as count FROM ${schema}.books WHERE available_copies > 0 AND branch_id = $1`;
    const availableBooksResult = await sql.query(availableBooksQuery, [branchId]);
    const availableBooks = parseInt(availableBooksResult.rows[0]?.count || 0);

    const totalAuthorsQuery = `SELECT COUNT(*) as count FROM ${schema}.authors`;
    const totalAuthorsResult = await sql.query(totalAuthorsQuery);
    const totalAuthors = parseInt(totalAuthorsResult.rows[0]?.count || 0);

    const totalCategoriesQuery = `SELECT COUNT(*) as count FROM ${schema}.categories`;
    const totalCategoriesResult = await sql.query(totalCategoriesQuery);
    const totalCategories = parseInt(totalCategoriesResult.rows[0]?.count || 0);

    const booksByCategoryQuery = `
      SELECT 
        c.name as category_name,
        COUNT(b.id) as book_count
      FROM ${schema}.categories c
      LEFT JOIN ${schema}.books b ON c.id = b.category_id AND b.branch_id = $1
      GROUP BY c.id, c.name
      ORDER BY book_count DESC
      LIMIT 10
    `;
    const booksByCategoryResult = await sql.query(booksByCategoryQuery,[branchId]);

    const booksByAuthorQuery = `
      SELECT 
        a.name as author_name,
        COUNT(b.id) as book_count
      FROM ${schema}.authors a
      LEFT JOIN ${schema}.books b ON a.id = b.author_id AND b.branch_id = $1
      GROUP BY a.id, a.name
      ORDER BY book_count DESC
      LIMIT 10
    `;
    const booksByAuthorResult = await sql.query(booksByAuthorQuery, [branchId]);


    const totalCopiesQuery = `SELECT SUM(total_copies) as total FROM ${schema}.books WHERE branch_id = $1`;
    const totalCopiesResult = await sql.query(totalCopiesQuery, [branchId]);
    const totalCopies = parseInt(totalCopiesResult.rows[0]?.total || 0);

    const issuedBooks = totalCopies - availableBooks;
    const issuedPercentage = totalCopies > 0 ? Math.round((issuedBooks / totalCopies) * 100) : 0;
    const availablePercentage = totalCopies > 0 ? Math.round((availableBooks / totalCopies) * 100) : 0;

    const monthlyTrendQuery = `
      SELECT 
        TO_CHAR(createddate, 'Mon YYYY') as month,
        COUNT(*) as count
      FROM ${schema}.books
      WHERE createddate >= NOW() - INTERVAL '6 months' AND branch_id = $1
      GROUP BY TO_CHAR(createddate, 'Mon YYYY'), DATE_TRUNC('month', createddate)
      ORDER BY DATE_TRUNC('month', createddate) ASC
      LIMIT 6
    `;
    const monthlyTrendResult = await sql.query(monthlyTrendQuery, [branchId]);

    const booksThisMonthQuery = `
      SELECT COUNT(*) as count 
      FROM ${schema}.books 
      WHERE DATE_TRUNC('month', createddate) = DATE_TRUNC('month', CURRENT_DATE) AND branch_id = $1
    `;
    const booksThisMonthResult = await sql.query(booksThisMonthQuery, [branchId]);
    const booksThisMonth = parseInt(booksThisMonthResult.rows[0]?.count || 0);

    const dailyActivityQuery = `
      SELECT 
        DATE(createddate) as date,
        COUNT(*) as count
      FROM ${schema}.books
      WHERE createddate >= CURRENT_DATE - INTERVAL '7 days' AND branch_id = $1
      GROUP BY DATE(createddate)
      ORDER BY DATE(createddate) ASC
    `;
    const dailyActivityResult = await sql.query(dailyActivityQuery, [branchId]);

    return {
      summary: {
        totalBooks,
        totalCopies,          // ⭐ Added here
        availableBooks,
        issuedBooks,
        issuedPercentage,
        availablePercentage,
        totalAuthors,
        totalCategories,
        booksThisMonth,
      },
      booksByCategory: booksByCategoryResult.rows,
      booksByAuthor: booksByAuthorResult.rows,
      monthlyTrend: monthlyTrendResult.rows,
      dailyActivity: dailyActivityResult.rows,
    };
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    throw error;
  }
}

async function getStudentDashboardStats(userId, memberType = "all") {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }

    // Helper function to apply member_type filter
    function applyMemberTypeFilter(baseQuery, memberType, values = []) {
      if (!memberType) return { query: baseQuery, values };
      const type = memberType.toLowerCase();

      if (type === "all" || type === "other") return { query: baseQuery, values };

      const condition = `LOWER(lm.library_member_type) = LOWER($${values.length + 1})`;
      values.push(memberType);

      if (baseQuery.toLowerCase().includes("where")) {
        baseQuery += ` AND ${condition}`;
      } else {
        baseQuery += ` WHERE ${condition}`;
      }

      return { query: baseQuery, values };
    }

    // 1️⃣ Total books (no member_type filter needed)
    const totalBooksQuery = `SELECT COUNT(*) as count FROM ${schema}.books WHERE available_copies > 0 AND branch_id = $1`;
    const totalBooksResult = await sql.query(totalBooksQuery, [branchId]);
    const totalBooks = parseInt(totalBooksResult.rows[0]?.count || 0);

    // 2️⃣ Issued books
    let issuedBooksQuery = `
      SELECT COUNT(*) as count
      FROM ${schema}.book_issues bi
      JOIN ${schema}.library_members lm ON lm.user_id = bi.issued_to AND lm.branch_id = $2
      WHERE bi.issued_to = $1 AND bi.return_date IS NULL AND bi.status = 'issued' AND bi.branch_id = $2
    `;
    let issuedBooksValues = [userId, branchId];
    issuedBooksQuery = applyMemberTypeFilter(issuedBooksQuery, memberType, issuedBooksValues);
    const issuedBooksResult = await sql.query(issuedBooksQuery.query, issuedBooksQuery.values);
    const issuedBooks = parseInt(issuedBooksResult.rows[0]?.count || 0);

    // 3️⃣ Pending requests
    let pendingRequestsQuery = `
      SELECT COUNT(*) as count
      FROM ${schema}.book_requests br
      JOIN ${schema}.library_members lm ON lm.user_id = br.requested_by AND lm.branch_id = $2
      WHERE br.requested_by = $1 AND br.status = 'pending' AND br.branch_id = $2
    `;
    let pendingRequestsValues = [userId, branchId];
    pendingRequestsQuery = applyMemberTypeFilter(pendingRequestsQuery, memberType, pendingRequestsValues);
    const pendingRequestsResult = await sql.query(pendingRequestsQuery.query, pendingRequestsQuery.values);
    const pendingRequests = parseInt(pendingRequestsResult.rows[0]?.count || 0);

    // 4️⃣ Approved requests
    let approvedRequestsQuery = `
      SELECT COUNT(*) as count
      FROM ${schema}.book_requests br
      JOIN ${schema}.library_members lm ON lm.user_id = br.requested_by AND lm.branch_id = $2
      WHERE br.requested_by = $1 AND br.status = 'approved' AND br.branch_id = $2
    `;
    let approvedRequestsValues = [userId, branchId];
    approvedRequestsQuery = applyMemberTypeFilter(approvedRequestsQuery, memberType, approvedRequestsValues);
    const approvedRequestsResult = await sql.query(approvedRequestsQuery.query, approvedRequestsQuery.values);
    const approvedRequests = parseInt(approvedRequestsResult.rows[0]?.count || 0);

    // 5️⃣ Overdue books
    let overdueBooksQuery = `
      SELECT COUNT(*) as count
      FROM ${schema}.book_issues bi
      JOIN ${schema}.library_members lm ON lm.user_id = bi.issued_to AND lm.branch_id = $2
      WHERE bi.issued_to = $1 AND bi.return_date IS NULL AND bi.status = 'issued' AND bi.due_date < CURRENT_DATE AND bi.branch_id = $2
    `;
    let overdueBooksValues = [userId, branchId];
    overdueBooksQuery = applyMemberTypeFilter(overdueBooksQuery, memberType, overdueBooksValues);
    const overdueBooksResult = await sql.query(overdueBooksQuery.query, overdueBooksQuery.values);
    const overdueBooks = parseInt(overdueBooksResult.rows[0]?.count || 0);

    // 6️⃣ Total fines
    const totalFinesQuery = `
      SELECT COALESCE(SUM(penalty_amount), 0) as total_fines
      FROM ${schema}.book_issues
      WHERE issued_to = $1 AND return_date IS NOT NULL AND penalty_amount > 0 AND branch_id = $2
    `;
    const totalFinesResult = await sql.query(totalFinesQuery, [userId, branchId]);
    const totalFines = parseFloat(totalFinesResult.rows[0]?.total_fines || 0);

    // 7️⃣ Recent issued books
    const recentIssuedQuery = `
      SELECT 
        bi.*,
        b.title AS book_title,
        b.isbn AS book_isbn,
        b.available_copies,
        lc.card_number
      FROM ${schema}.book_issues bi
      LEFT JOIN ${schema}.books b ON bi.book_id = b.id AND b.branch_id = $2
      LEFT JOIN ${schema}.library_members lc ON bi.issued_to = lc.user_id AND lc.is_active = true AND lc.branch_id = $2
      WHERE bi.issued_to = $1 AND bi.branch_id = $2
      ORDER BY bi.issue_date DESC
      LIMIT 5
    `;
    const recentIssuedResult = await sql.query(recentIssuedQuery, [userId, branchId, branchId, branchId]);

    // 8️⃣ Recent requests
    const recentRequestsQuery = `
      SELECT 
        br.*,
        b.title AS book_title,
        b.isbn AS book_isbn
      FROM ${schema}.book_requests br
      LEFT JOIN ${schema}.books b ON br.book_id = b.id AND b.branch_id = $2
      WHERE br.requested_by = $1 AND br.branch_id = $2
      ORDER BY br.createddate DESC
      LIMIT 5
    `;
    const recentRequestsResult = await sql.query(recentRequestsQuery, [userId, branchId, branchId]);

    // 9️⃣ Due soon
    let dueSoonQuery = `
      SELECT COUNT(*) as count
      FROM ${schema}.book_issues bi
      JOIN ${schema}.library_members lm ON lm.user_id = bi.issued_to AND lm.branch_id = $2
      WHERE bi.issued_to = $1 AND bi.return_date IS NULL AND bi.status = 'issued'
        AND bi.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days' AND bi.branch_id = $2
    `;
    let dueSoonValues = [userId, branchId];
    dueSoonQuery = applyMemberTypeFilter(dueSoonQuery, memberType, dueSoonValues);
    const dueSoonResult = await sql.query(dueSoonQuery.query, dueSoonQuery.values);
    const dueSoon = parseInt(dueSoonResult.rows[0]?.count || 0);

    return {
      summary: {
        totalBooks,
        issuedBooks,
        pendingRequests,
        approvedRequests,
        overdueBooks,
        totalFines,
        dueSoon,
      },
      recentIssued: recentIssuedResult.rows,
      recentRequests: recentRequestsResult.rows,
    };
  } catch (error) {
    console.error("Error in getStudentDashboardStats:", error);
    throw error;
  }
}


module.exports = {
  init,
  getDashboardStats,
  getStudentDashboardStats,
};