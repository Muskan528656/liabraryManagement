
import DynamicCRUD from "../common/DynaminCrud";

import { getPublisherConfig } from "./PublisherConfig.js";
import { useDataManager } from "../common/userdatamanager";
import { useTimeZone } from "../../contexts/TimeZoneContext";

const Publisher = (props) => {
    const { timeZone } = useTimeZone();

 
    const baseConfig = getPublisherConfig();

 

    const { data, loading, error } = useDataManager(
        baseConfig.dataDependencies,
        props
    );
    if (loading) {
 
        return <div>Loading books data...</div>;
    }
 

    const finalConfig = getPublisherConfig(data, props, timeZone);

 

    return <DynamicCRUD {...finalConfig} icon="fa fa-address-card" />;
};

export default Publisher;