import React from "react";

const renderFlag = (value) => (
    <span className={`badge ${value ? "bg-success" : "bg-secondary"}`}>
        {value ? "Yes" : "No"}
    </span>
);

export const getPermissionConfig = () => {
    return {
        moduleName: "permissions",
        moduleLabel: "Permission",
        apiEndpoint: "permissions",
        initialFormData: {
            module_id: "",
            allow_view: false,
            allow_create: false,
            allow_edit: false,
            allow_delete: false,
            status: "active"
        },
        columns: [
            {
                field: "module_name",
                label: "Module",
                render: (value) => value || "—"
            },
            {
                field: "allow_view",
                label: "View",
                render: renderFlag
            },
            {
                field: "allow_create",
                label: "Create",
                render: renderFlag
            },
            {
                field: "allow_edit",
                label: "Edit",
                render: renderFlag
            },
            {
                field: "allow_delete",
                label: "Delete",
                render: renderFlag
            },
            {
                field: "status",
                label: "Status",
                render: (value) => {
                    const statusValue = value || 'inactive';
                    return (
                        <span className={`badge ${statusValue === 'active' ? "bg-success" : "bg-secondary"}`}>
                            {statusValue === 'active' ? "Active" : "Inactive"}
                        </span>
                    );
                }
            }
        ],
        formFields: [
            {
                name: "module_id",
                label: "Module",
                type: "select",
                required: true,
                placeholder: "Select module",
                options: "module",
                colSize: 6
            },
            {
                name: "module_id",
                label: "Module",
                type: "select",
                required: true,
                placeholder: "Select User Role",
                options: "userrole",
                colSize: 6
            },
            {
                name: "allow_view",
                label: "Allow View",
                type: "checkbox",
                colSize: 3
            },
            {
                name: "allow_create",
                label: "Allow Create",
                type: "checkbox",
                colSize: 3
            },
            {
                name: "allow_edit",
                label: "Allow Edit",
                type: "checkbox",
                colSize: 3
            },
            {
                name: "allow_delete",
                label: "Allow Delete",
                type: "checkbox",
                colSize: 3
            },
            {
                name: "status",
                label: "Status",
                type: "select",
                required: true,
                options: [
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" }
                ],
                colSize: 6
            }
        ],
        validationRules: (formData, allPermissions, editingItem) => {
            const errors = [];
            if (!formData.module_id) {
                errors.push("Module is required");
            }
            const duplicate = allPermissions.find(
                (permission) =>
                    permission.module_id === formData.module_id &&
                    permission.id !== editingItem?.id
            );
            if (duplicate) {
                errors.push("Permissions for this module already exist");
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
            { key: "module_name", label: "Module", type: "text" },
            { key: "allow_view", label: "Allow View", type: "boolean" },
            { key: "allow_create", label: "Allow Create", type: "boolean" },
            { key: "allow_edit", label: "Allow Edit", type: "boolean" },
            { key: "allow_delete", label: "Allow Delete", type: "boolean" }
        ]
    };
};
