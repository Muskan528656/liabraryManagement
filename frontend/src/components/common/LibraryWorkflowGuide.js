import React, { useState } from "react";
import { Card, Collapse, Badge, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const LibraryWorkflowGuide = ({ isSidebar = false }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const workflowSteps = [
    {
      step: 1,
      title: "Library Settings",
      description: "Configure basic library settings first",
      icon: "fa-cog",
      color: "#6f42c1",
      items: [
        { label: "Library Settings", path: "/librarysettings", icon: "fa-cog" },
      ],
      details: "Set default due dates, max books per student, renewal policies, and penalty settings. This is the foundation of your library."
    },
    {
      step: 2,
      title: "Add Authors",
      description: "Create author master records",
      icon: "fa-user-pen",
      color: "#8b5cf6",
      items: [
        { label: "Author", path: "/author", icon: "fa-user-pen" },
      ],
      details: "Add all authors whose books you want to add to the library. This helps in organizing and searching books."
    },
    {
      step: 3,
      title: "Add Categories",
      description: "Create book categories",
      icon: "fa-tags",
      color: "#a78bfa",
      items: [
        { label: "Category", path: "/category", icon: "fa-tags" },
      ],
      details: "Define book categories like Fiction, Non-Fiction, Science, etc. This helps in organizing books by subject."
    },
    {
      step: 4,
      title: "Add Suppliers",
      description: "Register book suppliers",
      icon: "fa-truck",
      color: "#c4b5fd",
      items: [
        { label: "Supplier", path: "/supplier", icon: "fa-truck" },
      ],
      details: "Add suppliers from whom you purchase books. This helps in tracking book sources and purchase history."
    },
    {
      step: 5,
      title: "Add Books",
      description: "Register books in the library",
      icon: "fa-book",
      color: "#ddd6fe",
      items: [
        { label: "Books", path: "/books", icon: "fa-book" },
      ],
      details: "Add books with details like ISBN, title, author, category, and availability status. Books can be added using barcode scanner."
    },
    {
      step: 6,
      title: "Add Users",
      description: "Register library members",
      icon: "fa-users",
      color: "#ede9fe",
      items: [
        { label: "User", path: "/user", icon: "fa-users" },
      ],
      details: "Register library members (students, staff, etc.) who can borrow books. User details are required for issuing library cards."
    },
    {
      step: 7,
      title: "Issue Library Cards",
      description: "Create library cards for users",
      icon: "fa-id-card",
      color: "#f3e8ff",
      items: [
        { label: "Library Card", path: "/librarycard", icon: "fa-id-card" },
      ],
      details: "Generate library cards with barcode for each user. Library cards are mandatory before issuing books. Use barcode scanner for quick card generation."
    },
    {
      step: 8,
      title: "Issue Books",
      description: "Lend books to members",
      icon: "fa-hand-holding",
      color: "#e9d5ff",
      items: [
        { label: "Book Issue", path: "/bookissue", icon: "fa-hand-holding" },
      ],
      details: "Issue books to users with due dates. Track issued books, return dates, and renewal requests. Use barcode scanner for quick book issue."
    },
    {
      step: 9,
      title: "Manage Returns & Penalties",
      description: "Handle book returns and fines",
      icon: "fa-money-bill-wave",
      color: "#f3e8ff",
      items: [
        { label: "Penalty Master", path: "/penalty", icon: "fa-money-bill-wave" },
      ],
      details: "Process book returns, calculate penalties for late returns or missing books. Track all fines and payments."
    },
    {
      step: 10,
      title: "View Dashboard & Reports",
      description: "Monitor library activities",
      icon: "fa-chart-line",
      color: "#e9d5ff",
      items: [
        { label: "Dashboard", path: "/", icon: "fa-chart-line" },
      ],
      details: "View library statistics, book availability, issued books, daily activity, and comprehensive reports."
    },
  ];

  const handleNavigate = (path) => {
    navigate(path);
  };

  // If it's a sidebar, render as fixed right sidebar
  if (isSidebar) {
    return (
      <>
        {/* Floating Toggle Button */}
        <Button
          onClick={() => setOpen(!open)}
          style={{
            position: "fixed",
            right: open ? "360px" : "0",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 1000,
            background: "none",
            // background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
            border: "none",
            borderTopLeftRadius: "8px",
            borderBottomLeftRadius: "8px",
            padding: "12px 8px",
            color: "white",
            boxShadow: "0 2px 8px rgba(111, 66, 193, 0.3)",
            transition: "right 0.3s ease",
            writingMode: "vertical-rl",
            textOrientation: "mixed",
          }}
        >
          <i className="fa-solid fa-route me-2"></i>
          <span style={{ fontSize: "12px", fontWeight: "600" }}>Liabrary Workflow Guide</span>
        </Button>

        {/* Right Sidebar */}
        <div
          style={{
            position: "fixed",
            right: open ? "0" : "-360px",
            top: "70px",
            width: "360px",
            height: "calc(100vh - 70px)",
            background: "linear-gradient(180deg, #e9d5ff 0%, #f3e8ff 100%)",
            boxShadow: "-2px 0 10px rgba(0,0,0,0.1)",
            transition: "right 0.3s ease",
            zIndex: 999,
            overflowY: "auto",
            borderLeft: "1px solid #e9ecef",
          }}
        >
          <div style={{ padding: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                paddingBottom: "15px",
                borderBottom: "2px solid rgba(111, 66, 193, 0.2)",
              }}
            >
              <h5 style={{ margin: 0, color: "black", fontWeight: "bold" }}>
                <i className="fa-solid fa-route me-2"></i>
                Library Management System Guide
              </h5>
              <Button
                variant="link"
                onClick={() => setOpen(false)}
                style={{
                  color: "#6f42c1",
                  padding: "4px 8px",
                  textDecoration: "none",
                }}
              >
                <i className="fa-solid fa-times"></i>
              </Button>
            </div>
            <div style={{ padding: "0 10px" }}>
              <p className="text-muted small mb-3" style={{ fontSize: "12px" }}>
                <i className="fa-solid fa-info-circle me-1"></i>
                Follow these steps in order for smooth library management
              </p>
              <div className="workflow-steps">
              {workflowSteps.map((step, index) => (
                <div
                  key={step.step}
                  style={{
                    marginBottom: "16px",
                    position: "relative",
                    paddingLeft: "40px",
                  }}
                >
                  {/* Step Number Circle */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: step.color,
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "14px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    {step.step}
                  </div>

                  {/* Connector Line */}
                  {index < workflowSteps.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        left: "15px",
                        top: "32px",
                        width: "2px",
                        height: "calc(100% + 8px)",
                        background: "linear-gradient(180deg, " + step.color + " 0%, " + (workflowSteps[index + 1]?.color || step.color) + " 100%)",
                        opacity: 0.3,
                      }}
                    />
                  )}

                  {/* Step Content */}
                  <div
                    style={{
                      background: "white",
                      borderRadius: "8px",
                      padding: "12px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      borderLeft: `3px solid ${step.color}`,
                    }}
                  >
                    <div className="d-flex align-items-start mb-2">
                      <i
                        className={`fa-solid ${step.icon}`}
                        style={{
                          color: step.color,
                          fontSize: "18px",
                          marginRight: "10px",
                          marginTop: "2px",
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <h6
                          style={{
                            margin: 0,
                            color: "#333",
                            fontSize: "14px",
                            fontWeight: "600",
                          }}
                        >
                          {step.title}
                        </h6>
                        <p
                          style={{
                            margin: "4px 0 8px 0",
                            color: "#666",
                            fontSize: "12px",
                          }}
                        >
                          {step.description}
                        </p>
                        <p
                          style={{
                            margin: "0 0 8px 0",
                            color: "#888",
                            fontSize: "11px",
                            fontStyle: "italic",
                          }}
                        >
                          {step.details}
                        </p>
                        <div className="d-flex flex-wrap gap-2">
                          {step.items.map((item, itemIndex) => (
                            <Badge
                              key={itemIndex}
                              onClick={() => handleNavigate(item.path)}
                              style={{
                                background: step.color,
                                cursor: "pointer",
                                padding: "6px 12px",
                                fontSize: "11px",
                                fontWeight: "500",
                                borderRadius: "6px",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = "scale(1.05)";
                                e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = "scale(1)";
                                e.target.style.boxShadow = "none";
                              }}
                            >
                              <i className={`fa-solid ${item.icon} me-1`}></i>
                              {item.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  background: "linear-gradient(135deg, #e9d5ff 0%, #f3e8ff 100%)",
                  borderRadius: "8px",
                  border: "1px solid rgba(111, 66, 193, 0.2)",
                }}
              >
                <div className="d-flex align-items-center">
                  <i
                    className="fa-solid fa-lightbulb"
                    style={{ color: "#6f42c1", fontSize: "18px", marginRight: "10px" }}
                  />
                  <div>
                    <strong style={{ fontSize: "12px", color: "#6f42c1" }}>
                      Quick Tip:
                    </strong>
                    <p
                      style={{
                        margin: "4px 0 0 0",
                        fontSize: "11px",
                        color: "#666",
                      }}
                    >
                      Click on any module badge above to navigate directly to that section.
                      Complete each step before moving to the next for best results.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Regular card view (for dashboard if needed)
  return (
    <Card
      style={{
        marginBottom: "1rem",
        border: "none",
        boxShadow: "0 2px 8px rgba(111, 66, 193, 0.1)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <Card.Header
        onClick={() => setOpen(!open)}
        style={{
          background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
          color: "white",
          cursor: "pointer",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div className="d-flex align-items-center">
          <i className="fa-solid fa-route me-2"></i>
          <strong>Library Workflow Guide</strong>
        </div>
        <i
          className={`fa-solid fa-chevron-${open ? "up" : "down"}`}
          style={{ fontSize: "12px" }}
        ></i>
      </Card.Header>
      <Collapse in={open}>
        <div>
          <Card.Body style={{ padding: "16px", background: "#fafafa" }}>
            <p className="text-muted small mb-3" style={{ fontSize: "12px" }}>
              <i className="fa-solid fa-info-circle me-1"></i>
              Follow these steps in order for smooth library management
            </p>
            <div className="workflow-steps">
              {workflowSteps.map((step, index) => (
                <div
                  key={step.step}
                  style={{
                    marginBottom: "16px",
                    position: "relative",
                    paddingLeft: "40px",
                  }}
                >
                  {/* Step Number Circle */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: step.color,
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "14px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    {step.step}
                  </div>

                  {/* Connector Line */}
                  {index < workflowSteps.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        left: "15px",
                        top: "32px",
                        width: "2px",
                        height: "calc(100% + 8px)",
                        background: "linear-gradient(180deg, " + step.color + " 0%, " + (workflowSteps[index + 1]?.color || step.color) + " 100%)",
                        opacity: 0.3,
                      }}
                    />
                  )}

                  {/* Step Content */}
                  <div
                    style={{
                      background: "white",
                      borderRadius: "8px",
                      padding: "12px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      borderLeft: `3px solid ${step.color}`,
                    }}
                  >
                    <div className="d-flex align-items-start mb-2">
                      <i
                        className={`fa-solid ${step.icon}`}
                        style={{
                          color: step.color,
                          fontSize: "18px",
                          marginRight: "10px",
                          marginTop: "2px",
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <h6
                          style={{
                            margin: 0,
                            color: "#333",
                            fontSize: "14px",
                            fontWeight: "600",
                          }}
                        >
                          {step.title}
                        </h6>
                        <p
                          style={{
                            margin: "4px 0 8px 0",
                            color: "#666",
                            fontSize: "12px",
                          }}
                        >
                          {step.description}
                        </p>
                        <p
                          style={{
                            margin: "0 0 8px 0",
                            color: "#888",
                            fontSize: "11px",
                            fontStyle: "italic",
                          }}
                        >
                          {step.details}
                        </p>
                        <div className="d-flex flex-wrap gap-2">
                          {step.items.map((item, itemIndex) => (
                            <Badge
                              key={itemIndex}
                              onClick={() => handleNavigate(item.path)}
                              style={{
                                background: step.color,
                                cursor: "pointer",
                                padding: "6px 12px",
                                fontSize: "11px",
                                fontWeight: "500",
                                borderRadius: "6px",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = "scale(1.05)";
                                e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = "scale(1)";
                                e.target.style.boxShadow = "none";
                              }}
                            >
                              <i className={`fa-solid ${item.icon} me-1`}></i>
                              {item.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                background: "linear-gradient(135deg, #e9d5ff 0%, #f3e8ff 100%)",
                borderRadius: "8px",
                border: "1px solid rgba(111, 66, 193, 0.2)",
              }}
            >
              <div className="d-flex align-items-center">
                <i
                  className="fa-solid fa-lightbulb"
                  style={{ color: "#6f42c1", fontSize: "18px", marginRight: "10px" }}
                />
                <div>
                  <strong style={{ fontSize: "12px", color: "#6f42c1" }}>
                    Quick Tip:
                  </strong>
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "11px",
                      color: "#666",
                    }}
                  >
                    Click on any module badge above to navigate directly to that section.
                    Complete each step before moving to the next for best results.
                  </p>
                </div>
              </div>
            </div>
          </Card.Body>
        </div>
      </Collapse>
    </Card>
  );
};

export default LibraryWorkflowGuide;

