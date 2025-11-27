import React, { useState, useEffect } from "react";
import { Card, Col, Container, Row, Badge } from "react-bootstrap";
import Chart from "react-apexcharts";
import ScrollToTop from "./common/ScrollToTop";
import DataApi from "../api/dataApi";
import Loader from "./common/Loader";
import { useNavigate } from "react-router-dom";
import jwt_decode from "jwt-decode";
import DashboardApi from "../api/dashboardApi";
import { BarChart } from '@mui/x-charts/BarChart';

// --- ULTIMATE ENHANCED MODERN STYLES & COLOR PALETTE ---
const PRIMARY_COLOR = "#4338ca"; // Deep Indigo-800 for strong primary action
const ACCENT_COLOR = "#6366f1"; // Lighter Indigo-500
const SUCCESS_COLOR = "#059669"; // Deeper Green for success
const WARNING_COLOR = "#f59e0b"; // Amber for warnings
const DANGER_COLOR = "#dc2626"; // Stronger Red for immediate attention
const INFO_COLOR = "#8b5cf6"; // Purple for secondary/info

const styles = {
  // Ultra Modern Card Style with Hover Effect
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: "20px", // More rounded corners
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.08)", // Softer, deeper shadow
    background: "#fff",
    height: "100%",
    transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)", // Smooth animation curve
    overflow: "hidden",
  },
  interactiveCard: {
    // Style for cards that should respond to user interaction (e.g., Alerts)
    cursor: "pointer",
  },
  cardHeader: {
    background: "transparent",
    borderBottom: "1px solid #f1f5f9",
    padding: "24px 30px",
    borderRadius: "20px 20px 0 0"
  },
  cardBody: {
    padding: "30px"
  },
  sectionTitle: {
    fontSize: "22px", // Larger title
    fontWeight: "800",
    color: "#0f172a", // Very dark text for headings
    marginBottom: "25px",
    marginTop: "30px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    paddingLeft: "5px"
  }
};

// CSS-in-JS for a hover effect on alert cards
const AlertCardHoverStyle = (baseStyle) => ({
  ...baseStyle,
  "&:hover": {
    transform: "translateY(-5px) scale(1.01)", // Slight lift and scale
    boxShadow: "0 25px 60px rgba(0, 0, 0, 0.15)",
  }
});

