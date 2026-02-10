

// import React, { useState, useEffect, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Card, Button, Spinner, Row, Col, Form, InputGroup,
//   ButtonGroup, Badge, OverlayTrigger, Tooltip, Alert, Modal, Dropdown
// } from "react-bootstrap";
// import {
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
//   Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
// } from 'recharts';
// import DataApi from "../../api/dataApi";
// import * as XLSX from "xlsx";
// import jsPDF from "jspdf";
// import "jspdf-autotable";
// import ResizableTable from "../common/ResizableTable";
// import "../../App.css";
// import TableHeader from "../common/TableHeader";
// const BookInventoryReport = () => {
//   const navigate = useNavigate();

//   const [reportData, setReportData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedRows, setSelectedRows] = useState([]);
//   const [vendors, setVendors] = useState([]);



//   const [vendorFilter, setVendorFilter] = useState("All Vendors");
//   const [statusFilter, setStatusFilter] = useState("All Status");
//   const [categoryFilter, setCategoryFilter] = useState("All Categories");

//   const [viewMode, setViewMode] = useState("table");
//   const [chartType, setChartType] = useState("bar");
//   const [chartGroupBy, setChartGroupBy] = useState("category_name");

//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(10);


//   const labelStyle = {
//     fontSize: '0.875rem',
//     fontWeight: '600',
//     color: '#495057',
//     marginBottom: '0.5rem',
//     display: 'flex',
//     alignItems: 'center',
//     gap: '0.5rem'
//   };

//   const inputBaseStyle = {
//     height: '44px',
//     borderRadius: '8px',
//     border: '1.5px solid #dee2e6',
//     padding: '0.625rem 1rem',
//     fontSize: '0.9375rem',
//     transition: 'all 0.2s ease',
//     backgroundColor: '#fff',
//     width: '100%'
//   };

//   const columns = [
//     {
//       field: "book_title",
//       label: "Book Title",
//       searchable: true,
//       render: (val, row) => (
//         <div>
//           <div className="fw-semibold text-dark">{val}</div>
//           <small className="text-muted">ISBN: {row.isbn || 'N/A'}</small>
//         </div>
//       )
//     },
//     {
//       field: "author_name",
//       label: "Author",
//       searchable: true,
//       render: (val) => <span className="text-secondary">{val}</span>
//     },
//     {
//       field: "publisher_name",
//       label: "Publisher",
//       searchable: true
//     },
//     {
//       field: "category_name",
//       label: "Category",
//       searchable: true
//     },
//     {
//       field: "vendor_name",
//       label: "Vendor",
//       searchable: true,
//       render: (val) => val || <span className="text-muted">N/A</span>
//     },
//     {
//       field: "total_copies",
//       label: "Total",
//       align: "center"
//     },
//     {
//       field: "available_copies",
//       label: "Available",
//       align: "center"
//     },
//     {
//       field: "issued_copies",
//       label: "Issued",
//       align: "center"
//     },
//     {
//       field: "lost_damaged_copies",
//       label: "Lost/Damaged",
//       align: "center"
//     },
//     {
//       field: "status",
//       label: "Status",
//       align: "center"
//     },
//   ];

//   const fetchInventoryReport = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const bookApi = new DataApi("book");
//       const response = await bookApi.fetchInventoryReport();
//       const dataWithIds = (response.data || []).map((item, index) => ({
//         ...item,
//         id: item.id || index
//       }));
//       setReportData(dataWithIds);
//     } catch (err) {
//       setError("Failed to load inventory report. Please try again.");
//       console.error("Inventory fetch error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchVendors = async () => {
//     try {
//       const vendorApi = new DataApi("vendor");
//       const response = await vendorApi.fetchAll();
//       const vendorList = (response.data || [])
//         .filter(vendor => vendor.status === true)
//         .map(vendor => vendor.vendor_name || vendor.name)
//         .filter(Boolean);
//       setVendors(vendorList);
//     } catch (err) {
//       console.error("Failed to load vendors:", err);
//     }
//   };

//   useEffect(() => {
//     fetchInventoryReport();
//     fetchVendors();
//   }, []);

//   const handleSelectionChange = (selectedIds) => setSelectedRows(selectedIds);

//   const categories = useMemo(() => {
//     return [...new Set(reportData.map(item => item.category_name).filter(Boolean))];
//   }, [reportData]);

//   const filteredData = useMemo(() => {
//     return reportData.filter((row) => {
//       const matchesSearch = searchTerm === "" || columns.some((col) =>
//         col.searchable && String(row[col.field] || "").toLowerCase().includes(searchTerm.toLowerCase())
//       );

//       const matchesVendor = vendorFilter === "All Vendors" || row.vendor_name === vendorFilter;
//       const matchesCategory = categoryFilter === "All Categories" || row.category_name === categoryFilter;

//       let matchesStatus = true;
//       if (statusFilter === "Available") {
//         matchesStatus = row.available_copies > 0;
//       } else if (statusFilter === "Out of Stock") {
//         matchesStatus = row.available_copies === 0;
//       } else if (statusFilter === "Low Stock") {
//         matchesStatus = row.available_copies > 0 && (row.available_copies / row.total_copies) < 0.3;
//       }

//       return matchesSearch && matchesVendor && matchesCategory && matchesStatus;
//     });
//   }, [searchTerm, reportData, vendorFilter, categoryFilter, statusFilter]);

//   const statistics = useMemo(() => {
//     const data = filteredData.length > 0 ? filteredData : reportData;
//     return {
//       totalBooks: data.reduce((sum, item) => sum + (parseInt(item.total_copies) || 0), 0),
//       availableBooks: data.reduce((sum, item) => sum + (parseInt(item.available_copies) || 0), 0),
//       issuedBooks: data.reduce((sum, item) => sum + (parseInt(item.issued_copies) || 0), 0),
//       lostDamaged: data.reduce((sum, item) => sum + (parseInt(item.lost_damaged_copies) || 0), 0),
//       uniqueTitles: data.length,
//       lowStockCount: data.filter(item => {
//         const percent = (item.available_copies / item.total_copies) * 100;
//         return percent > 0 && percent < 30;
//       }).length,
//       outOfStockCount: data.filter(item => item.available_copies === 0).length,
//     };
//   }, [filteredData, reportData]);

//   const chartData = useMemo(() => {
//     const dataToAggregate = vendorFilter === "All Vendors"
//       ? reportData
//       : reportData.filter(item => item.vendor_name === vendorFilter);

//     const aggregation = dataToAggregate.reduce((acc, item) => {
//       const key = item[chartGroupBy] || "Unknown";
//       if (!acc[key]) {
//         acc[key] = { name: key, total: 0, available: 0, issued: 0, damaged: 0 };
//       }
//       acc[key].total += parseInt(item.total_copies || 0);
//       acc[key].available += parseInt(item.available_copies || 0);
//       acc[key].issued += parseInt(item.issued_copies || 0);
//       acc[key].damaged += parseInt(item.lost_damaged_copies || 0);
//       return acc;
//     }, {});

//     return Object.values(aggregation)
//       .sort((a, b) => b.total - a.total)
//       .slice(0, 10);
//   }, [reportData, chartGroupBy, vendorFilter]);

//   const statusDistribution = useMemo(() => {
//     return [
//       { name: 'Available', value: statistics.availableBooks, color: '#28a745' },
//       { name: 'Issued', value: statistics.issuedBooks, color: '#007bff' },
//       { name: 'Lost/Damaged', value: statistics.lostDamaged, color: '#dc3545' },
//     ];
//   }, [statistics]);


//   const exportFile = (type) => {
//     const dataToExport = selectedRows.length > 0
//       ? filteredData.filter(row => selectedRows.includes(row.id))
//       : filteredData;

//     if (dataToExport.length === 0) {
//       alert("No data to export!");
//       return;
//     }

//     const headers = columns.map(col => col.label);
//     const exportData = dataToExport.map(row =>
//       columns.map(col => {
//         if (col.field === 'status') {
//           return row.available_copies > 0 ? 'Available' : 'Out of Stock';
//         }
//         return row[col.field] || "N/A";
//       })
//     );

//     if (type === "csv") {
//       const csvContent = [headers, ...exportData].map(e => e.join(",")).join("\n");
//       const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//       const link = document.createElement("a");
//       link.href = URL.createObjectURL(blob);
//       link.download = `Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`;
//       link.click();
//     } else if (type === "excel") {
//       const excelData = dataToExport.map(row => {
//         const rowData = {};
//         columns.forEach(col => {
//           if (col.field === 'status') {
//             rowData[col.label] = row.available_copies > 0 ? 'Available' : 'Out of Stock';
//           } else {
//             rowData[col.label] = row[col.field] || "N/A";
//           }
//         });
//         return rowData;
//       });

