// /**
//  * Handles all incoming request for /api/category endpoint
//  * DB table for this ${schema}.categories
//  * Model used here is category.model.js
//  * SUPPORTED API ENDPOINTS
//  *              GET     /api/category
//  *              GET     /api/category/:id
//  *              POST    /api/category
//  *              PUT     /api/category/:id
//  *              DELETE  /api/category/:id
//  *
//  *@author     Muskan Khan
// @date   DEC,   2025
//  * @copyright   www.ibirdsservices.com
//  */

// const e = require("express");
// const { fetchUser, checkPermission, } = require("../middleware/fetchuser.js");
// const Category = require("../models/category.model.js");

// module.exports = (app) => {
//   const { body, validationResult } = require("express-validator");

//   var router = require("express").Router();


//   router.get("/", fetchUser, checkPermission("Categories", "allow_view"), async (req, res) => {
//     try {
//       const categories = await Category.findAll(req.query);
//       return res.status(200).json(categories);
//     } catch (error) {
//       console.error("Error fetching categories:", error);
//       return res.status(500).json({ errors: "Internal server error" });
//     }
//   });


//   router.get("/:id", fetchUser, checkPermission("Categories", "allow_view"), async (req, res) => {
//     try {
//       const category = await Category.findById(req.params.id);
//       if (!category) {
//         return res.status(404).json({ errors: "Category not found" });
//       }
//       return res.status(200).json(category);
//     } catch (error) {
//       console.error("Error fetching category:", error);
//       return res.status(500).json({ errors: "Internal server error" });
//     }
//   });


//   router.post(
//     "/",
//     fetchUser,
//     checkPermission("Categories", "allow_create"),
//     [

//       body("name").optional().custom((value) => {

//         return true;
//       }),
//     ],
//     async (req, res) => {
//       try {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//           return res.status(400).json({ errors: errors.array() });
//         }
//         const existingCategory = await Category.findByName(req.body.name);
//         if (existingCategory) {
//           return res
//             .status(400)
//             .json({ errors: "Category with this name already exists" });
//         }

//         const userId = req.userinfo?.id || null;
//         const category = await Category.create(req.body, userId);
//         if (!category) {
//           return res.status(400).json({ errors: "Failed to create category" });
//         }
//         return res.status(200).json({ success: true, data: category });
//       } catch (error) {
//         console.error("Error creating category:", error);
//         console.error("Error stack:", error.stack);
//         console.error("Request body:", req.body);
//         return res.status(500).json({
//           errors: error.message || "Internal server error",
//           details: process.env.NODE_ENV === 'development' ? error.stack : undefined
//         });
//       }
//     }
//   );


//   router.put(
//     "/:id",
//     fetchUser,
//     checkPermission("Categories", "allow_edit"),
//     [
//       body("name").notEmpty().withMessage("Name is required"),
//     ],
//     async (req, res) => {
//       try {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//           return res.status(400).json({ errors: errors.array() });
//         }


//         const existingCategory = await Category.findById(req.params.id);
//         if (!existingCategory) {
//           return res.status(404).json({ errors: "Category not found" });
//         }


//         const duplicateCategory = await Category.findByName(
//           req.body.name,
//           req.params.id
//         );
//         if (duplicateCategory) {
//           return res
//             .status(400)
//             .json({ errors: "Category with this name already exists" });
//         }

//         const userId = req.userinfo?.id || null;
//         const category = await Category.updateById(req.params.id, req.body, userId);
//         if (!category) {
//           return res.status(400).json({ errors: "Failed to update category" });
//         }
//         return res.status(200).json({ success: true, data: category });
//       } catch (error) {
//         console.error("Error updating category:", error);
//         return res.status(500).json({ errors: error.message });
//       }
//     }
//   );


//   router.delete("/:id", checkPermission("Categories", "allow_delete"), fetchUser, async (req, res) => {
//     try {
//       const result = await Category.deleteById(req.params.id);
//       if (!result.success) {
//         return res.status(404).json({ errors: result.message });
//       }
//       return res.status(200).json({ success: true, message: result.message });
//     } catch (error) {
//       console.error("Error deleting category:", error);
//       return res.status(500).json({ errors: "Internal server error" });
//     }
//   });