// Helper component to apply the hover effect
const InteractiveCard = ({ children, style, ...props }) => {
  const [hover, setHover] = useState(false);
  return (
    <Card
      {...props}
      style={{
        ...styles.card,
        ...styles.interactiveCard,
        ...style,
        ...(hover ? AlertCardHoverStyle(style)["&:hover"] : {}),
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </Card>
  );
};


const Dashboard = ({ userInfo: propUserInfo }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Stats
  const [dueSoonCount, setDueSoonCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [fineCollectedThisMonth, setFineCollectedThisMonth] = useState(0);
  const [damagedCount, setDamagedCount] = useState(0);
  const [totalBooks, setTotalBooks] = useState(0);

  // Card Details
  const [cardDetails, setCardDetails] = useState([]);
  const [cardLimitSetting, setCardLimitSetting] = useState(6);

  useEffect(() => {
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
    fetchSubmissionAndIssueMetrics();
    fetchLibraryCounts();
  }, [propUserInfo]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const libraryApi = new DataApi("library");
      const response = await libraryApi.get("/dashboard");
      if (response.data && response.data.success) {
        setDashboardData(response.data.data);
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

  const fetchSubmissionAndIssueMetrics = async () => {
    try {
      const resp = await DashboardApi.fetchAll();
      const respStats = await DashboardApi.fetchStats();
      setTotalBooks(respStats?.data);
      const data = resp?.data || [];

      if (!Array.isArray(data) || data.length === 0) return;

      const metrics = data[0];
      setDueSoonCount(metrics.total_due_soon || 0);
      setOverdueCount(metrics.overdue_books || 0);
      setFineCollectedThisMonth(metrics.fine_collected_this_month || 0);
      setDamagedCount(metrics.damaged_missing_books || 0);

    } catch (err) {
      console.error("Error fetching submission metrics:", err);
    }
  };

  const fetchLibraryCounts = async () => {
    try {
      const bookApi = new DataApi("book");
      const issueApi = new DataApi("bookissue");
      const settingsApi = new DataApi("librarysettings");

      const booksResp = await bookApi.fetchAll();
      const books = Array.isArray(booksResp?.data) ? booksResp.data : (booksResp?.data?.rows || booksResp || []);
      let totalCopies = 0;
      let availableCopies = 0;
      if (Array.isArray(books)) {
        books.forEach((b) => {
          const t = Number(b.total_copies ?? b.totalCopies ?? 0) || 0;
          const a = Number(b.available_copies ?? b.availableCopies ?? t) || t;
          totalCopies += t;
          availableCopies += a;
        });
      }

      const issuesResp = await issueApi.get("/active");
      const activeIssues = Array.isArray(issuesResp?.data) ? issuesResp.data : (issuesResp?.data?.rows || issuesResp || []);
      const issuedCount = Array.isArray(activeIssues) ? activeIssues.length : 0;

      let cardLimit = 6;
      try {
        const settingsResp = await settingsApi.get("/all");
        const settingsData = settingsResp?.data?.data || settingsResp?.data || settingsResp;
        if (settingsData) {
          cardLimit = Number(settingsData.max_books_per_card ?? settingsData.max_books ?? settingsData.max_books_per_card?.setting_value) || cardLimit;
        }
      } catch (err) { }

      setTotalBooks(prev => ({ ...prev, total_books: totalCopies, available_books: availableCopies, issued_books: issuedCount, card_limit: cardLimit }));
      setCardLimitSetting(cardLimit);
      fetchLibraryCardDetails(cardLimit);

    } catch (error) {
      console.error("Error fetching library counts:", error);
    }
  };

  const fetchLibraryCardDetails = async (currentLimit) => {
    try {
      const cardApi = new DataApi("librarycard");
      const issueApi = new DataApi("bookissue");

      const cardsResp = await cardApi.fetchAll();
      const cards = Array.isArray(cardsResp?.data) ? cardsResp.data : (cardsResp?.data?.rows || cardsResp || []);

      const issuesResp = await issueApi.get("/active");
      const activeIssues = Array.isArray(issuesResp?.data) ? issuesResp.data : (issuesResp?.data?.rows || issuesResp || []);

      const countsByCard = {};
      (Array.isArray(activeIssues) ? activeIssues : []).forEach((issue) => {
        const cid = issue.card_id || issue.cardId || issue.cardid || null;
        if (cid) {
          countsByCard[cid] = (countsByCard[cid] || 0) + 1;
        }
      });

      const details = (Array.isArray(cards) ? cards : []).map((c) => {
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
      setCardDetails(details.slice(0, 10)); // Top 10
    } catch (error) {
      console.error("Error fetching library card details:", error);
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatCurrency = (val) => {
    const n = Number(val);
    if (!isFinite(n)) return `₹0.00`;
    return `₹${formatNumber(n.toFixed(2))}`;
  };

  // --- HELPER: Common Chart Toolbar Configuration ---
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

  // --- CHART 1: Library Card Stacked Bar ---
  const libraryCardBarOptions = {
    chart: {
      type: 'bar',
      height: 350,
      stacked: true,
      fontFamily: 'inherit',
      ...getChartConfig("Library_Card_Usage_Report").toolbar ? { toolbar: getChartConfig("Library_Card_Usage_Report").toolbar } : {}
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6, // Slightly larger radius
        barHeight: '65%', // Thicker bars
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
      categories: cardDetails.map(c => c.user_name),
      max: cardLimitSetting,
      labels: { style: { colors: '#94a3b8', fontSize: '12px' } }
    },
    yaxis: {
      labels: { style: { colors: "#334155", fontWeight: 700, fontSize: '14px' }, maxWidth: 180 }
    },
    fill: { opacity: 1 },
    colors: [PRIMARY_COLOR, '#e2e8f0'],
    legend: { position: 'top', horizontalAlign: 'right', fontSize: '14px' },
    tooltip: { theme: 'light', y: { formatter: (val) => `${val} Books` } }
  };

  const libraryCardBarSeries = [
    { name: 'Issued Books', data: cardDetails.map(c => c.issued) },
    { name: 'Available Space', data: cardDetails.map(c => c.remaining) }
  ];


  // --- CHART 2 & 4: Donut/Pie Configuration ---
  const donutOptions = (colors, filename) => ({
    chart: {
      type: "donut",
      height: 220,
      fontFamily: 'inherit',
      ...(filename ? getChartConfig(filename) : { toolbar: { show: false } })
    },
    colors: colors,
    legend: { position: "bottom", fontSize: '13px', markers: { radius: 12 } },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: "75%",
          labels: {
            show: true,
            total: {
              show: true, // Show total in center
              label: 'Total Copies',
              color: '#334155',
              fontWeight: 600,
              formatter: (w) => formatNumber(totalBooks.total_books || 0)
            }
          }
        }
      }
    },
    stroke: { width: 0 },
    tooltip: { theme: "light" },
  });

  const donutChart1Series = dashboardData ? [dashboardData.summary.availablePercentage || 0, dashboardData.summary.issuedPercentage || 0] : [0, 0];
  const pieSeries = dashboardData && dashboardData.dailyActivity.length > 0 ? dashboardData.dailyActivity.map((item) => parseInt(item.count || 0)) : [1];

  // --- CHART 3: Inventory (Copies per Book) ---
  const rawAvailableBooks = totalBooks?.total_available_copies || [];
  const topAvailableBooks = [...rawAvailableBooks]
    .sort((a, b) => parseInt(b.available_copies || 0) - parseInt(a.available_copies || 0))
    .slice(0, 10);

  const availableBooksOptions = {
    chart: {
      type: 'bar',
      height: 320,
      fontFamily: 'inherit',
      ...getChartConfig("Book_Status_Inventory_Report")
    },
    plotOptions: { bar: { borderRadius: 6, horizontal: true, barHeight: '55%', distributed: true } },
    dataLabels: {
      enabled: true, textAnchor: 'start', style: { colors: ['#fff'] },
      formatter: function (val) { return val + " copies" }, offsetX: 0,
    },
    xaxis: {
      categories: topAvailableBooks.map(b => b.title.length > 20 ? b.title.substring(0, 20) + "..." : b.title),
      labels: { style: { colors: '#64748b' } }
    },
    yaxis: { labels: { style: { colors: '#334155', fontWeight: 600, fontSize: '13px' } } },
    colors: ['#4f46e5', '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#f3e8ff', '#f5f3ff', '#faf5ff'], // Tonal purple-blue palette
    tooltip: { theme: 'light', y: { title: { formatter: () => 'Stock:' } } },
    legend: { show: false },
    grid: { show: false }
  };
  const availableBooksSeries = [{ name: 'Copies Available', data: topAvailableBooks.map(b => parseInt(b.available_copies || 0)) }];


  // --- DATA LISTS (Using Richer Colors) ---
  const summaryCards = dashboardData ? [
    { title: "Total Books", value: formatNumber(totalBooks.total_books), icon: "fa-book", color: PRIMARY_COLOR, bgColor: "#e0e7ff" },
    { title: "Available Books", value: formatNumber(totalBooks.available_books), icon: "fa-book-open", color: SUCCESS_COLOR, bgColor: "#d1fae5" },
    { title: "Issued Books", value: formatNumber(totalBooks.issued_books), icon: "fa-user-pen", color: WARNING_COLOR, bgColor: "#fef3c7" },
    { title: "Total Submissions", value: formatNumber(totalBooks.total_submission), icon: "fa-rotate-left", color: INFO_COLOR, bgColor: "#ede9fe" },
  ] : [];

  const alertCards = [
    { count: dueSoonCount, label: "Due Soon", icon: "fa-clock", bg: "#fff7ed", color: WARNING_COLOR },
    { count: overdueCount, label: "Overdue", icon: "fa-circle-exclamation", bg: "#fef2f2", color: DANGER_COLOR },
    { count: fineCollectedThisMonth, label: "Fine Collected (Mo.)", icon: "fa-indian-rupee-sign", bg: "#ecfdf5", color: SUCCESS_COLOR, isCurrency: true },
    { count: damagedCount, label: "Damaged / Lost", icon: "fa-heart-crack", bg: "#fdf2f8", color: '#db2777' }
  ];

  const categories = dashboardData && dashboardData.booksByCategory.length > 0
    ? dashboardData.booksByCategory.slice(0, 5).map((item) => ({
      name: item.category_name || "Unknown",
      icon: "fa-tag",
      count: parseInt(item.book_count || 0),
    })) : [];

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100 bg-light"><Loader /></div>;

  // --- STUDENT UI (Kept Clean and Minimal) ---
  if (userRole === "STUDENT") {
    return (
      <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "25px" }}>
        <ScrollToTop />
        <Container fluid>
          <Card style={{ ...styles.card, background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${INFO_COLOR} 100%)`, color: "white", marginBottom: "40px", border: 'none' }}>
            <Card.Body className="p-5">
              <h1 className="fw-bolder mb-2">Welcome Back, {userInfo?.firstname}! 👋</h1>
              <p className="mb-0 opacity-75" style={{ fontSize: '18px' }}>Your personalized library dashboard is ready. Check your borrowed books and upcoming deadlines.</p>
            </Card.Body>
          </Card>
          {/* Placeholder for student-specific content like currently issued books list, fines, etc. */}
          <div className="text-center py-5 text-muted">Student-specific data visualization goes here.</div>
        </Container>
      </div>
    );
  }

  // --- ADMIN UI (Highly Attractive) ---
  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", paddingBottom: "50px" }}>
      <ScrollToTop />
      <Container fluid className="px-4 py-4">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-2 mt-2">
          <div>
            <h3 style={{ fontWeight: "900", color: "#1e293b", marginBottom: "4px" }}>📚 Library Management Overview</h3>
            <p style={{ color: "#64748b", margin: 0, fontSize: '14px' }}>Actionable insights and operational metrics for system administrators.</p>
          </div>
        </div>

        {/* 1. Core Library Inventory (Main Stats Row) */}
        <div style={styles.sectionTitle}>
          <i className="fa-solid fa-boxes-stacked" style={{ color: PRIMARY_COLOR }}></i> Inventory & Capacity
        </div>
        <Row className="mb-2 g-2">
          {summaryCards.map((card, index) => (
            <Col lg={3} md={6} sm={12} key={index}>
              <Card style={styles.card}>
                <Card.Body className="p-4 d-flex align-items-center justify-content-between">
                  <div>
                    <p className="mb-1 text-uppercase" style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>{card.title}</p>
                    <h2 className="mb-0" style={{ color: card.color, fontSize: "36px", fontWeight: "800" }}>{card.value}</h2>
                  </div>
                  <div style={{ width: "55px", height: "55px", borderRadius: "14px", backgroundColor: card.bgColor, display: "flex", alignItems: "center", justifyContent: "center", minWidth: "55px" }}>
                    <i className={`fa-solid ${card.icon}`} style={{ fontSize: "24px", color: card.color }}></i>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 2. Immediate Actions & Financial Metrics (Alerts & Financial Row) */}
        <div style={styles.sectionTitle}>
          <i className="fa-solid fa-hand-point-up" style={{ color: WARNING_COLOR }}></i> Urgent Actions & Financial Metrics
        </div>
        <Row className="g-4 mb-5">
          {alertCards.map((item, idx) => (
            <Col xl={3} md={6} sm={12} key={idx}>
              {/* Applying the Interactive Card component here */}
              <InteractiveCard style={{ borderLeft: `6px solid ${item.color}` }}>
                <Card.Body className="p-4 d-flex align-items-center">
                  <div className="me-3" style={{ width: 56, height: 56, borderRadius: '14px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: item.color, minWidth: '56px' }}>
                    <i className={`fa-solid ${item.icon}`}></i>
                  </div>
                  <div>
                    <h4 className="mb-0 fw-bolder" style={{ color: item.color }}>{item.isCurrency ? formatCurrency(item.count) : formatNumber(item.count)}</h4>
                    <small className="text-muted fw-semibold" style={{ fontSize: '13px' }}>{item.label}</small>
                  </div>
                </Card.Body>
              </InteractiveCard>
            </Col>
          ))}
        </Row>

        {/* 3. Detailed Usage & Inventory Analytics (MAIN CHARTS) */}
        <div style={styles.sectionTitle}>
          <i className="fa-solid fa-chart-area" style={{ color: INFO_COLOR }}></i> Key Usage & Trends
        </div>
        <Row className="mb-5 g-4">
          {/* CHART 1: Library Card Usage - Kept large for clarity */}
          <Col lg={6}>
            <Card style={styles.card}>
              <Card.Header style={styles.cardHeader}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1 fw-bold text-dark">Top Borrower Card Usage</h5>
                    <small className="text-muted">Max utilization of the borrowing limit (Top 10 users)</small>
                  </div>
                  <Badge className="px-3 py-2 text-white" style={{ borderRadius: '30px', fontSize: '13px', fontWeight: 700, background: PRIMARY_COLOR }}>
                    LIMIT: {cardLimitSetting} BOOKS
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body style={styles.cardBody}>
                {cardDetails.length > 0 ? (
                  <Chart options={libraryCardBarOptions} series={libraryCardBarSeries} type="bar" height={360} />
                ) : (
                  <div className="text-center py-5 text-muted">No active data available</div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* CHART 5: Inventory Status (Top Available Books) */}
          <Col lg={6} md={8}>
            <Card style={styles.card}>
              <Card.Header style={styles.cardHeader}>
                <h6 className="fw-bold m-0 text-dark">Top Available Titles</h6>
                <small className="text-muted">Books with the highest stock remaining</small>
              </Card.Header>
              <Card.Body className="p-3">
                {topAvailableBooks.length > 0 ? (
                  <Chart options={availableBooksOptions} series={availableBooksSeries} type="bar" height={320} />
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                    <i className="fa-solid fa-book-open-reader mb-2" style={{ fontSize: '24px' }}></i>
                    <small>No detailed inventory data</small>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

        </Row>

        {/* 4. Secondary Analytics */}
        <div style={styles.sectionTitle}>
          <i className="fa-solid fa-layer-group" style={{ color: PRIMARY_COLOR }}></i> Deep Dive Data
        </div>
        <Row className="g-4">

          {/* Top Categories List */}
          <Col lg={4} md={12}>
            <Card style={styles.card}>
              <Card.Header style={styles.cardHeader}>
                <h6 className="fw-bold m-0 text-dark">Top 5 Categories by Stock</h6>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="list-group list-group-flush">
                  {categories.map((cat, idx) => (
                    <div key={idx} className="list-group-item d-flex align-items-center justify-content-between px-4 py-3 border-light">
                      <div className="d-flex align-items-center">
                        <div className="me-3" style={{ width: 40, height: 40, background: '#e0e7ff', color: PRIMARY_COLOR }} className="rounded-circle d-flex align-items-center justify-content-center">
                          <i className={`fa-solid ${cat.icon}`}></i>
                        </div>
                        <span className="fw-semibold text-dark">{cat.name}</span>
                      </div>
                      <Badge style={{ background: PRIMARY_COLOR, color: 'white', fontWeight: 700 }} className="rounded-pill px-3 py-2">{cat.count}</Badge>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Books This Month Panel (Visual interest) */}
          <Col lg={4} md={6}>
            <Card style={{ ...styles.card, background: `linear-gradient(145deg, ${PRIMARY_COLOR}, ${ACCENT_COLOR})`, color: 'white', border: 'none' }}>
              <Card.Body className="d-flex flex-column justify-content-center text-center p-4">
                <div className="mb-3"><i className="fa-solid fa-calendar-days" style={{ fontSize: '40px', opacity: 0.8 }}></i></div>
                <h6 className="text-uppercase letter-spacing-2 opacity-75 mb-2" style={{ fontSize: '12px' }}>New Items Added</h6>
                <h1 className="display-3 fw-bolder mb-4">{dashboardData ? formatNumber(dashboardData.summary.booksThisMonth) : "0"}</h1>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '16px', padding: '10px' }}>
                  <Chart
                    options={{
                      ...donutOptions(['#fff', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.3)'], null),
                      legend: { show: false },
                      stroke: { show: false },
                      chart: { height: 180 },
                      plotOptions: { pie: { donut: { labels: { total: { show: false } } } } }, // Hide total label for this specific chart
                    }}
                    series={pieSeries} type="pie" height={180}
                  />
                </div>
                <p className="mt-3 mb-0 small opacity-75">Total books and copies processed/created in the last 30 days.</p>
              </Card.Body>
            </Card>
          </Col>


          {/* CHART 2: Availability Status Donut - Moved here for better visual flow */}
          <Col lg={4}>
            <Card style={styles.card}>
              <Card.Body className="text-center p-4">
                <h6 className="fw-bold text-dark mb-4" style={{ fontSize: '16px' }}>Overall Inventory Status</h6>
                <Chart
                  options={donutOptions([SUCCESS_COLOR, PRIMARY_COLOR], "Overall_Availability_Report")}
                  series={donutChart1Series}
                  type="donut"
                  height={250}
                />
                <div className="mt-3">
                  <h3 className="fw-bolder" style={{ color: WARNING_COLOR, fontSize: '24px' }}>{dashboardData ? `${dashboardData.summary.issuedPercentage}%` : "0%"}</h3>
                  <small className="text-muted">of total inventory currently issued</small>
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