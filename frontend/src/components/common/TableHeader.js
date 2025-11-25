import React from "react";
import { Card, Badge, InputGroup, Form, Button, Dropdown } from "react-bootstrap";

const TableHeader = ({
  title,
  icon,
  totalCount,
  totalLabel,
  filteredCount,
  showFiltered = false,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  showColumnVisibility = false,
  allColumns = [],
  visibleColumns = {},
  onToggleColumnVisibility,
  actionButtons = [],
  showSearch = true,
}) => {
  return (
    // <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.1)" }}>
    //   <Card.Body className="p-3">
    <div >
        <div className="d-flex justify-content-between align-items-center mb-4 p-4"
                style={{
                  color: "var(--primary-color)",
                  background: "var(--primary-background-color)",
                  borderRadius: "10px",
                }}>
          <div className="d-flex align-items-center gap-3">
            <h2 className="fw-bold mb-1" style={{ color: "var(--primary-color)" }}>
              {icon && <i className={`${icon} me-2`}></i>}
              {title}
            </h2>
            {totalCount !== undefined && (
              <Badge bg="light" text="dark" >
                {icon && <i className={`${icon} me-1`}></i>}
                <span className="detail-h2">Total: {totalCount} {totalLabel || (totalCount === 1 ? "Item" : "Items")}</span>
              </Badge>
            )}
            {showFiltered && filteredCount !== undefined && (
              <Badge bg="info">
                <i className="fa-solid fa-filter me-1"></i>
                <span className="detail-h2">Filtered: {filteredCount}</span>
              </Badge>
            )}
          </div>
          <div className="d-flex gap-2 flex-wrap">
            {showSearch && (
              <InputGroup style={{ width: "250px", maxWidth: "100%" }}>
                <InputGroup.Text style={{ borderColor: "var(--primary-color)", padding: "0.375rem 0.75rem" }}>
                  <i className="fa-solid fa-search" style={{ color: "#6f42c1", fontSize: "0.875rem" }}></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder={searchPlaceholder}
                  value={searchValue || ""}
                  onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                  style={{ borderColor: "var(--primary-color)", padding: "0.375rem 0.75rem" }}
                />
              </InputGroup>
            )}
            {showColumnVisibility && allColumns.length > 0 && (
              <Dropdown>
                <Dropdown.Toggle
                  variant="outline-secondary"
                  size="sm"
                  className="custom-btn-setting"
                >
                  <i className="fs-5 fa-solid fa-gear"></i>
                </Dropdown.Toggle>
                <Dropdown.Menu align="end" style={{ minWidth: "200px", maxHeight: "400px", overflowY: "auto" }}>
                  <Dropdown.Header className="fs-6 fw-bold">Show/Hide Columns</Dropdown.Header>
                  <Dropdown.Divider />
                  {allColumns.map((col) => (
                    <Dropdown.Item
                      key={col.field}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleColumnVisibility && onToggleColumnVisibility(col.field);
                      }}
                      style={{ padding: "8px 16px" }}
                    >
                      <div className="d-flex align-items-center detail-h2">
                        <input
                          type="checkbox"
                          checked={visibleColumns[col.field] !== false}
                          onChange={() => onToggleColumnVisibility && onToggleColumnVisibility(col.field)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ marginRight: "8px", cursor: "pointer", color: "var(--primary-color)" }}
                        />
                        <span>{col.label}</span>
                      </div>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            )}
            {actionButtons.map((button, index) => (
              <button
                key={index}
                // variant={button.variant || "outline-primary"}
                // size={button.size || "sm"}
                onClick={button.onClick}
                // style={button.style}
                className="custom-btn-table-header"
                disabled={button.disabled}
              >
                {button.icon && <i className={`${button.icon} ${button.label ? "me-1" : ""}`}></i>}
                {button.label}
              </button>
            ))}
          </div>
        </div>
        </div>
    //   {/* </Card.Body>
    // </Card> */}
  );
};

export default TableHeader;

