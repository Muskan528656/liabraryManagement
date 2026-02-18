import React from "react";
import ModuleDetail from "../common/ModuleDetail";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import { useTimeZone } from "../../contexts/TimeZoneContext";

const PlanDetail = ({ permissions }) => {
    const { timeZone } = useTimeZone();

    const fields = {
        validationRules: (formData) => {
            const errors = [];
            if (!formData.plan_name?.trim()) errors.push("Plan name is required");
            if (!formData.duration_days || formData.duration_days <= 0) errors.push("Duration must be a positive number");
            if (!formData.max_allowed_books_at_time || formData.max_allowed_books_at_time <= 0) errors.push("Max books at a time must be at least 1");
            if (!formData.allowed_books || formData.allowed_books <= 0) errors.push("Total allowed books must be at least 1");


            if (formData.max_allowed_books_at_time > formData.allowed_books) {
                errors.push("Max books allowed at a time cannot be greater than total allowed books");
            }

            return errors;
        },
        details: [
            { key: "plan_name", label: "Plan Name", type: "text" ,required: true},
            { key: "duration_days", label: "Duration (Days)", type: "number",required: true },
            { key: "max_allowed_books_at_time", label: "Max Allowed Books At Time", type: "number" },
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
            moduleName="plans"
            moduleApi="plans"
            moduleLabel="Plan"
            icon="fa-solid fa-bars-progress"
            fields={fields}
            permissions={permissions || {}}
        />
    );
};

export default PlanDetail;
