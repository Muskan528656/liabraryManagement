import React, { useEffect, useState } from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getUserConfig } from "./userconfig";
import { useDataManager } from "../common/userdatamanager";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import { MODULES } from "../../constants/CONSTANT";
import { AuthHelper } from "../../utils/authHelper";

const Users = (props) => {
  const { timeZone, companyInfo } = useTimeZone();
  const [permissions, setPermissions] = useState({
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    loading: true
  });

  useEffect(() => {
    const fetchPermissions = async () => {
      const canView = await AuthHelper.hasModulePermission(MODULES.USERS, MODULES.CAN_VIEW);
      const canCreate = await AuthHelper.hasModulePermission(MODULES.USERS, MODULES.CAN_CREATE);
      const canEdit = await AuthHelper.hasModulePermission(MODULES.USERS, MODULES.CAN_EDIT);
      const canDelete = await AuthHelper.hasModulePermission(MODULES.USERS, MODULES.CAN_DELETE);

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

  const baseConfig = getUserConfig({
    canCreate: permissions.canCreate,
    canEdit: permissions.canEdit,
    canDelete: permissions.canDelete
  });

  const { data, loading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );

  if (loading) return <div>Loading users data...</div>;
  if (error) return <div>Error loading users data: {error.message}</div>;


  const finalConfig = getUserConfig(data, props, timeZone, companyInfo);

  return <DynamicCRUD {...finalConfig} icon="fa-solid fa-user" />;
};

export default Users;