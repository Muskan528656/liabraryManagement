/**
 * @author      Muskan Khan
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */

const e = require("express");
const Auth = require("../models/auth.model.js");
const { fetchUser, checkPermission } = require("../middleware/fetchuser.js");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");



module.exports = (app) => {

  const { body, validationResult } = require("express-validator");

  var router = require("express").Router();


  router.post(
    "/createuser",
    fetchUser, checkPermission("Users", "allow_create"),
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
      body("email").isEmail(),
      body("password").isLength({ min: 1 }),
      body("tcode").exists(),
    ],
    async (req, res) => {
      console.log("response----->",res)
      try {
        const email = req.body.email.trim().toLowerCase();
        const password = req.body.password;
        const tcode = req.body.tcode.trim().toLowerCase();

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            errors: errors.array().map(e => e.msg).join(", "),
          });
        }


        const companyRes = await Auth.checkCompanybyTcode(tcode);
        if (!companyRes?.length) {
          return res.status(400).json({
            success: false,
            errors: "Invalid company code. Please verify the company code and try again.",
          });
        }

        const { tenantcode, id: companyId } = companyRes[0];
        await Auth.init(tenantcode, companyId);


        const userRec = await Auth.findByEmail(email);
        if (!userRec?.userinfo) {
          return res.status(400).json({
            success: false,
            errors: "User not found or inactive",
          });
        }

        const userInfo = userRec.userinfo;


        const match = await bcrypt.compare(password, userInfo.password);
        if (!match) {
          return res.status(400).json({
            success: false,
            errors: "Invalid credentials  Please check your credentials and try again",
          });
        }

        delete userInfo.password;


        userInfo.username = `${userInfo.firstname || ""} ${userInfo.lastname || ""}`.trim();
        userInfo.companyid = userInfo.companyid;
        userInfo.tenantcode = tenantcode;

        delete userInfo.firstname;
        delete userInfo.lastname;


        const authToken = jwt.sign(userInfo, process.env.JWT_SECRET, {
          expiresIn: "5h",
        });

        const refreshToken = jwt.sign(
          { email: userInfo.email, tenantcode },
          process.env.JWT_REFRESH_SECERT_KEY,
          { expiresIn: "7d" }
        );


        const permissions = await Auth.findPermissionsByRole(userInfo.userrole);

        global.currentLoggedInUserId = userInfo.id;

        return res
          .cookie("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: "strict",
          })
          .status(200)
          .json({
            success: true,
            authToken,
            refreshToken,
            permissions,
          });

      } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({
          success: false,
          errors: "Internal server error",
        });
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
          error: "Invalid credentials  Please check your credentials and try again",
        });
      }
      const userInfo = { ...userRec.userinfo };
      let username = userInfo.firstname + " " + userInfo.lastname;
      userInfo.username = username;
      delete userInfo.password;
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

  router.post("/forgot-password", [
    body("email").isEmail(),
    body("tcode").exists(),
  ], async (req, res) => {
    try {
      const email = req.body.email.trim().toLowerCase();
      const tcode = req.body.tcode.trim().toLowerCase();
      

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().map(e => e.msg).join(", "),
        });
      }

      const companyRes = await Auth.checkCompanybyTcode(tcode);
      if (!companyRes?.length) {
        return res.status(400).json({
          success: false,
          errors: "Invalid company code. Please verify the company code and try again.",
        });
      }

      const { tenantcode, id: companyId } = companyRes[0];
      await Auth.init(tenantcode, companyId);

      const userRec = await Auth.findByEmail(email);
      if (!userRec?.userinfo) {
        return res.status(200).json({
          success: true,
          message: "If the email exists, a password reset link has been sent.",
        });
      }

      const userInfo = userRec.userinfo;

      const resetToken = jwt.sign(
        { email: userInfo.email, id: userInfo.id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // Send reset email
      // const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      // const baseUrl = ${protocol}://${req.get('host')}${process.env.BASE_API_URL}

      const origin = req.headers.origin;
      console.log("origin=>",origin)

      console.log("host=>",req.get('origin')); 
      const resetLink = `${origin}/reset-password?token=${resetToken}`;

      // const resetLink = `${process.env.BASE_API_URL || "localhost:3001"}/reset-password?token=${resetToken}`
      // console.log("resetLink=>",resetLink);
      const emailData = {
        name: userInfo.username || `${userInfo.firstname} ${userInfo.lastname}`,
        resetLink: resetLink,
      };
      // console.log("emailData=>",emailData)

      try {
        const sendMail = require("../utils/Mailer");
        await sendMail({
          to: userInfo.email,
          subject: "Password Reset Request",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Password Reset Request</h2>
              <p>Hello ${emailData.name},</p>
              <p>You have requested to reset your password for the Library Management System.</p>
              <p>Please click the link below to reset your password:</p>
              <p style="margin: 20px 0;">
                <a href="${emailData.resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
              </p>
              <p>This link will expire in 1 hour for security reasons.</p>
              <p>If you didn't request this password reset, please ignore this email.</p>
              <p>Best regards,<br>Library Management System Team</p>
            </div>
          `
        });
        return res.status(200).json({
          success: true,
          message: "If the email exists, a password reset link has been sent.",
        });
      } catch (emailError) {
        console.error("Email sending error:", emailError);
        return res.status(500).json({
          success: false,
          errors: "Failed to send reset email. Please try again.",
        });
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      return res.status(500).json({
        success: false,
        errors: "Internal server error",
      });
    }
  });

  router.post("/reset-password", [
    body("token").exists(),
    body("newPassword").isLength({ min: 6 }),
  ], async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().map(e => e.msg).join(", "),
        });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (tokenError) {
        return res.status(400).json({
          success: false,
          errors: "Invalid or expired reset token.",
        });
      }

      const { email } = decoded;

      const userRec = await Auth.findByEmail(email);
      if (!userRec?.userinfo) {
        return res.status(400).json({
          success: false,
          errors: "User not found.",
        });
      }

      const userInfo = userRec.userinfo;

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(newPassword, salt);

      const updateResult = await Auth.updateById(userInfo.id, { password: hashedPassword });
      if (!updateResult) {
        return res.status(500).json({
          success: false,
          errors: "Failed to update password.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Password updated successfully.",
      });
    } catch (err) {
      console.error("Reset password error:", err);
      return res.status(500).json({
        success: false,
        errors: "Internal server error",
      });
    }
  });

  app.use(process.env.BASE_API_URL + "/api/auth", router);

};
