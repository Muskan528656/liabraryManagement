// /*
// ====== COMMENTED OUT: BookRequestManagement Component ======
// Date: Current session
// Reason: Disabling book request management module for testing
// This entire component is commented out below.

// Full component code preserved:

// import React, { useState, useEffect, useRef } from "react";
// import { Container, Row, Col, Card, Button, Table, Badge, Modal, Form, Alert } from "react-bootstrap";
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import DataApi from "../../api/dataApi";
// import PubSub from "pubsub-js";
// import jwt_decode from "jwt-decode";
// import ScrollToTop from "../common/ScrollToTop";
// import Loader from "../common/Loader";
// import * as constants from "../../constants/CONSTANT";
// import helper from "../common/helper";
// import { exportToExcel } from "../../utils/excelExport";

// const BookRequestManagement = () => {
//   const [requests, setRequests] = useState([]);
//   const [filteredRequests, setFilteredRequests] = useState([]);
//   const [selectedItems, setSelectedItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all"); // all, pending, approved, rejected
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [showRejectModal, setShowRejectModal] = useState(false);
//   const [showApproveModal, setShowApproveModal] = useState(false);
//   const [rejectionReason, setRejectionReason] = useState("");
//   const [approvedQuantity, setApprovedQuantity] = useState(1);
//   const [processingId, setProcessingId] = useState(null);

//   useEffect(() => {
//     fetchRequests();
//   }, []);

//   useEffect(() => {
//     filterRequests();
//   }, [requests, searchTerm, statusFilter]);

//   // Clear selection when filters/search change
//   useEffect(() => {
//     setSelectedItems([]);
//   }, [searchTerm, statusFilter]);

//   // Keep only valid selected IDs when underlying data changes
//   useEffect(() => {
//     const validIds = requests.map(r => r.id);
//     setSelectedItems(prev => prev.filter(id => validIds.includes(id)));
//   }, [requests]);

//   const filterRequests = () => {
//     let filtered = requests;

//     // Filter by status
//     if (statusFilter !== "all") {
//       filtered = filtered.filter((req) => req.status === statusFilter);
//     }

//     // Filter by search term
//     if (searchTerm) {
//       const searchLower = searchTerm.toLowerCase();
//       filtered = filtered.filter(
//         (req) =>
//           req.book_title?.toLowerCase().includes(searchLower) ||
//           req.requested_by_name?.toLowerCase().includes(searchLower) ||
//           req.requested_by_email?.toLowerCase().includes(searchLower) ||
//           req.book_isbn?.toLowerCase().includes(searchLower)
//       );
//     }

//     setFilteredRequests(filtered);
//   };

//   // Selection helpers
//   const handleSelectAll = (e) => {
//     if (e.target.checked) {
//       const allIds = filteredRequests.map(r => r.id).filter(Boolean);
//       setSelectedItems([...new Set([...(selectedItems || []), ...allIds])]);
//     } else {
//       // remove filtered ids from selection
//       const filteredIds = filteredRequests.map(r => r.id).filter(Boolean);
//       setSelectedItems((prev) => (prev || []).filter(id => !filteredIds.includes(id)));
//     }
//   };

//   const handleSelectRow = (e, id) => {
//     e.stopPropagation();
//     if (e.target.checked) {
//       setSelectedItems((prev) => [...new Set([...(prev || []), id])]);
//     } else {
//       setSelectedItems((prev) => (prev || []).filter(i => i !== id));
//     }
//   };

//   const isAllSelected = () => {
//     if (!filteredRequests || filteredRequests.length === 0) return false;
//     const filteredIds = filteredRequests.map(r => r.id).filter(Boolean);
//     return filteredIds.length > 0 && filteredIds.every(id => (selectedItems || []).includes(id));
//   };

//   const isIndeterminate = () => {
//     if (!filteredRequests || filteredRequests.length === 0) return false;
//     const filteredIds = filteredRequests.map(r => r.id).filter(Boolean);
//     const selectedCount = filteredIds.filter(id => (selectedItems || []).includes(id)).length;
//     return selectedCount > 0 && selectedCount < filteredIds.length;
//   };

