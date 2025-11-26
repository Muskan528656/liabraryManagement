import { Badge, Button } from "react-bootstrap";

const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

const calculateISBN13CheckDigit = (first12Digits) => {
    if (first12Digits.length !== 12) {
        throw new Error("ISBN-13 requires exactly 12 digits for check digit calculation");
    }

    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(first12Digits[i], 10);
        sum += (i % 2 === 0) ? digit : digit * 3;
    }

    const remainder = sum % 10;
    const checkDigit = remainder === 0 ? 0 : 10 - remainder;
    return checkDigit.toString();
};

const generateISBN13Number = (card) => {
    const prefix = "978";
    const uuidPart = card.id?.replace(/-/g, '').substring(0, 8) || '00000000';
    let numericPart = '';

    for (let i = 0; i < uuidPart.length; i++) {
        const charCode = uuidPart.charCodeAt(i);
        numericPart += (charCode % 10).toString();
    }

    const cardIdNumeric = numericPart.padEnd(6, '0').substring(0, 6);
    const timestamp = Date.now().toString().slice(-4);
    const base12Digits = prefix + cardIdNumeric + timestamp;
    const final12Digits = base12Digits.slice(0, 12);
    const checkDigit = calculateISBN13CheckDigit(final12Digits);

    return final12Digits + checkDigit;
};

const generateCardNumber = (card) => {
    try {
        const isbn13Number = generateISBN13Number(card);
        if (/^\d+$/.test(isbn13Number) && isbn13Number.length === 13) {
            return isbn13Number;
        }
    } catch (error) {
        console.warn("Error generating ISBN for card number, using fallback");
    }

    const uuidPart = card.id?.replace(/-/g, '').substring(0, 8).toUpperCase() || 'LIB00000';
    return `LIB${uuidPart}`;
};

