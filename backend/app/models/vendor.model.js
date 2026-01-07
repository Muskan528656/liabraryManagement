/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */
const sql = require("./db.js");
let schema = "";

function init(schema_name) {
  this.schema = schema_name;
}
async function findByEmail(email, excludeId = null) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }

    console.log("Finding vendor by email:", email, "Excluding ID:", excludeId);
    const cleanEmail = email?.trim();
    console.log("Cleaned email:", cleanEmail);

    // Base query
    let query = `
      SELECT *
      FROM ${this.schema}.vendors
      WHERE email = $1
    `;
    const params = [cleanEmail];
    // Exclude current ID if provided
    if (excludeId) {
      query += `AND id != $2`;
      params.push(excludeId);
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


async function findAll() {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT * FROM ${this.schema}.vendors ORDER BY createddate DESC`;
    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}


async function findById(id) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT * FROM ${this.schema}.vendors WHERE id = $1`;
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


// async function create(vendorData, userId) {
//   try {
//     if (!this.schema) {
//       throw new Error("Schema not initialized. Call init() first.");
//     }

//     const status =
//       vendorData.status === true ||
//       vendorData.status === "true" ||
//       vendorData.status === "active"
//         ? true
//         : false;

//     const query = `INSERT INTO ${this.schema}.vendors 
//       (name, company_name, email, phone, gst_number, pan_number, address, city, state, pincode, country, status, createddate, lastmodifieddate, createdbyid, lastmodifiedbyid, company_id, country_code) 
//       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW(),$13,$13,$14,$15) 
//       RETURNING *`;

//     const values = [
//       vendorData.name || "Scanned Vendor",
//       vendorData.company_name || vendorData.companyName || null,
//       vendorData.email || null,
//       vendorData.phone || null,
//       vendorData.gst_number || vendorData.gstNumber || null,
//       vendorData.pan_number || vendorData.panNumber || null,
//       vendorData.address || null,
//       vendorData.city || null,
//       vendorData.state || null,
//       vendorData.pincode || null,
//       vendorData.country || "India",
//       status, // ✅ boolean
//       userId || null,
//       vendorData.company_id || vendorData.companyId || null,
//       vendorData.country_code || null,
//     ];

//     const result = await sql.query(query, values);
//     return result.rows[0] || null;
//   } catch (error) {
//     console.error("Error in create:", error);
//     throw error;
//   }
// }


async function create(vendorData, userId) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }

    const status =
      vendorData.status === true ||
        vendorData.status === "true" ||
        vendorData.status === "active"
        ? true
        : false;

    const query = `INSERT INTO ${this.schema}.vendors 
      (name, company_name, email, phone, gst_number, pan_number, address, city, state, pincode, country, status, createddate, lastmodifieddate, createdbyid, lastmodifiedbyid, company_id, country_code) 
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW(),$13,$13,$14,$15) 
      RETURNING *`;

    const values = [
      vendorData.name || "Scanned Vendor",
      vendorData.company_name || vendorData.companyName || null,
      vendorData.email || null,
      vendorData.phone || null,
      vendorData.gst_number || vendorData.gstNumber || null,
      vendorData.pan_number || vendorData.panNumber || null,
      vendorData.address || null,
      vendorData.city || null,
      vendorData.state || null,
      vendorData.pincode || null,
      vendorData.country || "India",
      status, // ✅ boolean
      userId || null,
      vendorData.company_id || vendorData.companyId || null,
      vendorData.country_code || null,
    ];

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error in create:", error);
    throw error;
  }
}



async function updateById(id, vendorData, userId) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }


    const updateFields = [];
    const values = [id];
    let paramIndex = 2;

    if (vendorData.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(vendorData.name);
    }
    if (vendorData.company_name !== undefined || vendorData.companyName !== undefined) {
      updateFields.push(`company_name = $${paramIndex++}`);
      values.push(vendorData.company_name || vendorData.companyName || null);
    }
    if (vendorData.email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      values.push(vendorData.email || null);
    }
    if (vendorData.phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      values.push(vendorData.phone || null);
    }
    if (vendorData.gst_number !== undefined || vendorData.gstNumber !== undefined) {
      updateFields.push(`gst_number = $${paramIndex++}`);
      values.push(vendorData.gst_number || vendorData.gstNumber || null);
    }
    if (vendorData.pan_number !== undefined || vendorData.panNumber !== undefined) {
      updateFields.push(`pan_number = $${paramIndex++}`);
      values.push(vendorData.pan_number || vendorData.panNumber || null);
    }
    if (vendorData.address !== undefined) {
      updateFields.push(`address = $${paramIndex++}`);
      values.push(vendorData.address || null);
    }
    if (vendorData.city !== undefined) {
      updateFields.push(`city = $${paramIndex++}`);
      values.push(vendorData.city || null);
    }
    if (vendorData.state !== undefined) {
      updateFields.push(`state = $${paramIndex++}`);
      values.push(vendorData.state || null);
    }
    if (vendorData.pincode !== undefined) {
      updateFields.push(`pincode = $${paramIndex++}`);
      values.push(vendorData.pincode || null);
    }
    if (vendorData.country !== undefined) {
      updateFields.push(`country = $${paramIndex++}`);
      values.push(vendorData.country || 'India');
    }
    if (vendorData.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      values.push(vendorData.status);
    }
    if (vendorData.company_id !== undefined || vendorData.companyId !== undefined) {
      updateFields.push(`company_id = $${paramIndex++}`);
      values.push(vendorData.company_id || vendorData.companyId || null);
    }
    if (vendorData.country_code !== undefined || vendorData.country_code !== undefined) {
      updateFields.push(`country_code = $${paramIndex++}`);
      values.push(vendorData.country_code || vendorData.country_code || null);
    }


    updateFields.push(`lastmodifieddate = NOW()`);
    updateFields.push(`lastmodifiedbyid = $${paramIndex++}`);
    values.push(userId || null);

    if (updateFields.length === 2) {
      throw new Error("No fields to update");
    }

    const query = `UPDATE ${this.schema}.vendors 
                   SET ${updateFields.join(', ')}
                   WHERE id = $1 
                   RETURNING *`;

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
async function deleteById(id) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `DELETE FROM ${this.schema}.vendors WHERE id = $1 RETURNING *`;
    const result = await sql.query(query, [id]);
    if (result.rows.length > 0) {
      return { success: true, message: "Vendor deleted successfully" };
    }
    return { success: false, message: "Vendor not found" };
  } catch (error) {
    console.error("Error in deleteById:", error);
    throw error;
  }
}


async function findByName(name, excludeId = null) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    let query = `SELECT * FROM ${this.schema}.vendors WHERE name = $1`;
    const params = [name];

    if (excludeId) {
      query += ` AND id != $2`;
      params.push(excludeId);
    }

    const result = await sql.query(query, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error in findByName:", error);
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
  findByName,
  findByEmail,
};

