/**
 * Subscription Model
 * Author: Muskan Khan
 * Date: DEC, 2025
 * Copyright: www.ibirdsservices.com
 */

const sql = require("./db.js");

function normalizeSubscriptionRow(row) {
    if (!row) return null;

    const normalized = { ...row };


    if (Object.prototype.hasOwnProperty.call(normalized, "allowed books")) {
        normalized.allowed_books = normalized["allowed books"];
        delete normalized["allowed books"];
    }

    return normalized;
}

function init(schema_name) {
    this.schema = schema_name;
}




async function findAll() {
    const query = `
        SELECT * 
        FROM demo.subscriptions 
        ORDER BY createddate DESC
    `;
    const result = await sql.query(query);
    return result.rows.length ? result.rows.map(normalizeSubscriptionRow) : [];
}




async function findById(id) {
    const query = `SELECT * FROM demo.subscriptions WHERE id = $1`;
    const result = await sql.query(query, [id]);
    return result.rows.length ? normalizeSubscriptionRow(result.rows[0]) : null;
}




async function create(data, userId) {
    const query = `
        INSERT INTO demo.subscriptions
        (plan_name, start_date, end_date, is_active, renewal, "allowed books",
         createdbyid, lastmodifiedbyid, createddate, lastmodifieddate)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $7, NOW(), NOW())
        RETURNING *
    `;

    const values = [
        data.plan_name,
        data.start_date?.trim() !== "" ? data.start_date : null,
        data.end_date?.trim() !== "" ? data.end_date : null,
        data.is_active || false,
        parseInt(data.renewal) || 0,                     
        parseInt(data.allowed_books ?? data["allowed books"]) || null,
        userId || null
    ];

    const result = await sql.query(query, values);
    return normalizeSubscriptionRow(result.rows[0] || null);
}




async function updateById(id, data, userId) {
    const current = await findById(id);
    if (!current) throw new Error("Subscription not found");
    console.log("datadata",data)
    const query = `
        UPDATE demo.subscriptions
        SET plan_name = $2,
            start_date = $3,
            end_date = $4,
            is_active = $5,
            renewal = $6,
            "allowed books" = $7,
            lastmodifiedbyid = $8,
            lastmodifieddate = NOW()
        WHERE id = $1
        RETURNING *
    `;

    const values = [
        id,
        data.plan_name ?? current.plan_name,
        data.start_date?.trim() !== "" ? data.start_date : current.start_date,
        data.end_date?.trim() !== "" ? data.end_date : current.end_date,
        data.is_active ?? current.is_active,
        data.renewal !== undefined ? parseInt(data.renewal) || 0 : current.renewal,
        parseInt(data.allowed_books ?? data["allowed books"] ?? current.allowed_books) || null,
        userId || null
    ];

    const result = await sql.query(query, values);
    return result.rows.length ? normalizeSubscriptionRow(result.rows[0]) : null;
}




async function deleteById(id) {
    const query = `DELETE FROM demo.subscriptions WHERE id = $1 RETURNING *`;
    const result = await sql.query(query, [id]);

    return result.rows.length
        ? { success: true, message: "Subscription deleted successfully" }
        : { success: false, message: "Subscription not found" };
}

module.exports = {
    init,
    findAll,
    findById,
    create,
    updateById,
    deleteById
};
