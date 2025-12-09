import React from "react";
import ModuleDetail from "../common/ModuleDetail";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import { useTimeZone } from "../../contexts/TimeZoneContext";
const UserRoleDetail = () => {
    const { timeZone } = useTimeZone()
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
            {
                key: "createddate", label: "Created Date", type: "date", render: (value) => {
                    return convertToUserTimezone(value, timeZone)
                },
            },
            {
                key: "lastmodifieddate", label: "Last Modified Date", type: "date", render: (value) => {
                    return convertToUserTimezone(value, timeZone)
                },
            },
        ],
    };

    return (
        <ModuleDetail
            moduleName="userroles"
            moduleApi="user-role"
            moduleLabel="User Role"
            icon="fas fa-chalkboard-teacher"
            fields={fields}
        />
    );
};

export default UserRoleDetail;
