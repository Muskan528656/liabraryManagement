/**
 * Handles all incoming request for /api/librarysettings endpoint
 * DB table for this ${schema}.library_setting
 * Model used here is librarysettings.model.js
 * SUPPORTED API ENDPOINTS
 *              GET     /api/librarysettings
 *              GET     /api/librarysettings/all
 *              GET     /api/librarysettings/:key
 *              POST    /api/librarysettings
 *              PUT     /api/librarysettings/bulk
 *              DELETE  /api/librarysettings/:key
 *
 *@author     Muskan Khan
@date   DEC,   2025
 * @copyright   www.ibirdsservices.com
 */

const e = require("express");
const { fetchUser, checkPermission } = require("../middleware/fetchuser.js");
const LibrarySettings = require("../models/librarysettings.model.js");

module.exports = (app) => {
  const { body, validationResult } = require("express-validator");

  var router = require("express").Router();


  router.get("/", fetchUser, checkPermission("Settings", "allow_view"), async (req, res) => {
    try {
      LibrarySettings.init(req.userinfo.tenantcode, req.branchId);
      const settings = await LibrarySettings.findAll();
      return res.status(200).json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  router.get("/all", fetchUser, checkPermission("Settings", "allow_view"), async (req, res) => {
    try {
      LibrarySettings.init(req.userinfo.tenantcode, req.branchId);
      const settings = await LibrarySettings.getAllSettings();
      console.log("Settings:", settings);

      return res.status(200).json({ success: true, data: settings });
    } catch (error) {
      console.error("Error fetching settings:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  router.get("/active", fetchUser, checkPermission("Settings", "allow_view"), async (req, res) => {
    try {
      LibrarySettings.init(req.userinfo.tenantcode, req.branchId);
      const setting = await LibrarySettings.getActiveSetting();
      if (!setting) {
        return res.status(404).json({ errors: "No active setting found" });
      }
      return res.status(200).json({ success: true, data: setting });
    } catch (error) {
      console.error("Error fetching active setting:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  router.get("/:key", fetchUser, checkPermission("Settings", "allow_view"), async (req, res) => {
    try {
      LibrarySettings.init(req.userinfo.tenantcode, req.branchId);
      const setting = await LibrarySettings.findByKey(req.params.key);
      if (!setting) {
        return res.status(404).json({ errors: "Setting not found" });
      }
      return res.status(200).json(setting);
    } catch (error) {
      console.error("Error fetching setting:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  router.post(
    "/",
    fetchUser,
    checkPermission("Settings", "allow_create"),
    [
      body("setting_key").notEmpty().withMessage("Setting key is required"),
      body("setting_value").notEmpty().withMessage("Setting value is required"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        LibrarySettings.init(req.userinfo.tenantcode, req.branchId);
        const userId = req.userinfo?.id || null;
        const setting = await LibrarySettings.upsertSetting(req.body, userId);
        return res.status(200).json({ success: true, data: setting });
      } catch (error) {
        console.error("Error saving setting:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );


  router.put(
    "/",
    fetchUser,
    checkPermission("Settings", "allow_edit"),
    async (req, res) => {
      try {
        LibrarySettings.init(req.userinfo.tenantcode, req.branchId);
        const userId = req.userinfo?.id || null;
        console.log("woowooowow")

        const settingData = {
          name: req.body.name || 'Default',
          price: req.body.price || 0,
          max_books: req.body.max_books_per_card || req.body.max_books || 1,
          max_days: req.body.duration_days || req.body.max_days || 15,
          renewal_limit: req.body.renew_limit || req.body.renewal_limit || 2,
          fine_per_day: req.body.fine_per_day || 10,
          reservation_limit: req.body.reservation_limit || 3,
          membership_validity_days: req.body.membership_validity_days || 365,
          issue_permission: req.body.issue_permission !== undefined ? req.body.issue_permission : true,
          return_permission: req.body.return_permission !== undefined ? req.body.return_permission : true,
          issue_approval_required: req.body.issue_approval_required !== undefined ? req.body.issue_approval_required : false,
          digital_access: req.body.digital_access !== undefined ? req.body.digital_access : false,
          description: req.body.description || null,
          is_active: req.body.is_active !== undefined ? req.body.is_active : true,
          config_classification: req.body.config_classification !== undefined ? req.body.config_classification : true
        };
        console.log("settingDatasettingDatasettingData", settingData)
        const setting = await LibrarySettings.updateSettings(settingData, userId, branchId);
        return res.status(200).json({ success: true, data: setting });
      } catch (error) {
        console.error("Error updating settings:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );

  router.put(
    "/bulk",
    fetchUser,
    checkPermission("Settings", "allow_edit"),
    [
      body("settings").isArray().withMessage("Settings must be an array"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        LibrarySettings.init(req.userinfo.tenantcode, req.branchId);
        const userId = req.userinfo?.id || null;

        // First, get the existing settings
        const existingSettings = await LibrarySettings.getActiveSetting();

        const settingData = {
          // Keep existing values as defaults
          name: existingSettings?.name || 'Default',
          price: existingSettings?.price || 0,
          max_books: existingSettings?.max_books || 1,
          max_days: existingSettings?.max_days || 15,
          renewal_limit: existingSettings?.renewal_limit || 2,
          fine_per_day: existingSettings?.fine_per_day || 10,
          reservation_limit: existingSettings?.reservation_limit || 3,
          membership_validity_days: existingSettings?.membership_validity_days || 365,
          issue_permission: existingSettings?.issue_permission !== undefined ? existingSettings?.issue_permission : true,
          return_permission: existingSettings?.return_permission !== undefined ? existingSettings?.return_permission : true,
          issue_approval_required: existingSettings?.issue_approval_required || false,
          digital_access: existingSettings?.digital_access || false,
          description: existingSettings?.description || null,
          is_active: existingSettings?.is_active !== undefined ? existingSettings?.is_active : true,
          config_classification: existingSettings?.config_classification || "",
          lost_book_fine_percentage: existingSettings?.lost_book_fine_percentage || 100,
          max_issue_per_day: existingSettings?.max_issue_per_day || 1
        };

        // Override with new values from request
        req.body.settings.forEach(setting => {
          switch (setting.setting_key) {
            case 'max_books_per_card':
              settingData.max_books = parseInt(setting.setting_value) || 1;
              break;
            case 'duration_days':
              settingData.max_days = parseInt(setting.setting_value) || 15;
              break;
            case 'fine_per_day':
              settingData.fine_per_day = parseFloat(setting.setting_value) || 10;
              break;
            case 'renew_limit':
              settingData.renewal_limit = parseInt(setting.setting_value) || 2;
              break;
            case 'max_issue_per_day':
              settingData.max_issue_per_day = parseInt(setting.setting_value) || 1;
              break;
            case 'lost_book_fine_percentage':
              settingData.lost_book_fine_percentage = parseFloat(setting.setting_value) || 100;
              break;
            case 'config_classification':
              settingData.config_classification = setting.setting_value || "";
              break;
          }
        });

        console.log("Final settingData to save:", settingData);
        console.log("req.branchIdreq.branchId", req.branchId)
        const setting = await LibrarySettings.updateSettings(settingData, userId, req.branchId);
        return res.status(200).json({ success: true, data: setting });
      } catch (error) {
        console.error("Error updating settings:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );


  router.delete("/:key", fetchUser, checkPermission("Settings", "allow_delete"), async (req, res) => {
    try {
      LibrarySettings.init(req.userinfo.tenantcode, req.branchId);
      const result = await LibrarySettings.deleteByKey(req.params.key);
      if (!result.success) {
        return res.status(404).json({ errors: result.message });
      }
      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      console.error("Error deleting setting:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });


  app.use(process.env.BASE_API_URL + "/api/librarysettings", router);
};