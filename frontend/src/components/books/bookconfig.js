import { name } from "pubsub-js";
import { createModel } from "../common/UniversalCSVXLSXImporter";
export const getBooksConfig = (externalData = {}, props = {}, permissions = {}, shelf = {}) => {

    console.log("externalData in getBooksConfig check:", externalData);
    const authors = props.authors || externalData.authors || externalData.author || [];
    console.log("getBooksConfig - authors:", authors);
    const categories = props.categories || externalData.categories || externalData.category || [];
    console.log("getBooksConfig - categories:", categories);

    const publishers = props.publishers || externalData.publishers || externalData.publisher || [];

    console.log("getBooksConfig - publishers:", publishers);
    const shelves = props.shelf || externalData.shelf || [];
    console.log("getBooksConfig - shelves:", shelves);

    const uniqueShelves = Object.values(
        shelves.reduce((acc, shelf) => {
            if (!acc[shelf.shelf_name]) {
                acc[shelf.shelf_name] = shelf;
            }
            return acc;
        }, {})
    );

    console.log("uniqueShelves:", uniqueShelves);
    // Output: 3 items - "Muskan", "aaa", "a" (first occurrence only)

    // Create shelf options
    const shelfOptions = uniqueShelves.map(s => ({
        value: s.id,
        name: s.shelf_name
    }));

    console.log("shelfOptions:", shelfOptions);
    // Output: [
    //   {value: "Muskan", name: "Muskan"},
    //   {value: "aaa", name: "aaa"},
    //   {value: "a", name: "a"}
    // ]

    const subShelfOptions = (selectedShelfName) => {
        console.log("subShelfOptions called with:", selectedShelfName);

        if (!selectedShelfName) {
            console.log("No shelf selected");
            return [];
        }

        // Find ALL shelves with this name
        const allShelvesWithName = shelves.filter(s => s.shelf_name === selectedShelfName);

        console.log("Found shelves with name", selectedShelfName, ":", allShelvesWithName.length);

        if (!allShelvesWithName.length) {
            console.log("No shelves found with name:", selectedShelfName);
            return [];
        }

        // Collect ALL sub-shelves from all matching shelves
        let allSubShelves = [];
        allShelvesWithName.forEach(shelf => {
            console.log("Processing shelf:", shelf.id, "sub_shelf:", shelf.sub_shelf);

            if (shelf.sub_shelf) {
                // If sub_shelf is string, try to parse it
                if (typeof shelf.sub_shelf === 'string') {
                    try {
                        const parsed = JSON.parse(shelf.sub_shelf);
                        if (Array.isArray(parsed)) {
                            allSubShelves.push(...parsed);
                        }
                    } catch (e) {
                        console.log("Error parsing sub_shelf string:", e);
                    }
                }
                // If sub_shelf is array, use it directly
                else if (Array.isArray(shelf.sub_shelf)) {
                    allSubShelves.push(...shelf.sub_shelf);
                }
            }
        });

        // Remove duplicates and filter out empty/null values
        const uniqueSubShelves = [...new Set(allSubShelves.filter(item => item && item.trim() !== ''))];

        console.log("All unique sub shelves for", selectedShelfName, ":", uniqueSubShelves);

        return uniqueSubShelves.map(ss => ({
            value: ss,
            name: ss
        }));
    };

    // Test the function
    console.log("Testing subShelfOptions for 'Muskan':");
    const muskanSubShelves = subShelfOptions("Muskan");
    console.log("Muskan sub-shelves:", muskanSubShelves);
    // Expected output: ["23", "A3", "A2", "a1"] (all 4 sub-shelves)

    console.log("Testing subShelfOptions for 'aaa':");
    const aaaSubShelves = subShelfOptions("aaa");
    console.log("aaa sub-shelves:", aaaSubShelves);
    // Expected output: ["sad"]

    console.log("Testing subShelfOptions for 'a':");
    const aSubShelves = subShelfOptions("a");
    console.log("a sub-shelves:", aSubShelves);
    // Expected output: ["a"]
    // const subShelfOptions = (selectedShelfName) => {

    //     const matchedShelves = shelves.filter(
    //         s => s.shelf_name === selectedShelfName
    //     );
    //     console.log("matchedShelvesmatchedShelves", matchedShelves)
    //     let allSubs = [];

    //     matchedShelves.forEach(shelf => {
    //         let subs = shelf.sub_shelf || [];

    //         if (typeof subs === "string") {
    //             try {
    //                 subs = JSON.parse(subs);
    //             } catch {
    //                 subs = [];
    //             }
    //         }

    //         allSubs.push(...subs);
    //     });

    //     const uniqueSubs = [...new Set(allSubs)];
    //     console.log("uniqueSubsuniqueSubs", uniqueSubs)

    //     return uniqueSubs.map(ss => ({
    //         value: ss,
    //         name: ss
    //     }));

    // };


    // console.log("uniqueSubsuniqueSubs", uniqueSubs)
    // console.log("shelvesshelves", shelf)
    // const shelfOptions = shelf.map(s => ({
    //     value: s.id,
    //     name: s.shelf_name
    // }));

    // Dependent sub-shelf options
    // const subShelfOptions = (selectedShelfId) => {
    //     const shelf = shelves.find(s => s.id == selectedShelfId);
    //     if (!shelf || !shelf.sub_shelves) return [];

    //     return shelf.sub_shelves.map(ss => ({
    //         value: ss,
    //         name: ss
    //     }));
    // };
    //changes
    const authorOptions = authors.map(a => ({

        // value: String(a.id),
        value: a.id,
        name: a.name
    }));
    const categoryOptions = categories.map(c => ({
        // value: String(c.id),
        value: c.id,
        name: c.name
    }));

    const publisherOptions = publishers.map(p => ({
        value: String(p.id),
        // value: p.id,
        name: p.name
    }));


    // console.log("authorOptions:", authorOptions);

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
        authors: authorOptions,
        categories: categoryOptions,
        publishers: publisherOptions,
        shelf: shelfOptions,
        subShelfOptions: subShelfOptions,
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
            max_age: "",
            shelf_name: "",
            sub_shelf: ""
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
                name: "shelf_name",
                type: "select",
                label: "Shelf",
                options: "shelf",
                required: false,
                colSize: 6,
            },

            {
                name: "sub_shelf",
                label: "Sub Shelf",
                type: "select",
                options: "subShelfOptions",
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
