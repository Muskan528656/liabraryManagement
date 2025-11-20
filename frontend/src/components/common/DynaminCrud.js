// components/common/DynamicCRUD.js
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Modal, Form, Badge, Table } from "react-bootstrap";
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
    columns,
    formFields,
    initialFormData,
    validationRules,
    features = {},
    importMapping,
    exportColumns,
    customHandlers = {},
    permissions = {},
    detailConfig = null,
    customActionButtons = [],
    nameClickHandler = null,
    emptyMessage = null,
    enablePrefetch = true,
    autoFetchRelated = true,
    recordsPerPage = 10,
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

    // State Management
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

    // ✅ MISSING BULK INSERT HELPER FUNCTIONS
    const handleAddMultiRow = () => {
        setMultiInsertRows([...multiInsertRows, { ...initialFormData }]);
    };

    const handleRemoveMultiRow = (index) => {
        if (multiInsertRows.length > 1) {
            setMultiInsertRows(multiInsertRows.filter((_, i) => i !== index));
        }
    };

    const handleMultiRowChange = (index, field, value) => {
        const updatedRows = [...multiInsertRows];
        updatedRows[index] = { ...updatedRows[index], [field]: value };
        setMultiInsertRows(updatedRows);
    };

    // ✅ Helper function for bulk insert
    const hasRowData = (row) => {
        return Object.values(row).some(val =>
            val !== null && val !== undefined && val !== '' && val !== 0
        );
    };

    const handleNameClick = (item) => {
        if (nameClickHandler) {
            nameClickHandler(item);
            return;
        }

        if (showDetailView) {
            setSelectedItem(item);
            setShowDetail(true);

            if (enablePrefetch) {
                try {
                    localStorage.setItem(`prefetch:${apiEndpoint}:${item.id}`, JSON.stringify(item));
                } catch (e) {
                    console.warn('Failed to cache data for detail view');
                }
            }
        } else {
            window.open(`/${moduleName}/${item.id}`, '_blank');
        }
    };

    const handleBackToList = () => {
        setShowDetail(false);
        setSelectedItem(null);
    };

    // ✅ AUTO-GENERATE DETAIL CONFIG IF NOT PROVIDED
    const getAutoDetailConfig = () => {
        if (detailConfig) return detailConfig;

        const autoDetails = columns
            .filter(col => !col.field.includes('_id') && col.field !== 'actions')
            .map(col => ({
                key: col.field,
                label: col.label,
                type: col.type || "text"
            }));

        return {
            fields: {
                details: autoDetails
            },
            relatedModules: []
        };
    };

    // ✅ ENHANCE COLUMNS WITH CLICK HANDLERS
    const getEnhancedColumns = () => {
        return columns.map(col => {
            if ((col.field === 'title' || col.field === 'name') && showDetailView) {
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
                                color: "#6f42c1",
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

            if (customHandlers.columnRenderers && customHandlers.columnRenderers[col.field]) {
                return {
                    ...col,
                    render: customHandlers.columnRenderers[col.field]
                };
            }

            return col;
        });
    };

    const enhancedColumns = getEnhancedColumns();
    const finalDetailConfig = getAutoDetailConfig();

    // ✅ INITIALIZE VISIBLE COLUMNS
    useEffect(() => {
        const initialVisibility = {};
        columns.forEach(col => {
            initialVisibility[col.field] = col.hidden !== true;
        });
        setVisibleColumns(initialVisibility);
    }, [columns]);

    // ✅ INITIALIZE FORM DATA
    useEffect(() => {
        setFormData(initialFormData);
    }, [initialFormData]);

    // ✅ USER INFO AND PERMISSIONS
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

    // ✅ FETCH DATA
    useEffect(() => {
        if (userInfo) {
            fetchData();
            if (autoFetchRelated) {
                fetchRelatedData();
            }
        }
    }, [userInfo]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const api = new DataApi(apiEndpoint);
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
    };

    const fetchRelatedData = async () => {
        if (!autoFetchRelated) return;

        try {
            const selectFields = formFields.filter(field =>
                field.type === "select" && field.options && typeof field.options === "string"
            );

            const uniqueOptions = [...new Set(selectFields.map(field => field.options))];
            if (uniqueOptions.length === 0) return;

            const endpointMap = {
                authors: "author",
                author: "author",
                categories: "category",
                category: "category",
                users: "user",
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
    };

    // ✅ PROCESS FORM FIELDS WITH RELATED DATA
    // ✅ MORE ROBUST FORM FIELD PROCESSING
    const getProcessedFormFields = () => {
        return formFields.map(field => {
            // Only process select fields with options
            if (field.type !== 'select' || !field.options) {
                return field;
            }

            try {
                let optionsArray = [];

                // Debug logging
                console.log(`Processing field: ${field.name}`, {
                    optionsType: typeof field.options,
                    optionsValue: field.options,
                    hasRelatedData: relatedData[field.options] ? true : false
                });

                // Handle different types of options
                if (Array.isArray(field.options)) {
                    // Already an array - use as is
                    optionsArray = field.options;
                } else if (typeof field.options === 'string') {
                    // String key - lookup from relatedData
                    const relatedOptions = relatedData[field.options];
                    if (Array.isArray(relatedOptions)) {
                        optionsArray = relatedOptions.map(item => ({
                            value: item.id?.toString() || '',
                            label: item.name || item.title || item.email || `Item ${item.id}`
                        }));
                    } else {
                        // Not loaded yet, return empty options
                        optionsArray = [];
                    }
                } else {
                    // Invalid options type, return empty
                    console.warn(`Invalid options type for field ${field.name}:`, typeof field.options);
                    optionsArray = [];
                }

                // Ensure all options have proper structure
                optionsArray = optionsArray.filter(opt => opt && typeof opt === 'object');

                // Add default option only if we have actual options
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
                // Return original field without options on error
                return {
                    ...field,
                    options: []
                };
            }
        });
    };

    // ✅ CRUD OPERATIONS
    const handleAdd = () => {
        setEditingItem(null);
        setFormData(initialFormData);
        setShowModal(true);
    };

    const handleEdit = (item) => {
        if (!allowEdit) return;
        setEditingItem(item);
        setFormData({ ...initialFormData, ...item });
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (!allowDelete) return;
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
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
    };

    const handleSave = async () => {
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

            const submitData = { ...formData };
            Object.keys(submitData).forEach(key => {
                if (submitData[key] === '') submitData[key] = null;
            });

            if (editingItem) {
                response = await api.update(submitData, editingItem.id);
            } else {
                response = await api.create(submitData);
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
    };

    // ✅ BULK INSERT (Conditional)
    const handleBulkInsert = () => {
        setMultiInsertRows([{ ...initialFormData }]);
        setShowBulkInsertModal(true);
    };

    const handleMultiInsertSave = async () => {
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
    };

    // ✅ EXPORT FUNCTIONALITY
    const handleExport = async () => {
        try {
            const exportList = selectedItems.length > 0
                ? filteredData.filter(item => selectedItems.includes(item.id))
                : filteredData;

            const defaultExportColumns = columns
                .filter(col => visibleColumns[col.field])
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
    };

    // ✅ FILTER DATA
    const filteredData = data.filter(item => {
        if (!searchTerm || !showSearch) return true;

        const searchTermLower = (searchTerm || '').toLowerCase();

        return columns.some(col => {
            const fieldValue = item[col.field];
            if (fieldValue == null) return false;

            return String(fieldValue).toLowerCase().includes(searchTermLower);
        });
    });

    // ✅ TOGGLE COLUMN VISIBILITY
    const toggleColumnVisibility = (field) => {
        setVisibleColumns(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    // ✅ PREPARE ACTION BUTTONS (Conditional)
    const getActionButtons = () => {
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
                    background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                    border: "none",
                },
            });
        }

        if (customActionButtons.length > 0) {
            buttons.push(...customActionButtons);
        }

        return buttons;
    };

    const processedFormFields = getProcessedFormFields();
    const actionButtons = getActionButtons();

    // ✅ DETAIL VIEW
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
                    {...finalDetailConfig}
                />
            </Container>
        );
    }

    // ✅ LIST VIEW
    return (
        <Container fluid>
            <ScrollToTop />

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
            </Row>

            <Row style={{ margin: 0, width: "100%", maxWidth: "100%" }}>
                <Col style={{ padding: 0, width: "100%", maxWidth: "100%" }}>
                    <Card style={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "4px", overflow: "hidden" }}>
                        <Card.Body className="p-0">
                            {loading ? (
                                <Loader />
                            ) : (
                                <ResizableTable
                                    data={filteredData}
                                    columns={enhancedColumns.filter(col => visibleColumns[col.field])}
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
                                        <div className="d-flex gap-2">
                                            {allowEdit && (
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => handleEdit(item)}
                                                    title="Edit"
                                                >
                                                    <i className="fa-solid fa-edit"></i>
                                                </Button>
                                            )}
                                            {allowDelete && (
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(item.id)}
                                                    title="Delete"
                                                >
                                                    <i className="fa-solid fa-trash"></i>
                                                </Button>
                                            )}
                                        </div>
                                    ) : null}
                                    emptyMessage={emptyMessage || `No ${moduleLabel.toLowerCase()} found`}
                                />
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Add/Edit Modal */}
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

            {/* Delete Confirmation Modal */}
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

            {/* Bulk Insert Modal - Only rendered if showBulkInsert is true */}
            {/* {showBulkInsert && (
                <Modal show={showBulkInsertModal} onHide={() => setShowBulkInsertModal(false)} size="lg" centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Bulk Insert {moduleLabel}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p className="text-muted mb-3">
                            Add multiple {moduleLabel.toLowerCase()} records at once. Leave rows empty to skip.
                        </p>

                        {multiInsertRows.map((row, index) => (
                            <Card key={index} className="mb-3">
                                <Card.Header className="d-flex justify-content-between align-items-center py-2">
                                    <span>Record #{index + 1}</span>
                                    {multiInsertRows.length > 1 && (
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleRemoveMultiRow(index)}
                                        >
                                            <i className="fa-solid fa-times"></i>
                                        </Button>
                                    )}
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        {formFields.map((field) => (
                                            <Col key={field.name} md={6} className="mb-2">
                                                <Form.Group>
                                                    <Form.Label>{field.label}</Form.Label>
                                                    {field.type === 'select' ? (
                                                        <Form.Select
                                                            value={row[field.name] || ''}
                                                            onChange={(e) => handleMultiRowChange(index, field.name, e.target.value)}
                                                        >
                                                            {field.options && field.options.map(opt => (
                                                                <option key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </option>
                                                            ))}
                                                        </Form.Select>
                                                    ) : (
                                                        <Form.Control
                                                            type={field.type}
                                                            value={row[field.name] || ''}
                                                            onChange={(e) => handleMultiRowChange(index, field.name, e.target.value)}
                                                            placeholder={field.placeholder}
                                                        />
                                                    )}
                                                </Form.Group>
                                            </Col>
                                        ))}
                                    </Row>
                                </Card.Body>
                            </Card>
                        ))}

                        <Button variant="outline-primary" onClick={handleAddMultiRow}>
                            <i className="fa-solid fa-plus me-2"></i>
                            Add Another Row
                        </Button>
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
                            {loading ? "Inserting..." : `Insert ${multiInsertRows.filter(hasRowData).length} Records`}
                        </Button>
                    </Modal.Footer>
                </Modal>
            )} */}
            {showBulkInsert && (
                <Modal show={showBulkInsertModal} onHide={() => setShowBulkInsertModal(false)} size="xl" centered scrollable>
                    <Modal.Header closeButton>
                        <Modal.Title>Bulk Insert {moduleLabel}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{ maxHeight: '70vh', overflow: 'auto' }}>
                        <p className="text-muted mb-3">
                            Add multiple {moduleLabel.toLowerCase()} records at once. Leave cells empty to skip.
                        </p>

                        {/* ✅ TABLE STYLE LAYOUT */}
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
                                                                .filter(opt => opt.value !== '') // Remove empty option if exists
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

                        {/* Add Row Button */}
                        <div className="text-center mt-3">
                            <Button variant="outline-primary" onClick={handleAddMultiRow}>
                                <i className="fa-solid fa-plus me-2"></i>
                                Add New Row
                            </Button>
                        </div>

                        {/* Summary */}
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