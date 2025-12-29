

import moment from 'moment';
import { Badge } from "react-bootstrap";
import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";
import { createModel } from "../common/UniversalCSVXLSXImporter";

export const getUserRoleConfig = (externalData = {}, props = {}) => {

    const countryCodeOptions = externalData.countryCodeList && externalData.countryCodeList.length > 0
        ? externalData.countryCodeList.map(item => ({
            value: item.id,
            label: item.name
        }))
        : COUNTRY_CODES.map(item => ({
            value: item.country_code,
            label: `${item.country} (${item.country_code})`
        }));

    const UserRoleModel = createModel({
        modelName: "UserRole",
        fields: {
            "role_name": "Role Name",
            "is_active": "Status"
        },
        required: ["role_name"],
    });

    return {
        moduleName: "user_roles",
        moduleLabel: " Role",
        apiEndpoint: "user-role",
        importMatchFields: [],
        importModel: UserRoleModel,

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
                name: "is_active", // Changed key to name to be consistent with other modules
                label: "Status",
                type: "toggle",
                colSize: 12,
                options: [
                    { value: true, label: "Active" },
                    { value: false, label: "Inactive" }
                ]
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
            allowDelete: false,
            showImportButton: true,
        },

        customHandlers: {
            beforeSave: (formData, editingItem) => {
                return true;
            },
            afterSave: (response, editingItem) => {
 
            },
            onDataLoad: (data) => {
                if (Array.isArray(data)) {
                    return data.map(item => ({
                        ...item,
                        is_active: item.is_active === "Active" || item.is_active === "true" || item.is_active === true
                    }));
                }
                return data;
            }
        }
    };
};