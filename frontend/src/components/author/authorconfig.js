export const getAuthorConfig = (externalData = {}, props = {}) => {
    return {
        moduleName: "authors",
        moduleLabel: "Author",
        apiEndpoint: "author",
        initialFormData: {
            name: "",
            email: "",
            bio: ""
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
                                fontWeight: "bold",
                                fontSize: "14px",
                            }}
                        >
                            {value?.charAt(0) || 'A'}
                        </div>
                        <span style={{ color: "#6f42c1", fontWeight: "500" }}>
                            {value}
                        </span>
                    </div>
                ),
            },
            {
                field: "email",
                label: "Email",
                render: (value) => <span style={{ color: "#6c757d" }}>{value || '-'}</span>,
            },
            {
                field: "bio",
                label: "Bio",
                render: (value) => <span>{value || '-'}</span>,
            }
        ],
        formFields: [
            {
                name: "name",
                label: "Name",
                type: "text",
                required: true,
                placeholder: "Enter author name",
                colSize: 12,
            },
            {
                name: "email",
                label: "Email",
                type: "email",
                placeholder: "Enter email address",
                colSize: 12,
            },
            {
                name: "bio",
                label: "Bio",
                type: "textarea",
                rows: 3,
                placeholder: "Enter author bio",
                colSize: 12,
            }
        ],
        validationRules: (formData, allAuthors, editingAuthor) => {
            const errors = [];
            if (!formData.name?.trim()) errors.push("Name is required");
            
            // Check for duplicate name
            const duplicate = allAuthors.find(
                author => author.name?.toLowerCase() === formData.name?.toLowerCase() && 
                author.id !== editingAuthor?.id
            );
            if (duplicate) errors.push("Author with this name already exists");

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
            { key: "name", label: "Name", type: "text" },
            { key: "email", label: "Email", type: "text" },
            { key: "bio", label: "Bio", type: "text" },
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
                console.log("Author saved:", response);
            }
        }
    };
};