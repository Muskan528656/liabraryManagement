
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
    console.log('bookCountResult ');
    const stats = {};
 
    const bookCountResult = await sql.query(`SELECT COUNT(*) FROM demo.books`);
    stats.total_books = bookCountResult.rows[0].count;
    const booksubmission = await sql.query(`SELECT COUNT(*) FROM demo.book_submissions`);
    stats.total_submission = booksubmission.rows[0].count;
    const issuedBooksResult = await sql.query(`SELECT COUNT(*) FROM demo.book_issues WHERE status = 'issued'`);
    stats.issued_books = issuedBooksResult.rows[0].count;

    const dailyActivityResult = await sql.query(`SELECT COUNT(*) AS dailyActivity FROM demo.books WHERE DATE(createddate) = CURRENT_DATE`);
    stats.dailyActivity = dailyActivityResult.rows[0].dailyActivity;
 
    const booksByCategoryResult = await sql.query(`    
        SELECT 
            c.name AS category,
            COUNT(b.id) AS bookCount,
            TO_CHAR(b.createddate, 'YYYY-MM') AS month
        FROM demo.books b
        JOIN demo.categories c ON b.category_id = c.id
        GROUP BY c.name, TO_CHAR(b.createddate, 'YYYY-MM')
        ORDER BY month, category;
    `);
    stats.booksByCategory = booksByCategoryResult.rows;

 

    const recentIssuedResult = await sql.query(`    
        SELECT 
            bi.id AS issue_id,
            bi.issue_date,
            bi.due_date,
            bi.return_date,
            b.id AS book_id,
            b.title,
            b.category_id
        FROM demo.book_issues bi
        JOIN demo.books b ON bi.book_id = b.id  
        ORDER BY bi.issue_date DESC
        LIMIT 200;

    `);
    stats.recentIssued = recentIssuedResult.rows;



    const monthlyTrendResult = await sql.query(`    
        SELECT TO_CHAR(createddate, 'YYYY-MM') AS month, COUNT(*) AS bookCount
        FROM demo.books
        GROUP BY month
        ORDER BY month;
    `);
    stats.monthlyTrend = monthlyTrendResult.rows;
    


    stats.available_books = stats.total_books - stats.issued_books;
    return stats;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

 
const getOtherMetrics = async () => {
 
 
 
 
 
 
 
 
 
 
 
};


  
 
const fetchAll = async () => {
    try {
        const result = await sql.query(`         
                SELECT 
                    bi.*,
                    
                    -- Due Soon Count (14 days)
                    (SELECT COUNT(*) 
                    FROM demo.book_issues 
                    WHERE return_date IS NULL
                    AND due_date BETWEEN NOW() AND (NOW() + INTERVAL '14 days')
                    ) AS total_due_soon,

                    -- Overdue Count
                    (SELECT COUNT(*) 
                    FROM demo.book_issues 
                    WHERE return_date IS NULL
                    AND due_date < NOW()
                    ) AS overdue_books,

                    -- Fine Collected This Month
                    (SELECT COALESCE(SUM(bs.penalty), 0)
                    FROM demo.book_submissions bs
                    WHERE DATE_TRUNC('month', bs.submit_date) = DATE_TRUNC('month', CURRENT_DATE)
                    ) AS fine_collected_this_month,

                    -- Damaged / Missing Books
                    (SELECT COUNT(*) 
                    FROM demo.book_submissions bs
                    WHERE bs.condition_after IN ('damaged', 'missing')
                    ) AS damaged_missing_books

                FROM demo.book_issues bi
                WHERE bi.return_date IS NULL
                AND bi.due_date BETWEEN NOW() AND (NOW() + INTERVAL '14 days');
            `);
        return result.rows;
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        throw error;
    }
};

module.exports = {
        init,
    getDashboardStats,
    getOtherMetrics,
    fetchAll,
};