// import React, { useState, useEffect, useMemo } from "react";
// import { Card, Button, Spinner, Row, Col, Form, InputGroup, Dropdown } from "react-bootstrap";
// import DataApi from "../../api/dataApi";
// import * as XLSX from "xlsx";
// import jsPDF from "jspdf";
// import "jspdf-autotable";
// import ResizableTable from "../common/ResizableTable";

// const BookInventoryReport = () => {
//   const [reportData, setReportData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [searchTerm, setSearchTerm] = useState("");

//    const [selectedRows, setSelectedRows] = useState([]);
  
//   // Pagination State
//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(10);

//   // 1. DYNAMIC COLUMN CONFIGURATION
//   const columns = [
//     //checkbox and serial number will be handled by ResizableTable component
//     { field: "book_title", label: "Book Title", searchable: true },
//     { field: "author_name", label: "Author", searchable: true },
//     { field: "publisher_name", label: "Publisher", searchable: true },
//     { field: "category_name", label: "Category", searchable: true },
//     { field: "total_copies", label: "Total", align: "center" },
//     { field: "available_copies", label: "Available", align: "center", className: "text-success fw-bold" },
//     { field: "issued_copies", label: "Issued", align: "center", className: "text-primary" },
//     { field: "lost_damaged_copies", label: "Lost", align: "center", className: "text-danger" },
//     { 
//       field: "status", 
//       label: "Status",
//       render: (val) => (
//         <span className={`badge rounded-pill ${val === "Available" ? "bg-success" : "bg-warning text-dark"}`}>
//           {val || "N/A"}
//         </span>
//       )
//     },
//     { field: "issued_to", label: "Issued To" },
//   ];

//   const fetchInventoryReport = async () => {
//     try {
//       setLoading(true);
//       const bookApi = new DataApi("book");
//       const response = await bookApi.fetchInventoryReport();
//       //   setReportData(Array.isArray(response?.data) ? response.data : []);
//       const dataWithIds = (response.data || []).map((item, index) => ({ ...item,id:item.id || index })); // Ensure each item has a unique 'id' field
//       setReportData(dataWithIds);
//     } catch (err) {
//       setError("Failed to load inventory report.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { fetchInventoryReport(); }, []);

//   //Handler for Checkboxes
//   const handleSelectionChange = (selectedIds) => {
//     setSelectedRows(selectedIds);
//   }

//   // 2. DYNAMIC FILTERING LOGIC
//   const filteredData = useMemo(() => {
//     return reportData.filter((row) =>
//       columns.some((col) => 
//         col.searchable && String(row[col.field] || "").toLowerCase().includes(searchTerm.toLowerCase())
//       )
//     );
//   }, [searchTerm, reportData]);

//   // 3. EXPORT LOGIC (Always exports all FILTERED data, not just current page)
//   const exportFile = (type) => {

//      if (selectedRows.length === 0) {
//       alert("Please select at least one record to export.");
//       return;
//     }
    
//     // Get the full row objects for selected IDs
//     const selectedRowObjects = filteredData.filter(row => selectedRows.includes(row.id));
    
//     const headers = columns.map(col => col.label);
//     const exportData = selectedRowObjects.map(row => columns.map(col => row[col.field] || "N/A"));

//     if (type === "csv") {
//       const csvContent = [headers, ...exportData].map(e => e.join(",")).join("\n");
//       const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//       const link = document.createElement("a");
//       link.href = URL.createObjectURL(blob);
//       link.download = "Inventory_Report.csv";
//       link.click();
//     } 
//     else if (type === "excel") {
//       const cleanData = selectedRowObjects.map(({id, ...rest}) => rest); // Remove 'id' field
//       const worksheet = XLSX.utils.json_to_sheet(cleanData);
//       const workbook = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
//       XLSX.writeFile(workbook, "Inventory_Report.xlsx");
//     } 
//     else if (type === "pdf") {
//       const doc = new jsPDF("landscape");
//       doc.text("Inventory Report", 14, 15);
//       doc.autoTable({ head: [headers], body: exportData, startY: 20 });
//       doc.save("Inventory_Report.pdf");
//     }
//   };

//   if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

