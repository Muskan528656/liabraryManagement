// /**
//  * @author      Muskan Khan
//  * @date        DEC, 2025
//  * @copyright   www.ibirdsservices.com
//  */
// const sql = require("./db.js");
// let schema = "";

// function init(schema_name) {
//   this.schema = schema_name;
// }


// async function findAll(filters = {}) {
//   try {
//     let query = `SELECT * FROM ${schema}.categories WHERE 1=1`;
//     const values = [];
//     let paramIndex = 1;

//     if (filters.name) {
//       query += ` AND name ILIKE $${paramIndex}`;
//       values.push(`%${filters.name}%`);
//       paramIndex++;
//     }

//     query += ` ORDER BY createddate DESC`;

//     const result = await sql.query(query, values);
//     return result.rows.length > 0 ? result.rows : [];
//   } catch (error) {
//     console.error("Error in findAll:", error);
//     throw error;
//   }
// }


// async function findById(id) {
//   try {
//     const query = `SELECT * FROM ${schema}.categories WHERE id = $1`;
//     const result = await sql.query(query, [id]);
//     if (result.rows.length > 0) {
//       return result.rows[0];
//     }
//     return null;
//   } catch (error) {
//     console.error("Error in findById:", error);
//     throw error;
//   }
// }


// async function create(categoryData, userId) {
//   try {



//     const query = `INSERT INTO ${schema}.categories 
//                    (name, description, createddate, lastmodifieddate, createdbyid, lastmodifiedbyid) 
//                    VALUES ($1, $2, NOW(), NOW(), $3, $3) 
//                    RETURNING *`;

//     const values = [
//       categoryData.name || "Scanned Category",
//       categoryData.description || null,
//       userId || null,
//     ];




//     const result = await sql.query(query, values);



//     if (result.rows.length > 0) {
//       return result.rows[0];
//     }
//     return null;
//   } catch (error) {
//     console.error("Error in create:", error);
//     console.error("Error message:", error.message);
//     console.error("Error code:", error.code);
//     console.error("Error detail:", error.detail);
//     throw error;
//   }
// }


// async function updateById(id, categoryData, userId) {
//   try {
//     const query = `UPDATE ${schema}.categories 
//                    SET name = $2, description = $3, 
//                        lastmodifieddate = NOW(), lastmodifiedbyid = $4
//                    WHERE id = $1 
//                    RETURNING *`;
//     const values = [
//       id,
//       categoryData.name,
//       categoryData.description || null,
//       userId || null,
//     ];
//     const result = await sql.query(query, values);
//     if (result.rows.length > 0) {
//       return result.rows[0];
//     }
//     return null;
//   } catch (error) {
//     console.error("Error in updateById:", error);
//     throw error;
//   }
// }


// async function deleteById(id) {
//   try {
//     const query = `DELETE FROM ${schema}.categories WHERE id = $1 RETURNING *`;
//     const result = await sql.query(query, [id]);
//     if (result.rows.length > 0) {
//       return { success: true, message: "Category deleted successfully" };
//     }
//     return { success: false, message: "Category not found" };
//   } catch (error) {
//     console.error("Error in deleteById:", error);
//     throw error;
//   }
// }


// async function findByName(name, excludeId = null) {
//   try {
//     let query = `SELECT * FROM ${schema}.categories WHERE name = $1`;
//     const params = [name];

//     if (excludeId) {
//       query += ` AND id != $2`;
//       params.push(excludeId);
//     }

//     const result = await sql.query(query, params);
//     return result.rows.length > 0 ? result.rows[0] : null;
//   } catch (error) {
//     console.error("Error in findByName:", error);
//     throw error;
//   }
// }

// module.exports = {
//   init,
//   findAll,
//   findById,
//   create,
//   updateById,
//   deleteById,
//   findByName,
// };


/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */
const sql = require("./db.js");
let schema = "";

function init(schema_name) {
  schema = schema_name;
}

/* ------------------------------------------------------
   FIND ALL CLASSIFICATIONS WITH FILTERS
------------------------------------------------------ */
// async function findAll(filters = {}) {
//   try {
//     let query = `
//       SELECT c.*
//       FROM ${schema}.classification c
//       JOIN ${schema}.library_setting ls
//         ON c.classification_type = ls.config_classification
//       WHERE 1=1
//     `;
//     const values = [];
//     let paramIndex = 1;

//     if (filters.classification_type) {
//       query += ` AND classification_type ILIKE $${paramIndex}`;
//       values.push(`%${filters.classification_type}%`);
//       paramIndex++;
//     }

//     if (filters.category) {
//       query += ` AND category ILIKE $${paramIndex}`;
//       values.push(`%${filters.category}%`);
//       paramIndex++;
//     }

//     if (filters.code) {
//       query += ` AND code ILIKE $${paramIndex}`;
//       values.push(`%${filters.code}%`);
//       paramIndex++;
//     }

