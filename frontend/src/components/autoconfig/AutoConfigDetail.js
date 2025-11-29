import React from "react";
import ModuleDetail from "../common/ModuleDetail";

const AutoConfigDetail = () => {
    const fields = {
        details: [
            { key: "table_name", label: "Table", type: "text" },
            { key: "prefix", label: "Prefix", type: "text" },
            { key: "digit_count", label: "Digit Count", type: "number" },
            { key: "next_number", label: "Next Number", type: "number" }
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
            moduleName="autoconfig"
            moduleApi="auto-config"
            moduleLabel="Auto Config"
            icon="fa-solid fa-gears"
            fields={fields}
        />
    );
};

export default AutoConfigDetail;

