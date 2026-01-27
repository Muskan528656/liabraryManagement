import React, { useState, useEffect, useMemo } from "react";
import { Card, Button, Spinner, Row, Col, Form, InputGroup, Dropdown } from "react-bootstrap";
import DataApi from "../../api/dataApi";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import ResizableTable from "../common/ResizableTable";

const BookInventoryReport = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

   const [selectedRows, setSelectedRows] = useState([]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // 1. DYNAMIC COLUMN CONFIGURATION
  const columns = [
    //checkbox and serial number will be handled by ResizableTable component
    { field: "book_title", label: "Book Title", searchable: true },
    { field: "author_name", label: "Author", searchable: true },
    { field: "publisher_name", label: "Publisher", searchable: true },
    { field: "category_name", label: "Category", searchable: true },
    { field: "total_copies", label: "Total", align: "center" },
    { field: "available_copies", label: "Available", align: "center", className: "text-success fw-bold" },
    { field: "issued_copies", label: "Issued", align: "center", className: "text-primary" },
    { field: "lost_damaged_copies", label: "Lost", align: "center", className: "text-danger" },
    { 
      field: "status", 
      label: "Status",
      render: (val) => (
        <span className={`badge rounded-pill ${val === "Available" ? "bg-success" : "bg-warning text-dark"}`}>
          {val || "N/A"}
        </span>
      )
    },
    { field: "issued_to", label: "Issued To" },
  ];

  const fetchInventoryReport = async () => {
    try {
      setLoading(true);
      const bookApi = new DataApi("book");
      const response = await bookApi.fetchInventoryReport();
      //   setReportData(Array.isArray(response?.data) ? response.data : []);
      const dataWithIds = (response.data || []).map((item, index) => ({ ...item,id:item.id || index })); // Ensure each item has a unique 'id' field
      setReportData(dataWithIds);
    } catch (err) {
      setError("Failed to load inventory report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventoryReport(); }, []);

  //Handler for Checkboxes
  const handleSelectionChange = (selectedIds) => {
    setSelectedRows(selectedIds);
  }

  // 2. DYNAMIC FILTERING LOGIC
  const filteredData = useMemo(() => {
    return reportData.filter((row) =>
      columns.some((col) => 
        col.searchable && String(row[col.field] || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, reportData]);

  // 3. EXPORT LOGIC (Always exports all FILTERED data, not just current page)
  const exportFile = (type) => {

     if (selectedRows.length === 0) {
      alert("Please select at least one record to export.");
      return;
    }
    
    // Get the full row objects for selected IDs
    const selectedRowObjects = filteredData.filter(row => selectedRows.includes(row.id));
    
    const headers = columns.map(col => col.label);
    const exportData = selectedRowObjects.map(row => columns.map(col => row[col.field] || "N/A"));

    if (type === "csv") {
      const csvContent = [headers, ...exportData].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "Inventory_Report.csv";
      link.click();
    } 
    else if (type === "excel") {
      const cleanData = selectedRowObjects.map(({id, ...rest}) => rest); // Remove 'id' field
      const worksheet = XLSX.utils.json_to_sheet(cleanData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
      XLSX.writeFile(workbook, "Inventory_Report.xlsx");
    } 
    else if (type === "pdf") {
      const doc = new jsPDF("landscape");
      doc.text("Inventory Report", 14, 15);
      doc.autoTable({ head: [headers], body: exportData, startY: 20 });
      doc.save("Inventory_Report.pdf");
    }
  };

  if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white py-3 border-bottom-0">
        <Row className="g-3 align-items-center">
          <Col md={4}>
            <h5 className="mb-0 fw-bold" style={{color: "var(--primary-color)"}}>Book Inventory Report</h5>
            {selectedRows.length > 0 && (
                <small className="text-primary">{selectedRows.length} items selected</small>
            )}
          </Col>
          <Col md={8} className="d-flex justify-content-md-end gap-2">
            <Button variant="outline-primary" size="sm" onClick={fetchInventoryReport}><i className="fa fa-refresh" /></Button>
            {/* <Button variant="success" size="sm" onClick={() => exportFile("excel")}><i className="fa-solid fa-file-excel me-1" /> Excel</Button>
            <Button variant="info" size="sm" onClick={() => exportFile("csv")}><i className="fa-solid fa-file-csv me-1" /> CSV</Button>
            <Button variant="danger" size="sm" onClick={() => exportFile("pdf")}><i className="fa-solid fa-file-pdf me-1" /> PDF</Button> */}

            <Dropdown align="end">
                <Dropdown.Toggle variant="outline-secondary" size="sm" id="dropdown-actions"
                    className="d-flex align-items-center rounded-2 px-3"
                    style={{ border: '1px solid #ced4da', color: '#212529' }}
                 >
                Actions
                </Dropdown.Toggle>
                <Dropdown.Menu className="shadow-sm border-0 mt-2">
                    <Dropdown.Header className="small text-uppercase fw-bold text-muted">Export Data</Dropdown.Header>
                    
                    <Dropdown.Item onClick={() => exportFile("excel")} className="py-2">
                        <i className="fa-solid fa-file-excel me-2 text-success" />Excel
                    </Dropdown.Item>
                    
                    <Dropdown.Item onClick={() => exportFile("csv")} className="py-2">
                        <i className="fa-solid fa-file-csv me-2 text-info" />CSV
                    </Dropdown.Item>
                    {/* <Dropdown.Divider /> */}
                    <Dropdown.Item onClick={() => exportFile("pdf")} className="py-2 text-danger">
                    <i className="fa-solid fa-file-pdf me-2" />PDF
                    </Dropdown.Item>
                </Dropdown.Menu>
          </Dropdown>
          </Col>
        </Row>
      </Card.Header>

      <Card.Body>
        {/* <Row className="mb-3">
          <Col md={4}>
            <InputGroup size="sm">
              <InputGroup.Text className="bg-white"><i className="fa fa-search text-muted" /></InputGroup.Text>
              <Form.Control 
                placeholder="Search across columns..." 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </InputGroup>
          </Col>
        </Row> */}

        <div className="table-responsive border rounded">
          <ResizableTable
            data={filteredData}
            columns={columns}
            loading={loading}
            currentPage={currentPage}
            recordsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            showSerialNumber={true}
            showActions={false}
            showCheckbox={true}
            selectedItems={selectedRows}
            onSelectionChange={handleSelectionChange}
          />
        </div>
      </Card.Body>
    </Card>
  );
};

export default BookInventoryReport;