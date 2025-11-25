import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ModuleDetail from "../common/ModuleDetail";
import DataApi from "../../api/dataApi";
import {
  Card,
  Row,
  Col,
  Badge,
  Button,
  Container,
  Form,
} from "react-bootstrap";
import PubSub from "pubsub-js";
import JsBarcode from "jsbarcode";
import ScrollToTop from "../common/ScrollToTop";

const LibraryCardDetail = ({
  onEdit = null,
  onDelete = null,
  externalData = {},
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cardData, setCardData] = useState(null);
  const [issuedCount, setIssuedCount] = useState(0);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState(null);
  const [data, setData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [relatedData, setRelatedData] = useState({});
  const [saving, setSaving] = useState(false);
  const [userNames, setUserNames] = useState({});
  const [lookupData, setLookupData] = useState({});
  const moduleNameFromUrl = window.location.pathname.split("/")[1];

  const moduleName = "librarycards";
  const moduleApi = "librarycard";
  const moduleLabel = "Library Card";

  useEffect(() => {
    fetchCardData();
  }, [id]);

  const fetchCardData = async () => {
    try {
      const api = new DataApi("librarycard");
      const response = await api.fetchById(id);
      if (response && response.data) {
        const card = response.data;
        setCardData(card);
        // Fetch book counts after getting card data (need user_id)
        if (card.user_id) {
          await fetchBookCounts(card.user_id, id);
        }
      }
    } catch (error) {
      console.error("Error fetching library card:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to fetch library card details",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBookCounts = async (userId, cardId) => {
    try {
      // Fetch issued books count - filter by user_id or card_id
      const issueApi = new DataApi("bookissue");
      const issuesResponse = await issueApi.fetchAll();
      if (issuesResponse && issuesResponse.data) {
        const issues = Array.isArray(issuesResponse.data)
          ? issuesResponse.data
          : issuesResponse.data?.data || [];

        // Filter by user_id or card_id, and not returned
        const cardIssues = issues.filter((issue) => {
          const matchesCard =
            issue.card_id === cardId ||
            issue.library_card_id === cardId ||
            issue.cardId === cardId;
          const matchesUser =
            issue.issued_to === userId ||
            issue.user_id === userId ||
            issue.student_id === userId;
          const isActive =
            !issue.return_date &&
            issue.status !== "returned" &&
            issue.status !== "submitted";

          return (matchesCard || matchesUser) && isActive;
        });
        setIssuedCount(cardIssues.length);
      }

      // Fetch submitted books count
      const submissionApi = new DataApi("book_submissions");
      const submissionsResponse = await submissionApi.fetchAll();
      if (submissionsResponse && submissionsResponse.data) {
        const submissions = Array.isArray(submissionsResponse.data)
          ? submissionsResponse.data
          : submissionsResponse.data?.data || [];

        // Filter by user_id or card_id
        const cardSubmissions = submissions.filter((submission) => {
          const matchesCard =
            submission.card_id === cardId ||
            submission.library_card_id === cardId;
          const matchesUser =
            submission.issued_to === userId ||
            submission.user_id === userId ||
            submission.student_id === userId;
          return matchesCard || matchesUser;
        });
        setSubmittedCount(cardSubmissions.length);
      }
    } catch (error) {
      console.error("Error fetching book counts:", error);
    }
  };

  const fields = {
    title: "card_number",
    subtitle: "user_email",
    details: [
      { key: "card_number", label: "Card Number", type: "text" },
      { key: "user_name", label: "User Name", type: "text" },
      { key: "user_email", label: "Email", type: "text" },
      { key: "issue_date", label: "Issue Date", type: "date" },
      { key: "expiry_date", label: "Submission Date", type: "date" },
      {
        key: "is_active",
        label: "Status",
        type: "badge",
        badgeConfig: {
          true: "success",
          false: "secondary",
          true_label: "Active",
          false_label: "Inactive",
        },
      },
    ],
     other: [
      { key: "createdbyid", label: "Created By", type: "text" },
      { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },
      { key: "createddate", label: "Created Date", type: "date" },
      { key: "lastmodifieddate", label: "Last Modified Date", type: "date" },
      
     ],
  };

  const [showBack, setShowBack] = useState(false);
  const frontBarcodeRef = useRef(null);
  const backBarcodeRef = useRef(null);

  useEffect(() => {
    if (cardData && frontBarcodeRef.current) {
      const cardNumber = cardData.card_number || cardData.id;
      try {
        JsBarcode(frontBarcodeRef.current, cardNumber, {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: true,
          text: cardNumber,
          fontSize: 12,
          margin: 5,
        });
      } catch (error) {
        console.error("Error generating front barcode:", error);
      }
    }
    if (cardData && backBarcodeRef.current) {
      const cardNumber = cardData.card_number || cardData.id;
      try {
        JsBarcode(backBarcodeRef.current, cardNumber, {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: true,
          text: cardNumber,
          fontSize: 12,
          margin: 5,
        });
      } catch (error) {
        console.error("Error generating back barcode:", error);
      }
    }
  }, [cardData, showBack]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-GB");
    } catch {
      return "Invalid Date";
    }
  };

  const customSections = [
    {
      title: "ID Card Preview",
      colSize: 12,
      render: (data) => (
        <div>
          {!showBack ? (
            // Front Card View
            <Card
              style={{
                maxWidth: "400px",
                margin: "0 auto",
                border: "2px solid #6f42c1",
                borderRadius: "15px",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                height: "520px",
              }}
            >
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                  color: "white",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <h4 style={{ margin: 0, fontWeight: "bold" }}>LIBRARY CARD</h4>
              </div>
              <Card.Body style={{ padding: "20px" }}>
                <div className="text-center mb-3">
                  {data?.image || data?.user_image ? (
                    <img
                      src={data?.image || data?.user_image || "/default-user.png"}
                      alt={data?.user_name || "User"}
                      style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "4px solid #6f42c1",
                        marginBottom: "10px",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        background: "#f0f0f0",
                        margin: "0 auto 10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "4px solid #6f42c1",
                      }}
                    >
                      <i
                        className="fa-solid fa-user"
                        style={{ fontSize: "48px", color: "#6f42c1" }}
                      ></i>
                    </div>
                  )}
                </div>

                <div style={{ textAlign: "center", marginBottom: "15px" }}>
                  <h5
                    style={{
                      margin: "5px 0",
                      color: "#6f42c1",
                      fontWeight: "bold",
                    }}
                  >
                    {data?.user_name || "N/A"}
                  </h5>
                  <p
                    style={{
                      margin: "5px 0",
                      color: "#6c757d",
                      fontSize: "14px",
                    }}
                  >
                    {data?.user_email || "N/A"}
                  </p>
                  <p
                    style={{
                      margin: "5px 0",
                      color: "#6c757d",
                      fontSize: "12px",
                    }}
                  >
                    Card: {data?.card_number || "N/A"}
                  </p>
                </div>

                <div
                  style={{
                    border: "1px solid #e9ecef",
                    borderRadius: "8px",
                    padding: "15px",
                    background: "#f8f9fa",
                    marginTop: "15px",
                  }}
                >
                  <svg
                    ref={frontBarcodeRef}
                    style={{ width: "100%", height: "60px" }}
                  ></svg>
                </div>

                <div
                  style={{
                    marginTop: "15px",
                    padding: "10px",
                    background: "#f8f9fa",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#6c757d",
                    textAlign: "center",
                  }}
                >
                  <p style={{ margin: "5px 0" }}>
                    <strong>Issue Date:</strong> {formatDate(data?.issue_date)}
                  </p>
                  {data?.expiry_date && (
                    <p style={{ margin: "5px 0" }}>
                      <strong>Submission Date:</strong>{" "}
                      {formatDate(data?.expiry_date)}
                    </p>
                  )}
                </div>
              </Card.Body>
            </Card>
          ) : (
            // Back Card View
            <Card
              style={{
                maxWidth: "400px",
                margin: "0 auto",
                border: "2px solid #6f42c1",
                borderRadius: "15px",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                  color: "white",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <h4 style={{ margin: 0, fontWeight: "bold" }}>LIBRARY CARD</h4>
              </div>
              <Card.Body style={{ padding: "20px" }}>
                <div
                  style={{
                    border: "1px solid #e9ecef",
                    borderRadius: "8px",
                    padding: "15px",
                    background: "#f8f9fa",
                    marginBottom: "15px",
                  }}
                >
                  <svg
                    ref={backBarcodeRef}
                    style={{ width: "100%", height: "60px" }}
                  ></svg>
                </div>

                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "15px",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                >
                  <h6
                    style={{
                      color: "#6f42c1",
                      marginBottom: "10px",
                      fontWeight: "bold",
                    }}
                  >
                    Card Information
                  </h6>
                  <p style={{ margin: "5px 0" }}>
                    <strong>Card Number:</strong> {data?.card_number || "N/A"}
                  </p>
                  <p style={{ margin: "5px 0" }}>
                    <strong>Member Name:</strong> {data?.user_name || "N/A"}
                  </p>
                  <p style={{ margin: "5px 0" }}>
                    <strong>Email:</strong> {data?.user_email || "N/A"}
                  </p>
                  <p style={{ margin: "5px 0" }}>
                    <strong>Issue Date:</strong> {formatDate(data?.issue_date)}
                  </p>
                  {data?.expiry_date && (
                    <p style={{ margin: "5px 0" }}>
                      <strong>Submission Date:</strong>{" "}
                      {formatDate(data?.expiry_date)}
                    </p>
                  )}
                  <p style={{ margin: "5px 0" }}>
                    <strong>Status:</strong>{" "}
                    <Badge bg={data?.is_active ? "success" : "secondary"}>
                      {data?.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </p>
                </div>

                <div
                  style={{
                    marginTop: "15px",
                    padding: "10px",
                    background: "#fff3cd",
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "#856404",
                    textAlign: "center",
                    border: "1px solid #ffc107",
                  }}
                >
                  <p style={{ margin: 0 }}>
                    <i className="fa-solid fa-info-circle me-1"></i>
                    Scan barcode to verify membership
                  </p>
                </div>
              </Card.Body>
            </Card>
          )}
          <div className="text-center mt-3">
            <Button
              variant={!showBack ? "primary" : "outline-primary"}
              className="me-2"
              onClick={() => setShowBack(false)}
            >
              <i className="fa-solid fa-id-card me-2"></i>
              Front View
            </Button>
            <Button
              variant={showBack ? "primary" : "outline-primary"}
              onClick={() => setShowBack(true)}
            >
              <i className="fa-solid fa-id-card me-2"></i>
              Back View
            </Button>
          </div>
        </div>
      ),
    },
  ];

  const bookStatistics = [
    {
      title: "Book Statistics",
      colSize: 12,
      render: (data) => (
        <Row className="mt-3">
          <Col md={6}>
            <Card
              className="text-center"
              style={{ border: "2px solid #28a745" }}
            >
              <Card.Body>
                <h3 style={{ color: "#28a745", margin: 0 }}>{issuedCount}</h3>
                <p className="text-muted mb-0">Books Issued</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card
              className="text-center"
              style={{ border: "2px solid #17a2b8" }}
            >
              <Card.Body>
                <h3 style={{ color: "#17a2b8", margin: 0 }}>
                  {submittedCount}
                </h3>
                <p className="text-muted mb-0">Books Submitted</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // First try to fetch main data
        await fetchData();
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

  const fetchData = async () => {
    try {
      const api = new DataApi(moduleApi);
      const response = await api.fetchById(id);
      let fetchedData = null;
      if (response && response.data) {
        const responseData = response.data;
        if (responseData.success && responseData.data) {
          fetchedData = responseData.data;
        } else if (
          responseData.data &&
          responseData.data?.success &&
          responseData.data?.data
        ) {
          fetchedData = responseData?.data?.data;
        } else if (responseData.data) {
          fetchedData = responseData.data;
        } else if (responseData.id) {
          fetchedData = responseData;
        } else if (Array.isArray(responseData) && responseData.length > 0) {
          fetchedData = responseData[0];
        } else {
          // Direct data object
          fetchedData = responseData;
        }
      } else {
        throw new Error("No response received from API");
      }
      
      if (fetchedData) {
        setData(fetchedData);
        setOriginalData(JSON.parse(JSON.stringify(fetchedData)));
        
        // Fetch user names for createdbyid and lastmodifiedbyid
        const userIds = [];
        if (fetchedData.createdbyid) userIds.push(fetchedData.createdbyid);
        if (fetchedData.lastmodifiedbyid && fetchedData.lastmodifiedbyid !== fetchedData.createdbyid) {
          userIds.push(fetchedData.lastmodifiedbyid);
        }
        
        if (userIds.length > 0) {
          await fetchUserNames(userIds);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${moduleLabel}:`, error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: `Failed to fetch ${moduleLabel} details`,
      });
    }
  };

  const fetchUserNames = async (userIds) => {
    try {
      const userApi = new DataApi("user");
      const names = {};
      for (const userId of userIds) {
        try {
          const response = await userApi.fetchById(userId);
          if (response && response.data) {
            const user = response.data.success ? response.data.data : response.data;
            if (user) {
              names[userId] = `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.email || `User ${userId}`;
            }
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
          names[userId] = `User ${userId}`;
        }
      }
      setUserNames(names);
    } catch (error) {
      console.error("Error fetching user names:", error);
    }
  };

  const formatValue = (value, field) => {
    if (value === null || value === undefined || value === "") return "—";

    console.log(
      `Formatting field: ${field.key}, value:`,
      value,
      "type:",
      field.type
    );

    // Check if this field has lookup navigation configured

    if (field.type === "date") {
      try {
        const date = new Date(value);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
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
      const label =
        badgeConfig[`${value}_label`] || (value ? "Active" : "Inactive");
      return <Badge bg={bgColor}>{label}</Badge>;
    }
    if (field.type === "currency") {
      return `₹${parseFloat(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    if (field.type === "number") {
      return parseFloat(value).toLocaleString("en-IN");
    }
    if (field.render && typeof field.render === "function") {
      return field.render(value, data);
    }
    return String(value);
  };

  const handleEdit = async () => {
    if (onEdit) {
      onEdit(data);
    } else {
      // Enable inline editing
      setIsEditing(true);
      setTempData({ ...data });
      
      // Fetch lookup field data for dropdowns
      await fetchLookupData();
    }
  };

  const fetchLookupData = async () => {
    try {
      const normalizedFields = {
        details: fields?.details || [],
        other: fields?.other || [],
      };
      
      const allFields = [...(normalizedFields.details || []), ...(normalizedFields.other || [])];
      const lookupFields = allFields.filter(field => 
        field.type === "select" && field.options && typeof field.options === "string"
      );
      
      const lookupDataObj = {};
      const endpointMap = {
        authors: "author",
        author: "author",
        categories: "category",
        category: "category",
        users: "user",
        user: "user",
        departments: "department"
      };
      
      for (const field of lookupFields) {
        if (!lookupDataObj[field.options]) {
          try {
            const endpoint = endpointMap[field.options] || field.options;
            const api = new DataApi(endpoint);
            const response = await api.fetchAll();
            if (response && response.data) {
              lookupDataObj[field.options] = Array.isArray(response.data) ? response.data : [];
            }
          } catch (error) {
            console.error(`Error fetching lookup data for ${field.options}:`, error);
            lookupDataObj[field.options] = [];
          }
        }
      }
      
      setLookupData(lookupDataObj);
    } catch (error) {
      console.error("Error fetching lookup data:", error);
    }
  };

  const hasDataChanged = () => {
    if (!originalData || !tempData) return false;
    
    // Deep comparison of objects
    const originalStr = JSON.stringify(originalData);
    const tempStr = JSON.stringify(tempData);
    
    return originalStr !== tempStr;
  };

  const formatDateDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return '';
    }
  };

  const handleSave = async () => {
    // Check if data has changed
    if (!hasDataChanged()) {
      setIsEditing(false);
      setTempData(null);
      return; // No toast if no changes
    }
    
    try {
      setSaving(true);
      const api = new DataApi(moduleApi);
      const response = await api.update(tempData, id);

      if (response && response.data) {
        const responseData = response.data;
        let updatedData = null;
        if (responseData.success && responseData.data) {
          updatedData = responseData.data;
        } else if (responseData.data) {
          updatedData = responseData.data;
        } else {
          updatedData = responseData;
        }
        
        setData(updatedData);
        setOriginalData(JSON.parse(JSON.stringify(updatedData)));

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
        [fieldKey]: value,
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
          return date.toISOString().split("T")[0]; // YYYY-MM-DD format
        } catch {
          return value;
        }
      }
      if (field.type === "datetime" && value) {
        try {
          const date = new Date(value);
          // Convert to datetime-local format (YYYY-MM-DDTHH:mm)
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch {
          return value;
        }
      }
      return value || "";
    } else {
      // For display mode, use formatValue
      // Special handling for createdbyid and lastmodifiedbyid
      if ((field.key === "createdbyid" || field.key === "lastmodifiedbyid") && value) {
        return userNames[value] || value || "—";
      }
      return formatValue(value, field) || "—";
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      onDelete(data);
    } else {
      if (
        window.confirm(`Are you sure you want to delete this ${moduleLabel}?`)
      ) {
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

  const normalizedFields = Array.isArray(fields)
    ? { details: fields }
    : fields || {};

  return (
    // <ModuleDetail
    //   moduleName="librarycards"
    //   moduleApi="librarycard"
    //   moduleLabel="Library Card"
    //   fields={fields}
    //   customSections={customSections}
    //   bookStatistics={bookStatistics}
    // />
    <Container fluid className="py-4">
      <ScrollToTop />
      <Row className="justify-content-center">
        <Col lg={12} xl={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div
                className="d-flex justify-content-between align-items-center mb-4 p-4"
                style={{
                  color: "var(--primary-color)",
                  background: "var(--primary-background-color)",
                  borderRadius: "10px",
                }}
              >
                <h2
                  className="fw-bold mb-1"
                  style={{ color: "var(--primary-color)" }}
                >
                  Library Card
                </h2>
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
                      >
                        <i className="fa-solid fa-check me-2"></i>
                        {saving ? "Saving..." : hasDataChanged() ? `Save - ${formatDateDDMMYYYY(new Date())}` : "Save"}
                      </button>
                      <button
                        className="custom-btn-secondary "
                        onClick={handleCancel}
                        disabled={saving}
                      >
                        <i className="fa-solid fa-times me-2"></i>
                        Cancel
                      </button>
                    </div>
                  )}
                  {!isEditing && (
                    <Button
                      variant="outline-danger"
                      onClick={handleDelete}
                      className="ms-2"
                    >
                      <i className="fa-solid fa-trash me-2"></i>
                      Delete
                    </Button>
                  )}
                </div>
              </div>
              <Row className="mt-4 pe-0">
                  {/* Overview Section */}
                  {normalizedFields &&
                    normalizedFields.details &&
                    moduleName === "librarycards" && (
                      <>
                          <Col md={9}>
                            <h5
                              className="mb-4 fw-bold mb-0 d-flex align-items-center justify-content-between p-3 border rounded"
                              style={{
                                color: "var(--primary-color)",
                                background: "var(--header-highlighter-color)",
                                borderRadius: "10px",
                              }}
                            >
                              {moduleLabel} Information
                            </h5>
                            <Row className="px-5">
                              <Col md={6}>
                                {normalizedFields.details
                                  ?.slice(
                                    0,
                                    Math.ceil(
                                      normalizedFields.details.length / 2
                                    )
                                  )
                                  .map((field, index) => {
                                    const currentData = isEditing
                                      ? tempData
                                      : data;

                                    // Handle select/dropdown fields
                                    if (
                                      field.type === "select" &&
                                      field.options &&
                                      (externalData[field.options] || lookupData[field.options])
                                    ) {
                                      const options =
                                        externalData[field.options] || lookupData[field.options] || [];
                                      const currentValue = currentData
                                        ? currentData[field.key]
                                        : null;

                                      return (
                                        <Form.Group
                                          key={index}
                                          className="mb-3"
                                        >
                                          <Form.Label className="fw-semibold">
                                            {field.label}
                                          </Form.Label>
                                          {isEditing ? (
                                            <Form.Select
                                              value={currentValue || ""}
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  field.key,
                                                  e.target.value || null
                                                )
                                              }
                                              style={{
                                                background: "white",
                                              }}
                                            >
                                              <option value="">
                                                Select {field.label}
                                              </option>
                                              {options.map((option) => (
                                                <option
                                                  key={option.id}
                                                  value={option.id}
                                                >
                                                  {option.name ||
                                                    option.title ||
                                                    option.email ||
                                                    `Item ${option.id}`}
                                                </option>
                                              ))}
                                            </Form.Select>
                                          ) : (
                                            <Form.Control
                                              type="text"
                                              value={(() => {
                                                if (field.displayKey && data) {
                                                  return (
                                                    data[field.displayKey] ||
                                                    "—"
                                                  );
                                                }
                                                const selected = options.find(
                                                  (opt) =>
                                                    opt.id === currentValue
                                                );
                                                return selected
                                                  ? selected.name ||
                                                      selected.title ||
                                                      selected.email ||
                                                      "—"
                                                  : "—";
                                              })()}
                                              readOnly
                                              style={{
                                                background:
                                                  "var(--header-highlighter-color, #f8f9fa)",
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
                                        <Form.Label className="fw-semibold">
                                          {field.label}
                                        </Form.Label>
                                        <Form.Control
                                          type={
                                            field.type === "number"
                                              ? "number"
                                              : field.type === "date"
                                              ? "date"
                                              : field.type === "datetime"
                                              ? "datetime-local"
                                              : "text"
                                          }
                                          value={getFieldValue(
                                            field,
                                            currentData
                                          )}
                                          readOnly={!isEditing}
                                          onChange={(e) => {
                                            if (isEditing) {
                                              let newValue = e.target.value;
                                              if (field.type === "number") {
                                                newValue = newValue
                                                  ? parseFloat(newValue)
                                                  : null;
                                              } else if (
                                                field.type === "date" &&
                                                newValue
                                              ) {
                                                newValue = newValue;
                                              } else if (
                                                field.type === "datetime" &&
                                                newValue
                                              ) {
                                                newValue = new Date(
                                                  newValue
                                                ).toISOString();
                                              }
                                              handleFieldChange(
                                                field.key,
                                                newValue
                                              );
                                            }
                                          }}
                                          style={{
                                            background: !isEditing
                                              ? "var(--header-highlighter-color, #f8f9fa)"
                                              : "white",
                                            pointerEvents: isEditing
                                              ? "auto"
                                              : "none",
                                            opacity: isEditing ? 1 : 0.9,
                                          }}
                                        />
                                      </Form.Group>
                                    );
                                  })}
                              </Col>
                              <Col md={6}>
                                {normalizedFields.details
                                  .slice(
                                    Math.ceil(
                                      normalizedFields.details.length / 2
                                    )
                                  )
                                  .map((field, index) => {
                                    const currentData = isEditing
                                      ? tempData
                                      : data;

                                    // Handle select/dropdown fields
                                    if (
                                      field.type === "select" &&
                                      field.options &&
                                      (externalData[field.options] || lookupData[field.options])
                                    ) {
                                      const options =
                                        externalData[field.options] || lookupData[field.options] || [];
                                      const currentValue = currentData
                                        ? currentData[field.key]
                                        : null;

                                      return (
                                        <Form.Group
                                          key={index}
                                          className="mb-3"
                                        >
                                          <Form.Label className="fw-semibold">
                                            {field.label}
                                          </Form.Label>
                                          {isEditing ? (
                                            <Form.Select
                                              value={currentValue || ""}
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  field.key,
                                                  e.target.value || null
                                                )
                                              }
                                              style={{
                                                background: "white",
                                              }}
                                            >
                                              <option value="">
                                                Select {field.label}
                                              </option>
                                              {options.map((option) => (
                                                <option
                                                  key={option.id}
                                                  value={option.id}
                                                >
                                                  {option.name ||
                                                    option.title ||
                                                    option.email ||
                                                    `Item ${option.id}`}
                                                </option>
                                              ))}
                                            </Form.Select>
                                          ) : (
                                            <Form.Control
                                              type="text"
                                              value={(() => {
                                                if (field.displayKey && data) {
                                                  return (
                                                    data[field.displayKey] ||
                                                    "—"
                                                  );
                                                }
                                                const selected = options.find(
                                                  (opt) =>
                                                    opt.id === currentValue
                                                );
                                                return selected
                                                  ? selected.name ||
                                                      selected.title ||
                                                      selected.email ||
                                                      "—"
                                                  : "—";
                                              })()}
                                              readOnly
                                              style={{
                                                background:
                                                  "var(--header-highlighter-color, #f8f9fa)",
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
                                        <Form.Label className="fw-semibold">
                                          {field.label}
                                        </Form.Label>
                                        <Form.Control
                                          type={
                                            field.type === "number"
                                              ? "number"
                                              : field.type === "date"
                                              ? "date"
                                              : field.type === "datetime"
                                              ? "datetime-local"
                                              : "text"
                                          }
                                          value={getFieldValue(
                                            field,
                                            currentData
                                          )}
                                          readOnly={!isEditing}
                                          onChange={(e) => {
                                            if (isEditing) {
                                              let newValue = e.target.value;
                                              if (field.type === "number") {
                                                newValue = newValue
                                                  ? parseFloat(newValue)
                                                  : null;
                                              } else if (
                                                field.type === "date" &&
                                                newValue
                                              ) {
                                                newValue = newValue;
                                              } else if (
                                                field.type === "datetime" &&
                                                newValue
                                              ) {
                                                newValue = new Date(
                                                  newValue
                                                ).toISOString();
                                              }
                                              handleFieldChange(
                                                field.key,
                                                newValue
                                              );
                                            }
                                          }}
                                          style={{
                                            background: !isEditing
                                              ? "var(--header-highlighter-color, #f8f9fa)"
                                              : "white",
                                            pointerEvents: isEditing
                                              ? "auto"
                                              : "none",
                                            opacity: isEditing ? 1 : 0.9,
                                          }}
                                        />
                                      </Form.Group>
                                    );
                                  })}
                              </Col>
                            </Row>
                              <Col className="pt-4">
                                <h5
                                  className="mb-4 fw-bold mb-0 d-flex align-items-center justify-content-between p-3 border rounded"
                                  style={{
                                    color: "var(--primary-color)",
                                    background: "var(--header-highlighter-color)",
                                    borderRadius: "10px",
                                  }}
                                >
                                  Others
                                </h5>
                                <Row className="px-5">
                                  <Col md={6}>
                                    {normalizedFields.other
                                      ?.slice(
                                        0,
                                        Math.ceil(
                                          normalizedFields.other.length / 2
                                        )
                                      )
                                      .map((field, index) => {
                                        const currentData = isEditing
                                          ? tempData
                                          : data;

                                        // Handle select/dropdown fields
                                        if (
                                          field.type === "select" &&
                                          field.options &&
                                          externalData[field.options]
                                        ) {
                                          const options =
                                            externalData[field.options] || [];
                                          const currentValue = currentData
                                            ? currentData[field.key]
                                            : null;

                                          return (
                                            <Form.Group
                                              key={index}
                                              className="mb-3"
                                            >
                                              <Form.Label className="fw-semibold">
                                                {field.label}
                                              </Form.Label>
                                              {isEditing ? (
                                                <Form.Select
                                                  value={currentValue || ""}
                                                  onChange={(e) =>
                                                    handleFieldChange(
                                                      field.key,
                                                      e.target.value || null
                                                    )
                                                  }
                                                  style={{
                                                    background: "white",
                                                  }}
                                                >
                                                  <option value="">
                                                    Select {field.label}
                                                  </option>
                                                  {options.map((option) => (
                                                    <option
                                                      key={option.id}
                                                      value={option.id}
                                                    >
                                                      {option.name ||
                                                        option.title ||
                                                        option.email ||
                                                        `Item ${option.id}`}
                                                    </option>
                                                  ))}
                                                </Form.Select>
                                              ) : (
                                                <Form.Control
                                                  type="text"
                                                  value={(() => {
                                                    if (field.displayKey && data) {
                                                      return (
                                                        data[field.displayKey] ||
                                                        "—"
                                                      );
                                                    }
                                                    const selected = options.find(
                                                      (opt) =>
                                                        opt.id === currentValue
                                                    );
                                                    return selected
                                                      ? selected.name ||
                                                          selected.title ||
                                                          selected.email ||
                                                          "—"
                                                      : "—";
                                                  })()}
                                                  readOnly
                                                  style={{
                                                    background:
                                                      "var(--header-highlighter-color, #f8f9fa)",
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
                                            <Form.Label className="fw-semibold">
                                              {field.label}
                                            </Form.Label>
                                            <Form.Control
                                              type={
                                                field.type === "number"
                                                  ? "number"
                                                  : field.type === "date"
                                                  ? "date"
                                                  : field.type === "datetime"
                                                  ? "datetime-local"
                                                  : "text"
                                              }
                                              value={getFieldValue(
                                                field,
                                                currentData
                                              )}
                                              readOnly={!isEditing}
                                              onChange={(e) => {
                                                if (isEditing) {
                                                  let newValue = e.target.value;
                                                  if (field.type === "number") {
                                                    newValue = newValue
                                                      ? parseFloat(newValue)
                                                      : null;
                                                  } else if (
                                                    field.type === "date" &&
                                                    newValue
                                                  ) {
                                                    newValue = newValue;
                                                  } else if (
                                                    field.type === "datetime" &&
                                                    newValue
                                                  ) {
                                                    newValue = new Date(
                                                      newValue
                                                    ).toISOString();
                                                  }
                                                  handleFieldChange(
                                                    field.key,
                                                    newValue
                                                  );
                                                }
                                              }}
                                              style={{
                                                background: !isEditing
                                                  ? "var(--header-highlighter-color, #f8f9fa)"
                                                  : "white",
                                                pointerEvents: isEditing
                                                  ? "auto"
                                                  : "none",
                                                opacity: isEditing ? 1 : 0.9,
                                              }}
                                            />
                                          </Form.Group>
                                        );
                                      })}
                                  </Col>
                                  <Col md={6}>
                                    {normalizedFields.other
                                      .slice(
                                        Math.ceil(
                                          normalizedFields.other.length / 2
                                        )
                                      )
                                      .map((field, index) => {
                                        const currentData = isEditing
                                          ? tempData
                                          : data;

                                        // Handle select/dropdown fields
                                        if (
                                          field.type === "select" &&
                                          field.options &&
                                          externalData[field.options]
                                        ) {
                                          const options =
                                            externalData[field.options] || [];
                                          const currentValue = currentData
                                            ? currentData[field.key]
                                            : null;

                                          return (
                                            <Form.Group
                                              key={index}
                                              className="mb-3"
                                            >
                                              <Form.Label className="fw-semibold">
                                                {field.label}
                                              </Form.Label>
                                              {isEditing ? (
                                                <Form.Select
                                                  value={currentValue || ""}
                                                  onChange={(e) =>
                                                    handleFieldChange(
                                                      field.key,
                                                      e.target.value || null
                                                    )
                                                  }
                                                  style={{
                                                    background: "white",
                                                  }}
                                                >
                                                  <option value="">
                                                    Select {field.label}
                                                  </option>
                                                  {options.map((option) => (
                                                    <option
                                                      key={option.id}
                                                      value={option.id}
                                                    >
                                                      {option.name ||
                                                        option.title ||
                                                        option.email ||
                                                        `Item ${option.id}`}
                                                    </option>
                                                  ))}
                                                </Form.Select>
                                              ) : (
                                                <Form.Control
                                                  type="text"
                                                  value={(() => {
                                                    if (field.displayKey && data) {
                                                      return (
                                                        data[field.displayKey] ||
                                                        "—"
                                                      );
                                                    }
                                                    const selected = options.find(
                                                      (opt) =>
                                                        opt.id === currentValue
                                                    );
                                                    return selected
                                                      ? selected.name ||
                                                          selected.title ||
                                                          selected.email ||
                                                          "—"
                                                      : "—";
                                                  })()}
                                                  readOnly
                                                  style={{
                                                    background:
                                                      "var(--header-highlighter-color, #f8f9fa)",
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
                                            <Form.Label className="fw-semibold">
                                              {field.label}
                                            </Form.Label>
                                            <Form.Control
                                              type={
                                                field.type === "number"
                                                  ? "number"
                                                  : field.type === "date"
                                                  ? "date"
                                                  : field.type === "datetime"
                                                  ? "datetime-local"
                                                  : "text"
                                              }
                                              value={getFieldValue(
                                                field,
                                                currentData
                                              )}
                                              readOnly={!isEditing}
                                              onChange={(e) => {
                                                if (isEditing) {
                                                  let newValue = e.target.value;
                                                  if (field.type === "number") {
                                                    newValue = newValue
                                                      ? parseFloat(newValue)
                                                      : null;
                                                  } else if (
                                                    field.type === "date" &&
                                                    newValue
                                                  ) {
                                                    newValue = newValue;
                                                  } else if (
                                                    field.type === "datetime" &&
                                                    newValue
                                                  ) {
                                                    newValue = new Date(
                                                      newValue
                                                    ).toISOString();
                                                  }
                                                  handleFieldChange(
                                                    field.key,
                                                    newValue
                                                  );
                                                }
                                              }}
                                              style={{
                                                background: !isEditing
                                                  ? "var(--header-highlighter-color, #f8f9fa)"
                                                  : "white",
                                                pointerEvents: isEditing
                                                  ? "auto"
                                                  : "none",
                                                opacity: isEditing ? 1 : 0.9,
                                              }}
                                            />
                                          </Form.Group>
                                        );
                                      })}
                                  </Col>
                                </Row>
                              </Col>
                          </Col>
                          <Col md={3}>
                            {customSections.length > 0 &&
                              customSections.map((section, idx) => (
                                <>
                                  <h5
                                    className="mb-4 fw-bold mb-0 d-flex align-items-center justify-content-between p-3 border rounded"
                                    style={{
                                      color: "var(--primary-color)",
                                      background:
                                        "var(--header-highlighter-color)",
                                      borderRadius: "10px",
                                    }}
                                  >
                                    {section.title}
                                  </h5>
                                    <Col md={section.colSize || 12}>
                                      {section.render
                                        ? section.render(data)
                                        : section.content}
                                    </Col>
                                </>
                              ))}
                          </Col>
                          {bookStatistics.length > 0 &&
                            bookStatistics.map((section, idx) => (
                                <Col md={section.colSize || 12} key={idx} className="mt-5">
                                  <h5
                                    className="mb-4 fw-bold mb-0 d-flex align-items-center justify-content-between p-3 border rounded"
                                    style={{
                                      color: "var(--primary-color)",
                                      background:
                                        "var(--header-highlighter-color)",
                                      borderRadius: "10px",
                                    }}
                                  >
                                    {section.title}
                                  </h5>
                                  {section.render
                                    ? section.render(data)
                                    : section.content}
                                </Col>
                            ))}
                      </>
                    )}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

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

export default LibraryCardDetail;
