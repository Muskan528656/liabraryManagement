const sql = require("./db.js");

let schema = "";
let branchId = "";

function init(schema_name, branch_id) {
    schema = schema_name;
    branchId = branch_id || "";
}

// Create a new book copy
async function create(data) {
    if (!schema) throw new Error("Schema not initialized. Call init() first.");

    const {
        book_id,
        home_branch_id,
        holding_branch_id,
        barcode,
        cn_source,
        cn_class,
        cn_item,
        cn_suffix,
        library_member_type,
        status,
        item_price,
        date_accessioned,
        rack_mapping_id,
        createdbyid
    } = data;

    const query = `
        INSERT INTO ${schema}.book_copy (
            book_id, home_branch_id, holding_branch_id, barcode, 
            cn_source, cn_class, cn_item, cn_suffix,
            library_member_type, status, item_price, date_accessioned, rack_mapping_id,
            createdbyid
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
    `;

    const values = [
        book_id, home_branch_id || branchId, holding_branch_id || home_branch_id || branchId, barcode,
        cn_source || 'DDC', cn_class, cn_item, cn_suffix,
        library_member_type, status || 'AVAILABLE', item_price, date_accessioned || new Date(), rack_mapping_id,
        createdbyid
    ];

    const result = await sql.query(query, values);

    // Update rack capacity if rack_mapping_id is provided
    if (rack_mapping_id) {
        try {
            const updateRackQuery = `
                UPDATE ${schema}.rack_mapping 
                SET capacity = capacity - 1,
                    lastmodifieddate = NOW(),
                    lastmodifiedbyid = $2
                WHERE id = $1 AND capacity > 0
                RETURNING capacity
            `;
            const rackResult = await sql.query(updateRackQuery, [rack_mapping_id, createdbyid]);

            if (rackResult.rows.length > 0) {
                console.log(`Rack capacity updated. New capacity: ${rackResult.rows[0].capacity}`);
            } else {
                console.warn(`Could not update rack capacity for rack_mapping_id: ${rack_mapping_id}`);
            }
        } catch (error) {
            console.error("Error updating rack capacity:", error);
            // Don't fail the book creation if rack update fails
        }
    }

    return result.rows[0];
}

// Get all book copies with pagination and search
async function findAll(filters = {}, page = 1, limit = 10) {
    if (!schema) throw new Error("Schema not initialized. Call init() first.");

    let query = `
        SELECT bc.*, b.title, bc.rack_mapping_id, rm.full_location_code, rm.name
        FROM ${schema}.book_copy bc 
        LEFT JOIN ${schema}.books b ON bc.book_id = b.id 
        LEFT JOIN ${schema}.rack_mapping rm ON rm.id = bc.rack_mapping_id
        WHERE 1=1
    `;
    let countQuery = `
        SELECT COUNT(*) 
        FROM ${schema}.book_copy bc 
        LEFT JOIN ${schema}.books b ON bc.book_id = b.id 
        WHERE 1=1
    `;
    let values = [];
    let paramCount = 0;

    // Apply branch filter if present in init
    if (branchId) {
        paramCount++;
        query += ` AND bc.home_branch_id = $${paramCount}`;
        countQuery += ` AND bc.home_branch_id = $${paramCount}`;
        values.push(branchId);
    }

    // Apply filters
    if (filters.search) {
        paramCount++;
        const searchParam = `%${filters.search}%`;
        query += ` AND (bc.barcode ILIKE $${paramCount} OR b.title ILIKE $${paramCount} OR bc.cn_class ILIKE $${paramCount})`;
        countQuery += ` AND (bc.barcode ILIKE $${paramCount} OR b.title ILIKE $${paramCount} OR bc.cn_class ILIKE $${paramCount})`;
        values.push(searchParam);
    }

    if (filters.book_id) {
        paramCount++;
        query += ` AND bc.book_id = $${paramCount}`;
        countQuery += ` AND bc.book_id = $${paramCount}`;
        values.push(filters.book_id);
    }

    if (filters.home_branch_id) {
        paramCount++;
        query += ` AND bc.home_branch_id = $${paramCount}`;
        countQuery += ` AND bc.home_branch_id = $${paramCount}`;
        values.push(filters.home_branch_id);
    }

    if (filters.status) {
        paramCount++;
        query += ` AND bc.status = $${paramCount}`;
        countQuery += ` AND bc.status = $${paramCount}`;
        values.push(filters.status);
    }

    // Add ordering
    query += ' ORDER BY bc.createddate DESC';

    // Add pagination
    const offset = (page - 1) * limit;
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    values.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    values.push(offset);

    const [itemsResult, countResult] = await Promise.all([
        sql.query(query, values),
        sql.query(countQuery, values.slice(0, -2))
    ]);

    return {
        book_copies: itemsResult.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    };
}