//       const worksheet = XLSX.utils.json_to_sheet(excelData);
//       const workbook = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
//       XLSX.writeFile(workbook, `Inventory_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
//     } else if (type === "pdf") {
//       const doc = new jsPDF("landscape");

//       doc.setFontSize(18);
//       doc.setTextColor(17, 67, 155);
//       doc.text("Book Inventory Report", 14, 20);

//       doc.setFontSize(10);
//       doc.setTextColor(100);
//       doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
//       doc.text(`Total Records: ${dataToExport.length}`, 14, 34);

//       doc.setFontSize(11);
//       doc.setTextColor(0);
//       doc.text(`Total Copies: ${statistics.totalBooks} | Available: ${statistics.availableBooks} | Issued: ${statistics.issuedBooks}`, 14, 42);

//       doc.autoTable({
//         head: [headers],
//         body: exportData,
//         startY: 48,
//         styles: { fontSize: 8, cellPadding: 2 },
//         headStyles: { fillColor: [17, 67, 155], textColor: 255 },
//         alternateRowStyles: { fillColor: [245, 245, 245] },
//       });

//       doc.save(`Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`);
//     }


//   };

//   const resetFilters = () => {
//     setSearchTerm("");
//     setVendorFilter("All Vendors");
//     setStatusFilter("All Status");
//     setCategoryFilter("All Categories");
//     setSelectedRows([]);
//   };

//   if (loading) {
//     return (
//       <div className="text-center p-5">
//         <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
//         <div className="mt-3 text-muted">Loading inventory data...</div>
//       </div>
//     );
//   }

//   return (
//     <>
//       <Card className="border-0 shadow-sm ">

//         <Card.Header className="py-2 bg-light mt-3 border-0 px-4" >
//           <Row className="align-items-center px-3">

//             <Col md={6} className="d-flex align-items-center gap-3">

//               <button
//                 onClick={() => navigate('/reports')}
//                 className="shadow-sm d-flex align-items-center justify-content-center custom-btn-back"
//               >
//                 <i className="fa-solid fa-arrow-left"></i>
//               </button>


//               <div>
//                 <h4 className="mb-0 fw-bold" style={{ color: "var(--primary-color)" }}>
//                   Book Inventory
//                 </h4>
//                 {/* <small className="text-muted">Manage and analyze your book stock</small> */}
//               </div>

//             </Col>

//             {/* RIGHT SECTION */}
//             <Col md={6} className="text-end">
//               <Dropdown align="end">
//                 <Dropdown.Toggle variant="light" size="sm" id="options-dropdown">
//                   <i className="fa fa-bars me-1" /> Options
//                 </Dropdown.Toggle>

//                 <Dropdown.Menu className="shadow-sm border-0 mt-2">
//                   <Dropdown.Header className="small text-uppercase fw-bold text-muted">
//                     View Mode
//                   </Dropdown.Header>

//                   <Dropdown.Item
//                     active={viewMode === 'table'}
//                     onClick={() => setViewMode('table')}
//                   >
//                     <i className="fa fa-table me-2" /> Table
//                   </Dropdown.Item>

//                   <Dropdown.Item
//                     active={viewMode === 'dashboard'}
//                     onClick={() => setViewMode('dashboard')}
//                   >
//                     <i className="fa fa-chart-pie me-2" /> Dashboard
//                   </Dropdown.Item>

//                   <Dropdown.Item
//                     active={viewMode === 'chart'}
//                     onClick={() => setViewMode('chart')}
//                   >
//                     <i className="fa fa-chart-bar me-2" /> Analytics
//                   </Dropdown.Item>

//                   <Dropdown.Divider />

//                   <Dropdown.Header className="small text-uppercase fw-bold text-muted">
//                     Export Options
//                   </Dropdown.Header>

//                   <Dropdown.Item onClick={() => exportFile("excel")}>
//                     <i className="fa-solid fa-file-excel me-2 text-success" /> Excel
//                   </Dropdown.Item>

//                   <Dropdown.Item onClick={() => exportFile("csv")}>
//                     <i className="fa-solid fa-file-csv me-2 text-info" /> CSV
//                   </Dropdown.Item>

//                   <Dropdown.Item onClick={() => exportFile("pdf")}>
//                     <i className="fa-solid fa-file-pdf me-2 text-danger" /> PDF
//                   </Dropdown.Item>
//                 </Dropdown.Menu>
//               </Dropdown>
//             </Col>

//           </Row>
//         </Card.Header>


//         <Card.Body className="p-4">
//           {error && (
//             <Alert variant="danger" dismissible onClose={() => setError(null)}>
//               <i className="fa fa-exclamation-circle me-2" />
//               {error}
//             </Alert>
//           )}
//           {/* <Row className="g-3 mb-4">
//             <Col md={3} sm={6}>
//               <Card className="border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #007bff' }}>
//                 <Card.Body>
//                   <div className="d-flex justify-content-between align-items-center">
//                     <div>
//                       <small className="text-muted text-uppercase">Total Copies</small>
//                       <h3 className="mb-0 fw-bold text-primary">{statistics.totalBooks.toLocaleString()}</h3>
//                     </div>
//                     <div className="bg-primary bg-opacity-10 rounded-circle p-3">
//                       <i className="fa fa-book text-primary" style={{ fontSize: '24px' }} />
//                     </div>
//                   </div>
//                   <small className="text-muted">{statistics.uniqueTitles} unique titles</small>
//                 </Card.Body>
//               </Card>
//             </Col>
            
//             <Col md={3} sm={6}>
//               <Card className="border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #28a745' }}>
//                 <Card.Body>
//                   <div className="d-flex justify-content-between align-items-center">
//                     <div>
//                       <small className="text-muted text-uppercase">Available</small>
//                       <h3 className="mb-0 fw-bold text-success">{statistics.availableBooks.toLocaleString()}</h3>
//                     </div>
//                     <div className="bg-success bg-opacity-10 rounded-circle p-3">
//                       <i className="fa fa-check-circle text-success" style={{ fontSize: '24px' }} />
//                     </div>
//                   </div>
//                   <small className="text-muted">
//                     {((statistics.availableBooks / statistics.totalBooks) * 100).toFixed(1)}% of total
//                   </small>
//                 </Card.Body>
//               </Card>
//             </Col>
            
//             <Col md={3} sm={6}>
//               <Card className="border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #ffc107' }}>
//                 <Card.Body>
//                   <div className="d-flex justify-content-between align-items-center">
//                     <div>
//                       <small className="text-muted text-uppercase">Issued</small>
//                       <h3 className="mb-0 fw-bold text-warning">{statistics.issuedBooks.toLocaleString()}</h3>
//                     </div>
//                     <div className="bg-warning bg-opacity-10 rounded-circle p-3">
//                       <i className="fa fa-hand-holding text-warning" style={{ fontSize: '24px' }} />
//                     </div>
//                   </div>
//                   <small className="text-muted">{statistics.lowStockCount} low stock items</small>
//                 </Card.Body>
//               </Card>
//             </Col>
            
//             <Col md={3} sm={6}>
//               <Card className="border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #dc3545' }}>
//                 <Card.Body>
//                   <div className="d-flex justify-content-between align-items-center">
//                     <div>
//                       <small className="text-muted text-uppercase">Lost/Damaged</small>
//                       <h3 className="mb-0 fw-bold text-danger">{statistics.lostDamaged.toLocaleString()}</h3>
//                     </div>
//                     <div className="bg-danger bg-opacity-10 rounded-circle p-3">
//                       <i className="fa fa-exclamation-triangle text-danger" style={{ fontSize: '24px' }} />
//                     </div>
//                   </div>
//                   <small className="text-muted">{statistics.outOfStockCount} out of stock</small>
//                 </Card.Body>
//               </Card>
//             </Col>
//           </Row> */}

//           {viewMode === "table" && (
//             <>
//               <Card className="border-0 bg-light mb-3">
//                 <Card.Body>
//                   <Row className="g-3 align-items-end">

