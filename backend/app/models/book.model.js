/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */
const sql = require("./db.js");

function init(schema_name) {

  this.schema = schema_name;
}

async function findAll() {
  try {
    console.log("schema->>", this.schema)
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT
                    b.*,
                    a.name AS author_name,
                    c.name AS category_name,
                    pub.name AS publisher_name,
                    s.shelf_name,
                    s.sub_shelf,
                    b.shelf_id AS sub_shelf_id,
                    CASE
                      WHEN b.price IS NOT NULL AND b.price != '' THEN b.price
                      ELSE (
                        SELECT pur.unit_price::text
                        FROM ${this.schema}.purchases pur
                        WHERE pur.book_id = b.id
                        ORDER BY pur.purchase_date DESC, pur.createddate DESC
                        LIMIT 1
                      )
                    END AS price
                   FROM ${this.schema}.books b
                   LEFT JOIN ${this.schema}.authors a ON b.author_id = a.id
                   LEFT JOIN ${this.schema}.categories c ON b.category_id = c.id
                   LEFT JOIN ${this.schema}.publisher pub ON b.publisher_id = pub.id
                   LEFT JOIN ${this.schema}.shelf s ON b.shelf_id = s.id
                   ORDER BY b.createddate DESC`;
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
    const query = `SELECT
                    b.*,
                    a.name AS author_name,
                    c.name AS category_name,
                    pub.name AS publisher_name,
                    s.shelf_name,
                    s.sub_shelf,
                    CASE
                      WHEN b.price IS NOT NULL AND b.price != '' THEN b.price
                      ELSE (
                        SELECT pur.unit_price::text
                        FROM ${this.schema}.purchases pur
                        WHERE pur.book_id = b.id
                        ORDER BY pur.purchase_date DESC, pur.createddate DESC
                        LIMIT 1
                      )
                    END AS price
                   FROM ${this.schema}.books b
                   LEFT JOIN ${this.schema}.authors a ON b.author_id = a.id
                   LEFT JOIN ${this.schema}.categories c ON b.category_id = c.id
                   LEFT JOIN ${this.schema}.publisher pub ON b.publisher_id = pub.id
                   LEFT JOIN ${this.schema}.shelf s ON b.shelf_id = s.id
                   WHERE b.id = $1`;
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

async function create(bookData, userId) {
  console.log("Creating book with data:", bookData);
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }

    const totalCopies = Number(bookData.total_copies || bookData.totalCopies || 1);
    let availableCopies = Number(bookData.available_copies || bookData.availableCopies);

    if (availableCopies === undefined || availableCopies === null || isNaN(availableCopies)) {
      availableCopies = totalCopies;
    }

    if (availableCopies > totalCopies) {
      throw new Error(`Available copies (${availableCopies}) cannot exceed total copies (${totalCopies})`);
    }



    const query = `INSERT INTO ${this.schema}.books
                   (title, author_id, category_id, isbn, total_copies, available_copies,
                    company_id, createddate, lastmodifieddate, createdbyid, lastmodifiedbyid,
                    language, status, pages, price, publisher_id, min_age, max_age, inventory_binding, shelf_id)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                   RETURNING *`;

    const values = [
      bookData.title || "Scanned Book",
      bookData.author_id || bookData.authorId || null,
      bookData.category_id || bookData.categoryId || null,
      bookData.isbn || null,
      totalCopies,
      availableCopies,
      bookData.company_id || bookData.companyId || null,
      userId || null,
      bookData.language || 'English',
      bookData.status || 'available',
      bookData.pages || null,
      bookData.price || null,
      bookData.publisher_id || bookData.publisherId || null,
      bookData.min_age || bookData.minAge || null,
      bookData.max_age || bookData.maxAge || null,
      bookData.inventory_binding || null,
      bookData.sub_shelf_id || null,
    ];
    console.log("Creating book with values:", bookData.price);
    const result = await sql.query(query, values);
    console.log("Book created with ID:", result.rows[0].id);
    return result.rows[0] || null;

  } catch (error) {
    console.error("Error in create:", error);
    throw error;
  }
}

async function updateById(id, bookData, userId) {
  console.log("update book data:", bookData)
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const currentBook = await this.findById(id);
    if (!currentBook) {
      throw new Error("Book not found");
    }

    const totalCopies = bookData.total_copies !== undefined ? bookData.total_copies : currentBook.total_copies;
    const availableCopies = bookData.available_copies !== undefined ? bookData.available_copies : currentBook.available_copies;

    if (availableCopies > totalCopies) {
      throw new Error(`Available copies (${availableCopies}) cannot exceed total copies (${totalCopies})`);
    }

    const query = `UPDATE ${this.schema}.books
                   SET title = $2, author_id = $3, category_id = $4, isbn = $5,
                       total_copies = $6, available_copies = $7,
                       lastmodifieddate = NOW(), lastmodifiedbyid = $8,
                       language = $9, status = $10, pages = $11, price = $12,
                       publisher_id = $13, min_age = $14, max_age = $15 , inventory_binding = $16, shelf_id = $17
                   WHERE id = $1
                   RETURNING *`;

    const values = [
      id,
      bookData.title !== undefined ? bookData.title : currentBook.title,
      bookData.author_id !== undefined ? (bookData.author_id || bookData.authorId) : currentBook.author_id,
      bookData.category_id !== undefined ? (bookData.category_id || bookData.categoryId) : currentBook.category_id,
      bookData.isbn !== undefined ? bookData.isbn : currentBook.isbn,
      totalCopies,
      availableCopies,
      userId || null,
      bookData.language !== undefined ? bookData.language : currentBook.language,
      bookData.status !== undefined ? bookData.status : currentBook.status,
      bookData.pages !== undefined ? bookData.pages : currentBook.pages,
      bookData.price !== undefined ? bookData.price : currentBook.price,
      bookData.publisher_id !== undefined ? (bookData.publisher_id || bookData.publisherId) : currentBook.publisher_id,
      bookData.min_age !== undefined ? (bookData.min_age || bookData.minAge) : currentBook.min_age,
      bookData.max_age !== undefined ? (bookData.max_age || bookData.maxAge) : currentBook.max_age,
      bookData.inventory_binding !== undefined ? bookData.inventory_binding : currentBook.inventory_binding,
      bookData.shelf_id !== undefined ? bookData.shelf_id : currentBook.shelf_id,
    ];

    const result = await sql.query(query, values);
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error("Error in updateById:", error);
    throw error;
  }
}

async function deleteById(id) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `DELETE FROM ${this.schema}.books WHERE id = $1 RETURNING *`;
    const result = await sql.query(query, [id]);
    if (result.rows.length > 0) {
      return { success: true, message: "Book deleted successfully" };
    }
    return { success: false, message: "Book not found" };
  } catch (error) {
    console.error("Error in deleteById:", error);
    throw error;
  }
}

async function findByAgeRange(minAge, maxAge) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }

    let query = `SELECT
                    b.*,
                    a.name AS author_name,
                    c.name AS category_name,
                    pub.name AS publisher_name
                   FROM ${this.schema}.books b
                   LEFT JOIN ${this.schema}.authors a ON b.author_id = a.id
                   LEFT JOIN ${this.schema}.categories c ON b.category_id = c.id
                   LEFT JOIN ${this.schema}.publisher pub ON b.publisher_id = pub.id
                   WHERE b.available_copies > 0 AND b.status = 'available'`;

    const params = [];
    let paramIndex = 1;


    if (minAge !== null && minAge !== undefined) {
      query += ` AND (b.min_age IS NULL OR b.min_age <= $${paramIndex})`;
      params.push(minAge);
      paramIndex++;
    }

    if (maxAge !== null && maxAge !== undefined) {
      query += ` AND (b.max_age IS NULL OR b.max_age >= $${paramIndex})`;
      params.push(maxAge);
      paramIndex++;
    }

    query += ` ORDER BY b.title ASC`;

    const result = await sql.query(query, params);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findByAgeRange:", error);
    throw error;
  }
}

async function findByISBN(isbn, excludeId = null) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    let query = `SELECT * FROM ${this.schema}.books WHERE isbn = $1`;
    const params = [isbn];

    if (excludeId) {
      query += ` AND id != $2`;
      params.push(excludeId);
    }

    const result = await sql.query(query, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error in findByISBN:", error);
    throw error;
  }
}

async function generateInventoryReport() {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }

    // const query = `
    //   SELECT
    //     b.id,
    //     b.title AS book_title,
    //     a.name AS author_name,
    //     pub.name AS publisher_name,
    //     b.isbn,
    //     b.total_copies,
    //     b.available_copies,
    //     c.name AS category_name,
    //     (b.total_copies - b.available_copies) AS issued_copies,
    //     (b.total_copies - b.available_copies - b.available_copies) AS lost_damaged_copies,
    //     CASE
    //       WHEN b.available_copies > 0 THEN 'Available'
    //       WHEN b.available_copies = 0 AND (b.total_copies - b.available_copies) > 0 THEN 'Issued'
    //       ELSE 'Unavailable'
    //     END AS status,
    //     bi.issue_date,
    //     bi.due_date,
    //     lm.card_number,
    //     lm.first_name || ' ' || lm.last_name AS issued_to,
    //     p.purchase_date,
    //     v.name AS vendor_name,
    //     p.purchase_serial_no AS bill_number,
    //     p.unit_price AS book_price
    //   FROM ${this.schema}.books b
    //   LEFT JOIN ${this.schema}.authors a ON b.author_id = a.id
    //   LEFT JOIN ${this.schema}.categories c ON b.category_id = c.id
    //   LEFT JOIN ${this.schema}.publisher pub ON b.publisher_id = pub.id
    //   LEFT JOIN (
    //     SELECT DISTINCT ON (book_id)
    //       book_id,
    //       issue_date,
    //       due_date,
    //       issued_to,
    //       status
    //     FROM ${this.schema}.book_issues
    //     WHERE return_date IS NULL AND status = 'issued'
    //     ORDER BY book_id, issue_date DESC
    //   ) bi ON b.id = bi.book_id
    //   LEFT JOIN ${this.schema}.library_members lm ON bi.issued_to = lm.id AND lm.is_active = true
    //   LEFT JOIN (
    //     SELECT DISTINCT ON (book_id)
    //       book_id,
    //       purchase_date,
    //       vendor_id,
    //       purchase_serial_no,
    //       unit_price
    //     FROM ${this.schema}.purchases
    //     ORDER BY book_id, purchase_date DESC, createddate DESC
    //   ) p ON b.id = p.book_id
    //   LEFT JOIN ${this.schema}.vendors v ON p.vendor_id = v.id
    //   ORDER BY b.title ASC
    // `;

    const query = `
           SELECT
            b.id,
            b.title AS book_title,
            a.name AS author_name,
            pub.name AS publisher_name,
            c.name AS category_name,
            v.name AS vendor_name,

            b.isbn,
            b.total_copies,
            b.available_copies,
            (b.total_copies - b.available_copies) AS issued_copies,

            -- Lost + Damaged Count Added
            COALESCE(bd.lost_count, 0) + COALESCE(bd.damaged_count, 0) AS lost_damaged_copies,

            -- Improved Book Status Logic
            CASE
                WHEN COALESCE(b.available_copies, 0) > 0 THEN 'Available'
                WHEN COALESCE(bd.lost_count, 0) + COALESCE(bd.damaged_count, 0) >= b.total_copies THEN 'Unavailable'
                WHEN (b.total_copies - b.available_copies) > 0 THEN 'Issued'
                ELSE 'Unavailable'
            END AS status,

            bi.issue_date,
            bi.due_date,
            lm.card_number,
            lm.first_name || ' ' || lm.last_name AS issued_to,

            p.purchase_date,
            p.purchase_serial_no AS bill_number,
            p.unit_price AS book_price

        FROM ${this.schema}.books b

        LEFT JOIN ${this.schema}.authors a 
              ON b.author_id = a.id

        LEFT JOIN ${this.schema}.categories c 
              ON b.category_id = c.id

        LEFT JOIN ${this.schema}.publisher pub 
              ON b.publisher_id = pub.id

        -- Latest Active Issue
        LEFT JOIN (
            SELECT DISTINCT ON (book_id)
                book_id, issue_date, due_date, issued_to
            FROM ${this.schema}.book_issues
            WHERE return_date IS NULL AND status = 'issued'
            ORDER BY book_id, issue_date DESC
        ) bi ON b.id = bi.book_id

        LEFT JOIN ${this.schema}.library_members lm 
              ON bi.issued_to = lm.id 
              AND lm.is_active = true

        -- Latest Purchase Info
        LEFT JOIN (
            SELECT DISTINCT ON (book_id)
                book_id, purchase_date, vendor_id, purchase_serial_no, unit_price
            FROM ${this.schema}.purchases
            ORDER BY book_id, purchase_date DESC, createddate DESC
        ) p ON b.id = p.book_id

        LEFT JOIN ${this.schema}.vendors v 
              ON p.vendor_id = v.id

        -- Lost & Damaged Books Subquery
        LEFT JOIN (
            SELECT 
                book_id,
                COUNT(*) FILTER (WHERE status = 'lost') AS lost_count,
                COUNT(*) FILTER (WHERE status = 'damaged') AS damaged_count
            FROM ${this.schema}.book_issues
            GROUP BY book_id
        ) bd ON b.id = bd.book_id
        ORDER BY b.title ASC;
    `;

    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in generateInventoryReport:", error);
    throw error;
  }
}


