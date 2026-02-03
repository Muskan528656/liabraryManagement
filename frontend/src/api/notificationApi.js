import * as constants from "../constants/CONSTANT";
import { AuthHelper } from "../utils/authHelper";

const NotificationApi = {
  async requestAccess() {
    try {
      const token = AuthHelper.getToken();
      if (!token) {
        return { success: false, errors: "No token found" };
      }

      const response = await fetch(
        `${constants.API_BASE_URL}/api/notifications/request-access`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Request access error:", error);
      return { success: false, errors: "Network error. Please try again." };
    }
  },
};

export default NotificationApi;
