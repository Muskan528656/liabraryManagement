import React from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getShelfConfig } from "../shelf/shelfConfig"
import PermissionDenied from "../../utils/permission_denied";
import { AuthHelper } from "../../utils/authHelper";

const Shelf = ({ permissions, ...props }) => {



    const isSuperAdmin = AuthHelper.isSuperAdmin?.();

    console.log("Shelf Component Permissions:", permissions?.allow);

    if (!isSuperAdmin && !permissions?.allowView) {
        return <PermissionDenied />;
    }

    const finalConfig = getShelfConfig({
        canCreate: permissions?.allowCreate,
        canEdit: permissions?.allowEdit,
        canDelete: permissions?.allowDelete
    });
    console.log("finalConfigfinalConfig", finalConfig)

    return (
        <DynamicCRUD
            {...finalConfig}
            icon="fa-solid fa-layer-group"
            permissions={permissions}
        />
    );
};

export default Shelf;
