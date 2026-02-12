/**
 * @author      Aabid
 * @date        Jan 2026
 * @copyright   www.ibirdsservices.com
 */
const sql = require("./db.js");

function init(schema_name) {
  this.schema = schema_name;
}

async function findAll() {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT 
            r.id,
            r.report_name,
            r.api_name,
            r.created_date,
            r.description,
            r.created_by,
            u.firstname AS created_by_name
        FROM ${this.schema}.reports r
        INNER JOIN ${this.schema}."user" u 
            ON r.created_by = u.id
        WHERE r.is_active = true
        ORDER BY r.created_date DESC
    `;
    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}

async function findById(id) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT id, report_name, api_name, created_date, created_by, is_active, last_modified_date, company_id
                   FROM ${this.schema}.reports
                   WHERE id = $1 AND is_active = true`;
    const result = await sql.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error in findById:", error);
    throw error;
  }
}

async function create(reportData, userId) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `INSERT INTO ${this.schema}.reports
                   (report_name, api_name, created_by, company_id)
                   VALUES ($1, $2, $3, $4)
                   RETURNING *`;
    const values = [
      reportData.report_name,
      reportData.api_name,
      userId,
      reportData.company_id
    ];
    const result = await sql.query(query, values);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error in create:", error);
    throw error;
  }
}

async function getInactiveBooks(params) { 
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }

    const { days, startDate, endDate, search, category } = params;

    let dateFilter = '';
    let customFilter = '';
    const queryParams = [];

    // --- 1. DATE FILTER LOGIC ---
    // Handle presets (30, 90, 365)
    if (params.days && params.days !== 'custom' && params.days !== 'all' && params.days !== '') {
      const days = parseInt(params.days);
      if (!isNaN(days)) {
        dateFilter = `AND last_activity_date >= CURRENT_DATE - INTERVAL '${days} days'`;
      }
    }
    // Handle Custom Range (requires both dates)
    else if (params.days === 'custom' && params.startDate && params.endDate) {
      dateFilter = `AND last_activity_date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
      queryParams.push(params.startDate, params.endDate);
      customFilter = `AND COALESCE(isum.total_issues, 0) > 0`; // Only show books with issues in custom range
    }
    // Note: If none of the above match, dateFilter stays empty (Selects All Time), show all books

    // --- 2. CATEGORY FILTER ---
    let categoryFilter = '';
    if (params.category) {
      categoryFilter = `AND b.category_id = $${queryParams.length + 1}`;
      queryParams.push(params.category);
    }

    // --- 3. SEARCH FILTER ---
    let searchFilter = '';
    if (params.searchTerm) {
      searchFilter = `AND (b.title ILIKE $${queryParams.length + 1} OR a.name ILIKE $${queryParams.length + 1})`;
      queryParams.push(`%${params.searchTerm}%`);
    }


    const filterCondition = dateFilter + categoryFilter + searchFilter;

    const query = `
      WITH book_activity AS (
          SELECT
              b.id,
              b.title,
              b.available_copies,
              b.category_id,
              c.name AS category_name,
              COALESCE(MAX(bi.issue_date), b.createddate)::date AS last_activity_date
          FROM ${this.schema}.books b
          LEFT JOIN ${this.schema}.book_issues bi
              ON b.id = bi.book_id
          LEFT JOIN ${this.schema}.categories c
              ON b.category_id = c.id
          LEFT JOIN ${this.schema}.authors a
              ON b.author_id = a.id
          GROUP BY b.id, b.title, b.available_copies, b.category_id, b.createddate, c.name, a.name
      )
      SELECT *,
            CURRENT_DATE - last_activity_date AS days_not_borrowed
      FROM book_activity b
      WHERE 1=1 ${filterCondition}
      ORDER BY days_not_borrowed DESC
    `;

    const result = await sql.query(query, queryParams);
    return result.rows;

  } catch (error) {
    console.error("Error in getInactiveBooks:", error);
    throw error;
  }
}

async function getBorrowingReport(params) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }

  let dateFilter = '';
    let customFilter = '';
    const queryParams = [];

    // --- 1. DATE FILTER LOGIC ---
    // Handle presets (30, 90, 365)
    if (params.days && params.days !== 'custom' && params.days !== 'all' && params.days !== '') {
      const days = parseInt(params.days);
      if (!isNaN(days)) {
        dateFilter = `AND bi.issue_date >= CURRENT_DATE - INTERVAL '${days} days'`;
      }
    }
    // Handle Custom Range (requires both dates)
    // const { startDate, endDate } = params;
    else if (params.days === 'custom' && params.startDate && params.endDate) {
      dateFilter = `AND bi.issue_date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
      queryParams.push(params.startDate, params.endDate);
      customFilter = `AND COALESCE(isum.total_issues, 0) > 0`; // Only show books with issues in custom range
    }
    // Note: If none of the above match, dateFilter stays empty (Selects All Time), show all books

    // --- 2. CATEGORY FILTER ---
    let categoryFilter = '';
    if (params.category) {
      categoryFilter = `AND b.category_id = $${queryParams.length + 1}`;
      queryParams.push(params.category);
    }

    // --- 3. SEARCH FILTER ---
    let searchFilter = '';
    if (params.searchTerm) {
      searchFilter = `AND (b.title ILIKE $${queryParams.length + 1} OR a.name ILIKE $${queryParams.length + 1})`;
      queryParams.push(`%${params.searchTerm}%`);
    }



    const filterCondition = dateFilter + categoryFilter + searchFilter;

    const query = `
      SELECT
          b.title,
          bi.issued_to,
          bi.issue_date,
          bi.due_date,
          bi.return_date,
          bi.status,
          CASE
              WHEN bi.status = 'ISSUED' AND bi.due_date < CURRENT_DATE
              THEN 'OVERDUE'
              ELSE 'NORMAL'
          END AS circulation_status
      FROM ${this.schema}.book_issues bi
      JOIN ${this.schema}.books b ON b.id = bi.book_id
      LEFT JOIN ${this.schema}.authors a ON b.author_id = a.id
      WHERE 1=1 ${filterCondition}
      ORDER BY bi.issue_date DESC
    `;

    const result = await sql.query(query, queryParams);
    return result.rows;

  } catch (error) {
    console.error("Error in getBorrowingReport:", error);
    throw error;
  }
}


module.exports = {
  init,
  findAll,
  findById,
  create,
  getInactiveBooks,
  getBorrowingReport
};
