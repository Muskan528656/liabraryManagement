import DataApi from "../api/dataApi";
import PermissionDenied from "./permission_denied";

export const AuthHelper = {
    getToken() {
        const token = sessionStorage.getItem("token");
        console.log("AuthHelper.getToken ->", token);
        return token;
    },

    getRefreshToken() {
        const refreshToken = sessionStorage.getItem("r-t");

        return refreshToken;
    },

    setAuth(token, refreshToken, permissions = []) {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("r-t", refreshToken);
        sessionStorage.setItem("permissions", JSON.stringify(permissions));

    },

    getPermissions() {
        const perms = sessionStorage.getItem("permissions");

        const parsed = perms ? JSON.parse(perms) : [];
        return parsed;
    },


    getModules() {
        const permissions = this.getPermissions();
        const modules = permissions.map(p => ({
            id: p.moduleId,
            name: p.moduleName || p.moduleId
        }));

        const uniqueModules = Array.from(new Map(modules.map(m => [m.id, m])).values());

        return uniqueModules;
    },

    clearAuth() {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("r-t");
        sessionStorage.removeItem("permissions");

    },

    isLoggedIn() {
        const loggedIn = !!this.getToken();

        return loggedIn;
    },

    getUser() {
        const token = this.getToken();
        if (!token) {
            console.log("AuthHelper.getUser -> No token found");
            return null;
        }

        try {
            const user = JSON.parse(atob(token.split(".")[1]));
            console.log("AuthHelper.getUser ->", user);
            return user;
        } catch (err) {
            console.error("AuthHelper.getUser -> Token parse error:", err);
            return null;
        }
    },
    async hasModulePermission(moduleName, action) {
        console.log("Checking permission for module:", moduleName, "action:", action);

        let permissions = this.getPermissions();
        if (!permissions || permissions.length === 0) return false;

        let moduleList = [];

        try {
            const api = new DataApi("module");
            const response = await api.fetchAll();

            console.log("Fetched module list response:", response);

            if (!response || response.status !== 200) {
                throw new Error(`Module API error: ${response?.status}`);
            }

            moduleList = response.data?.records || [];

        } catch (err) {
            console.error("AuthHelper.hasModulePermission -> Module fetch error:", err);
            return false;
        }


        const module = moduleList.find(m => m.name === moduleName);
        if (!module) {
            console.warn(`Module "${moduleName}" not found in API response`);
            return false;
        }

        const modulePerm = permissions.find(p => p.moduleId === module.id);
        console.log("AuthHelper.hasModulePermission -> modulePerm:", modulePerm);

        if (!modulePerm) return false;

        const updatedPermissions = permissions.map(p =>
            p.moduleId === module.id ? modulePerm : p
        );

        sessionStorage.setItem("permissions", JSON.stringify(updatedPermissions));

        switch (action) {
            case "view":
                return Boolean(modulePerm.allowView);
            case "create":
                return Boolean(modulePerm.allowCreate);
            case "edit":
                return Boolean(modulePerm.allowEdit);
            case "delete":
                return Boolean(modulePerm.allowDelete);
            default:
                console.warn(`Unknown action "${action}"`);
                return false;
        }
    },

    logout() {
        this.clearAuth();
        console.log("AuthHelper.logout -> Redirecting to /login");
        window.location.href = "/login";
    }
};
