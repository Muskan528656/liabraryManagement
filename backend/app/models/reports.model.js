/**
 * @author      Aabid
 * @date        Jan 2026
 * @copyright   www.ibirdsservices.com
 */
const sql = require("./db.js");
let schema = "";
let branchId = null;


function init(schema_name, branch_id = null) {
  schema = schema_name;
  branchId = branch_id;
}

async function findAll() {
  console.log("Working...")
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT 
           *
        FROM ${schema}.reports 
      where branch_id = $1
        ORDER BY created_date DESC 
    `;
    const result = await sql.query(query, [branchId]);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}

async function findById(id) {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT id, report_name, api_name, created_date, created_by, is_active, last_modified_date, company_id
                   FROM ${schema}.reports
                   WHERE id = $1 AND is_active = true AND branch_id = $2`;
    const result = await sql.query(query, [id, branchId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error in findById:", error);
    throw error;
  }
}

async function create(reportData, userId) {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `INSERT INTO ${schema}.reports
                   (report_name, api_name, created_by, company_id,branch_id)
                   VALUES ($1, $2, $3, $4, $5)
                   RETURNING *`;
    const values = [
      reportData.report_name,
      reportData.api_name,
      userId,
      reportData.company_id,
      branchId
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
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }

    if (!branchId) {
      throw new Error("Branch ID is required");
    }

    // Always push branchId first (will be $1)
    const queryParams = [branchId];

    let dateFilter = '';
    let categoryFilter = '';
    let searchFilter = '';

    

    if (
      params.days &&
      params.days !== 'custom' &&
      params.days !== 'all' &&
      params.days !== ''
    ) {
      const days = parseInt(params.days);

      if (!isNaN(days)) {
        dateFilter = `
          AND last_activity_date >  
              CURRENT_DATE - ($${queryParams.length + 1} * INTERVAL '1 day')
        `;
        queryParams.push(days);
      }
    }

    else if (
      params.days === 'custom' &&
      params.startDate &&
      params.endDate
    ) {
      dateFilter = `
        AND last_activity_date BETWEEN 
            $${queryParams.length + 1} 
            AND 
            $${queryParams.length + 2}
      `;
      queryParams.push(params.startDate, params.endDate);
    }


    if (params.category) {
      categoryFilter = `
        AND b.category_id = $${queryParams.length + 1}
      `;
      queryParams.push(params.category);
    }


    if (params.searchTerm) {
      searchFilter = `
        AND (
          b.title ILIKE $${queryParams.length + 1}
          OR a.name ILIKE $${queryParams.length + 1}
          OR c.name ILIKE $${queryParams.length + 1}
        )
      `;
      queryParams.push(`%${params.searchTerm}%`);
    }

    const query = `
      WITH book_activity AS (
        SELECT
          b.id,
          b.title,
          b.available_copies,
          b.category_id,
          c.name AS category_name,
          COALESCE(MAX(bi.issue_date), b.createddate)::date AS last_activity_date
        FROM ${schema}.books b
        LEFT JOIN ${schema}.book_issues bi
          ON b.id = bi.book_id
          AND bi.branch_id = $1
        LEFT JOIN ${schema}.categories c
          ON b.category_id = c.id
        LEFT JOIN ${schema}.authors a
          ON b.author_id = a.id
        WHERE b.branch_id = $1
        GROUP BY 
          b.id,
          b.title,
          b.available_copies,
          b.category_id,
          b.createddate,
          c.name,
          a.name
      )
      SELECT *,
        CURRENT_DATE - last_activity_date AS days_not_borrowed
      FROM book_activity b
      WHERE 1=1
        ${dateFilter}
        ${categoryFilter}
        ${searchFilter}
      ORDER BY days_not_borrowed DESC
    `;

    console.log("Final Query:", query);
    console.log("Params:", queryParams);

    const result = await sql.query(query, queryParams);

    return result.rows;

  } catch (error) {
    console.error("Error in getInactiveBooks:", error);
    throw error;
  }
}


// async function getBorrowingReport(params) {
//   try {
//     if (!schema) {
//       throw new Error("Schema not initialized. Call init() first.");
//     }

//   let dateFilter = '';
//     let customFilter = '';
//     const queryParams = [];

//     // --- 1. DATE FILTER LOGIC ---
//     // Handle presets (30, 90, 365)
//     if (params.days && params.days !== 'custom' && params.days !== 'all' && params.days !== '') {
//       const days = parseInt(params.days);
//       if (!isNaN(days)) {
//         dateFilter = `AND bi.issue_date >= CURRENT_DATE - INTERVAL '${days} days'`;
//       }
//     }
//     // Handle Custom Range (requires both dates)
//     // const { startDate, endDate } = params;
//     else if (params.days === 'custom' && params.startDate && params.endDate) {
//       dateFilter = `AND bi.issue_date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
//       queryParams.push(params.startDate, params.endDate);
//       customFilter = `AND COALESCE(isum.total_issues, 0) > 0`; // Only show books with issues in custom range
//     }
//     // Note: If none of the above match, dateFilter stays empty (Selects All Time), show all books

