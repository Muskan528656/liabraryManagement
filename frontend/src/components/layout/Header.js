import React, { useState, useEffect } from "react";
import {
  Navbar,
  Nav,
  Dropdown,
  Button,
  InputGroup,
  Form,
  Modal,
} from "react-bootstrap";
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
import UniversalBarcodeScanner from "../common/UniversalBarcodeScanner";
import { useBookSubmission } from "../../contexts/BookSubmissionContext";
import { useBranch } from "../../contexts/BranchContext";

export default function Header({ socket }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useBookSubmission();
  const { branches, selectedBranch, selectBranch, isSuperAdmin, loading: branchLoading } = useBranch();
  const [userInfo, setUserInfo] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const [showReturnBookModal, setShowReturnBookModal] = useState(false);
  const [modulesFromDB, setModulesFromDB] = useState([]);
  const [activeTab, setActiveTab] = useState("UNREAD");

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
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [allNotifications, setAllNotifications] = useState([]);
  const [notifications, setNotifications] = useState([]);


  const getRelativeTime = (dateString) => {

    console.log("createddate", dateString)
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();

  if (isNaN(date.getTime())) return dateString;

  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60)
    return diffInMinutes === 1
      ? "1 min ago"
      : `${diffInMinutes} min ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24)
    return diffInHours === 1
      ? "1 hour ago"
      : `${diffInHours} hours ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7)
    return diffInDays === 1
      ? "Yesterday"
      : `${diffInDays} days ago`;

  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return weeks === 1
      ? "1 week ago"
      : `${weeks} weeks ago`;
  }

  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return months === 1
      ? "1 month ago"
      : `${months} months ago`;
  }

  const years = Math.floor(diffInDays / 365);
  return years === 1
    ? "1 year ago"
    : `${years} years ago`;
};


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

        const fullName = `${result.firstname || ""} ${result.lastname || ""
          }`.trim();
        setUserDisplayName(
          fullName || result.username || result.email || "User"
        );

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
            "role_name",
            "userrole_name",
            "user_role_name",
            "roleName",
            "role",
          ];

          for (const field of possibleRoleFields) {
            if (decoded[field] && typeof decoded[field] === "string") {
              const roleName = decoded[field];
              setUserRoleName(roleName.toUpperCase());
              return;
            }
          }
        } catch (tokenError) {
          console.error("Error decoding token:", tokenError);
        }
      }

      const cachedRoles = sessionStorage.getItem("cached_roles");
      if (cachedRoles) {
        try {
          const roles = JSON.parse(cachedRoles);
          const role = roles.find(
            (r) => r.id === roleId || r._id === roleId || r.role_id === roleId
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
          if (!existingRoles.some((r) => r.id === roleId || r._id === roleId)) {
            existingRoles.push({
              id: roleId,
              role_name: roleName,
              name: roleName,
            });
            sessionStorage.setItem("cached_roles", JSON.stringify(existingRoles));
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

          const foundRole = allRoles.find(
            (role) =>
              role.id === roleId ||
              role._id === roleId ||
              role.role_id === roleId
          );

          if (foundRole) {
            const roleName = foundRole.role_name || foundRole.name || "";
            setUserRoleName(roleName.toUpperCase());

            const existingRoles = cachedRoles ? JSON.parse(cachedRoles) : [];
            if (
              !existingRoles.some((r) => r.id === roleId || r._id === roleId)
            ) {
              existingRoles.push({
                id: roleId,
                role_name: roleName,
                name: roleName,
              });
              sessionStorage.setItem(
                "cached_roles",
                JSON.stringify(existingRoles)
              );
            }
            return;
          }
        }
      } catch (allRolesError) {
        console.error("Error fetching all roles:", allRolesError);
      }

      if (userInfo) {
        const possibleFields = [
          "role_name",
          "userrole_name",
          "user_role",
          "roleName",
        ];
        for (const field of possibleFields) {
          if (userInfo[field] && typeof userInfo[field] === "string") {
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
    const companyUpdateToken = PubSub.subscribe(
      "COMPANY_UPDATED",
      (msg, data) => {
        if (data.company) {
          setCompany(data.company);
        }
      }
    );

    const userUpdateToken = PubSub.subscribe("USER_UPDATED", (msg, data) => {
      fetchUserProfile();
    });

    const notificationsUpdateToken = PubSub.subscribe("NOTIFICATIONS_UPDATED", (msg, data) => {
      console.log("Notifications updated event received:", data);
      fetchAllNotifications();
    });

    return () => {
      PubSub.unsubscribe(companyUpdateToken);
      PubSub.unsubscribe(userUpdateToken);
      PubSub.unsubscribe(notificationsUpdateToken);
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
        `${constants.API_BASE_URL}/api/notifications/all`,
        "GET"
      );
      const result = await response.json();
      console.log("notification reuslt=>", result);
      if (result.success) {
        setAllNotifications(result.all_notifications || []);
        setNotifications(result.unread_notifications || []);
      } else {
        console.error("Error fetching notifications:", result.message);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };


  useEffect(() => {
    fetchAllNotifications();
  }, []);



  const fetchModulesFromDB = async () => {
    try {
      const cachedModules = sessionStorage.getItem("cached_modules");
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
        sessionStorage.setItem("cached_modules", JSON.stringify(modules));
        sessionStorage.setItem("cached_modules_timestamp", Date.now().toString());
      } else if (!cachedModules) {
        setModulesFromDB([]);
      }
    } catch (error) {
      console.error("Error fetching modules from DB:", error);
      const cachedModules = sessionStorage.getItem("cached_modules");
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

        if (user.role_name || user.userrole_name) {
          setUserRoleName((user.role_name || user.userrole_name).toUpperCase());
        }
        fetchModulesFromDB();
      } else {
        sessionStorage.removeItem("cached_modules");
        sessionStorage.removeItem("cached_modules_timestamp");
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
        const urlKey = (m.url || m.api_name || m.name || "")
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
    if (!socket || !userInfo || !userInfo.id) {
      console.warn("⚠️ Socket or user info not available for notification setup");
      return;
    }

    console.log("🔌 Setting up socket notifications for user:", userInfo.id);

    const handleNewNotification = (notification) => {
      console.log("📨 Received new notification:", notification);
      setNotifications(prev => [notification, ...prev]);
      setAllNotifications(prev => [notification, ...prev]);


      PubSub.publish("NOTIFICATIONS_UPDATED", {
        type: "new_notification",
        notification: notification
      });

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(notification.title || "Library Notification", {
          body: notification.message,
          icon: "/logo.png",
        });
      }
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      console.log("🔌 Cleaning up socket notification listeners");
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, userInfo]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    sessionStorage.removeItem("cached_roles");
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
        const firstLetter = userInfo.username[0].trim().charAt(0).toUpperCase();
        if (firstLetter) return firstLetter;
      }
      if (userInfo.firstname) {
        const firstLetter = userInfo.firstname[0]
          .trim()
          .charAt(0)
          .toUpperCase();
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
      const possibleFields = [
        "role_name",
        "userrole_name",
        "roleName",
        "user_role",
      ];
      for (const field of possibleFields) {
        if (userInfo[field] && typeof userInfo[field] === "string") {
          if (
            userInfo[field].length < 30 &&
            !userInfo[field].match(/^[0-9a-fA-F]{24}$/)
          ) {
            return userInfo[field].toUpperCase();
          }
        }
      }
    }

    if (userProfile) {
      if (userProfile.role_name && typeof userProfile.role_name === "string") {
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

  const [, setForceUpdate] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setForceUpdate(prev => !prev);
    }, 60000); // every 1 minute

    return () => clearInterval(interval);
  }, []);


  const handleMarkAsRead = async (notificationId) => {
  try {
    const response = await helper.fetchWithAuth(
      `${constants.API_BASE_URL}/api/notifications/${notificationId}/read`,
      "PUT"
    );

    const result = await response.json();

    if (result.success) {
      // Update ALL notifications
      setAllNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );

      // Remove from unread list instantly
      setNotifications(prev =>
        prev.filter(n => n.id !== notificationId)
      );
    }
  } catch (error) {
    console.error("Error marking as read:", error);
  }
};

const handleMarkAllAsRead = async () => {
  try {
    const response = await helper.fetchWithAuth(
      `${constants.API_BASE_URL}/api/notifications/mark-all-read`,
      "PUT"
    );

    const result = await response.json();

    console.log("result=>", result);

    if (result.success) {
      // Update all to read
      setAllNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );

      // Clear unread instantly
      setNotifications([]);
    }
  } catch (error) {
    console.error("Error marking all as read:", error);
  }
};


  const handleNotificationClick = (notification) => {
    if (notification.type === "book_due") {
      navigate("/mybooks");
    }
    if (notification.type === "due_reminder") {
      navigate("/booksubmit");
    }


    console.log(notification.type);
    navigate("/booksubmit");


  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const response = await helper.fetchWithAuth(
        `${constants.API_BASE_URL}/api/notifications/${notificationId}`,
        "DELETE"
      );
      const result = await response.json();
      if (result.success) {
        setAllNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      } else {
        console.error("Error deleting notification:", result.message);
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e5e7eb",
          background: "#ffffff",
        }}
      >
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
            marginLeft: "30px"
          }}
        >
          {/* <img
            // src={Company?.logourl || "/Logo.png"}
            src={"/ibirds.png"}
            height="50"
            style={{ height: "70px", marginLeft: "20px", objectFit: "contain" }}
          /> */}
          <span>{Company?.name}</span>
        </Navbar.Brand>

        <div className="d-flex align-items-center gap-2">

       {/* Branch Selector for Super Admin */}
{isSuperAdmin && branches.length > 1 && (
  <div className="d-flex align-items-center">
    <select 
      className="form-select form-select-sm"
      value={selectedBranch ? selectedBranch.id : ''}
      onChange={(e) => {
        const branchId = e.target.value;
        const branch = branches.find(b => b.id === branchId);
        if (branch) {
          selectBranch(branch);
        }
      }}
      style={{
        minWidth: '150px',
        maxWidth: '200px',
        fontSize: '14px',
        padding: '6px 12px',
        border: '1px solid #ced4da',
        borderRadius: '4px',
        backgroundColor: '#fff',
        color: '#495057',
      }}
    >
      {branches.map((branch) => (
        <option key={branch.id} value={branch.id}>
          {branch.branch_name}
        </option>
      ))}
    </select>
  </div>
)}


          {/* <img
            src="qr-code.png"
            alt="QR Code"
            className="shadow-lg pulse-button"
            onClick={() => setShowScannerModal(true)}
            style={{
              height: "45px",
              padding: "6px",
              backgroundColor: "#fff",
              border: "2px solid var(--primary-color)",
              borderRadius: "8px",
              boxShadow: "0 0 8px var(--primary-color)",
              cursor: "pointer",
              transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
            }}
          /> */}<img
            src="/qr-code.png"
            alt="QR Code"
            onClick={() => setShowScannerModal(true)}
            className="shadow-lg pulse-button"
            style={{
              height: "40px",
              padding: "6px",
              backgroundColor: "#fff",
              border: "2px solid var(--primary-color)",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "transform 0.2s ease",
            }}
          />

          
 {/* Notifications Dropdown */}
    <Dropdown
      show={showNotifications}
      onToggle={(isOpen) => {
        setShowNotifications(isOpen);
        if (isOpen) {
          fetchAllNotifications();
        }
      }}
    >
      <Dropdown.Toggle
        variant="link"
        className="position-relative d-inline-flex align-items-center justify-content-center notification-bell"
        style={{
          textDecoration: "none",
          border: "none",
          padding: "8px",
          background: "transparent",
        }}
      >
        <i
          className="fa-solid fa-bell"
          style={{
            fontSize: "24px",
            color: "#4b5563",
            transition: "color 0.2s ease",
          }}
        ></i>

        {unreadCount > 0 && (
          <span
            className="position-absolute rounded-circle d-flex align-items-center justify-content-center notification-badge"
            style={{
              top: "4px",
              right: "4px",
              transform: "translate(50%, -50%)",
              minWidth: "20px",
              height: "20px",
              padding: "0 4px",
              backgroundColor: "#ef4444",
              color: "white",
              fontSize: "11px",
              fontWeight: "bold",
              border: "2px solid white",
              zIndex: 1,
              animation: unreadCount > 0 ? "pulse 2s infinite" : "none",
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu
        align="end"
        style={{
          width: "420px",
          padding: "0",
          borderRadius: "16px",
          border: "1px solid #f0f0f0",
          overflow: "hidden",
          marginTop: "10px",
        }}
      >
        {/* Header */}
        <div style={{ 
          background: "var(--primary-color)",
          padding: "10px 15px",
        }}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 style={{ 
                color: "white", 
                margin: 0, 
                fontSize: "18px",
                fontWeight: "600",
                letterSpacing: "0.3px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                {/* <i className="fa-regular fa-bell" style={{ fontSize: "18px" }}></i> */}
                Notifications
              </h6>
              <small style={{ color: "rgba(255,255,255,0.9)", fontSize: "13px", marginTop: "4px", display: "block" }}>
                <span style={{ fontWeight: "600" }}>{notifications.length}</span> unread · <span style={{ fontWeight: "600" }}>{allNotifications.length}</span> total
              </small>
            </div>
            {notifications.length > 0 && (
              <Button
                variant="link"
                size="sm"
                onClick={handleMarkAllAsRead}
                style={{
                  color: "white",
                  textDecoration: "none",
                  fontSize: "12px",
                  padding: "6px 12px",
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.25)";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <i className="fa-regular fa-circle-check me-2"></i>
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Tabs with improved design */}
        <div className="d-flex" style={{ 
          background: "#f8fafc",
          padding: "4px",
          borderBottom: "1px solid #e2e8f0"
        }}>
          {["UNREAD", "READ"].map((tab) => (
            <button
              key={tab}
              className={`flex-fill py-2 px-3 text-center border-0 transition-all`}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? "white" : "transparent",
                color: activeTab === tab ? "var(--primary-color)" : "#64748b",
                fontSize: "14px",
                fontWeight: activeTab === tab ? "600" : "500",
                borderRadius: "30px",
                margin: "2px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: activeTab === tab ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
              }}
            >
              {tab === "UNREAD" ? (
                <>
                  <i className="fa-regular fa-envelope me-2"></i>
                  Unread
                  {notifications.length > 0 && (
                    <span className="ms-2 px-2 py-0.5 rounded-pill" style={{
                      background: "#ef4444",
                      color: "white",
                      fontSize: "11px",
                      fontWeight: "600",
                    }}>
                      {notifications.length}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <i className="fa-regular fa-envelope-open me-2"></i>
                  Read
                </>
              )}
            </button>
          ))}
        </div>

        {/* Notification List with Scroll - Shows 3-4 cards then scroll */}
        <div style={{ 
          maxHeight: "380px", 
          overflowY: "auto",
          padding: "8px",
          background: "#f8fafc",
        }}>
          {activeTab === "UNREAD" ? (
            notifications.length === 0 ? (
              <div className="text-center py-5" style={{ background: "white", borderRadius: "12px", margin: "8px" }}>
                <div style={{ 
                  width: "80px", 
                  height: "80px", 
                  background: "#f1f5f9",
                  borderRadius: "50%",
                  margin: "0 auto 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <i className="fa-regular fa-bell-slash" style={{ fontSize: "32px", color: "#94a3b8" }}></i>
                </div>
                <p style={{ color: "#475569", fontSize: "15px", margin: 0, fontWeight: "500" }}>No unread notifications</p>
                <small style={{ color: "#94a3b8", fontSize: "13px", marginTop: "8px", display: "block" }}>
                  You're all caught up! 🎉
                </small>
              </div>
            ) : (
              notifications.slice(0, 10).map((n, index) => (
                <div
                  key={n.id}
                  className="notification-item"
                  style={{
                    padding: "16px",
                    marginBottom: index < notifications.length - 1 ? "8px" : "0",
                    background: index === 0 ? "#fff9f9" : "white",
                    borderRadius: "12px",
                    border: index === 0 ? "1px solid #fee2e2" : "1px solid #e2e8f0",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)";
                  }}
                >
                  {/* Unread Indicator - Top Right Corner */}
                  {!n.is_read && (
                    <div style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#3b82f6",
                      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.2)",
                    }} />
                  )}

                  <div className="d-flex gap-3">
                    {/* Icon with gradient background */}
                    <div
                      style={{
                        width: "35px",
                        height: "35px",
                        borderRadius: "50%",
                        background: n.type === 'book_due' ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 
                                    n.type === 'due_reminder' ? 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)' : 
                                    'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      }}
                    >
                      <i 
                        className={`fa-solid ${
                          n.type === 'book_due' ? 'fa-clock' :
                          n.type === 'due_reminder' ? 'fa-exclamation-triangle' : 'fa-bell'
                        }`}
                        style={{
                          color: "white",
                          fontSize: "20px",
                        }}
                      ></i>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Type Badge and Time */}
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          color: n.type === 'book_due' ? '#b45309' :
                                n.type === 'due_reminder' ? '#b91c1c' : '#4338ca',
                          letterSpacing: "0.5px",
                          background: n.type === 'book_due' ? '#fef3c7' :
                                    n.type === 'due_reminder' ? '#fee2e2' : '#e0e7ff',
                          padding: "4px 10px",
                          borderRadius: "20px",
                          
                        }}>
                          { n.type  }
                        </span>
                        <small style={{ 
                          fontSize: "11px", 
                          color: "#94a3b8", 
                          fontWeight: "500",
                          background: "#f1f5f9",
                          padding: "2px 8px",
                          borderRadius: "12px",
                        }}>
                          <i className="fa-regular fa-clock me-1"></i>
                          {getRelativeTime(n.createddate)}
                        </small>
                      </div>

                  

                      {/* Message with Delete Button */}
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <p style={{
                          fontSize: "13px",
                          color: "#475569",
                          margin: 0,
                          lineHeight: "1.5",
                          flex: 1,
                          background: "#f8fafc",
                          padding: "8px 12px",
                          borderRadius: "10px",
                          border: "1px solid #e2e8f0",
                        }}>
                          {n.message}
                        </p>
{/*                         
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(n.id);
                          }}
                          style={{
                            background: "white",
                            border: "1px solid #e2e8f0",
                            color: "#94a3b8",
                            cursor: "pointer",
                            padding: "6px",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                            width: "32px",
                            height: "32px",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#dc2626";
                            e.currentTarget.style.background = "#fee2e2";
                            e.currentTarget.style.borderColor = "#fecaca";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "#94a3b8";
                            e.currentTarget.style.background = "white";
                            e.currentTarget.style.borderColor = "#e2e8f0";
                          }}
                          title="Delete notification"
                        >
                          <i className="fa-regular fa-trash-can" style={{ fontSize: "14px" }}></i>
                        </button> */}
                      </div>

                    
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            allNotifications.filter(n => n.is_read).length === 0 ? (
              <div className="text-center py-5" style={{ background: "white", borderRadius: "12px", margin: "8px" }}>
                <div style={{ 
                  width: "80px", 
                  height: "80px", 
                  background: "#f1f5f9",
                  borderRadius: "50%",
                  margin: "0 auto 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <i className="fa-regular fa-envelope-open" style={{ fontSize: "32px", color: "#94a3b8" }}></i>
                </div>
                <p style={{ color: "#475569", fontSize: "15px", margin: 0, fontWeight: "500" }}>No read notifications</p>
                <small style={{ color: "#94a3b8", fontSize: "13px", marginTop: "8px", display: "block" }}>
                  Your read messages will appear here
                </small>
              </div>
            ) : (
              allNotifications.filter(n => n.is_read).slice(0, 10).map((n, index) => (
                <div
                  key={n.id}
                  className="notification-item"
                  style={{
                    padding: "16px",
                    marginBottom: index < allNotifications.filter(n => n.is_read).length - 1 ? "8px" : "0",
                    background: "white",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    opacity: "0.9",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0.9";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)";
                  }}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="d-flex gap-3">
                    {/* Icon */}
                    <div
                      style={{
                        width: "35px",
                        height: "35px",
                        borderRadius: "50%",
                        background: "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <i className="fa-regular fa-bell" style={{ color: "#64748b", fontSize: "16px" }}></i>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Time with delete */}
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span style={{
                          fontSize: "11px",
                          fontWeight: "500",
                          color: "#94a3b8",
                          background: "#f1f5f9",
                          padding: "2px 8px",
                          borderRadius: "12px",
                        }}>
                          <i className="fa-regular fa-clock me-1"></i>
                          {getRelativeTime(n.createddate)}
                        </span>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(n.id);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#94a3b8",
                            cursor: "pointer",
                            padding: "4px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#dc2626";
                            e.currentTarget.style.background = "#fee2e2";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "#94a3b8";
                            e.currentTarget.style.background = "transparent";
                          }}
                          title="Delete notification"
                        >
                          <i className="fa-regular fa-trash-can" style={{ fontSize: "14px" }}></i>
                        </button>
                      </div>

                    

                      {/* Message */}
                      <p style={{
                        fontSize: "12px",
                        color: "#64748b",
                        margin: "4px 0 0",
                        lineHeight: "1.5",
                        background: "#f8fafc",
                        padding: "6px 10px",
                        borderRadius: "8px",
                      }}>
                        {n.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )
          )}
        </div>

     
      </Dropdown.Menu>
    </Dropdown>

{/* Add these styles to your CSS file or in a style tag */}
    <style jsx>{`
      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
        }
      }
      
      .notification-bell:hover i {
        color: var(--primary-color) !important;
      }
      
      .notification-badge {
        animation: pulse 2s infinite;
      }
      
      .notification-item {
        position: relative;
      }
      
      /* Custom Scrollbar */
      div[style*="overflow-y: auto"]::-webkit-scrollbar {
        width: 6px;
      }
      
      div[style*="overflow-y: auto"]::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 10px;
      }
      
      div[style*="overflow-y: auto"]::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 10px;
      }
      
      div[style*="overflow-y: auto"]::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
      
      .transition-all {
        transition: all 0.2s ease;
      }
    `}</style>

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
                      <div
                        style={{
                          fontWeight: "500",
                          color: "#374151",
                        }}
                      >
                        {userInfo?.tenantcode}

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

      {/* Scanner Modal */}
      <Modal
        show={showScannerModal}
        onHide={() => setShowScannerModal(false)}
        size="lg"
        centered
        scrollable
      >
        <Modal.Header
          style={{
            background: "var(--primary-background-color)",
            borderBottom: "none",
            borderRadius: "8px 8px 0 0",
          }}
          closeButton
        >
          <Modal.Title
            style={{ color: "var(--primary-color)", fontWeight: "600" }}
          >
            <i className="fa-solid fa-barcode me-2"></i>Universal Data Scanner
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "24px" }}>
          <UniversalBarcodeScanner
            externalShow={showScannerModal}
            onClose={() => setShowScannerModal(false)}
          />
        </Modal.Body>
      </Modal>

      <Submodule />
    </div>
  );
}
