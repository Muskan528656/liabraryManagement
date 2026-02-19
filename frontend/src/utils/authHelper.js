import DataApi from "../api/dataApi";
import PermissionDenied from "./permission_denied";

export const AuthHelper = {


    getToken() {
        const token = sessionStorage.getItem("token");
        // console.log("AuthHelper.getToken ->", token);
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
        return Array.isArray(parsed) ? parsed : [];
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
            // console.log("AuthHelper.getUser -> No token found");
            return null;
        }

        try {
            const user = JSON.parse(atob(token.split(".")[1]));
            // console.log("AuthHelper.getUser ->", user);
            return user;
        } catch (err) {
            console.error("AuthHelper.getUser -> Token parse error:", err);
            return null;
        }
    },
    isSuperAdmin() {
        console.log(" Checking super admin status");
        const user = this.getUser();
        if (!user || !user.userrole) return false;
console.log("yser",user.userrole)
console.log("yser uu ",user)
        const superAdminRoles = ["SYSTEM ADMIN"];
console.log("super admi->>>",superAdminRoles)
        return superAdminRoles.includes(user.role_name);
    },


    async hasModulePermission(moduleName, action) {
        // console.log("Checking permission for:", moduleName, action);

        // console.log("Is Super Admin?", this.isSuperAdmin());
        if (this.isSuperAdmin()) {
            // console.log("Super admin - granting all permissions");
            return true;
        }

        const permissions = this.getPermissions();
        // console.log("User permissions:", permissions);

        if (!permissions || typeof permissions !== 'object') {
            // console.warn("No permissions found in session storage");
            return false;
        }

        const modulePerm = permissions.find(p =>
            p.moduleName && p.moduleName.toLowerCase() === moduleName.toLowerCase()
        );

        if (modulePerm) {
            // console.log("Found permission by moduleName:", modulePerm);
            switch (action) {
                case "view": return !!modulePerm.allowView;
                case "create": return !!modulePerm.allowCreate;
                case "edit": return !!modulePerm.allowEdit;
                case "delete": return !!modulePerm.allowDelete;
                default: return false;
            }
        }

        try {
            const api = new DataApi("module");
            const response = await api.fetchAll();

            if (!response || response.status !== 200) {
                // console.error("Module API failed");
                return false;
            }

            const moduleList = response.data?.records || [];
            // console.log("Module list from API:", moduleList);


            const module = moduleList.find(m =>
                m.name.toLowerCase() === moduleName.toLowerCase()
            );

            if (!module) {
                // console.warn(`Module "${moduleName}" not found in API`);
                return false;
            }


            const permByModuleId = permissions.find(p => p.moduleId === module.id);
            // console.log("Permission by moduleId:", permByModuleId);

            if (!permByModuleId) return false;

            switch (action) {
                case "view": return !!permByModuleId.allowView;
                case "create": return !!permByModuleId.allowCreate;
                case "edit": return !!permByModuleId.allowEdit;
                case "delete": return !!permByModuleId.allowDelete;
                default: return false;
            }

        } catch (error) {
            console.error("hasModulePermission error:", error);
            return false;
        }
    }
    ,      // async hasModulePermission(moduleName, action) {
    //     console.log("Checking permission:", moduleName, action);
    //     if (this.isSuperAdmin()) {
    //         return true;
    //     }

    //     const isAdmin = this.isSuperAdmin();
    //     console.log("Is Super Admin?", isAdmin);
    //     const permissions = this.getPermissions();
    //     if (!Array.isArray(permissions) || permissions.length === 0) {
    //         console.warn("No permissions found");
    //         return false;
    //     }

    //     try {

    //         const api = new DataApi("module");
    //         const response = await api.fetchAll();

    //         if (!response || response.status !== 200) {
    //             console.error("Module API failed:", response);
    //             return false;
    //         }

    //         const moduleList = response.data?.records || [];


    //         const module = moduleList.find(m => m.name === moduleName);
    //         if (!module) {
    //             console.warn(`Module not found: ${moduleName}`);
    //             return false;
    //         }


    //         const modulePerm = permissions.find(p => p.moduleId === module.id);
    //         if (!modulePerm) {
    //             console.warn(`No permission found for moduleId: ${module.id}`);
    //             return false;
    //         }

    //         switch (action) {
    //             case "view":
    //                 return !!modulePerm.allowView;
    //             case "create":
    //                 return !!modulePerm.allowCreate;
    //             case "edit":
    //                 return !!modulePerm.allowEdit;
    //             case "delete":
    //                 return !!modulePerm.allowDelete;
    //             default:
    //                 console.warn(`Invalid action: ${action}`);
    //                 return false;
    //         }

    //     } catch (error) {
    //         console.error("hasModulePermission error:", error);
    //         return false;
    //     }
    // },

    // async hasModulePermission(moduleName, action) {
    //     console.log("Checking permission for module:", moduleName, "action:", action);

    //     let permissions = this.getPermissions();
    //     if (!permissions || permissions.length === 0) return false;

    //     let moduleList = [];

    //     try {
    //         const api = new DataApi("module");
    //         const response = await api.fetchAll();

    //         console.log("Fetched module list response:", response);

    //         if (!response || response.status !== 200) {
    //             throw new Error(`Module API error: ${response?.status}`);
    //         }

    //         moduleList = response.data?.records || [];

    //     } catch (err) {
    //         console.error("AuthHelper.hasModulePermission -> Module fetch error:", err);
    //         return false;
    //     }


    //     const module = moduleList.find(m => m.name === moduleName);
    //     if (!module) {
    //         console.warn(`Module "${moduleName}" not found in API response`);
    //         return false;
    //     }
    //     console.log("-> Found module:", module.id, module.name);

    //     const modulePerm = permissions.find(p => p.moduleId === module.id);
    //     console.log(" modulePerm:", modulePerm);

    //     if (!modulePerm) return false;

    //     const updatedPermissions = permissions.map(p =>
    //         p.moduleId === module.id ? modulePerm : p
    //     );

    //     console.log("updatedPermissions:", updatedPermissions);

    //     switch (action) {
    //         case "view":
    //             return Boolean(modulePerm.allowView);
    //         case "create":
    //             return Boolean(modulePerm.allowCreate);
    //         case "edit":
    //             return Boolean(modulePerm.allowEdit);
    //         case "delete":
    //             return Boolean(modulePerm.allowDelete);
    //         default:
    //             console.warn(`Unknown action "${action}"`);
    //             return false;
    //     }
    // },

    logout() {
        sessionStorage.clear();
        sessionStorage.clear(); // if used
        this.clearAuth();
        console.log("AuthHelper.logout -> Redirecting to /login");
        window.location.href = "/login";
    }
};
