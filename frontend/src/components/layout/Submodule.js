// import React, { useState, useEffect } from "react";
// import { Navbar, Nav, NavDropdown } from "react-bootstrap";
// import { useNavigate, useLocation } from "react-router-dom";
// import DataApi from "../../api/dataApi";

// const Submodule = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [modulesFromDB, setModulesFromDB] = useState([]);
//   const [userPermissions, setUserPermissions] = useState([]);
//   const [visibleModulesCount, setVisibleModulesCount] = useState(5);

//   // Fetch user permissions from session/local storage or API
//   const fetchUserPermissions = async () => {
//     try {
//       // Method 1: If permissions are stored in sessionStorage/token
//       const token = sessionStorage.getItem("token");
//       if (token) {
//         // Decode token or fetch permissions from API
//         const userData = JSON.parse(localStorage.getItem("userData") || "{}");

//         // Adjust based on your permission structure
//         let permissions = [];

//         // Option A: Permissions are in userData
//         if (userData && userData.permissions) {
//           permissions = userData.permissions;
//         }
//         // Option B: Permissions are in separate storage
//         else if (localStorage.getItem("userPermissions")) {
//           permissions = JSON.parse(localStorage.getItem("userPermissions"));
//         }
//         // Option C: Fetch permissions from API
//         else {
//           const api = new DataApi("permissions");
//           const resp = await api.fetchAll();
//           if (resp?.data?.success) {
//             permissions = resp.data.records || [];
//             localStorage.setItem("userPermissions", JSON.stringify(permissions));
//           }
//         }

//         setUserPermissions(permissions);
//         return permissions;
//       }
//     } catch (error) {
//       console.error("Error fetching user permissions:", error);
//     }
//     return [];
//   };

//   // Fetch modules from database
//   const fetchModulesFromDB = async () => {
//     try {
//       const cachedModules = localStorage.getItem("cached_modules");
//       if (cachedModules) {
//         try {
//           const parsed = JSON.parse(cachedModules);
//           if (Array.isArray(parsed) && parsed.length > 0) {
//             setModulesFromDB(parsed);
//           }
//         } catch (e) {
//           console.error("Error parsing cached modules:", e);
//         }
//       }

//       const api = new DataApi("module");
//       const resp = await api.fetchAll();
//       const result = resp?.data;
//       let modules = [];

//       if (result && result.success && Array.isArray(result.records)) {
//         modules = result.records;
//       } else if (Array.isArray(result?.records)) {
//         modules = result.records;
//       } else if (Array.isArray(result)) {
//         modules = result;
//       }

//       if (modules.length > 0) {
//         setModulesFromDB(modules);
//         localStorage.setItem("cached_modules", JSON.stringify(modules));
//         localStorage.setItem("cached_modules_timestamp", Date.now().toString());
//       } else if (!cachedModules) {
//         setModulesFromDB([]);
//       }
//     } catch (error) {
//       console.error("Error fetching modules from DB:", error);
//       const cachedModules = localStorage.getItem("cached_modules");
//       if (cachedModules) {
//         try {
//           const parsed = JSON.parse(cachedModules);
//           if (Array.isArray(parsed) && parsed.length > 0) {
//             setModulesFromDB(parsed);
//           }
//         } catch (e) {
//           console.error("Error parsing cached modules:", e);
//           setModulesFromDB([]);
//         }
//       } else {
//         setModulesFromDB([]);
//       }
//     }
//   };

//   const hasPermissionForModule = (module) => {
//     console.log("Checking permissiosdfn for module:", module);
//     if (!userPermissions || userPermissions.length === 0) {
//       return true;
//     }

//     console.log("Checking permissions for module:", userPermissions);
//     const moduleName = module.name?.toLowerCase() || "";
//     const moduleUrl = (module.url || module.api_name || "").toLowerCase();
// console.log("userPermissionsuserPermissionsuserPermissionsuserPermissionsuserPermissions",userPermissions)
//     const hasPermission = userPermissions.some(perm => {

//       if (perm.module_name && moduleName.includes(perm.module_name.toLowerCase())) {
//         console.log("premmmm=>", perm)
//         return perm.can_view || perm.is_allowed;
//       }

//       if (perm.url && moduleUrl.includes(perm.url.toLowerCase())) {
//         return perm.can_view || perm.is_allowed;
//       }

//       if (perm.permission_name && moduleName.includes(perm.permission_name.toLowerCase())) {
//         return perm.has_access;
//       }

//       return false;
//     });
//     console.log("hasPermission", hasPermission)
//     return hasPermission;
//   };

