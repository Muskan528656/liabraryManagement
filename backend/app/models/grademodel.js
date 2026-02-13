const sql = require("./db.js");

function init(schema) {
    this.schema = schema;
}

// ================= FIND ALL =================
async function findAll() {
    const q = `
        SELECT id, grade_name, section_name, status,
               createddate, lastmodifieddate, createdbyid, lastmodifiedbyid
        FROM ${this.schema}.grade
        ORDER BY createddate DESC
    `;
    const r = await sql.query(q);
    return r.rows;
}

// ================= FIND BY ID =================
async function findById(id) {
    const q = `
        SELECT id, grade_name, section_name, status,
               createddate, lastmodifieddate, createdbyid, lastmodifiedbyid
        FROM ${this.schema}.grade
        WHERE id=$1
    `;
    const r = await sql.query(q, [id]);
    return r.rows[0];
}

// ================= FIND BY GRADE NAME =================
async function findByGradeName(grade_name) {
    const q = `
        SELECT id, grade_name, section_name, status,
               createddate, lastmodifieddate, createdbyid, lastmodifiedbyid
        FROM ${this.schema}.grade
        WHERE grade_name=$1
        ORDER BY section_name ASC
    `;
    const r = await sql.query(q, [grade_name]);
    return r.rows;
}

// ================= FIND BY GRADE AND SECTION =================
async function findByGradeAndSection(grade_name, section_name) {
    const q = `
        SELECT id, grade_name, section_name, status,
               createddate, lastmodifieddate, createdbyid, lastmodifiedbyid
        FROM ${this.schema}.grade
        WHERE grade_name=$1 AND section_name=$2
    `;
    const r = await sql.query(q, [grade_name, section_name]);
    return r.rows[0];
}

// ================= CREATE =================
async function create(data, userid = null) {
    const duplicateCheck = `
        SELECT id FROM ${this.schema}.grade
        WHERE grade_name=$1 AND section_name=$2
        LIMIT 1
    `;

    const duplicate = await sql.query(duplicateCheck, [
        data.grade_name,
        data.section_name
    ]);

    if (duplicate.rows.length > 0) {
        throw new Error("Grade and section combination already exists");
    }

    // INSERT
    const query = `
        INSERT INTO ${this.schema}.grade
        (grade_name, section_name, status, createddate, lastmodifieddate, createdbyid, lastmodifiedbyid)
        VALUES ($1, $2, $3, NOW(), NOW(), $4, $5)
        RETURNING *
    `;

    const values = [
        data.grade_name || null,
        data.section_name || null,
        data.status === true || data.status === "true" || data.status === undefined ? true : false,
        userid,
        userid
    ];

    const result = await sql.query(query, values);
    return result.rows[0];
}

// ================= UPDATE =================
async function updateById(id, data, userid = null) {
    const duplicateCheck = `
        SELECT id FROM ${this.schema}.grade
        WHERE id <> $3
        AND grade_name=$1 AND section_name=$2
        LIMIT 1
    `;

    const duplicate = await sql.query(duplicateCheck, [
        data.grade_name,
        data.section_name,
        id
    ]);

    if (duplicate.rows.length > 0) {
        throw new Error("Grade and section combination already exists");
    }

    const q = `
        UPDATE ${this.schema}.grade
        SET grade_name=$2,
            section_name=$3,
            status=$4,
            lastmodifieddate=NOW(),
            lastmodifiedbyid=$5
        WHERE id=$1
        RETURNING *
    `;

    const r = await sql.query(q, [
        id,
        data.grade_name || null,
        data.section_name || null,
        data.status === true || data.status === "true" || data.status === "1",
        userid
    ]);

    return r.rows[0];
}

// ================= DELETE =================
async function deleteById(id) {
    await sql.query(
        `DELETE FROM ${this.schema}.grade WHERE id=$1`,
        [id]
    );
}

// ================= BULK CREATE SECTIONS =================
async function bulkCreateSections(grade_name, sections, userid = null) {
    const results = [];

    for (const section of sections) {
        try {
            // Check if section already exists
            const existing = await sql.query(
                `SELECT id FROM ${this.schema}.grade WHERE grade_name=$1 AND section_name=$2`,
                [grade_name, section]
            );

            if (existing.rows.length === 0) {
                const query = `
                    INSERT INTO ${this.schema}.grade
                    (grade_name, section_name, status, createddate, lastmodifieddate, createdbyid, lastmodifiedbyid)
                    VALUES ($1, $2, true, NOW(), NOW(), $3, $4)
                    RETURNING *
                `;

                const result = await sql.query(query, [grade_name, section, userid, userid]);
                results.push(result.rows[0]);
            } else {
                results.push({ grade_name, section_name: section, message: "Already exists" });
            }
        } catch (err) {
            results.push({ grade_name, section_name: section, error: err.message });
        }
    }

    return results;
}

// ================= SEARCH =================
async function search(filters = {}) {
    let query = `SELECT * FROM ${this.schema}.grade WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (filters.grade_name) {
        query += ` AND grade_name ILIKE $${paramCount}`;
        params.push(`%${filters.grade_name}%`);
        paramCount++;
    }

    if (filters.section_name) {
        query += ` AND section_name ILIKE $${paramCount}`;
        params.push(`%${filters.section_name}%`);
        paramCount++;
    }

    if (filters.status !== undefined) {
        query += ` AND status = $${paramCount}`;
        params.push(filters.status === true || filters.status === "true");
        paramCount++;
    }

    query += ` ORDER BY grade_name, section_name ASC`;

    const result = await sql.query(query, params);
    return result.rows;
}

module.exports = {
    init,
    findAll,
    findById,
    findByGradeName,
    findByGradeAndSection,
    create,
    updateById,
    deleteById,
    bulkCreateSections,
    search
};