const jwt = require("jsonwebtoken");
const Auth = require("../models/auth.model.js");

const fetchUser = async (req, res, next) => {
  var token = req.headers.authorization;
  if (!token) {
    // Clear global variable when no token is provided
    global.currentLoggedInUserId = null;
    return res.status(401).send({ errors: "Please authenticate" });
  }
  try {
    token = token.includes("Bearer ") ? token.replace("Bearer ", "") : token;
    // console.log("tokentoken", token)
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user) {
      // console.log("useruser", user)
      Auth.init(user.tenantcode);
      const userRec = await Auth.findById(user.id);

      if (!userRec) {
        // Clear global variable for invalid user
        global.currentLoggedInUserId = null;
        return res.status(400).json({ errors: "Invalid User" });
      }
      // Set global variable for authenticated user
      global.currentLoggedInUserId = user.id;
      req["userinfo"] = user;
      next();
    } else {
      // Clear global variable for invalid user
      global.currentLoggedInUserId = null;
      return res.status(400).json({ errors: "Invalid User" });
    }
  } catch (error) {
    // Clear global variable when token verification fails (expired/invalid)
    global.currentLoggedInUserId = null;
    return res.status(401).send({ errors: "Please authenticate" });
  }
};

const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      const user = req.userinfo;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const userRoleName = user.role_name;
      const permissions = user.permissions || [];
      const permissionNames = permissions.map(p => p.permissionName);

      // SYSTEM_ADMIN full access
      if (userRoleName === "SYSTEM_ADMIN") {
        return next();
      }

      // Global permissions
      if (
        permissionNames.includes("MODIFY_ALL") ||
        permissionNames.includes("VIEW_ALL")
      ) {
        return next();
      }

      // Specific permission check
      if (!permissionNames.includes(requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: ${requiredPermission}`,
        });
      }

      next();
    } catch (error) {
      console.error("Permission error:", error);
      return res.status(500).json({
        success: false,
        message: "Permission check failed",
      });
    }
  };
};


module.exports = { fetchUser, checkPermission };
