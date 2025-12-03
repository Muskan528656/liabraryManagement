import React, { useEffect, useState } from "react";
import Loader from "../common/Loader";
import DynamicCRUD from "../common/DynaminCrud";
import { getSubscriptionConfig } from "./subscriptionconfig";
import { useDataManager } from "../common/userdatamanager";
import DataApi from "../../api/dataApi";

const Subscription = (props) => {
    const [allowedBooks, setAllowedBooks] = useState(10);

    const [timeZone, setTimeZone] = useState(null);

    function getCompanyIdFromToken() {
        const token = sessionStorage.getItem("token");
        if (!token) return null;

        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.companyid || payload.companyid || null;
    }

    const fetchCompany = async () => {
        try {
            const companyid = getCompanyIdFromToken();

            if (!companyid) {
                console.error("Company ID not found in token");
                return;
            }

            const companyApi = new DataApi("company");
            const response = await companyApi.fetchById(companyid);

            if (response.data) {
                setTimeZone(response.data.time_zone);

                // console.log("Company:", response.data);
            }
        } catch (error) {
            console.error("Error fetching company by ID:", error);
        }
    };
    useEffect(() => {
        fetchCompany();

        const loadMaxBooks = async () => {
            try {
                const api = new DataApi("librarysettings");
                const res = await api.fetchAll();

                if (res?.data) {
                    const data = Array.isArray(res.data) ? res.data[0] : res.data;
                    if (data?.max_books) {
                        setAllowedBooks(parseInt(data.max_books));
                    }
                }
            } catch (err) {
                console.error("Error:", err);
            }
        };

        loadMaxBooks();
    }, []);


    const baseConfig = getSubscriptionConfig({}, allowedBooks);
    const { data, loading, error } = useDataManager(baseConfig.dataDependencies, props);

    if (loading) return <Loader message="Loading subscriptions..." />;
    if (error) return <div className="alert alert-danger">{error}</div>;

    const finalConfig = getSubscriptionConfig(data, allowedBooks, timeZone);

    return <DynamicCRUD {...finalConfig} icon="fa-solid fa-id-card" />;
};

export default Subscription;
