export const getPermissionConfig = (modules = []) => {

    return {
        moduleName: "permissions",
        moduleLabel: "Permission",
        apiEndpoint: "permissions",

        formFields: [
            {
                name: "role_id",
                label: "User Role",
                type: "select",
                required: true,
                placeholder: "Select Role",
                options: "option",
                colSize: 12
            }
        ],

        permissionMatrix: {
            loadModulesFrom: "module",
            actions: ["allow_view", "allow_create", "allow_edit", "allow_delete"],
            labels: {
                allow_view: "View",
                allow_create: "Create",
                allow_edit: "Edit",
                allow_delete: "Delete"
            }
        },

        initialFormData: {
            role_id: "",
            permissions: []
        },

        validationRules: (formData) => {
            const errors = [];
            if (!formData.role_id) {
                errors.push("User Role is required");
            }
            return errors;
        },

        features: {
            showDetailView: true,
            showSearch: true,
            showColumnVisibility: true,
            allowDelete: true,
            allowEdit: true
        },

        columns: [
            {
                field: "module_id",
                label: "Module Name",
 
            },
            {
                field: "allow_view",
                label: "Allow View",
                render: (value) => (value ? "Yes" : "No")
            },
            {
                field: "allow_create",
                label: "Allow Create",
                render: (value) => (value ? "Yes" : "No")
            },
            {
                field: "allow_edit",
                label: "Allow Edit",
                render: (value) => (value ? "Yes" : "No")
            },
            {
                field: "allow_delete",
                label: "Allow Delete",
                render: (value) => (value ? "Yes" : "No")
            }
        ],

        details: [
 
            { key: "role_name", label: "Role", type: "text" },
            { key: "allow_view", label: "Allow View", type: "toggle-view" },
            { key: "allow_create", label: "Allow Create", type: "toggle-view" },
            { key: "allow_edit", label: "Allow Edit", type: "toggle-view" },
            { key: "allow_delete", label: "Allow Delete", type: "toggle-view" }
        ]
    };
};