//                     <Col xs={12} md={2}>
//                       <div style={labelStyle}>
//                         <i className={"fa-solid fa-magnifying-glass"}></i>
//                         <span>Search</span>
//                       </div>
//                       <Form.Control
//                         type="text"
//                         className="filter-input"
//                         style={inputBaseStyle}
//                         placeholder={`Search by book, author...`}
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                       />
//                     </Col>
//                     <Col xs={12} md={2}>
//                       <div style={labelStyle}>
//                         <i className={"fa-solid fa-filter"}></i>
//                         <span>Vendor</span>
//                       </div>
//                       <Form.Select
//                         className="small text-muted"
//                         style={{
//                           ...inputBaseStyle,
//                           color: vendorFilter ? '#212529' : '#6c757d',
//                           cursor: 'pointer',
//                           paddingRight: '2.5rem',
//                           appearance: 'none',
//                           backgroundRepeat: 'no-repeat',
//                           backgroundPosition: 'right 0.75rem center',
//                           backgroundSize: '16px 12px'
//                         }}
//                         value={vendorFilter}
//                         onChange={(e) => setVendorFilter(e.target.value)}
//                       >
//                         <option value="">All Vendors</option>
//                         {vendors.map((opt, i) => (
//                           <option className="color-dark" key={i} value={opt.vendor}>{opt}</option>
//                         ))}
//                       </Form.Select>
//                     </Col>

//                     <Col xs={12} md={2}>
//                       <div style={labelStyle}>
//                         <i className={"fa-solid fa-filter"}></i>
//                         <span>Category</span>
//                       </div>
//                       <Form.Select
//                         className="small text-muted"
//                         style={{
//                           ...inputBaseStyle,
//                           color: categoryFilter ? '#212529' : '#6c757d',
//                           cursor: 'pointer',
//                           paddingRight: '2.5rem',
//                           appearance: 'none',
//                           backgroundRepeat: 'no-repeat',
//                           backgroundPosition: 'right 0.75rem center',
//                           backgroundSize: '16px 12px'
//                         }}
//                         value={categoryFilter}
//                         onChange={(e) => setCategoryFilter(e.target.value)}
//                       >
//                         <option value="">All Categories</option>
//                         {categories.map((opt, i) => (
//                           <option className="color-dark" key={i} value={opt.vendor}>{opt}</option>
//                         ))}
//                       </Form.Select>
//                     </Col>

//                     {/* <Col xs={12} md={2}>
//                      <div style={labelStyle}>
//                         <i className={ "fa-solid fa-filter"}></i>
//                         <span>Status</span>
//                       </div>
//                       <Form.Select
//                         className="small text-muted"
//                         style={{
//                           ...inputBaseStyle,
//                           color: categoryFilter ? '#212529' : '#6c757d',
//                           cursor: 'pointer',
//                           paddingRight: '2.5rem',
//                           appearance: 'none',
//                           backgroundRepeat: 'no-repeat',
//                           backgroundPosition: 'right 0.75rem center',
//                           backgroundSize: '16px 12px'
//                         }}
//                         value={statusFilter}
//                         onChange={(e) => setStatusFilter(e.target.value)}
//                       >
//                           <option value="All Status">All Status</option>
//                           <option value="Available">Available</option>
//                           <option value="Low Stock">Low Stock</option>
//                           <option value="Out of Stock">Out of Stock</option>
//                       </Form.Select>
                      
//                     </Col> */}

//                     <Button
//                       variant="light"
//                       onClick={resetFilters}
//                       tooltip="Clear all filters"
//                       className="filter-clear-btn d-flex align-items-center justify-content-center"
//                       style={{
//                         width: '44px',
//                         height: '44px',
//                         borderRadius: '8px',
//                         border: '1.5px solid #dee2e6',
//                         padding: 0,
//                         backgroundColor: '#fff',
//                         transition: 'all 0.2s ease',
//                         cursor: 'pointer'
//                       }}
//                     >
//                       {/* <i className="fa-solid fa-xmark" style={{ fontSize: '1.25rem', color: '#6c757d' }}></i> */}
//                       <i className="fa-solid fa-undo" style={{ fontSize: '1.25rem', color: '#6c757d' }}> </i>
//                     </Button>

//                   </Row>
//                 </Card.Body>
//               </Card>

//               <div className="table-responsive border rounded shadow-sm">
//                 <ResizableTable
//                   data={filteredData}
//                   columns={columns}
//                   loading={loading}
//                   currentPage={currentPage}
//                   recordsPerPage={rowsPerPage}
//                   onPageChange={setCurrentPage}
//                   showSerialNumber={true}
//                   showCheckbox={true}
//                   showActions={false}
//                   selectedItems={selectedRows}
//                   onSelectionChange={handleSelectionChange}
//                 />
//               </div>
//             </>
//           )}

//           {viewMode === "dashboard" && (
//             <Row className="g-4">
//               <Col md={8}>
//                 <Card className="border-0 shadow-sm h-100">
//                   <Card.Header className="bg-white border-bottom">
//                     <div className="d-flex justify-content-between align-items-center">
//                       <h6 className="mb-0 fw-bold">Inventory Overview</h6>
//                       <Form.Select
//                         size="sm"
//                         value={chartGroupBy}
//                         onChange={(e) => setChartGroupBy(e.target.value)}
//                         style={{ width: 'auto' }}
//                       >
//                         <option value="category_name">By Category</option>
//                         <option value="publisher_name">By Publisher</option>
//                         <option value="author_name">By Author</option>
//                         <option value="vendor_name">By Vendor</option>
//                       </Form.Select>
//                     </div>
//                   </Card.Header>
//                   <Card.Body>
//                     <ResponsiveContainer width="100%" height={350}>
//                       <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
//                         <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                         <XAxis
//                           dataKey="name"
//                           angle={-45}
//                           textAnchor="end"
//                           interval={0}
//                           height={80}
//                           tick={{ fontSize: 11 }}
//                         />
//                         <YAxis tick={{ fontSize: 11 }} />
//                         <RechartsTooltip
//                           contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0' }}
//                         />
//                         <Legend
//                           verticalAlign="top"
//                           wrapperStyle={{ paddingBottom: '20px' }}
//                         />
//                         <Bar dataKey="total" name="Total Stock" fill="#667eea" radius={[8, 8, 0, 0]} />
//                         <Bar dataKey="available" name="Available" fill="#28a745" radius={[8, 8, 0, 0]} />
//                         <Bar dataKey="issued" name="Issued" fill="#007bff" radius={[8, 8, 0, 0]} />
//                       </BarChart>
//                     </ResponsiveContainer>
//                   </Card.Body>
//                 </Card>
//               </Col>

//               <Col md={4}>
//                 <Card className="border-0 shadow-sm h-100">
//                   <Card.Header className="bg-white border-bottom">
//                     <h6 className="mb-0 fw-bold">Status Distribution</h6>
//                   </Card.Header>
//                   <Card.Body className="d-flex align-items-center justify-content-center">
//                     <ResponsiveContainer width="100%" height={300}>
//                       <PieChart>
//                         <Pie
//                           data={statusDistribution}
//                           cx="50%"
//                           cy="50%"
//                           labelLine={false}
//                           label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
//                           outerRadius={90}
//                           fill="#8884d8"
//                           dataKey="value"
//                         >
//                           {statusDistribution.map((entry, index) => (
//                             <Cell key={`cell-${index}`} fill={entry.color} />
//                           ))}
//                         </Pie>
//                         <RechartsTooltip />
//                       </PieChart>
//                     </ResponsiveContainer>
//                   </Card.Body>
//                 </Card>
//               </Col>

//               <Col md={12}>
//                 <Card className="border-0 shadow-sm">
//                   <Card.Header className="bg-white border-bottom">
//                     <h6 className="mb-0 fw-bold">Quick Insights</h6>
//                   </Card.Header>
//                   <Card.Body>
//                     <Row className="g-3">
//                       <Col md={4}>
//                         <Alert variant="warning" className="mb-0">
//                           <i className="fa fa-exclamation-triangle me-2" />
//                           <strong>{statistics.lowStockCount}</strong> books are running low on stock
//                         </Alert>
//                       </Col>
//                       <Col md={4}>
//                         <Alert variant="danger" className="mb-0">
//                           <i className="fa fa-ban me-2" />
//                           <strong>{statistics.outOfStockCount}</strong> books are completely out of stock
//                         </Alert>
//                       </Col>
//                       <Col md={4}>
//                         <Alert variant="info" className="mb-0">
//                           <i className="fa fa-percent me-2" />
//                           <strong>{((statistics.issuedBooks / statistics.totalBooks) * 100).toFixed(1)}%</strong> utilization rate
//                         </Alert>
//                       </Col>
//                     </Row>
//                   </Card.Body>
//                 </Card>
//               </Col>
//             </Row>
//           )}