async function generateBookPopularityReport(params) {

  console.log("parmas=>", params)
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }

    let dateFilter = '';
    let categoryFilter = '';
    let searchFilter = '';
    const queryParams = [];

    if (params.days) {
      const days = parseInt(params.days);
      if (!isNaN(days)) {
        dateFilter = `AND bi.issue_date >= CURRENT_DATE - INTERVAL '${days} days'`;
      }
    } else if (params.startDate && params.endDate) {
      dateFilter = `AND bi.issue_date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
      queryParams.push(params.startDate, params.endDate);
    }

    if (params.category) {
      categoryFilter = `AND b.category_id = $${queryParams.length + 1}`;
      queryParams.push(params.category);
    }

    if (params.searchTerm) {
      searchFilter = `AND (b.title ILIKE $${queryParams.length + 1} OR a.name ILIKE $${queryParams.length + 1})`;
      queryParams.push(`%${params.searchTerm}%`);
    }

    // const query = `
    //         WITH issue_base AS (
    //         SELECT
    //             bi.book_id,
    //             bi.issued_to,
    //             bi.issue_date,
    //             DATE_TRUNC('month', bi.issue_date) AS issue_month
    //         FROM ${this.schema}.book_issues bi
    //         WHERE bi.status = 'issued' ${dateFilter}
    //     ),

    //     issue_summary AS (
    //         SELECT
    //             book_id,
    //             COUNT(*) AS total_issues,
    //             COUNT(DISTINCT issued_to) AS unique_borrowers,
    //             MAX(issue_date) AS last_issue_date,
    //             COUNT(DISTINCT issue_month) AS active_months
    //         FROM issue_base
    //         GROUP BY book_id
    //     ),

    //     category_summary AS (
    //         SELECT
    //             b.category_id,
    //             COUNT(ib.book_id) AS category_total_issues
    //         FROM ${this.schema}.books b
    //         LEFT JOIN issue_base ib ON ib.book_id = b.id
    //         GROUP BY b.category_id
    //     ),

    //     dashboard_stats AS (
    //         SELECT
    //             COUNT(*) FILTER (WHERE bi.status='issued'
    //                 AND DATE_TRUNC('month', bi.issue_date)=DATE_TRUNC('month', CURRENT_DATE)
    //             ) AS total_issues_this_month
    //         FROM ${this.schema}.book_issues bi
    //     )

    //     SELECT
    //         b.id,
    //         b.title AS book_name,
    //         a.name AS author,
    //         c.name AS category,
    //         b.total_copies AS copies,

    //         -- Book Metrics
    //         COALESCE(isum.total_issues,0) AS total_issues,
    //         COALESCE(isum.unique_borrowers,0) AS unique_borrowers,
    //         ROUND(COALESCE(isum.total_issues,0) / NULLIF(isum.active_months,0),2) AS avg_issues_per_month,

    //         -- Popularity Level
    //         CASE
    //             WHEN COALESCE(isum.total_issues,0) >= 50 THEN 'High'
    //             WHEN COALESCE(isum.total_issues,0) BETWEEN 20 AND 49 THEN 'Medium'
    //             ELSE 'Low'
    //         END AS popularity_level,

    //         -- Days Since Last Issue
    //         CASE
    //             WHEN isum.last_issue_date IS NULL THEN NULL
    //             ELSE CURRENT_DATE - isum.last_issue_date
    //         END AS days_since_last_issue,

    //         -- Ranking (Top Books)
    //         RANK() OVER (ORDER BY COALESCE(isum.total_issues,0) DESC) AS popularity_rank,

    //         -- Category Popularity
    //         cs.category_total_issues,

    //         -- Dashboard Metrics (same value repeated per row for UI use)
    //         ds.total_issues_this_month,

    //         -- Flags
    //         CASE WHEN isum.total_issues IS NULL THEN TRUE ELSE FALSE END AS never_issued,

    //         -- Most Popular Book Flag
    //         CASE
    //             WHEN COALESCE(isum.total_issues,0) =
    //                 MAX(COALESCE(isum.total_issues,0)) OVER ()
    //             THEN TRUE ELSE FALSE
    //         END AS is_most_popular,

    //         -- Least Borrowed Book Flag
    //         CASE
    //             WHEN COALESCE(isum.total_issues,0) =
    //                 MIN(COALESCE(isum.total_issues,0)) OVER ()
    //             THEN TRUE ELSE FALSE
    //         END AS is_least_borrowed

    //     FROM ${this.schema}.books b
    //     LEFT JOIN ${this.schema}.authors a ON b.author_id = a.id
    //     LEFT JOIN ${this.schema}.categories c ON b.category_id = c.id
    //     LEFT JOIN issue_summary isum ON b.id = isum.book_id
    //     LEFT JOIN category_summary cs ON cs.category_id = b.category_id
    //     CROSS JOIN dashboard_stats ds

    //     ORDER BY total_issues DESC
    // `;


    const query = `
      WITH issue_base AS (
    SELECT
        bi.book_id,
        bi.issued_to,
        bi.issue_date,
        DATE_TRUNC('month', bi.issue_date) AS issue_month
    FROM ${this.schema}.book_issues bi
    
),

issue_summary AS (
    SELECT
        book_id,
        COUNT(*) AS total_issues,
        COUNT(DISTINCT issued_to) AS unique_borrowers,
        MAX(issue_date) AS last_issue_date,
        COUNT(DISTINCT issue_month) AS active_months
    FROM issue_base
    GROUP BY book_id
),

category_summary AS (
    SELECT
        b.category_id,
        COUNT(ib.book_id) AS category_total_issues
    FROM ${this.schema}.books b
    LEFT JOIN issue_base ib ON ib.book_id = b.id
    GROUP BY b.category_id
),

dashboard_stats AS (
    SELECT
        COUNT(*) FILTER (
            WHERE status = 'issued'
            AND DATE_TRUNC('month', issue_date) = DATE_TRUNC('month', CURRENT_DATE)
        ) AS total_issues_this_month
    FROM ${this.schema}.book_issues
)

SELECT
    b.id,
    b.title AS book_name,
    a.name AS author,
    c.name AS category,
    b.total_copies AS copies,

    -- Book Metrics
    COALESCE(isum.total_issues,0) AS total_issues,
    COALESCE(isum.unique_borrowers,0) AS unique_borrowers,
    ROUND(
        COALESCE(isum.total_issues,0) / NULLIF(isum.active_months,0),
        2
    ) AS avg_issues_per_month,

    -- Popularity Level
    CASE
        WHEN COALESCE(isum.total_issues,0) >= 50 THEN 'High'
        WHEN COALESCE(isum.total_issues,0) BETWEEN 20 AND 49 THEN 'Medium'
        ELSE 'Low'
    END AS popularity_level,

    -- Days Since Last Issue
    CASE
        WHEN isum.last_issue_date IS NULL THEN NULL
        ELSE CURRENT_DATE - isum.last_issue_date
    END AS days_since_last_issue,

    -- Ranking (Top Books)
    RANK() OVER (ORDER BY COALESCE(isum.total_issues,0) DESC) AS popularity_rank,

    -- Category Popularity
    cs.category_total_issues,

    -- Dashboard Metric
    ds.total_issues_this_month,

    -- Never Issued Flag (FIXED)
    CASE
        WHEN COALESCE(isum.total_issues,0) = 0 THEN TRUE
        ELSE FALSE
    END AS never_issued,

    -- Most Popular Book Flag
    CASE
        WHEN COALESCE(isum.total_issues,0) =
            MAX(COALESCE(isum.total_issues,0)) OVER ()
        THEN TRUE ELSE FALSE
    END AS is_most_popular,

    -- Least Borrowed Book (excluding never issued) — FIXED
    CASE
        WHEN COALESCE(isum.total_issues,0) > 0
         AND COALESCE(isum.total_issues,0) =
             MIN(NULLIF(isum.total_issues,0)) OVER ()
        THEN TRUE ELSE FALSE
    END AS is_least_borrowed

FROM ${this.schema}.books b
LEFT JOIN ${this.schema}.authors a ON b.author_id = a.id
LEFT JOIN ${this.schema}.categories c ON b.category_id = c.id
LEFT JOIN issue_summary isum ON b.id = isum.book_id
LEFT JOIN category_summary cs ON cs.category_id = b.category_id
CROSS JOIN dashboard_stats ds
WHERE 1=1 ${categoryFilter} ${searchFilter}

ORDER BY total_issues DESC;

    `;

    const result = await sql.query(query, queryParams);

    console.log("BookPopularityResult=>", result.rows)

    // Process the data to match the expected format
    const rows = result.rows;

    // Main table data
    const mainTable = rows.map(row => ({
      id: row.id,
      book_name: row.book_name,
      author: row.author,
      category: row.category,
      copies: row.copies,
      total_issues: row.total_issues,
      unique_borrowers: row.unique_borrowers,
      avg_issues_per_month: parseFloat(row.avg_issues_per_month) || 0,
      popularity_level: row.popularity_level,
      days_since_last_issue: row.days_since_last_issue
    }));

    // Key metrics
    const keyMetrics = {
      currentMonthIssues: rows.length > 0 ? rows[0].total_issues_this_month : 0,

      mostPopularBook: rows.find(row => row.is_most_popular)
        ? {
          book_name: rows.find(row => row.is_most_popular).book_name,
          total_issues: rows.find(row => row.is_most_popular).total_issues
        }
        : null,

      leastBorrowedBook: rows.find(row => row.is_least_borrowed)
        ? {
          book_name: rows.find(row => row.is_least_borrowed).book_name,
          total_issues: rows.find(row => row.is_least_borrowed).total_issues
        }
        : null,

      neverIssuedBooks: rows.filter(row => row.never_issued).length,

      mostActiveCategory:
        rows.length > 0
          ? (() => {
            const categoryMap = {};

            rows.forEach(row => {
              if (row.category) {
                categoryMap[row.category] =
                  (categoryMap[row.category] || 0) + (row.total_issues || 0);
              }
            });

            if (Object.keys(categoryMap).length === 0) return null;

            const maxCategory = Object.keys(categoryMap).reduce((a, b) =>
              categoryMap[a] > categoryMap[b] ? a : b
            );

            return {
              category_name: maxCategory,
              total_issues: categoryMap[maxCategory]
            };
          })()
          : null   // 🔥 THIS WAS MISSING
    };


    // Popular books (top 10)
    const popularBooks = rows
      .filter(row => row.popularity_rank <= 10)
      .map(row => ({
        ranking: row.popularity_rank,
        book_name: row.book_name,
        total_issues: row.total_issues,
        avg_issues_per_month: parseFloat(row.avg_issues_per_month) || 0
      }));

    // Category popularity
    const categoryMap = {};
    rows.forEach(row => {
      if (row.category) {
        categoryMap[row.category] = (categoryMap[row.category] || 0) + row.total_issues;
      }
    });
    const categoryPopularity = Object.keys(categoryMap).map(category => ({
      category_name: category,
      total_issues: categoryMap[category]
    }));

    // Copy usage (simplified - would need actual copy tracking)
    const copyUsage = [];

    return {
      mainTable,
      keyMetrics,
      popularBooks,
      categoryPopularity,
      copyUsage
    };

  } catch (error) {
    console.error("Error in generateBookPopularityReport:", error);
    throw error;
  }
}


