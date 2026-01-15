import React, { createContext, useContext, useState, useEffect } from "react";
import AuthApi from "../api/authApi";
import { AuthHelper } from "../utils/authHelper";

const AuthContext = createContext();

export const useAuthWrapper = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const storedPermissions = localStorage.getItem("permissions");

        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedPermissions) setPermissions(JSON.parse(storedPermissions));

        setLoading(false);
    }, []);


    const refreshPermissions = async () => {
        try {
            const userData = await AuthHelper.getUser();
            if (!userData) return;
            console.log("Refreshing permissions for user:", userData);

            setUser(userData);

            const normalizedPermissions = {};
            (userData.permissions || []).forEach((perm) => {
                normalizedPermissions[perm.module_name] = perm;
            });
            setPermissions(normalizedPermissions);

            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("permissions", JSON.stringify(normalizedPermissions));
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
                normalizedPermissions[perm.module_name] = perm;
            });
            setPermissions(normalizedPermissions);

            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("permissions", JSON.stringify(normalizedPermissions));

            return result;
        } catch (err) {
            console.error("Login failed:", err);
            return { success: false, errors: "Network error. Please try again." };
        }
    };

    const logout = () => {
        setUser(null);
        setPermissions({});
        localStorage.removeItem("user");
        localStorage.removeItem("permissions");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("r-t");
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
