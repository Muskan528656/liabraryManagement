/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */

const e = require("express");
const Auth = require("../models/auth.model.js");
const { fetchUser } = require("../middleware/fetchuser.js");
// const File = require("../models/file.model.js");
const sql = require("../models/db.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");


// const Mailer = require("../models/mail.model.js");

module.exports = (app) => {
  const { body, validationResult } = require("express-validator");

  var router = require("express").Router();

  // Create a new Tutorial
  router.post(
    "/createuser",
    fetchUser,
    [
      body("email", "Please enter email").isEmail(),
      body("password", "Please enter password").isLength({ min: 6 }),
      body("firstname", "Please enter firstname").isLength({ min: 2 }),
      body("lastname", "Please enter lastname").isLength({ min: 2 }),
      body("whatsapp_number", "Please enter whatsapp_number").isLength({
        min: 8,
      }),
      body("whatsapp_settings", "WhatsApp settings must be an array")
        .optional()
        .isArray(),
    ],

    async (req, res) => {
      console.log("Inside createuser route");
      const tenantcode = req.userinfo?.tenantcode;
      const companyid = req.userinfo?.companyid;
      console.log("tenantcode---", tenantcode);
      console.log("companyid---", companyid);
      console.log("req.userinfo---", req.userinfo);

      if (!tenantcode) {
        console.error("Error: tenantcode is missing from req.userinfo");
        return res.status(400).json({
          success: false,
          errors: "Tenant code is required. Please ensure you are authenticated properly.",
        });
      }

      await Auth.init(tenantcode, companyid);
      const {
        firstname,
        lastname,
        email,
        password,
        userrole,
        managerid,
        isactive,
        whatsapp_number,
        whatsapp_settings,
        country_code,
      } = req.body;
      const errors = validationResult(req);
      let success = false;
      if (!errors.isEmpty()) {
        const errorMessages = errors
          .array()
          .map((err) => err.msg)
          .join(", ");
        return res.status(400).json({
          success,
          errors: errorMessages,
        });
      }

      const salt = bcrypt.genSaltSync(10);
      const secPass = bcrypt.hashSync(req.body.password, salt);

      const duplicateUser = await Auth.checkForDuplicate(
        email,
        whatsapp_number
      );

      if (duplicateUser) {
        if (duplicateUser.email === email) {
          return res.status(200).json({ errors: "Email already exists" });
        } else if (duplicateUser.whatsapp_number === whatsapp_number) {
          return res
            .status(200)
            .json({ errors: "WhatsApp number already exists" });
        }
      }

      // const currentUserCount = await Auth.getUserCount(req.userinfo.companyid);
      // const allowedUserCount = req.userinfo.plan.number_of_users;


      const currentUserCount = await Auth.getUserCount(req.userinfo.companyid);
      const baseUserLimit = req.userinfo.plan.number_of_users || 0;

      const addonUserCount = (req.userinfo.addons || []).reduce((total, addon) => {
        const addonName = (addon.name || "").toLowerCase();
        if (addonName === "user" || addonName === "users") {
          return total + (addon.quantity || 0);
        }
        return total;
      }, 0);

      const allowedUserCount = baseUserLimit + addonUserCount;

      if (currentUserCount >= allowedUserCount) {
        return res.status(400).json({
          errors: `Your plan allows only ${allowedUserCount} users. Please upgrade your plan to add more.`,
        });
      }

      const userRec = await Auth.findByEmail(email);
      if (userRec) {
        return res
          .status(200)
          .json({ errors: "User already exist with given email." });
      }


      const userCompanyId = req.userinfo.companyid || companyid;
      console.log("userCompanyId---", userCompanyId);

      try {
        const newUser = await Auth.createUser({
          firstname: firstname,
          lastname: lastname,
          email: email,
          password: secPass,
          userrole: userrole,
          managerid: managerid,
          companyid: userCompanyId,
          isactive: isactive,
          whatsapp_number: whatsapp_number,
          whatsapp_settings: whatsapp_settings
            ? JSON.stringify(whatsapp_settings)
            : null,
          country_code: country_code ? String(country_code).trim() : "+91",
        });

        console.log("newUser---", newUser);
        if (newUser) {
          // Include tenantcode and companyid in the token so downstream requests can initialize models correctly
          const tokenPayload = {
            id: newUser.id,
            tenantcode: req.userinfo?.tenantcode || null,
            companyid: userCompanyId || null,
            userrole: userrole || "USER",
          };

          const authToken = jwt.sign(tokenPayload, process.env.JWT_SECRET);

          console.log("userrole---", userrole);

          // Send email
          if (userrole === "USER") {
            const emailData = {
              name: `${firstname} ${lastname}`,
              email: email,
              password: password,
              frontend_url: process.env.BASE_URL,
            };
            // console.log("🚀 ~ emailData:", emailData);

            try {
              await Mailer.sendEmail(email, emailData, null, "user_created");
            } catch (error) {
              console.log("Failed to send welcome email:", error);
            }
          }

          return res
            .status(200)
            .json({ success: true, id: newUser.id, authToken: authToken });
        } else {
          return res.status(400).json({ success: false, errors: "Failed to create user" });
        }
      } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({
          success: false,
          errors: error.message || "Failed to create user. Please check the schema name and try again.",
        });
      }

      // contacts.create(req, res);
    }
  );

  // Create a new Tutorial
  router.post(
    "/login",
    [
      body("email", "Please enter valid email").isEmail(),
      body("password", "Please enter valid password").isLength({ min: 1 }),
      body("tcode", "Please enter company code").exists(),
    ],
    async (req, res) => {
      // #swagger.tags = ['Users']
      // #swagger.path = ['/api/auth/login']
      let success = false;
      try {
        // Normalize email to lowercase for consistent matching
        const email = req.body.email ? req.body.email.trim().toLowerCase() : "";
        // Password should not be trimmed - keep as-is for special characters
        const password = req.body.password || "";
        const tcode = req.body.tcode ? req.body.tcode.trim().toLowerCase() : "";

        // Debug logging (remove in production)
        console.log("Login attempt - Email:", email, "Tcode:", tcode, "Password length:", password.length);

        const errors = validationResult(req);
        // if (!errors.isEmpty()) {
        //   return res.status(400).json({ success, errors: errors.array() });
        // }

        if (!errors.isEmpty()) {
          const errorMessages = errors
            .array()
            .map((err) => err.msg)
            .join(", ");
          return res.status(400).json({
            success,
            errors: errorMessages,
          });
        }

        const checkForTcode = await Auth.checkCompanybyTcode(tcode);
        if (!checkForTcode) {
          console.log("Company not found for tcode:", tcode);
          return res.status(400).json({
            success,
            errors:
              "The company name you entered is incorrect. Please check and try again.",
          });
        }

        // Get the actual tenantcode and company id from company
        const companyData = checkForTcode[0];
        const actualTenantcode = companyData?.tenantcode || tcode;
        const companyId = companyData?.id || null;

        console.log("Initializing Auth with tenantcode:", actualTenantcode, "companyId:", companyId);

        // Initialize Auth with both schema name and company id
        await Auth.init(actualTenantcode, companyId);

        const userRec = await Auth.findByEmail(email);
        if (!userRec) {
          console.log("User not found for email:", email, "in schema:", actualTenantcode);
          console.log("Schema being used:", Auth.schema || "not set");

          // Try to check if user exists but is inactive
          try {
            const inactiveCheck = await sql.query(`
              SELECT id, email, isactive FROM ${Auth.schema || actualTenantcode}.user 
              WHERE LOWER(TRIM(email)) = $1
            `, [email.toLowerCase()]);

            if (inactiveCheck.rows.length > 0) {
              const user = inactiveCheck.rows[0];
              if (!user.isactive) {
                return res.status(400).json({
                  success,
                  errors: "Your account is inactive. Please contact administrator."
                });
              }
            }
          } catch (err) {
            console.log("Error checking inactive user:", err.message);
          }

          return res
            .status(400)
            .json({ success, errors: "User not found or inactive account" });
        }
        const userInfo = userRec.userinfo;

        // Check if password exists in userInfo
        if (!userInfo || !userInfo.password) {
          console.log("Password not found in userInfo for email:", email);
          return res
            .status(400)
            .json({ success, errors: "User account error. Please contact administrator." });
        }

        // Compare password - ensure both are strings
        const passwordCompare = await bcrypt.compare(
          String(password),
          String(userInfo.password)
        );
        if (!passwordCompare) {
          console.log("Password mismatch for email:", email);
          return res
            .status(400)
            .json({ success, errors: "Try to login with correct credentials" });
        }

        //removing sensitive data from token
        delete userInfo.password;
        // delete userInfo.email;

        // Store important fields before deletion
        let username = userInfo.firstname + " " + userInfo.lastname;
        let userrole = userInfo.userrole || "USER"; // Ensure userrole exists
        let tenantcode = userInfo.tenantcode;
        let companyid = userInfo.companyid;
        let modules = userInfo.modules || []; // Ensure modules are included
        let plan = userInfo.plan || null; // Plan information

        // Delete fields that we don't want in token
        delete userInfo.firstname;
        delete userInfo.lastname;
        delete userInfo.whatsapp_settings; // Remove WhatsApp settings from token
        delete userInfo.subscription; // Remove subscription from token
        delete userInfo.addons; // Remove addons from token

        // Set fields that should be in token
        userInfo.username = username;
        userInfo.userrole = userrole; // Ensure userrole is set
        userInfo.companyid = companyid; // Include companyid
        userInfo.tenantcode = tenantcode; // Include tenantcode

        // Ensure plan is included in token (for WhatsApp setting checks)
        if (!userInfo.plan && plan) {
          userInfo.plan = plan;
        }

        // Ensure modules are included in token (for sidebar filtering)
        if (!userInfo.modules || userInfo.modules.length === 0) {
          userInfo.modules = modules;
        }

        console.log("Token payload - userrole:", userInfo.userrole, "companyid:", userInfo.companyid, "plan:", userInfo.plan?.name, "modules count:", userInfo.modules?.length || 0, "module URLs:", userInfo.modules?.map(m => m.url));

        const authToken = jwt.sign(userInfo, process.env.JWT_SECRET, {
          expiresIn: "5h",
        });
        const refreshToken = jwt.sign(
          { email: userInfo.email, tenantcode: tenantcode },
          process.env.JWT_REFRESH_SECERT_KEY,
          { expiresIn: "7d" }
        );
        success = true;
        //const permissions = userInfo.permissions;
        return res
          .cookie("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: "strict",
          })
          .status(200)
          .json({ success, authToken, refreshToken });

        // return res.status(200).json({ success, authToken, refreshToken });
      } catch (error) {
        console.log(error);
        res.status(400).json({ success, errors: error });
      }
    }
  );

  router.post("/refresh", async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, error: "No refresh token provided." });
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECERT_KEY
      );
      const email = decoded.email;
      const tenantcode = decoded.tenantcode;
     
      await Auth.init(tenantcode);

      const userRec = await Auth.findByEmail(email);
      if (!userRec) {
        return res.status(401).json({
          success: false,
          error: "Invalid credentials, please log in again.",
        });
      }
      const userInfo = { ...userRec.userinfo };
      let username = userInfo.firstname + " " + userInfo.lastname;
      userInfo.username = username;
      delete userInfo.password;
      const newAuthToken = jwt.sign(userInfo, process.env.JWT_SECRET, {
        expiresIn: "5h",
      });
      return res.status(200).json({
        success: true,
        authToken: newAuthToken,
        refreshToken: refreshToken,
      });
    } catch (error) {
      console.error("Error verifying refresh token:", error);
      return res
        .status(403)
        .json({ success: false, error: "Invalid or expired refresh token." });
    }
  });

