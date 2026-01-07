

import { Badge } from "react-bootstrap";
import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";
import { createModel } from "../common/UniversalCSVXLSXImporter";

export const getVendorConfig = (externalData = {}, props = {}) => {
    const { CityState = [], CityPincode = [] } = externalData;

    const VendorModel = createModel({
        modelName: "Vendor",
        fields: {
            "name": "Contact Person Name",
            "company_name": "Company Name",
            "email": "Email",
            "phone": "Phone",
            "country_code": "Country Code",
            "gst_number": "GST Number",
            "pan_number": "PAN Number",
            "address": "Address",
            "city": "City",
            "state": "State",
            "pincode": "Pincode",
            "country": "Country",
            "status": "Status"
        },
        required: ["name", "phone", "email"],
    });

    let companies = [];
    if (externalData && externalData.companies) {
        companies = externalData.companies;
    } else if (props && props.companies) {
        companies = props.companies;
    } else if (externalData && externalData["company"]) {
        companies = externalData["company"];
    }

    let defaultCountryCode = "+91";

    if (Array.isArray(companies) && companies.length > 0) {
        const companyWithCountryCode = companies.find(c => c && c.country_code);
        if (companyWithCountryCode && companyWithCountryCode.country_code) {
            const countryCodeStr = String(companyWithCountryCode.country_code).trim();
            const codePart = countryCodeStr.split(/[—\-]/)[0].trim();
            if (codePart && !codePart.startsWith('+')) {
                defaultCountryCode = '+' + codePart;
            } else if (codePart) {
                defaultCountryCode = codePart;
            }
        }
    }

    const states = [...new Set(CityState.map(item => item.state))].map(state => ({
        value: state,
        label: state
    }));

    const allCities = CityState.map(item => ({
        value: item.name,
        label: item.name,
        state: item.state
    }));

    const allPincodes = CityPincode.map(item => ({
        value: item.pincode,
        label: `${item.pincode} - ${item.city}, ${item.state}`,
        city: item.city,
        state: item.state
    }));

    return {
        moduleName: "vendor",
        apiEndpoint: "vendor",
        moduleLabel: "Vendor",

        importMatchFields: [],
        importModel: VendorModel,

        initialFormData: {
            name: "",
            company_name: "",
            email: "",
            phone: "",
            gst_number: "",
            pan_number: "",
            address: "",
            city: "",
            state: "",
            pincode: "",
            country: "India",
            status: true,
            country_code: defaultCountryCode
        },
        columns: [
            {
                field: "name",
                label: "Name",
            },
            {
                field: "company_name",
                label: "Company Name",
                render: (value) => <span>{value || '-'}</span>,
            },
            {
                field: "email",
                label: "Email",
                render: (value) => <span style={{ color: "#6c757d" }}>{value || '-'}</span>,
            },
            {
                field: "phone",
                label: "Phone",
                render: (value) => <span>{value || '-'}</span>,
            },
            {
                field: "country_code",
                label: "Country Code",
                render: (value) => <span>{value || '-'}</span>,
            },
            {
                field: "gst_number",
                label: "GST Number",
                render: (value) => <span style={{ fontFamily: "monospace" }}>{value || '-'}</span>,
            },
            {
                field: "status",
                label: "Status",
                sortable: true,
                render: (value) => {
                    const statusValue = value === true || value === "active" ? "Active" : "Inactive";
                    return (
                        <Badge bg={statusValue === "Active" ? "success" : "danger"}>
                            {statusValue}
                        </Badge>
                    );
                }
            }
        ],
        formFields: [
            {
                name: "name",
                label: "Vendor Name",
                type: "text",
                required: true,
                placeholder: "Enter contact person name",
                colSize: 6,
                section: "Contact Person Information"
            },
            {
                name: "company_name",
                label: "Company Name",
                type: "text",
                placeholder: "Enter company name",
                colSize: 6,
                section: "Contact Person Information"
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

                defaultValue: defaultCountryCode,
                colSize: 3,
                section: "Contact Person Information"
            },
            {
                name: "phone",
                label: "Phone",
                type: "tel",
                required: true,

                placeholder: "Enter phone number",
                colSize: 3,
                section: "Contact Person Information",
                customValidation: (value) => {
                    if (value && value.trim()) {
                        const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
                        if (!phoneRegex.test(value)) {
                            return "Please enter a valid phone number";
                        }
                    }
                    return null;
                }
            },
            {
                name: "email",
                label: "Email",
                type: "email",
                placeholder: "Enter email address",
                colSize: 6,
                section: "Contact Person Information",
                customValidation: (value, formData, allVendors, editingVendor) => {
                    if (value && value.trim()) {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(value)) {
                            return "Please enter a valid email address";
                        }

                        const duplicate = allVendors.find(
                            vendor => vendor.email?.toLowerCase() === value?.toLowerCase() &&
                                vendor.id !== editingVendor?.id
                        );
                        if (duplicate) return "Vendor with this email already exists";
                    }
                    return null;
                }
            },

            {
                name: "gst_number",
                label: "GST Number",
                type: "text",
                placeholder: "Enter GST number",
                colSize: 6,
                section: "Company Information",
                customValidation: (value) => {
                    if (value && value.trim() && value.length !== 15) {
                        return "GST number must be 15 characters";
                    }
                    return null;
                }
            },
            {
                name: "pan_number",
                label: "PAN Number",
                type: "text",
                placeholder: "Enter PAN number",
                colSize: 6,
                section: "Company Information",
                customValidation: (value) => {
                    if (value && value.trim()) {
                        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
                        if (!panRegex.test(value)) {
                            return "PAN number must be 10 characters (e.g., ABCDE1234F)";
                        }
                    }
                    return null;
                }
            },
            {
                name: "state",
                label: "State",
                type: "select",
                colSize: 6,
                section: "Company Information",
                options: states,
                placeholder: "Select State",
                customValidation: (value) => {
                    if (!value || !value.trim()) {
                        return "State is required";
                    }
                    return null;
                }
            },
            {
                name: "city",
                label: "City",
                type: "select",
                colSize: 6,
                section: "Company Information",
                options: formData => {
                    const selectedState = formData?.state;
                    if (!selectedState) return [];
                    return allCities
                        .filter(city => city.state === selectedState)
                        .map(city => ({
                            value: city.value,
                            label: city.label
                        }));
                },
                placeholder: "Select City",
                customValidation: (value, formData) => {
                    if (formData?.state && (!value || !value.trim())) {
                        return "City is required when state is selected";
                    }
                    return null;
                }
            },
            {
                name: "pincode",
                label: "Pincode",
                type: "text",
                placeholder: "Enter pincode",
                colSize: 6,
                section: "Company Information",
                customValidation: (value) => {
                    if (value && value.trim()) {
                        const pincodeRegex = /^[0-9]{6}$/;
                        if (!pincodeRegex.test(value)) {
                            return "Pincode must be 6 digits";
                        }
                    }
                    return null;
                }
            },
            {
                name: "country",
                label: "Country",
                type: "text",
                placeholder: "Enter country",
                colSize: 6,
                section: "Company Information",
                defaultValue: "India",
                readOnly: true
            },
            {
                name: "address",
                label: "Address",
                type: "textarea",
                rows: 2,
                placeholder: "Enter full address",
                colSize: 12,
                section: "Company Information"
            },
            {
                name: "status",
                label: "Status",
                type: "select",
                colSize: 6,
                section: "Company Information",
                options: [
                    { value: true, label: "Active" },
                    { value: false, label: "Inactive" }
                ],
                defaultValue: true
            },
        ],
        validationRules: (formData, allVendors, editingVendor) => {
            const errors = [];
            if (!formData.name?.trim()) {
                errors.push("Name is required");
            }

            if (!formData.email?.trim()) {
                errors.push("Email is required");
            } else {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData.email)) {
                    errors.push("Please enter a valid email address");
                }
            }

            if (!formData.phone?.trim()) {
                errors.push("Phone is required");
            } else {
                const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
                if (!phoneRegex.test(formData.phone)) {
                    errors.push("Please enter a valid phone number");
                }
            }

            const duplicateName = allVendors.find(
                vendor => vendor.name?.toLowerCase() === formData.name?.toLowerCase() &&
                    vendor.id !== editingVendor?.id
            );
            if (duplicateName) {
                errors.push("Vendor with this name already exists");
            }

            const duplicateEmail = allVendors.find(
                vendor => vendor.email?.toLowerCase() === formData.email?.toLowerCase() &&
                    vendor.id !== editingVendor?.id
            );
            if (duplicateEmail) {
                errors.push("Vendor with this email already exists");
            }

            return errors;
        },
        dataDependencies: {
            CityState: { source: 'static', data: CityState },
            CityPincode: { source: 'static', data: CityPincode },
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
            allowDelete: false,
            showImportButton: true,
            showAdvancedFilter: true,
            showEditButtonInDetailView: false, // Fixed: Remove edit button from detail view
            searchFields: [
                "name",
                "company_name",
                "email",
                "phone",
                "gst_number",
                "pan_number",
                "address",
                "state"
            ]
        },
        filterFields: [
            { name: 'name', label: 'Vendor Name', type: 'text' },
            {
                name: 'status', label: 'Status', type: 'select',
                options: [
                    { label: "Active", value: true },
                    { label: "Inactive", value: false }
                ]
            },
            { name: 'company_name', label: 'Company Name', type: 'text' }
        ],

        details: [
            { key: "name", label: "Vendor Name", type: "text" },
            { key: "company_name", label: "Company Name", type: "text" },
            { key: "email", label: "Email", type: "email" },
            { key: "phone", label: "Phone", type: "tel" },
            { key: "gst_number", label: "GST Number", type: "text" },
            { key: "pan_number", label: "PAN Number", type: "text" },
            { key: "address", label: "Address", type: "text" },
            { key: "city", label: "City", type: "text" },
            { key: "state", label: "State", type: "text" },
            { key: "pincode", label: "Pincode", type: "text" },
            { key: "country", label: "Country", type: "text" },
            { key: "country_code", label: "Country Code", type: "text" },
            {
                key: "status",
                label: "Status",
                type: "badge",
                render: (value) => {
                    const statusValue = value === true || value === "active" ? "Active" : "Inactive";
                    return (
                        <Badge bg={statusValue === "Active" ? "success" : "danger"}>
                            {statusValue}
                        </Badge>
                    );
                }
            },
            { key: "created_at", label: "Created At", type: "date" },
            { key: "updated_at", label: "Updated At", type: "date" },
        ],
        customHandlers: {
            beforeSave: (formData, editingItem) => {
                const cleanedData = { ...formData };
                Object.keys(cleanedData).forEach(key => {
                    if (typeof cleanedData[key] === 'string') {
                        cleanedData[key] = cleanedData[key].trim();
                    }
                });

                const optionalFields = ['company_name', 'gst_number', 'pan_number', 'address', 'city'];
                optionalFields.forEach(field => {
                    if (cleanedData[field] === '') {
                        cleanedData[field] = null;
                    }
                });

                if (cleanedData.country_code) {
                    const cleanValue = String(cleanedData.country_code).split(/[—\-]/)[0].trim();
                    if (cleanValue && !cleanValue.startsWith('+')) {
                        cleanedData.country_code = '+' + cleanValue;
                    } else {
                        cleanedData.country_code = cleanValue;
                    }
                } else {
                    cleanedData.country_code = defaultCountryCode;
                }
                if (!cleanedData.status) {
                    cleanedData.status = "active";
                }

                return cleanedData;
            },
            afterSave: (response, editingItem) => {

            }
        },
        exportConfig: {
            fileName: "vendors",
            sheetName: "Vendors",
            columns: [
                { key: "Sr. No", header: "Sr. No", width: 10 },
                { key: "Name", header: "Name", width: 30 },
                { key: "Company Name", header: "Company Name", width: 30 },
                { key: "Email", header: "Email", width: 30 },
                { key: "Phone", header: "Phone", width: 20 },
                { key: "GST Number", header: "GST Number", width: 20 },
                { key: "PAN Number", header: "PAN Number", width: 20 },
                { key: "Address", header: "Address", width: 40 },
                { key: "City", header: "City", width: 20 },
                { key: "State", header: "State", width: 20 },
                { key: "Pincode", header: "Pincode", width: 15 },
                { key: "Country", header: "Country", width: 20 },
                { key: "Country Code", header: "Country Code", width: 15 },
                { key: "Status", header: "Status", width: 15 }
            ]
        },
        initializeFormData: (existingData = null) => {
            if (existingData) {
                return {
                    ...existingData,
                    country_code: existingData.country_code || defaultCountryCode,
                    status: existingData.status || "active"
                };
            }

            return {
                name: "",
                company_name: "",
                email: "",
                phone: "",
                gst_number: "",
                pan_number: "",
                address: "",
                city: "",
                state: "",
                pincode: "",
                country: "India",
                status: true,
                country_code: defaultCountryCode
            };
        }
    };
};