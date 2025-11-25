import * as constants from "../constants/CONSTANT";
import helper from "../components/common/helper";
const DashboardApi = {
    fetchStats: async () => {
        const token = sessionStorage.getItem("token");
        let response = await helper.fetchWithAuth(
            constants.API_BASE_URL + "/api/dashboard/stats",
            "GET"
        );
        if (response.status === 200) {
            const data = await response.json();
            return data;
        } else {
            return null;
        }
    },

    // Fetch all dashboard data
    fetchAll: async () => {
        const token = sessionStorage.getItem("token");
        let response = await helper.fetchWithAuth(
            constants.API_BASE_URL + "/api/dashboard",
            "GET"
        );
        if (response.status === 200) {
            const data = await response.json();
            return data;
        } else {
            return null;
        }
    },

};

export default DashboardApi;