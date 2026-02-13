import { Badge } from "react-bootstrap";
import { createModel } from "../common/UniversalCSVXLSXImporter";
import Shelf from "./shelf";

export const getShelfConfig = (
    externalData = {},
    props = {},
    permissions = {}
) => {

    const ShelfModel = createModel({
        modelName: "Shelf",
        fields: {
            shelf_name: "Shelf Name",
            note: "Note",
            sub_shelf: "Sub Shelf",
            status: "Status"
        },
        required: ["shelf_name"]
    });

    return {
        moduleName: "shelf",
        moduleLabel: "Shelf",
        apiEndpoint: "shelf",

        importMatchFields: ["shelf_name"],

        initialFormData: {
            shelf_name: "",
            note: "",
            sub_shelf: "",
            status: true
        },

        columns: [
            { field: "shelf_name", label: "Shelf Name" },
            { field: "note", label: "Note" },
            {
                field: "sub_shelf",
                label: "Sub Shelf",
                render: (val) => val || "-"
            },
            {
                field: "status",
                label: "Status",
                sortable: true,
                render: (value) => {
                    const isActive = value === true || value === "true" || value === true;
                    return (
                        <Badge bg={isActive ? "success" : "danger"}>
                            {isActive ? "Active" : "Inactive"}
                        </Badge>
                    );
                }
            }
        ],

        formFields: [
            {
                name: "shelf_name",
                label: "Shelf Name",
                type: "text",
                required: true,
                placeholder: "Enter shelf name",
                colSize: 6,
            },
            {
                name: "sub_shelf",
                label: "Sub Shelf",
                type: "text",
                required: true,
                placeholder: "Enter sub shelf name",
                colSize: 6,
            },
            {
                name: "note",
                label: "Note",
                type: "textarea",
                required: true,
                placeholder: "Enter notes",
                colSize: 6,
            },
            {
                name: "status",
                label: "Status",
                type: "select",
                options: [
                    { label: "Active", value: true },
                    { label: "Inactive", value: false }
                ],
                colSize: 6,
            }
        ],

        transformBeforeSave: (data) => {
            if (data.sub_shelf) {
                data.sub_shelf = data.sub_shelf.toString().trim();
            }
            return data;
        },

        transformAfterFetch: (data) => {
            if (data.sub_shelf && typeof data.sub_shelf === 'string') {
                if (data.sub_shelf.trim().startsWith('[')) {
                    try {
                        const parsed = JSON.parse(data.sub_shelf);
                        data.sub_shelf = Array.isArray(parsed) ? parsed.join(', ') : data.sub_shelf;
                    } catch (e) {
                    }
                }
            }
            return data;
        },
        // validationRules: (formData,allPlans, editingPlan) => {
        //     const errors = [];

        //     console.log("formData in validationRules:", formData);
        //     console.log("allPlans in validationRules:", allPlans);
        //     console.log("editingPlan in validationRules:", editingPlan);
        //     if (!formData.shelf_name?.trim()) {
        //         errors.push("Shelf name is required");
        //     }

        //      if (!formData.sub_shelf?.trim()) { 
        //         errors.push("Sub Shelf is required");
        //     }
        //       if (!formData.note?.trim()) {
        //         errors.push("Note is required");
        //     }

        //     const duplicateName = allPlans.find(
        //         Shelf => Shelf.sub_shelf?.toLowerCase() === formData.sub_shelf?.toLowerCase() &&
        //             Shelf.id !== editingPlan?.id
        //     );
        //     if (duplicateName) {
        //         errors.push("Shelf with this sub shelf already exists");
        //     }

        //     // Shelf name unique validation (optional)
        //     // if (formData.shelf_name?.trim()) {
        //     //     const existingShelves = externalData.existingShelves || [];
        //     //     const isDuplicate = existingShelves.some(shelf =>
        //     //         shelf.shelf_name === formData.shelf_name.trim() &&
        //     //         shelf.id !== formData.id
        //     //     );

        //     //     if (isDuplicate) {
        //     //         errors.push("Shelf name already exists");
        //     //     }
        //     // }

        //     return errors;
        // },
        validationRules: (formData, allPlans, editingPlan) => {
            const errors = [];
            // const noNumberRegex = /^[A-Za-z\s]+$/;

            if (!formData.shelf_name?.trim()) {
                errors.push("Shelf name is required");
            }
            // else if (!noNumberRegex.test(formData.shelf_name.trim())) {
            //     errors.push("Numbers are not allowed in shelf name");
            // }

            if (!formData.sub_shelf?.trim()) {
                errors.push("Sub Shelf is required");
            }
            // else if (!noNumberRegex.test(formData.sub_shelf.trim())) {
            //     errors.push("Numbers are not allowed in sub shelf");
            // }

            if (!formData.note?.trim()) {
                errors.push("Note is required");
            }
            //  else if (!noNumberRegex.test(formData.note.trim())) {
            //     errors.push("Numbers are not allowed in note");
            // }

            const duplicateName = allPlans.find(
                shelf =>
                    shelf.sub_shelf?.toLowerCase() === formData.sub_shelf?.toLowerCase() &&
                    shelf.id !== editingPlan?.id
            );

            if (duplicateName) {
                errors.push("Shelf with this sub shelf already exists");
            }

            return errors;
        },

        // ================= FEATURES =================
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
                name: "shelf_name",
                label: "Shelf Name",
                type: "text",
                placeholder: "Search by shelf name"
            },
            {
                name: "sub_shelf",
                label: "Sub Shelf",
                type: "text",
                placeholder: "Search by sub shelf"
            },
            {
                name: "status",
                label: "Status",
                type: "select",
                options: [
                    { label: "Active", value: true },
                    { label: "Inactive", value: false }
                ]
            }
        ],

        importModel: ShelfModel,

        // ================= CUSTOM METHODS =================
        onBeforeSubmit: (formData) => {
            return {
                ...formData,
                sub_shelf: formData.sub_shelf ? String(formData.sub_shelf).trim() : ""
            };
        },

        // ================= DETAIL VIEW =================
        detailViewFields: [
            { label: "Shelf Name", field: "shelf_name" },
            { label: "Sub Shelf", field: "sub_shelf" },
            { label: "Note", field: "note" },
            {
                label: "Status",
                field: "status",
                render: (value) => (
                    <Badge bg={value ? "success" : "danger"}>
                        {value ? "Active" : "Inactive"}
                    </Badge>
                )
            },
            { label: "Created Date", field: "createddate", type: "datetime" },
            { label: "Last Modified", field: "lastmodifieddate", type: "datetime" }
        ]
    };
};