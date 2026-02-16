import React, { createContext, useContext, useState, useEffect } from "react";
import AuthApi from "../api/authApi";
import DataApi from "../api/dataApi";
import { AuthHelper } from "../utils/authHelper";

const AuthContext = createContext();

export const useAuthWrapper = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const storedUser = sessionStorage.getItem("user");
        const storedPermissions = sessionStorage.getItem("permissions");

        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedPermissions) {
            const perms = JSON.parse(storedPermissions);
            if (Array.isArray(perms)) {
                const normalized = {};
                perms.forEach(p => {
                    const key = p.moduleName || p.module_id || p.moduleId;
                    if (key) normalized[key.toLowerCase()] = p;
                });
                setPermissions(normalized);
            } else {
                setPermissions(perms);
            }
        }

        setLoading(false);

        // Listen for permission updates
        const handlePermissionsUpdated = () => {
            refreshPermissions();
        };

        window.addEventListener("permissionsUpdated", handlePermissionsUpdated);

        return () => {
            window.removeEventListener("permissionsUpdated", handlePermissionsUpdated);
        };
    }, []);


    const refreshPermissions = async () => {
        try {
            console.log("Refreshing permissions...");

            const result = await AuthApi.getPermissions();

            if (result && result.success && result.permissions) {
                const permissions = result.permissions;

                const normalizedPermissions = {};
                permissions.forEach((perm) => {
                    const key = perm.moduleName || perm.module_id || perm.moduleId;
                    if (key) normalizedPermissions[key.toLowerCase()] = perm;
                });

                setPermissions(normalizedPermissions);
                sessionStorage.setItem("permissions", JSON.stringify(permissions));
                console.log("Permissions refreshed successfully");
            } else {
                console.error("Failed to refresh permissions:", result?.errors);
            }
        } catch (err) {
            console.error("Failed to refresh permissions:", err);
        }
    };

    const login = async (credentials) => {
        try {
            const result = await AuthApi.login(credentials);
            if (!result.success) return result;

            const userData = result.user;
            setUser(userData);

            const normalizedPermissions = {};
            (userData.permissions || []).forEach((perm) => {
                const key = perm.module_name || perm.module_id || perm.moduleId;
                if (key) normalizedPermissions[key.toLowerCase()] = perm;
            });
            setPermissions(normalizedPermissions);

            sessionStorage.setItem("user", JSON.stringify(userData));
            sessionStorage.setItem("permissions", JSON.stringify(userData.permissions || []));

            return result;
        } catch (err) {
            console.error("Login failed:", err);
            return { success: false, errors: "Network error. Please try again." };
        }
    };

    const logout = () => {
        setUser(null);
        setPermissions({});
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("selectedBranch");
        sessionStorage.removeItem("permissions");
        sessionStorage.clear();
        window.location.href = "/login";
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                permissions,
                loading,
                login,
                logout,
                refreshPermissions,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
