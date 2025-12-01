import { Badge } from "react-bootstrap";
import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";
export const getUserConfig = (externalData = {}, props = {}) => {
    const userRoles =
        props.userRoles ||
        externalData.userRoles ||
        externalData["user-role"] ||
        [];

    const companies =
        props.companies ||
        externalData.companies ||
        externalData["company"] ||
        [];

    const defaultCountryCode = companies.length > 0 ? companies[0].country_code : "+91";

    return {
        moduleName: "user",
        moduleLabel: "User Management",
        apiEndpoint: "user",

        columns: [
            { field: "firstname", label: "First Name" },
            { field: "lastname", label: "Last Name" },
            { field: "email", label: "Email" },
            {
                field: "country_code",
                label: "Country Code",
                render: (value) => {

                    const country = COUNTRY_CODES.find(c => c.country_code === value);
                    return country ? `${country.country_code} (${country.country})` : value;
                }
            },
            {
                field: "userrole",
                label: "Role"
            },
            {
                field: "isactive",
                label: "Status",
                sortable: true,
                render: (value) => {
                    return (
                        <Badge bg={value === true || value === "active" ? "success" : "secondary"}>
                            {value === true || value === "active" ? "Active" : "Inactive"}
                        </Badge>
                    );
                }
            }
        ],

        initialFormData: {
            firstname: "",
            lastname: "",
            email: "",
            country_code: defaultCountryCode, // Default value from company table
            phone: "",
            userrole: "",
            isactive: true
        },

        formFields: [
            {
                name: "firstname",
                label: "First Name",
                type: "text",
                required: true,
                placeholder: "Enter first name",
                colSize: 6,
            },
            {
                name: "lastname",
                label: "Last Name",
                type: "text",
                required: true,
                placeholder: "Enter last name",
                colSize: 6,
            },
            {
                name: "email",
                label: "Email",
                type: "email",
                required: true,
                placeholder: "Enter email",
                colSize: 6,
            },
            {
                name: "country_code",
                label: "Country Code",
                type: "select",

                options: COUNTRY_CODES.map(country => ({
                    value: country.country_code,
                    label: `${country.country_code} - ${country.country}`
                })),
                required: true,
                placeholder: "Select country code",
                defaultValue: defaultCountryCode, // Default value from company table
                colSize: 3,
            },
            {
                name: "phone",
                label: "Phone",
                type: "text",
                placeholder: "Enter phone number",
                colSize: 3,
            },
            {
                name: "userrole",
                label: "Role",
                type: "select",
                options: "user-role",
                optionLabel: "role_name",
                optionValue: "id",
                required: true,
                placeholder: "Select user role",
                colSize: 6,
            },
            {
                name: "isactive",
                label: "Status",
                type: "toggle",
                options: [
                    { value: true, label: "Active" },
                    { value: false, label: "Inactive" }
                ],
                colSize: 6,
            }
        ],


        detailConfig: {
            title: "firstname",
            subtitle: "email",
            status: "isactive",
            details: [
                { key: "firstname", label: "First Name", type: "text" },
                { key: "lastname", label: "Last Name", type: "text" },
                { key: "email", label: "Email", type: "text" },
                {
                    key: "country_code",
                    label: "Country Code",
                    type: "text",
                    render: (value) => {

                        const country = COUNTRY_CODES.find(c => c.country_code === value);
                        return country ? `${country.country_code} (${country.country})` : value;
                    }
                },
                { key: "phone", label: "Phone", type: "text" },
                {
                    key: "userrole",
                    label: "Role",
                    type: "select",
                    options: userRoles,
                    displayKey: "role_name",
                    valueKey: "id"
                },
                {
                    key: "isactive",
                    label: "Status",
                    type: "toggle",
                    options: [
                        { value: true, label: "Active" },
                        { value: false, label: "Inactive" }
                    ]
                },
            ],
            other: [
                { key: "createdbyid", label: "Created By", type: "text" },
                { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },
                { key: "createddate", label: "Created Date", type: "date" },
                { key: "lastmodifieddate", label: "Last Modified Date", type: "date" },
            ],
        },

        validationRules: (formData, allUsers, editingUser) => {
            const errors = [];

            if (!formData.firstname?.trim()) errors.push("First name is required");
            if (!formData.lastname?.trim()) errors.push("Last name is required");
            if (!formData.email?.trim()) errors.push("Email is required");
            if (!formData.userrole) errors.push("User role is required");
            if (!formData.country_code) errors.push("Country code is required");

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (formData.email && !emailRegex.test(formData.email)) {
                errors.push("Please enter a valid email address");
            }


            if (formData.phone && !/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
                errors.push("Phone number must be 10 digits");
            }

            const duplicate = allUsers.find(
                user => user.email === formData.email && user.id !== editingUser?.id
            );
            if (duplicate) errors.push("User with this email already exists");

            return errors;
        },

        dataDependencies: {
            userRoles: "user-role",
            companies: "company" // Company table se data fetch karega
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
            allowDelete: true,
        },


        transformSubmitData: (formData, isEdit) => {
            const transformed = { ...formData };


            transformed.isactive = Boolean(transformed.isactive);


            if (!transformed.country_code) {
                transformed.country_code = defaultCountryCode;
            }

            return transformed;
        },


        lookupNavigation: {
            userrole: {
                path: "userroles",
                idField: "userrole",
                labelField: "User Role"
            },
        },


        initializeFormData: (existingData = null) => {
            if (existingData) {
                return {
                    ...existingData,
                    country_code: existingData.country_code || defaultCountryCode
                };
            }

            return {
                firstname: "",
                lastname: "",
                email: "",
                country_code: defaultCountryCode,
                phone: "",
                userrole: "",
                isactive: true
            };
        }
    };
};