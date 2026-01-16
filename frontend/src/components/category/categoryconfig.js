
import React from "react";

import { createModel } from "../common/UniversalCSVXLSXImporter";

export const getCategoryConfig = (externalData = {}, props = {}, permissions = {}) => {


    const CategoryModel = createModel({
        modelName: "Category",
        fields: {
            "name": "Name",
            "description": "Description"
        },
        required: ["name"],
    });

    return {
        moduleName: "categories",
        moduleLabel: "Category",
        apiEndpoint: "category",


        importMatchFields: [],
        importModel: CategoryModel,

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
                colSize: 6,
            },
            {
                name: "description",
                label: "Description",
                type: "textarea",
                rows: 3,
                placeholder: "Enter category description",
                colSize: 6,
            }
        ],

        validationRules: (formData, allCategories, editingCategory) => {
            const errors = [];
            if (!formData.name?.trim()) errors.push("Category Name is required");

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
            allowEdit: permissions.canEdit || true,
            allowDelete: false,

            showImportButton: true,
        },
        details: [
            { key: "name", label: "Category Name", type: "text" },
            { key: "description", label: "Description", type: "text" },
            { key: "created_at", label: "Created At", type: "date" },
            { key: "updated_at", label: "Updated At", type: "date" },
        ],
        customHandlers: {
            beforeSave: (formData, editingItem) => {
                return true;
            },
            afterSave: (response, editingItem) => {

            }
        }
    };
};