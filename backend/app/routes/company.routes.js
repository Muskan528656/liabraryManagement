
/**
 * Handles all incoming request for /api/company endpoint
 * DB table for this public.company
 * Model used here is company.model.js
 * SUPPORTED API ENDPOINTS
 *              GET     /api/company
 *              GET     /api/company/:id
 *              POST    /api/company
 *              PUT     /api/company/:id
 *              DELETE  /api/company/:id
 *
 * @author      Your Name
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */

const { fetchUser, checkModulePermission } = require("../middleware/fetchuser.js");
const Company = require("../models/company.model.js");
const fs = require("fs");
const path = require("path");

module.exports = (app) => {
  const { body, validationResult } = require("express-validator");

  const countryCodesPath = path.join(__dirname, "../constants/CountryCode.json");


  let CountryCode = [];
  try {
    if (fs.existsSync(countryCodesPath)) {
      CountryCode = JSON.parse(fs.readFileSync(countryCodesPath, "utf8"));
    }
  } catch (err) {
    console.error("Error reading CountryCode.json:", err);
  }


  const rootDir = path.resolve(__dirname, "../../..");
  const frontendPublicDir = path.join(rootDir, "frontend", "public");
  const frontendUploadsDir = path.join(frontendPublicDir, "uploads");
  const companyUploadDir = path.join(frontendUploadsDir, "companies");

  const ensureDirectory = (dirPath) => {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  };
  [frontendPublicDir, frontendUploadsDir, companyUploadDir].forEach(ensureDirectory);

  const deleteFileIfExists = (filePath = "") => {
    if (!filePath || typeof filePath !== "string") return;
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) return;

    let normalized = filePath.replace(/\\/g, "/");
    if (normalized.startsWith("/")) normalized = normalized.slice(1);

    const candidatePaths = [
      path.join(frontendPublicDir, normalized),
      path.join(__dirname, "../../", normalized),
      path.join(companyUploadDir, path.basename(normalized)),
    ];

    const visited = new Set();
    candidatePaths.forEach((absolutePath) => {
      if (!absolutePath || visited.has(absolutePath)) return;
      visited.add(absolutePath);

      try {
        if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
      } catch (err) {
        console.error("Error removing company image:", absolutePath, err.message);
      }
    });
  };

  var router = require("express").Router();


  router.get("/", fetchUser, async (req, res) => {
    try {
      Company.init(req.userinfo.tenantcode);
      const companies = await Company.findAll();
      return res.status(200).json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });


  router.get("/:id", fetchUser, async (req, res) => {
    try {
      Company.init(req.userinfo.tenantcode);
      const company = await Company.findById(req.params.id);
      if (!company) {
        return res.status(404).json({ errors: "Company not found" });
      }

      if (company.country_code) {
        const countryInfo = CountryCode.find(c => c.country_code === company.country_code);
        if (countryInfo) {
          company.country_code_display = `${countryInfo.country} (${countryInfo.country_code})`;
        }
      }
      return res.status(200).json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });


  router.get("/name/:name", fetchUser, async (req, res) => {
    try {
      Company.init(req.userinfo.tenantcode);
      const name = decodeURIComponent(req.params.name);
      const company = await Company.findByName(name);
      if (!company) {
        return res.status(404).json({ errors: "Company not found" });
      }
      return res.status(200).json(company);
    } catch (error) {
      console.error("Error fetching company by name:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  router.post(
    "/",
    fetchUser,
    [
      body("name").notEmpty().withMessage("Company name is required"),
      body("userlicenses").isInt({ min: 0 }).withMessage("User licenses must be a non-negative integer"),
      body("systememail").isEmail().withMessage("Valid system email is required"),
      body("adminemail").isEmail().withMessage("Valid admin email is required"),
      body("isactive").isBoolean().withMessage("isActive must be a boolean value"),

      body("currency_symbol").optional().isString().withMessage("Currency symbol must be a string"),
      body("currency").optional().isString().withMessage("Currency must be a string"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        Company.init(req.userinfo.tenantcode);


        const existingCompany = await Company.findByName(req.body.name);
        if (existingCompany) {
          return res
            .status(400)
            .json({ errors: "Company with this name already exists" });
        }

        const userId = req.user?.id || null;


        const company = await Company.create(req.body, userId);
        if (!company) {
          return res.status(400).json({ errors: "Failed to create company" });
        }
        return res.status(201).json({ success: true, data: company });
      } catch (error) {
        console.error("Error creating company:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );


  router.put(
    "/:id",
    fetchUser,
    async (req, res) => {
      try {
        Company.init(req.userinfo.tenantcode);

        const existingCompany = await Company.findById(req.params.id);
        if (!existingCompany) {
          return res.status(404).json({ errors: "Company not found" });
        }

        const duplicateCompany = await Company.findByName(
          req.body.name,
          req.params.id
        );
        if (duplicateCompany) {
          return res
            .status(400)
            .json({ errors: "Company with this name already exists" });
        }

        const userId = req.userinfo?.id || null;

        const companyData = { ...req.body };

        // Convert string booleans to actual booleans for multipart form data
        if (companyData.isactive !== undefined) {
          companyData.isactive = companyData.isactive === 'true' || companyData.isactive === true;
        }
        if (companyData.is_external !== undefined) {
          companyData.is_external = companyData.is_external === 'true' || companyData.is_external === true;
        }
        if (companyData.has_wallet !== undefined) {
          companyData.has_wallet = companyData.has_wallet === 'true' || companyData.has_wallet === true;
        }

        const previousImagePath = existingCompany.logourl;

        // Handle file upload with express-fileupload
        if (req.files && req.files.image) {
          const imageFile = req.files.image;

          // Validate file type - match frontend validation exactly
          const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
          const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];

          const fileExtension = imageFile.name.toLowerCase().substring(imageFile.name.lastIndexOf('.'));
          const mimeType = imageFile.mimetype.toLowerCase();

          console.log('Backend file validation:', {
            name: imageFile.name,
            mimeType: mimeType,
            extension: fileExtension,
            size: imageFile.size
          });

          // Check if MIME type is valid
          const isValidMimeType = allowedMimeTypes.includes(mimeType);

          // Check if extension is valid
          const isValidExtension = allowedExtensions.includes(fileExtension);

          // For JPEG files, accept both .jpg and .jpeg extensions
          const isJpegFile = (mimeType === 'image/jpeg' && (fileExtension === '.jpg' || fileExtension === '.jpeg')) ||
            (mimeType === 'image/png' && fileExtension === '.png') ||
            (mimeType === 'image/gif' && fileExtension === '.gif');

          if (!isValidMimeType || !isValidExtension || !isJpegFile) {

            return res.status(400).json({ errors: "Only JPEG, PNG, and GIF images are allowed" });
          }

          // Validate file size (5MB limit)
          if (imageFile.size > 5 * 1024 * 1024) {
            return res.status(400).json({ errors: "File size must be less than 5MB" });
          }

          // Generate unique filename
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const filename = 'company-' + uniqueSuffix + path.extname(imageFile.name);
          const filepath = path.join(companyUploadDir, filename);

          // Move file to upload directory
          await imageFile.mv(filepath);
          companyData.logourl = `/uploads/companies/${filename}`;
        }


        const company = await Company.updateById(req.params.id, companyData, userId);
        if (!company) {
          return res.status(400).json({ errors: "Failed to update company" });
        }

        // Delete old image if a new one was uploaded
        if (req.files && req.files.image && previousImagePath && previousImagePath !== companyData.logourl) {
          deleteFileIfExists(previousImagePath);
        }

        return res.status(200).json({ success: true, data: company });
      } catch (error) {
        console.error("Error updating company:", error);

        // Handle multipart parsing errors specifically
        if (error.message && error.message.includes('Unexpected end of form')) {
          return res.status(400).json({
            errors: "File upload failed. Please ensure the file is not corrupted and try again."
          });
        }

        // Handle file size limit exceeded
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            errors: "File size exceeds the 5MB limit."
          });
        }

        return res.status(500).json({ errors: error.message });
      }
    }
  );


  router.delete("/:id", fetchUser, async (req, res) => {
    try {
      Company.init(req.userinfo.tenantcode);
      const result = await Company.deleteById(req.params.id);
      if (!result.success) {
        return res.status(404).json({ errors: result.message });
      }
      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      console.error("Error deleting company:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  app.use(process.env.BASE_API_URL + "/api/company", router);
};