//           {viewMode === "chart" && (
//             <Row className="g-4">
//               <Col md={12}>
//                 <Card className="border-0 shadow-sm">
//                   <Card.Header className="bg-white border-bottom">
//                     <Row className="align-items-center">
//                       <Col>
//                         <h6 className="mb-0 fw-bold">Analytics View</h6>
//                       </Col>
//                       <Col className="text-end">
//                         <ButtonGroup size="sm">
//                           <Button
//                             variant={chartType === 'bar' ? 'primary' : 'outline-primary'}
//                             onClick={() => setChartType('bar')}
//                           >
//                             <i className="fa fa-bar-chart" /> Bar
//                           </Button>
//                           <Button
//                             variant={chartType === 'line' ? 'primary' : 'outline-primary'}
//                             onClick={() => setChartType('line')}
//                           >
//                             <i className="fa fa-line-chart" /> Line
//                           </Button>
//                         </ButtonGroup>
//                         <Form.Select
//                           size="sm"
//                           value={chartGroupBy}
//                           onChange={(e) => setChartGroupBy(e.target.value)}
//                           className="ms-2"
//                           style={{ width: 'auto', display: 'inline-block' }}
//                         >
//                           <option value="category_name">By Category</option>
//                           <option value="publisher_name">By Publisher</option>
//                           <option value="author_name">By Author</option>
//                           <option value="vendor_name">By Vendor</option>
//                         </Form.Select>
//                       </Col>
//                     </Row>
//                   </Card.Header>
//                   <Card.Body>
//                     <ResponsiveContainer width="100%" height={450}>
//                       {chartType === 'bar' ? (
//                         <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
//                           <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                           <XAxis
//                             dataKey="name"
//                             angle={-45}
//                             textAnchor="end"
//                             interval={0}
//                             height={100}
//                             tick={{ fontSize: 11 }}
//                           />
//                           <YAxis />
//                           <RechartsTooltip
//                             contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0' }}
//                           />
//                           <Legend />
//                           <Bar dataKey="total" name="Total" fill="#667eea" radius={[6, 6, 0, 0]} />
//                           <Bar dataKey="available" name="Available" fill="#28a745" radius={[6, 6, 0, 0]} />
//                           <Bar dataKey="issued" name="Issued" fill="#007bff" radius={[6, 6, 0, 0]} />
//                           <Bar dataKey="damaged" name="Lost/Damaged" fill="#dc3545" radius={[6, 6, 0, 0]} />
//                         </BarChart>
//                       ) : (
//                         <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
//                           <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                           <XAxis
//                             dataKey="name"
//                             angle={-45}
//                             textAnchor="end"
//                             interval={0}
//                             height={100}
//                             tick={{ fontSize: 11 }}
//                           />
//                           <YAxis />
//                           <RechartsTooltip
//                             contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0' }}
//                           />
//                           <Legend />
//                           <Line type="monotone" dataKey="total" name="Total" stroke="#667eea" strokeWidth={2} />
//                           <Line type="monotone" dataKey="available" name="Available" stroke="#28a745" strokeWidth={2} />
//                           <Line type="monotone" dataKey="issued" name="Issued" stroke="#007bff" strokeWidth={2} />
//                           <Line type="monotone" dataKey="damaged" name="Lost/Damaged" stroke="#dc3545" strokeWidth={2} />
//                         </LineChart>
//                       )}
//                     </ResponsiveContainer>
//                     <div className="text-center mt-3">
//                       <small className="text-muted">Showing top 10 {chartGroupBy.replace('_', ' ')} by total volume</small>
//                     </div>
//                   </Card.Body>
//                 </Card>
//               </Col>
//             </Row>
//           )}
//         </Card.Body>
//       </Card>


//     </>
//   );
// };

// export default BookInventoryReport;

// // import React, { useState, useEffect, useMemo } from "react";
// // import { Card, Button, Spinner, Row, Col, Form, InputGroup, Dropdown } from "react-bootstrap";
// // import DataApi from "../../api/dataApi";
// // import * as XLSX from "xlsx";
// // import jsPDF from "jspdf";
// // import "jspdf-autotable";
// // import ResizableTable from "../common/ResizableTable";

// // const BookInventoryReport = () => {
// //   const [reportData, setReportData] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);
// //   const [searchTerm, setSearchTerm] = useState("");

// //    const [selectedRows, setSelectedRows] = useState([]);

// //   // Pagination State
// //   const [currentPage, setCurrentPage] = useState(1);
// //   const [rowsPerPage, setRowsPerPage] = useState(10);

// //   // 1. DYNAMIC COLUMN CONFIGURATION
// //   const columns = [
// //     //checkbox and serial number will be handled by ResizableTable component
// //     { field: "book_title", label: "Book Title", searchable: true },
// //     { field: "author_name", label: "Author", searchable: true },
// //     { field: "publisher_name", label: "Publisher", searchable: true },
// //     { field: "category_name", label: "Category", searchable: true },
// //     { field: "total_copies", label: "Total", align: "center" },
// //     { field: "available_copies", label: "Available", align: "center", className: "text-success fw-bold" },
// //     { field: "issued_copies", label: "Issued", align: "center", className: "text-primary" },
// //     { field: "lost_damaged_copies", label: "Lost", align: "center", className: "text-danger" },
// //     { 
// //       field: "status", 
// //       label: "Status",
// //       render: (val) => (
// //         <span className={`badge rounded-pill ${val === "Available" ? "bg-success" : "bg-warning text-dark"}`}>
// //           {val || "N/A"}
// //         </span>
// //       )
// //     },
// //     { field: "issued_to", label: "Issued To" },
// //   ];

// //   const fetchInventoryReport = async () => {
// //     try {
// //       setLoading(true);
// //       const bookApi = new DataApi("book");
// //       const response = await bookApi.fetchInventoryReport();
// //       //   setReportData(Array.isArray(response?.data) ? response.data : []);
// //       const dataWithIds = (response.data || []).map((item, index) => ({ ...item,id:item.id || index })); // Ensure each item has a unique 'id' field
// //       setReportData(dataWithIds);
// //     } catch (err) {
// //       setError("Failed to load inventory report.");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   useEffect(() => { fetchInventoryReport(); }, []);

// //   //Handler for Checkboxes
// //   const handleSelectionChange = (selectedIds) => {
// //     setSelectedRows(selectedIds);
// //   }

// //   // 2. DYNAMIC FILTERING LOGIC
// //   const filteredData = useMemo(() => {
// //     return reportData.filter((row) =>
// //       columns.some((col) => 
// //         col.searchable && String(row[col.field] || "").toLowerCase().includes(searchTerm.toLowerCase())
// //       )
// //     );
// //   }, [searchTerm, reportData]);

// //   // 3. EXPORT LOGIC (Always exports all FILTERED data, not just current page)
// //   const exportFile = (type) => {

// //      if (selectedRows.length === 0) {
// //       alert("Please select at least one record to export.");
// //       return;
// //     }

// //     // Get the full row objects for selected IDs
// //     const selectedRowObjects = filteredData.filter(row => selectedRows.includes(row.id));

// //     const headers = columns.map(col => col.label);
// //     const exportData = selectedRowObjects.map(row => columns.map(col => row[col.field] || "N/A"));

// //     if (type === "csv") {
// //       const csvContent = [headers, ...exportData].map(e => e.join(",")).join("\n");
// //       const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
// //       const link = document.createElement("a");
// //       link.href = URL.createObjectURL(blob);
// //       link.download = "Inventory_Report.csv";
// //       link.click();
// //     } 
// //     else if (type === "excel") {
// //       const cleanData = selectedRowObjects.map(({id, ...rest}) => rest); // Remove 'id' field
// //       const worksheet = XLSX.utils.json_to_sheet(cleanData);
// //       const workbook = XLSX.utils.book_new();
// //       XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
// //       XLSX.writeFile(workbook, "Inventory_Report.xlsx");
// //     } 
// //     else if (type === "pdf") {
// //       const doc = new jsPDF("landscape");
// //       doc.text("Inventory Report", 14, 15);
// //       doc.autoTable({ head: [headers], body: exportData, startY: 20 });
// //       doc.save("Inventory_Report.pdf");
// //     }
// //   };

// //   if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

// //   return (
// //     <Card className="border-0 shadow-sm">
// //       <Card.Header className="bg-white py-3 border-bottom-0">
// //         <Row className="g-3 align-items-center">
// //           <Col md={4}>
// //             <h5 className="mb-0 fw-bold" style={{color: "var(--primary-color)"}}>Book Inventory Report</h5>
// //             {selectedRows.length > 0 && (
// //                 <small className="text-primary">{selectedRows.length} items selected</small>
// //             )}
// //           </Col>
// //           <Col md={8} className="d-flex justify-content-md-end gap-2">
// //             <Button variant="outline-primary" size="sm" onClick={fetchInventoryReport}><i className="fa fa-refresh" /></Button>
// //             {/* <Button variant="success" size="sm" onClick={() => exportFile("excel")}><i className="fa-solid fa-file-excel me-1" /> Excel</Button>
// //             <Button variant="info" size="sm" onClick={() => exportFile("csv")}><i className="fa-solid fa-file-csv me-1" /> CSV</Button>
// //             <Button variant="danger" size="sm" onClick={() => exportFile("pdf")}><i className="fa-solid fa-file-pdf me-1" /> PDF</Button> */}

