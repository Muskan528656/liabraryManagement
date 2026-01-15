import React, { useState, useEffect } from "react";
import { Navbar, Nav, NavDropdown } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import DataApi from "../../api/dataApi";

const Submodule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [modulesFromDB, setModulesFromDB] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [visibleModulesCount, setVisibleModulesCount] = useState(5);

  // Fetch user permissions from session/local storage or API
  const fetchUserPermissions = async () => {
    try {
      // Method 1: If permissions are stored in sessionStorage/token
      const token = sessionStorage.getItem("token");
      if (token) {
        // Decode token or fetch permissions from API
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");

        // Adjust based on your permission structure
        let permissions = [];

        // Option A: Permissions are in userData
        if (userData && userData.permissions) {
          permissions = userData.permissions;
        }
        // Option B: Permissions are in separate storage
        else if (localStorage.getItem("userPermissions")) {
          permissions = JSON.parse(localStorage.getItem("userPermissions"));
        }
        // Option C: Fetch permissions from API
        else {
          const api = new DataApi("permissions");
          const resp = await api.fetchAll();
          if (resp?.data?.success) {
            permissions = resp.data.records || [];
            localStorage.setItem("userPermissions", JSON.stringify(permissions));
          }
        }

        setUserPermissions(permissions);
        return permissions;
      }
    } catch (error) {
      console.error("Error fetching user permissions:", error);
    }
    return [];
  };

  // Fetch modules from database
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
        localStorage.setItem("cached_modules_timestamp", Date.now().toString());
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

  // Check if user has permission for a specific module
  const hasPermissionForModule = (module) => {
    // If no permissions are set, show all modules (for testing)
    if (!userPermissions || userPermissions.length === 0) {
      return true;
    }

    const moduleName = module.name?.toLowerCase() || "";
    const moduleUrl = (module.url || module.api_name || "").toLowerCase();

    // Check different permission structures
    const hasPermission = userPermissions.some(perm => {
      // Adjust these conditions based on your permission structure
      if (perm.module_name && moduleName.includes(perm.module_name.toLowerCase())) {
        return perm.can_view || perm.is_allowed;
      }

      if (perm.url && moduleUrl.includes(perm.url.toLowerCase())) {
        return perm.can_view || perm.is_allowed;
      }

      if (perm.permission_name && moduleName.includes(perm.permission_name.toLowerCase())) {
        return perm.has_access;
      }

      return false;
    });

    return hasPermission;
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (token) {
          // Fetch permissions first
          await fetchUserPermissions();
          // Then fetch modules
          await fetchModulesFromDB();
        } else {
          localStorage.removeItem("cached_modules");
          localStorage.removeItem("cached_modules_timestamp");
          localStorage.removeItem("userPermissions");
        }
      } catch (error) {
        console.error("Error initializing data:", error);
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "token" && e.newValue) {
        fetchUserPermissions();
        fetchModulesFromDB();
      }
      if (e.key === "userPermissions") {
        try {
          const newPerms = JSON.parse(e.newValue || "[]");
          setUserPermissions(newPerms);
        } catch (error) {
          console.error("Error parsing permissions:", error);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const token = sessionStorage.getItem("token");
        if (token) {
          fetchUserPermissions();
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
    // Filter modules based on permissions and status
    const moduleItems = (modulesFromDB || [])
      .filter((m) => {
        // Check if module is active
        const isActive = m && m.status && m.status.toLowerCase() === "active";

        // Check if user has permission
        const hasPermission = hasPermissionForModule(m);

        return isActive && hasPermission;
      })
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
  }, [modulesFromDB, userPermissions]); // Added userPermissions dependency

  const isActive = (path, moduleUrl) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    if (location.pathname === path) {
      return true;
    }

    if (location.pathname.startsWith(path + "/")) {
      return true;
    }

    if (moduleUrl) {
      const currentPath = location.pathname.toLowerCase();
      const modulePath = `/${moduleUrl}`;
      if (currentPath === modulePath || currentPath.startsWith(modulePath + "/")) {
        return true;
      }
    }

    return false;
  };

  // If no modules are visible due to permissions, show a message
  if (menuItems.length === 0) {
    return (
      <Navbar
        expand="lg"
        style={{
          padding: "0.56rem 1.3rem",
          boxShadow: "none",
        }}
        className="bg-body-tertiary"
      >
        <div className="text-center w-100">
          <span style={{ color: "var(--text-muted)" }}>
            No modules available. Please contact administrator for access.
          </span>
        </div>
      </Navbar>
    );
  }

  return (
    <Navbar
      expand="lg"
      style={{
        padding: "0.56rem 1.3rem",
        boxShadow: "none",
      }}
      className="bg-body-tertiary"
    >
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav
          className="d-flex align-items-center"
          style={{
            flexWrap: "nowrap",
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          {/* LEFT MENU ITEMS */}
          <div
            className="d-flex align-items-center gap-1"
            style={{ flexGrow: 1 }}
          >
            {menuItems.slice(0, visibleModulesCount).map((item) => (
              <Nav.Link
                key={item.id}
                onClick={() => navigate(item.path)}
                style={{
                  color: isActive(item.path, item.moduleUrl)
                    ? "var(--primary-color)"
                    : "var(--header-list-item-color)",
                  background: isActive(item.path, item.moduleUrl)
                    ? "var(--primary-background-color)"
                    : "transparent",
                  borderRadius: "6px",
                  padding: "10px 16px",
                  fontSize: "15px",
                  fontWeight: "600",
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path, item.moduleUrl)) {
                    e.currentTarget.style.background =
                      "var(--primary-background-color)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path, item.moduleUrl)) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <i className={`fa-solid fs-7 ${item.icon} me-1`}></i>
                {item.label}
              </Nav.Link>
            ))}
          </div>

          <div style={{ width: "130px", textAlign: "end" }}>
            {menuItems.length > visibleModulesCount && (
              <NavDropdown
                title={
                  <>
                    <i className="fa-solid fa-ellipsis-vertical fs-6"></i>
                    <span className="ms-1">More</span>
                  </>
                }
                id="basic-nav-dropdown"
                align="end"
                style={{
                  color: "var(--primary-color)",
                  fontSize: "15px",
                  fontWeight: "500",
                }}
                className="px-2"
              >
                {menuItems.slice(visibleModulesCount).map((item) => (
                  <NavDropdown.Item
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    style={{
                      color: isActive(item.path, item.moduleUrl)
                        ? "var(--primary-color)"
                        : "var(--header-list-item-color)",
                      background: isActive(item.path, item.moduleUrl)
                        ? "var(--primary-background-color)"
                        : "transparent",
                      padding: "12px 18px",
                      fontSize: "15px",
                      fontWeight: "600",
                      borderRadius: "4px",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive(item.path, item.moduleUrl)) {
                        e.currentTarget.style.background =
                          "var(--primary-background-color)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(item.path, item.moduleUrl)) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <i
                      className={`fs-7 fa-solid ${item.icon} me-2`}
                      style={{ color: "var(--header-list-item-color)" }}
                    ></i>
                    {item.label}
                  </NavDropdown.Item>
                ))}
              </NavDropdown>
            )}
          </div>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default Submodule;