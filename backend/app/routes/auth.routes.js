/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */

const e = require("express");
const Auth = require("../models/auth.model.js");
const { fetchUser } = require("../middleware/fetchuser.js");

const sql = require("../models/db.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");



module.exports = (app) => {

  const { body, validationResult } = require("express-validator");

  var router = require("express").Router();


  router.post(
    "/createuser",
    fetchUser,
    [
      body("email", "Please enter email").isEmail(),
      body("password", "Please enter password").isLength({ min: 6 }),
      body("firstname", "Please enter firstname").isLength({ min: 2 }),
      body("lastname", "Please enter lastname").isLength({ min: 2 }),
      body("library_number", "Please enter library_number").isLength({
        min: 8,
      }),
      body("library_settings", "library settings must be an array")
        .optional()
        .isArray(),
    ],

    async (req, res) => {

      const tenantcode = req.userinfo?.tenantcode;
      const companyid = req.userinfo?.companyid;




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
        library_number,
        library_settings,
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
        library_number
      );

      if (duplicateUser) {
        if (duplicateUser.email === email) {
          return res.status(200).json({ errors: "Email already exists" });
        } else if (duplicateUser.library_number === library_number) {
          return res
            .status(200)
            .json({ errors: "library number already exists" });
        }
      }





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
          library_number: library_number,
          library_settings: library_settings
            ? JSON.stringify(library_settings)
            : null,
          country_code: country_code ? String(country_code).trim() : "+91",
        });


        if (newUser) {

          const tokenPayload = {
            id: newUser.id,
            tenantcode: req.userinfo?.tenantcode || null,
            companyid: userCompanyId || null,
            userrole: userrole || "USER",
          };

          const authToken = jwt.sign(tokenPayload, process.env.JWT_SECRET);




          if (userrole === "USER") {
            const emailData = {
              name: `${firstname} ${lastname}`,
              email: email,
              password: password,
              frontend_url: process.env.BASE_URL,
            };


            try {
              await Mailer.sendEmail(email, emailData, null, "user_created");
            } catch (error) {

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


    }
  );

  router.post(
    "/login",
    [
      body("email", "Please enter valid email").isEmail(),
      body("password", "Please enter valid password").isLength({ min: 1 }),
      body("tcode", "Please enter company code").exists(),
    ],
    async (req, res) => {
      let success = false;

      try {
        const email = req.body.email ? req.body.email.trim().toLowerCase() : "";
        const password = req.body.password || "";
        const tcode = req.body.tcode ? req.body.tcode.trim().toLowerCase() : "";

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          const errorMessages = errors.array().map((err) => err.msg).join(", ");
          return res.status(400).json({ success, errors: errorMessages });
        }


        const checkForTcode = await Auth.checkCompanybyTcode(tcode);
        if (!checkForTcode) {
          return res.status(400).json({
            success,
            errors:
              "The company name you entered is incorrect. Please check and try again.",
          });
        }

        const companyData = checkForTcode[0];
        const actualTenantcode = companyData?.tenantcode || tcode;
        const companyId = companyData?.id || null;

        await Auth.init(actualTenantcode, companyId);

        const userRec = await Auth.findByEmail(email);
        if (!userRec) {
          try {
            const inactiveCheck = await sql.query(
              `SELECT id, email, isactive FROM ${Auth.schema || actualTenantcode}.user 
             WHERE LOWER(TRIM(email)) = $1`,
              [email.toLowerCase()]
            );

            if (inactiveCheck.rows.length > 0) {
              const user = inactiveCheck.rows[0];
              if (!user.isactive) {
                return res.status(400).json({
                  success,
                  errors: "Your account is inactive. Please contact administrator.",
                });
              }
            }
          } catch (err) {
            console.error("Error checking inactive user:", err);
          }

          return res
            .status(400)
            .json({ success, errors: "User not found or inactive account" });
        }

        const userInfo = userRec.userinfo;

        if (!userInfo || !userInfo.password) {
          return res.status(400).json({
            success,
            errors: "User account error. Please contact administrator.",
          });
        }


        const passwordCompare = await bcrypt.compare(
          String(password),
          String(userInfo.password)
        );
        if (!passwordCompare) {
          return res.status(400).json({
            success,
            errors: "Try to login with correct credentials",
          });
        }


        delete userInfo.password;


        const username = userInfo.firstname + " " + userInfo.lastname;
        const userrole = userInfo.userrole || "USER";
        const tenantcode = userInfo.tenantcode;
        const companyid = userInfo.companyid;
        const modules = userInfo.modules || [];
        const plan = userInfo.plan || null;

        const permissions = await Auth.findPermissionsByRole(userrole);
        console.log("User permissions:", permissions);

        delete userInfo.firstname;
        delete userInfo.lastname;
        delete userInfo.library_settings;
        delete userInfo.subscription;
        delete userInfo.addons;

        userInfo.username = username;
        userInfo.userrole = userrole;
        userInfo.companyid = companyid;
        userInfo.tenantcode = tenantcode;
        userInfo.modules = modules;
        userInfo.plan = plan;
        userInfo.permissions = permissions;

        const authToken = jwt.sign(userInfo, process.env.JWT_SECRET, {
          expiresIn: "5h",
        });

        const refreshToken = jwt.sign(
          { email: userInfo.email, tenantcode: tenantcode },
          process.env.JWT_REFRESH_SECERT_KEY,
          { expiresIn: "7d" }
        );

        success = true;

        // Set the global logged-in user ID for cron job notifications
        global.currentLoggedInUserId = userInfo.id;

        return res
          .cookie("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: "strict",
          })
          .status(200)
          .json({ success, authToken, refreshToken });
      } catch (error) {
        console.error("Login error:", error);
        res.status(400).json({ success, errors: error.message || error });
      }
    }
  );



  // router.post(
  //   "/login",
  //   [
  //     body("email", "Please enter valid email").isEmail(),
  //     body("password", "Please enter valid password").isLength({ min: 1 }),
  //     body("tcode", "Please enter company code").exists(),
  //   ],
  //   async (req, res) => {


  //     let success = false;
  //     try {

  //       const email = req.body.email ? req.body.email.trim().toLowerCase() : "";

  //       const password = req.body.password || "";
  //       const tcode = req.body.tcode ? req.body.tcode.trim().toLowerCase() : "";




  //       const errors = validationResult(req);




  //       if (!errors.isEmpty()) {
  //         const errorMessages = errors
  //           .array()
  //           .map((err) => err.msg)
  //           .join(", ");
  //         return res.status(400).json({
  //           success,
  //           errors: errorMessages,
  //         });
  //       }

  //       const checkForTcode = await Auth.checkCompanybyTcode(tcode);
  //       if (!checkForTcode) {

  //         return res.status(400).json({
  //           success,
  //           errors:
  //             "The company name you entered is incorrect. Please check and try again.",
  //         });
  //       }


  //       const companyData = checkForTcode[0];
  //       const actualTenantcode = companyData?.tenantcode || tcode;
  //       const companyId = companyData?.id || null;




  //       await Auth.init(actualTenantcode, companyId);

  //       const userRec = await Auth.findByEmail(email);
  //       if (!userRec) {




  //         try {
  //           const inactiveCheck = await sql.query(`
  //             SELECT id, email, isactive FROM ${Auth.schema || actualTenantcode}.user 
  //             WHERE LOWER(TRIM(email)) = $1
  //           `, [email.toLowerCase()]);

  //           if (inactiveCheck.rows.length > 0) {
  //             const user = inactiveCheck.rows[0];
  //             if (!user.isactive) {
  //               return res.status(400).json({
  //                 success,
  //                 errors: "Your account is inactive. Please contact administrator."
  //               });
  //             }
  //           }
  //         } catch (err) {

  //         }

  //         return res
  //           .status(400)
  //           .json({ success, errors: "User not found or inactive account" });
  //       }
  //       const userInfo = userRec.userinfo;


  //       if (!userInfo || !userInfo.password) {

  //         return res
  //           .status(400)
  //           .json({ success, errors: "User account error. Please contact administrator." });
  //       }


  //       const passwordCompare = await bcrypt.compare(
  //         String(password),
  //         String(userInfo.password)
  //       );
  //       if (!passwordCompare) {

  //         return res
  //           .status(400)
  //           .json({ success, errors: "Try to login with correct credentials" });
  //       }


  //       delete userInfo.password;



  //       let username = userInfo.firstname + " " + userInfo.lastname;
  //       let userrole = userInfo.userrole || "USER"; // Ensure userrole exists
  //       let tenantcode = userInfo.tenantcode;
  //       let companyid = userInfo.companyid;
  //       let modules = userInfo.modules || []; // Ensure modules are included
  //       let plan = userInfo.plan || null; // Plan information


  //       delete userInfo.firstname;
  //       delete userInfo.lastname;
  //       delete userInfo.library_settings; // Remove library settings from token
  //       delete userInfo.subscription; // Remove subscription from token
  //       delete userInfo.addons; // Remove addons from token


  //       userInfo.username = username;
  //       userInfo.userrole = userrole; // Ensure userrole is set
  //       userInfo.companyid = companyid; // Include companyid
  //       userInfo.tenantcode = tenantcode; // Include tenantcode


  //       if (!userInfo.plan && plan) {
  //         userInfo.plan = plan;
  //       }


  //       if (!userInfo.modules || userInfo.modules.length === 0) {
  //         userInfo.modules = modules;
  //       }



  //       const authToken = jwt.sign(userInfo, process.env.JWT_SECRET, {
  //         expiresIn: "5h",
  //       });
  //       const refreshToken = jwt.sign(
  //         { email: userInfo.email, tenantcode: tenantcode },
  //         process.env.JWT_REFRESH_SECERT_KEY,
  //         { expiresIn: "7d" }
  //       );
  //       success = true;
  //       return res
  //         .cookie("refreshToken", refreshToken, {
  //           httpOnly: true,
  //           sameSite: "strict",
  //         })
  //         .status(200)
  //         .json({ success, authToken, refreshToken });

  //     } catch (error) {

  //       res.status(400).json({ success, errors: error });
  //     }
  //   }
  // );

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

      // Update the global logged-in user ID on token refresh
      global.currentLoggedInUserId = userInfo.id;

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

  router.post("/logout", (req, res) => {
    global.currentLoggedInUserId = null;

    res.clearCookie("refreshToken");
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  });


  app.use(process.env.BASE_API_URL + "/api/auth", router);

};
