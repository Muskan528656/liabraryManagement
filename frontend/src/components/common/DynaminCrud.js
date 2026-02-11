
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Container, Row, Col, Card, Button, Modal, Form, Table, OverlayTrigger, Tooltip, InputGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import ResizableTable from "./ResizableTable";
import ScrollToTop from "./ScrollToTop";
import TableHeader from "./TableHeader";
import FormModal from "./FormModal";
import DataApi from "../../api/dataApi";
import PubSub from "pubsub-js";
import { exportToExcel } from "../../utils/excelExport";
import jwt_decode from "jwt-decode";
import ModuleDetail from "./ModuleDetail";
import UniversalCSVXLSXImporter from "./UniversalCSVXLSXImporter";
import { saveImportedData } from "../../utils/importHelpers";
import AdvancedFilter, { applyAdvancedFilters } from "./AdvancedFilter";
import '../../App.css';
const normalizeListResponse = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
    if (Array.isArray(payload.records)) return payload.records;
    if (Array.isArray(payload.rows)) return payload.rows;
    if (payload.results && Array.isArray(payload.results)) return payload.results;
    return [];
};

const DynamicCRUD = ({
    moduleName,
    moduleLabel = "Item",
    apiEndpoint,
    columns = [],
    formFields = [],
    initialFormData = {},
    validationRules,
    features = {},
    importMapping,
    exportColumns,
    customHandlers = {},
    detailConfig = null,
    customActionButtons = [],
    lookupNavigation = {},
    nameClickHandler = null,
    permissions = {},
    emptyMessage = null,
    enablePrefetch = true,
    autoFetchRelated = true,
    recordsPerPage = 10,
    icon,
    importMatchFields = [],
    autoCreateRelated = {},
    importModel,
    headerActions = [],
    filterFields = [],
    authors = [],
    categories = [],
    publishers = [],
}) => {
    const {
        allowCreate = true,
        allowEdit = true,
        allowView = true
    } = permissions;


    const navigate = useNavigate();

    const {
        showImportButton = false,
        showBulkInsert = false,
        showImportExport = true,
        showDetailView = true,
        showSearch = true,
        showColumnVisibility = true,
        showCheckbox = true,
        showActions = true,
        showAddButton = true,
        canEdit = permissions?.allowEdit,
        showAdvancedFilter = false
    } = features;


    const [selectedItem, setSelectedItem] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [data, setData] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showBulkInsertModal, setShowBulkInsertModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [multiInsertRows, setMultiInsertRows] = useState([{}]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [userInfo, setUserInfo] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [visibleColumns, setVisibleColumns] = useState({});
    const [relatedData, setRelatedData] = useState({});
    const [isEditable, setIsEditable] = useState(false);

    const [showImportModal, setShowImportModal] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState([]);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
    const [passwordFormData, setPasswordFormData] = useState({ password: "", confirmPassword: "" });
    const [passwordVisibility, setPasswordVisibility] = useState({ password: false, confirmPassword: false });

    const handleAddMultiRow = useCallback(() => {
        setMultiInsertRows(prev => [...prev, { ...initialFormData }]);
    }, [initialFormData]);

    const handleRemoveMultiRow = useCallback((index) => {
        if (multiInsertRows.length > 1) {
            setMultiInsertRows(prev => prev.filter((_, i) => i !== index));
        }
    }, [multiInsertRows.length]);

    const handleMultiRowChange = useCallback((index, field, value) => {
        setMultiInsertRows(prev => {
            const updatedRows = [...prev];
            updatedRows[index] = { ...updatedRows[index], [field]: value };
            return updatedRows;
        });
    }, []);

    const hasRowData = useCallback((row) => {
        return Object.values(row).some(val =>
            val !== null && val !== undefined && val !== '' && val !== 0
        );
    }, []);

    const handleNameClick = useCallback((item, isEdit) => {
        console.log("handleNameClick called with isEdit:", isEdit);
        setIsEditable(isEdit)
        console.log("isEditable in DynamicCRUD:", item);
        if (nameClickHandler) {
            nameClickHandler(item);
            return;
        }

        navigate(`/${apiEndpoint}/${item.id}`, {
            state: { type: apiEndpoint, rowData: item },
        });

        if (showDetailView) {
            setSelectedItem(item);
            setShowDetail(true);

            if (enablePrefetch) {
                try {

                    if (isEdit) {
                        console.log("isEdit->>>", isEdit)
                        navigate(`/${apiEndpoint}/${item.id}`, {
                            state: { isEdit: true, rowData: item },
                        });
                    } else {
                        navigate(`/${apiEndpoint}/${item.id}`);
                    }


                } catch (e) {
                    console.warn('Failed to cache data for detail view');
                }
            }
        } else {
            window.open(`/${moduleName}/${item.id}`, '_blank');
        }
    }, [nameClickHandler, showDetailView, enablePrefetch, apiEndpoint, moduleName]);

    const handleBackToList = useCallback(() => {
        setShowDetail(false);
        setSelectedItem(null);
    }, []);


    const getAutoDetailConfig = useCallback(() => {
        if (detailConfig) return detailConfig;

        const autoDetails = columns
            .filter(col => col && col.field && !col.field.includes('_id') && col.field !== 'actions')
            .map(col => ({
                key: col.field,
                label: col.label || col.field,
                type: col.type || "text"
            }));

        return {
            fields: {
                details: autoDetails
            },
            relatedModules: []
        };
    }, [detailConfig, columns]);

    const normalizeLookupPath = useCallback((path = "") => {
        return path.replace(/^\/+|\/+$/g, "");
    }, []);

    const getLookupTargetId = useCallback((lookupConfig = {}, record = {}) => {
        if (typeof lookupConfig.idResolver === "function") {
            return lookupConfig.idResolver(record);
        }

        if (lookupConfig.idField && Object.prototype.hasOwnProperty.call(record, lookupConfig.idField)) {
            return record[lookupConfig.idField];
        }

        if (lookupConfig.moduleIdField && Object.prototype.hasOwnProperty.call(record, lookupConfig.moduleIdField)) {
            return record[lookupConfig.moduleIdField];
        }

        if (lookupConfig.module) {
            const fallbackField = `${lookupConfig.module.replace(/s$/, "")}_id`;
            if (Object.prototype.hasOwnProperty.call(record, fallbackField)) {
                return record[fallbackField];
            }
        }

        return record.id;
    }, []);

    const getLookupLabel = useCallback((value, record, lookupConfig = {}) => {
        if (typeof lookupConfig.labelResolver === "function") {
            return lookupConfig.labelResolver(record);
        }

        if (lookupConfig.labelField && Object.prototype.hasOwnProperty.call(record, lookupConfig.labelField)) {
            return record[lookupConfig.labelField] ?? value;
        }

        return value ?? "—";
    }, []);

    const handleLookupNavigation = useCallback((lookupConfig, record, event = null) => {
        if (event) {
            event.preventDefault();
        }

        if (!lookupConfig) return;

        const targetId = getLookupTargetId(lookupConfig, record);
        if (!targetId) return;

        const basePath = lookupConfig.path || lookupConfig.module;
        if (!basePath) return;

        const finalPath = normalizeLookupPath(basePath);
        if (!finalPath) return;

        const targetUrl = `/${finalPath}/${targetId}`;

        if (lookupConfig.newTab) {
            window.open(targetUrl, "_blank");
            return;
        }

        navigate(targetUrl);
    }, [getLookupTargetId, normalizeLookupPath, navigate]);

    const renderLookupLink = useCallback((value, record, lookupConfig) => {
        const label = getLookupLabel(value, record, lookupConfig);

        return (
            <a
                href="#"
                onClick={(e) => handleLookupNavigation(lookupConfig, record, e)}
                style={{
                    color: "var(--primary-color)",
                    textDecoration: "none",
                    fontWeight: "500",
                    cursor: "pointer"
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                onMouseLeave={(e) => e.target.style.textDecoration = "none"}
            >
                {label}
            </a>
        );
    }, [getLookupLabel, handleLookupNavigation]);

    const getEnhancedColumns = useCallback(() => {
        return columns.map(col => {
            if (!col) return null;

            const customRenderer = customHandlers.columnRenderers?.[col.field];

            if (customRenderer) {
                return {
                    ...col,
                    render: customRenderer
                };
            }

            const lookupConfig = lookupNavigation[col.field];
            if (lookupConfig && !col.render) {
                return {
                    ...col,
                    render: (value, record) => renderLookupLink(value, record, lookupConfig)
                };
            }

            if ((col.field === 'title' || col.field === 'name' || col.field === 'card_number' || col.field === 'role_name' || col.field === 'purchase_serial_no' || col.field === 'firstname' || col.field === 'plan_name' || col.field === 'module_name') && showDetailView && !col.render) {
                return {
                    ...col,
                    render: (value, record) => (
                        <a
                            href={`/${moduleName}/${record.id}`}
                            onClick={(e) => {
                                e.preventDefault();
                                handleNameClick(record);
                            }}
                            style={{
                                color: "var(--primary-color)",
                                textDecoration: "none",
                                fontWeight: "500",
                                cursor: "pointer"
                            }}
                            onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                            onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                        >
                            {value}
                        </a>
                    )
                };
            }

            return col;
        }).filter(Boolean);
    }, [columns, customHandlers.columnRenderers, lookupNavigation, renderLookupLink, showDetailView, moduleName, handleNameClick]);

    const enhancedColumns = useMemo(() => getEnhancedColumns(), [getEnhancedColumns]);
    const finalDetailConfig = useMemo(() => getAutoDetailConfig(), [getAutoDetailConfig]);

    useEffect(() => {
        const initialVisibility = {};
        columns.forEach(col => {
            if (col && col.field) {
                initialVisibility[col.field] = col.hidden !== true;
            }
        });
        setVisibleColumns(initialVisibility);
    }, [columns]);

    useEffect(() => {
        setFormData(initialFormData);
        console.log("recordsPerPage:", recordsPerPage);
    }, [initialFormData]);

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (token) {
            try {
                const user = jwt_decode(token);
                setUserInfo(user);
            } catch (error) {
                console.error("Error decoding token:", error);
            }
        }
    }, []);



    //fetch all data 
    const filteredData = useMemo(() => {
        let result = data;

        // console.log('advancedFilters = ', advancedFilters);
        // console.log('resultData = ', result);
        // console.log('searchTerm = ', searchTerm);
        // console.log('showSearch = ', showSearch);



        const hasActiveFilters = advancedFilters && Object.values(advancedFilters).some(v => v !== "" && v !== null);

        if (hasActiveFilters) {
            result = applyAdvancedFilters(result, advancedFilters);
        }


        if (searchTerm && showSearch) {
            const searchTermLower = (searchTerm || "").toLowerCase();
            result = result.filter(item =>
                columns.some(col => {
                    if (!col || !col.field) return false;
                    const fieldValue = item[col.field];
                    return fieldValue != null &&
                        String(fieldValue).toLowerCase().includes(searchTermLower);
                })
            );
        }

        return result;
    }, [data, searchTerm, showSearch, columns, advancedFilters]);

    const handleAdvancedFilterChange = useCallback((filters) => {
        setAdvancedFilters(filters);
        setCurrentPage(1);
    }, []);

    const handleAdvancedFilterClear = useCallback(() => {
        setAdvancedFilters([]);
        setCurrentPage(1);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const api = new DataApi(apiEndpoint);
            // console.log("Fetching data from API endpoint:", apiEndpoint);
            const response = await api.fetchAll();
            if (response.data !== undefined) {
                const normalizedData = normalizeListResponse(response.data);
                setData(normalizedData);

                if (customHandlers.onDataLoad) {
                    customHandlers.onDataLoad(normalizedData, response.data);
                }
            }
        } catch (error) {
            // console.error(`Error fetching ${moduleLabel}:`, error);
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Error",
                message: `Failed to fetch ${moduleLabel}`,
            });
        } finally {
            setLoading(false);
        }
    }, [apiEndpoint, moduleLabel, customHandlers, advancedFilters]);

    const fetchRelatedData = useCallback(async () => {
        if (!autoFetchRelated) return;
        console.log("fetchRelatedData called");
        try {
            const selectFields = formFields.filter(field =>
                field && field.type === "select" && field.options && typeof field.options === "string"
            );

            const uniqueOptions = [...new Set(selectFields.map(field => field.options))];
            if (uniqueOptions.length === 0) return;

            const relatedProps = {
                authors,
                categories,
                publishers,
            };

            const endpointMap = {
                authors: "author",
                author: "author",
                categories: "category",
                category: "category",
                publishers: "publisher",
                publisher: "publisher",
                users: "user",
                vendors: "vendor",
                vendor: "vendor",
                books: "book",
                book: "book",
                "user-role": "user-role",
                "userroles": "user-role",
                subscriptions: "subscriptions",
                subscription: "subscriptions",
                modules: "module",
                module: "module",
                departments: "department"
            };

            const relatedApis = {};

            for (const option of uniqueOptions) {
                if (relatedProps[option] && Array.isArray(relatedProps[option])) {
                    relatedApis[option] = relatedProps[option];
                } else {
                    try {
                        const endpoint = endpointMap[option] || option;
                        const api = new DataApi(endpoint);
                        const response = await api.fetchAll();

                        relatedApis[option] = normalizeListResponse(response.data);
                    } catch (error) {
                        console.error(`Error fetching ${option}:`, error);
                        relatedApis[option] = [];
                    }
                }
            }

            setRelatedData(relatedApis);
        } catch (error) {
            console.error("Error fetching related data:", error);
        }
    }, [autoFetchRelated, formFields, authors, categories, publishers]);

    useEffect(() => {
        if (userInfo) {
            fetchData();
            if (autoFetchRelated) {
                fetchRelatedData();
            }
        }
    }, [userInfo]);

    // const getProcessedFormFields = useCallback(() => {
    //     return formFields.map(field => {
    //         if (!field) return field;
    //         if (field.options === "subShelfOptions" && typeof subShelfOptions === 'function') {
    //             const shelfName = formData['shelf_name'];
    //             const options = shelfName ? subShelfOptions(shelfName) : [];
    //             return {
    //                 ...field,
    //                 options: [{ value: '', label: 'Select Sub Shelf' }, ...options]
    //             };
    //         }

    //         let processedField = { ...field };

    //         if (field.readOnlyWhenEditing && editingItem) {
    //             processedField.readOnly = true;
    //         }

    //         if ((field.name === 'password' || field.name === 'confirmPassword') && editingItem) {
    //             processedField.required = false;
    //         }

    //         if (field.type !== 'select' || !field.options) {
    //             return processedField;
    //         }

    //         try {
    //             let optionsArray = [];

    //             if (Array.isArray(field.options)) {
    //                 optionsArray = field.options;
    //             } else if (typeof field.options === 'function') {

    //                 optionsArray = field.options(formData) || [];
    //             } else if (typeof field.options === 'string') {
    //                 const relatedOptions = relatedData[field.options];
    //                 if (Array.isArray(relatedOptions)) {
    //                     optionsArray = relatedOptions.map(item => ({
    //                         value: item.id?.toString() || item.role_name?.toString() || '',
    //                         label: item.name || item.title || item.role_name || item.email || item.plan_name || `Item ${item.id}`
    //                     }));
    //                 } else {
    //                     optionsArray = [];
    //                 }
    //             } else {
    //                 console.warn(`Invalid options type for field ${field.name}:`, typeof field.options);
    //                 optionsArray = [];
    //             }

    //             optionsArray = optionsArray.filter(opt => opt && typeof opt === 'object');

    //             if (optionsArray.length > 0) {
    //                 const hasEmptyOption = optionsArray.some(opt =>
    //                     opt.value === '' || opt.value === null || opt.value === undefined
    //                 );

    //                 if (!hasEmptyOption) {
    //                     optionsArray = [
    //                         { value: '', label: `Select ${field.label}` },
    //                         ...optionsArray
    //                     ];
    //                 }
    //             }

    //             processedField.options = optionsArray;

    //             return processedField;

    //         } catch (error) {
    //             console.error(`Error processing field ${field.name}:`, error);
    //             return {
    //                 ...processedField,
    //                 options: []
    //             };
    //         }
    //     });
    // }, [formFields, relatedData, formData, editingItem]);





    // const getProcessedFormFields = useCallback(() => {
    //     return formFields.map(field => {
    //         if (!field) return field;

    //         let processedField = { ...field };

    //         if (field.readOnlyWhenEditing && editingItem) {
    //             processedField.readOnly = true;
    //         }

    //         if ((field.name === 'password' || field.name === 'confirmPassword') && editingItem) {
    //             processedField.required = false;
    //         }

    //         if (field.type !== 'select' || !field.options) {
    //             return processedField;
    //         }

    //         try {
    //             let optionsArray = [];

    //             if (Array.isArray(field.options)) {
    //                 optionsArray = field.options;
    //             } else if (typeof field.options === 'function') {
    //                 // For dependent dropdowns (like subShelfOptions)
    //                 if (field.dependentField) {
    //                     const dependentValue = formData[field.dependentField];
    //                     if (dependentValue) {
    //                         // Call the function with dependent field value
    //                         optionsArray = field.options(dependentValue) || [];
    //                     } else {
    //                         // If dependent field not selected, show empty or placeholder
    //                         optionsArray = [{ value: '', label: `Select ${field.label}` }];
    //                     }
    //                 } else {
    //                     // For other functions, pass formData
    //                     optionsArray = field.options(formData) || [];
    //                 }
    //             } else if (typeof field.options === 'string') {
    //                 // For regular select options from relatedData
    //                 const relatedOptions = relatedData[field.options];
    //                 if (Array.isArray(relatedOptions)) {
    //                     optionsArray = relatedOptions.map(item => ({
    //                         value: item.id?.toString() || item.role_name?.toString() || '',
    //                         label: item.name || item.title || item.role_name || item.email || item.plan_name || `Item ${item.id}`
    //                     }));
    //                 } else {
    //                     optionsArray = [];
    //                 }
    //             } else {
    //                 console.warn(`Invalid options type for field ${field.name}:`, typeof field.options);
    //                 optionsArray = [];
    //             }

    //             // Filter out invalid options
    //             optionsArray = optionsArray.filter(opt => opt && typeof opt === 'object');

    //             // Add empty option if needed
    //             if (optionsArray.length > 0) {
    //                 const hasEmptyOption = optionsArray.some(opt =>
    //                     opt.value === '' || opt.value === null || opt.value === undefined
    //                 );

    //                 if (!hasEmptyOption) {
    //                     optionsArray = [
    //                         { value: '', label: `Select ${field.label}` },
    //                         ...optionsArray
    //                     ];
    //                 }
    //             }

    //             processedField.options = optionsArray;
    //             return processedField;

    //         } catch (error) {
    //             console.error(`Error processing field ${field.name}:`, error);
    //             return {
    //                 ...processedField,
    //                 options: []
    //             };
    //         }
    //     });
    // }, [formFields, relatedData, formData, editingItem]);

    // const getProcessedFormFields = useCallback(() => {
    // return formFields
    //     .map(field => {
    //     if (!field) return null;

    //     let processedField = { ...field };

    //     // ===== READONLY / REQUIRED FIXES =====
    //     if (field.readOnlyWhenEditing && editingItem) {
    //         processedField.readOnly = true;
    //     }

    //     if ((field.name === 'password' || field.name === 'confirmPassword') && editingItem) {
    //         processedField.required = false;
    //     }

    //     // ===== OPTIONS PROCESSING (IMPORTANT PART) =====
    //     if (field.type === 'select' && field.options) {
    //         let optionsArray = [];

    //         if (Array.isArray(field.options)) {
    //         optionsArray = field.options;
    //         } else if (typeof field.options === 'function') {
    //         optionsArray = field.options(formData) || [];
    //         } else if (typeof field.options === 'string') {
    //         const relatedOptions = relatedData[field.options];
    //         if (Array.isArray(relatedOptions)) {
    //             optionsArray = relatedOptions.map(item => ({
    //             value: item.id?.toString() || '',
    //             label: item.name || item.title || item.email || `Item ${item.id}`
    //             }));
    //         }
    //         }

    //         optionsArray = optionsArray.filter(opt => opt && typeof opt === 'object');

    //         if (!optionsArray.some(opt => opt.value === '')) {
    //         optionsArray = [{ value: '', label: `Select ${field.label}` }, ...optionsArray];
    //         }

    //         processedField.options = optionsArray;
    //     }

    //     return processedField;
    //     })
    //     // ✅ CONDITION MUST BE APPLIED LAST
    //     .filter(field => {
    //     if (!field) return false;
    //     if (typeof field.condition === "function") {
    //         return field.condition(formData);
    //     }
    //     return true;
    //     });
    // }, [formFields, relatedData, formData, editingItem]);


    const getProcessedFormFields = useCallback(() => {
    return formFields
        .map(field => {
            if (!field) return null;

            let processedField = { ...field };

         
            if (field.readOnlyWhenEditing && editingItem) {
                processedField.readOnly = true;
            }

            if (
                (field.name === 'password' || field.name === 'confirmPassword') &&
                editingItem
            ) {
                processedField.required = false;
            }

     
            if (typeof field.condition === "function") {
                const shouldShow = field.condition(formData);
                if (!shouldShow) return null;
            }

            // ===== OPTIONS PROCESSING =====
            if (field.type === 'select' && field.options) {
                let optionsArray = [];

                if (Array.isArray(field.options)) {
                    optionsArray = field.options;
                } else if (typeof field.options === 'function') {
                    optionsArray = field.options(formData) || [];
                } else if (typeof field.options === 'string') {
                    const relatedOptions = relatedData[field.options];
                    if (Array.isArray(relatedOptions)) {
                        optionsArray = relatedOptions.map(item => ({
                            value: String(item.id || ''),
                            label:
                                item.name ||
                                item.title ||
                                item.email ||
                                `Item ${item.id}`
                        }));
                    }
                }

                optionsArray = optionsArray.filter(
                    opt => opt && typeof opt === 'object'
                );

                if (!optionsArray.some(opt => opt.value === '')) {
                    optionsArray = [
                        { value: '', label: `Select ${field.label}` },
                        ...optionsArray
                    ];
                }

                processedField.options = optionsArray;
            }

            return processedField;
        })
        .filter(Boolean); // cleaner
}, [formFields, relatedData, formData, editingItem]);
    

    const handleAdd = useCallback(() => {
        if (customHandlers?.handleAdd) {
            customHandlers.handleAdd(navigate);
            return;
        }
        setEditingItem(null);
        setFormData(initialFormData);
        setShowModal(true);
    }, [initialFormData, navigate]);


    const handleEdit = useCallback((item) => {
        if (!allowEdit) return;
        navigate(`/${apiEndpoint}/${item.id}`, {
            state: { type: apiEndpoint, rowData: item },
        });
    }, [allowEdit, apiEndpoint, navigate]);

    // const handleDelete = useCallback((id) => {
    //     if (!allowDelete) return;
    //     setDeleteId(id);
    //     setShowDeleteModal(true);
    // }, [allowDelete]);

    const handleChangePassword = useCallback((user) => {
        setSelectedUserForPassword(user);
        setPasswordFormData({ password: "", confirmPassword: "" });
        setShowChangePasswordModal(true);
    }, []);

    const handleChangePasswordSubmit = useCallback(async () => {
        if (!passwordFormData.password || !passwordFormData.confirmPassword) {
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Validation Error",
                message: "Please fill in both password fields",
            });
            return;
        }

        if (passwordFormData.password !== passwordFormData.confirmPassword) {
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Validation Error",
                message: "Passwords do not match",
            });
            return;
        }

        try {
            setLoading(true);
            const api = new DataApi(apiEndpoint);
            const response = await api.update({ password: passwordFormData.password }, selectedUserForPassword.id);

            if (response.data?.success) {
                PubSub.publish("RECORD_SAVED_TOAST", {
                    title: "Success",
                    message: "Password changed successfully",
                });
                setShowChangePasswordModal(false);
                setSelectedUserForPassword(null);
                setPasswordFormData({ password: "", confirmPassword: "" });
            } else {
                throw new Error(response.data?.errors || 'Password change failed');
            }
        } catch (error) {
            console.error("Error changing password:", error);
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Error",
                message: `Failed to change password: ${error.message}`,
            });
        } finally {
            setLoading(false);
        }
    }, [passwordFormData, selectedUserForPassword, apiEndpoint]);

    const confirmDelete = useCallback(async () => {
        try {
            setLoading(true);
            const api = new DataApi(apiEndpoint);
            const response = await api.delete(deleteId);

            if (response.data?.success) {
                PubSub.publish("RECORD_SAVED_TOAST", {
                    title: "Success",
                    message: `${moduleLabel} deleted successfully`,
                });
                fetchData();
                setShowDeleteModal(false);
                setDeleteId(null);
            } else {
                throw new Error(response.data?.errors || 'Delete failed');
            }
        } catch (error) {
            console.error(`Error deleting ${moduleLabel}:`, error);
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Error",
                message: `Failed to delete ${moduleLabel}: ${error.message}`,
            });
        } finally {
            setLoading(false);
        }
    }, [apiEndpoint, deleteId, moduleLabel, fetchData]);

    const handleSave = useCallback(async () => {

        console.log("check it form-->", formData);

        if (customHandlers.beforeSave) {
            const customResult = customHandlers.beforeSave(formData, editingItem);
            if (customResult === false) return;
        }

        if (validationRules) {
            const errors = validationRules(formData, data, editingItem);
            console.log("validationRules", validationRules);
            console.log("errors", errors);
            if (errors.length > 0) {
                PubSub.publish("RECORD_ERROR_TOAST", {
                    title: "Validation Error",
                    message: errors.join(", "),
                });
                return;
            }
        }


        try {
            setLoading(true);
            const api = new DataApi(apiEndpoint);
            console.log("apiEndpoint", apiEndpoint);
            console.log("api", api);
            let response;
            const hasFileUpload = formFields.some(field => field && field.type === 'file');
            console.log("formDaformDataformDataformData", formData);
            if (hasFileUpload) {
                const submitData = new FormData();
                console.log("submitdatasubmitData", submitData);
                Object.keys(formData).forEach(key => {
                    const value = formData[key];
                    if (value !== null && value !== undefined && value !== '') {
                        const fieldConfig = formFields.find(f => f && f.name === key);
                        if (fieldConfig && fieldConfig.type === 'file') {
                            if (value instanceof File) {
                                submitData.append(key, value);
                            } else if (value) {
                                submitData.append(key, value);
                            }
                        } else {
                            // Convert to string for multipart/form-data compatibility
                            submitData.append(key, String(value));
                        }
                    } else if (value === null) {
                        // Handle null values for file fields (e.g., to remove images)
                        const fieldConfig = formFields.find(f => f && f.name === key);
                        if (fieldConfig && fieldConfig.type === 'file') {
                            submitData.append(key, 'null');
                        }
                    }
                });

                if (editingItem) {
                    console.log("🔄 [FRONTEND] Updating existing item, ID:", editingItem.id);
                    // Use specific method for library cards to handle multipart/form-data correctly
                    if (apiEndpoint === 'librarycard') {
                        console.log("📚 [FRONTEND] Using library card specific update method");
                        response = await api.updateLibraryCard(submitData, editingItem.id);
                    } else {
                        console.log("📝 [FRONTEND] Using generic update method");
                        response = await api.update(submitData, editingItem.id);
                    }
                } else {
                    console.log("➕ [FRONTEND] Creating new item");
                    console.log("submitDatasubmitData", submitData)
                    response = await api.create(submitData);
                    console.log("Respinse", response)
                }
            } else {

                const submitData = { ...formData };

                Object.keys(submitData).forEach(key => {
                    if (submitData[key] === '') submitData[key] = null;
                });

                if (editingItem) {
                    // Only include password fields if they are provided during edit
                    if (!submitData.password || submitData.password.trim() === '') {
                        delete submitData.password;
                        delete submitData.confirmPassword;
                    }
                    response = await api.update(submitData, editingItem.id);
                } else {
                    response = await api.create(submitData);
                }
            }

            if (response.data?.success) {
                PubSub.publish("RECORD_SAVED_TOAST", {
                    title: "Success",
                    message: `${moduleLabel} ${editingItem ? 'updated' : 'created'} successfully`,
                });
                fetchData();
                setShowModal(false);
                setFormData(initialFormData);
                setEditingItem(null);

                if (customHandlers.afterSave) {
                    customHandlers.afterSave(response.data, editingItem);
                }
            } else {
                throw new Error(response.data?.errors || 'Save failed');
            }
        } catch (error) {
            console.error(`Error saving ${moduleLabel}:`, error);
            console.error(`error.messageerror.messageerror.message`, error.message);
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Error",
                message: `Failed to save ${moduleLabel}: ${error.message}`,
            });
        } finally {
            setLoading(false);
        }
    }, [customHandlers, validationRules, formData, editingItem, data, apiEndpoint, formFields, moduleLabel, fetchData, initialFormData]);

    const handleBulkInsert = useCallback(() => {
        setMultiInsertRows([{ ...initialFormData }]);
        setShowBulkInsertModal(true);
    }, [initialFormData]);

    const handleMultiInsertSave = useCallback(async () => {
        try {
            setLoading(true);
            const api = new DataApi(apiEndpoint);
            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (const row of multiInsertRows) {
                try {
                    const hasData = Object.values(row).some(val =>
                        val !== null && val !== undefined && val !== '' && val !== 0
                    );

                    if (!hasData) continue;

                    const rowData = { ...row };
                    Object.keys(rowData).forEach(key => {
                        if (rowData[key] === '') rowData[key] = null;
                    });

                    await api.create(rowData);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    errors.push(`Row ${multiInsertRows.indexOf(row) + 1}: ${error.message}`);
                }
            }

            if (successCount > 0) {
                PubSub.publish("RECORD_SAVED_TOAST", {
                    title: "Bulk Insert Complete",
                    message: `Successfully inserted ${successCount} ${moduleLabel.toLowerCase()}(s)${errorCount > 0 ? `. ${errorCount} failed.` : ''}`,
                });
            }

            if (errorCount > 0) {
                PubSub.publish("RECORD_ERROR_TOAST", {
                    title: "Some records failed",
                    message: errors.slice(0, 3).join('; '),
                });
            }

            fetchData();
            setShowBulkInsertModal(false);
            setMultiInsertRows([{ ...initialFormData }]);
        } catch (error) {
            console.error("Error in bulk insert:", error);
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Error",
                message: "Failed to insert records",
            });
        } finally {
            setLoading(false);
        }
    }, [apiEndpoint, multiInsertRows, moduleLabel, fetchData, initialFormData]);

    const handleExport = useCallback(async () => {
        try {
            const exportList = selectedItems.length > 0
                ? filteredData.filter(item => selectedItems.includes(item.id))
                : filteredData;

            const defaultExportColumns = columns
                .filter(col => col && visibleColumns[col.field])
                .map(col => ({
                    key: col.field,
                    header: col.label,
                    width: 20
                }));

            await exportToExcel(
                exportList,
                moduleName,
                `${moduleLabel} List`,
                exportColumns || defaultExportColumns
            );
        } catch (error) {
            console.error(`Error exporting ${moduleLabel}:`, error);
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Export Error",
                message: `Failed to export ${moduleLabel}`,
            });
        }
    }, [selectedItems, filteredData, columns, visibleColumns, moduleName, moduleLabel, exportColumns]);

    const toggleColumnVisibility = useCallback((field) => {
        setVisibleColumns(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    }, []);

    const getActionButtons = useCallback(() => {
        const buttons = [];

        // if (showImportButton) {
        //     buttons.push({
        //         variant: "outline-primary",
        //         size: "sm",
        //         icon: "fa-solid fa-arrow-down",
        //         label: `Import ${moduleLabel}`,
        //         onClick: async () => {
        //             if (Object.keys(relatedData).length === 0) {
        //                 await fetchRelatedData();
        //             }
        //             setShowImportModal(true);
        //         },
        //     });
        // }

        if (showImportButton && allowCreate) {
            buttons.push({
                variant: "outline-primary",
                size: "sm",
                icon: "fa-solid fa-arrow-down",
                label: `Import ${moduleLabel}`,
                onClick: async () => {
                    if (Object.keys(relatedData).length === 0) {
                        await fetchRelatedData();
                    }
                    setShowImportModal(true);
                },
            });
        }

        if (showImportExport) {
            buttons.push({
                variant: "outline-primary",
                size: "sm",
                icon: "fa-solid fa-arrow-up",
                label: "Export",
                onClick: handleExport,
            });
        }

        if (showBulkInsert) {
            buttons.push({
                variant: "outline-primary",
                size: "sm",
                icon: "fa-solid fa-layer-group",
                label: "Bulk Insert",
                onClick: handleBulkInsert,
            });
        } if (showAddButton && allowCreate) {
            buttons.push({
                size: "sm",
                icon: "fa-solid fa-plus",
                label: `Add ${moduleLabel}`,
                onClick: handleAdd,
                style: {
                    background: "var(--primary-color)",
                    border: "none",
                },
            });
        }

        // if (showAddButton) {
        //     buttons.push({
        //         size: "sm",
        //         icon: "fa-solid fa-plus",
        //         label: `Add ${moduleLabel}`,
        //         onClick: handleAdd,
        //         style: {
        //             background: "var(--primary-color)",
        //             border: "none",
        //         },
        //     });
        // }

        if (customActionButtons.length > 0) {
            buttons.push(...customActionButtons);
        }

        return buttons;
    }, [
        showImportButton,
        showImportExport,
        showBulkInsert,
        showAddButton,
        moduleLabel,
        handleExport,
        handleBulkInsert,
        handleAdd,
        customActionButtons,
        setShowImportModal,
    ]);


    // const getActionButtons = useCallback(() => {
    //     const buttons = [];

    //     if (showImportButton) {
    //         buttons.push({
    //             variant: "outline-primary",
    //             size: "sm",
    //             icon: "fa-solid fa-arrow-down",
    //             label: `Import ${moduleLabel}`,
    //             onClick: async () => {
    //                 if (Object.keys(relatedData).length === 0) {
    //                     await fetchRelatedData();
    //                 }
    //                 setShowImportModal(true);
    //             },
    //         });
    //     }

    //     // if (showImportButton && canCreate) {
    //     //     buttons.push({
    //     //         variant: "outline-primary",
    //     //         size: "sm",
    //     //         icon: "fa-solid fa-arrow-down",
    //     //         label: `Import ${moduleLabel}`,
    //     //         onClick: async () => {
    //     //             if (Object.keys(relatedData).length === 0) {
    //     //                 await fetchRelatedData();
    //     //             }
    //     //             setShowImportModal(true);
    //     //         },
    //     //     });
    //     // }

    //     if (showImportExport) {
    //         buttons.push({
    //             variant: "outline-primary",
    //             size: "sm",
    //             icon: "fa-solid fa-arrow-up",
    //             label: "Export",
    //             onClick: handleExport,
    //         });
    //     }

    //     if (showBulkInsert) {
    //         buttons.push({
    //             variant: "outline-primary",
    //             size: "sm",
    //             icon: "fa-solid fa-layer-group",
    //             label: "Bulk Insert",
    //             onClick: handleBulkInsert,
    //         });
    //     } if (showAddButton) {
    //         buttons.push({
    //             size: "sm",
    //             icon: "fa-solid fa-plus",
    //             label: `Add ${moduleLabel}`,
    //             onClick: handleAdd,
    //             style: {
    //                 background: "var(--primary-color)",
    //                 border: "none",
    //             },
    //         });
    //     }

    //     // if (showAddButton) {
    //     //     buttons.push({
    //     //         size: "sm",
    //     //         icon: "fa-solid fa-plus",
    //     //         label: `Add ${moduleLabel}`,
    //     //         onClick: handleAdd,
    //     //         style: {
    //     //             background: "var(--primary-color)",
    //     //             border: "none",
    //     //         },
    //     //     });
    //     // }

    //     if (customActionButtons.length > 0) {
    //         buttons.push(...customActionButtons);
    //     }

    //     return buttons;
    // }, [
    //     showImportButton,
    //     showImportExport,
    //     showBulkInsert,
    //     showAddButton,
    //     moduleLabel,
    //     handleExport,
    //     handleBulkInsert,
    //     handleAdd,
    //     customActionButtons,
    //     setShowImportModal,
    // ]);


    const processedFormFields = useMemo(() => getProcessedFormFields(), [getProcessedFormFields]);
    const actionButtons = useMemo(() => getActionButtons(), [getActionButtons]);

    if (showDetail && selectedItem) {
        return (
            <Container fluid>
                <ScrollToTop />

                <Row className="mb-3">
                    <Col>
                        <Button
                            variant="outline-secondary"
                            onClick={handleBackToList}
                            className="mb-3"
                        >
                            <i className="fa-solid fa-arrow-left me-2"></i>
                            Back to {moduleLabel} List
                        </Button>
                    </Col>
                </Row>

                <ModuleDetail
                    moduleName={moduleName}
                    moduleApi={apiEndpoint}
                    moduleLabel={moduleLabel}
                    prefetchData={selectedItem}
                    lookupNavigation={lookupNavigation}
                    {...finalDetailConfig}
                    setIsEditable={isEditable}
                    isEditablee={isEditable}
                    permissions={permissions}

                />
            </Container>
        );
    }

    return (
        <Container fluid >
            <ScrollToTop />
            {/* 
            <Row className="mb-3" style={{ marginTop: "0.5rem" }}>
                <Col>
                    <TableHeader
                        title={`${moduleLabel} Management`}
                        icon="fa-solid fa-book"
                        totalCount={filteredData.length}
                        totalLabel={moduleLabel}
                        searchPlaceholder={`Search ${moduleLabel.toLowerCase()}...`}
                        searchValue={searchTerm}
                        onSearchChange={showSearch ? setSearchTerm : null}
                        showColumnVisibility={showColumnVisibility}
                        allColumns={columns}
                        visibleColumns={visibleColumns}
                        onToggleColumnVisibility={toggleColumnVisibility}
                        actionButtons={actionButtons}
                    />
                </Col>
            </Row> */}

            <Row className="justify-content-center">
                <Col lg={12} xl={12}>
                    <Card
                        style={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "4px", overflow: "hidden" }}>
                        <Card.Body className="">
                            {loading ? (
                                // <Loader />
                                <span className="loader"></span>

                            ) : (
                                <>
                                    <TableHeader
                                        title={`${moduleLabel || "Item"}`}
                                        icon={icon}
                                        totalCount={filteredData.length}
                                        totalLabel={moduleLabel || "Item"}
                                        searchPlaceholder={`Search ${(moduleLabel || "Item").toLowerCase()}...`}
                                        searchValue={searchTerm}
                                        onSearchChange={showSearch ? setSearchTerm : null}
                                        showColumnVisibility={showColumnVisibility}
                                        allColumns={columns}
                                        visibleColumns={visibleColumns}
                                        onToggleColumnVisibility={toggleColumnVisibility}
                                        actionButtons={actionButtons}
                                        headerActions={headerActions}
                                    />

                                    {/* {showAdvancedFilter && (
                                        <AdvancedFilter
                                            fields={filterFields.length > 0 ? filterFields : formFields.map(field => ({
                                                ...field,
                                                name: field.name || field.field,
                                                field: field.name || field.field,
                                            }))}
                                            onFilterChange={handleAdvancedFilterChange}
                                            onClear={handleAdvancedFilterClear}
                                        />
                                    )} */}
                                    {showAdvancedFilter && (
                                        <AdvancedFilter


                                            fields={filterFields.length > 0
                                                ? filterFields
                                                : processedFormFields.filter(f => !['password', 'file', 'image', 'hidden'].includes(f.type))
                                            }
                                            onFilterChange={handleAdvancedFilterChange}
                                            onClear={handleAdvancedFilterClear}
                                        />
                                    )}
                                    <ResizableTable
                                        data={filteredData}
                                        columns={enhancedColumns.filter(col => col && visibleColumns[col.field])}
                                        loading={loading}
                                        showCheckbox={showCheckbox}
                                        selectedItems={selectedItems}
                                        onSelectionChange={setSelectedItems}
                                        searchTerm={searchTerm}
                                        onSearchChange={showSearch ? setSearchTerm : null}
                                        currentPage={currentPage}
                                        totalRecords={filteredData.length}
                                        recordsPerPage={recordsPerPage} //this bg-info
                                        onPageChange={setCurrentPage}
                                        showSerialNumber={true}
                                        showActions={allowEdit}
                                        actionsRenderer={showActions ? (item) => (
                                            <div className="d-flex gap-2 justify-content-center">

                                                {allowEdit && canEdit && (
                                                    <button
                                                        onClick={() => handleNameClick(item, true)}
                                                        title="Edit"
                                                        className="custom-btn-edit"
                                                    >
                                                        <i className="fs-7 fa-solid fa-pen-to-square"></i>
                                                    </button>
                                                )}

                                                {moduleName === 'user' && canEdit && (
                                                    <button
                                                        onClick={() => handleChangePassword(item)}
                                                        title="Change Password"
                                                        className="custom-btn-edit"
                                                    >
                                                        <i className="fs-7 fa-solid fa-key" style={{ color: 'gray' }}></i>
                                                    </button>
                                                )}
                                                {/* {allowDelete && canDelete && (
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        title="Delete"
                                                        className="custom-btn-delete"
                                                    >
                                                        <i className="fs-7 fa-solid fa-trash"></i>
                                                    </button>
                                                )} */}

                                                {customHandlers?.handleBarcodePreview && (
                                                    <button
                                                        className="custom-btn-edit"
                                                        onClick={() => customHandlers.handleBarcodePreview(item)}
                                                        title="View Barcode"
                                                    >
                                                        {/* <i className="fs-7 fa-solid fa-eye me-1"></i> */}
                                                        <i className="fs-7 fa-solid fa-eye me-1"></i>
                                                    </button>
                                                )}
                                            </div>
                                        ) : null}
                                        // actionsRenderer={showActions ? (item) => (
                                        //     <div className="d-flex gap-2 justify-content-center">
                                        //         {allowEdit && (
                                        //             <button

                                        //                 onClick={() => handleNameClick(item, true)}
                                        //                 title="Edit"
                                        //                 className="custom-btn-edit"

                                        //             >
                                        //                 <i className="fs-7 fa-solid fa-pen-to-square"></i>
                                        //             </button>
                                        //         )}
                                        //         {allowDelete && (
                                        //             <button

                                        //                 onClick={() => handleDelete(item.id)}
                                        //                 title="Delete"
                                        //                 className="custom-btn-delete"
                                        //             >
                                        //                 <i className="fs-7 fa-solid fa-trash"></i>
                                        //             </button>
                                        //         )}
                                        //         {customHandlers?.handleBarcodePreview && (
                                        //             <button

                                        //                 className="custom-btn-edit"

                                        //                 onClick={() => customHandlers.handleBarcodePreview(item)}
                                        //                 title="View Barcode"
                                        //             >
                                        //                 <i className="fs-7 fa-solid fa-eye me-1"></i>
                                        //             </button>
                                        //         )}
                                        //     </div>
                                        // ) : null}
                                        emptyMessage={emptyMessage || `No ${(moduleLabel || "Item").toLowerCase()} found`}
                                    />
                                </>

                            )}

                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <FormModal
                show={showModal}
                onHide={() => {
                    setShowModal(false);
                    setEditingItem(null);
                    setFormData(initialFormData);
                }}
                title={editingItem ? `Edit ${moduleLabel}` : `Add New ${moduleLabel}`}
                icon={icon}
                formData={formData}
                setFormData={setFormData}
                fields={processedFormFields}
                onSubmit={handleSave}
                loading={loading}
                editingItem={editingItem}
            />

            <Modal backdrop="static" show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete this {moduleLabel.toLowerCase()}?
                    This action cannot be undone.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDelete} disabled={loading}>
                        {loading ? "Deleting..." : "Delete"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {showBulkInsert && (
                <Modal show={showBulkInsertModal} onHide={() => setShowBulkInsertModal(false)} size="xl" centered scrollable>
                    <Modal.Header closeButton>
                        <Modal.Title>Bulk Insert {moduleLabel}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{ maxHeight: '70vh', overflow: 'auto' }}>
                        <p className="text-muted mb-3">
                            Add multiple {moduleLabel.toLowerCase()} records at once. Leave cells empty to skip.
                        </p>

                        <div className="table-responsive">
                            <Table striped bordered hover size="sm">
                                <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                                    <tr>
                                        <th width="50px">#</th>
                                        {processedFormFields.map((field) => (
                                            <th key={field.name}>
                                                {field.label}
                                                {field.required && <span className="text-danger">*</span>}
                                            </th>
                                        ))}
                                        <th width="80px">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {multiInsertRows.map((row, index) => (
                                        <tr key={index} className={index % 2 === 0 ? '' : 'table-light'}>
                                            <td className="text-center fw-bold">{index + 1}</td>
                                            {processedFormFields.map((field) => (
                                                <td key={field.name}>
                                                    {field.type === 'select' ? (
                                                        <Form.Select
                                                            size="sm"
                                                            value={row[field.name] || ''}
                                                            onChange={(e) => handleMultiRowChange(index, field.name, e.target.value)}
                                                            className="border-0 bg-transparent"
                                                        >
                                                            <option value="">Select {field.label}</option>
                                                            {Array.isArray(field.options) && field.options
                                                                .filter(opt => opt.value !== '')
                                                                .map(opt => (
                                                                    <option key={opt.value} value={opt.value}>
                                                                        {opt.label}
                                                                    </option>
                                                                ))
                                                            }
                                                        </Form.Select>
                                                    ) : field.type === 'number' ? (
                                                        <Form.Control
                                                            type="number"
                                                            size="sm"
                                                            value={row[field.name] || ''}
                                                            onChange={(e) => handleMultiRowChange(index, field.name, e.target.value)}
                                                            placeholder={field.placeholder}
                                                            className="border-0 bg-transparent"
                                                            {...field.props}
                                                        />
                                                    ) : (
                                                        <Form.Control
                                                            type={field.type}
                                                            size="sm"
                                                            value={row[field.name] || ''}
                                                            onChange={(e) => handleMultiRowChange(index, field.name, e.target.value)}
                                                            placeholder={field.placeholder}
                                                            className="border-0 bg-transparent"
                                                            {...field.props}
                                                        />
                                                    )}
                                                </td>
                                            ))}
                                            <td className="text-center">
                                                {multiInsertRows.length > 1 && (
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleRemoveMultiRow(index)}
                                                        title="Remove row"
                                                    >
                                                        <i className="fa-solid fa-trash"></i>
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>

                        <div className="text-center mt-3">
                            <Button variant="outline-primary" onClick={handleAddMultiRow}>
                                <i className="fa-solid fa-plus me-2"></i>
                                Add New Row
                            </Button>
                        </div>

                        <div className="mt-3 p-2 bg-light rounded">
                            <small className="text-muted">
                                <strong>Summary:</strong> {multiInsertRows.length} row(s) |
                                {' '}{multiInsertRows.filter(hasRowData).length} row(s) with data |
                                {' '}{multiInsertRows.filter(row => !hasRowData(row)).length} empty row(s)
                            </small>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary" onClick={() => setShowBulkInsertModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleMultiInsertSave}
                            disabled={loading || multiInsertRows.filter(hasRowData).length === 0}
                        >
                            {loading ? (
                                <>
                                    {/* <span className="spinner-border spinner-border-sm me-2" role="status"></span> */}
                                    <span className="loader"></span>
                                    Inserting...
                                </>
                            ) : (
                                `Insert ${multiInsertRows.filter(hasRowData).length} Records`
                            )}
                        </Button>
                    </Modal.Footer>
                </Modal>



            )}
            {showImportModal && allowCreate && (
                <Modal
                    show={showImportModal}
                    onHide={() => setShowImportModal(false)}
                    size="lg"
                    centered
                    className=""
                >
                    <Modal.Header closeButton>
                        <Modal.Title style={{ color: 'var(--primary-color)' }}> Import {moduleLabel} Data</Modal.Title>
                    </Modal.Header>

                    <Modal.Body className="mb-5">
                        <UniversalCSVXLSXImporter
                            model={importModel}
                            onDataParsed={async (parsedData) => {
                                await saveImportedData({
                                    data: parsedData,
                                    apiEndpoint,
                                    formFields,
                                    relatedData,
                                    moduleLabel,
                                    existingRecords: data,
                                    importMatchFields,
                                    autoCreateRelated,
                                    customHandlers,
                                    afterSave: () => {
                                        fetchData();
                                        setShowImportModal(false);
                                    },
                                });
                            }}
                        />
                    </Modal.Body>
                </Modal>
            )}

            {showChangePasswordModal && (
                <Modal
                    show={showChangePasswordModal}
                    onHide={() => {
                        setShowChangePasswordModal(false);
                        setSelectedUserForPassword(null);
                        setPasswordFormData({ password: "", confirmPassword: "" });

                    }}
                    centered
                    backdrop="static"
                >
                    <Modal.Header closeButton style={{ background: "var(--secondary-color)", paddingRight: '30px' }}>
                        <b style={{ color: "var(--primary-color)", fontSize: '1.5rem' }}>Forgot Password</b>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>New Password <span className="text-danger">*</span></Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type={passwordVisibility.password ? "text" : "password"}
                                        value={passwordFormData.password}
                                        onChange={(e) => setPasswordFormData({ ...passwordFormData, password: e.target.value })}
                                        placeholder="Enter new password"
                                        style={{ borderRight: "none" }}
                                    />
                                    <InputGroup.Text
                                        onClick={() => setPasswordVisibility(prev => ({ ...prev, password: !prev.password }))}
                                        style={{
                                            backgroundColor: "white",
                                            borderLeft: "none",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <span>
                                            <i
                                                className={`fa ${passwordVisibility.password ? "fa-eye" : "fa-eye-slash"}`}
                                                style={{
                                                    color: passwordVisibility.password ? "black" : "grey"
                                                }}
                                            ></i>
                                        </span>
                                    </InputGroup.Text>
                                </InputGroup>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Confirm Password <span className="text-danger">*</span></Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type={passwordVisibility.confirmPassword ? "text" : "password"}
                                        value={passwordFormData.confirmPassword}
                                        onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                                        placeholder="Confirm new password"
                                        style={{ borderRight: "none" }}
                                    />
                                    <InputGroup.Text
                                        onClick={() => setPasswordVisibility(prev => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
                                        style={{
                                            backgroundColor: "white",
                                            borderLeft: "none",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <span >
                                            <i
                                                className={`fa ${passwordVisibility.confirmPassword ? "fa-eye" : "fa-eye-slash"}`}
                                                style={{
                                                    color: passwordVisibility.confirmPassword ? "black" : "grey"
                                                }}
                                            ></i>
                                        </span>

                                    </InputGroup.Text>
                                </InputGroup>
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="outline-secondary"
                            onClick={() => {
                                setShowChangePasswordModal(false);
                                setSelectedUserForPassword(null);
                                setPasswordFormData({ password: "", confirmPassword: "" });
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant=""
                            onClick={handleChangePasswordSubmit}
                            disabled={loading}
                            style={{ backgroundColor: "var(--primary-color)", color: "#fff", borderColor: "var(--primary-color)" }}
                        >
                            {loading ? "Changing..." : "Change Password"}
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
        </Container>
    );
};

export default DynamicCRUD;