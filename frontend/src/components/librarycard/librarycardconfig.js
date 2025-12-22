import { Badge, Card, Row, Col } from "react-bootstrap";
import { API_BASE_URL } from "../../constants/CONSTANT";
import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";
import DataApi from "../../api/dataApi";

const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

const generateCardNumber = (card) => {
    const uuidPart =
        card.id?.replace(/-/g, "").substring(0, 8).toUpperCase() || "LIB00000";
    return `LIB${uuidPart}`;
};

export const getLibraryCardConfig = async (externalData = {}, timeZone) => {
    const customHandlers = externalData.customHandlers || {};
    const handleBarcodePreview =
        customHandlers.handleBarcodePreview ||
        ((card) => console.warn("Barcode preview handler not provided", card));

    console.log("External data:", externalData);

    let defaultCountryCode = "";
    let plansList = [];

    let objectTypesList = [];

    try {

        const companyApi = new DataApi("company");
        const companyResponse = await companyApi.fetchAll();

        if (companyResponse.data && Array.isArray(companyResponse.data) && companyResponse.data.length > 0) {
            const companyWithCountryCode = companyResponse.data.find(
                (c) => c && c.country_code
            );

            if (companyWithCountryCode && companyWithCountryCode.country_code) {
                const countryCodeStr = String(companyWithCountryCode.country_code).trim();
                const codePart = countryCodeStr.split(/[—\-]/)[0].trim();

                if (codePart && !codePart.startsWith("+")) {
                    defaultCountryCode = "+" + codePart;
                } else if (codePart) {
                    defaultCountryCode = codePart;
                }

                console.log("Default country code from company:", defaultCountryCode);
            }
        }


        const plansApi = new DataApi("plans"); // Corrected from "plans" to "plan"
        const plansResponse = await plansApi.fetchAll();

        console.log("Plans API Response:", plansResponse);

        let plansData = [];


        if (plansResponse.success && plansResponse.data && Array.isArray(plansResponse.data)) {
            plansData = plansResponse.data;
        } else if (plansResponse.data && plansResponse.data.data && Array.isArray(plansResponse.data.data)) {
            plansData = plansResponse.data.data;
        } else if (plansResponse.data && Array.isArray(plansResponse.data)) {
            plansData = plansResponse.data;
        } else if (Array.isArray(plansResponse)) {
            plansData = plansResponse;
        }

        console.log("Extracted plans data:", plansData);

        if (plansData.length > 0) {
            plansList = plansData
                .filter(plan => {
                    const isActive =
                        plan.is_active === true ||
                        plan.is_active === "true" ||
                        plan.is_active === 1 ||
                        plan.is_active === "1";

                    console.log(`Plan ${plan.plan_name}: is_active = ${plan.is_active}, filtered = ${isActive}`);
                    return isActive;
                })
                .map(plan => ({
                    value: plan.id,
                    label: `${plan.plan_name} (${plan.duration_days} days, ${plan.allowed_books || 0} books)`,
                    data: plan // Store full plan data for details
                }));

            console.log("Filtered active plans list:", plansList);
        } else {
            console.warn("No plans data found");
        }

        // Fetch object types
        const objectTypeApi = new DataApi("objecttype");
        const objectTypeResponse = await objectTypeApi.fetchAll();

        console.log("Object Type API Response:", objectTypeResponse);

        let objectTypeData = [];

        if (objectTypeResponse.success && objectTypeResponse.data && Array.isArray(objectTypeResponse.data)) {
            objectTypeData = objectTypeResponse.data;
        } else if (objectTypeResponse.data && objectTypeResponse.data.data && Array.isArray(objectTypeResponse.data.data)) {
            objectTypeData = objectTypeResponse.data.data;
        } else if (objectTypeResponse.data && Array.isArray(objectTypeResponse.data)) {
            objectTypeData = objectTypeResponse.data;
        } else if (Array.isArray(objectTypeResponse)) {
            objectTypeData = objectTypeResponse;
        }

        console.log("Extracted object type data:", objectTypeData);

        if (objectTypeData.length > 0) {
            objectTypesList = objectTypeData
                .filter(type => type.status === 'active' ||type.status === 'Active'  || type.status === true)
                .map(type => ({
                    value: type.id,
                    label: type.label.charAt(0).toUpperCase() + type.label.slice(1),
                    data: type
                }));

            console.log("Filtered active object types list:", objectTypesList);
        } else {
            console.warn("No object type data found");
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        defaultCountryCode = "+91"; // Default to India if company fetch fails
    }

    console.log("Final defaultCountryCode:", defaultCountryCode);
    console.log("Final plansList:", plansList);
    console.log("Final objectTypesList:", objectTypesList);

    const defaultColumns = [
        {
            field: "image",
            label: "Image",
            type: "image",
            width: "80px",
            render: (value, row) => {
                const imagePath = value;
                if (imagePath) {
                    const imgSrc = imagePath.startsWith("http")
                        ? imagePath
                        : `${API_BASE_URL}${imagePath}`;

                    return (
                        <img
                            src={imgSrc}
                            alt={row.first_name || "User"}
                            className="table-user-image"
                            style={{
                                width: "39px",
                                height: "39px",
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: "2px solid #e2e8f0"
                            }}
                        />
                    );
                }

                return (
                    <div className="table-user-placeholder">
                        <i className="fa-solid fa-user"></i>
                    </div>
                );
            },
        },
        { field: "card_number", label: "Card Number", sortable: true },
        { field: "first_name", label: "First Name", sortable: true },
        { field: "last_name", label: "Last Name", sortable: true },
        { field: "email", label: "Email", sortable: true },
        {
            field: "country_code",
            label: "Country Code",
            render: (value) => {
                const cleanValue = value
                    ? String(value).split(/[—\-]/)[0].trim()
                    : value;
                const country = COUNTRY_CODES.find(
                    (c) => c.country_code === cleanValue
                );
                return country
                    ? `${country.country_code} (${country.country})`
                    : cleanValue || defaultCountryCode;
            },
        },
        { field: "phone_number", label: "Phone Number", sortable: true },
        { field: "age", label: "Age", sortable: true },
        { field: "type_label", label: "Type", sortable: true },


        {
            field: "status",
            label: "Status",
            sortable: true,
            render: (value, row) => {
                const isActive =
                    value === true ||
                    value === "true" ||
                    value === "active" ||
                    value === 1 ||
                    row.is_active === true ||
                    row.active === true ||
                    row.status === "active";

                return (
                    <Badge bg={isActive ? "success" : "secondary"}>
                        {isActive ? "Active" : "Inactive"}
                    </Badge>
                );
            }
        }
    ];

    return {
        moduleName: "librarycards",
        moduleLabel: "Library Members",
        apiEndpoint: "librarycard",
        columns: defaultColumns,
        initialFormData: {
            card_number: "",
            first_name: "",
            last_name: "",
            name: "",
            email: "",
            country_code: defaultCountryCode,
            phone_number: "",
            age: "",
            registration_date: new Date().toISOString().split("T")[0],
            type_id: "",
            issue_date: new Date().toISOString().split("T")[0],
            plan_id: "",
            selectedPlan: null,
            status: "active",
            image: null,
        },

        formFields: [
            {
                name: "first_name",
                label: "First Name",
                type: "text",
                required: false,
                placeholder: "Enter first name",
                colSize: 6,
            },
            {
                name: "last_name",
                label: "Last Name",
                type: "text",
                required: false,
                placeholder: "Enter last name",
                colSize: 6,
            },
            {
                name: "email",
                label: "Email",
                type: "email",
                required: false,
                placeholder: "Enter email address",
                colSize: 6,
            },
            {
                name: "country_code",
                label: "Country Code",
                type: "select",
                options: COUNTRY_CODES.map((country) => ({
                    value: country.country_code,
                    label: `${country.country_code} - ${country.country}`,
                })),
                required: true,
                defaultValue: defaultCountryCode,
                colSize: 3,
            },
            {
                name: "phone_number",
                label: "Phone Number",
                type: "tel",
                required: false,
                placeholder: "Enter phone number",
                colSize: 3,
            },
            {
                name: "age",
                label: "Age",
                type: "number",
                required: false,
                placeholder: "Enter age",
                colSize: 3,
                props: { min: 0, max: 120 }
            },
            {
                name: "registration_date",
                label: "Registration Date",
                type: "date",
                required: false,
                colSize: 6,
            },
            {
                name: "type",
                label: "Type",
                type: "select",
                required: false,
                options: objectTypesList,
                colSize: 6,
            },
            // {
            //     name: "plan_id",
            //     label: "Plan",
            //     type: "select",
            //     options: plansList,
            //     required: true,
            //     colSize: 12,
            //     onChange: (value, formData, setFormData) => {
            //         console.log("Plan selected:", value);
            //         const selectedPlan = plansList.find(p => p.value == value)?.data;
            //         console.log("Selected plan data:", selectedPlan);

            //         const updatedFormData = {
            //             ...formData,
            //             plan_id: value,
            //             selectedPlan: selectedPlan || null
            //         };

            //         setFormData(updatedFormData);
            //         console.log("Form data updated with selected plan:", updatedFormData);
            //     },
            //     renderOptions: (options) => (
            //         <>
            //             <option value="">-- Select a plan --</option>
            //             {options.map(option => (
            //                 <option key={option.value} value={option.value}>
            //                     {option.label}
            //                 </option>
            //             ))}
            //             {options.length === 0 && (
            //                 <option value="" disabled>No active plans available</option>
            //             )}
            //         </>
            //     ),
            //     validationMessage: plansList.length === 0 ?
            //         "No active plans available. Please create a plan first." :
            //         ""
            // },
            {
                name: "plan_details",
                type: "custom",
                colSize: 12,
                render: (formData, setFormData) => {
                    console.log("Rendering PlanDetailsTab with:", {
                        planId: formData.plan_id,
                        selectedPlan: formData.selectedPlan
                    });


                }
            },
            {
                name: "image",
                label: "User Photo",
                type: "file",
                accept: "image/*",
                required: false,
                colSize: 12,
                preview: true,
                maxSize: 2 * 1024 * 1024,
                helperText: "Upload user photo (JPG, PNG, max 2MB)",
                onChange: (file, formData, setFormData) => {
                    if (file) {
                        setFormData((prev) => ({
                            ...prev,
                            image: file,
                        }));
                    }
                },
            },
            {
                name: "status",
                label: "Status",
                type: "toggle",
                options: [
                    { value: true, label: "Active" },
                    { value: false, label: "Inactive" },
                ],
                colSize: 6,
            },
        ],

        validationRules: (formData, allCards, editingCard) => {
            const errors = {};

            if (!formData.user_id) {
                errors.user_id = "Member is required";
            }

            if (!formData.issue_date) {
                errors.issue_date = "Issue date is required";
            }

            if (formData.plan_id) {
                const selectedPlan = plansList.find(p => p.value == formData.plan_id)?.data;
                if (selectedPlan && !selectedPlan.is_active) {
                    errors.plan_id = "Selected plan is inactive. Please select an active plan.";
                }
            }

            if (formData.user_id) {
                const existingCard = allCards?.find(
                    (card) =>
                        card.user_id === formData.user_id &&
                        (card.is_active === true || card.is_active === "true" || card.status === "active") &&
                        card.id !== editingCard?.id
                );

                if (existingCard) {
                    errors.user_id = "Member already has an active library card";
                }
            }

            return errors;
        },

        dataDependencies: {
            users: "user",
            company: "company",
            plans: "plan",
            objecttypes: "objecttype",
        },

        lookupNavigation: {
            user_id: {
                path: "user",
                idField: "id",
                labelField: "name",
            },
            // plan_id: {
            //     path: "plan",
            //     idField: "id",
            //     labelField: "plan_name",
            // }
        },

        features: {
            showImportExport: true,
            showDetailView: true,
            showSearch: true,
            showColumnVisibility: true,
            showCheckbox: true,
            showActions: true,
            showAddButton: true,
            allowEdit: true,
            allowDelete: false,
            showImportButton: false,
            showAdvancedFilter: true,
        },

        filterFields: [
            {
                name: "type_type",
                field: "type_id",
                label: "Member Type",
                type: "select",
                options: objectTypesList.length > 0 ? objectTypesList : [
                    
                    { value: "", label: "All Types" }
                ],
            },
            {
                name: "plan_id",
                field: "plan_id",
                label: "Plan",
                type: "select",
                options: plansList.length > 0 ? [{ value: "", label: "All Plans" }, ...plansList] : [{ value: "", label: "All Plans" }],
            },
            {
                name: "card_number",
                field: "card_number",
                label: "Card Number",
                type: "text",
            },
            {
                name: "first_name",
                field: "first_name",
                label: "First Name",
                type: "text",
            },
            {
                name: "last_name",
                field: "last_name",
                label: "Last Name",
                type: "text",
            },
            {
                name: "email",
                field: "email",
                label: "Email",
                type: "text",
            },
            {
                name: "phone_number",
                field: "phone_number",
                label: "Phone Number",
                type: "text",
            },
            {
                name: "is_active",
                field: "is_active",
                label: "Status",
                type: "boolean",
            },
            {
                name: "registration_date",
                field: "registration_date",
                label: "Registration Date",
                type: "date",
            },
        ],

        details: [
            { key: "card_number", label: "Card Number", type: "text" },
            { key: "name", label: "Full Name", type: "text" },
            { key: "first_name", label: "First Name", type: "text" },
            { key: "last_name", label: "Last Name", type: "text" },
            { key: "user_name", label: "Linked User", type: "text" },
            { key: "email", label: "Email", type: "text" },
            {
                key: "country_code",
                label: "Country Code",
                render: (value) => {
                    const cleanValue = value
                        ? String(value).split(/[—\-]/)[0].trim()
                        : value;
                    const country = COUNTRY_CODES?.find(
                        (c) => c.country_code === cleanValue
                    );
                    return country
                        ? `${country.country_code} (${country.country})`
                        : cleanValue || defaultCountryCode;
                },
            },
            { key: "phone_number", label: "Phone Number", type: "text" },
            { key: "registration_date", label: "Registration Date", type: "date" },
            { key: "type", label: "Type", type: "text" },
            { key: "issue_date", label: "Issue Date", type: "date" },
            { key: "expiry_date", label: "Submission Date", type: "date" },
            // {
            //     key: "plan",
            //     label: "Plan",
            //     render: (value, row) => {
            //         if (value && typeof value === 'object') {
            //             return (
            //                 <div>
            //                     <strong>{value.plan_name}</strong>
            //                     <div className="small text-muted">
            //                         Duration: {value.duration_days} days |
            //                         Books: {value.allowed_books || 0} |
            //                         Status: <Badge bg={value.is_active ? "success" : "secondary"} size="sm">
            //                             {value.is_active ? "Active" : "Inactive"}
            //                         </Badge>
            //                     </div>
            //                 </div>
            //             );
            //         } else if (row.plan_name) {
            //             return row.plan_name;
            //         }
            //         return <span className="text-muted">No Plan</span>;
            //     }
            // },
            {
                key: "status",
                label: "Status",
                type: "badge",
                badgeConfig: {
                    active: "success",
                    inactive: "secondary",
                    true: "success",
                    false: "secondary",
                    true_label: "Active",
                    false_label: "Inactive",
                },
            },
        ],

        customHandlers: {
            generateCardNumber,
            formatDateToDDMMYYYY,
            handleBarcodePreview,

            onDataLoad: (data) => {
                console.log("onDataLoad called with:", data);

                if (Array.isArray(data)) {
                    return data.map((item) => {
                        const updatedItem = { ...item };

                        if (updatedItem.hasOwnProperty("is_active")) {
                            updatedItem.status = updatedItem.is_active ? "active" : "inactive";
                        } else if (!updatedItem.status) {
                            updatedItem.status = "active";
                        }

                        if (!updatedItem.first_name) updatedItem.first_name = "-";
                        if (!updatedItem.last_name) updatedItem.last_name = "-";

                        if (!updatedItem.name) {
                            updatedItem.name = `${updatedItem.first_name || ""} ${updatedItem.last_name || ""}`.trim();
                        }

                        return updatedItem;
                    });
                }
                return data;
            },

            beforeEdit: (item) => {
                console.log("beforeEdit called with:", item);

                const preparedData = { ...item };

                if (preparedData.hasOwnProperty("is_active")) {
                    preparedData.status = preparedData.is_active;
                }


                if (preparedData.plan_id) {
                    const selectedPlan = plansList.find(p => p.value == preparedData.plan_id)?.data;
                    if (selectedPlan) {
                        preparedData.selectedPlan = selectedPlan;
                        console.log("Loaded selectedPlan for editing:", selectedPlan);
                    } else if (preparedData.plan && typeof preparedData.plan === 'object') {
                        preparedData.selectedPlan = preparedData.plan;
                        console.log("Loaded selectedPlan from item.plan:", preparedData.plan);
                    }
                }

                console.log("Prepared data for edit:", preparedData);
                return preparedData;
            },

            beforeSubmit: (formData, isEditing, originalData) => {
                console.log("=== BEFORE SUBMIT ===");
                console.log("Form data:", formData);
                console.log("Is editing:", isEditing);
                console.log("Original data:", originalData);

                const errors = [];
                const submitData = { ...formData };


                if (submitData.selectedPlan) {
                    delete submitData.selectedPlan;
                }

                if (submitData.status !== undefined) {
                    submitData.is_active = Boolean(submitData.status);
                    delete submitData.status;
                }

                // Map type_id to type for backend processing
                if (submitData.type_id) {
                    submitData.type = submitData.type_id;
                    delete submitData.type_id;
                }

                if (!submitData.user_id) {
                    errors.push("Please select a member");
                }

                if (!submitData.issue_date) {
                    errors.push("Issue date is required");
                }


                if (submitData.plan_id) {
                    const selectedPlan = plansList.find(p => p.value == submitData.plan_id)?.data;
                    if (selectedPlan && !selectedPlan.is_active) {
                        errors.push("Selected plan is inactive. Please select an active plan.");
                    }
                }


                if (submitData.image && submitData.image.size > 2 * 1024 * 1024) {
                    errors.push("Image size must be less than 2MB");
                }

                console.log("Processed submit data:", submitData);
                console.log("Errors:", errors);

                return {
                    errors,
                    processedData: submitData
                };
            },

            afterSubmit: (response, formData, isEditing) => {
                console.log("=== AFTER SUBMIT ===");
                console.log("Response:", response);
                console.log("Form data:", formData);
                console.log("Is editing:", isEditing);

                return response;
            }
        },

        transformResponse: (response) => {
            console.log("transformResponse called with:", response);

            if (response && response.data) {
                let data = response.data;

                if (data.data && Array.isArray(data.data)) {
                    data = data.data;
                } else if (data.success && data.data) {
                    data = data.data;
                }

                if (Array.isArray(data)) {
                    data = data.map(item => {
                        const updatedItem = { ...item };

                        if (!updatedItem.status && updatedItem.hasOwnProperty("is_active")) {
                            updatedItem.status = updatedItem.is_active ? "active" : "inactive";
                        }

                        if (!updatedItem.name) {
                            updatedItem.name = `${updatedItem.first_name || ""} ${updatedItem.last_name || ""}`.trim();
                        }

                        return updatedItem;
                    });
                }

                return data;
            }
            return response;
        },

        exportConfig: {
            includeFields: [
                'card_number', 'name', 'email', 'phone_number', 'plan_name', 'status'
            ],
            fieldLabels: {
                name: 'Full Name',
                plan_name: 'Plan'
            }
        }
    };
};



