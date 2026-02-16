import React, { useState, useEffect } from "react";
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
  Dropdown,
} from "react-bootstrap";
import ResizableTable from "../common/ResizableTable";
import {
  Award,
  PieChart as PieChartIcon,
  FileEarmarkBarGraph,
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
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
  const [categories, setCategories] = useState([]);

  const [filters, setFilters] = useState({
    days: "30",
    startDate: "",
    endDate: "",
    category: "",
    searchTerm: "",
  });

  const [viewMode, setViewMode] = useState("table");
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);

  // Styles
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

  // Fetch Categories for Filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoryApi = new DataApi("classification");
        const response = await categoryApi.fetchAll();
        console.log("Categories API Response:", response);
        const categoriesData = response?.data?.data || response?.data || [];
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);



  const todayStr = new Date().toISOString().split("T")[0];

  // Fetch Report Data on Filter Change
  useEffect(() => {

    if (filters.days === "custom" && !filters.startDate && !filters.endDate) {
      const today = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(today.getMonth() - 1);



      const formatDate = (date) => date.toISOString().split("T")[0];

      handleFilterChange("startDate", lastMonth.toISOString().split("T")[0]);      // Today
      handleFilterChange("endDate", today.toISOString().split("T")[0]);    // Last month same day

    }
    fetchReportData();
  }, [filters]);


  const currentDate = new Date();

  const lastMonthDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 1,
    currentDate.getDate()
  );






  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const api = new DataApi("book");
      const params = new URLSearchParams();

      // Handle Custom Date Logic
      if (filters.days === "custom") {

        params.append("days", "custom");

        if (filters.startDate) params.append("startDate", filters.startDate);
        if (filters.endDate) params.append("endDate", filters.endDate);
      } else {
        params.append("days", filters.days);
      }

      if (filters.category) params.append("category", filters.category);
      if (filters.searchTerm) params.append("searchTerm", filters.searchTerm);

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
      ...(field === "days" && value !== "custom" ? { startDate: "", endDate: "" } : {})
    }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      days: "30",
      startDate: "",
      endDate: "",
      category: "",
      searchTerm: "",
    });
  };

  // Export Functions
  const exportToCSV = () => {
    if (!reportData?.mainTable) return;
    const headers = ["Book Name", "Author", "Category", "Issued", "Borrowers", "Level"];
    const csvContent = [
      headers.join(","),
      ...reportData.mainTable.map((row) =>
        [`"${row.book_name}"`, `"${row.author || "N/A"}"`, `"${row.category || "N/A"}"`, row.total_issues || 0, row.unique_borrowers || 0, `"${row.popularity_level}"`].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `popularity-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const api = new DataApi("book");
      const params = new URLSearchParams();

      if (filters.days) params.append("days", filters.days);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.category) params.append("category", filters.category);
      if (filters.searchTerm) params.append("searchTerm", filters.searchTerm);

      const response = await api.get(`/export-excel?${params.toString()}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `book-popularity-report.xlsx`);
      link.click();
    } catch (error) {
      console.error("Excel export error:", error);
      alert("Excel export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };


  const exportToPDF = () => {
    if (!reportData?.mainTable) return;
    const doc = new jsPDF();
    doc.text('Book Popularity Analytics Report', 105, 20, { align: 'center' });
    const tableData = reportData.mainTable.slice(0, 30).map(row => [
      row.book_name, row.author || 'N/A', row.category || 'N/A', row.total_issues, row.unique_borrowers, row.popularity_level
    ]);
    doc.autoTable({
      head: [['Title', 'Author', 'Category', 'Issues', 'Borrowers', 'Level']],
      body: tableData,
      startY: 30
    });
    doc.save('book-popularity-report.pdf');
  };

  // Table Columns Definition
  const columns = [
    {
      field: "book_name",
      label: "Book Title",
      width: "250px",
      render: (value, record) => (
        <div className="book-title-cell">
          <div className="fw-bold">{value}</div>
          {record.isbn && <div className="text-muted small">ISBN: {record.isbn}</div>}
        </div>
      ),
    },
    { field: "author", label: "Author", width: "150px", align: "center" },
    {
      field: "classification",
      label: "Category",
      width: "150px",
      align: "center",
      render: (_, record) => `${record.classification_from || ''}-${record.classification_to || ''} (${record.category || '-'})`
    },
    {
      field: "available",
      label: "Available",
      width: "100px",
      align: "center",
      render: (_, record) => (record.copies || 0) - (record.total_issues || 0),
    },
    { field: "total_issues", label: "Issued", width: "80px", align: "center" },
    { field: "unique_borrowers", label: "Borrowers", width: "100px", align: "center" },
  ];

  // Chart Data
  const barChartData = {
    labels: reportData?.popularBooks?.slice(0, 10).map((book) => book.book_name) || [],

    datasets: [{
      label: "Total Issues",
      data: reportData?.popularBooks?.slice(0, 10).map((book) => book.total_issues) || [],
      backgroundColor: "rgba(13, 110, 253, 0.8)",
    }],
  };

  const pieChartData = {
    labels: reportData?.categoryPopularity?.map((cat) => cat.category_name) || [],
    datasets: [{
      data: reportData?.categoryPopularity?.map((cat) => cat.total_issues) || [],
      backgroundColor: ["#0d6efd", "#198754", "#ffc107", "#dc3545", "#0dcaf0", "#6610f2"],
    }],
  };

  if (loading && !reportData) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '400px' }}>
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid bg-light min-vh-100 pb-5">
      <div className="card shadow-sm border-0 mt-1 mx-2">
        {/* Header */}
        {/* <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <Button variant="light" className="shadow-sm border" onClick={() => navigate('/reports')}>
              <i className="fa-solid fa-arrow-left"></i>
            </Button>
            <h4 className="mb-0 fw-bold text-primary">Book Borrowing Popularity Analytics</h4>
          </div>

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
              <Dropdown.Item onClick={exportToExcel}><i className="fa-solid fa-file-excel me-2 text-success" /> Excel</Dropdown.Item>
              <Dropdown.Item onClick={exportToCSV}><i className="fa-solid fa-file-csv me-2 text-info" /> CSV</Dropdown.Item>
              <Dropdown.Item onClick={exportToPDF}><i className="fa-solid fa-file-pdf me-2 text-danger" /> PDF</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div> */}

        <div className="library-header border shadow-sm mt-3 mb-2 rounded mx-2">
          <Col md={6} className="d-flex align-items-center gap-3 ms-3">
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
                <Dropdown.Item onClick={exportToPDF}>
                  <i className="fa-solid fa-file-pdf me-2 text-danger" /> PDF
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        {/* Filters Section */}
        <div className="p-3 bg-white">
          <Row className="g-3 align-items-end">
            {/* Time Period Select */}
            <Col xs={12} md={2}>
              <div style={labelStyle}><i className="fa-solid fa-calendar-days" /> Time Period</div>
              <Form.Select
                style={inputBaseStyle}
                value={filters.days}
                onChange={(e) => handleFilterChange("days", e.target.value)}
              >
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="365">Last Year</option>
                <option value="custom">Custom Range</option>
              </Form.Select>
            </Col>

            {/* Custom From Date */}
            {filters.days === "custom" && (
              <Col xs={12} md={2}>
                <div style={labelStyle}><i className="fa-solid fa-calendar-day" /> From Date</div>
                <Form.Control
                  type="date"
                  style={inputBaseStyle}
                  value={filters.startDate}

                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                />
              </Col>
            )}

            {/* Custom To Date */}
            {filters.days === "custom" && (
              <Col xs={12} md={2}>
                <div style={labelStyle}><i className="fa-solid fa-calendar-day" /> To Date</div>
                <Form.Control
                  type="date"
                  style={inputBaseStyle}
                  value={filters.endDate}
                  max={todayStr}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                />
              </Col>
            )}

            {/* Search Input */}
            <Col xs={12} md={2}>
              <div style={labelStyle}><i className="fa-solid fa-magnifying-glass" /> Search</div>
              <Form.Control
                style={inputBaseStyle}
                placeholder="Search book or author..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
              />
            </Col>

            {/* Category Select */}
            <Col xs={12} md={2}>
              <div style={labelStyle}><i className="fa-solid fa-filter" /> Category</div>
              <Form.Select
                style={inputBaseStyle}
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id || cat.name}>{cat.classification_from}-{cat.classification_to} {cat.name}</option>
                ))}
              </Form.Select>
            </Col>

            {/* Reset Button */}
            <Col xs="auto">
              <Button
                variant="light"
                onClick={resetFilters}
                className="d-flex align-items-center justify-content-center border"
                style={{ width: '44px', height: '44px', borderRadius: '8px' }}
                title="Reset Filters"
              >
                <i className="fa-solid fa-undo text-secondary" />
              </Button>
            </Col>
          </Row>
        </div>


        <div className="p-3">
          {viewMode === "table" && (
            <div className="border rounded overflow-hidden">
              <ResizableTable
                data={reportData?.mainTable || []}
                columns={columns}
                loading={loading}
                currentPage={currentPage}
                recordsPerPage={10}
                onPageChange={setCurrentPage}
                showSerialNumber={true}
                showActions={false}
                showCheckbox={true}
                selectedItems={selectedItems}
                onSelectionChange={setSelectedItems}
              />
            </div>
          )}

          {viewMode === "dashboard" && (
            <Row className="g-4">
              <Col lg={7}>
                <Card className="border-0 shadow-sm p-3">
                  <h6 className="fw-bold mb-3">Top 10 Most Popular Books</h6>
                  <div style={{ height: '350px' }}>
                    <Bar data={barChartData} options={{ maintainAspectRatio: false }} />
                  </div>
                </Card>
              </Col>
              <Col lg={5}>
                <Card className="border-0 shadow-sm p-3">
                  <h6 className="fw-bold mb-3">Issues by Category</h6>
                  <div style={{ height: '350px' }}>
                    <Pie data={pieChartData} options={{ maintainAspectRatio: false }} />
                  </div>
                </Card>
              </Col>
            </Row>
          )}

          {viewMode === "analytics" && (
            <Row className="g-4">
              <Col lg={6}>
                <Card className="border-0 shadow-sm">
                  <Card.Body>
                    <h6 className="fw-bold mb-3"><Award className="me-2 text-warning" />Ranked Popularity</h6>
                    <div className="list-group list-group-flush">
                      {reportData?.popularBooks?.slice(0, 10).map((book, idx) => (
                        <div key={idx} className="list-group-item d-flex justify-content-between align-items-center py-3">
                          <div className="text-truncate me-2">
                            <span className="badge bg-light text-dark border me-3">#{idx + 1}</span>
                            <span className="fw-bold">{book.book_name}</span>
                          </div>
                          <Badge bg="primary" pill>{book.total_issues} Issues</Badge>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={6}>
                <Card className="border-0 shadow-sm">
                  <Card.Body>
                    <h6 className="fw-bold mb-3"><PieChartIcon className="me-2 text-info" />Category Stats</h6>
                    <div className="list-group list-group-flush">
                      {reportData?.categoryPopularity?.map((cat, idx) => (
                        <div key={idx} className="list-group-item d-flex justify-content-between align-items-center py-3">
                          <span className="fw-semibold">{cat.category_name}</span>
                          <span className="text-muted">{cat.total_issues} total borrows</span>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookPopularityReport;
