/*
**@Author: Aabid 
**@Date: NOV-2025
*/

import React, { useState, useEffect, useCallback } from "react";
import { Card, Col, Container, Row, Badge } from "react-bootstrap";
import Chart from "react-apexcharts";
import ScrollToTop from "./common/ScrollToTop";
import DataApi from "../api/dataApi";
import Loader from "./common/Loader";
import jwt_decode from "jwt-decode";
import DashboardApi from "../api/dashboardApi";


const PRIMARY_COLOR = "#4338ca";
const ACCENT_COLOR = "#6366f1";
const SUCCESS_COLOR = "#059669";
const WARNING_COLOR = "#f59e0b";
const DANGER_COLOR = "#dc2626";
const INFO_COLOR = "#8b5cf6";

const styles = {
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.08)",
    background: "#fff",
    height: "100%",
    transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)",
    overflow: "hidden",
  },
  interactiveCard: {
    cursor: "pointer",
  },
  cardHeader: {
    background: "transparent",
    borderBottom: "1px solid #f1f5f9",
    borderRadius: "20px 20px 0 0",
    padding: "15px 20px"
  },
  cardBody: {
    padding: "20px"
  },
  sectionTitle: {
    fontSize: "17px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "22px",
    marginTop: "28px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    paddingLeft: "5px"
  }
};

const AlertCardHoverStyle = {
  "&:hover": {
    transform: "translateY(-5px) scale(1.01)",
    boxShadow: "0 25px 60px rgba(0, 0, 0, 0.15)",
  }
};

