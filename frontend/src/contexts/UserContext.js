import React, { createContext, useContext, useEffect, useState } from "react";
import jwt_decode from "jwt-decode";
import AuthApi from "../api/authApi";

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  const decodeToken = (token) => {
    try {
      return jwt_decode(token);
    } catch (error) {
      console.error("Invalid token:", error);
      return null;
    }
  };

  const getUserFromToken = () => {
    const token = sessionStorage.getItem("token");
    if (!token) return null;
    return decodeToken(token);
  };

  const refreshUserInfo = async () => {
    const user = getUserFromToken();
    setUserInfo(user);
    if (user) {
      await fetchPermissions();
    }
    setIsLoading(false);
  };

  const fetchPermissions = async () => {
    try {
      const result = await AuthApi.getPermissions();
      console.log("result=>", result.permissions);

      if (result && result.success && result.permissions) {
        setPermissions(result.permissions);
        sessionStorage.setItem("permissions", JSON.stringify(result.permissions));
      } else {
        console.error("Failed to fetch permissions:", result?.errors);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const logout = () => {
    sessionStorage.clear();
    setUserInfo(null);
    setPermissions([]);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshUserInfo();

    const handleStorageChange = (e) => {
      if (e.key === "token") {
        refreshUserInfo();
      }
    };

    const handlePermissionsUpdated = () => {
      fetchPermissions();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("permissionsUpdated", handlePermissionsUpdated);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("permissionsUpdated", handlePermissionsUpdated);
    };
  }, []);



  const value = {
    userInfo,
    isLoading,
    permissions,
    isLoggedIn: !!userInfo,
    refreshUserInfo,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
