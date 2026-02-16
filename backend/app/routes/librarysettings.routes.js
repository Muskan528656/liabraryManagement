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
      LibrarySettings.init(req.userinfo.tenantcode);
      const settings = await LibrarySettings.findAll();
      return res.status(200).json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  router.get("/all", fetchUser, checkPermission("Settings", "allow_view"), async (req, res) => {
    try {
      LibrarySettings.init(req.userinfo.tenantcode);
      const settings = await LibrarySettings.getAllSettings();
      return res.status(200).json({ success: true, data: settings });
    } catch (error) {
      console.error("Error fetching settings:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  router.get("/active", fetchUser, checkPermission("Settings", "allow_view"), async (req, res) => {
    try {
      LibrarySettings.init(req.userinfo.tenantcode);
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
      LibrarySettings.init(req.userinfo.tenantcode);
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

        LibrarySettings.init(req.userinfo.tenantcode);
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
        LibrarySettings.init(req.userinfo.tenantcode);
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
        const setting = await LibrarySettings.updateSettings(settingData, userId);
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

        LibrarySettings.init(req.userinfo.tenantcode);
        const userId = req.userinfo?.id || null;


        const settingData = {};
        req.body.settings.forEach(setting => {
          if (setting.setting_key === 'max_books_per_card') {
            settingData.max_books = parseInt(setting.setting_value) || 1;
          } else if (setting.setting_key === 'duration_days') {
            settingData.max_days = parseInt(setting.setting_value) || 15;
          } else if (setting.setting_key === 'fine_per_day') {
            settingData.fine_per_day = parseFloat(setting.setting_value) || 10;
          } else if (setting.setting_key === 'renew_limit') {
            settingData.renewal_limit = parseInt(setting.setting_value) || 2;
          } else if (setting.setting_key === 'max_issue_per_day') {

          } else if (setting.setting_key === 'lost_book_fine_percentage') {

          }
          else if (setting.setting_key === 'config_classification') {
            settingData.config_classification = setting.setting_value
          }
        });


        settingData.name = 'Default';
        settingData.price = 0;
        settingData.reservation_limit = 3;
        settingData.membership_validity_days = 365;
        settingData.issue_permission = true;
        settingData.return_permission = true;
        settingData.issue_approval_required = false;
        settingData.digital_access = false;
        settingData.is_active = true;
        settingData.config_classification = "";

        const setting = await LibrarySettings.updateSettings(settingData, userId);
        return res.status(200).json({ success: true, data: setting });
      } catch (error) {
        console.error("Error updating settings:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );


  router.delete("/:key", fetchUser, checkPermission("Settings", "allow_delete"), async (req, res) => {
    try {
      LibrarySettings.init(req.userinfo.tenantcode);
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

