export const getDefaultConfig = async () => {
    return {
        formFields: [
            {
                name: "id",
                label: "ID",
                type: "text",
                required: true,
                placeholder: "Enter ID",
            },
            {
                name: "name",
                label: "Name",
                type: "text",
                required: true,
                placeholder: "Enter name",
            },
            {
                name: "category",
                label: "Category",
                type: "text",
                required: false,
                placeholder: "Enter category",
            },
            {
                name: "description",
                label: "Description",
                type: "text",
                required: false,
                placeholder: "Enter description",
            },
        ],
    };
};
