import React, { useEffect, useState } from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getBooksConfig } from "./bookconfig";
import { useDataManager } from "../common/userdatamanager";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import { AuthHelper } from "../../utils/authHelper";
import PermissionDenied from "../../utils/permission_denied";

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
      const canView = await AuthHelper.hasModulePermission("Books", "view");
      const canCreate = await AuthHelper.hasModulePermission("Books", "create");
      const canEdit = await AuthHelper.hasModulePermission("Books", "edit");
      const canDelete = await AuthHelper.hasModulePermission("Books", "delete");

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
  const { data, loading } = useDataManager(baseConfig.dataDependencies, props);
  console.log("Books Component - Data:", data);
  console.log("permissionsasddddddddddddddddddddd", permissions);
  if (permissions.loading || loading) {
    return <div>Loading...</div>;
  }
  console.log("permissions.canView", permissions);

  if (!permissions.canView) {
    return <PermissionDenied />;
  }

  const finalConfig = getBooksConfig(
    data,
    props,
    timeZone,
    {
      canCreate: permissions.canCreate,
      canEdit: permissions.canEdit,
      canDelete: permissions.canDelete
    }
  );

  return <DynamicCRUD {...finalConfig} icon="fa-solid fa-book" />;
};

export default Books;
