import { createContext, useContext, useState, useEffect } from "react";
import uvCapitalApi from "../api/uvCapitalApi";
import JWTService from "../config/jwt.config";

const AuthWrapper = createContext();


export const AuthProvider = ({ children }) => {
    const [permissions, setRawPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [userList, setUserList] = useState([]);
    const [settingPermissions, setSettingPermissions] = useState(null);

    const normalizeModuleName = (name) => {
        return name
            .toLowerCase()
            .replace(/&/g, "and")
            .replace(/[^\w\s]/g, "")
            .replace(/\s+/g, "_");
    };

    const setPermissions = (permissionList) => {
        const normalized = {};
        Object.entries(permissionList || {}).forEach(([moduleName, perm]) => {
            const key = normalizeModuleName(moduleName);
            normalized[key] = {
                id: perm.module_id,
                create: perm.create,
                update: perm.edit,
                delete: perm.delete,
                tab_view: perm.tab_view,
                viewAll: perm.view_all,
                owner: perm.owner,
            };
        });
        setRawPermissions(normalized);
    };

    const fetchPermissions = async () => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            try {
                const decoded = JWTService.decodeTokenDetails(storedToken);
                const groupId = decoded?.user?.group_id;
                const userId = decoded?.user?.id;
                const res = await uvCapitalApi.getListOfUsers();
                const result = await uvCapitalApi.getAllSeetingPermissions();
                setSettingPermissions(result?.data[0]?.setting_permission);
                setUserList(res?.data);
                if (userId) {
                    const res = await uvCapitalApi.getUserById(userId);
                    setUser(res?.data);
                }
                if (groupId) {
                    const response = await uvCapitalApi.getListOfGroupsPermissionsById(groupId);
                    setPermissions(response?.data[0]?.modules);
                }
            } catch (err) {
                console.error("Failed to decode token or fetch permissions:", err);
            }
        }
        setLoading(false);
    };

    const refreshSettingPermissions = async () => {
        try {
            const result = await uvCapitalApi.getAllSeetingPermissions();
            setSettingPermissions(result?.data[0]?.setting_permission);
        } catch (err) {
            console.error("Failed to refresh setting permissions:", err);
        }
    };

    useEffect(() => {
        if (!user || Object.keys(permissions).length === 0) {
            fetchPermissions();
        }
    }, []);

    return (
        <AuthWrapper.Provider
            value={{ permissions, setPermissions, user, setUser, loading, fetchPermissions, userList, settingPermissions, refreshSettingPermissions }}
        >
            {children}
        </AuthWrapper.Provider>
    );
};

export const useAuthWrapper = () => useContext(AuthWrapper);