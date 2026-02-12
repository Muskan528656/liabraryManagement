/**
 * @author      Muskan Khan
 * @date        FEB, 2026
 * @copyright   www.ibirdsservices.com
 */
const sql = require("./db.js");
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

function init(schema_name) {
    this.schema = schema_name;
}

/**
 * GET ALL BRANCHES
 */
async function findAll(status) {
    try {
        if (!this.schema) {
            throw new Error("Schema not initialized. Call init() first.");
        }

        let query = `
      SELECT *
      FROM ${this.schema}.branches
    `;

        const values = [];

        if (status) {
            query += ` WHERE status = $1`;
            values.push(status);
        }

        query += ` ORDER BY createddate DESC`;

        const result = await sql.query(query, values);
        return result.rows || [];

    } catch (error) {
        console.error("Error in findAll:", error);
        throw error;
    }
}


/**
 * GET BRANCH BY ID
 */
async function findById(id) {
    try {
        if (!this.schema) {
            throw new Error("Schema not initialized. Call init() first.");
        }

        const query = `
  SELECT *
  FROM ${this.schema}.branches
  WHERE id = $1
`;

        const result = await sql.query(query, [id]);

        if (result.rows.length > 0) {
            return result.rows[0];
        }
        return null;
    } catch (error) {
        console.error("Error in findById:", error);
        throw error;
    }
}

/**
 * FIND BRANCH BY CODE
 */
async function findByCode(branchCode, excludeId = null) {
    try {
        if (!this.schema) {
            throw new Error("Schema not initialized. Call init() first.");
        }

        let query = `SELECT * FROM ${this.schema}.branches WHERE branch_code = $1`;
        const params = [branchCode];

        if (excludeId) {
            query += ` AND id != $2`;
            params.push(excludeId);
        }

        const result = await sql.query(query, params);
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error("Error in findByCode:", error);
        throw error;
    }
}

/**
 * CREATE NEW BRANCH
 */
async function create(branchData, userId) {
    console.log("Creating branch with data:", branchData);
    try {
        if (!this.schema) {
            throw new Error("Schema not initialized. Call init() first.");
        }

        if (!/^[A-Z0-9]+$/.test(branchData.branch_code)) {
            throw new Error("Branch code must contain only uppercase letters and numbers");
        }

        const existingBranch = await this.findByCode(branchData.branch_code);
        if (existingBranch) {
            throw new Error(`Branch with code '${branchData.branch_code}' already exists`);
        }
        if (branchData.pincode && !/^\d{6}$/.test(branchData.pincode)) {
            throw new Error("Pincode must be 6 digits");
        }

        const query = `
      INSERT INTO ${this.schema}.branches
      (
        branch_code, 
        branch_name, 
        address_line1, 
        city, 
        state, 
        country, 
        pincode, 
        is_active,
        createddate, 
        lastmodifieddate, 
        createdbyid, 
        lastmodifiedbyid
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), $9, $9)
      RETURNING *
    `;

        const values = [
            branchData.branch_code?.toUpperCase().trim(),
            branchData.branch_name?.trim(),
            branchData.address_line1?.trim() || null,
            branchData.city?.trim() || null,
            branchData.state?.trim() || null,
            branchData.country?.trim() || 'India',
            branchData.pincode?.trim() || null,
            branchData.is_active !== undefined ? branchData.is_active : true,
            userId || null
        ];

        const result = await sql.query(query, values);
        console.log("Branch created with ID:", result.rows[0]?.id);
        return result.rows[0] || null;

    } catch (error) {
        console.error("Error in create:", error);
        throw error;
    }
}

/**
 * UPDATE BRANCH BY ID
 */
