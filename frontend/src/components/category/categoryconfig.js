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

        onFieldChange: async (fieldName, value, formData, setFormData) => {
            const fieldValue = value?.value || value;
            console.log("onFieldChange called:", fieldName, "value:", fieldValue);

            const DataApi = (await import('../../api/dataApi')).default;
            const api = new DataApi('classification');

            if (fieldName === 'category' && fieldValue?.trim()) {
                try {

                    const response = await api.get(
                        `/last-by-category/${encodeURIComponent(fieldValue)}`
                    );
                    console.log("Category response:", response.data);

                    if (response.data) {
                        const lastItem = response.data;
                        const from = lastItem.classification_to ? parseInt(lastItem.classification_to) + 1 : 1;
                        const to = from + 9;

                        setFormData(prev => ({
                            ...prev,
                            category: fieldValue,
                            name: '',
                            classification_from: from.toString(),
                            classification_to: to.toString(),
                            classification_type: lastItem.classification_type || prev.classification_type
                        }));
                    } else {
                        setFormData(prev => ({
                            ...prev,
                            category: fieldValue,
                            name: '',
                            classification_from: '',
                            classification_to: ''
                        }));
                    }
                } catch (error) {
                    console.error("Error fetching category data:", error);
                }
            }

            if (fieldName === 'name' && fieldValue?.trim() && formData?.category) {
                const selectedCategory = formData.category?.value || formData.category;
                console.log("Name selected:", fieldValue, "Category:", selectedCategory);

                try {
                    const url = `/last-by-category-name/${encodeURIComponent(selectedCategory)}/${encodeURIComponent(fieldValue)}`;
                    console.log("Fetching:", url);
                    const response = await api.get(url);
                    console.log("Name response:", response.data);

                    if (response.data) {
                        const item = response.data;
                        console.log("Filling range:", item.classification_from, "-", item.classification_to);
                        setFormData(prev => ({
                            ...prev,
                            name: fieldValue,
                            classification_from: item.classification_from || '',
                            classification_to: item.classification_to || '',
                            classification_type: item.classification_type || prev.classification_type,
                            code: item.code || prev.code
                        }));
                    } else {
                        console.log("No data found for this category/name");
                    }
                } catch (error) {
                    console.error("Error fetching name data:", error);
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
            {
                field: "category",
                label: "Category",
                width: "150px",
                render: (value) => <span style={{ color: "#6c757d" }}>{value || '-'}</span>,
            },

            {
                field: "code",
                label: "Code",
                width: "100px",
                render: (value) => <span className="font-monospace">{value || '-'}</span>,
            },

            {
                field: "classification_from",
                label: "From",
                width: "80px",
                render: (value) => <span className="text-primary font-monospace fs-6">{value || '-'}</span>,
            },
            {
                field: "classification_to",
                label: "To",
                width: "80px",
                render: (value) => <span className="text-primary font-monospace fs-6">{value || '-'}</span>,
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
                placeholder: "Search or create category",
                helpText: "Type to search existing categories or enter new name to create",
                colSize: 6,
                loadOptions: async (inputValue) => {
                    try {
                        const api = new (await import('../../api/dataApi')).default('classification');
                        const response = await api.get('/');
                        const classifications = response.data || [];

                        // Extract unique categories and filter by input
                        const uniqueCategories = [...new Set(classifications.map(item => item.category).filter(Boolean))];

                        const filtered = inputValue
                            ? uniqueCategories.filter(category =>
                                category?.toLowerCase().includes(inputValue.toLowerCase())
                            )
                            : uniqueCategories;

                        return filtered.map(category => ({
                            value: category,
                            label: category
                        })) || [];
                    } catch (e) {
                        console.error("Error loading categories:", e);
                        return [];
                    }
                },
                defaultOptions: true,
                clearable: true,
                creatable: true,
            },
            {
                name: "name",
                label: "Name",
                type: "select",
                asyncSelect: true,
                required: true,
                placeholder: "Search or create name",
                helpText: (fieldState, formData) => {
                    if (!formData?.category) return "Please select a category first";
                    return "Search existing names or type new name to create. Supports DDC (000-099) and LLC (AC-AZ) classifications.";
                },
                colSize: 6,
                loadOptions: async (inputValue, formData) => {
                    if (!formData?.category) return [];
                    try {
                        const api = new (await import('../../api/dataApi')).default('classification');
                        const response = await api.get('/');
                        const classifications = response.data || [];

                        // Filter by category first
                        const categoryClassifications = classifications.filter(
                            item => item.category === formData.category
                        );

                        // Enhanced search with code and range matching
                        const filtered = inputValue
                            ? categoryClassifications.filter(item => {
                                const searchValue = inputValue.toLowerCase().trim();

                                // Direct name matching
                                if (item.name?.toLowerCase().includes(searchValue)) {
                                    return true;
                                }

                                // Code matching (exact or partial)
                                if (item.code?.toLowerCase().includes(searchValue)) {
                                    return true;
                                }

                                // Range matching - only for same classification type
                                if (item.classification_from && item.classification_to) {
                                    // Check if both item and search are numeric (DDC)
                                    const isItemNumeric = /^\d+$/.test(item.classification_from) && /^\d+$/.test(item.classification_to);
                                    const isSearchNumeric = /^\d+$/.test(searchValue);

                                    // Check if both item and search are alphabetic (LLC)
                                    const isItemAlpha = /^[a-zA-Z]+$/.test(item.classification_from) && /^[a-zA-Z]+$/.test(item.classification_to);
                                    const isSearchAlpha = /^[a-zA-Z]+$/.test(searchValue);

                                    // For numeric ranges (DDC)
                                    if (isItemNumeric && isSearchNumeric) {
                                        const searchNum = parseInt(searchValue);
                                        const fromNum = parseInt(item.classification_from);
                                        const toNum = parseInt(item.classification_to);

                                        if (searchNum >= fromNum && searchNum <= toNum) {
                                            return true;
                                        }
                                    }

                                    // For alphabetic ranges (LLC)
                                    else if (isItemAlpha && isSearchAlpha) {
                                        const searchAlpha = searchValue.toUpperCase();
                                        const fromAlpha = item.classification_from.toUpperCase();
                                        const toAlpha = item.classification_to.toUpperCase();

                                        // Simple alphabetical range check
                                        if (searchAlpha >= fromAlpha && searchAlpha <= toAlpha) {
                                            return true;
                                        }
                                    }
                                }

                                return false;
                            })
                            : categoryClassifications;

                        // Create options with detailed information
                        return filtered.map(item => ({
                            value: item.name,
                            label: `${item.name} (${item.code}) [${item.classification_from || '0'} to ${item.classification_to || '0'}]`,
                            data: item
                        }));
                    } catch (e) {
                        console.error("Error loading names:", e);
                        return [];
                    }
                },
                defaultOptions: true,
                clearable: true,
                creatable: true,
                dependsOn: "category",
                disabled: (formData) => !formData?.category
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
                name: "classification_type",
                label: "Library Classification Config",
                type: "text",
                required: false,
                placeholder: "Auto-loaded from library settings",
                colSize: 6,
                disabled: true,
                value: (externalData) => externalData?.librarySettings?.classification || '',
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

            if (formData.code && !/^\d+$/.test(formData.code)) {
                errors.push("Code must contain only numbers");
            }

            if (formData.code && formData.classification_from && formData.classification_to) {
                const codeNum = parseInt(formData.code);
                const fromNum = parseInt(formData.classification_from);
                const toNum = parseInt(formData.classification_to);

                if (codeNum < fromNum || codeNum > toNum) {
                    errors.push(`Code must be between ${formData.classification_from} and ${formData.classification_to}`);
                }
            }
            const combinationExists = fieldState?.combination?.exists;
            if (combinationExists) {
                if (!formData.classification_from || !formData.classification_to) {
                    errors.push("Range fields are required");
                }
            } else {

                if (!formData.classification_from || !formData.classification_to) {
                    errors.push("Please enter range From and To");
                }

                if (formData.classification_from && !/^\d+$/.test(formData.classification_from)) {
                    errors.push("Range From must contain only numbers");
                }
                if (formData.classification_to && !/^\d+$/.test(formData.classification_to)) {
                    errors.push("Range To must contain only numbers");
                }

                if (formData.classification_from && formData.classification_to) {
                    if (parseInt(formData.classification_from) >= parseInt(formData.classification_to)) {
                        errors.push("Range From must be less than Range To");
                    }
                }
            }
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
            lastClassification: 'classification/last',
            librarySettings: 'librarysettings'
        },

        customHandlers: {
            afterSave: () => {
                console.log("Classification saved successfully, form will be reset");
            }
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

                if (formData.code) {
                    formData.code = formData.code.toString().replace(/\D/g, '');
                }


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