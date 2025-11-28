import React from "react";
import ModuleDetail from "../common/ModuleDetail";
import CountryCode from '../../constants/CountryCode.json';

const UserRoleDetail = () => {
    const fields = {
        title: "role_name",
        details: [
            { key: "role_name", label: "Role Name", type: "text" },
            {
                key: "country_code",
                label: "Country Code",
                type: "select",
                options: CountryCode.map(item => ({
                    id: item.country_code,
                    name: `${item.country} (${item.country_code})`
                }))
            },
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
            moduleName="user-role"
            moduleApi="user-role"
            moduleLabel="User Role Management"
            icon="fas fa-chalkboard-teacher"
            fields={fields}
        />
    );
};

export default UserRoleDetail;
