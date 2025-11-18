/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */

const sql = require("./db.js");
let schema = "";

function init(schema_name) {
  schema = schema_name;
  this.schema = schema_name;
}

// Find all book requests with related data
async function findAll() {
  try {

    const query = `SELECT 
                    br.*,
                    b.title AS book_title,  
                    b.isbn AS book_isbn,
                    b.available_copies,
                    request_user.firstname || ' ' || request_user.lastname AS requested_by_name,
                    request_user.email AS requested_by_email,
                    approved_user.firstname || ' ' || approved_user.lastname AS approved_by_name
                   FROM ${schema}.book_requests br
                   LEFT JOIN ${schema}.books b ON br.book_id = b.id
                   LEFT JOIN ${schema}."user" request_user ON br.requested_by = request_user.id
                   LEFT JOIN ${schema}."user" approved_user ON br.approved_by = approved_user.id
                   ORDER BY br.createddate DESC`;
    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}

// Find book request by ID
async function findById(id) {
  try {
    const query = `SELECT 
                    br.*,
                    b.title AS book_title,
                    b.isbn AS book_isbn,
                    b.available_copies,
                    request_user.firstname || ' ' || request_user.lastname AS requested_by_name,
                    request_user.email AS requested_by_email,
                    approved_user.firstname || ' ' || approved_user.lastname AS approved_by_name
                   FROM ${schema}.book_requests br
                   LEFT JOIN ${schema}.books b ON br.book_id = b.id
                   LEFT JOIN ${schema}."user" request_user ON br.requested_by = request_user.id
                   LEFT JOIN ${schema}."user" approved_user ON br.approved_by = approved_user.id
                   WHERE br.id = $1`;
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

// Find requests by user ID
async function findByUserId(userId) {
  try {
    const query = `SELECT 
                    br.*,
                    b.title AS book_title,
                    b.isbn AS book_isbn,
                    b.available_copies
                   FROM ${schema}.book_requests br
                   LEFT JOIN ${schema}.books b ON br.book_id = b.id
                   WHERE br.requested_by = $1
                   ORDER BY br.createddate DESC`;
    const result = await sql.query(query, [userId]);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findByUserId:", error);
    throw error;
  }
}

// Find pending requests (for admin notifications)
async function findPending() {
  try {
    const query = `SELECT 
                    br.*,
                    b.title AS book_title,
                    b.isbn AS book_isbn,
                    b.available_copies,
                    request_user.firstname || ' ' || request_user.lastname AS requested_by_name,
                    request_user.email AS requested_by_email
                   FROM ${schema}.book_requests br
                   LEFT JOIN ${schema}.books b ON br.book_id = b.id
                   LEFT JOIN ${schema}."user" request_user ON br.requested_by = request_user.id
                   WHERE br.status = 'pending'
                   ORDER BY br.createddate DESC`;
    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findPending:", error);
    throw error;
  }
}

// Create a new book request
async function create(requestData, userId) {
  const client = await sql.connect();
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    await client.query("BEGIN");

    // Check if book exists and is available
    const bookCheck = await client.query(`SELECT available_copies, title FROM ${schema}.books WHERE id = $1`, [requestData.book_id || requestData.bookId]);
    if (bookCheck.rows.length === 0) {
      throw new Error("Book not found");
    }

    const book = bookCheck.rows[0];
    const availableCopies = book.available_copies || 0;
    const requestedQuantity = requestData.quantity || 1;

    // Check if book is available (available_copies > 0)
    if (availableCopies <= 0) {
      throw new Error(`This book "${book.title || 'Book'}" is currently out of stock. No copies are available for request.`);
    }

    // Check if requested quantity exceeds available copies
    if (requestedQuantity > availableCopies) {
      throw new Error(`Only ${availableCopies} copy/copies available for "${book.title || 'Book'}". You requested ${requestedQuantity} copies.`);
    }

    // Allow multiple requests - user can request multiple times as long as book is available
    // Removed: Check for pending requests - users can now request multiple times

    // Create the request
    const query = `INSERT INTO ${schema}.book_requests 
                   (book_id, requested_by, quantity, request_date, status, notes,language,
                    createddate, lastmodifieddate, createdbyid, lastmodifiedbyid) 
                   VALUES ($1, $2, $3, $4, $5, $6,$7, NOW(), NOW(), $8, $8) 
                   RETURNING *`;
    const values = [
      requestData.book_id || requestData.bookId,
      userId,
      requestedQuantity,
      requestData.request_date || requestData.requestDate || new Date().toISOString(),
      'pending',
      requestData.notes || null,
      requestData.language || null,
      userId,
    ];
    const result = await client.query(query, values);

    // Reduce available copies immediately when request is created
    await client.query(
      `UPDATE ${schema}.books SET available_copies = available_copies - $1 WHERE id = $2`,
      [requestedQuantity, requestData.book_id || requestData.bookId]
    );

    await client.query("COMMIT");
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in create:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Approve book request and issue book
async function approveRequest(requestId, adminUserId, approvedQuantity = null) {
  const client = await sql.connect();
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    await client.query("BEGIN");

    // Get request details
    const request = await client.query(`SELECT * FROM ${schema}.book_requests WHERE id = $1`, [requestId]);
    if (request.rows.length === 0) {
      throw new Error("Request not found");
    }
    const requestData = request.rows[0];

    if (requestData.status !== 'pending') {
      throw new Error("Request is not pending");
    }

    // Check book availability
    const bookCheck = await client.query(`SELECT available_copies, total_copies, title FROM ${schema}.books WHERE id = $1`, [requestData.book_id]);
    if (bookCheck.rows.length === 0) {
      throw new Error("Book not found");
    }
    const book = bookCheck.rows[0];
    const availableCopies = book.available_copies || 0;
    const requestedQuantity = requestData.quantity || 1;

    // Determine approved quantity (default to requested quantity if not specified)
    let finalApprovedQuantity = approvedQuantity !== null && approvedQuantity !== undefined
      ? parseInt(approvedQuantity)
      : requestedQuantity;

    // Validate approved quantity
    if (finalApprovedQuantity <= 0) {
      throw new Error("Approved quantity must be greater than 0");
    }

    if (finalApprovedQuantity > requestedQuantity) {
      throw new Error(`Approved quantity (${finalApprovedQuantity}) cannot exceed requested quantity (${requestedQuantity})`);
    }

    // Check if we have enough available copies (already reduced when request was created)
    if (availableCopies < finalApprovedQuantity) {
      throw new Error(`Insufficient copies available. Approved: ${finalApprovedQuantity}, Available: ${availableCopies}. Book: "${book.title || 'Unknown'}"`);
    }

    // If approved quantity is less than requested quantity, add back the difference
    const quantityDifference = requestedQuantity - finalApprovedQuantity;
    if (quantityDifference > 0) {
      // Add back the unapproved copies to available_copies
      await client.query(
        `UPDATE ${schema}.books SET available_copies = available_copies + $1 WHERE id = $2`,
        [quantityDifference, requestData.book_id]
      );
    }

    // Reduce total_copies by the approved quantity (permanent deduction from library inventory)
    await client.query(
      `UPDATE ${schema}.books SET total_copies = total_copies - $1 WHERE id = $2`,
      [finalApprovedQuantity, requestData.book_id]
    );

    // Update request status with approved quantity
    const updateRequestQuery = `UPDATE ${schema}.book_requests 
                               SET status = 'approved',
                                   approved_by = $2,
                                   approved_date = NOW(),
                                   approved_quantity = $3,
                                   lastmodifieddate = NOW(),
                                   lastmodifiedbyid = $2
                               WHERE id = $1 
                               RETURNING *`;
    const updatedRequest = await client.query(updateRequestQuery, [requestId, adminUserId, finalApprovedQuantity]);

    // Issue book(s) - create book issue record(s) for approved quantity only
    // Note: available_copies is already reduced when request was created, so we don't reduce again in issueBook
    const BookIssue = require("./bookissue.model.js");
    BookIssue.init(schema); // Initialize with correct schema

    // We need to create book issue records without reducing copies again
    // So we'll use a modified approach - directly insert into book_issues table
    for (let i = 0; i < finalApprovedQuantity; i++) {
      // Get due date (default 7 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      await client.query(
        `INSERT INTO ${schema}.book_issues 
         (book_id, issued_to, issued_by, issue_date, due_date, status, createddate, lastmodifieddate, createdbyid, lastmodifiedbyid) 
         VALUES ($1, $2, $3, CURRENT_DATE, $4, 'issued', NOW(), NOW(), $5, $5)`,
        [requestData.book_id, requestData.requested_by, adminUserId, dueDate.toISOString().split('T')[0], adminUserId]
      );
    }

    await client.query("COMMIT");
    return updatedRequest.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in approveRequest:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Reject book request
async function rejectRequest(requestId, adminUserId, rejectionReason = null) {
  const client = await sql.connect();
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    await client.query("BEGIN");

    // Get request details first
    const request = await client.query(`SELECT * FROM ${schema}.book_requests WHERE id = $1 AND status = 'pending'`, [requestId]);
    if (request.rows.length === 0) {
      throw new Error("Request not found or already processed");
    }
    const requestData = request.rows[0];
    const requestedQuantity = requestData.quantity || 1;

    // Update request status
    const updateQuery = `UPDATE ${schema}.book_requests 
                   SET status = 'rejected',
                       approved_by = $2,
                       approved_date = NOW(),
                       rejection_reason = $3,
                       lastmodifieddate = NOW(),
                       lastmodifiedbyid = $2
                   WHERE id = $1 AND status = 'pending'
                   RETURNING *`;
    const result = await client.query(updateQuery, [requestId, adminUserId, rejectionReason]);

    // Add back the copies that were reserved when request was created
    await client.query(
      `UPDATE ${schema}.books SET available_copies = available_copies + $1 WHERE id = $2`,
      [requestedQuantity, requestData.book_id]
    );

    await client.query("COMMIT");
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    throw new Error("Request not found or already processed");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in rejectRequest:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Cancel book request (by user)
async function cancelRequest(requestId, userId) {
  const client = await sql.connect();
  try {
    if (!schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    await client.query("BEGIN");

    // Get request details first
    const request = await client.query(`SELECT * FROM ${schema}.book_requests WHERE id = $1 AND requested_by = $2 AND status = 'pending'`, [requestId, userId]);
    if (request.rows.length === 0) {
      throw new Error("Request not found or cannot be cancelled");
    }
    const requestData = request.rows[0];
    const requestedQuantity = requestData.quantity || 1;

    // Update request status
    const updateQuery = `UPDATE ${schema}.book_requests 
                   SET status = 'cancelled',
                       lastmodifieddate = NOW(),
                       lastmodifiedbyid = $2
                   WHERE id = $1 AND requested_by = $2 AND status = 'pending'
                   RETURNING *`;
    const result = await client.query(updateQuery, [requestId, userId]);

    // Add back the copies that were reserved when request was created
    await client.query(
      `UPDATE ${schema}.books SET available_copies = available_copies + $1 WHERE id = $2`,
      [requestedQuantity, requestData.book_id]
    );

    await client.query("COMMIT");
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    throw new Error("Request not found or cannot be cancelled");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in cancelRequest:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Get request count for notifications
async function getPendingCount() {
  try {
    const query = `SELECT COUNT(*) AS count FROM ${schema}.book_requests WHERE status = 'pending'`;
    const result = await sql.query(query);
    return result.rows.length > 0 ? parseInt(result.rows[0].count) : 0;
  } catch (error) {
    console.error("Error in getPendingCount:", error);
    throw error;
  }
}

module.exports = {
  init,
  findAll,
  findById,
  findByUserId,
  findPending,
  create,
  approveRequest,
  rejectRequest,
  cancelRequest,
  getPendingCount,
};

