const sql = require("./db.js");

let schema = "";

function init(schema_name) {
  schema = schema_name;
  console.log("Schema:", schema);
}

// 2te a new book with optional copies
async function create(data) {
  if (!schema) throw new Error("Schema not initialized. Call init() first.");

  try {
    const bookQuery = `
            INSERT INTO ${schema}.books (
                company_id, title, author_id, publisher_id, classification_id,
                isbn, edition, publication_year, language, inventory_binding,
                pages, max_age, min_age, status, createdbyid
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *
        `;

    const bookValues = [
      data.company_id || null,
      data.title,
      data.author_id || null,
      data.publisher_id || null,
      data.classification_id || null,
      data.isbn || null,
      data.edition || null,
      data.publication_year || null,
      data.language || 'English',
      data.inventory_binding || null,
      data.pages || null,
      data.max_age || null,
      data.min_age || null,
      data.status || 'ACTIVE',
      data.createdbyid || null
    ];

    const bookResult = await sql.query(bookQuery, bookValues);
    return bookResult.rows[0];
  } catch (error) {
    console.error("Error in Book.create:", error);
    throw error;
  }
}

// Get all books with pagination and search
async function findAll(filters = {}, page = 1, limit = 10) {
  if (!schema) throw new Error("Schema not initialized. Call init() first.");

  let query = `
        SELECT b.*, 
               a.name as author_name, 
               p.name as publisher_name,
               c.name as classification_name,
               c.category as classification_category,
               c.code as classification_code,
               c.classification_type,
               c.classification_from,
               c.classification_to
        FROM ${schema}.books b
        LEFT JOIN ${schema}.authors a ON b.author_id = a.id
        LEFT JOIN ${schema}.publisher p ON b.publisher_id = p.id
        LEFT JOIN ${schema}.classification c ON b.classification_id = c.id
        WHERE 1=1
    `;

  let countQuery = `
        SELECT COUNT(DISTINCT b.id) as count
        FROM ${schema}.books b
        LEFT JOIN ${schema}.authors a ON b.author_id = a.id
        LEFT JOIN ${schema}.publisher p ON b.publisher_id = p.id
        LEFT JOIN ${schema}.classification c ON b.classification_id = c.id
        WHERE 1=1
    `;

  let values = [];
  let paramCount = 0;

  // Apply filters
  if (filters.search) {
    paramCount++;
    const searchParam = `%${filters.search}%`;
    query += ` AND (b.title ILIKE $${paramCount} OR a.name ILIKE $${paramCount} OR p.name ILIKE $${paramCount} OR c.name ILIKE $${paramCount} OR b.isbn ILIKE $${paramCount})`;
    countQuery += ` AND (b.title ILIKE $${paramCount} OR a.name ILIKE $${paramCount} OR p.name ILIKE $${paramCount} OR c.name ILIKE $${paramCount} OR b.isbn ILIKE $${paramCount})`;
    values.push(searchParam);
  }

  if (filters.author_id) {
    paramCount++;
    query += ` AND b.author_id = $${paramCount}`;
    countQuery += ` AND b.author_id = $${paramCount}`;
    values.push(filters.author_id);
  }

  if (filters.publisher_id) {
    paramCount++;
    query += ` AND b.publisher_id = $${paramCount}`;
    countQuery += ` AND b.publisher_id = $${paramCount}`;
    values.push(filters.publisher_id);
  }

  if (filters.classification_id) {
    paramCount++;
    query += ` AND b.classification_id = $${paramCount}`;
    countQuery += ` AND b.classification_id = $${paramCount}`;
    values.push(filters.classification_id);
  }

  if (filters.status) {
    paramCount++;
    query += ` AND b.status = $${paramCount}`;
    countQuery += ` AND b.status = $${paramCount}`;
    values.push(filters.status);
  }

  if (filters.isbn) {
    paramCount++;
    query += ` AND b.isbn = $${paramCount}`;
    countQuery += ` AND b.isbn = $${paramCount}`;
    values.push(filters.isbn);
  }



  // Add ordering
  query += ' ORDER BY b.createddate DESC';

  // Add pagination
  const offset = (page - 1) * limit;
  paramCount++;
  query += ` LIMIT $${paramCount}`;
  values.push(limit);

  paramCount++;
  query += ` OFFSET $${paramCount}`;
  values.push(offset);

  const [booksResult, countResult] = await Promise.all([
    sql.query(query, values),
    sql.query(countQuery, values.slice(0, -2))
  ]);


  return booksResult.rows || [];

}

// Get a single book by ID with related data
// async function findById(id) {
//     if (!schema) throw new Error("Schema not initialized. Call init() first.");

