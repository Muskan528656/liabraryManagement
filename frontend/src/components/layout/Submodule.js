import React, { useState, useEffect } from "react";
import { Navbar, Nav, Dropdown, Container, NavDropdown } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import DataApi from "../../api/dataApi";

const Submodule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [modulesFromDB, setModulesFromDB] = useState([]);
  const [visibleModulesCount, setVisibleModulesCount] = useState(5);

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

  useEffect(() => {
    try {
      const token = sessionStorage.getItem("token");
      if (token) {
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

  return (
    <Navbar
      expand="lg"
      style={{
        padding: "0.75rem 1.5rem",
        background: "dadde2",
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
                  color: isActive(item.path)
                    ? "var(--primary-color)"
                    : "var(--header-list-item-color)",
                  background: isActive(item.path)
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
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background =
                      "var(--primary-background-color)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <i className={`fa-solid fs-5 ${item.icon} me-1`}></i>
                {item.label}
              </Nav.Link>
            ))}
          </div>

          <div style={{ width: "130px", textAlign: "end" }}>
            {menuItems.length > visibleModulesCount && (
              <NavDropdown
                title={
                  <>
                    <i className="fs-5 fa-solid fa-ellipsis"></i>
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
                      color: isActive(item.path)
                        ? "var(--primary-color)"
                        : "var(--header-list-item-color)",
                      background: isActive(item.path)
                        ? "var(--primary-background-color)"
                        : "transparent",
                      padding: "12px 18px",
                      fontSize: "15px",
                      fontWeight: "600",
                      borderRadius: "4px",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive(item.path)) {
                        e.currentTarget.style.background =
                          "var(--primary-background-color)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(item.path)) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <i
                      className={`fs-5 fa-solid ${item.icon} me-2`}
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