//     // --- 2. CATEGORY FILTER ---
//     let categoryFilter = '';
//     if (params.category) {
//       categoryFilter = `AND b.category_id = $${queryParams.length + 1}`;
//       queryParams.push(params.category);
//     }

//     // --- 3. SEARCH FILTER ---
//     let searchFilter = '';
//     if (params.searchTerm) {
//       searchFilter = `AND (b.title ILIKE $${queryParams.length + 1} OR a.name ILIKE $${queryParams.length + 1})`;
//       queryParams.push(`%${params.searchTerm}%`);
//     }



//     const filterCondition = dateFilter + categoryFilter + searchFilter;

//     const query = `
//       SELECT
//           b.title,
//           bi.issued_to,
//           bi.issue_date,
//           bi.due_date,
//           bi.return_date,
//           bi.status,
//           li.first_name as member_name,
//           CASE
//               WHEN bi.status = 'ISSUED' AND bi.due_date < CURRENT_DATE
//               THEN 'OVERDUE'
//               ELSE 'NORMAL'
//           END AS circulation_status
//       FROM ${schema}.book_issues bi
//       JOIN ${schema}.books b ON b.id = bi.book_id
//       LEFT JOIN ${schema}.authors a ON b.author_id = a.id
//       LEFT JOIN ${schema}.library_members li ON bi.issued_to = li.id
//       WHERE 1=1 ${filterCondition}
//       ORDER BY bi.issue_date DESC
//     `;


//     const result = await sql.query(query, queryParams);
//     return result.rows;

//   } catch (error) {
//     console.error("Error in getBorrowingReport:", error);
//     throw error;
//   }
// }

async function getBorrowingReport(params) {
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }

    let dateFilter = '';
    const queryParams = [];
      queryParams.push(branchId);

  
    if (
      params.days &&
      params.days !== 'custom' &&
      params.days !== 'all' &&
      params.days !== ''
    ) {
      const days = parseInt(params.days);
      if (!isNaN(days)) {
        dateFilter = `AND bi.issue_date >= CURRENT_DATE - INTERVAL '${days} days'`;
      }
    } else if (
      params.days === 'custom' &&
      params.startDate &&
      params.endDate
    ) {
      dateFilter = `AND bi.issue_date BETWEEN $${queryParams.length + 1} 
                    AND $${queryParams.length + 2}`;
      queryParams.push(params.startDate, params.endDate);
    }

    // --- 2. CATEGORY FILTER ---
    let categoryFilter = '';
    if (params.category) {
      categoryFilter = `AND b.category_id = $${queryParams.length + 1}`;
      queryParams.push(params.category);
    }

    // --- 3. SEARCH FILTER ---
    let searchFilter = '';
    if (params.searchTerm) {
      searchFilter = `AND (
                        b.title ILIKE $${queryParams.length + 1}
                        OR a.name ILIKE $${queryParams.length + 1}
                        OR li.first_name ILIKE $${queryParams.length + 1}
                      )`;
      queryParams.push(`%${params.searchTerm}%`);
    }

    const filterCondition = dateFilter + categoryFilter + searchFilter;

    // const query = `
    //   SELECT
    //       b.title,
    //       bi.issued_to,
    //       bi.issue_date,
    //       bi.due_date,
    //       bi.return_date,
    //       bi.status,
    //       li.first_name AS member_name,

    //       CASE
    //           WHEN bi.return_date IS NULL 
    //                AND bi.due_date < CURRENT_DATE THEN 'OVERDUE'
    //           WHEN bi.return_date IS NULL THEN 'ISSUED'
    //           ELSE 'RETURNED'
    //       END AS circulation_status

    //   FROM ${schema}.book_issues bi
    //   JOIN ${schema}.books b ON b.id = bi.book_id
    //   LEFT JOIN ${schema}.authors a ON b.author_id = a.id
    //   LEFT JOIN ${schema}.library_members li ON bi.issued_to = li.id

    //   -- Only show active borrowings (Issued + Overdue)
    //   WHERE bi.return_date IS NULL
    //   ${filterCondition}

    //   ORDER BY bi.due_date ASC
    // `;


    const query = ` SELECT
          b.title,
          bi.issued_to,
          bi.issue_date,
          bi.due_date,
          bi.status,
          li.first_name AS member_name,

          'OVERDUE' AS circulation_status

      FROM ${schema}.book_issues bi
      JOIN ${schema}.books b ON b.id = bi.book_id
      LEFT JOIN ${schema}.authors a ON b.author_id = a.id
      LEFT JOIN ${schema}.library_members li ON bi.issued_to = li.id AND li.branch_id = $1

      WHERE 
          bi.return_date IS NULL              -- not returned
          AND bi.status NOT IN ('RETURNED', 'CANCELLED') 
          AND bi.due_date < CURRENT_DATE      -- due date passed

          ${filterCondition}

      ORDER BY bi.due_date DESC
  `;


    const result = await sql.query(query, [branchId, ...queryParams]);
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
