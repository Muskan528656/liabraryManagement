import { useState } from "react";
import * as constants from "../constants/CONSTANT";
import helper from "../components/common/helper";
const AuthApi = {
  async login(credentials) {
    try {

      const loginData = {
        email: credentials.email ? credentials.email.trim().toLowerCase() : "",
        password: credentials.password || "",
        tcode: credentials.tcode ? credentials.tcode.trim().toLowerCase() : "",
      };
      let response = await fetch(constants.API_BASE_URL + "/api/auth/login", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();
      if (result.success) {
        sessionStorage.setItem("token", result.authToken);
        sessionStorage.setItem("r-t", result.refreshToken);
      }
      return result;
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, errors: "Network error. Please try again." };
    }
  },

  async fetchMyImage() {
    const token = sessionStorage.getItem("token");

    let response = await helper.fetchWithAuth(
      constants.API_BASE_URL + "/api/auth/myimage",
      "GET"
    );

    if (response.status === 200) {
      const fileBody = await response.blob();
      return fileBody;
    } else {
      return null;
    }
  },

  async fetchUserImage(userid) {
    const token = sessionStorage.getItem("token");

    let response = await helper.fetchWithAuth(
      constants.API_BASE_URL + "/api/auth/userimage/" + userid,
      "GET"
    );

    const fileBody = await response.blob();
    return fileBody;
  },

  async refreshToken() {
    const refreshToken = sessionStorage.getItem("r-t");
    if (!refreshToken) {
      // console.error("No refresh token found in localStorage.");
      this.logout();
      return;
    }
    try {
      const response = await fetch(
        `${constants.API_BASE_URL}/api/auth/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        }
      );

      const result = await response.json();

      if (result.success) {
        sessionStorage.setItem("token", result.authToken);
        sessionStorage.setItem("r-t", result.refreshToken);
      } else {

      }
      return result;
    } catch (error) {

      this.logout();
      return;
    }
  },

  logout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("r-t");
    window.location.href = "/login";
  },

  async bs() {
    return "yes";
  },
};

export default AuthApi;
