 
 

 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 

 
 
 
 

 
 
 
 
 
 
 
 

 
 
 

 
 
 
 
 
 

 
 
 
 
 
 
 
 

 
 
 
 
 

 

 
 
 
 

 
 
 
 
 
 
 
 
 
 

 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
        
          
 

 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
              
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 

 
 

 
 
 
 
 

 
 
 
 
 
 
 
 

 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 

 
 
 
 

import React, { useState, useMemo } from "react";
import { Row, Col, Form, Button, Badge, Card } from "react-bootstrap";

/**
 * MODERN DYNAMIC ADVANCED FILTER
 * Professional UI with dynamic field mapping
 */

export const applyAdvancedFilters = (data, filterValues) => {
  if (!filterValues || Object.values(filterValues).every(v => v === "" || v === null)) {
    return data;
  }

  return data.filter((item) => {
    return Object.keys(filterValues).every((key) => {
      const filterValue = filterValues[key];
      if (filterValue === "" || filterValue === null) return true;

 
      if (key.endsWith("_from") || key.endsWith("_to")) {
        const actualFieldName = key.replace("_from", "").replace("_to", "");
        const itemValue = item[actualFieldName];
        if (!itemValue) return false;

        const itemDate = new Date(itemValue);
        const filterDate = new Date(filterValue);

        if (key.endsWith("_from")) {
          return itemDate >= filterDate;
        } else {
          filterDate.setHours(23, 59, 59, 999);
          return itemDate <= filterDate;
        }
      }

 
      const itemValue = item[key];
      const searchStr = String(filterValue).toLowerCase().trim();
      const itemStr = String(itemValue || "").toLowerCase().trim();

      if (!isNaN(filterValue) && filterValue !== "" && typeof itemValue === 'number') {
        return String(itemValue) === String(filterValue);
      }

      return itemStr.includes(searchStr);
    });
  });
};

const AdvancedFilter = ({ fields = [], onFilterChange, onClear, className = "" }) => {
  const [localFilters, setLocalFilters] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (name, value) => {
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
    <div className={`advanced-filter-wrapper ${className} mb-4`}>
      {/* Header Section */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-3">
          <Button
            variant={isExpanded ? "secondary" : "outline-secondary"}
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="d-flex align-items-center gap-2 px-3 py-1"
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

        <div className="d-flex gap-2">
          <Button 
            variant="" 
            size="sm" 
            onClick={handleClear}
            className="px-3 text-muted d-flex align-items-center gap-2 "
            style={{
              color: "var(--primary-color)",
              background: "var(--primary-background-color)",
              borderRadius: "5px",
              border:'var(--primary-color) solid 1px'}}
          >
            <i className="fa-solid fa-rotate-left"></i> Clear
          </Button>
          <Button 
            size="sm" 
            onClick={handleSearch} 
            className="px-2 d-flex align-items-center gap-2"
            style={{ 
              color: "var(--primary-color)",
              background: "var(--primary-background-color)",
              borderRadius: "5px",
              border:'var(--primary-color) solid 1px' }}
          >
            <i className="fa-solid fa-magnifying-glass"></i> Search
          </Button>
        </div>
      </div>

      {/* Expandable Filter Panel */}
      {isExpanded && (
        <Card className="border-2 rounded-4 overflow-hidden" style={{ backgroundColor: '#f8fafc' }}>
          <Card.Body className="p-4">
            <Row className="g-4">
              {fields.map((field, idx) => {
                const fName = field.name || field.field;

 
                if (field.type === "date") {
                  return (
                    <React.Fragment key={idx}>
                      <Col xs={12} md={2}>
                        <Form.Label className="text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                          {field.label} From
                        </Form.Label>
                        <Form.Control 
                          size="sm" 
                          type="date" 
                          className="border-0 shadow-sm"
                          value={localFilters[fName + "_from"] || ""} 
                          onChange={(e) => handleChange(fName + "_from", e.target.value)} 
                        />
                      </Col>
                      <Col xs={12} md={2}>
                        <Form.Label className="text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
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

 
                if (field.type === "select") {
                  return (
                    <Col xs={12} md={3} key={idx}>
                      <Form.Label className="text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
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

 
                return (
                  <Col xs={12} md={2} key={idx}>
                    <Form.Label className="text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
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
            </Row>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default AdvancedFilter;