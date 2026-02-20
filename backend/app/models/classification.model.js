const sql = require("./db.js");
const Setting =  require('../models/librarysettings.model.js')
let schema = "";
let branchId = null;

function init(schema_name, branch_id = null) {
    schema = schema_name;
    branchId = branch_id;
}

// ================= FIND ALL =================
async function findAll(filters = {}) {
    try {
        if (!schema) throw new Error("Schema not initialized. Call init() first.");

        // ✅ 1. Get current classification setting
        const settings = await Setting.findAll();
        const classificationSetting = settings.find(
            s => s.key === "classification"
        );

        const currentClassificationType = classificationSetting?.value || null;

        let query = `
            SELECT 
                c.*,
                b.name AS branch_name
            FROM ${schema}.classification c
            LEFT JOIN ${schema}.branches b ON c.branch_id = b.id
        `;

        const conditions = [];
        const params = [];

        // ✅ 2. Filter by setting classification
        if (currentClassificationType) {
            conditions.push(`c.classification_type = $${params.length + 1}`);
            params.push(currentClassificationType);
        }

        if (filters.is_active !== undefined) {
            conditions.push(`c.is_active = $${params.length + 1}`);
            params.push(filters.is_active);
        }

        if (filters.search) {
            conditions.push(`(
                c.name ILIKE $${params.length + 1} OR 
                c.code ILIKE $${params.length + 1} OR
                c.category ILIKE $${params.length + 1}
            )`);
            params.push(`%${filters.search}%`);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        query += ` ORDER BY c.code`;

        const result = await sql.query(query, params);
        return result.rows;

    } catch (error) {
        console.error("Error in Classification.findAll:", error);
        throw error;
    }
}


// ================= FIND BY ID =================
async function findById(id) {
    try {
        const query = `
            SELECT 
                c.*,
                b.name AS branch_name
            FROM ${schema}.classification c
            LEFT JOIN ${schema}.branches b ON c.branch_id = b.id
            WHERE c.id = $1
        `;
        const result = await sql.query(query, [id]);
        return result.rows[0];
    } catch (error) {
        console.error("Error in Classification.findById:", error);
        throw error;
    }
}

// ================= CREATE =================
async function create(data, userId) {
    try {
        // Check for duplicate code
        const dupCheck = await sql.query(
            `SELECT id FROM ${schema}.classification WHERE code = $1 AND branch_id = $2 LIMIT 1`,
            [data.code, branchId || data.branch_id]
        );
        
        if (dupCheck.rows.length > 0) {
            throw new Error("Classification code already exists");
        }

        const query = `
            INSERT INTO ${schema}.classification
            (classification_type, code, category, name, classification_from, classification_to, 
             is_active, createdbyid, lastmodifiedbyid, branch_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9)
            RETURNING *
        `;

        const values = [
            data.classification_type,
            data.code,
            data.category || null,
            data.name,
            data.classification_from || null,
            data.classification_to || null,
            data.is_active !== undefined ? data.is_active : true,
            userId,
            branchId || data.branch_id || null
        ];

        const result = await sql.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error("Error in Classification.create:", error);
        throw error;
    }
}

// ================= UPDATE =================
async function updateById(id, data, userId) {
    try {
        // Check for duplicate code (excluding current record)
        if (data.code) {
            const dupCheck = await sql.query(
                `SELECT id FROM ${schema}.classification WHERE code = $1 AND branch_id = $2 AND id != $3 LIMIT 1`,
                [data.code, branchId, id]
            );
            
            if (dupCheck.rows.length > 0) {
                throw new Error("Classification code already exists");
            }
        }

        const query = `
            UPDATE ${schema}.classification
            SET 
                classification_type = COALESCE($2, classification_type),
                code = COALESCE($3, code),
                category = COALESCE($4, category),
                name = COALESCE($5, name),
                classification_from = COALESCE($6, classification_from),
                classification_to = COALESCE($7, classification_to),
                is_active = COALESCE($8, is_active),
                lastmodifieddate = CURRENT_TIMESTAMP,
                lastmodifiedbyid = $9
            WHERE id = $1
            RETURNING *
        `;

        const values = [
            id,
            data.classification_type,
            data.code,
            data.category,
            data.name,
            data.classification_from,
            data.classification_to,
            data.is_active,
            userId
        ];

        const result = await sql.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error("Error in Classification.updateById:", error);
        throw error;
    }
}

// ================= DELETE =================
async function deleteById(id) {
    try {
        // Check if classification is being used
        const usageCheck = await sql.query(
            `SELECT COUNT(*) as count FROM ${schema}.books WHERE classification_id = $1`,
            [id]
        );
        
        if (parseInt(usageCheck.rows[0].count) > 0) {
            throw new Error("Cannot delete classification - it is being used by books");
        }

        const query = `DELETE FROM ${schema}.classification WHERE id = $1 RETURNING *`;
        const result = await sql.query(query, [id]);
        return result.rows.length > 0;
    } catch (error) {
        console.error("Error in Classification.deleteById:", error);
        throw error;
    }
}

// ================= GET BY TYPE =================
async function getByType(type) {
    try {
        const query = `
            SELECT * FROM ${schema}.classification 
            WHERE classification_type = $1 AND is_active = true
            ORDER BY code
        `;
        const result = await sql.query(query, [type]);
        return result.rows;
    } catch (error) {
        console.error("Error in Classification.getByType:", error);
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
    getByType
};