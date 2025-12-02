import React from "react";

const convertUTCToTZ = (utcDate, tz) => {
    if (!utcDate) return "";
    try {
        return new Date(utcDate).toLocaleString("en-US", {
            timeZone: tz,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    } catch (e) {
        return utcDate;
    }
};

const convertTZToUTC = (localDate, tz) => {
    if (!localDate) return null;
    try {
        const date = new Date(localDate);
        const utcStr = date.toLocaleString("en-US", { timeZone: tz });
        const utcDate = new Date(utcStr);
        return utcDate.toISOString();
    } catch (e) {
        return localDate;
    }
};


export const subscriptionDataDependencies = {
    company: "company",
};

const statusBadge = (value) => (
    <span className={`badge ${value ? "bg-success" : "bg-secondary"}`}>
        {value ? "Active" : "Inactive"}
    </span>
);


export const getSubscriptionConfig = (externalData = {}, allowedBooks = 10) => {
    const companies = externalData?.company || [];

    const COMPANY_TIMEZONE =
        companies.length > 0 && companies[0].time_zone
            ? companies[0].time_zone
            : "America/New_York";

    return {
        moduleName: "subscriptions",
        moduleLabel: "Subscription",
        apiEndpoint: "subscriptions",

        initialFormData: {
            renewal: "",
            plan_name: "",
            start_date: "",
            end_date: "",
            allowed_books: allowedBooks,
            status: "active",
        },

        columns: [
            { field: "plan_name", label: "Plan Name" },
            { field: "renewal", label: "Renewal" },
            { field: "start_date_display", label: "Start Date" },
            { field: "end_date_display", label: "End Date" },
            {
                field: "allowed_books",
                label: "Allowed Books",
                render: (value) => value || "—",
            },
            {
                field: "status",
                label: "Status",
                render: (value) => {
                    const statusValue =
                        value || (typeof value === "boolean" ? (value ? "active" : "inactive") : "inactive");
                    return statusBadge(statusValue === "active" || statusValue === true);
                },
            },
        ],

        formFields: [
            {
                name: "plan_name",
                label: "Plan Name",
                type: "text",
                required: true,
                placeholder: "Enter plan name",
                colSize: 12,
            },
            {
                name: "allowed_books",
                label: "Allowed Books",
                type: "number",
                min: 0,
                defaultValue: allowedBooks,
                disabled: true,
                placeholder: "Number of books allowed",
                colSize: 6,
            },
            {
                name: "start_date",
                label: "Start Date",
                type: "date",
                required: true,
                colSize: 6,
            },
            {
                name: "end_date",
                label: "End Date",
                type: "date",
                colSize: 6,
                helpText: "Keep empty for never ending plans",
            },
            {
                name: "renewal",
                label: "Renewal",
                type: "text",
                colSize: 6,
                helpText: "Keep empty for never ending plans",
            },
             {
                name: "status",
                label: "Status",
                type: "toggle",
                options: [
                    { value: true, label: "Active" },
                    { value: false, label: "Inactive" }
                ],
                colSize: 6,
            }
        ],

        validationRules: (formData) => {
            const errors = [];
            if (!formData.plan_name?.trim()) errors.push("Plan name is required");
            if (!formData.start_date) errors.push("Start date is required");
            if (
                formData.start_date &&
                formData.end_date &&
                new Date(formData.end_date) < new Date(formData.start_date)
            )
                errors.push("End date cannot be before start date");
            if (formData.allowed_books && Number(formData.allowed_books) < 0)
                errors.push("Allowed books must be positive");
            return errors;
        },

        features: {
            showBulkInsert: false,
            showImportExport: true,
            showDetailView: true,
            showSearch: true,
            showColumnVisibility: true,
            showCheckbox: true,
            allowDelete: false,
            allowEdit: true,
        },


        details: [
            { key: "plan_name", label: "Plan Name" },
            { key: "allowed_books", label: "Allowed Books", disabled: true },
            { key: "start_date_display", label: "Start Date" },
            { key: "end_date_display", label: "End Date" },
            { key: "status", label: "Status" },
        ],

        customHandlers: {
            beforeSave: (formData) => {
                formData.start_date = convertTZToUTC(formData.start_date, COMPANY_TIMEZONE);
                formData.end_date = convertTZToUTC(formData.end_date, COMPANY_TIMEZONE);

                if (formData.plan_name === "") formData.plan_name = null;
                if (formData.allowed_books === "") formData.allowed_books = null;

                if (formData.status) {
                    formData.is_active = formData.status === "active";
                    delete formData.status;
                }

                return true;
            },

            onDataLoad: (data) => {
                if (Array.isArray(data)) {
                    data.forEach((item) => {
                        item.start_date_display = item.start_date
                            ? convertUTCToTZ(item.start_date, COMPANY_TIMEZONE) + ` (${COMPANY_TIMEZONE})`
                            : "";

                        item.end_date_display = item.end_date
                            ? convertUTCToTZ(item.end_date, COMPANY_TIMEZONE) + ` (${COMPANY_TIMEZONE})`
                            : "";

                        if (item.hasOwnProperty("is_active")) {
                            item.status = item.is_active ? "active" : "inactive";
                        }
                    });
                } else if (data && typeof data === "object") {
                    data.start_date_display = data.start_date
                        ? convertUTCToTZ(data.start_date, COMPANY_TIMEZONE) + ` (${COMPANY_TIMEZONE})`
                        : "";

                    data.end_date_display = data.end_date
                        ? convertUTCToTZ(data.end_date, COMPANY_TIMEZONE) + ` (${COMPANY_TIMEZONE})`
                        : "";

                    if (data.hasOwnProperty("is_active")) {
                        data.status = data.is_active ? "active" : "inactive";
                    }

                    if (!data.plan_name) data.plan_name = "";
                    if (!data.allowed_books) data.allowed_books = "";
                }
            },
        },
    };
};
