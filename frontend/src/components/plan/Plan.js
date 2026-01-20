import React, { useEffect, useState } from "react";
import Loader from "../common/Loader";
import DynamicCRUD from "../common/DynaminCrud";
import { getPlanConfig } from "./PlanConfig";
import { useDataManager } from "../common/userdatamanager";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import DataApi from "../../api/dataApi";
import "../../App.css";
const Plan = (props) => {
    const [allowedBooks, setAllowedBooks] = useState(null);
    const [planConfig, setPlanConfig] = useState(null);

    const { timeZone } = useTimeZone();




    useEffect(() => {
        const loadSettings = async () => {
            try {
                const api = new DataApi("librarysettings");
                const res = await api.fetchAll();

                const data = Array.isArray(res?.data) ? res.data[0] : res.data;

                if (data?.max_books) {
                    setAllowedBooks(parseInt(data.max_books));
                }
            } catch (err) {
                console.error("Error loading library settings:", err);
            }
        };

        loadSettings();
    }, []);





    useEffect(() => {
        const loadConfig = async () => {
            try {
                const config = await getPlanConfig({}, allowedBooks, timeZone);
                setPlanConfig(config);
            } catch (err) {
                console.error("Error loading plan config:", err);
            }
        };

        if (allowedBooks && timeZone) {
            loadConfig();
        }
    }, [allowedBooks, timeZone]);




    const { data, loading, error } = useDataManager(
        planConfig?.dataDependencies,
        props
    );

    if (!planConfig || loading) return <span className="loader"></span>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return <DynamicCRUD {...planConfig} icon="fa-solid fa-tags" />;
};

export default Plan;
