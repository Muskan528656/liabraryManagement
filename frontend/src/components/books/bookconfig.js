import { name } from "pubsub-js";
import { createModel } from "../common/UniversalCSVXLSXImporter";
export const getBooksConfig = (externalData = {}, props = {}, permissions = {}, shelf = {}) => {

    console.log("externalData in getBooksConfig check:", externalData);
    const authors = props.authors || externalData.authors || externalData.author || [];
    console.log("getBooksConfig - authors:", authors);
    const classifications = props.classifications || externalData.classifications || externalData.category || [];
    console.log("getBooksConfig - classifications:", classifications);

    const publishers = props.publishers || externalData.publishers || externalData.publisher || [];
    const groupedShelves = props.groupedShelves || externalData.groupedShelves || [];
    const branches = props.branches || externalData.branches || [];

    console.log("getBooksConfig - publishers:", publishers);
    console.log("getBooksConfig - groupedShelves:", groupedShelves);
    const uniqueCategories = [...new Set(classifications.map(c => c.category || "General"))];
    const authorOptions = authors.map(a => ({
        value: a.id,
        name: a.name
    }));
    const classificationOptions = classifications.map(c => ({
        // value: String(c.id),
        value: c.id,
        name: `${c.name} (${c.code})`
    }));

    const publisherOptions = publishers.map(p => ({
        value: String(p.id),
        // value: p.id,
        name: p.name
    }));

    const BookModel = createModel({
        modelName: "Book",
        fields: {
            title: "Title",
            author_id: "Author",
            classification_id: "Classification",
            publisher_id: "Publisher",
            isbn: "ISBN",
            edition: "Edition",
            publication_year: "Publication Year",
            language: "Language",
            pages: "Pages",
            total_copies: "Total Copies",
            available_copies: "Available Copies",
            min_age: "Min Age",
            max_age: "Max Age",
        },
        required: ["title", "author_id", "classification_id", "isbn", "min_age"]
    });

    const inventoryBindings = [
        { value: "hardcover", label: "Hardcover" },
        { value: "paperback", label: "Paperback" },
        { value: "spiral", label: "Spiral" },
    ];
    return {
        authors: authorOptions,
        classifications: classificationOptions,
        publishers: publisherOptions,

        moduleName: "book",
        moduleLabel: "Book",
        apiEndpoint: "book",
        importMatchFields: ["isbn"],

        autoCreateRelated: {
            authors: {
                endpoint: "author",
                labelField: "name"
            },
            classifications: {
                endpoint: "classification",
                labelField: "name"
            },
            publishers: {
                endpoint: "publisher",
                labelField: "name"
            }
        },

        initialFormData: {
            title: "",
            author_id: "",
            classification_id: "",
            classification_category: "",
            classification_code: "",
            classification_type: "",
            classification_from: "",
            classification_to: "",
            classification_label: "", // Store label for AsyncSelect display,
            publisher_id: "",
            isbn: "",
            inventory_binding: "",
            edition: "",
            publication_year: "",
            pages: "",
            language: "",
            min_age: "",
            max_age: "",
            status: "ACTIVE",
            company_id: "", // Managed by system but present in schema
            suggested_rack_mapping_id: ""
        },
        columns: [
            { field: "title", label: "Title" },
            { field: "author_name", label: "Author" },
            { field: "classification_name", label: "Classification" },
            { field: "publisher_name", label: "Publisher" },
            { field: "isbn", label: "ISBN" },
            { field: "edition", label: "Edition" },
            { field: "publication_year", label: "Year" },
            {
                field: "status",
                label: "Status",
                render: (val) => (
                    <span className={`badge bg-${val === 'ACTIVE' ? 'success' : 'danger'}`}>
                        {val}
                    </span>
                )
            }
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
                name: "classification_id",
                label: "Classification",
                type: "select",
                asyncSelect: true,
                required: true,
                placeholder: "Search classification by name, code or range",
                helpText: "Supports DDC (000-099) and LLC (AC-AZ) classifications.",
                colSize: 6,
                loadOptions: async (inputValue) => {
                    try {
                        const api = (await import('../../api/dataApi')).default;
                        const classificationApi = new api('classification');
                        const response = await classificationApi.get('/');
                        const classifications = response.data || [];

                        const filtered = inputValue
                            ? classifications.filter(item => {
                                const searchValue = inputValue.toLowerCase().trim();
                                if (item.category?.toLowerCase().includes(searchValue) ||
                                    item.name?.toLowerCase().includes(searchValue) ||
                                    item.code?.toLowerCase().includes(searchValue)) {
                                    return true;
                                }
                                if (item.classification_from && item.classification_to) {
                                    const isSearchNumeric = /^\d+$/.test(searchValue);
                                    if (isSearchNumeric && /^\d+$/.test(item.classification_from)) {
                                        const searchNum = parseInt(searchValue);
                                        if (searchNum >= parseInt(item.classification_from) &&
                                            searchNum <= parseInt(item.classification_to)) return true;
                                    }
                                }
                                return false;
                            })
                            : classifications;

                        return filtered.map(item => ({
                            value: item.id,
                            label: `${item.category || ''} - ${item.name} (${item.code})`,
                            data: item
                        }));
                    } catch (e) {
                        console.error("Error loading classifications:", e);
                        return [];
                    }
                },
                defaultOptions: true,
                getOptionLabel: (value, formData) => formData.classification_label || value,
                onChange: (value, formData, setFormData, setFieldState) => {
                    if (value && typeof value === 'object' && value.data) {
                        const selected = value.data;
                        console.log(selected, "selected");
                        const rawShelves = externalData.shelf || [];

                        // Find matching shelf based on classification range
                        let matchedShelfName = "";
                        let matchedSubShelfId = "";

                        const matched = rawShelves.find(s => {
                            if (s.classification_type !== selected.classification_type) return false;

                            if (s.classification_type === 'DDC') {
                                const bFrom = parseFloat(selected.classification_from);
                                const bTo = parseFloat(selected.classification_to);
                                const sFrom = parseFloat(s.classification_from);
                                const sTo = parseFloat(s.classification_to);
                                return (bFrom >= sFrom && bTo <= sTo);
                            } else {
                                // For LLC or other alpha types
                                const bFrom = (selected.classification_from || "").toUpperCase();
                                const bTo = (selected.classification_to || "").toUpperCase();
                                const sFrom = (s.classification_from || "").toUpperCase();
                                const sTo = (s.classification_to || "").toUpperCase();
                                return (bFrom >= sFrom && bTo <= sTo);
                            }
                        });

                        if (matched) {
                            matchedShelfName = `${matched.floor} - ${matched.rack}`;
                            matchedSubShelfId = matched.id;
                        }

                        setFormData(prev => ({
                            ...prev,
                            classification_id: value.value,
                            classification_category: selected.category || '',
                            classification_type: selected.classification_type || '',
                            classification_code: selected.code || '',
                            classification_from: selected.classification_from || '',
                            classification_to: selected.classification_to || '',
                            classification_label: value.label || '',
                            suggested_rack_mapping_id: matchedSubShelfId || prev.suggested_rack_mapping_id
                        }));
                    } else if (!value) {
                        setFormData(prev => ({
                            ...prev,
                            classification_id: "",
                            classification_category: "",
                            classification_type: "",
                            classification_code: "",
                            classification_from: "",
                            classification_to: "",
                            classification_label: ""
                        }));
                    }
                }
            },
            {
                name: "classification_type",
                label: "Classification Type",
                type: "text",
                readOnly: true,
                colSize: 6,
                placeholder: "Auto-filled"
            },
            {
                name: "classification_from",
                label: "Range From",
                type: "text",
                readOnly: true,
                colSize: 3,
                placeholder: "Auto-filled"
            },
            {
                name: "classification_to",
                label: "Range To",
                type: "text",
                readOnly: true,
                colSize: 3,
                placeholder: "Auto-filled"
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
            },
            {
                name: "language",
                label: "Language",
                type: "text",
                placeholder: "Enter language",
                colSize: 6,
            },

            {
                name: "edition",
                label: "Edition",
                type: "text",
                placeholder: "e.g. 1st Edition",
                colSize: 6,
            },
            {
                name: "publication_year",
                label: "Publication Year",
                type: "number",
                placeholder: "e.g. 2023",
                colSize: 6,
            },
            {
                name: "pages",
                label: "Total Pages",
                type: "number",
                placeholder: "Enter page count",
                colSize: 6,
            },
            {
                name: "status",
                label: "Status",
                type: "toggle",
                required: false,
                colSize: 6,
                helpText: "Switch to deactivate this book globally"
            },
        ],
        validationRules: (formData, allBooks, editingBook) => {
            const errors = [];
            if (!formData.title?.trim()) errors.push("Title is required");
            if (!formData.author_id) errors.push("Author is required");
            if (!formData.classification_id) errors.push("Classification is required");
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

            const duplicate = allBooks.find(
                book => book.isbn === formData.isbn && book.id !== editingBook?.id
            );
            if (duplicate) errors.push("Book with this ISBN already exists");

            return errors;
        },
        dataDependencies: {
            authors: "author",
            classifications: "classification",
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
            allowEdit: permissions.allowEdit || true,
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
            classification_name: {
                path: "classification",
                idField: "classification_id",
                labelField: "classification_name"
            },
            publisher_name: {
                path: "publisher",
                idField: "publisher_id",
                labelField: "publisher_name"
            }
        },
        detailConfig: {
            fields: {
                details: [
                    { key: "title", label: "Title" },
                    { key: "author_name", label: "Author" },
                    { key: "publisher_name", label: "Publisher" },
                    { key: "isbn", label: "ISBN" },
                    { key: "classification_name", label: "Classification" },
                    { key: "language", label: "Language" },
                    { key: "edition", label: "Edition" },
                    { key: "publication_year", label: "Publication Year" },
                    { key: "pages", label: "Pages" },
                    { key: "min_age", label: "Min Age" },
                    { key: "max_age", label: "Max Age" },
                    { key: "inventory_binding", label: "Inventory Binding" },
                    { key: "status", label: "Status", type: "toggle" },
                ]
            },
            relatedModules: [
                {
                    key: "book_copies",
                    label: "Inventory / Book Copies",
                    api: "book-copy",
                    endpoint: (id) => `?book_id=${id}`,
                    columns: [
                        { key: "barcode", label: "Barcode" },
                        { key: "itemcallnumber", label: "Call Number" },
                        { key: "status", label: "Status" },
                        { key: "item_price", label: "Price" },
                        { key: "branch_name", label: "Branch Name" }
                    ]
                }
            ]
        },
        importModel: BookModel
    };
};
