import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ userInfo, userModules = [], routeModule }) => {
  // ADMIN has access to all modules - bypass all checks
  if (userInfo && userInfo.userrole === "ADMIN") {
    return <Outlet />;
  }

  // For other roles, check module access and subscription
  if (userInfo && userInfo.userrole && userModules && userModules.length) {
    const hasAccess = userModules.some((module) => module.url.includes(routeModule));
    
    // Check subscription expiry
    if (userInfo.subscription && userInfo.subscription.end_date) {
      const subscriptionEndDate = new Date(userInfo.subscription.end_date);
      const currentDate = new Date();
      if (subscriptionEndDate <= currentDate) {
        return <Navigate to="/402" />;
      }
    }
    
    // Check module access
    if (!hasAccess) {
      return <Navigate to="/403" />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
