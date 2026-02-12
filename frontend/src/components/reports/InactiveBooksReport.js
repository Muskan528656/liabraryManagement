import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card, Button, Spinner, Row, Col, Form, Dropdown
} from "react-bootstrap";
import DataApi from "../../api/dataApi";
import ResizableTable from "../common/ResizableTable";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const InactiveBooksReport = () => {
  const navigate = useNavigate();

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedRows, setSelectedRows] = useState([]);
  const [categories, setCategories] = useState([]);

  const [filters, setFilters] = useState({
    days: "30",
    startDate: "",
    endDate: "",
    searchTerm: "",
    category: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const labelStyle = {
    fontSize: '14px',
    fontWeight: '500',
    color: '#495057',
    marginBottom: '6px',
  };

  const inputBaseStyle = {
    borderRadius: '8px',
    border: '1px solid #ced4da',
    padding: '8px 12px',
    fontSize: '14px',
    backgroundColor: '#fff',
    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // ------------------ Columns ------------------
  const columns = [
    {
      field: "title",
      label: "Book Title",
      searchable: true,
      align: "center",
    },
    {
      field:"category_name",
      label: "Category",
      searchable:true,
      align:"center",
    },
    {
      field: "available_copies",
      label: "Available Copies",
      align: "center",
    },
    {
      field: "last_activity_date",
      label: "Last Activity Date",
      align: "center",
      render: (val) =>
        val ? new Date(val).toLocaleDateString() : "N/A",
    },
    {
      field: "days_not_borrowed",
      label: "Days Not Borrowed",
      align: "center",
      render: (val) => (
        <span className={val > 90 ? "text-danger fw-bold" : "text-warning fw-semibold"}>
          {val} Days
        </span>
      ),
    },
  ];

  // ------------------ Fetch Categories ------------------
  const fetchCategories = async () => {
    try {
      const api = new DataApi("category");
      const response = await api.fetchAll();
      setCategories(response.data.records || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };


  // ------------------ Fetch API ------------------
  const fetchInactiveBooks = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const api = new DataApi("reports");

      const response = await api.get("/inactive-books", {
        params,
      });

      const data = (response.data.records || []).map((item, index) => ({
        ...item,
        id: item.id || index,
      }));

      setReportData(data);
    } catch (err) {
      setError("Failed to load inactive books.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchInactiveBooks();
  }, []);

  useEffect(() => {
    const params = {};
    if (filters.days && filters.days !== "custom") {
      params.days = filters.days;
    }
    if (filters.days === "custom" && filters.startDate && filters.endDate) {
      params.startDate = filters.startDate;
      params.endDate = filters.endDate;
    }
    if (filters.searchTerm) {
      params.search = filters.searchTerm;
    }
    if (filters.category) {
      params.category = filters.category;
    }
    fetchInactiveBooks(params);
  }, [filters]);

  // ------------------ Filters ------------------
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const params = {};
    if (filters.days && filters.days !== "custom") {
      params.days = filters.days;
    }
    if (filters.days === "custom" && filters.startDate && filters.endDate) {
      params.startDate = filters.startDate;
      params.endDate = filters.endDate;
    }
    if (filters.searchTerm) {
      params.search = filters.searchTerm;
    }
    if (filters.category) {
      params.category = filters.category;
    }
    fetchInactiveBooks(params);
  };

  const resetFilters = () => {
    setFilters({
      days: "30",
      startDate: "",
      endDate: "",
      searchTerm: "",
      category: "",
    });
    fetchInactiveBooks();
  };

  const filteredData = useMemo(() => {
    let data = reportData;
    if (filters.searchTerm) {
      data = data.filter((row) =>
        row.title?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }
    if (filters.category) {
      data = data.filter((row) => row.category_id === filters.category);
    }
    return data;
  }, [reportData, filters]);

  // ------------------ Export Logic ------------------
  const exportFile = (type) => {
    const dataToExport =
      selectedRows.length > 0
        ? filteredData.filter((row) => selectedRows.includes(row.id))
        : filteredData;

    if (dataToExport.length === 0) {
      alert("No data to export!");
      return;
    }

    const formattedData = dataToExport.map((row) => ({
      "Book Title": row.title,
      "Available Copies": row.available_copies,
      "Last Activity Date": row.last_activity_date
        ? new Date(row.last_activity_date).toLocaleDateString()
        : "N/A",
      "Days Not Borrowed": row.days_not_borrowed,
    }));

    // -------- CSV --------
    if (type === "csv") {
      const headers = Object.keys(formattedData[0]);
      const csvContent = [
        headers.join(","),
        ...formattedData.map((row) =>
          headers.map((field) => `"${row[field]}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Inactive_Books_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
    }

    // -------- Excel --------
    if (type === "excel") {
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inactive Books");
      XLSX.writeFile(
        workbook,
        `Inactive_Books_${new Date().toISOString().split("T")[0]}.xlsx`
      );
    }

    // -------- PDF --------
    if (type === "pdf") {
      const doc = new jsPDF("landscape");

      doc.setFontSize(16);
      doc.text("Inactive Books Report", 14, 15);

      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
      doc.text(`Total Records: ${formattedData.length}`, 14, 28);

      autoTable(doc, {
        startY: 35,
        head: [Object.keys(formattedData[0])],
        body: formattedData.map((row) => Object.values(row)),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185] },
      });

      doc.save(
        `Inactive_Books_${new Date().toISOString().split("T")[0]}.pdf`
      );
    }
  };

  // ------------------ UI ------------------
  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <Card className="border-0 shadow-sm">
      

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
                        Long- Time Unborrowed Books  
                      </h4>
                    </div>
                  </Col>
                  <div className="library-header-right">
                    <Dropdown align="end">
                      <Dropdown.Toggle variant="light" size="sm" id="options-dropdown">
                        <i className="fa fa-bars me-1" />  Options
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="shadow-sm border-0 mt-2">
                        
                        <Dropdown.Divider />
                        <Dropdown.Header className="small text-uppercase fw-bold text-muted">Export Options</Dropdown.Header>
                        <Dropdown.Item onClick={exportFile}>
                          <i className="fa-solid fa-file-excel me-2 text-success" /> Excel
                        </Dropdown.Item>
                        <Dropdown.Item onClick={exportFile}>
                          <i className="fa-solid fa-file-csv me-2 text-info" /> CSV
                        </Dropdown.Item>
                        <Dropdown.Item onClick={exportFile}>
                          <i className="fa-solid fa-file-pdf me-2 text-danger" /> PDF
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>

        <Card.Body>

          {/* Filters */}
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
                    <option key={cat.id} value={cat.id || cat.name}>{cat.name}</option>
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

          {/* Table */}
          <ResizableTable
            data={filteredData}
            columns={columns}
            currentPage={currentPage}
            recordsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            showSerialNumber
            showCheckbox
            selectedItems={selectedRows}
            showActions={false}
            onSelectionChange={setSelectedRows}
          />

        </Card.Body>
      </Card>
    </div>
  );
};

export default InactiveBooksReport;
