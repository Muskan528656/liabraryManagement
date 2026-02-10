import React, { useState, useEffect } from "react";
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
  Award,
  PieChart,
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
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [exporting, setExporting] = useState(false);

  // 1. Consolidated Filter State
  const [filters, setFilters] = useState({
    days: "30",
    startDate: "",
    endDate: "",
    category: "",
    searchTerm: "",
  });

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

  // 2. Fetch Categories on Mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // 3. Fetch Report Data whenever filters change
  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const categoryApi = new DataApi("category");
      const response = await categoryApi.fetchAll();
      const categoriesData = response?.data?.data || response?.data || [];
      setCategories(categoriesData.map(cat => ({
        id: cat.id,
        name: cat.name
      })));
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const api = new DataApi("book");
      const params = new URLSearchParams();

      // Append all filters to the API request
      if (filters.days) params.append("days", filters.days);
      if (filters.category) params.append("category", filters.category);
      if (filters.searchTerm) params.append("searchTerm", filters.searchTerm);
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
    setCurrentPage(1); // Reset to first page on filter change
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

  // Export Logic
  const exportToCSV = () => {
    if (!reportData?.mainTable) return;
    const headers = ["Book Name", "Author", "Category", "Issued", "Borrowers"];
    const csvContent = [
      headers.join(","),
      ...reportData.mainTable.map((row) =>
        [`"${row.book_name}"`, `"${row.author || "N/A"}"`, `"${row.category || "N/A"}"`, row.total_issues || 0, row.unique_borrowers || 0].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `popularity-report.csv`);
    link.click();
  };

  const exportToExcel = async () => {
    if (!reportData?.mainTable) return;

    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Library Management System';
      workbook.lastModifiedBy = 'System';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Main Table Sheet
      const mainTableSheet = workbook.addWorksheet('Book Popularity Report');

      // Add title
      mainTableSheet.mergeCells('A1:H1');
      mainTableSheet.getCell('A1').value = 'Book Popularity Analytics Report';
      mainTableSheet.getCell('A1').font = { size: 16, bold: true };
      mainTableSheet.getCell('A1').alignment = { horizontal: 'center' };

      // Add filters info
      mainTableSheet.getCell('A3').value = 'Filters Applied:';
      mainTableSheet.getCell('A3').font = { bold: true };

      let filterRow = 4;
      if (filters.days) {
        mainTableSheet.getCell(`A${filterRow}`).value = `Time Period: Last ${filters.days} days`;
        filterRow++;
      }
      if (filters.category) {
        const categoryName = categories.find(cat => cat.id === filters.category)?.name || filters.category;
        mainTableSheet.getCell(`A${filterRow}`).value = `Category: ${categoryName}`;
        filterRow++;
      }
      if (filters.searchTerm) {
        mainTableSheet.getCell(`A${filterRow}`).value = `Search: ${filters.searchTerm}`;
        filterRow++;
      }

      // Add headers
      const headers = ['Book Title', 'Author', 'Category', 'Total Copies', 'Total Issues', 'Unique Borrowers', 'Avg Issues/Month', 'Popularity Level'];
      headers.forEach((header, index) => {
        const cell = mainTableSheet.getCell(6, index + 1);
        cell.value = header;
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6E6FA' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Add data
      reportData.mainTable.forEach((row, index) => {
        const rowIndex = index + 7;
        mainTableSheet.getCell(rowIndex, 1).value = row.book_name;
        mainTableSheet.getCell(rowIndex, 2).value = row.author || 'N/A';
        mainTableSheet.getCell(rowIndex, 3).value = row.category || 'N/A';
        mainTableSheet.getCell(rowIndex, 4).value = row.copies;
        mainTableSheet.getCell(rowIndex, 5).value = row.total_issues;
        mainTableSheet.getCell(rowIndex, 6).value = row.unique_borrowers;
        mainTableSheet.getCell(rowIndex, 7).value = row.avg_issues_per_month;
        mainTableSheet.getCell(rowIndex, 8).value = row.popularity_level;

        // Add borders
        for (let col = 1; col <= 8; col++) {
          mainTableSheet.getCell(rowIndex, col).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
      });

      // Auto-fit columns
      mainTableSheet.columns.forEach(column => {
        column.width = 15;
      });

      // Popular Books Sheet
      if (reportData.popularBooks && reportData.popularBooks.length > 0) {
        const popularSheet = workbook.addWorksheet('Top Popular Books');
        popularSheet.getCell('A1').value = 'Top 10 Popular Books';
        popularSheet.getCell('A1').font = { size: 14, bold: true };

        const popularHeaders = ['Rank', 'Book Title', 'Total Issues', 'Avg Issues/Month'];
        popularHeaders.forEach((header, index) => {
          const cell = popularSheet.getCell(3, index + 1);
          cell.value = header;
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6FA' }
          };
        });

        reportData.popularBooks.forEach((book, index) => {
          const rowIndex = index + 4;
          popularSheet.getCell(rowIndex, 1).value = book.ranking;
          popularSheet.getCell(rowIndex, 2).value = book.book_name;
          popularSheet.getCell(rowIndex, 3).value = book.total_issues;
          popularSheet.getCell(rowIndex, 4).value = book.avg_issues_per_month;
        });

        popularSheet.columns.forEach(column => {
          column.width = 20;
        });
      }

      // Category Popularity Sheet
      if (reportData.categoryPopularity && reportData.categoryPopularity.length > 0) {
        const categorySheet = workbook.addWorksheet('Category Popularity');
        categorySheet.getCell('A1').value = 'Category-wise Book Issues';
        categorySheet.getCell('A1').font = { size: 14, bold: true };

        const categoryHeaders = ['Category', 'Total Issues'];
        categoryHeaders.forEach((header, index) => {
          const cell = categorySheet.getCell(3, index + 1);
          cell.value = header;
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6FA' }
          };
        });

        reportData.categoryPopularity.forEach((category, index) => {
          const rowIndex = index + 4;
          categorySheet.getCell(rowIndex, 1).value = category.category_name;
          categorySheet.getCell(rowIndex, 2).value = category.total_issues;
        });

        categorySheet.columns.forEach(column => {
          column.width = 20;
        });
      }

      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `book-popularity-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export to Excel. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    if (!reportData?.mainTable) return;

    setExporting(true);
    try {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(20);
      doc.text('Book Popularity Analytics Report', 105, 20, { align: 'center' });

      // Filters
      doc.setFontSize(12);
      let yPosition = 35;
      doc.text('Filters Applied:', 20, yPosition);
      yPosition += 10;

      if (filters.days) {
        doc.text(`Time Period: Last ${filters.days} days`, 20, yPosition);
        yPosition += 8;
      }
      if (filters.category) {
        const categoryName = categories.find(cat => cat.id === filters.category)?.name || filters.category;
        doc.text(`Category: ${categoryName}`, 20, yPosition);
        yPosition += 8;
      }
      if (filters.searchTerm) {
        doc.text(`Search: ${filters.searchTerm}`, 20, yPosition);
        yPosition += 8;
      }

      // Summary Statistics
      yPosition += 10;
      doc.setFontSize(14);
      doc.text('Summary Statistics:', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Total Books: ${reportData.mainTable.length}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Current Month Issues: ${reportData.keyMetrics.currentMonthIssues}`, 20, yPosition);
      yPosition += 8;
      if (reportData.keyMetrics.mostPopularBook) {
        doc.text(`Most Popular Book: ${reportData.keyMetrics.mostPopularBook.book_name}`, 20, yPosition);
        yPosition += 8;
        doc.text(`(${reportData.keyMetrics.mostPopularBook.total_issues} issues)`, 30, yPosition);
        yPosition += 8;
      }
      doc.text(`Never Issued Books: ${reportData.keyMetrics.neverIssuedBooks}`, 20, yPosition);
      yPosition += 15;

      // Table Data
      const tableData = reportData.mainTable.slice(0, 25).map(row => [
        row.book_name.substring(0, 30),
        (row.author || 'N/A').substring(0, 20),
        (row.category || 'N/A').substring(0, 15),
        row.total_issues.toString(),
        row.unique_borrowers.toString(),
        row.popularity_level
      ]);

      doc.autoTable({
        head: [['Book Title', 'Author', 'Category', 'Issues', 'Borrowers', 'Level']],
        body: tableData,
        startY: yPosition,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 15 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 }
        }
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
          20,
          doc.internal.pageSize.height - 10
        );
      }

      // Download
      doc.save(`book-popularity-report-${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("Failed to export to PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // Table Columns
  const columns = [
    {
      field: "book_name",
      label: "Book Title",
      width: "250px",
      render: (value, record) => (
        <div className="book-title-cell">
          <div className="book-name fw-bold">{value}</div>
          {record.isbn && <div className="text-muted small">ISBN: {record.isbn}</div>}
        </div>
      ),
    },
    { field: "author", label: "Author", width: "150px" },
    { field: "category", label: "Category", width: "120px" },
    {
      field: "available",
      label: "Available",
      width: "100px",
      render: (_, record) => (record.copies || 0) - (record.total_issues || 0),
    },
    { field: "total_issues", label: "Issued", width: "80px" },
    { field: "unique_borrowers", label: "Borrowers", width: "100px" },
  ];

  // Chart Data Preparation
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
    <div className="library-report-container p-3">
      {/* Header */}
      <div className="library-header d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-2">
          <FileEarmarkBarGraph size={24} className="text-primary" />
          <h4 className="mb-0">Book Borrowing Popularity Analytics</h4>
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
            <Dropdown.Item onClick={exportToCSV}><i className="fa-solid fa-file-csv me-2 text-info" /> CSV</Dropdown.Item>
            <Dropdown.Item onClick={exportToExcel}><i className="fa-solid fa-file-excel me-2 text-success" /> Excel</Dropdown.Item>
            <Dropdown.Item onClick={exportToPDF}><i className="fa-solid fa-file-pdf me-2 text-danger" /> PDF</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {/* Filters Section */}
      <Card className="border-0 bg-light mb-4 shadow-sm">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col xs={12} md={2}>
              <div style={labelStyle}><i className="fa-solid fa-calendar-days" /> Time Period</div>
              <Form.Select
                className="small text-muted"
                style={{
                  ...inputBaseStyle,
                  cursor: 'pointer',
                  paddingRight: '2.5rem',
                  appearance: 'none',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '16px 12px'
                }}
                value={filters.days}
                onChange={(e) => handleFilterChange("days", e.target.value)}
              >
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="365">Last Year</option>
              </Form.Select>
            </Col>

            <Col xs={12} md={2}>
              <div style={labelStyle}><i className="fa-solid fa-magnifying-glass" /> Search</div>
              <Form.Control
                className="small text-muted"
                style={{
                  ...inputBaseStyle,
                  cursor: 'pointer',
                  paddingRight: '2.5rem',
                  appearance: 'none',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '16px 12px'
                }}
                placeholder="Search book or author..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
              />
            </Col>

            <Col xs={12} md={2}>
              <div style={labelStyle}><i className="fa-solid fa-filter" /> Category</div>
              <Form.Select
                className="small text-muted"
                style={{
                  ...inputBaseStyle,
                  cursor: 'pointer',
                  paddingRight: '2.5rem',
                  appearance: 'none',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '16px 12px'
                }}

                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Form.Select>
            </Col>

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
      </Card>

      {/* Conditional Content Rendering */}
      {viewMode === "table" && (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <ResizableTable
              data={reportData?.mainTable || []}
              columns={columns}
              loading={loading}
              currentPage={currentPage}
              recordsPerPage={10}
              onPageChange={setCurrentPage}
              showSerialNumber={true}
              showCheckbox={true}
              showActions={false}
              selectedItems={selectedItems}
              onSelectionChange={setSelectedItems}
            />
          </Card.Body>
        </Card>
      )}

      {viewMode === "dashboard" && (
        <Row className="g-4">
          <Col lg={7}>
            <Card className="border-0 shadow-sm p-3">
              <h6 className="fw-bold mb-3">Top 10 Most Popular Books</h6>
              <div style={{ height: '300px' }}>
                <Bar data={barChartData} options={{ maintainAspectRatio: false }} />
              </div>
            </Card>
          </Col>
          <Col lg={5}>
            <Card className="border-0 shadow-sm p-3">
              <h6 className="fw-bold mb-3">Issues by Category</h6>
              <div style={{ height: '300px' }}>
                <Pie data={pieChartData} options={{ maintainAspectRatio: false }} />
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {viewMode === "analytics" && (
        <Row className="g-4">
          <Col lg={12}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h6 className="fw-bold mb-3"><Award className="me-2 text-warning" />Ranked Popularity</h6>
                <div className="list-group list-group-flush">
                  {reportData?.popularBooks?.slice(0, 10).map((book, idx) => (
                    <div key={idx} className="list-group-item d-flex justify-content-between align-items-center py-3">
                      <div>
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
        </Row>
      )}
    </div>
  );
};

export default BookPopularityReport;