 
import { convertToUserTimezone } from "../../utils/convertTimeZone";

export const getCategoryConfig = (externalData = {}, timeZone) => {
    console.log("0898989qwer6tyui", timeZone)
    return {
        moduleName: "categories",
        moduleLabel: "Category",
        apiEndpoint: "category",
        initialFormData: {
            name: "",
            description: ""
        },
        columns: [
            {
                field: "name",
                label: "Name",
            },
            {
                field: "description",
                label: "Description",
                render: (value) => <span style={{ color: "#6c757d" }}>{value || '-'}</span>,
            }
        ],
        formFields: [
            {
                name: "name",
                label: "Name",
                type: "text",
                required: true,
                placeholder: "Enter category name",
                colSize: 12,
            },
            {
                name: "description",
                label: "Description",
                type: "textarea",
                rows: 3,
                placeholder: "Enter category description",
                colSize: 12,
            }
        ],
        validationRules: (formData, allCategories, editingCategory) => {
            const errors = [];
            if (!formData.name?.trim()) errors.push("Name is required");

 
            const duplicate = allCategories.find(
                category => category.name?.toLowerCase() === formData.name?.toLowerCase() &&
                    category.id !== editingCategory?.id
            );
            if (duplicate) errors.push("Category with this name already exists");

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
            { key: "name", label: "Category Name", type: "text" },
            { key: "description", label: "Description", type: "text" },
            { key: "created_at", label: "Created At", type: "date", render: (value) =>{  return convertToUserTimezone(value, timeZone) }},
            { key: "updated_at", label: "Updated At", type: "date", render: (value) =>{ return convertToUserTimezone(value, timeZone) }},
        ],
        customHandlers: {
            beforeSave: (formData, editingItem) => {
                return true;
            },
            afterSave: (response, editingItem) => {
              
                console.log("Category saved:", response);
            }
        }
    };
};