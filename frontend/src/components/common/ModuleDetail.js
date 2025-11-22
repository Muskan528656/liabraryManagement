import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Badge, Form } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import DataApi from "../../api/dataApi";
import Loader from "./Loader";
import ScrollToTop from "./ScrollToTop";
import PubSub from "pubsub-js";

const ModuleDetail = ({
  moduleName,
  moduleApi,
  moduleLabel,
  fields,
  relatedModules = [],
  customHeader = null,
  customSections = [],
  customActions = [],
  onEdit = null,
  onDelete = null,
  imageField = null,
  imageUrl = null,
  lookupNavigation = {},
  externalData = {}, // For select dropdowns (authors, categories, etc.)
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [relatedData, setRelatedData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState(null);
  const [saving, setSaving] = useState(false);
  const moduleNameFromUrl = window.location.pathname.split("/")[1];
 console.log('moduleApi' , moduleApi)
  useEffect(() => {
    console.log("ModuleDetail useEffect running with:", { id, moduleApi, moduleName });

    const loadData = async () => {
      try {
        setLoading(true);

        // First try to fetch main data
        await fetchData();

        // Then fetch related data if needed
        if (relatedModules.length > 0) {
          await fetchRelatedData();
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id && moduleApi) {
      loadData();
    } else {
      console.error("Missing id or moduleApi:", { id, moduleApi });
      setLoading(false);
    }
  }, [id, moduleApi, moduleLabel]); // Add dependencies

  console.log("ModuleDetail Props:", {
    moduleApi,
    moduleName,
    moduleLabel,
    fields,
    id
  });


  const fetchData = async () => {
    try {
      console.log("Fetching data for:", { moduleApi, id });

      const api = new DataApi(moduleApi);
      const response = await api.fetchById(id);

      console.log("Full API Response:", response);

      if (response && response.data) {
        // Axios wraps response in data property
        const responseData = response.data;
        
        // Handle different response formats
        if (responseData.success && responseData.data) {
          setData(responseData.data);
        } else if (responseData.data && responseData.data.success && responseData.data.data) {
          setData(responseData.data.data);
        } else if (responseData.data) {
          setData(responseData.data);
        } else if (responseData.id) {
          setData(responseData);
        } else if (Array.isArray(responseData) && responseData.length > 0) {
          setData(responseData[0]);
        } else {
          // Direct data object
          setData(responseData);
        }
      } else {
        throw new Error("No response received from API");
      }
    } catch (error) {
      console.error(`Error fetching ${moduleLabel}:`, error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: `Failed to fetch ${moduleLabel} details`,
      });
    }
  };

  const fetchRelatedData = async () => {
    try {
      const relatedDataObj = {};
      
      // Normalize relatedModules - handle both string array and object array
      const normalizedModules = relatedModules.map(module => {
        if (typeof module === 'string') {
          return {
            key: module,
            api: module,
            label: module.charAt(0).toUpperCase() + module.slice(1)
          };
        }
        return module;
      });
      
      for (const relatedModule of normalizedModules) {
        try {
          // Skip if no api specified
          if (!relatedModule.api) continue;
          
          const api = new DataApi(relatedModule.api);
          const response = await api.get(relatedModule.endpoint ? relatedModule.endpoint(id) : `/${id}`);
          if (response && response.data) {
            const responseData = response.data.success ? response.data.data : response.data;
            relatedDataObj[relatedModule.key] = Array.isArray(responseData) ? responseData : [responseData];
          }
        } catch (error) {
          console.error(`Error fetching related ${relatedModule.label || relatedModule.key}:`, error);
          relatedDataObj[relatedModule.key] = [];
        }
      }
      setRelatedData(relatedDataObj);
    } catch (error) {
      console.error("Error fetching related data:", error);
    }
  };

  const normalizeLookupPath = (path = "") => {
    return path.replace(/^\/+|\/+$/g, "");
  };

  const getLookupTargetId = (lookupConfig = {}, record = {}) => {
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
  };

  const getLookupLabel = (value, record, lookupConfig = {}) => {
    if (typeof lookupConfig.labelResolver === "function") {
      return lookupConfig.labelResolver(record);
    }

    if (lookupConfig.labelField && Object.prototype.hasOwnProperty.call(record, lookupConfig.labelField)) {
      return record[lookupConfig.labelField] ?? value;
    }

    return value ?? "—";
  };

  const handleLookupNavigation = (lookupConfig, record, event = null) => {
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
  };

  const formatValue = (value, field) => {
    if (value === null || value === undefined || value === "") return "—";

    console.log(`Formatting field: ${field.key}, value:`, value, "type:", field.type);

      // Check if this field has lookup navigation configured
    const lookupConfig = lookupNavigation && lookupNavigation[field.key];
    if (lookupConfig && data) {
      const targetId = getLookupTargetId(lookupConfig, data);
      if (targetId) {
        const label = getLookupLabel(value, data, lookupConfig);
        return (
          <a
            href="#"
            onClick={(e) => handleLookupNavigation(lookupConfig, data, e)}
            style={{
              color: "#6f42c1",
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
      }
    }

    if (field.type === "date") {
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return value;
      }
    }
    if (field.type === "datetime") {
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    }
    if (field.type === "boolean") {
      return value ? "Yes" : "No";
    }
    if (field.type === "badge") {
      const badgeConfig = field.badgeConfig || {};
      const bgColor = badgeConfig[value] || (value ? "success" : "secondary");
      const label = badgeConfig[`${value}_label`] || (value ? "Active" : "Inactive");
      return <Badge bg={bgColor}>{label}</Badge>;
    }
    if (field.type === "currency") {
      return `₹${parseFloat(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (field.type === "number") {
      return parseFloat(value).toLocaleString("en-IN");
    }
    if (field.render && typeof field.render === "function") {
      return field.render(value, data);
    }
    return String(value);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(data);
    } else {
      // Enable inline editing
      setIsEditing(true);
      setTempData({ ...data });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const api = new DataApi(moduleApi);
      const response = await api.update(tempData, id);
      
      if (response && response.data) {
        const responseData = response.data;
        if (responseData.success && responseData.data) {
          setData(responseData.data);
        } else if (responseData.data) {
          setData(responseData.data);
        } else {
          setData(responseData);
        }
        
        PubSub.publish("RECORD_SAVED_TOAST", {
          title: "Success",
          message: `${moduleLabel} updated successfully`,
        });
        
        setIsEditing(false);
        setTempData(null);
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      console.error(`Error updating ${moduleLabel}:`, error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: `Failed to update ${moduleLabel}: ${error.message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempData(null);
  };

  const handleFieldChange = (fieldKey, value) => {
    if (isEditing && tempData) {
      setTempData({
        ...tempData,
        [fieldKey]: value
      });
    }
  };

  const getFieldValue = (field, currentData) => {
    if (!currentData) return "";
    const value = currentData[field.key];
    
    if (isEditing) {
      // For editing mode, return raw value formatted for input
      if (field.type === "date" && value) {
        try {
          const date = new Date(value);
          return date.toISOString().split('T')[0]; // YYYY-MM-DD format
        } catch {
          return value;
        }
      }
      if (field.type === "datetime" && value) {
        try {
          const date = new Date(value);
          // Convert to datetime-local format (YYYY-MM-DDTHH:mm)
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch {
          return value;
        }
      }
      return value || "";
    } else {
      // For display mode, use formatValue
      return formatValue(value, field) || "—";
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      onDelete(data);
    } else {
      if (window.confirm(`Are you sure you want to delete this ${moduleLabel}?`)) {
        try {
          const api = new DataApi(moduleApi);
          await api.delete(id);
          PubSub.publish("RECORD_SAVED_TOAST", {
            title: "Success",
            message: `${moduleLabel} deleted successfully`,
          });
          navigate(`/${moduleName}`);
        } catch (error) {
          PubSub.publish("RECORD_ERROR_TOAST", {
            title: "Error",
            message: `Failed to delete ${moduleLabel}`,
          });
        }
      }
    }
  };

  if (loading) {
    return (
      <Container fluid>
        <ScrollToTop />
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <Loader />
        </div>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container fluid>
        <ScrollToTop />
        <Card>
          <Card.Body className="text-center">
            <h4>No Data Found</h4>
            <p>Unable to load {moduleLabel} details.</p>
            <Button variant="primary" onClick={() => navigate(`/${moduleName}`)}>
              Back to List
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // Normalize fields - handle both array and object format
  const normalizedFields = Array.isArray(fields) 
    ? { details: fields }
    : fields || {};

  // Get title and subtitle from fields config or data
  const titleValue = normalizedFields?.title && data ? (data[normalizedFields.title] || data.name || data.title || moduleLabel) : (data?.name || data?.title || moduleLabel);
  const subtitleValue = normalizedFields?.subtitle && data ? (data[normalizedFields.subtitle] || data.email || data.isbn || "") : (data?.email || data?.isbn || "");

  // Debug: Check what fields are available in data
  console.log("Available data fields:", Object.keys(data));
  console.log("Fields configuration:", normalizedFields);

  return (
    <Container fluid className="py-4">
      <ScrollToTop />

      {/* Header Section with Title and Actions */}
      <Row className="mb-4">
        <Col>
          <Card style={{
            border: "none",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            borderRadius: "12px",
            overflow: "hidden"
          }}>
            <Card.Body style={{ padding: "20px 24px" }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 style={{ margin: 0, color: "#6f42c1" }}>
                    {moduleLabel}
                  </h4>
                  {subtitleValue && (
                    <p style={{ margin: "8px 0 0 0", color: "#6c757d", fontSize: "14px" }}>
                      {subtitleValue}
                    </p>
                  )}
                  {!subtitleValue && (
                  <p style={{ margin: "8px 0 0 0", color: "#6c757d", fontSize: "14px" }}>
                    ID: {id}
                  </p>
                  )}
                </div>
                <div>
                  {!isEditing ? (
                    <Button
                      variant="outline-primary"
                      onClick={handleEdit}
                      style={{
                        border: "2px solid var(--primary-color, #6f42c1)",
                        color: "var(--primary-color, #6f42c1)",
                        borderRadius: "8px",
                        padding: "8px 20px",
                        fontWeight: "600",
                      }}
                    >
                    <i className="fa-solid fa-edit me-2"></i>
                      Edit {moduleLabel}
                  </Button>
                  ) : (
                    <div className="d-flex gap-2">
                      <button
                        className="custom-btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                          background: "var(--primary-color, #6f42c1)",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 20px",
                          fontWeight: "600",
                          cursor: saving ? "not-allowed" : "pointer",
                          opacity: saving ? 0.6 : 1,
                        }}
                      >
                        <i className="fa-solid fa-check me-2"></i>
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="custom-btn-secondary"
                        onClick={handleCancel}
                        disabled={saving}
                        style={{
                          background: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 20px",
                          fontWeight: "600",
                          cursor: saving ? "not-allowed" : "pointer",
                          opacity: saving ? 0.6 : 1,
                        }}
                      >
                        <i className="fa-solid fa-times me-2"></i>
                        Cancel
                      </button>
                    </div>
                  )}
                  {!isEditing && (
                    <Button variant="outline-danger" onClick={handleDelete} className="ms-2">
                    <i className="fa-solid fa-trash me-2"></i>
                    Delete
                  </Button>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Overview Section */}
      {normalizedFields && normalizedFields.overview && normalizedFields.overview.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card style={{
              border: "none",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
              borderRadius: "12px",
              overflow: "hidden"
            }}>
              <Card.Body style={{ padding: 0 }}>
                <div style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid #e9ecef",
                  background: "linear-gradient(to right, #f8f9fa, #ffffff)"
                }}>
                  <h5 style={{
                    margin: 0,
                    color: "#6f42c1",
                    fontSize: "16px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <i className="fa-solid fa-info-circle"></i>
                    Overview
                  </h5>
                </div>

                <div style={{ padding: "24px" }}>
      <Row>
                    <Col md={6}>
                      {normalizedFields.overview.slice(0, Math.ceil(normalizedFields.overview.length / 2)).map((field, index) => {
                        const currentData = isEditing ? tempData : data;
                        
                        // Handle select/dropdown fields
                        if (field.type === "select" && field.options && externalData[field.options]) {
                          const options = externalData[field.options] || [];
                          const currentValue = currentData ? currentData[field.key] : null;
                          
                          return (
                            <Form.Group key={index} className="mb-3">
                              <Form.Label className="fw-semibold">{field.label}</Form.Label>
                              {isEditing ? (
                                <Form.Select
                                  value={currentValue || ""}
                                  onChange={(e) => handleFieldChange(field.key, e.target.value || null)}
                                  style={{
                                    background: "white",
                                  }}
                                >
                                  <option value="">Select {field.label}</option>
                                  {options.map((option) => (
                                    <option key={option.id} value={option.id}>
                                      {option.name || option.title || option.email || `Item ${option.id}`}
                                    </option>
                                  ))}
                                </Form.Select>
                              ) : (
                                <Form.Control
                                  type="text"
                                  value={(() => {
                                    if (field.displayKey && data) {
                                      return data[field.displayKey] || "—";
                                    }
                                    const selected = options.find(opt => opt.id === currentValue);
                                    return selected ? (selected.name || selected.title || selected.email || "—") : "—";
                                  })()}
                                  readOnly
                                  style={{
                                    background: "var(--header-highlighter-color, #f8f9fa)",
                                    pointerEvents: "none",
                                    opacity: 0.9,
                                  }}
                                />
                              )}
                            </Form.Group>
                          );
                        }
                        
                        return (
                          <Form.Group key={index} className="mb-3">
                            <Form.Label className="fw-semibold">{field.label}</Form.Label>
                            <Form.Control
                              type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "datetime" ? "datetime-local" : "text"}
                              value={getFieldValue(field, currentData)}
                              readOnly={!isEditing}
                              onChange={(e) => {
                                if (isEditing) {
                                  let newValue = e.target.value;
                                  if (field.type === "number") {
                                    newValue = newValue ? parseFloat(newValue) : null;
                                  } else if (field.type === "date" && newValue) {
                                    newValue = newValue;
                                  } else if (field.type === "datetime" && newValue) {
                                    newValue = new Date(newValue).toISOString();
                                  }
                                  handleFieldChange(field.key, newValue);
                                }
                              }}
                              style={{
                                background: !isEditing ? "var(--header-highlighter-color, #f8f9fa)" : "white",
                                pointerEvents: isEditing ? "auto" : "none",
                                opacity: isEditing ? 1 : 0.9,
                              }}
                            />
                          </Form.Group>
                        );
                      })}
                    </Col>

                    <Col md={6}>
                      {normalizedFields.overview.slice(Math.ceil(normalizedFields.overview.length / 2)).map((field, index) => {
                        const currentData = isEditing ? tempData : data;
                        
                        // Handle select/dropdown fields
                        if (field.type === "select" && field.options && externalData[field.options]) {
                          const options = externalData[field.options] || [];
                          const currentValue = currentData ? currentData[field.key] : null;
                          
                          return (
                            <Form.Group key={index} className="mb-3">
                              <Form.Label className="fw-semibold">{field.label}</Form.Label>
                              {isEditing ? (
                                <Form.Select
                                  value={currentValue || ""}
                                  onChange={(e) => handleFieldChange(field.key, e.target.value || null)}
                                  style={{
                                    background: "white",
                                  }}
                                >
                                  <option value="">Select {field.label}</option>
                                  {options.map((option) => (
                                    <option key={option.id} value={option.id}>
                                      {option.name || option.title || option.email || `Item ${option.id}`}
                                    </option>
                                  ))}
                                </Form.Select>
                              ) : (
                                <Form.Control
                                  type="text"
                                  value={(() => {
                                    if (field.displayKey && data) {
                                      return data[field.displayKey] || "—";
                                    }
                                    const selected = options.find(opt => opt.id === currentValue);
                                    return selected ? (selected.name || selected.title || selected.email || "—") : "—";
                                  })()}
                                  readOnly
                                  style={{
                                    background: "var(--header-highlighter-color, #f8f9fa)",
                                    pointerEvents: "none",
                                    opacity: 0.9,
                                  }}
                                />
                              )}
                            </Form.Group>
                          );
                        }
                        
                        return (
                          <Form.Group key={index} className="mb-3">
                            <Form.Label className="fw-semibold">{field.label}</Form.Label>
                            <Form.Control
                              type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "datetime" ? "datetime-local" : "text"}
                              value={getFieldValue(field, currentData)}
                              readOnly={!isEditing}
                              onChange={(e) => {
                                if (isEditing) {
                                  let newValue = e.target.value;
                                  if (field.type === "number") {
                                    newValue = newValue ? parseFloat(newValue) : null;
                                  } else if (field.type === "date" && newValue) {
                                    newValue = newValue;
                                  } else if (field.type === "datetime" && newValue) {
                                    newValue = new Date(newValue).toISOString();
                                  }
                                  handleFieldChange(field.key, newValue);
                                }
                              }}
                              style={{
                                background: !isEditing ? "var(--header-highlighter-color, #f8f9fa)" : "white",
                                pointerEvents: isEditing ? "auto" : "none",
                                opacity: isEditing ? 1 : 0.9,
                              }}
                            />
                          </Form.Group>
                        );
                      })}
                    </Col>
                  </Row>
              </div>
          </Card.Body>
        </Card>
          </Col>
      </Row>
      )}

      {/* Main Details Section */}
      {normalizedFields && normalizedFields.details && (
        <Row className="mb-4">
          <Col>
            <Card style={{
              border: "none",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
              borderRadius: "12px",
              overflow: "hidden"
            }}>
              <Card.Body style={{ padding: 0 }}>
                <div style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid #e9ecef",
                  background: "linear-gradient(to right, #f8f9fa, #ffffff)"
                }}>
                  <h5 style={{
                    margin: 0,
                    color: "#6f42c1",
                    fontSize: "16px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <i className="fa-solid fa-file-lines"></i>
                    Basic Information
                  </h5>
                </div>

                <div style={{ padding: "24px" }}>
                  <Row>
                    <Col md={6}>
                      {normalizedFields.details.slice(0, Math.ceil(normalizedFields.details.length / 2)).map((field, index) => {
                        const currentData = isEditing ? tempData : data;
                        
                        // Handle select/dropdown fields
                        if (field.type === "select" && field.options && externalData[field.options]) {
                          const options = externalData[field.options] || [];
                          const currentValue = currentData ? currentData[field.key] : null;

                          return (
                            <Form.Group key={index} className="mb-3">
                              <Form.Label className="fw-semibold">{field.label}</Form.Label>
                              {isEditing ? (
                                <Form.Select
                                  value={currentValue || ""}
                                  onChange={(e) => handleFieldChange(field.key, e.target.value || null)}
                                  style={{
                                    background: "white",
                                  }}
                                >
                                  <option value="">Select {field.label}</option>
                                  {options.map((option) => (
                                    <option key={option.id} value={option.id}>
                                      {option.name || option.title || option.email || `Item ${option.id}`}
                                    </option>
                                  ))}
                                </Form.Select>
                              ) : (
                                <Form.Control
                                  type="text"
                                  value={(() => {
                                    if (field.displayKey && data) {
                                      return data[field.displayKey] || "—";
                                    }
                                    const selected = options.find(opt => opt.id === currentValue);
                                    return selected ? (selected.name || selected.title || selected.email || "—") : "—";
                                  })()}
                                  readOnly
                                  style={{
                                    background: "var(--header-highlighter-color, #f8f9fa)",
                                    pointerEvents: "none",
                                    opacity: 0.9,
                                  }}
                                />
                              )}
                            </Form.Group>
                          );
                        }
                        
                        return (
                          <Form.Group key={index} className="mb-3">
                            <Form.Label className="fw-semibold">{field.label}</Form.Label>
                            <Form.Control
                              type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "datetime" ? "datetime-local" : "text"}
                              value={getFieldValue(field, currentData)}
                              readOnly={!isEditing}
                              onChange={(e) => {
                                if (isEditing) {
                                  let newValue = e.target.value;
                                  if (field.type === "number") {
                                    newValue = newValue ? parseFloat(newValue) : null;
                                  } else if (field.type === "date" && newValue) {
                                    // Keep date in ISO format
                                    newValue = newValue;
                                  } else if (field.type === "datetime" && newValue) {
                                    // Keep datetime in ISO format
                                    newValue = new Date(newValue).toISOString();
                                  }
                                  handleFieldChange(field.key, newValue);
                                }
                              }}
                              style={{
                                background: !isEditing ? "var(--header-highlighter-color, #f8f9fa)" : "white",
                                pointerEvents: isEditing ? "auto" : "none",
                                opacity: isEditing ? 1 : 0.9,
                              }}
                            />
                          </Form.Group>
                          );
                        })}
                    </Col>

                    <Col md={6}>
                      {normalizedFields.details.slice(Math.ceil(normalizedFields.details.length / 2)).map((field, index) => {
                        const currentData = isEditing ? tempData : data;
                        
                        // Handle select/dropdown fields
                        if (field.type === "select" && field.options && externalData[field.options]) {
                          const options = externalData[field.options] || [];
                          const currentValue = currentData ? currentData[field.key] : null;
                          
                          return (
                            <Form.Group key={index} className="mb-3">
                              <Form.Label className="fw-semibold">{field.label}</Form.Label>
                              {isEditing ? (
                                <Form.Select
                                  value={currentValue || ""}
                                  onChange={(e) => handleFieldChange(field.key, e.target.value || null)}
                                  style={{
                                    background: "white",
                                  }}
                                >
                                  <option value="">Select {field.label}</option>
                                  {options.map((option) => (
                                    <option key={option.id} value={option.id}>
                                      {option.name || option.title || option.email || `Item ${option.id}`}
                                    </option>
                                  ))}
                                </Form.Select>
                              ) : (
                                <Form.Control
                                  type="text"
                                  value={(() => {
                                    if (field.displayKey && data) {
                                      return data[field.displayKey] || "—";
                                    }
                                    const selected = options.find(opt => opt.id === currentValue);
                                    return selected ? (selected.name || selected.title || selected.email || "—") : "—";
                                  })()}
                                  readOnly
                                  style={{
                                    background: "var(--header-highlighter-color, #f8f9fa)",
                                    pointerEvents: "none",
                                    opacity: 0.9,
                                  }}
                                />
                              )}
                            </Form.Group>
                          );
                        }
                        
                        return (
                          <Form.Group key={index} className="mb-3">
                            <Form.Label className="fw-semibold">{field.label}</Form.Label>
                            <Form.Control
                              type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "datetime" ? "datetime-local" : "text"}
                              value={getFieldValue(field, currentData)}
                              readOnly={!isEditing}
                              onChange={(e) => {
                                if (isEditing) {
                                  let newValue = e.target.value;
                                  if (field.type === "number") {
                                    newValue = newValue ? parseFloat(newValue) : null;
                                  } else if (field.type === "date" && newValue) {
                                    // Keep date in ISO format
                                    newValue = newValue;
                                  } else if (field.type === "datetime" && newValue) {
                                    // Keep datetime in ISO format
                                    newValue = new Date(newValue).toISOString();
                                  }
                                  handleFieldChange(field.key, newValue);
                                }
                              }}
                              style={{
                                background: !isEditing ? "var(--header-highlighter-color, #f8f9fa)" : "white",
                                pointerEvents: isEditing ? "auto" : "none",
                                opacity: isEditing ? 1 : 0.9,
                              }}
                            />
                          </Form.Group>
                        );
                      })}
                    </Col>
                  </Row>
                              </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Custom Sections from fields object (address, contact, settings, etc.) */}
      {normalizedFields && Object.keys(normalizedFields).filter(key => !['title', 'subtitle', 'overview', 'details'].includes(key)).map((sectionKey) => {
        const sectionFields = normalizedFields[sectionKey];
        if (!Array.isArray(sectionFields) || sectionFields.length === 0) return null;

        const sectionTitle = sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1).replace(/_/g, ' ');

        return (
          <Row key={sectionKey} className="mb-4">
            <Col>
              <Card style={{
                border: "none",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                borderRadius: "12px",
                overflow: "hidden"
              }}>
                <Card.Body style={{ padding: 0 }}>
                  <div style={{
                    padding: "20px 24px",
                    borderBottom: "1px solid #e9ecef",
                    background: "linear-gradient(to right, #f8f9fa, #ffffff)"
                  }}>
                    <h5 style={{
                      margin: 0,
                      color: "#6f42c1",
                      fontSize: "16px",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <i className="fa-solid fa-file-lines"></i>
                      {sectionTitle}
                    </h5>
                            </div>

                  <div style={{ padding: "24px" }}>
                    <Row>
                      <Col md={6}>
                        {sectionFields.slice(0, Math.ceil(sectionFields.length / 2)).map((field, index) => {
                          const currentData = isEditing ? tempData : data;
                          
                          // Handle select/dropdown fields
                          if (field.type === "select" && field.options && externalData[field.options]) {
                            const options = externalData[field.options] || [];
                            const currentValue = currentData ? currentData[field.key] : null;
                            
                            return (
                              <Form.Group key={index} className="mb-3">
                                <Form.Label className="fw-semibold">{field.label}</Form.Label>
                                {isEditing ? (
                                  <Form.Select
                                    value={currentValue || ""}
                                    onChange={(e) => handleFieldChange(field.key, e.target.value || null)}
                                    style={{
                                      background: "white",
                                    }}
                                  >
                                    <option value="">Select {field.label}</option>
                                    {options.map((option) => (
                                      <option key={option.id} value={option.id}>
                                        {option.name || option.title || option.email || `Item ${option.id}`}
                                      </option>
                                    ))}
                                  </Form.Select>
                                ) : (
                                  <Form.Control
                                    type="text"
                                    value={(() => {
                                      if (field.displayKey && data) {
                                        return data[field.displayKey] || "—";
                                      }
                                      const selected = options.find(opt => opt.id === currentValue);
                                      return selected ? (selected.name || selected.title || selected.email || "—") : "—";
                                    })()}
                                    readOnly
                                    style={{
                                      background: "var(--header-highlighter-color, #f8f9fa)",
                                      pointerEvents: "none",
                                      opacity: 0.9,
                                    }}
                                  />
                                )}
                              </Form.Group>
                            );
                          }
                          
                          return (
                            <Form.Group key={index} className="mb-3">
                              <Form.Label className="fw-semibold">{field.label}</Form.Label>
                              <Form.Control
                                type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "datetime" ? "datetime-local" : "text"}
                                value={getFieldValue(field, currentData)}
                                readOnly={!isEditing}
                                onChange={(e) => {
                                  if (isEditing) {
                                    let newValue = e.target.value;
                                    if (field.type === "number") {
                                      newValue = newValue ? parseFloat(newValue) : null;
                                    } else if (field.type === "date" && newValue) {
                                      newValue = newValue;
                                    } else if (field.type === "datetime" && newValue) {
                                      newValue = new Date(newValue).toISOString();
                                    }
                                    handleFieldChange(field.key, newValue);
                                  }
                                }}
                                style={{
                                  background: !isEditing ? "var(--header-highlighter-color, #f8f9fa)" : "white",
                                  pointerEvents: isEditing ? "auto" : "none",
                                  opacity: isEditing ? 1 : 0.9,
                                }}
                              />
                            </Form.Group>
                          );
                        })}
                      </Col>

                      <Col md={6}>
                        {sectionFields.slice(Math.ceil(sectionFields.length / 2)).map((field, index) => {
                          const currentData = isEditing ? tempData : data;
                          
                          // Handle select/dropdown fields
                          if (field.type === "select" && field.options && externalData[field.options]) {
                            const options = externalData[field.options] || [];
                            const currentValue = currentData ? currentData[field.key] : null;
                            
                            return (
                              <Form.Group key={index} className="mb-3">
                                <Form.Label className="fw-semibold">{field.label}</Form.Label>
                                {isEditing ? (
                                  <Form.Select
                                    value={currentValue || ""}
                                    onChange={(e) => handleFieldChange(field.key, e.target.value || null)}
                                    style={{
                                      background: "white",
                                    }}
                                  >
                                    <option value="">Select {field.label}</option>
                                    {options.map((option) => (
                                      <option key={option.id} value={option.id}>
                                        {option.name || option.title || option.email || `Item ${option.id}`}
                                      </option>
                                    ))}
                                  </Form.Select>
                                ) : (
                                  <Form.Control
                                    type="text"
                                    value={(() => {
                                      if (field.displayKey && data) {
                                        return data[field.displayKey] || "—";
                                      }
                                      const selected = options.find(opt => opt.id === currentValue);
                                      return selected ? (selected.name || selected.title || selected.email || "—") : "—";
                                    })()}
                                    readOnly
                                    style={{
                                      background: "var(--header-highlighter-color, #f8f9fa)",
                                      pointerEvents: "none",
                                      opacity: 0.9,
                                    }}
                                  />
                                )}
                              </Form.Group>
                            );
                          }
                          
                          return (
                            <Form.Group key={index} className="mb-3">
                              <Form.Label className="fw-semibold">{field.label}</Form.Label>
                              <Form.Control
                                type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "datetime" ? "datetime-local" : "text"}
                                value={getFieldValue(field, currentData)}
                                readOnly={!isEditing}
                                onChange={(e) => {
                                  if (isEditing) {
                                    let newValue = e.target.value;
                                    if (field.type === "number") {
                                      newValue = newValue ? parseFloat(newValue) : null;
                                    } else if (field.type === "date" && newValue) {
                                      newValue = newValue;
                                    } else if (field.type === "datetime" && newValue) {
                                      newValue = new Date(newValue).toISOString();
                                    }
                                    handleFieldChange(field.key, newValue);
                                  }
                                }}
                                style={{
                                  background: !isEditing ? "var(--header-highlighter-color, #f8f9fa)" : "white",
                                  pointerEvents: isEditing ? "auto" : "none",
                                  opacity: isEditing ? 1 : 0.9,
                                }}
                              />
                            </Form.Group>
                          );
                        })}
                    </Col>
                  </Row>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        );
      })}

      {/* Custom Sections */}
      {customSections.length > 0 && customSections.map((section, idx) => (
        <Row key={idx} className="mb-4">
          <Col md={section.colSize || 12}>
            <Card style={{
              border: "none",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
              borderRadius: "12px",
              overflow: "hidden"
            }}>
              <Card.Body style={{ padding: 0 }}>
                <div style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid #e9ecef",
                  background: "linear-gradient(to right, #f8f9fa, #ffffff)"
                }}>
                  <h5 style={{
                    margin: 0,
                    color: "#6f42c1",
                    fontSize: "16px",
                    fontWeight: "700"
                  }}>
                    {section.title}
                  </h5>
                </div>
                <div style={{ padding: "24px" }}>
                  {section.render ? section.render(data) : section.content}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ))}

      {/* Related Records Section */}
      {relatedModules.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card style={{
              border: "none",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
              borderRadius: "12px",
              overflow: "hidden"
            }}>
              <Card.Body style={{ padding: 0 }}>
                <div style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid #e9ecef",
                  background: "linear-gradient(to right, #f8f9fa, #ffffff)"
                }}>
                  <h5 style={{
                    margin: 0,
                    color: "#6f42c1",
                    fontSize: "16px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <i className="fa-solid fa-link"></i>
                    Related Records
                  </h5>
                </div>

                <div style={{ padding: "24px" }}>
                  {relatedModules.map((relatedModule, idx) => {
                    // Normalize relatedModule - handle both string and object
                    const normalizedModule = typeof relatedModule === 'string' 
                      ? { key: relatedModule, label: relatedModule.charAt(0).toUpperCase() + relatedModule.slice(1) }
                      : relatedModule;
                    
                    const moduleKey = normalizedModule.key || normalizedModule;
                    const moduleLabel = normalizedModule.label || (typeof normalizedModule === 'string' ? normalizedModule.charAt(0).toUpperCase() + normalizedModule.slice(1) : 'Related');
                    
                    return (
                    <div key={idx} className={idx > 0 ? "mt-4 pt-4" : ""} style={idx > 0 ? { borderTop: "1px solid #e9ecef" } : {}}>
                      <h6 style={{
                        marginBottom: "16px",
                        color: "#495057",
                        fontSize: "14px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>
                        {moduleLabel}
                      </h6>
                      {relatedData[moduleKey] && relatedData[moduleKey].length > 0 ? (
                        normalizedModule.render ? (
                          normalizedModule.render(relatedData[moduleKey], data)
                        ) : (
                          <div className="table-responsive">
                            <table style={{
                              width: "100%",
                              fontSize: "14px",
                              borderCollapse: "collapse"
                            }}>
                              <thead>
                                <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #e9ecef" }}>
                                  {normalizedModule.columns?.map((col, colIdx) => (
                                    <th
                                      key={colIdx}
                                      style={{
                                        padding: "12px 16px",
                                        textAlign: "left",
                                        fontWeight: "600",
                                        color: "#495057"
                                      }}
                                    >
                                      {col.label}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {relatedData[moduleKey].map((item, itemIdx) => (
                                  <tr
                                    key={itemIdx}
                                    style={{
                                      borderBottom: "1px solid #e9ecef",
                                      transition: "background-color 0.2s"
                                    }}
                                    onMouseEnter={(e) => e.target.parentElement.style.background = "#f8f9fa"}
                                    onMouseLeave={(e) => e.target.parentElement.style.background = "transparent"}
                                  >
                                    {normalizedModule.columns?.map((col, colIdx) => (
                                      <td
                                        key={colIdx}
                                        style={{
                                          padding: "12px 16px",
                                          color: "#6c757d"
                                        }}
                                      >
                                        {item[col.key] || "N/A"}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      ) : (
                        <div style={{
                          padding: "32px 16px",
                          textAlign: "center",
                          background: "#f8f9fa",
                          borderRadius: "8px",
                          border: "1px dashed #dee2e6"
                        }}>
                          <i className="fa-solid fa-inbox" style={{
                            fontSize: "32px",
                            color: "#adb5bd",
                            marginBottom: "8px",
                            display: "block"
                          }}></i>
                          <p style={{
                            color: "#6c757d",
                            margin: 0,
                            fontSize: "14px"
                          }}>
                            No {moduleLabel.toLowerCase()} found.
                          </p>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <style jsx>{`
        .detail-section {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
        }
        
        .detail-row {
          display: flex;
          border-bottom: 1px solid #e9ecef;
          min-height: 56px;
          align-items: center;
          transition: background-color 0.2s;
        }

        .detail-row:hover {
          background-color: #f8f9fa;
        }
        
        .detail-row:last-child {
          border-bottom: none;
        }
        
        .detail-label {
          width: 35%;
          padding: 12px 16px;
          font-weight: 600;
          background: linear-gradient(to right, #f8f9fa, #ffffff);
          border-right: 1px solid #e9ecef;
          color: #495057;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        
        .detail-value {
          flex: 1;
          padding: 12px 16px;
          background: white;
          display: flex;
          align-items: center;
          color: #212529;
          font-size: 14px;
          font-weight: 500;
        }
        
        @media (max-width: 768px) {
          .detail-row {
            flex-direction: column;
            align-items: flex-start;
            min-height: auto;
          }
          
          .detail-label {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid #e9ecef;
            padding: 8px 12px;
          }
          
          .detail-value {
            width: 100%;
            padding: 8px 12px;
          }
        }
      `}</style>
    </Container>
  );
};

export default ModuleDetail;