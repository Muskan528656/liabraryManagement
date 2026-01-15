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
    AuthHelper.logout();
  },
};

export default AuthApi;
