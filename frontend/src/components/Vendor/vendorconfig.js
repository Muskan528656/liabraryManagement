// config/vendorConfig.js
export const getVendorConfig = (externalData = {}, props = {}) => {
    const { CityState = [], CityPincode = [] } = externalData;

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
        moduleName: "vendor",        //  Navigation 
        apiEndpoint: "vendor", //  API calls
        moduleLabel: "Vendor",       //  UI display 

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
            status: "active"
        },
        columns: [
            {
                field: "name",
                label: "Name",
                // render: (value, record) => (
                //     <div className="d-flex align-items-center">
                //         <div
                //             className="rounded-circle d-flex align-items-center justify-content-center me-2"
                //             style={{
                //                 width: "32px",
                //                 height: "32px",
                //                 background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                //                 color: "white",
                //                 fontSize: "14px",
                //             }}
                //         >
                //             <i className="fa-solid fa-store"></i>
                //         </div>
                //         <a
                //             href={`/vendor/${record.id}`}
                //             onClick={(e) => {
                //                 e.preventDefault();
                //             }}
                //             style={{
                //                 color: "#6f42c1",
                //                 textDecoration: "none",
                //                 fontWeight: "500"
                //             }}
                //         >
                //             {value || "N/A"}
                //         </a>
                //     </div>
                // ),
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
                field: "gst_number",
                label: "GST Number",
                render: (value) => <span style={{ fontFamily: "monospace" }}>{value || '-'}</span>,
            },
            {
                field: "status",
                label: "Status",
                render: (value) => {
                    const getBadgeVariant = (status) => {
                        switch (status) {
                            case 'active': return 'success';
                            case 'inactive': return 'secondary';
                            case 'suspended': return 'warning';
                            default: return 'secondary';
                        }
                    };

                    const getStatusLabel = (status) => {
                        switch (status) {
                            case 'active': return 'Active';
                            case 'inactive': return 'Inactive';
                            case 'suspended': return 'Suspended';
                            default: return status;
                        }
                    };

                    return (
                        <span
                            className={`badge bg-${getBadgeVariant(value)}`}
                            style={{ fontSize: '0.75em' }}
                        >
                            {getStatusLabel(value)}
                        </span>
                    );
                },
            }
        ],
        formFields: [
            // Section 1: Company Information
            {
                name: "company_name",
                label: "Company Name",
                type: "text",
                placeholder: "Enter company name",
                colSize: 12,
                section: "Company Information"
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
                name: "address",
                label: "Address",
                type: "textarea",
                rows: 3,
                placeholder: "Enter address",
                colSize: 12,
                section: "Company Information"
            },
            {
                name: "state",
                label: "State",
                type: "custom",
                colSize: 4,
                section: "Company Information",
                render: (value, onChange, formData) => (
                    <select
                        className="form-control"
                        name="state"
                        value={value}
                        onChange={onChange}
                        style={{
                            border: "2px solid #c084fc",
                            borderRadius: "8px",
                        }}
                    >
                        <option value="">Select State</option>
                        {states.map(state => (
                            <option key={state.value} value={state.value}>
                                {state.label}
                            </option>
                        ))}
                    </select>
                )
            },
            {
                name: "city",
                label: "City",
                type: "custom",
                colSize: 4,
                section: "Company Information",
                render: (value, onChange, formData) => {
                    const filteredCities = formData.state
                        ? allCities.filter(city => city.state === formData.state)
                        : allCities;

                    return (
                        <select
                            className="form-control"
                            name="city"
                            value={value}
                            onChange={onChange}
                            style={{
                                border: "2px solid #c084fc",
                                borderRadius: "8px",
                            }}
                        >
                            <option value="">Select City</option>
                            {filteredCities.map(city => (
                                <option key={city.value} value={city.value}>
                                    {city.label}
                                </option>
                            ))}
                        </select>
                    );
                }
            },
            {
                name: "pincode",
                label: "Pincode",
                type: "text",
                placeholder: "Enter pincode",
                colSize: 4,
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
                defaultValue: "India"
            },
            {
                name: "status",
                label: "Status",
                type: "select",
                colSize: 6,
                section: "Company Information",
                options: [
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                    { value: "suspended", label: "Suspended" }
                ],
                defaultValue: "active"
            },
            // Section 2: Contact Person Information
            {
                name: "name",
                label: "Contact Person Name",
                type: "text",
                required: true,
                placeholder: "Enter contact person name",
                colSize: 12,
                section: "Contact Person Information"
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
                name: "phone",
                label: "Phone",
                type: "tel",
                placeholder: "Enter phone number",
                colSize: 6,
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
            }
        ],
        validationRules: (formData, allVendors, editingVendor) => {
            const errors = [];
            if (!formData.name?.trim()) {
                errors.push("Name is required");
            }

            const duplicateName = allVendors.find(
                vendor => vendor.name?.toLowerCase() === formData.name?.toLowerCase() &&
                    vendor.id !== editingVendor?.id
            );
            if (duplicateName) {
                errors.push("Vendor with this name already exists");
            }

            return errors;
        },
        dataDependencies: {
            CityState: { source: 'static', data: CityState },
            CityPincode: { source: 'static', data: CityPincode }
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
            searchFields: [
                "name",
                "company_name",
                "email",
                "phone",
                "gst_number",
                "pan_number",
                "address",
                "city",
                "state"
            ]
        },
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
            {
                key: "status",
                label: "Status",
                type: "badge",
                badgeConfig: {
                    active: { variant: "success", label: "Active" },
                    inactive: { variant: "secondary", label: "Inactive" },
                    suspended: { variant: "warning", label: "Suspended" }
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

                const optionalFields = ['company_name', 'email', 'phone', 'gst_number', 'pan_number', 'address', 'city', 'state', 'pincode'];
                optionalFields.forEach(field => {
                    if (cleanedData[field] === '') {
                        cleanedData[field] = null;
                    }
                });

                return cleanedData;
            },
            afterSave: (response, editingItem) => {
                console.log("Vendor saved:", response);
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
                { key: "Status", header: "Status", width: 15 }
            ]
        }
    };
};