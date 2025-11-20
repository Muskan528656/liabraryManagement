// config/libraryCardConfig.js
import { Badge, Button } from "react-bootstrap";

// Helper functions first
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

export const getLibraryCardConfig = (externalData = {}, props = {}) => {
    // Extract custom handlers from props if available
    const {
        handleBarcodePreview = () => console.warn('Barcode preview handler not provided'),
        ...otherHandlers
    } = props.customHandlers || {};

    return {
        moduleName: "librarycards",
        moduleLabel: "Library Card",
        apiEndpoint: "librarycard",
        initialFormData: {
            user_id: "",
            issue_date: new Date().toISOString().split('T')[0],
            expiry_date: "",
            is_active: true,
        },
        columns: [
            {
                field: "card_number",
                label: "Card Number",
                sortable: true,
                render: (value, card) => (
                    <div>
                        <strong style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                            {generateCardNumber(card)}
                        </strong>
                        <div style={{ fontSize: '11px', color: '#666' }}>
                            ISBN-13 Format
                        </div>
                    </div>
                )
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
                label: "Expiry Date",
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
            {
                field: "barcode",
                label: "Barcode",
                sortable: false,
                render: (value, card) => (
                    <div className="d-flex align-items-center">
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleBarcodePreview(card)}
                            title="View Barcode"
                        >
                            <i className="fa-solid fa-eye me-1"></i>
                            View Barcode
                        </Button>
                    </div>
                )
            }
        ],
        formFields: [
            {
                name: "user_id",
                label: "User",
                type: "select",
                options: "users",
                required: true,
                placeholder: "Select user",
                colSize: 12,
            },
            {
                name: "issue_date",
                label: "Issue Date",
                type: "date",
                required: true,
                colSize: 6,
            },
            {
                name: "expiry_date",
                label: "Expiry Date",
                type: "date",
                colSize: 6,
            },
            {
                name: "is_active",
                label: "Active Status",
                type: "checkbox",
                colSize: 12,
            }
        ],
        validationRules: (formData, allCards, editingCard) => {
            const errors = [];
            if (!formData.user_id) errors.push("User is required");
            if (!formData.issue_date) errors.push("Issue date is required");

            // Check if user already has an active card
            const existingCard = allCards.find(
                card => card.user_id === formData.user_id &&
                    card.is_active &&
                    card.id !== editingCard?.id
            );
            if (existingCard) errors.push("User already has an active library card");

            return errors;
        },
        dataDependencies: {
            users: "user"
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
            { key: "user_name", label: "User Name", type: "text" },
            { key: "user_email", label: "Email", type: "text" },
            { key: "issue_date", label: "Issue Date", type: "date" },
            { key: "expiry_date", label: "Expiry Date", type: "date" },
            { key: "is_active", label: "Status", type: "badge" },
        ],
        customHandlers: {
            generateCardNumber,
            generateISBN13Number,
            calculateISBN13CheckDigit,
            formatDateToDDMMYYYY,

            handleBarcodePreview: () => {
                console.warn('Barcode preview handler not implemented');
            }
        }
    };
};