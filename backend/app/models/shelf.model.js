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

    const subShelves = Array.isArray(data.sub_shelf)
        ? data.sub_shelf
        : (data.sub_shelf ? [data.sub_shelf] : []);

    // 🔍 SUB-SHELF DUPLICATE CHECK (GLOBAL)
    if (subShelves.length) {
        const dupQuery = `
            SELECT id FROM ${this.schema}.shelf
            WHERE sub_shelf ?| $1::text[]
            LIMIT 1
        `;

        const dup = await sql.query(dupQuery, [subShelves]);

        if (dup.rows.length > 0) {
            throw new Error("Sub-shelf already exists");
        }
    }

    // ✅ INSERT
    const query = `
        INSERT INTO ${this.schema}.shelf
        (shelf_name, note, sub_shelf, status, createddate, lastmodifieddate)
        VALUES ($1,$2,$3,$4,NOW(),NOW())
        RETURNING *
    `;

    const values = [
        data.shelf_name || null,
        data.note || null,
        subShelves.length ? JSON.stringify(subShelves) : null,
        data.status === true || data.status === "true"
    ];

    const result = await sql.query(query, values);
    return result.rows[0];
}


async function updateById(id, data) {

    const subShelves = Array.isArray(data.sub_shelf)
        ? data.sub_shelf
        : (data.sub_shelf ? [data.sub_shelf] : []);

    // 🔍 SUB-SHELF DUPLICATE CHECK (exclude current id)
    if (subShelves.length) {
        const dupQuery = `
            SELECT id FROM ${this.schema}.shelf
            WHERE id <> $2
            AND sub_shelf ?| $1::text[]
            LIMIT 1
        `;

        const dup = await sql.query(dupQuery, [
            subShelves,
            id
        ]);

        if (dup.rows.length > 0) {
            throw new Error("Sub-shelf already exists");
        }
    }

    const q = `
        UPDATE ${this.schema}.shelf
        SET shelf_name=$2,
            note=$3,
            sub_shelf=$4,
            status=$5,
            lastmodifieddate=NOW()
        WHERE id=$1
        RETURNING *
    `;

    const r = await sql.query(q, [
        id,
        data.shelf_name || null,
        data.note || null,
        subShelves.length ? JSON.stringify(subShelves) : null,
        data.status === true || data.status === "true"
    ]);

    return r.rows[0];
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
};
