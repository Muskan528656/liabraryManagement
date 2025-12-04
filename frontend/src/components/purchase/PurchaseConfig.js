import { convertToUserTimezone } from "../../utils/convertTimeZone";

export const getPurchaseConfig = (data = {}, props = {}, timeZone) => {
    const { vendors = [], books = [], authors = [], categories = [] } = data;

    const allColumns = [
        {
            field: "purchase_serial_no",
            label: "Purchase Serial No",
            sortable: true,
        },
        {
            field: "vendor_name",
            label: "Vendor",
            sortable: true,
        },
        {
            field: "book_title",
            label: "Book",
            sortable: true,
        },
        { field: "book_isbn", label: "ISBN" },
        {
            field: "quantity",
            label: "Quantity",
            sortable: true,
        },
        {
            field: "unit_price",
            label: "Unit Price",
            sortable: true,
            render: (value, record) => `₹${parseFloat(record.unit_price || 0).toFixed(2)}`
        },
        {
            field: "total_amount",
            label: "Total Amount",
            sortable: true,
            render: (value, record) => `₹${parseFloat(record.total_amount || 0).toFixed(2)}`
        },
        {
            field: "purchase_date",
            label: "Purchase Date",
            sortable: true,
            // render: (value) => value ? new Date(value).toLocaleDateString() : "-"
              render: (value) => {
                return convertToUserTimezone(value, timeZone);
              }
        },
        {
            field: "notes",
            label: "Notes",
        },
    ];

    const formFields = [
        {
            name: "purchase_serial_no",
            label: "Purchase Serial No",
            type: "text",
            required: true,
            disabled: true,
            readOnly: true
        },
        {
            name: "vendor_id",
            label: "Vendor",
            type: "select",
            required: true,
            options: vendors.map(vendor => ({
                value: vendor.id,
                label: vendor.name
            }))
        },
        {
            name: "book_id",
            label: "Book",
            type: "select",
            required: true,
            options: books.map(book => ({
                value: book.id,
                label: book.title
            }))
        },
        {
            name: "quantity",
            label: "Quantity",
            type: "number",
            required: true,
            props: {
                min: 1
            }
        },
        {
            name: "unit_price",
            label: "Unit Price",
            type: "number",
            required: true,
            props: {
                min: 0,
                step: 0.01
            }
        },
        {
            name: "total_amount",
            label: "Total Amount",
            type: "number",
            required: true,
            disabled: true,
            readOnly: true,
            calculateValue: (formData) => {

                const quantity = parseFloat(formData.quantity) || 0;
                const unitPrice = parseFloat(formData.unit_price) || 0;
                return (quantity * unitPrice).toFixed(2);
            }
        },
        {
            name: "purchase_date",
            label: "Purchase Date",
            type: "date",
            required: true
        },
        {
            name: "notes",
            label: "Notes",
            type: "textarea"
        }
    ];

    return {
        moduleName: "purchase",
        moduleLabel: "Purchase",
        apiEndpoint: "purchase",
        columns: allColumns,
        field: { details: formFields },
        formFields: formFields,

        features: {
            showBulkInsert: false,
            showImportExport: true,
            showSearch: true,
            showColumnVisibility: true,
            showCheckbox: true,
            showActions: true,
            showAddButton: true,
            allowEdit: true,
            allowDelete: false
        },
        dataDependencies: {
            vendors: "vendor",
            books: "book",
            authors: "author",
            categories: "category"
        },

        customHandlers: {
            handleBulkInsert: () => {
                window.location.href = '/purchase/bulk';
            },
            handleAdd: (navigate) => {
                navigate('/purchase/bulk');
            },

            onFormDataChange: (formData, setFormData) => {
                const quantity = parseFloat(formData.quantity) || 0;
                const unitPrice = parseFloat(formData.unit_price) || 0;
                const totalAmount = quantity * unitPrice;

                if (formData.total_amount !== totalAmount) {
                    setFormData(prev => ({
                        ...prev,
                        total_amount: totalAmount.toFixed(2)
                    }));
                }
            }
        },
        exportColumns: [
            { key: "vendor_name", header: "Vendor", width: 20 },
            { key: "book_title", header: "Book", width: 20 },
            { key: "book_isbn", header: "ISBN", width: 15 },
            { key: "quantity", header: "Quantity", width: 10 },
            { key: "unit_price", header: "Unit Price", width: 15 },
            { key: "total_amount", header: "Total Amount", width: 15 },
            { key: "purchase_date", header: "Purchase Date", width: 15 },
            { key: "notes", header: "Notes", width: 20 },
        ],

        lookupNavigation: {
            author_name: {
                path: "author",
                idField: "author_id",
                labelField: "author_name"
            },
            category_name: {
                path: "category",
                idField: "category_id",
                labelField: "category_name"
            },
            vendor_name: {
                path: "vendor",
                idField: "vendor_id",
                labelField: "vendor_name"
            },
            book_title: {
                path: "book",
                idField: "book_id",
                labelField: "book_title"
            }
        }

    };
};