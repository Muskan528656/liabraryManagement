import React, { createContext, useContext, useEffect, useState } from "react";
import jwt_decode from "jwt-decode";

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

  const refreshUserInfo = () => {
    const user = getUserFromToken();
    setUserInfo(user);
    setIsLoading(false);
  };

  const logout = () => {
    sessionStorage.clear();
    setUserInfo(false);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshUserInfo();


    const handleStorageChange = (e) => {
      if (e.key === "token") {
        refreshUserInfo();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const value = {
    userInfo,
    isLoading,
    isLoggedIn: !!userInfo,
    refreshUserInfo,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
