import React, { useState, useEffect } from "react";
import { Navbar, Nav, NavDropdown } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import DataApi from "../../api/dataApi";
import { AuthHelper } from "../../utils/authHelper";

const Submodule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [modulesFromDB, setModulesFromDB] = useState([]);
  const [userData, setUserData] = useState(null);
  const [visibleModulesCount, setVisibleModulesCount] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  const getUserData = () => {
    try {
      const user = AuthHelper.getUser();
      console.log("User from AuthHelper:", user);
      setUserData(user);
      return user;
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  };

  const getPermissionsFromAuthHelper = () => {
    try {
      const permissions = AuthHelper.getPermissions();
      console.log("Permissions from AuthHelper:", permissions);
      return permissions || [];
    } catch (error) {
      console.error("Error getting permissions:", error);
      return [];
    }
  };

  const fetchModulesFromDB = async () => {
    try {
      setIsLoading(true);

      const cachedModules = sessionStorage.getItem("cached_modules");
      const cacheTimestamp = sessionStorage.getItem("cached_modules_timestamp");
      const now = Date.now();
      const cacheDuration = 5 * 60 * 1000;

      if (cachedModules && cacheTimestamp && (now - parseInt(cacheTimestamp)) < cacheDuration) {
        try {
          const parsed = JSON.parse(cachedModules);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setModulesFromDB(parsed);
            setIsLoading(false);
            console.log("Modules loaded from cache");
            return;
          }
        } catch (e) {
          console.error("Error parsing cached modules:", e);
        }
      }

      const api = new DataApi("module");
      const resp = await api.fetchAll();
      console.log("Modules API Response:", resp);

      let modules = [];

      if (resp?.data?.success && Array.isArray(resp.data.records)) {
        modules = resp.data.records;
      } else if (Array.isArray(resp?.records)) {
        modules = resp.records;
      } else if (Array.isArray(resp)) {
        modules = resp;
      }

      if (modules.length > 0) {
        setModulesFromDB(modules);
        sessionStorage.setItem("cached_modules", JSON.stringify(modules));
        sessionStorage.setItem("cached_modules_timestamp", now.toString());
        console.log("Modules fetched from API:", modules.length, "modules");
      } else {
        console.error("No modules found");
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching modules:", error);
      setIsLoading(false);
    }
  };

  const isSystemAdmin = () => {
    if (!userData) return false;

    const roleName = (userData.role_name || "").toUpperCase();
    console.log("User Role:", roleName);
    return roleName === "SYSTEM ADMIN" || roleName === "ADMIN";
  };


  const hasPermissionForModule = (module) => {
    console.log("\n=== Checking permission for module ===");
    console.log("Module:", {
      id: module.id,
      name: module.name,
      api_name: module.api_name
    });

    if (isSystemAdmin()) {
      console.log("✓ User is System Admin - full access");
      return true;
    }


    const permissions = getPermissionsFromAuthHelper();
    console.log("Total permissions available:", permissions.length);

    // If no permissions found in storage, check if permissions API was called
    if (!permissions || permissions.length === 0) {
      console.log("No permissions found in sessionStorage");

      // Check if permissions API was called and failed
      const permissionsApiCalled = sessionStorage.getItem("permissions_api_called");
      if (permissionsApiCalled === "true") {
        console.log("Permissions API was called but returned empty");
        return false;
      }

      // If permissions API wasn't called yet, show all modules temporarily
      console.log("Permissions not loaded yet, showing all modules temporarily");
      return true;
    }

    const moduleId = module.id;
    const moduleName = (module.name || "").toLowerCase().trim();
    const moduleApiName = (module.api_name || "").toLowerCase().trim();

    console.log("Looking for module ID:", moduleId);
    console.log("Looking for module name:", moduleName);
    console.log("Looking for module api name:", moduleApiName);

    const matchingPermission = permissions.find(perm => {
      console.log("Checking permission object:", perm);


      if (perm.moduleId && moduleId && perm.moduleId.toString() === moduleId.toString()) {
        console.log("✓ Match by moduleId");
        return true;
      }


      const permModuleName = (perm.moduleName || perm.name || "").toLowerCase().trim();
      if (permModuleName && moduleName && permModuleName === moduleName) {
        console.log("✓ Match by moduleName");
        return true;
      }


      if (perm.api_name && moduleApiName && perm.api_name.toLowerCase() === moduleApiName) {
        console.log("✓ Match by api_name");
        return true;
      }


      const moduleUrl = (module.url || "").toLowerCase().trim();
      const permUrl = (perm.url || "").toLowerCase().trim();
      if (permUrl && moduleUrl && moduleUrl.includes(permUrl)) {
        console.log("✓ Match by URL");
        return true;
      }

      if (permModuleName && moduleName && (
        moduleName.includes(permModuleName) ||
        permModuleName.includes(moduleName)
      )) {
        console.log("✓ Match by partial name");
        return true;
      }

      return false;
    });

    if (!matchingPermission) {
      console.log("✗ No matching permission found");
      return false;
    }

    console.log("Matching permission found:", matchingPermission);


    const hasAccess =

      matchingPermission.allowView === true ||
      matchingPermission.can_view === true ||
      matchingPermission.view === true ||
      matchingPermission.has_access === true ||
      matchingPermission.is_allowed === true ||


      matchingPermission.allowView === "true" ||
      matchingPermission.can_view === "true" ||
      matchingPermission.view === "true" ||
      matchingPermission.has_access === "true" ||
      matchingPermission.is_allowed === "true" ||


      matchingPermission.allowView === 1 ||
      matchingPermission.can_view === 1 ||
      matchingPermission.view === 1 ||
      matchingPermission.has_access === 1 ||
      matchingPermission.is_allowed === 1;

    console.log("Final access result:", hasAccess);
    console.log("Permission details:", {
      allowView: matchingPermission.allowView,
      can_view: matchingPermission.can_view,
      view: matchingPermission.view,
      has_access: matchingPermission.has_access,
      is_allowed: matchingPermission.is_allowed
    });

    return hasAccess;
  };


  const getMenuItems = () => {
    if (!modulesFromDB || modulesFromDB.length === 0) {
      console.log("No modules available");
      return [];
    }

    console.log("\n=== FILTERING MODULES ===");
    console.log("Total modules from DB:", modulesFromDB.length);

    const moduleItems = modulesFromDB
      .filter((m) => {

        const isActive = m && m.status && m.status.toLowerCase() === "active";

        if (!isActive) {
          console.log(`Module "${m.name}" is not active`);
          return false;
        }

        const moduleName = (m.name || "").toLowerCase();
        const moduleApiName = (m.api_name || "").toLowerCase();


        const isPermissionModule =
          moduleName.includes("permission") ||
          moduleApiName.includes("permission") ||
          moduleName.includes("role") ||
          moduleApiName.includes("role") ||
          moduleName.includes("user") ||
          moduleApiName.includes("user");

        console.log(`\nModule: ${m.name} (ID: ${m.id})`);
        console.log("Is permission module:", isPermissionModule);

        if (isPermissionModule) {
          const systemAdmin = isSystemAdmin();
          console.log("Is system admin:", systemAdmin);
          if (!systemAdmin) {
            console.log("Hiding permission/role/user module from non-admin user");
            return false;
          }
        }

        const hasPermission = hasPermissionForModule(m);
        console.log("Has permission:", hasPermission);

        return hasPermission;
      })
      .sort((a, b) => (a.order_no || 999) - (b.order_no || 999))
      .map((m) => {
        const urlKey = (m.url || m.api_name || m.name || "")
          .toString()
          .toLowerCase();

        const cleanName = (m.name || "").toLowerCase().replace(/\s+/g, "-");
        const path = m.url || `/${cleanName}` || "/";

        return {
          id: m.id || urlKey,
          label: m.name || urlKey,
          icon: m.icon || "fa-circle",
          path: path,
          moduleUrl: urlKey,
          order_no: m.order_no || 999
        };
      });

    console.log("Final menu items:", moduleItems.length);
    console.log("Menu item names:", moduleItems.map(item => item.label));
    return moduleItems;
  };

  const menuItems = getMenuItems();

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);

        const user = getUserData();

        if (!user) {
          console.log("No user found, clearing cache");
          sessionStorage.removeItem("cached_modules");
          sessionStorage.removeItem("cached_modules_timestamp");
          setIsLoading(false);
          return;
        }


        await fetchModulesFromDB();


        const perms = getPermissionsFromAuthHelper();
        console.log("Initial permissions check:", perms.length, "permissions");

        if (perms.length > 0) {
          sessionStorage.setItem("permissions_api_called", "true");
        }

      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();


    const handleStorageChange = (e) => {
      if (e.key === "permissions" || e.key === "token" || e.key === "userData") {
        console.log("Storage changed, reinitializing data");
        getUserData();
        fetchModulesFromDB();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const token = sessionStorage.getItem("token");
        if (token) {
          console.log("Page visible, refreshing data");
          initializeData();
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

  useEffect(() => {
    const calculateVisibleModules = () => {
      if (menuItems.length === 0) {
        setVisibleModulesCount(5);
        return;
      }

      const screenWidth = window.innerWidth;
      let maxModules;

      if (screenWidth < 768) {
        maxModules = 3;
      } else if (screenWidth < 992) {
        maxModules = 4;
      } else if (screenWidth < 1200) {
        maxModules = 5;
      } else {
        maxModules = 6;
      }

      maxModules = Math.min(maxModules, Math.max(1, menuItems.length - 1));
      setVisibleModulesCount(maxModules);
    };

    calculateVisibleModules();
    window.addEventListener("resize", calculateVisibleModules);

    return () => window.removeEventListener("resize", calculateVisibleModules);
  }, [menuItems]);

  const isActive = (path, moduleUrl) => {
    const currentPath = location.pathname.toLowerCase();

    if (path === "/") {
      return currentPath === "/";
    }

    const normalizedPath = path.toLowerCase();

    if (currentPath === normalizedPath) {
      return true;
    }

    if (currentPath.startsWith(normalizedPath + "/")) {
      return true;
    }

    if (moduleUrl) {
      const modulePath = `/${moduleUrl}`.toLowerCase();
      if (currentPath === modulePath || currentPath.startsWith(modulePath + "/")) {
        return true;
      }
    }

    return false;
  };
  if (isLoading) {
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
            Loading menu...
          </span>
        </div>
      </Navbar>
    );
  }

  if (menuItems.length === 0 && modulesFromDB.length > 0) {
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

  if (modulesFromDB.length === 0 && !isLoading) {
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
            No modules configured. Please contact administrator.
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
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path, item.moduleUrl)) {
                    e.currentTarget.style.background =
                      "var(--primary-background-color)";
                    e.currentTarget.style.color = "var(--primary-color)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path, item.moduleUrl)) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--header-list-item-color)";
                  }
                }}
              >
                <i className={`fa-solid fs-7 ${item.icon} me-1`}></i>
                {item.label}
              </Nav.Link>
            ))}
          </div>

          {/* MORE DROPDOWN */}
          <div style={{ minWidth: "80px", textAlign: "end" }}>
            {menuItems.length > visibleModulesCount && (
              <NavDropdown
                title={
                  <div className="d-flex align-items-center">
                    <i className="fa-solid fa-ellipsis-vertical fs-6"></i>
                    <span className="ms-1">More</span>
                  </div>
                }
                id="more-modules-dropdown"
                align="end"
                style={{
                  color: "var(--primary-color)",
                  fontSize: "15px",
                  fontWeight: "500",
                }}
                className="px-2"
                // Dropdown को custom render करने के लिए
                renderMenuOnMount={true}
              >
                <div
                  style={{
                    maxHeight: "300px", // Fixed height
                    overflowY: "auto",
                    overflowX: "hidden",
                    minWidth: "200px",
                    paddingRight: "5px", // Scrollbar के लिए space
                  }}
                  className="more-dropdown-scroll"
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
                        padding: "10px 16px",
                        fontSize: "14px",
                        fontWeight: "500",
                        borderRadius: "4px",
                        transition: "all 0.2s",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--primary-background-color)";
                        e.currentTarget.style.color = "var(--primary-color)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive(item.path, item.moduleUrl)) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--header-list-item-color)";
                        }
                      }}
                    >
                      <i
                        className={`fs-7 fa-solid ${item.icon} me-2`}
                        style={{
                          color: isActive(item.path, item.moduleUrl)
                            ? "var(--primary-color)"
                            : "var(--header-list-item-color)"
                        }}
                      ></i>
                      {item.label}
                    </NavDropdown.Item>
                  ))}
                </div>
              </NavDropdown>
            )}

            {/* Custom scrollbar styling */}
            <style jsx="true">{`
    .more-dropdown-scroll::-webkit-scrollbar {
      width: 6px;
    }
    
    .more-dropdown-scroll::-webkit-scrollbar-track {
      background: white;
      border-radius: 10px;
    }
    
    .more-dropdown-scroll::-webkit-scrollbar-thumb {
      background: 
      var(--secondary-color);
      border-radius: 10px;
    }
    
    .more-dropdown-scroll::-webkit-scrollbar-thumb:hover {
      background: #6c757d;
    }
    
    /* Bootstrap dropdown के लिए custom style */
    .dropdown-menu.show {
      padding: 0 !important;
      overflow: hidden !important;
    }
    
    /* Bootstrap NavDropdown.Item के लिए custom style */
    .dropdown-item {
      border-radius: 4px !important;
      margin: 2px 4px !important;
      width: auto !important;
    }
  `}</style>
          </div>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default Submodule;
