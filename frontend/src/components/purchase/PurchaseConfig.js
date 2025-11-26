export const getPurchaseConfig = (data = {}, props = {}) => {
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
            render: (value) => value ? new Date(value).toLocaleDateString() : "-"
        },
        {
            field: "notes",
            label: "Notes",
        },
    ];

    // const formFields = [
    //     {
    //         name: "vendor_id",
    //         label: "Vendor",
    //         type: "select",
    //         required: true,
    //         options: vendors.map(vendor => ({
    //             value: vendor.id,
    //             label: vendor.name
    //         }))
    //     },
    //     {
    //         name: "book_id",
    //         label: "Book",
    //         type: "select",
    //         required: true,
    //         options: books.map(book => ({
    //             value: book.id,
    //             label: book.title
    //         }))
    //     },
    //     {
    //         name: "quantity",
    //         label: "Quantity",
    //         type: "number",
    //         required: true
    //     },
    //     {
    //         name: "unit_price",
    //         label: "Unit Price",
    //         type: "number",
    //         required: true
    //     },
    //     {
    //         name: "purchase_date",
    //         label: "Purchase Date",
    //         type: "date",
    //         required: true
    //     },
    //     {
    //         name: "notes",
    //         label: "Notes",
    //         type: "textarea"
    //     }
    // ];

    return {
        moduleName: "purchase",
        moduleLabel: "Purchase",
        apiEndpoint: "purchase",
        columns: allColumns,

        features: {
            showBulkInsert: false,
            showImportExport: true,
            showSearch: true,
            showColumnVisibility: true,
            showCheckbox: true,
            showActions: true,
            showAddButton: true,
            allowEdit: true,
            allowDelete: true
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
            }
        }
        ,
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