async function updateById(id, branchData, userId) {
    console.log("update branch data:", branchData);
    try {
        if (!this.schema) {
            throw new Error("Schema not initialized. Call init() first.");
        }

        const currentBranch = await this.findById(id);
        if (!currentBranch) {
            throw new Error("Branch not found");
        }

        // Validate branch code if being updated
        if (branchData.branch_code && branchData.branch_code !== currentBranch.branch_code) {
            if (!/^[A-Z0-9]+$/.test(branchData.branch_code)) {
                throw new Error("Branch code must contain only uppercase letters and numbers");
            }

            const existingBranch = await this.findByCode(branchData.branch_code, id);
            if (existingBranch) {
                throw new Error(`Branch with code '${branchData.branch_code}' already exists`);
            }
        }

        // Validate pincode format if provided
        if (branchData.pincode && !/^\d{6}$/.test(branchData.pincode)) {
            throw new Error("Pincode must be 6 digits");
        }

        const query = `
      UPDATE ${this.schema}.branches
      SET 
        branch_code = COALESCE($2, branch_code),
        branch_name = COALESCE($3, branch_name),
        address_line1 = COALESCE($4, address_line1),
        city = COALESCE($5, city),
        state = COALESCE($6, state),
        country = COALESCE($7, country),
        pincode = COALESCE($8, pincode),
        is_active = COALESCE($9, is_active),
        lastmodifieddate = NOW(),
        lastmodifiedbyid = $10
      WHERE id = $1
      RETURNING *
    `;

        const values = [
            id,
            branchData.branch_code !== undefined ? branchData.branch_code?.toUpperCase().trim() : null,
            branchData.branch_name !== undefined ? branchData.branch_name?.trim() : null,
            branchData.address_line1 !== undefined ? branchData.address_line1?.trim() : null,
            branchData.city !== undefined ? branchData.city?.trim() : null,
            branchData.state !== undefined ? branchData.state?.trim() : null,
            branchData.country !== undefined ? branchData.country?.trim() : null,
            branchData.pincode !== undefined ? branchData.pincode?.trim() : null,
            branchData.is_active !== undefined ? branchData.is_active : null,
            userId || null
        ];

        const result = await sql.query(query, values);
        if (result.rows.length > 0) {
            return result.rows[0];
        }
        return null;
    } catch (error) {
        console.error("Error in updateById:", error);
        throw error;
    }
}

/**
 * DELETE BRANCH BY ID
 */
async function deleteById(id) {
    try {
        if (!this.schema) {
            throw new Error("Schema not initialized. Call init() first.");
        }

        const checkBooksQuery = `
      SELECT COUNT(*) as book_count 
      FROM ${this.schema}.books 
      WHERE branch_id = $1
    `;
        const booksResult = await sql.query(checkBooksQuery, [id]);

        if (parseInt(booksResult.rows[0].book_count) > 0) {
            return {
                success: false,
                message: "Cannot delete branch: Books are assigned to this branch"
            };
        }

        const query = `DELETE FROM ${this.schema}.branches WHERE id = $1 RETURNING *`;
        const result = await sql.query(query, [id]);

        if (result.rows.length > 0) {
            return { success: true, message: "Branch deleted successfully" };
        }
        return { success: false, message: "Branch not found" };
    } catch (error) {
        console.error("Error in deleteById:", error);
        throw error;
    }
}

/**
 * FIND BRANCHES BY CITY
 */
async function findByCity(city) {
    try {
        if (!this.schema) {
            throw new Error("Schema not initialized. Call init() first.");
        }

        const query = `
      SELECT * FROM ${this.schema}.branches 
      WHERE city ILIKE $1
      ORDER BY branch_name ASC
    `;

        const result = await sql.query(query, [`%${city}%`]);
        return result.rows.length > 0 ? result.rows : [];
    } catch (error) {
        console.error("Error in findByCity:", error);
        throw error;
    }
}

/**
 * FIND BRANCHES BY COUNTRY
 */
async function findByCountry(country) {
    try {
        if (!this.schema) {
            throw new Error("Schema not initialized. Call init() first.");
        }

        const query = `
      SELECT * FROM ${this.schema}.branches 
      WHERE country ILIKE $1
      ORDER BY branch_name ASC
    `;

        const result = await sql.query(query, [`%${country}%`]);
        return result.rows.length > 0 ? result.rows : [];
    } catch (error) {
        console.error("Error in findByCountry:", error);
        throw error;
    }
}

module.exports = {
    init,
    findAll,
    findById,
    findByCode,
    create,
    updateById,
    deleteById,
    findByCity,
    findByCountry,
    //   toggleStatus,
    //   search,
    //   getStatistics,
    //   bulkCreate,
    //   exportBranchReportExcel,
    //   exportBranchReportPDF
};