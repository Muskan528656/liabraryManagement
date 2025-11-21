// config/categoryConfig.js
export const getCategoryConfig = (externalData = {}, props = {}) => {
    return {
        moduleName: "categories",
        moduleLabel: "Category",
        apiEndpoint: "category",
        initialFormData: {
            name: "",
            description: ""
        },
        columns: [
            {
                field: "name",
                label: "Name",
                render: (value, record) => (
                    <div className="d-flex align-items-center">
                        <div
                            className="rounded-circle d-flex align-items-center justify-content-center me-2"
                            style={{
                                width: "32px",
                                height: "32px",
                                background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                                color: "white",
                                fontSize: "14px",
                            }}
                        >
                            <i className="fa-solid fa-tags"></i>
                        </div>
                        <span style={{ color: "#6f42c1", fontWeight: "500" }}>
                            {value}
                        </span>
                    </div>
                ),
            },
            {
                field: "description",
                label: "Description",
                render: (value) => <span style={{ color: "#6c757d" }}>{value || '-'}</span>,
            }
        ],
        formFields: [
            {
                name: "name",
                label: "Name",
                type: "text",
                required: true,
                placeholder: "Enter category name",
                colSize: 12,
            },
            {
                name: "description",
                label: "Description",
                type: "textarea",
                rows: 3,
                placeholder: "Enter category description",
                colSize: 12,
            }
        ],
        validationRules: (formData, allCategories, editingCategory) => {
            const errors = [];
            if (!formData.name?.trim()) errors.push("Name is required");
            
            // Check for duplicate name
            const duplicate = allCategories.find(
                category => category.name?.toLowerCase() === formData.name?.toLowerCase() && 
                category.id !== editingCategory?.id
            );
            if (duplicate) errors.push("Category with this name already exists");

            return errors;
        },
        dataDependencies: {},
        features: {
            showBulkInsert: false,
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
            { key: "name", label: "Category Name", type: "text" },
            { key: "description", label: "Description", type: "text" },
            { key: "created_at", label: "Created At", type: "date" },
            { key: "updated_at", label: "Updated At", type: "date" },
        ],
        customHandlers: {
            beforeSave: (formData, editingItem) => {
                // Additional custom validation if needed
                return true;
            },
            afterSave: (response, editingItem) => {
                // Custom after save logic
                console.log("Category saved:", response);
            }
        }
    };
};