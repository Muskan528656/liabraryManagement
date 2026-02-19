import React from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getShelfConfig } from "../shelf/shelfConfig"
import PermissionDenied from "../../utils/permission_denied";
import { AuthHelper } from "../../utils/authHelper";

const Shelf = ({ permissions, ...props }) => {

    const isSuperAdmin = AuthHelper.isSuperAdmin?.();
    console.log("isSuperAdmin:", isSuperAdmin);
    console.log("permissions:", permissions);

    console.log("Shelf Component Permissions:", permissions?.allow);

    if (!isSuperAdmin && !permissions?.allowView) {
        return <PermissionDenied />;
    }

    const finalConfig = getShelfConfig(
        {},
        {},
        {
            allowEdit: permissions?.allowEdit,
            allowDelete: permissions?.allowDelete
        }
    );
    console.log("finalConfig", finalConfig)

    return (
        <DynamicCRUD
            {...finalConfig}
            icon="fa-solid fa-layer-group"
            permissions={permissions}
        />
    );
};

export default Shelf;
