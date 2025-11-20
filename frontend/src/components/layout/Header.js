import React, { useState, useEffect } from "react";
import { Navbar, Nav, Dropdown, Button, InputGroup, Form } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import jwt_decode from "jwt-decode";
// import QuickActions from "../common/QuickActions";
import BookSubmitModal from "../common/BookSubmitModal";
import * as constants from "../../constants/CONSTANT";
import helper from "../common/helper";
import BookSubmit from "../booksubmit/BookSubmit";
import DataApi from "../../api/dataApi";

export default function Header({ open, handleDrawerOpen, socket }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState(null);
  // const [showQuickAction, setShowQuickAction] = useState(false);
  // const [quickActionType, setQuickActionType] = useState(null);
  const [showBookSubmitModal, setShowBookSubmitModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
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

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await helper.fetchWithAuth(
        `${constants.API_BASE_URL}/api/notifications`,
        "GET"
      );
      const result = await response.json();
      if (result.success) {
        // Show all notifications, not just unread
        setNotifications(result.notifications || []);
      } else {
        console.error("Error fetching notifications:", result.message);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Fetch unread count
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

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await helper.fetchWithAuth(
        `${constants.API_BASE_URL}/api/notifications/${notificationId}/read`,
        "PUT"
      );
      const result = await response.json();
      if (result.success) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await helper.fetchWithAuth(
        `${constants.API_BASE_URL}/api/notifications/read-all`,
        "PUT"
      );
      const result = await response.json();
      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  
  // Fetch role permissions
  // const fetchRolePermissions = async (userRole) => {
  //   try {
  //     // ADMIN has all permissions
  //     if (userRole === "ADMIN") {
  //       const allModules = ["books", "author", "category", "supplier", "vendor", "purchase", "user", "librarycard", "bookissue", "bookrequest", "penalty", "booksubmit"];
  //       const allPerms = {};
  //       allModules.forEach(module => {
  //         allPerms[module] = { can_create: true, can_read: true, can_update: true, can_delete: true };
  //       });
  //       setRolePermissions(allPerms);
  //       return;
  //     }

  //     const response = await helper.fetchWithAuth(
  //       `${constants.API_BASE_URL}/api/role-permissions/current-user`,
  //       "GET"
  //     );
  //     const result = await response.json();

  //     if (result.success) {
  //       const permMap = {};
  //       result.permissions.forEach(perm => {
  //         permMap[perm.module_name] = {
  //           can_create: perm.can_create,
  //           can_read: perm.can_read,
  //           can_update: perm.can_update,
  //           can_delete: perm.can_delete
  //         };
  //       });
  //       setRolePermissions(permMap);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching role permissions:", error);
  //     setRolePermissions({});
  //   }
  // };

  // Fetch modules from DB with localStorage cache
  const fetchModulesFromDB = async () => {
    try {
      // First, try to load from localStorage (for faster initial load in new tabs)
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

      // Then fetch fresh data from API
      const api = new DataApi("whatsapp/module");
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
        // Cache modules in localStorage for faster loading in new tabs
        localStorage.setItem("cached_modules", JSON.stringify(modules));
        localStorage.setItem("cached_modules_timestamp", Date.now().toString());
      } else if (!cachedModules) {
        // Only set empty if we don't have cached data
        setModulesFromDB([]);
      }
    } catch (error) {
      console.error("Error fetching modules from DB:", error);
      // If API fails, try to use cached data if available
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

  useEffect(() => {
    try {
      const token = sessionStorage.getItem("token");
      if (token) {
        const user = jwt_decode(token);
        setUserInfo(user);
        fetchNotifications();
        fetchUnreadCount();
        fetchModulesFromDB();
        // if (user.userrole) {
        //   // fetchRolePermissions(user.userrole);
        // }
      } else {
        // If no token, clear cached modules
        localStorage.removeItem("cached_modules");
        localStorage.removeItem("cached_modules_timestamp");
      }
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }, []);

  // Re-fetch modules when token changes (for new tabs) and when tab becomes visible
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "token" && e.newValue) {
        // Token was set in another tab, refresh modules
        fetchModulesFromDB();
      }
    };

    const handleVisibilityChange = () => {
      // When tab becomes visible, refresh modules if token exists
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
      .filter(m => m && m.status && m.status.toLowerCase() === "active")
      .sort((a, b) => (a.order_no || 999) - (b.order_no || 999))
      .map(m => {
        const urlKey = (m.url || m.api_name || m.name || "").toString().toLowerCase();
        const path = m.url || `/${m.name.toLowerCase().replace(/\s+/g, "")}` || "/";
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

  // Calculate visible modules based on 70% screen width
  useEffect(() => {
    const calculateVisibleModules = () => {
      const screenWidth = window.innerWidth;
      const availableWidth = screenWidth * 0.7; // 70% of screen width

      // Estimate width per module: icon (12px) + padding (12px*2) + text (average 80px) + gap (4px)
      // Average module width: ~110px (conservative estimate)
      const avgModuleWidth = 110;
      const moreButtonWidth = 80; // "More" button width

      // Calculate how many modules can fit
      const maxModules = Math.floor((availableWidth - moreButtonWidth) / avgModuleWidth);

      // Ensure at least 1 module is visible, and at least 1 goes to "More" if there are many modules
      const currentMenuItems = getMenuItems();
      if (currentMenuItems.length > 0) {
        const visibleCount = Math.max(1, Math.min(maxModules, currentMenuItems.length - 1));
        setVisibleModulesCount(visibleCount);
      } else {
        setVisibleModulesCount(5); // Default fallback
      }
    };

    calculateVisibleModules();
    window.addEventListener('resize', calculateVisibleModules);
    return () => window.removeEventListener('resize', calculateVisibleModules);
  }, [modulesFromDB]);

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  // Listen to socket notifications
  useEffect(() => {
    if (socket) {
      console.log("🔔 Setting up notification listener for socket:", socket.id);

      const handleNewNotification = (notification) => {
        console.log("📬 New notification received via socket:", notification);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Show browser notification if permission granted
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(notification.title, {
            body: notification.message,
            icon: "/logo.png"
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

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
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

  // const handleCloseBookSubmitModal = () => {
  //   setShowBookSubmitModal(false);
  // };

  // const handleQuickAction = (actionType) => {
  //   setQuickActionType(actionType);
  //   setShowQuickAction(true);
  // };

  const getUserInitials = () => {
    if (userInfo) {
      // Try to get first letter from username (full name)
      if (userInfo.username) {
        const firstLetter = userInfo.username.trim().charAt(0).toUpperCase();
        if (firstLetter) return firstLetter;
      }
      // Fallback to firstname
      if (userInfo.firstname) {
        const firstLetter = userInfo.firstname.trim().charAt(0).toUpperCase();
        if (firstLetter) return firstLetter;
      }
      // Fallback to email
      if (userInfo.email) {
        const firstLetter = userInfo.email.trim().charAt(0).toUpperCase();
        if (firstLetter) return firstLetter;
      }
    }
    return "U";
  };

  const getUserName = () => {
    if (userInfo) {
      // Show role instead of "User"
      if (userInfo.userrole) {
        return userInfo.userrole;
      }
      return `${userInfo.firstname || ""} ${userInfo.lastname || ""}`.trim() || "User";
    }
    return "User";
  };

  // Handle barcode search
  const handleBarcodeSearch = (e) => {
    e.preventDefault();
    if (searchBarcode.trim()) {
      // Navigate to books page with search query
      navigate(`/books?q=${encodeURIComponent(searchBarcode.trim())}`);
      setSearchBarcode("");
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
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
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
          background: "#ffffff"
        }}
      >
        {/* Brand */}
        <Navbar.Brand
          href="#"
          className="fw-bold"
          style={{ fontSize: "1.9rem", fontWeight: "900", color: "rgb(1, 118, 211)", letterSpacing: "0.8px", margin: 0 }}
        >
          Library Management
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
                  background: "#f9fafb"
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
                  color: "#6b7280"
                }}
              >
                <i className="fa-solid fa-magnifying-glass" style={{ fontSize: "14px" }}></i>
              </Button>
            </InputGroup>
          </Form>
        </div>

        {/* Right Side: Bell Icon + Admin Dropdown */}
        <div className="d-flex align-items-center gap-2">
          {/* Notifications Bell Icon */}
          <Dropdown
            show={showNotifications}
            onToggle={(isOpen) => {
              setShowNotifications(isOpen);
              if (isOpen) {
                fetchNotifications();
                fetchUnreadCount();
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
            <Dropdown.Menu align="end" style={{ minWidth: "350px", maxHeight: "400px", overflowY: "auto", marginTop: "10px" }}>
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
                    style={{ padding: "0", fontSize: "12px", textDecoration: "none" }}
                  >
                    Mark all as read
                  </Button>
                )}
              </Dropdown.Header>
              <Dropdown.Divider />
              {notifications.length === 0 ? (
                <Dropdown.ItemText className="text-center text-muted">
                  No new notifications
                </Dropdown.ItemText>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <React.Fragment key={notification.id}>
                    <Dropdown.Item
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsRead(notification.id);
                        }
                        if (notification.related_type === "book_issue") {
                          navigate("/mybooks");
                        } else if (notification.related_type === "book_request") {
                          // navigate("/bookrequest");
                        }
                        setShowNotifications(false);
                      }}
                      style={{
                        backgroundColor: notification.is_read ? "transparent" : "#f0f4ff",
                        cursor: "pointer"
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
                          {!["overdue", "due_today", "book_request", "announcement", "fine", "book_issued"].includes(notification.type) && (
                            <i className="fa-solid fa-bell text-secondary"></i>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className={`fw-semibold ${!notification.is_read ? "text-dark" : ""}`}>
                            {notification.title}
                          </div>
                          <small className="text-muted" style={{ fontSize: "12px" }}>
                            {notification.message}
                          </small>
                          <div className="text-muted" style={{ fontSize: "10px", marginTop: "4px" }}>
                            {new Date(notification.created_at).toLocaleString()}
                          </div>
                        </div>
                        {!notification.is_read && (
                          <div className="ms-2">
                            <span className="badge bg-primary" style={{ fontSize: "8px" }}>New</span>
                          </div>
                        )}
                      </div>
                    </Dropdown.Item>
                    <Dropdown.Divider />
                  </React.Fragment>
                ))
              )}
              {notifications.length > 10 && (
                <>
                  <Dropdown.Item
                    className="text-center"
                    onClick={() => {
                      navigate("/notifications");
                      setShowNotifications(false);
                    }}
                  >
                    <small className="text-primary">View all notifications</small>
                  </Dropdown.Item>
                </>
              )}
            </Dropdown.Menu>
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
                  background: "#6f42c1",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                {getUserInitials()}
              </div>
            </Dropdown.Toggle>
            <Dropdown.Menu align="end" style={{ minWidth: "280px", marginTop: "10px" }}>
              {/* User Info Section */}
              <div style={{ padding: "16px" }}>
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: "60px",
                      height: "60px",
                      background: "#6f42c1",
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
                        whiteSpace: "nowrap"
                      }}
                    >
                      {userInfo?.email || userInfo?.username || "user@example.com"}
                    </div>
                    {userInfo?.secondary_email && (
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#6b7280",
                          marginBottom: "4px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {userInfo.secondary_email}
                      </div>
                    )}
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      <div style={{ marginBottom: "2px" }}>
                        {getUserName() || "User"}
                      </div>
                      <div style={{ fontWeight: "500", color: "#374151" }}>
                        {userInfo?.userrole?.toUpperCase() || userInfo?.role?.toUpperCase() || userInfo?.user_type?.toUpperCase() || "USER"}
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
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <i className="fa-solid fa-user me-2" style={{ width: "20px", color: "#6b7280" }}></i>
                  My Profile
                </Dropdown.Item>

                <Dropdown.Divider />
                <Dropdown.Item
                  onClick={handleLogout}
                  style={{
                    padding: "10px 16px",
                    color: "#dc3545",
                    fontSize: "14px",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <i className="fa-solid fa-sign-out-alt me-2" style={{ width: "20px" }}></i>
                  Logout
                </Dropdown.Item>
              </div>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      {/* Bottom Row: Navigation Modules */}
      <Navbar
        expand="lg"
        style={{
          padding: "0.75rem 1.5rem",

          background: "dadde2",
          boxShadow: "none"
        }}
      >
        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        <Navbar.Collapse id="basic-navbar-nav">
          {/* Modules Navigation - Light Gray Theme with Dropdown for many modules */}
          <Nav className="me-auto d-flex align-items-center gap-1" style={{ flexWrap: "wrap" }}>
            {menuItems.length <= 6 ? (
              // Show all modules as links if 6 or fewer
              menuItems.map((item) => (
                <Nav.Link
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  style={{
                    color: "#000000",
                    background: isActive(item.path) ? "#f3f4f6" : "transparent",
                    borderRadius: "6px",
                    padding: "10px 16px",
                    fontSize: "15px",
                    fontWeight: isActive(item.path) ? "600" : "400",
                    textDecoration: "none",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    border: "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.background = "#f3f4f6";
                      e.currentTarget.style.color = "#000000";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#000000";
                    }
                  }}
                >
                  <i className={`fa-solid ${item.icon} me-1`} style={{ fontSize: "13px" }}></i>
                  {item.label}
                </Nav.Link>
              ))
            ) : (
              // Show modules up to 70% width, rest in dropdown
              <>
                {menuItems.slice(0, visibleModulesCount).map((item) => (
                  <Nav.Link
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    style={{
                      color: isActive(item.path) ? "#374151" : "#6b7280",
                      background: isActive(item.path) ? "#f3f4f6" : "transparent",
                      borderRadius: "6px",
                      padding: "10px 16px",
                      fontSize: "15px",
                      fontWeight: isActive(item.path) ? "500" : "400",
                      textDecoration: "none",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      border: "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive(item.path)) {
                        e.currentTarget.style.background = "#f9fafb";
                        e.currentTarget.style.color = "#374151";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(item.path)) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#6b7280";
                      }
                    }}
                  >
                    <i className={`fa-solid ${item.icon} me-1`} style={{ fontSize: "13px" }}></i>
                    {item.label}
                  </Nav.Link>
                ))}
                {/* Dropdown for remaining modules */}
                <Dropdown>
                  <Dropdown.Toggle
                    variant="link"
                    style={{
                      color: "#000000",
                      textDecoration: "none",
                      border: "none",
                      padding: "10px 16px",
                      fontSize: "15px",
                      fontWeight: "400",
                      borderRadius: "6px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f3f4f6";
                      e.currentTarget.style.color = "#000000";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#000000";
                    }}
                  >
                    <i className="fa-solid fa-ellipsis me-1" style={{ fontSize: "13px" }}></i>
                    More
                    <i className="fa-solid fa-chevron-down ms-1" style={{ fontSize: "11px" }}></i>
                  </Dropdown.Toggle>
                  <Dropdown.Menu align="start" style={{
                    minWidth: "220px",
                    maxHeight: "500px",
                    overflowY: "auto",
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    borderRadius: "8px",
                    marginTop: "8px",
                    padding: "4px 0"
                  }}>
                    {menuItems.slice(visibleModulesCount).map((item) => (
                      <Dropdown.Item
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        style={{
                          color: isActive(item.path) ? "#000000" : "#374151",
                          background: isActive(item.path) ? "#f3f4f6" : "transparent",
                          padding: "12px 18px",
                          fontSize: "15px",
                          fontWeight: isActive(item.path) ? "600" : "400",
                          borderRadius: "4px",
                          margin: "2px 8px",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive(item.path)) {
                            e.currentTarget.style.background = "#f3f4f6";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive(item.path)) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        <i className={`fa-solid ${item.icon} me-2`} style={{ fontSize: "12px", width: "16px", color: "#6b7280" }}></i>
                        {item.label}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      {/* <QuickActions
        show={showQuickAction}
        onHide={() => {
          setShowQuickAction(false);
          setQuickActionType(null);
        }}
        actionType={quickActionType}
      /> */}

      {/* <BookSubmitModal
        show={showBookSubmitModal}
        onHide={handleCloseBookSubmitModal}
      /> */}
    </div>
  );
}