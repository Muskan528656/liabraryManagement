import React from "react";
import Dashboard from "./Dashboard";
import jwt_decode from "jwt-decode";

const Home = ({ userInfo }) => {
 
  let currentUserInfo = userInfo;
  if (!currentUserInfo) {
    try {
      const token = sessionStorage.getItem("token");
      if (token) {
        currentUserInfo = jwt_decode(token);
      }
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }
  
  return <Dashboard userInfo={currentUserInfo} />;
};

export default Home;
