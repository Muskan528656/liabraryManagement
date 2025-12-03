import moment from 'moment';
import { Badge } from "react-bootstrap";
import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";
export const getUserRoleConfig = (externalData = {}, props = {}) => {
    // Get country code options from props or fallback to local JSON
    const countryCodeOptions = externalData.countryCodeList && externalData.countryCodeList.length > 0 
        ? externalData.countryCodeList.map(item => ({
            value: item.id,
            label: item.name
          }))
        : COUNTRY_CODES.map(item => ({
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
                    const country = COUNTRY_CODES.find(c => c.country_code === value);
                    return country ? `${country.country} (${country.country_code})` : value;
                }
            },
         {
                field: "is_active",
                label: "Status",
                sortable: true,
                render: (value) => {
                    const statusValue =
                        value || (typeof value === "boolean" ? (value ? "active" : "inactive") : "inactive");

                    return (
                        <Badge bg={statusValue === "active" || statusValue === true ? "success" : "secondary"}>
                            {statusValue === "active" || statusValue === true ? "Active" : "Inactive"}
                        </Badge>
                    );
                }
            },

            {
                field: "createddate",
                label: "Created Date",

                render: (value) => {
                    return moment(value).format('DD/MM/YYYY');

                },
            },
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
                key: "is_active",
                label: "Status",
                type: "toggle",
                badgeConfig: {
                    true: "success",
                    false: "secondary",
                    true_label: "Active",
                    false_label: "Inactive",
                },
            },
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