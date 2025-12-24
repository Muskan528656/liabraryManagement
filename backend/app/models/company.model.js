 
 
 
 
 
 
 

 
 
 


 
 
 
 
 
 
 
 
 
 
 
 
 


 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 


 
 
 
 
 
 


 
 
 
 
 
 

 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 

 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 

 
 
 
 
 



 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 


 
 
 
 
 
 
 
 
 
 
 
 
 


 
 
 
 
 
 
 

 
 
 
 

 
 
 
 
 
 
 


 
 
 
 
 
 
 
 
 
 
 
 
 


 
 
 
 
 
 
 

 
 
 
 

 
 
 
 
 
 
 


 
 
 
 
 
 
 
 
 
 
 
 
 


 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 


/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 * @change      Aabid, DEC-25
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
    const query = `SELECT * FROM public.company ORDER BY name`;
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
    const query = `SELECT * FROM public.company WHERE id = $1`;
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


async function create(companyData, userId) {
  console.log("Comapny data->>>", companyData)
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }


    if (!companyData.name) {
      throw new Error("Company name is required");
    }
    if (!companyData.tenantcode) {
      throw new Error("Tenant code is required");
    }

    const query = `INSERT INTO public.company
                   (name, tenantcode, userlicenses, isactive, systememail, adminemail, phone_number,
                    logourl, sidebarbgurl, sourceschema, city, street, pincode, state,
                    country, platform_name, platform_api_endpoint, is_external, has_wallet, currency, country_code, time_zone, currency_symbol)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
                   RETURNING *`;

    const values = [
      companyData.name,
      companyData.tenantcode,
      companyData.userlicenses || 0,
      companyData.isactive !== undefined ? companyData.isactive : true,
      companyData.systememail || 'admin@spark.indicrm.io',
      companyData.adminemail || 'admin@spark.indicrm.io',
      companyData.phone_number || null,
      companyData.logourl || 'https://spark.indicrm.io/logos/client_logo.png',
      companyData.sidebarbgurl || 'https://spark.indicrm.io/logos/sidebar_background.jpg',
      companyData.sourceschema || null,
      companyData.city || null,
      companyData.street || null,
      companyData.pincode || null,
      companyData.state || null,
      companyData.country || null,
      companyData.platform_name || null,
      companyData.platform_api_endpoint || null,
      companyData.is_external !== undefined ? companyData.is_external : false,
      companyData.has_wallet !== undefined ? companyData.has_wallet : false,
      companyData.currency || null,
      companyData.country_code,
      companyData.time_zone || null,
      companyData.currency_symbol || null 
    ];

    const result = await sql.query(query, values);
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error("Error in create:", error);
    throw error;
  }
}

async function updateById(id, companyData, userId) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }

    const currentCompany = await this.findById(id);
    if (!currentCompany) {
      throw new Error("Company not found");
    }
    console.log("companyDatacompanyData",companyData)
    
    const query = `UPDATE public.company 
                   SET name = $2, tenantcode = $3, userlicenses = $4, isactive = $5, 
                       systememail = $6, adminemail = $7, logourl = $8, sidebarbgurl = $9, 
                       sourceschema = $10, city = $11, street = $12, pincode = $13, 
                       state = $14, country = $15, platform_name = $16, 
                       platform_api_endpoint = $17, is_external = $18, has_wallet = $19,
                       currency = $20, country_code = $21, time_zone = $22, currency_symbol = $23
                   WHERE id = $1 
                   RETURNING *`;

    const values = [
      id,
      companyData.name ?? currentCompany.name,
      companyData.tenantcode ?? currentCompany.tenantcode,
      companyData.userlicenses ?? currentCompany.userlicenses,
      companyData.isactive ?? currentCompany.isactive,
      companyData.systememail ?? currentCompany.systememail,
      companyData.adminemail ?? currentCompany.adminemail,
      companyData.logourl ?? currentCompany.logourl,
      companyData.sidebarbgurl ?? currentCompany.sidebarbgurl,
      companyData.sourceschema ?? currentCompany.sourceschema,
      companyData.city ?? currentCompany.city,
      companyData.street ?? currentCompany.street,
      companyData.pincode ?? currentCompany.pincode,
      companyData.state ?? currentCompany.state,
      companyData.country ?? currentCompany.country,
      companyData.platform_name ?? currentCompany.platform_name,
      companyData.platform_api_endpoint ?? currentCompany.platform_api_endpoint,
      companyData.is_external ?? currentCompany.is_external,
      companyData.has_wallet ?? currentCompany.has_wallet,
      companyData.currency ?? currentCompany.currency,
      companyData.country_code ?? currentCompany.country_code,
      companyData.time_zone ?? currentCompany.time_zone,
      companyData.currency_symbol ?? currentCompany.currency_symbol
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



async function deleteById(id) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `DELETE FROM public.company WHERE id = $1 RETURNING *`;
    const result = await sql.query(query, [id]);
    if (result.rows.length > 0) {
      return { success: true, message: "Company deleted successfully" };
    }
    return { success: false, message: "Company not found" };
  } catch (error) {
    console.error("Error in deleteById:", error);
    throw error;
  }
}


async function findByTenantCode(tenantCode) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT * FROM public.company WHERE tenantcode = $1`;
    const result = await sql.query(query, [tenantCode]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error in findByTenantCode:", error);
    throw error;
  }
}


async function findByName(name, excludeId = null) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    let query = `SELECT * FROM public.company WHERE name = $1`;
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


async function findActive() {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT * FROM public.company WHERE isactive = true ORDER BY name`;
    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findActive:", error);
    throw error;
  }
}


async function isTenantCodeExists(tenantCode, excludeId = null) {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    let query = `SELECT id FROM public.company WHERE tenantcode = $1`;
    const params = [tenantCode];

    if (excludeId) {
      query += ` AND id != $2`;
      params.push(excludeId);
    }

    const result = await sql.query(query, params);
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error in isTenantCodeExists:", error);
    throw error;
  }
}


async function findWithWallet() {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT * FROM public.company WHERE has_wallet = true ORDER BY name`;
    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findWithWallet:", error);
    throw error;
  }
}


async function findExternal() {
  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }
    const query = `SELECT * FROM public.company WHERE is_external = true ORDER BY name`;
    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findExternal:", error);
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
  findByTenantCode,
  findByName,
  findActive,
  isTenantCodeExists,
  findWithWallet,
  findExternal,
};