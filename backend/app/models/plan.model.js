const sql = require("./db.js");

let schema = null;

const Plan = {
    init(tenantcode) {
        schema = tenantcode;
    },

    async getAllPlans() {
        const query = `SELECT * FROM ${schema}.plan ORDER BY createddate DESC`;
        const result = await sql.query(query);
        return result.rows;
    },

    async getPlanById(id) {
        const query = `SELECT * FROM ${schema}.plan WHERE id = $1`;
        const result = await sql.query(query, [id]);
        return result.rows[0] || null;
    },

    async insertPlan(data) {
        console.log("Inserting plan with data:", data);

        const isActive =
            data.is_active === true ||
            data.is_active === "true" ||
            data.is_active === "active" ||
            data.is_active === "Active";

        const query = `
            INSERT INTO ${schema}.plan 
            (plan_name, duration_days, allowed_books, max_allowed_books_at_time, 
            createdbyid, createddate, lastmodifieddate, lastmodifiedbyid, is_active)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $5, $6)
            RETURNING id, plan_name, duration_days, allowed_books, 
                    max_allowed_books_at_time, is_active, createddate, 
                    createdbyid, lastmodifieddate, lastmodifiedbyid
        `;

        const result = await sql.query(query, [
            data.plan_name,
            data.duration_days,
            data.allowed_books,
            data.max_allowed_books_at_time,
            data.createdbyid,
            isActive // ✅ boolean
        ]);

        return result.rows[0];
        },

    async updatePlan(data) {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (data.plan_name !== undefined) {
            updates.push(`plan_name = $${paramCount}`);
            values.push(data.plan_name);
            paramCount++;
        }

        if (data.duration_days !== undefined) {
            updates.push(`duration_days = $${paramCount}`);
            values.push(data.duration_days);
            paramCount++;
        }

        if (data.allowed_books !== undefined) {
            updates.push(`allowed_books = $${paramCount}`);
            values.push(data.allowed_books);
            paramCount++;
        }

        if (data.max_allowed_books_at_time !== undefined) {
            updates.push(`max_allowed_books_at_time = $${paramCount}`);
            values.push(data.max_allowed_books_at_time);
            paramCount++;
        }

        if (data.is_active !== undefined) {
            updates.push(`is_active = $${paramCount}`);
            values.push(data.is_active);
            paramCount++;
        }

        updates.push(`lastmodifieddate = NOW()`);

        if (data.lastmodifiedbyid !== undefined || data.lastmodifiedby !== undefined) {
            updates.push(`lastmodifiedbyid = $${paramCount}`);
            values.push(data.lastmodifiedbyid || data.lastmodifiedby);
            paramCount++;
        }

        values.push(data.id);

        const query = `
            UPDATE ${schema}.plan
            SET ${updates.join(", ")}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await sql.query(query, values);
        return result.rows[0];
    },

    async deletePlan(id) {

        const checkQuery = `
            SELECT COUNT(*) as subscription_count 
            FROM ${schema}.subscriptions 
            WHERE plan_id = $1
        `;

        const checkResult = await sql.query(checkQuery, [id]);
        const subscriptionCount = parseInt(checkResult.rows[0].subscription_count);

        if (subscriptionCount > 0) {
            throw new Error(`Cannot delete plan. It is being used by ${subscriptionCount} subscription(s).`);
        }

        const query = `
            DELETE FROM ${schema}.plan
            WHERE id = $1
            RETURNING id, plan_name
        `;

        const result = await sql.query(query, [id]);
        return result.rows[0];
    }

};

module.exports = Plan;