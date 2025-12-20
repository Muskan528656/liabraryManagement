import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Row, Col, Form, Button, Badge, Card } from "react-bootstrap";

const AdvancedFilter = ({
  fields = [],
  onFilterChange,
  onClear,
  initialFilters = [],
  className = "",
}) => {
  const [filters, setFilters] = useState(initialFilters.length > 0 ? initialFilters : [{ id: Date.now(), field: "", operator: "equals", value: "", logic: "AND" }]);
  const [isExpanded, setIsExpanded] = useState(false);

  const getOperatorsForField = useCallback((fieldConfig) => {
    if (!fieldConfig) {
      return [
        { value: "equals", label: "Equals" },
        { value: "not_equals", label: "Not Equals" },
        { value: "contains", label: "Contains" },
      ];
    }

    const baseOperators = [
      { value: "equals", label: "Equals" },
      { value: "not_equals", label: "Not Equals" },
    ];

    switch (fieldConfig.type) {
      case "text":
      case "email":
      case "tel":
        return [
          ...baseOperators,
          { value: "contains", label: "Contains" },
          { value: "starts_with", label: "Starts With" },
          { value: "ends_with", label: "Ends With" },
          { value: "is_empty", label: "Is Empty" },
          { value: "is_not_empty", label: "Is Not Empty" },
        ];
      case "select":
      case "dropdown":
        return baseOperators;
      case "number":
        return [
          ...baseOperators,
          { value: "greater_than", label: "Greater Than" },
          { value: "less_than", label: "Less Than" },
          { value: "greater_or_equal", label: "Greater or Equal" },
          { value: "less_or_equal", label: "Less or Equal" },
        ];
      case "date":
        return [
          ...baseOperators,
          { value: "before", label: "Before" },
          { value: "after", label: "After" },
          { value: "between", label: "Between" },
        ];
      case "boolean":
      case "toggle":
        return [{ value: "equals", label: "Is" }];
      default:
        return baseOperators;
    }
  }, []);

  const renderValueInput = useCallback((filter, index, fieldConfig) => {
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

    if (filter.operator === "is_empty" || filter.operator === "is_not_empty") {
      return null;
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
        if (filter.operator === "between") {
          return (
            <div className="d-flex gap-2">
              <Form.Control
                size="sm"
                type="date"
                value={filter.value || ""}
                onChange={(e) => handleFilterChange(index, "value", e.target.value)}
              />
              <span className="align-self-center">to</span>
              <Form.Control
                size="sm"
                type="date"
                value={filter.valueTo || ""}
                onChange={(e) => handleFilterChange(index, "valueTo", e.target.value)}
              />
            </div>
          );
        }
        return (
          <Form.Control
            size="sm"
            type="date"
            value={filter.value || ""}
            onChange={(e) => handleFilterChange(index, "value", e.target.value)}
          />
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

  const handleFilterChange = useCallback((index, key, value) => {
    setFilters((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };

      if (key === "field") {
        updated[index].operator = "equals";
        updated[index].value = "";
        updated[index].valueTo = "";
      }

      return updated;
    });
  }, []);

  const addFilter = useCallback(() => {
    setFilters((prev) => [
      ...prev,
      { id: Date.now(), field: "", operator: "equals", value: "", logic: "AND" },
    ]);
  }, []);

  const removeFilter = useCallback((index) => {
    setFilters((prev) => {
      if (prev.length === 1) {
        return [{ id: Date.now(), field: "", operator: "equals", value: "", logic: "AND" }];
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const applyFilters = useCallback(() => {
    const validFilters = filters.filter(
      (f) => f.field && (f.operator === "is_empty" || f.operator === "is_not_empty" || f.value)
    );
    if (onFilterChange) {
      onFilterChange(validFilters);
    }
  }, [filters, onFilterChange]);

  const clearFilters = useCallback(() => {
    const emptyFilter = [{ id: Date.now(), field: "", operator: "equals", value: "", logic: "AND" }];
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
      (f) => f.field && (f.operator === "is_empty" || f.operator === "is_not_empty" || f.value)
    ).length;
  }, [filters]);

  const getFieldConfig = useCallback(
    (fieldName) => {
      return fields.find((f) => f.name === fieldName || f.field === fieldName);
    },
    [fields]
  );

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
              const operators = getOperatorsForField(fieldConfig);

              return (
                <Row key={filter.id} className="mb-2 align-items-center g-2">
                  {index > 0 && (
                    <Col xs={12} md={1}>
                      <Form.Select
                        size="sm"
                        value={filter.logic}
                        onChange={(e) => handleFilterChange(index, "logic", e.target.value)}
                        style={{ fontWeight: "bold", color: "var(--primary-color)" }}
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </Form.Select>
                    </Col>
                  )}
                  {index === 0 && <Col xs={12} md={1}></Col>}

                  <Col xs={12} md={3}>
                    <Form.Select
                      size="sm"
                      value={filter.field}
                      onChange={(e) => handleFilterChange(index, "field", e.target.value)}
                    >
                      <option value="">-- Select Field --</option>
                      {fields.map((field) => (
                        <option key={field.name || field.field} value={field.name || field.field}>
                          {field.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>

                  <Col xs={12} md={2}>
                    <Form.Select
                      size="sm"
                      value={filter.operator}
                      onChange={(e) => handleFilterChange(index, "operator", e.target.value)}
                      disabled={!filter.field}
                    >
                      {operators.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>

                  <Col xs={12} md={4}>
                    {renderValueInput(filter, index, fieldConfig)}
                  </Col>

                  <Col xs={12} md={2} className="d-flex gap-2">
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

            <hr className="my-3" />

            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={clearFilters}
              >
                <i className="fa-solid fa-times me-1"></i>
                Clear All
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
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export const applyAdvancedFilters = (data, filters) => {
  if (!filters || filters.length === 0) return data;

  return data.filter((item) => {
    let result = null;

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

      switch (filter.operator) {
        case "equals":
          conditionResult = normalizedFieldValue === normalizedFilterValue;
          break;
        case "not_equals":
          conditionResult = normalizedFieldValue !== normalizedFilterValue;
          break;
        case "contains":
          conditionResult = normalizedFieldValue.includes(normalizedFilterValue);
          break;
        case "starts_with":
          conditionResult = normalizedFieldValue.startsWith(normalizedFilterValue);
          break;
        case "ends_with":
          conditionResult = normalizedFieldValue.endsWith(normalizedFilterValue);
          break;
        case "is_empty":
          conditionResult = !fieldValue || normalizedFieldValue === "";
          break;
        case "is_not_empty":
          conditionResult = fieldValue && normalizedFieldValue !== "";
          break;
        case "greater_than":
          conditionResult = parseFloat(fieldValue) > parseFloat(filterValue);
          break;
        case "less_than":
          conditionResult = parseFloat(fieldValue) < parseFloat(filterValue);
          break;
        case "greater_or_equal":
          conditionResult = parseFloat(fieldValue) >= parseFloat(filterValue);
          break;
        case "less_or_equal":
          conditionResult = parseFloat(fieldValue) <= parseFloat(filterValue);
          break;
        case "before":
          conditionResult = new Date(fieldValue) < new Date(filterValue);
          break;
        case "after":
          conditionResult = new Date(fieldValue) > new Date(filterValue);
          break;
        case "between":
          if (filter.valueTo) {
            const dateVal = new Date(fieldValue);
            conditionResult =
              dateVal >= new Date(filterValue) && dateVal <= new Date(filter.valueTo);
          }
          break;
        default:
          conditionResult = normalizedFieldValue === normalizedFilterValue;
      }

      if (i === 0) {
        result = conditionResult;
      } else {
        if (filter.logic === "AND") {
          result = result && conditionResult;
        } else {
          result = result || conditionResult;
        }
      }
    }

    return result;
  });
};

export default AdvancedFilter;