//   router.put("/updatepassword", fetchUser, async (req, res) => {
//     try {
      
//       const { password } = req.body;
//       const errors = [];
//       const userRec = {};
//       const salt = bcrypt.genSaltSync(10);
//       const secPass = bcrypt.hashSync(req.body.password, salt);
//       if (req.body.hasOwnProperty("password")) {
//         userRec.password = secPass;
//       }
//       //if(req.body.hasOwnProperty("id")){userRec.id = id};

//       if (errors.length !== 0) {
//         return res.status(400).json({ errors: errors });
//       }
//       await Auth.init(req.userinfo.tenantcode);
//       let resultUser = await Auth.findById(req.userinfo.id);

//       if (resultUser) {
//         resultLead = await Auth.updateById(req.userinfo.id, userRec);
//         if (resultLead) {
//           return res
//             .status(200)
//             .json({ success: true, message: "Record updated successfully" });
//         }
//         // return res.status(200).json(resultLead);
//       } else {
//         return res
//           .status(200)
//           .json({ success: false, message: "No record found" });
//       }
//     } catch (error) {
//       console.log("error:", error);
//       res.status(400).json({ errors: error });
//     }
//   });

//   // Get user by Id
//   router.get("/users/:id/:tenant", fetchUser, async (req, res) => {
    