//   useEffect(() => {
//     const initializeData = async () => {
//       try {
//         const token = sessionStorage.getItem("token");
//         if (token) {
//           // Fetch permissions first
//           await fetchUserPermissions();
//           // Then fetch modules
//           await fetchModulesFromDB();
//         } else {
//           localStorage.removeItem("cached_modules");
//           localStorage.removeItem("cached_modules_timestamp");
//           localStorage.removeItem("userPermissions");
//         }
//       } catch (error) {
//         console.error("Error initializing data:", error);
//       }
//     };

//     initializeData();
//   }, []);

//   useEffect(() => {
//     const handleStorageChange = (e) => {
//       if (e.key === "token" && e.newValue) {
//         fetchUserPermissions();
//         fetchModulesFromDB();
//       }
//       if (e.key === "userPermissions") {
//         try {
//           const newPerms = JSON.parse(e.newValue || "[]");
//           setUserPermissions(newPerms);
//         } catch (error) {
//           console.error("Error parsing permissions:", error);
//         }
//       }
//     };

//     const handleVisibilityChange = () => {
//       if (document.visibilityState === "visible") {
//         const token = sessionStorage.getItem("token");
//         if (token) {
//           fetchUserPermissions();
//           fetchModulesFromDB();
//         }
//       }
//     };

//     window.addEventListener("storage", handleStorageChange);
//     document.addEventListener("visibilitychange", handleVisibilityChange);

//     return () => {
//       window.removeEventListener("storage", handleStorageChange);
//       document.removeEventListener("visibilitychange", handleVisibilityChange);
//     };
//   }, []);

//   const getMenuItems = () => {

//     const moduleItems = (modulesFromDB || [])
//       .filter((m) => {
//         const isActive = m && m.status && m.status.toLowerCase() === "active";

//         const hasPermission = hasPermissionForModule(m);

//         return isActive && hasPermission;
//       })
//       .sort((a, b) => (a.order_no || 999) - (b.order_no || 999))
//       .map((m) => {
//         const urlKey = (m.url || m.api_name || m.name || "")
//           .toString()
//           .toLowerCase();
//         const path =
//           m.url || `/${m.name.toLowerCase().replace(/\s+/g, "")}` || "/";

//         return {
//           id: m.id || urlKey,
//           label: m.name || urlKey,
//           icon: m.icon || "fa-circle",
//           path,
//           moduleUrl: urlKey,
//         };
//       });

//     return moduleItems;
//   };

//   const menuItems = getMenuItems();

//   useEffect(() => {
//     const calculateVisibleModules = () => {
//       const screenWidth = window.innerWidth;
//       const availableWidth = screenWidth * 0.7;
//       const avgModuleWidth = 110;
//       const moreButtonWidth = 80;
//       const maxModules = Math.floor(
//         (availableWidth - moreButtonWidth) / avgModuleWidth
//       );
//       const currentMenuItems = getMenuItems();
//       if (currentMenuItems.length > 0) {
//         const visibleCount = Math.max(
//           1,
//           Math.min(maxModules, currentMenuItems.length - 1)
//         );
//         setVisibleModulesCount(visibleCount);
//       } else {
//         setVisibleModulesCount(5);
//       }
//     };

//     calculateVisibleModules();
//     window.addEventListener("resize", calculateVisibleModules);
//     return () => window.removeEventListener("resize", calculateVisibleModules);
//   }, [modulesFromDB, userPermissions]); // Added userPermissions dependency

//   const isActive = (path, moduleUrl) => {
//     if (path === "/") {
//       return location.pathname === "/";
//     }

//     if (location.pathname === path) {
//       return true;
//     }

//     if (location.pathname.startsWith(path + "/")) {
//       return true;
//     }

//     if (moduleUrl) {
//       const currentPath = location.pathname.toLowerCase();
//       const modulePath = `/${moduleUrl}`;
//       if (currentPath === modulePath || currentPath.startsWith(modulePath + "/")) {
//         return true;
//       }
//     }

//     return false;
//   };

//   // If no modules are visible due to permissions, show a message
//   if (menuItems.length === 0) {
//     return (
//       <Navbar
//         expand="lg"
//         style={{
//           padding: "0.56rem 1.3rem",
//           boxShadow: "none",
//         }}
//         className="bg-body-tertiary"
//       >
//         <div className="text-center w-100">
//           <span style={{ color: "var(--text-muted)" }}>
//             No modules available. Please contact administrator for access.
//           </span>
//         </div>
//       </Navbar>
//     );
//   }