export const getLibraryCardConfig = (externalData = {}) => {
    const customHandlers = externalData.customHandlers || {};
    const handleBarcodePreview = customHandlers.handleBarcodePreview ||
        ((card) => console.warn('Barcode preview handler not provided', card));

    const defaultColumns = [
        {
            name: "user_image",
            label: "Photo",
            type: "image",
            width: "80px",
            render: (value, row) => {
                if (value) {
                    return `<img src="${value}" alt="${row.user_name}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" />`;
                }
                return `<div style="width: 50px; height: 50px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center;">
                  <i class="fa-solid fa-user"></i>
              </div>`;
            }
        },
        {
            field: "card_number",
            label: "Card Number",
            sortable: true,
        },
        { field: "user_name", label: "User Name", sortable: true },
        { field: "user_email", label: "Email", sortable: true },
        {
            field: "issue_date",
            label: "Issue Date",
            sortable: true,
            render: (value) => formatDateToDDMMYYYY(value)
        },
        {
            field: "expiry_date",
            label: "Submission Date",
            sortable: true,
            render: (value) => value ? formatDateToDDMMYYYY(value) : '-'
        },
        {
            field: "is_active",
            label: "Status",
            sortable: true,
            render: (value) => (
                <Badge bg={value ? "success" : "secondary"}>
                    {value ? "Active" : "Inactive"}
                </Badge>
            )
        },
    ];

    return {
        moduleName: "librarycards",
        moduleLabel: "Library Members",
        apiEndpoint: "librarycard",
        columns: defaultColumns,
        initialFormData: {
            user_id: "",
            issue_date: new Date().toISOString().split('T')[0],
            expiry_date: "",
            is_active: true,
            image: null
        },

        formFields: [
            {
                name: "user_id",
                label: "Member", // Changed from "User" to "Member"
                type: "select",
                options: "users", // This should match your API endpoint for users
                required: true,
                placeholder: "Select member",
                colSize: 12,
                optionConfig: {
                    valueKey: "id",
                    labelKey: "name", // Make sure your user API returns 'name' field
                    // If your API returns different field names, adjust accordingly:
                    // valueKey: "user_id",
                    // labelKey: "user_name"
                },
                // Add this to ensure proper data loading
                loadOptions: async (api) => {
                    try {
                        const response = await api.get("/user"); // Adjust endpoint as needed
                        return response.data || [];
                    } catch (error) {
                        console.error("Error loading users:", error);
                        return [];
                    }
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
                        setFormData(prev => ({
                            ...prev,
                            image: file
                        }));
                    }
                }
            },
            {
                name: "issue_date",
                label: "Issue Date",
                type: "date",
                required: true,
                colSize: 6,
                onChange: (value, formData, setFormData) => {
                    if (value) {
                        // Use dynamic import for DataApi
                        import("../../api/dataApi").then(({ default: DataApi }) => {
                            const settingsApi = new DataApi("librarysettings");
                            settingsApi.get("/all").then(response => {
                                let durationDays = 365; // Default to 1 year

                                if (response.data && response.data.success && response.data.data) {
                                    durationDays = parseInt(response.data.data.membership_validity_days || response.data.data.duration_days || 365);
                                } else if (response.data && typeof response.data === "object" && !Array.isArray(response.data)) {
                                    durationDays = parseInt(response.data.membership_validity_days || response.data.duration_days || 365);
                                }

                                // Calculate submission date
                                const issueDate = new Date(value);
                                const submissionDate = new Date(issueDate);
                                submissionDate.setDate(submissionDate.getDate() + durationDays);

                                setFormData(prev => ({
                                    ...prev,
                                    issue_date: value,
                                    expiry_date: submissionDate.toISOString().split('T')[0]
                                }));
                            }).catch(error => {
                                console.error("Error fetching settings:", error);
                                // If settings fetch fails, use default 365 days
                                const issueDate = new Date(value);
                                const submissionDate = new Date(issueDate);
                                submissionDate.setDate(submissionDate.getDate() + 365);

                                setFormData(prev => ({
                                    ...prev,
                                    issue_date: value,
                                    expiry_date: submissionDate.toISOString().split('T')[0]
                                }));
                            });
                        }).catch(error => {
                            console.error("Error importing DataApi:", error);
                            // If import fails, use default 365 days
                            const issueDate = new Date(value);
                            const submissionDate = new Date(issueDate);
                            submissionDate.setDate(submissionDate.getDate() + 365);

                            setFormData(prev => ({
                                ...prev,
                                issue_date: value,
                                expiry_date: submissionDate.toISOString().split('T')[0]
                            }));
                        });
                    } else {
                        setFormData(prev => ({
                            ...prev,
                            issue_date: value
                        }));
                    }
                }
            },
            {
                name: "expiry_date",
                label: "Submission Date",
                type: "date",
                colSize: 6,
            },
            {
                name: "is_active",
                label: "Active Status",
                type: "checkbox",
                colSize: 12,
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

            const existingCard = allCards?.find(
                card => card.user_id === formData.user_id &&
                    card.is_active &&
                    card.id !== editingCard?.id
            );

            if (existingCard) {
                errors.user_id = "Member already has an active library card";
            }

            return errors;
        },

        dataDependencies: {
            users: "user"
        },

        lookupNavigation: {
            user_id: {
                path: "user",
                idField: "id",
                labelField: "name"
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
            allowDelete: true
        },

        details: [
            { key: "card_number", label: "Card Number", type: "text" },
            { key: "user_name", label: "Member Name", type: "text" },
            {
                key: "user_email",
                label: "Email",
                type: "text"
            },
            { key: "issue_date", label: "Issue Date", type: "date" },
            { key: "expiry_date", label: "Submission Date", type: "date" },
            {
                key: "is_active",
                label: "Status",
                type: "badge",
                badgeConfig: {
                    true: "success",
                    false: "secondary",
                    true_label: "Active",
                    false_label: "Inactive",
                }
            },
        ],

        customHandlers: {
            generateCardNumber,
            generateISBN13Number,
            calculateISBN13CheckDigit,
            formatDateToDDMMYYYY,
            handleBarcodePreview
        },

        beforeSubmit: (formData, isEditing) => {
            const errors = [];

            if (!formData.user_id) {
                errors.push("Please select a member");
            }

            if (!formData.issue_date) {
                errors.push("Issue date is required");
            }

            if (formData.image && formData.image.size > 2 * 1024 * 1024) {
                errors.push("Image size must be less than 2MB");
            }

            return errors;
        }
    };
};