import * as constants from "../constants/CONSTANT";
import { AuthHelper } from "../utils/authHelper";

const AuthApi = {
  async login(credentials) {
    try {
      const loginData = {
        email: credentials.email?.trim().toLowerCase() || "",
        password: credentials.password || "",
        tcode: credentials.tcode?.trim().toLowerCase() || "",
      };

      const response = await fetch(
        `${constants.API_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginData),
        }
      );

      const result = await response.json();

      if (result.success) {

        AuthHelper.setAuth(
          result.authToken,
          result.refreshToken,
          result.permissions
        );
      }

      return result;
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        errors: "Network error. Please try again.",
      };
    }
  },

  async refreshToken() {
    const refreshToken = AuthHelper.getRefreshToken();
    if (!refreshToken) {
      AuthHelper.logout();
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
        AuthHelper.setAuth(
          result.authToken,
          result.refreshToken,
          AuthHelper.getPermissions()
        );
      } else {
        AuthHelper.logout();
      }

      return result;
    } catch (error) {
      AuthHelper.logout();
    }
  },

  logout() {
    sessionStorage.clear();
    window.location.href = "/login";
  },

  async forgotPassword(email, tcode) {

    console.log("Forgot Password called with:", email, tcode);
    try {
      const forgotData = {
        email: email ? email.trim().toLowerCase() : "",
        tcode: tcode ? tcode.trim().toLowerCase() : "",
      };

      let response = await fetch(constants.API_BASE_URL + "/api/auth/forgot-password", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(forgotData),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Forgot password error:", error);
      return { success: false, errors: "Network error. Please try again." };
    }
  },

  async resetPassword(token, newPassword) {
    try {
      const resetData = {
        token: token,
        newPassword: newPassword,
      };

      let response = await fetch(constants.API_BASE_URL + "/api/auth/reset-password", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resetData),
      });
      const result = await response.json();
      return result;
    } catch (error) { 
      console.error("Reset password error:", error);
      return { success: false, errors: "Network error. Please try again." };
    }
  },

  async getPermissions() {
    try {
      const token = AuthHelper.getToken();
       let selectedBranch = JSON.parse(sessionStorage?.getItem('selectedBranch'));
    this.branchId = selectedBranch ? selectedBranch?.id ? selectedBranch.id : selectedBranch : null;

      if (!token) {
        return { success: false, errors: "No token found" };
      }

      const response = await fetch(
        `${constants.API_BASE_URL}/api/auth/permissions`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Branch-Id": `${this.branchId}`,
          },
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Get permissions error:", error);
      return { success: false, errors: "Network error. Please try again." };
    }
  },

  async bs() {
    return "yes";
  },
};

export default AuthApi;
