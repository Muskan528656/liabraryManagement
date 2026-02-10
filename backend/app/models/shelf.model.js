const sql = require("./db.js");

function init(schema) {
    this.schema = schema;
}

// ================= FIND ALL =================
async function findAll() {
    const q = `
        SELECT id, shelf_name, note, sub_shelf, status,
               createddate, lastmodifieddate
        FROM ${this.schema}.shelf
        ORDER BY createddate DESC
    `;
    const r = await sql.query(q);
    return r.rows;
}

// ================= FIND BY ID =================
async function findById(id) {
    const q = `
        SELECT id, shelf_name, note, sub_shelf, status,
               createddate, lastmodifieddate
        FROM ${this.schema}.shelf
        WHERE id=$1
    `;
    const r = await sql.query(q, [id]);
    return r.rows[0];
}

async function create(data) {
    let subShelvesText = null;
    if (data.sub_shelf !== undefined && data.sub_shelf !== null && data.sub_shelf !== '') {
        subShelvesText = String(data.sub_shelf).trim();
    }

    // Check for duplicate shelf_name + sub_shelf combination
    if (data.shelf_name) {
        let dupQuery;
        let params;

        if (subShelvesText === null) {
            dupQuery = `
                SELECT id FROM ${this.schema}.shelf
                WHERE shelf_name = $1 AND sub_shelf IS NULL
                LIMIT 1
            `;
            params = [data.shelf_name];
        } else {
            dupQuery = `
                SELECT id FROM ${this.schema}.shelf
                WHERE shelf_name = $1 AND sub_shelf = $2
                LIMIT 1
            `;
            params = [data.shelf_name, subShelvesText];
        }

        const dup = await sql.query(dupQuery, params);

        if (dup.rows.length > 0) {
            throw new Error("This shelf name and sub-shelf combination already exists");
        }
    }

    // INSERT
    const query = `
        INSERT INTO ${this.schema}.shelf
        (shelf_name, note, sub_shelf, status, createddate, lastmodifieddate)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING *
    `;

    const values = [
        data.shelf_name || null,
        data.note || null,
        subShelvesText,
        data.status === true || data.status === "true" || data.status === "1"
    ];

    try {
        const result = await sql.query(query, values);
        return result.rows[0];
    } catch (error) {
        if (error.code === '23505') { // unique_violation
            throw new Error("This shelf name and sub-shelf combination already exists");
        }
        throw error;
    }
}

async function updateById(id, data) {
    let subShelvesText = null;
    if (data.sub_shelf !== undefined && data.sub_shelf !== null && data.sub_shelf !== '') {
        subShelvesText = String(data.sub_shelf).trim();
    }

    // Check for duplicates (excluding current id)
    if (data.shelf_name) {
        let dupQuery, params;

        if (subShelvesText === null) {
            dupQuery = `
                SELECT id FROM ${this.schema}.shelf
                WHERE id <> $1
                AND shelf_name = $2 
                AND sub_shelf IS NULL
                LIMIT 1
            `;
            params = [id, data.shelf_name];
        } else {
            dupQuery = `
                SELECT id FROM ${this.schema}.shelf
                WHERE id <> $1
                AND shelf_name = $2 
                AND sub_shelf = $3
                LIMIT 1
            `;
            params = [id, data.shelf_name, subShelvesText];
        }

        const dup = await sql.query(dupQuery, params);

        if (dup.rows.length > 0) {
            throw new Error("This shelf name and sub-shelf combination already exists");
        }
    }

    // UPDATE query
    const q = `
        UPDATE ${this.schema}.shelf
        SET shelf_name = COALESCE($2, shelf_name),
            note = COALESCE($3, note),
            sub_shelf = COALESCE($4, sub_shelf),
            status = COALESCE($5, status),
            lastmodifieddate = NOW()
        WHERE id = $1
        RETURNING *
    `;

    try {
        const r = await sql.query(q, [
            id,
            data.shelf_name || null,
            data.note || null,
            subShelvesText,
            data.status !== undefined ? (data.status === true || data.status === "true" || data.status === "1") : null
        ]);

        if (r.rows.length === 0) {
            throw new Error("Shelf not found");
        }

        return r.rows[0];
    } catch (error) {
        if (error.code === '23505') { // unique_violation
            throw new Error("This shelf name and sub-shelf combination already exists");
        }
        throw error;
    }
}

// ================= FIND GROUPED SHELVES =================
async function findGroupedShelves() {
    const q = `
        SELECT id, shelf_name, sub_shelf
        FROM ${this.schema}.shelf
        WHERE status = true
        ORDER BY shelf_name, sub_shelf;
    `;
    const r = await sql.query(q);

    // Group by shelf_name
    const grouped = {};

    r.rows.forEach(row => { 
        if (!grouped[row.shelf_name]) {
            grouped[row.shelf_name] = [];
        }

        if (row.sub_shelf) {
            grouped[row.shelf_name].push({
                id: row.id,             
                name: row.sub_shelf      
            });
        }
    });

    return Object.keys(grouped)
        .map(shelf_name => ({
            shelf_name,
            sub_shelves: grouped[shelf_name]
        }))
        .sort((a, b) => a.shelf_name.localeCompare(b.shelf_name));
}

// ================= DELETE =================
async function deleteById(id) {
    await sql.query(
        `DELETE FROM ${this.schema}.shelf WHERE id=$1`,
        [id]
    );
}

module.exports = {
    init,
    findAll,
    findById,
    create,
    updateById,
    deleteById,
    findGroupedShelves,
};