async function exportBookPopularityReportExcel(params) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }

    // Get the report data
    const reportData = await this.generateBookPopularityReport(params);

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Library Management System';
    workbook.lastModifiedBy = 'System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Main Table Sheet
    const mainTableSheet = workbook.addWorksheet('Book Popularity Report');

    // Add title
    mainTableSheet.mergeCells('A1:H1');
    mainTableSheet.getCell('A1').value = 'Book Popularity Analytics Report';
    mainTableSheet.getCell('A1').font = { size: 16, bold: true };
    mainTableSheet.getCell('A1').alignment = { horizontal: 'center' };

    // Add filters info
    mainTableSheet.getCell('A3').value = 'Filters Applied:';
    mainTableSheet.getCell('A3').font = { bold: true };

    let filterRow = 4;
    if (params.days) {
      mainTableSheet.getCell(`A${filterRow}`).value = `Time Period: Last ${params.days} days`;
      filterRow++;
    }
    if (params.category) {
      mainTableSheet.getCell(`A${filterRow}`).value = `Category: ${params.category}`;
      filterRow++;
    }
    if (params.searchTerm) {
      mainTableSheet.getCell(`A${filterRow}`).value = `Search: ${params.searchTerm}`;
      filterRow++;
    }

    // Add headers
    const headers = ['Book Title', 'Author', 'Category', 'Total Copies', 'Total Issues', 'Unique Borrowers', 'Avg Issues/Month', 'Popularity Level'];
    headers.forEach((header, index) => {
      const cell = mainTableSheet.getCell(6, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add data
    reportData.mainTable.forEach((row, index) => {
      const rowIndex = index + 7;
      mainTableSheet.getCell(rowIndex, 1).value = row.book_name;
      mainTableSheet.getCell(rowIndex, 2).value = row.author || 'N/A';
      mainTableSheet.getCell(rowIndex, 3).value = row.category || 'N/A';
      mainTableSheet.getCell(rowIndex, 4).value = row.copies;
      mainTableSheet.getCell(rowIndex, 5).value = row.total_issues;
      mainTableSheet.getCell(rowIndex, 6).value = row.unique_borrowers;
      mainTableSheet.getCell(rowIndex, 7).value = row.avg_issues_per_month;
      mainTableSheet.getCell(rowIndex, 8).value = row.popularity_level;

      // Add borders
      for (let col = 1; col <= 8; col++) {
        mainTableSheet.getCell(rowIndex, col).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });

    // Auto-fit columns
    mainTableSheet.columns.forEach(column => {
      column.width = 15;
    });

    // Popular Books Sheet
    if (reportData.popularBooks && reportData.popularBooks.length > 0) {
      const popularSheet = workbook.addWorksheet('Top Popular Books');
      popularSheet.getCell('A1').value = 'Top 10 Popular Books';
      popularSheet.getCell('A1').font = { size: 14, bold: true };

      const popularHeaders = ['Rank', 'Book Title', 'Total Issues', 'Avg Issues/Month'];
      popularHeaders.forEach((header, index) => {
        const cell = popularSheet.getCell(3, index + 1);
        cell.value = header;
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6E6FA' }
        };
      });

      reportData.popularBooks.forEach((book, index) => {
        const rowIndex = index + 4;
        popularSheet.getCell(rowIndex, 1).value = book.ranking;
        popularSheet.getCell(rowIndex, 2).value = book.book_name;
        popularSheet.getCell(rowIndex, 3).value = book.total_issues;
        popularSheet.getCell(rowIndex, 4).value = book.avg_issues_per_month;
      });

      popularSheet.columns.forEach(column => {
        column.width = 20;
      });
    }

    // Category Popularity Sheet
    if (reportData.categoryPopularity && reportData.categoryPopularity.length > 0) {
      const categorySheet = workbook.addWorksheet('Category Popularity');
      categorySheet.getCell('A1').value = 'Category-wise Book Issues';
      categorySheet.getCell('A1').font = { size: 14, bold: true };

      const categoryHeaders = ['Category', 'Total Issues'];
      categoryHeaders.forEach((header, index) => {
        const cell = categorySheet.getCell(3, index + 1);
        cell.value = header;
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6E6FA' }
        };
      });

      reportData.categoryPopularity.forEach((category, index) => {
        const rowIndex = index + 4;
        categorySheet.getCell(rowIndex, 1).value = category.category_name;
        categorySheet.getCell(rowIndex, 2).value = category.total_issues;
      });

      categorySheet.columns.forEach(column => {
        column.width = 20;
      });
    }

    return workbook;

  } catch (error) {
    console.error("Error in exportBookPopularityReportExcel:", error);
    throw error;
  }
}

