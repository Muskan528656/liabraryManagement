import { Badge } from "react-bootstrap";
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
    console.log("externalDataexternalData", externalData);

    let defaultCountryCode = "";
    let safeSubscriptions = [];

    try {

        const companyApi = new DataApi("company");
        const companyResponse = await companyApi.fetchAll();
        if (
            Array.isArray(companyResponse.data) &&
            companyResponse.data.length > 0
        ) {
            const companyWithCountryCode = companyResponse.data.find(
                (c) => c && c.country_code
            );
            console.log("Company with country code:", companyWithCountryCode);

            if (companyWithCountryCode && companyWithCountryCode.country_code) {
                const countryCodeStr = String(
                    companyWithCountryCode.country_code
                ).trim();
                console.log("Original country_code string:", countryCodeStr);

                const codePart = countryCodeStr.split(/[—\-]/)[0].trim();
                console.log("Extracted code part:", codePart);

                if (codePart && !codePart.startsWith("+")) {
                    defaultCountryCode = "+" + codePart;
                } else if (codePart) {
                    defaultCountryCode = codePart;
                }

                console.log("Final defaultCountryCode:", defaultCountryCode);
            }
        }


        const subscriptionApi = new DataApi("subscriptions");
        const subscriptionResponse = await subscriptionApi.fetchAll();
        console.log("Raw subscription response:", subscriptionResponse);

        if (subscriptionResponse && subscriptionResponse.data) {

            if (Array.isArray(subscriptionResponse.data)) {
                safeSubscriptions = subscriptionResponse.data;
            } else if (subscriptionResponse.data.data && Array.isArray(subscriptionResponse.data.data)) {
                safeSubscriptions = subscriptionResponse.data.data;
            } else if (subscriptionResponse.success && subscriptionResponse.data) {
                safeSubscriptions = Array.isArray(subscriptionResponse.data)
                    ? subscriptionResponse.data
                    : [];
            }
        }

        console.log("Processed subscriptions:", safeSubscriptions);

    } catch (error) {
        console.error("Error fetching data:", error);

        safeSubscriptions = externalData.subscriptions?.data ||
            externalData.subscriptions ||
            [];
    }

    console.log("defaultCountryCode", defaultCountryCode);
    console.log("Safe subscriptions:", safeSubscriptions);


    const subscriptionOptions = Array.isArray(safeSubscriptions)
        ? safeSubscriptions
            .filter(sub => sub && sub.id)  // Filter out invalid entries
            .map(sub => ({
                value: String(sub.id),  // Ensure value is string
                label: `${sub.plan_name || sub.name || "Unnamed"} (Books: ${sub.allowed_books || sub.book_limit || 0})`
            }))
        : [];

    console.log("Subscription options:", subscriptionOptions);

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
        // {
        //     field: "subscription_display",
        //     label: "Subscription",
        //     sortable: true,
        //     render: (value, row) => {

        //         if (row.subscription_name && row.subscription_name.trim() !== "") {
        //             return row.subscription_name;
        //         }


        //         const subId = row.subscription_id;
        //         if (!subId || subId === "null" || subId === "undefined" || String(subId).trim() === "") {
        //             return "-";
        //         }


        //         const subs = safeSubscriptions || [];
        //         const subscription = subs.find(sub =>
        //             String(sub.id) === String(subId)
        //         );

        //         if (subscription) {
        //             return subscription.plan_name || subscription.name || "Unknown";
        //         }


        //         return "-";
        //     }
        // },
        // {
        //     field: "allowed_books",
        //     label: "Allowed Books",
        //     sortable: true,
        //     render: (value, row) => {

        //         if (value !== null && value !== undefined && value !== "") {
        //             return value;
        //         }


        //         const subId = row.subscription_id;
        //         if (subId && safeSubscriptions.length > 0) {
        //             const subscription = safeSubscriptions.find(sub =>
        //                 String(sub.id) === String(subId)
        //             );
        //             if (subscription) {
        //                 return subscription.allowed_books || subscription.book_limit || "Subscription default";
        //             }
        //         }

        //         return "-";
        //     }
        // },
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
            registration_date: new Date().toISOString().split("T")[0],
            type: "",
            //       subscription_id: "",
            allowed_books: null,
            issue_date: new Date().toISOString().split("T")[0],
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
                placeholder: "Select country code",
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
                options: [
                    { value: "student", label: "Student" },
                    { value: "faculty", label: "Faculty" },
                    { value: "staff", label: "Staff" },
                    { value: "guest", label: "Guest" },
                ],
                placeholder: "Select type",
                colSize: 6,
            },
            // {
            //     name: "subscription_id",
            //     label: "Subscription",
            //     type: "select",
            //     required: true,
            //     options: subscriptionOptions,
            //     placeholder: "Select subscription plan",
            //     colSize: 6,
            //     onChange: (value, formData, setFormData) => {

            //         console.log("Subscription changed to:", value);
            //         if (value && !formData.allowed_books_manual) {
            //             const selectedSubscription = safeSubscriptions.find(sub =>
            //                 String(sub.id) === String(value)
            //             );
            //             console.log("Selected subscription:", selectedSubscription);
            //             if (selectedSubscription) {
            //                 setFormData(prev => ({
            //                     ...prev,
            //                     allowed_books: selectedSubscription.allowed_books || selectedSubscription.book_limit || null
            //                 }));
            //             }
            //         }
            //     }
            // },
            // {
            //     name: "allowed_books",
            //     label: "Allowed Books (Override)",
            //     type: "number",
            //     required: false,
            //     placeholder: "Leave empty to use subscription default",
            //     colSize: 6,
            //     min: 0,
            //     max: 100,
            //     step: 1,
            //     helperText: "Leave empty to use subscription limit. 0 = unlimited?",
            //     onChange: (value, formData, setFormData) => {
            //         console.log("Allowed books changed:", value);

            //         const isManual = value !== null && value !== "" && value !== undefined;
            //         console.log("Is manual:", isManual);
            //         setFormData(prev => ({
            //             ...prev,
            //             allowed_books_manual: isManual
            //         }));


            //         if (value === "" || value === null || value === undefined) {
            //             setFormData(prev => ({
            //                 ...prev,
            //                 allowed_books: null
            //             }));
            //         } else {
            //             setFormData(prev => ({
            //                 ...prev,
            //                 allowed_books: parseInt(value) || 0
            //             }));
            //         }
            //     }
            // },
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
            console.log("FormData in validation:", formData);
            const errors = {};

            if (!formData.user_id) {
                errors.user_id = "Member is required";
            }

            if (!formData.issue_date) {
                errors.issue_date = "Issue date is required";
            }

            const existingCard = allCards?.find(
                (card) =>
                    card.user_id === formData.user_id &&
                    card.is_active &&
                    card.id !== editingCard?.id
            );

            if (existingCard) {
                errors.user_id = "Member already has an active library card";
            }

            if (formData.allowed_books !== null && formData.allowed_books !== undefined && formData.allowed_books !== "") {
                const allowedBooks = parseInt(formData.allowed_books);
                if (isNaN(allowedBooks) || allowedBooks < 0) {
                    errors.allowed_books = "Allowed books must be a positive number";
                }
            }

            return errors;
        },

        dataDependencies: {
            users: "user",
            subscriptions: "subscriptions",
            company: "company",
        },

        lookupNavigation: {
            user_id: {
                path: "user",
                idField: "id",
                labelField: "name",
            },
            subscription_id: {
                path: "subscriptions",
                idField: "id",
                labelField: "plan_name"
            }
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
        },

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
            {
                key: "subscription_display",
                label: "Subscription",
                type: "text",
                render: (value, data) => {

                    if (data.subscription_name && data.subscription_name.trim() !== "") {
                        return data.subscription_name;
                    }


                    const subId = data.subscription_id;
                    if (subId && safeSubscriptions.length > 0) {
                        const subscription = safeSubscriptions.find(sub =>
                            String(sub.id) === String(subId)
                        );
                        if (subscription) {
                            return subscription.plan_name || subscription.name || "-";
                        }
                    }

                    return "-";
                }
            },
            // {
            //     key: "allowed_books",
            //     label: "Allowed Books",
            //     type: "text",
            //     render: (value, data) => {
            //         if (value !== null && value !== undefined && value !== "") {
            //             return value;
            //         }


            //         const subId = data.subscription_id;
            //         if (subId && safeSubscriptions.length > 0) {
            //             const subscription = safeSubscriptions.find(sub =>
            //                 String(sub.id) === String(subId)
            //             );
            //             if (subscription) {
            //                 return subscription.allowed_books || subscription.book_limit || "Subscription default";
            //             }
            //         }

            //         return "-";
            //     }
            // },
            { key: "issue_date", label: "Issue Date", type: "date" },
            { key: "expiry_date", label: "Submission Date", type: "date" },
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
                if (Array.isArray(data)) {
                    return data.map((item) => {
                        const updatedItem = { ...item };


                        if (updatedItem.hasOwnProperty("is_active")) {
                            updatedItem.status = updatedItem.is_active ? "active" : "inactive";
                        } else if (!updatedItem.status) {
                            updatedItem.status = "active";
                        }


                        const subId = updatedItem.subscription_id;

                        if (subId &&
                            subId !== null &&
                            subId !== undefined &&
                            subId !== "null" &&
                            subId !== "undefined" &&
                            String(subId).trim() !== "") {


                            const subscription = safeSubscriptions.find(sub =>
                                String(sub.id) === String(subId)
                            );


                            if (subscription) {
                                updatedItem.subscription_name = subscription.plan_name || subscription.name || "";
                                updatedItem.subscription_display = subscription.plan_name || subscription.name || "";
                            } else {
                                updatedItem.subscription_name = "";
                                updatedItem.subscription_display = "";
                            }
                        } else {
                            updatedItem.subscription_name = "";
                            updatedItem.subscription_display = "";
                        }


                        if (!updatedItem.first_name) updatedItem.first_name = "-";
                        if (!updatedItem.last_name) updatedItem.last_name = "-";


                        if (!updatedItem.name) {
                            updatedItem.name = `${updatedItem.first_name} ${updatedItem.last_name}`.trim();
                        }

                        return updatedItem;
                    });
                }
                return data;
            },

            getSubscriptionOptions: () => {
                return subscriptionOptions;
            },

            beforeEdit: (item) => {

                const preparedData = { ...item };
                console.log("Before edit - original item:", item);


                if (preparedData.allowed_books !== null && preparedData.allowed_books !== undefined) {
                    preparedData.allowed_books = String(preparedData.allowed_books);
                } else {
                    preparedData.allowed_books = ""; // Empty string for form
                }


                if (preparedData.hasOwnProperty("is_active")) {
                    preparedData.status = preparedData.is_active;
                }

                console.log("Before edit - prepared data:", preparedData);
                return preparedData;
            },

            beforeSubmit: (formData, isEditing, originalData) => {
                console.log("=== BEFORE SUBMIT ===");
                console.log("Form data:", formData);
                console.log("Is editing:", isEditing);
                console.log("Original data:", originalData);

                const errors = [];


                const submitData = { ...formData };
                delete submitData.allowed_books_manual;


                if (submitData.allowed_books === "" || submitData.allowed_books === null || submitData.allowed_books === undefined) {

                    submitData.allowed_books = null;
                } else {

                    const allowedBooks = parseInt(submitData.allowed_books);
                    if (isNaN(allowedBooks)) {
                        errors.push("Allowed books must be a valid number");
                    } else {
                        submitData.allowed_books = allowedBooks;
                    }
                }


                if (submitData.status !== undefined) {
                    submitData.is_active = Boolean(submitData.status);
                    delete submitData.status; // Remove status field
                }


                if (!submitData.user_id) {
                    errors.push("Please select a member");
                }

                if (!submitData.issue_date) {
                    errors.push("Issue date is required");
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
            if (response && response.data) {
                let data = response.data;

                if (data.data && Array.isArray(data.data)) {
                    data = data.data;
                } else if (data.success && data.data) {
                    data = data.data;
                }

                if (Array.isArray(data) && safeSubscriptions.length > 0) {
                    data = data.map(item => {
                        const updatedItem = { ...item };


                        const subId = updatedItem.subscription_id;

                        if (subId && subId !== "null" && subId !== "undefined" && String(subId).trim() !== "") {
                            const subscription = safeSubscriptions.find(sub =>
                                String(sub.id) === String(subId)
                            );

                            if (subscription) {
                                updatedItem.subscription_name = subscription.plan_name || subscription.name || "";
                                updatedItem.subscription_display = subscription.plan_name || subscription.name || "";
                            } else {
                                updatedItem.subscription_name = "";
                                updatedItem.subscription_display = "";
                            }
                        } else {
                            updatedItem.subscription_name = "";
                            updatedItem.subscription_display = "";
                        }


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
                'card_number', 'name', 'email', 'phone_number',
                'subscription_name', 'allowed_books', 'status'
            ],
            fieldLabels: {
                allowed_books: 'Allowed Books',
                subscription_name: 'Subscription',
                name: 'Full Name'
            }
        }
    };
};