// //             <Dropdown align="end">
// //                 <Dropdown.Toggle variant="outline-secondary" size="sm" id="dropdown-actions"
// //                     className="d-flex align-items-center rounded-2 px-3"
// //                     style={{ border: '1px solid #ced4da', color: '#212529' }}
// //                  >
// //                 Actions
// //                 </Dropdown.Toggle>
// //                 <Dropdown.Menu className="shadow-sm border-0 mt-2">
// //                     <Dropdown.Header className="small text-uppercase fw-bold text-muted">Export Data</Dropdown.Header>

// //                     <Dropdown.Item onClick={() => exportFile("excel")} className="py-2">
// //                         <i className="fa-solid fa-file-excel me-2 text-success" />Excel
// //                     </Dropdown.Item>

// //                     <Dropdown.Item onClick={() => exportFile("csv")} className="py-2">
// //                         <i className="fa-solid fa-file-csv me-2 text-info" />CSV
// //                     </Dropdown.Item>
// //                     {/* <Dropdown.Divider /> */}
// //                     <Dropdown.Item onClick={() => exportFile("pdf")} className="py-2 text-danger">
// //                     <i className="fa-solid fa-file-pdf me-2" />PDF
// //                     </Dropdown.Item>
// //                 </Dropdown.Menu>
// //           </Dropdown>
// //           </Col>
// //         </Row>
// //       </Card.Header>

// //       <Card.Body>
// //         {/* <Row className="mb-3">
// //           <Col md={4}>
// //             <InputGroup size="sm">
// //               <InputGroup.Text className="bg-white"><i className="fa fa-search text-muted" /></InputGroup.Text>
// //               <Form.Control 
// //                 placeholder="Search across columns..." 
// //                 onChange={(e) => setSearchTerm(e.target.value)} 
// //               />
// //             </InputGroup>
// //           </Col>
// //         </Row> */}

// //         <div className="table-responsive border rounded">
// //           <ResizableTable
// //             data={filteredData}
// //             columns={columns}
// //             loading={loading}
// //             currentPage={currentPage}
// //             recordsPerPage={rowsPerPage}
// //             onPageChange={setCurrentPage}
// //             showSerialNumber={true}
// //             showActions={false}
// //             showCheckbox={true}
// //             selectedItems={selectedRows}
// //             onSelectionChange={handleSelectionChange}
// //           />
// //         </div>
// //       </Card.Body>
// //     </Card>
// //   );
// // };

// // export default BookInventoryReport;



// import React, { useState, useEffect, useMemo } from "react";
// import { Card, Button, Spinner, Row, Col, Form, InputGroup, Dropdown, ButtonGroup } from "react-bootstrap";
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
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
//   const [selectedRows, setSelectedRows] = useState([]);
//   const [vendors, setVendors] = useState([]);

//   const [columnFilters, setColumnFilters] = useState({});

//   const [viewMode, setViewMode] = useState("table");
//   const [chartGroupBy, setChartGroupBy] = useState("category_name");
//   const [vendorFilter, setVendorFilter] = useState("All Vendors");

//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(10);

//   const columns = [
//     { field: "book_title", label: "Book Title", searchable: true },
//     { field: "author_name", label: "Author", searchable: true },
//     { field: "publisher_name", label: "Publisher", searchable: true },
//     { field: "category_name", label: "Category", searchable: true },
//     { field: "total_copies", label: "Total", align: "center" },
//     { field: "available_copies", label: "Available", align: "center", className: "text-success fw-bold" },
//     { field: "issued_copies", label: "Issued", align: "center", className: "text-primary" },
//     { 
//       field: "status", 
//       label: "Status",
//       render: (val) => (
//         <span className={`badge rounded-pill ${val === "Available" ? "bg-success" : "bg-warning text-dark"}`}>
//           {val || "N/A"}
//         </span>
//       )
//     },
//   ];

//   const fetchInventoryReport = async () => {
//     try {
//       setLoading(true);
//       const bookApi = new DataApi("book");
//       const response = await bookApi.fetchInventoryReport();
//       const dataWithIds = (response.data || []).map((item, index) => ({ ...item, id: item.id || index }));
//       setReportData(dataWithIds);
//     } catch (err) {
//       setError("Failed to load inventory report.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchVendors = async () => {
//     try {
//       const vendorApi = new DataApi("vendor");
//       console.log("Fetching vendors...", vendorApi);
//       const response = await vendorApi.fetchAll();
//       console.log("Vendors fetched:", response.data);
//       //in filter give only active vendors names  



//      const vendorList = (response.data || [])
//       .filter(vendor => vendor.status === true)   // keep only active
//       .map(vendor => vendor.vendor_name || vendor.name) // pick correct field
//       .filter(Boolean); // remove null/empty

//       console.log("Processed vendor list:", vendorList);
//       setVendors(vendorList);
//     } catch (err) {
//       console.error("Failed to load vendors.", err);
//     }
//   };

//   useEffect(() => { 
//     fetchInventoryReport();
//     fetchVendors();
//   }, []);

//   const handleSelectionChange = (selectedIds) => setSelectedRows(selectedIds);

//   const filteredData = useMemo(() => {
//     return reportData.filter((row) => {
//       // Filter by search term
//       const matchesSearch = columns.some((col) => 
//         col.searchable && String(row[col.field] || "").toLowerCase().includes(searchTerm.toLowerCase())
//       );

//       // Filter by vendor
//       const matchesVendor = vendorFilter === "All Vendors" || row.vendor_name === vendorFilter;

//       return matchesSearch && matchesVendor;
//     });
//   }, [searchTerm, reportData, vendorFilter]);
//   // --- CHART LOGIC ---
//   const chartData = useMemo(() => {
//     const aggregation = reportData.reduce((acc, item) => {
//       const key = item[chartGroupBy] || "Unknown";
//       if (!acc[key]) {
//         acc[key] = { name: key, total: 0, available: 0, issued: 0 };
//       }
//       acc[key].total += parseInt(item.total_copies || 0);
//       acc[key].available += parseInt(item.available_copies || 0);
//       acc[key].issued += parseInt(item.issued_copies || 0);
//       return acc;
//     }, {});

//     return Object.values(aggregation).sort((a, b) => b.total - a.total).slice(0, 10); 
//   }, [reportData, chartGroupBy]);

//   //Dynamic Export Logic

//   const exportFile = (type) => {
//     // if (selectedRows.length === 0) {
//     //   alert("Please select at least one record to export.");
//     //   return;
//     // }
//     // const selectedRowObjects = filteredData.filter(row => selectedRows.includes(row.id));
//     const dataToExport = selectedRows.length > 0 ? filteredData.filter(row => selectedRows.includes(row.id)) : filteredData;
//     const headers = columns.map(col => col.label);
//     const exportData = dataToExport.map(row => columns.map(col => row[col.field] || "N/A"));

//     if (type === "csv") {
//         const csvContent = [headers, ...exportData].map(e => e.join(",")).join("\n");
//         const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//         const link = document.createElement("a");
//         link.href = URL.createObjectURL(blob);
//         link.download = "Inventory_Report.csv";
//         link.click();
//     } else if (type === "excel") {

//         const excelData  = dataToExport.map(row =>{
//             const rowData = {};
//             columns.forEach(col => {
//                 rowData[col.label] = row[col.field] || "N/A";
//             });
//             return rowData;
//         }) 


//         const worksheet = XLSX.utils.json_to_sheet(excelData);
//         const workbook = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
//         XLSX.writeFile(workbook, "Inventory_Report.xlsx");
//     } else if (type === "pdf") {
//         const doc = new jsPDF("landscape");
//         doc.text("Inventory Report", 14, 15);
//         doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);
//         doc.autoTable({ head: [headers], body: exportData, startY: 30  });
//         doc.setFontSize(10);
//         doc.setFontSize(16);
//         doc.save("Inventory_Report.pdf");
//     }
//   };

//   if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

//   return (
//     <Card className="border-0 shadow-sm">
//       <Card.Header className="bg-white py-3 border-bottom-0">
//         <Row className="g-3 align-items-center">
//           <Col md={4}>
//             <h5 className="mb-0 fw-bold text-uppercase" style={{color: "var(--primary-color)"}}>Book Inventory</h5>
//             {/* <small className="text-muted">Analyze your collection stock</small> */}