//     try {
//       if ((req.userinfo.userrole = "ADMIN")) {
//         await Auth.init(req.params.tenant);
//       } else {
//         await Auth.init(req.userinfo.tenantcode);
//       }
//       const userRec = await Auth.findById(req.params.id);

//       if (!userRec) {
//         return res.status(400).json({ errors: "User not found" });
//       }

//       return res.status(200).json(userRec);
//     } catch (error) {
//       res.status(400).json({ errors: error });
//     }
//     // contacts.create(req, res);
//   });

//   router.put("/:id/profile", fetchUser, async (req, res) => {
//     try {
//       const MIMEType = new Map([
//         ["text/csv", "csv"],
//         ["application/msword", "doc"],
//         [
//           "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//           "docx",
//         ],
//         ["image/gif", "gif"],
//         ["text/html", "html"],
//         ["image/jpeg", "jpg"],
//         ["image/jpg", "jpg"],
//         ["application/json", "json"],
//         ["audio/mpeg", "mp3"],
//         ["video/mp4", "mp4"],
//         ["image/png", "png"],
//         ["application/pdf", "pdf"],
//         ["application/vnd.ms-powerpoint", "ppt"],
//         [
//           "application/vnd.openxmlformats-officedocument.presentationml.presentation",
//           "pptx",
//         ],
//         ["image/svg+xml", "svg"],
//         ["text/plain", "txt"],
//         ["application/vnd.ms-excel", "xls"],
//         [
//           "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//           "xlsx",
//         ],
//         ["application/xml", "xml"],
//         ["application/zip", "zip"],
//       ]);

