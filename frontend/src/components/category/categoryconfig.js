import { createModel } from "../common/UniversalCSVXLSXImporter";

export const getClassificationConfig = (externalData = {}, props = {}, permissions = {}) => {

    const ClassificationModel = createModel({
        modelName: "Classification",
        fields: {
            "classification_type": "Classification Type",
            "code": "Code",
            "category": "Category",
            "name": "Name",
            "classification_from": "From Range",
            "classification_to": "To Range",
            "is_active": "Active Status"
        },
        required: ["classification_type", "name"],
    });

    const classificationTypes = externalData?.classificationTypes || ['DDC', 'LLC'];

    return {
        moduleName: "classification",
        moduleLabel: "Classification",
        apiEndpoint: "classification",

        importMatchFields: ['code', 'classification_type'],
        importModel: ClassificationModel,

        onFieldChange: async (fieldName, value, formData, setFormData, api, setFieldState) => {
            // When category changes, fetch the last entry for this category to auto-fill name and range
            if (fieldName === 'category' && value?.trim()) {
                if (setFieldState) {
                    setFieldState('category', { isLoading: true });
                }

                try {
                    // Fetch last classification for this category
                    const response = await api.get(
                        `/classification/last-by-category/${encodeURIComponent(value)}`
                    );

                    if (response.data) {
                        const lastItem = response.data;
                        const from = lastItem.classification_to ? parseInt(lastItem.classification_to) + 1 : 1;
                        const to = from + 9;

                        setFormData(prev => ({
                            ...prev,
                            name: lastItem.name || '',
                            code: lastItem.code || '',
                            classification_from: from.toString(),
                            classification_to: to.toString(),
                            classification_type: lastItem.classification_type || prev.classification_type
                        }));

                        if (setFieldState) {
                            setFieldState('name', {
                                helpText: `Auto-filled from category "${value}"`
                            });
                            setFieldState('classification_from', {
                                disabled: true,
                                required: true,
                                helpText: "Auto-calculated (last + 1)"
                            });
                            setFieldState('classification_to', {
                                disabled: true,
                                required: true,
                                helpText: "Auto-calculated (From + 9)"
                            });
                        }
                    } else {
                        // No existing data for this category - clear dependent fields
                        setFormData(prev => ({
                            ...prev,
                            name: '',
                            classification_from: '',
                            classification_to: ''
                        }));

                        if (setFieldState) {
                            setFieldState('name', {
                                helpText: "Enter new name for this category"
                            });
                            setFieldState('classification_from', {
                                disabled: false,
                                required: true,
                                helpText: "Enter starting range"
                            });
                            setFieldState('classification_to', {
                                disabled: false,
                                required: true,
                                helpText: "Enter ending range"
                            });
                        }
                    }
                } catch (error) {
                    console.error("Error fetching category data:", error);
                } finally {
                    if (setFieldState) {
                        setFieldState('category', { isLoading: false });
                    }
                }
            }

            // When name changes, check for existing combination
            if (fieldName === 'name' && value?.trim() && formData.category?.trim()) {
                if (setFieldState) {
                    setFieldState('combination', { isLoading: true });
                }

                try {
                    const response = await api.get(
                        `/classification/last-by-category-name/${encodeURIComponent(formData.category)}/${encodeURIComponent(value)}`
                    );

                    if (response.data) {
                        const lastItem = response.data;
                        const from = lastItem.classification_to ? parseInt(lastItem.classification_to) + 1 : 1;
                        const to = from + 9;

                        setFormData(prev => ({
                            ...prev,
                            classification_from: from.toString(),
                            classification_to: to.toString(),
                            classification_type: lastItem.classification_type || prev.classification_type
                        }));

                        if (setFieldState) {
                            setFieldState('classification_from', {
                                disabled: true,
                                required: true,
                                helpText: "Auto-calculated with 10 gap"
                            });
                            setFieldState('classification_to', {
                                disabled: true,
                                required: true,
                                helpText: "Auto-calculated (From + 9)"
                            });
                            setFieldState('combination', {
                                exists: true,
                                isLoading: false,
                                message: `Auto-filling range for existing "${value}" in "${formData.category}"`
                            });
                        }
                    } else {
                        setFormData(prev => ({
                            ...prev,
                            classification_from: '',
                            classification_to: ''
                        }));

                        if (setFieldState) {
                            setFieldState('classification_from', {
                                disabled: false,
                                required: true,
                                helpText: "Enter starting number"
                            });
                            setFieldState('classification_to', {
                                disabled: false,
                                required: true,
                                helpText: "Enter ending number"
                            });
                            setFieldState('combination', {
                                exists: false,
                                isLoading: false,
                                message: `New combination: "${value}" in "${formData.category}"`
                            });
                        }
                    }
                } catch (error) {
                    console.error("Error fetching combination range:", error);
                    if (setFieldState) {
                        setFieldState('combination', {
                            exists: false,
                            isLoading: false,
                            error: "Failed to check combination"
                        });
                    }
                }
            }
        },

        initialFormData: (editingItem) => {
            if (editingItem) {
                return {
                    classification_type: editingItem.classification_type || "DDC",
                    code: editingItem.code || "",
                    category: editingItem.category || "",
                    name: editingItem.name || "",
                    classification_from: editingItem.classification_from || "",
                    classification_to: editingItem.classification_to || "",
                    is_active: editingItem.is_active !== undefined ? editingItem.is_active : true
                };
            }

            return {
                classification_type: "DDC",
                code: "",
                category: "",
                name: "",
                classification_from: "",
                classification_to: "",
                is_active: true
            };
        },

        columns: [
            {
                field: "name",
                label: "Name",
                width: "200px",
            },
            // {
            //     field: "classification_type",
            //     label: "Type",
            //     width: "80px",
            //     render: (value) => (
            //         <span className={`badge ${value === 'DDC' ? 'bg-primary' : 'bg-success'}`}>
            //             {value}
            //         </span>
            //     ),
            // },
            {
                field: "code",
                label: "Code",
                width: "100px",
                render: (value) => <span className="font-monospace">{value || '-'}</span>,
            },
            {
                field: "category",
                label: "Category",
                width: "150px",
                render: (value) => <span style={{ color: "#6c757d" }}>{value || '-'}</span>,
            },
            {
                field: "classification_from",
                label: "From",
                width: "80px",
                render: (value) => <span className="text-info font-monospace">{value || '-'}</span>,
            },
            {
                field: "classification_to",
                label: "To",
                width: "80px",
                render: (value) => <span className="text-info font-monospace">{value || '-'}</span>,
            },
            {
                field: "is_active",
                label: "Status",
                width: "100px",
                render: (value) => (
                    <span className={`badge ${value ? 'bg-success' : 'bg-secondary'}`}>
                        {value ? 'Active' : 'Inactive'}
                    </span>
                ),
            }
        ],

        formFields: [
            {
                name: "category",
                label: "Category",
                type: "select",
                asyncSelect: true,
                required: true,
                placeholder: "Search and select category",
                helpText: "Type to search or select from existing categories",
                colSize: 6,
                loadOptions: async (inputValue) => {
                    try {
                        const api = new (await import('../../api/dataApi')).default('classification');
                        const searchParam = inputValue ? `&search=${encodeURIComponent(inputValue)}` : '';
                        const response = await api.get(`/suggestions?field=category&limit=50${searchParam}`);
                        return response.data?.map(item => ({ value: item, label: item })) || [];
                    } catch (e) {
                        return [];
                    }
                },
                defaultOptions: true,
                clearable: true,
                creatable: true, // Allow creating new values
            },
            {
                name: "name",
                label: "Name",
                type: "select",
                asyncSelect: true,
                required: true,
                placeholder: "Search and select name",
                helpText: (fieldState, formData) => {
                    if (!formData?.category) return "Please select a category first";
                    return "Type to search or select from existing names";
                },
                colSize: 6,
                loadOptions: async (inputValue, formData) => {
                    if (!formData?.category) return [];
                    try {
                        const api = new (await import('../../api/dataApi')).default('classification');
                        const searchParam = inputValue ? `&search=${encodeURIComponent(inputValue)}` : '';
                        const response = await api.get(`/suggestions?field=name&category=${encodeURIComponent(formData.category)}&limit=50${searchParam}`);
                        return response.data?.map(item => ({ value: item, label: item })) || [];
                    } catch (e) {
                        return [];
                    }
                },
                defaultOptions: true,
                clearable: true,
                creatable: true, // Allow creating new values
                dependsOn: "category",
            },
            {
                name: "config_classification",
                label: "Library Classification Config",
                type: "text",
                required: false,
                placeholder: "Auto-loaded from library settings",
                helpText: "This value is loaded from library settings",
                colSize: 6,
                disabled: true,
            },
            {
                name: "classification_from",
                label: "Range From",
                type: "text",
                required: (formData, editingItem, fieldState) => {
                    return fieldState?.classification_from?.required !== undefined
                        ? fieldState.classification_from.required
                        : true;
                },
                placeholder: (fieldState) => fieldState?.classification_from?.disabled
                    ? "Auto-filled"
                    : "Enter start range",
                disabled: (formData, editingItem, fieldState) => {
                    return fieldState?.classification_from?.disabled || false;
                },
                colSize: 6,
                helpText: (fieldState) => fieldState?.classification_from?.helpText || "",
            },
            {
                name: "classification_to",
                label: "Range To",
                type: "text",
                required: (formData, editingItem, fieldState) => {
                    return fieldState?.classification_to?.required !== undefined
                        ? fieldState.classification_to.required
                        : true;
                },
                placeholder: (fieldState) => fieldState?.classification_to?.disabled
                    ? "Auto-filled"
                    : "Enter end range",
                disabled: (formData, editingItem, fieldState) => {
                    return fieldState?.classification_to?.disabled || false;
                },
                colSize: 6,
                helpText: (fieldState) => fieldState?.classification_to?.helpText || "",
            },
            {
                name: "code",
                label: "Code",
                type: "text",
                required: true,
                placeholder: "Enter numeric code (e.g., 500)",
                helpText: "Enter numeric code",
                colSize: 6,
            },
            {
                name: "is_active",
                label: "Active Status",
                type: "toggle",
                defaultChecked: true,
                colSize: 6,
            }
        ],

        validationRules: (formData, allClassifications, editingItem, fieldState) => {
            const errors = [];

            if (!formData.category?.trim()) {
                errors.push("Category is required");
            }

            if (!formData.name?.trim()) {
                errors.push("Name is required");
            }

            // Validate code is numeric
            if (formData.code && !/^\d+$/.test(formData.code)) {
                errors.push("Code must contain only numbers");
            }

            // Get combination exists state from fieldState
            const combinationExists = fieldState?.combination?.exists;

            // Validate range fields based on combination existence
            if (combinationExists) {
                if (!formData.classification_from || !formData.classification_to) {
                    errors.push("Range fields are required");
                }
            } else {
                // For new combination, validate that range fields are provided manually
                if (!formData.classification_from || !formData.classification_to) {
                    errors.push("Please enter range From and To");
                }
                // Validate that range values are numeric
                if (formData.classification_from && !/^\d+$/.test(formData.classification_from)) {
                    errors.push("Range From must contain only numbers");
                }
                if (formData.classification_to && !/^\d+$/.test(formData.classification_to)) {
                    errors.push("Range To must contain only numbers");
                }
                // Validate that From is less than To
                if (formData.classification_from && formData.classification_to) {
                    if (parseInt(formData.classification_from) >= parseInt(formData.classification_to)) {
                        errors.push("Range From must be less than Range To");
                    }
                }
            }

            // Check for duplicate code within same classification type
            if (formData.code && formData.classification_type) {
                const duplicate = allClassifications.find(
                    item => item.code?.toString() === formData.code?.toString() &&
                        item.classification_type === formData.classification_type &&
                        item.id !== editingItem?.id
                );
                if (duplicate) {
                    errors.push(`Code "${formData.code}" already exists for ${formData.classification_type} type`);
                }
            }

            return errors;
        },

        dataDependencies: {
            classificationTypes: 'classification/types',
            lastClassification: 'classification/last'
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
            allowEdit: permissions?.allowEdit,
            allowDelete: permissions?.allowDelete,
            showAdvancedFilter: true,
            showImportButton: true,
        },

        details: [
            { key: "classification_type", label: "Classification Type", type: "text" },
            { key: "code", label: "Code", type: "text" },
            { key: "name", label: "Name", type: "text" },
            { key: "category", label: "Category", type: "text" },
            { key: "classification_from", label: "Range From", type: "text" },
            { key: "classification_to", label: "Range To", type: "text" },
            {
                key: "is_active",
                label: "Status",
                type: "toggle",
            },
            { key: "createddate", label: "Created Date", type: "date" },
            { key: "lastmodifieddate", label: "Last Modified Date", type: "date" },
            { key: "createdbyid", label: "Created By", type: "text" },
            { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },
        ],

        customHandlers: {
            beforeSave: (formData, editingItem) => {
                // Ensure code is numeric string
                if (formData.code) {
                    formData.code = formData.code.toString().replace(/\D/g, '');
                }

                // Ensure range values are numeric strings
                if (formData.classification_from) {
                    formData.classification_from = formData.classification_from.toString();
                }
                if (formData.classification_to) {
                    formData.classification_to = formData.classification_to.toString();
                }

                return true;
            },
            afterSave: (response, editingItem) => {
                console.log("Classification saved:", response);
            }
        },

        filterFields: [
            {
                name: "classification_type",
                label: "Type",
                type: "select",
                options: classificationTypes.map(type => ({ value: type, label: type })),
            },
            {
                name: "code",
                label: "Code",
                type: "text"
            },
            {
                name: "name",
                label: "Name",
                type: "text"
            },
            {
                name: "category",
                label: "Category",
                type: "text"
            },
            {
                name: "is_active",
                label: "Status",
                type: "toggle",
                options: [
                    { value: "true", label: "Active" },
                    { value: "false", label: "Inactive" }
                ]
            }
        ]
    };
};