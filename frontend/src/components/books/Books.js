

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
      if (AuthHelper.isSuperAdmin()) {
        setPermissions({
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
          loading: false
        });
        return;
      }

      const perms = {
        canView: await AuthHelper.hasModulePermission(MODULES.BOOKS, "view"),
        canCreate: await AuthHelper.hasModulePermission(MODULES.BOOKS, "create"),
        canEdit: await AuthHelper.hasModulePermission(MODULES.BOOKS, "edit"),
        canDelete: await AuthHelper.hasModulePermission(MODULES.BOOKS, "delete"),
        loading: false
      };

      setPermissions(perms);
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
  const isSuperAdmin = AuthHelper.isSuperAdmin?.();

  if (!permissions.loading && !isSuperAdmin && !permissions.canView) {

    return <PermissionDenied />;
  }
  // if (!permissions.loading && !permissions.canView) {
  //   return <PermissionDenied />;
  // }
  // if (!permissions.canView) {
  //   return <PermissionDenied />;
  // }

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