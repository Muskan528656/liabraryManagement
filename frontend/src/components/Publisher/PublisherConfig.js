import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";
import City_State from "../../constants/CityState.json";

import { createModel } from "../common/UniversalCSVXLSXImporter";

export const getPublisherConfig = (externalData = {}, props = {}, timeZone) => {

    const PublisherModel = createModel({
        modelName: "Publisher",
        fields: {
            "Salutation": "Salutation",
            "Name": "Name",
            "Email": "Email",
            "Phone": "Phone",
            "City": "City",
            "State": "State",
            "Country": "Country",
            "is_active": "Status"
        },
        required: ["Name", "Email", "Phone", "Country", "City"],
    });

    const statusBadge = (value) => (
        <span className={`badge ${value ? "bg-success" : "bg-secondary"}`}>
            {value ? "Active" : "Inactive"}
        </span >
    );



    return {
        moduleName: "publisher",
        moduleLabel: "Publisher",
        apiEndpoint: "publisher",
        importMatchFields: [],
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

            {
                field: "name",
                label: "Name",
            },
            {
                field: "email",
                label: "Email",
            },
            {
                field: "phone",
                label: "Phone",
            },
            {
                field: "city",
                label: "City",
            },
            {
                field: "state",
                label: "State",
            },
            {
                field: "country",
                label: "Country",
            },
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
                required: false,
                placeholder: "Select a country",
                colSize: 6
            },
            {
                name: "is_active",
                label: "Active",
                type: "toggle",
                options: [
                    { value: true, label: "true" },
                    { value: false, label: "false" },
                ],
                colSize: 6,
            },
        ],
        validationRules: (formData, allBooks, editingBook) => {
            const errors = [];


            if (!formData.name?.trim()) errors.push("name is required");
            if (!formData.email?.trim()) errors.push("email is required");
            // if (!formData.city?.trim()) errors.push("city is required");
            // if (!formData.country?.trim()) errors.push("country is required");
            if (!formData.phone) errors.push("phone is required");


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

            showImportButton: true,
        },

        customHandlers: {

            onDataLoad: (data) => {
                if (Array.isArray(data)) {
                    return data.map(item => ({
                        ...item,
                        is_active: item.is_active === "Active" || item.is_active === "true" || item.is_active === true
                    }));
                }
                return data;
            },
            onImportDataTransform: (data) => {
                return data.map(item => ({
                    ...item,
                    is_active: item.is_active === "Active" || item.is_active === "true" || item.is_active === true || item.Status === "Active" || item.Status === "true" || item.Status === true
                }));
            }
        },
        importModel: PublisherModel,
        exportColumns: [
            { key: "salutation", header: "Salutation", width: 12 },
            { key: "name", header: "Name", width: 20 },
            { key: "email", header: "Email", width: 20 },
            { key: "phone", header: "Phone", width: 15 },
            { key: "city", header: "City", width: 15 },
            { key: "state", header: "State", width: 15 },
            { key: "country", header: "Country", width: 15 },
            { key: "is_active", header: "Status", width: 12 },
        ],
    };
};