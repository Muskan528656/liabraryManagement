// export const getPublisherConfig = (externalData = {}, props = {}, timeZone) => {

//     const statusBadge = (value) => (
//         <span className={`badge ${value ? "bg-success" : "bg-secondary"}`}>
//             { value? "Active": "Inactive" }
//         </span >
//     );

// return {
//     moduleName: "publisher",
//     moduleLabel: "publisher",
//     apiEndpoint: "publisher",
//     initialFormData: {
//         salutation: "",
//         name: "",
//         email: "",
//         phone: "",
//         city: "",
//         state: "",
//         country: "",

//         is_active: true
//     },
//     columns: [
//         {
//             field: "salutation",
//             label: "Salutation",
//         },
//         {
//             field: "name",
//             label: "Name",
//         },
//         {
//             field: "email",
//             label: "Email",
//         },
//         {
//             field: "phone",
//             label: "Phone",
//         },
//         {
//             field: "city",
//             label: "City",
//         },
//         {
//             field: "state",
//             label: "State",
//         },
//         {
//             field: "country",
//             label: "Country",
//         },
//         { field: "is_active", label: "Status", render: (value) => statusBadge(value === true) },

//     ],
//     formFields: [
//         {
//             name: "salutation",
//             label: "Salutation",
//             type: "text",
//             required: true,
//             placeholder: "Enter salutation",
//             colSize: 6,
//         },
//         {
//             name: "name",
//             label: "Name",
//             type: "text",
//             required: true,
//             placeholder: "Enter The Name",
//             colSize: 6,
//         },
//         {
//             name: "email",
//             label: "Email",
//             type: "email",
//             options: "categories",
//             required: true,
//             placeholder: "ibirds@gmail.com",
//             colSize: 6,
//         },
//         {
//             name: "phone",
//             label: "Phone",
//             type: "tel",
//             required: true,
//             placeholder: "1234567890",
//             colSize: 6,
//         },
//         {
//             name: "city",
//             label: "City",
//             type: "text",
//             placeholder: "Enter The City",
//             colSize: 6,
//         },
//         {
//             name: "state",
//             label: "State",
//             type: "text",
//             placeholder: "Enter The State",
//             colSize: 6,
//         },
//         {
//             name: "country",
//             label: "Country",
//             type: "text",
//             placeholder: "Enter The Country",
//             colSize: 6,

//         }, {
//             name: "is_active",
//             label: "Active",
//             type: "toggle",
//             options: [
//                 { value: true, label: "true" },
//                 { value: false, label: "false" },
//             ],
//             colSize: 6,
//         },
//     ],
//     validationRules: (formData, allBooks, editingBook) => {
//         const errors = [];

//         console.log("formdata is->", formData);
//         console.log("errors--->", errors)
//         console.log("book", allBooks);

//         // if (!formData.salutation?.trim()) errors.push("salutation is required");
//         if (!formData.name?.trim()) errors.push("name is required");
//         if (!formData.email?.trim()) errors.push("email is required");
//         if (!formData.city?.trim()) errors.push("city is required");
//         if (!formData.country?.trim()) errors.push("country is required");
//         if (!formData.phone) errors.push("phone is required");

//         // const duplicate = allBooks.find(
//         //     book => book.isbn === formData.isbn && book.id !== editingBook?.id   
//         // );
//         // if (duplicate) errors.push("Book with this ISBN already exists");

//         return errors;
//     },

//     features: {
//         showBulkInsert: false,
//         showImportExport: true,
//         showDetailView: true,
//         showSearch: true,
//         showColumnVisibility: true,
//         showCheckbox: true,
//         showActions: true,
//         showAddButton: true,
//         allowEdit: true,
//         allowDelete: false,
//     },

// };

// };



import React from "react";
// 1. Import createModel
import { createModel } from "../common/UniversalCSVXLSXImporter";

export const getPublisherConfig = (externalData = {}, props = {}, timeZone) => {

    const statusBadge = (value) => (
        <span className={`badge ${value ? "bg-success" : "bg-secondary"}`}>
            {value ? "Active" : "Inactive"}
        </span>
    );

    // 2. Define the Import Model
    const PublisherModel = createModel({
        modelName: "Publisher",
        fields: {
            "salutation": "Salutation",
            "name": "Name",
            "email": "Email",
            "phone": "Phone",
            "city": "City",
            "state": "State",
            "country": "Country",
            "is_active": "Status" 
        },
        // Validations for CSV Import based on your validationRules
        required: ["name", "email", "phone", "city", "country"],
    });

    return {
        moduleName: "publisher",
        moduleLabel: "Publisher",
        apiEndpoint: "publisher",

        // 3. Add Import Configuration
        importMatchFields: [],
        importModel: PublisherModel,

        initialFormData: {
            salutation: "",
            name: "",
            email: "",
            phone: "",
            city: "",
            state: "",
            country: "",
            is_active: true
        },
        columns: [
            { field: "salutation", label: "Salutation" },
            { field: "name", label: "Name" },
            { field: "email", label: "Email" },
            { field: "phone", label: "Phone" },
            { field: "city", label: "City" },
            { field: "state", label: "State" },
            { field: "country", label: "Country" },
            { field: "is_active", label: "Status", render: (value) => statusBadge(value === true) },
        ],
        formFields: [
            {
                name: "salutation",
                label: "Salutation",
                type: "text",
                required: false,
                placeholder: "Enter salutation",
                colSize: 6,
            },
            {
                name: "name",
                label: "Name",
                type: "text",
                required: true,
                placeholder: "Enter The Name",
                colSize: 6,
            },
            {
                name: "email",
                label: "Email",
                type: "email",
                required: true,
                placeholder: "ibirds@gmail.com",
                colSize: 6,
            },
            {
                name: "phone",
                label: "Phone",
                type: "tel",
                required: true,
                placeholder: "1234567890",
                colSize: 6,
            },
            {
                name: "city",
                label: "City",
                type: "text",
                required: true,
                placeholder: "Enter The City",
                colSize: 6,
            },
            {
                name: "state",
                label: "State",
                type: "text",
                placeholder: "Enter The State",
                colSize: 6,
            },
            {
                name: "country",
                label: "Country",
                type: "text",
                required: true,
                placeholder: "Enter The Country",
                colSize: 6,
            },
            {
                name: "is_active",
                label: "Status",
                type: "toggle",
                options: [
                    { value: true, label: "Active" },
                    { value: false, label: "Inactive" },
                ],
                colSize: 6,
            },
        ],
        validationRules: (formData, allPublishers, editingPublisher) => {
            const errors = [];

            if (!formData.name?.trim()) errors.push("Name is required");
            if (!formData.email?.trim()) errors.push("Email is required");
            if (!formData.city?.trim()) errors.push("City is required");
            if (!formData.country?.trim()) errors.push("Country is required");
            if (!formData.phone) errors.push("Phone is required");

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
            allowEdit: true,
            allowDelete: false,
            // 4. Enable Import Button
            showImportButton: true,
        },
        
        customHandlers: {
            // Transform import data (e.g., convert Status "Active" to boolean true)
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