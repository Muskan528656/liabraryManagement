import React, { useState, useEffect } from "react";
import Loader from "../common/Loader";
import DynamicCRUD from "../common/DynaminCrud";
import { getAuthorConfig } from "./authorconfig";
import { useDataManager } from "../common/userdatamanager";
import { AuthHelper } from "../../utils/authHelper";
import PermissionDenied from "../../utils/permission_denied";
import "../../App.css";
const Author = (props) => {

  const [permissions, setPermissions] = useState({
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    loading: true
  });


  useEffect(() => {
    const fetchPermissions = async () => {

      const canView = await AuthHelper.hasModulePermission("Authors", "view");
      const canCreate = await AuthHelper.hasModulePermission("Authors", "create");
      const canEdit = await AuthHelper.hasModulePermission("Authors", "edit");
      const canDelete = await AuthHelper.hasModulePermission("Authors", "delete");

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

  const baseConfig = getAuthorConfig({
    canCreate: permissions.canCreate,
    canEdit: permissions.canEdit,
    canDelete: permissions.canDelete
  });

  const { data, loading: dataLoading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );

  if (permissions.loading || dataLoading) {
    return <Loader message="Loading..." />;
  }

  if (!permissions.canView) {
    return <PermissionDenied />;
  }
  if (error) {
    return (
      <div className="alert alert-danger">
        <h4>Error Loading Authors</h4>
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
    ...props
  };

  const finalConfig = getAuthorConfig(
    allData,
    {
      canCreate: permissions.canCreate,
      canEdit: permissions.canEdit,
      canDelete: permissions.canDelete
    }
  );

  return (
    <DynamicCRUD
      {...finalConfig}
      icon="fa-solid fa-user-pen"
      permissions={permissions}
    />
  );
};

export default Author;