const InteractiveCard = ({ children, style, ...props }) => {
  const [hover, setHover] = useState(false);
  return (
    <Card
      {...props}
      style={{
        ...styles.card,
        ...styles.interactiveCard,
        ...style,
        ...(hover ? AlertCardHoverStyle["&:hover"] : {}),
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </Card>
  );
};

const Dashboard = ({ userInfo: propUserInfo }) => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [userRole, setUserRole] = useState(null);


  const [metrics, setMetrics] = useState({
    dueSoonCount: 0,
    overdueCount: 0,
    fineCollectedThisMonth: 0,
    damagedCount: 0,
    totalBooks: 0,          // Total copies in library
    totalTitles: 0,         // Total unique book titles
    availableBooks: 0,      // Available copies
    issuedBooks: 0,         // Issued copies
    booksThisMonth: 0,
    totalSubmissions: 0,
    total_copies: 0,
  });

  const [cardDetails, setCardDetails] = useState([]);
  const [cardLimitSetting, setCardLimitSetting] = useState(6);
  const [categories, setCategories] = useState([]);
  const [topAvailableBooks, setTopAvailableBooks] = useState([]);


  const formatNumber = useCallback((num) => {
    if (num === null || num === undefined || isNaN(num)) return "0";
    return Number(num).toLocaleString('en-IN');
  }, []);

  const formatCurrency = useCallback((val) => {
    const n = Number(val);
    if (!isFinite(n)) return `₹0.00`;
    return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);


  useEffect(() => {
    const initializeUser = () => {
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
    };

    initializeUser();
  }, [propUserInfo]);


  useEffect(() => {
    let isMounted = true;

    const fetchAllDashboardData = async () => {
      try {
        setLoading(true);


        await Promise.all([
          fetchDashboardSummary(),
          fetchAlertMetrics(),
          fetchLibraryDetails()
        ]);

      } catch (error) {
        console.error("Error in dashboard data fetch:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAllDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);


  const fetchDashboardSummary = async () => {
    try {
      const libraryApi = new DataApi("library");
      const dashboardResponse = await libraryApi.get("/dashboard");

      if (dashboardResponse.data?.success) {
        const data = dashboardResponse.data.data;
        setDashboardData(data);

        console.log("Dashboard API Response:", data);

        if (data.summary) {
          setMetrics(prev => ({
            ...prev,
            totalBooks: data.summary.totalBooks || data.summary.total_copies || 0,
            totalTitles: data.summary.totalTitles || data.summary.total_books || 0,
            availableBooks: data.summary.availableBooks || data.summary.available_copies || 0,
            issuedBooks: data.summary.issuedBooks || data.summary.issued_copies || 0,
            booksThisMonth: data.summary.booksThisMonth || data.summary.books_this_month || 0,
            totalSubmissions: data.summary.totalSubmissions || data.summary.total_submissions || 0,
            total_copies: data.summary.total_copies || data.summary.total_copies || 0,
          }));
        }


        if (data.booksByCategory?.length > 0) {
          const topCategories = data.booksByCategory.slice(0, 5).map(item => ({
            name: item.category_name || "Unknown",
            icon: "fa-tag",
            count: parseInt(item.book_count || 0),
          }));
          setCategories(topCategories);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
    }
  };


  const fetchAlertMetrics = async () => {
    try {
      const resp = await DashboardApi.fetchAll();
      const data = resp?.data?.[0] || {};

      console.log("Alert Metrics API Response:", data);

      setMetrics(prev => ({
        ...prev,
        dueSoonCount: data.total_due_soon || 0,
        overdueCount: data.overdue_books || 0,
        fineCollectedThisMonth: data.fine_collected_this_month || 0,
        damagedCount: data.damaged_missing_books || 0,
      }));
    } catch (err) {
      console.error("Error fetching alert metrics:", err);
    }
  };


  const fetchLibraryDetails = async () => {
    try {
      const bookApi = new DataApi("book");
      const issueApi = new DataApi("bookissue");
      const settingsApi = new DataApi("librarysettings");
      const cardApi = new DataApi("librarycard");


      const booksResp = await bookApi.fetchAll();
      const books = Array.isArray(booksResp?.data) ? booksResp.data :
        (booksResp?.data?.rows || booksResp || []);


      let availableCopies = 0;
      const booksWithAvailability = [];

      if (Array.isArray(books)) {
        books.forEach((b) => {
          const total = Number(b.total_copies ?? b.totalCopies ?? 0) || 0;
          const available = Number(b.available_copies ?? b.availableCopies ?? total) || total;
          availableCopies += available;

          booksWithAvailability.push({
            title: b.title || "Unknown",
            available_copies: available,
            total_copies: total
          });
        });
      }


      const sortedBooks = [...booksWithAvailability]
        .sort((a, b) => b.available_copies - a.available_copies)
        .slice(0, 10);
      setTopAvailableBooks(sortedBooks);


      const issuesResp = await issueApi.get("/active");
      const activeIssues = Array.isArray(issuesResp?.data) ? issuesResp.data :
        (issuesResp?.data?.rows || issuesResp || []);
      const issuedCount = Array.isArray(activeIssues) ? activeIssues.length : 0;


      let cardLimit = 6;
      try {
        const settingsResp = await settingsApi.get("/all");
        const settingsData = settingsResp?.data?.data || settingsResp?.data || settingsResp;
        if (settingsData) {
          cardLimit = Number(
            settingsData.max_books_per_card ??
            settingsData.max_books ??
            settingsData.max_books_per_card?.setting_value
          ) || cardLimit;
        }
      } catch (err) {
        console.warn("Could not fetch card limit:", err);
      }

      setCardLimitSetting(cardLimit);


      await fetchCardDetails(cardApi, issueApi, cardLimit);

    } catch (error) {
      console.error("Error fetching library details:", error);
    }
  };


  const fetchCardDetails = async (cardApi, issueApi, currentLimit) => {
    try {
      const cardsResp = await cardApi.fetchAll();
      const issuesResp = await issueApi.get("/active");

      const cards = Array.isArray(cardsResp?.data) ? cardsResp.data :
        (cardsResp?.data?.rows || cardsResp || []);
      const activeIssues = Array.isArray(issuesResp?.data) ? issuesResp.data :
        (issuesResp?.data?.rows || issuesResp || []);


      const countsByCard = {};
      activeIssues.forEach((issue) => {
        const cid = issue.card_id || issue.cardId || issue.cardid;
        if (cid) {
          countsByCard[cid] = (countsByCard[cid] || 0) + 1;
        }
      });


      const details = cards.map((c) => {
        const issued = countsByCard[c.id] || 0;
        const remaining = Math.max(0, currentLimit - issued);
        return {
          id: c.id,
          user_name: c.user_name || c.userName || `Card ${c.card_number}` || "Unknown",
          issued: issued,
          remaining: remaining
        };
      });


      details.sort((a, b) => b.issued - a.issued);
      setCardDetails(details.slice(0, 10));

    } catch (error) {
      console.error("Error fetching card details:", error);
    }
  };


  const getChartConfig = (filename) => ({
    toolbar: {
      show: true,
      tools: {
        download: true,
        selection: false,
        zoom: false,
        zoomin: false,
        zoomout: false,
        pan: false,
        reset: false,
      },
      export: {
        csv: { filename: filename, headerCategory: "Category" },
        svg: { filename: filename },
        png: { filename: filename }
      }
    }
  });


  const libraryCardBarOptions = {
    chart: {
      type: 'bar',
      height: 350,
      stacked: true,
      fontFamily: 'inherit',
      ...(getChartConfig("Library_Card_Usage_Report").toolbar ?
        { toolbar: getChartConfig("Library_Card_Usage_Report").toolbar } : {})
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        barHeight: '65%',
        dataLabels: {
          total: {
            enabled: true,
            offsetX: 10,
            style: { fontSize: '13px', fontWeight: 800, color: '#1e293b' }
          }
        }
      },
    },
    dataLabels: { enabled: false },
    grid: { show: true, borderColor: '#f1f5f9', xaxis: { lines: { show: true } } },
    xaxis: {
      categories: cardDetails.map(c =>
        c.user_name.length > 20 ? c.user_name.substring(0, 20) + "..." : c.user_name
      ),
      max: cardLimitSetting,
      labels: { style: { colors: '#94a3b8', fontSize: '12px' } }
    },
    yaxis: {
      labels: {
        style: { colors: "#334155", fontWeight: 700, fontSize: '14px' },
        maxWidth: 180
      }
    },
    fill: { opacity: 1 },
    colors: [PRIMARY_COLOR, '#e2e8f0'],
    legend: { position: 'top', horizontalAlign: 'right', fontSize: '14px' },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val, { seriesIndex }) =>
          `${val} Book${val !== 1 ? 's' : ''} (${seriesIndex === 0 ? 'Issued' : 'Available Space'})`
      }
    }
  };

  const libraryCardBarSeries = [
    { name: 'Issued Books', data: cardDetails.map(c => c.issued) },
    { name: 'Available Space', data: cardDetails.map(c => c.remaining) }
  ];


  const donutOptions = (colors, filename) => ({
    chart: {
      type: "donut",
      height: 220,
      fontFamily: 'inherit',
      ...(filename ? getChartConfig(filename) : { toolbar: { show: false } })
    },
    colors: colors,
    legend: {
      position: "bottom",
      fontSize: '13px',
      markers: {
        radius: 12,
        width: 12,
        height: 12
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5
      }
    },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: "75%",
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Copies',
              color: '#334155',
              fontWeight: 600,
              fontSize: '14px',
              formatter: () => formatNumber(metrics.totalBooks)
            },
            value: {
              show: true,
              fontSize: '22px',
              fontWeight: 700,
              color: '#1e293b'
            }
          }
        }
      }
    },
    stroke: { width: 0 },
    tooltip: {
      theme: "light",
      y: {
        formatter: (val) => `${val}%`
      }
    },
  });


  const availableBooksOptions = {
    chart: {
      type: 'bar',
      height: 320,
      fontFamily: 'inherit',
      ...getChartConfig("Book_Status_Inventory_Report")
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        horizontal: true,
        barHeight: '55%',
        distributed: true
      }
    },
    dataLabels: {
      enabled: true,
      textAnchor: 'start',
      style: {
        colors: ['#fff'],
        fontSize: '11px',
        fontWeight: 600
      },
      formatter: function (val) { return val + " copies" },
      offsetX: 5,
    },
    xaxis: {
      categories: topAvailableBooks.map(b =>
        b.title.length > 20 ? b.title.substring(0, 20) + "..." : b.title
      ),
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px'
        }
      },
      title: {
        text: 'Number of Copies',
        style: {
          color: '#64748b',
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#334155',
          fontWeight: 600,
          fontSize: '13px'
        }
      }
    },
    colors: [
      '#4f46e5', '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd',
      '#ddd6fe', '#ede9fe', '#f3e8ff', '#f5f3ff', '#faf5ff'
    ],
    tooltip: {
      theme: 'light',
      y: {
        title: {
          formatter: () => 'Available Copies:'
        },
        formatter: (val) => `${val} copies available`
      }
    },
    legend: { show: false },
    grid: { show: false }
  };

  const availableBooksSeries = [{
    name: 'Copies Available',
    data: topAvailableBooks.map(b => parseInt(b.available_copies || 0))
  }];


  const calculateDonutSeries = () => {
    if (metrics.totalBooks === 0) return [0, 0];

    const issuedPercentage = Math.round((metrics.issuedBooks / metrics.totalBooks) * 100);
    const availablePercentage = 100 - issuedPercentage;

    return [availablePercentage, issuedPercentage];
  };

  const donutChartSeries = calculateDonutSeries();


  const summaryCards = [
    {
      title: "Total Books",
      value: formatNumber(metrics.totalTitles || metrics.totalBooks),
      icon: "fa-book",
      color: PRIMARY_COLOR,
      bgColor: "#e0e7ff",

    },
    {
      title: "Total Copies",
      value: formatNumber(metrics.total_copies),
      icon: "fa-copy",
      color: ACCENT_COLOR,
      bgColor: "#e0e7ff",

    },
    {
      title: "Available Copies",
      value: formatNumber(metrics.availableBooks),
      icon: "fa-book-open",
      color: SUCCESS_COLOR,
      bgColor: "#d1fae5",

    },
    {
      title: "Issued Copies",
      value: formatNumber(metrics.issuedBooks),
      icon: "fa-user-pen",
      color: WARNING_COLOR,
      bgColor: "#fef3c7",

    },
  ];


  const alertCards = [
    {
      count: metrics.dueSoonCount,
      label: "Due Soon",
      icon: "fa-clock",
      bg: "#fff7ed",
      color: WARNING_COLOR,
      description: "Books due within 3 days"
    },
    {
      count: metrics.overdueCount,
      label: "Overdue",
      icon: "fa-circle-exclamation",
      bg: "#fef2f2",
      color: DANGER_COLOR,
      description: "Past due date"
    },
    {
      count: metrics.fineCollectedThisMonth,
      label: "Fine Collected",
      icon: "fa-indian-rupee-sign",
      bg: "#ecfdf5",
      color: SUCCESS_COLOR,
      isCurrency: true,
      description: "This month"
    },
    {
      count: metrics.damagedCount,
      label: "Damaged / Lost",
      icon: "fa-heart-crack",
      bg: "#fdf2f8",
      color: '#db2777',
      description: "Requires attention"
    }
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <Loader />
      </div>
    );
  }


  if (userRole === "STUDENT") {
    return (
      <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "25px" }}>
        <ScrollToTop />
        <Container fluid>
          <Card style={{
            ...styles.card,
            background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${INFO_COLOR} 100%)`,
            color: "white",
            marginBottom: "40px",
            border: 'none'
          }}>
            <Card.Body className="p-5">
              <h1 className="fw-bolder mb-2">
                Welcome Back, {userInfo?.firstname || 'Student'}! 👋
              </h1>
              <p className="mb-0 opacity-75" style={{ fontSize: '18px' }}>
                Your personalized library dashboard is ready. Check your borrowed books and upcoming deadlines.
              </p>
            </Card.Body>
          </Card>

          {/* Student-specific content */}
          <Row>
            <Col lg={8} className="mx-auto">
              <Card style={styles.card}>
                <Card.Header style={styles.cardHeader}>
                  <h5 className="fw-bold mb-0">Your Currently Issued Books</h5>
                </Card.Header>
                <Card.Body>
                  <div className="text-center py-5">
                    <i className="fa-solid fa-book-open-reader fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No books currently issued</p>
                    <button className="btn btn-primary mt-2">
                      Browse Library
                    </button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }


  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", paddingBottom: "50px" }}>
      <ScrollToTop />
      <Container fluid className="px-3 py-3">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 mt-2">
          <div>
            <h4 style={{ fontWeight: "400", color: "#1e293b", marginBottom: "4px" }}>
              📚 Library Management Dashboard
            </h4>
            <p style={{ color: "#64748b", margin: 0, fontSize: '14px' }}>
              Real-time analytics and operational metrics for efficient library management
            </p>
          </div>

        </div>

        {/* 1. Core Library Inventory */}
        <div style={styles.sectionTitle}>
          <i className="fa-solid fa-boxes-stacked" style={{ color: PRIMARY_COLOR }}></i>
          Inventory & Capacity Overview
        </div>
        <Row className="mb-4 g-3">
          {summaryCards.map((card, index) => (
            <Col lg={3} md={6} sm={12} key={index}>
              <Card style={styles.card}>
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div>
                      <p className="mb-1 text-uppercase" style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "#64748b"
                      }}>
                        {card.title}
                      </p>
                      <h2 className="mb-0" style={{
                        color: card.color,
                        fontSize: "22px",
                        fontWeight: "800"
                      }}>
                        {card.value}
                      </h2>
                    </div>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      backgroundColor: card.bgColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: "48px"
                    }}>
                      <i className={`fa-solid ${card.icon}`} style={{
                        fontSize: "20px",
                        color: card.color
                      }}></i>
                    </div>
                  </div>
                  <p className="mb-0 small text-muted">{card.description}</p>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 2. Urgent Actions & Financial Metrics */}
        <div style={styles.sectionTitle}>
          <i className="fa-solid fa-hand-point-up" style={{ color: WARNING_COLOR }}></i>
          Urgent Actions Required
        </div>
        <Row className="mb-4 g-3">
          {alertCards.map((item, idx) => (
            <Col xl={3} md={6} sm={12} key={idx}>
              <InteractiveCard style={{ borderLeft: `6px solid ${item.color}` }}>
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center mb-2">
                    <div className="me-3" style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: '10px',
                      background: item.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      color: item.color,
                      flexShrink: 0
                    }}>
                      <i className={`fa-solid ${item.icon}`}></i>
                    </div>
                    <div>
                      <h4 className="mb-0 fw-bolder" style={{
                        color: item.color,
                        fontSize: "18px"
                      }}>
                        {item.isCurrency ? formatCurrency(item.count) : formatNumber(item.count)}
                      </h4>
                      <small className="text-muted fw-semibold" style={{ fontSize: '12px' }}>
                        {item.label}
                      </small>
                    </div>
                  </div>
                  <p className="mb-0 small text-muted">{item.description}</p>
                </Card.Body>
              </InteractiveCard>
            </Col>
          ))}
        </Row>

        {/* 3. Detailed Usage & Analytics */}
        <div style={styles.sectionTitle}>
          <i className="fa-solid fa-chart-area" style={{ color: INFO_COLOR }}></i>
          Key Usage & Trends
        </div>
        <Row className="mb-4 g-3">
          {/* Chart 1: Library Card Usage */}
          <Col lg={6}>
            <Card style={styles.card}>
              <Card.Header style={styles.cardHeader}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1 fw-bold text-dark">Top Borrower Card Usage</h6>
                    <small className="text-muted">
                      Utilization of borrowing limit (Top 10 users)
                    </small>
                  </div>
                  <Badge className="px-2 py-1 text-white" style={{
                    borderRadius: '30px',
                    fontSize: '10px',
                    fontWeight: 600,
                    background: PRIMARY_COLOR
                  }}>
                    LIMIT: {cardLimitSetting} BOOKS
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body style={styles.cardBody}>
                {cardDetails.length > 0 ? (
                  <Chart
                    options={libraryCardBarOptions}
                    series={libraryCardBarSeries}
                    type="bar"
                    height={320}
                  />
                ) : (
                  <div className="text-center py-4">
                    <i className="fa-solid fa-users-slash fa-2x text-muted mb-3"></i>
                    <p className="text-muted">No active card data available</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Chart 2: Top Available Books */}
          <Col lg={6}>
            <Card style={styles.card}>
              <Card.Header style={styles.cardHeader}>
                <div>
                  <h6 className="fw-bold m-0 text-dark">Top Available Titles</h6>
                  <small className="text-muted">Books with highest available stock</small>
                </div>
              </Card.Header>
              <Card.Body className="p-3">
                {topAvailableBooks.length > 0 ? (
                  <Chart
                    options={availableBooksOptions}
                    series={availableBooksSeries}
                    type="bar"
                    height={300}
                  />
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center py-4 text-muted">
                    <i className="fa-solid fa-book-open-reader fa-2x mb-2"></i>
                    <small>No detailed inventory data available</small>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* 4. Secondary Analytics */}
        <div style={styles.sectionTitle}>
          <i className="fa-solid fa-layer-group" style={{ color: PRIMARY_COLOR }}></i>
          Deep Dive Analytics
        </div>
        <Row className="g-3">
          {/* Top Categories */}
          <Col lg={4} md={12}>
            <Card style={styles.card}>
              <Card.Header style={styles.cardHeader}>
                <h6 className="fw-bold m-0 text-dark">Top 5 Categories by Stock</h6>
                <small className="text-muted">Most populated categories</small>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="list-group list-group-flush">
                  {categories.length > 0 ? categories.map((cat, idx) => (
                    <div key={idx} className="list-group-item d-flex align-items-center justify-content-between px-3 py-2 border-light">
                      <div className="d-flex align-items-center">
                        <div className="me-3 rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: 36,
                            height: 36,
                            background: '#e0e7ff',
                            color: PRIMARY_COLOR
                          }}>
                          <i className={`fa-solid ${cat.icon}`}></i>
                        </div>
                        <span className="fw-semibold text-dark" style={{ fontSize: '14px' }}>
                          {cat.name.length > 20 ? cat.name.substring(0, 20) + "..." : cat.name}
                        </span>
                      </div>
                      <Badge style={{
                        background: PRIMARY_COLOR,
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '12px'
                      }} className="rounded-pill px-2 py-1">
                        {formatNumber(cat.count)}
                      </Badge>
                    </div>
                  )) : (
                    <div className="text-center py-4 text-muted">
                      <i className="fa-solid fa-tags fa-lg mb-2"></i>
                      <p className="mb-0">No category data available</p>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Monthly Activity */}
          <Col lg={4} md={6}>
            <Card style={{
              ...styles.card,
              background: `linear-gradient(145deg, ${PRIMARY_COLOR}, ${ACCENT_COLOR})`,
              color: 'white',
              border: 'none'
            }}>
              <Card.Body className="d-flex flex-column justify-content-center p-3">
                <div className="mb-2 text-center">
                  <i className="fa-solid fa-calendar-days" style={{ fontSize: '32px', opacity: 0.8 }}></i>
                </div>
                <h6 className="text-uppercase opacity-75 mb-2 text-center" style={{ fontSize: '11px' }}>
                  New Items This Month
                </h6>
                <h2 className="fw-bolder mb-3 text-center" style={{ fontSize: '28px' }}>
                  {formatNumber(metrics.booksThisMonth)}
                </h2>
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  padding: '8px',
                  marginBottom: '10px'
                }}>
                  <Chart
                    options={{
                      ...donutOptions(['#fff', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.3)'], null),
                      legend: { show: false },
                      stroke: { show: false },
                      chart: { height: 140 },
                      plotOptions: {
                        pie: {
                          donut: {
                            labels: {
                              total: { show: false },
                              value: { show: false }
                            }
                          }
                        }
                      },
                    }}
                    series={[100]}
                    type="donut"
                    height={140}
                  />
                </div>
                <p className="mt-2 mb-0 small opacity-75 text-center" style={{ fontSize: '12px' }}>
                  Books and copies added in the last 30 days
                </p>
              </Card.Body>
            </Card>
          </Col>

          {/* Inventory Status Donut */}
          <Col lg={4}>
            <Card style={styles.card}>
              <Card.Body className="text-center p-3">
                <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '14px' }}>
                  Overall Inventory Status
                </h6>
                <Chart
                  options={donutOptions([SUCCESS_COLOR, PRIMARY_COLOR], "Overall_Availability_Report")}
                  series={donutChartSeries}
                  type="donut"
                  height={200}
                />
                <div className="mt-3">
                  <div className="d-flex justify-content-center align-items-center mb-2">
                    <div className="me-2" style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: SUCCESS_COLOR
                    }}></div>
                    <span className="text-muted small me-3">Available: {donutChartSeries[0]}%</span>
                    <div className="me-2" style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: PRIMARY_COLOR
                    }}></div>
                    <span className="text-muted small">Issued: {donutChartSeries[1]}%</span>
                  </div>
                  <h4 className="fw-bolder mt-2" style={{
                    color: WARNING_COLOR,
                    fontSize: '20px'
                  }}>
                    {donutChartSeries[1]}%
                  </h4>
                  <small className="text-muted">of total copies currently issued</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Debug Section - Can be removed in production */}
        <div className="mt-4" style={{ display: 'none' }}>
          <Card style={styles.card}>
            <Card.Header>
              <h6 className="mb-0">Debug Information</h6>
            </Card.Header>
            <Card.Body>
              <pre style={{ fontSize: '12px' }}>
                {JSON.stringify({
                  metrics,
                  cardDetailsCount: cardDetails.length,
                  categoriesCount: categories.length,
                  topAvailableBooksCount: topAvailableBooks.length
                }, null, 2)}
              </pre>
            </Card.Body>
          </Card>
        </div>
      </Container>
    </div>
  );
};

export default Dashboard;