//   app.use(process.env.BASE_API_URL + "/api/category", router);
// };
/**
 * Handles all incoming request for /api/classification endpoint
 * DB table for this ${schema}.classification
 * Model used here is classification.model.js
 * SUPPORTED API ENDPOINTS
 *              GET     /api/classification
 *              GET     /api/classification/:id
 *              POST    /api/classification
 *              PUT     /api/classification/:id
 *              DELETE  /api/classification/:id
 *
 * @author     Muskan Khan
 * @date   DEC, 2025
 * @copyright   www.ibirdsservices.com
 */

const { fetchUser, checkPermission } = require("../middleware/fetchuser.js");
const Classification = require("../models/category.model.js");
const sql = require("../models/db.js");

let schema = "";

module.exports = (app) => {
  const { body, validationResult } = require("express-validator");

  var router = require("express").Router();

  // IMPORTANT: Place specific routes BEFORE parameterized routes
  // ============================================================

  // GET unique classification types
  router.get("/types", fetchUser, checkPermission("Categories", "allow_view"), async (req, res) => {
    try {
      // Initialize with tenant code from user info
      Classification.init(req.userinfo.tenantcode);

      const types = await Classification.getUniqueTypes();
      return res.status(200).json(types);
    } catch (error) {
      console.error("Error fetching classification types:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // GET last classification
  router.get("/last", fetchUser, checkPermission("Categories", "allow_view"), async (req, res) => {
    try {
      Classification.init(req.userinfo.tenantcode);
      const lastClassification = await Classification.getLastClassification();
      return res.status(200).json(lastClassification);
    } catch (error) {
      console.error("Error fetching last classification:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // GET next range for a classification type
  router.get("/next-range/:type", fetchUser, checkPermission("Categories", "allow_view"), async (req, res) => {
    try {
      Classification.init(req.userinfo.tenantcode);
      const nextRange = await Classification.getNextRange(req.params.type);
      return res.status(200).json(nextRange);
    } catch (error) {
      console.error("Error calculating next range:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // GET classifications by type
  router.get("/type/:type", fetchUser, checkPermission("Categories", "allow_view"), async (req, res) => {
    try {
      Classification.init(req.userinfo.tenantcode);
      const classifications = await Classification.findByType(req.params.type);
      return res.status(200).json(classifications);
    } catch (error) {
      console.error("Error fetching classifications by type:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // GET all classifications with filters
  router.get("/", fetchUser, checkPermission("Categories", "allow_view"), async (req, res) => {
    try {
      Classification.init(req.userinfo.tenantcode);
      const classifications = await Classification.findAll(req.query);
      return res.status(200).json(classifications);
    } catch (error) {
      console.error("Error fetching classifications:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // GET suggestions for category/name/code fields - MUST BE BEFORE /:id
  router.get("/suggestions", fetchUser, checkPermission("Categories", "allow_view"), async (req, res) => {
    try {
      schema = req.userinfo.tenantcode || 'demo';
      Classification.init(schema);
      const { field, category, search, limit = 10 } = req.query;

      // Validate field parameter to prevent SQL injection
      const allowedFields = ['category', 'name', 'code'];
      if (!allowedFields.includes(field)) {
        return res.status(400).json({ errors: "Invalid field parameter" });
      }

      let query = `SELECT DISTINCT ${field} FROM ${schema}.classification WHERE ${field} IS NOT NULL`;
      const params = [];
      let paramIndex = 1;

      if (field === 'name' && category) {
        query += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      if (search) {
        query += ` AND ${field} ILIKE $${paramIndex}`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      const limitValue = parseInt(limit) || 10;
      query += ` ORDER BY ${field} LIMIT ${limitValue}`;

      const result = await sql.query(query, params);
      const suggestions = result.rows.map(row => row[field]);

      return res.status(200).json(suggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // GET last classification by category only - MUST BE BEFORE /:id
// GET category range (MIN/MAX) - MUST BE BEFORE /:id
router.get(
  "/last-by-category/:category",
  fetchUser,
  checkPermission("Categories", "allow_view"),
  async (req, res) => {
    try {
      // ✅ Set schema properly
      schema = req.userinfo.tenantcode || "demo";
      Classification.init(schema);

      const category = req.params.category;
      const type = req.query.type;

      let query = `
        SELECT 
          MIN(classification_from::text) AS min_from,
          MAX(classification_to::text) AS max_to
        FROM ${schema}."classification"
        WHERE category = $1
      `;

      const values = [category];

      if (type) {
        query += ` AND classification_type = $2`;
        values.push(type);
      }

      const result = await sql.query(query, values);

      return res.status(200).json(result.rows[0] || {});

    } catch (error) {
      console.error("Error fetching category range:", error);
      return res.status(500).json({ errors: error.message });
    }
  }
);




  // GET last classification by category and name - MUST BE BEFORE /:id
  router.get("/last-by-category-name/:category/:name", fetchUser, checkPermission("Categories", "allow_view"), async (req, res) => {
    try {
      Classification.init(req.userinfo.tenantcode);
      const lastClassification = await Classification.getLastClassificationByCategoryAndName(
        req.params.category,
        req.params.name
      );
      return res.status(200).json(lastClassification);
    } catch (error) {
      console.error("Error fetching last classification by category and name:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // GET single classification by ID - THIS MUST COME AFTER SPECIFIC ROUTES
  router.get("/:id", fetchUser, checkPermission("Categories", "allow_view"), async (req, res) => {
    try {
      // Validate UUID format to prevent errors
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(req.params.id)) {
        return res.status(400).json({ errors: "Invalid ID format" });
      }

      Classification.init(req.userinfo.tenantcode);
      const classification = await Classification.findById(req.params.id);
      if (!classification) {
        return res.status(404).json({ errors: "Classification not found" });
      }
      return res.status(200).json(classification);
    } catch (error) {
      console.error("Error fetching classification:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // POST create new classification
  router.post(
    "/",
    fetchUser,
    checkPermission("Categories", "allow_create"),
    [
      body("classification_type").notEmpty().withMessage("Classification type is required"),
      body("name").notEmpty().withMessage("Name is required"),
      body("code").optional(),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        Classification.init(req.userinfo.tenantcode);

        // Check for duplicate code if provided
        if (req.body.code) {
          const existingClassification = await Classification.findByCode(
            req.body.code,
            req.body.classification_type
          );
          if (existingClassification) {
            return res.status(400).json({
              errors: `Classification with code ${req.body.code} already exists for type ${req.body.classification_type}`
            });
          }
        }

        const userId = req.userinfo?.id || null;
        const classification = await Classification.create(req.body, userId);

        if (!classification) {
          return res.status(400).json({ errors: "Failed to create classification" });
        }

        return res.status(200).json({ success: true, data: classification });
      } catch (error) {
        console.error("Error creating classification:", error);
        return res.status(500).json({
          errors: error.message || "Internal server error"
        });
      }
    }
  );

  // PUT update classification
  router.put(
    "/:id",
    fetchUser,
    checkPermission("Categories", "allow_edit"),
    [
      body("classification_type").optional(),
      body("name").optional(),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(req.params.id)) {
          return res.status(400).json({ errors: "Invalid ID format" });
        }

        Classification.init(req.userinfo.tenantcode);

        // Check if classification exists
        const existingClassification = await Classification.findById(req.params.id);
        if (!existingClassification) {
          return res.status(404).json({ errors: "Classification not found" });
        }

        // Check for duplicate code if code is being updated
        if (req.body.code && req.body.code !== existingClassification.code) {
          const duplicateClassification = await Classification.findByCode(
            req.body.code,
            req.body.classification_type || existingClassification.classification_type,
            req.params.id
          );
          if (duplicateClassification) {
            return res.status(400).json({
              errors: `Classification with code ${req.body.code} already exists`
            });
          }
        }

        const userId = req.userinfo?.id || null;
        const classification = await Classification.updateById(req.params.id, req.body, userId);

        if (!classification) {
          return res.status(400).json({ errors: "Failed to update classification" });
        }

        return res.status(200).json({ success: true, data: classification });
      } catch (error) {
        console.error("Error updating classification:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );

  // DELETE classification (soft delete)
  router.delete("/:id", fetchUser, checkPermission("Categories", "allow_delete"), async (req, res) => {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(req.params.id)) {
        return res.status(400).json({ errors: "Invalid ID format" });
      }

      Classification.init(req.userinfo.tenantcode);
      const result = await Classification.deleteById(req.params.id);

      if (!result.success) {
        return res.status(404).json({ errors: result.message });
      }

      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      console.error("Error deleting classification:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  // HARD DELETE (optional - use with caution)
  router.delete("/hard/:id", fetchUser, checkPermission("Categories", "allow_delete"), async (req, res) => {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(req.params.id)) {
        return res.status(400).json({ errors: "Invalid ID format" });
      }

      Classification.init(req.userinfo.tenantcode);
      const result = await Classification.hardDeleteById(req.params.id);

      if (!result.success) {
        return res.status(404).json({ errors: result.message });
      }

      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      console.error("Error permanently deleting classification:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });
  app.use(process.env.BASE_API_URL + "/api/classification", router);
};