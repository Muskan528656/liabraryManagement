import React from "react";
import ModuleDetail from "../common/ModuleDetail";

const SubscriptionDetail = () => {
    const fields = {
        details: [
            { key: "plan_name", label: "Plan Name", type: "text" },
            { key: "allowed_books", label: "Allowed Books", type: "number", disabled: true },
            { key: "is_active", label: "Active", type: "toggle" },
            { key: "start_date", label: "Start Date", type: "date" },
            { key: "end_date", label: "End Date", type: "date" },
            { key: "renewal", label: "Renewal", type: "text" }
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
            moduleName="subscriptions"
            moduleApi="subscriptions"
            moduleLabel="Subscription"
            icon="fa-solid fa-id-card"
            fields={fields}
        />
    );
};

export default SubscriptionDetail;

