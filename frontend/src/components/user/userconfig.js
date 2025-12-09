import { Badge } from "react-bootstrap";
import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";
import { COUNTRY_TIMEZONE } from "../../constants/COUNTRY_TIMEZONE";

export const getUserConfig = (externalData = {}, props = {}, timeZone, companyInfo, editingItem = null) => {

    const extractData = (source) => {
        if (!source) return [];
        if (Array.isArray(source)) return source;
        if (source.data && Array.isArray(source.data)) return source.data;
        return [];
    };

    const rawRoles = externalData?.userRoles || externalData?.["user-role"] || props?.userRoles;
    let userRoles = extractData(rawRoles);

    let defaultCountryName = "";
    let defaultCountryCode = "+91";
    let defaultCurrency = "";
    let defaultTimeZone = "";

    if (companyInfo) {
        const matchedCountry = COUNTRY_TIMEZONE.find(c =>
            (companyInfo.country && c.countryName.toLowerCase() === companyInfo.country.toLowerCase()) ||
            (companyInfo.country_code && c.phoneCode === companyInfo.country_code)
        );

        if (matchedCountry) {
            defaultCountryName = matchedCountry.countryName;
            defaultCountryCode = matchedCountry.phoneCode;
            defaultCurrency = matchedCountry.currency.code;

            const exactTz = matchedCountry.timezones.find(t => t.zoneName === companyInfo.time_zone);
            defaultTimeZone = exactTz ? exactTz.zoneName : matchedCountry.timezones[0]?.zoneName;
        } else {
            defaultCountryName = companyInfo.country || "";
            defaultCountryCode = companyInfo.country_code || "";
            defaultCurrency = companyInfo.currency || "";
            defaultTimeZone = companyInfo.time_zone || "";
        }
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

    console.log("Companies array in getUserConfig:", companies);
    if (Array.isArray(companies) && companies.length > 0) {
        const companyWithCountryCode = companies.find(c => c && c.country_code);
        console.log("Company with country code:", companyWithCountryCode);

    const rawRoles = externalData?.userRoles || externalData?.["user-role"] || props?.userRoles;
    const userRoles = extractData(rawRoles);

    let defaultCountryName = "";
    let defaultCountryCode = "";
    let defaultCurrency = "";
    let defaultTimeZone = "";

    if (companyInfo) {
        const matchedCountry = COUNTRY_TIMEZONE.find(c => 
            (companyInfo.country && c.countryName.toLowerCase() === companyInfo.country.toLowerCase()) ||
            (companyInfo.country_code && c.phoneCode === companyInfo.country_code)
        );

        if (matchedCountry) {
            defaultCountryName = matchedCountry.countryName;
            defaultCountryCode = matchedCountry.phoneCode;
            defaultCurrency = matchedCountry.currency.code;

            const exactTz = matchedCountry.timezones.find(t => t.zoneName === companyInfo.time_zone);
            
            defaultTimeZone = exactTz ? exactTz.zoneName : matchedCountry.timezones[0]?.zoneName;
            console.log("defaultTimeZone",defaultTimeZone)
        } else {
            defaultCountryName = companyInfo.country || "";
            defaultCountryCode = companyInfo.country_code || "";
            defaultCurrency = companyInfo.currency || "";
            defaultTimeZone = companyInfo.time_zone || "";
        }
    }

    const isEditMode = editingItem !== null;

    return {
        moduleName: "user",
        moduleLabel: "User Management",
        apiEndpoint: "user",
        
        columns: [
            { field: "firstname", label: "First Name" },
            { field: "lastname", label: "Last Name" },
            { field: "email", label: "Email" },
            {
                field: "country",
                label: "Country",
                render: (value) => {

                    if (!value) return <span className="text-muted">N/A</span>;
                    const country = COUNTRY_TIMEZONE.find(c => c.countryName === value);
                    return country ? `${country.flag} ${country.countryName}` : value;
                }
            },
            { 
                field: "country_code", 
                label: "Code",
                render: (value) => value || <span className="text-muted">N/A</span>
            },
            { field: "phone", label: "Phone" },
            { 
                field: "currency", 
                label: "Currency",
                render: (value) => value || <span className="text-muted">N/A</span>
            },
            { 
                field: "time_zone", 
                label: "Time Zone",
                render: (value) => {
                     if (!value) return <span className="text-muted">N/A</span>;
                     const country = COUNTRY_TIMEZONE.find(c => c.timezones.some(t => t.zoneName === value));
                     const tz = country?.timezones.find(t => t.zoneName === value);
                     return tz ? `${tz.zoneName} (${tz.gmtOffset})` : value;
                }
            },
            {
                field: "userrole",
                label: "Role",
                render: (value, record, extData) => {
                    const roles = extData?.userRoles || userRoles || [];
                    const role = roles.find(r => {
                        const roleId = r.id || r._id;
                        const val = value || record?.userrole;
                        return roleId === val || roleId === value;
                    });
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
            password: "",
            confirmPassword: "",
            country: defaultCountryName,
            country_code: defaultCountryCode,
            phone: "",
            currency: defaultCurrency,
            time_zone: defaultTimeZone,
            userrole: "",
            isactive: true,
           
        },

        formFields: [

            {
                name: "firstname",
                label: "First Name",
                type: "text",
                required: true,
                colSize: 6,
            },
            {
                name: "lastname",
                label: "Last Name",
                type: "text",
                required: true,
                colSize: 6,
            },
            {
                name: "password",
                label: "Password",
                type: "password",
                required: true,
                placeholder: "Enter password",
                colSize: 6,
            },
            {
                name: "confirmPassword",
                label: "Confirm Password",
                type: "password",
                required: true,
                placeholder: "Confirm password",
                colSize: 6,
            },
            {
                name: "email",
                label: "Email",
                type: "email",
                required: true,
                colSize: 6,
            },
            ...(editingItem ? [] : [
                {
                    name: "password",
                    label: "Password",
                    type: "password",
                    required: true,
                    colSize: 6,
                },
                {
                    name: "confirmPassword",
                    label: "Confirm Password",
                    type: "password",
                    required: true,
                    colSize: 6,
                }
            ]),
            {
                name: "country",
                label: "Country",
                type: "select",
                options: COUNTRY_TIMEZONE.map(country => ({
                    value: country.countryName,
                    label: `${country.flag} ${country.countryName}`
                })),
                required: true,
                colSize: 6,
                onChange: (value, formData, setFormData) => {
                    const selectedCountry = COUNTRY_TIMEZONE.find(c => c.countryName === value);
                    if (selectedCountry) {
                        setFormData({
                            ...formData,
                            country: value,
                            country_code: selectedCountry.phoneCode,
                            currency: selectedCountry.currency.code,
                            time_zone: selectedCountry.timezones[0]?.zoneName || ""
                        });
                    }
                }
            },
            {
                name: "phone",
                label: "Phone",
                type: "text",
                placeholder: "Enter phone number",
                colSize: 6,
            },
            {
                name: "userrole",
                label: "Role",
                type: "select",
                options: userRoles.map(role => ({
                    value: role.id,
                    label: role.role_name
                })),
                required: true,
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
            },
            {
                name: "country",
                label: "Country",
                type: "select",
                options: COUNTRY_TIMEZONE.map(country => ({
                    value: country.countryName,
                    label: `${country.flag} ${country.countryName}`
                })),
                required: true,
                colSize: 6,
                onChange: (value, formData, setFormData) => {
                    const selectedCountry = COUNTRY_TIMEZONE.find(c => c.countryName === value);
                    if (selectedCountry) {
                        setFormData({
                            ...formData,
                            country: value,
                            country_code: selectedCountry.phoneCode,
                            currency: selectedCountry.currency.code,
                            time_zone: selectedCountry.timezones[0]?.zoneName || ""
                        });
                    }
                }
            },
            {
                name: "country_code",
                label: "Country Code",
                type: "text",
                readOnly: true,
                colSize: 3,
            },
            {
                name: "currency",
                label: "Currency",
                type: "text",
                readOnly: true,
                colSize: 3,
            },
            {
                name: "time_zone",
                label: "Time Zone",
                type: "select",
                options: (formData) => {
                    const currentCountryName = formData?.country || defaultCountryName;
                    const countryData = COUNTRY_TIMEZONE.find(c => c.countryName === currentCountryName);

                    if (countryData && countryData.timezones) {
                        return countryData.timezones.map(tz => ({
                            value: tz.zoneName,
                            label: `${tz.zoneName} (${tz.gmtOffset})`
                        }));
                    }
                    return [];
                },
                required: true,
                colSize: 6,
            },
        ],

        validationRules: (formData, allUsers, editingUser) => {
            const errors = [];
            if (!formData.firstname?.trim()) errors.push("First name is required");
            if (!formData.lastname?.trim()) errors.push("Last name is required");
            if (!formData.email?.trim()) errors.push("Email is required");
            if (!editingUser) {
                if (!formData.password?.trim()) errors.push("Password is required");
                if (!formData.confirmPassword?.trim()) errors.push("Confirm password is required");
                if (formData.password !== formData.confirmPassword) errors.push("Passwords do not match");
            }
            if (!formData.country) errors.push("Country is required");
            if (!formData.userrole) errors.push("Role is required");

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (formData.email && !emailRegex.test(formData.email)) {
                errors.push("Invalid email format");
            }

            const duplicate = allUsers.find(
                user => user.email === formData.email && user.id !== editingUser?.id
            );
            if (duplicate) errors.push("Email already exists");


            if (!editingUser && (!formData.password || formData.password.length < 6)) {
                errors.push("Password must be at least 6 characters");
            }

            if (!editingUser && formData.password !== formData.confirmPassword) {
                errors.push("Passwords do not match");
            }

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
            showActions: true,
            showAddButton: true,
            allowEdit: true,
            allowDelete: false,
        },

        transformSubmitData: (formData, isEdit) => {
            const transformed = { ...formData };
            transformed.isactive = Boolean(transformed.isactive);


            delete transformed.confirmPassword;

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
            const isEdit = existingData !== null;

            if (existingData) {
                return {
                    ...existingData,
                    country_code: existingData.country_code || defaultCountryCode,
                    password: "", // Clear password in edit mode
                    confirmPassword: "" // Clear confirmPassword in edit mode
                };
            }

            return {
                firstname: "",
                lastname: "",
                email: "",
                country_code: defaultCountryCode,
                phone: "",
                userrole: "",
                isactive: true,
                password: "",
                confirmPassword: "",
                country: defaultCountryName || null,
                currency: defaultCurrency || "",
                time_zone: defaultTimeZone || null
            };
        }
    };
}};