//       File.init(req.userinfo.tenantcode);
//       Auth.init(req.userinfo.tenantcode);
//       const resultFile = await File.findByParentId(req.params.id);

//       if (resultFile && resultFile.length > 0) {
//         for (const file of resultFile) {
//           const { id: fileId, parentid: parentId } = file;
//           const filePath = `${process.env.FILE_UPLOAD_PATH}/${req.userinfo.tenantcode}/users/${parentId}`;

//           if (fs.existsSync(filePath)) {
//             const deletionResult = await File.deleteFile(fileId);

//             if (deletionResult) {
//               fs.unlinkSync(filePath); // Remove the actual file
//             } else {
//               return res.status(400).json({
//                 success: false,
//                 message: "Failed to delete the record.",
//               });
//             }
//           } else {
//             console.log("File path does not exist:", filePath);
//           }
//         }
//       }

//       // Process new file upload
//       const pdfreference = req?.files?.file;
//       if (pdfreference) {
//         const newVersionRecord = JSON.parse(JSON.parse(req.body.staffRecord));
//         await Auth.init(req.userinfo.tenantcode);
//         const resultObj = await Auth.findById(req.userinfo.id);

//         if (resultObj) {
//           delete newVersionRecord.contactname;
//           delete newVersionRecord.managername;

//           const updateResult = await Auth.updateRecById(
//             resultObj.id,
//             newVersionRecord,
//             req.userinfo.id
//           );
//           if (!updateResult)
//             return res.status(400).json({ errors: "Bad Request" });

