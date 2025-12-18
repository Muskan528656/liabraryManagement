// export const getAuthorConfig = (externalData = {}, props = {}) => {
//     return {
//         moduleName: "authors",
//         moduleLabel: "Author",
//         apiEndpoint: "author",
//         initialFormData: {
//             name: "",
//             email: "",
//             bio: ""
//         },
//         columns: [
//             {
//                 field: "name",
//                 label: "Name",

//             },
//             {
//                 field: "email",
//                 label: "Email",
//                 render: (value) => <span style={{ color: "#6c757d" }}>{value || '-'}</span>,
//             },
//             {
//                 field: "bio",
//                 label: "Bio",
//                 render: (value) => (
//                     <div
//                         style={{
//                             whiteSpace: "pre-wrap",
//                             background: "#f8f9fa",
//                             padding: "8px",
//                             borderRadius: "6px",
//                             minHeight: "60px",
//                             maxHeight: "140px",
//                             overflowY: "auto",
//                             fontSize: "14px",
//                             border: "1px solid #ddd",
//                         }}
//                     >
//                         {value || "-"}
//                     </div>
//                 ),
//             }

//         ],
//         formFields: [
//             {
//                 name: "name",
//                 label: "Name",
//                 type: "text",
//                 required: true,
//                 placeholder: "Enter author name",
//                 colSize: 12,
//             },
//             {
//                 name: "email",
//                 label: "Email",
//                 type: "email",
//                 placeholder: "Enter email address",
//                 colSize: 12,
//             },
//             {
//                 name: "bio",
//                 label: "Bio",
//                 type: "textarea",
//                 colSize: 12,

//                 render: (value) => (
//                     <textarea
//                         value={value || "-"}
//                         readOnly
//                         rows={3}
//                         style={{
//                             width: "100%",
//                             resize: "none",
//                             background: "#f8f9fa",
//                             borderRadius: "6px",
//                             padding: "8px",
//                             border: "1px solid #ddd",
//                         }}
//                     />
//                 ),
//             },
//         ],
//         validationRules: (formData, allAuthors, editingAuthor) => {
//             const errors = [];
//             if (!formData.name?.trim()) errors.push("Name is required");

//             const duplicate = allAuthors.find(
//                 author => author.name?.toLowerCase() === formData.name?.toLowerCase() &&
//                     author.id !== editingAuthor?.id
//             );
//             if (duplicate) errors.push("Author with this name already exists");

//             return errors;
//         },
//         dataDependencies: {},
//         features: {
//             showBulkInsert: false,
//             showImportExport: true,
//             showDetailView: true,
//             showSearch: true,
//             showColumnVisibility: true,
//             showCheckbox: true,
//             showActions: true,
//             showAddButton: true,
//             allowEdit: true,
//             allowDelete: true
//         },
//         details: [
//             { key: "name", label: "Name", type: "text" },
//             { key: "email", label: "Email", type: "text" },
//             { key: "bio", label: "Bio", type: "text" },
//             { key: "created_at", label: "Created At", type: "date" },
//             { key: "updated_at", label: "Updated At", type: "date" },
//         ],
//         customHandlers: {
//             beforeSave: (formData, editingItem) => {
//                 return true;
//             },
//             afterSave: (response, editingItem) => {
//                 console.log("Author saved:", response);
//             }
//         }
//     };
// };


import React from "react";
// 1. Import createModel
import { createModel } from "../common/UniversalCSVXLSXImporter";

export const getAuthorConfig = (externalData = {}, props = {}) => {

    // 2. Define the Import Model
    const AuthorModel = createModel({
        modelName: "Author",
        fields: {
            "name": "Name",
            "email": "Email",
            "bio": "Bio"
        },
        required: ["name"], // Based on validationRules
    });

    return {
        moduleName: "authors",
        moduleLabel: "Author",
        apiEndpoint: "author",

        // 3. Add Import Configuration
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
                colSize: 12,
            },
            {
                name: "email",
                label: "Email",
                type: "email",
                placeholder: "Enter email address",
                colSize: 12,
            },
            {
                name: "bio",
                label: "Bio",
                type: "textarea",
                colSize: 12,
                // Note: Keeping your existing render logic
                render: (value, onChange) => (
                    <textarea
                        name="bio"
                        value={value || ""}
                        onChange={onChange} // Ensure onChange is passed if this is an input
                        rows={3}
                        placeholder="Enter bio"
                        className="form-control" // Added bootstrap class for better styling in edit mode
                        style={{
                            width: "100%",
                            resize: "none",
                            background: "#fff", // Changed to white for input
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
            if (!formData.name?.trim()) errors.push("Name is required");

            const duplicate = allAuthors.find(
                author => author.name?.toLowerCase() === formData.name?.toLowerCase() &&
                    author.id !== editingAuthor?.id
            );
            if (duplicate) errors.push("Author with this name already exists");

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
            allowDelete: true,
            // 4. Enable Import Button
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
                console.log("Author saved:", response);
            }
        }
    };
};