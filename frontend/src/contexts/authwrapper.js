import React, { createContext, useContext, useState, useEffect } from "react";
import AuthApi from "../api/authApi";

const AuthWrapper = createContext();

export const useAuthWrapper = () => useContext(AuthWrapper);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);

    // load saved user + permissions on app start
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const storedPermissions = localStorage.getItem("permissions");

        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedPermissions) setPermissions(JSON.parse(storedPermissions));

        setLoading(false);
    }, []);

    // Login function using AuthApi.login
    const login = async (credentials) => {
        try {
            const result = await AuthApi.login(credentials);

            if (!result.success) {
                return result; // return error to component
            }

            const userData = result.user; // backend login response me user object
            setUser(userData);

            // normalize permissions by module_id
            const normalizedPermissions = {};
            (userData?.permissions || []).forEach((perm) => {
                normalizedPermissions[perm.module_id] = { ...perm };
            });
            setPermissions(normalizedPermissions);

            // persist
            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("permissions", JSON.stringify(normalizedPermissions));

            return result; // success
        } catch (err) {
            console.error("Login failed:", err);
            return { success: false, errors: "Network error. Please try again." };
        }
    };

    // Logout
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
        <AuthWrapper.Provider
            value={{
                user,
                permissions,
                loading,
                login,
                logout,
            }}
        >
            {children}
        </AuthWrapper.Provider>
    );
};
