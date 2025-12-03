import React from "react";
import ModuleDetail from "../common/ModuleDetail";

const UserRoleDetail = () => {
    const fields = {
        title: "role_name",
        details: [
            { key: "role_name", label: "Role Name", type: "text" },
            {
                key: "is_active",
                type: "toggle",
                badgeConfig: {
                    true: "success",
                    false: "secondary",
                    true_label: "Active",
                    false_label: "Inactive",
                },
            },
            { key: "createddate", label: "Created At", type: "date" },
            { key: "lastmodifieddate", label: "Updated At", type: "date" },
        ],
    };

    return (
        <ModuleDetail
            moduleName="userroles"
            moduleApi="user-role"
            moduleLabel="User Role Management"
            icon="fas fa-chalkboard-teacher"
            fields={fields}
        />
    );
};

export default UserRoleDetail;