//   return (
//     <Card className="border-0 shadow-sm">
//       <Card.Header className="bg-white py-3 border-bottom-0">
//         <Row className="g-3 align-items-center">
//           <Col md={4}>
//             <h5 className="mb-0 fw-bold" style={{color: "var(--primary-color)"}}>Book Inventory Report</h5>
//             {selectedRows.length > 0 && (
//                 <small className="text-primary">{selectedRows.length} items selected</small>
//             )}
//           </Col>
//           <Col md={8} className="d-flex justify-content-md-end gap-2">
//             <Button variant="outline-primary" size="sm" onClick={fetchInventoryReport}><i className="fa fa-refresh" /></Button>
//             {/* <Button variant="success" size="sm" onClick={() => exportFile("excel")}><i className="fa-solid fa-file-excel me-1" /> Excel</Button>
//             <Button variant="info" size="sm" onClick={() => exportFile("csv")}><i className="fa-solid fa-file-csv me-1" /> CSV</Button>
//             <Button variant="danger" size="sm" onClick={() => exportFile("pdf")}><i className="fa-solid fa-file-pdf me-1" /> PDF</Button> */}

//             <Dropdown align="end">
//                 <Dropdown.Toggle variant="outline-secondary" size="sm" id="dropdown-actions"
//                     className="d-flex align-items-center rounded-2 px-3"
//                     style={{ border: '1px solid #ced4da', color: '#212529' }}
//                  >
//                 Actions
//                 </Dropdown.Toggle>
//                 <Dropdown.Menu className="shadow-sm border-0 mt-2">
//                     <Dropdown.Header className="small text-uppercase fw-bold text-muted">Export Data</Dropdown.Header>
                    
//                     <Dropdown.Item onClick={() => exportFile("excel")} className="py-2">
//                         <i className="fa-solid fa-file-excel me-2 text-success" />Excel
//                     </Dropdown.Item>
                    
//                     <Dropdown.Item onClick={() => exportFile("csv")} className="py-2">
//                         <i className="fa-solid fa-file-csv me-2 text-info" />CSV
//                     </Dropdown.Item>
//                     {/* <Dropdown.Divider /> */}
//                     <Dropdown.Item onClick={() => exportFile("pdf")} className="py-2 text-danger">
//                     <i className="fa-solid fa-file-pdf me-2" />PDF
//                     </Dropdown.Item>
//                 </Dropdown.Menu>
//           </Dropdown>
//           </Col>
//         </Row>
//       </Card.Header>

//       <Card.Body>
//         {/* <Row className="mb-3">
//           <Col md={4}>
//             <InputGroup size="sm">
//               <InputGroup.Text className="bg-white"><i className="fa fa-search text-muted" /></InputGroup.Text>
//               <Form.Control 
//                 placeholder="Search across columns..." 
//                 onChange={(e) => setSearchTerm(e.target.value)} 
//               />
//             </InputGroup>
//           </Col>
//         </Row> */}

//         <div className="table-responsive border rounded">
//           <ResizableTable
//             data={filteredData}
//             columns={columns}
//             loading={loading}
//             currentPage={currentPage}
//             recordsPerPage={rowsPerPage}
//             onPageChange={setCurrentPage}
//             showSerialNumber={true}
//             showActions={false}
//             showCheckbox={true}
//             selectedItems={selectedRows}
//             onSelectionChange={handleSelectionChange}
//           />
//         </div>
//       </Card.Body>
//     </Card>
//   );
// };

// export default BookInventoryReport;



