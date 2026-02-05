/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */

const sql = require("./db.js");

function init(schema_name) {
    this.schema = schema_name;
}
async function findAll() {
    try {
        if (!this.schema) {
            throw new Error("Schema not initialized. Call init() first.");
        }

        const query = `
      SELECT *
      FROM ${this.schema}.shelf
      ORDER BY createddate DESC
    `;

        const result = await sql.query(query);
        return result.rows.length ? result.rows : [];

    } catch (error) {
        console.error("Error in findAll:", error);
        throw error;
    }
}

async function findById(id) {
    try {
        if (!this.schema) {
            throw new Error("Schema not initialized.");
        }

        const query = `
      SELECT *
      FROM ${this.schema}.shelf
      WHERE id = $1
    `;

        const result = await sql.query(query, [id]);
        return result.rows[0] || null;

    } catch (error) {
        console.error("Error in findById:", error);
        throw error;
    }
}

async function create(data, userId) {
    try {
        if (!this.schema) {
            throw new Error("Schema not initialized.");
        }

        const query = `
      INSERT INTO ${this.schema}.shelf
      (shelf_name, note, sub_shelf, copies, book_id,
       createddate, lastmodifieddate, createdbyid, lastmodifiedbyid)
      VALUES ($1,$2,$3,$4,$5,NOW(),NOW(),$6,$6)
      RETURNING *
    `;

        const values = [
            data.shelf_name,
            data.note || null,
            data.sub_shelf ? JSON.stringify(data.sub_shelf) : null,
            data.copies || 0,
            data.book_id || null,
            userId || null
        ];

        const result = await sql.query(query, values);
        return result.rows[0] || null;

    } catch (error) {
        console.error("Error in create:", error);
        throw error;
    }
}

async function updateById(id, data, userId) {
    try {
        if (!this.schema) {
            throw new Error("Schema not initialized.");
        }

        const current = await findById.call(this, id);
        if (!current) {
            throw new Error("Shelf not found");
        }

        const query = `
      UPDATE ${this.schema}.shelf
      SET
        shelf_name = $2,
        note = $3,
        sub_shelf = $4,
        copies = $5,
        book_id = $6,
        lastmodifieddate = NOW(),
        lastmodifiedbyid = $7
      WHERE id = $1
      RETURNING *
    `;

        const values = [
            id,
            data.shelf_name ?? current.shelf_name,
            data.note ?? current.note,
            data.sub_shelf ? JSON.stringify(data.sub_shelf) : current.sub_shelf,
            data.copies ?? current.copies,
            data.book_id ?? current.book_id,
            userId || null
        ];

        const result = await sql.query(query, values);
        return result.rows[0] || null;

    } catch (error) {
        console.error("Error in updateById:", error);
        throw error;
    }
}
async function deleteById(id) {
    try {
        if (!this.schema) {
            throw new Error("Schema not initialized.");
        }

        const query = `
      DELETE FROM ${this.schema}.shelf
      WHERE id = $1
      RETURNING *
    `;

        const result = await sql.query(query, [id]);

        if (result.rows.length) {
            return { success: true, message: "Shelf deleted successfully" };
        }

        return { success: false, message: "Shelf not found" };

    } catch (error) {
        console.error("Error in deleteById:", error);
        throw error;
    }
}

module.exports = {
    init,
    findAll,
    findById,
    create,
    updateById,
    deleteById,
};
