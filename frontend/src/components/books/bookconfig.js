import { createModel } from "../common/UniversalCSVXLSXImporter";
export const getBooksConfig = (externalData = {}, props = {}, permissions = {}) => {
    const authors = props.authors || externalData.authors || externalData.author || [];

    const categories = props.categories || externalData.categories || externalData.category || [];

    const publishers = props.publishers || externalData.publishers || externalData.publisher || [];

    const BookModel = createModel({
        modelName: "Book",
        fields: {
            title: "Title",
            price: "Price",
            author_id: "Author",
            category_id: "Category",
            publisher_id: "Publisher",
            isbn: "ISBN",
            language: "Language",
            total_copies: "Total Copies",
            available_copies: "Available Copies",
            min_age: "Min Age",
            max_age: "Max Age",
        },
        required: ["title", "author_id", "category_id", "isbn", "min_age"]
    });

    const inventoryBindings = [
        { value: "hardcover", label: "Hardcover" },
        { value: "paperback", label: "Paperback" },
        { value: "spiral", label: "Spiral" },
    ];
    return {
        moduleName: "book",
        moduleLabel: "Book",
        apiEndpoint: "book",
        importMatchFields: ["isbn"],

        autoCreateRelated: {
            authors: {
                endpoint: "author",
                labelField: "name"
            },
            categories: {
                endpoint: "category",
                labelField: "name"
            },
            publishers: {
                endpoint: "publisher",
                labelField: "name",
                extraPayload: {
                    email: "auto@generated.com",
                    phone: "0000000000",
                    city: "Auto Generated",
                    country: "Auto Generated",
                    state: "",
                    salutation: "Mr."
                }
            }
        },

        initialFormData: {
            title: "",
            author_id: "",
            category_id: "",
            publisher_id: "",
            isbn: "",
            total_copies: 1,
            available_copies: 1,
            language: "",
            min_age: "",
            max_age: ""
        },
        columns: [
            { field: "title", label: "Title" },
            { field: "price", label: "Price" },
            { field: "author_name", label: "Author" },
            { field: "category_name", label: "Category" },
            { field: "publisher_name", label: "Publisher" },
            { field: "isbn", label: "ISBN" },
            { field: "min_age", label: "Min Age" },
            { field: "max_age", label: "Max Age" },
            { field: "available_copies", label: "Available Copies" }
        ],
        formFields: [
            {
                name: "title",
                label: "Title",
                type: "text",
                required: true,
                placeholder: "Enter book title",
                colSize: 6,
            },

            {
                name: "author_id",
                label: "Author",
                type: "select",
                options: "authors",
                required: true,

                colSize: 6,
            },
            {
                name: "category_id",
                label: "Category",
                type: "select",
                options: "categories",
                required: true,

                colSize: 6,
            },
            {
                name: "publisher_id",
                label: "Publisher",
                type: "select",
                options: "publishers",
                required: false,

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
                name: "price",
                label: "Price",
                type: "number",
                required: true,
                placeholder: "Enter book price",
                colSize: 6,
            },

            {
                name: "total_copies",
                label: "Total Copies",
                type: "number",
                placeholder: "Enter total copies",
                colSize: 6,
                props: { min: 1 }
            },
            {
                name: "available_copies",
                label: "Available Copies",
                type: "number",
                placeholder: "Enter available copies",
                colSize: 6,
                props: { min: 0 }
            },
            {
                name: "min_age",
                label: "Min Age",
                type: "number",
                required: true,
                placeholder: "Enter minimum age",
                colSize: 6,
                props: { min: 0 }
            },
            {
                name: "max_age",
                label: "Max Age",
                type: "number",
                required: false,
                placeholder: "Enter maximum age ",
                colSize: 6,
                props: { min: 0 }
            },
            {
                name: "inventory_binding",
                label: "Inventory Binding",
                type: "select",
                options: inventoryBindings,
                required: false,
                colSize: 6,
            }
            , {
                name: "language",
                label: "Language",
                type: "text",
                placeholder: "Enter language",
                colSize: 6,
            },
        ],
        validationRules: (formData, allBooks, editingBook) => {
            const errors = [];
            if (!formData.title?.trim()) errors.push("Title is required");
            if (!formData.author_id) errors.push("Author is required");
            if (!formData.category_id) errors.push("Category is required");
            if (!formData.isbn?.trim()) errors.push("ISBN is required");
            if (formData.min_age === undefined || formData.min_age === null || formData.min_age === "") {
                errors.push("Min age is required");
            } else if (formData.min_age < 0) {
                errors.push("Min age must be non-negative");
            }
            if (formData.max_age !== undefined && formData.max_age !== null && formData.max_age !== "" &&
                formData.min_age !== undefined && formData.min_age !== null && formData.min_age !== "" &&
                parseInt(formData.max_age) < parseInt(formData.min_age)) {
                errors.push("Max age cannot be less than min age");
            }
            if (formData.available_copies !== undefined && formData.available_copies !== null && formData.available_copies !== "" &&
                formData.total_copies !== undefined && formData.total_copies !== null && formData.total_copies !== "" &&
                parseInt(formData.available_copies) > parseInt(formData.total_copies)) {
                errors.push("Available copies cannot exceed total copies");
            }


            const duplicate = allBooks.find(
                book => book.isbn === formData.isbn && book.id !== editingBook?.id
            );
            if (duplicate) errors.push("Book with this ISBN already exists");

            return errors;
        },
        dataDependencies: {
            authors: "author",
            categories: "category",
            publishers: "publisher"
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
            allowEdit: permissions.canEdit || true,
            allowDelete: false,
            showImportButton: true,
            showAdvancedFilter: true,
            permissions: permissions,
        },
        filterFields: [
            {
                name: "title",
                label: "Title",
                type: "text",
            },
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
            publisher_name: {
                path: "publisher",
                idField: "publisher_id",
                labelField: "publisher_name"
            }
        },
        importModel: BookModel
    };
};