async function exportBookPopularityReportPDF(params) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }

    const reportData = await this.generateBookPopularityReport(params);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });


    doc.fontSize(20).text('Book Popularity Analytics Report', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text('Filters Applied:', { underline: true });
    if (params.days) {
      doc.text(`Time Period: Last ${params.days} days`);
    }
    if (params.category) {
      doc.text(`Category: ${params.category}`);
    }
    if (params.searchTerm) {
      doc.text(`Search: ${params.searchTerm}`);
    }
    doc.moveDown();

    doc.fontSize(14).text('Summary Statistics:', { underline: true });
    doc.fontSize(10);
    doc.text(`Total Books: ${reportData.mainTable.length}`);
    doc.text(`Current Month Issues: ${reportData.keyMetrics.currentMonthIssues}`);
    if (reportData.keyMetrics.mostPopularBook) {
      doc.text(`Most Popular Book: ${reportData.keyMetrics.mostPopularBook.book_name} (${reportData.keyMetrics.mostPopularBook.total_issues} issues)`);
    }
    doc.text(`Never Issued Books: ${reportData.keyMetrics.neverIssuedBooks}`);
    doc.moveDown();

    const tableTop = doc.y;
    const headers = ['Book Title', 'Author', 'Category', 'Issues', 'Borrowers', 'Level'];

    doc.fontSize(10);
    headers.forEach((header, i) => {
      const x = 50 + (i * 80);
      doc.text(header, x, tableTop, { width: 70, align: 'left' });
    });

    doc.moveDown();

    // Table Data
    reportData.mainTable.slice(0, 30).forEach((row, index) => { // Limit to 30 rows for PDF
      if (doc.y > 700) { // Check if near page bottom
        doc.addPage();
      }

      const y = doc.y;
      doc.text(row.book_name.substring(0, 25), 50, y, { width: 70 });
      doc.text((row.author || 'N/A').substring(0, 15), 130, y, { width: 70 });
      doc.text((row.category || 'N/A').substring(0, 15), 210, y, { width: 70 });
      doc.text(row.total_issues.toString(), 290, y, { width: 70 });
      doc.text(row.unique_borrowers.toString(), 370, y, { width: 70 });
      doc.text(row.popularity_level, 450, y, { width: 70 });

      doc.moveDown(0.5);
    });

    // Top Books Section
    if (reportData.popularBooks && reportData.popularBooks.length > 0) {
      doc.addPage();
      doc.fontSize(14).text('Top 10 Popular Books', { underline: true });
      doc.moveDown();

      reportData.popularBooks.forEach((book, index) => {
        doc.fontSize(10).text(`${book.ranking}. ${book.book_name} - ${book.total_issues} issues`);
      });
    }

    // Category Popularity Section
    if (reportData.categoryPopularity && reportData.categoryPopularity.length > 0) {
      doc.addPage();
      doc.fontSize(14).text('Category-wise Statistics', { underline: true });
      doc.moveDown();

      reportData.categoryPopularity.forEach((category) => {
        doc.fontSize(10).text(`${category.category_name}: ${category.total_issues} issues`);
      });
    }

    // Footer
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).text(
        `Generated on ${new Date().toLocaleDateString()} - Page ${i + 1} of ${pageCount}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
    }

    return doc;

  } catch (error) {
    console.error("Error in exportBookPopularityReportPDF:", error);
    throw error;
  }
}

module.exports = {
  init,
  findAll,
  findById,
  create,
  updateById,
  deleteById,
  findByISBN,
  findByAgeRange,
  generateInventoryReport,
  generateBookPopularityReport,
  exportBookPopularityReportPDF
};
