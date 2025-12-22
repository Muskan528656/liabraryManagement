import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Row, Col, Form, Button, Badge, Card } from "react-bootstrap";

const AdvancedFilter = ({
  fields = [],
  onFilterChange,
  onClear,
  initialFilters = [],
  className = "",
}) => {
  const [filters, setFilters] = useState(initialFilters.length > 0 ? initialFilters : [{ id: Date.now(), field: "", value: "", valueTo: "" }]);
  const [isExpanded, setIsExpanded] = useState(false);

  const renderValueInput = useCallback((filter, index, fieldConfig) => {
    console.log("fieldConfig", fieldConfig)
    if (!fieldConfig) {
      return (
        <Form.Control
          size="sm"
          type="text"
          placeholder="Enter value..."
          value={filter.value || ""}
          onChange={(e) => handleFilterChange(index, "value", e.target.value)}
        />
      );
    }

    switch (fieldConfig.type) {
      case "select":
      case "dropdown":
        return (
          <Form.Select
            size="sm"
            value={filter.value || ""}
            onChange={(e) => handleFilterChange(index, "value", e.target.value)}
          >
            <option value="">-- Select --</option>
            {(fieldConfig.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Form.Select>
        );
      case "boolean":
      case "toggle":
        return (
          <Form.Select
            size="sm"
            value={filter.value || ""}
            onChange={(e) => handleFilterChange(index, "value", e.target.value)}
          >
            <option value="">-- Select --</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Form.Select>
        );
      case "date":
        return (
          <div className="d-flex flex-row gap-2">
            <div>
              {/* <small className="text-muted">Start Date</small> */}
              <Form.Control
                size="sm"
                type="date"
                value={filter.value || ""}
                onChange={(e) => handleFilterChange(index, "value", e.target.value)}
              />
            </div>
            <span className="align-self-center">to</span>
            <div>
              {/* <small className="text-muted">End Date</small> */}
              <Form.Control
                size="sm"
                type="date"
                value={filter.valueTo || ""}
                onChange={(e) => handleFilterChange(index, "valueTo", e.target.value)}
              />
            </div>
          </div>
        );
      case "number":
        return (
          <Form.Control
            size="sm"
            type="number"
            placeholder="Enter number..."
            value={filter.value || ""}
            onChange={(e) => handleFilterChange(index, "value", e.target.value)}
          />
        );
      default:
        return (
          <Form.Control
            size="sm"
            type="text"
            placeholder="Enter value..."
            value={filter.value || ""}
            onChange={(e) => handleFilterChange(index, "value", e.target.value)}
          />
        );
    }
  }, []);

  const getFieldConfig = useCallback(
    (fieldName) => {
      return fields.find((f) => f.name === fieldName || f.field === fieldName);
    },
    [fields]
  );

  const handleFilterChange = useCallback((index, key, value) => {
    setFilters((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };

      if (key === "field") {
        updated[index].value = "";
        updated[index].valueTo = "";
        const fieldConfig = getFieldConfig(value);
        if (fieldConfig?.label === "Registration date") {
          updated[index].value = new Date().toISOString().split('T')[0];
        }
      }

      return updated;
    });
  }, [getFieldConfig]);

  const addFilter = useCallback(() => {
    setFilters((prev) => [
      ...prev,
      { id: Date.now(), field: "", value: "", valueTo: "" },
    ]);
  }, []);

  const removeFilter = useCallback((index) => {
    setFilters((prev) => {
      if (prev.length === 1) {
        return [{ id: Date.now(), field: "", value: "", valueTo: "" }];
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const applyFilters = useCallback(() => {
    console.log("filter",filters);
    const validFilters = filters.filter(
      (f) => f.field && f.value
    );

    console.log("validFilters",validFilters);

    if (onFilterChange) {
      onFilterChange(validFilters);
    }
  }, [filters, onFilterChange]);

  const clearFilters = useCallback(() => {
    const emptyFilter = [{ id: Date.now(), field: "", value: "", valueTo: "" }];
    setFilters(emptyFilter);
    if (onClear) {
      onClear();
    }
    if (onFilterChange) {
      onFilterChange([]);
    }
  }, [onClear, onFilterChange]);

  const activeFilterCount = useMemo(() => {
    return filters.filter(
      (f) => f.field && f.value
    ).length;
  }, [filters]);

  return (
    <div className={`advanced-filter-container ${className}`}>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="d-flex align-items-center gap-2"
          style={{
            color: "var(--primary-color)",
            borderColor: "var(--primary-color)",
          }}
        >
          <i className={`fa-solid fa-filter`}></i>
          <span>Advanced Filter</span>
          {activeFilterCount > 0 && (
            <Badge bg="primary" pill style={{ background: "var(--primary-color)" }}>
              {activeFilterCount}
            </Badge>
          )}
          <i className={`fa-solid fa-chevron-${isExpanded ? "up" : "down"} ms-1`}></i>
        </Button>

        {activeFilterCount > 0 && !isExpanded && (
          <Button
            variant="link"
            size="sm"
            onClick={clearFilters}
            className="text-danger p-0 ms-2"
          >
            <i className="fa-solid fa-times me-1"></i>
            Clear Filters
          </Button>
        )}
        
          
      </div>

      {isExpanded && (
        <Card className="border shadow-sm mb-3">
          <Card.Body className="p-3">
            {filters.map((filter, index) => {
              const fieldConfig = getFieldConfig(filter.field);

              return (
                <Row key={filter.id} className="mb-2 align-items-center g-2">
                  <Col xs={12} md={4}>
                    <Form.Select
                      size="sm"
                      value={filter.field}
                      onChange={(e) => handleFilterChange(index, "field", e.target.value)}
                    >
                      <option value="">-- Select Field --</option>
                      {fields.map((field) => (
                      <option key={field.field || field.name} value={field.field || field.name}>
                          {field.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>

                  <Col xs={12} md={5}>
                    {renderValueInput(filter, index, fieldConfig)}
                  </Col>

                  <Col xs={12} md={3} className="d-flex gap-2">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeFilter(index)}
                      title="Remove filter"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </Button>
                    {index === filters.length - 1 && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={addFilter}
                        title="Add filter"
                        style={{
                          color: "var(--primary-color)",
                          borderColor: "var(--primary-color)",
                        }}
                      >
                        <i className="fa-solid fa-plus"></i>
                      </Button>
                    )}
                  </Col>
                </Row>
              );
              
            })}
          </Card.Body>
            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={clearFilters}
              >
                <i className="fa-solid fa-times me-1"></i>
                Clear
              </Button>
              <Button
                size="sm"
                onClick={applyFilters}
                style={{
                  background: "var(--primary-color)",
                  border: "none",
                }}
              >
                <i className="fa-solid fa-check me-1"></i>
                Apply Filters
              </Button>
            </div>
        </Card>
      )}
    </div>
  );
};

export const applyAdvancedFilters = (data, filters, fields) => {
  if (!filters || filters.length === 0) return data;
  fields = fields || [];

  return data.filter((item) => {
    let result = true;

    for (let i = 0; i < filters.length; i++) {
      const filter = filters[i];
      const fieldValue = item[filter.field];
      const filterValue = filter.value;
      let conditionResult = false;

      const normalizedFieldValue =
        fieldValue === null || fieldValue === undefined
          ? ""
          : String(fieldValue).toLowerCase().trim();
      const normalizedFilterValue =
        filterValue === null || filterValue === undefined
          ? ""
          : String(filterValue).toLowerCase().trim();

      const fieldConfig = fields.find((f) => f.name === filter.field || f.field === filter.field);
      const type = fieldConfig?.type || "text";

      switch (type) {
        case "text":
        case "email":
        case "tel":
          conditionResult = normalizedFieldValue.includes(normalizedFilterValue);
          break;
        case "select":
        case "dropdown":
          conditionResult = normalizedFieldValue === normalizedFilterValue;
          break;
        case "number":
          conditionResult = parseFloat(fieldValue) === parseFloat(filterValue);
          break;
        case "date":
          if (filter.valueTo) {
            const dateVal = new Date(fieldValue);
            conditionResult =
              dateVal >= new Date(filter.value) && dateVal <= new Date(filter.valueTo);
          } else if (filter.value) {
            const dateVal = new Date(fieldValue);
            conditionResult = dateVal >= new Date(filter.value);
          } else {
            conditionResult = true;
          }
          break;
        case "boolean":
        case "toggle":
          conditionResult = String(fieldValue) === filterValue;
          break;
        default:
          conditionResult = normalizedFieldValue.includes(normalizedFilterValue);
      }

      result = result && conditionResult;
    }

    return result;
  });
};

export default AdvancedFilter;
