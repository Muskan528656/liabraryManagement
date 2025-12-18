import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";
import City_State from "../../constants/CityState.json";

export const getPublisherConfig = (externalData = {}, props = {}, timeZone) => {

    const statusBadge = (value) => (
        <span className={`badge ${value ? "bg-success" : "bg-secondary"}`}>
            {value ? "Active" : "Inactive"}
        </span >
    );
    console.log(COUNTRY_CODES)
    console.log("exp", City_State)

    return {
        moduleName: "publisher",
        moduleLabel: "publisher",
        apiEndpoint: "publisher",
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
                field: "salutation",
                label: "Salutation",
            },
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
                required: true,
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
                options: "categories",
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
                type: "select",
                options: City_State.map(item => ({
                    value: item.name,
                    label: `${item.name}`
                })),
                placeholder: "Enter The City",
                colSize: 6,
            },
            {
                name: "state",
                label: "State",
                type: "select",
                options: City_State.map(item => ({
                    value: item.state,
                    label: `${item.state}`
                })),
                placeholder: "Enter The State",
                colSize: 6,
            },
            {
                name: "country",
                label: "Country",
                type: "select",
                options: COUNTRY_CODES.map(item => ({
                    value: item.country,
                    label: `${item.country}(${item.country_code})`
                })),
                required: true,
                placeholder: "Select a country",
                colSize: 6
            }, {
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

            console.log("formdata is->", formData);
            console.log("errors--->", errors)
            console.log("book", allBooks);

            // if (!formData.salutation?.trim()) errors.push("salutation is required");
            if (!formData.name?.trim()) errors.push("name is required");
            if (!formData.email?.trim()) errors.push("email is required");
            if (!formData.city?.trim()) errors.push("city is required");
            if (!formData.country?.trim()) errors.push("country is required");
            if (!formData.phone) errors.push("phone is required");

            // const duplicate = allBooks.find(
            //     book => book.isbn === formData.isbn && book.id !== editingBook?.id   
            // );
            // if (duplicate) errors.push("Book with this ISBN already exists");

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