// Get a single book copy by ID
async function findById(id) {
    if (!schema) throw new Error("Schema not initialized. Call init() first.");

    const query = `
        SELECT bc.*, b.title, br.name as branch_name 
        FROM ${schema}.book_copy bc 
        LEFT JOIN ${schema}.books b ON bc.book_id = b.id 
        LEFT JOIN ${schema}.branches br ON bc.home_branch_id = br.id 
        WHERE bc.id = $1
    `;
    const result = await sql.query(query, [id]);
    return result.rows[0];
}

// Update a book copy
async function update(id, data) {
    if (!schema) throw new Error("Schema not initialized. Call init() first.");

    const fields = [];
    const values = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
            paramCount++;
            fields.push(`${key} = $${paramCount}`);
            values.push(value);
        }
    }

    if (fields.length === 0) {
        throw new Error('No fields to update');
    }

    values.push(id);
    const query = `UPDATE ${schema}.book_copy SET ${fields.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`;

    const result = await sql.query(query, values);
    return result.rows[0];
}

// Delete a book copy
async function deleteById(id) {
    if (!schema) throw new Error("Schema not initialized. Call init() first.");

    const query = `DELETE FROM ${schema}.book_copy WHERE id = $1 RETURNING *`;
    const result = await sql.query(query, [id]);
    return result.rows[0];
}

// Get book copies by book ID
async function findByBookId(bookId) {
    if (!schema) throw new Error("Schema not initialized. Call init() first.");

    const query = `
        SELECT bc.*, b.title, br.name as branch_name 
        FROM ${schema}.book_copy bc 
        LEFT JOIN ${schema}.books b ON bc.book_id = b.id 
        LEFT JOIN ${schema}.branches br ON bc.home_branch_id = br.id 
        WHERE bc.book_id = $1
        ORDER BY bc.createddate DESC
    `;
    const result = await sql.query(query, [bookId]);
    return result.rows;
}

// Get book copies by branch ID
async function findByBranchId(branchId) {
    if (!schema) throw new Error("Schema not initialized. Call init() first.");

    const query = `
        SELECT bc.*, b.title, br.name as branch_name 
        FROM ${schema}.book_copy bc 
        LEFT JOIN ${schema}.books b ON bc.book_id = b.id 
        LEFT JOIN ${schema}.branches br ON bc.home_branch_id = br.id 
        WHERE bc.home_branch_id = $1
        ORDER BY bc.createddate DESC
    `;
    const result = await sql.query(query, [branchId]);
    return result.rows;
}

