import React, { useState, useMemo } from "react";
import { Row, Col, Form, Button, Badge, Card } from "react-bootstrap";

export const applyAdvancedFilters = (data = [], filterValues = {}) => {

  if (
    !filterValues ||
    Object.values(filterValues).every(
      v => v === "" || v === null || v === undefined
    )
  ) {
    return data;
  }

  return data.filter(item =>
    Object.keys(filterValues).every(key => {
      let filterValue = filterValues[key];

      if (filterValue === "" || filterValue === null || filterValue === undefined)
        return true;

      const itemValue = item[key];

      if (filterValue === "true") filterValue = true;
      if (filterValue === "false") filterValue = false;

      if (typeof filterValue === "boolean") {
        return itemValue === filterValue;
      }

      if (key.endsWith("_from") || key.endsWith("_to")) {
        const field = key.replace("_from", "").replace("_to", "");
        if (!item[field]) return false;

        const itemDate = new Date(item[field]).toLocaleDateString("en-CA");
        const filterDate = filterValue;

        if (key.endsWith("_from")) return itemDate >= filterDate;
        if (key.endsWith("_to")) return itemDate <= filterDate;
      }

      if (typeof itemValue === "number") {
        return itemValue === Number(filterValue);
      }

      return String(itemValue || "")
        .toLowerCase()
        .includes(String(filterValue).toLowerCase());
    })
  );
};



const AdvancedFilter = ({ fields = [], onFilterChange, onClear, className = "" }) => {

  console.log("onFilterChange:", onFilterChange);
  console.log("AdvancedFilter fields:", fields);


  const [localFilters, setLocalFilters] = useState({});
  const [isExpanded, setIsExpanded] = useState(true);

  const handleChange = (name, value) => {
    
    console.log("name",name,"value",value);
    
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    onFilterChange && onFilterChange(localFilters);
  };

  const handleClear = () => {
    setLocalFilters({});
    onClear && onClear();
    onFilterChange && onFilterChange({});
  };

  const activeCount = useMemo(() => {
    return Object.values(localFilters).filter(v => v !== "" && v !== null).length;
  }, [localFilters]);

  return (
    <div className={`advanced-filter-wrapper ${className} mb-1`}>
      {/* Header Section */}
      <div className="d-flex align-items-center justify-content-end">
        <div className="d-none">
          <Button
            variant={isExpanded ? "secondary" : "outline-secondary"}
            size="sm"
            className="d-flex align-items-center gap-2 px-3 "
          >
            <i className={`fa-solid ${isExpanded ? 'fa-minus' : 'fa-filter'}`}></i>
            <span className="fw-bold">Advanced Filter</span>
            {activeCount > 0 && (
              <Badge pill bg="primary" className="ms-1 px-2" style={{ fontSize: '0.75rem' }}>
                {activeCount}
              </Badge>
            )}
            <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} ms-1 small`}></i>
          </Button>
        </div>
      </div>

      {/* Expandable Filter Panel */}
      {isExpanded && (

        <Row className="align-items-end">
          {fields.map((field, idx) => {
            const fName = field.name || field.field;

            // Date Range Fields
            if (field.type === "date") {
              return (
                <React.Fragment key={idx}>
                  <Col xs={12} md={2}>
                    <Form.Label className="text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.6rem', letterSpacing: '0.5px' }}>
                      {field.label} From
                    </Form.Label>
                    <Form.Control
                      size="sm"
                      type="date"
                      className="border-1"
                      value={localFilters[fName + "_from"] || ""}
                      onChange={(e) => handleChange(fName + "_from", e.target.value)}
                    />
                  </Col>
                  <Col xs={12} md={2}>
                    <Form.Label className="text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.6rem', letterSpacing: '0.5px' }}>
                      {field.label} To
                    </Form.Label>
                    <Form.Control
                      size="sm"
                      type="date"
                      className="border-1"
                      value={localFilters[fName + "_to"] || ""}
                      onChange={(e) => handleChange(fName + "_to", e.target.value)}
                    />
                  </Col>
                </React.Fragment>
              );
            }

            // Select Fields
            if (field.type === "select") {
              return (
                <Col xs={12} md={2} key={idx}>
                  <Form.Label className="text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.6rem', letterSpacing: '0.5px' }}>
                    {field.label}
                  </Form.Label>
                  <Form.Select
                    size="sm"
                    className="border-1"
                    value={localFilters[fName] || ""}
                    onChange={(e) => handleChange(fName, e.target.value)}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map((opt, i) => (
                      <option key={i} value={opt.value}>{opt.label}</option>
                    ))}
                  </Form.Select>
                </Col>
              );
            }

            // Text Fields
            return (
              <Col xs={12} md={2} key={idx}>
                <Form.Label className="text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.6rem', letterSpacing: '0.5px' }}>
                  {field.label}
                </Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  className="border-1"
                  placeholder={`Enter ${field.label}...`}
                  value={localFilters[fName] || ""}
                  onChange={(e) => handleChange(fName, e.target.value)}
                />
              </Col>
            );
          })}

         <Col xs={12} md={2} className="d-flex align-items-end gap-2">
          <div className="d-flex gap-2 ">
            <Button
              size="sm"
              onClick={handleClear}
              className="btn-paper btn-paper-clear d-flex align-items-center gap-1 h-75 px-2"
              >
              <i className="fa-solid fa-xmark"></i>
              Clear
            </Button>

            <Button
              size="sm"
              onClick={handleSearch}
              className="btn-paper btn-paper-apply d-flex align-items-center gap-1 h-75 px-2"
              >
              <i className="fa-solid fa-paper-plane"></i> 
              Apply
            </Button>
          </div>
        </Col>
        <style>{`
          .btn-paper-apply i {
            font-size: 0.85rem;
            transform: rotate(10deg); 
            margin-right: 4px;
          }
        `}</style>
        </Row>

      )}
    </div>
  );
};

export default AdvancedFilter;