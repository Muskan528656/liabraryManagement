const sql = require("../models/db.js");
const schema = '';

function init(schema_name) {
    this.schema = schema_name;
}


async function findAllPublisher(filters = {}) {
    try {
        let query = `select * from ${this.schema}.publisher where 1=1`;
        const values = [];
        let paramIndex = 1;

        if (filters.email) {
            query += ` AND email ILIKE $${paramIndex}`;
            values.push(`%${filters.email}%`);
            paramIndex++;
        }

        if (filters.name) {
            query += ` AND name ILIKE $${paramIndex}`;
            values.push(`%${filters.name}%`);
            paramIndex++;
        }

        query += ` order by createddate desc`;

        const result = await sql.query(query, values);
        return result.rows;
    } catch (error) {
        console.error("Error in findAllPublisher:", error);
        throw error
    }
}

async function findPublisherById(id, schema = null) {
    try {
        const query = `select * from ${this.schema || schema
            }.publisher where id = $1`;
        const result = await sql.query(query, [id]);
        return result.rows.length ? result.rows[0] : null;
    } catch (error) {
        console.error("Error in findPublisherById:", error);
        throw error;
    }
}

async function insertPublisher(data, userId) {
    const query = `insert into ${this.schema}.publisher
    ( salutation,name,email,phone,city,state,country,is_active,createddate,lastmodifieddate,createdbyid,lastmodifiedbyid)
    values($1,$2,$3,$4,$5,$6,$7,$8,NOW(),null,$9,null)
    returning id,salutation,name,email,phone,city,state,country,is_active,createddate,lastmodifieddate,createdbyid,lastmodifiedbyid`;
    const values = [
        data.salutation,
        data.name,
        data.email,
        data.phone,
        data.city,
        data.state,
        data.country,
        data.is_active !== undefined ? data.is_active : true,
        userId

    ];
    const result = await sql.query(query, values);
    return result.rows[0];
}


async function updatePublisherByid(id, data, userId) {
    try {
        const current = await findPublisherById(id, this.schema);

        if (!current) {
            throw new Error("Publisher not found");
        }
        const query = `update ${this.schema}.publisher
        set salutation=$2,
        name=$3,
        email=$4,
        phone=$5,
        city=$6,
        state=$7,
        country=$8,
        is_active=$9,
        lastmodifieddate=NOW(),
        lastmodifiedbyid = $10
        where id=$1 
        returning id,salutation,name,email,phone,city,state,country,is_active,lastmodifieddate,createddate,createdbyid,lastmodifiedbyid`;
        const values = [
            id,
            data.salutation,
            data.name,
            data.email,
            data.phone,
            data.city,
            data.state,
            data.country,
            data.is_active !== undefined ? data.is_active : current.is_active,
            userId



        ];
        const result = await sql.query(query, values);

        return result.rows[0];
    } catch (error) {
        console.error("Error in updatePublisherByid:", error);
        throw error;
    }
}

async function deletePublisherById(id, data) {
    try {
        const current = await findPublisherById(id, this.schema);
        if (!current) {
            throw new Error("Publisher not found");
        }
        const query = `DELETE FROM ${this.schema}.publisher WHERE id = $1 RETURNING *`;
        const result = await sql.query(query, [id]);
        if (result.rows.length > 0) {
            return {
                success: true,
                message: "Publisher deleted successfully",
                data: result.rows[0]
            }
        }
        return {
            success: false,
            message: "Publisher not found"
        }

    } catch (error) {
        console.error("Error in deletePublisherById:", error);
        throw error;
    }
}

async function findByEmail(email, excludeId = null) {
    try {
        if (!this.schema) {
            throw new Error("Schema not initialized. Call init() first.");
        }

        console.log("Finding vendor by email:", email, "Excluding ID:", excludeId);
        const cleanEmail = email?.trim();
        console.log("Cleaned email:", cleanEmail);


        let query = `
      SELECT *
      FROM ${this.schema}.publisher
      WHERE email = $1
    `;
        const params = [cleanEmail];

        if (excludeId) {
            query += ` AND id != $2`;
            params.push(excludeId);
            console.log("queryeeeeee", query)
        }

        console.log("Constructed query:", query);
        console.log("Parameters for query:", params);

        const result = await sql.query(query, params);

        console.log("Query result:", result.rows);
        return result.rows.length > 0 ? result.rows[0] : null;

    } catch (error) {
        console.error("Error in findByName:", error);
        throw error;
    }
}
module.exports = {
    init,
    findAllPublisher,
    findPublisherById,
    insertPublisher,
    updatePublisherByid,
    deletePublisherById,
    findByEmail
};