import React, { useState, useEffect, useMemo } from "react";
import { Card, Button, Spinner, Row, Col, Form, InputGroup, Dropdown, ButtonGroup } from "react-bootstrap";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
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
  const [vendors, setVendors] = useState([]);
  
  const [columnFilters, setColumnFilters] = useState({});
  
  const [viewMode, setViewMode] = useState("table");
  const [chartGroupBy, setChartGroupBy] = useState("category_name");
  const [vendorFilter, setVendorFilter] = useState("All Vendors");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const columns = [
    { field: "book_title", label: "Book Title", searchable: true },
    { field: "author_name", label: "Author", searchable: true },
    { field: "publisher_name", label: "Publisher", searchable: true },
    { field: "category_name", label: "Category", searchable: true },
    { field: "total_copies", label: "Total", align: "center" },
    { field: "available_copies", label: "Available", align: "center", className: "text-success fw-bold" },
    { field: "issued_copies", label: "Issued", align: "center", className: "text-primary" },
    { 
      field: "status", 
      label: "Status",
      render: (val) => (
        <span className={`badge rounded-pill ${val === "Available" ? "bg-success" : "bg-warning text-dark"}`}>
          {val || "N/A"}
        </span>
      )
    },
  ];

  const fetchInventoryReport = async () => {
    try {
      setLoading(true);
      const bookApi = new DataApi("book");
      const response = await bookApi.fetchInventoryReport();
      const dataWithIds = (response.data || []).map((item, index) => ({ ...item, id: item.id || index }));
      setReportData(dataWithIds);
    } catch (err) {
      setError("Failed to load inventory report.");
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const vendorApi = new DataApi("vendor");
      console.log("Fetching vendors...", vendorApi);
      const response = await vendorApi.fetchAll();
      console.log("Vendors fetched:", response.data);
      const vendorList = (response.data || []).map((vendor) => vendor.vendor_name || vendor.name).filter(Boolean);
      console.log("Processed vendor list:", vendorList);
      setVendors(vendorList);
    } catch (err) {
      console.error("Failed to load vendors.", err);
    }
  };

  useEffect(() => { 
    fetchInventoryReport();
    fetchVendors();
  }, []);

  const handleSelectionChange = (selectedIds) => setSelectedRows(selectedIds);

  const filteredData = useMemo(() => {
    return reportData.filter((row) => {
      // Filter by search term
      const matchesSearch = columns.some((col) => 
        col.searchable && String(row[col.field] || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Filter by vendor
      const matchesVendor = vendorFilter === "All Vendors" || row.vendor_name === vendorFilter;
      
      return matchesSearch && matchesVendor;
    });
  }, [searchTerm, reportData, vendorFilter]);
  // --- CHART LOGIC ---
  const chartData = useMemo(() => {
    const aggregation = filteredData.reduce((acc, item) => {
      const key = item[chartGroupBy] || "Unknown";
      if (!acc[key]) {
        acc[key] = { name: key, total: 0, available: 0, issued: 0 };
      }
      acc[key].total += parseInt(item.total_copies || 0);
      acc[key].available += parseInt(item.available_copies || 0);
      acc[key].issued += parseInt(item.issued_copies || 0);
      return acc;
    }, {});

    return Object.values(aggregation).sort((a, b) => b.total - a.total).slice(0, 10); 
  }, [filteredData, chartGroupBy]);

  //Dynamic Export Logic

  const exportFile = (type) => {
    // if (selectedRows.length === 0) {
    //   alert("Please select at least one record to export.");
    //   return;
    // }
    // const selectedRowObjects = filteredData.filter(row => selectedRows.includes(row.id));
    const dataToExport = selectedRows.length > 0 ? filteredData.filter(row => selectedRows.includes(row.id)) : filteredData;
    const headers = columns.map(col => col.label);
    const exportData = dataToExport.map(row => columns.map(col => row[col.field] || "N/A"));

    if (type === "csv") {
        const csvContent = [headers, ...exportData].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "Inventory_Report.csv";
        link.click();
    } else if (type === "excel") {

        const excelData  = dataToExport.map(row =>{
            const rowData = {};
            columns.forEach(col => {
                rowData[col.label] = row[col.field] || "N/A";
            });
            return rowData;
        }) 


        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
        XLSX.writeFile(workbook, "Inventory_Report.xlsx");
    } else if (type === "pdf") {
        const doc = new jsPDF("landscape");
        doc.text("Inventory Report", 14, 15);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);
        doc.autoTable({ head: [headers], body: exportData, startY: 30  });
        doc.setFontSize(10);
        doc.setFontSize(16);
        doc.save("Inventory_Report.pdf");
    }
  };

  if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white py-3 border-bottom-0">
        <Row className="g-3 align-items-center">
          <Col md={4}>
            <h5 className="mb-0 fw-bold text-uppercase" style={{color: "var(--primary-color)"}}>Book Inventory</h5>
            {/* <small className="text-muted">Analyze your collection stock</small> */}
           
          </Col>
          <Col md={8} className="d-flex justify-content-md-end gap-2">
            <Form.Select  size="sm"
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                style={{ maxWidth: '150px' }}
            >
              <option value="All Vendors">All Vendors</option>
            {vendors.map((vendor, index) => ( <option key={index} value={vendor}> {vendor} </option> ))}
            </Form.Select>

            {/* View Toggle */}
            <ButtonGroup size="sm" className="me-2">
              <Button 
                variant={viewMode === 'table' ? '' : 'outline-primary'} 
                style={
                  viewMode === 'table'
                    ? { backgroundColor: 'var(--primary-color)', color:'#fff', borderColor: 'var(--primary-color)' }
                    : {}
                }
                onClick={() => setViewMode('table')}
                >
                <i className="fa fa-table me-1" /> Table
              </Button>
              <Button 
                variant={viewMode === 'chart' ? '' : 'outline-primary'} 
                style={
                  viewMode === 'chart'
                    ? { backgroundColor: 'var(--primary-color)', color:'#fff', borderColor: 'var(--primary-color)' }
                    : {}
                }
                onClick={() => setViewMode('chart')}
              >
                <i className="fa fa-chart-bar me-1" /> Chart
              </Button>
            </ButtonGroup>

            {/* <Button variant="outline-primary" size="sm" onClick={fetchInventoryReport}><i className="fa fa-refresh" /></Button> */}

            <Dropdown align="end">
                <Dropdown.Toggle variant="outline-dark" size="sm" style={{onhover: "cursor-pointer",color:'black'}}> <i className="fa fa-download" /> Actions</Dropdown.Toggle>
                <Dropdown.Menu className="shadow-sm border-0">
                    <Dropdown.Header>Export Selected</Dropdown.Header>
                    <Dropdown.Item onClick={() => exportFile("excel")}><i className="fa-solid fa-file-excel me-2 text-success" />Excel</Dropdown.Item>
                    <Dropdown.Item onClick={() => exportFile("csv")}><i className="fa-solid fa-file-csv me-2 text-info" />CSV</Dropdown.Item>
                    <Dropdown.Item onClick={() => exportFile("pdf")}><i className="fa-solid fa-f  ile-pdf me-2 text-danger" />PDF</Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
          </Col>
        </Row>
      </Card.Header>

      <Card.Body>
        {viewMode === "table" ? (
          <>
            {/* <Row className="mb-3">
              <Col md={4}>
                <InputGroup size="sm">
                  <InputGroup.Text className="bg-white"><i className="fa fa-search text-muted" /></InputGroup.Text>
                  <Form.Control 
                    placeholder="Search books, authors..." 
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
                showCheckbox={true}
                showActions={false}
                selectedItems={selectedRows}
                onSelectionChange={handleSelectionChange}
              />
            </div>
          </>
        ) : (
          <div className="p-2">
            <Row className="mb-4 align-items-center">
                <Col md={2}>
                    <Form.Group>
                        <Form.Label className="small fw-bold text-uppercase text-muted">Group Data By:</Form.Label>
                        <Form.Select 
                            size="sm" 
                            value={chartGroupBy} 
                            onChange={(e) => setChartGroupBy(e.target.value)}
                            className="form-select-sm"
                        >
                            <option value="category_name">Category</option>
                            <option value="publisher_name">Publisher</option>
                            <option value="author_name">Author</option>
                            <option value="vendor_name">Vendor</option>
                            {/* Add vendor_name here if it exists in your API data */}
                        </Form.Select>
                    </Form.Group>
                </Col>
                <Col md={8} className="text-end">
                    <div className="small text-muted italic">Showing top 10 items by total volume</div>
                </Col>
            </Row>
            
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    interval={0} 
                    height={80}
                    tick={{fontSize: 12}}
                  />
                  <YAxis />
                  <Tooltip cursor={{fill: '#f8f9fa'}} />
                  <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '20px'}} />
                  <Bar dataKey="total" name="Total Stock" fill="#11439b" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="available" name="Available" fill="#82ca9d" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default BookInventoryReport;