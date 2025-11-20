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
    <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.1)" }}>
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3">
            <h6 className="mb-0 fw-bold" style={{ color: "#6f42c1" }}>
              {icon && <i className={`${icon} me-2`}></i>}
              {title}
            </h6>
            {totalCount !== undefined && (
              <Badge bg="light" text="dark" style={{ fontSize: "0.75rem", padding: "0.5rem 0.75rem" }}>
                {icon && <i className={`${icon} me-1`}></i>}
                Total: {totalCount} {totalLabel || (totalCount === 1 ? "Item" : "Items")}
              </Badge>
            )}
            {showFiltered && filteredCount !== undefined && (
              <Badge bg="info" style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}>
                <i className="fa-solid fa-filter me-1"></i>
                Filtered: {filteredCount}
              </Badge>
            )}
          </div>
          <div className="d-flex gap-2 flex-wrap">
            {showSearch && (
              <InputGroup style={{ width: "250px", maxWidth: "100%" }}>
                <InputGroup.Text style={{ background: "#f3e9fc", borderColor: "#e9ecef", padding: "0.375rem 0.75rem" }}>
                  <i className="fa-solid fa-search" style={{ color: "#6f42c1", fontSize: "0.875rem" }}></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder={searchPlaceholder}
                  value={searchValue || ""}
                  onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                  style={{ borderColor: "#e9ecef", fontSize: "0.875rem", padding: "0.375rem 0.75rem" }}
                />
              </InputGroup>
            )}
            {showColumnVisibility && allColumns.length > 0 && (
              <Dropdown>
                <Dropdown.Toggle
                  variant="outline-secondary"
                  size="sm"
                  style={{
                    borderColor: "#6c757d",
                    color: "#6c757d",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "0.475rem 0.235rem"
                  }}
                >
                  <i className="fa-solid fa-gear"></i>
                </Dropdown.Toggle>
                <Dropdown.Menu align="end" style={{ minWidth: "200px", maxHeight: "400px", overflowY: "auto" }}>
                  <Dropdown.Header>Show/Hide Columns</Dropdown.Header>
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
                      <div className="d-flex align-items-center">
                        <input
                          type="checkbox"
                          checked={visibleColumns[col.field] !== false}
                          onChange={() => onToggleColumnVisibility && onToggleColumnVisibility(col.field)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ marginRight: "8px", cursor: "pointer" }}
                        />
                        <span>{col.label}</span>
                      </div>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            )}
            {actionButtons.map((button, index) => (
              <Button
                key={index}
                variant={button.variant || "outline-primary"}
                size={button.size || "sm"}
                onClick={button.onClick}
                style={button.style}
                disabled={button.disabled}
              >
                {button.icon && <i className={`${button.icon} ${button.label ? "me-1" : ""}`}></i>}
                {button.label}
              </Button>
            ))}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default TableHeader;

