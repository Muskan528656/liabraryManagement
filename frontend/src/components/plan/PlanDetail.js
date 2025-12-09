import React from "react";
import ModuleDetail from "../common/ModuleDetail";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import { useTimeZone } from "../../contexts/TimeZoneContext";

const PlanDetail = () => {
    const { timeZone } = useTimeZone();

    const fields = {
        details: [
            { key: "plan_name", label: "Plan Name", type: "text" },
            { key: "duration_days", label: "Duration (Days)", type: "number" },
            { key: "allowed_books", label: "Allowed Books", type: "number" },
            { key: "is_active", label: "Active", type: "toggle" },
        ],
        other: [
            { key: "createdbyid", label: "Created By", type: "text" },
            { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },

            {
                key: "createddate",
                label: "Created Date",
                type: "date",
                render: (value) => convertToUserTimezone(value, timeZone),
            },

            {
                key: "lastmodifieddate",
                label: "Last Modified Date",
                type: "date",
                render: (value) => convertToUserTimezone(value, timeZone),
            },
        ],
    };

    return (
        <ModuleDetail
            moduleName="plans"          // API route
            moduleApi="plans"           // Table/API
            moduleLabel="Plan"          // Label
            icon="fa-solid fa-bars-progress"
            fields={fields}
        />
    );
};

export default PlanDetail;
