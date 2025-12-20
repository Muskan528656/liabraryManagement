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
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT 
                    b.*,
                    a.name AS author_name,
                    c.name AS category_name
                   FROM ${this.schema}.books b
                   LEFT JOIN ${this.schema}.authors a ON b.author_id = a.id
                   LEFT JOIN ${this.schema}.categories c ON b.category_id = c.id
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
                    c.name AS category_name
                   FROM ${this.schema}.books b
                   LEFT JOIN ${this.schema}.authors a ON b.author_id = a.id
                   LEFT JOIN ${this.schema}.categories c ON b.category_id = c.id
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

    console.log("bookdataaa->>>", bookData);

    const query = `INSERT INTO ${this.schema}.books 
                   (title, author_id, category_id, isbn, total_copies, available_copies, 
                    company_id, createddate, lastmodifieddate, createdbyid, lastmodifiedbyid, 
                    language, status, pages, price) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8, $8, $9, $10, $11, $12) 
                   RETURNING *`;

    const values = [
      bookData.title || "Scanned Book",
      bookData.author_id || bookData.authorId || null,
      bookData.category_id || bookData.categoryId || null,
      bookData.isbn || `SCAN-${Date.now()}`,
      totalCopies,
      availableCopies,
      bookData.company_id || bookData.companyId || null,
      userId || null,
      bookData.language || 'English',
      bookData.status || 'available',
      bookData.pages || null,
      bookData.price || null
    ];

    const result = await sql.query(query, values);
    return result.rows[0] || null;

  } catch (error) {
    console.error("Error in create:", error);
    throw error;
  }
}

async function updateById(id, bookData, userId) {
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
                       language = $9, status = $10, pages = $11, price = $12
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
      bookData.price !== undefined ? bookData.price : currentBook.price
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

module.exports = {
  init,
  findAll,
  findById,
  create,
  updateById,
  deleteById,
  findByISBN,
};

