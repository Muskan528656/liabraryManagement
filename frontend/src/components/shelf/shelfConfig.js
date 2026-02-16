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
            classification_type: "Classification Type",
            classification_from: "From Range",
            classification_to: "To Range",
            capacity: "Capacity"
        },
        required: ["name", "floor", "rack"]
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
                    classification_type: editingItem.classification_type || "",
                    classification_from: editingItem.classification_from || "",
                    classification_to: editingItem.classification_to || "",
                    capacity: editingItem.capacity || 100
                };
            }

            return {
                name: "",
                floor: "",
                rack: "",
                classification_type: "",
                classification_from: "",
                classification_to: "",
                capacity: 100
            };
        },

        onFieldChange: async (fieldName, value, formData, setFormData, api, setFieldState) => {
            if (fieldName === 'floor' && value?.trim()) {
                try {
                    const response = await api.get(`/shelf/next-rack/${encodeURIComponent(value)}`);
                    if (response.data?.rack) {
                        setFormData(prev => ({
                            ...prev,
                            rack: response.data.rack
                        }));
                        if (setFieldState) {
                            setFieldState('rack', {
                                helpText: `Auto-generated: ${response.data.rack}`
                            });
                        }
                    }
                } catch (error) {
                    console.error("Error fetching next rack number:", error);
                }
            }

            // When name (category) changes, auto-fill classification fields
            if (fieldName === 'name' && value) {
                try {
                    const api = (await import('../../api/dataApi')).default;
                    const classificationApi = new api('classification');
                    const response = await classificationApi.get('/');
                    const classifications = response.data || [];

                    // Find the selected classification by name
                    const selected = classifications.find(item => item.name === value);

                    if (selected) {
                        setFormData(prev => ({
                            ...prev,
                            name: value,
                            classification_type: selected.classification_type || '',
                            classification_from: selected.classification_from || '',
                            classification_to: selected.classification_to || ''
                        }));

                        if (setFieldState) {
                            setFieldState('classification_type', {
                                helpText: `Auto-filled: ${selected.classification_type}`
                            });
                            setFieldState('classification_from', {
                                helpText: `Auto-filled: ${selected.classification_from}`
                            });
                            setFieldState('classification_to', {
                                helpText: `Auto-filled: ${selected.classification_to}`
                            });
                        }
                    }
                } catch (error) {
                    console.error("Error fetching classification details:", error);
                }
            }
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
            },
            {
                name: "rack",
                label: "Rack",
                type: "text",
                required: true,
                placeholder: "Enter rack number (e.g., RACK-01)",
                colSize: 6,
            },
            {
                name: "name",
                label: "Category Name",
                type: "select",
                asyncSelect: true,
                required: true,
                placeholder: "Search and select category",
                helpText: "Select category to auto-fill range",
                colSize: 6,
                loadOptions: async (inputValue) => {
                    try {
                        const api = (await import('../../api/dataApi')).default;
                        const classificationApi = new api('classification');
                        const response = await classificationApi.get('/');
                        const classifications = response.data || [];

                        // Filter by input value if provided
                        const filtered = inputValue
                            ? classifications.filter(item =>
                                item.category?.toLowerCase().includes(inputValue.toLowerCase()) ||
                                item.name?.toLowerCase().includes(inputValue.toLowerCase())
                            )
                            : classifications;

                        // Create options with category - name (from-to) format
                        return filtered.map(item => ({
                            value: item.name,
                            label: `${item.category} - ${item.name} (${item.classification_from || '0'} to ${item.classification_to || '0'})`,
                            data: item
                        }));
                    } catch (e) {
                        console.error("Error loading classifications:", e);
                        return [];
                    }
                },
                defaultOptions: true,
                clearable: true,
            },
            {
                name: "classification_type",
                label: "Classification Type",
                type: "text",
                required: true,
                placeholder: "e.g., DDC, LLC",
                colSize: 6,
                readOnly: true,
                helpText: "Auto-filled from category selection"
            },
            {
                name: "classification_from",
                label: "Range From",
                type: "text",
                required: true,
                placeholder: "Auto-filled",
                colSize: 6,
                readOnly: true,
                helpText: "Auto-filled from category selection"
            },
            {
                name: "classification_to",
                label: "Range To",
                type: "text",
                required: true,
                placeholder: "Auto-filled",
                colSize: 6,
                readOnly: true,
                helpText: "Auto-filled from category selection"
            },
            {
                name: "capacity",
                label: "Capacity",
                type: "number",
                required: true,
                placeholder: "Enter capacity",
                defaultValue: 100,
                min: 1,
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

            if (!formData.classification_type?.trim()) {
                errors.push("Classification Type is required");
            }

            if (!formData.classification_from?.trim()) {
                errors.push("Range From is required");
            }

            if (!formData.classification_to?.trim()) {
                errors.push("Range To is required");
            }

            if (!formData.capacity) {
                errors.push("Capacity is required");
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
            { key: "classification_type", label: "Classification Type", type: "text" },
            { key: "classification_from", label: "Range From", type: "text" },
            { key: "classification_to", label: "Range To", type: "text" },
            { key: "capacity", label: "Capacity", type: "text" },
            { key: "createddate", label: "Created Date", type: "date" },
            { key: "lastmodifieddate", label: "Last Modified Date", type: "date" },
            { key: "createdbyid", label: "Created By", type: "text" },
            { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },
        ]
    };
};