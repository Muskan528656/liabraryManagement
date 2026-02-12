import { createModel } from "../common/UniversalCSVXLSXImporter";

export const getBranchConfig = (externalData = {}, props = {}, permissions = {}) => {

    console.log("externalData in getBranchConfig check:", externalData);

    const BranchModel = createModel({
        modelName: "Branch",
        fields: {
            branch_code: "Branch Code",
            branch_name: "Branch Name",
            address_line1: "Address",
            city: "City",
            state: "State",
            country: "Country",
            pincode: "Pincode",
            is_active: "Status"
        },
        required: ["branch_code", "branch_name", "country"]
    });

    return {
        moduleName: "branches",
        moduleLabel: "Branch",
        apiEndpoint: "branches",
        importMatchFields: ["branch_code"],

        initialFormData: {
            branch_code: "",
            branch_name: "",
            address_line1: "",
            city: "",
            state: "",
            country: "India",
            pincode: "",
            is_active: true
        },

        columns: [
            { field: "branch_name", label: "Branch Name" },
            { field: "branch_code", label: "Branch Code" },
            { field: "city", label: "City" },
            { field: "state", label: "State" },
            { field: "country", label: "Country" },
            { field: "pincode", label: "Pincode" },
            {
                field: "is_active",
                label: "Status",
                render: (value) => value ? "Active" : "Inactive"
            }
        ],

        formFields: [
            {
                name: "branch_code",
                label: "Branch Code",
                type: "text",
                required: true,
                placeholder: "Enter branch code",
                colSize: 6,
                helpText: "Unique code for the branch",
                disabled: (mode) => mode === "edit"
            },
            {
                name: "branch_name",
                label: "Branch Name",
                type: "text",
                required: true,
                placeholder: "Enter branch name",
                colSize: 6,
            },
            {
                name: "address_line1",
                label: "Address Line 1",
                type: "textarea",
                placeholder: "Enter street address",
                colSize: 12,
                rows: 2
            },
            {
                name: "city",
                label: "City",
                type: "text",
                placeholder: "Enter city",
                colSize: 6,
            },
            {
                name: "state",
                label: "State",
                type: "text",
                placeholder: "Enter state",
                colSize: 6,
            },
            {
                name: "country",
                label: "Country",
                type: "select",
                required: true,
                options: [
                    { value: "India", label: "India" },
                    { value: "USA", label: "USA" },
                    { value: "UK", label: "UK" },
                    { value: "UAE", label: "UAE" },
                    { value: "Canada", label: "Canada" },
                    { value: "Australia", label: "Australia" }
                ],
                defaultValue: "India",
                colSize: 6,
            },
            {
                name: "pincode",
                label: "Pincode",
                type: "text",
                placeholder: "Enter pincode",
                colSize: 6,
            },
            {
                name: "is_active",
                label: "Active Status",
                type: "switch",
                defaultValue: true,
                colSize: 12,
                helpText: "Inactive branches won't appear in selection lists"
            }
        ],

        validationRules: (formData, allBranches, editingBranch) => {
            const errors = [];

            if (!formData.branch_code?.trim()) {
                errors.push("Branch code is required");
            } else if (formData.branch_code.length < 2) {
                errors.push("Branch code must be at least 2 characters");
            } else if (formData.branch_code.length > 20) {
                errors.push("Branch code must be less than 20 characters");
            } else if (!/^[A-Z0-9]+$/.test(formData.branch_code)) {
                errors.push("Branch code must contain only uppercase letters and numbers");
            }

            if (!formData.branch_name?.trim()) {
                errors.push("Branch name is required");
            } else if (formData.branch_name.length < 3) {
                errors.push("Branch name must be at least 3 characters");
            } else if (formData.branch_name.length > 150) {
                errors.push("Branch name must be less than 150 characters");
            }

            if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
                errors.push("Pincode must be 6 digits");
            }

            if (!formData.country) {
                errors.push("Country is required");
            }
            if (formData.branch_code) {
                const duplicate = allBranches?.find(
                    branch => branch.branch_code === formData.branch_code && branch.id !== editingBranch?.id
                );
                if (duplicate) {
                    errors.push("Branch with this code already exists");
                }
            }

            return errors;
        },



        features: {
            showBulkInsert: false,
            showImportExport: true,
            showDetailView: true,
            showSearch: true,
            showColumnVisibility: true,
            showCheckbox: true,
            showActions: true,
            showAddButton: true,
            allowEdit: permissions.allowEdit || true,
            allowDelete: permissions.allowDelete || false,
            showImportButton: true,
            showAdvancedFilter: true,
            permissions: permissions,
        },

        filterFields: [
            {
                name: "branch_name",
                label: "Branch Name",
                type: "text",
            },
            {
                name: "branch_code",
                label: "Branch Code",
                type: "text",
            },
            {
                name: "city",
                label: "City",
                type: "text",
            },
            {
                name: "country",
                label: "Country",
                type: "select",
                options: [
                    { value: "India", label: "India" },
                    { value: "USA", label: "USA" },
                    { value: "UK", label: "UK" },
                    { value: "UAE", label: "UAE" }
                ]
            },
            {
                name: "is_active",
                label: "Status",
                type: "select",
                options: [
                    { value: "true", label: "Active" },
                    { value: "false", label: "Inactive" }
                ]
            }
        ],


        importModel: BranchModel
    };
};