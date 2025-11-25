const jwt = require("jsonwebtoken");
const Auth = require("../models/auth.model.js");

const fetchUser = async (req, res, next) => {
  var token = req.headers.authorization;
  if (!token) {
    return res.status(401).send({ errors: "Please authenticate" });
  }
  try {
    token = token.includes("Bearer ") ? token.replace("Bearer ", "") : token;
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user) {
      Auth.init(user.tenantcode);
      const userRec = await Auth.findById(user.id);
      // console.log("Fetched user record:", userRec);
      if (!userRec) {

        return res.status(400).json({ errors: "Invalid User" });
      }
      req["userinfo"] = user;
      next();
    } else {
      return res.status(400).json({ errors: "Invalid User" });
    }
  } catch (error) {
    return res.status(401).send({ errors: "Please authenticate" });
  }
};

// const checkModuleAccess = (moduleName) => {
//   return (req, res, next) => {
//     if (req.userinfo.userrole !== "ADMIN") {
//       const subscription = req.userinfo.subscription;
//       if (!subscription || !subscription.end_date) {
//         return res.status(402).json({
//           success: false,
//           message: "Your plan has expired. Please upgrade your plan.",
//         });
//       }
//       const endDate = new Date(subscription.end_date);
//       const now = new Date();
//       if (endDate < now) {
//         return res.status(402).json({
//           success: false,
//           message: "Your plan has expired. Please upgrade your plan.",
//         });
//       }
//       const formattedModuleName = moduleName.replace(/_/g, " ").toLowerCase();
//       const userModules = req.userinfo.modules.map((m) => m.url.toLowerCase());
//       if (!userModules.includes(moduleName.toLowerCase())) {
//         return res.status(200).json({
//           success: false,
//           message: `Access to '${formattedModuleName}' module is not included in your plan.`,
//         });
//       }
//     }

//     next();
//   };
// };

// Check if user has required role
// const checkRole = (...allowedRoles) => {
//   return (req, res, next) => {
//     if (!req.userinfo || !req.userinfo.userrole) {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied. Invalid user role.",
//       });
//     }

//     const userRole = req.userinfo.userrole;

//     // ADMIN has access to everything
//     if (userRole === "ADMIN") {
//       return next();
//     }

//     // Check if user role is in allowed roles
//     if (allowedRoles.includes(userRole)) {
//       return next();
//     }

//     return res.status(403).json({
//       success: false,
//       message: "Access denied. You don't have permission to access this resource.",
//     });
//   };
// };

// Check if STUDENT role can perform CRUD operations (STUDENT cannot perform any CRUD)
// const checkStudentCRUD = () => {
//   return (req, res, next) => {
//     if (!req.userinfo || !req.userinfo.userrole) {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied. Invalid user role.",
//       });
//     }

//     const userRole = String(req.userinfo.userrole).toUpperCase().trim();

//     // ADMIN has full access to CRUD
//     if (userRole === "ADMIN") {
//       return next();
//     }

//     // STUDENT cannot perform any CRUD operations (only read)
//     if (userRole === "STUDENT") {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied. Students can only view data, not perform create, update, or delete operations.",
//       });
//     }

//     // Other roles are allowed for CRUD (if any)
//     next();
//   };
// };

// Check if user has specific CRUD permission for a module
// const checkModulePermission = (moduleName, operation) => {
//   return async (req, res, next) => {
//     if (!req.userinfo) {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied. Invalid user.",
//       });
//     }

//     const userRole = String(req.userinfo.userrole).toUpperCase().trim();

//     // ADMIN has all permissions
//     if (userRole === "ADMIN") {
//       return next();
//     }

//     // For STUDENT: only allow read (can_read)
//     if (userRole === "STUDENT" && operation !== "can_read") {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied. Students can only view data, not perform create, update, or delete operations.",
//       });
//     }

//     // Check role_permissions table for specific permission
//     try {
//       const sql = require("../models/db.js");
//       const result = await sql.query(
//         `SELECT ${operation} FROM public.role_permissions WHERE role = $1 AND module_name = $2`,
//         [userRole, moduleName.toLowerCase()]
//       );

//       if (result.rows.length === 0 || !result.rows[0][operation]) {
//         return res.status(403).json({
//           success: false,
//           message: `Access denied. Your role does not have ${operation.replace("can_", "")} permission for the ${moduleName} module.`,
//         });
//       }

//       next();
//     } catch (error) {
//       console.error("Error checking module permission:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Error checking permissions",
//       });
//     }
//   };
// };

// Check if user has permission (for future permission-based access)
// const checkPermission = (...requiredPermissions) => {
//   return (req, res, next) => {
//     if (!req.userinfo) {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied. Invalid user.",
//       });
//     }

//     const userRole = req.userinfo.userrole;

//     // ADMIN has all permissions
//     if (userRole === "ADMIN") {
//       return next();
//     }

//     // TODO: Implement permission checking when permission system is fully integrated
//     // For now, allow ADMIN and USER based on role
//     if (userRole === "ADMIN" || userRole === "USER") {
//       return next();
//     }

//     return res.status(403).json({
//       success: false,
//       message: "Access denied. Insufficient permissions.",
//     });
//   };
// };

module.exports = { fetchUser };