//           </Col>
//           <Col md={8} className="d-flex justify-content-md-end gap-2">
//             {viewMode === 'table' && (
//               <Form.Select  size="sm"
//                   value={vendorFilter}
//                   onChange={(e) => setVendorFilter(e.target.value)}
//                   style={{ maxWidth: '150px' }}
//               >
//                 <option value="All Vendors">All Vendors</option>
//               {vendors.map((vendor, index) => ( <option key={index} value={vendor}> {vendor} </option> ))}
//               </Form.Select>
//             )}

//             {/* View Toggle */}
//             <ButtonGroup size="sm" className="me-2">
//               <Button 
//                 variant={viewMode === 'table' ? '' : 'outline-primary'} 
//                 style={
//                   viewMode === 'table'
//                     ? { backgroundColor: 'var(--primary-color)', color:'#fff', borderColor: 'var(--primary-color)' }
//                     : {}
//                 }
//                 onClick={() => setViewMode('table')}
//                 >
//                 <i className="fa fa-table me-1" /> Table
//               </Button>
//               <Button 
//                 variant={viewMode === 'chart' ? '' : 'outline-primary'} 
//                 style={
//                   viewMode === 'chart'
//                     ? { backgroundColor: 'var(--primary-color)', color:'#fff', borderColor: 'var(--primary-color)' }
//                     : {}
//                 }
//                 onClick={() => setViewMode('chart')}
//               >
//                 <i className="fa fa-chart-bar me-1" /> Chart
//               </Button>
//             </ButtonGroup>

//             {/* <Button variant="outline-primary" size="sm" onClick={fetchInventoryReport}><i className="fa fa-refresh" /></Button> */}

//             <Dropdown align="end">
//                 <Dropdown.Toggle variant="outline-dark" size="sm" style={{onhover: "cursor-pointer",color:'black'}}> <i className="fa fa-download" /> Actions</Dropdown.Toggle>
//                 <Dropdown.Menu className="shadow-sm border-0">
//                     <Dropdown.Header>Export Selected</Dropdown.Header>
//                     <Dropdown.Item onClick={() => exportFile("excel")}><i className="fa-solid fa-file-excel me-2 text-success" />Excel</Dropdown.Item>
//                     <Dropdown.Item onClick={() => exportFile("csv")}><i className="fa-solid fa-file-csv me-2 text-info" />CSV</Dropdown.Item>
//                     <Dropdown.Item onClick={() => exportFile("pdf")}><i className="fa-solid fa-f  ile-pdf me-2 text-danger" />PDF</Dropdown.Item>
//                 </Dropdown.Menu>
//             </Dropdown>
//           </Col>
//         </Row>
//       </Card.Header>

//       <Card.Body>
//         {viewMode === "table" ? (
//           <>
//             {/* <Row className="mb-3">
//               <Col md={4}>
//                 <InputGroup size="sm">
//                   <InputGroup.Text className="bg-white"><i className="fa fa-search text-muted" /></InputGroup.Text>
//                   <Form.Control 
//                     placeholder="Search books, authors..." 
//                     onChange={(e) => setSearchTerm(e.target.value)} 
//                   />
//                 </InputGroup>
//               </Col>
//             </Row> */}
//             <div className="table-responsive border rounded">
//               <ResizableTable
//                 data={filteredData}
//                 columns={columns}
//                 loading={loading}
//                 currentPage={currentPage}
//                 recordsPerPage={rowsPerPage}
//                 onPageChange={setCurrentPage}
//                 showSerialNumber={true}
//                 showCheckbox={true}
//                 showActions={false}
//                 selectedItems={selectedRows}
//                 onSelectionChange={handleSelectionChange}
//               />
//             </div>
//           </>
//         ) : (
//           <div className="p-2">
//             <Row className="mb-4 align-items-center">
//                 <Col md={2}>
//                     <Form.Group>
//                         <Form.Label className="small fw-bold text-uppercase text-muted">Group Data By:</Form.Label>
//                         <Form.Select 
//                             size="sm" 
//                             value={chartGroupBy} 
//                             onChange={(e) => setChartGroupBy(e.target.value)}
//                             className="form-select-sm"
//                         >
//                             <option value="category_name">Category</option>
//                             <option value="publisher_name">Publisher</option>
//                             <option value="author_name">Author</option>
//                             <option value="vendor_name">Vendor</option>
//                             {/* Add vendor_name here if it exists in your API data */}
//                         </Form.Select>
//                     </Form.Group>
//                 </Col>
//                 {/* <Col md={4} className="text-end float-end">
//                     <div className="small text-muted italic">Showing top 10 items by total volume</div>
//                 </Col> */}
//             </Row>
//               <div style={{ width: '100%', height: 400 }}>
//                 <ResponsiveContainer>
//                   <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
//                     <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                     <XAxis 
//                       dataKey="name" 
//                       angle={-45} 
//                       textAnchor="end" 
//                       interval={0} 
//                       height={80}
//                       tick={{fontSize: 12}}
//                       />
//                     <YAxis />
//                     <Tooltip cursor={{fill: '#f8f9fa'}} />
//                     <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '20px'}} />
//                     <Bar dataKey="total" name="Total Stock" fill="#11439b" radius={[4, 4, 0, 0]} barSize={40} />
//                     <Bar dataKey="available" name="Available" fill="#82ca9d" radius={[4, 4, 0, 0]} barSize={40} />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>

//           </div>
//         )}
//       </Card.Body>
//     </Card>
//   );
// };

// export default BookInventoryReport;




import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card, Button, Spinner, Row, Col, Form, InputGroup,
  ButtonGroup, Badge, OverlayTrigger, Tooltip, Alert, Modal, Dropdown
} from "react-bootstrap";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import DataApi from "../../api/dataApi";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import ResizableTable from "../common/ResizableTable";
import "../../App.css";
import TableHeader from "../common/TableHeader";

