// config/booksConfig.js
export const getBooksConfig = (externalData = {}, props = {}) => {
    // Multiple data sources - priority order
    const authors =
        props.authors ||           // 1. Props se aaya data (highest priority)
        externalData.authors ||    // 2. Fetched data  
        externalData.author ||     // 3. Alternative key
        [];                       // 4. Default

    const categories =
        props.categories ||
        externalData.categories ||
        externalData.category ||
        [];

    return {
        moduleName: "book",
        moduleLabel: "Book",
        apiEndpoint: "book",
        initialFormData: {
            title: "",
            author_id: "",
            category_id: "",
            isbn: "",
            total_copies: 1,
            available_copies: 1,
            language: ""
        },
        columns: [
            {
                field: "title",
                label: "Title",
            },
            {
                field: "author_name",
                label: "Author",
            },
            {
                field: "category_name",
                label: "Category",
            },
            {
                field: "isbn",
                label: "ISBN",
            },
            {
                field: "total_copies",
                label: "Total Copies",
            },
            {
                field: "available_copies",
                label: "Available Copies",
            }
        ],
        formFields: [
            {
                name: "title",
                label: "Title",
                type: "text",
                required: true,
                placeholder: "Enter book title",
                colSize: 12,
            },
            {
                name: "author_id",
                label: "Author",
                type: "select",
                options: "authors",
                required: true,
                placeholder: "Select author",
                colSize: 6,
            },
            {
                name: "category_id",
                label: "Category",
                type: "select",
                options: "categories",
                required: true,
                placeholder: "Select category",
                colSize: 6,
            },
            {
                name: "isbn",
                label: "ISBN",
                type: "text",
                required: true,
                placeholder: "Enter ISBN",
                colSize: 6,
            },
            {
                name: "language",
                label: "Language",
                type: "text",
                placeholder: "Enter language",
                colSize: 6,
            },
            {
                name: "total_copies",
                label: "Total Copies",
                type: "number",
                placeholder: "Enter total copies",
                colSize: 6,
                props: {
                    min: 1
                }
            },
            {
                name: "available_copies",
                label: "Available Copies",
                type: "number",
                placeholder: "Enter available copies",
                colSize: 6,
                props: {
                    min: 0
                }
            }
        ],
        validationRules: (formData, allBooks, editingBook) => {
            const errors = [];
            if (!formData.title?.trim()) errors.push("Title is required");
            if (!formData.author_id) errors.push("Author is required");
            if (!formData.category_id) errors.push("Category is required");
            if (!formData.isbn?.trim()) errors.push("ISBN is required");

            const duplicate = allBooks.find(
                book => book.isbn === formData.isbn && book.id !== editingBook?.id
            );
            if (duplicate) errors.push("Book with this ISBN already exists");

            return errors;
        },
        dataDependencies: {
            authors: "author",
            categories: "category"
        },
        features: {
            showBulkInsert: true,        
            showImportExport: true,       
            showDetailView: true,         // Detail view enable
            showSearch: true,             // Search enable
            showColumnVisibility: true,   // Column toggle enable
            showCheckbox: true,           // Row selection enable
            showActions: true,            // Action buttons enable
            showAddButton: true,          // Add button enable
            allowEdit: true,              // Edit permission
            allowDelete: true,            // Delete permission
        },

        details: [
            { key: "title", label: "Title", type: "text" },
            { key: "author_name", label: "Author", type: "text" },
            { key: "category_name", label: "Category", type: "text" },
            { key: "isbn", label: "ISBN", type: "text" },
            { key: "language", label: "Language", type: "text" },
            { key: "total_copies", label: "Total Copies", type: "number" },
            { key: "available_copies", label: "Available Copies", type: "number" },
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
            }
        }

    };

};