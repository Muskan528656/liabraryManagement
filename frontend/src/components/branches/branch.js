import React from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getBranchConfig } from "./brancheConfig";
import PermissionDenied from "../../utils/permission_denied";
import { AuthHelper } from "../../utils/authHelper";

const Branch = ({ permissions, ...props }) => {

  const isSuperAdmin = AuthHelper.isSuperAdmin?.();

  console.log("Branch Component Permissions:", permissions?.allow);

  if (!isSuperAdmin && !permissions?.allowView) {
    return <PermissionDenied />;
  }

  const finalConfig = getBranchConfig({
    canCreate: permissions?.allowCreate,
    canEdit: permissions?.allowEdit,
    canDelete: permissions?.allowDelete
  });
  console.log("finalConfigfinalConfig", finalConfig);

  return (
    <DynamicCRUD
      {...finalConfig}
      icon="fa-solid fa-building"
      permissions={permissions}
    />
  );
};

export default Branch;