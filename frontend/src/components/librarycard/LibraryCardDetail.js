import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import ConfirmationModal from "../common/ConfirmationModal";
import { API_BASE_URL } from "../../constants/CONSTANT";
import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";

const LibraryCardDetail = ({
  onEdit = null,
  onDelete = null,
  externalData = {},
}) => {
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [cardData, setCardData] = useState(null);
  const [issuedCount, setIssuedCount] = useState(0);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(
    location?.state?.isEdit ? location?.state?.isEdit : false
  );
  const [tempData, setTempData] = useState(null);
  const [data, setData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [userNames, setUserNames] = useState({});
  const [userAvatars, setUserAvatars] = useState({});
  const [lookupData, setLookupData] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [imagePreview, setImagePreview] = useState("/default-user.png");
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [showBack, setShowBack] = useState(false);
  const [subscriptionProgress, setSubscriptionProgress] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [companyCountryCode, setCompanyCountryCode] = useState("");

  const imageObjectUrlRef = useRef(null);
  const frontBarcodeRef = useRef(null);
  const backBarcodeRef = useRef(null);

  const moduleName = "librarycard";
  const moduleApi = "librarycard";
  const moduleLabel = "Library Card";
  const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

  const DISABLED_FIELDS_ON_EDIT = useMemo(() => new Set(), []);
  const READONLY_FIELDS_ON_EDIT = useMemo(
    () => new Set(["user_email", "card_number"]),
    []
  );

  const EDITABLE_FIELDS = useMemo(
    () => [
      "first_name",
      "last_name",
      "email",
      "country_code",
      "phone_number",
      "registration_date",
      "subscription_id",
      "is_active",
    ],
    []
  );

  const normalizedFileHost = useMemo(() => {
    if (typeof API_BASE_URL === "string" && API_BASE_URL.length > 0) {
      return API_BASE_URL.replace(/\/ibs$/, "");
    }
    return window.location.origin;
  }, []);

  const getImageUrl = useCallback(
    (imagePath) => {
      if (!imagePath || typeof imagePath !== "string") {
        return null;
      }
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
      }
      const normalizedPath = imagePath.startsWith("/")
        ? imagePath
        : `/uploads/librarycards/${imagePath}`;
      return `${normalizedFileHost}${normalizedPath}`;
    },
    [normalizedFileHost]
  );

  const CircularProgressBar = ({ progress, daysRemaining, size = 120 }) => {
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const getProgressColor = (progress) => {
      if (progress > 70) return "#28a745";
      if (progress > 30) return "#ffc107";
      return "#dc3545";
    };

    return (
      <div className="text-center">
        <div className="position-relative d-inline-block">
          <svg width={size} height={size} className="progress-ring">
            <circle
              stroke="#e9ecef"
              strokeWidth={strokeWidth}
              fill="transparent"
              r={radius}
              cx={size / 2}
              cy={size / 2}
            />
            <circle
              stroke={getProgressColor(progress)}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="transparent"
              r={radius}
              cx={size / 2}
              cy={size / 2}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </svg>
          <div
            className="position-absolute top-50 start-50 translate-middle text-center"
            style={{ width: "80px" }}
          >
            <div
              className="fw-bold"
              style={{ fontSize: "24px", color: getProgressColor(progress) }}
            >
              {daysRemaining}
            </div>
            <div className="small text-muted">Days Left</div>
          </div>
        </div>
        <div className="mt-2">
          <Badge
            bg={
              progress > 70 ? "success" : progress > 30 ? "warning" : "danger"
            }
          >
            {progress > 70
              ? "Good"
              : progress > 30
              ? "Warning"
              : "Expiring Soon"}
          </Badge>
        </div>
      </div>
    );
  };

  const calculateSubscriptionProgress = useCallback((subscriptionData) => {
    if (
      !subscriptionData ||
      !subscriptionData.start_date ||
      !subscriptionData.end_date
    ) {
      return { progress: 0, daysRemaining: 0 };
    }

    const startDate = new Date(subscriptionData.start_date);
    const endDate = new Date(subscriptionData.end_date);
    const today = new Date();

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { progress: 0, daysRemaining: 0 };
    }

    const totalDuration = endDate - startDate;
    const elapsedDuration = today - startDate;
    const remainingDuration = endDate - today;

    let progress = (elapsedDuration / totalDuration) * 100;
    progress = Math.max(0, Math.min(100, progress));

    const daysRemaining = Math.ceil(remainingDuration / (1000 * 60 * 60 * 24));

    return {
      progress: Math.round(progress),
      daysRemaining: Math.max(0, daysRemaining),
    };
  }, []);

  const UserAvatar = ({
    userId,
    size = 32,
    showName = true,
    clickable = true,
  }) => {
    const userName = userNames[userId] || `User ${userId}`;
    const userAvatar =
      userAvatars[userId] ||
      `https://ui-avatars.com/api/?name=User&background=6f42c1&color=fff&size=${size}`;

    const handleUserClick = () => {
      if (clickable && userId) {
        navigate(`/user/${userId}`);
      }
    };

    return (
      <div
        className={`d-flex align-items-center ${
          clickable ? "cursor-pointer" : ""
        }`}
        onClick={handleUserClick}
        style={{
          cursor: clickable ? "pointer" : "default",
          textDecoration: "none",
          gap: "8px",
        }}
      >
        <img
          src={userAvatar}
          alt={userName}
          className="rounded-circle"
          style={{
            width: size,
            height: size,
            objectFit: "cover",
            border: "2px solid #e9ecef",
          }}
        />
        {showName && (
          <span
            className="fw-medium"
            style={{
              color: clickable ? "var(--primary-color)" : "#495057",
              textDecoration: clickable ? "none" : "none",
            }}
            onMouseEnter={(e) => {
              if (clickable) e.target.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              if (clickable) e.target.style.textDecoration = "none";
            }}
          >
            {userName}
          </span>
        )}
      </div>
    );
  };

  // Image preview handling
  useEffect(() => {
    if (selectedImageFile) {
      return;
    }
    const fallbackImage =
      data?.image ||
      data?.user_image ||
      cardData?.image ||
      cardData?.user_image;
    const previewUrl = getImageUrl(fallbackImage) || "/default-user.png";
    setImagePreview(previewUrl);
  }, [data, cardData, selectedImageFile, getImageUrl]);

  useEffect(() => {
    return () => {
      if (imageObjectUrlRef.current) {
        URL.revokeObjectURL(imageObjectUrlRef.current);
        imageObjectUrlRef.current = null;
      }
    };
  }, []);

  // Fetch company country code
  const fetCompanyCode = async () => {
    try {
      const companyApi = new DataApi("company");
      const companyResponse = await companyApi.fetchAll();
      if (
        Array.isArray(companyResponse.data) &&
        companyResponse.data.length > 0
      ) {
        const companyWithCountryCode = companyResponse.data.find(
          (c) => c && c.country_code
        );

        if (companyWithCountryCode && companyWithCountryCode.country_code) {
          const countryCodeStr = String(
            companyWithCountryCode.country_code
          ).trim();
          const codePart = countryCodeStr.split(/[—\-]/)[0].trim();

          let finalCode = codePart || "";
          if (finalCode && !finalCode.startsWith("+")) {
            finalCode = "+" + finalCode;
          }

          setCompanyCountryCode(finalCode);
          console.log("Company country code set to:", finalCode);
        }
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
    }
  };

  useEffect(() => {
    fetCompanyCode();
  }, []);

  // Apply default country code into tempData when editing, if empty
  useEffect(() => {
    if (isEditing && companyCountryCode) {
      setTempData((prev) => {
        if (!prev) return prev;
        if (!prev.country_code) {
          return { ...prev, country_code: companyCountryCode };
        }
        return prev;
      });
    }
  }, [companyCountryCode, isEditing]);

  useEffect(() => {
    fetchCardData();
  }, [id]);

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

  useEffect(() => {
    const fetchSubscriptionProgress = async () => {
      if (data?.subscription_id) {
        try {
          const api = new DataApi("subscriptions");
          const response = await api.fetchById(data.subscription_id);
          if (response && response.data) {
            const subscriptionData = response.data.success
              ? response.data.data
              : response.data;
            const { progress, daysRemaining } =
              calculateSubscriptionProgress(subscriptionData);
            setSubscriptionProgress(progress);
            setDaysRemaining(daysRemaining);
          }
        } catch (error) {
          console.error("Error fetching subscription details:", error);
          setSubscriptionProgress(0);
          setDaysRemaining(0);
        }
      } else {
        setSubscriptionProgress(0);
        setDaysRemaining(0);
      }
    };

    fetchSubscriptionProgress();
  }, [data, calculateSubscriptionProgress]);

  const fetchCardData = async () => {
    try {
      const api = new DataApi("librarycard");
      const response = await api.fetchById(id);
      if (response && response.data) {
        const card = response.data;
        setCardData(card);
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
      const issueApi = new DataApi("bookissue");
      const issuesResponse = await issueApi.fetchAll();
      if (issuesResponse && issuesResponse.data) {
        const issues = Array.isArray(issuesResponse.data)
          ? issuesResponse.data
          : issuesResponse.data?.data || [];

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

      const submissionApi = new DataApi("book_submissions");
      const submissionsResponse = await submissionApi.fetchAll();
      if (submissionsResponse && submissionsResponse.data) {
        const submissions = Array.isArray(submissionsResponse.data)
          ? submissionsResponse.data
          : submissionsResponse.data?.data || [];

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
    details: [
      {
        key: "card_number",
        label: "Card Number",
        type: "text",
      },
      { key: "first_name", label: "First Name", type: "text" },
      { key: "last_name", label: "Last Name", type: "text" },
      { key: "email", label: "Email", type: "text" },

      {
        key: "country_code",
        label: "Country Code",
        type: "select",
        options: COUNTRY_CODES.map((c) => ({
          ...c,
          label: `${c.country_code} (${c.country})`,
          value: c.country_code,
        })),
        colSize: 3,
      },
      { key: "phone_number", label: "Phone", type: "text", colSize: 3 },
      { key: "registration_date", label: "Registration Date", type: "date" },

      {
        key: "subscription_id",
        label: "Subscription",
        type: "select",
        options: "subscriptions",
      },

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
            <Card
              style={{
                maxWidth: "400px",
                margin: "0 auto",
                border: "2px solid var(--primary-color)",
                borderRadius: "15px",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                height: "520px",
              }}
            >
              <div
                style={{
                  background: "var(--primary-color)",
                  color: "white",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <h5 style={{ margin: 0, fontWeight: "bold" }}>LIBRARY CARD</h5>
              </div>
              <Card.Body style={{ padding: "20px" }}>
                <div className="text-center mb-3">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt={data?.first_name || "User"}
                      style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "4px solid var(--primary-color)",
                        marginBottom: "10px",
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/default-user.png";
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
                        border: "4px solid var(--primary-color)",
                      }}
                    >
                      <i
                        className="fa-solid fa-user"
                        style={{
                          fontSize: "48px",
                          color: "var(--primary-color)",
                        }}
                      ></i>
                    </div>
                  )}

                  {isEditing && (
                    <div className="mt-3">
                      <Form.Group controlId="libraryCardImageUpload">
                        <Form.Label className="w-100 mb-0">
                          <span className="btn btn-outline-primary w-100">
                            <i className="fa-solid fa-upload me-2"></i>
                            {selectedImageFile
                              ? "Change Photo"
                              : "Upload Photo"}
                          </span>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            className="d-none"
                            onChange={handleImageChange}
                          />
                        </Form.Label>
                        <Form.Text className="text-muted d-block text-center">
                          JPG or PNG, max 2MB
                        </Form.Text>
                        {selectedImageFile && (
                          <div className="small text-center mt-1">
                            Selected: {selectedImageFile.name}
                          </div>
                        )}
                      </Form.Group>
                    </div>
                  )}
                </div>

                <div style={{ textAlign: "center", marginBottom: "15px" }}>
                  <h5
                    style={{
                      margin: "5px 0",
                      color: "var(--primary-color)",
                      fontWeight: "bold",
                    }}
                  >
                    {data?.first_name || "N/A"}
                  </h5>
                  <p
                    style={{
                      margin: "5px 0",
                      color: "#6c757d",
                      fontSize: "14px",
                    }}
                  >
                    {data?.email || "N/A"}
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
                ></div>
              </Card.Body>
            </Card>
          ) : (
            <Card
              style={{
                maxWidth: "400px",
                margin: "0 auto",
                border: "2px solid var(--primary-color)",
                borderRadius: "15px",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  background: "var(--primary-color)",
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
                      color: "var(--primary-color)",
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
                    <strong>First Name:</strong> {data?.first_name || "N/A"}
                  </p>
                  <p style={{ margin: "5px 0" }}>
                    <strong>Email:</strong> {data?.email || "N/A"}
                  </p>
                  <p style={{ margin: "5px 0" }}>
                    <strong>Registration Date:</strong>{" "}
                    {formatDate(data?.registration_date)}
                  </p>
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
    {
      title: "Subscription Status",
      colSize: 12,
      render: (data) => (
        <Card className="mt-3">
          <Card.Body className="text-center">
            {data?.subscription_id ? (
              <>
                <CircularProgressBar
                  progress={subscriptionProgress}
                  daysRemaining={daysRemaining}
                  size={120}
                />
                <div className="mt-3">
                  <p className="mb-1">
                    <strong>Subscription Progress:</strong>{" "}
                    {subscriptionProgress}%
                  </p>
                  <p className="mb-1 text-muted small">
                    {daysRemaining > 0
                      ? `${daysRemaining} days remaining`
                      : "Subscription expired"}
                  </p>
                </div>
              </>
            ) : (
              <div className="py-4">
                <i
                  className="fa-solid fa-clock text-muted"
                  style={{ fontSize: "48px" }}
                ></i>
                <p className="mt-2 text-muted">No Active Subscription</p>
              </div>
            )}
          </Card.Body>
        </Card>
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
        await fetchData();
        await fetchLookupData();
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
  }, [id, moduleApi, moduleLabel]);

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
          fetchedData = responseData;
        }
      } else {
        throw new Error("No response received from API");
      }

      if (fetchedData) {
        setData(fetchedData);
        setOriginalData(JSON.parse(JSON.stringify(fetchedData)));

        const userIds = [];
        if (fetchedData.createdbyid) userIds.push(fetchedData.createdbyid);
        if (
          fetchedData.lastmodifiedbyid &&
          fetchedData.lastmodifiedbyid !== fetchedData.createdbyid
        ) {
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
      const avatars = {};

      const uniqueUserIds = [
        ...new Set(userIds.filter((id) => id && id !== "")),
      ];

      for (const userId of uniqueUserIds) {
        try {
          const response = await userApi.fetchById(userId);
          if (response && response.data) {
            const user = response.data.success
              ? response.data.data
              : response.data;
            if (user) {
              const fullName = `${user.firstname || ""} ${
                user.lastname || ""
              }`.trim();
              names[userId] = fullName || user.email || `User ${userId}`;

              if (user.profile_picture) {
                avatars[userId] = user.profile_picture;
              } else {
                avatars[
                  userId
                ] = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  fullName || "User"
                )}&background=6f42c1&color=fff&size=32`;
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
          names[userId] = `User ${userId}`;
          avatars[
            userId
          ] = `https://ui-avatars.com/api/?name=User&background=6f42c1&color=fff&size=32`;
        }
      }

      setUserNames((prev) => ({ ...prev, ...names }));
      setUserAvatars((prev) => ({ ...prev, ...avatars }));
    } catch (error) {
      console.error("Error fetching user names:", error);
    }
  };

  const formatValue = (value, field) => {
    if (value === null || value === undefined || value === "") return "—";

    if (field.type === "date") {
      try {
        const date = new Date(value);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
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

  useEffect(() => {
    setTempData(location?.state?.rowData);
  }, [location?.state?.isEdit]);

  const handleEdit = async () => {
    if (onEdit) {
      onEdit(data);
    } else {
      resetImageSelection();
      setIsEditing(true);
      setTempData({
        ...data,
        country_code: data?.country_code || companyCountryCode || "",
      });
      await fetchLookupData();
    }
  };

  const fetchLookupData = async () => {
    try {
      const normalizedFields = {
        details: fields?.details || [],
        other: fields?.other || [],
      };

      const allFields = [
        ...(normalizedFields.details || []),
        ...(normalizedFields.other || []),
      ];
      const lookupFields = allFields.filter(
        (field) => field.type === "select" && field.options
      );

      const lookupDataObj = {};
      const endpointMap = {
        subscriptions: "subscriptions",
        subscription: "subscriptions",
      };

      for (const field of lookupFields) {
        if (!lookupDataObj[field.options]) {
          try {
            const endpoint = endpointMap[field.options] || field.options;
            const api = new DataApi(endpoint);
            const response = await api.fetchAll();
            if (response && response.data) {
              let data = response.data;

              if (data.data && Array.isArray(data.data)) {
                data = data.data;
              } else if (data.success && data.data) {
                data = data.data;
              } else if (Array.isArray(data)) {
                data = data;
              }

              if (field.options === "subscriptions" && Array.isArray(data)) {
                const transformedData = data.map((item) => {
                  const displayName =
                    item.plan_name ||
                    item.name ||
                    item.title ||
                    item.subscription_name ||
                    `Subscription ${item.id}`;
                  return {
                    ...item,
                    label: displayName,
                    name: displayName,
                  };
                });
                lookupDataObj[field.options] = transformedData;
              } else {
                lookupDataObj[field.options] = Array.isArray(data)
                  ? data
                  : [data];
              }
            }
          } catch (error) {
            console.error(
              `Error fetching lookup data for ${field.options}:`,
              error
            );
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

    const dataChanged = EDITABLE_FIELDS.some((field) => {
      const originalValue = originalData[field];
      const tempValue = tempData[field];

      if (field === "is_active") {
        return Boolean(originalValue) !== Boolean(tempValue);
      }

      if (field.includes("date") && originalValue && tempValue) {
        return (
          new Date(originalValue).getTime() !== new Date(tempValue).getTime()
        );
      }

      return String(originalValue || "") !== String(tempValue || "");
    });

    return dataChanged || Boolean(selectedImageFile);
  };

  const formatDateDDMMYYYY = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return "";
    }
  };

  const handleSave = async () => {
    if (!hasDataChanged()) {
      setIsEditing(false);
      setTempData(null);
      return;
    }

    try {
      setSaving(true);
      const api = new DataApi(moduleApi);

      const payload = {};
      EDITABLE_FIELDS.forEach((field) => {
        if (tempData[field] !== undefined) {
          let value = tempData[field];

          if (value === "" || value === undefined || value === null) {
            if (field === "country_code" && companyCountryCode) {
              value = companyCountryCode;
            } else {
              value = null;
            }
          }

          if (field.includes("date") && value) {
            try {
              value = new Date(value).toISOString();
            } catch (error) {
              console.error(`Error formatting date field ${field}:`, error);
            }
          }

          payload[field] = value;
        }
      });

      console.log("Saving payload:", payload);

      let response;

      if (selectedImageFile) {
        const formData = new FormData();

        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value);
          }
        });

        formData.append("image", selectedImageFile);
        response = await api.update(formData, id);
      } else {
        response = await api.update(payload, id);
      }

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
        setCardData(updatedData);

        PubSub.publish("RECORD_SAVED_TOAST", {
          title: "Success",
          message: `${moduleLabel} updated successfully`,
        });

        resetImageSelection();
        await fetchCardData();

        setIsEditing(false);
        setTempData(null);
      } else {
        throw new Error("Failed to update - No response data");
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
    resetImageSelection();
    const fallbackImage =
      data?.image ||
      data?.user_image ||
      cardData?.image ||
      cardData?.user_image;
    setImagePreview(getImageUrl(fallbackImage) || "/default-user.png");
  };

  const handleFieldChange = (fieldKey, value) => {
    if (isEditing) {
      setTempData((prev) => ({
        ...(prev || {}),
        [fieldKey]: value,
      }));
    }
  };

  const resetImageSelection = () => {
    if (imageObjectUrlRef.current) {
      URL.revokeObjectURL(imageObjectUrlRef.current);
      imageObjectUrlRef.current = null;
    }
    setSelectedImageFile(null);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Image Too Large",
        message: "Please select an image smaller than 2MB.",
      });
      event.target.value = "";
      return;
    }

    if (imageObjectUrlRef.current) {
      URL.revokeObjectURL(imageObjectUrlRef.current);
      imageObjectUrlRef.current = null;
    }

    setSelectedImageFile(file);
    handleFieldChange("image", file);
    const previewUrl = URL.createObjectURL(file);
    imageObjectUrlRef.current = previewUrl;
    setImagePreview(previewUrl);
  };

  const getSelectOptions = (field) => {
    if (!field || field.type !== "select" || !field.options) {
      return [];
    }

    if (Array.isArray(field.options)) {
      return field.options;
    }

    return externalData[field.options] || lookupData[field.options] || [];
  };

  const extractOptionValue = (option = {}) =>
    option.id ??
    option.value ??
    option.email ??
    option.name ??
    option.label ??
    option.firstname ??
    option.lastname ??
    "";

  const normalizeOptionValue = (value) =>
    value === undefined || value === null ? "" : value.toString();

  const getOptionLabel = (option = {}) => {
    if (option.label) return option.label;
    if (option.plan_name) return option.plan_name;
    if (option.subscription_name) return option.subscription_name;
    if (option.name) return option.name;
    if (option.title) return option.title;
    if (option.firstname || option.lastname) {
      const composed = `${option.firstname || ""} ${
        option.lastname || ""
      }`.trim();
      if (composed) return composed;
    }
    if (option.email) return option.email;
    if (option.value) return option.value;
    if (option.id) return `ID: ${option.id}`;
    return "Unknown Item";
  };

  const getFieldValue = (field, currentData) => {
    if (!currentData) return "";
    const value = currentData[field.key];

    if (isEditing) {
      if (field.type === "date" && value) {
        try {
          const date = new Date(value);
          return date.toISOString().split("T")[0];
        } catch {
          return value;
        }
      }
      if (field.type === "datetime" && value) {
        try {
          const date = new Date(value);
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
      if (
        (field.key === "createdbyid" || field.key === "lastmodifiedbyid") &&
        value
      ) {
        return userNames[value] || value || "—";
      }
      return formatValue(value, field) || "—";
    }
  };

  const renderFieldGroup = (field, index) => {
    if (!field) return null;
    const currentData = isEditing ? tempData || {} : data;
    if (!currentData) return null;

    const isDisabledField = DISABLED_FIELDS_ON_EDIT.has(field.key);
    const isReadOnlyField = READONLY_FIELDS_ON_EDIT.has(field.key);
    const isInputEditable = isEditing && !isDisabledField && !isReadOnlyField;

    // Always show Created By / Last Modified By as name + avatar
    if (field.key === "createdbyid" || field.key === "lastmodifiedbyid") {
      const userId = currentData[field.key];
      if (userId) {
        return (
          <Form.Group key={`${field.key}-${index}`} className="mb-3">
            <Form.Label className="fw-semibold">{field.label}</Form.Label>
            <div className="form-control-plaintext p-0 border-0">
              <UserAvatar
                userId={userId}
                size={36}
                showName={true}
                clickable={true}
              />
            </div>
          </Form.Group>
        );
      }

      return (
        <Form.Group key={`${field.key}-${index}`} className="mb-3">
          <Form.Label className="fw-semibold">{field.label}</Form.Label>
          <div className="form-control-plaintext p-0 border-0">—</div>
        </Form.Group>
      );
    }

    // Status switch
    if (field.key === "is_active") {
      return (
        <Form.Group key={`${field.key}-${index}`} className="mb-3">
          <Form.Label className="fw-semibold">{field.label}</Form.Label>
          {isEditing ? (
            <Form.Check
              type="switch"
              id="libraryCardStatusSwitch"
              checked={Boolean((tempData || {})?.is_active)}
              onChange={(e) => handleFieldChange(field.key, e.target.checked)}
              label={(tempData || {})?.is_active ? "Active" : "Inactive"}
            />
          ) : (
            <div>{formatValue(currentData[field.key], field) || "—"}</div>
          )}
        </Form.Group>
      );
    }

    // Select fields
    if (field.type === "select" && field.options) {
      const options = getSelectOptions(field);
      const rawValue = currentData[field.key];
      const currentValue = normalizeOptionValue(rawValue);

      if (isEditing) {
        return (
          <Form.Group key={`${field.key}-${index}`} className="mb-3">
            <Form.Label className="fw-semibold">{field.label}</Form.Label>
            <Form.Select
              value={currentValue}
              onChange={(e) => {
                const nextValue = e.target.value || "";
                handleFieldChange(field.key, nextValue || null);
              }}
              style={{ background: "white" }}
            >
              <option value="">Select {field.label}</option>
              {options.map((option) => {
                const normalizedOptionValue = normalizeOptionValue(
                  extractOptionValue(option)
                );
                return (
                  <option
                    key={normalizedOptionValue}
                    value={normalizedOptionValue}
                  >
                    {getOptionLabel(option)}
                  </option>
                );
              })}
            </Form.Select>
          </Form.Group>
        );
      }

      const displayValue = (() => {
        if (field.displayKey && data) {
          return data[field.displayKey] || "—";
        }
        const normalizedValue = normalizeOptionValue(currentValue);
        const selected = options.find((opt) => {
          const optionValue = normalizeOptionValue(extractOptionValue(opt));
          return optionValue === normalizedValue;
        });
        return selected ? getOptionLabel(selected) : "—";
      })();

      return (
        <Form.Group key={`${field.key}-${index}`} className="mb-3">
          <Form.Label className="fw-semibold">{field.label}</Form.Label>
          <Form.Control
            type="text"
            value={displayValue || "—"}
            readOnly
            style={{
              pointerEvents: "none",
              opacity: 0.9,
            }}
          />
        </Form.Group>
      );
    }

    // Normal text/number/date fields
    const inputType =
      field.type === "number"
        ? "number"
        : field.type === "date"
        ? "date"
        : field.type === "datetime"
        ? "datetime-local"
        : "text";

    const fieldValue = getFieldValue(field, currentData) ?? "";
    const isElementValue = React.isValidElement(fieldValue);
    const controlType = isInputEditable ? inputType : "text";

    if (!isEditing && field.type === "badge") {
      return (
        <Form.Group key={`${field.key}-${index}`} className="mb-3">
          <Form.Label className="fw-semibold">{field.label}</Form.Label>
          <div>{fieldValue}</div>
        </Form.Group>
      );
    }

    if (!isEditing && isElementValue) {
      return (
        <Form.Group key={`${field.key}-${index}`} className="mb-3">
          <Form.Label className="fw-semibold">{field.label}</Form.Label>
          <div>{fieldValue}</div>
        </Form.Group>
      );
    }

    return (
      <Form.Group key={`${field.key}-${index}`} className="mb-3">
        <Form.Label className="fw-semibold">{field.label}</Form.Label>
        <Form.Control
          type={controlType}
          value={isElementValue ? "" : fieldValue}
          readOnly={!isInputEditable}
          disabled={isEditing && isDisabledField}
          onChange={(e) => {
            if (!isInputEditable) return;
            let newValue = e.target.value;

            if (field.type === "number") {
              newValue = newValue ? parseFloat(newValue) : null;
            } else if (field.type === "datetime" && newValue) {
              newValue = new Date(newValue).toISOString();
            }

            handleFieldChange(field.key, newValue);
          }}
          style={{
            pointerEvents: isInputEditable ? "auto" : "none",
            opacity: isInputEditable ? 1 : 0.9,
          }}
        />
      </Form.Group>
    );
  };

  const handleDelete = () => {
    setDeleteId(id);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
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
        message: `Failed to delete ${moduleLabel} ${error.message}`,
      });
    }
  };

  const normalizedFields = Array.isArray(fields)
    ? { details: fields }
    : fields || {};

  const handleBack = () => {
    navigate(`/${moduleName}`);
  };

  return (
    <Container fluid className="py-4">
      <ScrollToTop />
      <Row className="justify-content-center">
        <Col lg={12} xl={12}>
          <Card className="border-0 shadow-sm detail-h4">
            <Card.Body>
              <div
                className="d-flex justify-content-between align-items-center mb-4 p-2"
                style={{
                  color: "var(--primary-color)",
                  background: "var(--primary-background-color)",
                  borderRadius: "10px",
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <button
                    onClick={handleBack}
                    className="shadow-sm d-flex align-items-center justify-content-center custom-btn-back"
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                  </button>
                  <h5
                    className="fw-bold mb-1"
                    style={{ color: "var(--primary-color)" }}
                  >
                    <i className="fa-solid fa-id-card me-2"></i>
                    Library Members
                  </h5>
                </div>
                <div>
                  {!isEditing ? (
                    <button onClick={handleEdit} className="custom-btn-primary">
                      <i className="fa-solid fa-edit me-2"></i>
                      Edit {moduleLabel}
                    </button>
                  ) : (
                    <div className="d-flex gap-2">
                      <button
                        className="custom-btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        <i className="fa-solid fa-check me-2"></i>
                        {saving
                          ? "Saving..."
                          : hasDataChanged()
                          ? `Save - ${formatDateDDMMYYYY(new Date())}`
                          : "Save"}
                      </button>
                      <button
                        className="custom-btn-secondary"
                        onClick={handleCancel}
                        disabled={saving}
                      >
                        <i className="fa-solid fa-times me-2"></i>
                        Cancel
                      </button>
                    </div>
                  )}
                  {!isEditing && (
                    <button
                      onClick={handleDelete}
                      className="ms-2 custom-btn-delete-detail"
                    >
                      <i className="fa-solid fa-trash me-2"></i>
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <Row className="mt-4 pe-0">
                {normalizedFields &&
                  normalizedFields.details &&
                  moduleName === "librarycard" && (
                    <>
                      <Col md={9}>
                        <h6
                          className="mb-4 fw-bold mb-0 d-flex align-items-center justify-content-between p-3 border rounded"
                          style={{
                            color: "var(--primary-color)",
                            background: "var(--header-highlighter-color)",
                            borderRadius: "10px",
                          }}
                        >
                          {moduleLabel} Information
                        </h6>
                        <Row className="px-5">
                          {/* Left column: card number, first name, last name */}
                          <Col md={4}>
                            {normalizedFields.details
                              .slice(0, 3)
                              .map((field, index) =>
                                renderFieldGroup(field, index)
                              )}
                          </Col>

                          {/* Middle column: email + Country Code & Phone together */}
                          <Col md={4}>
                            {/* Email */}
                            {renderFieldGroup(
                              normalizedFields.details[3],
                              3
                            )}
                            {/* Country Code + Phone side by side */}
                            <Row>
                              <Col md={6}>
                                {renderFieldGroup(
                                  normalizedFields.details[4],
                                  4
                                )}
                              </Col>
                              <Col md={6}>
                                {renderFieldGroup(
                                  normalizedFields.details[5],
                                  5
                                )}
                              </Col>
                            </Row>
                          </Col>

                          {/* Right column: registration date, subscription, status */}
                          <Col md={4}>
                            {normalizedFields.details
                              .slice(6)
                              .map((field, index) =>
                                renderFieldGroup(field, index + 6)
                              )}
                          </Col>
                        </Row>
                        <Col className="pt-4">
                          <h6
                            className="mb-4 fw-bold mb-0 d-flex align-items-center justify-content-between p-3 border rounded"
                            style={{
                              color: "var(--primary-color)",
                              background: "var(--header-highlighter-color)",
                              borderRadius: "10px",
                            }}
                          >
                            Others
                          </h6>
                          <Row className="px-5">
                            <Col md={6}>
                              {normalizedFields.other
                                ?.slice(
                                  0,
                                  Math.ceil(normalizedFields.other.length / 2)
                                )
                                .map((field, index) =>
                                  renderFieldGroup(field, index)
                                )}
                            </Col>
                            <Col md={6}>
                              {normalizedFields.other
                                .slice(
                                  Math.ceil(normalizedFields.other.length / 2)
                                )
                                .map((field, index) =>
                                  renderFieldGroup(field, index)
                                )}
                            </Col>
                          </Row>
                        </Col>
                      </Col>
                      <Col md={3}>
                        {customSections.length > 0 &&
                          customSections.map((section, idx) => (
                            <div key={idx}>
                              <h6
                                className="mb-4 fw-bold mb-0 d-flex align-items-center justify-content-between p-3 border rounded"
                                style={{
                                  color: "var(--primary-color)",
                                  background: "var(--header-highlighter-color)",
                                  borderRadius: "10px",
                                }}
                              >
                                {section.title}
                              </h6>
                              <Col md={section.colSize || 12}>
                                {section.render
                                  ? section.render(data)
                                  : section.content}
                              </Col>
                            </div>
                          ))}
                      </Col>
                      {bookStatistics.length > 0 &&
                        bookStatistics.map((section, idx) => (
                          <Col
                            md={section.colSize || 12}
                            key={idx}
                            className="mt-5"
                          >
                            <h6
                              className="mb-4 fw-bold mb-0 d-flex align-items-center justify-content-between p-3 border rounded"
                              style={{
                                color: "var(--primary-color)",
                                background: "var(--header-highlighter-color)",
                                borderRadius: "10px",
                              }}
                            >
                              {section.title}
                            </h6>
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
      <ConfirmationModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        onConfirm={confirmDelete}
        title={`Delete ${moduleName}`}
        message={`Are you sure you want to delete this ${moduleName}?`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </Container>
  );
};

export default LibraryCardDetail;
