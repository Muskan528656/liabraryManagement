import React, { useEffect, useState } from "react";
import Loader from "../common/Loader";
import DynamicCRUD from "../common/DynaminCrud";
import { getSubscriptionConfig } from "./subscriptionconfig";
import { useDataManager } from "../common/userdatamanager";
import DataApi from "../../api/dataApi";

const Subscription = (props) => {
    const [allowedBooks, setAllowedBooks] = useState(10);


    useEffect(() => {
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

    const finalConfig = getSubscriptionConfig(data, allowedBooks);

    return <DynamicCRUD {...finalConfig} icon="fa-solid fa-id-card" />;
};

export default Subscription;