const BookInventoryReport = () => {
  const navigate = useNavigate();

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [vendors, setVendors] = useState([]);



  const [vendorFilter, setVendorFilter] = useState("All Vendors");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  const [viewMode, setViewMode] = useState("table");
  const [chartType, setChartType] = useState("bar");
  const [chartGroupBy, setChartGroupBy] = useState("category_name");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);


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

  const columns = [
    {
      field: "book_title",
      label: "Book Title",
      searchable: true,
      align: "center",
      render: (val, row) => (
        <div>
          <div className="fw-semibold text-dark">{val}</div>
          <small className="text-muted">ISBN: {row.isbn || 'N/A'}</small>
        </div>
      )
    },
    {
      field: "author_name",
      label: "Author",
      searchable: true,
      align: "center",
      render: (val) => <span className="text-secondary">{val}</span>
    },
    {
      field: "publisher_name",
      label: "Publisher",
      searchable: true,
       align: "center", 
    },
    {
      field: "category_name",
      label: "Category",
      searchable: true,
       align: "center", 
    },
    {
      field: "vendor_name",
      label: "Vendor",
      searchable: true,
       align: "center", 
      render: (val) => val || <span className="text-muted">N/A</span>
    },
    {
      field: "total_copies",
      label: "Total",
      align: "center"
    },
    {
      field: "available_copies",
      label: "Available",
      align: "center"
    },
    {
      field: "issued_copies",
      label: "Issued",
      align: "center"
    },
    // {
    //   field: "lost_damaged_copies",
    //   label: "Lost/Damaged",
    //   align: "center"
    // },
    {
      field: "status",
      label: "Status",
      align: "center"
    },
  ];

  const fetchInventoryReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const bookApi = new DataApi("book");
      const response = await bookApi.fetchInventoryReport();
      const dataWithIds = (response.data || []).map((item, index) => ({
        ...item,
        id: item.id || index
      }));
      setReportData(dataWithIds);
    } catch (err) {
      setError("Failed to load inventory report. Please try again.");
      console.error("Inventory fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const vendorApi = new DataApi("vendor");
      const response = await vendorApi.fetchAll();
      const vendorList = (response.data || [])
        .filter(vendor => vendor.status === true)
        .map(vendor => vendor.vendor_name || vendor.name)
        .filter(Boolean);
      setVendors(vendorList);
    } catch (err) {
      console.error("Failed to load vendors:", err);
    }
  };

  useEffect(() => {
    fetchInventoryReport();
    fetchVendors();
  }, []);

  const handleSelectionChange = (selectedIds) => setSelectedRows(selectedIds);

  const categories = useMemo(() => {
    return [...new Set(reportData.map(item => item.category_name).filter(Boolean))];
  }, [reportData]);

  const filteredData = useMemo(() => {
    return reportData.filter((row) => {
      const matchesSearch = searchTerm === "" || columns.some((col) =>
        col.searchable && String(row[col.field] || "").toLowerCase().includes(searchTerm.toLowerCase())
      );

      const matchesVendor = vendorFilter === "All Vendors" || row.vendor_name === vendorFilter;
      const matchesCategory = categoryFilter === "All Categories" || row.category_name === categoryFilter;

      let matchesStatus = true;
      if (statusFilter === "Available") {
        matchesStatus = row.available_copies > 0;
      } else if (statusFilter === "Out of Stock") {
        matchesStatus = row.available_copies === 0;
      } else if (statusFilter === "Low Stock") {
        matchesStatus = row.available_copies > 0 && (row.available_copies / row.total_copies) < 0.3;
      }

      return matchesSearch && matchesVendor && matchesCategory && matchesStatus;
    });
  }, [searchTerm, reportData, vendorFilter, categoryFilter, statusFilter]);

  const statistics = useMemo(() => {
    const data = filteredData.length > 0 ? filteredData : reportData;
    return {
      totalBooks: data.reduce((sum, item) => sum + (parseInt(item.total_copies) || 0), 0),
      availableBooks: data.reduce((sum, item) => sum + (parseInt(item.available_copies) || 0), 0),
      issuedBooks: data.reduce((sum, item) => sum + (parseInt(item.issued_copies) || 0), 0),
      lostDamaged: data.reduce((sum, item) => sum + (parseInt(item.lost_damaged_copies) || 0), 0),
      uniqueTitles: data.length,
      lowStockCount: data.filter(item => {
        const percent = (item.available_copies / item.total_copies) * 100;
        return percent > 0 && percent < 30;
      }).length,
      outOfStockCount: data.filter(item => item.available_copies === 0).length,
    };
  }, [filteredData, reportData]);

  const chartData = useMemo(() => {
    const dataToAggregate = vendorFilter === "All Vendors"
      ? reportData
      : reportData.filter(item => item.vendor_name === vendorFilter);

    const aggregation = dataToAggregate.reduce((acc, item) => {
      const key = item[chartGroupBy] || "Unknown";
      if (!acc[key]) {
        acc[key] = { name: key, total: 0, available: 0, issued: 0, damaged: 0 };
      }
      acc[key].total += parseInt(item.total_copies || 0);
      acc[key].available += parseInt(item.available_copies || 0);
      acc[key].issued += parseInt(item.issued_copies || 0);
      acc[key].damaged += parseInt(item.lost_damaged_copies || 0);
      return acc;
    }, {});

    return Object.values(aggregation)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [reportData, chartGroupBy, vendorFilter]);

  const statusDistribution = useMemo(() => {
    return [
      { name: 'Available', value: statistics.availableBooks, color: '#28a745' },
      { name: 'Issued', value: statistics.issuedBooks, color: '#007bff' },
      { name: 'Lost/Damaged', value: statistics.lostDamaged, color: '#dc3545' },
    ];
  }, [statistics]);


  const exportFile = (type) => {
    const dataToExport = selectedRows.length > 0
      ? filteredData.filter(row => selectedRows.includes(row.id))
      : filteredData;

    if (dataToExport.length === 0) {
      alert("No data to export!");
      return;
    }

    const headers = columns.map(col => col.label);
    const exportData = dataToExport.map(row =>
      columns.map(col => {
        if (col.field === 'status') {
          return row.available_copies > 0 ? 'Available' : 'Out of Stock';
        }
        return row[col.field] || "N/A";
      })
    );

    if (type === "csv") {
      const csvContent = [headers, ...exportData].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } else if (type === "excel") {
      const excelData = dataToExport.map(row => {
        const rowData = {};
        columns.forEach(col => {
          if (col.field === 'status') {
            rowData[col.label] = row.available_copies > 0 ? 'Available' : 'Out of Stock';
          } else {
            rowData[col.label] = row[col.field] || "N/A";
          }
        });
        return rowData;
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
      XLSX.writeFile(workbook, `Inventory_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else if (type === "pdf") {
      const doc = new jsPDF("landscape");

      doc.setFontSize(18);
      doc.setTextColor(17, 67, 155);
      doc.text("Book Inventory Report", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
      doc.text(`Total Records: ${dataToExport.length}`, 14, 34);

      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Total Copies: ${statistics.totalBooks} | Available: ${statistics.availableBooks} | Issued: ${statistics.issuedBooks}`, 14, 42);

      doc.autoTable({
        head: [headers],
        body: exportData,
        startY: 48,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [17, 67, 155], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      doc.save(`Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    }


  };

  const resetFilters = () => {
    setSearchTerm("");
    setVendorFilter("All Vendors");
    setStatusFilter("All Status");
    setCategoryFilter("All Categories");
    setSelectedRows([]);
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
        <div className="mt-3 text-muted">Loading inventory data...</div>
      </div>
    );
  }

  return (
    <>
      <div className="container-fluid ">
        <Card className="border-0 shadow-sm ">

          <Card.Header
            className="border shadow-sm  mt-4 rounded mx-2 custom-card-header"
          >

            <Row className="align-items-center px-3">

              {/* LEFT SECTION */}
              <Col md={6} className="d-flex align-items-center gap-3">

                {/* Back Button */}
                <button
                  onClick={() => navigate('/reports')}
                  className="shadow-sm d-flex align-items-center justify-content-center custom-btn-back"
                >
                  <i className="fa-solid fa-arrow-left"></i>
                </button>

                {/* Icon */}
                {/* <div
        className="d-flex align-items-center justify-content-center"
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "10px",
          background: "var(--primary-background-color)"
        }}
      >
        <i
          className="fa fa-book"
          style={{ fontSize: '20px', color: "var(--primary-color)" }}
        />
      </div> */}

                {/* Title */}
                <div>
                  <h4 className="mb-0 fw-bold" style={{ color: "var(--primary-color)" }}>
                    Book Inventory
                  </h4>
                  {/* <small className="text-muted">Manage and analyze your book stock</small> */}
                </div>

              </Col>

              {/* RIGHT SECTION */}
              <Col md={6} className="text-end">
                <Dropdown align="end">
                  <Dropdown.Toggle variant="light" size="sm" id="options-dropdown">
                    <i className="fa fa-bars me-1" /> Options
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="shadow-sm border-0 mt-2">
                    <Dropdown.Header className="small text-uppercase fw-bold text-muted">
                      View Mode
                    </Dropdown.Header>

                    <Dropdown.Item
                      active={viewMode === 'table'}
                      onClick={() => setViewMode('table')}
                    >
                      <i className="fa fa-table me-2" /> Table
                    </Dropdown.Item>

                    <Dropdown.Item
                      active={viewMode === 'dashboard'}
                      onClick={() => setViewMode('dashboard')}
                    >
                      <i className="fa fa-chart-pie me-2" /> Dashboard
                    </Dropdown.Item>

                    <Dropdown.Item
                      active={viewMode === 'chart'}
                      onClick={() => setViewMode('chart')}
                    >
                      <i className="fa fa-chart-bar me-2" /> Analytics
                    </Dropdown.Item>

                    <Dropdown.Divider />

                    <Dropdown.Header className="small text-uppercase fw-bold text-muted">
                      Export Options
                    </Dropdown.Header>

                    <Dropdown.Item onClick={() => exportFile("excel")}>
                      <i className="fa-solid fa-file-excel me-2 text-success" /> Excel
                    </Dropdown.Item>

                    <Dropdown.Item onClick={() => exportFile("csv")}>
                      <i className="fa-solid fa-file-csv me-2 text-info" /> CSV
                    </Dropdown.Item>

                    <Dropdown.Item onClick={() => exportFile("pdf")}>
                      <i className="fa-solid fa-file-pdf me-2 text-danger" /> PDF
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>

            </Row>
          </Card.Header>


          <Card.Body className="">
            {/* {error && (
              <Alert variant="danger" dismissible onClose={() => setError(null)}>
                <i className="fa fa-exclamation-circle me-2" />
                {error}
              </Alert>
            )} */}
            {/* <Row className="g-3 mb-4">
            <Col md={3} sm={6}>
              <Card className="border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #007bff' }}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted text-uppercase">Total Copies</small>
                      <h3 className="mb-0 fw-bold text-primary">{statistics.totalBooks.toLocaleString()}</h3>
                    </div>
                    <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                      <i className="fa fa-book text-primary" style={{ fontSize: '24px' }} />
                    </div>
                  </div>
                  <small className="text-muted">{statistics.uniqueTitles} unique titles</small>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3} sm={6}>
              <Card className="border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #28a745' }}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted text-uppercase">Available</small>
                      <h3 className="mb-0 fw-bold text-success">{statistics.availableBooks.toLocaleString()}</h3>
                    </div>
                    <div className="bg-success bg-opacity-10 rounded-circle p-3">
                      <i className="fa fa-check-circle text-success" style={{ fontSize: '24px' }} />
                    </div>
                  </div>
                  <small className="text-muted">
                    {((statistics.availableBooks / statistics.totalBooks) * 100).toFixed(1)}% of total
                  </small>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3} sm={6}>
              <Card className="border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #ffc107' }}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted text-uppercase">Issued</small>
                      <h3 className="mb-0 fw-bold text-warning">{statistics.issuedBooks.toLocaleString()}</h3>
                    </div>
                    <div className="bg-warning bg-opacity-10 rounded-circle p-3">
                      <i className="fa fa-hand-holding text-warning" style={{ fontSize: '24px' }} />
                    </div>
                  </div>
                  <small className="text-muted">{statistics.lowStockCount} low stock items</small>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3} sm={6}>
              <Card className="border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #dc3545' }}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted text-uppercase">Lost/Damaged</small>
                      <h3 className="mb-0 fw-bold text-danger">{statistics.lostDamaged.toLocaleString()}</h3>
                    </div>
                    <div className="bg-danger bg-opacity-10 rounded-circle p-3">
                      <i className="fa fa-exclamation-triangle text-danger" style={{ fontSize: '24px' }} />
                    </div>
                  </div>
                  <small className="text-muted">{statistics.outOfStockCount} out of stock</small>
                </Card.Body>
              </Card>
            </Col>
          </Row> */}

            {viewMode === "table" && (
              <>
                <Card className="border-0   ">
                  <Card.Body>
                    <Row className="g-3  align-items-end">

                      <Col xs={12} md={2}>
                        <div style={labelStyle}>
                          <i className={"fa-solid fa-magnifying-glass"}></i>
                          <span>Search</span>
                        </div>
                        <Form.Control
                          type="text"
                          className="filter-input"
                          style={inputBaseStyle}
                          placeholder={`Search by book, author...`}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </Col>
                      <Col xs={12} md={2}>
                        <div style={labelStyle}>
                          <i className={"fa-solid fa-filter"}></i>
                          <span>Vendor</span>
                        </div>
                        <Form.Select
                          className="small text-muted"
                          style={{
                            ...inputBaseStyle,
                            color: vendorFilter ? '#212529' : '#6c757d',
                            cursor: 'pointer',
                            paddingRight: '2.5rem',
                            appearance: 'none',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.75rem center',
                            backgroundSize: '16px 12px'
                          }}
                          value={vendorFilter}
                          onChange={(e) => setVendorFilter(e.target.value)}
                        >
                          <option value="">All Vendors</option>
                          {vendors.map((opt, i) => (
                            <option className="color-dark" key={i} value={opt.vendor}>{opt}</option>
                          ))}
                        </Form.Select>
                      </Col>

                      <Col xs={12} md={2}>
                        <div style={labelStyle}>
                          <i className={"fa-solid fa-filter"}></i>
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
                            <option className="color-dark" key={i} value={opt.vendor}>{opt}</option>
                          ))}
                        </Form.Select>
                      </Col>

                      <Col xs={12} md={2}>
                        <div style={labelStyle}>
                          <i className={"fa-solid fa-filter"}></i>
                          <span>Status</span>
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
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="All Status">All Status</option>
                          <option value="Available">Available</option>
                          <option value="Low Stock">Low Stock</option>
                          <option value="Out of Stock">Out of Stock</option>
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

                <div className="table-responsive ">
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
            )}

            {viewMode === "dashboard" && (
              <Row className="g-4">
                <Col md={8}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Header className="bg-white border-bottom">
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 fw-bold">Inventory Overview</h6>
                        <Form.Select
                          size="sm"
                          value={chartGroupBy}
                          onChange={(e) => setChartGroupBy(e.target.value)}
                          style={{ width: 'auto' }}
                        >
                          <option value="category_name">By Category</option>
                          <option value="publisher_name">By Publisher</option>
                          <option value="author_name">By Author</option>
                          <option value="vendor_name">By Vendor</option>
                        </Form.Select>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            interval={0}
                            height={80}
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis tick={{ fontSize: 11 }} />
                          <RechartsTooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0' }}
                          />
                          <Legend
                            verticalAlign="top"
                            wrapperStyle={{ paddingBottom: '20px' }}
                          />
                          <Bar dataKey="total" name="Total Stock" fill="#667eea" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="available" name="Available" fill="#28a745" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="issued" name="Issued" fill="#007bff" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={4}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Header className="bg-white border-bottom">
                      <h6 className="mb-0 fw-bold">Status Distribution</h6>
                    </Card.Header>
                    <Card.Body className="d-flex align-items-center justify-content-center">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={statusDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={90}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {statusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={12}>
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white border-bottom">
                      <h6 className="mb-0 fw-bold">Quick Insights</h6>
                    </Card.Header>
                    <Card.Body>
                      <Row className="g-3">
                        <Col md={4}>
                          <Alert variant="warning" className="mb-0">
                            <i className="fa fa-exclamation-triangle me-2" />
                            <strong>{statistics.lowStockCount}</strong> books are running low on stock
                          </Alert>
                        </Col>
                        <Col md={4}>
                          <Alert variant="danger" className="mb-0">
                            <i className="fa fa-ban me-2" />
                            <strong>{statistics.outOfStockCount}</strong> books are completely out of stock
                          </Alert>
                        </Col>
                        <Col md={4}>
                          <Alert variant="info" className="mb-0">
                            <i className="fa fa-percent me-2" />
                            <strong>{((statistics.issuedBooks / statistics.totalBooks) * 100).toFixed(1)}%</strong> utilization rate
                          </Alert>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {viewMode === "chart" && (
              <Row className="g-4">
                <Col md={12}>
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white border-bottom">
                      <Row className="align-items-center">
                        <Col>
                          <h6 className="mb-0 fw-bold">Analytics View</h6>
                        </Col>
                        <Col className="text-end">
                          <ButtonGroup size="sm">
                            <Button
                              variant={chartType === 'bar' ? 'primary' : 'outline-primary'}
                              onClick={() => setChartType('bar')}
                            >
                              <i className="fa fa-bar-chart" /> Bar
                            </Button>
                            <Button
                              variant={chartType === 'line' ? 'primary' : 'outline-primary'}
                              onClick={() => setChartType('line')}
                            >
                              <i className="fa fa-line-chart" /> Line
                            </Button>
                          </ButtonGroup>
                          <Form.Select
                            size="sm"
                            value={chartGroupBy}
                            onChange={(e) => setChartGroupBy(e.target.value)}
                            className="ms-2"
                            style={{ width: 'auto', display: 'inline-block' }}
                          >
                            <option value="category_name">By Category</option>
                            <option value="publisher_name">By Publisher</option>
                            <option value="author_name">By Author</option>
                            <option value="vendor_name">By Vendor</option>
                          </Form.Select>
                        </Col>
                      </Row>
                    </Card.Header>
                    <Card.Body>
                      <ResponsiveContainer width="100%" height={450}>
                        {chartType === 'bar' ? (
                          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                              dataKey="name"
                              angle={-45}
                              textAnchor="end"
                              interval={0}
                              height={100}
                              tick={{ fontSize: 11 }}
                            />
                            <YAxis />
                            <RechartsTooltip
                              contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0' }}
                            />
                            <Legend />
                            <Bar dataKey="total" name="Total" fill="#667eea" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="available" name="Available" fill="#28a745" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="issued" name="Issued" fill="#007bff" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="damaged" name="Lost/Damaged" fill="#dc3545" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        ) : (
                          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                              dataKey="name"
                              angle={-45}
                              textAnchor="end"
                              interval={0}
                              height={100}
                              tick={{ fontSize: 11 }}
                            />
                            <YAxis />
                            <RechartsTooltip
                              contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="total" name="Total" stroke="#667eea" strokeWidth={2} />
                            <Line type="monotone" dataKey="available" name="Available" stroke="#28a745" strokeWidth={2} />
                            <Line type="monotone" dataKey="issued" name="Issued" stroke="#007bff" strokeWidth={2} />
                            <Line type="monotone" dataKey="damaged" name="Lost/Damaged" stroke="#dc3545" strokeWidth={2} />
                          </LineChart>
                        )}
                      </ResponsiveContainer>
                      <div className="text-center mt-3">
                        <small className="text-muted">Showing top 10 {chartGroupBy.replace('_', ' ')} by total volume</small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>

      </div>
    </>
  );
};

export default BookInventoryReport;