//   // Header checkbox ref to support indeterminate state
//   const headerCheckboxRef = useRef(null);

//   useEffect(() => {
//     if (headerCheckboxRef.current) {
//       headerCheckboxRef.current.indeterminate = isIndeterminate();
//     }
//   }, [selectedItems, filteredRequests]);

//   const fetchRequests = async () => {
//     try {
//       setLoading(true);
//       const response = await helper.fetchWithAuth(
//         `${constants.API_BASE_URL}/api/bookrequest`,
//         "GET"
//       );
//       const result = await response.json();

//       if (result && Array.isArray(result)) {
//         setRequests(result);
//         setFilteredRequests(result);
//       } else if (result.success && result.data) {
//         setRequests(result.data);
//         setFilteredRequests(result.data);
//       }
//     } catch (error) {
//       console.error("Error fetching book requests:", error);
//       PubSub.publish("RECORD_SAVED_TOAST", {
//         title: "Error",
//         message: "Failed to fetch book requests",
//         type: "error"
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const openApproveModal = (request) => {
//     setSelectedRequest(request);
//     setApprovedQuantity(request.quantity || 1);
//     setShowApproveModal(true);
//   };

//   const handleApprove = async () => {
//     if (!selectedRequest) return;

//     const requestedQty = selectedRequest.quantity || 1;
//     const availableCopies = selectedRequest.available_copies || 0;

//     if (approvedQuantity <= 0) {
//       PubSub.publish("RECORD_SAVED_TOAST", {
//         title: "Error",
//         message: "Approved quantity must be greater than 0",
//         type: "error"
//       });
//       return;
//     }

//     if (approvedQuantity > requestedQty) {
//       PubSub.publish("RECORD_SAVED_TOAST", {
//         title: "Error",
//         message: `Approved quantity cannot exceed requested quantity (${requestedQty})`,
//         type: "error"
//       });
//       return;
//     }

//     if (approvedQuantity > availableCopies) {
//       PubSub.publish("RECORD_SAVED_TOAST", {
//         title: "Error",
//         message: `Only ${availableCopies} copies are available. Cannot approve ${approvedQuantity} copies.`,
//         type: "error"
//       });
//       return;
//     }

//     try {
//       setProcessingId(selectedRequest.id);
//       const requestBody = {};

//       // Only send approved_quantity if it's different from requested quantity
//       if (approvedQuantity !== requestedQty) {
//         requestBody.approved_quantity = approvedQuantity;
//       }

//       const response = await helper.fetchWithAuth(
//         `${constants.API_BASE_URL}/api/bookrequest/approve/${selectedRequest.id}`,
//         "POST",
//         Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined
//       );
//       const result = await response.json();

//       if (result.success) {
//         const isPartial = approvedQuantity < requestedQty;
//         PubSub.publish("RECORD_SAVED_TOAST", {
//           title: "Success",
//           message: isPartial
//             ? `Request partially approved! ${approvedQuantity} out of ${requestedQty} copies approved and issued.`
//             : "Request approved successfully! Book has been issued to the student."
//         });
//         setShowApproveModal(false);
//         setSelectedRequest(null);
//         setApprovedQuantity(1);
//         fetchRequests();
//       } else {
//         PubSub.publish("RECORD_SAVED_TOAST", {
//           title: "Error",
//           message: result.errors || result.message || "Failed to approve request",
//           type: "error"
//         });
//       }
//     } catch (error) {
//       console.error("Error approving request:", error);
//       PubSub.publish("RECORD_SAVED_TOAST", {
//         title: "Error",
//         message: error.message || "Failed to approve request",
//         type: "error"
//       });
//     } finally {
//       setProcessingId(null);
//     }
//   };

//   const handleReject = async () => {
//     if (!rejectionReason.trim()) {
//       PubSub.publish("RECORD_SAVED_TOAST", {
//         title: "Error",
//         message: "Please provide a rejection reason",
//         type: "error"
//       });
//       return;
//     }

//     try {
//       setProcessingId(selectedRequest.id);
//       const response = await helper.fetchWithAuth(
//         `${constants.API_BASE_URL}/api/bookrequest/reject/${selectedRequest.id}`,
//         "POST",
//         JSON.stringify({ rejection_reason: rejectionReason })
//       );
//       const result = await response.json();

//       if (result.success) {
//         PubSub.publish("RECORD_SAVED_TOAST", {
//           title: "Success",
//           message: "Request rejected successfully"
//         });
//         setShowRejectModal(false);
//         setRejectionReason("");
//         setSelectedRequest(null);
//         fetchRequests();
//       } else {
//         PubSub.publish("RECORD_SAVED_TOAST", {
//           title: "Error",
//           message: result.errors || result.message || "Failed to reject request",
//           type: "error"
//         });
//       }
//     } catch (error) {
//       console.error("Error rejecting request:", error);
//       PubSub.publish("RECORD_SAVED_TOAST", {
//         title: "Error",
//         message: "Failed to reject request",
//         type: "error"
//       });
//     } finally {
//       setProcessingId(null);
//     }
//   };

//   const openRejectModal = (request) => {
//     setSelectedRequest(request);
//     setShowRejectModal(true);
//   };

//   const getStatusBadge = (status) => {
//     switch (status) {
//       case "pending":
//         return <Badge bg="warning">Pending</Badge>;
//       case "approved":
//         return <Badge bg="success">Approved</Badge>;
//       case "rejected":
//         return <Badge bg="danger">Rejected</Badge>;
//       case "cancelled":
//         return <Badge bg="secondary">Cancelled</Badge>;
//       default:
//         return <Badge bg="info">{status}</Badge>;
//     }
//   };

//   const handleExport = async () => {
//     try {
//       const exportList = (selectedItems && selectedItems.length > 0)
//         ? filteredRequests.filter(r => (selectedItems || []).includes(r.id))
//         : filteredRequests;

//       const exportData = exportList.map((request) => {
//         const requestDate = request.createddate || request.request_date;
//         const formattedDate = requestDate
//           ? new Date(requestDate).toLocaleString("en-IN", {
//             year: "numeric",
//             month: "2-digit",
//             day: "2-digit",
//             hour: "2-digit",
//             minute: "2-digit",
//             hour12: true,
//           })
//           : "";

//         return {
//           "Book Title": request.book_title || "",
//           "ISBN": request.book_isbn || "",
//           "Requested By": request.requested_by_name || "",
//           "Email": request.requested_by_email || "",
//           "Request Date": formattedDate,
//           "Requested Quantity": request.quantity || 1,
//           "Approved Quantity": request.approved_quantity || request.quantity || 1,
//           "Status": request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : "",
//           "Approved By": request.approved_by_name || "",
//           "Approved Date": request.approved_date
//             ? new Date(request.approved_date).toLocaleString("en-IN", {
//               year: "numeric",
//               month: "2-digit",
//               day: "2-digit",
//               hour: "2-digit",
//               minute: "2-digit",
//               hour12: true,
//             })
//             : "",
//           "Rejection Reason": request.rejection_reason || "",
//         };
//       });

//       const columns = [
//         { key: 'Book Title', header: 'Book Title', width: 35 },
//         { key: 'ISBN', header: 'ISBN', width: 20 },
//         { key: 'Requested By', header: 'Requested By', width: 25 },
//         { key: 'Email', header: 'Email', width: 30 },
//         { key: 'Request Date', header: 'Request Date', width: 20 },
//         { key: 'Requested Quantity', header: 'Requested Quantity', width: 15 },
//         { key: 'Approved Quantity', header: 'Approved Quantity', width: 15 },
//         { key: 'Status', header: 'Status', width: 15 },
//         { key: 'Approved By', header: 'Approved By', width: 25 },
//         { key: 'Approved Date', header: 'Approved Date', width: 20 },
//         { key: 'Rejection Reason', header: 'Rejection Reason', width: 40 }
//       ];

//       await exportToExcel(exportData, 'book_requests', 'Book Requests', columns);
//       PubSub.publish("RECORD_SAVED_TOAST", {
//         title: "Success",
//         message: "Book requests exported successfully"
//       });
//     } catch (error) {
//       console.error('Error exporting book requests:', error);
//       PubSub.publish("RECORD_SAVED_TOAST", {
//         title: "Error",
//         message: "Failed to export book requests",
//         type: "error"
//       });
//     }
//   };

//   if (loading) {
//     return <Loader />;
//   }

//   // Calculate stats
//   const pendingCount = requests.filter(r => r.status === "pending").length;
//   const approvedCount = requests.filter(r => r.status === "approved").length;
//   const rejectedCount = requests.filter(r => r.status === "rejected").length;

//   return (
//     <Container fluid className="mt-4 mb-5">
//       <ScrollToTop />

//       {/* Summary Stats */}
//       <Row className="mb-4">
//         <Col md={3} className="mb-3">
//           <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.1)", borderTop: "4px solid #ffc107" }}>
//             <Card.Body className="text-center">
//               <h6 className="text-muted mb-2">Pending Requests</h6>
//               <h3 style={{ color: "#ffc107", fontWeight: "bold" }}>{pendingCount}</h3>
//             </Card.Body>
//           </Card>
//         </Col>
//         <Col md={3} className="mb-3">
//           <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.1)", borderTop: "4px solid #28a745" }}>
//             <Card.Body className="text-center">
//               <h6 className="text-muted mb-2">Approved Requests</h6>
//               <h3 style={{ color: "#28a745", fontWeight: "bold" }}>{approvedCount}</h3>
//             </Card.Body>
//           </Card>
//         </Col>
//         <Col md={3} className="mb-3">
//           <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.1)", borderTop: "4px solid #dc3545" }}>
//             <Card.Body className="text-center">
//               <h6 className="text-muted mb-2">Rejected Requests</h6>
//               <h3 style={{ color: "#dc3545", fontWeight: "bold" }}>{rejectedCount}</h3>
//             </Card.Body>
//           </Card>
//         </Col>
//         <Col md={3} className="mb-3">
//           <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.1)", borderTop: "4px solid #6f42c1" }}>
//             <Card.Body className="text-center">
//               <h6 className="text-muted mb-2">Total Requests</h6>
//               <h3 style={{ color: "#6f42c1", fontWeight: "bold" }}>{requests.length}</h3>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>

//       {/* Main Table Card */}
//       <Row className="mb-3">
//         <Col>
//           <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.1)" }}>
//             <Card.Header
//               style={{
//                 background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
//                 borderBottom: "1px solid #e2e8f0",
//               }}
//             >
//               <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
//                 <h5 className="mb-0" style={{ color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
//                   <i className="fa-solid fa-list-check"></i>
//                   Book Requests
//                 </h5>
//                 <div className="d-flex gap-2 flex-wrap">
//                   <Form.Control
//                     type="text"
//                     placeholder="Search by book title, student name..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     style={{ maxWidth: "300px" }}
//                   />
//                   <Form.Select
//                     value={statusFilter}
//                     onChange={(e) => setStatusFilter(e.target.value)}
//                     style={{ maxWidth: "150px" }}
//                   >
//                     <option value="all">All Status</option>
//                     <option value="pending">Pending</option>
//                     <option value="approved">Approved</option>
//                     <option value="rejected">Rejected</option>
//                     <option value="cancelled">Cancelled</option>
//                   </Form.Select>
//                   <Button variant="outline-light" size="sm" onClick={handleExport} className="d-flex align-items-center gap-2">
//                     <i className="fa-solid fa-download"></i>Export
//                   </Button>
//                 </div>
//               </div>
//             </Card.Header>
//             <Card.Body className="p-0">
//               {filteredRequests.length > 0 ? (
//                 <div className="table-responsive">
//                   {/* Selection Summary Bar */}
//                   {selectedItems.length > 0 && (
//                     <div style={{ background: "#f0f4f8", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//                       <span style={{ color: "#6f42c1", fontWeight: "500" }}>
//                         <i className="fa-solid fa-check-circle me-2"></i>
//                         {selectedItems.length} request(s) selected
//                       </span>
//                     </div>
//                   )}
//                   <Table striped hover responsive className="mb-0">
//                     <thead>
//                       <tr style={{ background: "#f8f9fa" }}>
//                         <th style={{ width: "40px" }}>
//                           <Form.Check
//                             type="checkbox"
//                             ref={headerCheckboxRef}
//                             checked={isAllSelected()}
//                             onChange={handleSelectAll}
//                           />
//                         </th>
//                         <th><i className="fa-solid fa-book me-2"></i>Book Title</th>
//                         <th>ISBN</th>
//                         <th><i className="fa-solid fa-user me-2"></i>Requested By</th>
//                         <th>Email</th>
//                         <th><i className="fa-solid fa-calendar me-2"></i>Request Date</th>
//                         <th style={{ textAlign: "center" }}>Qty</th>
//                         <th style={{ textAlign: "center" }}><i className="fa-solid fa-tag me-2"></i>Status</th>
//                         <th style={{ textAlign: "center" }}>Actions</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {filteredRequests.map((request) => (
//                         <tr key={request.id} style={{ verticalAlign: "middle" }}>
//                           <td>
//                             <Form.Check
//                               type="checkbox"
//                               checked={(selectedItems || []).includes(request.id)}
//                               onChange={(e) => handleSelectRow(e, request.id)}
//                               onClick={(e) => e.stopPropagation()}
//                             />
//                           </td>
//                           <td>
//                             <strong style={{ color: "#6f42c1" }}>{request.book_title || "N/A"}</strong>
//                           </td>
//                           <td>
//                             <code>{request.book_isbn || "N/A"}</code>
//                           </td>
//                           <td>{request.requested_by_name || "N/A"}</td>
//                           <td>
//                             <small>{request.requested_by_email || "N/A"}</small>
//                           </td>
//                           <td>
//                             <small>
//                               {request.createddate
//                                 ? new Date(request.createddate).toLocaleString("en-IN", {
//                                   year: "numeric",
//                                   month: "2-digit",
//                                   day: "2-digit"
//                                 })
//                                 : request.request_date
//                                   ? new Date(request.request_date).toLocaleString("en-IN", {
//                                     year: "numeric",
//                                     month: "2-digit",
//                                     day: "2-digit"
//                                   })
//                                   : "N/A"}
//                             </small>
//                           </td>
//                           <td style={{ textAlign: "center" }}>
//                             <Badge bg="light" text="dark">
//                               {request.quantity || 1}
//                               {request.status === "approved" && request.approved_quantity && request.approved_quantity !== request.quantity && (
//                                 <span className="ms-2">
//                                   / <Badge bg="info" className="ms-1">{request.approved_quantity}</Badge>
//                                 </span>
//                               )}
//                             </Badge>
//                           </td>
//                           <td style={{ textAlign: "center" }}>{getStatusBadge(request.status)}</td>
//                           <td style={{ textAlign: "center" }}>
//                             {request.status === "pending" && (
//                               <div className="d-flex gap-1 justify-content-center">
//                                 <Button
//                                   variant="success"
//                                   size="sm"
//                                   onClick={() => openApproveModal(request)}
//                                   disabled={processingId === request.id}
//                                   title="Approve this request"
//                                 >
//                                   {processingId === request.id ? (
//                                     <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
//                                   ) : (
//                                     <i className="fa-solid fa-check"></i>
//                                   )}
//                                 </Button>
//                                 <Button
//                                   variant="danger"
//                                   size="sm"
//                                   onClick={() => openRejectModal(request)}
//                                   disabled={processingId === request.id}
//                                   title="Reject this request"
//                                 >
//                                   <i className="fa-solid fa-times"></i>
//                                 </Button>
//                               </div>
//                             )}
//                             {request.status === "approved" && (
//                               <Badge bg="success">
//                                 <i className="fa-solid fa-check-circle me-1"></i>
//                                 Approved
//                               </Badge>
//                             )}
//                             {request.status === "rejected" && (
//                               <Badge bg="danger">
//                                 <i className="fa-solid fa-ban me-1"></i>
//                                 Rejected
//                               </Badge>
//                             )}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </Table>
//                 </div>
//               ) : (
//                 <Alert variant="info" className="m-0 rounded-0 border-0 text-center py-5">
//                   <i className="fa-solid fa-inbox me-2" style={{ fontSize: "24px" }}></i>
//                   <p className="mb-0 mt-3">
//                     {searchTerm || statusFilter !== "all" ? (
//                       <>No requests found matching your criteria</>
//                     ) : (
//                       <>No book requests at this time</>
//                     )}
//                   </p>
//                 </Alert>
//               )}
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>

//       {/* Approve Modal */}
//       <Modal show={showApproveModal} onHide={() => {
//         setShowApproveModal(false);
//         setSelectedRequest(null);
//         setApprovedQuantity(1);
//       }} centered>
//         <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)", borderBottom: "none", color: "#fff" }}>
//           <Modal.Title>
//             <i className="fa-solid fa-check-circle me-2"></i>
//             Approve Book Request
//           </Modal.Title>
//         </Modal.Header>
//         <Modal.Body className="py-4">
//           {selectedRequest && (
//             <div>
//               <div className="mb-4 p-3" style={{ background: "#f8f9fa", borderRadius: "8px" }}>
//                 <div className="mb-3">
//                   <small className="text-muted d-block mb-1"><i className="fa-solid fa-book me-2"></i>Book Title</small>
//                   <strong style={{ fontSize: "16px", color: "#6f42c1" }}>{selectedRequest.book_title}</strong>
//                 </div>
//                 <div className="mb-3">
//                   <small className="text-muted d-block mb-1"><i className="fa-solid fa-user me-2"></i>Requested By</small>
//                   <strong>{selectedRequest.requested_by_name}</strong>
//                 </div>
//                 <div className="row">
//                   <div className="col-md-6">
//                     <small className="text-muted d-block mb-1">Requested Quantity</small>
//                     <Badge bg="warning" className="py-2 px-3">{selectedRequest.quantity || 1}</Badge>
//                   </div>
//                   <div className="col-md-6">
//                     <small className="text-muted d-block mb-1">Available Copies</small>
//                     <Badge bg={selectedRequest.available_copies > 0 ? "success" : "danger"} className="py-2 px-3">
//                       {selectedRequest.available_copies || 0}
//                     </Badge>
//                   </div>
//                 </div>
//               </div>
//               <Form.Group>
//                 <Form.Label className="fw-bold">
//                   <i className="fa-solid fa-cubes me-2"></i>
//                   Approved Quantity <span className="text-danger">*</span>
//                 </Form.Label>
//                 <Form.Control
//                   type="number"
//                   min="1"
//                   max={Math.min(selectedRequest.quantity || 1, selectedRequest.available_copies || 0)}
//                   value={approvedQuantity}
//                   onChange={(e) => {
//                     const value = parseInt(e.target.value) || 1;
//                     const maxValue = Math.min(selectedRequest.quantity || 1, selectedRequest.available_copies || 0);
//                     setApprovedQuantity(Math.min(Math.max(1, value), maxValue));
//                   }}
//                   placeholder="Enter approved quantity"
//                   required
//                   style={{ borderColor: "#28a745" }}
//                 />
//                 <Form.Text className="text-muted d-block mt-2">
//                   Maximum {Math.min(selectedRequest.quantity || 1, selectedRequest.available_copies || 0)} copies can be approved
//                   {selectedRequest.quantity > (selectedRequest.available_copies || 0) && (
//                     <span className="text-warning d-block mt-2">
//                       <i className="fa-solid fa-exclamation-triangle me-1"></i>
//                       Only {selectedRequest.available_copies || 0} copies available. You can approve up to {selectedRequest.available_copies || 0} copies.
//                     </span>
//                   )}
//                 </Form.Text>
//               </Form.Group>
//             </div>
//           )}
//         </Modal.Body>
//         <Modal.Footer style={{ borderTop: "1px solid #e2e8f0" }}>
//           <Button
//             variant="secondary"
//             onClick={() => {
//               setShowApproveModal(false);
//               setSelectedRequest(null);
//               setApprovedQuantity(1);
//             }}
//           >
//             Cancel
//           </Button>
//           <Button
//             style={{ background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)", border: "none" }}
//             onClick={handleApprove}
//             disabled={!approvedQuantity || approvedQuantity < 1 || processingId === selectedRequest?.id}
//           >
//             {processingId === selectedRequest?.id ? (
//               <>
//                 <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
//                 Approving...
//               </>
//             ) : (
//               <>
//                 <i className="fa-solid fa-check me-2"></i>
//                 Approve {approvedQuantity} {approvedQuantity > 1 ? 'Copies' : 'Copy'}
//               </>
//             )}
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       {/* Reject Modal */}
//       <Modal show={showRejectModal} onHide={() => {
//         setShowRejectModal(false);
//         setRejectionReason("");
//         setSelectedRequest(null);
//       }} centered>
//         <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)", borderBottom: "none", color: "#fff" }}>
//           <Modal.Title>
//             <i className="fa-solid fa-ban me-2"></i>
//             Reject Book Request
//           </Modal.Title>
//         </Modal.Header>
//         <Modal.Body className="py-4">
//           {selectedRequest && (
//             <div>
//               <div className="mb-4 p-3" style={{ background: "#f8f9fa", borderRadius: "8px" }}>
//                 <div className="mb-3">
//                   <small className="text-muted d-block mb-1"><i className="fa-solid fa-book me-2"></i>Book Title</small>
//                   <strong style={{ fontSize: "16px", color: "#6f42c1" }}>{selectedRequest.book_title}</strong>
//                 </div>
//                 <div>
//                   <small className="text-muted d-block mb-1"><i className="fa-solid fa-user me-2"></i>Requested By</small>
//                   <strong>{selectedRequest.requested_by_name}</strong>
//                 </div>
//               </div>
//               <Form.Group>
//                 <Form.Label className="fw-bold">
//                   <i className="fa-solid fa-comment-dots me-2"></i>
//                   Rejection Reason <span className="text-danger">*</span>
//                 </Form.Label>
//                 <Form.Control
//                   as="textarea"
//                   rows={4}
//                   value={rejectionReason}
//                   onChange={(e) => setRejectionReason(e.target.value)}
//                   placeholder="Enter reason for rejection..."
//                   required
//                   style={{ borderColor: "#dc3545", minHeight: "120px" }}
//                 />
//                 <Form.Text className="text-muted d-block mt-2">
//                   Please provide a clear reason for rejection so the student understands why their request was not approved.
//                 </Form.Text>
//               </Form.Group>
//             </div>
//           )}
//         </Modal.Body>
//         <Modal.Footer style={{ borderTop: "1px solid #e2e8f0" }}>
//           <Button
//             variant="secondary"
//             onClick={() => {
//               setShowRejectModal(false);
//               setRejectionReason("");
//               setSelectedRequest(null);
//             }}
//           >
//             Cancel
//           </Button>
//           <Button
//             style={{ background: "linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)", border: "none" }}
//             onClick={handleReject}
//             disabled={!rejectionReason.trim() || processingId === selectedRequest?.id}
//           >
//             {processingId === selectedRequest?.id ? (
//               <>
//                 <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
//                 Rejecting...
//               </>
//             ) : (
//               <>
//                 <i className="fa-solid fa-ban me-2"></i>
//                 Reject Request
//               </>
//             )}
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       <ToastContainer />
//     </Container>
//   );
// };

// // export default BookRequestManagement;

// */

// // Temporary export during testing - component is disabled above
// export default null;

