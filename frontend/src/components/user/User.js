import React, { useEffect, useState } from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getUserConfig } from "./userconfig";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import { useDataManager } from "../common/userdatamanager";
import { MODULES } from "../../constants/CONSTANT";
import { AuthHelper } from "../../utils/authHelper";
import PermissionDenied from "../../utils/permission_denied";
import "../../App.css";


const Users = ({ permissions, ...props }) => {
  const { timeZone, companyInfo } = useTimeZone();

  const baseConfig = getUserConfig();

  const { data, loading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );

  if (permissions.loading) {
    return <div className="loading"></div>;
  }

  if (!permissions.allowView) {
    return <PermissionDenied />;
  }

  const finalConfig = getUserConfig(
    data,
    props,
    props,
    {
      canCreate: permissions.allowCreate,
      canEdit: permissions.allowEdit,
    },
    companyInfo,
    null
  );

  return (
    <DynamicCRUD
      {...finalConfig}
      icon="fa-solid fa-user"
      permissions={permissions}
    />
  );
};

export default Users;