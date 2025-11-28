import React from "react";
import Loader from "../common/Loader";
import DynamicCRUD from "../common/DynaminCrud";
import { getPermissionConfig } from "./permissionConfig";
import { useDataManager } from "../common/userdatamanager";

const Permission = (props) => {
    const baseConfig = getPermissionConfig();
    const { data, loading, error } = useDataManager(baseConfig.dataDependencies, props);

    if (loading) {
        return <Loader message="Loading permissions..." />;
    }

    if (error) {
        return (
            <div className="alert alert-danger">
                <h4>Failed to load permissions</h4>
                <p>{error}</p>
            </div>
        );
    }

    const finalConfig = getPermissionConfig(data, props);
    return <DynamicCRUD {...finalConfig} icon="fa-solid fa-lock" />;
};

export default Permission;
