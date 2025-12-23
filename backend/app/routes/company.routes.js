 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 

 
 

 
 


 
 
 
 

 
 
 
 

 
 
 
 
 
 
 

 
 
 
 
 
 
 
 

 
 
 

 
 

 
 
 
 
 

 
 
 
 

 
 
 
 
 
 
 

 


 
 
 
 
 
 
 
 
 
 


 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 


 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 


 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 


 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 

 
 
 
 

 
 
 
 
 
 
 
 
 

 
 
 

 
 
 

 
 
 
 
 


 
 
 

 
 
 
 
 
 
 


 
 
 
 
 
 
 
 
 
 
 
 
 

 
 


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
const multer = require("multer");

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

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, companyUploadDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'company-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Only image files are allowed'));
    }
  });

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
        console.log("Creating company with data:", req.body);
        
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
    upload.single('image'),
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
        const previousImagePath = existingCompany.logourl;

        if (req.file) {
          companyData.logourl = `/uploads/companies/${req.file.filename}`;
        }

        console.log("company update data->>", companyData)
        const company = await Company.updateById(req.params.id, companyData, userId);
        if (!company) {
          return res.status(400).json({ errors: "Failed to update company" });
        }


        if (req.file && previousImagePath && previousImagePath !== companyData.logourl) {
          deleteFileIfExists(previousImagePath);
        }

        return res.status(200).json({ success: true, data: company });
      } catch (error) {
        console.error("Error updating company:", error);
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