//   return (
//     <Navbar
//       expand="lg"
//       style={{
//         padding: "0.56rem 1.3rem",
//         boxShadow: "none",
//       }}
//       className="bg-body-tertiary"
//     >
//       <Navbar.Toggle aria-controls="basic-navbar-nav" />
//       <Navbar.Collapse id="basic-navbar-nav">
//         <Nav
//           className="d-flex align-items-center"
//           style={{
//             flexWrap: "nowrap",
//             width: "100%",
//             justifyContent: "space-between",
//           }}
//         >
//           {/* LEFT MENU ITEMS */}
//           <div
//             className="d-flex align-items-center gap-1"
//             style={{ flexGrow: 1 }}
//           >
//             {menuItems.slice(0, visibleModulesCount).map((item) => (
//               <Nav.Link
//                 key={item.id}
//                 onClick={() => navigate(item.path)}
//                 style={{
//                   color: isActive(item.path, item.moduleUrl)
//                     ? "var(--primary-color)"
//                     : "var(--header-list-item-color)",
//                   background: isActive(item.path, item.moduleUrl)
//                     ? "var(--primary-background-color)"
//                     : "transparent",
//                   borderRadius: "6px",
//                   padding: "10px 16px",
//                   fontSize: "15px",
//                   fontWeight: "600",
//                   textDecoration: "none",
//                   cursor: "pointer",
//                   transition: "all 0.2s",
//                 }}
//                 onMouseEnter={(e) => {
//                   if (!isActive(item.path, item.moduleUrl)) {
//                     e.currentTarget.style.background =
//                       "var(--primary-background-color)";
//                   }
//                 }}
//                 onMouseLeave={(e) => {
//                   if (!isActive(item.path, item.moduleUrl)) {
//                     e.currentTarget.style.background = "transparent";
//                   }
//                 }}
//               >
//                 <i className={`fa-solid fs-7 ${item.icon} me-1`}></i>
//                 {item.label}
//               </Nav.Link>
//             ))}
//           </div>

//           <div style={{ width: "130px", textAlign: "end" }}>
//             {menuItems.length > visibleModulesCount && (
//               <NavDropdown
//                 title={
//                   <>
//                     <i className="fa-solid fa-ellipsis-vertical fs-6"></i>
//                     <span className="ms-1">More</span>
//                   </>
//                 }
//                 id="basic-nav-dropdown"
//                 align="end"
//                 style={{
//                   color: "var(--primary-color)",
//                   fontSize: "15px",
//                   fontWeight: "500",
//                 }}
//                 className="px-2"
//               >
//                 {menuItems.slice(visibleModulesCount).map((item) => (
//                   <NavDropdown.Item
//                     key={item.id}
//                     onClick={() => navigate(item.path)}
//                     style={{
//                       color: isActive(item.path, item.moduleUrl)
//                         ? "var(--primary-color)"
//                         : "var(--header-list-item-color)",
//                       background: isActive(item.path, item.moduleUrl)
//                         ? "var(--primary-background-color)"
//                         : "transparent",
//                       padding: "12px 18px",
//                       fontSize: "15px",
//                       fontWeight: "600",
//                       borderRadius: "4px",
//                       transition: "all 0.2s",
//                     }}
//                     onMouseEnter={(e) => {
//                       if (!isActive(item.path, item.moduleUrl)) {
//                         e.currentTarget.style.background =
//                           "var(--primary-background-color)";
//                       }
//                     }}
//                     onMouseLeave={(e) => {
//                       if (!isActive(item.path, item.moduleUrl)) {
//                         e.currentTarget.style.background = "transparent";
//                       }
//                     }}
//                   >
//                     <i
//                       className={`fs-7 fa-solid ${item.icon} me-2`}
//                       style={{ color: "var(--header-list-item-color)" }}
//                     ></i>
//                     {item.label}
//                   </NavDropdown.Item>
//                 ))}
//               </NavDropdown>
//             )}
//           </div>
//         </Nav>
//       </Navbar.Collapse>
//     </Navbar>
//   );
// };

