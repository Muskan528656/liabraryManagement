
import DynamicCRUD from "../common/DynaminCrud";

import { getPublisherConfig } from "./PublisherConfig.js";
import { useDataManager } from "../common/userdatamanager";
import { useTimeZone } from "../../contexts/TimeZoneContext";

const Publisher = (props) => {
    const { timeZone } = useTimeZone();

    console.log("sdfghjgfdewertyu", timeZone);
    const baseConfig = getPublisherConfig();

    console.log("books baseConfig", baseConfig);

    const { data, loading, error } = useDataManager(
        baseConfig.dataDependencies,
        props
    );
    if (loading) {
        console.log("books data", loading, data, error);
        return <div>Loading books data...</div>;
    }
    console.log("books data", loading);

    const finalConfig = getPublisherConfig(data, props, timeZone);

    console.log("books finalConfig", finalConfig);

    return <DynamicCRUD {...finalConfig} icon="fa fa-address-card" />;
};

export default Publisher;