//           const newFileRecord = {
//             title: pdfreference.name,
//             filetype:
//               MIMEType.get(pdfreference.mimetype) || pdfreference.mimetype,
//             parentid: resultObj.id,
//             filesize: pdfreference.size,
//             description: "Outgoing",
//           };

//           const fileRec = await File.insertFileRecords(
//             newFileRecord,
//             req.userinfo.id
//           );
//           const uploadPath = `${process.env.FILE_UPLOAD_PATH}/${req.userinfo.tenantcode}/users`;
//           const filePath = `${uploadPath}/${fileRec.parentid}`;

//           // Ensure the upload directory exists
//           if (!fs.existsSync(uploadPath)) {
//             await fs.promises.mkdir(uploadPath, { recursive: true });
//           }

//           // Move the file
//           pdfreference.mv(filePath, (err) => {
//             if (err) {
//               console.error("Error moving file:", err);
//               return res.status(500).json({ error: "Error moving file." });
//             }
//             return res.status(200).json(updateResult);
//           });
//         }
//       } else {
//         return res.status(400).json({ error: "No file uploaded." });
//       }
//     } catch (error) {
//       console.error("An error occurred while processing the request:", error);
//       return res.status(500).json({ error: "Internal Server Error" });
//     }
//   });

//   //......................................Update User.................................
//   router.put("/:id", fetchUser, async (req, res) => {
//     try {
//       //Check permissions

//       // #swagger.tags = ['Users']
//       // #swagger.path = ['/api/auth/:id']
//       const {
//         firstname,
//         lastname,
//         email,
//         userrole,
//         password,
//         isactive,
//         managerid,
//         whatsapp_number,
//         whatsapp_settings,
//         country_code,
//       } = req.body;
//       const errors = [];
//       const userRec = {};

//       if (req.body.hasOwnProperty("firstname")) {
//         userRec.firstname = firstname;
//         if (!firstname) {
//           errors.push("Firstname is required");
//         }
//       }
//       if (req.body.hasOwnProperty("lastname")) {
//         userRec.lastname = lastname;
//         if (!lastname) {
//           errors.push("Lastname is required");
//         }
//       }
//       if (req.body.hasOwnProperty("email")) {
//         userRec.email = email;
//         if (!email) {
//           errors.push("Email is required");
//         }
//       }
//       if (req.body.hasOwnProperty("password")) {
//         userRec.password = password;
//         if (!password) {
//           errors.push("Password is required");
//         }
//       }

//       if (req.body.hasOwnProperty("whatsapp_number")) {
//         userRec.whatsapp_number = whatsapp_number;
//       }

//       if (req.body.hasOwnProperty("userrole")) {
//         userRec.userrole = userrole;
//       }
//       if (req.body.hasOwnProperty("isactive")) {
//         userRec.isactive = isactive;
//       }
//       if (req.body.hasOwnProperty("managerid")) {
//         userRec.managerid = managerid;
//       }
//       if (req.body.hasOwnProperty("whatsapp_settings")) {
//         userRec.whatsapp_settings = JSON.stringify(whatsapp_settings);
//       }
//       if (req.body.hasOwnProperty("country_code")) {
//         userRec.country_code = country_code;
//       }


//       if (errors.length !== 0) {
//         return res.status(400).json({ errors: errors });
//       }
//       await Auth.init(req.userinfo.tenantcode);
//       const duplicateUser = await Auth.checkForDuplicate(
//         email,
//         whatsapp_number,
//         req.params.id
//       );

//       if (duplicateUser) {
//         if (duplicateUser.email === email) {
//           return res.status(400).json({ errors: "Email already exists" });
//         } else if (duplicateUser.whatsapp_number === whatsapp_number) {
//           return res
//             .status(400)
//             .json({ errors: "WhatsApp number already exists" });
//         }
//       }

//       let resultUser = await Auth.findById(req.params.id);

//       if (
//         resultUser.userrole === "ADMIN" &&
//         req.params.id !== req.userinfo.id
//       ) {
//         return res.status(400).json({ errors: "You cannot edit system admin" });
//       }

//       if (resultUser) {
      
