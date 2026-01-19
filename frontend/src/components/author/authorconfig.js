
import React from "react";

import { createModel } from "../common/UniversalCSVXLSXImporter";

export const getAuthorConfig = (externalData = {}, props = {}, permissions = {}) => {


    const AuthorModel = createModel({
        modelName: "Author",
        fields: {
            "name": "Name",
            "email": "Email",
            "bio": "Bio"
        },
        required: ["name"],
    });

    return {
        moduleName: "authors",
        moduleLabel: "Author",
        apiEndpoint: "author",


        importMatchFields: [],
        importModel: AuthorModel,

        initialFormData: {
            name: "",
            email: "",
            bio: ""
        },
        columns: [
            {
                field: "name",
                label: "Name",
            },
            {
                field: "email",
                label: "Email",
                render: (value) => <span style={{ color: "#6c757d" }}>{value || '-'}</span>,
            },
            {
                field: "bio",
                label: "Bio",
                render: (value) => (
                    <div
                        style={{
                            whiteSpace: "pre-wrap",
                            background: "#f8f9fa",
                            padding: "8px",
                            borderRadius: "6px",
                            minHeight: "60px",
                            maxHeight: "140px",
                            overflowY: "auto",
                            fontSize: "14px",
                            border: "1px solid #ddd",
                        }}
                    >
                        {value || "-"}
                    </div>
                ),
            }
        ],
        formFields: [
            {
                name: "name",
                label: "Name",
                type: "text",
                required: true,
                placeholder: "Enter author name",
                colSize: 6,
            },
            {
                name: "email",
                label: "Email",
                type: "email",
                placeholder: "Enter email address",
                colSize: 6,
            },
            {
                name: "bio",
                label: "Bio",
                type: "textarea",
                colSize: 6,

                render: (value, onChange) => (
                    <textarea
                        name="bio"
                        value={value || ""}
                        onChange={onChange}
                        rows={3}
                        placeholder="Enter bio"
                        className="form-control"
                        style={{
                            width: "100%",
                            resize: "none",
                            background: "#fff",
                            borderRadius: "6px",
                            padding: "8px",
                            border: "1px solid #ddd",
                        }}
                    />
                ),
            },
        ],


        validationRules: (formData, allAuthors, editingAuthor) => {
            const errors = [];
            if (!formData.name?.trim()) {
                errors.push("Author Name is required");
            }
            else {

                if (!formData.email?.trim()) {
                    errors.push("Author Email is required");
                } else {
                    const duplicateEmail = allAuthors.find(
                        author => author.email?.toLowerCase() === formData.email?.toLowerCase() &&
                            author.id !== editingAuthor?.id
                    );
                    if (duplicateEmail) {
                        errors.push("Author with this email already exists");
                    }
                }


            }

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
            permissions: permissions,
            showImportButton: true,
        },
        details: [
            { key: "name", label: "Name", type: "text" },
            { key: "email", label: "Email", type: "text" },
            { key: "bio", label: "Bio", type: "text" },
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