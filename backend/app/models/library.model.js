/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */
const sql = require("./db.js");
let schema = "";

function init(schema_name) {
  this.schema = schema_name;
}

async function getDashboardStats() {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }

    const totalBooksQuery = `SELECT COUNT(*) as count FROM ${this.schema}.books`;
    const totalBooksResult = await sql.query(totalBooksQuery);
    const totalBooks = parseInt(totalBooksResult.rows[0]?.count || 0);

    const availableBooksQuery = `SELECT SUM(available_copies) as count FROM ${this.schema}.books WHERE available_copies > 0`;
    const availableBooksResult = await sql.query(availableBooksQuery);
    const availableBooks = parseInt(availableBooksResult.rows[0]?.count || 0);

    const totalAuthorsQuery = `SELECT COUNT(*) as count FROM ${this.schema}.authors`;
    const totalAuthorsResult = await sql.query(totalAuthorsQuery);
    const totalAuthors = parseInt(totalAuthorsResult.rows[0]?.count || 0);

    const totalCategoriesQuery = `SELECT COUNT(*) as count FROM ${this.schema}.categories`;
    const totalCategoriesResult = await sql.query(totalCategoriesQuery);
    const totalCategories = parseInt(totalCategoriesResult.rows[0]?.count || 0);

    const booksByCategoryQuery = `
      SELECT 
        c.name as category_name,
        COUNT(b.id) as book_count
      FROM ${this.schema}.categories c
      LEFT JOIN ${this.schema}.books b ON c.id = b.category_id
      GROUP BY c.id, c.name
      ORDER BY book_count DESC
      LIMIT 10
    `;
    const booksByCategoryResult = await sql.query(booksByCategoryQuery);

    const booksByAuthorQuery = `
      SELECT 
        a.name as author_name,
        COUNT(b.id) as book_count
      FROM ${this.schema}.authors a
      LEFT JOIN ${this.schema}.books b ON a.id = b.author_id
      GROUP BY a.id, a.name
      ORDER BY book_count DESC
      LIMIT 10
    `;
    const booksByAuthorResult = await sql.query(booksByAuthorQuery);


    const totalCopiesQuery = `SELECT SUM(total_copies) as total FROM ${this.schema}.books`;
    const totalCopiesResult = await sql.query(totalCopiesQuery);
    const totalCopies = parseInt(totalCopiesResult.rows[0]?.total || 0);

    const issuedBooks = totalCopies - availableBooks;
    const issuedPercentage = totalCopies > 0 ? Math.round((issuedBooks / totalCopies) * 100) : 0;
    const availablePercentage = totalCopies > 0 ? Math.round((availableBooks / totalCopies) * 100) : 0;

    const monthlyTrendQuery = `
      SELECT 
        TO_CHAR(createddate, 'Mon YYYY') as month,
        COUNT(*) as count
      FROM ${this.schema}.books
      WHERE createddate >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(createddate, 'Mon YYYY'), DATE_TRUNC('month', createddate)
      ORDER BY DATE_TRUNC('month', createddate) ASC
      LIMIT 6
    `;
    const monthlyTrendResult = await sql.query(monthlyTrendQuery);

    const booksThisMonthQuery = `
      SELECT COUNT(*) as count 
      FROM ${this.schema}.books 
      WHERE DATE_TRUNC('month', createddate) = DATE_TRUNC('month', CURRENT_DATE)
    `;
    const booksThisMonthResult = await sql.query(booksThisMonthQuery);
    const booksThisMonth = parseInt(booksThisMonthResult.rows[0]?.count || 0);

    const dailyActivityQuery = `
      SELECT 
        DATE(createddate) as date,
        COUNT(*) as count
      FROM ${this.schema}.books
      WHERE createddate >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(createddate)
      ORDER BY DATE(createddate) ASC
    `;
    const dailyActivityResult = await sql.query(dailyActivityQuery);

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


async function getStudentDashboardStats(userId) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }


    const totalBooksQuery = `SELECT COUNT(*) as count FROM ${this.schema}.books WHERE available_copies > 0`;
    const totalBooksResult = await sql.query(totalBooksQuery);
    const totalBooks = parseInt(totalBooksResult.rows[0]?.count || 0);


    const issuedBooksQuery = `
      SELECT COUNT(*) as count 
      FROM ${this.schema}.book_issues 
      WHERE issued_to = $1 AND return_date IS NULL AND status = 'issued'
    `;
    const issuedBooksResult = await sql.query(issuedBooksQuery, [userId]);
    const issuedBooks = parseInt(issuedBooksResult.rows[0]?.count || 0);


    const pendingRequestsQuery = `
      SELECT COUNT(*) as count 
      FROM ${this.schema}.book_requests 
      WHERE requested_by = $1 AND status = 'pending'
    `;
    const pendingRequestsResult = await sql.query(pendingRequestsQuery, [userId]);
    const pendingRequests = parseInt(pendingRequestsResult.rows[0]?.count || 0);


    const approvedRequestsQuery = `
      SELECT COUNT(*) as count 
      FROM ${this.schema}.book_requests 
      WHERE requested_by = $1 AND status = 'approved'
    `;
    const approvedRequestsResult = await sql.query(approvedRequestsQuery, [userId]);
    const approvedRequests = parseInt(approvedRequestsResult.rows[0]?.count || 0);


    const overdueBooksQuery = `
      SELECT COUNT(*) as count 
      FROM ${this.schema}.book_issues 
      WHERE issued_to = $1 
        AND return_date IS NULL 
        AND status = 'issued'
        AND due_date < CURRENT_DATE
    `;
    const overdueBooksResult = await sql.query(overdueBooksQuery, [userId]);
    const overdueBooks = parseInt(overdueBooksResult.rows[0]?.count || 0);


    const totalFinesQuery = `
      SELECT COALESCE(SUM(penalty_amount), 0) as total_fines
      FROM ${this.schema}.book_issues 
      WHERE issued_to = $1 
        AND return_date IS NOT NULL
        AND penalty_amount > 0
    `;
    const totalFinesResult = await sql.query(totalFinesQuery, [userId]);
    const totalFines = parseFloat(totalFinesResult.rows[0]?.total_fines || 0);


    const recentIssuedQuery = `
      SELECT 
        bi.*,
        b.title AS book_title,
        b.isbn AS book_isbn,
        b.available_copies,
        lc.card_number
      FROM ${this.schema}.book_issues bi
      LEFT JOIN ${this.schema}.books b ON bi.book_id = b.id
      LEFT JOIN ${this.schema}.library_members lc ON bi.issued_to = lc.user_id AND lc.is_active = true
      WHERE bi.issued_to = $1
      ORDER BY bi.issue_date DESC
      LIMIT 5
    `;
    const recentIssuedResult = await sql.query(recentIssuedQuery, [userId]);


    const recentRequestsQuery = `
      SELECT 
        br.*,
        b.title AS book_title,
        b.isbn AS book_isbn
      FROM ${this.schema}.book_requests br
      LEFT JOIN ${this.schema}.books b ON br.book_id = b.id
      WHERE br.requested_by = $1
      ORDER BY br.createddate DESC
      LIMIT 5
    `;
    const recentRequestsResult = await sql.query(recentRequestsQuery, [userId]);


    const dueSoonQuery = `
      SELECT COUNT(*) as count 
      FROM ${this.schema}.book_issues 
      WHERE issued_to = $1 
        AND return_date IS NULL 
        AND status = 'issued'
        AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
    `;
    const dueSoonResult = await sql.query(dueSoonQuery, [userId]);
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

