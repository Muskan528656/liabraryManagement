import { Badge } from "react-bootstrap";

// config/userRoleConfig.js
export const getUserRoleConfig = (externalData = {}, props = {}) => {
    return {
        moduleName: "user_roles",
        moduleLabel: "User Role",
        apiEndpoint: "user-role",

        initialFormData: {
            role_name: "",
            is_active: true,
        },

        columns: [
            {
                field: "role_name",
                label: "Role Name",
            },
            {
                field: "is_active",
                label: "Active",
                render: (value) => (
                    <span style={{ color: value ? "green" : "red" }}>
                        {value ? "Active" : "Inactive"}
                    </span>
                ),

                  render: (value) => (
                <Badge bg={value ? "success" : "secondary"}>
                    {value ? "Active" : "Inactive"}
                </Badge>
            )
            
            }
        ],

        formFields: [
            {
                name: "role_name",
                label: "Role Name",
                type: "text",
                required: true,
                placeholder: "Enter role name",
                colSize: 12,
            },
            {
                name: "is_active",
                label: "Is Active?",
                type: "checkbox",
                colSize: 12,
            }
        ],

        validationRules: (formData, allRoles, editingRole) => {
            const errors = [];
            if (!formData.role_name?.trim()) errors.push("Role Name is required");

            const duplicate = allRoles.find(
                r =>
                    r.role_name?.toLowerCase() === formData.role_name?.toLowerCase() &&
                    r.id !== editingRole?.id
            );
            if (duplicate) errors.push("Role with this name already exists");

            return errors;
        },

        dataDependencies: {},

        features: {
            showBulkInsert: false,
            showImportExport: true,
            showDetailView: true,
            showSearch: true,
            showColumnVisibility: true,
            showCheckbox: true,
            showActions: true,
            showAddButton: true,
            allowEdit: true,
            allowDelete: true
        },

        details: [
            { key: "role_name", label: "Role Name", type: "text" },
            { key: "is_active", label: "Active Status", type: "text" },
            { key: "createddate", label: "Created At", type: "date" },
            { key: "lastmodifieddate", label: "Updated At", type: "date" },
        ],

        customHandlers: {
            beforeSave: (formData, editingItem) => {
                return true;
            },
            afterSave: (response, editingItem) => {
                console.log("User Role saved:", response);
            }
        }
    };
};
