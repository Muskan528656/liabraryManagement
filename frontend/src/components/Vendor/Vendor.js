   import React from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getVendorConfig } from "./vendorconfig";

import { useDataManager } from "../common/userdatamanager";
import Loader from "../common/Loader";
import CityState from "../../constants/CityState.json"
import CityPincode from "../../constants/CityPincode.json";
import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";
import { useTimeZone } from "../../contexts/TimeZoneContext";


const Vendor = (props) => {
  const { timeZone } = useTimeZone();
  const baseConfig = getVendorConfig();
  const { data, loading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );

  if (loading) {
    return <Loader message="Loading vendors data..." />;
  }
  if (error) {
    return (
      <div className="alert alert-danger">
        <h4>Error Loading Vendors</h4>
        <p>{error.message}</p>
        <button
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  const allData = {
    ...data,
    ...props,
    ...timeZone,
    CityState: CityState,
    CityPincode: CityPincode,
    CountryCode: COUNTRY_CODES
  };

  console.log("All Data in Vendor Component:", allData);

 
  const finalConfig = getVendorConfig(allData);

  return <DynamicCRUD {...finalConfig} icon="fa-solid fa-store" />;
};

export default Vendor;