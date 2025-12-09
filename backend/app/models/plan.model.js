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
        const query = `
            INSERT INTO ${schema}.plan 
            (plan_name, duration_days, allowed_books, createdbyid, createddate, lastmodifieddate, is_active)
            VALUES ($1, $2, $3, $4, NOW(), NOW(), $5)
            RETURNING id, plan_name, duration_days, allowed_books, is_active, createddate, createdbyid
        `;

        const result = await sql.query(query, [
            data.plan_name,
            data.duration_days,
            data.allowed_books !== undefined ? data.allowed_books : 0,
            data.createdbyid || data.createdby,
            data.is_active !== undefined ? data.is_active : true
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

        const query = `
        DELETE FROM ${schema}.plan
        WHERE id = $1
        RETURNING id;
    `;

        const result = await sql.query(query, [id]);
        console.log("Delete Result -> ", result);

        return result.rows[0];
    }

};

module.exports = Plan;