import React from "react";
import Loader from "../common/Loader";
import DynamicCRUD from "../common/DynaminCrud";
import { getSubscriptionConfig } from "./subscriptionconfig";
import { useDataManager } from "../common/userdatamanager";

const Subscription = (props) => {
    const baseConfig = getSubscriptionConfig();
    const { data, loading, error } = useDataManager(baseConfig.dataDependencies, props);

    if (loading) {
        return <Loader message="Loading subscriptions..." />;
    }

    if (error) {
        return (
            <div className="alert alert-danger">
                <h4>Failed to load subscriptions</h4>
                <p>{error}</p>
            </div>
        );
    }

    const finalConfig = getSubscriptionConfig(data, props);
    return <DynamicCRUD {...finalConfig} icon="fa-solid fa-id-card" />;
};

export default Subscription;

