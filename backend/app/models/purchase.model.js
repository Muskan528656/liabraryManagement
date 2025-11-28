/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */
const sql = require("./db.js");
const { getNextAutoNumber } = require("../utils/autoNumber.helper.js");
let schema = "";

function init(schema_name) {
  this.schema = schema_name;
}

async function generatePurchaseSerialNo() {
  try {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    const lastSerialQuery = `SELECT purchase_serial_no 
                            FROM ${this.schema}.purchases 
                            WHERE purchase_serial_no LIKE $1 
                            ORDER BY createddate DESC 
                            LIMIT 1`;
    const pattern = `PUR-${year}-${month}-%`;
    const lastSerialResult = await sql.query(lastSerialQuery, [pattern]);

    let nextNumber = 1;
    if (lastSerialResult.rows.length > 0) {
      const lastSerial = lastSerialResult.rows[0].purchase_serial_no;
      const lastNumber = parseInt(lastSerial.split('-')[3]) || 0;
      nextNumber = lastNumber + 1;
    }

    return `PUR-${year}-${month}-${String(nextNumber).padStart(4, '0')}`;
  } catch (error) {
    console.error("Error generating purchase serial no:", error);
    return `PUR-${Date.now()}`;
  }
}

// Find all purchases with related data
async function findAll() {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT 
                    p.*,
                    pv.name AS vendor_name,
                    pv.company_name AS vendor_company_name,
                    pv.email AS vendor_email,
                    pv.phone AS vendor_phone,
                    pv.address AS vendor_address,
                    b.title AS book_title,
                    b.isbn AS book_isbn,
                    created_user.firstname || ' ' || created_user.lastname AS created_by_name
                   FROM ${this.schema}.purchases p
                   LEFT JOIN ${this.schema}.vendors pv ON p.vendor_id = pv.id
                   LEFT JOIN ${this.schema}.books b ON p.book_id = b.id
                   LEFT JOIN ${this.schema}."user" created_user ON p.createdbyid = created_user.id
                   ORDER BY p.createddate DESC`;
    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}

// Find purchase by ID
async function findById(id) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT 
                    p.*,
                    pv.name AS vendor_name,
                    pv.company_name AS vendor_company_name,
                    pv.email AS vendor_email,
                    pv.phone AS vendor_phone,
                    pv.address AS vendor_address,
                    b.title AS book_title,
                    b.isbn AS book_isbn,
                    created_user.firstname || ' ' || created_user.lastname AS created_by_name
                   FROM ${this.schema}.purchases p
                   LEFT JOIN ${this.schema}.vendors pv ON p.vendor_id = pv.id
                   LEFT JOIN ${this.schema}.books b ON p.book_id = b.id
                   LEFT JOIN ${this.schema}."user" created_user ON p.createdbyid = created_user.id
                   WHERE p.id = $1`;
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

// Find purchase by serial number
async function findBySerialNo(serialNo) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT 
                    p.*,
                    pv.name AS vendor_name,
                    pv.company_name AS vendor_company_name,
                    b.title AS book_title,
                    b.isbn AS book_isbn
                   FROM ${this.schema}.purchases p
                   LEFT JOIN ${this.schema}.vendors pv ON p.vendor_id = pv.id
                   LEFT JOIN ${this.schema}.books b ON p.book_id = b.id
                   WHERE p.purchase_serial_no = $1`;
    const result = await sql.query(query, [serialNo]);
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error("Error in findBySerialNo:", error);
    throw error;
  }
}




async function create(purchaseData, userId) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }

    if (!purchaseData.vendor_id && !purchaseData.vendorId) {
      throw new Error("Vendor ID is required for purchase");
    }


    const purchaseSerialNo = await generateAutoNumberSafe('purchases', userId);

    const purchaseQuery = `INSERT INTO ${this.schema}.purchases 
                   (purchase_serial_no, vendor_id, book_id, quantity, unit_price, purchase_date, notes,
                    createddate, lastmodifieddate, createdbyid, lastmodifiedbyid) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8, $8) 
                   RETURNING *`;
    const purchaseValues = [
      purchaseSerialNo,
      purchaseData.vendor_id || purchaseData.vendorId,
      purchaseData.book_id || purchaseData.bookId,
      purchaseData.quantity || 1,
      purchaseData.unit_price || purchaseData.unitPrice || 0,
      purchaseData.purchase_date || purchaseData.purchaseDate || new Date().toISOString().split('T')[0],
      purchaseData.notes || null,
      userId || null,
    ];

    const purchaseResult = await sql.query(purchaseQuery, purchaseValues);
    const purchase = purchaseResult.rows[0];

    const bookUpdateQuery = `UPDATE ${this.schema}.books 
                            SET total_copies = total_copies + $1,
                                available_copies = available_copies + $1,
                                lastmodifieddate = NOW()
                            WHERE id = $2`;
    await sql.query(bookUpdateQuery, [purchaseData.quantity || 1, purchaseData.book_id || purchaseData.bookId]);

    return purchase;

  } catch (error) {
    console.error("Error in create:", error);
    throw error;
  }
}

async function generateAutoNumberSafe(tableName, userId) {
  try {
    return await getNextAutoNumber(tableName, { prefix: "PUR-", digit_count: 5 }, userId);
  } catch (error) {
    throw error;
  }
}
// Update purchase by ID
async function updateById(id, purchaseData, userId) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }

    const oldPurchase = await sql.query(`SELECT * FROM ${this.schema}.purchases WHERE id = $1`, [id]);
    if (oldPurchase.rows.length === 0) {
      throw new Error("Purchase not found");
    }

    const oldQty = oldPurchase.rows[0].quantity;
    const oldBookId = oldPurchase.rows[0].book_id;
    const newQty = purchaseData.quantity || oldQty;
    const newBookId = purchaseData.book_id || purchaseData.bookId || oldBookId;
    const newVendorId = purchaseData.vendor_id || purchaseData.vendorId || oldPurchase.rows[0].vendor_id;

    const query = `UPDATE ${this.schema}.purchases 
                   SET vendor_id = $2, book_id = $3, quantity = $4, unit_price = $5, 
                       purchase_date = $6, notes = $7,
                       lastmodifieddate = NOW(), lastmodifiedbyid = $8
                   WHERE id = $1 
                   RETURNING *`;
    const values = [
      id,
      newVendorId,
      newBookId,
      newQty,
      purchaseData.unit_price || purchaseData.unitPrice || oldPurchase.rows[0].unit_price,
      purchaseData.purchase_date || purchaseData.purchaseDate || oldPurchase.rows[0].purchase_date,
      purchaseData.notes !== undefined ? purchaseData.notes : oldPurchase.rows[0].notes,
      userId || null,
    ];
    const result = await sql.query(query, values);

    if (oldBookId !== newBookId || oldQty !== newQty) {
      if (oldBookId !== newBookId) {
        await sql.query(`UPDATE ${this.schema}.books 
                           SET total_copies = total_copies - $1,
                               available_copies = available_copies - $1,
                               lastmodifieddate = NOW()
                           WHERE id = $2`, [oldQty, oldBookId]);
      } else {
        const qtyDiff = newQty - oldQty;
        await sql.query(`UPDATE ${this.schema}.books 
                           SET total_copies = total_copies + $1,
                               available_copies = available_copies + $1,
                               lastmodifieddate = NOW()
                           WHERE id = $2`, [qtyDiff, newBookId]);
      }

      if (oldBookId !== newBookId) {
        await sql.query(`UPDATE ${this.schema}.books 
                           SET total_copies = total_copies + $1,
                               available_copies = available_copies + $1,
                               lastmodifieddate = NOW()
                           WHERE id = $2`, [newQty, newBookId]);
      }
    }

    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error("Error in updateById:", error);
    throw error;
  }
}

// Delete purchase by ID
async function deleteById(id) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }

    const purchase = await sql.query(`SELECT * FROM ${this.schema}.purchases WHERE id = $1`, [id]);
    if (purchase.rows.length === 0) {
      return { success: false, message: "Purchase not found" };
    }

    const purchaseData = purchase.rows[0];

    await sql.query(`DELETE FROM ${this.schema}.purchases WHERE id = $1`, [id]);

    await sql.query(`UPDATE ${this.schema}.books 
                       SET total_copies = total_copies - $1,
                           available_copies = GREATEST(0, available_copies - $1),
                           lastmodifieddate = NOW()
                       WHERE id = $2`, [purchaseData.quantity, purchaseData.book_id]);

    return { success: true, message: "Purchase deleted successfully" };
  } catch (error) {
    console.error("Error in deleteById:", error);
    throw error;
  }
}

// Get purchase statistics
async function getStatistics() {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT 
                    COUNT(*) AS total_purchases,
                    SUM(quantity) AS total_books_purchased,
                    SUM(total_amount) AS total_amount_spent,
                    AVG(unit_price) AS avg_unit_price
                   FROM ${this.schema}.purchases`;
    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error in getStatistics:", error);
    throw error;
  }
}

// Get recent purchases with serial numbers
async function getRecentPurchases(limit = 10) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT 
                    p.purchase_serial_no,
                    pv.name AS vendor_name,
                    b.title AS book_title,
                    p.quantity,
                    p.unit_price,
                    p.total_amount,
                    p.purchase_date
                   FROM ${this.schema}.purchases p
                   LEFT JOIN ${this.schema}.vendors pv ON p.vendor_id = pv.id
                   LEFT JOIN ${this.schema}.books b ON p.book_id = b.id
                   ORDER BY p.createddate DESC
                   LIMIT $1`;
    const result = await sql.query(query, [limit]);
    return result.rows;
  } catch (error) {
    console.error("Error in getRecentPurchases:", error);
    throw error;
  }
}

module.exports = {
  init,
  findAll,
  findById,
  findBySerialNo,
  create,
  updateById,
  deleteById,
  getStatistics,
  getRecentPurchases,
  generatePurchaseSerialNo
};