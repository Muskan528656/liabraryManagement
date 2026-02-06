import { Badge } from "react-bootstrap";
import { createModel } from "../common/UniversalCSVXLSXImporter";

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

        // ================= INITIAL =================
        initialFormData: {
            shelf_name: "",
            note: "",
            sub_shelf: "",
            status: true
        },

        // ================= TABLE =================
        columns: [
            { field: "shelf_name", label: "Shelf Name" },
            { field: "note", label: "Note" },
            {
                field: "sub_shelf",
                label: "Sub Shelf",
                render: (val) =>
                    Array.isArray(val) ? val.join(", ") : val || ""
            },
            {
                field: "status",
                label: "Status",
                sortable: true,
                render: (value) => {
                    const statusValue = value === true || value === "active" ? "Active" : "Inactive";
                    return (
                        <Badge bg={statusValue === "Active" ? "success" : "danger"}>
                            {statusValue}
                        </Badge>
                    );
                }
            }
        ],

        // ================= FORM =================
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
                label: "Sub Shelves",
                type: "text",
                placeholder: "A1,A2,A3",
                colSize: 6,
            },
            {
                name: "note",
                label: "Note",
                type: "textarea",
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

        // ================= TRANSFORMS =================
        transformBeforeSave: (data) => {
            if (typeof data.sub_shelf === "string") {
                data.sub_shelf = data.sub_shelf
                    .split(",")
                    .map(s => s.trim())
                    .filter(Boolean);
            }
            return data;
        },

        transformAfterFetch: (data) => {
            if (Array.isArray(data.sub_shelf)) {
                data.sub_shelf = data.sub_shelf.join(",");
            }
            return data;
        },

        // ================= VALIDATION =================
        validationRules: (formData) => {
            const errors = [];

            if (!formData.shelf_name?.trim()) {
                errors.push("Shelf name required");
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

        importModel: ShelfModel
    };
};
