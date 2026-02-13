/**
 * @author      Library Management System
 * @date        Feb, 2026
 * @copyright   www.ibirdsservices.com
 */

const sql = require("../models/db.js");

// Middleware to determine user's branch access
const branchAccess = async (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.userinfo) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    const userId = req.userinfo.id;
    const userRole = req.userinfo.userrole;
    console.log("User ID:", userId);
    console.log("User Role:", userRole);

    // Check if user is SUPER ADMIN (can access all branches)
    if (userRole && userRole.toString().toUpperCase() === "SYSTEM ADMIN") {
      req.userBranchAccess = {
        isSuperAdmin: true,
        branchId: null, // Super admin can access all branches
        canAccessAllBranches: true
      };
      
      next();
      return;
    }

    // For regular users, determine their assigned branch
    // Get user's branch from the authenticated user info
    let userBranchId = req.userinfo.branch_id;
    
    // If user doesn't have a specific branch assigned, we might need to determine it differently
    // For now, we'll use the default main branch if available
    if (!userBranchId) {
      // Determine schema from request
      const schema = req.headers.schema || req.query.schema || 'al_hedaya';
      
      // Try to get the default/main branch
      const defaultBranchQuery = `
        SELECT id 
        FROM ${schema}.branches 
        WHERE branch_code = 'MAIN' OR branch_name ILIKE '%main%' OR branch_name ILIKE '%default%'
        LIMIT 1
      `;
      
      const defaultBranchResult = await sql.query(defaultBranchQuery);
      if (defaultBranchResult.rows.length > 0) {
        userBranchId = defaultBranchResult.rows[0].id;
      }
    }
    
    req.userBranchAccess = {
      isSuperAdmin: false,
      branchId: userBranchId,
      canAccessAllBranches: false
    };
    
    next();
  } catch (error) {
    console.error("Branch access middleware error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error determining branch access" 
    });
  }
};

// Middleware to check branch-specific permissions
const checkBranchPermission = (requiredAction) => {
  return async (req, res, next) => {
    try {
      if (!req.userinfo) {
        return res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
      }

      const userRole = req.userinfo.userrole;
      const isSuperAdmin = userRole && userRole.toString().toUpperCase() === "SYSTEM ADMIN";
      
      // If it's a super admin, they can access all branches
      if (isSuperAdmin) {
        next();
        return;
      }
      
      // For non-super admins, check if they have access to the requested branch
      if (!req.userBranchAccess || !req.userBranchAccess.branchId) {
        return res.status(403).json({ 
          success: false, 
          message: "No branch assigned to user" 
        });
      }
      
      // If request specifies a branch ID, check if user can access it
      const requestedBranchId = req.query.branch_id || req.body.branch_id || req.params.branch_id;
      
      if (requestedBranchId && requestedBranchId !== req.userBranchAccess.branchId) {
        return res.status(403).json({ 
          success: false, 
          message: "Access denied to this branch" 
        });
      }
      
      // Set the branch ID to be used in the request
      req.currentBranchId = req.userBranchAccess.branchId;
      
      next();
    } catch (error) {
      console.error("Branch permission middleware error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Error checking branch permissions" 
      });
    }
  };
};

// Helper function to get branch filter for queries
const getBranchFilter = (req) => {
  if (!req.userBranchAccess) {
    return "";
  }
  
  // If super admin, no filter needed (can see all branches)
  if (req.userBranchAccess.isSuperAdmin) {
    return "";
  }
  
  // If regular user, filter by their branch
  if (req.userBranchAccess.branchId) {
    return ` AND branch_id = '${req.userBranchAccess.branchId}'`;
  }
  
  // If no branch assigned, return a restrictive filter
  return " AND 1=0"; // No records for users without assigned branch
};

// Middleware to set branch context for data operations
const setBranchContext = (req, res, next) => {
  try {
    // Set branch ID in request body if not already present and user has a branch
    if (!req.body.branch_id && req.userBranchAccess && req.userBranchAccess.branchId && !req.userBranchAccess.isSuperAdmin) {
      req.body.branch_id = req.userBranchAccess.branchId;
    }
    
    next();
  } catch (error) {
    console.error("Set branch context middleware error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error setting branch context" 
    });
  }
};

module.exports = {
  branchAccess,
  checkBranchPermission,
  getBranchFilter,
  setBranchContext
};