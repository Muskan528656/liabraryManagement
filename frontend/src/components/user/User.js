import React, { useEffect, useState } from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getUserConfig } from "./userconfig";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import { MODULES } from "../../constants/CONSTANT";
import { AuthHelper } from "../../utils/authHelper";
import PermissionDenied from "../../utils/permission_denied";

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

 
  if (permissions.loading) {
    return <div>Loading...</div>;
  }

  if (!permissions.canView) {
    return <PermissionDenied />;
  }

  const finalConfig = getUserConfig(
    props,
    props,
    {
      canCreate: permissions.canCreate,
      canEdit: permissions.canEdit,
      canDelete: permissions.canDelete
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