//         if (
//           req.body.hasOwnProperty("isactive") &&
//           isactive === false &&
//           req.params.id === req.userinfo.id
//         ) {
//           return res
//             .status(400)
//             .json({ errors: "You cannot deactivate yourself" });
//         }
//         if (req.body.hasOwnProperty("password")) {
//           const salt = bcrypt.genSaltSync(10);
//           const secPass = bcrypt.hashSync(req.body.password, salt);
//           userRec.password = secPass;
//         }

//         resultUser = await Auth.updateRecById(
//           req.params.id,
//           userRec,
//           req.userinfo.id
//         );
//         if (resultUser) {
//           if (resultUser.isError)
//             return res
//               .status(400)
//               .json({ success: false, errors: resultUser.errors });
//           else
//             return res
//               .status(200)
//               .json({ success: true, message: "Record updated successfully" });
//         }
//         return res.status(200).json(resultUser);
//       } else {
//         return res
//           .status(200)
//           .json({ success: false, message: "No record found" });
//       }
//     } catch (error) {
//       console.log("error:", error);
//       res.status(400).json({ errors: error });
//     }
//   });

//   // Create a new Tutorial
//   router.get(
//     "/getuser",
//     fetchUser,

//     async (req, res) => {
//       try {
//         const userid = req.userinfo.id;
//         await Auth.init(req.userinfo.tenantcode);
//         const userRec = await Auth.findById(userid);

//         if (!userRec) {
//           return res.status(400).json({ errors: "User not found" });
//         }

//         return res.status(200).json(userRec);
//       } catch (error) {
//         res.status(400).json({ errors: error });
//       }
//       // contacts.create(req, res);
//     }
//   );

//   // Fetch all Users
//   router.get(
//     "/users",
//     fetchUser,

//     async (req, res) => {
//       // #swagger.tags = ['Users']
//       // #swagger.path = ['/api/auth/users']
//       try {
//         await Auth.init(req.userinfo.tenantcode);

//         const userRec = await Auth.findAll(req.userinfo);
//         if (!userRec) {
//           return res.status(200).json({ errors: "User not found" });
//         }
//         return res.status(200).json(userRec);
//       } catch (error) {
//         res.status(400).json({ errors: error });
//       }
//       // contacts.create(req, res);
//     }
//   );

//   // ................................................Download file .......................................
//   router.get("/myimage", fetchUser, async (req, res) => {
//     try {
//       //const filePath = "D:/Files/" + parentId +"/"+ fileId + '.' + fileType;
//       let filePath =
//         process.env.FILE_UPLOAD_PATH +
//         "/" +
//         req.userinfo.tenantcode +
//         "/users/" +
//         req.userinfo.id;
//       res.download(filePath, "myprofileimage", function (err) {
//         if (err) {
//           return res.status(400).json({ Error: false, message: err });
//         }
//       });
//     } catch (error) {
//       console.log("System Error:", error);
//       return res.status(400).json({ Error: false, message: error });
//     }
//   });

//   // ................................................Download file .......................................
//   router.get("/userimage/:id", async (req, res) => {
//     try {
//       //const filePath = "D:/Files/" + parentId +"/"+ fileId + '.' + fileType;
//       let filePath = process.env.FILE_UPLOAD_PATH + "/" + req.params.id;
//       res.download(filePath, req.params.id, function (err) {
//         console.log("err:", err);
//         if (err) {
//           return res.status(400).json({ Error: false, message: err });
//         }
//       });
//     } catch (error) {
//       console.log("System Error:", error);
//       return res.status(400).json({ Error: false, message: error });
//     }
//   });

//   // Get user by Id
//   router.get(
//     "/managers",
//     fetchUser,

//     async (req, res) => {
//       // #swagger.tags = ['Users']
//       // #swagger.path = ['/api/auth/managers']
//       try {
//         await Auth.init(req.userinfo.tenantcode);
//         const userRecList = await Auth.getAllManager();
//         if (!userRecList) {
//           return res.status(400).json({ errors: "User not found" });
//         }

//         return res.status(200).json(userRecList);
//       } catch (error) {
//         res.status(400).json({ errors: error });
//       }
//     }
//   );

  app.use(process.env.BASE_API_URL + "/api/auth", router);
};
