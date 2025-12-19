export const getBookConfig = async () => {
    return {
        formFields: [
            {
                name: "isbn",
                label: "ISBN",
                type: "text",
                required: true,
                placeholder: "Enter ISBN",
            },
            {
                name: "title",
                label: "Title",
                type: "text",
                required: true,
                placeholder: "Enter book title",
            },
            {
                name: "author",
                label: "Author",
                type: "text",
                required: true,
                placeholder: "Enter author name",
            },
            {
                name: "category",
                label: "Category",
                type: "text",
                required: false,
                placeholder: "Enter category",
            },
            {
                name: "shelf_location",
                label: "Shelf Location",
                type: "text",
                required: false,
                placeholder: "Enter shelf location",
            },
            {
                name: "quantity",
                label: "Quantity",
                type: "number",
                required: true,
                placeholder: "Enter quantity",
            },
        ],
    };
};
