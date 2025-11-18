import React, { useState, useEffect } from "react";
import { Nav } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import jwt_decode from "jwt-decode";
import * as constants from "../../constants/CONSTANT";
import helper from "../common/helper";
import DataApi from "../../api/dataApi";

export default function Sidebar({ open, handleDrawerClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState(null);
  const [modulesFromDB, setModulesFromDB] = useState([]);

  useEffect(() => {
    try {
      const token = sessionStorage.getItem("token");
      if (token) {
        const user = jwt_decode(token);
        setUserInfo(user);
        // if (user.userrole) {
        //   fetchRolePermissions(user.userrole);
        // }
        fetchModulesFromDB();
      }
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }, []);

  // const fetchRolePermissions = async (userRole) => {
  //   try {
  //     //   has all permissions, no need to fetch
  //     if (userRole === "  ") {
  //       // Set all permissions to true for   
  //       const allModules = ["books", "author", "category", "supplier", "vendor", "purchase", "user", "librarycard", "bookissue", "bookrequest", "penalty"];
  //       const allPerms = {};
  //       allModules.forEach(module => {
  //         allPerms[module] = { can_read: true };
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
  //           can_read: perm.can_read,
  //           can_create: perm.can_create,
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

  const fetchModulesFromDB = async () => {
    try {
      const api = new DataApi("whatsapp/module");
      const resp = await api.fetchAll();
      console.log("Modules fetched from DB:", resp);
      const result = resp?.data;
      if (result && result.success && Array.isArray(result.records)) {
        setModulesFromDB(result.records);
      } else if (Array.isArray(result?.records)) {
        setModulesFromDB(result.records);
      } else if (Array.isArray(result)) {
        setModulesFromDB(result);
      } else {
        setModulesFromDB([]);
      }
    } catch (error) {
      console.error("Error fetching modules from DB:", error);
      setModulesFromDB([]);
    }
  };

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

    console.log("Active modules in sidebar:", moduleItems.length);
    return moduleItems;
  };

  const menuItems = getMenuItems();

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth < 992) {
      handleDrawerClose();
    }
  };

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className={`sidebar ${open ? "sidebar-open" : "sidebar-closed"}`}
      style={{
        width: open ? "260px" : "80px",
        height: "100vh",
        background: "linear-gradient(180deg, #e9d5ff 0%, #f3e8ff 100%)",
        position: "fixed",
        left: 0,
        top: 0,
        transition: "width 0.3s ease",
        zIndex: 999,
        paddingTop: "70px",
        overflowY: "auto",
        boxShadow: "2px 0 10px rgba(0,0,0,0.05)",
        borderRight: "1px solid #e9ecef",
      }}
    >
      {/* Logo Section */}
      <div
        className="d-flex align-items-center px-3 py-3"
        style={{
          borderBottom: "1px solid rgba(111, 66, 193, 0.1)",
          marginBottom: "1rem",
        }}
      >
        <div className="mb-4">
          <img
            src="/logo.png"
            alt="Library Management"
            style={{
              maxWidth: "100%",
              height: "auto",
              maxHeight: "300px",
              borderRadius: "12px",
            }}
          />
        </div>
      </div>

      <Nav className="flex-column px-3 pt-2">
        {menuItems.map((item) => (
          <Nav.Link
            key={item.id}
            onClick={() => handleNavigation(item.path)}
            className={`sidebar-item mb-2 ${isActive(item.path) ? "sidebar-item-active" : ""
              }`}
            style={{
              color: isActive(item.path) ? "#6f42c1" : "#8b5cf6",
              background: isActive(item.path)
                ? "rgba(111, 66, 193, 0.1)"
                : "transparent",
              borderRadius: "10px",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              transition: "all 0.3s",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              if (!isActive(item.path)) {
                e.target.style.background = "rgba(111, 66, 193, 0.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.path)) {
                e.target.style.background = "transparent";
              }
            }}
          >
            <i
              className={`fa-solid ${item.icon}`}
              style={{
                fontSize: "16px",
                width: "24px",
                textAlign: "center",
              }}
            ></i>
            {open && (
              <span
                style={{
                  marginLeft: "12px",
                  fontSize: "13px",
                  fontWeight: isActive(item.path) ? "600" : "400",
                }}
              >
                {item.label}
              </span>
            )}
          </Nav.Link>
        ))}
      </Nav>
    </div>
  );
}
