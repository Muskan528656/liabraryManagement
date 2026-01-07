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
  const [allNotifications, setAllNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dueNotifications, setDueNotifications] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [showReturnBookModal, setShowReturnBookModal] = useState(false);
  const [modulesFromDB, setModulesFromDB] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL"); // ALL | UNREAD | READ

  const [formData, setFormData] = useState({
    book_barcode: "",
    condition_after: "Good",
    remarks: "",
  });
  const [visibleModulesCount, setVisibleModulesCount] = useState(5);
  const [searchBarcode, setSearchBarcode] = useState("");

  const [Company, setCompany] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [userRoleName, setUserRoleName] = useState("");
  const [userDisplayName, setUserDisplayName] = useState("");


  const totalUnreadCount = React.useMemo(() => {
    const allUnread = allNotifications.filter(n => !n.is_read).length;
    const dueUnread = dueNotifications.filter(n => !n.is_read).length;
    return allUnread + dueUnread;
  }, [allNotifications, dueNotifications]);


  const filteredNotifications = React.useMemo(() => {
    const combined = [...dueNotifications, ...allNotifications];

    if (activeTab === "UNREAD") {
      return combined.filter(n => !n.is_read);
    } else if (activeTab === "READ") {
      return combined.filter(n => n.is_read);
    } else {

      return combined;
    }
  }, [allNotifications, dueNotifications, activeTab]);

  const fetchUserProfile = async () => {
    if (!userInfo || !userInfo.id) return;

    try {
      const response = await helper.fetchWithAuth(
        `${constants.API_BASE_URL}/api/user/${userInfo.id}`,
        "GET"
      );
      const result = await response.json();
      if (result) {
        setUserProfile(result);

        const fullName = `${result.firstname || ""} ${result.lastname || ""}`.trim();
        setUserDisplayName(fullName || result.username || result.email || "User");

        if (result.role_id || result.role) {
          await fetchUserRoleName(result.role_id || result.role);
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchUserRoleName = async (roleId) => {
    try {
      if (!roleId) {
        setUserRoleName("");
        return;
      }

      const token = sessionStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwt_decode(token);
          const possibleRoleFields = [
            'role_name',
            'userrole_name',
            'user_role_name',
            'roleName',
            'role'
          ];

          for (const field of possibleRoleFields) {
            if (decoded[field] && typeof decoded[field] === 'string') {
              const roleName = decoded[field];
              setUserRoleName(roleName.toUpperCase());
              return;
            }
          }
        } catch (tokenError) {
          console.error("Error decoding token:", tokenError);
        }
      }

      const cachedRoles = localStorage.getItem("cached_roles");
      if (cachedRoles) {
        try {
          const roles = JSON.parse(cachedRoles);
          const role = roles.find(r =>
            r.id === roleId ||
            r._id === roleId ||
            r.role_id === roleId
          );
          if (role) {
            setUserRoleName((role.role_name || role.name || "").toUpperCase());
            return;
          }
        } catch (e) {
          console.error("Error parsing cached roles:", e);
        }
      }

      try {
        const roleApi = new DataApi("role");
        const response = await roleApi.fetchById(roleId);

        if (response.data) {
          const roleName = response.data.role_name || response.data.name || "";
          setUserRoleName(roleName.toUpperCase());

          const existingRoles = cachedRoles ? JSON.parse(cachedRoles) : [];
          if (!existingRoles.some(r => r.id === roleId || r._id === roleId)) {
            existingRoles.push({
              id: roleId,
              role_name: roleName,
              name: roleName
            });
            localStorage.setItem("cached_roles", JSON.stringify(existingRoles));
          }
          return;
        }
      } catch (roleError) {
        console.error("Error fetching role by ID:", roleError);
      }

      try {
        const roleApi = new DataApi("role");
        const response = await roleApi.fetchAll();

        if (response.data) {
          let allRoles = [];

          if (response.data.success && Array.isArray(response.data.records)) {
            allRoles = response.data.records;
          } else if (Array.isArray(response.data.records)) {
            allRoles = response.data.records;
          } else if (Array.isArray(response.data)) {
            allRoles = response.data;
          } else if (Array.isArray(response.data.data)) {
            allRoles = response.data.data;
          }

          const foundRole = allRoles.find(role =>
            role.id === roleId ||
            role._id === roleId ||
            role.role_id === roleId
          );

          if (foundRole) {
            const roleName = foundRole.role_name || foundRole.name || "";
            setUserRoleName(roleName.toUpperCase());

            const existingRoles = cachedRoles ? JSON.parse(cachedRoles) : [];
            if (!existingRoles.some(r => r.id === roleId || r._id === roleId)) {
              existingRoles.push({
                id: roleId,
                role_name: roleName,
                name: roleName
              });
              localStorage.setItem("cached_roles", JSON.stringify(existingRoles));
            }
            return;
          }
        }
      } catch (allRolesError) {
        console.error("Error fetching all roles:", allRolesError);
      }

      if (userInfo) {
        const possibleFields = ['role_name', 'userrole_name', 'user_role', 'roleName'];
        for (const field of possibleFields) {
          if (userInfo[field] && typeof userInfo[field] === 'string') {
            setUserRoleName(userInfo[field].toUpperCase());
            return;
          }
        }
      }

      setUserRoleName("");
    } catch (error) {
      console.error("Error fetching role name:", error);
      setUserRoleName("");
    }
  };

  useEffect(() => {
    const companyUpdateToken = PubSub.subscribe("COMPANY_UPDATED", (msg, data) => {
      if (data.company) {
        setCompany(data.company);
      }
    });

    const userUpdateToken = PubSub.subscribe("USER_UPDATED", (msg, data) => {
      fetchUserProfile();
    });

    return () => {
      PubSub.unsubscribe(companyUpdateToken);
      PubSub.unsubscribe(userUpdateToken);
    };
  }, [userInfo]);

  const getCountryFlag = () => {
    if (userProfile?.country) {
      const searchName = userProfile.country.trim().toLowerCase();
      const country = COUNTRY_TIMEZONE.find(
        (c) => c.countryName.toLowerCase() === searchName
      );
      return country ? country.flagImg : "";
    }
    return "";
  };

  const fetchAllNotifications = async () => {
    try {
      const response = await helper.fetchWithAuth(
        `${constants.API_BASE_URL}/api/notifications`,
        "GET"
      );
      const result = await response.json();
      if (result.success) {
        setAllNotifications(result.notifications || []);
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
      } else {
        console.error("Error in unread count API:", result.message);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
      setUnreadCount(0);
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
      console.error("Error fetching due notifications:", error);
    }
  };

  useEffect(() => {
    try {
      const token = sessionStorage.getItem("token");
      if (token) {
        const user = jwt_decode(token);

        setUserInfo(user);

        if (user.role_name || user.userrole_name) {
          setUserRoleName((user.role_name || user.userrole_name).toUpperCase());
        }

        fetchDueNotifications();
        fetchAllNotifications();
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
    if (userInfo && userInfo.id) {
      fetchUserProfile();
    }
  }, [userInfo]);

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
      const availableWidth = screenWidth * 0.7;

      const avgModuleWidth = 110;
      const moreButtonWidth = 80;

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
        setVisibleModulesCount(5);
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


      const handleNewNotification = (notification) => {

        setAllNotifications((prev) => [notification, ...prev]);
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

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("r-t");
    sessionStorage.removeItem("myimage");
    sessionStorage.removeItem("lead_status");
    localStorage.removeItem("cached_roles");
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

  const getUserRoleDisplay = () => {
    if (userRoleName) {
      return userRoleName;
    }

    if (userInfo) {
      const possibleFields = ['role_name', 'userrole_name', 'roleName', 'user_role'];
      for (const field of possibleFields) {
        if (userInfo[field] && typeof userInfo[field] === 'string') {
          if (userInfo[field].length < 30 && !userInfo[field].match(/^[0-9a-fA-F]{24}$/)) {
            return userInfo[field].toUpperCase();
          }
        }
      }
    }

    if (userProfile) {
      if (userProfile.role_name && typeof userProfile.role_name === 'string') {
        return userProfile.role_name.toUpperCase();
      }
    }

    return "USER";
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
        console.log("Fetched company data:", response.data);
        setCompany(response.data);
      }
    } catch (error) {
      console.error("Error fetching company by ID:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await helper.fetchWithAuth(
        `${constants.API_BASE_URL}/api/notifications/${notificationId}/read`,
        "PUT"
      );
      const result = await response.json();
      if (result.success) {

        setAllNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );

        setDueNotifications((prev) =>
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

        setAllNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setDueNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };


  const handleNotificationClick = (notification) => {

    if (!notification.is_read) {
      markAsRead(notification.id);
    }


    setAllNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, is_read: true } : n
      )
    );
    setDueNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, is_read: true } : n
      )
    );


    if (notification.type === 'book_due') {
      navigate("/mybooks");
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
          className="fw-bold "
          style={{
            fontSize: "1.7rem",
            fontWeight: "900",
            color: "var(--primary-color)",
            letterSpacing: "0.8px",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <img
            src={Company?.company_logo_url || "/Logo.png"}
            // src="/Logo.png"

            height="50"
            style={{ height: "50px", marginLeft: '20px', objectFit: "contain" }}
          />
          <span>{Company?.name}</span>
        </Navbar.Brand>

        {/* Search Bar */}
        {/* <div style={{ flex: 1, maxWidth: "500px", margin: "0 2rem" }}>
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
        </div> */}

        {/* Right Side: Bell Icon + Admin Dropdown */}

        <button
          className="shadow-lg pulse-button"
          style={{
            position: "fixed",
            bottom: "100px",
            right: "20px",
            zIndex: 1000,
            width: "54px",
            height: "54px",
            borderRadius: "50%",
            backgroundImage: "url('/logoo.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            // border: "2px solid var(--primary-color)",
            boxShadow: "0 4px 16px rgba(139, 92, 246, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0",
            transition: "all 0.3s ease",
            position: "relative"
          }}
        >
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(139, 92, 246, 0.7)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>sadfghjhgfd
            <i className="fas fa-barcode" style={{
              fontSize: "24px",
              color: "white",
              zIndex: 2
            }}></i>asdsdfsdgfd
          </div>
        </button>
        <div className="d-flex align-items-center gap-2">
          {/* 
          {getCountryFlag() && (
            <img
              src={getCountryFlag()}
              alt="Country Flag"
              style={{
                height: "20px",
                width: "30px",
                marginRight: "8px",
                borderRadius: "2px",
                objectFit: "cover",
                border: "1px solid #eee"
              }}
            />
          )} */}


          <Dropdown
            show={showNotifications}
            onToggle={(isOpen) => {
              setShowNotifications(isOpen);
              if (isOpen) {
                fetchAllNotifications();
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
              {totalUnreadCount > 0 && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style={{ fontSize: "10px", padding: "2px 5px" }}
                >
                  {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                </span>
              )}
            </Dropdown.Toggle>

            {showNotifications && (
              <Dropdown.Menu
                align="end"
                style={{
                  width: "360px",
                  borderRadius: "14px",
                  padding: "0",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                  overflow: "hidden",
                }}
              >

                {/* HEADER */}
                <div className="d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
                  <h6 className="mb-0 fw-bold">Notifications</h6>
                  {totalUnreadCount > 0 && (
                    <span
                      style={{ fontSize: "13px", color: "#2563eb", cursor: "pointer" }}
                      onClick={markAllAsRead}
                    >
                      Mark all as read
                    </span>
                  )}
                </div>

                {/* TABS */}
                <div className="d-flex mx-3 my-2 bg-light rounded-pill p-1">
                  {["ALL", "UNREAD", "READ"].map((tab) => (
                    <div
                      key={tab}
                      className="flex-fill text-center py-1 rounded-pill"
                      style={{
                        cursor: "pointer",
                        fontWeight: activeTab === tab ? "600" : "400",
                        background: activeTab === tab ? "#fff" : "transparent",
                        color: activeTab === tab ? "#111827" : "#6b7280",
                      }}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </div>
                  ))}
                </div>

                {/* NOTIFICATIONS LIST */}
                <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      {activeTab === "UNREAD"
                        ? "No unread notifications"
                        : activeTab === "READ"
                          ? "No read notifications"
                          : "No notifications"}
                    </div>
                  ) : (
                    filteredNotifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        style={{
                          padding: "12px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          cursor: "pointer",
                          background: notification.is_read ? "#fff" : "#f3f6ff",
                          borderBottom: "1px solid #f1f1f1",
                          position: "relative",
                        }}
                      >
                        {/* ICON */}
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "50%",
                            background: notification.is_read ? "#f3f4f6" : "#e5edff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "16px",
                            color: notification.is_read ? "#6b7280" : "#2563eb",
                          }}
                        >
                          {notification.type === 'book_due' ? (
                            <i className="fa-solid fa-book"></i>
                          ) : (
                            <i className="fa-solid fa-bell"></i>
                          )}
                        </div>

                        {/* CONTENT */}
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: notification.is_read ? 400 : 600,
                              color: notification.is_read ? "#6b7280" : "#111827",
                            }}
                          >
                            {notification.message || notification.title}
                          </div>
                          <div className="text-muted" style={{ fontSize: "12px" }}>
                            {notification.created_at || notification.due_date}
                          </div>
                        </div>

                        {/* UNREAD INDICATOR - shows only if unread */}
                        {!notification.is_read && (
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "#2563eb",
                            }}
                          ></div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* FOOTER */}
                <div
                  className="text-center py-2 border-top"
                  style={{ fontSize: "13px", color: "#2563eb", cursor: "pointer" }}
                  onClick={() => setShowNotifications(false)}
                >
                  Close
                </div>
              </Dropdown.Menu>
            )}
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
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      <div style={{ marginBottom: "2px" }}>
                        {userDisplayName || "User"}
                      </div>
                      <div
                        style={{
                          fontWeight: "500",
                          color: "#374151",
                        }}
                      >
                        {getUserRoleDisplay()}
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