import React, { useEffect, useState } from "react";
import Loader from "../common/Loader";
import DynamicCRUD from "../common/DynaminCrud";
import { getPlanConfig } from "./PlanConfig";
import { useDataManager } from "../common/userdatamanager";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import DataApi from "../../api/dataApi";

const Plan = (props) => {
    const [allowedDays, setAllowedDays] = useState(30); 
    const { timeZone } = useTimeZone();

    console.log("Plan Timezone:", timeZone);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const api = new DataApi("librarysettings");
                const res = await api.fetchAll();

                if (res?.data) {
                    const data = Array.isArray(res.data) ? res.data[0] : res.data;

                 
                    if (data?.default_plan_days) {
                        setAllowedDays(parseInt(data.default_plan_days));
                    }
                }
            } catch (err) {
                console.error("Error:", err);
            }
        };

        loadSettings();
    }, []);

  
    const baseConfig = getPlanConfig({}, allowedDays);

  
    const { data, loading, error } = useDataManager(baseConfig.dataDependencies, props);

    if (loading) return <Loader message="Loading plans..." />;
    if (error) return <div className="alert alert-danger">{error}</div>;

   
    const finalConfig = getPlanConfig(data, allowedDays, timeZone);

    return <DynamicCRUD {...finalConfig} icon="fa-solid fa-tags" />;
};

export default Plan;
