import { createModel } from "../common/UniversalCSVXLSXImporter";
export const getBooksConfig = (externalData = {}, props = {}, timeZone) => {
    const authors =  props.authors ||  externalData.authors || externalData.author ||   [];

    const categories = props.categories ||  externalData.categories ||  externalData.category || [];

   const BookModel = createModel({
        modelName: "Book",
        fields: {
            title: "Title",
            author_id: "Author",
            category_id: "Category",
            isbn: "ISBN",
            language: "Language",
            total_copies: "Total Copies",
            available_copies: "Available Copies",
        },
        required: ["title", "author_id", "category_id", "isbn"]
    });


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
            }
        },

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
            { field: "title", label: "Title" },
            { field: "author_name", label: "Author" },
            { field: "category_name", label: "Category" },
            { field: "isbn", label: "ISBN" },
            { field: "available_copies", label: "Available Copies" }
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
                props: { min: 1 }
            },
            {
                name: "available_copies",
                label: "Available Copies",
                type: "number",
                placeholder: "Enter available copies",
                colSize: 6,
                props: { min: 0 }
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
            showBulkInsert: false,
            showImportExport: true, // MUST BE TRUE
            showDetailView: true,
            showSearch: true,
            showColumnVisibility: true,
            showCheckbox: true,
            showActions: true,
            showAddButton: true,
            allowEdit: true,
            allowDelete: false,
            showImportButton:true,
        },
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
        },
        importModel: BookModel
    };
};