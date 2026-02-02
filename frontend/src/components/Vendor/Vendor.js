import React from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getVendorConfig } from "./vendorconfig";
import { useDataManager } from "../common/userdatamanager";
import CityState from "../../constants/CityState.json"
import CityPincode from "../../constants/CityPincode.json";
import { useState } from "react";
import { AuthHelper } from "../../utils/authHelper";
import { useEffect } from "react";
import PermissionDenied from "../../utils/permission_denied";
import { MODULES } from "../../constants/CONSTANT";

import "../../App.css";
import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
const Vendor = (props) => {
  const { timeZone } = convertToUserTimezone();
  const baseConfig = getVendorConfig();
  const { data, loading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );

  const [permissions, setPermissions] = useState({
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    loading: true
  });

  useEffect(() => {
    const fetchPermissions = async () => {
      const canView = await AuthHelper.hasModulePermission(MODULES.VENDORS, "view");
      const canCreate = await AuthHelper.hasModulePermission(MODULES.VENDORS, "create");
      const canEdit = await AuthHelper.hasModulePermission(MODULES.VENDORS, "edit");
      const canDelete = await AuthHelper.hasModulePermission(MODULES.VENDORS, "delete");

      setPermissions({
        canView,
        canCreate,
        canEdit,
        canDelete,
        loading: false
      });
    };

    fetchPermissions();

    window.addEventListener("permissionsUpdated", fetchPermissions);

    return () => {
      window.removeEventListener("permissionsUpdated", fetchPermissions);
    };
  }, []);

  if (permissions.loading || loading) {
    return <div>Loading...</div>;
  }

  if (!permissions.canView) {
    return <PermissionDenied />;
  }
  if (loading) {
    // return <Loader message="Loading vendors data..." />;
    return <span className="loader"></span>
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

  const finalConfig = getVendorConfig(
    allData,
    props,
    {
      canCreate: permissions.canCreate,
      canEdit: permissions.canEdit,
      canDelete: permissions.canDelete
    }
  );

  return <DynamicCRUD {...finalConfig} icon="fa-solid fa-store" permissions={permissions} />;
};

export default Vendor;