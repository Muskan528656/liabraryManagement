import React, { useState, useEffect } from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getPurchaseConfig } from "./PurchaseConfig";
import { useDataManager } from "../common/userdatamanager";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import { AuthHelper } from "../../utils/authHelper";
import PermissionDenied from "../../utils/permission_denied";
import Loader from "../common/Loader";
import { MODULES } from "../../constants/CONSTANT";

const Purchase = (props) => {
  const { timeZone } = useTimeZone();


  const [permissions, setPermissions] = useState({
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    loading: true
  });

  useEffect(() => {
    const fetchPermissions = async () => {
      const canView = await AuthHelper.hasModulePermission(MODULES.PURCHASES, MODULES.CAN_VIEW);
      const canCreate = await AuthHelper.hasModulePermission(MODULES.PURCHASES, MODULES.CAN_CREATE);
      const canEdit = await AuthHelper.hasModulePermission(MODULES.PURCHASES, MODULES.CAN_EDIT);
      const canDelete = await AuthHelper.hasModulePermission(MODULES.PURCHASES, MODULES.CAN_DELETE);

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

  const baseConfig = getPurchaseConfig({
    canCreate: permissions.canCreate,
    canEdit: permissions.canEdit,
    canDelete: permissions.canDelete,
    timeZone: timeZone
  });

  const { data, loading: dataLoading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );

  if (permissions.loading || dataLoading) {
    return <Loader message="Loading purchase data..." />;
  }

  if (!permissions.canView) {
    return <PermissionDenied />;
  }


  if (error) {
    return (
      <div className="alert alert-danger">
        <h4>Error Loading Purchase</h4>
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

  const company = data?.company || props?.company || {};

  const finalConfig = getPurchaseConfig(
    data,
    { ...props, company },
    timeZone,
    {
      canCreate: permissions.canCreate,
      canEdit: permissions.canEdit,
      canDelete: permissions.canDelete
    }
  );

  return (
    <DynamicCRUD
      {...finalConfig}
      icon="fa-solid fa-shopping-cart"
      permissions={permissions}
    />
  );
};

export default Purchase;