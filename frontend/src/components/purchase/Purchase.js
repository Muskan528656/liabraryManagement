

import React from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getPurchaseConfig } from "./PurchaseConfig";
import { useDataManager } from "../common/userdatamanager";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import PermissionDenied from "../../utils/permission_denied";
import Loader from "../common/Loader";
import "../../App.css";

const Purchase = ({ permissions, ...props }) => {
  const { timeZone } = useTimeZone();

  const baseConfig = getPurchaseConfig(
    {},
    {},
    timeZone,
    {
      canCreate: permissions?.allowCreate,
      canEdit: permissions?.allowEdit,
    }
  );

  const { data, loading: dataLoading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );

  if (!permissions?.allowView) {
    return <PermissionDenied />;
  }

  if (permissions?.loading || dataLoading) {
    return <span className="loader"></span>;
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
      canCreate: permissions?.allowCreate,
      canEdit: permissions?.allowEdit,
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
