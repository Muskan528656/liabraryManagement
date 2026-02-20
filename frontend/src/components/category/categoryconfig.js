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

    const classificationTypes = externalData?.["librarysettings"] || [];

    const classificationType = classificationTypes?.[0]?.config_classification || "";

    console.log("classificationTypes=>", classificationType);

 

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

            // ✅ Get classification type from settings (FIXED)
            const defaultType =
                externalData?.["librarysettings"]?.[0]?.config_classification || "";

            // =========================
            // ✅ CATEGORY CHANGE
            // =========================
            if (fieldName === 'category' && fieldValue?.trim()) {
                try {
                    const response = await api.get(
                        `/last-by-category/${encodeURIComponent(fieldValue)}`
                    );

                    const lastItem = response.data;

                    let from = "";
                    let to = "";

                    // ✅ Use TYPE instead of guessing (FIXED)
                    const type =
                        lastItem?.classification_type ||
                        formData?.classification_type ||
                        defaultType;

                    if (lastItem) {
                        const lastTo = lastItem.classification_to;

                        // ✅ DDC → NUMERIC
                        if (type === "DDC") {
                            const nextFrom = parseInt(lastTo || "0") + 1;
                            const nextTo = nextFrom + 9;

                            from = nextFrom.toString();
                            to = nextTo.toString();
                        }

                        // ✅ LLC → ALPHABET
                        else if (type === "LLC") {
                            const nextChar = lastTo
                                ? String.fromCharCode(
                                    lastTo.toUpperCase().charCodeAt(0) + 1
                                )
                                : "A";

                            from = nextChar;
                            to = nextChar;
                        }
                    }

                    setFormData(prev => ({
                        ...prev,
                        category: fieldValue,
                        name: '',
                        classification_from: from,
                        classification_to: to,
                        classification_type: type
                    }));

                } catch (error) {
                    console.error("Error fetching category data:", error);
                }
            }

            // =========================
            // ✅ NAME CHANGE
            // =========================
            if (fieldName === 'name' && fieldValue?.trim() && formData?.category) {
                const selectedCategory =
                    formData.category?.value || formData.category;

                console.log("Name selected:", fieldValue, "Category:", selectedCategory);

                try {
                    const url = `/last-by-category-name/${encodeURIComponent(
                        selectedCategory
                    )}/${encodeURIComponent(fieldValue)}`;

                    const response = await api.get(url);
                    const item = response.data;

                    const type =
                        item?.classification_type ||
                        formData?.classification_type ||
                        defaultType;

                    if (item) {
                        setFormData(prev => ({
                            ...prev,
                            name: fieldValue,
                            classification_from: item.classification_from ?? '',
                            classification_to: item.classification_to ?? '',
                            classification_type: type,
                            code: item.code || prev.code
                        }));
                    }
                } catch (error) {
                    console.error("Error fetching name data:", error);
                }
            }
        },


        initialFormData: (editingItem) => {
            if (editingItem) {
                return {
                    classification_type:  classificationType,
                    code: editingItem.code || "",
                    category: editingItem.category || "",
                    name: editingItem.name || "",
                    classification_from: editingItem.classification_from || "",
                    classification_to: editingItem.classification_to || "",
                    is_active: editingItem.is_active !== undefined ? editingItem.is_active : true
                };
            }

            return {
                classification_type:  classificationType,
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

               
                    console.log("calssifications", classifications);

                        // Extract unique categories and filter by input
                    const uniqueCategories = [
                        ...new Set(
                            classifications
                            .filter(item => item.classification_type === classificationType)
                            .map(item => item.category)
                            .filter(Boolean)
                        )
                    ];

         
                    console.log("uniqueCategories",uniqueCategories)

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
                label:"Name",
                type:"text",
                colSize:6
            },
            // {
            //     name: "name",
            //     label: "Name",
            //     type: "select",
            //     asyncSelect: true,
            //     required: true,
            //     placeholder: "Search or create name",
            //     helpText: (fieldState, formData) => {
            //         if (!formData?.category) return "Please select a category first";
            //         return "Search existing names or type new name to create. Supports DDC (000-099) and LLC (AC-AZ) classifications.";
            //     },
            //     colSize: 6,
            //     loadOptions: async (inputValue, formData) => {
            //         if (!formData?.category) return [];
            //         try {
            //             const api = new (await import('../../api/dataApi')).default('classification');
            //             const response = await api.get('/');
            //             const classifications = response.data || [];

            //             // Filter by category first
            //             const categoryClassifications = classifications.filter(
            //                 item => item.category === formData.category
            //             );

            //             // Enhanced search with code and range matching
            //             const filtered = inputValue
            //                 ? categoryClassifications.filter(item => {
            //                     const searchValue = inputValue.toLowerCase().trim();

            //                     // Direct name matching
            //                     if (item.name?.toLowerCase().includes(searchValue)) {
            //                         return true;
            //                     }

            //                     // Code matching (exact or partial)
            //                     if (item.code?.toLowerCase().includes(searchValue)) {
            //                         return true;
            //                     }

            //                     // Range matching - only for same classification type
            //                     if (item.classification_from && item.classification_to) {
            //                         // Check if both item and search are numeric (DDC)
            //                         const isItemNumeric = /^\d+$/.test(item.classification_from) && /^\d+$/.test(item.classification_to);
            //                         const isSearchNumeric = /^\d+$/.test(searchValue);

            //                         // Check if both item and search are alphabetic (LLC)
            //                         const isItemAlpha = /^[a-zA-Z]+$/.test(item.classification_from) && /^[a-zA-Z]+$/.test(item.classification_to);
            //                         const isSearchAlpha = /^[a-zA-Z]+$/.test(searchValue);

            //                         // For numeric ranges (DDC)
            //                         if (isItemNumeric && isSearchNumeric) {
            //                             const searchNum = parseInt(searchValue);
            //                             const fromNum = parseInt(item.classification_from);
            //                             const toNum = parseInt(item.classification_to);

            //                             if (searchNum >= fromNum && searchNum <= toNum) {
            //                                 return true;
            //                             }
            //                         }

            //                         // For alphabetic ranges (LLC)
            //                         else if (isItemAlpha && isSearchAlpha) {
            //                             const searchAlpha = searchValue.toUpperCase();
            //                             const fromAlpha = item.classification_from.toUpperCase();
            //                             const toAlpha = item.classification_to.toUpperCase();

            //                             // Simple alphabetical range check
            //                             if (searchAlpha >= fromAlpha && searchAlpha <= toAlpha) {
            //                                 return true;
            //                             }
            //                         }
            //                     }

            //                     return false;
            //                 })
            //                 : categoryClassifications;

            //             // Create options with detailed information
            //             return filtered.map(item => ({
            //                 value: item.name,
            //                 label: `${item.name} (${item.code}) [${item.classification_from || '0'} to ${item.classification_to || '0'}]`,
            //                 data: item
            //             }));
            //         } catch (e) {
            //             console.error("Error loading names:", e);
            //             return [];
            //         }
            //     },
            //     defaultOptions: true,
            //     clearable: true,
            //     creatable: true,
            //     dependsOn: "category",
            //     disabled: (formData) => !formData?.category
            // },
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

            const category = formData.category?.trim();
            const name = formData.name?.trim();
            const code = formData.code?.toString().trim();
            const from = formData.classification_from?.toString().trim();
            const to = formData.classification_to?.toString().trim();

            // ✅ Required Fields
            if (!category) {
                errors.push("Category is required");
            }

            if (!name) {
                errors.push("Name is required");
            }

            // ✅ Code validation (Allow letters + numbers)
            if (code && !/^[A-Za-z0-9]+$/.test(code)) {
                errors.push("Code must contain only letters or numbers");
            }

            // ✅ Range Required
            if (!from || !to) {
                errors.push("Please enter Range From and Range To");
            }

            // Detect type
            const isNumericRange = /^\d+$/.test(from) && /^\d+$/.test(to);
            const isAlphaRange = /^[A-Za-z]+$/.test(from) && /^[A-Za-z]+$/.test(to);

            if (from && to) {

                // =============================
                // ✅ DDC (NUMERIC VALIDATION)
                // =============================
                if (isNumericRange) {

                    const fromNum = parseInt(from);
                    const toNum = parseInt(to);

                    if (fromNum >= toNum) {
                        errors.push("Range From must be less than Range To");
                    }

                    // Code inside range
                    if (code && /^\d+$/.test(code)) {
                        const codeNum = parseInt(code);
                        if (codeNum < fromNum || codeNum > toNum) {
                            errors.push(`Code must be between ${from} and ${to}`);
                        }
                    }
                }

                // =============================
                // ✅ LLC (ALPHABETIC VALIDATION)
                // =============================
                else if (isAlphaRange) {

                    if (from.toUpperCase() > to.toUpperCase()) {
                        errors.push("Range From must be alphabetically less than Range To");
                    }

                    if (code && /^[A-Za-z]+$/.test(code)) {
                        if (
                            code.toUpperCase() < from.toUpperCase() ||
                            code.toUpperCase() > to.toUpperCase()
                        ) {
                            errors.push(`Code must be between ${from} and ${to}`);
                        }
                    }
                }

                // =============================
                // ❌ INVALID FORMAT
                // =============================
                else {
                    errors.push("Range must be either numeric (DDC) or alphabetic (LLC)");
                }
            }

            // ✅ Duplicate Code Check (Same Type)
            if (code && formData.classification_type) {
                const duplicate = allClassifications.find(
                    item =>
                        item.code?.toString().toUpperCase() === code.toUpperCase() &&
                        item.classification_type === formData.classification_type &&
                        item.id !== editingItem?.id
                );

                if (duplicate) {
                    errors.push(
                        `Code "${code}" already exists for ${formData.classification_type} type`
                    );
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
                type: "text",
                // options: classificationTypes.map(type => ({ value: type, label: type })),
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