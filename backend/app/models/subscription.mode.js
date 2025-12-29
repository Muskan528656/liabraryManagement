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
    const {
        plan_id,
        member_id,
        user_id,
        card_id,
        plan_name,
        duration_days = 30,
        allowed_books = 0,
        start_date,
        end_date,
        is_active = true,
        status = "active",
        ...otherFields
    } = data;


    let finalEndDate = end_date;
    if (!finalEndDate) {
        const start = start_date ? new Date(start_date) : new Date();
        const end = new Date(start);
        end.setDate(end.getDate() + parseInt(duration_days));
        finalEndDate = end.toISOString().split('T')[0];
    }

    const finalStartDate = start_date || new Date().toISOString().split('T')[0];

    const subscriptionData = {
        plan_id,
        member_id,
        user_id,
        card_id,
        plan_name,
        duration_days,
        allowed_books,
        start_date: finalStartDate,
        end_date: finalEndDate,
        is_active,
        status,
        createdbyid: userId,
        lastmodifiedbyid: userId,
        createddate: new Date(),
        lastmodifieddate: new Date(),
        ...otherFields
    };

    const columns = Object.keys(subscriptionData);
    const values = Object.values(subscriptionData);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    const columnNames = columns.join(', ');

    const query = `
        INSERT INTO subscriptions (${columnNames})
        VALUES (${placeholders})
        RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0];
}

async function updateById(id, data, userId) {
    const current = await findById(id);
    if (!current) throw new Error("Subscription not found");
 
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