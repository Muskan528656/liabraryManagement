import React from "react";

const formatPreview = (record = {}) => {
    const prefix = record.prefix || "";
    const digits = Number.isInteger(record.digit_count) ? record.digit_count : 0;
    const next = (record.next_number || "1").toString();
    return `${prefix}${digits > 0 ? next.padStart(digits, "0") : next}`;
};

export const getAutoConfigConfig = () => {
    return {
        moduleName: "autoconfig",
        moduleLabel: "Auto Config",
        apiEndpoint: "auto-config",
        initialFormData: {
            table_name: "",
            prefix: "",
            digit_count: 4,
            next_number: "1"
        },
        columns: [
            {
                field: "table_name",
                label: "Table Name",
                render: (value) => <span className="text-uppercase fw-semibold">{value}</span>
            },
            {
                field: "prefix",
                label: "Prefix",
                render: (value) => value || "—"
            },
            {
                field: "digit_count",
                label: "Digits"
            },
            {
                field: "next_number",
                label: "Next Number"
            },
            {
                field: "preview",
                label: "Preview",
                render: (_, record) => (
                    <span className="badge bg-light text-dark">
                        {formatPreview(record)}
                    </span>
                )
            }
        ],
        formFields: [
            {
                name: "table_name",
                label: "Table Name",
                type: "text",
                required: true,
                placeholder: "e.g. purchases, library_members",
                helpText: "Use lowercase table names without schema prefix",
                colSize: 12
            },
            {
                name: "prefix",
                label: "Prefix",
                type: "text",
                placeholder: "e.g. PUR-",
                maxLength: 10,
                helpText: "Optional text shown before the running number",
                colSize: 6
            },
            {
                name: "digit_count",
                label: "Digit Count",
                type: "number",
                min: 0,
                required: true,
                placeholder: "5",
                helpText: "How many digits to pad the number with",
                colSize: 3
            },
            {
                name: "next_number",
                label: "Next Number",
                type: "number",
                min: 1,
                required: true,
                placeholder: "1",
                helpText: "The next number that will be issued",
                colSize: 3
            }
        ],
        validationRules: (formData, allRecords, editingItem) => {
            const errors = [];
            const trimmedName = formData.table_name?.trim();
            if (!trimmedName) {
                errors.push("Table name is required");
            } else if (!/^[a-z0-9_]+$/i.test(trimmedName)) {
                errors.push("Table name can only contain letters, numbers or underscore");
            }

            const duplicate = allRecords.find(
                (record) =>
                    record.table_name?.toLowerCase() === trimmedName?.toLowerCase() &&
                    record.id !== editingItem?.id
            );
            if (duplicate) {
                errors.push("Auto config already exists for this table");
            }

            if (formData.digit_count < 0) {
                errors.push("Digit count cannot be negative");
            }

            if (formData.next_number && Number(formData.next_number) < 1) {
                errors.push("Next number must be greater than zero");
            }

            return errors;
        },
        features: {
            showBulkInsert: false,
            showImportExport: false,
            showDetailView: true,
            showSearch: true,
            showColumnVisibility: true,
            showCheckbox: false,
            allowDelete: true,
            allowEdit: true
        },
        details: [
            { key: "table_name", label: "Table", type: "text" },
            { key: "prefix", label: "Prefix", type: "text" },
            { key: "digit_count", label: "Digit Count", type: "number" },
            { key: "next_number", label: "Next Number", type: "number" }
        ],
        customHandlers: {
            beforeSave: (formData) => {
                if (formData.table_name) {
                    formData.table_name = formData.table_name.trim().toLowerCase();
                }
                if (formData.next_number !== undefined && formData.next_number !== null) {
                    formData.next_number = formData.next_number.toString();
                }
                return true;
            }
        }
    };
};

