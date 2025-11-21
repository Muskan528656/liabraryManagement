import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
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
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [relatedData, setRelatedData] = useState({});
  const moduleNameFromUrl = window.location.pathname.split("/")[1];
 console.log('moduleNameFromUrl' , moduleNameFromUrl)
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

  console.log("Current Data State:", data);
  console.log("Loading State:", loading);

  const fetchData = async () => {
    try {
      console.log("Fetching data for:", { moduleApi, id });

      const api = new DataApi(moduleApi);
      const response = await api.fetchById(id);

      console.log("Full API Response:", response);

      if (response) {
        // Handle different response formats
        if (response.success && response.data) {
          setData(response.data);
        } else if (response.data && response.data.success && response.data.data) {
          setData(response.data.data);
        } else if (response.data) {
          setData(response.data);
        } else if (response.id) {
          setData(response);
        } else {
          console.warn("Unexpected response format:", response);
          setData(response); // Set whatever we got
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
      for (const relatedModule of relatedModules) {
        try {
          const api = new DataApi(relatedModule.api);
          const response = await api.get(relatedModule.endpoint ? relatedModule.endpoint(id) : `/${id}`);
          if (response && response.data) {
            const responseData = response.data.success ? response.data.data : response.data;
            relatedDataObj[relatedModule.key] = Array.isArray(responseData) ? responseData : [responseData];
          }
        } catch (error) {
          console.error(`Error fetching related ${relatedModule.label}:`, error);
          relatedDataObj[relatedModule.key] = [];
        }
      }
      setRelatedData(relatedDataObj);
    } catch (error) {
      console.error("Error fetching related data:", error);
    }
  };

  const formatValue = (value, field) => {
    if (value === null || value === undefined || value === "") return "—";

    console.log(`Formatting field: ${field.key}, value:`, value, "type:", field.type);

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
      navigate(`/${moduleName}?edit=${id}`);
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

  // Debug: Check what fields are available in data
  console.log("Available data fields:", Object.keys(data));
  console.log("Fields configuration:", fields);

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
                    {moduleLabel} Details
                  </h4>
                  <p style={{ margin: "8px 0 0 0", color: "#6c757d", fontSize: "14px" }}>
                    ID: {id}
                  </p>
                </div>
                <div>
                  <Button variant="outline-primary" onClick={handleEdit} className="me-2">
                    <i className="fa-solid fa-edit me-2"></i>
                    Edit
                  </Button>
                  <Button variant="outline-danger" onClick={handleDelete}>
                    <i className="fa-solid fa-trash me-2"></i>
                    Delete
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Card>
          <Card.Body style={{ textAlign: "center", padding: "24px" }}>
            <h4>Your Data Title</h4>
            <p>This is where your data will appear</p>

            {data && (
              <div>
                <p><strong>ID:</strong> {data.id}</p>
                <p><strong>Name:</strong> {data.name}</p>
                <p><strong>Email:</strong> {data.email}</p>
              </div>
            )}

            {fields && fields.details && data && (
              <div>
                {fields.details.map((field, index) => (
                  <div key={index} style={{ marginBottom: "10px" }}>
                    <strong>{field.label}:</strong> {data[field.key]}
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </Row>
      {/* Main Details Section */}
      {fields && fields.details && (
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
                      <div className="detail-section">
                        {fields.details.slice(0, Math.ceil(fields.details.length / 2)).map((field, index) => {
                          const value = data[field.key];
                          console.log(`Rendering field: ${field.key}, value:`, value);

                          return (
                            <div key={index} className="detail-row">
                              <div className="detail-label">{field.label}</div>
                              <div className="detail-value">
                                {formatValue(value, field)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Col>

                    <Col md={6}>
                      <div className="detail-section">
                        {fields.details.slice(Math.ceil(fields.details.length / 2)).map((field, index) => {
                          const value = data[field.key];
                          console.log(`Rendering field: ${field.key}, value:`, value);

                          return (
                            <div key={index} className="detail-row">
                              <div className="detail-label">{field.label}</div>
                              <div className="detail-value">
                                {formatValue(value, field)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Col>
                  </Row>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

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
                  {relatedModules.map((relatedModule, idx) => (
                    <div key={idx} className={idx > 0 ? "mt-4 pt-4" : ""} style={idx > 0 ? { borderTop: "1px solid #e9ecef" } : {}}>
                      <h6 style={{
                        marginBottom: "16px",
                        color: "#495057",
                        fontSize: "14px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>
                        {relatedModule.label}
                      </h6>
                      {relatedData[relatedModule.key] && relatedData[relatedModule.key].length > 0 ? (
                        relatedModule.render ? (
                          relatedModule.render(relatedData[relatedModule.key], data)
                        ) : (
                          <div className="table-responsive">
                            <table style={{
                              width: "100%",
                              fontSize: "14px",
                              borderCollapse: "collapse"
                            }}>
                              <thead>
                                <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #e9ecef" }}>
                                  {relatedModule.columns?.map((col, colIdx) => (
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
                                {relatedData[relatedModule.key].map((item, itemIdx) => (
                                  <tr
                                    key={itemIdx}
                                    style={{
                                      borderBottom: "1px solid #e9ecef",
                                      transition: "background-color 0.2s"
                                    }}
                                    onMouseEnter={(e) => e.target.parentElement.style.background = "#f8f9fa"}
                                    onMouseLeave={(e) => e.target.parentElement.style.background = "transparent"}
                                  >
                                    {relatedModule.columns?.map((col, colIdx) => (
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
                            No {relatedModule.label.toLowerCase()} found.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
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