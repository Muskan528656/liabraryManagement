import React, { useState, useEffect } from "react";
import { Card, Col, Container, Row, Badge, Button } from "react-bootstrap";
import Chart from "react-apexcharts";
import ScrollToTop from "./common/ScrollToTop";
import DataApi from "../api/dataApi";
import Loader from "./common/Loader";
import { useNavigate } from "react-router-dom";
import jwt_decode from "jwt-decode";

const Dashboard = ({ userInfo: propUserInfo }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Get user info from token if not passed as prop
    let currentUserInfo = propUserInfo;
    if (!currentUserInfo) {
      try {
        const token = sessionStorage.getItem("token");
        if (token) {
          currentUserInfo = jwt_decode(token);
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
    setUserInfo(currentUserInfo);
    setUserRole(currentUserInfo?.userrole?.toUpperCase() || "ADMIN");
    fetchDashboardData();
  }, [propUserInfo]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const libraryApi = new DataApi("library");
      const response = await libraryApi.get("/dashboard");
      if (response.data && response.data.success) {
        setDashboardData(response.data.data);
        // Update role if returned from API
        if (response.data.role) {
          setUserRole(response.data.role === "student" ? "STUDENT" : "ADMIN");
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format number with commas
  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Format currency safely (handles null/undefined/non-numeric)
  const formatCurrency = (val) => {
    const n = Number(val);
    if (!isFinite(n)) return `₹0.00`;
    // toFixed returns a string like "1234.56"; formatNumber will add commas
    return `₹${formatNumber(n.toFixed(2))}`;
  };

  // Summary Cards Data
  const summaryCards = dashboardData
    ? [
      {
        title: "Total Books",
        value: formatNumber(dashboardData.summary.totalBooks),
        icon: "fa-book",
        color: "#6f42c1",
        bgColor: "#f3e9fc",
      },
      {
        title: "Available Books",
        value: formatNumber(dashboardData.summary.availableBooks),
        icon: "fa-book-open",
        color: "#6f42c1",
        bgColor: "#f3e9fc",
      },
      {
        title: "Total Authors",
        value: formatNumber(dashboardData.summary.totalAuthors),
        icon: "fa-user-pen",
        color: "#6f42c1",
        bgColor: "#f3e9fc",
      },
      {
        title: "Total Categories",
        value: formatNumber(dashboardData.summary.totalCategories),
        icon: "fa-tags",
        color: "#6f42c1",
        bgColor: "#f3e9fc",
      },
    ]
    : [
      {
        title: "Total Books",
        value: "0",
        icon: "fa-book",
        color: "#6f42c1",
        bgColor: "#f3e9fc",
      },
      {
        title: "Available Books",
        value: "0",
        icon: "fa-book-open",
        color: "#6f42c1",
        bgColor: "#f3e9fc",
      },
      {
        title: "Total Authors",
        value: "0",
        icon: "fa-user-pen",
        color: "#6f42c1",
        bgColor: "#f3e9fc",
      },
      {
        title: "Total Categories",
        value: "0",
        icon: "fa-tags",
        color: "#6f42c1",
        bgColor: "#f3e9fc",
      },
    ];

  // ApexCharts Bar Chart Options - Monthly Trend
  const barChartOptions = {
    chart: {
      id: "bar-chart-monthly",
      type: "bar",
      height: 300,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
        export: {
          csv: {
            filename: "books-monthly-trend",
            columnDelimiter: ",",
            headerCategory: "Month",
            headerValue: "Books Added",
          },
          svg: {
            filename: "books-monthly-trend",
          },
          png: {
            filename: "books-monthly-trend",
          },
        },
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: "60%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: dashboardData
        ? dashboardData.monthlyTrend.map((item) => item.month)
        : [],
      labels: {
        style: {
          colors: "#6f42c1",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#6f42c1",
        },
      },
    },
    fill: {
      colors: ["#6f42c1"],
    },
    tooltip: {
      theme: "light",
    },
    grid: {
      borderColor: "#f0f0f0",
    },
  };

  const barChartSeries = [
    {
      name: "Books Added",
      data: dashboardData
        ? dashboardData.monthlyTrend.map((item) => parseInt(item.count))
        : [],
    },
  ];

  // ApexCharts Donut Chart 1 - Books by Status
  const donutChart1Options = {
    chart: {
      id: "donut-chart-status",
      type: "donut",
      height: 200,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
        export: {
          csv: {
            filename: "books-by-status",
            columnDelimiter: ",",
            headerCategory: "Status",
            headerValue: "Percentage",
          },
          svg: {
            filename: "books-by-status",
          },
          png: {
            filename: "books-by-status",
          },
        },
      },
    },
    labels: ["Available", "Issued"],
    colors: ["#6f42c1", "#20c997"],
    legend: {
      position: "bottom",
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val.toFixed(1) + "%";
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
        },
      },
    },
    tooltip: {
      theme: "light",
    },
  };

  const donutChart1Series = dashboardData
    ? [
      dashboardData.summary.availablePercentage || 0,
      dashboardData.summary.issuedPercentage || 0,
    ]
    : [0, 0];

  // ApexCharts Donut Chart 2 - Books by Category
  const donutChart2Options = {
    chart: {
      id: "donut-chart-category",
      type: "donut",
      height: 200,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
        export: {
          csv: {
            filename: "books-by-category",
            columnDelimiter: ",",
            headerCategory: "Category",
            headerValue: "Count",
          },
          svg: {
            filename: "books-by-category",
          },
          png: {
            filename: "books-by-category",
          },
        },
      },
    },
    labels:
      dashboardData && dashboardData.booksByCategory.length > 0
        ? dashboardData.booksByCategory.map((item) => item.category_name || "Unknown")
        : ["No Data"],
    colors: [
      "#fd7e14",
      "#6f42c1",
      "#20c997",
      "#ffc107",
      "#dc3545",
      "#0d6efd",
      "#6610f2",
      "#e83e8c",
      "#fd7e14",
      "#198754",
    ],
    legend: {
      position: "bottom",
    },
    dataLabels: {
      enabled: true,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
        },
      },
    },
    tooltip: {
      theme: "light",
    },
  };

  const donutChart2Series =
    dashboardData && dashboardData.booksByCategory.length > 0
      ? dashboardData.booksByCategory.map((item) => parseInt(item.book_count || 0))
      : [1];

  // ApexCharts Line Chart Options - Daily Activity
  const lineChartOptions = {
    chart: {
      id: "line-chart-daily",
      type: "area",
      height: 250,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
        export: {
          csv: {
            filename: "daily-activity",
            columnDelimiter: ",",
            headerCategory: "Date",
            headerValue: "Books Added",
          },
          svg: {
            filename: "daily-activity",
          },
          png: {
            filename: "daily-activity",
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 3,
      colors: ["#fd7e14"],
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 90, 100],
        colorStops: [
          {
            offset: 0,
            color: "#fd7e14",
            opacity: 0.3,
          },
          {
            offset: 100,
            color: "#fd7e14",
            opacity: 0.1,
          },
        ],
      },
    },
    xaxis: {
      categories:
        dashboardData && dashboardData.dailyActivity.length > 0
          ? dashboardData.dailyActivity.map((item) => {
            const date = new Date(item.date);
            return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          })
          : [],
      labels: {
        style: {
          colors: "#6f42c1",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#6f42c1",
        },
      },
    },
    tooltip: {
      theme: "light",
    },
    grid: {
      borderColor: "#f0f0f0",
    },
  };

  const lineChartSeries = [
    {
      name: "Books Added",
      data:
        dashboardData && dashboardData.dailyActivity.length > 0
          ? dashboardData.dailyActivity.map((item) => parseInt(item.count || 0))
          : [],
    },
  ];

  // ApexCharts Pie Chart for Books This Month
  const booksThisMonthPieOptions = {
    chart: {
      id: "pie-chart-monthly",
      type: "pie",
      height: 200,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
        export: {
          csv: {
            filename: "books-this-month",
            columnDelimiter: ",",
            headerCategory: "Day",
            headerValue: "Books",
          },
          svg: {
            filename: "books-this-month",
          },
          png: {
            filename: "books-this-month",
          },
        },
      },
    },
    labels:
      dashboardData && dashboardData.dailyActivity.length > 0
        ? dashboardData.dailyActivity.map((item) => {
          const date = new Date(item.date);
          return `Day ${date.getDate()}`;
        })
        : ["No Data"],
    colors: [
      "#6f42c1",
      "#8b5cf6",
      "#a78bfa",
      "#c4b5fd",
      "#ddd6fe",
      "#e9d5ff",
      "#f3e8ff",
      "#faf5ff",
      "#fd7e14",
      "#20c997",
      "#ffc107",
      "#dc3545",
    ],
    legend: {
      position: "bottom",
      fontSize: "12px",
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        // return val.toFixed(1) + "%";
      },
    },
    tooltip: {
      theme: "light",
      y: {
        formatter: function (val) {
          return val + " books";
        },
      },
    },
  };

  const booksThisMonthPieSeries =
    dashboardData && dashboardData.dailyActivity.length > 0
      ? dashboardData.dailyActivity.map((item) => parseInt(item.count || 0))
      : [1];

  // Division List Data - Books by Category
  const divisions =
    dashboardData && dashboardData.booksByCategory.length > 0
      ? dashboardData.booksByCategory.slice(0, 5).map((item) => ({
        name: item.category_name || "Unknown",
        icon: "fa-tags",
        count: parseInt(item.book_count || 0),
      }))
      : [];


  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Student Dashboard Summary Cards
  const studentSummaryCards = dashboardData
    ? [
      {
        title: "Books Available",
        value: formatNumber(dashboardData.summary.totalBooks),
        icon: "fa-book",
        color: "#6f42c1",
        bgColor: "#f3e9fc",
        onClick: () => navigate("/books"),
      },
      {
        title: "My Issued Books",
        value: formatNumber(dashboardData.summary.issuedBooks),
        icon: "fa-book-open",
        color: "#20c997",
        bgColor: "#d1f2eb",
        onClick: () => navigate("/mybooks"),
      },
      {
        title: "Pending Requests",
        value: formatNumber(dashboardData.summary.pendingRequests),
        icon: "fa-clock",
        color: "#ffc107",
        bgColor: "#fff3cd",
        onClick: () => navigate("/requestbook"),
      },
      {
        title: "Overdue Books",
        value: formatNumber(dashboardData.summary.overdueBooks),
        icon: "fa-exclamation-triangle",
        color: "#dc3545",
        bgColor: "#f8d7da",
        onClick: () => navigate("/mybooks"),
      },
      {
        title: "Due Soon",
        value: formatNumber(dashboardData.summary.dueSoon),
        icon: "fa-calendar-days",
        color: "#fd7e14",
        bgColor: "#ffe5d4",
        onClick: () => navigate("/mybooks"),
      },
      {
        title: "Total Fines",
        value: formatCurrency(dashboardData.summary.totalFines),
        icon: "fa-money-bill-wave",
        color: "#dc3545",
        bgColor: "#f8d7da",
        onClick: () => navigate("/myfines"),
      },
    ]
    : [];

  if (loading) {
    return (
      <div className="dashboard-container" style={{ background: "#f3e9fc", width: "100%", minHeight: "100vh", padding: "1rem 0" }}>
        <ScrollToTop />
        <Container fluid>
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
            <Loader />
          </div>
        </Container>
      </div>
    );
  }

  // Student Dashboard
  if (userRole === "STUDENT") {
    return (
      <div className="dashboard-container" style={{ background: "#f3e9fc", width: "100%", minHeight: "100vh", padding: "1rem 0" }}>
        <ScrollToTop />
        <Container fluid style={{ padding: "0.5rem 1rem" }}>
          {/* Welcome Section */}
          <Row className="mb-3">
            <Col>
              <Card style={{ border: "none", borderRadius: "12px", background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)", color: "white" }}>
                <Card.Body className="p-4">
                  <h3 className="mb-1" style={{ fontWeight: "600" }}>Welcome back, {userInfo?.firstname || "Student"}!</h3>
                  <p className="mb-0" style={{ opacity: 0.9, fontWeight: "400" }}>Here's your library activity overview</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Summary Cards Row */}
          <Row className="mb-3">
            {studentSummaryCards.map((card, index) => (
              <Col lg={4} md={6} sm={12} key={index} className="mb-2">
                <Card
                  className="summary-card"
                  style={{
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(111, 66, 193, 0.08)",
                    height: "100%",
                    background: "white",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onClick={card.onClick}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(111, 66, 193, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(111, 66, 193, 0.08)";
                  }}
                >
                  <Card.Body className="p-3">
                    <div className="d-flex align-items-center">
                      <div
                        className="icon-wrapper me-3"
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "10px",
                          backgroundColor: card.bgColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <i className={`fa-solid ${card.icon}`} style={{ fontSize: "20px", color: card.color }}></i>
                      </div>
                      <div className="flex-grow-1">
                        <h2 className="mb-0" style={{ color: "#2d3748", fontSize: "28px", fontWeight: "700" }}>
                          {card.value}
                        </h2>
                        <p className="mb-0 text-muted" style={{ fontSize: "13px", fontWeight: "500" }}>
                          {card.title}
                        </p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Recent Activity Row */}
          <Row className="mb-3">
            {/* Recent Issued Books */}
            <Col lg={6} md={12} className="mb-2">
              <Card style={{ border: "none", borderRadius: "12px", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.08)", height: "100%", background: "white" }}>
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0" style={{ fontSize: "16px", fontWeight: "600" }}>Recent Issued Books</h5>
                    <Button variant="link" size="sm" onClick={() => navigate("/mybooks")} style={{ color: "#6f42c1", textDecoration: "none", padding: 0 }}>
                      View All <i className="fa-solid fa-arrow-right ms-1"></i>
                    </Button>
                  </div>
                  {dashboardData?.recentIssued && dashboardData.recentIssued.length > 0 ? (
                    <div>
                      {dashboardData.recentIssued.map((issue, index) => (
                        <div
                          key={index}
                          className="d-flex align-items-center justify-content-between p-2 mb-2"
                          style={{
                            backgroundColor: "#fafafa",
                            borderRadius: "8px",
                            border: "1px solid #f0f0f0",
                            cursor: "pointer",
                          }}
                          onClick={() => navigate("/mybooks")}
                        >
                          <div className="flex-grow-1">
                            <h6 className="mb-1" style={{ fontSize: "14px", fontWeight: "600" }}>{issue.book_title || "Unknown Book"}</h6>
                            <div className="d-flex align-items-center gap-3">
                              <small className="text-muted" style={{ fontSize: "12px" }}>
                                <i className="fa-solid fa-calendar me-1"></i>
                                Issued: {formatDate(issue.issue_date)}
                              </small>
                              <small className="text-muted" style={{ fontSize: "12px" }}>
                                <i className="fa-solid fa-calendar-check me-1"></i>
                                Due: {formatDate(issue.due_date)}
                              </small>
                            </div>
                          </div>
                          <div>
                            {issue.due_date && new Date(issue.due_date) < new Date() ? (
                              <Badge bg="danger">Overdue</Badge>
                            ) : issue.due_date && new Date(issue.due_date) <= new Date(new Date().setDate(new Date().getDate() + 3)) ? (
                              <Badge bg="warning">Due Soon</Badge>
                            ) : (
                              <Badge bg="success">Active</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted py-4">
                      <i className="fa-solid fa-book-open" style={{ fontSize: "32px", opacity: 0.3, marginBottom: "8px" }}></i>
                      <p className="mb-0" style={{ fontSize: "14px" }}>No books issued yet</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Recent Requests */}
            <Col lg={6} md={12} className="mb-2">
              <Card style={{ border: "none", borderRadius: "12px", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.08)", height: "100%", background: "white" }}>
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0" style={{ fontSize: "16px", fontWeight: "600" }}>Recent Requests</h5>
                    <Button variant="link" size="sm" onClick={() => navigate("/requestbook")} style={{ color: "#6f42c1", textDecoration: "none", padding: 0 }}>
                      View All <i className="fa-solid fa-arrow-right ms-1"></i>
                    </Button>
                  </div>
                  {dashboardData?.recentRequests && dashboardData.recentRequests.length > 0 ? (
                    <div>
                      {dashboardData.recentRequests.map((request, index) => (
                        <div
                          key={index}
                          className="d-flex align-items-center justify-content-between p-2 mb-2"
                          style={{
                            backgroundColor: "#fafafa",
                            borderRadius: "8px",
                            border: "1px solid #f0f0f0",
                            cursor: "pointer",
                          }}
                          onClick={() => navigate("/requestbook")}
                        >
                          <div className="flex-grow-1">
                            <h6 className="mb-1 fw-semibold" style={{ fontSize: "14px" }}>{request.book_title || "Unknown Book"}</h6>
                            <div className="d-flex align-items-center gap-3">
                              <small className="text-muted" style={{ fontSize: "12px" }}>
                                <i className="fa-solid fa-hashtag me-1"></i>
                                Qty: {request.quantity || 1}
                              </small>
                              <small className="text-muted" style={{ fontSize: "12px" }}>
                                <i className="fa-solid fa-calendar me-1"></i>
                                {formatDate(request.createddate)}
                              </small>
                            </div>
                          </div>
                          <div>
                            {request.status === "pending" && <Badge bg="warning">Pending</Badge>}
                            {request.status === "approved" && <Badge bg="success">Approved</Badge>}
                            {request.status === "rejected" && <Badge bg="danger">Rejected</Badge>}
                            {request.status === "cancelled" && <Badge bg="secondary">Cancelled</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted py-4">
                      <i className="fa-solid fa-hand-holding" style={{ fontSize: "32px", opacity: 0.3, marginBottom: "8px" }}></i>
                      <p className="mb-0" style={{ fontSize: "14px" }}>No requests yet</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Quick Actions */}
          <Row>
            <Col>
              <Card style={{ border: "none", borderRadius: "12px", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.08)", background: "white" }}>
                <Card.Body className="p-3">
                  <h5 className="mb-3" style={{ fontSize: "16px", fontWeight: "600" }}>Quick Actions</h5>
                  <div className="d-flex flex-wrap gap-2">
                    <Button variant="primary" onClick={() => navigate("/requestbook")} style={{ borderRadius: "8px", padding: "8px 20px" }}>
                      <i className="fa-solid fa-hand-holding me-2"></i>
                      Request a Book
                    </Button>
                    <Button variant="outline-primary" onClick={() => navigate("/mybooks")} style={{ borderRadius: "8px", padding: "8px 20px" }}>
                      <i className="fa-solid fa-book-open me-2"></i>
                      My Books
                    </Button>
                    <Button variant="outline-primary" onClick={() => navigate("/myfines")} style={{ borderRadius: "8px", padding: "8px 20px" }}>
                      <i className="fa-solid fa-money-bill-wave me-2"></i>
                      My Fines
                    </Button>
                    <Button variant="outline-primary" onClick={() => navigate("/books")} style={{ borderRadius: "8px", padding: "8px 20px" }}>
                      <i className="fa-solid fa-book me-2"></i>
                      Browse Books
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  // Admin Dashboard (existing code)
  return (
    <div className="dashboard-container" style={{ background: "transparent", width: "100%", margin: "-0.5rem -1rem 0 -1rem" }}>
      <ScrollToTop />
      <Container fluid style={{ padding: "0.5rem 1rem" }}>
        {/* Summary Cards Row */}
        <Row className="mb-2">
          {summaryCards.map((card, index) => (
            <Col lg={3} md={6} sm={12} key={index} className="mb-2">
              <Card
                className="summary-card"
                style={{
                  border: "none",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(111, 66, 193, 0.08)",
                  height: "100%",
                  background: "white",
                  cursor: "default",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(111, 66, 193, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(111, 66, 193, 0.08)";
                }}
              >
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center">
                    <div
                      className="icon-wrapper me-3"
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "10px",
                        backgroundColor: card.bgColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i className={`fa-solid ${card.icon}`} style={{ fontSize: "20px", color: card.color }}></i>
                    </div>
                    <div className="flex-grow-1">
                      <h2 className="mb-0" style={{ color: "#2d3748", fontSize: "28px", fontWeight: "700" }}>
                        {card.value}
                      </h2>
                      <p className="mb-0 text-muted" style={{ fontSize: "13px", fontWeight: "500" }}>
                        {card.title}
                      </p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Charts Row 1 - Daily Activity and Books This Month */}
        <Row className="mb-2">
          <Col lg={8} md={12} className="mb-2">
            <Card
              style={{
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(111, 66, 193, 0.08)",
                height: "100%",
                background: "white",
              }}
            >
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="mb-0" style={{ fontSize: "16px", fontWeight: "600" }}>Daily Activity</h5>
                </div>
                <div style={{ height: "280px", background: "#fafafa", borderRadius: "8px", padding: "8px" }}>
                  <Chart options={lineChartOptions} series={lineChartSeries} type="area" height={280} id="line-chart-daily" />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6} className="mb-2">
            <Card
              style={{
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(111, 66, 193, 0.08)",
                height: "100%",
                background: "linear-gradient(135deg, #f3e9fc 0%, #e9d5ff 100%)",
                color: "#6f42c1",
                border: "1px solid #e9d5ff",
              }}
            >
              <Card.Body className="p-3">
                <h2 className="mb-1" style={{ fontSize: "40px", fontWeight: "700" }}>
                  {dashboardData ? formatNumber(dashboardData.summary.booksThisMonth) : "0"}
                </h2>
                <p className="mb-2" style={{ fontSize: "16px", opacity: 0.9, fontWeight: "500" }}>
                  Books this month
                </p>
                <div style={{ height: "180px", position: "relative" }}>
                  <Chart
                    options={booksThisMonthPieOptions}
                    series={booksThisMonthPieSeries}
                    type="pie"
                    height={180}
                    id="pie-chart-monthly"
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>


        {/* Charts Row 2 - Books By Category List */}
        <Row className="mb-2">
          <Col lg={4} md={12} className="mb-2">
            <Card
              style={{
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(111, 66, 193, 0.08)",
                height: "100%",
                background: "white",
              }}
            >
              <Card.Body className="p-3">
                <h5 className="mb-2" style={{ fontSize: "16px", fontWeight: "600" }}>Books By Category</h5>
                <div className="division-list">
                  {divisions.map((division, index) => (
                    <div
                      key={index}
                      className="d-flex align-items-center justify-content-between p-2 mb-2"
                      style={{
                        backgroundColor: "#fafafa",
                        borderRadius: "8px",
                        border: "1px solid #f0f0f0",
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <div
                          className="me-2"
                          style={{
                            width: "35px",
                            height: "35px",
                            borderRadius: "8px",
                            backgroundColor: "#e9ecef",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <i className={`fa-solid ${division.icon}`} style={{ color: "#6f42c1", fontSize: "14px" }}></i>
                        </div>
                        <div>
                          <h6 className="mb-0" style={{ fontSize: "14px", fontWeight: "600" }}>{division.name}</h6>
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: "16px", fontWeight: "700" }}>
                          {division.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
          {/* </Row> */}
          {/* Charts Row 3 - Other Charts */}
          {/* <Row className="mb-2"> */}
          <Col lg={4} md={12} className="mb-2">
            <Card
              style={{
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(111, 66, 193, 0.08)",
                height: "100%",
                background: "white",
              }}
            >
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="mb-0" style={{ fontSize: "16px", fontWeight: "600" }}>Books Issued vs Returned Trend</h5>
                </div>
                <div style={{ height: "280px", background: "#fafafa", borderRadius: "8px", padding: "8px" }}>
                  <Chart options={barChartOptions} series={barChartSeries} type="bar" height={280} id="bar-chart-monthly" />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6} className="mb-2">
            <Card
              style={{
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(111, 66, 193, 0.08)",
                height: "100%",
                background: "white",
              }}
            >
              <Card.Body className="p-3">
                <div className="text-center mb-2">
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      margin: "0 auto",
                      borderRadius: "50%",
                      backgroundColor: "#f3e9fc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <i className="fa-solid fa-book" style={{ fontSize: "24px", color: "#6f42c1" }}></i>
                  </div>
                  <h6 className="mb-0" style={{ fontSize: "36px", fontWeight: "700", color: "#6f42c1" }}>
                    {dashboardData ? `${dashboardData.summary.issuedPercentage}%` : "0%"}
                  </h6>
                  <p className="text-muted mb-2" style={{ fontSize: "14px", fontWeight: "500" }}>Books Issued</p>
                </div>
                <div style={{ height: "180px", background: "#fafafa", borderRadius: "8px", padding: "8px" }}>
                  <Chart options={donutChart1Options} series={donutChart1Series} type="donut" height={180} id="donut-chart-status" />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6} className="mb-2">
            <Card
              style={{
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(111, 66, 193, 0.08)",
                height: "100%",
                background: "white",
              }}
            >
              <Card.Body className="p-3">
                <h5 className="mb-2" style={{ fontSize: "16px", fontWeight: "600" }}>Books by Category</h5>
                <div className="text-center mb-2">
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      margin: "0 auto",
                      borderRadius: "50%",
                      backgroundColor: "#ffe5d4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <i className="fa-solid fa-tags" style={{ fontSize: "24px", color: "#fd7e14" }}></i>
                  </div>
                </div>
                <div style={{ height: "180px", background: "#fafafa", borderRadius: "8px", padding: "8px" }}>
                  <Chart options={donutChart2Options} series={donutChart2Series} type="donut" height={180} id="donut-chart-category" />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

      </Container>
    </div>
  );
};

export default Dashboard;