// Create multiple book copies
async function bulkCreate(data, userId) {
    if (!schema) throw new Error("Schema not initialized. Call init() first.");
    const { book_id, quantity, item_price, rack_mapping_id: providedRackId } = data;

    // Fetch book details for call number generation
    const bookQuery = `
        SELECT b.*, c.code as classification_code, c.classification_type, 
               c.classification_from, c.classification_to,
               a.name as author_name
        FROM ${schema}.books b
        LEFT JOIN ${schema}.classification c ON b.classification_id = c.id
        LEFT JOIN ${schema}.authors a ON b.author_id = a.id
        WHERE b.id = $1
    `;
    const bookResult = await sql.query(bookQuery, [book_id]);
    const book = bookResult.rows[0];
    if (!book) throw new Error("Book not found");

    // --- AUTO RACK LOOKUP ---
    // Use provided rack_mapping_id, or auto-find by classification code + branch
    let resolvedRackId = providedRackId || null;

    if (!resolvedRackId && book.classification_code && branchId) {
        const classCode = book.classification_code;
        const classType = book.classification_type || 'DDC';

        // Find a rack in this branch whose classification range covers the book's code
        const rackQuery = `
            SELECT id, capacity,
                   (SELECT COUNT(*) FROM ${schema}.book_copy WHERE rack_mapping_id = rm.id) as used_count
            FROM ${schema}.rack_mapping rm
            WHERE rm.branch_id = $1
              AND rm.is_active = TRUE
              AND rm.classification_type = $2
              AND (
                -- Numeric range check (DDC)
                (rm.classification_from ~ '^[0-9]+$' AND rm.classification_to ~ '^[0-9]+$'
                 AND $3 ~ '^[0-9]+'
                 AND CAST(SPLIT_PART($3, '.', 1) AS INTEGER) BETWEEN CAST(rm.classification_from AS INTEGER) AND CAST(rm.classification_to AS INTEGER))
                OR
                -- Alphabetic range check (LLC)
                (rm.classification_from ~ '^[A-Za-z]+$' AND rm.classification_to ~ '^[A-Za-z]+$'
                 AND UPPER($3) BETWEEN UPPER(rm.classification_from) AND UPPER(rm.classification_to))
              )
            ORDER BY used_count ASC
            LIMIT 1
        `;
        const rackResult = await sql.query(rackQuery, [branchId, classType, classCode]);
        if (rackResult.rows.length > 0) {
            const rack = rackResult.rows[0];
            const usedCount = parseInt(rack.used_count) || 0;
            const capacity = parseInt(rack.capacity) || 100;

            if (usedCount + quantity > capacity) {
                console.warn(`Rack ${rack.id} is near/over capacity (${usedCount}/${capacity}). Assigning anyway.`);
            }
            resolvedRackId = rack.id;
            console.log(`Auto-assigned rack_mapping_id: ${resolvedRackId} for classification code: ${classCode}`);
        } else {
            console.warn(`No matching rack found for classification code: ${classCode}, type: ${classType}, branch: ${branchId}`);
        }
    }

    // Get current max copy count for this book to increment
    const countQuery = `SELECT COUNT(*) FROM ${schema}.book_copy WHERE book_id = $1`;
    const countResult = await sql.query(countQuery, [book_id]);
    let currentCount = parseInt(countResult.rows[0].count);

    const copies = [];
    const { generateAutoNumberSafe } = require("../utils/autoNumber.helper.js");

    for (let i = 0; i < quantity; i++) {
        currentCount++;
        const barcode = await generateAutoNumberSafe('book_copy', userId, 'BC', 8);

        // Generate Call Number
        const authorInitials = book.author_name
            ? book.author_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 3)
            : 'UNK';
        const cn_class = book.classification_code || '000';
        const cn_item = authorInitials;
        const cn_suffix = `c.${currentCount}`;

        const query = `
            INSERT INTO ${schema}.book_copy (
                book_id, home_branch_id, holding_branch_id, barcode, 
                cn_source, cn_class, cn_item, cn_suffix,
                status, item_price, date_accessioned, rack_mapping_id,
                createdbyid
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, $12)
            RETURNING *
        `;

        const values = [
            book_id, branchId, branchId, barcode,
            'DDC', cn_class, cn_item, cn_suffix,
            'AVAILABLE', item_price || 0, resolvedRackId,
            userId
        ];

        const result = await sql.query(query, values);
        copies.push(result.rows[0]);
    }

    return copies;
}

module.exports = {
    init,
    create,
    bulkCreate,
    findAll,
    findById,
    update,
    deleteById,
    findByBookId,
    findByBranchId
};