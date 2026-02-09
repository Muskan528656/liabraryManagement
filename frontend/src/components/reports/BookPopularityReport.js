
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Form,
  Row,
  Col,
  Badge,
  Alert,
  Spinner,
  Container,
  Dropdown,
} from "react-bootstrap";
import ResizableTable from "../common/ResizableTable";
import {
  BarChart,
  Download,
  Filter,
  Calendar3,
  Book,
  GraphUp,
  Clock,
  Award,
  PieChart,
  Grid3x3Gap,
  ListUl,
  FileEarmarkBarGraph,
  ArrowClockwise,
  ThreeDotsVertical,
  FileEarmarkExcel,
  FileEarmarkPdf,
  FiletypeCsv,
} from "react-bootstrap-icons";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import DataApi from "../../api/dataApi";
import "./BookPopularityReport.css";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const BookPopularityReport = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    days: "30",
    startDate: "",
    endDate: "",
    vendor: "",
    category: "",
    status: "",
    searchTerm: "",
  });
  const [viewMode, setViewMode] = useState("table");
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [vendorFilter, setVendorFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Sample data for filters - in a real app, this would come from API
  const vendors = [
    { vendor: "Vendor A", name: "Vendor A" },
    { vendor: "Vendor B", name: "Vendor B" },
    { vendor: "Vendor C", name: "Vendor C" },
  ];

  const categories = [
    { category: "Fiction", name: "Fiction" },
    { category: "Non-Fiction", name: "Non-Fiction" },
    { category: "Science", name: "Science" },
    { category: "History", name: "History" },
    { category: "Biography", name: "Biography" },
  ];




  const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#495057',
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const inputBaseStyle = {
    height: '44px',
    borderRadius: '8px',
    border: '1.5px solid #dee2e6',
    padding: '0.625rem 1rem',
    fontSize: '0.9375rem',
    transition: 'all 0.2s ease',
    backgroundColor: '#fff',
    width: '100%'
  };

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const api = new DataApi("book");
      const params = new URLSearchParams();

      if (filters.days) {
        params.append("days", filters.days);
      }
      if (filters.startDate && filters.endDate) {
        params.append("startDate", filters.startDate);
        params.append("endDate", filters.endDate);
      }

      const response = await api.get(
        `/book-popularity-analytics?${params.toString()}`
      );
      setReportData(response.data);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError("Failed to load report data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      days: "30",
      startDate: "",
      endDate: "",
    });
  };

  const exportToCSV = () => {
    if (!reportData?.mainTable) return;

    const headers = [
      "Book Name",
      "Author",
      "Category",
      "Copies",
      "Total Issues",
      "Unique Borrowers",
      "Avg Issues per Month",
      "Popularity Level",
      "Days Since Last Issue",
    ];

    const csvContent = [
      headers.join(","),
      ...reportData.mainTable.map((row) =>
        [
          `"${row.book_name}"`,
          `"${row.author || "N/A"}"`,
          `"${row.category || "N/A"}"`,
          row.copies || 0,
          row.total_issues || 0,
          row.unique_borrowers || 0,
          row.avg_issues_per_month || 0,
          `"${row.popularity_level}"`,
          row.days_since_last_issue || "N/A",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `book-popularity-report-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      // Call your backend API to generate Excel file
      const api = new DataApi("book");
      const response = await api.post("/export-excel", {
        data: reportData.mainTable,
        charts: {
          popularBooks: reportData.popularBooks,
          categoryPopularity: reportData.categoryPopularity,
        },
      });

      // Download the file
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `book-popularity-report-${new Date().toISOString().split("T")[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export to Excel. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    console.log("owedfhdjskaldjv")
    setExporting(true);
    try {
      // Call your backend API to generate PDF file
      const api = new DataApi("book");
      const response = await api.post("/export-pdf", {
        data: reportData,
        filters: filters,
      });

      // Download the file
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `book-popularity-report-${new Date().toISOString().split("T")[0]}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("Failed to export to PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const getPopularityBadgeVariant = (level) => {
    switch (level?.toLowerCase()) {
      case "high":
        return "success";
      case "medium":
        return "warning";
      case "low":
        return "secondary";
      default:
        return "light";
    }
  };

  // Define columns for ResizableTable
  const columns = [
    {
      field: "book_name",
      label: "Book Title",
      width: "200px",
      align: "center",
      // style: { textAlign: "center" },
      render: (value, record) => (
        <div className="book-title-cell">
          <div className="book-name">{value}</div>
          {record.isbn && <div className="book-isbn">ISBN: {record.isbn}</div>}
        </div>
      ),
    },


    {
      field: "author",
      label: "Author",
      width: "150px",
      align: "center",
      render: (value) => value || "N/A",
    },
    // {
    //   field: "publisher",
    //   label: "Publisher",
    //   width: "150px",
    //   render: (value) => value || "N/A",
    // },
    {
      field: "category",
      label: "Category",
      width: "120px",
      align: "center",
      render: (value) => value || "N/A",
    },
    // {
    //   field: "vendor",
    //   label: "Vendor",
    //   width: "120px",
    //   render: () => "N/A",
    // },
    // {
    //   field: "copies",
    //   label: "Total",
    //   width: "80px",
    //   render: (value) => value || 0,
    // },
    {
      field: "available",
      label: "Available",
      width: "100px",
      align: "center",
      render: (value, record) => (record.copies || 0) - (record.total_issues || 0),
    },
    {
      field: "total_issues",
      label: "Issued",
      width: "80px",
      align: "center",
      render: (value) => value || 0,
    },
    {
      field: "unique_borrowers",
      label: "Unique Borrowers",
      width: "120px",
      align: "center",
      render: (value) => value || 0,
    },
    // {
    //   field: "popularity_level",
    //   label: "Status",
    //   width: "100px",
    //   render: (value) => value || "N/A",
    // },
  ];

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle selection change
  const handleSelectionChange = (selected) => {
    setSelectedItems(selected);
  };

  // Chart configurations
  const barChartData = {
    labels: reportData?.popularBooks?.slice(0, 10).map((book) => book.book_name) || [],
    datasets: [
      {
        label: "Total Issues",
        data: reportData?.popularBooks?.slice(0, 10).map((book) => book.total_issues) || [],
        backgroundColor: "rgba(13, 110, 253, 0.8)",
        borderColor: "rgba(13, 110, 253, 1)",
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Top 10 Most Popular Books",
        font: {
          size: 16,
          weight: "600",
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Issues: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
      x: {
        ticks: {
          callback: function (value, index) {
            const label = this.getLabelForValue(value);
            return label.length > 20 ? label.substr(0, 20) + "..." : label;
          },
        },
      },
    },
  };

  const pieChartData = {
    labels: reportData?.categoryPopularity?.map((cat) => cat.category_name) || [],
    datasets: [
      {
        data: reportData?.categoryPopularity?.map((cat) => cat.total_issues) || [],
        backgroundColor: [
          "rgba(13, 110, 253, 0.8)",
          "rgba(25, 135, 84, 0.8)",
          "rgba(255, 193, 7, 0.8)",
          "rgba(220, 53, 69, 0.8)",
          "rgba(13, 202, 240, 0.8)",
          "rgba(108, 117, 125, 0.8)",
          "rgba(111, 66, 193, 0.8)",
          "rgba(253, 126, 20, 0.8)",
        ],
        borderColor: [
          "rgba(13, 110, 253, 1)",
          "rgba(25, 135, 84, 1)",
          "rgba(255, 193, 7, 1)",
          "rgba(220, 53, 69, 1)",
          "rgba(13, 202, 240, 1)",
          "rgba(108, 117, 125, 1)",
          "rgba(111, 66, 193, 1)",
          "rgba(253, 126, 20, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: "Category-wise Book Issues",
        font: {
          size: 16,
          weight: "600",
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="library-loading">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading report data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Report</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={fetchReportData}>
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="container-fluid bg-light">
      <div className="card  ">
        {/* Header */}
        <div className="library-header border shadow-sm  mt-4 mb-2 rounded mx-2"
        >

          <Col md={6} className="d-flex align-items-center gap-3 ms-3">

            {/* Back Button */}
            <button
              onClick={() => navigate('/reports')}
              className="shadow-sm d-flex align-items-center justify-content-center custom-btn-back"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </button>


            <div>
              <h4 className="mb-0 fw-bold fs-7" style={{ color: "var(--primary-color)" }}>
                Book Borrowing Popularity Analytics
              </h4>

            </div>

          </Col>
          <div className="library-header-right">
            <Dropdown align="end">
              <Dropdown.Toggle variant="light" size="sm" id="options-dropdown">
                <i className="fa fa-bars me-1" />  Options
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow-sm border-0 mt-2">
                <Dropdown.Header className="small text-uppercase fw-bold text-muted">View Mode</Dropdown.Header>
                <Dropdown.Item
                  className="text-dark"
                  active={viewMode === 'table'}
                  onClick={() => setViewMode('table')}
                >
                  <i className="fa fa-table me-2 color-black" /> Table
                </Dropdown.Item>
                <Dropdown.Item
                  className="text-dark"
                  active={viewMode === 'dashboard'}
                  onClick={() => setViewMode('dashboard')}
                >
                  <i className="fa fa-chart-pie me-2" /> Dashboard
                </Dropdown.Item>
                <Dropdown.Item
                  className="text-dark"
                  active={viewMode === 'analytics'}
                  onClick={() => setViewMode('analytics')}
                >
                  <i className="fa fa-chart-bar me-2" /> Analytics
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Header className="small text-uppercase fw-bold text-muted">Export Options</Dropdown.Header>
                <Dropdown.Item onClick={exportToExcel}>
                  <i className="fa-solid fa-file-excel me-2 text-success" /> Excel
                </Dropdown.Item>
                <Dropdown.Item onClick={exportToCSV}>
                  <i className="fa-solid fa-file-csv me-2 text-info" /> CSV
                </Dropdown.Item>
                <Dropdown.Item onClick={exportToPDF}><i className="fa-solid fa-file-pdf me-2 text-danger" /> PDF</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
        {/* 
        <Dropdown align="end">
          <Dropdown.Toggle variant="outline-secondary" size="sm">
            <i className="fa fa-bars me-1" /> Options
          </Dropdown.Toggle>
          <Dropdown.Menu className="shadow-sm border-0">
            <Dropdown.Header>View Mode</Dropdown.Header>
            <Dropdown.Item onClick={() => setViewMode('table')} active={viewMode === 'table'}>Table</Dropdown.Item>
            <Dropdown.Item onClick={() => setViewMode('dashboard')} active={viewMode === 'dashboard'}>Dashboard</Dropdown.Item>
            <Dropdown.Item onClick={() => setViewMode('analytics')} active={viewMode === 'analytics'}>Detailed Analytics</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Header>Export</Dropdown.Header>
            <Dropdown.Item onClick={exportToCSV}><i className="fa-solid fa-file-csv me-2 text-info" /> CSV</Dropdown.Item>
            <Dropdown.Item onClick={exportToExcel}><i className="fa-solid fa-file-excel me-2 text-success" /> Excel</Dropdown.Item>
            <Dropdown.Item onClick={exportToPDF}><i className="fa-solid fa-file-pdf me-2 text-danger" /> PDF</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown> */}
      </div>


      {/* Statistics Cards */}
      <div >
        {/* <div className="library-stat-card blue">
          <div className="stat-icon">
            <Book />
          </div>
          <div className="stat-content">
            <div className="stat-label">TOTAL COPIES</div>
            <div className="stat-value">
              {reportData?.mainTable?.reduce(
                (sum, book) => sum + (book.copies || 0),
                0
              ) || 0}
            </div>
            <div className="stat-meta">
              {reportData?.mainTable?.length || 0} unique titles
            </div>
          </div>
        </div> */}
        {/* <Card className="border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #007bff' }}>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted text-uppercase">Total Copies</small>
                <h3 className="mb-0 fw-bold text-primary">{reportData?.mainTable?.reduce(
          (sum, book) => sum + (book.copies || 0),
          0
        ) || 0}</h3>
              </div>
              <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                <i className="fa fa-book text-primary" style={{ fontSize: '24px' }} />
              </div>
            </div>
            <small className="text-muted">{reportData?.mainTable?.length || 0} unique titles</small>
          </Card.Body>
        </Card>
       <Card className="border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #007bff' }}>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted text-uppercase">Issued</small>
                <h3 className="mb-0 fw-bold text-success">{reportData?.keyMetrics?.currentMonthIssues || 0}</h3>
              </div>
              <div className="bg-primary bg-opacity-10 rounded-circle p-3 ">
                <i className="fa fa-line-chart text-danger" style={{ fontSize: '24px' }} />
              
              </div>
            </div>
            <small className="text-muted">Current month issues</small>
          </Card.Body>
        </Card>
       <Card className="border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #007bff' }}>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted text-uppercase">Most popular</small>
                <h5 className="mb-0 mt-1 text-muted " style={{fontSize:'14px'}}>{reportData?.keyMetrics?.mostPopularBook?.book_name}</h5>
              </div>
              <div className="bg-primary bg-opacity-10 rounded-circle p-3 ">
                <i className="fa fa-award text-danger" style={{ fontSize: '24px' }} />
               
              </div>
            </div>
            <small className="text-muted">{reportData?.keyMetrics?.mostPopularBook?.total_issues || 0}{" "}
              issues</small>
          </Card.Body>
        </Card>
       <Card className="border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #007bff' }}>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted text-uppercase">Never Issued</small>
                <h5 className="mb-0 fw-bold text-danger ">{reportData?.keyMetrics?.neverIssuedBooks || 0}</h5>
              </div>
              <div className="bg-primary bg-opacity-10 rounded-circle p-3 ">
                <i className="fa fa-clock text-primary" style={{ fontSize: '24px' }} />
            
              </div>
            </div>
            <small className="text-muted">Books not borrowed</small>
          </Card.Body>
        </Card> */}

        {/* <div className="library-stat-card green">
          <div className="stat-icon">
            <GraphUp />
          </div>
          <div className="stat-content">
            <div className="stat-label">ISSUED</div>
            <div className="stat-value">
              {reportData?.keyMetrics?.currentMonthIssues || 0}
            </div>
            <div className="stat-meta">Current month issues</div>
          </div>
        </div> */}

        {/* <div className="library-stat-card yellow">
          <div className="stat-icon">
            <Award />
          </div>
          <div className="stat-content">
            <div className="stat-label">MOST POPULAR</div>
            <div
              className="stat-value text-truncate"
              style={{ fontSize: "14px", fontWeight: 600 }}
              title={reportData?.keyMetrics?.mostPopularBook?.book_name}
            >
              {reportData?.keyMetrics?.mostPopularBook?.book_name || "N/A"}
            </div>
            <div className="stat-meta">
              {reportData?.keyMetrics?.mostPopularBook?.total_issues || 0}{" "}
              issues
            </div>
          </div>
        </div> */}

        {/* <div className="library-stat-card red">
          <div className="stat-icon">
            <Clock />
          </div>
          <div className="stat-content">
            <div className="stat-label">NEVER ISSUED</div>
            <div className="stat-value">
              {reportData?.keyMetrics?.neverIssuedBooks || 0}
            </div>
            <div className="stat-meta">Books not borrowed</div>
          </div>
        </div> */}
      </div>

      {/* Filters */}


      <div className=" px-3 mx-1"
      // style={{
      //   color: "var(--primary-color)",
      //   background: "var(--primary-background-color)",
      //   borderRadius: "10px",
      // }}
      >


        <Card.Body>
          <Row className="g-3 align-items-end b">

            <Col xs={12} md={2}>
              <div style={labelStyle}>
                <i className="fa-solid fa-calendar-days"></i>
                <span>Time Period</span>
              </div>
              <Form.Select
                className="filter-input"
                style={inputBaseStyle}
                value={filters.days}
                onChange={(e) => handleFilterChange("days", e.target.value)}
              >
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="180">Last 6 Months</option>
                <option value="365">Last Year</option>
              </Form.Select>
            </Col>
            <Col xs={12} md={2}>
              <div style={labelStyle}>
                <i className="fa-solid fa-magnifying-glass"></i>
                <span>Search</span>
              </div>
              <Form.Control
                type="text"
                className="filter-input"
                style={inputBaseStyle}
                placeholder="Search by book, author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>


            <Col xs={12} md={2}>
              <div style={labelStyle}>
                <i className="fa-solid fa-filter"></i>
                <span>Category</span>
              </div>
              <Form.Select
                className="small text-muted"
                style={{
                  ...inputBaseStyle,
                  color: categoryFilter ? '#212529' : '#6c757d',
                  cursor: 'pointer',
                  paddingRight: '2.5rem',
                  appearance: 'none',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '16px 12px'
                }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((opt, i) => (
                  <option className="color-dark" key={i} value={opt.category}>{opt.name}</option>
                ))}
              </Form.Select>
            </Col>

            {/* <Col xs={12} md={2}>
                           <div style={labelStyle}>
                              <i className="fa-solid fa-filter"></i>
                              <span>Status</span>
                            </div>
                            <Form.Select
                              className="small text-muted"
                              style={{
                                ...inputBaseStyle,
                                color: statusFilter ? '#212529' : '#6c757d',
                                cursor: 'pointer',
                                paddingRight: '2.5rem',
                                appearance: 'none',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 0.75rem center',
                                backgroundSize: '16px 12px'
                              }}
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Status</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </Form.Select>

                          </Col> */}

            <Button
              variant="light"
              onClick={resetFilters}
              tooltip="Clear all filters"
              className="filter-clear-btn d-flex align-items-center justify-content-center"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                border: '1.5px solid #dee2e6',
                padding: 0,
                backgroundColor: '#fff',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
            >
              {/* <i className="fa-solid fa-xmark" style={{ fontSize: '1.25rem', color: '#6c757d' }}></i> */}
              <i className="fa-solid fa-undo" style={{ fontSize: '1.25rem', color: '#6c757d' }}> </i>
            </Button>

          </Row>
        </Card.Body>

      </div>

      {/* Main Content - Table View */}
      {viewMode === "table" && (
        <div className="library-content mx-2">
          {/* <div className="library-table-header">
              <span className="record-count">
                Showing 1 to {Math.min(10, reportData?.mainTable?.length || 0)} of{" "}
                {reportData?.mainTable?.length || 0} records
              </span>
            </div> */}

          <div className="">
            <ResizableTable
              data={reportData?.mainTable || []}
              columns={columns}
              loading={loading}
              currentPage={currentPage}
              recordsPerPage={10}
              onPageChange={handlePageChange}
              showSerialNumber={true}
              showCheckbox={true}
              showActions={false}
              selectedItems={selectedItems}
              onSelectionChange={handleSelectionChange}
              emptyMessage="No book popularity data available"
            />
          </div>


        </div>
      )}

      {/* Dashboard View with Charts */}
      {viewMode === "dashboard" && (
        <div className="charts-container">
          <Row>
            <Col lg={6}>
              <Card className="chart-card">
                <Card.Body>
                  <div className="chart-wrapper">
                    <Bar data={barChartData} options={barChartOptions} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6}>
              <Card className="chart-card">
                <Card.Body>
                  <div className="chart-wrapper">
                    <Pie data={pieChartData} options={pieChartOptions} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Top Books List */}
          <Row className="mt-4">
            <Col lg={12}>
              <Card className="library-analytics-card">
                <Card.Body>
                  <h6 className="library-card-title">
                    <Award className="me-2" />
                    Top 10 Popular Books - Detailed View
                  </h6>
                  <div className="analytics-list">
                    {reportData?.popularBooks
                      ?.slice(0, 10)
                      .map((book, index) => (
                        <div key={index} className="analytics-item">
                          <div className="analytics-rank">#{book.ranking}</div>
                          <div className="analytics-info">
                            <div className="analytics-name">
                              {book.book_name}
                            </div>
                            <div className="analytics-meta">
                              {book.total_issues} issues •{" "}
                              {book.avg_issues_per_month?.toFixed(2)}/month
                            </div>
                          </div>
                          {book.total_issues}
                        </div>
                      ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* Analytics View */}
      {viewMode === "analytics" && (
        <div className="charts-container">
          <Row>
            <Col lg={8}>
              <Card className="chart-card chart-card-large">
                <Card.Body>
                  <div className="chart-wrapper-large">
                    <Bar data={barChartData} options={barChartOptions} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4}>
              <Card className="chart-card">
                <Card.Body>
                  <div className="chart-wrapper">
                    <Pie data={pieChartData} options={pieChartOptions} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Category Details */}
          <Row className="mt-4">
            <Col lg={6}>
              <Card className="library-analytics-card">
                <Card.Body>
                  <h6 className="library-card-title">
                    <PieChart className="me-2" />
                    Category Statistics
                  </h6>
                  <div className="analytics-list">
                    {reportData?.categoryPopularity?.map((category, index) => (
                      <div key={index} className="analytics-item">
                        <div className="analytics-rank">{index + 1}</div>
                        <div className="analytics-info">
                          <div className="analytics-name">
                            {category.category_name}
                          </div>
                          <div className="analytics-meta">
                            {category.total_issues} total issues
                          </div>
                        </div>
                        <Badge bg="primary" className="analytics-badge">
                          {category.total_issues}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              <Card className="library-analytics-card">
                <Card.Body>
                  <h6 className="library-card-title">
                    <Clock className="me-2" />
                    Most Used Book Copies
                  </h6>
                  <div className="analytics-list">
                    {reportData?.copyUsage?.slice(0, 10).map((copy, index) => (
                      <div key={index} className="analytics-item">
                        {copy.copy_id}
                        <div className="analytics-info">
                          <div className="analytics-name">{copy.book_name}</div>
                          <div className="analytics-meta">
                            {copy.total_issues} times issued
                          </div>
                        </div>
                        {copy.total_issues}
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      )}

    </div>
  );
};

export default BookPopularityReport;