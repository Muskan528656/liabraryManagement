/**
 * Handles all incoming request for /api/objecttype endpoint
 * DB table: public.object_type
 * Model: objecttype.model.js
 * SUPPORTED API ENDPOINTS
 *   GET     /api/objecttype
 *   GET     /api/objecttype/:id
 *   POST    /api/objecttype
 *   PUT     /api/objecttype/:id
 *   DELETE  /api/objecttype/:id
 *
 * @author     Aabid
 * @date       Dec, 2025
 * @copyright  www.ibirdsservices.com
 */

const { fetchUser } = require("../middleware/fetchuser.js");
const ObjectType = require("../models/objecttype.model.js");

module.exports = (app) => {
  const { body, validationResult } = require("express-validator");
  var router = require("express").Router();


  router.get("/", fetchUser, async (req, res) => {
    try {
      const records = await ObjectType.getAllRecords();
      res.status(200).json({
        success: true,
        data: records || [],
        message: "Object types retrieved successfully",
      });
    } catch (error) {
      console.error("Error fetching object types:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });


  router.get("/:id", fetchUser, async (req, res) => {
    try {
      const record = await ObjectType.getAllRecords();
      const objectType = record.find(item => item.id == req.params.id);
      if (!objectType) {
        return res.status(404).json({
          success: false,
          message: "Object type not found",
        });
      }
      res.status(200).json({
        success: true,
        data: objectType,
        message: "Object type retrieved successfully",
      });
    } catch (error) {
      console.error("Error fetching object type:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });


  router.post(
    "/",
    fetchUser,
    [
      body("name").notEmpty().withMessage("Name is required"),
      body("status").optional().isIn(['active', 'inactive']).withMessage("Status must be active or inactive"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }


        const isDuplicate = await ObjectType.checkDuplicateRecord(req.body.name);
        if (isDuplicate) {
          return res.status(400).json({
            success: false,
            message: "Object type with this name already exists",
          });
        }

        const record = await ObjectType.createRecord(req.body);
        if (!record) {
          return res.status(400).json({
            success: false,
            message: "Failed to create object type",
          });
        }

        res.status(201).json({
          success: true,
          data: record,
          message: "Object type created successfully",
        });
      } catch (error) {
        console.error("Error creating object type:", error);
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );


  router.put(
    "/:id",
    fetchUser,
    [
      body("name").optional().notEmpty().withMessage("Name cannot be empty"),
      body("status").optional().isIn(['active', 'inactive']).withMessage("Status must be active or inactive"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }


        if (req.body.name) {
          const isDuplicate = await ObjectType.checkDuplicateRecord(req.body.name, req.params.id);
          if (isDuplicate) {
            return res.status(400).json({
              success: false,
              message: "Object type with this name already exists",
            });
          }
        }

        const record = await ObjectType.updateById(req.params.id, req.body);
        if (!record) {
          return res.status(404).json({
            success: false,
            message: "Object type not found or update failed",
          });
        }

        res.status(200).json({
          success: true,
          data: record,
          message: "Object type updated successfully",
        });
      } catch (error) {
        console.error("Error updating object type:", error);
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );


  router.delete("/:id", fetchUser, async (req, res) => {
    try {
      const result = await ObjectType.deleteRecord(req.params.id);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Object type not found or delete failed",
        });
      }

      res.status(200).json({
        success: true,
        message: "Object type deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting object type:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  app.use(process.env.BASE_API_URL + "/api/objecttype", router);
};
