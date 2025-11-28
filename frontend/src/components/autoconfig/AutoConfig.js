import React from "react";
import Loader from "../common/Loader";
import DynamicCRUD from "../common/DynaminCrud";
import { getAutoConfigConfig } from "./autoconfigconfig";
import { useDataManager } from "../common/userdatamanager";

const AutoConfig = (props) => {
    const baseConfig = getAutoConfigConfig();
    const { data, loading, error } = useDataManager(baseConfig.dataDependencies, props);

    if (loading) {
        return <Loader message="Loading auto config..." />;
    }

    if (error) {
        return (
            <div className="alert alert-danger">
                <h4>Failed to load auto config</h4>
                <p>{error}</p>
            </div>
        );
    }

    const finalConfig = getAutoConfigConfig(data, props);
    return <DynamicCRUD {...finalConfig} icon="fa-solid fa-gears" />;
};

export default AutoConfig;

