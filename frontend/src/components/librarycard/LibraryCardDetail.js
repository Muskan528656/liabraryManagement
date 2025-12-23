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
  Tab,
  Modal,
  Nav,
  InputGroup,
} from "react-bootstrap";
import PubSub from "pubsub-js";
import JsBarcode from "jsbarcode";
import ScrollToTop from "../common/ScrollToTop";
import ConfirmationModal from "../common/ConfirmationModal";
import { API_BASE_URL } from "../../constants/CONSTANT";
import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import ResizableTable from "../../components/common/ResizableTable";
import RelatedTabContent from '../../components/librarycard/RelatedTab'

const LibraryCardDetail = ({
  onEdit = null,
  onDelete = null,
  externalData = {},
}) => {
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const { timeZone } = useTimeZone();
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
  const [subscriptionProgress, setSubscriptionProgress] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [companyCountryCode, setCompanyCountryCode] = useState("");
  const [activeTab, setActiveTab] = useState("detail");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [objectTypes, setObjectTypes] = useState([]);
  const [planStatus, setPlanStatus] = useState("No Plan");

  const imageObjectUrlRef = useRef(null);
  const frontBarcodeRef = useRef(null);

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
      "plan_id",
      "is_active",
      "allowed_book",
      "image",
      "father_gurdian_name",
      "parent_contact",
      "dob",
      "type_id"
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
      console.log("Getting image URL for:", imagePath);

      if (!imagePath) {
        return "/default-user.png";
      }

      if (typeof imagePath === "string" && imagePath.startsWith("blob:")) {
        return imagePath;
      }

      if (imagePath instanceof File) {
        return URL.createObjectURL(imagePath);
      }

      if (typeof imagePath === "string") {
        let cleanPath = imagePath;
        if (cleanPath.includes('{') || cleanPath.includes('[') || cleanPath.includes('}')) {
          cleanPath = cleanPath.replace(/[{}"\[\]\\]/g, '').trim();
        }

        if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
          return cleanPath;
        }

        if (cleanPath.startsWith("/") || cleanPath.includes("uploads")) {
          if (!cleanPath.startsWith("/uploads")) {
            cleanPath = `/uploads/librarycards/${cleanPath}`;
          }

          const fullUrl = `${normalizedFileHost}${cleanPath}`;
          console.log("Constructed image URL:", fullUrl);
          return fullUrl;
        }

        if (cleanPath && !cleanPath.includes('/')) {
          const fullUrl = `${normalizedFileHost}/uploads/librarycards/${cleanPath}`;
          console.log("Constructed filename URL:", fullUrl);
          return fullUrl;
        }
      }

      return "/default-user.png";
    },
    [normalizedFileHost]
  );

  const CircularProgressBar = ({ progress, daysRemaining, size = 100 }) => {
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const getProgressColor = (progress, daysRemaining) => {
      if (daysRemaining < 0) return "#dc3545";
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
              stroke={getProgressColor(progress, daysRemaining)}
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
            style={{ width: "70px" }}
          >
            <div
              className="fw-bold"
              style={{ fontSize: "20px", color: getProgressColor(progress, daysRemaining) }}
            >
              {daysRemaining}
            </div>
            <div className="small text-muted" style={{ fontSize: "11px" }}>Days Left</div>
          </div>
        </div>
        <div className="mt-2">
          <Badge
            bg={
              daysRemaining < 0 ? "danger" : progress > 70 ? "success" : progress > 30 ? "warning" : "danger"
            }
            className="px-2 py-1"
            style={{ fontSize: "12px" }}
          >
            {daysRemaining < 0
              ? "Expired"
              : progress > 70
                ? "Good"
                : progress > 30
                  ? "Warning"
                  : "Expiring Soon"}
          </Badge>
        </div>
      </div>
    );
  };
  const calculateSubscriptionProgress = (subscription) => {
    const startDate = new Date(subscription.start_date);
    const endDate = new Date(subscription.end_date);
    const today = new Date();

    // total duration
    const totalDays =
      (endDate - startDate) / (1000 * 60 * 60 * 24);

    // used duration
    const usedDays =
      (today - startDate) / (1000 * 60 * 60 * 24);

    let progress = Math.round((usedDays / totalDays) * 100);
    progress = Math.min(Math.max(progress, 0), 100);

    const daysRemaining = Math.max(
      Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)),
      0
    );

    const status = today > endDate ? "Expired" : "Active";

    return {
      progress,
      daysRemaining,
      status,
    };
  };

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
        className={`d-flex align-items-center ${clickable ? "cursor-pointer" : ""
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
        }
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
    }
  };

  useEffect(() => {
    fetCompanyCode();
  }, []);

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
          height: 50,
          displayValue: true,
          text: cardNumber,
          fontSize: 12,
          margin: 5,
        });
      } catch (error) {
        console.error("Error generating front barcode:", error);
      }
    }
  }, [cardData]);

  useEffect(() => {
    const fetchSubscriptionProgress = async () => {
      if (!data?.subscription_id) {
        setSubscriptionProgress(0);
        setDaysRemaining(0);
        setPlanStatus("No Plan");
        return;
      }

      try {
        const api = new DataApi("plans");
        const response = await api.fetchById(data.subscription_id);

        const subscriptionData = response?.data?.success
          ? response.data.data
          : response?.data;

        if (!subscriptionData) {
          throw new Error("No subscription data");
        }

        const {
          progress,
          daysRemaining,
          status,
        } = calculateSubscriptionProgress(subscriptionData);

        setSubscriptionProgress(progress);
        setDaysRemaining(daysRemaining);
        setPlanStatus(status);
      } catch (error) {
        console.error("Error fetching subscription details:", error);
        setSubscriptionProgress(0);
        setDaysRemaining(0);
        setPlanStatus("Expired");
      }
    };

    fetchSubscriptionProgress();
  }, [data?.subscription_id]);

  useEffect(()=>{
    fetchCardData()
    console.log("book",fetchBookCounts)
  },[])
  const fetchCardData = async () => {
    console.log("check---->")
    try {
      const api = new DataApi("librarycard");

      const response = await api.fetchById(id);

      console.log("responsecarddata", response)

      if (response && response.data) {
        const card = response.data;
        setCardData(card);

        console.log("cardcardcard", card)

        if (card.id) {
          await fetchBookCounts(card.id);
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

      console.log("bookcount", userId)
      console.log("cardId", cardId)

      const issueApi = new DataApi("bookissue");
      const issuesResponse = await issueApi.fetchAll();
      console.log("issuesResponse", issuesResponse)
      if (issuesResponse && issuesResponse.data) {
        const issues = Array.isArray(issuesResponse.data)
          ? issuesResponse.data
          : issuesResponse.data?.data || [];

        const cardIssues = issues.filter((issue) => {
          const matchesCard =
            issue.issued_to === userId


          console.log("matchesCardmatchesCardmatchesCard", matchesCard)
          return matchesCard
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
  const fetchTypeOptions = async () => {
    try {
      const api = new DataApi("librarycard");
      const res = await api.get("/object-types");

      console.log("Fetched Object Types Response:", res);

      if (res.data?.success) {
        setObjectTypes(res.data.data || []);
        console.log(`Set ${res.data.data?.length || 0} object types`);
      } else {
        console.warn("Failed to fetch object types:", res.data?.message || "Unknown error");
        setObjectTypes([]);
      }
    } catch (err) {
      console.error("Error fetching object types:", err);
      setObjectTypes([]);
    }
  };
  const typeOptions = useMemo(() => {
    return objectTypes.map((item) => ({
      label: item.label,   // STAFF / STUDENT / OTHER
      value: item.id,
    }));
  }, [objectTypes]);
  const fields = {
    details: [
      {
        key: "card_number",
        label: "Card Number",
        type: "text",
        colSize: 3,
      },
      {
        key: "first_name",
        label: "First Name",
        type: "text",
        colSize: 3,
      },
      {
        key: "last_name",
        label: "Last Name",
        type: "text",
        colSize: 3,
      },
      {
        key: "dob",
        label: "Date of Birth",
        type: "date",
        colSize: 3,
      },
      {
        key: "email",
        label: "Email",
        type: "text",
        colSize: 3,
      },
      {
        key: "father_gurdian_name",
        label: "Father/Guardian Name",
        type: "text",
        colSize: 3,
      },
      {
        key: "parent_contact",
        label: "Parent Contact",
        type: "text",
        colSize: 3,
      },
      {
        key: "country_code",
        label: "Country Code",
        type: "select",
        options: COUNTRY_CODES.map((c) => ({
          label: `${c.country_code} (${c.country})`,
          value: c.country_code,
        })),
        colSize: 2,
      },
      {
        key: "phone_number",
        label: "Phone",
        type: "text",
        colSize: 2,
      },
      {
        key: "type_id",
        label: "Type",
        type: "select",
        options: typeOptions,
        colSize: 2,
      },
      {
        key: "registration_date",
        label: "Registration Date",
        type: "date",
        colSize: 3,
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
        colSize: 3,
      },
    ],
    other: [
      { key: "createdbyid", label: "Created By", type: "text" },
      { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },
      {
        key: "createddate",
        label: "Created Date",
        type: "date",
        render: (value) => {
          return convertToUserTimezone(value, timeZone)
        },
      },
      {
        key: "lastmodifieddate",
        label: "Last Modified Date",
        type: "date",
        render: (value) => {
          return convertToUserTimezone(value, timeZone)
        },
      },
    ],
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "Invalid Date";
    }
  };

  const IDCardPreview = () => {
    const barcodeContainerRef = useRef(null);

    useEffect(() => {
      if (barcodeContainerRef.current && data?.card_number) {
        try {
          barcodeContainerRef.current.innerHTML = '';

          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          barcodeContainerRef.current.appendChild(svg);

          JsBarcode(svg, data.card_number, {
            format: "CODE128",
            width: 2,
            height: 50,
            displayValue: true,
            text: data.card_number,
            fontSize: 12,
            margin: 5,
          });
        } catch (error) {
          console.error("Error generating barcode:", error);
        }
      }
    }, [data?.card_number, barcodeContainerRef.current]);

    return (
      <Card
        style={{
          maxWidth: "400px",
          margin: "0 auto",
          border: "2px solid var(--primary-color)",
          borderRadius: "15px",
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          height: "700px",
        }}
      >
        <div
          style={{
            background: "var(--primary-color)",
            color: "white",
            padding: "15px",
            textAlign: "center",
          }}
        >
          <h4 style={{ margin: 0, fontWeight: "bold" }}>LIBRARY CARD</h4>
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
                      {selectedImageFile ? "Change Photo" : "Upload Photo"}
                    </span>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      className="d-none"
                      onChange={handleImageChange}
                    />
                  </Form.Label>
                  <Form.Text className="text-muted d-block text-center">
                    JPG, PNG, WebP, GIF - max 2MB
                  </Form.Text>

                  {selectedImageFile && (
                    <div className="small text-center mt-1 text-success">
                      <i className="fa-solid fa-check me-1"></i>
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
                fontSize: "20px",
              }}
            >
              {data?.first_name || "N/A"} {data?.last_name || ""}
            </h5>
            <p
              style={{
                margin: "5px 0",
                color: "#6c757d",
                fontSize: "14px",
              }}
            >
              <i className="fa-solid fa-envelope me-2"></i>
              {data?.email || "N/A"}
            </p>
            <p
              style={{
                margin: "5px 0",
                color: "#6c757d",
                fontSize: "13px",
                fontFamily: "monospace",
              }}
            >
              <i className="fa-solid fa-id-card me-2"></i>
              Card: {data?.card_number || "N/A"}
            </p>
            <p
              style={{
                margin: "5px 0",
                color: "#6c757d",
                fontSize: "13px",
              }}
            >
              <i className="fa-solid fa-calendar me-2"></i>
              Registered: {formatDate(data?.registration_date)}
            </p>
          </div>

          <div
            style={{
              border: "1px solid #e9ecef",
              borderRadius: "8px",
              padding: "15px",
              background: "#f8f9fa",
              marginTop: "15px",
              marginBottom: "15px",
              height: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              ref={barcodeContainerRef}
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            ></div>
          </div>

          <div style={{
            background: "#f8f9fa",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "15px"
          }}>
            <h6
              style={{
                color: "var(--primary-color)",
                marginBottom: "10px",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              <i className="fa-solid fa-chart-line me-2"></i>
              Plan Status
            </h6>
            <div className="text-center">
              <CircularProgressBar
                progress={subscriptionProgress}
                daysRemaining={daysRemaining}
                size={100}
              />

              {data?.subscription_id ? (
                <div className="mt-2">
                  <p className="mb-1 small">
                    <strong>Progress:</strong> {subscriptionProgress}%
                  </p>

                  <p
                    className={`mb-0 small ${daysRemaining > 5
                      ? "text-muted"
                      : daysRemaining > 0
                        ? "text-warning"
                        : "text-danger"
                      }`}
                  >
                    {daysRemaining > 1 && `${daysRemaining} days remaining`}
                    {daysRemaining === 1 && "Last day of subscription"}
                    {daysRemaining <= 0 && "Subscription expired"}
                  </p>
                </div>
              ) : (
                <p className="text-muted small mt-2">
                  No Active Subscription
                </p>
              )}
            </div>

          </div>
        </Card.Body>
      </Card>
    );
  };

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
        await fetchTypeOptions();
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
              const fullName = `${user.firstname || ""} ${user.lastname || ""
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
      if (field.render && typeof field.render === "function") {
        return field.render(value, data);
      }
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

      const editData = {
        ...data,
        country_code: data?.country_code || companyCountryCode || "",
        father_guardian_name: data?.father_guardian_name || data?.father_gurdian_name || "",
        type_id: data?.type_id || data?.type || ""
      };

      setTempData(editData);
      await fetchLookupData();
      await fetchTypeOptions();
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
        (field) => field.type === "select" && typeof field.options === "string"
      );

      console.log("Debug - Lookup fields (string options only):", lookupFields);

      const lookupDataObj = {};
      const endpointMap = {
        subscriptions: "subscriptions",
        subscription: "subscriptions",
        plans: "plans",
      };

      for (const field of lookupFields) {
        const optionKey = field.options;

        if (!lookupDataObj[optionKey]) {
          try {
            const endpoint = endpointMap[optionKey] || optionKey;
            console.log(`Fetching data for endpoint: ${endpoint}`);

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

              if (endpoint === "subscriptions" && Array.isArray(data)) {
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
                lookupDataObj[optionKey] = transformedData;
              } else if (endpoint === "plans" && Array.isArray(data)) {
                const transformedData = data.map((item) => {
                  const displayName =
                    item.plan_name ||
                    item.name ||
                    item.title ||
                    `Plan ${item.id}`;
                  return {
                    ...item,
                    label: displayName,
                    name: displayName,
                  };
                });
                lookupDataObj[optionKey] = transformedData;
              } else {
                lookupDataObj[optionKey] = Array.isArray(data)
                  ? data
                  : [data];
              }

              console.log(`Fetched ${lookupDataObj[optionKey]?.length} items for ${optionKey}`);
            }
          } catch (error) {
            console.error(`Error fetching lookup data for ${optionKey}:`, error);
            lookupDataObj[optionKey] = [];
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
      let originalValue = originalData[field];
      const tempValue = tempData[field];

      if (field === "father_guardian_name") {
        originalValue = originalData.father_guardian_name || originalData.father_gurdian_name;
        return String(originalValue || "") !== String(tempValue || "");
      }

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
    console.log("Saving data...");
    if (!hasDataChanged()) {
      setIsEditing(false);
      setTempData(null);
      return;
    }

    try {
      setSaving(true);
      const api = new DataApi(moduleApi);

      let payload = {};

      EDITABLE_FIELDS.forEach(field => {
        if (tempData[field] !== undefined) {
          let value = tempData[field];

          if (value === "" || value === undefined || value === null) {
            return;
          }

          if (field === "type_id") {
            payload["type"] = value;
            console.log(`✅ Type field: ${field} -> type: ${value}`);
          }
          else if (field === "father_guardian_name") {
            payload["father_guardian_name"] = value;
          }
          else if (field.includes("date") && value) {
            try {
              const date = new Date(value);
              payload[field] = date.toISOString().split('T')[0];
            } catch (err) {
              payload[field] = value;
            }
          }
          else if (field !== "image") {
            payload[field] = value;
          }
        }
      });

      console.log("Final payload for save:", payload);
      console.log("Selected file:", selectedImageFile);

      let response;

      if (selectedImageFile) {
        console.log("CASE 1: New image uploaded");

        const formData = new FormData();

        Object.keys(payload).forEach(key => {
          if (payload[key] !== null && payload[key] !== undefined) {
            formData.append(key, payload[key]);
          }
        });

        formData.append("image", selectedImageFile);

        console.log("FORMDATA SENT:");
        for (let p of formData.entries()) console.log(p[0], p[1]);

        response = await api.updateLibraryCard(formData, id);
      } else {
        console.log("CASE 2: No new image, using existing");

        const requestPayload = { ...payload };
        if (data?.image) {
          if (typeof data.image === 'object' && data.image !== null) {
            requestPayload.image = data.image.name || data.image;
          } else {
            requestPayload.image = data.image;
          }
        }

        console.log("Sending JSON payload:", requestPayload);
        response = await api.update(requestPayload, id);
      }

      let updatedData =
        response?.data?.data ||
        response?.data ||
        response;

      console.log("Backend response:", updatedData);

      if (updatedData && typeof updatedData === 'object') {
        if (updatedData.image && typeof updatedData.image === "object" && Object.keys(updatedData.image).length === 0) {
          console.log("Fixing empty image object from backend");

          if (selectedImageFile) {
            updatedData.image = `/uploads/librarycards/${selectedImageFile.name}`;
          } else if (data?.image) {
            updatedData.image = data.image;
          } else {
            updatedData.image = null;
          }
        }
      }

      console.log("FINAL updatedData:", updatedData);

      if (updatedData) {
        setData(updatedData);
        setOriginalData(JSON.parse(JSON.stringify(updatedData)));
        setCardData(updatedData);
      }

      PubSub.publish("RECORD_SAVED_TOAST", {
        title: "Success",
        message: `${moduleLabel} updated successfully`,
      });

      resetImageSelection();
      await fetchCardData();

      setRefreshCounter(prev => prev + 1);

      setIsEditing(false);
      setTempData(null);

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

    const fallbackImage = data?.image || cardData?.image;
    if (fallbackImage) {
      const imageUrl = getImageUrl(fallbackImage);
      console.log("Resetting to image URL:", imageUrl);
      setImagePreview(imageUrl);
    } else {
      setImagePreview("/default-user.png");
    }
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

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/x-bmp', 'image/x-ms-bmp', 'image/tiff', 'image/tif', 'image/x-tiff', 'image/svg+xml', 'image/heic', 'image/heif', 'image/avif', 'image/x-icon', 'image/vnd.microsoft.icon'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'tif', 'svg', 'heic', 'heif', 'avif', 'ico'];

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Invalid File Type",
        message: "Please select a valid image file (JPEG, PNG, WebP, GIF, BMP, TIFF, SVG, HEIC, HEIF, AVIF, ICO).",
      });
      event.target.value = "";
      return;
    }

    if (imageObjectUrlRef.current) {
      URL.revokeObjectURL(imageObjectUrlRef.current);
      imageObjectUrlRef.current = null;
    }

    const previewUrl = URL.createObjectURL(file);
    imageObjectUrlRef.current = previewUrl;

    setSelectedImageFile(file);
    setImagePreview(previewUrl);

    handleFieldChange("image", file);

    console.log("Image selected:", file.name, file.size, file.type);

    event.target.value = "";
  };

  const getSelectOptions = (field) => {
    if (!field || field.type !== "select") {
      return [];
    }

    if (field.key === "type_id") {
      return typeOptions;
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
      const composed = `${option.firstname || ""} ${option.lastname || ""
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

    if (field.key === "father_guardian_name") {
      const value = currentData.father_guardian_name || currentData.father_gurdian_name;

      if (isEditing) {
        return value || "";
      } else {
        return formatValue(value, field) || "—";
      }
    }

    if (field.key === "type_id") {
      const value = currentData.type_id || currentData.type;

      if (isEditing) {
        return value || "";
      } else {
        const typeOption = typeOptions.find(opt =>
          opt.value === value || opt.code === value
        );
        return typeOption?.label || value || "—";
      }
    }

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

    if (field.key === "type_id") {
      const options = getSelectOptions(field);
      const currentValue = getFieldValue(field, currentData);

      if (isEditing) {
        return (
          <Form.Group key={`${field.key}-${index}`} className="mb-3">
            <Form.Label className="fw-semibold">{field.label}</Form.Label>
            <Form.Select
              value={currentValue || ""}
              onChange={(e) => {
                const nextValue = e.target.value || "";
                handleFieldChange(field.key, nextValue || null);
              }}
              style={{ background: "white" }}
            >
              <option value="">Select {field.label}</option>
              {options.map((option) => {
                const optionValue = option.value || option.id || "";
                return (
                  <option
                    key={optionValue}
                    value={optionValue}
                  >
                    {option.label || option.name || optionValue}
                  </option>
                );
              })}
            </Form.Select>
          </Form.Group>
        );
      }

      return (
        <Form.Group key={`${field.key}-${index}`} className="mb-3">
          <Form.Label className="fw-semibold">{field.label}</Form.Label>
          <Form.Control
            type="text"
            value={currentValue || "—"}
            readOnly
            style={{
              pointerEvents: "none",
              opacity: 0.9,
            }}
          />
        </Form.Group>
      );
    }

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

              <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || "detail")} id="book-tabs-container">
                <div className="d-flex align-items-center justify-content-between border-bottom pb-2">
                  <Nav variant="tabs" className="border-bottom-0">
                    <Nav.Item>
                      <Nav.Link eventKey="detail" className={`fw-semibold ${activeTab === 'detail' ? 'active' : ''}`}
                        style={{
                          border: "none",
                          borderRadius: "8px 8px 0 0",
                          padding: "12px 24px",

                          backgroundColor: activeTab === 'detail' ? "var(--primary-color)" : "#f8f9fa",
                          color: activeTab === 'detail' ? "white" : "#64748b",
                          borderTop: activeTab === 'detail' ? "3px solid var(--primary-color)" : "3px solid transparent",
                          fontSize: "14px",
                          transition: "all 0.3s ease",
                          marginBottom: "-1px"
                        }}>
                        <span>Detail</span>
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="related" className={`fw-semibold ${activeTab === 'related' ? 'active' : ''}`}
                        style={{
                          border: "none",
                          borderRadius: "8px 8px 0 0",
                          padding: "12px 24px",

                          backgroundColor: activeTab === 'related' ? "var(--primary-color)" : "#f8f9fa",
                          color: activeTab === 'related' ? "white" : "#64748b",
                          borderTop: activeTab === 'related' ? "3px solid var(--primary-color)" : "3px solid transparent",
                          fontSize: "14px",
                          transition: "all 0.3s ease",
                          marginBottom: "-1px"
                        }}>
                        <span>Related</span>
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>

                  {activeTab === "related" && (
                    <div style={{
                      position: "absolute",
                      right: "0",
                      top: "50%",
                      transform: "translateY(-50%)",
                      paddingRight: "15px",
                      marginTop: "-60px"
                    }}>
                      <InputGroup style={{ maxWidth: "250px" }}>
                        <InputGroup.Text
                          style={{
                            background: "#f3e9fc",
                            borderColor: "#e9ecef",
                            padding: "0.375rem 0.75rem",
                          }}
                        >
                          <i className="fa-solid fa-search" style={{ color: "#6f42c1" }}></i>
                        </InputGroup.Text>
                        <Form.Control
                          placeholder="Search books..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{
                            borderColor: "#e9ecef",
                            fontSize: "0.875rem",
                            padding: "0.375rem 0.75rem",
                          }}
                        />

                        {searchTerm && (
                          <Button
                            variant="outline-secondary"
                            onClick={() => setSearchTerm("")}
                            style={{
                              border: "1px solid #d1d5db",
                              borderRadius: "0 6px 6px 0",
                              height: "38px",
                            }}
                          >
                            <i className="fa-solid fa-times"></i>
                          </Button>
                        )}
                      </InputGroup>
                    </div>
                  )}
                </div>
                <Tab.Content>
                  <Tab.Pane eventKey="detail">
                    <Row>
                      {normalizedFields &&
                        normalizedFields.details &&
                        moduleName === "librarycard" && (
                          <>
                            <Col md={9}>
                              <h6
                                className="mb-4 fw-bold mb-0 d-flex align-items-center justify-content-between p-3 border rounded"
                                style={{
                                  color: "var(--primary-color)",
                                  borderRadius: "10px",
                                }}
                              >
                                {moduleLabel} Information
                              </h6>

                              <Row className="px-5">
                                <Col md={3}>
                                  {normalizedFields.details
                                    .slice(0, 4)
                                    .map((field, index) =>
                                      renderFieldGroup(field, index)
                                    )}
                                </Col>

                                <Col md={3}>
                                  {normalizedFields.details
                                    .slice(4, 7)
                                    .map((field, index) =>
                                      renderFieldGroup(field, index + 4)
                                    )}
                                </Col>

                                <Col md={3}>
                                  {normalizedFields.details
                                    .slice(7, 10)
                                    .map((field, index) =>
                                      renderFieldGroup(field, index + 7)
                                    )}
                                </Col>

                                <Col md={3}>
                                  {normalizedFields.details
                                    .slice(10)
                                    .map((field, index) =>
                                      renderFieldGroup(field, index + 10)
                                    )}
                                </Col>
                              </Row>

                              <Col className="pt-4">
                                <h6
                                  className="mb-4 fw-bold mb-0 d-flex align-items-center justify-content-between p-3 border rounded"
                                  style={{
                                    color: "var(--primary-color)",
                                    borderRadius: "10px",
                                  }}
                                >
                                  Others
                                </h6>
                                <Row className="px-5">
                                  <Col md={6}>
                                    {normalizedFields.other
                                      ?.slice(0, 2)
                                      .map((field, index) =>
                                        renderFieldGroup(field, index)
                                      )}
                                  </Col>
                                  <Col md={6}>
                                    {normalizedFields.other
                                      ?.slice(2)
                                      .map((field, index) =>
                                        renderFieldGroup(field, index + 2)
                                      )}
                                  </Col>
                                </Row>
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
                            </Col>
                            <Col md={3}>
                              <h6
                                className="mb-4 fw-bold mb-0 d-flex align-items-center justify-content-between p-3 border rounded"
                                style={{
                                  color: "var(--primary-color)",
                                  background: "var(--header-highlighter-color)",
                                  borderRadius: "10px",
                                }}
                              >
                                ID Card Preview
                              </h6>
                              <IDCardPreview />
                            </Col>
                          </>
                        )}
                    </Row>
                  </Tab.Pane>

                  <Tab.Pane eventKey="related">
                    <Row>
                      <Col lg={12}>
                        <Card border="0">
                          <Card.Body className="p-0" style={{ overflow: "hidden", width: "100%", maxWidth: "100%" }}>
                            <RelatedTabContent id={id} data={data} refresh={refreshCounter} />
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
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