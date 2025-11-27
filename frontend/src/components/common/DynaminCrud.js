import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Container, Row, Col, Card, Button, Modal, Form, Table } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import ResizableTable from "./ResizableTable";
import ScrollToTop from "./ScrollToTop";
import Loader from "./Loader";
import TableHeader from "./TableHeader";
import FormModal from "./FormModal";
import DataApi from "../../api/dataApi";
import PubSub from "pubsub-js";
import { exportToExcel } from "../../utils/excelExport";
import jwt_decode from "jwt-decode";
import ModuleDetail from "./ModuleDetail";

const DynamicCRUD = ({
    moduleName,
    moduleLabel,
    apiEndpoint,
    columns = [],
    formFields = [],
    initialFormData = {},
    validationRules,
    features = {},
    importMapping,
    exportColumns,
    customHandlers = {},
    permissions = {},
    detailConfig = null,
    customActionButtons = [],
    lookupNavigation = {},
    nameClickHandler = null,
    emptyMessage = null,
    enablePrefetch = true,
    autoFetchRelated = true,
    recordsPerPage = 10,
    icon
}) => {
    const location = useLocation();
    const navigate = useNavigate();

    const {
        showBulkInsert = false,
        showImportExport = true,
        showDetailView = true,
        showSearch = true,
        showColumnVisibility = true,
        showCheckbox = true,
        showActions = true,
        showAddButton = true,
        allowEdit = true,
        allowDelete = true
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
        console.log("isEditable in DynamicCRUD:", isEditable);
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
                    // navigate(`/${apiEndpoint}/${item.id}`);
                    if (isEdit) {
                        navigate(`/${apiEndpoint}/${item.id}`, {
                            state: { isEdit: true, rowData: item },
                        });
                    } else {
                        navigate(`/${apiEndpoint}/${item.id}`);
                    }

                    // localStorage.setItem(`prefetch:${apiEndpoint}:${item.id}`, JSON.stringify(item));
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

    // Fixed getAutoDetailConfig function
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

            if ((col.field === 'title' || col.field === 'name' || col.field === 'card_number' || col.field === 'role_name' || col.field === 'purchase_serial_no') && showDetailView && !col.render) {
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

    const filteredData = useMemo(() => {
        if (!searchTerm || !showSearch) return data;

        const searchTermLower = searchTerm.toLowerCase();
        return data.filter(item =>
            columns.some(col => {
                if (!col || !col.field) return false;
                const fieldValue = item[col.field];
                return fieldValue != null &&
                    String(fieldValue).toLowerCase().includes(searchTermLower);
            })
        );
    }, [data, searchTerm, showSearch, columns]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const api = new DataApi(apiEndpoint);
            console.log("Fetching data from API endpoint:", apiEndpoint);
            const response = await api.fetchAll();
            if (response.data) {
                setData(response.data);

                if (customHandlers.onDataLoad) {
                    customHandlers.onDataLoad(response.data);
                }
            }
        } catch (error) {
            console.error(`Error fetching ${moduleLabel}:`, error);
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Error",
                message: `Failed to fetch ${moduleLabel}`,
            });
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRelatedData = useCallback(async () => {
        if (!autoFetchRelated) return;
        console.log("fetchRelatedData called");
        try {
            const selectFields = formFields.filter(field =>
                field && field.type === "select" && field.options && typeof field.options === "string"
            );

            const uniqueOptions = [...new Set(selectFields.map(field => field.options))];
            if (uniqueOptions.length === 0) return;

            const endpointMap = {
                authors: "author",
                author: "author",
                categories: "category",
                category: "category",
                users: "user",
                vendor: "vendor",

                departments: "department"
            };

            const relatedApis = {};

            for (const option of uniqueOptions) {
                try {
                    const endpoint = endpointMap[option] || option;
                    const api = new DataApi(endpoint);
                    const response = await api.fetchAll();

                    relatedApis[option] = Array.isArray(response.data) ? response.data : [];
                } catch (error) {
                    console.error(`Error fetching ${option}:`, error);
                    relatedApis[option] = [];
                }
            }

            setRelatedData(relatedApis);
        } catch (error) {
            console.error("Error fetching related data:", error);
        }
    }, [autoFetchRelated, formFields]);

    useEffect(() => {
        if (userInfo) {
            fetchData();
            if (autoFetchRelated) {
                fetchRelatedData();
            }
        }
    }, [userInfo]);

    const getProcessedFormFields = useCallback(() => {
        return formFields.map(field => {
            if (!field || field.type !== 'select' || !field.options) {
                return field;
            }

            try {
                let optionsArray = [];

                if (Array.isArray(field.options)) {
                    optionsArray = field.options;
                } else if (typeof field.options === 'string') {
                    const relatedOptions = relatedData[field.options];
                    if (Array.isArray(relatedOptions)) {
                        optionsArray = relatedOptions.map(item => ({
                            value: item.id?.toString() || '',
                            label: item.name || item.title || item.email || `Item ${item.id}`
                        }));
                    } else {
                        optionsArray = [];
                    }
                } else {
                    console.warn(`Invalid options type for field ${field.name}:`, typeof field.options);
                    optionsArray = [];
                }

                optionsArray = optionsArray.filter(opt => opt && typeof opt === 'object');

                if (optionsArray.length > 0) {
                    const hasEmptyOption = optionsArray.some(opt =>
                        opt.value === '' || opt.value === null || opt.value === undefined
                    );

                    if (!hasEmptyOption) {
                        optionsArray = [
                            { value: '', label: `Select ${field.label}` },
                            ...optionsArray
                        ];
                    }
                }

                return {
                    ...field,
                    options: optionsArray
                };

            } catch (error) {
                console.error(`Error processing field ${field.name}:`, error);
                return {
                    ...field,
                    options: []
                };
            }
        });
    }, [formFields, relatedData]);

    // const handleAdd = useCallback(() => {
    //     setEditingItem(null);
    //     setFormData(initialFormData);
    //     setShowModal(true);
    // }, [initialFormData]);

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

    const handleDelete = useCallback((id) => {
        if (!allowDelete) return;
        setDeleteId(id);
        setShowDeleteModal(true);
    }, [allowDelete]);

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
        if (customHandlers.beforeSave) {
            const customResult = customHandlers.beforeSave(formData, editingItem);
            if (customResult === false) return;
        }

        if (validationRules) {
            const errors = validationRules(formData, data, editingItem);
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
            let response;
            const hasFileUpload = formFields.some(field => field && field.type === 'file');

            if (hasFileUpload) {
                const submitData = new FormData();

                Object.keys(formData).forEach(key => {
                    if (formData[key] !== null && formData[key] !== undefined) {
                        const fieldConfig = formFields.find(f => f && f.name === key);
                        if (fieldConfig && fieldConfig.type === 'file') {
                            if (formData[key] instanceof File) {
                                submitData.append(key, formData[key]);
                            } else if (formData[key]) {
                                submitData.append(key, formData[key]);
                            }
                        } else {
                            submitData.append(key, formData[key]);
                        }
                    }
                });

                if (editingItem) {
                    response = await api.update(submitData, editingItem.id);
                } else {
                    response = await api.create(submitData);
                }
            } else {
                const submitData = { ...formData };
                Object.keys(submitData).forEach(key => {
                    if (submitData[key] === '') submitData[key] = null;
                });

                if (editingItem) {
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

        if (showImportExport) {
            buttons.push({
                variant: "outline-success",
                size: "sm",
                icon: "fa-solid fa-download",
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
        }

        if (showAddButton) {
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

        if (customActionButtons.length > 0) {
            buttons.push(...customActionButtons);
        }

        return buttons;
    }, [showImportExport, showBulkInsert, showAddButton, moduleLabel, handleExport, handleBulkInsert, handleAdd, customActionButtons]);

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

                />
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">
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
                    <Card style={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "4px", overflow: "hidden" }}>
                        <Card.Body className="">
                            {loading ? (
                                <Loader />
                            ) : (
                                <>
                                    <TableHeader
                                        title={`${moduleLabel}`}
                                        icon={icon}
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
                                        recordsPerPage={recordsPerPage}
                                        onPageChange={setCurrentPage}
                                        showSerialNumber={true}
                                        showActions={showActions}
                                        actionsRenderer={showActions ? (item) => (
                                            <div className="d-flex gap-2 justify-content-center">
                                                {allowEdit && (
                                                    <button
                                                        // variant="link"
                                                        onClick={() => handleNameClick(item, true)}
                                                        title="Edit"
                                                        className="custom-btn-edit"
                                                    // style={{
                                                    //     padding: "4px 6px",
                                                    //     color: "#0d6efd",
                                                    //     textDecoration: "none"
                                                    // }}
                                                    >
                                                        <i className="fs-7 fa-solid fa-pen-to-square"></i>
                                                    </button>
                                                )}
                                                {allowDelete && (
                                                    <button
                                                        // variant="link"
                                                        onClick={() => handleDelete(item.id)}
                                                        title="Delete"
                                                        className="custom-btn-delete"
                                                    // style={{
                                                    //     padding: "4px 6px",
                                                    //     color: "#dc3545",
                                                    //     textDecoration: "none"
                                                    // }}
                                                    >
                                                        <i className="fs-7 fa-solid fa-trash"></i>
                                                    </button>
                                                )}
                                                {customHandlers?.handleBarcodePreview && (
                                                    <button
                                                        // variant="info"
                                                        className="custom-btn-edit"
                                                        // size="sm"
                                                        onClick={() => customHandlers.handleBarcodePreview(item)}
                                                        title="View Barcode"
                                                    >
                                                        <i className="fs-7 fa-solid fa-eye me-1"></i>
                                                        {/* Preview */}
                                                    </button>
                                                )}
                                            </div>
                                        ) : null}
                                        emptyMessage={emptyMessage || `No ${moduleLabel.toLowerCase()} found`}
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
                icon="fa-solid fa-book"
                formData={formData}
                setFormData={setFormData}
                fields={processedFormFields}
                onSubmit={handleSave}
                loading={loading}
                editingItem={editingItem}
            />

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
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
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Inserting...
                                </>
                            ) : (
                                `Insert ${multiInsertRows.filter(hasRowData).length} Records`
                            )}
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
        </Container>
    );
};

export default DynamicCRUD;