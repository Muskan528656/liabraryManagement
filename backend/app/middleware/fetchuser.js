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


const checkPermission = (requiredPermission) => {
  console.log("requiredPermissionrequiredPermission", requiredPermission)
  return (req, res, next) => {
    try {
      const authHeader = req.headers["authorization"];

      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: "Authorization token missing",
        });
      }

      const token = authHeader.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.userinfo = decoded;

      const userRole = decoded.userrole;
      const permissions = decoded.permissions || [];

      if (userRole === "SYSTEM_ADMIN") {
        return next();
      }


      if (
        permissions.includes("MODIFY_ALL") ||
        permissions.includes("VIEW_ALL")
      ) {
        return next();
      }
      if (!permissions.includes(requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: ${requiredPermission}`,
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  };
};

module.exports = { fetchUser, checkPermission };
