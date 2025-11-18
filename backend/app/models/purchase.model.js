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

// Create a new purchase
async function create(purchaseData, userId) {
  const client = await sql.connect();
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    
    if (!purchaseData.vendor_id && !purchaseData.vendorId) {
      throw new Error("Vendor ID is required for purchase");
    }
    
    await client.query("BEGIN");

    // Create purchase record
    // Note: total_amount might be a GENERATED column, so we don't insert it
    const purchaseQuery = `INSERT INTO ${this.schema}.purchases 
                   (vendor_id, book_id, quantity, unit_price, purchase_date, notes,
                    createddate, lastmodifieddate, createdbyid, lastmodifiedbyid) 
                   VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $7) 
                   RETURNING *`;
    const purchaseValues = [
      purchaseData.vendor_id || purchaseData.vendorId,
      purchaseData.book_id || purchaseData.bookId,
      purchaseData.quantity || 1,
      purchaseData.unit_price || purchaseData.unitPrice || 0,
      purchaseData.purchase_date || purchaseData.purchaseDate || new Date().toISOString().split('T')[0],
      purchaseData.notes || null,
      userId || null,
    ];
    const purchaseResult = await client.query(purchaseQuery, purchaseValues);
    const purchase = purchaseResult.rows[0];

    // Update book inventory - add purchased copies
    const bookUpdateQuery = `UPDATE ${this.schema}.books 
                            SET total_copies = total_copies + $1,
                                available_copies = available_copies + $1,
                                lastmodifieddate = NOW()
                            WHERE id = $2`;
    await client.query(bookUpdateQuery, [purchaseData.quantity || 1, purchaseData.book_id || purchaseData.bookId]);

    await client.query("COMMIT");
    return purchase;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in create:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Update purchase by ID
async function updateById(id, purchaseData, userId) {
  const client = await sql.connect();
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    
    await client.query("BEGIN");

    // Get old purchase to calculate difference
    const oldPurchase = await client.query(`SELECT * FROM ${this.schema}.purchases WHERE id = $1`, [id]);
    if (oldPurchase.rows.length === 0) {
      throw new Error("Purchase not found");
    }
    const oldQty = oldPurchase.rows[0].quantity;
    const oldBookId = oldPurchase.rows[0].book_id;
    const newQty = purchaseData.quantity || oldQty;
    const newBookId = purchaseData.book_id || purchaseData.bookId || oldBookId;
    const newVendorId = purchaseData.vendor_id || purchaseData.vendorId || oldPurchase.rows[0].vendor_id;

    // Update purchase record
    // Note: total_amount might be a GENERATED column, so we don't update it
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
    const result = await client.query(query, values);

    // Update book inventory if quantity or book changed
    if (oldBookId !== newBookId || oldQty !== newQty) {
      // Remove old quantity from old book
      if (oldBookId !== newBookId) {
        await client.query(`UPDATE ${this.schema}.books 
                           SET total_copies = total_copies - $1,
                               available_copies = available_copies - $1,
                               lastmodifieddate = NOW()
                           WHERE id = $2`, [oldQty, oldBookId]);
      } else {
        // Same book, adjust difference
        const qtyDiff = newQty - oldQty;
        await client.query(`UPDATE ${this.schema}.books 
                           SET total_copies = total_copies + $1,
                               available_copies = available_copies + $1,
                               lastmodifieddate = NOW()
                           WHERE id = $2`, [qtyDiff, newBookId]);
      }

      // Add new quantity to new book (if different)
      if (oldBookId !== newBookId) {
        await client.query(`UPDATE ${this.schema}.books 
                           SET total_copies = total_copies + $1,
                               available_copies = available_copies + $1,
                               lastmodifieddate = NOW()
                           WHERE id = $2`, [newQty, newBookId]);
      }
    }

    await client.query("COMMIT");
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in updateById:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Delete purchase by ID
async function deleteById(id) {
  const client = await sql.connect();
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    
    await client.query("BEGIN");

    // Get purchase details
    const purchase = await client.query(`SELECT * FROM ${this.schema}.purchases WHERE id = $1`, [id]);
    if (purchase.rows.length === 0) {
      return { success: false, message: "Purchase not found" };
    }

    const purchaseData = purchase.rows[0];

    // Delete purchase
    await client.query(`DELETE FROM ${this.schema}.purchases WHERE id = $1`, [id]);

    // Update book inventory - remove purchased copies
    await client.query(`UPDATE ${this.schema}.books 
                       SET total_copies = total_copies - $1,
                           available_copies = GREATEST(0, available_copies - $1),
                           lastmodifieddate = NOW()
                       WHERE id = $2`, [purchaseData.quantity, purchaseData.book_id]);

    await client.query("COMMIT");
    return { success: true, message: "Purchase deleted successfully" };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in deleteById:", error);
    throw error;
  } finally {
    client.release();
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

module.exports = {
  init,
  findAll,
  findById,
  create,
  updateById,
  deleteById,
  getStatistics,
};

