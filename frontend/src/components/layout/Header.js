import React, { useState, useEffect } from "react";
import { Navbar, Nav, Dropdown, Button, InputGroup, Form } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import jwt_decode from "jwt-decode";
import PubSub from "pubsub-js";

import BookSubmitModal from "../common/BookSubmitModal";
import * as constants from "../../constants/CONSTANT";
import helper from "../common/helper";
import BookSubmit from "../booksubmit/BookSubmit";
import DataApi from "../../api/dataApi";
import Submodule from "./Submodule";
import { COUNTRY_TIMEZONE } from "../../constants/COUNTRY_TIMEZONE";

export default function Header({ open, handleDrawerOpen, socket }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState(null);


  const [showBookSubmitModal, setShowBookSubmitModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dueNotifications, setDueNotifications] = useState([]); // ⬅️ always an array
  const [rolePermissions, setRolePermissions] = useState({});
  const [showReturnBookModal, setShowReturnBookModal] = useState(false);
  const [modulesFromDB, setModulesFromDB] = useState([]);

  const [formData, setFormData] = useState({
    book_barcode: "",
    condition_after: "Good",
    remarks: "",
  });
  const [visibleModulesCount, setVisibleModulesCount] = useState(5);
  const [searchBarcode, setSearchBarcode] = useState("");

  const [Company, setCompany] = useState([]);

  useEffect(() => {
    const companyUpdateToken = PubSub.subscribe("COMPANY_UPDATED", (msg, data) => {
      if (data.company) {
        setCompany(data.company);
      }
    });

    return () => {
      PubSub.unsubscribe(companyUpdateToken);
    };
  }, []);
  const getCountryFlag = () => {
    if (Company?.country) {
      const searchName = Company.country.trim().toLowerCase();
      const country = COUNTRY_TIMEZONE.find(
        (c) => c.countryName.trim().toLowerCase() === searchName
      );
      return country ? country.flagImg : "";
    }

    return "";
  };
  const fetchNotifications = async () => {
    try {
      const response = await helper.fetchWithAuth(
        `${constants.API_BASE_URL}/api/notifications`,
        "GET"
      );
      const result = await response.json();
      if (result.success) {

        setNotifications(result.notifications || []);
      } else {
        console.error("Error fetching notifications:", result.message);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };


  const fetchUnreadCount = async () => {
    try {
      const response = await helper.fetchWithAuth(
        `${constants.API_BASE_URL}/api/notifications/unread-count`,
        "GET"
      );
      const result = await response.json();
      if (result.success) {
        setUnreadCount(result.count || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const fetchModulesFromDB = async () => {
    try {

      const cachedModules = localStorage.getItem("cached_modules");
      if (cachedModules) {
        try {
          const parsed = JSON.parse(cachedModules);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setModulesFromDB(parsed);
          }
        } catch (e) {
          console.error("Error parsing cached modules:", e);
        }
      }


      const api = new DataApi("module");
      const resp = await api.fetchAll();
      const result = resp?.data;
      let modules = [];

      if (result && result.success && Array.isArray(result.records)) {
        modules = result.records;
      } else if (Array.isArray(result?.records)) {
        modules = result.records;
      } else if (Array.isArray(result)) {
        modules = result;
      }

      if (modules.length > 0) {
        setModulesFromDB(modules);

        localStorage.setItem("cached_modules", JSON.stringify(modules));
        localStorage.setItem(
          "cached_modules_timestamp",
          Date.now().toString()
        );
      } else if (!cachedModules) {

        setModulesFromDB([]);
      }
    } catch (error) {
      console.error("Error fetching modules from DB:", error);

      const cachedModules = localStorage.getItem("cached_modules");
      if (cachedModules) {
        try {
          const parsed = JSON.parse(cachedModules);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setModulesFromDB(parsed);
          }
        } catch (e) {
          console.error("Error parsing cached modules:", e);
          setModulesFromDB([]);
        }
      } else {
        setModulesFromDB([]);
      }
    }
  };

  const fetchDueNotifications = async () => {
    try {
      const response = await helper.fetchWithAuth(
        `${constants.API_BASE_URL}/api/book_submissions/due_notifications`,
        "GET"
      );
      const result = await response.json();
      if (result.success) {
        setDueNotifications(result.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  useEffect(() => {
    try {
      const token = sessionStorage.getItem("token");
      if (token) {
        const user = jwt_decode(token);
        setUserInfo(user);
        fetchDueNotifications();
        fetchNotifications();
        fetchUnreadCount();
        fetchModulesFromDB();



      } else {

        localStorage.removeItem("cached_modules");
        localStorage.removeItem("cached_modules_timestamp");
      }
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }, []);


  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "token" && e.newValue) {

        fetchModulesFromDB();
      }
    };

    const handleVisibilityChange = () => {

      if (document.visibilityState === "visible") {
        const token = sessionStorage.getItem("token");
        if (token) {
          fetchModulesFromDB();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const getMenuItems = () => {
    const moduleItems = (modulesFromDB || [])
      .filter((m) => m && m.status && m.status.toLowerCase() === "active")
      .sort((a, b) => (a.order_no || 999) - (b.order_no || 999))
      .map((m) => {
        const urlKey = (
          m.url ||
          m.api_name ||
          m.name ||
          ""
        )
          .toString()
          .toLowerCase();
        const path =
          m.url || `/${m.name.toLowerCase().replace(/\s+/g, "")}` || "/";
        return {
          id: m.id || urlKey,
          label: m.name || urlKey,
          icon: m.icon || "fa-circle",
          path,
          moduleUrl: urlKey,
        };
      });
    return moduleItems;
  };

  const menuItems = getMenuItems();


  useEffect(() => {
    const calculateVisibleModules = () => {
      const screenWidth = window.innerWidth;
      const availableWidth = screenWidth * 0.7; // 70% of screen width


      const avgModuleWidth = 110;
      const moreButtonWidth = 80; // "More" button width


      const maxModules = Math.floor(
        (availableWidth - moreButtonWidth) / avgModuleWidth
      );


      const currentMenuItems = getMenuItems();
      if (currentMenuItems.length > 0) {
        const visibleCount = Math.max(
          1,
          Math.min(maxModules, currentMenuItems.length - 1)
        );
        setVisibleModulesCount(visibleCount);
      } else {
        setVisibleModulesCount(5); // Default fallback
      }
    };

    calculateVisibleModules();
    window.addEventListener("resize", calculateVisibleModules);
    return () => window.removeEventListener("resize", calculateVisibleModules);
  }, [modulesFromDB]);

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };


  useEffect(() => {
    if (socket) {
      console.log("🔔 Setting up notification listener for socket:", socket.id);

      const handleNewNotification = (notification) => {
        console.log("📬 New notification received via socket:", notification);
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);



        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(notification.title, {
            body: notification.message,
            icon: "/logo.png",
          });
        }
      };

      socket.on("new_notification", handleNewNotification);

      return () => {
        console.log("🔕 Removing notification listener");
        socket.off("new_notification", handleNewNotification);
      };
    } else {
      console.warn("⚠️ Socket not available for notification listener");
    }
  }, [socket]);


  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Listen for company updates
  useEffect(() => {
    const companyUpdateToken = PubSub.subscribe("COMPANY_UPDATED", (msg, data) => {
      if (data.company) {
        setCompany(data.company);
      }
    });

    return () => {
      PubSub.unsubscribe(companyUpdateToken);
    };
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("r-t");
    sessionStorage.removeItem("myimage");
    sessionStorage.removeItem("lead_status");
    window.location.href = "/login";
  };

  const handleCloseReturnBookModal = () => {
    setShowReturnBookModal(false);
    setFormData({
      book_barcode: "",
      condition_after: "Good",
      remarks: "",
    });
  };

  const getUserInitials = () => {
    if (userInfo) {

      if (userInfo.username) {
        const firstLetter = userInfo.username.trim().charAt(0).toUpperCase();
        if (firstLetter) return firstLetter;
      }

      if (userInfo.firstname) {
        const firstLetter = userInfo.firstname.trim().charAt(0).toUpperCase();
        if (firstLetter) return firstLetter;
      }

      if (userInfo.email) {
        const firstLetter = userInfo.email.trim().charAt(0).toUpperCase();
        if (firstLetter) return firstLetter;
      }
    }
    return "U";
  };

  const getUserName = () => {
    if (userInfo) {

      if (userInfo.userrole) {
        return userInfo.userrole;
      }
      return `${userInfo.firstname || ""} ${userInfo.lastname || ""}`.trim() || "User";
    }
    return "User";
  };


  const handleBarcodeSearch = (e) => {
    e.preventDefault();
    if (searchBarcode.trim()) {
      navigate(`/books?q=${encodeURIComponent(searchBarcode.trim())}`);
      setSearchBarcode("");
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  function getCompanyIdFromToken() {
    const token = sessionStorage.getItem("token");
    if (!token) return null;

    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.companyid || payload.companyid || null;
  }

  const fetchCompany = async () => {
    try {
      const companyid = getCompanyIdFromToken();

      if (!companyid) {
        console.error("Company ID not found in token");
        return;
      }

      const companyApi = new DataApi("company");
      const response = await companyApi.fetchById(companyid);

      if (response.data) {
        setCompany(response.data);
        
        console.log("Company:", response.data);
      }
    } catch (error) {
      console.error("Error fetching company by ID:", error);
    }
  };

  console.log("Company", Company);

 
  const markAsRead = async (notificationId) => {
    try {
      const response = await helper.fetchWithAuth(
        `${constants.API_BASE_URL}/api/notifications/${notificationId}/read`,
        "PUT"
      );
      const result = await response.json();
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };


  const markAllAsRead = async () => {
    try {
      const response = await helper.fetchWithAuth(
        `${constants.API_BASE_URL}/api/notifications/read-all`,
        "PUT"
      );
      const result = await response.json();
      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        width: "100%",
        background: "#fafafa",
        borderBottom: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Top Row: Brand + Bell Icon + Admin Dropdown */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.5rem 0.5rem",
          borderBottom: "1px solid #e5e7eb",
          background: "#ffffff",
        }}
      >
        {/* Brand */}
        <Navbar.Brand
          href="#"
          className="fw-bold"
          style={{
            fontSize: "1.9rem",
            fontWeight: "900",
            color: "var(--primary-color)",
            letterSpacing: "0.8px",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {Company?.logourl ? (
            <img
              src={Company.logourl}
              alt="Company Logo"
              className="object-contain rounded-lg transition-transform group-hover:scale-105"
              style={{ height: "40px", width: "40px" }}
            />
          ) : (
            <div className="h-10 w-10 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-lg flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
              <i className="fa-solid fa-book-open text-lg"></i>
            </div>
          )}
          <span className="hidden md:block font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-indigo-600 tracking-tight">
            {Company?.name || " Library"}
          </span>
        </Navbar.Brand>

        {/* Search Bar */}
        <div style={{ flex: 1, maxWidth: "500px", margin: "0 2rem" }}>
          <Form onSubmit={handleBarcodeSearch}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search records across all objects..."
                value={searchBarcode}
                onChange={(e) => setSearchBarcode(e.target.value)}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px 0 0 6px",
                  padding: "8px 12px",
                  fontSize: "14px",
                  background: "#f9fafb",
                }}
              />
              <Button
                type="submit"
                variant="light"
                style={{
                  border: "1px solid #e5e7eb",
                  borderLeft: "none",
                  borderRadius: "0 6px 6px 0",
                  background: "#f9fafb",
                  padding: "8px 12px",
                  color: "#6b7280",
                }}
              >
                <i
                  className="fa-solid fa-magnifying-glass"
                  style={{ fontSize: "14px" }}
                ></i>
              </Button>
            </InputGroup>
          </Form>
        </div>

        {/* Right Side: Bell Icon + Admin Dropdown */}
        <div className="d-flex align-items-center gap-2">
          {/* Country Flag */}
          {getCountryFlag() && (
            <img
              src={getCountryFlag()}
              alt="Country Flag"
              style={{
                height: "20px",
                width: "30px",
                marginRight: "8px",
                borderRadius: "2px",
              }}
            />
          )}
          {/* Notifications Bell Icon */}
          <Dropdown
            show={showNotifications} // ⬅️ controlled by showNotifications
            onToggle={(isOpen) => {
              setShowNotifications(isOpen);
              if (isOpen) {
                fetchNotifications();
                fetchUnreadCount();
                fetchDueNotifications();
              }
            }}
          >
            <Dropdown.Toggle
              variant="link"
              className="position-relative"
              style={{
                color: "#6b7280",
                textDecoration: "none",
                border: "none",
                padding: "8px",
              }}
            >
              <i className="fa-solid fa-bell" style={{ fontSize: "20px" }}></i>
              {unreadCount > 0 && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style={{ fontSize: "10px", padding: "2px 5px" }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Dropdown.Toggle>

            {showNotifications ? (
              <Dropdown.Menu
                align="end"
                style={{
                  minWidth: "350px",
                  maxHeight: "400px",
                  overflowY: "auto",
                  marginTop: "10px",
                }}
              >
                <Dropdown.Header className="d-flex justify-content-between align-items-center">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllAsRead();
                      }}
                      style={{
                        padding: "0",
                        fontSize: "12px",
                        textDecoration: "none",
                      }}
                    >
                      Mark all as read
                    </Button>
                  )}
                </Dropdown.Header>
                <Dropdown.Divider />
                {dueNotifications.length === 0 ? (
                  <Dropdown.ItemText className="text-center text-muted">
                    No new notifications
                  </Dropdown.ItemText>
                ) : (
                  dueNotifications &&
                  dueNotifications.slice(0, 10).map((notification) => (
                    <React.Fragment key={notification.id}>
                      <Dropdown.Item
                        onClick={() => {
                          if (!notification.is_read) {
                            markAsRead(notification.id);
                          }
                          if (notification.related_type === "book_issue") {
                            navigate("/mybooks");
                          } else if (
                            notification.related_type === "book_request"
                          ) {

                          }
                        }}
                        style={{
                          backgroundColor: notification.is_read
                            ? "transparent"
                            : "#f0f4ff",
                          cursor: "pointer",
                        }}
                      >
                        <div className="d-flex">
                          <div className="me-2">
                            {notification.type === "overdue" && (
                              <i className="fa-solid fa-exclamation-triangle text-danger"></i>
                            )}
                            {notification.type === "due_today" && (
                              <i className="fa-solid fa-clock text-warning"></i>
                            )}
                            {notification.type === "book_request" && (
                              <i className="fa-solid fa-book text-primary"></i>
                            )}
                            {notification.type === "announcement" && (
                              <i className="fa-solid fa-bullhorn text-info"></i>
                            )}
                            {notification.type === "fine" && (
                              <i className="fa-solid fa-money-bill-wave text-danger"></i>
                            )}
                            {notification.type === "book_issued" && (
                              <i className="fa-solid fa-book text-success"></i>
                            )}
                            {![
                              "overdue",
                              "due_today",
                              "book_request",
                              "announcement",
                              "fine",
                              "book_issued",
                            ].includes(notification.type) && (
                                <i className="fa-solid fa-bell text-secondary"></i>
                              )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              className={`fw-semibold ${!notification.is_read ? "text-dark" : ""
                                }`}
                            >
                              {notification.message}
                            </div>
                            <small
                              className="text-muted"
                              style={{ fontSize: "12px" }}
                            >
                              {notification.due_date}
                            </small>
                            <div
                              className="text-muted"
                              style={{ fontSize: "12px" }}
                            >
                              {notification.quantity
                                ? `Quantity: ${notification.quantity}`
                                : null}
                            </div>
                          </div>
                          {!notification.is_read && (
                            <div className="ms-2">
                              <span
                                className="badge bg-primary"
                                style={{ fontSize: "8px" }}
                              >
                                New
                              </span>
                            </div>
                          )}
                        </div>
                      </Dropdown.Item>
                      <Dropdown.Divider />
                    </React.Fragment>
                  ))
                )}
                {notifications.length > 10 && (
                  <Dropdown.Item
                    className="text-center"
                    onClick={() => {

                      setShowNotifications(false);
                    }}
                  >
                    <small className="text-primary">
                      View all notifications
                    </small>
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            ) : null}
          </Dropdown>

          {/* Profile/Admin Dropdown */}
          <Dropdown>
            <Dropdown.Toggle
              variant="link"
              className="d-flex align-items-center"
              style={{
                color: "#6c757d",
                textDecoration: "none",
                border: "none",
                padding: "8px",
              }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center me-2"
                style={{
                  width: "40px",
                  height: "40px",
                  background: "var(--primary-color)",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                {getUserInitials()}
              </div>
            </Dropdown.Toggle>
            <Dropdown.Menu
              align="end"
              style={{ minWidth: "280px", marginTop: "10px" }}
            >
              {/* User Info Section */}
              <div style={{ padding: "16px" }}>
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: "60px",
                      height: "60px",
                      background: "var(--primary-color)",
                      color: "white",
                      fontWeight: "600",
                      fontSize: "20px",
                    }}
                  >
                    {getUserInitials()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: "600",
                        fontSize: "15px",
                        color: "#374151",
                        marginBottom: "4px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {userInfo?.email ||
                        userInfo?.username ||
                        "user@example.com"}
                    </div>
                    {userInfo?.secondary_email && (
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#6b7280",
                          marginBottom: "4px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {userInfo.secondary_email}
                      </div>
                    )}
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      <div style={{ marginBottom: "2px" }}>
                        {getUserName() || "User"}
                      </div>
                      <div
                        style={{
                          fontWeight: "500",
                          color: "#374151",
                        }}
                      >
                        {userInfo?.userrole?.toUpperCase() ||
                          userInfo?.role?.toUpperCase() ||
                          userInfo?.user_type?.toUpperCase() ||
                          "USER"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items Section */}
              <div style={{ padding: "8px 0" }}>
                <Dropdown.Item
                  onClick={() => navigate("/myprofile")}
                  style={{
                    padding: "10px 16px",
                    color: "#374151",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <i
                    className="fa-solid fa-user me-2"
                    style={{ width: "20px", color: "#6b7280" }}
                  ></i>
                  My Profile
                </Dropdown.Item>

                <Dropdown.Divider />
                <Dropdown.Item
                  onClick={handleLogout}
                  style={{
                    padding: "10px 16px",
                    color: "#dc3545",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <i
                    className="fa-solid fa-sign-out-alt me-2"
                    style={{ width: "20px" }}
                  ></i>
                  Logout
                </Dropdown.Item>
              </div>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      <Submodule />
    </div>
  );
}
