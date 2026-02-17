/**
 * @author      Aabid
 * @date        Nov, 2025
 * @copyright   www.ibirdsservices.com
 */
const sql = require("./db.js");
let schema = "";
let branchId = null;

// function init(schema_name) {
//   this.schema = schema_name;
// }

function init(schema_name, branch_id = null) {
  schema = schema_name;
  branchId = branch_id;
}

const getDashboardStats = async () => {
  try {
 
    const stats = {};

    const totoalcopies = await sql.query(`SELECT COUNT(*) FROM ${schema}.total_copies`);
    stats.totoalcopies = parseInt(totoalcopies.rows[0].count) || 0;


    const bookCountResult = await sql.query(`SELECT COUNT(*) FROM ${schema}.books`);
    stats.total_books = parseInt(bookCountResult.rows[0].count) || 0;


    const booksubmission = await sql.query(
      `SELECT COUNT(*) FROM ${schema}.book_submissions`
    );
    stats.total_submission = parseInt(booksubmission.rows[0].count) || 0;


    const issuedBooksResult = await sql.query(
      `SELECT COUNT(*) FROM ${schema}.book_issues WHERE return_date IS NULL`
    );
    stats.issued_books = parseInt(issuedBooksResult.rows[0].count) || 0;


    const dailyActivityResult = await sql.query(
      `SELECT COUNT(*) AS daily_activity FROM ${schema}.books WHERE DATE(createddate) = CURRENT_DATE`
    );
    stats.daily_activity = parseInt(dailyActivityResult.rows[0].daily_activity) || 0;


    const monthlyActivityResult = await sql.query(
      `SELECT COUNT(*) AS monthly_activity FROM ${schema}.books 
       WHERE DATE_TRUNC('month', createddate) = DATE_TRUNC('month', CURRENT_DATE)`
    );
    stats.monthly_activity = parseInt(monthlyActivityResult.rows[0].monthly_activity) || 0;


    const booksByCategoryResult = await sql.query(`    
        SELECT 
            c.id,
            c.name AS category_name,
            COUNT(b.id) AS book_count
        FROM ${schema}.books b
        LEFT JOIN ${schema}.categories c ON b.category_id = c.id
        GROUP BY c.id, c.name
        ORDER BY book_count DESC
        LIMIT 10;
    `);
    stats.books_by_category = booksByCategoryResult.rows;


    const monthlyTrendResult = await sql.query(`    
        SELECT 
            TO_CHAR(createddate, 'YYYY-MM') AS month, 
            COUNT(*) AS book_count
        FROM ${schema}.books
        GROUP BY TO_CHAR(createddate, 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 12;
    `);
    stats.monthly_trend = monthlyTrendResult.rows;



    const totalCopiesResult = await sql.query(
      `SELECT COALESCE(SUM(total_copies), 0) FROM ${schema}.books`
    );
    stats.total_copies = parseInt(totalCopiesResult.rows[0].coalesce) || 0;

    const damagedBooksResult = await sql.query(
      `SELECT COUNT(*) FROM ${schema}.book_issues WHERE status = 'damaged'`
    );
    stats.damaged_books = parseInt(damagedBooksResult.rows[0].count) || 0;

    stats.available_copies = Math.max(0, stats.total_copies - stats.issued_books - stats.damaged_books);


    if (stats.total_copies > 0) {
      stats.available_percentage = Math.round((stats.available_copies / stats.total_copies) * 100);
      stats.issued_percentage = Math.round((stats.issued_books / stats.total_copies) * 100);
    } else {
      stats.available_percentage = 0;
      stats.issued_percentage = 0;
    }

 
    return stats;

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};
const fetchAll = async () => {
  try {
 

    const result = await sql.query(`
      SELECT 
   
        (
          SELECT COUNT(*) 
          FROM ${schema}.book_issues 
          WHERE return_date IS NULL
          AND due_date BETWEEN NOW() AND (NOW() + INTERVAL '14 days')
        ) AS total_due_soon,

        /* Overdue books */
        (
          SELECT COUNT(*) 
          FROM ${schema}.book_issues 
          WHERE return_date IS NULL
          AND due_date < NOW()
        ) AS overdue_books,

        /* Total fine collected this month */
        (
          SELECT COALESCE(SUM(bs.penalty), 0)
          FROM ${schema}.book_submissions bs
          WHERE DATE_TRUNC('month', bs.submit_date) = DATE_TRUNC('month', CURRENT_DATE)
        ) AS fine_collected_this_month,

        /* Books marked damaged */
        (
          SELECT COUNT(*)
          FROM ${schema}.book_issues
          WHERE status = 'damaged'
        ) AS damaged_missing_books,

        /* Total copies in library */
        (
          SELECT COALESCE(SUM(b.total_copies), 0)
          FROM ${schema}.books b
        ) AS total_book_copies,

        /* Avg return days in last 30 days (FIXED) */
        (
          SELECT COALESCE(AVG(EXTRACT(DAY FROM ((return_date - issue_date) * INTERVAL '1 day'))), 0)
          FROM ${schema}.book_issues
          WHERE return_date IS NOT NULL
          AND issue_date >= CURRENT_DATE - INTERVAL '30 days'
        ) AS avg_return_days
      FROM ${schema}.books b where b.branch_id = '${branchId}'
      LIMIT 1;
    `);
console.log("result.rows: --", result.rows);


    if (result.rows && result.rows.length > 0) {
      return [result.rows[0]];
    } else {
      return [
        {
          total_due_soon: 0,
          overdue_books: 0,
          fine_collected_this_month: 0,
          damaged_missing_books: 0,
          total_book_copies: 0,
          avg_return_days: 0,
        },
      ];
    }
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);

    return [
      {
        total_due_soon: 0,
        overdue_books: 0,
        fine_collected_this_month: 0,
        damaged_missing_books: 0,
        total_book_copies: 0,
        avg_return_days: 0,
      },
    ];
  }
};



const getCompleteDashboardData = async () => {
  try {
 


    const [stats, metrics] = await Promise.all([
      getDashboardStats(),
      fetchAll()
    ]);
 
    const completeData = {
      summary: {
        totoalcopies: stats.totoalcopies,
        totalBooks: stats.total_books,
        totalCopies: stats.total_copies,
        availableBooks: stats.available_copies,
        issuedBooks: stats.issued_books,
        damagedBooks: stats.damaged_books,
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