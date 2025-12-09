/**
 * @author      Aabid
 * @date        Nov, 2025
 * @copyright   www.ibirdsservices.com
 */
const sql = require("./db.js");

function init(schema_name) {
  this.schema = schema_name;
}

const getDashboardStats = async () => {
  try {
    console.log("Fetching dashboard stats...");
    const stats = {};


    const bookCountResult = await sql.query(`SELECT COUNT(*) FROM demo.books`);
    stats.total_books = parseInt(bookCountResult.rows[0].count) || 0;


    const booksubmission = await sql.query(
      `SELECT COUNT(*) FROM demo.book_submissions`
    );
    stats.total_submission = parseInt(booksubmission.rows[0].count) || 0;


    const issuedBooksResult = await sql.query(
      `SELECT COUNT(*) FROM demo.book_issues WHERE return_date IS NULL`
    );
    stats.issued_books = parseInt(issuedBooksResult.rows[0].count) || 0;


    const dailyActivityResult = await sql.query(
      `SELECT COUNT(*) AS daily_activity FROM demo.books WHERE DATE(createddate) = CURRENT_DATE`
    );
    stats.daily_activity = parseInt(dailyActivityResult.rows[0].daily_activity) || 0;


    const monthlyActivityResult = await sql.query(
      `SELECT COUNT(*) AS monthly_activity FROM demo.books 
       WHERE DATE_TRUNC('month', createddate) = DATE_TRUNC('month', CURRENT_DATE)`
    );
    stats.monthly_activity = parseInt(monthlyActivityResult.rows[0].monthly_activity) || 0;


    const booksByCategoryResult = await sql.query(`    
        SELECT 
            c.id,
            c.name AS category_name,
            COUNT(b.id) AS book_count
        FROM demo.books b
        LEFT JOIN demo.categories c ON b.category_id = c.id
        GROUP BY c.id, c.name
        ORDER BY book_count DESC
        LIMIT 10;
    `);
    stats.books_by_category = booksByCategoryResult.rows;


    const monthlyTrendResult = await sql.query(`    
        SELECT 
            TO_CHAR(createddate, 'YYYY-MM') AS month, 
            COUNT(*) AS book_count
        FROM demo.books
        GROUP BY TO_CHAR(createddate, 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 12;
    `);
    stats.monthly_trend = monthlyTrendResult.rows;



    const totalCopiesResult = await sql.query(
      `SELECT COALESCE(SUM(total_copies), 0) FROM demo.books`
    );
    stats.total_copies = parseInt(totalCopiesResult.rows[0].coalesce) || 0;


    stats.available_copies = Math.max(0, stats.total_copies - stats.issued_books);


    if (stats.total_copies > 0) {
      stats.available_percentage = Math.round((stats.available_copies / stats.total_copies) * 100);
      stats.issued_percentage = Math.round((stats.issued_books / stats.total_copies) * 100);
    } else {
      stats.available_percentage = 0;
      stats.issued_percentage = 0;
    }

    console.log("Dashboard stats fetched successfully:", stats);
    return stats;

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

const fetchAll = async () => {
  try {
    console.log("Fetching alert metrics...");

    const result = await sql.query(` 
  SELECT 
      (SELECT COUNT(*) 
       FROM demo.book_issues 
       WHERE return_date IS NULL
       AND due_date BETWEEN NOW() AND (NOW() + INTERVAL '14 days')
      ) AS total_due_soon,

      (SELECT COUNT(*) 
       FROM demo.book_issues 
       WHERE return_date IS NULL
       AND due_date < NOW()
      ) AS overdue_books,

      (SELECT COALESCE(SUM(bs.penalty), 0)
       FROM demo.book_submissions bs
       WHERE DATE_TRUNC('month', bs.submit_date) = DATE_TRUNC('month', CURRENT_DATE)
      ) AS fine_collected_this_month,

      (SELECT COUNT(*) 
       FROM demo.book_submissions bs
       WHERE bs.condition_after IN ('damaged', 'missing')
       AND bs.submit_date >= CURRENT_DATE - INTERVAL '30 days'
      ) AS damaged_missing_books,

      (SELECT COALESCE(SUM(b.total_copies), 0)
       FROM demo.books b
      ) AS total_book_copies,

    (SELECT COUNT(DISTINCT member_id)
 FROM demo.book_issues 
 WHERE return_date IS NULL
) AS active_borrowers,
      
      (SELECT COALESCE(AVG(EXTRACT(DAY FROM (return_date - issue_date))), 0)
       FROM demo.book_issues 
       WHERE return_date IS NOT NULL
       AND issue_date >= CURRENT_DATE - INTERVAL '30 days'
      ) AS avg_return_days
  FROM demo.books
  LIMIT 1;
`);


    console.log("Alert metrics fetched:", result);

    if (result.rows && result.rows.length > 0) {
      return [result.rows[0]];
    } else {

      return [{
        total_due_soon: 0,
        overdue_books: 0,
        fine_collected_this_month: 0,
        damaged_missing_books: 0,
        total_book_copies: 0,
        active_borrowers: 0,
        avg_return_days: 0
      }];
    }

  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);

    return [{
      total_due_soon: 0,
      overdue_books: 0,
      fine_collected_this_month: 0,
      damaged_missing_books: 0,
      total_book_copies: 0,
      active_borrowers: 0,
      avg_return_days: 0
    }];
  }
};


const getCompleteDashboardData = async () => {
  try {
    console.log("Fetching complete dashboard data...");


    const [stats, metrics] = await Promise.all([
      getDashboardStats(),
      fetchAll()
    ]);

    const completeData = {
      summary: {
        totalBooks: stats.total_books,
        totalCopies: stats.total_copies,
        availableBooks: stats.available_copies,
        issuedBooks: stats.issued_books,
        availablePercentage: stats.available_percentage,
        issuedPercentage: stats.issued_percentage,
        booksThisMonth: stats.monthly_activity,
        totalSubmissions: stats.total_submission
      },
      metrics: metrics[0], // Alert metrics
      categories: stats.books_by_category,
      monthlyTrend: stats.monthly_trend,
      dailyActivity: stats.daily_activity
    };

    console.log("Complete dashboard data:", completeData);
    return completeData;

  } catch (error) {
    console.error("Error fetching complete dashboard data:", error);
    throw error;
  }
};

module.exports = {
  init,
  getDashboardStats,
  fetchAll,
  getCompleteDashboardData
};