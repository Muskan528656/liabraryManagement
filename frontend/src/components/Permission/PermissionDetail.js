import React from "react";
import ModuleDetail from "../common/ModuleDetail";

const PermissionDetail = () => {
    const fields = {
        overview: [
            { key: "module_name", label: "Module", type: "text" },
            { key: "module_api_name", label: "API Name", type: "text" }
        ],
        details: [
            { key: "allow_view", label: "Allow View", type: "boolean" },
            { key: "allow_create", label: "Allow Create", type: "boolean" },
            { key: "allow_edit", label: "Allow Edit", type: "boolean" },
            { key: "allow_delete", label: "Allow Delete", type: "boolean" }
        ],
        other: [
            { key: "createdbyid", label: "Created By", type: "text" },
            { key: "createddate", label: "Created Date", type: "date" },
            { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },
            { key: "lastmodifieddate", label: "Last Modified Date", type: "date" }
        ]
    };

    return (
        <ModuleDetail
            moduleName="permissions"
            moduleApi="permissions"
            moduleLabel="Permission"
            icon="fa-solid fa-lock"
            fields={fields}
        />
    );
};

export default PermissionDetail;