//     const query = `
//         SELECT b.*, 
//                a.name as author_name, 
//                p.name as publisher_name,
//                c.name as classification_name,
//                c.category as classification_category,
//                c.code as classification_code,
//                c.classification_type,
//                c.classification_from,
//                c.classification_to
//         FROM ${schema}.books b
//         LEFT JOIN ${schema}.authors a ON b.author_id = a.id
//         LEFT JOIN ${schema}.publisher p ON b.publisher_id = p.id
//         LEFT JOIN ${schema}.classification c ON b.classification_id = c.id
//         WHERE b.id = $1
//     `;
//     let bookcopyQuery = `
//         SELECT COUNT(DISTINCT b.id) as count
//         FROM ${schema}.book_copy b
//         LEFT JOIN ${schema}.books b ON b.book_id = b.id
//         WHERE b.id = $1
//     `;
//     const result = await sql.query(query, [id]);
//     return result.rows[0];
// }
async function findById(id) {
  if (!schema) throw new Error("Schema not initialized. Call init() first.");

  const query = `
        SELECT 
            b.*, 
            a.name as author_name, 
            p.name as publisher_name,
            c.name as classification_name,
            c.category as classification_category,
            c.code as classification_code,
            c.classification_type,
            c.classification_from,
            c.classification_to,

            COUNT(bc.id) as copy_count,

            COALESCE(
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', bc.id,
                        'barcode', bc.barcode,
                        'status', bc.status,
                        'item_price', bc.item_price,
                        'date_accessioned', bc.date_accessioned,
                        'itemcallnumber', bc.itemcallnumber,
                        'cn_class', bc.cn_class,
                        'cn_item', bc.cn_item,
                        'cn_suffix', bc.cn_suffix,
                        'rack_mapping_id', bc.rack_mapping_id,
                        'rack_location', rm.full_location_code,
                        'rack_name', rm.name,
                        'createddate', bc.createddate
                    )
                    ORDER BY bc.createddate DESC
                ) FILTER (WHERE bc.id IS NOT NULL),
                '[]'
            ) as copies

        FROM ${schema}.books b
        LEFT JOIN ${schema}.authors a ON b.author_id = a.id
        LEFT JOIN ${schema}.publisher p ON b.publisher_id = p.id
        LEFT JOIN ${schema}.classification c ON b.classification_id = c.id
        LEFT JOIN ${schema}.book_copy bc ON bc.book_id = b.id
        LEFT JOIN ${schema}.rack_mapping rm ON rm.id = bc.rack_mapping_id

        WHERE b.id = $1
        GROUP BY 
            b.id, a.name, p.name, 
            c.name, c.category, c.code, 
            c.classification_type, 
            c.classification_from, 
            c.classification_to
    `;

  const result = await sql.query(query, [id]);
  console.log("result.rows[0] iidie ", result.rows[0]);

  return result.rows[0] || null;
}

// Update a book
async function update(id, data) {
  if (!schema) throw new Error("Schema not initialized. Call init() first.");
  let paramCount = 0;
  let fields = [];
  let values = [];
  const allowedFields = [
    'company_id', 'title', 'author_id', 'publisher_id', 'classification_id',
    'isbn', 'edition', 'publication_year', 'language', 'inventory_binding',
    'pages', 'max_age', 'min_age', 'status', 'lastmodifiedbyid'
  ];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && allowedFields.includes(key)) {
      paramCount++;
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  const query = `UPDATE ${schema}.books SET ${fields.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`;

  const result = await sql.query(query, values);
  return result.rows[0];
}

// Delete a book
async function deleteById(id) {
  if (!schema) throw new Error("Schema not initialized. Call init() first.");

  const query = `DELETE FROM ${schema}.books WHERE id = $1 RETURNING *`;
  const result = await sql.query(query, [id]);
  return result.rows[0];
}

// Get books by author
async function findByAuthor(authorId) {
  if (!schema) throw new Error("Schema not initialized. Call init() first.");

  const query = `
        SELECT b.*, 
               a.name as author_name, 
               p.name as publisher_name,
               c.name as classification_name,
               c.category as classification_category,
               c.code as classification_code,
               COUNT(i.id) as item_count
        FROM ${schema}.books b
        LEFT JOIN ${schema}.authors a ON b.author_id = a.id
        LEFT JOIN ${schema}.publisher p ON b.publisher_id = p.id
        LEFT JOIN ${schema}.classification c ON b.classification_id = c.id
        LEFT JOIN ${schema}.book_copy i ON b.id = i.book_id
        WHERE b.author_id = $1
        GROUP BY b.id, a.name, p.name, c.name, c.category, c.code
        ORDER BY b.createddate DESC
    `;

  const result = await sql.query(query, [authorId]);
  return result.rows;
}

// Get books by publisher
async function findByPublisher(publisherId) {
  if (!schema) throw new Error("Schema not initialized. Call init() first.");

  const query = `
        SELECT b.*, 
               a.name as author_name, 
               p.name as publisher_name,
               c.name as classification_name,
               c.category as classification_category,
               c.code as classification_code,
               COUNT(i.id) as item_count
        FROM ${schema}.books b
        LEFT JOIN ${schema}.authors a ON b.author_id = a.id
        LEFT JOIN ${schema}.publisher p ON b.publisher_id = p.id
        LEFT JOIN ${schema}.classification c ON b.classification_id = c.id
        LEFT JOIN ${schema}.book_copy i ON b.id = i.book_id
        WHERE b.publisher_id = $1
        GROUP BY b.id, a.name, p.name, c.name, c.category, c.code
        ORDER BY b.createddate DESC
    `;

  const result = await sql.query(query, [publisherId]);
  return result.rows;
}

// Get books by classification
async function findByClassification(classificationId) {
  if (!schema) throw new Error("Schema not initialized. Call init() first.");

  const query = `
        SELECT b.*, 
               a.name as author_name, 
               p.name as publisher_name,
               c.name as classification_name,
               c.category as classification_category,
               c.code as classification_code,
               COUNT(i.id) as item_count
        FROM ${schema}.books b
        LEFT JOIN ${schema}.authors a ON b.author_id = a.id
        LEFT JOIN ${schema}.publisher p ON b.publisher_id = p.id
        LEFT JOIN ${schema}.classification c ON b.classification_id = c.id
        LEFT JOIN ${schema}.book_copy i ON b.id = i.book_id
        WHERE b.classification_id = $1
        GROUP BY b.id, a.name, p.name, c.name, c.category, c.code
        ORDER BY b.createddate DESC
    `;

  const result = await sql.query(query, [classificationId]);
  return result.rows;
}

module.exports = {
  init,
  create,
  findAll,
  findById,
  update,
  deleteById,
  findByAuthor,
  findByPublisher,
  findByClassification
};