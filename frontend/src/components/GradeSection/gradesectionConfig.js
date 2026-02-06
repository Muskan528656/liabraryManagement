import { Badge } from "react-bootstrap";
import { createModel } from "../common/UniversalCSVXLSXImporter";

export const getGradeSectionConfig = (
    externalData = {},
    props = {},
    permissions = {}
) => {

    const GradeSectionModel = createModel({
        modelName: "Grade Section",
        fields: {
            grade_name: "Grade Name",
            section_name: "Section Name",
            status: "Status"
        },
        required: ["grade_name", "section_name"]
    });

    return {
        moduleName: "grade-sections",
        moduleLabel: "Grade Sections",
        apiEndpoint: "grade-sections",

        importMatchFields: ["grade_name", "section_name"],

        // ================= INITIAL =================
        initialFormData: {
            grade_name: "",
            section_name: "",
            status: true
        },

        // ================= TABLE =================
        columns: [
            { 
                field: "grade_name", 
                label: "Grade Name",
                sortable: true,
                filterable: true
            },
            { 
                field: "section_name", 
                label: "Section Name",
                sortable: true,
                filterable: true
            },
            {
                field: "status",
                label: "Status",
                sortable: true,
                render: (value) => {
                    const statusValue = value === true || value === "active" || value === true ? "Active" : "Inactive";
                    return (
                        <Badge bg={statusValue === "Active" ? "success" : "danger"}>
                            {statusValue}
                        </Badge>
                    );
                }
            },
            {
                field: "createddate",
                label: "Created Date",
                sortable: true,
                render: (value) => {
                    if (!value) return "";
                    return new Date(value).toLocaleDateString();
                }
            },
            {
                field: "lastmodifieddate",
                label: "Last Modified",
                sortable: true,
                render: (value) => {
                    if (!value) return "";
                    return new Date(value).toLocaleDateString();
                }
            }
        ],

        // ================= FORM =================
        formFields: [
            {
                name: "grade_name",
                label: "Grade Name",
                type: "text",
                required: true,
                placeholder: "Enter grade name (e.g., Grade 10, Class 9)",
                colSize: 6,
                maxLength: 50,
                validation: {
                    required: "Grade name is required",
                    maxLength: 50
                }
            },
            {
                name: "section_name",
                label: "Section Name",
                type: "text",
                required: true,
                placeholder: "Enter section name (e.g., A, B, Science)",
                colSize: 6,
                maxLength: 10,
                validation: {
                    required: "Section name is required",
                    maxLength: 10
                }
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
                defaultValue: true
            }
        ],

        // ================= TRANSFORMS =================
        transformBeforeSave: (data) => {
            // Trim whitespace from inputs
            if (data.grade_name) data.grade_name = data.grade_name.trim();
            if (data.section_name) data.section_name = data.section_name.trim();
            
            // Convert status to boolean if needed
            if (typeof data.status === 'string') {
                data.status = data.status === 'true' || data.status === 'active';
            }
            
            return data;
        },

        transformAfterFetch: (data) => {
            // No transformation needed for display
            return data;
        },

        // ================= VALIDATION =================
        validationRules: (formData) => {
            const errors = [];

            if (!formData.grade_name?.trim()) {
                errors.push("Grade name is required");
            } else if (formData.grade_name.length > 50) {
                errors.push("Grade name cannot exceed 50 characters");
            }

            if (!formData.section_name?.trim()) {
                errors.push("Section name is required");
            } else if (formData.section_name.length > 10) {
                errors.push("Section name cannot exceed 10 characters");
            }

            return errors;
        },

        // ================= FEATURES =================
        features: {
            showBulkInsert: true,
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
            showBulkDelete: true,
            showBulkStatusUpdate: true,
            permissions: permissions || {},
        },

        // ================= FILTER FIELDS =================
        filterFields: [
            {
                name: "grade_name",
                label: "Grade Name",
                type: "text",
                placeholder: "Filter by grade name"
            },
            {
                name: "section_name",
                label: "Section Name",
                type: "text",
                placeholder: "Filter by section name"
            },
            {
                name: "status",
                label: "Status",
                type: "select",
                options: [
                    { label: "All", value: "" },
                    { label: "Active", value: true },
                    { label: "Inactive", value: false }
                ]
            }
        ],

        // ================= BULK IMPORT CONFIG =================
        bulkImportConfig: {
            templateFields: [
                { name: "grade_name", label: "Grade Name", required: true, maxLength: 50 },
                { name: "section_name", label: "Section Name", required: true, maxLength: 10 },
                { name: "status", label: "Status", options: ["Active", "Inactive"] }
            ],
            validation: (row) => {
                const errors = [];
                
                if (!row.grade_name?.trim()) {
                    errors.push("Grade name is required");
                } else if (row.grade_name.length > 50) {
                    errors.push("Grade name cannot exceed 50 characters");
                }
                
                if (!row.section_name?.trim()) {
                    errors.push("Section name is required");
                } else if (row.section_name.length > 10) {
                    errors.push("Section name cannot exceed 10 characters");
                }
                
                return errors;
            }
        },

        // ================= BULK OPERATIONS =================
        bulkOperations: [
            {
                label: "Activate Selected",
                action: "activate",
                endpoint: "grade-sections/bulk-activate",
                confirmMessage: "Are you sure you want to activate selected grade sections?"
            },
            {
                label: "Deactivate Selected",
                action: "deactivate",
                endpoint: "grade-sections/bulk-deactivate",
                confirmMessage: "Are you sure you want to deactivate selected grade sections?"
            },
            {
                label: "Delete Selected",
                action: "delete",
                endpoint: "grade-sections/bulk-delete",
                confirmMessage: "Are you sure you want to delete selected grade sections?",
                danger: true
            }
        ],

        // ================= SEARCH CONFIG =================
        searchConfig: {
            placeholder: "Search by grade name or section name...",
            fields: ["grade_name", "section_name"]
        },

        // ================= IMPORT MODEL =================
        importModel: GradeSectionModel,

        // ================= ADDITIONAL CONFIG =================
        tableConfig: {
            defaultPageSize: 10,
            pageSizeOptions: [10, 25, 50, 100],
            showPagination: true,
            showPageSizeChanger: true,
            showTotal: true,
            striped: true,
            hover: true
        },

        // ================= CUSTOM MESSAGES =================
        messages: {
            createSuccess: "Grade section created successfully",
            updateSuccess: "Grade section updated successfully",
            deleteSuccess: "Grade section deleted successfully",
            deleteConfirm: "Are you sure you want to delete this grade section?",
            bulkDeleteConfirm: "Are you sure you want to delete {count} selected grade sections?",
            importSuccess: "Grade sections imported successfully",
            duplicateError: "A grade section with this grade name and section name already exists"
        },

        // ================= PRE-FILLED OPTIONS =================
        predefinedOptions: {
            gradeNames: [
                "Nursery", "LKG", "UKG",
                "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
                "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10",
                "Grade 11", "Grade 12"
            ],
            sectionNames: ["A", "B", "C", "D", "E", "Science", "Commerce", "Arts"]
        }
    };
};

export default getGradeSectionConfig;