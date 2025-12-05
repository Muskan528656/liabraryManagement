import React, { useState, useMemo, useRef, useEffect } from "react";
import { Table, Pagination, Button } from "react-bootstrap";

const ResizableTable = ({
    data = [],
    columns = [],
    loading = false,
    searchTerm = "",
    currentPage = 1,
    recordsPerPage = 20,
    onPageChange = () => { },
    showSerialNumber = true,
    showActions = true,
    showCheckbox = true,
    actionsRenderer = null,
    onRowClick = null,
    emptyMessage = "No records found",
    selectedItems = [],
    onSelectionChange = () => { },
}) => {
    // Ensure data is always an array
    const safeData = Array.isArray(data) ? data : [];
    const [columnWidths, setColumnWidths] = useState({});
    const [isResizing, setIsResizing] = useState(false);
    const [resizeColumn, setResizeColumn] = useState(null);
    const [visibleRows, setVisibleRows] = useState(20);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const tableRef = useRef(null);
    const isResizingRef = useRef(false);
    const observerRef = useRef(null);
    const loadMoreRef = useRef(null);

    const totalPages = Math.ceil(safeData.length / recordsPerPage);
    const startRecord = (currentPage - 1) * recordsPerPage;
    const endRecord = startRecord + recordsPerPage;

    const paginatedData = useMemo(() => {
        if (currentPage === 1) {
            return safeData.slice(0, Math.min(visibleRows, safeData.length));
        } else {

            return data.slice(startRecord, endRecord);
        }
    }, [safeData, startRecord, endRecord, visibleRows, currentPage]);


    useEffect(() => {
        isResizingRef.current = isResizing;
    }, [isResizing]);


    useEffect(() => {
        if (currentPage !== 1 || loading) return;


        setVisibleRows(20);


        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && visibleRows < safeData.length && !isLoadingMore) {
                    setIsLoadingMore(true);

                    setTimeout(() => {
                        setVisibleRows((prev) => Math.min(prev + 20, safeData.length));
                        setIsLoadingMore(false);
                    }, 300);
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [safeData.length, visibleRows, currentPage, loading, isLoadingMore]);


    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = paginatedData.map(record => record.id).filter(Boolean);
            const newSelection = [...new Set([...selectedItems, ...allIds])];
            onSelectionChange(newSelection);
        } else {
            const paginatedIds = paginatedData.map(record => record.id).filter(Boolean);
            const newSelection = selectedItems.filter(id => !paginatedIds.includes(id));
            onSelectionChange(newSelection);
        }
    };

    const handleSelectRow = (e, recordId) => {
        e.stopPropagation();
        if (e.target.checked) {
            onSelectionChange([...selectedItems, recordId]);
        } else {
            onSelectionChange(selectedItems.filter(id => id !== recordId));
        }
    };

    const isAllSelected = useMemo(() => {
        if (paginatedData.length === 0) return false;
        const paginatedIds = paginatedData.map(record => record.id).filter(Boolean);
        return paginatedIds.length > 0 && paginatedIds.every(id => selectedItems.includes(id));
    }, [paginatedData, selectedItems]);

    const isIndeterminate = useMemo(() => {
        if (paginatedData.length === 0) return false;
        const paginatedIds = paginatedData.map(record => record.id).filter(Boolean);
        const selectedCount = paginatedIds.filter(id => selectedItems.includes(id)).length;
        return selectedCount > 0 && selectedCount < paginatedIds.length;
    }, [paginatedData, selectedItems]);


    const calculateTotalWidth = () => {
        let total = 0;
        if (showCheckbox) {
            total += columnWidths["checkbox"] || 50;
        }
        if (showSerialNumber) {
            total += columnWidths[0] || 60;
        }
        columns.forEach((column, index) => {
            const colIndex = showSerialNumber ? index + 1 : index;
            total += columnWidths[colIndex] || column.width || column.minWidth || 150;
        });
        if (showActions) {
            total += columnWidths["actions"] || 120;
        }
        return total;
    };


    const handleMouseDown = (e, columnIndex) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setResizeColumn(columnIndex);
        isResizingRef.current = true;

        const startX = e.clientX;
        const startWidth = columnWidths[columnIndex] ||
            (columnIndex === 0 ? 60 :
                columnIndex === "actions" ? 120 :
                    columns[showSerialNumber ? columnIndex - 1 : columnIndex]?.width ||
                    columns[showSerialNumber ? columnIndex - 1 : columnIndex]?.minWidth ||
                    150);

        const handleMouseMove = (e) => {
            if (isResizingRef.current) {
                const deltaX = e.clientX - startX;
                const newWidth = Math.max(50, startWidth + deltaX); // Minimum 50px
                setColumnWidths(prev => ({
                    ...prev,
                    [columnIndex]: newWidth,
                }));
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            setResizeColumn(null);
            isResizingRef.current = false;
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };


    const renderPaginationItems = () => {
        const items = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }


        if (startPage > 1) {
            items.push(
                <Pagination.Item key={1} onClick={() => onPageChange(1)}>
                    1
                </Pagination.Item>
            );
            if (startPage > 2) {
                items.push(<Pagination.Ellipsis key="start-ellipsis" />);
            }
        }


        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <Pagination.Item
                    key={i}
                    active={i === currentPage}
                    onClick={() => onPageChange(i)}
                >
                    {i}
                </Pagination.Item>
            );
        }


        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                items.push(<Pagination.Ellipsis key="end-ellipsis" />);
            }
            items.push(
                <Pagination.Item key={totalPages} onClick={() => onPageChange(totalPages)}>
                    {totalPages}
                </Pagination.Item>
            );
        }

        return items;
    };

    if (loading) {
        return (
            <div className="text-center p-4">
                <div
                    className="spinner-border"
                    role="status"
                    style={{
                        width: "50px",
                        height: "50px",
                        borderWidth: "4px",
                        borderColor: "var(--primary-color)",
                        borderRightColor: "transparent",
                    }}
                >
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <div
                className="table-responsive resizable-table-container"
                style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    overflowX: "auto",
                    overflowY: "auto",
                    background: "white",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                    width: "100%",
                    maxWidth: "100%",



                    position: "relative",
                    display: "block",
                    isolation: "isolate",
                    contain: "layout style paint",
                    boxSizing: "border-box"
                }}
            >
                <div>
                    <Table
                        ref={tableRef}
                        className="mb-0 salesforce-table"
                        style={{
                            marginBottom: 0,
                            tableLayout: "fixed",
                            width: "100%",
                            minWidth: "100%",
                            border: "1px solid #ffffffff",
                        }}
                    >
                        <thead className="detail-h2">
                            <tr>
                                {showCheckbox && (
                                    <th
                                        style={{
                                            width: columnWidths["checkbox"] || "0px",
                                            textAlign: "center",
                                            position: "relative",
                                            userSelect: "none",
                                            background: "#201c24ff !important",
                                            fontWeight: "600",
                                            color: "var(--primary-color)",
                                            borderBottom: "2px solid #e9d5ff",


                                            letterSpacing: "0.5px"
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            ref={(input) => {
                                                if (input) input.indeterminate = isIndeterminate;
                                            }}
                                            onChange={handleSelectAll}
                                            style={{ cursor: "pointer" }}
                                        />
                                        <div
                                            className="resize-handle"
                                            onMouseDown={(e) => handleMouseDown(e, "checkbox")}
                                            style={{
                                                position: "absolute",
                                                right: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: "4px",
                                                cursor: "col-resize",
                                                backgroundColor: isResizing && resizeColumn === "checkbox" ? "var(--primary-color)" : "transparent",
                                                zIndex: 10
                                            }}
                                        />
                                    </th>
                                )}
                                {showSerialNumber && (
                                    <th
                                        style={{
                                            width: columnWidths[0] || "60px",
                                            textAlign: "center",
                                            position: "relative",
                                            userSelect: "none",
                                            background: "#f3e9fc",
                                            fontWeight: "600",
                                            color: "var(--primary-color)",
                                            borderBottom: "2px solid #e9d5ff",
                                            padding: "12px 8px",


                                            letterSpacing: "0.5px"
                                        }}
                                    >
                                        Sr.No
                                        <div
                                            className="resize-handle"
                                            onMouseDown={(e) => handleMouseDown(e, 0)}
                                            style={{
                                                position: "absolute",
                                                right: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: "4px",
                                                cursor: "col-resize",
                                                backgroundColor: isResizing && resizeColumn === 0 ? "var(--primary-color)" : "transparent",
                                                zIndex: 10
                                            }}
                                        />
                                    </th>
                                )}
                                {columns.map((column, index) => {
                                    let colIndex;
                                    if (showCheckbox && showSerialNumber) {
                                        colIndex = index + 2; // checkbox(1) + serial(1) + columns
                                    } else if (showCheckbox || showSerialNumber) {
                                        colIndex = index + 1; // checkbox(1) OR serial(1) + columns
                                    } else {
                                        colIndex = index; // only columns
                                    }
                                    return (
                                        <th
                                            key={index}
                                            style={{
                                                width: columnWidths[colIndex] || column.width || column.minWidth || "150px",
                                                position: "relative",
                                                textAlign: "center",
                                                userSelect: "none",
                                                background: "#f3e9fc",
                                                fontWeight: "600",
                                                color: "var(--primary-color)",
                                                borderBottom: "2px solid #e9d5ff",
                                                padding: "12px 8px",


                                                letterSpacing: "0.5px"
                                            }}
                                        >
                                            {column.label}
                                            <div
                                                className="resize-handle"
                                                onMouseDown={(e) => handleMouseDown(e, colIndex)}
                                                style={{
                                                    position: "absolute",
                                                    right: 0,
                                                    top: 0,
                                                    bottom: 0,
                                                    width: "4px",
                                                    cursor: "col-resize",
                                                    backgroundColor: isResizing && resizeColumn === colIndex ? "var(--primary-color)" : "transparent",
                                                    zIndex: 10
                                                }}
                                            />
                                        </th>
                                    );
                                })}
                                {showActions && (
                                    <th
                                        style={{
                                            width: columnWidths["actions"] || "120px",
                                            textAlign: "center",
                                            position: "relative",
                                            userSelect: "none",
                                            background: "#f3e9fc",
                                            fontWeight: "600",
                                            color: "var(--primary-color)",
                                            borderBottom: "2px solid #e9d5ff",
                                            padding: "12px 8px",


                                            letterSpacing: "0.5px"
                                        }}
                                    >
                                        Actions
                                        <div
                                            className="resize-handle"
                                            onMouseDown={(e) => handleMouseDown(e, "actions")}
                                            style={{
                                                position: "absolute",
                                                right: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: "4px",
                                                cursor: "col-resize",
                                                backgroundColor: isResizing && resizeColumn === "actions" ? "var(--primary-color)" : "transparent",
                                                zIndex: 10
                                            }}
                                        />
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="detail-h4">
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            columns.length + (showCheckbox ? 1 : 0) + (showSerialNumber ? 1 : 0) + (showActions ? 1 : 0)
                                        }
                                        className="text-center py-5 text-muted"
                                        style={{

                                            color: "#6c757d"
                                        }}
                                    >
                                        <i className="fa-solid fa-inbox me-2" style={{ opacity: 0.5 }}></i>
                                        {emptyMessage}
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((record, index) => (
                                    <tr
                                        key={record.id || index}
                                        className={index % 2 === 0 ? "even-row" : "odd-row"}
                                        onClick={() => onRowClick && onRowClick(record)}
                                        style={{ cursor: onRowClick ? "pointer" : "default" }}
                                    >
                                        {showCheckbox && (
                                            <td
                                                style={{
                                                    textAlign: "center",
                                                    width: columnWidths["checkbox"] || "50px"
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.includes(record.id)}
                                                    onChange={(e) => handleSelectRow(e, record.id)}
                                                    style={{ cursor: "pointer" }}
                                                />
                                            </td>
                                        )}
                                        {showSerialNumber && (
                                            <td style={{ textAlign: "center", fontWeight: "500", color: "#6c757d" }}>
                                                {startRecord + index + 1}
                                            </td>
                                        )}
                                        {columns.map((column, colIndex) => {
                                            let colIndexForWidth;
                                            if (showCheckbox && showSerialNumber) {
                                                colIndexForWidth = colIndex + 2; // checkbox(1) + serial(1) + columns
                                            } else if (showCheckbox || showSerialNumber) {
                                                colIndexForWidth = colIndex + 1; // checkbox(1) OR serial(1) + columns
                                            } else {
                                                colIndexForWidth = colIndex; // only columns
                                            }
                                            return (
                                                <td
                                                    key={colIndex}
                                                    style={{
                                                        verticalAlign: "middle",
                                                        width: columnWidths[colIndexForWidth] || column.width || column.minWidth || "150px",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap"
                                                    }}
                                                >
                                                    {column.render
                                                        ? column.render(record[column.field], record)
                                                        : record[column.field] || <span style={{ color: "#9ca3af" }}>-</span>}
                                                </td>
                                            );
                                        })}
                                        {showActions && (
                                            <td
                                                style={{
                                                    textAlign: "center",
                                                    width: columnWidths["actions"] || "120px"
                                                }}
                                            >
                                                {actionsRenderer
                                                    ? actionsRenderer(record)
                                                    : (
                                                        <div className="d-flex gap-2 justify-content-center">
                                                            <button


                                                                className="custom-btn-edit"





                                                                title="Edit"
                                                            >
                                                                <i className="fs-7 fa-solid fa-edit"></i>
                                                            </button>
                                                            <button


                                                                className="custom-btn-delete"





                                                                title="Delete"
                                                            >
                                                                <i className="fs-7 fa-solid fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    )}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                            {/* Lazy Loading Trigger */}
                            {currentPage === 1 && visibleRows < safeData.length && (
                                <tr ref={loadMoreRef}>
                                    <td
                                        colSpan={
                                            columns.length + (showCheckbox ? 1 : 0) + (showSerialNumber ? 1 : 0) + (showActions ? 1 : 0)
                                        }
                                        className="text-center py-3"
                                        style={{ height: "50px" }}
                                    >
                                        {isLoadingMore && (
                                            <div className="d-flex justify-content-center align-items-center">
                                                <div
                                                    className="spinner-border spinner-border-sm"
                                                    role="status"
                                                    style={{
                                                        width: "20px",
                                                        height: "20px",
                                                        borderWidth: "2px",
                                                        borderColor: "var(--primary-color)",
                                                        borderRightColor: "transparent",
                                                    }}
                                                >
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                <span className="ms-2 text-muted" >
                                                    Loading more...
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div
                    className="d-flex justify-content-between align-items-center mt-3 detail-h3"
                    style={{
                        padding: "12px 16px",
                        background: "#fafbfc",
                        border: "1px solid #e2e8f0",
                        borderTop: "none",
                        borderRadius: "0 0 8px 8px"
                    }}
                >
                    <div>
                        Showing {startRecord + 1} to {Math.min(endRecord, safeData.length)} of{" "}
                        {safeData.length} records
                    </div>
                    <Pagination className="mb-0" style={{ marginBottom: 0 }}>
                        <Pagination.First
                            onClick={() => onPageChange(1)}
                            disabled={currentPage === 1}
                            style={{
                                borderColor: "#e2e8f0",
                                color: currentPage === 1 ? "#9ca3af" : "var(--primary-color)"
                            }}
                        />
                        <Pagination.Prev
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            style={{
                                borderColor: "#e2e8f0",
                                color: currentPage === 1 ? "#9ca3af" : "var(--primary-color)"
                            }}
                        />
                        {renderPaginationItems()}
                        <Pagination.Next
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            style={{
                                borderColor: "#e2e8f0",
                                color: currentPage === totalPages ? "#9ca3af" : "var(--primary-color)"
                            }}
                        />
                        <Pagination.Last
                            onClick={() => onPageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            style={{
                                borderColor: "#e2e8f0",
                                color: currentPage === totalPages ? "#9ca3af" : "var(--primary-color)"
                            }}
                        />
                    </Pagination>
                </div>
            )}
        </>
    );
};

export default ResizableTable;

