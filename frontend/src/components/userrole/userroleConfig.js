import { Badge } from "react-bootstrap";
import Switch from "@mui/material/Switch";
import CountryCode from '../../constants/CountryCode.json';

// config/userRoleConfig.js
export const getUserRoleConfig = (externalData = {}, props = {}) => {
    // Get country code options from props or fallback to local JSON
    const countryCodeOptions = externalData.countryCodeList && externalData.countryCodeList.length > 0 
        ? externalData.countryCodeList.map(item => ({
            value: item.id,
            label: item.name
          }))
        : CountryCode.map(item => ({
            value: item.country_code,
            label: `${item.country} (${item.country_code})`
          }));

    return {
        moduleName: "user_roles",
        moduleLabel: "User Role",
        apiEndpoint: "user-role",

        initialFormData: {
            role_name: "",
            is_active: true,
            country_code: "",
        },

        columns: [
            {
                field: "role_name",
                label: "Role Name",
            },
            {
                field: "country_code",
                label: "Country Code",
                render: (value) => {
                    if (!value) return "—";
                    const country = CountryCode.find(c => c.country_code === value);
                    return country ? `${country.country} (${country.country_code})` : value;
                }
            },
         {
                field: "is_active",
                label: "Active",
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
                name: "country_code",
                label: "Country Code",
                type: "select",
                required: false,
                placeholder: "Select country code",
                colSize: 12,
                options: countryCodeOptions
            },
            {
                name: "is_active",
                label: "is_Active",
                type: "toggle",
                colSize: 12,
                helpText: "Toggle to enable or disable this role"
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

        // details: [
        //     { key: "role_name", label: "Role Name", type: "text" },
        //     { key: "is_active", label: "Active Status", type: "text"  },
        //     { key: "createddate", label: "Created At", type: "date"  },
        //     { key: "lastmodifieddate", label: "Updated At", type: "date" },
        // ],

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
