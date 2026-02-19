import React from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getVendorConfig } from "./vendorconfig";
import { useDataManager } from "../common/userdatamanager";
import PermissionDenied from "../../utils/permission_denied";
import CityState from "../../constants/CityState.json";
import CityPincode from "../../constants/CityPincode.json";
import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import "../../App.css";

const Vendor = ({ permissions, ...props }) => {
  const { timeZone } = useTimeZone();

  const baseConfig = getVendorConfig(
    {},
    {},
    {
      canCreate: permissions?.allowCreate,
      canEdit: permissions?.allowEdit,
    }
  );

  const { data, loading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );

  if (!permissions?.allowView) {
    return <PermissionDenied />;
  }

  if (permissions?.loading || loading) {
    return <span className="loader"></span>;
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
    timeZone,
    CityState,
    CityPincode,
    CountryCode: COUNTRY_CODES,
  };

  const finalConfig = getVendorConfig(
    allData,
    props,
    {
      canCreate: permissions?.allowCreate,
      canEdit: permissions?.allowEdit,
    }
  );

  return (
    <DynamicCRUD
      {...finalConfig}
      icon="fa-solid fa-store"
      permissions={permissions}
    />
  );
};

export default Vendor;