// export default Submodule;

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

  // Get user data from AuthHelper
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

  // Get permissions from AuthHelper
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

  // Fetch modules from database
  const fetchModulesFromDB = async () => {
    try {
      const cachedModules = localStorage.getItem("cached_modules");

      if (cachedModules) {
        try {
          const parsed = JSON.parse(cachedModules);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setModulesFromDB(parsed);
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
        localStorage.setItem("cached_modules", JSON.stringify(modules));
        console.log("Modules fetched from API:", modules);
      } else {
        console.error("No modules found");
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  // Check if user is System Admin
  const isSystemAdmin = () => {
    if (!userData) return false;

    const roleName = (userData.role_name || "").toUpperCase();
    console.log("User Role:", roleName);
    return roleName === "SYSTEM ADMIN";
  };

  // Check if user has permission for a specific module
  const hasPermissionForModule = (module) => {
    console.log("\n=== Checking permission for module ===");
    console.log("Module:", {
      id: module.id,
      name: module.name,
      api_name: module.api_name
    });

    // Get permissions from AuthHelper
    const permissions = getPermissionsFromAuthHelper();
    console.log("Total permissions available:", permissions.length);

    // If no permissions found, deny access
    if (!permissions || permissions.length === 0) {
      console.log("No permissions found in sessionStorage");
      return false;
    }

    const moduleId = module.id;
    const moduleName = (module.name || "").toLowerCase().trim();

    console.log("Looking for module ID:", moduleId);
    console.log("Looking for module name:", moduleName);

    // Find matching permission
    // Your AuthHelper permissions have structure: { moduleId, moduleName, allowView, allowCreate, etc. }
    const matchingPermission = permissions.find(perm => {
      console.log("Checking permission object:", perm);

      // Match by moduleId
      if (perm.moduleId && moduleId && perm.moduleId === moduleId) {
        console.log("✓ Match by moduleId");
        return true;
      }

      // Match by moduleName
      const permModuleName = (perm.moduleName || "").toLowerCase().trim();
      if (permModuleName && moduleName && permModuleName === moduleName) {
        console.log("✓ Match by moduleName");
        return true;
      }

      return false;
    });

    if (!matchingPermission) {
      console.log("✗ No matching permission found");
      return false;
    }

    console.log("Matching permission found:", matchingPermission);

    // Check if user has at least view permission
    // According to your AuthHelper structure: allowView, allowCreate, allowEdit, allowDelete
    const hasAccess =
      matchingPermission.allowView === true ||
      matchingPermission.allowView === "true" ||
      matchingPermission.allowView === 1 ||
      matchingPermission.allowCreate === true ||
      matchingPermission.allowCreate === "true" ||
      matchingPermission.allowCreate === 1 ||
      matchingPermission.allowEdit === true ||
      matchingPermission.allowEdit === "true" ||
      matchingPermission.allowEdit === 1 ||
      matchingPermission.allowDelete === true ||
      matchingPermission.allowDelete === "true" ||
      matchingPermission.allowDelete === 1;

    console.log("Final access result:", hasAccess);
    console.log("Permission details:", {
      allowView: matchingPermission.allowView,
      allowCreate: matchingPermission.allowCreate,
      allowEdit: matchingPermission.allowEdit,
      allowDelete: matchingPermission.allowDelete,
      typeOfView: typeof matchingPermission.allowView,
      typeOfCreate: typeof matchingPermission.allowCreate
    });

    return hasAccess;
  };

  // Get filtered menu items
  const getMenuItems = () => {
    if (!modulesFromDB || modulesFromDB.length === 0) {
      console.log("No modules available");
      return [];
    }

    console.log("\n=== FILTERING MODULES ===");
    console.log("Total modules from DB:", modulesFromDB.length);

    const moduleItems = modulesFromDB
      .filter((m) => {
        // Check if module is active
        const isActive = m && m.status && m.status.toLowerCase() === "active";

        if (!isActive) {
          console.log(`Module "${m.name}" is not active`);
          return false;
        }

        const moduleName = (m.name || "").toLowerCase();
        const moduleApiName = (m.api_name || "").toLowerCase();

        // Check if it's a permission/role module
        const isPermissionModule =
          moduleName.includes("permission") ||
          moduleApiName.includes("permission") ||
          moduleName.includes("role") ||
          moduleApiName.includes("role") ||
          moduleName.includes("user") ||
          moduleApiName.includes("user");

        console.log(`\nModule: ${m.name} (ID: ${m.id})`);
        console.log("Is permission module:", isPermissionModule);

        // If it's a permission/role/user module, only show to system admin
        if (isPermissionModule) {
          const systemAdmin = isSystemAdmin();
          console.log("Is system admin:", systemAdmin);
          if (!systemAdmin) {
            console.log("Hiding permission/role/user module from non-admin user");
            return false;
          }
        }

        // Check if user has permission for this module
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
    return moduleItems;
  };

  const menuItems = getMenuItems();

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get user data
        getUserData();

        // Fetch modules
        await fetchModulesFromDB();

        // Check what permissions we have
        const perms = getPermissionsFromAuthHelper();
        console.log("Initial permissions check:", perms);

      } catch (error) {
        console.error("Error initializing data:", error);
      }
    };

    initializeData();

    // Listen for storage changes (when permissions are updated)
    const handleStorageChange = (e) => {
      if (e.key === "permissions" || e.key === "token") {
        console.log("Storage changed, reinitializing data");
        getUserData();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Calculate visible modules based on screen width
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

      // Always show at least 1 less than total if we have many items
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

    // Exact match
    if (currentPath === normalizedPath) {
      return true;
    }

    // Path starts with
    if (currentPath.startsWith(normalizedPath + "/")) {
      return true;
    }

    // Match by module URL
    if (moduleUrl) {
      const modulePath = `/${moduleUrl}`.toLowerCase();
      if (currentPath === modulePath || currentPath.startsWith(modulePath + "/")) {
        return true;
      }
    }

    return false;
  };

  // If no modules are visible due to permissions
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

  // Don't render if still loading
  if (modulesFromDB.length === 0) {
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
              </NavDropdown>
            )}
          </div>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default Submodule;