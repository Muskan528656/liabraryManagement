import React from "react";
import ModuleDetail from "../common/ModuleDetail";

const UserRoleDetail = () => {
    const fields = {
        title: "role_name",
        overview: [
            { key: "role_name", label: "Role Name", type: "text" },
        ],
        details: [
            { key: "role_name", label: "Role Name", type: "text" },
            { key: "is_active", label: "Active Status", type: "text" },
            { key: "createddate", label: "Created At", type: "date" },
            { key: "lastmodifieddate", label: "Updated At", type: "date" },
        ],
    };

    return (
        <ModuleDetail
            moduleName="user-role"
            moduleApi="user-role"
            moduleLabel="User Role"
            fields={fields}
        />
    );
};

export default UserRoleDetail;
