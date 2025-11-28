/**
 * Auto-Config CRUD
 * Author: Muskan Khan
 * Date: DEC, 2025
 * Copyright: www.ibirdsservices.com
 */

const sql = require("./db.js");

function init(schema_name) {
    this.schema = schema_name;
}


async function findAll() {
    const query = `SELECT * FROM demo.auto_config ORDER BY createddate DESC`;
    const result = await sql.query(query);
    return result.rows.length ? result.rows : [];
}

async function findById(id) {
    const query = `SELECT * FROM demo.auto_config WHERE id = $1`;
    const result = await sql.query(query, [id]);
    return result.rows.length ? result.rows[0] : null;
}

async function updateById(id, configData, userId) {
    const current = await findById(id);
    if (!current) throw new Error("Auto-config record not found");

    const query = `
        UPDATE demo.auto_config
        SET table_name = $2,
            prefix = $3,
            digit_count = $4,
            next_number = $5,
            lastmodifiedbyid = $6,
            lastmodifieddate = NOW()
        WHERE id = $1
        RETURNING *
    `;
    const values = [
        id,
        configData.table_name ?? current.table_name,
        configData.prefix ?? current.prefix,
        configData.digit_count ?? current.digit_count,
        configData.next_number ?? current.next_number,
        userId || null
    ];
    const result = await sql.query(query, values);
    return result.rows.length ? result.rows[0] : null;
}


async function deleteById(id) {
    const query = `DELETE FROM demo.auto_config WHERE id = $1 RETURNING *`;
    const result = await sql.query(query, [id]);
    return result.rows.length
        ? { success: true, message: "Auto-config deleted successfully" }
        : { success: false, message: "Auto-config not found" };
}

async function getByTableName(tableName, client = null) {
    const query = `SELECT * FROM demo.auto_config WHERE table_name = $1`;
    const result = client ? await sql.query(query, [tableName]) : await sql.query(query, [tableName]);
    return result.rows[0] || null;
}


async function incrementCounter(tableName, userId) {
    const query = `
        UPDATE demo.auto_config 
        SET next_number = (next_number::integer + 1)::varchar,
            lastmodifiedbyid = $1,
            lastmodifieddate = NOW()
        WHERE table_name = $2
        RETURNING *
    `;
    const result = await sql.query(query, [userId, tableName]);
    return result.rows[0] || null;
}

async function create(configData, userId) {
    const query = `
        INSERT INTO demo.auto_config
        (table_name, prefix, digit_count, next_number, createdbyid, lastmodifiedbyid, createddate, lastmodifieddate)
        VALUES ($1, $2, $3, $4, $5, $5, NOW(), NOW())
        RETURNING *
    `;
    const values = [
        configData.table_name,
        configData.prefix || "",
        configData.digit_count || 0,
        configData.next_number ? configData.next_number.toString() : "1", // Ensure string
        userId || null
    ];
    const result = await sql.query(query, values);
    return result.rows[0] || null;
}
module.exports = {
    init,
    findAll,
    findById,
    create,
    updateById,
    deleteById,
    getByTableName,
    incrementCounter
};