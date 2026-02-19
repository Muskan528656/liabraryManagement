import { Badge, ProgressBar } from "react-bootstrap";
import { createModel } from "../common/UniversalCSVXLSXImporter";

export const getShelfConfig = (
    externalData = {},
    props = {},
    permissions = {}
) => {

    const ShelfModel = createModel({
        modelName: "Shelf",
        fields: {
            name: "Name",
            floor: "Floor",
            rack: "Rack",
            shelf: "Shelf",
            classification_type: "Classification Type",
            classification_from: "From Range",
            classification_to: "To Range",
            capacity: "Capacity",
            full_location_code: "Full Location Code",
            is_active: "Active"
        },
        required: ["name", "floor", "rack", "shelf"]
    });

    return {
        moduleName: "shelf",
        moduleLabel: "Rack Mapping",
        apiEndpoint: "shelf",

        importMatchFields: ["name", "floor", "rack"],
        importModel: ShelfModel,

        initialFormData: (editingItem) => {
            if (editingItem) {
                return {
                    name: editingItem.name || "",
                    floor: editingItem.floor || "",
                    rack: editingItem.rack || "",
                    shelf: editingItem.shelf || "",
                    classification_type: editingItem.classification_type || "",
                    classification_from: editingItem.classification_from || "",
                    classification_to: editingItem.classification_to || "",
                    capacity: editingItem.capacity || 100,
                    is_active: editingItem.is_active !== undefined ? editingItem.is_active : true
                };
            }

            return {
                name: "",
                floor: "",
                rack: "",
                shelf: "",
                classification_type: "",
                classification_from: "",
                classification_to: "",
                capacity: 100,
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
                field: "floor",
                label: "Floor",
                width: "100px",
                render: (value) => <span className="font-monospace">{value || '-'}</span>,
            },
            {
                field: "rack",
                label: "Rack",
                width: "100px",
                render: (value) => <span className="font-monospace">{value || '-'}</span>,
            },
            {
                field: "shelf",
                label: "Shelf",
                width: "100px",
                render: (value) => <span className="font-monospace">{value || '-'}</span>,
            },
            // {
            //     field: "classification_type",
            //     label: "Type",
            //     width: "100px",
            //     render: (value) => <span className="badge bg-info">{value || '-'}</span>,
            // },
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
                field: "full_location_code",
                label: "Location",
                width: "150px",
                render: (value) => <span className="font-monospace">{value || '-'}</span>,
            },
            {
                field: "capacity",
                label: "Capacity",
                width: "150px",
                render: (value, row) => {
                    const capacity = parseInt(value) || 100;
                    const used = row?.books_count || 0;
                    const percentage = Math.min((used / capacity) * 100, 100);
                    let variant = "success";
                    if (percentage > 70) variant = "warning";
                    if (percentage > 90) variant = "danger";

                    return (
                        <div>
                            <small className="text-muted">{used}/{capacity}</small>
                            <ProgressBar
                                now={percentage}
                                variant={variant}
                                style={{ height: '8px', marginTop: '4px' }}
                            />
                        </div>
                    );
                }
            },
            {
                field: "is_active",
                label: "Active",
                width: "100px",
                render: (value) => (
                    <Badge bg={value ? "success" : "danger"}>
                        {value ? "Active" : "Inactive"}
                    </Badge>
                )
            }
        ],

        formFields: [
            {
                name: "floor",
                label: "Floor",
                type: "text",
                required: true,
                placeholder: "Enter floor",
                colSize: 6,
                onChange: (value, formData, setFormData, setFieldState) => {
                    // Update full location code when floor changes
                    const locationCode = `${value || ''}-${formData.rack || ''}-${formData.shelf || ''}`;
                    setFormData(prev => ({
                        ...prev,
                        floor: value,
                        full_location_code: locationCode
                    }));
                    if (setFieldState) {
                        setFieldState('full_location_code', {
                            helpText: `Generated: ${locationCode}`
                        });
                    }
                }
            },
            {
                name: "rack",
                label: "Rack",
                type: "text",
                required: true,
                placeholder: "Enter rack number (e.g., RACK-01)",
                colSize: 6,
                onChange: (value, formData, setFormData, setFieldState) => {
                    // Update full location code when rack changes
                    const locationCode = `${formData.floor || ''}-${value || ''}-${formData.shelf || ''}`;
                    setFormData(prev => ({
                        ...prev,
                        rack: value,
                        full_location_code: locationCode
                    }));
                    if (setFieldState) {
                        setFieldState('full_location_code', {
                            helpText: `Generated: ${locationCode}`
                        });
                    }
                }
            },
            {
                name: "shelf",
                label: "Shelf",
                type: "text",
                required: true,
                placeholder: "Enter shelf (e.g., SHELF-A)",
                colSize: 6,
                onChange: (value, formData, setFormData, setFieldState) => {
                    // Update full location code when shelf changes
                    const locationCode = `${formData.floor || ''}-${formData.rack || ''}-${value || ''}`;
                    setFormData(prev => ({
                        ...prev,
                        shelf: value,
                        full_location_code: locationCode
                    }));
                    if (setFieldState) {
                        setFieldState('full_location_code', {
                            helpText: `Generated: ${locationCode}`
                        });
                    }
                }
            },
            {
                name: "name",
                label: "Category Name",
                type: "select",
                asyncSelect: true,
                required: true,
                placeholder: "Search or create category",
                helpText: "Search existing categories or type new name to create. Supports DDC (000-099) and LLC (AC-AZ) classifications.",
                colSize: 6,
                loadOptions: async (inputValue) => {
                    try {
                        const api = (await import('../../api/dataApi')).default;
                        const classificationApi = new api('classification');
                        const response = await classificationApi.get('/');
                        const classifications = response.data || [];

                        // Filter by input value if provided
                        const filtered = inputValue
                            ? classifications.filter(item => {
                                const searchValue = inputValue.toLowerCase().trim();

                                // Direct name/category matching
                                if (item.category?.toLowerCase().includes(searchValue) ||
                                    item.name?.toLowerCase().includes(searchValue)) {
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
                            : classifications;

                        // Create options with detailed information
                        return filtered.map(item => ({
                            value: item.name,
                            label: `${item.category} - ${item.name} (${item.code}) [${item.classification_from || '0'} to ${item.classification_to || '0'}]`,
                            data: item
                        }));
                    } catch (e) {
                        console.error("Error loading classifications:", e);
                        return [];
                    }
                },
                defaultOptions: true,
                clearable: true,
                creatable: true, // Allow creating new values
                // onChange: async (value, formData, setFormData, setFieldState) => {
                //     // Auto-fill classification fields when name changes
                //     if (value) {
                //         try {
                //             const api = (await import('../../api/dataApi')).default;
                //             const classificationApi = new api('classification');
                //             const response = await classificationApi.get('/');
                //             const classifications = response.data || [];

                //             // Find the selected classification by name
                //             const selected = classifications.find(item => item.name === value);
                //             console.log("selected ->", selected);

                //             if (selected) {
                //                 setFormData(prev => ({
                //                     ...prev,
                //                     name: value,
                //                     classification_from: selected.classification_from || '',
                //                     classification_to: selected.classification_to || '',
                //                     classification_type: selected.classification_type || ''
                //                 }));

                //                 if (setFieldState) {
                //                     setFieldState('classification_from', {
                //                         helpText: `Auto-filled: ${selected.classification_from}`
                //                     });
                //                     setFieldState('classification_to', {
                //                         helpText: `Auto-filled: ${selected.classification_to}`
                //                     });
                //                     setFieldState('classification_type', {
                //                         helpText: `Auto-filled: ${selected.classification_type}`
                //                     });
                //                 }
                //             }
                //         } catch (error) {
                //             console.error("Error fetching classification details:", error);
                //         }
                //     } else {
                //         // Clear classification fields when selection is cleared
                //         setFormData(prev => ({
                //             ...prev,
                //             name: '',
                //             classification_from: '',
                //             classification_to: '',
                //             classification_type: ''
                //         }));
                //     }
                // }
                onChange: async (selectedOption, formData, setFormData, setFieldState) => {
                    if (selectedOption) {

                        const selected = selectedOption.data; // 

                        setFormData(prev => ({
                            ...prev,
                            name: selectedOption.value,
                            classification_from: selected.classification_from || '',
                            classification_to: selected.classification_to || '',
                            classification_type: selected.classification_type || ''
                        }));

                        if (setFieldState) {
                            setFieldState('classification_from', {
                                helpText: `Auto-filled: ${selected.classification_from}`
                            });
                            setFieldState('classification_to', {
                                helpText: `Auto-filled: ${selected.classification_to}`
                            });
                            setFieldState('classification_type', {
                                helpText: `Auto-filled: ${selected.classification_type}`
                            });
                        }

                    } else {
                        setFormData(prev => ({
                            ...prev,
                            name: '',
                            classification_from: '',
                            classification_to: '',
                            classification_type: ''
                        }));
                    }
                }

            },
            {
                name: "classification_from",
                label: "Range From",
                type: "text",
                required: false,
                placeholder: "Auto-filled",
                colSize: 6,
                readOnly: true,
                helpText: "Auto-filled from category selection"
            },
            {
                name: "classification_to",
                label: "Range To",
                type: "text",
                required: false,
                placeholder: "Auto-filled",
                colSize: 6,
                readOnly: true,
                helpText: "Auto-filled from category selection"
            },
            // {
            //     name: "classification_type",
            //     label: "Classification Type",
            //     type: "text",
            //     required: false,
            //     placeholder: "Auto-filled",
            //     colSize: 6,
            //     readOnly: true,
            //     helpText: "Auto-filled from category selection"
            // },
            {
                name: "capacity",
                label: "Capacity",
                type: "number",
                required: true,
                placeholder: "Enter capacity",
                defaultValue: 100,
                min: 1,
                colSize: 6,
            },
            {
                name: "is_active",
                label: "Active",
                type: "checkbox",
                required: false,
                colSize: 6,
            }
        ],

        validationRules: (formData, allShelves, editingItem) => {
            const errors = [];

            if (!formData.name?.trim()) {
                errors.push("Name is required");
            }

            if (!formData.floor?.trim()) {
                errors.push("Floor is required");
            }

            if (!formData.rack?.trim()) {
                errors.push("Rack is required");
            }


            // Only validate classification fields if name is provided (category selected)
            if (formData.name?.trim()) {
                if (!formData.classification_from?.trim()) {
                    errors.push("Range From is required when category is selected");
                }

                if (!formData.classification_to?.trim()) {
                    errors.push("Range To is required when category is selected");
                }

                if (!formData.classification_type?.trim()) {
                    errors.push("Classification Type is required when category is selected");
                }
            }

            if (!formData.capacity) {
                errors.push("Capacity is required");
            }

            if (!formData.shelf?.trim()) {
                errors.push("Shelf is required");
            }

            return errors;
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
            allowEdit: permissions?.allowEdit ?? true,
            allowDelete: permissions?.allowDelete ?? true,
            showImportButton: true,
            showAdvancedFilter: true,
            permissions: permissions || {},
        },

        filterFields: [
            {
                name: "name",
                label: "Name",
                type: "text",
                placeholder: "Search by name"
            },
            {
                name: "floor",
                label: "Floor",
                type: "text",
                placeholder: "Search by floor"
            },
            {
                name: "rack",
                label: "Rack",
                type: "text",
                placeholder: "Search by rack"
            }
        ],

        customHandlers: {
            beforeSave: (formData, editingItem) => {
                if (formData.capacity) {
                    formData.capacity = parseInt(formData.capacity);
                }
                return true;
            },
            afterSave: (response, editingItem) => {
                console.log("Shelf saved:", response);
            }
        },

        details: [
            { key: "name", label: "Name", type: "text" },
            { key: "floor", label: "Floor", type: "text" },
            { key: "rack", label: "Rack", type: "text" },
            { key: "shelf", label: "Shelf", type: "text" },
            { key: "classification_from", label: "Range From", type: "text" },
            { key: "classification_to", label: "Range To", type: "text" },
            { key: "capacity", label: "Capacity", type: "text" },
            { key: "full_location_code", label: "Full Location Code", type: "text" },
            { key: "is_active", label: "Active", type: "boolean" },
            { key: "createddate", label: "Created Date", type: "date" },
            { key: "lastmodifieddate", label: "Last Modified Date", type: "date" },
            { key: "createdbyid", label: "Created By", type: "text" },
            { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },
        ]
    };
};