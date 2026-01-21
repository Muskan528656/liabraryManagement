

import React, { useEffect, useState } from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getBooksConfig } from "./bookconfig";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import { AuthHelper } from "../../utils/authHelper";
import PermissionDenied from "../../utils/permission_denied";
import { MODULES } from "../../constants/CONSTANT";

const Books = (props) => {
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
      const canView = await AuthHelper.hasModulePermission(MODULES.BOOKS, MODULES.CAN_VIEW);
      const canCreate = await AuthHelper.hasModulePermission(MODULES.BOOKS, MODULES.CAN_CREATE);
      const canEdit = await AuthHelper.hasModulePermission(MODULES.BOOKS, MODULES.CAN_EDIT);
      const canDelete = await AuthHelper.hasModulePermission(MODULES.BOOKS, MODULES.CAN_DELETE);

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

  const baseConfig = getBooksConfig({
    canCreate: permissions.canCreate,
    canEdit: permissions.canEdit,
    canDelete: permissions.canDelete
  });

  if (permissions.loading) {
    return <div>Loading...</div>;
  }

  if (!permissions.canView) {
    return <PermissionDenied />;
  }

  const finalConfig = getBooksConfig(
    props,
    props,
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
      icon="fa-solid fa-book"
      permissions={permissions}
    />
  );
};

export default Books;