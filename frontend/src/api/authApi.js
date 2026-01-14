import * as constants from "../constants/CONSTANT";

const AuthApi = {
  async login(credentials) {
    try {

      const loginData = {
        email: credentials.email ? credentials.email.trim().toLowerCase() : "",
        password: credentials.password || "",
        tcode: credentials.tcode ? credentials.tcode.trim().toLowerCase() : "",
      };
      console.log("constants.API_BASE_URL", constants.API_BASE_URL)

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
  async refreshToken() {
    const refreshToken = sessionStorage.getItem("r-t");
    if (!refreshToken) {

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

  async forgotPassword(email, tcode) {
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

  async bs() {
    return "yes";
  },
};

export default AuthApi;
