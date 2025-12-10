import React from "react";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import DataApi from "../../api/dataApi";

export const planDataDependencies = {
    company: "company",
};

const statusBadge = (value) => (
    <span className={`badge ${value ? "bg-success" : "bg-secondary"}`}>
        {value ? "Active" : "Inactive"}
    </span>
);

export const getPlanConfig = async (externalData = {}, allowedBooks, timeZone) => {
    const SettingApi = new DataApi("librarysettings");
    let SettingResponse;

    try {
        SettingResponse = await SettingApi.fetchAll();
        console.log("Plans API Response:", SettingResponse);
    } catch (err) {
        console.error("Error fetching library settings:", err);
        SettingResponse = { success: false, data: [] };
    }

    let maxBooksDefault = 0;

    if (SettingResponse.success && Array.isArray(SettingResponse.data) && SettingResponse.data.length > 0) {
        const settingItem = SettingResponse.data[0];
        if (settingItem?.max_books !== undefined && settingItem?.max_books !== null) {
            maxBooksDefault = Number(settingItem.max_books);
        }
    }

    return {
        moduleName: "plan",
        moduleLabel: "Plan",
        apiEndpoint: "plans",

        initialFormData: {
            plan_name: "",
            duration_days: "",
            allowed_books: allowedBooks,
            is_active: true,
        },

        columns: [
            { field: "plan_name", label: "Plan Name" },
            { field: "duration_days", label: "Duration", render: (value) => `${value} Days` },
            { field: "allowed_books", label: "Allowed Books" },
            {
                name: "allowed_books",
                label: "Allowed Books",
                type: "select",
                placeholder: "Select allowed books",
                colSize: 6,
            },
            { field: "is_active", label: "Status", render: (value) => statusBadge(value === true) },
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
                name: "duration_days",
                label: "Duration (Days)",
                type: "number",
                min: 1,
                defaultValue: "",
                required: true,
                placeholder: "Enter duration in days",
                colSize: 6,
            },
            {
                name: "allowed_books",
                label: "Allowed Books",
                type: "number",
                min: 0,
                defaultValue: allowedBooks,
                placeholder: "Enter number of allowed books",
                colSize: 6,
            },
            {
                name: "is_active",
                label: "Status",
                type: "toggle",
                options: [
                    { value: true, label: "Active" },
                    { value: false, label: "Inactive" },
                ],
                colSize: 6,
            },
        ],

        validationRules: (formData) => {
            const errors = [];
            if (!formData.plan_name?.trim()) errors.push("Plan name is required");
            if (!formData.duration_days || formData.duration_days <= 0) errors.push("Duration must be a positive number");
            if (formData.allowed_books < 0) errors.push("Allowed books cannot be negative");
            return errors;
        },

        features: {
            showBulkInsert: false,
            showImportExport: false,
            showDetailView: true,
            showSearch: true,
            showColumnVisibility: true,
            showCheckbox: true,
            allowDelete: true,
            allowEdit: true,
        },

        details: [
            { key: "plan_name", label: "Plan Name" },
            { key: "duration_days", label: "Duration (Days)" },
            { key: "allowed_books", label: "Allowed Books" },
            { key: "is_active", label: "Status", render: (value) => (value ? "Active" : "Inactive") },
            { key: "createdbyid", label: "Created By" },
            { key: "createddate", label: "Created Date", render: (value) => convertToUserTimezone(value, timeZone) },
            { key: "lastmodifiedbyid", label: "Last Modified By" },
            { key: "lastmodifieddate", label: "Last Modified", render: (value) => (value ? convertToUserTimezone(value, timeZone) : "—") },
        ],

        customHandlers: {
            beforeSave: (formData) => {
                if (formData.plan_name === "") formData.plan_name = null;
                if (formData.duration_days === "") formData.duration_days = null;
                if (formData.allowed_books === "") formData.allowed_books = maxBooksDefault;
                formData.is_active = Boolean(formData.is_active);
                return true;
            },

            onDataLoad: (data) => {
                const processItem = (item) => {
                    item.is_active = item.is_active === true || item.is_active === "true" || item.is_active === 1;
                    item.allowed_books = item.allowed_books ?? maxBooksDefault;
                    item.plan_name = item.plan_name || "";
                    item.duration_days = item.duration_days || "";
                };

                if (Array.isArray(data)) data.forEach(processItem);
                else if (data && typeof data === "object") processItem(data);
            },

            beforeEdit: (item) => ({
                ...item,
                is_active: Boolean(item.is_active),
                allowed_books: item.allowed_books ?? maxBooksDefault,
            }),
        },
    };
};
