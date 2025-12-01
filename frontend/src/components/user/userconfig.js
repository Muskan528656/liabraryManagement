import { Badge } from "react-bootstrap";
import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";

export const getUserConfig = (externalData = {}, props = {}) => {
 
    let userRoles = [];

 
    if (externalData && externalData.userRoles) {
        userRoles = externalData.userRoles;
    }
 
    else if (props && props.userRoles) {
        userRoles = props.userRoles;
    }
 
    else if (externalData && externalData["user-role"]) {
        userRoles = externalData["user-role"];
    }

    console.log("Extracted userRoles in getUserConfig:", userRoles);

 
    let companies = [];
    if (externalData && externalData.companies) {
        companies = externalData.companies;
    } else if (props && props.companies) {
        companies = props.companies;
    } else if (externalData && externalData["company"]) {
        companies = externalData["company"];
    }

 
    let defaultCountryCode = "+91";

    console.log("Companies array in getUserConfig:", companies);

    if (Array.isArray(companies) && companies.length > 0) {
        const companyWithCountryCode = companies.find(c => c && c.country_code);
        console.log("Company with country code:", companyWithCountryCode);

        if (companyWithCountryCode && companyWithCountryCode.country_code) {
            const countryCodeStr = String(companyWithCountryCode.country_code).trim();
            console.log("Original country_code string:", countryCodeStr);

            const codePart = countryCodeStr.split(/[—\-]/)[0].trim();
            console.log("Extracted code part:", codePart);

            if (codePart && !codePart.startsWith('+')) {
                defaultCountryCode = '+' + codePart;
            } else if (codePart) {
                defaultCountryCode = codePart;
            }

            console.log("Final defaultCountryCode:", defaultCountryCode);
        }
    }

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
                    const cleanValue = value ? String(value).split(/[—\-]/)[0].trim() : value;
                    const country = COUNTRY_CODES.find(c => c.country_code === cleanValue);
                    return country ? `${country.country_code} (${country.country})` : cleanValue || 'N/A';
                }
            },
            {
                field: "userrole",
                label: "Role",
                render: (value, record, extData) => {
 
                    const roles = extData?.userRoles || userRoles || [];
                    console.log("Available roles for render:", roles);
                    console.log("Looking for role with id:", value);

                    const role = roles.find(r => {
                        const roleId = r.id || r._id;
                        const val = value || record?.userrole;
                        return roleId === val || roleId === value;
                    });

                    console.log("Found role:", role);
                    return role ? role.role_name : value || 'N/A';
                }
            },
            {
                field: "isactive",
                label: "Status",
                sortable: true,
                render: (value) => {
                    const isActive = value === true || value === "active" || value === 1;
                    return (
                        <Badge bg={isActive ? "success" : "secondary"}>
                            {isActive ? "Active" : "Inactive"}
                        </Badge>
                    );
                }
            }
        ],

        initialFormData: {
            firstname: "",
            lastname: "",
            email: "",
            country_code: defaultCountryCode,
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
                defaultValue: defaultCountryCode,
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
                options: Array.isArray(userRoles) ? userRoles.map(role => ({
                    value: role.id,
                    label: role.role_name
                })) : [],
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
                        const cleanValue = value ? String(value).split(/[—\-]/)[0].trim() : value;
                        const country = COUNTRY_CODES.find(c => c.country_code === cleanValue);
                        return country ? `${country.country_code} (${country.country})` : cleanValue || 'N/A';
                    }
                },
                { key: "phone", label: "Phone", type: "text" },
                {
                    key: "userrole",
                    label: "Role",
                    type: "select",
                    options: Array.isArray(userRoles) ? userRoles.map(role => ({
                        value: role.id,
                        label: role.role_name
                    })) : [],
                    render: (value, record, extData) => {
                        const roles = extData?.userRoles || userRoles || [];
                        const role = roles.find(r => String(r.id) === String(value) || String(r.id) === String(record?.userrole));
                        return role ? role.role_name : value || 'N/A';
                    }
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
            companies: "company"
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

            if (transformed.country_code) {
                const cleanValue = String(transformed.country_code).split(/[—\-]/)[0].trim();
                if (cleanValue && !cleanValue.startsWith('+')) {
                    transformed.country_code = '+' + cleanValue;
                } else {
                    transformed.country_code = cleanValue;
                }
            } else {
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