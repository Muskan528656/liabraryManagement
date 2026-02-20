

const jwt = require("jsonwebtoken");
const Auth = require("../models/auth.model.js");
const sql = require("../models/db.js");

const fetchUser = async (req, res, next) => {
  var token = req.headers.authorization;
  var branchId = req.headers["branch-id"];
  console.log("Branch ID from header:", branchId);
  if (!token) {

    global.currentLoggedInUserId = null;
    return res.status(401).send({ errors: "Please authenticate" });
  }
  try {
    let token = req.headers.authorization;
    if (!token) return res.status(401).json({ errors: "Please authenticate" });

    token = token.includes("Bearer ") ? token.replace("Bearer ", "") : token;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) return res.status(401).json({ errors: "Invalid token" });

    req.userinfo = decoded;
    // Use branchId from headers, or fallback to branch_id from token
    req.branchId = branchId || decoded.branch_id;
    global.currentLoggedInUserId = decoded.id;
    console.log("req.userinfo  =>", req.userinfo);
    console.log("req.userinfo  dkk =>", req.branchId);

    Auth.init(req.userinfo.tenantcode, req.branchId);

    const permissions = await Auth.findPermissionsByRole(decoded.userrole, decoded.role_name);

    req.userinfo.permissions = permissions || [];


    next();
  } catch (err) {
    console.error("fetchUser error:", err);
    return res.status(401).json({ errors: "Please authenticate" });
  }
};

const checkPermission = (moduleName, action) => {
  return async (req, res, next) => {
    try {
      const user = req.userinfo;
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      console.log("user.roleNameuser.roleName", user.role_name)

      if (user.userrole &&
        (user.userrole === "SYSTEM ADMIN")) {
        return next();
      }

      const permissions = user.permissions || [];
      if (!permissions.length) {
        return res.status(403).json({
          message: "No permissions assigned to this role"
        });
      }

      const moduleResult = await sql.query(
        `SELECT id FROM demo.module WHERE LOWER(name) = $1 LIMIT 1`,
        [moduleName.toLowerCase()]
      );

      if (!moduleResult.rows.length) {
        return res.status(404).json({
          message: `Module "${moduleName}" not found`
        });
      }

      const moduleId = moduleResult.rows[0].id;

      // FIX 4: Check if user has permission for this specific module
      const modulePermission = permissions.find((p) => p.moduleId === moduleId);
      if (!modulePermission) {
        return res.status(403).json({
          message: `No permission for module "${moduleName}"`
        });
      }

      // FIX 5: Better action mapping with fallback
      const actionMap = {
        allow_view: modulePermission.allowView === true,
        allow_create: modulePermission.allowCreate === true,
        allow_edit: modulePermission.allowEdit === true,
        allow_delete: modulePermission.allowDelete === true,
      };

      if (!actionMap[action]) {
        return res.status(403).json({
          message: `Permission denied for ${action.replace('allow_', '')} in ${moduleName}`
        });
      }

      next();
    } catch (err) {
      console.error("Permission error:", err);
      return res.status(500).json({ message: "Permission check failed" });
    }
  };
};


module.exports = { fetchUser, checkPermission };