//     if (filters.name) {
//       query += ` AND name ILIKE $${paramIndex}`;
//       values.push(`%${filters.name}%`);
//       paramIndex++;
//     }

//     if (filters.is_active !== undefined) {
//       query += ` AND is_active = $${paramIndex}`;
//       values.push(filters.is_active === 'true' || filters.is_active === true);
//       paramIndex++;
//     }

//     query += ` ORDER BY lastmodifieddate DESC`;

//     const result = await sql.query(query, values);
//     return result.rows.length > 0 ? result.rows : [];

//   } catch (error) {
//     console.error("Error in findAll:", error);
//     throw error;
//   }
// }
async function findAll(filters = {}) {
  try {
    console.log("findAll API HIT");

    let query = `
    SELECT c.*
      FROM ${schema}.classification c
      JOIN ${schema}.library_setting ls
        ON c.classification_type = ls.config_classification
      WHERE 1=1      
    `;

    const result = await sql.query(query);
    console.log("result=>", result.rows.length)
    return result.rows.length > 0 ? result.rows : [];

  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}

/* ------------------------------------------------------
   FIND BY ID
------------------------------------------------------ */
async function findById(id) {
    try {
        const query = `
            SELECT 
                c.*,
                b.branch_name,

                creator.firstname AS createdby_name,
                modifier.firstname AS lastmodifiedby_name

            FROM ${schema}.classification c

            LEFT JOIN ${schema}.branches b 
                ON c.branch_id = b.id

            LEFT JOIN ${schema}."user" creator 
                ON c.createdbyid = creator.id

            LEFT JOIN ${schema}."user" modifier 
                ON c.lastmodifiedbyid = modifier.id

            WHERE c.id = $1
        `;

        const result = await sql.query(query, [id]);
        return result.rows[0];

    } catch (error) {
        console.error("Error in Classification.findById:", error);
        throw error;
    }
}

/* ------------------------------------------------------
   CREATE NEW CLASSIFICATION
------------------------------------------------------ */
async function create(classificationData, userId) {
  try {
    const query = `INSERT INTO ${schema}.classification 
                   (classification_type, code, category, name, 
                    classification_from, classification_to, is_active,
                    createddate, lastmodifieddate, createdbyid, lastmodifiedbyid) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8, $8) 
                   RETURNING *`;

    const values = [
      classificationData.classification_type || null,
      classificationData.code || null,
      classificationData.category || null,
      classificationData.name || "New Classification",
      classificationData.classification_from || null,
      classificationData.classification_to || null,
      classificationData.is_active !== undefined ? classificationData.is_active : true,
      userId || null,
    ];

    const result = await sql.query(query, values);

    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error("Error in create:", error);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error detail:", error.detail);
    throw error;
  }
}

/* ------------------------------------------------------
   UPDATE BY ID
------------------------------------------------------ */
async function updateById(id, classificationData, userId) {
  try {
    const query = `UPDATE ${schema}.classification 
                   SET classification_type = COALESCE($2, classification_type),
                       code = COALESCE($3, code),
                       category = COALESCE($4, category),
                       name = COALESCE($5, name),
                       classification_from = COALESCE($6, classification_from),
                       classification_to = COALESCE($7, classification_to),
                       is_active = COALESCE($8, is_active),
                       lastmodifieddate = NOW(), 
                       lastmodifiedbyid = $9
                   WHERE id = $1 
                   RETURNING *`;

    const values = [
      id,
      classificationData.classification_type,
      classificationData.code,
      classificationData.category,
      classificationData.name,
      classificationData.classification_from,
      classificationData.classification_to,
      classificationData.is_active,
      userId || null,
    ];

    const result = await sql.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error in updateById:", error);
    throw error;
  }
}

/* ------------------------------------------------------
   DELETE BY ID (SOFT DELETE - SET is_active = false)
------------------------------------------------------ */
async function deleteById(id) {
  try {
    // Soft delete - just mark as inactive
    const query = `UPDATE ${schema}.classification 
                   SET is_active = false, lastmodifieddate = NOW()
                   WHERE id = $1 RETURNING *`;
    const result = await sql.query(query, [id]);

    if (result.rows.length > 0) {
      return { success: true, message: "Classification deleted successfully" };
    }
    return { success: false, message: "Classification not found" };
  } catch (error) {
    console.error("Error in deleteById:", error);
    throw error;
  }
}

/* ------------------------------------------------------
   HARD DELETE BY ID (COMPLETE REMOVAL)
------------------------------------------------------ */
async function hardDeleteById(id) {
  try {
    const query = `DELETE FROM ${schema}.classification WHERE id = $1 RETURNING *`;
    const result = await sql.query(query, [id]);

    if (result.rows.length > 0) {
      return { success: true, message: "Classification permanently deleted" };
    }
    return { success: false, message: "Classification not found" };
  } catch (error) {
    console.error("Error in hardDeleteById:", error);
    throw error;
  }
}

/* ------------------------------------------------------
   FIND BY CODE (CHECK DUPLICATE)
------------------------------------------------------ */
async function findByCode(code, classification_type, excludeId = null) {
  try {
    let query = `SELECT * FROM ${schema}.classification WHERE code = $1 AND classification_type = $2`;
    const params = [code, classification_type];

    if (excludeId) {
      query += ` AND id != $3`;
      params.push(excludeId);
    }

    const result = await sql.query(query, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error in findByCode:", error);
    throw error;
  }
}

/* ------------------------------------------------------
   FIND BY CLASSIFICATION TYPE
------------------------------------------------------ */
async function findByType(classification_type) {
  try {
    const query = `SELECT * FROM ${schema}.classification 
                   WHERE classification_type = $1 AND is_active = true
                   ORDER BY code`;
    const result = await sql.query(query, [classification_type]);
    return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
    console.error("Error in findByType:", error);
    throw error;
  }
}

/* ------------------------------------------------------
   GET UNIQUE TYPES
------------------------------------------------------ */
async function getUniqueTypes() {
  try {
    console.log("workingggg")
    const query = `SELECT DISTINCT classification_type 
                   FROM ${schema}.classification 
                   WHERE classification_type IS NOT NULL 
                   ORDER BY classification_type`;
    const result = await sql.query(query);
    return result.rows.map(row => row.classification_type);
  } catch (error) {
    console.error("Error in getUniqueTypes:", error);
    throw error;
  }
}/* ------------------------------------------------------
   GET LAST CLASSIFICATION (for auto-range calculation)
------------------------------------------------------ */
async function getLastClassification() {
  try {
    const query = `SELECT * FROM ${schema}.classification 
                   WHERE classification_to IS NOT NULL 
                   ORDER BY classification_to DESC NULLS LAST, id DESC 
                   LIMIT 1`;
    const result = await sql.query(query);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error in getLastClassification:", error);
    throw error;
  }
}

/* ------------------------------------------------------
   GET NEXT RANGE (calculates next 10-gap range)
------------------------------------------------------ */
async function getNextRange(classification_type) {
  try {
    const query = `SELECT MAX(CAST(classification_to AS INTEGER)) as max_to 
                   FROM ${schema}.classification 
                   WHERE classification_type = $1 
                   AND classification_to ~ '^[0-9]+$'`; // Only numeric values

    const result = await sql.query(query, [classification_type]);

    let nextFrom = 1;
    if (result.rows[0]?.max_to) {
      nextFrom = parseInt(result.rows[0].max_to) + 1;
    }

    return {
      from: nextFrom.toString(),
      to: (nextFrom + 9).toString()
    };
  } catch (error) {
    console.error("Error in getNextRange:", error);
    throw error;
  }
}

/* ------------------------------------------------------
   GET LAST CLASSIFICATION BY CATEGORY ONLY
------------------------------------------------------ */
async function getLastClassificationByCategory(category) {
  try {
    const query = `SELECT * FROM ${schema}.classification 
                   WHERE category = $1
                   AND classification_to IS NOT NULL 
                   ORDER BY classification_to DESC NULLS LAST, id DESC 
                   LIMIT 1`;
    const result = await sql.query(query, [category]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error in getLastClassificationByCategory:", error);
    throw error;
  }
}

/* ------------------------------------------------------
   GET LAST CLASSIFICATION BY CATEGORY AND NAME
------------------------------------------------------ */
async function getLastClassificationByCategoryAndName(category, name) {
  try {
    const query = `SELECT * FROM ${schema}.classification 
                   WHERE category = $1 AND name = $2
                   AND classification_to IS NOT NULL 
                   ORDER BY classification_to DESC NULLS LAST, id DESC 
                   LIMIT 1`;
    const result = await sql.query(query, [category, name]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error in getLastClassificationByCategoryAndName:", error);
    throw error;
  }
}

/* ------------------------------------------------------
   GET NEXT RANGE BY CATEGORY AND NAME
------------------------------------------------------ */
async function getNextRangeByCategoryAndName(category, name) {
  try {
    const query = `SELECT MAX(CAST(classification_to AS INTEGER)) as max_to 
                   FROM ${schema}.classification 
                   WHERE category = $1 AND name = $2
                   AND classification_to ~ '^[0-9]+$'`;

    const result = await sql.query(query, [category, name]);

    let nextFrom = 1;
    if (result.rows[0]?.max_to) {
      nextFrom = parseInt(result.rows[0].max_to) + 1;
    }

    return {
      from: nextFrom.toString(),
      to: (nextFrom + 9).toString()
    };
  } catch (error) {
    console.error("Error in getNextRangeByCategoryAndName:", error);
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
  hardDeleteById,
  findByCode,
  findByType,
  getUniqueTypes,
  getLastClassification,
  getNextRange,
  getLastClassificationByCategory,
  getLastClassificationByCategoryAndName,
  getNextRangeByCategoryAndName

};