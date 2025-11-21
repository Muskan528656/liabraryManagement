// // // // // import React, { useState } from "react";
// // // // // import { Container, Row, Col, Card, Form, Button, Spinner, Badge, InputGroup, Table, Modal } from "react-bootstrap";
// // // // // import { useNavigate } from "react-router-dom";
// // // // // import helper from "../common/helper";
// // // // // import PubSub from "pubsub-js";
// // // // // import * as constants from "../../constants/CONSTANT";

// // // // // const ReturnBook = () => {
// // // // //     const navigate = useNavigate();
// // // // //     const [isbn, setIsbn] = useState("");
// // // // //     const [loading, setLoading] = useState(false);
// // // // //     const [book, setBook] = useState(null);
// // // // //     const [issue, setIssue] = useState(null);
// // // // //     const [libraryCard, setLibraryCard] = useState(null);
// // // // //     const [cardIssues, setCardIssues] = useState([]);
// // // // //     const [bookIssues, setBookIssues] = useState([]);
// // // // //     const [penalty, setPenalty] = useState({ penalty: 0, daysOverdue: 0 });
// // // // //     const [conditionBefore, setConditionBefore] = useState("Good");
// // // // //     const [conditionAfter, setConditionAfter] = useState("Good");
// // // // //     const [remarks, setRemarks] = useState("");
// // // // //     const [isScanning, setIsScanning] = useState(false);
// // // // //     const [showScanModal, setShowScanModal] = useState(false);
// // // // //     const [showSubmitModal, setShowSubmitModal] = useState(false);
// // // // //     const [selectedIssue, setSelectedIssue] = useState(null);
// // // // //     const [scanMethod, setScanMethod] = useState("");
// // // // //     const isbnInputRef = React.useRef(null);

// // // // //     const formatDate = (dateStr) => {
// // // // //         if (!dateStr) return "-";
// // // // //         try {
// // // // //             const d = new Date(dateStr);
// // // // //             if (isNaN(d)) return dateStr;
// // // // //             const dd = String(d.getDate()).padStart(2, "0");
// // // // //             const mm = String(d.getMonth() + 1).padStart(2, "0");
// // // // //             const yyyy = d.getFullYear();
// // // // //             return `${dd}-${mm}-${yyyy}`;
// // // // //         } catch (e) {
// // // // //             return dateStr;
// // // // //         }
// // // // //     };

// // // // //     // Navigate to user detail page - FIXED FUNCTION
// // // // //     const handleNameClick = (userId, userName, e) => {
// // // // //         if (e) {
// // // // //             e.preventDefault();
// // // // //             e.stopPropagation();
// // // // //         }

// // // // //         if (userId) {
// // // // //             navigate(`/user/${userId}`, {
// // // // //                 state: { userName: userName },
// // // // //             });
// // // // //         }
// // // // //     };

// // // // //     // Calculate book issue counts
// // // // //     const calculateBookCounts = (issues) => {
// // // // //         const counts = {};
// // // // //         issues.forEach(issue => {
// // // // //             const key = `${issue.book_title}_${issue.book_isbn}`;
// // // // //             counts[key] = (counts[key] || 0) + 1;
// // // // //         });
// // // // //         return counts;
// // // // //     };

// // // // //     // Perform search with ISBN or Library Card
// // // // //     const performSearch = async (value, method) => {
// // // // //         console.log("Performing search with value:", value, "method:", method);
// // // // //         if (!value || value.trim() === "") {
// // // // //             PubSub.publish("RECORD_ERROR_TOAST", { title: "Validation", message: "Please enter or scan a value" });
// // // // //             return;
// // // // //         }

// // // // //         try {
// // // // //             setLoading(true);

// // // // //             // Auto-detect if method is 'auto'
// // // // //             let searchMethod = method;
// // // // //             if (method === 'auto') {
// // // // //                 searchMethod = 'isbn';
// // // // //             }

// // // // //             console.log("Detected search method:", searchMethod);

// // // // //             if (searchMethod === 'libraryCard') {
// // // // //                 console.log("Searching by library card:", value);
// // // // //                 const cardResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/librarycard/card/${encodeURIComponent(value.trim())}`, "GET");
// // // // //                 console.log("Library card response:", cardResp);

// // // // //                 if (!cardResp.ok) {
// // // // //                     const err = await cardResp.json().catch(() => ({}));
// // // // //                     PubSub.publish("RECORD_ERROR_TOAST", { title: "Not Found", message: err.errors || "Library card not found" });
// // // // //                     setLibraryCard(null);
// // // // //                     setCardIssues([]);
// // // // //                     return;
// // // // //                 }

// // // // //                 const cardData = await cardResp.json();
// // // // //                 setLibraryCard(cardData);

// // // // //                 const issuesResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/card/${cardData.id}`, "GET");
// // // // //                 if (!issuesResp.ok) {
// // // // //                     const err = await issuesResp.json().catch(() => ({}));
// // // // //                     PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: err.errors || "Failed to fetch issues for this card" });
// // // // //                     setCardIssues([]);
// // // // //                     return;
// // // // //                 }

// // // // //                 const issues = await issuesResp.json();
// // // // //                 if (!issues || !Array.isArray(issues) || issues.length === 0) {
// // // // //                     PubSub.publish("RECORD_ERROR_TOAST", { title: "No Active Issues", message: "No active issued records found for this card" });
// // // // //                     setCardIssues([]);
// // // // //                     return;
// // // // //                 }

// // // // //                 setCardIssues(issues);
// // // // //                 setBook(null);
// // // // //                 setIssue(null);
// // // // //                 setBookIssues([]);
// // // // //                 setPenalty({ penalty: 0, daysOverdue: 0 });
// // // // //                 return;
// // // // //             }

// // // // //             // Default: ISBN -> get book and issues
// // // // //             const bookResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/book/isbn/${encodeURIComponent(value.trim())}`, "GET");
// // // // //             if (!bookResp.ok) {
// // // // //                 const err = await bookResp.json().catch(() => ({}));
// // // // //                 PubSub.publish("RECORD_ERROR_TOAST", { title: "Not Found", message: err.errors || "Book not found" });
// // // // //                 setBook(null);
// // // // //                 setIssue(null);
// // // // //                 setBookIssues([]);
// // // // //                 return;
// // // // //             }

// // // // //             const bookData = await bookResp.json();
// // // // //             setBook(bookData);

// // // // //             // Find active issues for this book
// // // // //             const issuesResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/book/${bookData.id}`, "GET");
// // // // //             if (!issuesResp.ok) {
// // // // //                 const err = await issuesResp.json().catch(() => ({}));
// // // // //                 PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: err.errors || "Failed to fetch issue records" });
// // // // //                 setIssue(null);
// // // // //                 setBookIssues([]);
// // // // //                 return;
// // // // //             }

// // // // //             const issues = await issuesResp.json();
// // // // //             if (!issues || !Array.isArray(issues) || issues.length === 0) {
// // // // //                 PubSub.publish("RECORD_ERROR_TOAST", { title: "No Active Issue", message: "No active issued record found for this ISBN" });
// // // // //                 setIssue(null);
// // // // //                 setBookIssues([]);
// // // // //                 return;
// // // // //             }

// // // // //             setBookIssues(issues);
// // // // //             const activeIssue = issues[0];
// // // // //             setIssue(activeIssue);

// // // // //             // Fetch penalty info
// // // // //             const penaltyResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/penalty/${activeIssue.id}`, "GET");
// // // // //             if (penaltyResp.ok) {
// // // // //                 const penaltyData = await penaltyResp.json();
// // // // //                 if (penaltyData && penaltyData.success) {
// // // // //                     setPenalty(penaltyData.data || { penalty: 0, daysOverdue: 0 });
// // // // //                 } else if (penaltyData && penaltyData.data) {
// // // // //                     setPenalty(penaltyData.data);
// // // // //                 } else {
// // // // //                     setPenalty({ penalty: 0, daysOverdue: 0 });
// // // // //                 }
// // // // //             } else {
// // // // //                 setPenalty({ penalty: 0, daysOverdue: 0 });
// // // // //             }

// // // // //             // Clear library card data when searching by ISBN
// // // // //             setLibraryCard(null);
// // // // //             setCardIssues([]);

// // // // //         } catch (error) {
// // // // //             console.error("Error searching:", error);
// // // // //             PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: error.message || "Error searching" });
// // // // //             setBook(null);
// // // // //             setIssue(null);
// // // // //             setLibraryCard(null);
// // // // //             setCardIssues([]);
// // // // //             setBookIssues([]);
// // // // //         } finally {
// // // // //             setLoading(false);
// // // // //         }
// // // // //     };

// // // // //     const handleSearch = async () => {
// // // // //         await performSearch(isbn, 'auto');
// // // // //     };

// // // // //     const handleIsbnChange = async (e) => {
// // // // //         const value = e.target.value;
// // // // //         setIsbn(value);

// // // // //         // Auto-search when user types (with debounce)
// // // // //         if (value.trim().length >= 3) {
// // // // //             if (isbnInputRef.current?.timer) {
// // // // //                 clearTimeout(isbnInputRef.current.timer);
// // // // //             }

// // // // //             isbnInputRef.current.timer = setTimeout(async () => {
// // // // //                 if (value.trim().length >= 3) {
// // // // //                     await performSearch(value.trim(), 'auto');
// // // // //                 }
// // // // //             }, 800);
// // // // //         } else if (value.trim().length === 0) {
// // // // //             // Clear results when input is empty
// // // // //             setBook(null);
// // // // //             setIssue(null);
// // // // //             setLibraryCard(null);
// // // // //             setCardIssues([]);
// // // // //             setBookIssues([]);
// // // // //             setPenalty({ penalty: 0, daysOverdue: 0 });
// // // // //         }
// // // // //     };

// // // // //     const handleIsbnKeyDown = async (e) => {
// // // // //         if (e.key === 'Enter') {
// // // // //             e.preventDefault();
// // // // //             if (isbnInputRef.current?.timer) {
// // // // //                 clearTimeout(isbnInputRef.current.timer);
// // // // //             }
// // // // //             setIsScanning(true);
// // // // //             await performSearch(isbn, 'auto');
// // // // //             setIsScanning(false);
// // // // //         }
// // // // //     };

// // // // //     const handleScanButtonClick = (method) => {
// // // // //         setScanMethod(method);
// // // // //         setShowScanModal(true);
// // // // //     };

// // // // //     const handleScanSubmit = async () => {
// // // // //         if (isbn.trim()) {
// // // // //             setShowScanModal(false);
// // // // //             await performSearch(isbn, scanMethod);
// // // // //         }
// // // // //     };

// // // // //     const handleSubmitClick = (issueItem) => {
// // // // //         setSelectedIssue(issueItem);
// // // // //         setShowSubmitModal(true);
// // // // //     };

// // // // //     const handleModalClose = () => {
// // // // //         setShowSubmitModal(false);
// // // // //         setSelectedIssue(null);
// // // // //         setConditionAfter("Good");
// // // // //         setRemarks("");
// // // // //     };

// // // // //     const handleFinalSubmit = async () => {
// // // // //         if (!selectedIssue) return;

// // // // //         try {
// // // // //             setLoading(true);
// // // // //             const body = JSON.stringify({
// // // // //                 issue_id: selectedIssue.id,
// // // // //                 condition_before: selectedIssue.condition_before || conditionBefore || 'Good',
// // // // //                 condition_after: conditionAfter || 'Good',
// // // // //                 remarks: remarks || '',
// // // // //                 submit_date: new Date().toISOString().split('T')[0]
// // // // //             });

// // // // //             const resp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/book-submissions`, "POST", body);
// // // // //             if (!resp.ok) {
// // // // //                 const err = await resp.json().catch(() => ({}));
// // // // //                 PubSub.publish("RECORD_SAVED_TOAST", { title: "Error", message: err.errors || "Failed to submit book", type: "error" });
// // // // //                 return;
// // // // //             }

// // // // //             const result = await resp.json();
// // // // //             if (result && result.success) {
// // // // //                 PubSub.publish("RECORD_SAVED_TOAST", {
// // // // //                     title: "Success",
// // // // //                     message: `Book submitted successfully for ${selectedIssue.issued_to_name || selectedIssue.student_name || selectedIssue.issued_to}`
// // // // //                 });

// // // // //                 // Remove the issue from lists
// // // // //                 setBookIssues(prev => prev.filter(item => item.id !== selectedIssue.id));
// // // // //                 setCardIssues(prev => prev.filter(item => item.id !== selectedIssue.id));

// // // // //                 // Close modal and reset form
// // // // //                 handleModalClose();

// // // // //                 // Clear main data if this was the last issue
// // // // //                 if (bookIssues.length === 1 && cardIssues.length === 0) {
// // // // //                     setIsbn("");
// // // // //                     setBook(null);
// // // // //                     setIssue(null);
// // // // //                     setLibraryCard(null);
// // // // //                 }
// // // // //             } else {
// // // // //                 PubSub.publish("RECORD_SAVED_TOAST", {
// // // // //                     title: "Error",
// // // // //                     message: (result && result.errors) || "Failed to submit book",
// // // // //                     type: "error"
// // // // //                 });
// // // // //             }
// // // // //         } catch (error) {
// // // // //             console.error("Error submitting book:", error);
// // // // //             PubSub.publish("RECORD_SAVED_TOAST", {
// // // // //                 title: "Error",
// // // // //                 message: error.message || "Error submitting book",
// // // // //                 type: "error"
// // // // //             });
// // // // //         } finally {
// // // // //             setLoading(false);
// // // // //         }
// // // // //     };

// // // // //     // Calculate counts for display
// // // // //     const bookCounts = libraryCard ? calculateBookCounts(cardIssues) : calculateBookCounts(bookIssues);

// // // // //     return (
// // // // //         <>
// // // // //             <Container fluid className="mt-3" style={{ marginTop: "0.5rem", padding: "0 1.5rem" }}>
// // // // //                 {/* Header Section */}
// // // // //                 <Row className="mb-4">
// // // // //                     <Col>
// // // // //                         <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
// // // // //                             <div>
// // // // //                                 <h4 className="mb-1 fw-bold" style={{ color: "#6f42c1", fontSize: "1.75rem" }}>
// // // // //                                     <i className="fa-solid fa-book-return me-2"></i>
// // // // //                                     Book Submission
// // // // //                                 </h4>
// // // // //                                 <p className="text-muted mb-0" style={{ fontSize: "15px" }}>Return books by scanning barcode or entering ISBN</p>
// // // // //                             </div>
// // // // //                             <Badge bg="light" text="dark" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem", fontWeight: "500" }}>
// // // // //                                 <i className="fa-solid fa-bolt me-1"></i>
// // // // //                                 Quick Submit
// // // // //                             </Badge>
// // // // //                         </div>
// // // // //                     </Col>
// // // // //                 </Row>

// // // // //                 {/* Main Content - Full Width */}
// // // // //                 <Row>
// // // // //                     <Col lg={12}>
// // // // //                         {/* Book Identification Card */}
// // // // //                         <Card className="mb-4 shadow-sm" style={{ background: "#f3e8ff", border: "1px solid #d8b4fe", borderRadius: "8px" }}>
// // // // //                             <Card.Header style={{ background: "#e9d5ff", border: "none", borderBottom: "1px solid #d8b4fe", borderRadius: "8px 8px 0 0" }}>
// // // // //                                 <h5 className="mb-0 fw-bold" style={{ color: "#000000", fontSize: "18px" }}>
// // // // //                                     <i className="fa-solid fa-barcode me-2" style={{ color: "#6b7280" }}></i>
// // // // //                                     Book Identification
// // // // //                                 </h5>
// // // // //                             </Card.Header>
// // // // //                             <Card.Body className="p-4">
// // // // //                                 {/* Scan/Enter ISBN Section */}
// // // // //                                 <div className="mb-4">
// // // // //                                     <div className="d-flex align-items-center gap-3 flex-wrap">
// // // // //                                         {/* Scan Button */}
// // // // //                                         <Button
// // // // //                                             variant="primary"
// // // // //                                             onClick={() => handleScanButtonClick("scan")}
// // // // //                                             size="lg"
// // // // //                                             style={{
// // // // //                                                 height: "48px",
// // // // //                                                 backgroundColor: "#0d6efd",
// // // // //                                                 border: "none",
// // // // //                                                 borderRadius: "8px",
// // // // //                                                 minWidth: "220px",
// // // // //                                                 fontWeight: "600",
// // // // //                                                 fontSize: "0.95rem",
// // // // //                                                 boxShadow: "0 2px 4px rgba(13, 110, 253, 0.3)"
// // // // //                                             }}
// // // // //                                         >
// // // // //                                             <i className="fa-solid fa-camera me-2"></i>
// // // // //                                             Scan Barcode / Library Card
// // // // //                                         </Button>

// // // // //                                         {/* Or Separator */}
// // // // //                                         <div className="text-muted fw-bold" style={{ minWidth: "40px", textAlign: "center", fontSize: "0.9rem" }}>
// // // // //                                             OR
// // // // //                                         </div>

// // // // //                                         {/* Manual Input Group */}
// // // // //                                         <InputGroup style={{ flex: "1", minWidth: "300px" }}>
// // // // //                                             <Form.Control
// // // // //                                                 ref={isbnInputRef}
// // // // //                                                 type="text"
// // // // //                                                 placeholder="Type ISBN number here And Library Card Number"
// // // // //                                                 value={isbn}
// // // // //                                                 onChange={handleIsbnChange}
// // // // //                                                 onKeyDown={handleIsbnKeyDown}
// // // // //                                                 autoFocus
// // // // //                                                 disabled={loading}
// // // // //                                                 size="lg"
// // // // //                                                 style={{
// // // // //                                                     border: "1px solid #dee2e6",
// // // // //                                                     borderRadius: "8px 0 0 8px",
// // // // //                                                     fontSize: "0.95rem",
// // // // //                                                     padding: "0.75rem 1rem"
// // // // //                                                 }}
// // // // //                                             />
// // // // //                                             {loading && (
// // // // //                                                 <InputGroup.Text style={{
// // // // //                                                     border: "1px solid #dee2e6",
// // // // //                                                     borderLeft: "none",
// // // // //                                                     borderRadius: "0",
// // // // //                                                     backgroundColor: "#f8f9fa"
// // // // //                                                 }}>
// // // // //                                                     <Spinner animation="border" size="sm" />
// // // // //                                                 </InputGroup.Text>
// // // // //                                             )}
// // // // //                                             <Button
// // // // //                                                 variant="outline-secondary"
// // // // //                                                 onClick={() => {
// // // // //                                                     if (isbnInputRef.current?.timer) {
// // // // //                                                         clearTimeout(isbnInputRef.current.timer);
// // // // //                                                     }
// // // // //                                                     setIsbn("");
// // // // //                                                     setBook(null);
// // // // //                                                     setIssue(null);
// // // // //                                                     setLibraryCard(null);
// // // // //                                                     setCardIssues([]);
// // // // //                                                     setBookIssues([]);
// // // // //                                                     setPenalty({ penalty: 0, daysOverdue: 0 });
// // // // //                                                     isbnInputRef.current?.focus();
// // // // //                                                 }}
// // // // //                                                 disabled={loading}
// // // // //                                                 size="lg"
// // // // //                                                 style={{
// // // // //                                                     border: "1px solid #dee2e6",
// // // // //                                                     borderLeft: loading ? "none" : "1px solid #dee2e6",
// // // // //                                                     borderRadius: loading ? "0 8px 8px 0" : "0 8px 8px 0",
// // // // //                                                     minWidth: "50px",
// // // // //                                                     backgroundColor: "#f8f9fa"
// // // // //                                                 }}
// // // // //                                             >
// // // // //                                                 <i className="fa-solid fa-xmark"></i>
// // // // //                                             </Button>
// // // // //                                         </InputGroup>
// // // // //                                     </div>
// // // // //                                 </div>

// // // // //                             </Card.Body>
// // // // //                         </Card>

// // // // //                         {/* Book Details - Show ISBN search results */}
// // // // //                         {book && (
// // // // //                             <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
// // // // //                                 <Card.Header className="py-3 px-4" style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #6f42c1" }}>
// // // // //                                     <div className="d-flex justify-content-between align-items-center">
// // // // //                                         <h6 className="mb-0 fw-bold" style={{ color: "#6f42c1", fontSize: "1rem" }}>
// // // // //                                             <i className="fa-solid fa-book me-2"></i>
// // // // //                                             Book Details for ISBN: {isbn}
// // // // //                                         </h6>
// // // // //                                     </div>
// // // // //                                 </Card.Header>
// // // // //                                 <Card.Body className="py-3 px-4">
// // // // //                                     <Row>
// // // // //                                         <Col md={6}>
// // // // //                                             <div className="mb-1">
// // // // //                                                 <strong className="small">Title:</strong>
// // // // //                                                 <div className="text-secondary small">
// // // // //                                                     <a
// // // // //                                                         href={`/books/${book.id}`}
// // // // //                                                         onClick={(e) => {
// // // // //                                                             e.preventDefault();
// // // // //                                                             navigate(`/books/${book.id}`);
// // // // //                                                         }}
// // // // //                                                         style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 600 }}
// // // // //                                                         onMouseEnter={(e) => {
// // // // //                                                             try {
// // // // //                                                                 localStorage.setItem(`prefetch:book:${book.id}`, JSON.stringify(book));
// // // // //                                                             } catch (err) { }
// // // // //                                                             e.target.style.textDecoration = "underline";
// // // // //                                                         }}
// // // // //                                                         onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
// // // // //                                                     >
// // // // //                                                         {book.title}
// // // // //                                                     </a>
// // // // //                                                 </div>
// // // // //                                             </div>
// // // // //                                         </Col>
// // // // //                                         <Col md={6}>
// // // // //                                             <div className="mb-1">
// // // // //                                                 <strong className="small">ISBN:</strong>
// // // // //                                                 <div className="text-secondary small">{book.isbn}</div>
// // // // //                                             </div>
// // // // //                                         </Col>
// // // // //                                     </Row>
// // // // //                                     <Row>
// // // // //                                         <Col md={6}>
// // // // //                                             <div className="mb-1">
// // // // //                                                 <strong className="small">Author:</strong>
// // // // //                                                 <div className="text-secondary small">{book.author || "N/A"}</div>
// // // // //                                             </div>
// // // // //                                         </Col>
// // // // //                                         <Col md={6}>
// // // // //                                             <div className="mb-1">
// // // // //                                                 <strong className="small">Available Copies:</strong>
// // // // //                                                 <div className="text-secondary small">{book.available_copies || 0}</div>
// // // // //                                             </div>
// // // // //                                         </Col>
// // // // //                                     </Row>
// // // // //                                 </Card.Body>
// // // // //                             </Card>
// // // // //                         )}

// // // // //                         {/* Library Card Details */}
// // // // //                         {libraryCard && (
// // // // //                             <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
// // // // //                                 <Card.Header className="py-3 px-4" style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #0d6efd" }}>
// // // // //                                     <div className="d-flex justify-content-between align-items-center">
// // // // //                                         <h6 className="mb-0 fw-bold" style={{ color: "#0d6efd", fontSize: "1rem" }}>
// // // // //                                             <i className="fa-solid fa-id-card me-2"></i>
// // // // //                                             Library Card
// // // // //                                         </h6>
// // // // //                                         <Badge bg="primary" className="ms-2" style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}>
// // // // //                                             {cardIssues.length} Books Issued
// // // // //                                         </Badge>
// // // // //                                     </div>
// // // // //                                 </Card.Header>
// // // // //                                 <Card.Body className="py-3 px-4">
// // // // //                                     <Row>
// // // // //                                         <Col md={6}>
// // // // //                                             <div className="mb-1">
// // // // //                                                 <strong className="small">Card Number:</strong>
// // // // //                                                 <div className="text-secondary small">{libraryCard.card_number}</div>
// // // // //                                             </div>
// // // // //                                         </Col>
// // // // //                                         <Col md={6}>
// // // // //                                             <div className="mb-1">
// // // // //                                                 <strong className="small">Holder:</strong>
// // // // //                                                 <div className="text-secondary small">{libraryCard.user_name || libraryCard.user_email || '-'}</div>
// // // // //                                             </div>
// // // // //                                         </Col>
// // // // //                                     </Row>

// // // // //                                     {cardIssues && cardIssues.length > 0 && (
// // // // //                                         <div className="mt-2">
// // // // //                                             <h6 className="mb-1 small">Books currently issued to this card</h6>
// // // // //                                             <div className="table-responsive">
// // // // //                                                 <Table striped bordered hover size="sm" className="mb-0 small">
// // // // //                                                     <thead style={{ backgroundColor: "white" }}>
// // // // //                                                         <tr>
// // // // //                                                             <th>Title</th>
// // // // //                                                             <th>ISBN</th>
// // // // //                                                             <th>Issue Date</th>
// // // // //                                                             <th>Due Date</th>
// // // // //                                                             <th style={{ width: 80 }}>Action</th>
// // // // //                                                         </tr>
// // // // //                                                     </thead>
// // // // //                                                     <tbody>
// // // // //                                                         {cardIssues.map((ci) => {
// // // // //                                                             const bookKey = `${ci.book_title}_${ci.book_isbn}`;
// // // // //                                                             const count = bookCounts[bookKey] || 1;
// // // // //                                                             return (
// // // // //                                                                 <tr key={ci.id}>
// // // // //                                                                     <td>
// // // // //                                                                         {ci.book_title}
// // // // //                                                                         {count > 1 && (
// // // // //                                                                             <Badge bg="warning" text="dark" className="ms-1">
// // // // //                                                                                 {count}x
// // // // //                                                                             </Badge>
// // // // //                                                                         )}
// // // // //                                                                     </td>
// // // // //                                                                     <td>{ci.book_isbn}</td>
// // // // //                                                                     <td>{formatDate(ci.issue_date)}</td>
// // // // //                                                                     <td>{formatDate(ci.due_date)}</td>
// // // // //                                                                     <td>
// // // // //                                                                         <Button
// // // // //                                                                             size="sm"
// // // // //                                                                             onClick={() => handleSubmitClick(ci)}
// // // // //                                                                             variant="success"
// // // // //                                                                             className="small py-0"
// // // // //                                                                         >
// // // // //                                                                             Submit
// // // // //                                                                         </Button>
// // // // //                                                                     </td>
// // // // //                                                                 </tr>
// // // // //                                                             );
// // // // //                                                         })}
// // // // //                                                     </tbody>
// // // // //                                                 </Table>
// // // // //                                             </div>
// // // // //                                         </div>
// // // // //                                     )}
// // // // //                                 </Card.Body>
// // // // //                             </Card>
// // // // //                         )}

// // // // //                         {/* Book Issues List - FIXED NAVIGATION */}
// // // // //                         {bookIssues && bookIssues.length > 0 && (
// // // // //                             <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
// // // // //                                 <Card.Header className="py-3 px-4" style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #ffc107" }}>
// // // // //                                     <div className="d-flex justify-content-between align-items-center">
// // // // //                                         <h6 className="mb-0 fw-bold" style={{ color: "#856404", fontSize: "1rem" }}>
// // // // //                                             <i className="fa-solid fa-users me-2 text-warning"></i>
// // // // //                                             People who have this book issued
// // // // //                                         </h6>
// // // // //                                     </div>
// // // // //                                 </Card.Header>
// // // // //                                 <Card.Body className="py-3 px-4">
// // // // //                                     <div className="table-responsive">
// // // // //                                         <Table striped bordered hover size="sm" className="mb-0 small">
// // // // //                                             <thead style={{ backgroundColor: "white" }}>
// // // // //                                                 <tr>
// // // // //                                                     <th>Issued To</th>
// // // // //                                                     <th>Card No</th>
// // // // //                                                     <th>Issue Date</th>
// // // // //                                                     <th>Due Date</th>
// // // // //                                                     <th style={{ width: 80 }}>Action</th>
// // // // //                                                 </tr>
// // // // //                                             </thead>
// // // // //                                             <tbody>
// // // // //                                                 {bookIssues.map((bi) => (
// // // // //                                                     <tr key={bi.id}>
// // // // //                                                         <td>
// // // // //                                                             <Button
// // // // //                                                                 variant="link"
// // // // //                                                                 className="p-0 text-decoration-none"
// // // // //                                                                 onClick={(e) => handleNameClick(
// // // // //                                                                     bi.user_id || bi.student_id,
// // // // //                                                                     bi.issued_to_name || bi.student_name || bi.issued_to,
// // // // //                                                                     e
// // // // //                                                                 )}
// // // // //                                                                 title="View User Details"
// // // // //                                                             >
// // // // //                                                                 <i className="fa-solid fa-user me-1 text-primary"></i>
// // // // //                                                                 {bi.issued_to_name || bi.student_name || bi.issued_to}
// // // // //                                                             </Button>
// // // // //                                                         </td>
// // // // //                                                         <td>{bi.card_number || bi.card_id || '-'}</td>
// // // // //                                                         <td>{formatDate(bi.issue_date)}</td>
// // // // //                                                         <td>{formatDate(bi.due_date)}</td>
// // // // //                                                         <td>
// // // // //                                                             <Button
// // // // //                                                                 size="sm"
// // // // //                                                                 onClick={() => handleSubmitClick(bi)}
// // // // //                                                                 variant="success"
// // // // //                                                                 className="small py-0"
// // // // //                                                             >
// // // // //                                                                 Submit
// // // // //                                                             </Button>
// // // // //                                                         </td>
// // // // //                                                     </tr>
// // // // //                                                 ))}
// // // // //                                             </tbody>
// // // // //                                         </Table>
// // // // //                                     </div>
// // // // //                                 </Card.Body>
// // // // //                             </Card>
// // // // //                         )}
// // // // //                     </Col>
// // // // //                 </Row>
// // // // //             </Container>

// // // // //             {/* Scan Modal */}
// // // // //             <Modal show={showScanModal} onHide={() => setShowScanModal(false)} centered>
// // // // //                 <Modal.Header closeButton>
// // // // //                     <Modal.Title>
// // // // //                         <i className={`fa-solid ${scanMethod === "isbn" ? "fa-barcode" : "fa-address-card"} me-2`}></i>
// // // // //                         {scanMethod === "isbn" ? "Scan Barcode" : "Scan Library Card"}
// // // // //                     </Modal.Title>
// // // // //                 </Modal.Header>
// // // // //                 <Modal.Body>
// // // // //                     <div className="text-center">
// // // // //                         <i className={`fa-solid ${scanMethod === "isbn" ? "fa-barcode" : "fa-address-card"} fa-4x mb-3`}
// // // // //                             style={{ color: scanMethod === "isbn" ? "#0d6efd" : "#28a745" }}></i>
// // // // //                         <h5>Ready to Scan</h5>
// // // // //                         <p className="text-muted">
// // // // //                             {scanMethod === "isbn"
// // // // //                                 ? "Point your barcode scanner at the book barcode and scan."
// // // // //                                 : "Scan the library card barcode to retrieve member details."}
// // // // //                         </p>

// // // // //                         <Form.Group className="mt-4">
// // // // //                             <Form.Label>
// // // // //                                 <strong>
// // // // //                                     {scanMethod === "isbn" ? "Scanned ISBN:" : "Scanned Library Card:"}
// // // // //                                 </strong>
// // // // //                             </Form.Label>
// // // // //                             <Form.Control
// // // // //                                 type="text"
// // // // //                                 placeholder={scanMethod === "isbn" ? "Scanning will auto-populate here..." : "LIB123456..."}
// // // // //                                 value={isbn}
// // // // //                                 onChange={handleIsbnChange}
// // // // //                                 onKeyDown={handleIsbnKeyDown}
// // // // //                                 autoFocus
// // // // //                                 className="text-center fw-bold"
// // // // //                                 style={{ fontSize: "18px" }}
// // // // //                                 onBlur={() => {
// // // // //                                     if (isbn.trim().length >= 3 && !loading) {
// // // // //                                         performSearch(isbn.trim(), 'auto');
// // // // //                                     }
// // // // //                                 }}
// // // // //                             />
// // // // //                             <Form.Text className="text-muted">
// // // // //                                 {scanMethod === "isbn"
// // // // //                                     ? "Enter 10 or 13 digit ISBN number"
// // // // //                                     : "Enter library card number starting with LIB"}
// // // // //                             </Form.Text>
// // // // //                         </Form.Group>
// // // // //                     </div>
// // // // //                 </Modal.Body>
// // // // //                 <Modal.Footer>
// // // // //                     <Button variant="secondary" onClick={() => setShowScanModal(false)}>
// // // // //                         Cancel
// // // // //                     </Button>
// // // // //                     <Button
// // // // //                         variant="primary"
// // // // //                         onClick={handleScanSubmit}
// // // // //                         disabled={!isbn.trim()}
// // // // //                     >
// // // // //                         <i className="fa-solid fa-check me-2"></i>
// // // // //                         {scanMethod === "isbn" ? "Search Book" : "Search Card"}
// // // // //                     </Button>
// // // // //                 </Modal.Footer>
// // // // //             </Modal>

// // // // //             {/* Submit Confirmation Modal */}
// // // // //             <Modal show={showSubmitModal} onHide={handleModalClose} centered size="lg">
// // // // //                 <Modal.Header closeButton>
// // // // //                     <Modal.Title>
// // // // //                         <i className="fa-solid fa-paper-plane me-2 text-success"></i>
// // // // //                         Submit Book Return
// // // // //                     </Modal.Title>
// // // // //                 </Modal.Header>
// // // // //                 <Modal.Body>
// // // // //                     {selectedIssue && (
// // // // //                         <div>
// // // // //                             <h6 className="mb-3">Book Return Details</h6>

// // // // //                             {/* Issue Details */}
// // // // //                             <Card className="mb-3 ">
// // // // //                                 <Card.Header className="  py-2">
// // // // //                                     <h6 className="mb-0 small">Issue Information</h6>
// // // // //                                 </Card.Header>
// // // // //                                 <Card.Body className="py-2">
// // // // //                                     <Row>
// // // // //                                         <Col md={6}>
// // // // //                                             <strong className="small">Book Title:</strong>
// // // // //                                             <div className="text-secondary small">{selectedIssue.book_title || book?.title}</div>
// // // // //                                         </Col>
// // // // //                                         <Col md={6}>
// // // // //                                             <strong className="small">ISBN:</strong>
// // // // //                                             <div className="text-secondary small">{selectedIssue.book_isbn || book?.isbn}</div>
// // // // //                                         </Col>
// // // // //                                     </Row>
// // // // //                                     <Row className="mt-2">
// // // // //                                         <Col md={6}>
// // // // //                                             <strong className="small">Issued To:</strong>
// // // // //                                             <div className="text-secondary small">
// // // // //                                                 <Button
// // // // //                                                     variant="link"
// // // // //                                                     className="p-0 text-decoration-none"
// // // // //                                                     onClick={(e) => handleNameClick(
// // // // //                                                         selectedIssue.user_id || selectedIssue.student_id,
// // // // //                                                         selectedIssue.issued_to_name || selectedIssue.student_name || selectedIssue.issued_to,
// // // // //                                                         e
// // // // //                                                     )}
// // // // //                                                     title="View User Details"
// // // // //                                                 >
// // // // //                                                     <i className="fa-solid fa-user me-1 text-primary"></i>
// // // // //                                                     {selectedIssue.issued_to_name || selectedIssue.student_name || selectedIssue.issued_to}
// // // // //                                                 </Button>
// // // // //                                             </div>
// // // // //                                         </Col>
// // // // //                                         <Col md={6}>
// // // // //                                             <strong className="small">Card Number:</strong>
// // // // //                                             <div className="text-secondary small">{selectedIssue.card_number || selectedIssue.card_id || '-'}</div>
// // // // //                                         </Col>
// // // // //                                     </Row>
// // // // //                                     <Row className="mt-2">
// // // // //                                         <Col md={6}>
// // // // //                                             <strong className="small">Issue Date:</strong>
// // // // //                                             <div className="text-secondary small">{formatDate(selectedIssue.issue_date)}</div>
// // // // //                                         </Col>
// // // // //                                         <Col md={6}>
// // // // //                                             <strong className="small">Due Date:</strong>
// // // // //                                             <div className="text-secondary small">{formatDate(selectedIssue.due_date)}</div>
// // // // //                                         </Col>
// // // // //                                     </Row>
// // // // //                                 </Card.Body>
// // // // //                             </Card>

// // // // //                             {/* Condition Assessment Form */}
// // // // //                             <Card className="mb-3 ">
// // // // //                                 <Card.Header className=" py-2">
// // // // //                                     <h6 className="mb-0 small">Condition Assessment</h6>
// // // // //                                 </Card.Header>
// // // // //                                 <Card.Body className="py-2">
// // // // //                                     <Row>
// // // // //                                         <Col md={6}>
// // // // //                                             <Form.Group className="mb-2">
// // // // //                                                 <Form.Label className="small fw-bold">Condition Before</Form.Label>
// // // // //                                                 <Form.Control
// // // // //                                                     type="text"
// // // // //                                                     value={selectedIssue.condition_before || conditionBefore}
// // // // //                                                     onChange={(e) => setConditionBefore(e.target.value)}
// // // // //                                                     disabled={loading}
// // // // //                                                     size="sm"
// // // // //                                                     className="small"
// // // // //                                                 />
// // // // //                                             </Form.Group>
// // // // //                                         </Col>
// // // // //                                         <Col md={6}>
// // // // //                                             <Form.Group className="mb-2">
// // // // //                                                 <Form.Label className="small fw-bold">Condition After</Form.Label>
// // // // //                                                 <Form.Select
// // // // //                                                     value={conditionAfter}
// // // // //                                                     onChange={(e) => setConditionAfter(e.target.value)}
// // // // //                                                     disabled={loading}
// // // // //                                                     size="sm"
// // // // //                                                     className="small"
// // // // //                                                 >
// // // // //                                                     <option value="Good">✅ Good</option>
// // // // //                                                     <option value="Fair">⚠️ Fair</option>
// // // // //                                                     <option value="Damaged">❌ Damaged</option>
// // // // //                                                 </Form.Select>
// // // // //                                             </Form.Group>
// // // // //                                         </Col>
// // // // //                                     </Row>
// // // // //                                     <Form.Group className="mb-2">
// // // // //                                         <Form.Label className="small fw-bold">Remarks</Form.Label>
// // // // //                                         <Form.Control
// // // // //                                             as="textarea"
// // // // //                                             rows={3}
// // // // //                                             placeholder="Add notes about book condition..."
// // // // //                                             value={remarks}
// // // // //                                             onChange={(e) => setRemarks(e.target.value)}
// // // // //                                             disabled={loading}
// // // // //                                             size="sm"
// // // // //                                             className="small"
// // // // //                                         />
// // // // //                                     </Form.Group>
// // // // //                                 </Card.Body>
// // // // //                             </Card>

// // // // //                             {/* Penalty Information */}
// // // // //                             <Card>
// // // // //                                 <Card.Header className="py-2">
// // // // //                                     <h6 className="mb-0 small">Penalty Information</h6>
// // // // //                                 </Card.Header>
// // // // //                                 <Card.Body className="py-2">
// // // // //                                     <div className="text-center">
// // // // //                                         <h5 style={{
// // // // //                                             color: penalty.penalty > 0 ? "#dc3545" : "#28a745",
// // // // //                                             fontWeight: "bold"
// // // // //                                         }}>
// // // // //                                             ₹{penalty.penalty || 0}
// // // // //                                         </h5>
// // // // //                                         <p className="small text-muted mb-0">
// // // // //                                             {penalty.daysOverdue ? `Overdue by ${penalty.daysOverdue} day(s)` : "No overdue penalty"}
// // // // //                                         </p>
// // // // //                                     </div>
// // // // //                                 </Card.Body>
// // // // //                             </Card>
// // // // //                         </div>
// // // // //                     )}
// // // // //                 </Modal.Body>
// // // // //                 <Modal.Footer>
// // // // //                     <Button variant="secondary" onClick={handleModalClose} disabled={loading}>
// // // // //                         <i className="fa-solid fa-times me-2"></i>
// // // // //                         Cancel
// // // // //                     </Button>
// // // // //                     <Button variant="success" onClick={handleFinalSubmit} disabled={loading}>
// // // // //                         {loading ? (
// // // // //                             <>
// // // // //                                 <Spinner animation="border" size="sm" className="me-2" />
// // // // //                                 Submitting...
// // // // //                             </>
// // // // //                         ) : (
// // // // //                             <>
// // // // //                                 <i className="fa-solid fa-check me-2"></i>
// // // // //                                 Confirm Submit
// // // // //                             </>
// // // // //                         )}
// // // // //                     </Button>
// // // // //                 </Modal.Footer>
// // // // //             </Modal>
// // // // //         </>
// // // // //     );
// // // // // };

// // // // // export default ReturnBook;
// // // // import React, { useState, useEffect } from "react";
// // // // import { Container, Row, Col, Card, Form, Button, Spinner, Badge, InputGroup, Table, Modal, Tab, Nav } from "react-bootstrap";
// // // // import { useNavigate } from "react-router-dom";
// // // // import helper from "../common/helper";
// // // // import PubSub from "pubsub-js";
// // // // import * as constants from "../../constants/CONSTANT";
// // // // import DataApi from "../../api/dataApi";
// // // // import ResizableTable from "../common/ResizableTable";

// // // // const BookSubmit = () => {
// // // //     const navigate = useNavigate();
// // // //     const [isbn, setIsbn] = useState("");
// // // //     const [cardNumber, setCardNumber] = useState("");
// // // //     const [searchMode, setSearchMode] = useState("isbn"); // "isbn" or "card"
// // // //     const [loading, setLoading] = useState(false);
// // // //     const [book, setBook] = useState(null);
// // // //     const [libraryCard, setLibraryCard] = useState(null);
// // // //     const [cardIssues, setCardIssues] = useState([]);
// // // //     const [issue, setIssue] = useState(null);
// // // //     const [bookIssues, setBookIssues] = useState([]);
// // // //     const [penalty, setPenalty] = useState({ penalty: 0, daysOverdue: 0 });
// // // //     const [conditionBefore, setConditionBefore] = useState("Good");
// // // //     const [conditionAfter, setConditionAfter] = useState("Good");
// // // //     const [remarks, setRemarks] = useState("");
// // // //     const [isScanning, setIsScanning] = useState(false);
// // // //     const [showScanModal, setShowScanModal] = useState(false);
// // // //     const [showSubmitModal, setShowSubmitModal] = useState(false);
// // // //     const [selectedIssue, setSelectedIssue] = useState(null);
// // // //     const [activeTab, setActiveTab] = useState("submit");
// // // //     const [submittedBooks, setSubmittedBooks] = useState([]);
// // // //     const [loadingSubmitted, setLoadingSubmitted] = useState(false);
// // // //     const [searchTerm, setSearchTerm] = useState("");
// // // //     const [currentPage, setCurrentPage] = useState(1);
// // // //     const recordsPerPage = 20;
// // // //     const isbnInputRef = React.useRef(null);
// // // //     const cardInputRef = React.useRef(null);

// // // //     const formatDate = (dateStr) => {
// // // //         if (!dateStr) return "-";
// // // //         try {
// // // //             const d = new Date(dateStr);
// // // //             if (isNaN(d)) return dateStr;
// // // //             const dd = String(d.getDate()).padStart(2, "0");
// // // //             const mm = String(d.getMonth() + 1).padStart(2, "0");
// // // //             const yyyy = d.getFullYear();
// // // //             return `${dd}-${mm}-${yyyy}`;
// // // //         } catch (e) {
// // // //             return dateStr;
// // // //         }
// // // //     };

// // // //     // Navigate to user detail page - Fixed to support right-click
// // // //     const handleNameClick = (userId, userName, issueData, e) => {
// // // //         if (e) {
// // // //             e.preventDefault();
// // // //             e.stopPropagation();
// // // //         }

// // // //         if (userId) {
// // // //             try {
// // // //                 // Store prefetch data for the detail page
// // // //                 const prefetchData = issueData || { id: userId, name: userName };
// // // //                 localStorage.setItem(`prefetch:user:${userId}`, JSON.stringify(prefetchData));
// // // //             } catch (err) {
// // // //                 console.warn("Failed to store prefetch data:", err);
// // // //             }

// // // //             // Check if right-click (context menu) or middle-click
// // // //             if (e && (e.button === 2 || e.ctrlKey || e.metaKey)) {
// // // //                 window.open(`/user/${userId}`, '_blank');
// // // //             } else {
// // // //                 navigate(`/user/${userId}`, {
// // // //                     state: { userName: userName, ...issueData },
// // // //                 });
// // // //             }
// // // //         }
// // // //     };

// // // //     // Fetch submitted books
// // // //     useEffect(() => {
// // // //         if (activeTab === "submitted") {
// // // //             fetchSubmittedBooks();
// // // //         }
// // // //     }, [activeTab]);

// // // //     const fetchSubmittedBooks = async () => {
// // // //         try {
// // // //             setLoadingSubmitted(true);
// // // //             const submissionApi = new DataApi("book_submissions");
// // // //             const response = await submissionApi.fetchAll();
// // // //             let submissions = [];
// // // //             if (response.data && response.data.success && Array.isArray(response.data.data)) {
// // // //                 submissions = response.data.data;
// // // //             } else if (Array.isArray(response.data)) {
// // // //                 submissions = response.data;
// // // //             }
// // // //             setSubmittedBooks(submissions);
// // // //         } catch (error) {
// // // //             console.error("Error fetching submitted books:", error);
// // // //             PubSub.publish("RECORD_ERROR_TOAST", {
// // // //                 title: "Error",
// // // //                 message: "Failed to fetch submitted books"
// // // //             });
// // // //             setSubmittedBooks([]);
// // // //         } finally {
// // // //             setLoadingSubmitted(false);
// // // //         }
// // // //     };

// // // //     // Perform search with ISBN or Library Card
// // // //     const performSearch = async (value, mode = null) => {
// // // //         const searchType = mode || searchMode;
// // // //         console.log("Performing search with:", value, "mode:", searchType);

// // // //         if (!value || value.trim() === "") {
// // // //             PubSub.publish("RECORD_ERROR_TOAST", {
// // // //                 title: "Validation",
// // // //                 message: `Please enter or scan ${searchType === "card" ? "Library Card Number" : "ISBN"}`
// // // //             });
// // // //             return;
// // // //         }

// // // //         try {
// // // //             setLoading(true);

// // // //             if (searchType === "card") {
// // // //                 // Search by library card number
// // // //                 const cardResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/librarycard/card/${encodeURIComponent(value.trim().toUpperCase())}`, "GET");
// // // //                 if (!cardResp.ok) {
// // // //                     const err = await cardResp.json().catch(() => ({}));
// // // //                     PubSub.publish("RECORD_ERROR_TOAST", { title: "Not Found", message: err.errors || "Library card not found" });
// // // //                     setLibraryCard(null);
// // // //                     setCardIssues([]);
// // // //                     setBook(null);
// // // //                     setBookIssues([]);
// // // //                     return;
// // // //                 }

// // // //                 const cardData = await cardResp.json();
// // // //                 setLibraryCard(cardData);

// // // //                 // Find active issues for this card
// // // //                 const issuesResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/card/${cardData.id}`, "GET");
// // // //                 if (!issuesResp.ok) {
// // // //                     const err = await issuesResp.json().catch(() => ({}));
// // // //                     PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: err.errors || "Failed to fetch issue records" });
// // // //                     setCardIssues([]);
// // // //                     return;
// // // //                 }

// // // //                 const issues = await issuesResp.json();
// // // //                 if (!issues || !Array.isArray(issues) || issues.length === 0) {
// // // //                     PubSub.publish("RECORD_ERROR_TOAST", { title: "No Active Issue", message: "No active issued record found for this library card" });
// // // //                     setCardIssues([]);
// // // //                     return;
// // // //                 }

// // // //                 setCardIssues(issues);
// // // //                 setBook(null);
// // // //                 setBookIssues([]);
// // // //             } else {
// // // //                 // Search book by ISBN
// // // //                 const bookResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/book/isbn/${encodeURIComponent(value.trim())}`, "GET");
// // // //                 if (!bookResp.ok) {
// // // //                     const err = await bookResp.json().catch(() => ({}));
// // // //                     PubSub.publish("RECORD_ERROR_TOAST", { title: "Not Found", message: err.errors || "Book not found" });
// // // //                     setBook(null);
// // // //                     setIssue(null);
// // // //                     setBookIssues([]);
// // // //                     return;
// // // //                 }

// // // //                 const bookData = await bookResp.json();
// // // //                 setBook(bookData);

// // // //                 // Find active issues for this book
// // // //                 const issuesResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/book/${bookData.id}`, "GET");
// // // //                 if (!issuesResp.ok) {
// // // //                     const err = await issuesResp.json().catch(() => ({}));
// // // //                     PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: err.errors || "Failed to fetch issue records" });
// // // //                     setIssue(null);
// // // //                     setBookIssues([]);
// // // //                     return;
// // // //                 }

// // // //                 const issues = await issuesResp.json();
// // // //                 if (!issues || !Array.isArray(issues) || issues.length === 0) {
// // // //                     PubSub.publish("RECORD_ERROR_TOAST", { title: "No Active Issue", message: "No active issued record found for this ISBN" });
// // // //                     setIssue(null);
// // // //                     setBookIssues([]);
// // // //                     return;
// // // //                 }

// // // //                 setBookIssues(issues);
// // // //                 const activeIssue = issues[0];
// // // //                 setIssue(activeIssue);

// // // //                 // Fetch penalty info
// // // //                 const penaltyResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/penalty/${activeIssue.id}`, "GET");
// // // //                 if (penaltyResp.ok) {
// // // //                     const penaltyData = await penaltyResp.json();
// // // //                     if (penaltyData && penaltyData.success) {
// // // //                         setPenalty(penaltyData.data || { penalty: 0, daysOverdue: 0 });
// // // //                     } else if (penaltyData && penaltyData.data) {
// // // //                         setPenalty(penaltyData.data);
// // // //                     } else {
// // // //                         setPenalty({ penalty: 0, daysOverdue: 0 });
// // // //                     }
// // // //                 } else {
// // // //                     setPenalty({ penalty: 0, daysOverdue: 0 });
// // // //                 }

// // // //                 // Clear library card data when searching by ISBN
// // // //                 setLibraryCard(null);
// // // //                 setCardIssues([]);
// // // //             }

// // // //         } catch (error) {
// // // //             console.error("Error searching:", error);
// // // //             PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: error.message || "Error searching" });
// // // //             setBook(null);
// // // //             setIssue(null);
// // // //             setBookIssues([]);
// // // //             setLibraryCard(null);
// // // //             setCardIssues([]);
// // // //         } finally {
// // // //             setLoading(false);
// // // //         }
// // // //     };

// // // //     const handleSearch = async () => {
// // // //         const value = searchMode === "card" ? cardNumber : isbn;
// // // //         await performSearch(value, searchMode);
// // // //     };

// // // //     const handleIsbnChange = async (e) => {
// // // //         const value = e.target.value;
// // // //         setIsbn(value);

// // // //         // Auto-search when user types (with debounce)
// // // //         if (value.trim().length >= 3) {
// // // //             if (isbnInputRef.current?.timer) {
// // // //                 clearTimeout(isbnInputRef.current.timer);
// // // //             }

// // // //             isbnInputRef.current.timer = setTimeout(async () => {
// // // //                 if (value.trim().length >= 3) {
// // // //                     await performSearch(value.trim(), "isbn");
// // // //                 }
// // // //             }, 800);
// // // //         } else if (value.trim().length === 0) {
// // // //             // Clear results when input is empty
// // // //             setBook(null);
// // // //             setIssue(null);
// // // //             setBookIssues([]);
// // // //             setPenalty({ penalty: 0, daysOverdue: 0 });
// // // //         }
// // // //     };

// // // //     const handleCardNumberChange = async (e) => {
// // // //         const value = e.target.value;
// // // //         setCardNumber(value);

// // // //         // Auto-search when user types (with debounce)
// // // //         if (value.trim().length >= 3) {
// // // //             if (cardInputRef.current?.timer) {
// // // //                 clearTimeout(cardInputRef.current.timer);
// // // //             }

// // // //             cardInputRef.current.timer = setTimeout(async () => {
// // // //                 if (value.trim().length >= 3) {
// // // //                     await performSearch(value.trim(), "card");
// // // //                 }
// // // //             }, 800);
// // // //         } else if (value.trim().length === 0) {
// // // //             // Clear results when input is empty
// // // //             setLibraryCard(null);
// // // //             setCardIssues([]);
// // // //         }
// // // //     };

// // // //     const handleIsbnKeyDown = async (e) => {
// // // //         if (e.key === 'Enter') {
// // // //             e.preventDefault();
// // // //             if (isbnInputRef.current?.timer) {
// // // //                 clearTimeout(isbnInputRef.current.timer);
// // // //             }
// // // //             setIsScanning(true);
// // // //             await performSearch(isbn, "isbn");
// // // //             setIsScanning(false);
// // // //         }
// // // //     };

// // // //     const handleCardKeyDown = async (e) => {
// // // //         if (e.key === 'Enter') {
// // // //             e.preventDefault();
// // // //             if (cardInputRef.current?.timer) {
// // // //                 clearTimeout(cardInputRef.current.timer);
// // // //             }
// // // //             setIsScanning(true);
// // // //             await performSearch(cardNumber, "card");
// // // //             setIsScanning(false);
// // // //         }
// // // //     };

// // // //     const handleScanButtonClick = () => {
// // // //         setShowScanModal(true);
// // // //     };

// // // //     const handleScanSubmit = async () => {
// // // //         if (isbn.trim()) {
// // // //             setShowScanModal(false);
// // // //             await performSearch(isbn);
// // // //         }
// // // //     };

// // // //     const handleSubmitClick = (issueItem) => {
// // // //         setSelectedIssue(issueItem);
// // // //         setShowSubmitModal(true);
// // // //     };

// // // //     const handleModalClose = () => {
// // // //         setShowSubmitModal(false);
// // // //         setSelectedIssue(null);
// // // //         setConditionAfter("Good");
// // // //         setRemarks("");
// // // //     };

// // // //     // const handleFinalSubmit = async () => {
// // // //     //     if (!selectedIssue) return;

// // // //     //     try {
// // // //     //         setLoading(true);

// // // //     //         // Prepare the submission data
// // // //     //         const submissionData = {
// // // //     //             issue_id: selectedIssue.id,
// // // //     //             condition_before: selectedIssue.condition_before || conditionBefore || 'Good',
// // // //     //             condition_after: conditionAfter || 'Good',
// // // //     //             remarks: remarks || '',
// // // //     //             submit_date: new Date().toISOString().split('T')[0],
// // // //     //             penalty_amount: penalty.penalty || 0,
// // // //     //             days_overdue: penalty.daysOverdue || 0
// // // //     //         };

// // // //     //         console.log("Submitting data:", submissionData);

// // // //     //         const bookSubmissionApi = new DataApi("book_submissions");
// // // //     //         console.log("BookSubmissionApi instance:", bookSubmissionApi);
// // // //     //         const response = await bookSubmissionApi.create(submissionData);
// // // //     //         console.log("responseresponse data:", response);
// // // //     //         console.log("Submission data sent:", submissionData);

// // // //     //         console.log("Create response:", response);

// // // //     //         if (response.data && response.data.success) {
// // // //     //             PubSub.publish("RECORD_SAVED_TOAST", {
// // // //     //                 title: "Success",
// // // //     //                 message: `Book submitted successfully for ${selectedIssue.issued_to_name || selectedIssue.student_name || selectedIssue.issued_to}`
// // // //     //             });

// // // //     //             // Update the book issues list
// // // //     //             setBookIssues(prev => prev.filter(item => item.id !== selectedIssue.id));

// // // //     //             // Reset form and close modal
// // // //     //             handleModalClose();

// // // //     //             // If this was the last issue, clear the search
// // // //     //             if (bookIssues.length === 1) {
// // // //     //                 setIsbn("");
// // // //     //                 setBook(null);
// // // //     //                 setIssue(null);
// // // //     //                 setBookIssues([]);
// // // //     //                 setPenalty({ penalty: 0, daysOverdue: 0 });
// // // //     //             }

// // // //     //             // Refresh books data if needed
// // // //     //             // fetchBooks();

// // // //     //         } else {
// // // //     //             // Handle API response errors
// // // //     //             const errorMessage = response.data?.errors || "Failed to submit book";
// // // //     //             PubSub.publish("RECORD_ERROR_TOAST", {
// // // //     //                 title: "Error",
// // // //     //                 message: errorMessage
// // // //     //             });
// // // //     //         }

// // // //     //     } catch (error) {
// // // //     //         console.error("Error submitting book:", error);

// // // //     //         // Handle different error formats
// // // //     //         let errorMessage = "Error submitting book";
// // // //     //         if (error.response?.data) {
// // // //     //             if (typeof error.response.data === 'string') {
// // // //     //                 errorMessage = error.response.data;
// // // //     //             } else if (error.response.data.message) {
// // // //     //                 errorMessage = error.response.data.message;
// // // //     //             } else if (error.response.data.errors) {
// // // //     //                 errorMessage = Array.isArray(error.response.data.errors)
// // // //     //                     ? error.response.data.errors.map(e => e.msg || e).join(", ")
// // // //     //                     : error.response.data.errors;
// // // //     //             }
// // // //     //         } else if (error.message) {
// // // //     //             errorMessage = error.message;
// // // //     //         }

// // // //     //         PubSub.publish("RECORD_ERROR_TOAST", {
// // // //     //             title: "Error",
// // // //     //             message: errorMessage
// // // //     //         });
// // // //     //     } finally {
// // // //     //         setLoading(false);
// // // //     //     }
// // // //     // };

// // // //     const handleFinalSubmit = async () => {
// // // //         if (!selectedIssue) return;

// // // //         try {
// // // //             setLoading(true);

// // // //             // Fetch library settings for penalty calculation
// // // //             let librarySettings = {};
// // // //             try {
// // // //                 const settingsResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/librarysettings`, "GET");
// // // //                 if (settingsResp.ok) {
// // // //                     const settingsData = await settingsResp.json();
// // // //                     librarySettings = settingsData;
// // // //                 }
// // // //             } catch (settingsError) {
// // // //                 console.error("Error fetching library settings:", settingsError);
// // // //             }

// // // //             // Calculate penalty based on settings and conditions
// // // //             let finalPenalty = penalty.penalty || 0;
// // // //             let penaltyDetails = `Overdue: ${penalty.daysOverdue || 0} days`;

// // // //             // If book is damaged or lost, apply full book price penalty
// // // //             if (conditionAfter === 'Damaged' || conditionAfter === 'Lost') {
// // // //                 // Try to get book price from book data or use default from settings
// // // //                 const bookPrice = book?.price || librarySettings.book_price || 500; // Default ₹500 if not available
// // // //                 finalPenalty = bookPrice;
// // // //                 penaltyDetails = `Full book price (${conditionAfter.toLowerCase()})`;

// // // //                 PubSub.publish("RECORD_SAVED_TOAST", {
// // // //                     title: "Full Penalty Applied",
// // // //                     message: `₹${finalPenalty} penalty applied for ${conditionAfter.toLowerCase()} book`
// // // //                 });
// // // //             }

// // // //             // If book is returned after expiry date, calculate penalty from settings
// // // //             const dueDate = new Date(selectedIssue.due_date);
// // // //             const returnDate = new Date();

// // // //             if (returnDate > dueDate && conditionAfter === 'Good') {
// // // //                 const daysOverdue = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
// // // //                 const finePerDay = librarySettings.fine_per_day || 10; // Default ₹10 per day

// // // //                 finalPenalty = daysOverdue * finePerDay;
// // // //                 penaltyDetails = `Overdue: ${daysOverdue} days @ ₹${finePerDay}/day`;
// // // //             }

// // // //             console.log("Final Penalty Calculation:", {
// // // //                 conditionAfter,
// // // //                 finalPenalty,
// // // //                 penaltyDetails,
// // // //                 dueDate: selectedIssue.due_date,
// // // //                 returnDate: returnDate.toISOString().split('T')[0],
// // // //                 bookPrice: book?.price,
// // // //                 librarySettings
// // // //             });

// // // //             // Prepare the submission data
// // // //             const submissionData = {
// // // //                 issue_id: selectedIssue.id,
// // // //                 book_id: selectedIssue.book_id || book?.id,
// // // //                 condition_before: selectedIssue.condition_before || conditionBefore || 'Good',
// // // //                 condition_after: conditionAfter || 'Good',
// // // //                 remarks: remarks || '',
// // // //                 submit_date: new Date().toISOString().split('T')[0],
// // // //                 penalty_amount: finalPenalty,
// // // //                 penalty_details: penaltyDetails,
// // // //                 days_overdue: penalty.daysOverdue || 0,
// // // //                 // Additional fields for backend processing
// // // //                 book_price: book?.price,
// // // //                 fine_per_day: librarySettings.fine_per_day,
// // // //                 is_damaged: conditionAfter === 'Damaged',
// // // //                 is_lost: conditionAfter === 'Lost'
// // // //             };

// // // //             console.log("📤 Submitting data:", submissionData);

// // // //             // Try multiple endpoints for book submission
// // // //             let response;
// // // //             let apiError;

// // // //             // Try different endpoints
// // // //             const endpoints = [
// // // //                 "book_submissions",
// // // //                 "booksubmissions",
// // // //                 "book-returns",
// // // //                 "returns",
// // // //                 "bookreturn"
// // // //             ];

// // // //             for (const endpoint of endpoints) {
// // // //                 try {
// // // //                     const api = new DataApi(endpoint);
// // // //                     console.log(`Trying endpoint: ${endpoint}`);
// // // //                     response = await api.create(submissionData);
// // // //                     console.log(`Response from ${endpoint}:`, response);

// // // //                     if (response.data) {
// // // //                         break; // Success, break the loop
// // // //                     }
// // // //                 } catch (error) {
// // // //                     console.error(`Error with ${endpoint}:`, error);
// // // //                     apiError = error;
// // // //                 }
// // // //             }

// // // //             // If DataApi doesn't work, try direct fetch
// // // //             if (!response || !response.data) {
// // // //                 console.log("Trying direct fetch API call...");

// // // //                 const directEndpoints = [
// // // //                     `${constants.API_BASE_URL}/api/book_submissions`,
// // // //                     `${constants.API_BASE_URL}/api/book_submissions`,
// // // //                     `${constants.API_BASE_URL}/api/book-returns`,
// // // //                     `${constants.API_BASE_URL}/api/returns`
// // // //                 ];

// // // //                 for (const endpoint of directEndpoints) {
// // // //                     try {
// // // //                         const directResponse = await helper.fetchWithAuth(endpoint, "POST", submissionData);

// // // //                         if (directResponse.ok) {
// // // //                             const result = await directResponse.json();
// // // //                             response = { data: result };
// // // //                             console.log("Direct API success:", result);
// // // //                             break;
// // // //                         } else {
// // // //                             const errorText = await directResponse.text();
// // // //                             console.error(`Direct API error for ${endpoint}:`, errorText);
// // // //                         }
// // // //                     } catch (directError) {
// // // //                         console.error(`Direct API call failed for ${endpoint}:`, directError);
// // // //                     }
// // // //                 }
// // // //             }

// // // //             // Check response
// // // //             if (response && response.data) {
// // // //                 if (response.data.success) {
// // // //                     let successMessage = `Book returned successfully for ${selectedIssue.issued_to_name || selectedIssue.student_name || selectedIssue.issued_to}`;

// // // //                     if (finalPenalty > 0) {
// // // //                         successMessage += ` with penalty of ₹${finalPenalty}`;
// // // //                     }

// // // //                     PubSub.publish("RECORD_SAVED_TOAST", {
// // // //                         title: "Success",
// // // //                         message: successMessage
// // // //                     });

// // // //                     // Update the book issues list
// // // //                     setBookIssues(prev => prev.filter(item => item.id !== selectedIssue.id));

// // // //                     // Reset form and close modal
// // // //                     handleModalClose();

// // // //                     // If this was the last issue, clear the search
// // // //                     if (bookIssues.length === 1) {
// // // //                         setIsbn("");
// // // //                         setBook(null);
// // // //                         setIssue(null);
// // // //                         setBookIssues([]);
// // // //                         setPenalty({ penalty: 0, daysOverdue: 0 });
// // // //                     }

// // // //                 } else {
// // // //                     const errorMessage = response.data?.errors || response.data?.message || "Failed to submit book";
// // // //                     PubSub.publish("RECORD_ERROR_TOAST", {
// // // //                         title: "Error",
// // // //                         message: errorMessage
// // // //                     });
// // // //                 }
// // // //             } else {
// // // //                 throw new Error(apiError?.message || "All API endpoints failed");
// // // //             }

// // // //         } catch (error) {
// // // //             console.error("❌ Error submitting book:", error);

// // // //             let errorMessage = "Error submitting book";
// // // //             if (error.response?.data) {
// // // //                 if (typeof error.response.data === 'string') {
// // // //                     errorMessage = error.response.data;
// // // //                 } else if (error.response.data.message) {
// // // //                     errorMessage = error.response.data.message;
// // // //                 } else if (error.response.data.errors) {
// // // //                     errorMessage = Array.isArray(error.response.data.errors)
// // // //                         ? error.response.data.errors.map(e => e.msg || e).join(", ")
// // // //                         : error.response.data.errors;
// // // //                 }
// // // //             } else if (error.message) {
// // // //                 errorMessage = error.message;
// // // //             }

// // // //             PubSub.publish("RECORD_ERROR_TOAST", {
// // // //                 title: "Error",
// // // //                 message: errorMessage
// // // //             });
// // // //         } finally {
// // // //             setLoading(false);
// // // //         }
// // // //     };

// // // //     // Handle modal close
// // // //     // const handleModalClose = () => {
// // // //     //     setShowSubmitModal(false);
// // // //     //     setSelectedIssue(null);
// // // //     //     setConditionBefore('');
// // // //     //     setConditionAfter('Good');
// // // //     //     setRemarks('');
// // // //     //     setPenalty({ penalty: 0, daysOverdue: 0 });
// // // //     // };

// // // //     // // Format date function
// // // //     // const formatDate = (dateString) => {
// // // //     //     if (!dateString) return '-';
// // // //     //     try {
// // // //     //         const date = new Date(dateString);
// // // //     //         return date.toLocaleDateString('en-IN', {
// // // //     //             day: '2-digit',
// // // //     //             month: '2-digit',
// // // //     //             year: 'numeric'
// // // //     //         });
// // // //     //     } catch (error) {
// // // //     //         return '-';
// // // //     //     }
// // // //     // };

// // // //     // // Handle name click to view user details
// // // //     // const handleNameClick = (userId, userName, e) => {
// // // //     //     e.preventDefault();
// // // //     //     e.stopPropagation();

// // // //     //     if (userId) {
// // // //     //         navigate(`/users/${userId}`);
// // // //     //     } else {
// // // //     //         PubSub.publish("RECORD_ERROR_TOAST", {
// // // //     //             title: "Info",
// // // //     //             message: `User details not available for ${userName}`
// // // //     //         });
// // // //     //     }
// // // //     // };

// // // //     // Define columns for submitted books table
// // // //     const submittedBooksColumns = [
// // // //         {
// // // //             field: "book_title",
// // // //             label: "Book Title",
// // // //             width: 250,
// // // //             render: (value, record) => (
// // // //                 <a
// // // //                     href={`/books/${record.book_id}`}
// // // //                     onClick={(e) => {
// // // //                         e.preventDefault();
// // // //                         e.stopPropagation();
// // // //                         try {
// // // //                             localStorage.setItem(`prefetch:book:${record.book_id}`, JSON.stringify(record));
// // // //                         } catch (err) { }
// // // //                         navigate(`/books/${record.book_id}`, { state: record });
// // // //                     }}
// // // //                     onContextMenu={(e) => {
// // // //                         e.preventDefault();
// // // //                         e.stopPropagation();
// // // //                         try {
// // // //                             localStorage.setItem(`prefetch:book:${record.book_id}`, JSON.stringify(record));
// // // //                         } catch (err) { }
// // // //                         window.open(`/books/${record.book_id}`, '_blank');
// // // //                     }}
// // // //                     style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 600, cursor: "pointer" }}
// // // //                     onMouseEnter={(e) => {
// // // //                         e.target.style.textDecoration = "underline";
// // // //                     }}
// // // //                     onMouseLeave={(e) => {
// // // //                         e.target.style.textDecoration = "none";
// // // //                     }}
// // // //                     title="Click to view book details (Right-click to open in new tab)"
// // // //                 >
// // // //                     {value || "N/A"}
// // // //                 </a>
// // // //             )
// // // //         },
// // // //         {
// // // //             field: "book_isbn",
// // // //             label: "ISBN",
// // // //             width: 150,
// // // //             render: (value) => (
// // // //                 <code style={{ background: "#f8f9fa", padding: "4px 8px", borderRadius: "4px" }}>
// // // //                     {value || "-"}
// // // //                 </code>
// // // //             )
// // // //         },
// // // //         {
// // // //             field: "student_name",
// // // //             label: "Submitted By",
// // // //             width: 200,
// // // //             render: (value, record) => {
// // // //                 const userId = record.issued_to;
// // // //                 const displayName = value || record.student_name || "N/A";
// // // //                 if (userId) {
// // // //                     return (
// // // //                         <a
// // // //                             href={`/user/${userId}`}
// // // //                             onClick={(e) => {
// // // //                                 e.preventDefault();
// // // //                                 e.stopPropagation();
// // // //                                 try {
// // // //                                     localStorage.setItem(`prefetch:user:${userId}`, JSON.stringify(record));
// // // //                                 } catch (err) { }
// // // //                                 navigate(`/user/${userId}`, { state: record });
// // // //                             }}
// // // //                             onContextMenu={(e) => {
// // // //                                 e.preventDefault();
// // // //                                 e.stopPropagation();
// // // //                                 try {
// // // //                                     localStorage.setItem(`prefetch:user:${userId}`, JSON.stringify(record));
// // // //                                 } catch (err) { }
// // // //                                 window.open(`/user/${userId}`, '_blank');
// // // //                             }}
// // // //                             style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 500, cursor: "pointer" }}
// // // //                             onMouseEnter={(e) => {
// // // //                                 e.target.style.textDecoration = "underline";
// // // //                             }}
// // // //                             onMouseLeave={(e) => {
// // // //                                 e.target.style.textDecoration = "none";
// // // //                             }}
// // // //                             title="Click to view user details (Right-click to open in new tab)"
// // // //                         >
// // // //                             {displayName}
// // // //                         </a>
// // // //                     );
// // // //                 }
// // // //                 return displayName;
// // // //             }
// // // //         },
// // // //         {
// // // //             field: "submit_date",
// // // //             label: "Submit Date",
// // // //             width: 150,
// // // //             render: (value) => formatDate(value)
// // // //         },
// // // //         {
// // // //             field: "condition_after",
// // // //             label: "Condition",
// // // //             width: 120,
// // // //             render: (value) => (
// // // //                 <Badge bg={value === "Good" ? "success" : value === "Fair" ? "warning" : "danger"}>
// // // //                     {value || "Good"}
// // // //                 </Badge>
// // // //             )
// // // //         }
// // // //     ];

// // // //     const filteredSubmittedBooks = submittedBooks.filter(submission => {
// // // //         if (!searchTerm) return true;
// // // //         const query = searchTerm.toLowerCase();
// // // //         const bookTitle = (submission.book_title || "").toLowerCase();
// // // //         const isbn = (submission.book_isbn || "").toLowerCase();
// // // //         const studentName = (submission.student_name || "").toLowerCase();
// // // //         return (
// // // //             bookTitle.includes(query) ||
// // // //             isbn.includes(query) ||
// // // //             studentName.includes(query)
// // // //         );
// // // //     });

// // // //     return (
// // // //         <>
// // // //             <Container fluid className="mt-3" style={{ marginTop: "0.5rem", padding: "0 1.5rem" }}>
// // // //                 {/* Header Section */}

// // // //                 {/* Tabs */}
// // // //                 <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || "submit")}>
// // // //                     <Nav variant="tabs" style={{ borderBottom: "2px solid #e5e7eb" }}>
// // // //                         <Nav.Item>
// // // //                             <Nav.Link
// // // //                                 eventKey="submit"
// // // //                                 style={{
// // // //                                     color: activeTab === "submit" ? "#000000" : "#6b7280",
// // // //                                     fontWeight: activeTab === "submit" ? "600" : "400",
// // // //                                     borderBottom: activeTab === "submit" ? "3px solid #6b7280" : "none"
// // // //                                 }}
// // // //                             >
// // // //                                 <i className="fa-solid fa-book-return me-2" style={{ color: activeTab === "submit" ? "#000000" : "#6b7280", fontSize: "15px" }}></i>
// // // //                                 <span style={{ color: activeTab === "submit" ? "#000000" : "#6b7280", fontSize: "15px" }}>Submit Book</span>
// // // //                             </Nav.Link>
// // // //                         </Nav.Item>
// // // //                         <Nav.Item>
// // // //                             <Nav.Link
// // // //                                 eventKey="submitted"
// // // //                                 style={{
// // // //                                     color: activeTab === "submitted" ? "#000000" : "#6b7280",
// // // //                                     fontWeight: activeTab === "submitted" ? "600" : "400",
// // // //                                     borderBottom: activeTab === "submitted" ? "3px solid #6b7280" : "none"
// // // //                                 }}
// // // //                             >
// // // //                                 <span style={{ color: activeTab === "submitted" ? "#000000" : "#6b7280", fontSize: "15px" }}>View Submitted Books ({submittedBooks.length})</span>
// // // //                             </Nav.Link>
// // // //                         </Nav.Item>
// // // //                     </Nav>

// // // //                     <Tab.Content>
// // // //                         {/* Submit Book Tab */}
// // // //                         <Tab.Pane eventKey="submit">
// // // //                             <Row >
// // // //                                 <Col lg={6} md={12}>
// // // //                                     {/* Book Identification Card */}
// // // //                                     <Card className="mb-4 shadow-sm" style={{ background: "#f3e8ff", border: "1px solid #d8b4fe", borderRadius: "8px" }}>
// // // //                                         {/* <Card.Header style={{ background: "#e9d5ff", border: "none", borderBottom: "1px solid #d8b4fe", borderRadius: "8px 8px 0 0" }}>
// // // //                                             <div className="d-flex justify-content-between align-items-center">
// // // //                                                 <h5 className="mb-0 fw-bold" style={{ color: "#000000", fontSize: "18px" }}>
// // // //                                                     <i className="fa-solid fa-barcode me-2" style={{ color: "#6b7280" }}></i>
// // // //                                                     Book Identification
// // // //                                                 </h5>

// // // //                                                 <Form.Select
// // // //                                                     value={searchMode}
// // // //                                                     onChange={(e) => {
// // // //                                                         setSearchMode(e.target.value);
// // // //                                                         setIsbn("");
// // // //                                                         setCardNumber("");
// // // //                                                         setBook(null);
// // // //                                                         setLibraryCard(null);
// // // //                                                         setBookIssues([]);
// // // //                                                         setCardIssues([]);
// // // //                                                     }}
// // // //                                                     style={{
// // // //                                                         width: "200px",
// // // //                                                         border: "2px solid #8b5cf6",
// // // //                                                         borderRadius: "6px"
// // // //                                                     }}
// // // //                                                 >
// // // //                                                     <option value="isbn">Search by ISBN</option>
// // // //                                                     <option value="card">Search by Library Card</option>
// // // //                                                 </Form.Select>
// // // //                                             </div>
// // // //                                         </Card.Header> */}

// // // //                                         <Card.Header style={{
// // // //                                             background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
// // // //                                             border: "none",
// // // //                                             borderBottom: "2px solid #d1d5db",
// // // //                                             padding: "20px 24px"
// // // //                                         }}>
// // // //                                             <h5 className="mb-0 fw-bold" style={{
// // // //                                                 color: "#1f2937",
// // // //                                                 fontSize: "20px",
// // // //                                                 letterSpacing: "0.3px"
// // // //                                             }}>
// // // //                                                 <i className="fa-solid fa-book-open me-3" style={{ color: "#6b7280" }}></i>
// // // //                                                 Book Identification
// // // //                                             </h5>
// // // //                                         </Card.Header>
// // // //                                         <Card.Body className="p-4">
// // // //                                             {/* Scan/Enter Section */}
// // // //                                             <div className="mb-4">
// // // //                                                 <div className="d-flex align-items-center gap-3 flex-wrap">
// // // //                                                     {/* Scan Button */}
// // // //                                                     <Button
// // // //                                                         variant="primary"
// // // //                                                         onClick={handleScanButtonClick}
// // // //                                                         size="lg"
// // // //                                                         disabled={loading}
// // // //                                                         style={{
// // // //                                                             height: "48px",
// // // //                                                             backgroundColor: "#0d6efd",
// // // //                                                             border: "none",
// // // //                                                             borderRadius: "8px",
// // // //                                                             minWidth: "220px",
// // // //                                                             fontWeight: "600",
// // // //                                                             fontSize: "0.95rem",
// // // //                                                             boxShadow: "0 2px 4px rgba(13, 110, 253, 0.3)"
// // // //                                                         }}
// // // //                                                     >
// // // //                                                         {loading ? (
// // // //                                                             <Spinner animation="border" size="sm" className="me-2" />
// // // //                                                         ) : (
// // // //                                                             <i className="fa-solid fa-camera me-2"></i>
// // // //                                                         )}
// // // //                                                         Scan Barcode
// // // //                                                     </Button>

// // // //                                                     {/* Or Separator */}
// // // //                                                     <div className="text-muted fw-bold" style={{ minWidth: "40px", textAlign: "center", fontSize: "0.9rem" }}>
// // // //                                                         OR
// // // //                                                     </div>

// // // //                                                     {/* Manual Input Group */}
// // // //                                                     <InputGroup style={{ flex: "1", minWidth: "300px" }}>
// // // //                                                         <Form.Control
// // // //                                                             ref={searchMode === "isbn" ? isbnInputRef : cardInputRef}
// // // //                                                             type="text"
// // // //                                                             placeholder={searchMode === "isbn" ? "Type ISBN number here" : "Type Library Card number here"}
// // // //                                                             value={searchMode === "isbn" ? isbn : cardNumber}
// // // //                                                             onChange={searchMode === "isbn" ? handleIsbnChange : handleCardNumberChange}
// // // //                                                             onKeyDown={searchMode === "isbn" ? handleIsbnKeyDown : handleCardKeyDown}
// // // //                                                             autoFocus
// // // //                                                             disabled={loading}
// // // //                                                             size="lg"
// // // //                                                             style={{
// // // //                                                                 border: "1px solid #dee2e6",
// // // //                                                                 borderRadius: "8px 0 0 8px",
// // // //                                                                 fontSize: "0.95rem",
// // // //                                                                 padding: "0.75rem 1rem"
// // // //                                                             }}
// // // //                                                         />
// // // //                                                         {loading && (
// // // //                                                             <InputGroup.Text style={{
// // // //                                                                 border: "1px solid #dee2e6",
// // // //                                                                 borderLeft: "none",
// // // //                                                                 borderRadius: "0",
// // // //                                                                 backgroundColor: "#f8f9fa"
// // // //                                                             }}>
// // // //                                                                 <Spinner animation="border" size="sm" />
// // // //                                                             </InputGroup.Text>
// // // //                                                         )}
// // // //                                                         <Button
// // // //                                                             variant="outline-secondary"
// // // //                                                             onClick={() => {
// // // //                                                                 if (searchMode === "isbn") {
// // // //                                                                     if (isbnInputRef.current?.timer) {
// // // //                                                                         clearTimeout(isbnInputRef.current.timer);
// // // //                                                                     }
// // // //                                                                     setIsbn("");
// // // //                                                                     setBook(null);
// // // //                                                                     setIssue(null);
// // // //                                                                     setBookIssues([]);
// // // //                                                                     setPenalty({ penalty: 0, daysOverdue: 0 });
// // // //                                                                     isbnInputRef.current?.focus();
// // // //                                                                 } else {
// // // //                                                                     if (cardInputRef.current?.timer) {
// // // //                                                                         clearTimeout(cardInputRef.current.timer);
// // // //                                                                     }
// // // //                                                                     setCardNumber("");
// // // //                                                                     setLibraryCard(null);
// // // //                                                                     setCardIssues([]);
// // // //                                                                     cardInputRef.current?.focus();
// // // //                                                                 }
// // // //                                                             }}
// // // //                                                             disabled={loading}
// // // //                                                             size="lg"
// // // //                                                             style={{
// // // //                                                                 border: "1px solid #dee2e6",
// // // //                                                                 borderLeft: loading ? "none" : "1px solid #dee2e6",
// // // //                                                                 borderRadius: loading ? "0 8px 8px 0" : "0 8px 8px 0",
// // // //                                                                 minWidth: "50px",
// // // //                                                                 backgroundColor: "#f8f9fa"
// // // //                                                             }}
// // // //                                                         >
// // // //                                                             <i className="fa-solid fa-xmark"></i>
// // // //                                                         </Button>
// // // //                                                     </InputGroup>
// // // //                                                 </div>
// // // //                                             </div>
// // // //                                         </Card.Body>
// // // //                                     </Card>

// // // //                                     {/* Library Card Details - Show when searching by card */}
// // // //                                     {libraryCard && (
// // // //                                         <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
// // // //                                             <Card.Header className="py-3 px-4" style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #6f42c1" }}>
// // // //                                                 <div className="d-flex justify-content-between align-items-center">
// // // //                                                     <h6 className="mb-0 fw-bold" style={{ color: "#6f42c1", fontSize: "1rem" }}>
// // // //                                                         <i className="fa-solid fa-id-card me-2"></i>
// // // //                                                         Library Card: {libraryCard.card_number}
// // // //                                                     </h6>
// // // //                                                     <Badge bg="info">
// // // //                                                         {cardIssues.length} Active Issue{cardIssues.length !== 1 ? 's' : ''}
// // // //                                                     </Badge>
// // // //                                                 </div>
// // // //                                             </Card.Header>
// // // //                                             <Card.Body className="py-3 px-4">
// // // //                                                 <Row>
// // // //                                                     <Col md={6}>
// // // //                                                         <div className="mb-2">
// // // //                                                             <strong className="small">Card Holder:</strong>
// // // //                                                             <div className="text-secondary">
// // // //                                                                 {libraryCard.user_name || libraryCard.student_name || "N/A"}
// // // //                                                             </div>
// // // //                                                         </div>
// // // //                                                     </Col>
// // // //                                                     <Col md={6}>
// // // //                                                         <div className="mb-2">
// // // //                                                             <strong className="small">Card Number:</strong>
// // // //                                                             <div className="text-secondary">{libraryCard.card_number}</div>
// // // //                                                         </div>
// // // //                                                     </Col>
// // // //                                                 </Row>
// // // //                                             </Card.Body>
// // // //                                         </Card>
// // // //                                     )}

// // // //                                     {/* Card Issues List - Show when searching by card */}
// // // //                                     {cardIssues && cardIssues.length > 0 && (
// // // //                                         <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
// // // //                                             {/* <Card.Header className="py-3 px-4" style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #ffc107" }}>
// // // //                                                 <div className="d-flex justify-content-between align-items-center">
// // // //                                                     <h6 className="mb-0 fw-bold" style={{ color: "#856404", fontSize: "1rem" }}>
// // // //                                                         <i className="fa-solid fa-users me-2 text-warning"></i>
// // // //                                                         Active Book Issues for This Card
// // // //                                                     </h6>
// // // //                                                     <Badge bg="warning" text="dark" className="ms-2" style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}>
// // // //                                                         {cardIssues.length} Issue{cardIssues.length > 1 ? 's' : ''}
// // // //                                                     </Badge>
// // // //                                                 </div>
// // // //                                             </Card.Header> */}

// // // //                                             <Card.Header style={{
// // // //                                                 background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
// // // //                                                 border: "none",
// // // //                                                 borderBottom: "2px solid #d1d5db",
// // // //                                                 padding: "20px 24px"
// // // //                                             }}>
// // // //                                                 <h5 className="mb-0 fw-bold" style={{
// // // //                                                     color: "#1f2937",
// // // //                                                     fontSize: "20px",
// // // //                                                     letterSpacing: "0.3px"
// // // //                                                 }}>
// // // //                                                     Active Book Issues for This Card
// // // //                                                 </h5>
// // // //                                             </Card.Header>
// // // //                                             <Card.Body className="py-3 px-4">
// // // //                                                 {/* <div className="table-responsive">
// // // //                                                     <Table striped bordered hover size="sm" className="mb-0">
// // // //                                                         <thead style={{ backgroundColor: "white" }}>
// // // //                                                             <tr>
// // // //                                                                 <th>Book Title</th>
// // // //                                                                 <th>ISBN</th>
// // // //                                                                 <th>Issue Date</th>
// // // //                                                                 <th>Due Date</th>
// // // //                                                                 <th>Status</th>
// // // //                                                                 <th style={{ width: 100 }}>Action</th>
// // // //                                                             </tr>
// // // //                                                         </thead>
// // // //                                                         <tbody>
// // // //                                                             {cardIssues.map((ci) => (
// // // //                                                                 <tr key={ci.id}>
// // // //                                                                     <td>
// // // //                                                                         <a
// // // //                                                                             href={`/books/${ci.book_id}`}
// // // //                                                                             onClick={(e) => {
// // // //                                                                                 e.preventDefault();
// // // //                                                                                 e.stopPropagation();
// // // //                                                                                 try {
// // // //                                                                                     localStorage.setItem(`prefetch:book:${ci.book_id}`, JSON.stringify(ci));
// // // //                                                                                 } catch (err) { }
// // // //                                                                                 navigate(`/books/${ci.book_id}`, { state: ci });
// // // //                                                                             }}
// // // //                                                                             onContextMenu={(e) => {
// // // //                                                                                 e.preventDefault();
// // // //                                                                                 e.stopPropagation();
// // // //                                                                                 try {
// // // //                                                                                     localStorage.setItem(`prefetch:book:${ci.book_id}`, JSON.stringify(ci));
// // // //                                                                                 } catch (err) { }
// // // //                                                                                 window.open(`/books/${ci.book_id}`, '_blank');
// // // //                                                                             }}
// // // //                                                                             style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 600, cursor: "pointer" }}
// // // //                                                                             onMouseEnter={(e) => {
// // // //                                                                                 e.target.style.textDecoration = "underline";
// // // //                                                                             }}
// // // //                                                                             onMouseLeave={(e) => {
// // // //                                                                                 e.target.style.textDecoration = "none";
// // // //                                                                             }}
// // // //                                                                             title="Click to view book details (Right-click to open in new tab)"
// // // //                                                                         >
// // // //                                                                             {ci.book_title || "N/A"}
// // // //                                                                         </a>
// // // //                                                                     </td>
// // // //                                                                     <td>{ci.book_isbn || '-'}</td>
// // // //                                                                     <td>{formatDate(ci.issue_date)}</td>
// // // //                                                                     <td>
// // // //                                                                         <span style={{
// // // //                                                                             color: new Date(ci.due_date) < new Date() ? '#dc3545' : '#28a745',
// // // //                                                                             fontWeight: 'bold'
// // // //                                                                         }}>
// // // //                                                                             {formatDate(ci.due_date)}
// // // //                                                                         </span>
// // // //                                                                     </td>
// // // //                                                                     <td>
// // // //                                                                         <Badge bg={ci.status === 'issued' ? 'success' : 'secondary'}>
// // // //                                                                             {ci.status || 'issued'}
// // // //                                                                         </Badge>
// // // //                                                                     </td>
// // // //                                                                     <td>
// // // //                                                                         <Button
// // // //                                                                             size="sm"
// // // //                                                                             onClick={() => handleSubmitClick(ci)}
// // // //                                                                             variant="success"
// // // //                                                                             disabled={loading}
// // // //                                                                         >
// // // //                                                                             {loading ? (
// // // //                                                                                 <Spinner animation="border" size="sm" />
// // // //                                                                             ) : (
// // // //                                                                                 'Submit'
// // // //                                                                             )}
// // // //                                                                         </Button>
// // // //                                                                     </td>
// // // //                                                                 </tr>
// // // //                                                             ))}
// // // //                                                         </tbody>
// // // //                                                     </Table>
// // // //                                                 </div> */}

// // // //                                                 <ResizableTable
// // // //                                                     data={filteredIssuedBooks}
// // // //                                                     columns={issueColumns}
// // // //                                                     loading={loadingIssuedBooks}
// // // //                                                     showCheckbox={false}
// // // //                                                     showSerialNumber={true}
// // // //                                                     showActions={false}
// // // //                                                     searchTerm={searchTerm}
// // // //                                                     currentPage={currentPage}
// // // //                                                     recordsPerPage={recordsPerPage}
// // // //                                                     onPageChange={(page) => {
// // // //                                                         setCurrentPage(page);
// // // //                                                     }}
// // // //                                                     emptyMessage={searchTerm ? "No issued books found matching your search" : "No books have been issued yet"}
// // // //                                                     onRowClick={(issue) => {
// // // //                                                         // Optional: Navigate to issue details or show more info
// // // //                                                         console.log("Issue clicked:", issue);
// // // //                                                     }}
// // // //                                                 />
// // // //                                             </Card.Body>
// // // //                                         </Card>
// // // //                                     )}

// // // //                                     {/* Book Details - Show ISBN search results */}
// // // //                                     {book && (
// // // //                                         <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>

// // // //                                             {/* <div className="d-flex justify-content-between align-items-center">
// // // //                                                     <h6 className="mb-0 fw-bold" style={{ color: "#6f42c1", fontSize: "1rem" }}>
// // // //                                                         <i className="fa-solid fa-book me-2"></i>
// // // //                                                         Book Details for ISBN: {isbn}
// // // //                                                     </h6>
// // // //                                                     <Badge bg="primary">
// // // //                                                         {book.available_copies || 0} Available
// // // //                                                     </Badge>
// // // //                                                 </div> */}

// // // //                                             <Card.Header style={{
// // // //                                                 background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
// // // //                                                 border: "none",
// // // //                                                 borderBottom: "2px solid #d1d5db",
// // // //                                                 padding: "20px 24px"
// // // //                                             }}>
// // // //                                                 <h5 className="mb-0 fw-bold" style={{
// // // //                                                     color: "#1f2937",
// // // //                                                     fontSize: "20px",
// // // //                                                     letterSpacing: "0.3px"
// // // //                                                 }}>
// // // //                                                     Book Details for ISBN: {isbn}
// // // //                                                 </h5>
// // // //                                             </Card.Header>

// // // //                                             <Card.Body className="py-3 px-4">
// // // //                                                 <Row>
// // // //                                                     <Col md={6}>
// // // //                                                         <div className="mb-2">
// // // //                                                             <strong className="small">Title:</strong>
// // // //                                                             <div className="text-secondary">
// // // //                                                                 <a
// // // //                                                                     href={`/books/${book.id}`}
// // // //                                                                     onClick={(e) => {
// // // //                                                                         e.preventDefault();
// // // //                                                                         navigate(`/books/${book.id}`);
// // // //                                                                     }}
// // // //                                                                     style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 600 }}
// // // //                                                                     onMouseEnter={(e) => {
// // // //                                                                         try {
// // // //                                                                             localStorage.setItem(`prefetch:book:${book.id}`, JSON.stringify(book));
// // // //                                                                         } catch (err) { }
// // // //                                                                         e.target.style.textDecoration = "underline";
// // // //                                                                     }}
// // // //                                                                     onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
// // // //                                                                 >
// // // //                                                                     {book.title}
// // // //                                                                 </a>
// // // //                                                             </div>
// // // //                                                         </div>
// // // //                                                     </Col>
// // // //                                                     <Col md={6}>
// // // //                                                         <div className="mb-2">
// // // //                                                             <strong className="small">ISBN:</strong>
// // // //                                                             <div className="text-secondary">{book.isbn}</div>
// // // //                                                         </div>
// // // //                                                     </Col>
// // // //                                                 </Row>
// // // //                                                 <Row>
// // // //                                                     <Col md={6}>
// // // //                                                         <div className="mb-2">
// // // //                                                             <strong className="small">Author:</strong>
// // // //                                                             <div className="text-secondary">{book.author || "N/A"}</div>
// // // //                                                         </div>
// // // //                                                     </Col>
// // // //                                                     <Col md={6}>
// // // //                                                         <div className="mb-2">
// // // //                                                             <strong className="small">Total Copies:</strong>
// // // //                                                             <div className="text-secondary">{book.total_copies || 0}</div>
// // // //                                                         </div>
// // // //                                                     </Col>
// // // //                                                 </Row>
// // // //                                             </Card.Body>
// // // //                                         </Card>
// // // //                                     )}

// // // //                                     {/* Book Issues List */}

// // // //                                     {/* No Issues Found Message */}
// // // //                                     {book && bookIssues && bookIssues.length === 0 && (
// // // //                                         <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
// // // //                                             <Card.Body className="text-center py-4">
// // // //                                                 <i className="fa-solid fa-check-circle fa-2x text-success mb-3"></i>
// // // //                                                 <h6 className="text-success">No Active Issues Found</h6>
// // // //                                                 <p className="text-muted mb-0">
// // // //                                                     This book is not currently issued to anyone or all issues have been returned.
// // // //                                                 </p>
// // // //                                             </Card.Body>
// // // //                                         </Card>
// // // //                                     )}
// // // //                                 </Col>
// // // //                                 <Col>


// // // //                                     {bookIssues && bookIssues.length > 0 && (
// // // //                                         <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
// // // //                                             {/* <Card.Header className="py-3 px-4" style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #ffc107" }}>
// // // //                                                 <div className="d-flex justify-content-between align-items-center">
// // // //                                                     <h6 className="mb-0 fw-bold" style={{ color: "#856404", fontSize: "1rem" }}>
// // // //                                                         <i className="fa-solid fa-users me-2 text-warning"></i>
// // // //                                                         Active Book Issues
// // // //                                                     </h6>
// // // //                                                     <Badge bg="warning" text="dark" className="ms-2" style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}>
// // // //                                                         {bookIssues.length} Issue{bookIssues.length > 1 ? 's' : ''}
// // // //                                                     </Badge>
// // // //                                                 </div>
// // // //                                             </Card.Header> */}

// // // //                                             <Card.Header style={{
// // // //                                                 background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
// // // //                                                 border: "none",
// // // //                                                 borderBottom: "2px solid #d1d5db",
// // // //                                                 padding: "20px 24px"
// // // //                                             }}>
// // // //                                                 <h5 className="mb-0 fw-bold" style={{
// // // //                                                     color: "#1f2937",
// // // //                                                     fontSize: "20px",
// // // //                                                     letterSpacing: "0.3px"
// // // //                                                 }}>
// // // //                                                     <i className="fa-solid fa-book-open me-3" style={{ color: "#6b7280" }}></i>
// // // //                                                     Active Book Issues <span style={{ color: "orange" }}>(  {bookIssues.length} Issue{bookIssues.length > 1 ? 's' : ''} )</span>
// // // //                                                 </h5>

// // // //                                             </Card.Header>
// // // //                                             <Card.Body className="py-3 px-4">
// // // //                                                 <div className="table-responsive">
// // // //                                                     <Table striped bordered hover size="sm" className="mb-0">
// // // //                                                         <thead style={{ backgroundColor: "white" }}>
// // // //                                                             <tr>
// // // //                                                                 <th>Issued To</th>
// // // //                                                                 <th>Card No</th>
// // // //                                                                 <th>Issue Date</th>
// // // //                                                                 <th>Due Date</th>
// // // //                                                                 <th>Status</th>
// // // //                                                                 <th style={{ width: 100 }}>Action</th>
// // // //                                                             </tr>
// // // //                                                         </thead>
// // // //                                                         <tbody>
// // // //                                                             {bookIssues.map((bi) => (
// // // //                                                                 <tr key={bi.id}>
// // // //                                                                     <td>
// // // //                                                                         <a
// // // //                                                                             href={`/user/${bi.user_id || bi.student_id}`}
// // // //                                                                             onClick={(e) => handleNameClick(
// // // //                                                                                 bi.user_id || bi.student_id,
// // // //                                                                                 bi.issued_to_name || bi.student_name || bi.issued_to,
// // // //                                                                                 bi,
// // // //                                                                                 e
// // // //                                                                             )}
// // // //                                                                             onContextMenu={(e) => {
// // // //                                                                                 e.preventDefault();
// // // //                                                                                 handleNameClick(
// // // //                                                                                     bi.user_id || bi.student_id,
// // // //                                                                                     bi.issued_to_name || bi.student_name || bi.issued_to,
// // // //                                                                                     bi,
// // // //                                                                                     { ...e, button: 2 }
// // // //                                                                                 );
// // // //                                                                             }}
// // // //                                                                             style={{
// // // //                                                                                 color: "#6f42c1",
// // // //                                                                                 textDecoration: "none",
// // // //                                                                                 fontWeight: "500",
// // // //                                                                                 cursor: "pointer"
// // // //                                                                             }}
// // // //                                                                             onMouseEnter={(e) => {
// // // //                                                                                 e.target.style.textDecoration = "underline";
// // // //                                                                             }}
// // // //                                                                             onMouseLeave={(e) => {
// // // //                                                                                 e.target.style.textDecoration = "none";
// // // //                                                                             }}
// // // //                                                                             title="Click to view user details (Right-click to open in new tab)"
// // // //                                                                         >
// // // //                                                                             <i className="fa-solid fa-user me-1 text-primary"></i>
// // // //                                                                             {bi.issued_to_name || bi.student_name || bi.issued_to}
// // // //                                                                         </a>
// // // //                                                                     </td>
// // // //                                                                     <td>{bi.card_number || bi.card_id || '-'}</td>
// // // //                                                                     <td>{formatDate(bi.issue_date)}</td>
// // // //                                                                     <td>
// // // //                                                                         <span style={{
// // // //                                                                             color: new Date(bi.due_date) < new Date() ? '#dc3545' : '#28a745',
// // // //                                                                             fontWeight: 'bold'
// // // //                                                                         }}>
// // // //                                                                             {formatDate(bi.due_date)}
// // // //                                                                         </span>
// // // //                                                                     </td>
// // // //                                                                     <td>
// // // //                                                                         <Badge bg={bi.status === 'issued' ? 'success' : 'secondary'}>
// // // //                                                                             {bi.status || 'issued'}
// // // //                                                                         </Badge>
// // // //                                                                     </td>
// // // //                                                                     <td>
// // // //                                                                         <Button
// // // //                                                                             size="sm"
// // // //                                                                             onClick={() => handleSubmitClick(bi)}
// // // //                                                                             variant="success"
// // // //                                                                             disabled={loading}
// // // //                                                                         >
// // // //                                                                             {loading ? (
// // // //                                                                                 <Spinner animation="border" size="sm" />
// // // //                                                                             ) : (
// // // //                                                                                 'Submit'
// // // //                                                                             )}
// // // //                                                                         </Button>
// // // //                                                                     </td>
// // // //                                                                 </tr>
// // // //                                                             ))}
// // // //                                                         </tbody>
// // // //                                                     </Table>
// // // //                                                 </div>
// // // //                                             </Card.Body>
// // // //                                         </Card>
// // // //                                     )}
// // // //                                 </Col>

// // // //                             </Row>
// // // //                         </Tab.Pane>

// // // //                         {/* View Submitted Books Tab */}
// // // //                         <Tab.Pane eventKey="submitted">
// // // //                             <Row>
// // // //                                 <Col lg={12}>
// // // //                                     <Card className="shadow-sm">
// // // //                                         <Card.Header style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #6f42c1" }}>
// // // //                                             <Row className="align-items-center">
// // // //                                                 <Col md={6}>
// // // //                                                     <h5 className="mb-0 fw-bold" style={{ color: "#6f42c1" }}>
// // // //                                                         <i className="fa-solid fa-list me-2"></i>
// // // //                                                         Submitted Books List
// // // //                                                     </h5>
// // // //                                                 </Col>
// // // //                                                 <Col md={6}>
// // // //                                                     <div className="d-flex justify-content-end align-items-center gap-3">
// // // //                                                         <InputGroup style={{ maxWidth: "400px" }}>
// // // //                                                             <InputGroup.Text style={{ backgroundColor: "#fff", border: "2px solid #8b5cf6", borderRight: "none" }}>
// // // //                                                                 <i className="fa-solid fa-search" style={{ color: "#8b5cf6" }}></i>
// // // //                                                             </InputGroup.Text>
// // // //                                                             <Form.Control
// // // //                                                                 type="text"
// // // //                                                                 placeholder="Search by book title, ISBN, or student name..."
// // // //                                                                 value={searchTerm}
// // // //                                                                 onChange={(e) => setSearchTerm(e.target.value)}
// // // //                                                                 style={{ border: "2px solid #8b5cf6", borderRadius: "8px" }}
// // // //                                                             />
// // // //                                                             {searchTerm && (
// // // //                                                                 <Button variant="outline-secondary" onClick={() => setSearchTerm("")} style={{ border: "2px solid #8b5cf6" }}>
// // // //                                                                     <i className="fa-solid fa-times"></i>
// // // //                                                                 </Button>
// // // //                                                             )}
// // // //                                                         </InputGroup>
// // // //                                                     </div>
// // // //                                                 </Col>
// // // //                                             </Row>
// // // //                                         </Card.Header>
// // // //                                         <Card.Body className="p-0" style={{ overflow: "hidden", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
// // // //                                             <ResizableTable
// // // //                                                 data={filteredSubmittedBooks}
// // // //                                                 columns={submittedBooksColumns}
// // // //                                                 loading={loadingSubmitted}
// // // //                                                 showCheckbox={false}
// // // //                                                 showSerialNumber={true}
// // // //                                                 showActions={false}
// // // //                                                 searchTerm={searchTerm}
// // // //                                                 currentPage={currentPage}
// // // //                                                 recordsPerPage={recordsPerPage}
// // // //                                                 onPageChange={(page) => setCurrentPage(page)}
// // // //                                                 emptyMessage={searchTerm ? "No submitted books found matching your search" : "No books have been submitted yet"}
// // // //                                             />
// // // //                                         </Card.Body>
// // // //                                     </Card>
// // // //                                 </Col>
// // // //                             </Row>
// // // //                         </Tab.Pane>
// // // //                     </Tab.Content>
// // // //                 </Tab.Container>
// // // //             </Container>

// // // //             {/* Scan Modal */}
// // // //             <Modal show={showScanModal} onHide={() => setShowScanModal(false)} centered>
// // // //                 <Modal.Header closeButton>
// // // //                     <Modal.Title>
// // // //                         <i className="fa-solid fa-barcode me-2"></i>
// // // //                         Scan Barcode
// // // //                     </Modal.Title>
// // // //                 </Modal.Header>
// // // //                 <Modal.Body>
// // // //                     <div className="text-center">
// // // //                         <i className="fa-solid fa-barcode fa-4x mb-3" style={{ color: "#0d6efd" }}></i>
// // // //                         <h5>Ready to Scan</h5>
// // // //                         <p className="text-muted">
// // // //                             Point your barcode scanner at the book barcode and scan.
// // // //                         </p>

// // // //                         <Form.Group className="mt-4">
// // // //                             <Form.Label>
// // // //                                 <strong>Scanned ISBN:</strong>
// // // //                             </Form.Label>
// // // //                             <Form.Control
// // // //                                 type="text"
// // // //                                 placeholder="Scanning will auto-populate here..."
// // // //                                 value={isbn}
// // // //                                 onChange={handleIsbnChange}
// // // //                                 onKeyDown={handleIsbnKeyDown}
// // // //                                 autoFocus
// // // //                                 className="text-center fw-bold"
// // // //                                 style={{ fontSize: "18px" }}
// // // //                                 onBlur={() => {
// // // //                                     if (isbn.trim().length >= 3 && !loading) {
// // // //                                         performSearch(isbn.trim());
// // // //                                     }
// // // //                                 }}
// // // //                             />
// // // //                             <Form.Text className="text-muted">
// // // //                                 Enter 10 or 13 digit ISBN number
// // // //                             </Form.Text>
// // // //                         </Form.Group>
// // // //                     </div>
// // // //                 </Modal.Body>
// // // //                 <Modal.Footer>
// // // //                     <Button variant="secondary" onClick={() => setShowScanModal(false)}>
// // // //                         Cancel
// // // //                     </Button>
// // // //                     <Button
// // // //                         variant="primary"
// // // //                         onClick={handleScanSubmit}
// // // //                         disabled={!isbn.trim() || loading}
// // // //                     >
// // // //                         {loading ? (
// // // //                             <Spinner animation="border" size="sm" className="me-2" />
// // // //                         ) : (
// // // //                             <i className="fa-solid fa-check me-2"></i>
// // // //                         )}
// // // //                         Search Book
// // // //                     </Button>
// // // //                 </Modal.Footer>
// // // //             </Modal>

// // // //             {/* Submit Confirmation Modal */}
// // // //             <Modal show={showSubmitModal} onHide={handleModalClose} centered size="lg">
// // // //                 <Modal.Header closeButton>
// // // //                     <Modal.Title>
// // // //                         <i className="fa-solid fa-paper-plane me-2 text-success"></i>
// // // //                         Submit Book Return
// // // //                     </Modal.Title>
// // // //                 </Modal.Header>
// // // //                 <Modal.Body>
// // // //                     {selectedIssue && (
// // // //                         <div>
// // // //                             <h6 className="mb-3">Book Return Details</h6>

// // // //                             {/* Issue Details */}
// // // //                             <Card className="mb-3">
// // // //                                 <Card.Header className="py-2">
// // // //                                     <h6 className="mb-0 small">Issue Information</h6>
// // // //                                 </Card.Header>
// // // //                                 <Card.Body className="py-2">
// // // //                                     <Row>
// // // //                                         <Col md={6}>
// // // //                                             <strong className="small">Book Title:</strong>
// // // //                                             <div className="text-secondary small">{selectedIssue.book_title || book?.title}</div>
// // // //                                         </Col>
// // // //                                         <Col md={6}>
// // // //                                             <strong className="small">ISBN:</strong>
// // // //                                             <div className="text-secondary small">{selectedIssue.book_isbn || book?.isbn}</div>
// // // //                                         </Col>
// // // //                                     </Row>
// // // //                                     <Row className="mt-2">
// // // //                                         <Col md={6}>
// // // //                                             <strong className="small">Issued To:</strong>
// // // //                                             <div className="text-secondary small">
// // // //                                                 <Button
// // // //                                                     variant="link"
// // // //                                                     className="p-0 text-decoration-none"
// // // //                                                     onClick={(e) => handleNameClick(
// // // //                                                         selectedIssue.user_id || selectedIssue.student_id,
// // // //                                                         selectedIssue.issued_to_name || selectedIssue.student_name || selectedIssue.issued_to,
// // // //                                                         e
// // // //                                                     )}
// // // //                                                     title="View User Details"
// // // //                                                 >
// // // //                                                     <i className="fa-solid fa-user me-1 text-primary"></i>
// // // //                                                     {selectedIssue.issued_to_name || selectedIssue.student_name || selectedIssue.issued_to}
// // // //                                                 </Button>
// // // //                                             </div>
// // // //                                         </Col>
// // // //                                         <Col md={6}>
// // // //                                             <strong className="small">Card Number:</strong>
// // // //                                             <div className="text-secondary small">{selectedIssue.card_number || selectedIssue.card_id || '-'}</div>
// // // //                                         </Col>
// // // //                                     </Row>
// // // //                                     <Row className="mt-2">
// // // //                                         <Col md={6}>
// // // //                                             <strong className="small">Issue Date:</strong>
// // // //                                             <div className="text-secondary small">{formatDate(selectedIssue.issue_date)}</div>
// // // //                                         </Col>
// // // //                                         <Col md={6}>
// // // //                                             <strong className="small">Due Date:</strong>
// // // //                                             <div className="text-secondary small">{formatDate(selectedIssue.due_date)}</div>
// // // //                                         </Col>
// // // //                                     </Row>
// // // //                                 </Card.Body>
// // // //                             </Card>

// // // //                             {/* Condition Assessment Form */}
// // // //                             <Card className="mb-3">
// // // //                                 <Card.Header className="py-2">
// // // //                                     <h6 className="mb-0 small">Condition Assessment</h6>
// // // //                                 </Card.Header>
// // // //                                 <Card.Body className="py-2">
// // // //                                     <Row>
// // // //                                         <Col md={6}>
// // // //                                             <Form.Group className="mb-2">
// // // //                                                 <Form.Label className="small fw-bold">Condition Before</Form.Label>
// // // //                                                 <Form.Control
// // // //                                                     type="text"
// // // //                                                     value={selectedIssue.condition_before || conditionBefore || 'Good'}
// // // //                                                     onChange={(e) => setConditionBefore(e.target.value)}
// // // //                                                     disabled={loading}
// // // //                                                     size="sm"
// // // //                                                     className="small"
// // // //                                                 />
// // // //                                             </Form.Group>
// // // //                                         </Col>
// // // //                                         <Col md={6}>
// // // //                                             <Form.Group className="mb-2">
// // // //                                                 <Form.Label className="small fw-bold">Condition After *</Form.Label>
// // // //                                                 <Form.Select
// // // //                                                     value={conditionAfter}
// // // //                                                     onChange={(e) => {
// // // //                                                         setConditionAfter(e.target.value);
// // // //                                                         // Show warning for damaged/lost books
// // // //                                                         if (e.target.value === 'Damaged' || e.target.value === 'Lost') {
// // // //                                                             PubSub.publish("RECORD_ERROR_TOAST", {
// // // //                                                                 title: "Penalty Notice",
// // // //                                                                 message: `Full book price penalty will be applied for ${e.target.value.toLowerCase()} condition`
// // // //                                                             });
// // // //                                                         }
// // // //                                                     }}
// // // //                                                     disabled={loading}
// // // //                                                     size="sm"
// // // //                                                     className="small"
// // // //                                                     required
// // // //                                                 >
// // // //                                                     <option value="Good">✅ Good (Normal penalty if overdue)</option>
// // // //                                                     <option value="Fair">⚠️ Fair (Reduced penalty)</option>
// // // //                                                     <option value="Damaged">❌ Damaged (Full book price penalty)</option>
// // // //                                                     <option value="Lost">🔍 Lost (Full book price penalty)</option>
// // // //                                                 </Form.Select>
// // // //                                                 <Form.Text className="text-muted">
// // // //                                                     {conditionAfter === 'Damaged' || conditionAfter === 'Lost' ?
// // // //                                                         'Full book price penalty will be charged' :
// // // //                                                         'Penalty applied only if overdue'
// // // //                                                     }
// // // //                                                 </Form.Text>
// // // //                                             </Form.Group>
// // // //                                         </Col>
// // // //                                     </Row>
// // // //                                     <Form.Group className="mb-2">
// // // //                                         <Form.Label className="small fw-bold">Remarks</Form.Label>
// // // //                                         <Form.Control
// // // //                                             as="textarea"
// // // //                                             rows={3}
// // // //                                             placeholder={
// // // //                                                 conditionAfter === 'Damaged' ? 'Describe the damage...' :
// // // //                                                     conditionAfter === 'Lost' ? 'Provide details about loss...' :
// // // //                                                         'Add notes about book condition...'
// // // //                                             }
// // // //                                             value={remarks}
// // // //                                             onChange={(e) => setRemarks(e.target.value)}
// // // //                                             disabled={loading}
// // // //                                             size="sm"
// // // //                                             className="small"
// // // //                                         />
// // // //                                     </Form.Group>
// // // //                                 </Card.Body>
// // // //                             </Card>

// // // //                             {/* Dynamic Penalty Information */}
// // // //                             <Card>
// // // //                                 <Card.Header className="py-2">
// // // //                                     <h6 className="mb-0 small">
// // // //                                         Penalty Information
// // // //                                         {(conditionAfter === 'Damaged' || conditionAfter === 'Lost') && (
// // // //                                             <Badge bg="danger" className="ms-2">Full Price</Badge>
// // // //                                         )}
// // // //                                     </h6>
// // // //                                 </Card.Header>
// // // //                                 <Card.Body className="py-2">
// // // //                                     <div className="text-center">
// // // //                                         <h5 style={{
// // // //                                             color: (conditionAfter === 'Damaged' || conditionAfter === 'Lost' || penalty.penalty > 0) ? "#dc3545" : "#28a745",
// // // //                                             fontWeight: "bold"
// // // //                                         }}>
// // // //                                             ₹{
// // // //                                                 conditionAfter === 'Damaged' || conditionAfter === 'Lost' ?
// // // //                                                     (book?.price || 500) :
// // // //                                                     (penalty.penalty || 0)
// // // //                                             }
// // // //                                         </h5>
// // // //                                         <p className="small text-muted mb-0">
// // // //                                             {conditionAfter === 'Damaged' ? 'Full price for damaged book' :
// // // //                                                 conditionAfter === 'Lost' ? 'Full price for lost book' :
// // // //                                                     penalty.daysOverdue ? `Overdue by ${penalty.daysOverdue} day(s)` :
// // // //                                                         "No penalty"}
// // // //                                         </p>
// // // //                                         {(conditionAfter === 'Damaged' || conditionAfter === 'Lost') && (
// // // //                                             <p className="small text-danger mt-1">
// // // //                                                 <i className="fa-solid fa-exclamation-triangle me-1"></i>
// // // //                                                 Full book price will be charged
// // // //                                             </p>
// // // //                                         )}
// // // //                                     </div>
// // // //                                 </Card.Body>
// // // //                             </Card>

// // // //                             {/* Penalty Information */}
// // // //                             {penalty.penalty > 0 && (
// // // //                                 <Card>
// // // //                                     <Card.Header className="py-2">
// // // //                                         <h6 className="mb-0 small">Penalty Information</h6>
// // // //                                     </Card.Header>
// // // //                                     <Card.Body className="py-2">
// // // //                                         <div className="text-center">
// // // //                                             <h5 style={{
// // // //                                                 color: penalty.penalty > 0 ? "#dc3545" : "#28a745",
// // // //                                                 fontWeight: "bold"
// // // //                                             }}>
// // // //                                                 ₹{penalty.penalty || 0}
// // // //                                             </h5>
// // // //                                             <p className="small text-muted mb-0">
// // // //                                                 {penalty.daysOverdue ? `Overdue by ${penalty.daysOverdue} day(s)` : "No overdue penalty"}
// // // //                                             </p>
// // // //                                         </div>
// // // //                                     </Card.Body>
// // // //                                 </Card>
// // // //                             )}
// // // //                         </div>
// // // //                     )}
// // // //                 </Modal.Body>
// // // //                 <Modal.Footer>
// // // //                     <Button variant="secondary" onClick={handleModalClose} disabled={loading}>
// // // //                         <i className="fa-solid fa-times me-2"></i>
// // // //                         Cancel
// // // //                     </Button>
// // // //                     <Button variant="success" onClick={handleFinalSubmit} disabled={loading}>
// // // //                         {loading ? (
// // // //                             <>
// // // //                                 <Spinner animation="border" size="sm" className="me-2" />
// // // //                                 Submitting...
// // // //                             </>
// // // //                         ) : (
// // // //                             <>
// // // //                                 <i className="fa-solid fa-check me-2"></i>
// // // //                                 Confirm Submit
// // // //                             </>
// // // //                         )}
// // // //                     </Button>
// // // //                 </Modal.Footer>
// // // //             </Modal>
// // // //         </>
// // // //     );

// // // // }

// // // // export default BookSubmit;



// // // import React, { useState, useEffect } from "react";
// // // import { Container, Row, Col, Card, Form, Button, Spinner, Badge, InputGroup, Table, Modal, Tab, Nav } from "react-bootstrap";
// // // import { useNavigate } from "react-router-dom";
// // // import helper from "../common/helper";
// // // import PubSub from "pubsub-js";
// // // import * as constants from "../../constants/CONSTANT";
// // // import DataApi from "../../api/dataApi";
// // // import ResizableTable from "../common/ResizableTable";

// // // const BookSubmit = () => {
// // //     const navigate = useNavigate();
// // //     const [isbn, setIsbn] = useState("");
// // //     const [cardNumber, setCardNumber] = useState("");
// // //     const [searchMode, setSearchMode] = useState("isbn");
// // //     const [loading, setLoading] = useState(false);
// // //     const [book, setBook] = useState(null);
// // //     const [libraryCard, setLibraryCard] = useState(null);
// // //     const [cardIssues, setCardIssues] = useState([]);
// // //     const [issue, setIssue] = useState(null);
// // //     const [bookIssues, setBookIssues] = useState([]);
// // //     const [allIssuedBooks, setAllIssuedBooks] = useState([]); // ✅ New state for all issued books
// // //     const [penalty, setPenalty] = useState({ penalty: 0, daysOverdue: 0 });
// // //     const [conditionBefore, setConditionBefore] = useState("Good");
// // //     const [conditionAfter, setConditionAfter] = useState("Good");
// // //     const [remarks, setRemarks] = useState("");
// // //     const [isScanning, setIsScanning] = useState(false);
// // //     const [selectedIssue, setSelectedIssue] = useState(null);
// // //     const [activeTab, setActiveTab] = useState("submit");
// // //     const [submittedBooks, setSubmittedBooks] = useState([]);
// // //     const [loadingSubmitted, setLoadingSubmitted] = useState(false);
// // //     const [searchTerm, setSearchTerm] = useState("");
// // //     const [currentPage, setCurrentPage] = useState(1);
// // //     const [showScanModal, setShowScanModal] = useState(false);
// // //     const [showSubmitModal, setShowSubmitModal] = useState(false);
// // //     const [scanMethod, setScanMethod] = useState("");
// // //     const recordsPerPage = 20;
// // //     const isbnInputRef = React.useRef(null);
// // //     const cardInputRef = React.useRef(null);

// // //     // ✅ Fetch all issued books on component mount
// // //     useEffect(() => {
// // //         fetchAllIssuedBooks();
// // //     }, []);

// // //     // ✅ Function to fetch all issued books
// // //     const fetchAllIssuedBooks = async () => {
// // //         try {
// // //             setLoading(true);
// // //             const issuesResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/active`, "GET");

// // //             if (!issuesResp.ok) {
// // //                 const err = await issuesResp.json().catch(() => ({}));
// // //                 console.error("Error fetching all issued books:", err);
// // //                 setAllIssuedBooks([]);
// // //                 return;
// // //             }

// // //             const issues = await issuesResp.json();
// // //             setAllIssuedBooks(issues || []);
// // //         } catch (error) {
// // //             console.error("Error fetching all issued books:", error);
// // //             setAllIssuedBooks([]);
// // //         } finally {
// // //             setLoading(false);
// // //         }
// // //     };

// // //     const formatDate = (dateStr) => {
// // //         if (!dateStr) return "-";
// // //         try {
// // //             const d = new Date(dateStr);
// // //             if (isNaN(d)) return dateStr;
// // //             const dd = String(d.getDate()).padStart(2, "0");
// // //             const mm = String(d.getMonth() + 1).padStart(2, "0");
// // //             const yyyy = d.getFullYear();
// // //             return `${dd}-${mm}-${yyyy}`;
// // //         } catch (e) {
// // //             return dateStr;
// // //         }
// // //     };

// // //     // ✅ Filter issued books based on search


// // //     // Navigate to user detail page
// // //     const handleNameClick = (userId, userName, issueData, e) => {
// // //         if (e) {
// // //             e.preventDefault();
// // //             e.stopPropagation();
// // //         }

// // //         if (userId) {
// // //             try {
// // //                 const prefetchData = issueData || { id: userId, name: userName };
// // //                 localStorage.setItem(`prefetch:user:${userId}`, JSON.stringify(prefetchData));
// // //             } catch (err) {
// // //                 console.warn("Failed to store prefetch data:", err);
// // //             }

// // //             if (e && (e.button === 2 || e.ctrlKey || e.metaKey)) {
// // //                 window.open(`/user/${userId}`, '_blank');
// // //             } else {
// // //                 navigate(`/user/${userId}`, {
// // //                     state: { userName: userName, ...issueData },
// // //                 });
// // //             }
// // //         }
// // //     };

// // //     // Fetch submitted books
// // //     useEffect(() => {
// // //         if (activeTab === "submitted") {
// // //             fetchSubmittedBooks();
// // //         }
// // //     }, [activeTab]);

// // //     const fetchSubmittedBooks = async () => {
// // //         try {
// // //             setLoadingSubmitted(true);
// // //             const submissionApi = new DataApi("book_submissions");
// // //             const response = await submissionApi.fetchAll();
// // //             let submissions = [];
// // //             if (response.data && response.data.success && Array.isArray(response.data.data)) {
// // //                 submissions = response.data.data;
// // //             } else if (Array.isArray(response.data)) {
// // //                 submissions = response.data;
// // //             }
// // //             setSubmittedBooks(submissions);
// // //         } catch (error) {
// // //             console.error("Error fetching submitted books:", error);
// // //             PubSub.publish("RECORD_ERROR_TOAST", {
// // //                 title: "Error",
// // //                 message: "Failed to fetch submitted books"
// // //             });
// // //             setSubmittedBooks([]);
// // //         } finally {
// // //             setLoadingSubmitted(false);
// // //         }
// // //     };

// // //     // Perform search with ISBN or Library Card
// // //     const performSearch = async (value, mode = null) => {
// // //         const searchType = mode || searchMode;
// // //         console.log("Performing search with:", value, "mode:", searchType);

// // //         if (!value || value.trim() === "") {
// // //             PubSub.publish("RECORD_ERROR_TOAST", {
// // //                 title: "Validation",
// // //                 message: `Please enter or scan ${searchType === "card" ? "Library Card Number" : "ISBN"}`
// // //             });
// // //             return;
// // //         }

// // //         try {
// // //             setLoading(true);

// // //             if (searchType === "card") {
// // //                 // Search by library card number
// // //                 const cardResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/librarycard/card/${encodeURIComponent(value.trim().toUpperCase())}`, "GET");
// // //                 if (!cardResp.ok) {
// // //                     const err = await cardResp.json().catch(() => ({}));
// // //                     PubSub.publish("RECORD_ERROR_TOAST", { title: "Not Found", message: err.errors || "Library card not found" });
// // //                     setLibraryCard(null);
// // //                     setCardIssues([]);
// // //                     setBook(null);
// // //                     setBookIssues([]);
// // //                     return;
// // //                 }

// // //                 const cardData = await cardResp.json();
// // //                 setLibraryCard(cardData);

// // //                 // Find active issues for this card
// // //                 const issuesResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/card/${cardData.id}`, "GET");
// // //                 if (!issuesResp.ok) {
// // //                     const err = await issuesResp.json().catch(() => ({}));
// // //                     PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: err.errors || "Failed to fetch issue records" });
// // //                     setCardIssues([]);
// // //                     return;
// // //                 }

// // //                 const issues = await issuesResp.json();
// // //                 if (!issues || !Array.isArray(issues) || issues.length === 0) {
// // //                     PubSub.publish("RECORD_ERROR_TOAST", { title: "No Active Issue", message: "No active issued record found for this library card" });
// // //                     setCardIssues([]);
// // //                     return;
// // //                 }

// // //                 setCardIssues(issues);
// // //                 setBook(null);
// // //                 setBookIssues([]);
// // //             } else {
// // //                 // Search book by ISBN
// // //                 const bookResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/book/isbn/${encodeURIComponent(value.trim())}`, "GET");
// // //                 if (!bookResp.ok) {
// // //                     const err = await bookResp.json().catch(() => ({}));
// // //                     PubSub.publish("RECORD_ERROR_TOAST", { title: "Not Found", message: err.errors || "Book not found" });
// // //                     setBook(null);
// // //                     setIssue(null);
// // //                     setBookIssues([]);
// // //                     return;
// // //                 }

// // //                 const bookData = await bookResp.json();
// // //                 setBook(bookData);

// // //                 // Find active issues for this book
// // //                 const issuesResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/book/${bookData.id}`, "GET");
// // //                 if (!issuesResp.ok) {
// // //                     const err = await issuesResp.json().catch(() => ({}));
// // //                     PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: err.errors || "Failed to fetch issue records" });
// // //                     setIssue(null);
// // //                     setBookIssues([]);
// // //                     return;
// // //                 }

// // //                 const issues = await issuesResp.json();
// // //                 if (!issues || !Array.isArray(issues) || issues.length === 0) {
// // //                     PubSub.publish("RECORD_ERROR_TOAST", { title: "No Active Issue", message: "No active issued record found for this ISBN" });
// // //                     setIssue(null);
// // //                     setBookIssues([]);
// // //                     return;
// // //                 }

// // //                 setBookIssues(issues);
// // //                 const activeIssue = issues[0];
// // //                 setIssue(activeIssue);

// // //                 // Fetch penalty info
// // //                 const penaltyResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/penalty/${activeIssue.id}`, "GET");
// // //                 if (penaltyResp.ok) {
// // //                     const penaltyData = await penaltyResp.json();
// // //                     if (penaltyData && penaltyData.success) {
// // //                         setPenalty(penaltyData.data || { penalty: 0, daysOverdue: 0 });
// // //                     } else if (penaltyData && penaltyData.data) {
// // //                         setPenalty(penaltyData.data);
// // //                     } else {
// // //                         setPenalty({ penalty: 0, daysOverdue: 0 });
// // //                     }
// // //                 } else {
// // //                     setPenalty({ penalty: 0, daysOverdue: 0 });
// // //                 }

// // //                 // Clear library card data when searching by ISBN
// // //                 setLibraryCard(null);
// // //                 setCardIssues([]);
// // //             }

// // //         } catch (error) {
// // //             console.error("Error searching:", error);
// // //             PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: error.message || "Error searching" });
// // //             setBook(null);
// // //             setIssue(null);
// // //             setBookIssues([]);
// // //             setLibraryCard(null);
// // //             setCardIssues([]);
// // //         } finally {
// // //             setLoading(false);
// // //         }
// // //     };

// // //     const handleSearch = async () => {
// // //         const value = searchMode === "card" ? cardNumber : isbn;
// // //         await performSearch(value, searchMode);
// // //     };

// // //     const handleIsbnChange = async (e) => {
// // //         const value = e.target.value;
// // //         setIsbn(value);

// // //         // Auto-search when user types (with debounce)
// // //         if (value.trim().length >= 3) {
// // //             if (isbnInputRef.current?.timer) {
// // //                 clearTimeout(isbnInputRef.current.timer);
// // //             }

// // //             isbnInputRef.current.timer = setTimeout(async () => {
// // //                 if (value.trim().length >= 3) {
// // //                     await performSearch(value.trim(), "isbn");
// // //                 }
// // //             }, 800);
// // //         } else if (value.trim().length === 0) {
// // //             // Clear results when input is empty
// // //             setBook(null);
// // //             setIssue(null);
// // //             setBookIssues([]);
// // //             setPenalty({ penalty: 0, daysOverdue: 0 });
// // //         }
// // //     };

// // //     const handleCardNumberChange = async (e) => {
// // //         const value = e.target.value;
// // //         setCardNumber(value);

// // //         // Auto-search when user types (with debounce)
// // //         if (value.trim().length >= 3) {
// // //             if (cardInputRef.current?.timer) {
// // //                 clearTimeout(cardInputRef.current.timer);
// // //             }

// // //             cardInputRef.current.timer = setTimeout(async () => {
// // //                 if (value.trim().length >= 3) {
// // //                     await performSearch(value.trim(), "card");
// // //                 }
// // //             }, 800);
// // //         } else if (value.trim().length === 0) {
// // //             // Clear results when input is empty
// // //             setLibraryCard(null);
// // //             setCardIssues([]);
// // //         }
// // //     };

// // //     const handleIsbnKeyDown = async (e) => {
// // //         if (e.key === 'Enter') {
// // //             e.preventDefault();
// // //             if (isbnInputRef.current?.timer) {
// // //                 clearTimeout(isbnInputRef.current.timer);
// // //             }
// // //             setIsScanning(true);
// // //             await performSearch(isbn, "isbn");
// // //             setIsScanning(false);
// // //         }
// // //     };

// // //     const handleCardKeyDown = async (e) => {
// // //         if (e.key === 'Enter') {
// // //             e.preventDefault();
// // //             if (cardInputRef.current?.timer) {
// // //                 clearTimeout(cardInputRef.current.timer);
// // //             }
// // //             setIsScanning(true);
// // //             await performSearch(cardNumber, "card");
// // //             setIsScanning(false);
// // //         }
// // //     };

// // //     const handleScanButtonClick = () => {
// // //         setShowScanModal(true);
// // //     };

// // //     const handleScanSubmit = async () => {
// // //         if (isbn.trim()) {
// // //             setShowScanModal(false);
// // //             await performSearch(isbn);
// // //         }
// // //     };

// // //     const handleSubmitClick = (issueItem) => {
// // //         setSelectedIssue(issueItem);
// // //         setShowSubmitModal(true);
// // //     };

// // //     const handleModalClose = () => {
// // //         setShowSubmitModal(false);
// // //         setSelectedIssue(null);
// // //         setConditionAfter("Good");
// // //         setRemarks("");
// // //     };

// // //     const handleFinalSubmit = async () => {
// // //         if (!selectedIssue) return;

// // //         try {
// // //             setLoading(true);

// // //             // Fetch library settings for penalty calculation
// // //             let librarySettings = {};
// // //             try {
// // //                 const settingsResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/librarysettings`, "GET");
// // //                 if (settingsResp.ok) {
// // //                     const settingsData = await settingsResp.json();
// // //                     librarySettings = settingsData;
// // //                 }
// // //             } catch (settingsError) {
// // //                 console.error("Error fetching library settings:", settingsError);
// // //             }

// // //             // Calculate penalty based on settings and conditions
// // //             let finalPenalty = penalty.penalty || 0;
// // //             let penaltyDetails = `Overdue: ${penalty.daysOverdue || 0} days`;

// // //             // If book is damaged or lost, apply full book price penalty
// // //             if (conditionAfter === 'Damaged' || conditionAfter === 'Lost') {
// // //                 const bookPrice = book?.price || librarySettings.book_price || 500;
// // //                 finalPenalty = bookPrice;
// // //                 penaltyDetails = `Full book price (${conditionAfter.toLowerCase()})`;

// // //                 PubSub.publish("RECORD_SAVED_TOAST", {
// // //                     title: "Full Penalty Applied",
// // //                     message: `₹${finalPenalty} penalty applied for ${conditionAfter.toLowerCase()} book`
// // //                 });
// // //             }

// // //             // If book is returned after expiry date, calculate penalty from settings
// // //             const dueDate = new Date(selectedIssue.due_date);
// // //             const returnDate = new Date();

// // //             if (returnDate > dueDate && conditionAfter === 'Good') {
// // //                 const daysOverdue = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
// // //                 const finePerDay = librarySettings.fine_per_day || 10;

// // //                 finalPenalty = daysOverdue * finePerDay;
// // //                 penaltyDetails = `Overdue: ${daysOverdue} days @ ₹${finePerDay}/day`;
// // //             }

// // //             console.log("Final Penalty Calculation:", {
// // //                 conditionAfter,
// // //                 finalPenalty,
// // //                 penaltyDetails,
// // //                 dueDate: selectedIssue.due_date,
// // //                 returnDate: returnDate.toISOString().split('T')[0],
// // //                 bookPrice: book?.price,
// // //                 librarySettings
// // //             });

// // //             // Prepare the submission data
// // //             const submissionData = {
// // //                 issue_id: selectedIssue.id,
// // //                 book_id: selectedIssue.book_id || book?.id,
// // //                 condition_before: selectedIssue.condition_before || conditionBefore || 'Good',
// // //                 condition_after: conditionAfter || 'Good',
// // //                 remarks: remarks || '',
// // //                 submit_date: new Date().toISOString().split('T')[0],
// // //                 penalty_amount: finalPenalty,
// // //                 penalty_details: penaltyDetails,
// // //                 days_overdue: penalty.daysOverdue || 0,
// // //                 book_price: book?.price,
// // //                 fine_per_day: librarySettings.fine_per_day,
// // //                 is_damaged: conditionAfter === 'Damaged',
// // //                 is_lost: conditionAfter === 'Lost'
// // //             };

// // //             console.log("📤 Submitting data:", submissionData);

// // //             // Try multiple endpoints for book submission
// // //             let response;
// // //             let apiError;

// // //             const endpoints = [
// // //                 "book_submissions",
// // //                 "booksubmissions",
// // //                 "book-returns",
// // //                 "returns",
// // //                 "bookreturn"
// // //             ];

// // //             for (const endpoint of endpoints) {
// // //                 try {
// // //                     const api = new DataApi(endpoint);
// // //                     console.log(`Trying endpoint: ${endpoint}`);
// // //                     response = await api.create(submissionData);
// // //                     console.log(`Response from ${endpoint}:`, response);

// // //                     if (response.data) {
// // //                         break;
// // //                     }
// // //                 } catch (error) {
// // //                     console.error(`Error with ${endpoint}:`, error);
// // //                     apiError = error;
// // //                 }
// // //             }

// // //             // If DataApi doesn't work, try direct fetch
// // //             if (!response || !response.data) {
// // //                 console.log("Trying direct fetch API call...");

// // //                 const directEndpoints = [
// // //                     `${constants.API_BASE_URL}/api/book_submissions`,
// // //                     `${constants.API_BASE_URL}/api/book_submissions`,
// // //                     `${constants.API_BASE_URL}/api/book-returns`,
// // //                     `${constants.API_BASE_URL}/api/returns`
// // //                 ];

// // //                 for (const endpoint of directEndpoints) {
// // //                     try {
// // //                         const directResponse = await helper.fetchWithAuth(endpoint, "POST", submissionData);

// // //                         if (directResponse.ok) {
// // //                             const result = await directResponse.json();
// // //                             response = { data: result };
// // //                             console.log("Direct API success:", result);
// // //                             break;
// // //                         } else {
// // //                             const errorText = await directResponse.text();
// // //                             console.error(`Direct API error for ${endpoint}:`, errorText);
// // //                         }
// // //                     } catch (directError) {
// // //                         console.error(`Direct API call failed for ${endpoint}:`, directError);
// // //                     }
// // //                 }
// // //             }

// // //             // Check response
// // //             if (response && response.data) {
// // //                 if (response.data.success) {
// // //                     let successMessage = `Book returned successfully for ${selectedIssue.issued_to_name || selectedIssue.student_name || selectedIssue.issued_to}`;

// // //                     if (finalPenalty > 0) {
// // //                         successMessage += ` with penalty of ₹${finalPenalty}`;
// // //                     }

// // //                     PubSub.publish("RECORD_SAVED_TOAST", {
// // //                         title: "Success",
// // //                         message: successMessage
// // //                     });

// // //                     // ✅ Update both book issues and all issued books lists
// // //                     setBookIssues(prev => prev.filter(item => item.id !== selectedIssue.id));
// // //                     setAllIssuedBooks(prev => prev.filter(item => item.id !== selectedIssue.id));

// // //                     // Reset form and close modal
// // //                     handleModalClose();

// // //                     // If this was the last issue, clear the search
// // //                     if (bookIssues.length === 1) {
// // //                         setIsbn("");
// // //                         setBook(null);
// // //                         setIssue(null);
// // //                         setBookIssues([]);
// // //                         setPenalty({ penalty: 0, daysOverdue: 0 });
// // //                     }

// // //                 } else {
// // //                     const errorMessage = response.data?.errors || response.data?.message || "Failed to submit book";
// // //                     PubSub.publish("RECORD_ERROR_TOAST", {
// // //                         title: "Error",
// // //                         message: errorMessage
// // //                     });
// // //                 }
// // //             } else {
// // //                 throw new Error(apiError?.message || "All API endpoints failed");
// // //             }

// // //         } catch (error) {
// // //             console.error("❌ Error submitting book:", error);

// // //             let errorMessage = "Error submitting book";
// // //             if (error.response?.data) {
// // //                 if (typeof error.response.data === 'string') {
// // //                     errorMessage = error.response.data;
// // //                 } else if (error.response.data.message) {
// // //                     errorMessage = error.response.data.message;
// // //                 } else if (error.response.data.errors) {
// // //                     errorMessage = Array.isArray(error.response.data.errors)
// // //                         ? error.response.data.errors.map(e => e.msg || e).join(", ")
// // //                         : error.response.data.errors;
// // //                 }
// // //             } else if (error.message) {
// // //                 errorMessage = error.message;
// // //             }

// // //             PubSub.publish("RECORD_ERROR_TOAST", {
// // //                 title: "Error",
// // //                 message: errorMessage
// // //             });
// // //         } finally {
// // //             setLoading(false);
// // //         }
// // //     };

// // //     // ✅ Define columns for issued books table
// // //     const issueColumns = [
// // //         {
// // //             field: "book_title",
// // //             label: "Book Title",
// // //             width: 250,
// // //             render: (value, record) => (
// // //                 <a
// // //                     href={`/books/${record.book_id}`}
// // //                     onClick={(e) => {
// // //                         e.preventDefault();
// // //                         e.stopPropagation();
// // //                         try {
// // //                             localStorage.setItem(`prefetch:book:${record.book_id}`, JSON.stringify(record));
// // //                         } catch (err) { }
// // //                         navigate(`/books/${record.book_id}`, { state: record });
// // //                     }}
// // //                     onContextMenu={(e) => {
// // //                         e.preventDefault();
// // //                         e.stopPropagation();
// // //                         try {
// // //                             localStorage.setItem(`prefetch:book:${record.book_id}`, JSON.stringify(record));
// // //                         } catch (err) { }
// // //                         window.open(`/books/${record.book_id}`, '_blank');
// // //                     }}
// // //                     style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 600, cursor: "pointer" }}
// // //                     onMouseEnter={(e) => {
// // //                         e.target.style.textDecoration = "underline";
// // //                     }}
// // //                     onMouseLeave={(e) => {
// // //                         e.target.style.textDecoration = "none";
// // //                     }}
// // //                     title="Click to view book details (Right-click to open in new tab)"
// // //                 >
// // //                     {value || "N/A"}
// // //                 </a>
// // //             )
// // //         },
// // //         {
// // //             field: "book_isbn",
// // //             label: "ISBN",
// // //             width: 150,
// // //             render: (value) => (
// // //                 <code style={{ background: "#f8f9fa", padding: "4px 8px", borderRadius: "4px" }}>
// // //                     {value || "-"}
// // //                 </code>
// // //             )
// // //         },
// // //         {
// // //             field: "issued_to_name",
// // //             label: "Issued To",
// // //             width: 200,
// // //             render: (value, record) => {
// // //                 const userId = record.user_id || record.student_id;
// // //                 const displayName = value || record.student_name || record.issued_to || "N/A";
// // //                 if (userId) {
// // //                     return (
// // //                         <a
// // //                             href={`/user/${userId}`}
// // //                             onClick={(e) => handleNameClick(userId, displayName, record, e)}
// // //                             onContextMenu={(e) => {
// // //                                 e.preventDefault();
// // //                                 handleNameClick(userId, displayName, record, { ...e, button: 2 });
// // //                             }}
// // //                             style={{
// // //                                 color: "#6f42c1",
// // //                                 textDecoration: "none",
// // //                                 fontWeight: "500",
// // //                                 cursor: "pointer"
// // //                             }}
// // //                             onMouseEnter={(e) => {
// // //                                 e.target.style.textDecoration = "underline";
// // //                             }}
// // //                             onMouseLeave={(e) => {
// // //                                 e.target.style.textDecoration = "none";
// // //                             }}
// // //                             title="Click to view user details (Right-click to open in new tab)"
// // //                         >
// // //                             <i className="fa-solid fa-user me-1 text-primary"></i>
// // //                             {displayName}
// // //                         </a>
// // //                     );
// // //                 }
// // //                 return displayName;
// // //             }
// // //         },
// // //         {
// // //             field: "card_number",
// // //             label: "Card No",
// // //             width: 120
// // //         },
// // //         {
// // //             field: "issue_date",
// // //             label: "Issue Date",
// // //             width: 120,
// // //             render: (value) => formatDate(value)
// // //         },
// // //         {
// // //             field: "due_date",
// // //             label: "Due Date",
// // //             width: 120,
// // //             render: (value) => (
// // //                 <span style={{
// // //                     color: new Date(value) < new Date() ? '#dc3545' : '#28a745',
// // //                     fontWeight: 'bold'
// // //                 }}>
// // //                     {formatDate(value)}
// // //                 </span>
// // //             )
// // //         },
// // //         {
// // //             field: "actions",
// // //             label: "Action",
// // //             width: 100,
// // //             render: (value, record) => (
// // //                 <Button
// // //                     size="sm"
// // //                     onClick={() => handleSubmitClick(record)}
// // //                     variant="success"
// // //                     disabled={loading}
// // //                 >
// // //                     {loading ? (
// // //                         <Spinner animation="border" size="sm" />
// // //                     ) : (
// // //                         'Submit'
// // //                     )}
// // //                 </Button>
// // //             )
// // //         }
// // //     ];

// // //     // Define columns for submitted books table
// // //     const submittedBooksColumns = [
// // //         {
// // //             field: "book_title",
// // //             label: "Book Title",
// // //             width: 250,
// // //             render: (value, record) => (
// // //                 <a
// // //                     href={`/books/${record.book_id}`}
// // //                     onClick={(e) => {
// // //                         e.preventDefault();
// // //                         e.stopPropagation();
// // //                         try {
// // //                             localStorage.setItem(`prefetch:book:${record.book_id}`, JSON.stringify(record));
// // //                         } catch (err) { }
// // //                         navigate(`/books/${record.book_id}`, { state: record });
// // //                     }}
// // //                     onContextMenu={(e) => {
// // //                         e.preventDefault();
// // //                         e.stopPropagation();
// // //                         try {
// // //                             localStorage.setItem(`prefetch:book:${record.book_id}`, JSON.stringify(record));
// // //                         } catch (err) { }
// // //                         window.open(`/books/${record.book_id}`, '_blank');
// // //                     }}
// // //                     style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 600, cursor: "pointer" }}
// // //                     onMouseEnter={(e) => {
// // //                         e.target.style.textDecoration = "underline";
// // //                     }}
// // //                     onMouseLeave={(e) => {
// // //                         e.target.style.textDecoration = "none";
// // //                     }}
// // //                     title="Click to view book details (Right-click to open in new tab)"
// // //                 >
// // //                     {value || "N/A"}
// // //                 </a>
// // //             )
// // //         },
// // //         {
// // //             field: "book_isbn",
// // //             label: "ISBN",
// // //             width: 150,
// // //             render: (value) => (
// // //                 <code style={{ background: "#f8f9fa", padding: "4px 8px", borderRadius: "4px" }}>
// // //                     {value || "-"}
// // //                 </code>
// // //             )
// // //         },
// // //         {
// // //             field: "student_name",
// // //             label: "Submitted By",
// // //             width: 200,
// // //             render: (value, record) => {
// // //                 const userId = record.issued_to;
// // //                 const displayName = value || record.student_name || "N/A";
// // //                 if (userId) {
// // //                     return (
// // //                         <a
// // //                             href={`/user/${userId}`}
// // //                             onClick={(e) => {
// // //                                 e.preventDefault();
// // //                                 e.stopPropagation();
// // //                                 try {
// // //                                     localStorage.setItem(`prefetch:user:${userId}`, JSON.stringify(record));
// // //                                 } catch (err) { }
// // //                                 navigate(`/user/${userId}`, { state: record });
// // //                             }}
// // //                             onContextMenu={(e) => {
// // //                                 e.preventDefault();
// // //                                 e.stopPropagation();
// // //                                 try {
// // //                                     localStorage.setItem(`prefetch:user:${userId}`, JSON.stringify(record));
// // //                                 } catch (err) { }
// // //                                 window.open(`/user/${userId}`, '_blank');
// // //                             }}
// // //                             style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 500, cursor: "pointer" }}
// // //                             onMouseEnter={(e) => {
// // //                                 e.target.style.textDecoration = "underline";
// // //                             }}
// // //                             onMouseLeave={(e) => {
// // //                                 e.target.style.textDecoration = "none";
// // //                             }}
// // //                             title="Click to view user details (Right-click to open in new tab)"
// // //                         >
// // //                             {displayName}
// // //                         </a>
// // //                     );
// // //                 }
// // //                 return displayName;
// // //             }
// // //         },
// // //         {
// // //             field: "submit_date",
// // //             label: "Submit Date",
// // //             width: 150,
// // //             render: (value) => formatDate(value)
// // //         },
// // //         {
// // //             field: "condition_after",
// // //             label: "Condition",
// // //             width: 120,
// // //             render: (value) => (
// // //                 <Badge bg={value === "Good" ? "success" : value === "Fair" ? "warning" : "danger"}>
// // //                     {value || "Good"}
// // //                 </Badge>
// // //             )
// // //         }
// // //     ];

// // //     const filteredSubmittedBooks = submittedBooks.filter(submission => {
// // //         if (!searchTerm) return true;
// // //         const query = searchTerm.toLowerCase();
// // //         const bookTitle = (submission.book_title || "").toLowerCase();
// // //         const isbn = (submission.book_isbn || "").toLowerCase();
// // //         const studentName = (submission.student_name || "").toLowerCase();
// // //         return (
// // //             bookTitle.includes(query) ||
// // //             isbn.includes(query) ||
// // //             studentName.includes(query)
// // //         );
// // //     });
// // //     const filteredIssuedBooks = allIssuedBooks.filter(issue => {
// // //         if (!searchTerm) return true;
// // //         const query = searchTerm.toLowerCase();
// // //         const bookTitle = (issue.book_title || "").toLowerCase();
// // //         const isbn = (issue.book_isbn || "").toLowerCase();
// // //         const studentName = (issue.issued_to_name || issue.student_name || "").toLowerCase();
// // //         const cardNumber = (issue.card_number || "").toLowerCase();

// // //         return (
// // //             bookTitle.includes(query) ||
// // //             isbn.includes(query) ||
// // //             studentName.includes(query) ||
// // //             cardNumber.includes(query)
// // //         );
// // //     });
// // //     return (
// // //         <>
// // //             <Container fluid className="mt-3" style={{ marginTop: "0.5rem", padding: "0 1.5rem" }}>
// // //                 {/* Tabs */}
// // //                 <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || "submit")}>
// // //                     <Nav variant="tabs" style={{ borderBottom: "2px solid #e5e7eb" }}>
// // //                         <Nav.Item>
// // //                             <Nav.Link
// // //                                 eventKey="submit"
// // //                                 style={{
// // //                                     color: activeTab === "submit" ? "#000000" : "#6b7280",
// // //                                     fontWeight: activeTab === "submit" ? "600" : "400",
// // //                                     borderBottom: activeTab === "submit" ? "3px solid #6b7280" : "none"
// // //                                 }}
// // //                             >
// // //                                 <i className="fa-solid fa-book-return me-2" style={{ color: activeTab === "submit" ? "#000000" : "#6b7280", fontSize: "15px" }}></i>
// // //                                 <span style={{ color: activeTab === "submit" ? "#000000" : "#6b7280", fontSize: "15px" }}>Submit Book</span>
// // //                             </Nav.Link>
// // //                         </Nav.Item>
// // //                         <Nav.Item>
// // //                             <Nav.Link
// // //                                 eventKey="submitted"
// // //                                 style={{
// // //                                     color: activeTab === "submitted" ? "#000000" : "#6b7280",
// // //                                     fontWeight: activeTab === "submitted" ? "600" : "400",
// // //                                     borderBottom: activeTab === "submitted" ? "3px solid #6b7280" : "none"
// // //                                 }}
// // //                             >
// // //                                 <span style={{ color: activeTab === "submitted" ? "#000000" : "#6b7280", fontSize: "15px" }}>View Submitted Books ({submittedBooks.length})</span>
// // //                             </Nav.Link>
// // //                         </Nav.Item>
// // //                     </Nav>

// // //                     <Tab.Content>
// // //                         {/* Submit Book Tab */}
// // //                         <Tab.Pane eventKey="submit">
// // //                             <Row>
// // //                                 <Col lg={6} md={12}>
// // //                                     {/* Book Identification Card */}
// // //                                     <Card className="mb-4 shadow-sm" style={{ background: "#f3e8ff", border: "1px solid #d8b4fe", borderRadius: "8px" }}>
// // //                                         <Card.Header style={{
// // //                                             background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
// // //                                             border: "none",
// // //                                             borderBottom: "2px solid #d1d5db",
// // //                                             padding: "20px 24px"
// // //                                         }}>
// // //                                             <h5 className="mb-0 fw-bold" style={{
// // //                                                 color: "#1f2937",
// // //                                                 fontSize: "20px",
// // //                                                 letterSpacing: "0.3px"
// // //                                             }}>
// // //                                                 <i className="fa-solid fa-book-open me-3" style={{ color: "#6b7280" }}></i>
// // //                                                 Book Identification
// // //                                             </h5>
// // //                                         </Card.Header>
// // //                                         <Card.Body className="p-4">
// // //                                             {/* Scan/Enter Section */}
// // //                                             <div className="mb-4">
// // //                                                 <div className="d-flex align-items-center gap-3 flex-wrap">
// // //                                                     {/* Scan Button */}
// // //                                                     <Button
// // //                                                         // variant="primary"
// // //                                                         onClick={handleScanButtonClick}
// // //                                                         size="lg"
// // //                                                         // disabled={loading}
// // //                                                         // style={{
// // //                                                         //     height: "48px",
// // //                                                         //     backgroundColor: "#0d6efd",
// // //                                                         //     border: "none",
// // //                                                         //     borderRadius: "8px",
// // //                                                         //     minWidth: "220px",
// // //                                                         //     fontWeight: "600",
// // //                                                         //     fontSize: "0.95rem",
// // //                                                         //     boxShadow: "0 2px 4px rgba(13, 110, 253, 0.3)"
// // //                                                         // }}
// // //                                                     >
// // //                                                         {loading ? (
// // //                                                             <Spinner animation="border" size="sm" className="me-2" />
// // //                                                         ) : (
// // //                                                             <i className="fa-solid fa-camera me-2"></i>
// // //                                                         )}
// // //                                                         Scan Barcode
// // //                                                     </Button>

// // //                                                     {/* Or Separator */}
// // //                                                     <div className="text-muted fw-bold" style={{ minWidth: "40px", textAlign: "center", fontSize: "0.9rem" }}>
// // //                                                         OR
// // //                                                     </div>

// // //                                                     {/* Manual Input Group */}
// // //                                                     <InputGroup style={{ flex: "1", minWidth: "300px" }}>
// // //                                                         <Form.Control
// // //                                                             ref={searchMode === "isbn" ? isbnInputRef : cardInputRef}
// // //                                                             type="text"
// // //                                                             placeholder={searchMode === "isbn" ? "Type ISBN number here" : "Type Library Card number here"}
// // //                                                             value={searchMode === "isbn" ? isbn : cardNumber}
// // //                                                             onChange={searchMode === "isbn" ? handleIsbnChange : handleCardNumberChange}
// // //                                                             onKeyDown={searchMode === "isbn" ? handleIsbnKeyDown : handleCardKeyDown}
// // //                                                             autoFocus
// // //                                                             disabled={loading}
// // //                                                             size="lg"
// // //                                                             style={{
// // //                                                                 border: "1px solid #dee2e6",
// // //                                                                 borderRadius: "8px 0 0 8px",
// // //                                                                 fontSize: "0.95rem",
// // //                                                                 padding: "0.75rem 1rem"
// // //                                                             }}
// // //                                                         />
// // //                                                         {loading && (
// // //                                                             <InputGroup.Text style={{
// // //                                                                 border: "1px solid #dee2e6",
// // //                                                                 borderLeft: "none",
// // //                                                                 borderRadius: "0",
// // //                                                                 backgroundColor: "#f8f9fa"
// // //                                                             }}>
// // //                                                                 <Spinner animation="border" size="sm" />
// // //                                                             </InputGroup.Text>
// // //                                                         )}
// // //                                                         <Button
// // //                                                             variant="outline-secondary"
// // //                                                             onClick={() => {
// // //                                                                 if (searchMode === "isbn") {
// // //                                                                     if (isbnInputRef.current?.timer) {
// // //                                                                         clearTimeout(isbnInputRef.current.timer);
// // //                                                                     }
// // //                                                                     setIsbn("");
// // //                                                                     setBook(null);
// // //                                                                     setIssue(null);
// // //                                                                     setBookIssues([]);
// // //                                                                     setPenalty({ penalty: 0, daysOverdue: 0 });
// // //                                                                     isbnInputRef.current?.focus();
// // //                                                                 } else {
// // //                                                                     if (cardInputRef.current?.timer) {
// // //                                                                         clearTimeout(cardInputRef.current.timer);
// // //                                                                     }
// // //                                                                     setCardNumber("");
// // //                                                                     setLibraryCard(null);
// // //                                                                     setCardIssues([]);
// // //                                                                     cardInputRef.current?.focus();
// // //                                                                 }
// // //                                                             }}
// // //                                                             disabled={loading}
// // //                                                             size="lg"
// // //                                                             style={{
// // //                                                                 border: "1px solid #dee2e6",
// // //                                                                 borderLeft: loading ? "none" : "1px solid #dee2e6",
// // //                                                                 borderRadius: loading ? "0 8px 8px 0" : "0 8px 8px 0",
// // //                                                                 minWidth: "50px",
// // //                                                                 backgroundColor: "#f8f9fa"
// // //                                                             }}
// // //                                                         >
// // //                                                             <i className="fa-solid fa-xmark"></i>
// // //                                                         </Button>
// // //                                                     </InputGroup>
// // //                                                 </div>
// // //                                             </div>
// // //                                         </Card.Body>
// // //                                     </Card>

// // //                                     {/* Library Card Details */}
// // //                                     {libraryCard && (
// // //                                         <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
// // //                                             <Card.Header className="py-3 px-4" style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #6f42c1" }}>
// // //                                                 <div className="d-flex justify-content-between align-items-center">
// // //                                                     <h6 className="mb-0 fw-bold" style={{ color: "#6f42c1", fontSize: "1rem" }}>
// // //                                                         <i className="fa-solid fa-id-card me-2"></i>
// // //                                                         Library Card: {libraryCard.card_number}
// // //                                                     </h6>
// // //                                                     <Badge bg="info">
// // //                                                         {cardIssues.length} Active Issue{cardIssues.length !== 1 ? 's' : ''}
// // //                                                     </Badge>
// // //                                                 </div>
// // //                                             </Card.Header>
// // //                                             <Card.Body className="py-3 px-4">
// // //                                                 <Row>
// // //                                                     <Col md={6}>
// // //                                                         <div className="mb-2">
// // //                                                             <strong className="small">Card Holder:</strong>
// // //                                                             <div className="text-secondary">
// // //                                                                 {libraryCard.user_name || libraryCard.student_name || "N/A"}
// // //                                                             </div>
// // //                                                         </div>
// // //                                                     </Col>
// // //                                                     <Col md={6}>
// // //                                                         <div className="mb-2">
// // //                                                             <strong className="small">Card Number:</strong>
// // //                                                             <div className="text-secondary">{libraryCard.card_number}</div>
// // //                                                         </div>
// // //                                                     </Col>
// // //                                                 </Row>
// // //                                             </Card.Body>
// // //                                         </Card>
// // //                                     )}

// // //                                     {/* Book Details */}
// // //                                     {book && (
// // //                                         <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
// // //                                             <Card.Header style={{
// // //                                                 background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
// // //                                                 border: "none",
// // //                                                 borderBottom: "2px solid #d1d5db",
// // //                                                 padding: "20px 24px"
// // //                                             }}>
// // //                                                 <h5 className="mb-0 fw-bold" style={{
// // //                                                     color: "#1f2937",
// // //                                                     fontSize: "20px",
// // //                                                     letterSpacing: "0.3px"
// // //                                                 }}>
// // //                                                     Book Details for ISBN: {isbn}
// // //                                                 </h5>
// // //                                             </Card.Header>
// // //                                             <Card.Body className="py-3 px-4">
// // //                                                 <Row>
// // //                                                     <Col md={6}>
// // //                                                         <div className="mb-2">
// // //                                                             <strong className="small">Title:</strong>
// // //                                                             <div className="text-secondary">
// // //                                                                 <a
// // //                                                                     href={`/books/${book.id}`}
// // //                                                                     onClick={(e) => {
// // //                                                                         e.preventDefault();
// // //                                                                         navigate(`/books/${book.id}`);
// // //                                                                     }}
// // //                                                                     style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 600 }}
// // //                                                                     onMouseEnter={(e) => {
// // //                                                                         try {
// // //                                                                             localStorage.setItem(`prefetch:book:${book.id}`, JSON.stringify(book));
// // //                                                                         } catch (err) { }
// // //                                                                         e.target.style.textDecoration = "underline";
// // //                                                                     }}
// // //                                                                     onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
// // //                                                                 >
// // //                                                                     {book.title}
// // //                                                                 </a>
// // //                                                             </div>
// // //                                                         </div>
// // //                                                     </Col>
// // //                                                     <Col md={6}>
// // //                                                         <div className="mb-2">
// // //                                                             <strong className="small">ISBN:</strong>
// // //                                                             <div className="text-secondary">{book.isbn}</div>
// // //                                                         </div>
// // //                                                     </Col>
// // //                                                 </Row>
// // //                                                 <Row>
// // //                                                     <Col md={6}>
// // //                                                         <div className="mb-2">
// // //                                                             <strong className="small">Author:</strong>
// // //                                                             <div className="text-secondary">{book.author || "N/A"}</div>
// // //                                                         </div>
// // //                                                     </Col>
// // //                                                     <Col md={6}>
// // //                                                         <div className="mb-2">
// // //                                                             <strong className="small">Total Copies:</strong>
// // //                                                             <div className="text-secondary">{book.total_copies || 0}</div>
// // //                                                         </div>
// // //                                                     </Col>
// // //                                                 </Row>
// // //                                             </Card.Body>
// // //                                         </Card>
// // //                                     )}

// // //                                     {/* No Issues Found Message */}
// // //                                     {book && bookIssues && bookIssues.length === 0 && (
// // //                                         <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
// // //                                             <Card.Body className="text-center py-4">
// // //                                                 <i className="fa-solid fa-check-circle fa-2x text-success mb-3"></i>
// // //                                                 <h6 className="text-success">No Active Issues Found</h6>
// // //                                                 <p className="text-muted mb-0">
// // //                                                     This book is not currently issued to anyone or all issues have been returned.
// // //                                                 </p>
// // //                                             </Card.Body>
// // //                                         </Card>
// // //                                     )}
// // //                                 </Col>

// // //                                 <Col lg={6} md={12}>
// // //                                     {/* ✅ All Issued Books Card - Shows all issued books initially, filtered on search */}
// // //                                     <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
// // //                                         <Card.Header style={{
// // //                                             background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
// // //                                             border: "none",
// // //                                             borderBottom: "2px solid #d1d5db",
// // //                                             padding: "20px 24px"
// // //                                         }}>
// // //                                             <Row className="align-items-center">
// // //                                                 <Col>
// // //                                                     <h5 className="mb-0 fw-bold" style={{
// // //                                                         color: "#1f2937",
// // //                                                         fontSize: "20px",
// // //                                                         letterSpacing: "0.3px"
// // //                                                     }}>
// // //                                                         <i className="fa-solid fa-book-open me-3" style={{ color: "#6b7280" }}></i>
// // //                                                         All Issued Books
// // //                                                         <span style={{ color: "orange", fontSize: "16px", marginLeft: "8px" }}>
// // //                                                             ({filteredIssuedBooks.length} Issue{filteredIssuedBooks.length !== 1 ? 's' : ''})
// // //                                                         </span>
// // //                                                     </h5>
// // //                                                 </Col>
// // //                                                 <Col xs="auto">
// // //                                                     <InputGroup style={{ maxWidth: "300px" }}>
// // //                                                         <InputGroup.Text style={{ backgroundColor: "#fff", border: "2px solid #8b5cf6", borderRight: "none" }}>
// // //                                                             <i className="fa-solid fa-search" style={{ color: "#8b5cf6" }}></i>
// // //                                                         </InputGroup.Text>
// // //                                                         <Form.Control
// // //                                                             type="text"
// // //                                                             placeholder="Search by title, ISBN, name..."
// // //                                                             value={searchTerm}
// // //                                                             onChange={(e) => setSearchTerm(e.target.value)}
// // //                                                             style={{ border: "2px solid #8b5cf6", borderRadius: "8px" }}
// // //                                                         />
// // //                                                         {searchTerm && (
// // //                                                             <Button variant="outline-secondary" onClick={() => setSearchTerm("")} style={{ border: "2px solid #8b5cf6" }}>
// // //                                                                 <i className="fa-solid fa-times"></i>
// // //                                                             </Button>
// // //                                                         )}
// // //                                                     </InputGroup>
// // //                                                 </Col>
// // //                                             </Row>
// // //                                         </Card.Header>
// // //                                         <Card.Body className="py-3 px-4">
// // //                                             {bookIssues && bookIssues.length > 0 && (
// // //                                                 <ResizableTable
// // //                                                     data={filteredIssuedBooks}  // <-- always filtered
// // //                                                     columns={issueColumns}
// // //                                                     loading={loading}
// // //                                                     showCheckbox={false}
// // //                                                     showSerialNumber={true}
// // //                                                     showActions={false}
// // //                                                     searchTerm={searchTerm}
// // //                                                     currentPage={currentPage}
// // //                                                     recordsPerPage={recordsPerPage}
// // //                                                     onPageChange={(page) => {
// // //                                                         setCurrentPage(page);
// // //                                                     }}
// // //                                                     emptyMessage={
// // //                                                         searchTerm
// // //                                                             ? "No issued books found matching your search"
// // //                                                             : "No books have been issued yet"
// // //                                                     }
// // //                                                     onRowClick={(issue) => {
// // //                                                         console.log("Issue clicked:", issue);
// // //                                                     }}
// // //                                                 />
// // //                                             )}


// // //                                         </Card.Body>
// // //                                     </Card>


// // //                                     {/* {bookIssues && bookIssues.length > 0 && (
// // //                                         <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
// // //                                             <Card.Header style={{
// // //                                                 background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
// // //                                                 border: "none",
// // //                                                 borderBottom: "2px solid #d1d5db",
// // //                                                 padding: "20px 24px"
// // //                                             }}>
// // //                                                 <h5 className="mb-0 fw-bold" style={{
// // //                                                     color: "#1f2937",
// // //                                                     fontSize: "20px",
// // //                                                     letterSpacing: "0.3px"
// // //                                                 }}>
// // //                                                     <i className="fa-solid fa-book-open me-3" style={{ color: "#6b7280" }}></i>
// // //                                                     Active Book Issues for this ISBN
// // //                                                     <span style={{ color: "orange", fontSize: "16px", marginLeft: "8px" }}>
// // //                                                         ({bookIssues.length} Issue{bookIssues.length > 1 ? 's' : ''})
// // //                                                     </span>
// // //                                                 </h5>
// // //                                             </Card.Header>
// // //                                             <Card.Body className="py-3 px-4">
// // //                                                 <div className="table-responsive">
// // //                                                     <Table striped bordered hover size="sm" className="mb-0">
// // //                                                         <thead style={{ backgroundColor: "white" }}>
// // //                                                             <tr>
// // //                                                                 <th>Issued To</th>
// // //                                                                 <th>Card No</th>
// // //                                                                 <th>Issue Date</th>
// // //                                                                 <th>Due Date</th>
// // //                                                                 <th>Status</th>
// // //                                                                 <th style={{ width: 100 }}>Action</th>
// // //                                                             </tr>
// // //                                                         </thead>
// // //                                                         <tbody>
// // //                                                             {bookIssues.map((bi) => (
// // //                                                                 <tr key={bi.id}>
// // //                                                                     <td>
// // //                                                                         <a
// // //                                                                             href={`/user/${bi.user_id || bi.student_id}`}
// // //                                                                             onClick={(e) => handleNameClick(
// // //                                                                                 bi.user_id || bi.student_id,
// // //                                                                                 bi.issued_to_name || bi.student_name || bi.issued_to,
// // //                                                                                 bi,
// // //                                                                                 e
// // //                                                                             )}
// // //                                                                             onContextMenu={(e) => {
// // //                                                                                 e.preventDefault();
// // //                                                                                 handleNameClick(
// // //                                                                                     bi.user_id || bi.student_id,
// // //                                                                                     bi.issued_to_name || bi.student_name || bi.issued_to,
// // //                                                                                     bi,
// // //                                                                                     { ...e, button: 2 }
// // //                                                                                 );
// // //                                                                             }}
// // //                                                                             style={{
// // //                                                                                 color: "#6f42c1",
// // //                                                                                 textDecoration: "none",
// // //                                                                                 fontWeight: "500",
// // //                                                                                 cursor: "pointer"
// // //                                                                             }}
// // //                                                                             onMouseEnter={(e) => {
// // //                                                                                 e.target.style.textDecoration = "underline";
// // //                                                                             }}
// // //                                                                             onMouseLeave={(e) => {
// // //                                                                                 e.target.style.textDecoration = "none";
// // //                                                                             }}
// // //                                                                             title="Click to view user details (Right-click to open in new tab)"
// // //                                                                         >
// // //                                                                             <i className="fa-solid fa-user me-1 text-primary"></i>
// // //                                                                             {bi.issued_to_name || bi.student_name || bi.issued_to}
// // //                                                                         </a>
// // //                                                                     </td>
// // //                                                                     <td>{bi.card_number || bi.card_id || '-'}</td>
// // //                                                                     <td>{formatDate(bi.issue_date)}</td>
// // //                                                                     <td>
// // //                                                                         <span style={{
// // //                                                                             color: new Date(bi.due_date) < new Date() ? '#dc3545' : '#28a745',
// // //                                                                             fontWeight: 'bold'
// // //                                                                         }}>
// // //                                                                             {formatDate(bi.due_date)}
// // //                                                                         </span>
// // //                                                                     </td>
// // //                                                                     <td>
// // //                                                                         <Badge bg={bi.status === 'issued' ? 'success' : 'secondary'}>
// // //                                                                             {bi.status || 'issued'}
// // //                                                                         </Badge>
// // //                                                                     </td>
// // //                                                                     <td>
// // //                                                                         <Button
// // //                                                                             size="sm"
// // //                                                                             onClick={() => handleSubmitClick(bi)}
// // //                                                                             variant="success"
// // //                                                                             disabled={loading}
// // //                                                                         >
// // //                                                                             {loading ? (
// // //                                                                                 <Spinner animation="border" size="sm" />
// // //                                                                             ) : (
// // //                                                                                 'Submit'
// // //                                                                             )}
// // //                                                                         </Button>
// // //                                                                     </td>
// // //                                                                 </tr>
// // //                                                             ))}
// // //                                                         </tbody>
// // //                                                     </Table>
// // //                                                 </div>
// // //                                             </Card.Body>
// // //                                         </Card>
// // //                                     )} */}
// // //                                 </Col>
// // //                             </Row>
// // //                         </Tab.Pane>

// // //                         {/* View Submitted Books Tab */}
// // //                         <Tab.Pane eventKey="submitted">
// // //                             <Row>
// // //                                 <Col lg={12}>
// // //                                     <Card className="shadow-sm">
// // //                                         <Card.Header style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #6f42c1" }}>
// // //                                             <Row className="align-items-center">
// // //                                                 <Col md={6}>
// // //                                                     <h5 className="mb-0 fw-bold" style={{ color: "#6f42c1" }}>
// // //                                                         <i className="fa-solid fa-list me-2"></i>
// // //                                                         Submitted Books List
// // //                                                     </h5>
// // //                                                 </Col>
// // //                                                 <Col md={6}>
// // //                                                     <div className="d-flex justify-content-end align-items-center gap-3">
// // //                                                         <InputGroup style={{ maxWidth: "400px" }}>
// // //                                                             <InputGroup.Text style={{ backgroundColor: "#fff", border: "2px solid #8b5cf6", borderRight: "none" }}>
// // //                                                                 <i className="fa-solid fa-search" style={{ color: "#8b5cf6" }}></i>
// // //                                                             </InputGroup.Text>
// // //                                                             <Form.Control
// // //                                                                 type="text"
// // //                                                                 placeholder="Search by book title, ISBN, or student name..."
// // //                                                                 value={searchTerm}
// // //                                                                 onChange={(e) => setSearchTerm(e.target.value)}
// // //                                                                 style={{ border: "2px solid #8b5cf6", borderRadius: "8px" }}
// // //                                                             />
// // //                                                             {searchTerm && (
// // //                                                                 <Button variant="outline-secondary" onClick={() => setSearchTerm("")} style={{ border: "2px solid #8b5cf6" }}>
// // //                                                                     <i className="fa-solid fa-times"></i>
// // //                                                                 </Button>
// // //                                                             )}
// // //                                                         </InputGroup>
// // //                                                     </div>
// // //                                                 </Col>
// // //                                             </Row>
// // //                                         </Card.Header>
// // //                                         <Card.Body className="p-0" style={{ overflow: "hidden", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
// // //                                             <ResizableTable
// // //                                                 data={filteredSubmittedBooks}
// // //                                                 columns={submittedBooksColumns}
// // //                                                 loading={loadingSubmitted}
// // //                                                 showCheckbox={false}
// // //                                                 showSerialNumber={true}
// // //                                                 showActions={false}
// // //                                                 searchTerm={searchTerm}
// // //                                                 currentPage={currentPage}
// // //                                                 recordsPerPage={recordsPerPage}
// // //                                                 onPageChange={(page) => setCurrentPage(page)}
// // //                                                 emptyMessage={searchTerm ? "No submitted books found matching your search" : "No books have been submitted yet"}
// // //                                             />
// // //                                         </Card.Body>
// // //                                     </Card>
// // //                                 </Col>
// // //                             </Row>
// // //                         </Tab.Pane>
// // //                     </Tab.Content>
// // //                 </Tab.Container>
// // //             </Container>

// // //             {/* Rest of your modals remain the same */}
// // //             {/* Scan Modal */}
// // //             <Modal show={showScanModal} onHide={() => setShowScanModal(false)} centered>
// // //                 <Modal.Header closeButton>
// // //                     <Modal.Title>
// // //                         <i className={`fa-solid ${scanMethod === "isbn" ? "fa-barcode" : "fa-address-card"} me-2`}></i>
// // //                         {scanMethod === "isbn" ? "Scan Barcode" : "Scan Library Card"}
// // //                     </Modal.Title>
// // //                 </Modal.Header>
// // //                 <Modal.Body>
// // //                     <div className="text-center">
// // //                         <i className={`fa-solid ${scanMethod === "isbn" ? "fa-barcode" : "fa-address-card"} fa-4x mb-3`}
// // //                             style={{ color: scanMethod === "isbn" ? "#0d6efd" : "#28a745" }}></i>
// // //                         <h5>Ready to Scan</h5>
// // //                         <p className="text-muted">
// // //                             {scanMethod === "isbn"
// // //                                 ? "Point your barcode scanner at the book barcode and scan."
// // //                                 : "Scan the library card barcode to retrieve member details."}
// // //                         </p>

// // //                         <Form.Group className="mt-4">
// // //                             <Form.Label>
// // //                                 <strong>
// // //                                     {scanMethod === "isbn" ? "Scanned ISBN:" : "Scanned Library Card:"}
// // //                                 </strong>
// // //                             </Form.Label>
// // //                             <Form.Control
// // //                                 type="text"
// // //                                 placeholder={scanMethod === "isbn" ? "Scanning will auto-populate here..." : "LIB123456..."}
// // //                                 value={isbn}
// // //                                 onChange={handleIsbnChange}
// // //                                 onKeyDown={handleIsbnKeyDown}
// // //                                 autoFocus
// // //                                 className="text-center fw-bold"
// // //                                 style={{ fontSize: "18px" }}
// // //                                 onBlur={() => {
// // //                                     if (isbn.trim().length >= 3 && !loading) {
// // //                                         performSearch(isbn.trim(), 'auto');
// // //                                     }
// // //                                 }}
// // //                             />
// // //                             <Form.Text className="text-muted">
// // //                                 {scanMethod === "isbn"
// // //                                     ? "Enter 10 or 13 digit ISBN number"
// // //                                     : "Enter library card number starting with LIB"}
// // //                             </Form.Text>
// // //                         </Form.Group>
// // //                     </div>
// // //                 </Modal.Body>
// // //                 <Modal.Footer>
// // //                     <Button variant="secondary" onClick={() => setShowScanModal(false)}>
// // //                         Cancel
// // //                     </Button>
// // //                     <Button
// // //                         variant="primary"
// // //                         onClick={handleScanSubmit}
// // //                         disabled={!isbn.trim()}
// // //                     >
// // //                         <i className="fa-solid fa-check me-2"></i>
// // //                         {scanMethod === "isbn" ? "Search Book" : "Search Card"}
// // //                     </Button>
// // //                 </Modal.Footer>
// // //             </Modal>

// // //             {/* Submit Confirmation Modal */}
// // //             <Modal show={showSubmitModal} onHide={handleModalClose} centered size="lg">
// // //                 <Modal.Header closeButton>
// // //                     <Modal.Title>
// // //                         <i className="fa-solid fa-paper-plane me-2 text-success"></i>
// // //                         Submit Book Return
// // //                     </Modal.Title>
// // //                 </Modal.Header>
// // //                 <Modal.Body>
// // //                     {selectedIssue && (
// // //                         <div>
// // //                             <h6 className="mb-3">Book Return Details</h6>

// // //                             {/* Issue Details */}
// // //                             <Card className="mb-3 ">
// // //                                 <Card.Header className="  py-2">
// // //                                     <h6 className="mb-0 small">Issue Information</h6>
// // //                                 </Card.Header>
// // //                                 <Card.Body className="py-2">
// // //                                     <Row>
// // //                                         <Col md={6}>
// // //                                             <strong className="small">Book Title:</strong>
// // //                                             <div className="text-secondary small">{selectedIssue.book_title || book?.title}</div>
// // //                                         </Col>
// // //                                         <Col md={6}>
// // //                                             <strong className="small">ISBN:</strong>
// // //                                             <div className="text-secondary small">{selectedIssue.book_isbn || book?.isbn}</div>
// // //                                         </Col>
// // //                                     </Row>
// // //                                     <Row className="mt-2">
// // //                                         <Col md={6}>
// // //                                             <strong className="small">Issued To:</strong>
// // //                                             <div className="text-secondary small">
// // //                                                 <Button
// // //                                                     variant="link"
// // //                                                     className="p-0 text-decoration-none"
// // //                                                     onClick={(e) => handleNameClick(
// // //                                                         selectedIssue.user_id || selectedIssue.student_id,
// // //                                                         selectedIssue.issued_to_name || selectedIssue.student_name || selectedIssue.issued_to,
// // //                                                         e
// // //                                                     )}
// // //                                                     title="View User Details"
// // //                                                 >
// // //                                                     <i className="fa-solid fa-user me-1 text-primary"></i>
// // //                                                     {selectedIssue.issued_to_name || selectedIssue.student_name || selectedIssue.issued_to}
// // //                                                 </Button>
// // //                                             </div>
// // //                                         </Col>
// // //                                         <Col md={6}>
// // //                                             <strong className="small">Card Number:</strong>
// // //                                             <div className="text-secondary small">{selectedIssue.card_number || selectedIssue.card_id || '-'}</div>
// // //                                         </Col>
// // //                                     </Row>
// // //                                     <Row className="mt-2">
// // //                                         <Col md={6}>
// // //                                             <strong className="small">Issue Date:</strong>
// // //                                             <div className="text-secondary small">{formatDate(selectedIssue.issue_date)}</div>
// // //                                         </Col>
// // //                                         <Col md={6}>
// // //                                             <strong className="small">Due Date:</strong>
// // //                                             <div className="text-secondary small">{formatDate(selectedIssue.due_date)}</div>
// // //                                         </Col>
// // //                                     </Row>
// // //                                 </Card.Body>
// // //                             </Card>

// // //                             {/* Condition Assessment Form */}
// // //                             <Card className="mb-3 ">
// // //                                 <Card.Header className=" py-2">
// // //                                     <h6 className="mb-0 small">Condition Assessment</h6>
// // //                                 </Card.Header>
// // //                                 <Card.Body className="py-2">
// // //                                     <Row>
// // //                                         <Col md={6}>
// // //                                             <Form.Group className="mb-2">
// // //                                                 <Form.Label className="small fw-bold">Condition Before</Form.Label>
// // //                                                 <Form.Control
// // //                                                     type="text"
// // //                                                     value={selectedIssue.condition_before || conditionBefore}
// // //                                                     onChange={(e) => setConditionBefore(e.target.value)}
// // //                                                     disabled={loading}
// // //                                                     size="sm"
// // //                                                     className="small"
// // //                                                 />
// // //                                             </Form.Group>
// // //                                         </Col>
// // //                                         <Col md={6}>
// // //                                             <Form.Group className="mb-2">
// // //                                                 <Form.Label className="small fw-bold">Condition After</Form.Label>
// // //                                                 <Form.Select
// // //                                                     value={conditionAfter}
// // //                                                     onChange={(e) => setConditionAfter(e.target.value)}
// // //                                                     disabled={loading}
// // //                                                     size="sm"
// // //                                                     className="small"
// // //                                                 >
// // //                                                     <option value="Good">✅ Good</option>
// // //                                                     <option value="Fair">⚠️ Fair</option>
// // //                                                     <option value="Damaged">❌ Damaged</option>
// // //                                                 </Form.Select>
// // //                                             </Form.Group>
// // //                                         </Col>
// // //                                     </Row>
// // //                                     <Form.Group className="mb-2">
// // //                                         <Form.Label className="small fw-bold">Remarks</Form.Label>
// // //                                         <Form.Control
// // //                                             as="textarea"
// // //                                             rows={3}
// // //                                             placeholder="Add notes about book condition..."
// // //                                             value={remarks}
// // //                                             onChange={(e) => setRemarks(e.target.value)}
// // //                                             disabled={loading}
// // //                                             size="sm"
// // //                                             className="small"
// // //                                         />
// // //                                     </Form.Group>
// // //                                 </Card.Body>
// // //                             </Card>

// // //                             {/* Penalty Information */}
// // //                             <Card>
// // //                                 <Card.Header className="py-2">
// // //                                     <h6 className="mb-0 small">Penalty Information</h6>
// // //                                 </Card.Header>
// // //                                 <Card.Body className="py-2">
// // //                                     <div className="text-center">
// // //                                         <h5 style={{
// // //                                             color: penalty.penalty > 0 ? "#dc3545" : "#28a745",
// // //                                             fontWeight: "bold"
// // //                                         }}>
// // //                                             ₹{penalty.penalty || 0}
// // //                                         </h5>
// // //                                         <p className="small text-muted mb-0">
// // //                                             {penalty.daysOverdue ? `Overdue by ${penalty.daysOverdue} day(s)` : "No overdue penalty"}
// // //                                         </p>
// // //                                     </div>
// // //                                 </Card.Body>
// // //                             </Card>
// // //                         </div>
// // //                     )}
// // //                 </Modal.Body>
// // //                 <Modal.Footer>
// // //                     <Button variant="secondary" onClick={handleModalClose} disabled={loading}>
// // //                         <i className="fa-solid fa-times me-2"></i>
// // //                         Cancel
// // //                     </Button>
// // //                     <Button variant="success" onClick={handleFinalSubmit} disabled={loading}>
// // //                         {loading ? (
// // //                             <>
// // //                                 <Spinner animation="border" size="sm" className="me-2" />
// // //                                 Submitting...
// // //                             </>
// // //                         ) : (
// // //                             <>
// // //                                 <i className="fa-solid fa-check me-2"></i>
// // //                                 Confirm Submit
// // //                             </>
// // //                         )}
// // //                     </Button>
// // //                 </Modal.Footer>
// // //             </Modal>
// // //         </>
// // //     );
// // // }

// // // export default BookSubmit;



// // import React, { useState, useEffect } from "react";
// // import { Container, Row, Col, Card, Form, Button, Spinner, Badge, InputGroup, Table, Modal, Tab, Nav } from "react-bootstrap";
// // import { useNavigate } from "react-router-dom";
// // import helper from "../common/helper";
// // import PubSub from "pubsub-js";
// // import * as constants from "../../constants/CONSTANT";
// // import DataApi from "../../api/dataApi";
// // import ResizableTable from "../common/ResizableTable";

// // const BookSubmit = () => {
// //     const navigate = useNavigate();
// //     const [isbn, setIsbn] = useState("");
// //     const [cardNumber, setCardNumber] = useState("");
// //     const [searchMode, setSearchMode] = useState("isbn");
// //     const [loading, setLoading] = useState(false);
// //     const [book, setBook] = useState(null);
// //     const [libraryCard, setLibraryCard] = useState(null);
// //     const [cardIssues, setCardIssues] = useState([]);
// //     const [issue, setIssue] = useState(null);
// //     const [bookIssues, setBookIssues] = useState([]);
// //     const [allIssuedBooks, setAllIssuedBooks] = useState([]);
// //     const [displayedIssuedBooks, setDisplayedIssuedBooks] = useState([]); // ✅ New state for displayed books
// //     const [penalty, setPenalty] = useState({ penalty: 0, daysOverdue: 0 });
// //     const [conditionBefore, setConditionBefore] = useState("Good");
// //     const [conditionAfter, setConditionAfter] = useState("Good");
// //     const [remarks, setRemarks] = useState("");
// //     const [isScanning, setIsScanning] = useState(false);
// //     const [selectedIssue, setSelectedIssue] = useState(null);
// //     const [activeTab, setActiveTab] = useState("submit");
// //     const [submittedBooks, setSubmittedBooks] = useState([]);
// //     const [loadingSubmitted, setLoadingSubmitted] = useState(false);
// //     const [searchTerm, setSearchTerm] = useState("");
// //     const [currentPage, setCurrentPage] = useState(1);
// //     const [showScanModal, setShowScanModal] = useState(false);
// //     const [showSubmitModal, setShowSubmitModal] = useState(false);
// //     const [scanMethod, setScanMethod] = useState("");
// //     const recordsPerPage = 20;
// //     const isbnInputRef = React.useRef(null);
// //     const cardInputRef = React.useRef(null);

// //     // ✅ Fetch all issued books on component mount
// //     useEffect(() => {
// //         fetchAllIssuedBooks();
// //     }, []);

// //     // ✅ Function to fetch all issued books
// //     const fetchAllIssuedBooks = async () => {
// //         try {
// //             setLoading(true);
// //             const issuesResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/active`, "GET");

// //             if (!issuesResp.ok) {
// //                 const err = await issuesResp.json().catch(() => ({}));
// //                 console.error("Error fetching all issued books:", err);
// //                 setAllIssuedBooks([]);
// //                 setDisplayedIssuedBooks([]);
// //                 return;
// //             }

// //             const issues = await issuesResp.json();
// //             setAllIssuedBooks(issues || []);
// //             setDisplayedIssuedBooks(issues || []); // ✅ Initially show all issued books
// //         } catch (error) {
// //             console.error("Error fetching all issued books:", error);
// //             setAllIssuedBooks([]);
// //             setDisplayedIssuedBooks([]);
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     // ✅ Update displayed books when bookIssues or allIssuedBooks change
// //     useEffect(() => {
// //         // If we have bookIssues from ISBN search, show only those
// //         if (bookIssues && bookIssues.length > 0) {
// //             setDisplayedIssuedBooks(bookIssues);
// //         }
// //         // If no bookIssues but we have allIssuedBooks, show all
// //         else if (allIssuedBooks && allIssuedBooks.length > 0) {
// //             setDisplayedIssuedBooks(allIssuedBooks);
// //         }
// //         // Otherwise, show empty
// //         else {
// //             setDisplayedIssuedBooks([]);
// //         }
// //     }, [bookIssues, allIssuedBooks]);

// //     const formatDate = (dateStr) => {
// //         if (!dateStr) return "-";
// //         try {
// //             const d = new Date(dateStr);
// //             if (isNaN(d)) return dateStr;
// //             const dd = String(d.getDate()).padStart(2, "0");
// //             const mm = String(d.getMonth() + 1).padStart(2, "0");
// //             const yyyy = d.getFullYear();
// //             return `${dd}-${mm}-${yyyy}`;
// //         } catch (e) {
// //             return dateStr;
// //         }
// //     };

// //     // Navigate to user detail page
// //     const handleNameClick = (userId, userName, issueData, e) => {
// //         if (e) {
// //             e.preventDefault();
// //             e.stopPropagation();
// //         }

// //         if (userId) {
// //             try {
// //                 const prefetchData = issueData || { id: userId, name: userName };
// //                 localStorage.setItem(`prefetch:user:${userId}`, JSON.stringify(prefetchData));
// //             } catch (err) {
// //                 console.warn("Failed to store prefetch data:", err);
// //             }

// //             if (e && (e.button === 2 || e.ctrlKey || e.metaKey)) {
// //                 window.open(`/user/${userId}`, '_blank');
// //             } else {
// //                 navigate(`/user/${userId}`, {
// //                     state: { userName: userName, ...issueData },
// //                 });
// //             }
// //         }
// //     };

// //     // Fetch submitted books
// //     useEffect(() => {
// //         if (activeTab === "submitted") {
// //             fetchSubmittedBooks();
// //         }
// //     }, [activeTab]);

// //     const fetchSubmittedBooks = async () => {
// //         try {
// //             setLoadingSubmitted(true);
// //             const submissionApi = new DataApi("book_submissions");
// //             const response = await submissionApi.fetchAll();
// //             let submissions = [];
// //             if (response.data && response.data.success && Array.isArray(response.data.data)) {
// //                 submissions = response.data.data;
// //             } else if (Array.isArray(response.data)) {
// //                 submissions = response.data;
// //             }
// //             setSubmittedBooks(submissions);
// //         } catch (error) {
// //             console.error("Error fetching submitted books:", error);
// //             PubSub.publish("RECORD_ERROR_TOAST", {
// //                 title: "Error",
// //                 message: "Failed to fetch submitted books"
// //             });
// //             setSubmittedBooks([]);
// //         } finally {
// //             setLoadingSubmitted(false);
// //         }
// //     };

// //     // Perform search with ISBN or Library Card
// //     const performSearch = async (value, mode = null) => {
// //         const searchType = mode || searchMode;
// //         console.log("Performing search with:", value, "mode:", searchType);

// //         if (!value || value.trim() === "") {
// //             // ✅ If empty search, show all issued books again
// //             setDisplayedIssuedBooks(allIssuedBooks);
// //             setBookIssues([]);
// //             setBook(null);
// //             setLibraryCard(null);
// //             setCardIssues([]);

// //             PubSub.publish("RECORD_ERROR_TOAST", {
// //                 title: "Validation",
// //                 message: `Please enter or scan ${searchType === "card" ? "Library Card Number" : "ISBN"}`
// //             });
// //             return;
// //         }

// //         try {
// //             setLoading(true);

// //             if (searchType === "card") {
// //                 // Search by library card number
// //                 const cardResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/librarycard/card/${encodeURIComponent(value.trim().toUpperCase())}`, "GET");
// //                 if (!cardResp.ok) {
// //                     const err = await cardResp.json().catch(() => ({}));
// //                     PubSub.publish("RECORD_ERROR_TOAST", { title: "Not Found", message: err.errors || "Library card not found" });
// //                     setLibraryCard(null);
// //                     setCardIssues([]);
// //                     setBook(null);
// //                     setBookIssues([]);
// //                     setDisplayedIssuedBooks(allIssuedBooks); // ✅ Show all books on error
// //                     return;
// //                 }

// //                 const cardData = await cardResp.json();
// //                 setLibraryCard(cardData);

// //                 // Find active issues for this card
// //                 const issuesResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/card/${cardData.id}`, "GET");
// //                 if (!issuesResp.ok) {
// //                     const err = await issuesResp.json().catch(() => ({}));
// //                     PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: err.errors || "Failed to fetch issue records" });
// //                     setCardIssues([]);
// //                     setDisplayedIssuedBooks(allIssuedBooks); // ✅ Show all books on error
// //                     return;
// //                 }

// //                 const issues = await issuesResp.json();
// //                 if (!issues || !Array.isArray(issues) || issues.length === 0) {
// //                     PubSub.publish("RECORD_ERROR_TOAST", { title: "No Active Issue", message: "No active issued record found for this library card" });
// //                     setCardIssues([]);
// //                     setDisplayedIssuedBooks(allIssuedBooks); // ✅ Show all books when no issues found
// //                     return;
// //                 }

// //                 setCardIssues(issues);
// //                 setDisplayedIssuedBooks(issues); // ✅ Show only card-specific issues
// //                 setBook(null);
// //                 setBookIssues([]);

// //             } else {
// //                 // Search book by ISBN
// //                 const bookResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/book/isbn/${encodeURIComponent(value.trim())}`, "GET");
// //                 if (!bookResp.ok) {
// //                     const err = await bookResp.json().catch(() => ({}));
// //                     PubSub.publish("RECORD_ERROR_TOAST", { title: "Not Found", message: err.errors || "Book not found" });
// //                     setBook(null);
// //                     setIssue(null);
// //                     setBookIssues([]);
// //                     setDisplayedIssuedBooks(allIssuedBooks); // ✅ Show all books on error
// //                     return;
// //                 }

// //                 const bookData = await bookResp.json();
// //                 setBook(bookData);

// //                 // Find active issues for this book
// //                 const issuesResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/book/${bookData.id}`, "GET");
// //                 if (!issuesResp.ok) {
// //                     const err = await issuesResp.json().catch(() => ({}));
// //                     PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: err.errors || "Failed to fetch issue records" });
// //                     setIssue(null);
// //                     setBookIssues([]);
// //                     setDisplayedIssuedBooks(allIssuedBooks); // ✅ Show all books on error
// //                     return;
// //                 }

// //                 const issues = await issuesResp.json();
// //                 if (!issues || !Array.isArray(issues) || issues.length === 0) {
// //                     PubSub.publish("RECORD_ERROR_TOAST", { title: "No Active Issue", message: "No active issued record found for this ISBN" });
// //                     setIssue(null);
// //                     setBookIssues([]);
// //                     setDisplayedIssuedBooks(allIssuedBooks); // ✅ Show all books when no issues found
// //                     return;
// //                 }

// //                 setBookIssues(issues);
// //                 setDisplayedIssuedBooks(issues); // ✅ Show only book-specific issues
// //                 const activeIssue = issues[0];
// //                 setIssue(activeIssue);

// //                 // Fetch penalty info
// //                 const penaltyResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/penalty/${activeIssue.id}`, "GET");
// //                 if (penaltyResp.ok) {
// //                     const penaltyData = await penaltyResp.json();
// //                     if (penaltyData && penaltyData.success) {
// //                         setPenalty(penaltyData.data || { penalty: 0, daysOverdue: 0 });
// //                     } else if (penaltyData && penaltyData.data) {
// //                         setPenalty(penaltyData.data);
// //                     } else {
// //                         setPenalty({ penalty: 0, daysOverdue: 0 });
// //                     }
// //                 } else {
// //                     setPenalty({ penalty: 0, daysOverdue: 0 });
// //                 }

// //                 // Clear library card data when searching by ISBN
// //                 setLibraryCard(null);
// //                 setCardIssues([]);
// //             }

// //         } catch (error) {
// //             console.error("Error searching:", error);
// //             PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: error.message || "Error searching" });
// //             setBook(null);
// //             setIssue(null);
// //             setBookIssues([]);
// //             setLibraryCard(null);
// //             setCardIssues([]);
// //             setDisplayedIssuedBooks(allIssuedBooks); // ✅ Show all books on error
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     const handleSearch = async () => {
// //         const value = searchMode === "card" ? cardNumber : isbn;
// //         await performSearch(value, searchMode);
// //     };

// //     const handleIsbnChange = async (e) => {
// //         const value = e.target.value;
// //         setIsbn(value);

// //         // Auto-search when user types (with debounce)
// //         if (value.trim().length >= 3) {
// //             if (isbnInputRef.current?.timer) {
// //                 clearTimeout(isbnInputRef.current.timer);
// //             }

// //             isbnInputRef.current.timer = setTimeout(async () => {
// //                 if (value.trim().length >= 3) {
// //                     await performSearch(value.trim(), "isbn");
// //                 }
// //             }, 800);
// //         } else if (value.trim().length === 0) {
// //             // ✅ Clear results and show all issued books when input is empty
// //             setBook(null);
// //             setIssue(null);
// //             setBookIssues([]);
// //             setPenalty({ penalty: 0, daysOverdue: 0 });
// //             setDisplayedIssuedBooks(allIssuedBooks);
// //         }
// //     };

// //     const handleCardNumberChange = async (e) => {
// //         const value = e.target.value;
// //         setCardNumber(value);

// //         // Auto-search when user types (with debounce)
// //         if (value.trim().length >= 3) {
// //             if (cardInputRef.current?.timer) {
// //                 clearTimeout(cardInputRef.current.timer);
// //             }

// //             cardInputRef.current.timer = setTimeout(async () => {
// //                 if (value.trim().length >= 3) {
// //                     await performSearch(value.trim(), "card");
// //                 }
// //             }, 800);
// //         } else if (value.trim().length === 0) {
// //             // ✅ Clear results and show all issued books when input is empty
// //             setLibraryCard(null);
// //             setCardIssues([]);
// //             setDisplayedIssuedBooks(allIssuedBooks);
// //         }
// //     };

// //     const handleIsbnKeyDown = async (e) => {
// //         if (e.key === 'Enter') {
// //             e.preventDefault();
// //             if (isbnInputRef.current?.timer) {
// //                 clearTimeout(isbnInputRef.current.timer);
// //             }
// //             setIsScanning(true);
// //             await performSearch(isbn, "isbn");
// //             setIsScanning(false);
// //         }
// //     };

// //     const handleCardKeyDown = async (e) => {
// //         if (e.key === 'Enter') {
// //             e.preventDefault();
// //             if (cardInputRef.current?.timer) {
// //                 clearTimeout(cardInputRef.current.timer);
// //             }
// //             setIsScanning(true);
// //             await performSearch(cardNumber, "card");
// //             setIsScanning(false);
// //         }
// //     };

// //     // ✅ Clear search and show all books
// //     const handleClearSearch = () => {
// //         if (searchMode === "isbn") {
// //             if (isbnInputRef.current?.timer) {
// //                 clearTimeout(isbnInputRef.current.timer);
// //             }
// //             setIsbn("");
// //             setBook(null);
// //             setIssue(null);
// //             setBookIssues([]);
// //             setPenalty({ penalty: 0, daysOverdue: 0 });
// //             setDisplayedIssuedBooks(allIssuedBooks); // ✅ Show all books
// //             isbnInputRef.current?.focus();
// //         } else {
// //             if (cardInputRef.current?.timer) {
// //                 clearTimeout(cardInputRef.current.timer);
// //             }
// //             setCardNumber("");
// //             setLibraryCard(null);
// //             setCardIssues([]);
// //             setDisplayedIssuedBooks(allIssuedBooks); // ✅ Show all books
// //             cardInputRef.current?.focus();
// //         }
// //     };

// //     // Rest of your functions remain the same (handleScanButtonClick, handleScanSubmit, handleSubmitClick, handleModalClose, handleFinalSubmit)
// //     const handleSubmitClick = (issueItem) => {
// //         setSelectedIssue(issueItem);
// //         setShowSubmitModal(true);
// //     };
// //     // ✅ Filter displayed issued books based on search term
// //     const filteredIssuedBooks = displayedIssuedBooks.filter(issue => {
// //         if (!searchTerm) return true;
// //         const query = searchTerm.toLowerCase();
// //         const bookTitle = (issue.book_title || "").toLowerCase();
// //         const isbn = (issue.book_isbn || "").toLowerCase();
// //         const studentName = (issue.issued_to_name || issue.student_name || "").toLowerCase();
// //         const cardNumber = (issue.card_number || "").toLowerCase();

// //         return (
// //             bookTitle.includes(query) ||
// //             isbn.includes(query) ||
// //             studentName.includes(query) ||
// //             cardNumber.includes(query)
// //         );
// //     });
// //     const handleModalClose = () => {
// //         setShowSubmitModal(false);
// //         setSelectedIssue(null);
// //         setConditionAfter("Good");
// //         setRemarks("");
// //     };
// //     const handleFinalSubmit = async () => {
// //         if (!selectedIssue) return;

// //         try {
// //             setLoading(true);
// //             const body = JSON.stringify({
// //                 issue_id: selectedIssue.id,
// //                 condition_before: selectedIssue.condition_before || conditionBefore || 'Good',
// //                 condition_after: conditionAfter || 'Good',
// //                 remarks: remarks || '',
// //                 submit_date: new Date().toISOString().split('T')[0]
// //             });

// //             const resp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/book_submissions`, "POST", body);
// //             if (!resp.ok) {
// //                 const err = await resp.json().catch(() => ({}));
// //                 PubSub.publish("RECORD_SAVED_TOAST", { title: "Error", message: err.errors || "Failed to submit book", type: "error" });
// //                 return;
// //             }

// //             const result = await resp.json();
// //             if (result && result.success) {
// //                 PubSub.publish("RECORD_SAVED_TOAST", {
// //                     title: "Success",
// //                     message: `Book submitted successfully for ${selectedIssue.issued_to_name || selectedIssue.student_name || selectedIssue.issued_to}`
// //                 });

// //                 // Remove the issue from lists
// //                 setBookIssues(prev => prev.filter(item => item.id !== selectedIssue.id));
// //                 setCardIssues(prev => prev.filter(item => item.id !== selectedIssue.id));

// //                 // Close modal and reset form
// //                 handleModalClose();

// //                 // Clear main data if this was the last issue
// //                 if (bookIssues.length === 1 && cardIssues.length === 0) {
// //                     setIsbn("");
// //                     setBook(null);
// //                     setIssue(null);
// //                     setLibraryCard(null);
// //                 }
// //             } else {
// //                 PubSub.publish("RECORD_SAVED_TOAST", {
// //                     title: "Error",
// //                     message: (result && result.errors) || "Failed to submit book",
// //                     type: "error"
// //                 });
// //             }
// //         } catch (error) {
// //             console.error("Error submitting book:", error);
// //             PubSub.publish("RECORD_SAVED_TOAST", {
// //                 title: "Error",
// //                 message: error.message || "Error submitting book",
// //                 type: "error"
// //             });
// //         } finally {
// //             setLoading(false);
// //         }
// //     };
// //     // ✅ Define columns for issued books table (same as before)
// //     const issueColumns = [
// //         {
// //             field: "book_title",
// //             label: "Book Title",
// //             width: 250,
// //             render: (value, record) => (
// //                 <a
// //                     href={`/books/${record.book_id}`}
// //                     onClick={(e) => {
// //                         e.preventDefault();
// //                         e.stopPropagation();
// //                         try {
// //                             localStorage.setItem(`prefetch:book:${record.book_id}`, JSON.stringify(record));
// //                         } catch (err) { }
// //                         navigate(`/books/${record.book_id}`, { state: record });
// //                     }}
// //                     onContextMenu={(e) => {
// //                         e.preventDefault();
// //                         e.stopPropagation();
// //                         try {
// //                             localStorage.setItem(`prefetch:book:${record.book_id}`, JSON.stringify(record));
// //                         } catch (err) { }
// //                         window.open(`/books/${record.book_id}`, '_blank');
// //                     }}
// //                     style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 600, cursor: "pointer" }}
// //                     onMouseEnter={(e) => {
// //                         e.target.style.textDecoration = "underline";
// //                     }}
// //                     onMouseLeave={(e) => {
// //                         e.target.style.textDecoration = "none";
// //                     }}
// //                     title="Click to view book details (Right-click to open in new tab)"
// //                 >
// //                     {value || "N/A"}
// //                 </a>
// //             )
// //         },
// //         {
// //             field: "book_isbn",
// //             label: "ISBN",
// //             width: 150,
// //             render: (value) => (
// //                 <code style={{ background: "#f8f9fa", padding: "4px 8px", borderRadius: "4px" }}>
// //                     {value || "-"}
// //                 </code>
// //             )
// //         },
// //         {
// //             field: "issued_to_name",
// //             label: "Issued To",
// //             width: 200,
// //             render: (value, record) => {
// //                 const userId = record.user_id || record.student_id;
// //                 const displayName = value || record.student_name || record.issued_to || "N/A";
// //                 if (userId) {
// //                     return (
// //                         <a
// //                             href={`/user/${userId}`}
// //                             onClick={(e) => handleNameClick(userId, displayName, record, e)}
// //                             onContextMenu={(e) => {
// //                                 e.preventDefault();
// //                                 handleNameClick(userId, displayName, record, { ...e, button: 2 });
// //                             }}
// //                             style={{
// //                                 color: "#6f42c1",
// //                                 textDecoration: "none",
// //                                 fontWeight: "500",
// //                                 cursor: "pointer"
// //                             }}
// //                             onMouseEnter={(e) => {
// //                                 e.target.style.textDecoration = "underline";
// //                             }}
// //                             onMouseLeave={(e) => {
// //                                 e.target.style.textDecoration = "none";
// //                             }}
// //                             title="Click to view user details (Right-click to open in new tab)"
// //                         >
// //                             <i className="fa-solid fa-user me-1 text-primary"></i>
// //                             {displayName}
// //                         </a>
// //                     );
// //                 }
// //                 return displayName;
// //             }
// //         },
// //         {
// //             field: "card_number",
// //             label: "Card No",
// //             width: 120
// //         },
// //         {
// //             field: "issue_date",
// //             label: "Issue Date",
// //             width: 120,
// //             render: (value) => formatDate(value)
// //         },
// //         {
// //             field: "due_date",
// //             label: "Due Date",
// //             width: 120,
// //             render: (value) => (
// //                 <span style={{
// //                     color: new Date(value) < new Date() ? '#dc3545' : '#28a745',
// //                     fontWeight: 'bold'
// //                 }}>
// //                     {formatDate(value)}
// //                 </span>
// //             )
// //         },
// //         {
// //             field: "actions",
// //             label: "Action",
// //             width: 100,
// //             render: (value, record) => (
// //                 <Button
// //                     size="sm"
// //                     onClick={() => handleSubmitClick(record)}
// //                     variant="success"
// //                     disabled={loading}
// //                 >
// //                     {loading ? (
// //                         <Spinner animation="border" size="sm" />
// //                     ) : (
// //                         'Submit'
// //                     )}
// //                 </Button>
// //             )
// //         }
// //     ];

// //     // ✅ Define columns for submitted books table (same as before)
// //     const submittedBooksColumns = [
// //         {
// //             field: "book_title",
// //             label: "Book Title",
// //             width: 250,
// //             render: (value, record) => (
// //                 <a
// //                     href={`/books/${record.book_id}`}
// //                     onClick={(e) => {
// //                         e.preventDefault();
// //                         e.stopPropagation();
// //                         try {
// //                             localStorage.setItem(`prefetch:book:${record.book_id}`, JSON.stringify(record));
// //                         } catch (err) { }
// //                         navigate(`/books/${record.book_id}`, { state: record });
// //                     }}
// //                     onContextMenu={(e) => {
// //                         e.preventDefault();
// //                         e.stopPropagation();
// //                         try {
// //                             localStorage.setItem(`prefetch:book:${record.book_id}`, JSON.stringify(record));
// //                         } catch (err) { }
// //                         window.open(`/books/${record.book_id}`, '_blank');
// //                     }}
// //                     style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 600, cursor: "pointer" }}
// //                     onMouseEnter={(e) => {
// //                         e.target.style.textDecoration = "underline";
// //                     }}
// //                     onMouseLeave={(e) => {
// //                         e.target.style.textDecoration = "none";
// //                     }}
// //                     title="Click to view book details (Right-click to open in new tab)"
// //                 >
// //                     {value || "N/A"}
// //                 </a>
// //             )
// //         },
// //         {
// //             field: "book_isbn",
// //             label: "ISBN",
// //             width: 150,
// //             render: (value) => (
// //                 <code style={{ background: "#f8f9fa", padding: "4px 8px", borderRadius: "4px" }}>
// //                     {value || "-"}
// //                 </code>
// //             )
// //         },
// //         {
// //             field: "student_name",
// //             label: "Submitted By",
// //             width: 200,
// //             render: (value, record) => {
// //                 const userId = record.issued_to;
// //                 const displayName = value || record.student_name || "N/A";
// //                 if (userId) {
// //                     return (
// //                         <a
// //                             href={`/user/${userId}`}
// //                             onClick={(e) => {
// //                                 e.preventDefault();
// //                                 e.stopPropagation();
// //                                 try {
// //                                     localStorage.setItem(`prefetch:user:${userId}`, JSON.stringify(record));
// //                                 } catch (err) { }
// //                                 navigate(`/user/${userId}`, { state: record });
// //                             }}
// //                             onContextMenu={(e) => {
// //                                 e.preventDefault();
// //                                 e.stopPropagation();
// //                                 try {
// //                                     localStorage.setItem(`prefetch:user:${userId}`, JSON.stringify(record));
// //                                 } catch (err) { }
// //                                 window.open(`/user/${userId}`, '_blank');
// //                             }}
// //                             style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 500, cursor: "pointer" }}
// //                             onMouseEnter={(e) => {
// //                                 e.target.style.textDecoration = "underline";
// //                             }}
// //                             onMouseLeave={(e) => {
// //                                 e.target.style.textDecoration = "none";
// //                             }}
// //                             title="Click to view user details (Right-click to open in new tab)"
// //                         >
// //                             {displayName}
// //                         </a>
// //                     );
// //                 }
// //                 return displayName;
// //             }
// //         },
// //         {
// //             field: "submit_date",
// //             label: "Submit Date",
// //             width: 150,
// //             render: (value) => formatDate(value)
// //         },
// //         {
// //             field: "condition_after",
// //             label: "Condition",
// //             width: 120,
// //             render: (value) => (
// //                 <Badge bg={value === "Good" ? "success" : value === "Fair" ? "warning" : "danger"}>
// //                     {value || "Good"}
// //                 </Badge>
// //             )
// //         }
// //     ];
// //     const filteredSubmittedBooks = submittedBooks.filter(submission => {
// //         if (!searchTerm) return true;
// //         const query = searchTerm.toLowerCase();
// //         const bookTitle = (submission.book_title || "").toLowerCase();
// //         const isbn = (submission.book_isbn || "").toLowerCase();
// //         const studentName = (submission.student_name || "").toLowerCase();
// //         return (
// //             bookTitle.includes(query) ||
// //             isbn.includes(query) ||
// //             studentName.includes(query)
// //         );
// //     });
// //     // const handleScanButtonClick = (method) => {
// //     //     setScanMethod(method);
// //     //     setShowScanModal(true);
// //     // };
// //      const handleScanButtonClick = () => {
// //         setShowScanModal(true);
// //     };

// //     return (
// //         <>
// //             <Container fluid className="mt-3" style={{ marginTop: "0.5rem", padding: "0 1.5rem" }}>
// //                 {/* Tabs */}
// //                 <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || "submit")}>
// //                     <Nav variant="tabs" style={{ borderBottom: "2px solid #e5e7eb" }}>
// //                         <Nav.Item>
// //                             <Nav.Link
// //                                 eventKey="submit"
// //                                 style={{
// //                                     color: activeTab === "submit" ? "#000000" : "#6b7280",
// //                                     fontWeight: activeTab === "submit" ? "600" : "400",
// //                                     borderBottom: activeTab === "submit" ? "3px solid #6b7280" : "none"
// //                                 }}
// //                             >
// //                                 <i className="fa-solid fa-book-return me-2" style={{ color: activeTab === "submit" ? "#000000" : "#6b7280", fontSize: "15px" }}></i>
// //                                 <span style={{ color: activeTab === "submit" ? "#000000" : "#6b7280", fontSize: "15px" }}>Submit Book</span>
// //                             </Nav.Link>
// //                         </Nav.Item>
// //                         <Nav.Item>
// //                             <Nav.Link
// //                                 eventKey="submitted"
// //                                 style={{
// //                                     color: activeTab === "submitted" ? "#000000" : "#6b7280",
// //                                     fontWeight: activeTab === "submitted" ? "600" : "400",
// //                                     borderBottom: activeTab === "submitted" ? "3px solid #6b7280" : "none"
// //                                 }}
// //                             >
// //                                 <span style={{ color: activeTab === "submitted" ? "#000000" : "#6b7280", fontSize: "15px" }}>View Submitted Books ({submittedBooks.length})</span>
// //                             </Nav.Link>
// //                         </Nav.Item>
// //                     </Nav>

// //                     <Tab.Content>
// //                         {/* Submit Book Tab */}
// //                         <Tab.Pane eventKey="submit">
// //                             <Row>
// //                                 <Col lg={6} md={12}>
// //                                     {/* Book Identification Card */}
// //                                     <Card className="mb-4 shadow-sm" style={{ background: "#f3e8ff", border: "1px solid #d8b4fe", borderRadius: "8px" }}>
// //                                         <Card.Header style={{
// //                                             background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
// //                                             border: "none",
// //                                             borderBottom: "2px solid #d1d5db",
// //                                             padding: "20px 24px"
// //                                         }}>
// //                                             <h5 className="mb-0 fw-bold" style={{
// //                                                 color: "#1f2937",
// //                                                 fontSize: "20px",
// //                                                 letterSpacing: "0.3px"
// //                                             }}>
// //                                                 <i className="fa-solid fa-book-open me-3" style={{ color: "#6b7280" }}></i>
// //                                                 Book Identification
// //                                             </h5>
// //                                         </Card.Header>
// //                                         <Card.Body className="p-4">
// //                                             {/* Scan/Enter Section */}
// //                                             <div className="mb-4">
// //                                                 <div className="d-flex align-items-center gap-3 flex-wrap">
// //                                                     {/* Scan Button */}
// //                                                     <Button
// //                                                         variant="primary"
// //                                                         onClick={handleScanButtonClick}
// //                                                         size="lg"
// //                                                         disabled={loading}
// //                                                         style={{
// //                                                             height: "48px",
// //                                                             backgroundColor: "#0d6efd",
// //                                                             border: "none",
// //                                                             borderRadius: "8px",
// //                                                             minWidth: "60px",   
// //                                                             fontWeight: "600",
// //                                                             fontSize: "0.95rem",
// //                                                             boxShadow: "0 2px 4px rgba(13, 110, 253, 0.3)",
// //                                                             display: "flex",
// //                                                             justifyContent: "center",
// //                                                             alignItems: "center",
// //                                                         }}
// //                                                     >
// //                                                         {loading ? (
// //                                                             <Spinner animation="border" size="sm" />
// //                                                         ) : (
// //                                                             <i className="fa-solid fa-camera"></i>
// //                                                         )}
// //                                                     </Button>

// //                                                     {/* Or Separator */}
// //                                                     <div className="text-muted fw-bold" style={{ minWidth: "40px", textAlign: "center", fontSize: "0.9rem" }}>
// //                                                         OR
// //                                                     </div>

// //                                                     {/* Manual Input Group */}
// //                                                     <InputGroup style={{ flex: "1", minWidth: "300px" }}>
// //                                                         <Form.Control
// //                                                             ref={searchMode === "isbn" ? isbnInputRef : cardInputRef}
// //                                                             type="text"
// //                                                             placeholder={searchMode === "isbn" ? "Type ISBN number here" : "Type Library Card number here"}
// //                                                             value={searchMode === "isbn" ? isbn : cardNumber}
// //                                                             onChange={searchMode === "isbn" ? handleIsbnChange : handleCardNumberChange}
// //                                                             onKeyDown={searchMode === "isbn" ? handleIsbnKeyDown : handleCardKeyDown}
// //                                                             autoFocus
// //                                                             disabled={loading}
// //                                                             size="lg"
// //                                                             style={{
// //                                                                 border: "1px solid #dee2e6",
// //                                                                 borderRadius: "8px 0 0 8px",
// //                                                                 fontSize: "0.95rem",
// //                                                                 padding: "0.75rem 1rem"
// //                                                             }}
// //                                                         />
// //                                                         {loading && (
// //                                                             <InputGroup.Text style={{
// //                                                                 border: "1px solid #dee2e6",
// //                                                                 borderLeft: "none",
// //                                                                 borderRadius: "0",
// //                                                                 backgroundColor: "#f8f9fa"
// //                                                             }}>
// //                                                                 <Spinner animation="border" size="sm" />
// //                                                             </InputGroup.Text>
// //                                                         )}
// //                                                         <Button
// //                                                             variant="outline-secondary"
// //                                                             onClick={handleClearSearch} // ✅ Use new clear function
// //                                                             disabled={loading}
// //                                                             size="lg"
// //                                                             style={{
// //                                                                 border: "1px solid #dee2e6",
// //                                                                 borderLeft: loading ? "none" : "1px solid #dee2e6",
// //                                                                 borderRadius: loading ? "0 8px 8px 0" : "0 8px 8px 0",
// //                                                                 minWidth: "50px",
// //                                                                 backgroundColor: "#f8f9fa"
// //                                                             }}
// //                                                         >
// //                                                             <i className="fa-solid fa-xmark"></i>
// //                                                         </Button>
// //                                                     </InputGroup>
// //                                                 </div>
// //                                             </div>
// //                                         </Card.Body>
// //                                     </Card>

// //                                     {/* Library Card Details */}
// //                                     {libraryCard && (
// //                                         <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
// //                                             <Card.Header className="py-3 px-4" style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #6f42c1" }}>
// //                                                 <div className="d-flex justify-content-between align-items-center">
// //                                                     <h6 className="mb-0 fw-bold" style={{ color: "#6f42c1", fontSize: "1rem" }}>
// //                                                         <i className="fa-solid fa-id-card me-2"></i>
// //                                                         Library Card: {libraryCard.card_number}
// //                                                     </h6>
// //                                                     <Badge bg="info">
// //                                                         {cardIssues.length} Active Issue{cardIssues.length !== 1 ? 's' : ''}
// //                                                     </Badge>
// //                                                 </div>
// //                                             </Card.Header>
// //                                             <Card.Body className="py-3 px-4">
// //                                                 <Row>
// //                                                     <Col md={6}>
// //                                                         <div className="mb-2">
// //                                                             <strong className="small">Card Holder:</strong>
// //                                                             <div className="text-secondary">
// //                                                                 {libraryCard.user_name || libraryCard.student_name || "N/A"}
// //                                                             </div>
// //                                                         </div>
// //                                                     </Col>
// //                                                     <Col md={6}>
// //                                                         <div className="mb-2">
// //                                                             <strong className="small">Card Number:</strong>
// //                                                             <div className="text-secondary">{libraryCard.card_number}</div>
// //                                                         </div>
// //                                                     </Col>
// //                                                 </Row>
// //                                             </Card.Body>
// //                                         </Card>
// //                                     )}

// //                                     {/* Book Details */}
// //                                     {book && (
// //                                         <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
// //                                             <Card.Header style={{
// //                                                 background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
// //                                                 border: "none",
// //                                                 borderBottom: "2px solid #d1d5db",
// //                                                 padding: "20px 24px"
// //                                             }}>
// //                                                 <h5 className="mb-0 fw-bold" style={{
// //                                                     color: "#1f2937",
// //                                                     fontSize: "20px",
// //                                                     letterSpacing: "0.3px"
// //                                                 }}>
// //                                                     Book Details for ISBN: {isbn}
// //                                                 </h5>
// //                                             </Card.Header>
// //                                             <Card.Body className="py-3 px-4">
// //                                                 <Row>
// //                                                     <Col md={6}>
// //                                                         <div className="mb-2">
// //                                                             <strong className="small">Title:</strong>
// //                                                             <div className="text-secondary">
// //                                                                 <a
// //                                                                     href={`/books/${book.id}`}
// //                                                                     onClick={(e) => {
// //                                                                         e.preventDefault();
// //                                                                         navigate(`/books/${book.id}`);
// //                                                                     }}
// //                                                                     style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 600 }}
// //                                                                     onMouseEnter={(e) => {
// //                                                                         try {
// //                                                                             localStorage.setItem(`prefetch:book:${book.id}`, JSON.stringify(book));
// //                                                                         } catch (err) { }
// //                                                                         e.target.style.textDecoration = "underline";
// //                                                                     }}
// //                                                                     onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
// //                                                                 >
// //                                                                     {book.title}
// //                                                                 </a>
// //                                                             </div>
// //                                                         </div>
// //                                                     </Col>
// //                                                     <Col md={6}>
// //                                                         <div className="mb-2">
// //                                                             <strong className="small">ISBN:</strong>
// //                                                             <div className="text-secondary">{book.isbn}</div>
// //                                                         </div>
// //                                                     </Col>
// //                                                 </Row>
// //                                                 <Row>
// //                                                     <Col md={6}>
// //                                                         <div className="mb-2">
// //                                                             <strong className="small">Author:</strong>
// //                                                             <div className="text-secondary">{book.author || "N/A"}</div>
// //                                                         </div>
// //                                                     </Col>
// //                                                     <Col md={6}>
// //                                                         <div className="mb-2">
// //                                                             <strong className="small">Total Copies:</strong>
// //                                                             <div className="text-secondary">{book.total_copies || 0}</div>
// //                                                         </div>
// //                                                     </Col>
// //                                                 </Row>
// //                                             </Card.Body>
// //                                         </Card>
// //                                     )}


// //                                 </Col>

// //                                 <Col lg={6} md={12}>
// //                                     {/* ✅ All Issued Books Card - Shows all issued books initially, filtered on search */}
// //                                     <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
// //                                         <Card.Header style={{
// //                                             background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
// //                                             border: "none",
// //                                             borderBottom: "2px solid #d1d5db",
// //                                             padding: "20px 24px"
// //                                         }}>
// //                                             <Row className="align-items-center">
// //                                                 <Col>
// //                                                     <h5 className="mb-0 fw-bold" style={{
// //                                                         color: "#1f2937",
// //                                                         fontSize: "20px",
// //                                                         letterSpacing: "0.3px"
// //                                                     }}>
// //                                                         <i className="fa-solid fa-book-open me-3" style={{ color: "#6b7280" }}></i>
// //                                                         {bookIssues.length > 0 ? "Issued Books for this ISBN" : "All Issued Books"}
// //                                                         <span style={{ color: "orange", fontSize: "16px", marginLeft: "8px" }}>
// //                                                             ({filteredIssuedBooks.length} Issue{filteredIssuedBooks.length !== 1 ? 's' : ''})
// //                                                         </span>
// //                                                     </h5>
// //                                                 </Col>
// //                                                 <Col xs="auto">
// //                                                     <InputGroup style={{ maxWidth: "300px" }}>
// //                                                         <InputGroup.Text style={{ backgroundColor: "#fff", border: "2px solid #8b5cf6", borderRight: "none" }}>
// //                                                             <i className="fa-solid fa-search" style={{ color: "#8b5cf6" }}></i>
// //                                                         </InputGroup.Text>
// //                                                         <Form.Control
// //                                                             type="text"
// //                                                             placeholder="Search by title, ISBN, name..."
// //                                                             value={searchTerm}
// //                                                             onChange={(e) => setSearchTerm(e.target.value)}
// //                                                             style={{ border: "2px solid #8b5cf6", borderRadius: "8px" }}
// //                                                         />
// //                                                         {searchTerm && (
// //                                                             <Button variant="outline-secondary" onClick={() => setSearchTerm("")} style={{ border: "2px solid #8b5cf6" }}>
// //                                                                 <i className="fa-solid fa-times"></i>
// //                                                             </Button>
// //                                                         )}
// //                                                     </InputGroup>
// //                                                 </Col>
// //                                             </Row>
// //                                         </Card.Header>
// //                                         <Card.Body className="py-3 px-4">
// //                                             <ResizableTable
// //                                                 data={filteredIssuedBooks}
// //                                                 columns={issueColumns}
// //                                                 loading={loading}
// //                                                 showCheckbox={false}
// //                                                 showSerialNumber={true}
// //                                                 showActions={false}
// //                                                 searchTerm={searchTerm}
// //                                                 currentPage={currentPage}
// //                                                 recordsPerPage={recordsPerPage}
// //                                                 onPageChange={(page) => {
// //                                                     setCurrentPage(page);
// //                                                 }}
// //                                                 emptyMessage={

// //                                                     book && bookIssues && bookIssues.length === 0
// //                                                         ? <div className="text-center py-4">
// //                                                             <i className="fa-solid fa-check-circle fa-2x text-success mb-3"></i>
// //                                                             <h6 className="text-success">No Active Issues Found</h6>
// //                                                             <p className="text-muted mb-0">
// //                                                                 This book is not currently issued to anyone or all issues have been returned.
// //                                                             </p>
// //                                                         </div>
// //                                                         : searchTerm
// //                                                             ? "No issued books found matching your search"
// //                                                             : "No books have been issued yet"
// //                                                 }
// //                                                 onRowClick={(issue) => {
// //                                                     console.log("Issue clicked:", issue);
// //                                                 }}
// //                                             />
// //                                         </Card.Body>
// //                                     </Card>
// //                                 </Col>
// //                             </Row>
// //                         </Tab.Pane>

// //                         {/* View Submitted Books Tab */}
// //                         <Tab.Pane eventKey="submitted">
// //                             <Row>
// //                                 <Col lg={12}>
// //                                     <Card className="shadow-sm">/                                         <Card.Header style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #6f42c1" }}>
// //                                         <Row className="align-items-center">
// //                                             <Col md={6}>
// //                                                 <h5 className="mb-0 fw-bold" style={{ color: "#6f42c1" }}>
// //                                                     <i className="fa-solid fa-list me-2"></i>
// //                                                     Submitted Books List
// //                                                 </h5>
// //                                             </Col>
// //                                             <Col md={6}>
// //                                                 <div className="d-flex justify-content-end align-items-center gap-3">
// //                                                     <InputGroup style={{ maxWidth: "400px" }}>
// //                                                         <InputGroup.Text style={{ backgroundColor: "#fff", border: "2px solid #8b5cf6", borderRight: "none" }}>
// //                                                             <i className="fa-solid fa-search" style={{ color: "#8b5cf6" }}></i>
// //                                                         </InputGroup.Text>
// //                                                         <Form.Control
// //                                                             type="text"
// //                                                             placeholder="Search by book title, ISBN, or student name..."
// //                                                             value={searchTerm}
// //                                                             onChange={(e) => setSearchTerm(e.target.value)}
// //                                                             style={{ border: "2px solid #8b5cf6", borderRadius: "8px" }}
// //                                                         />
// //                                                         {searchTerm && (
// //                                                             <Button variant="outline-secondary" onClick={() => setSearchTerm("")} style={{ border: "2px solid #8b5cf6" }}>
// //                                                                 <i className="fa-solid fa-times"></i>
// //                                                             </Button>
// //                                                         )}
// //                                                     </InputGroup>
// //                                                 </div>
// //                                             </Col>
// //                                         </Row>
// //                                     </Card.Header>
// //                                         <Card.Body className="p-0" style={{ overflow: "hidden", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
// //                                             <ResizableTable
// //                                                 data={filteredSubmittedBooks}
// //                                                 columns={submittedBooksColumns}
// //                                                 loading={loadingSubmitted}
// //                                                 showCheckbox={false}
// //                                                 showSerialNumber={true}
// //                                                 showActions={false}
// //                                                 searchTerm={searchTerm}
// //                                                 currentPage={currentPage}
// //                                                 recordsPerPage={recordsPerPage}
// //                                                 onPageChange={(page) => setCurrentPage(page)}
// //                                                 emptyMessage={searchTerm ? "No submitted books found matching your search" : "No books have been submitted yet"}
// //                                             />
// //                                         </Card.Body>
// //                                     </Card>
// //                                 </Col>
// //                             </Row>
// //                         </Tab.Pane>
// //                     </Tab.Content>
// //                 </Tab.Container>
// //             </Container>

// //             <Modal show={showSubmitModal} onHide={handleModalClose} centered size="lg">
// //                 <Modal.Header closeButton>
// //                     <Modal.Title>
// //                         <i className="fa-solid fa-paper-plane me-2 text-success"></i>
// //                         Submit Book Return
// //                     </Modal.Title>
// //                 </Modal.Header>
// //                 <Modal.Body>
// //                     {selectedIssue && (
// //                         <div>
// //                             <h6 className="mb-3">Book Return Details</h6>

// //                             {/* Issue Details */}
// //                             <Card className="mb-3 ">
// //                                 <Card.Header className="  py-2">
// //                                     <h6 className="mb-0 small">Issue Information</h6>
// //                                 </Card.Header>
// //                                 <Card.Body className="py-2">
// //                                     <Row>
// //                                         <Col md={6}>
// //                                             <strong className="small">Book Title:</strong>
// //                                             <div className="text-secondary small">{selectedIssue.book_title || book?.title}</div>
// //                                         </Col>
// //                                         <Col md={6}>
// //                                             <strong className="small">ISBN:</strong>
// //                                             <div className="text-secondary small">{selectedIssue.book_isbn || book?.isbn}</div>
// //                                         </Col>
// //                                     </Row>
// //                                     <Row className="mt-2">
// //                                         <Col md={6}>
// //                                             <strong className="small">Issued To:</strong>
// //                                             <div className="text-secondary small">
// //                                                 <Button
// //                                                     variant="link"
// //                                                     className="p-0 text-decoration-none"
// //                                                     onClick={(e) => handleNameClick(
// //                                                         selectedIssue.user_id || selectedIssue.student_id,
// //                                                         selectedIssue.issued_to_name || selectedIssue.student_name || selectedIssue.issued_to,
// //                                                         e
// //                                                     )}
// //                                                     title="View User Details"
// //                                                 >
// //                                                     <i className="fa-solid fa-user me-1 text-primary"></i>
// //                                                     {selectedIssue.issued_to_name || selectedIssue.student_name || selectedIssue.issued_to}
// //                                                 </Button>
// //                                             </div>
// //                                         </Col>
// //                                         <Col md={6}>
// //                                             <strong className="small">Card Number:</strong>
// //                                             <div className="text-secondary small">{selectedIssue.card_number || selectedIssue.card_id || '-'}</div>
// //                                         </Col>
// //                                     </Row>
// //                                     <Row className="mt-2">
// //                                         <Col md={6}>
// //                                             <strong className="small">Issue Date:</strong>
// //                                             <div className="text-secondary small">{formatDate(selectedIssue.issue_date)}</div>
// //                                         </Col>
// //                                         <Col md={6}>
// //                                             <strong className="small">Due Date:</strong>
// //                                             <div className="text-secondary small">{formatDate(selectedIssue.due_date)}</div>
// //                                         </Col>
// //                                     </Row>
// //                                 </Card.Body>
// //                             </Card>

// //                             {/* Condition Assessment Form */}
// //                             <Card className="mb-3 ">
// //                                 <Card.Header className=" py-2">
// //                                     <h6 className="mb-0 small">Condition Assessment</h6>
// //                                 </Card.Header>
// //                                 <Card.Body className="py-2">
// //                                     <Row>
// //                                         <Col md={6}>
// //                                             <Form.Group className="mb-2">
// //                                                 <Form.Label className="small fw-bold">Condition Before</Form.Label>
// //                                                 <Form.Control
// //                                                     type="text"
// //                                                     value={selectedIssue.condition_before || conditionBefore}
// //                                                     onChange={(e) => setConditionBefore(e.target.value)}
// //                                                     disabled={loading}
// //                                                     size="sm"
// //                                                     className="small"
// //                                                 />
// //                                             </Form.Group>
// //                                         </Col>
// //                                         <Col md={6}>
// //                                             <Form.Group className="mb-2">
// //                                                 <Form.Label className="small fw-bold">Condition After</Form.Label>
// //                                                 <Form.Select
// //                                                     value={conditionAfter}
// //                                                     onChange={(e) => setConditionAfter(e.target.value)}
// //                                                     disabled={loading}
// //                                                     size="sm"
// //                                                     className="small"
// //                                                 >
// //                                                     <option value="Good">✅ Good</option>
// //                                                     <option value="Fair">⚠️ Fair</option>
// //                                                     <option value="Damaged">❌ Damaged</option>
// //                                                 </Form.Select>
// //                                             </Form.Group>
// //                                         </Col>
// //                                     </Row>
// //                                     <Form.Group className="mb-2">
// //                                         <Form.Label className="small fw-bold">Remarks</Form.Label>
// //                                         <Form.Control
// //                                             as="textarea"
// //                                             rows={3}
// //                                             placeholder="Add notes about book condition..."
// //                                             value={remarks}
// //                                             onChange={(e) => setRemarks(e.target.value)}
// //                                             disabled={loading}
// //                                             size="sm"
// //                                             className="small"
// //                                         />
// //                                     </Form.Group>
// //                                 </Card.Body>
// //                             </Card>

// //                             {/* Penalty Information */}
// //                             <Card>
// //                                 <Card.Header className="py-2">
// //                                     <h6 className="mb-0 small">Penalty Information</h6>
// //                                 </Card.Header>
// //                                 <Card.Body className="py-2">
// //                                     <div className="text-center">
// //                                         <h5 style={{
// //                                             color: penalty.penalty > 0 ? "#dc3545" : "#28a745",
// //                                             fontWeight: "bold"
// //                                         }}>
// //                                             ₹{penalty.penalty || 0}
// //                                         </h5>
// //                                         <p className="small text-muted mb-0">
// //                                             {penalty.daysOverdue ? `Overdue by ${penalty.daysOverdue} day(s)` : "No overdue penalty"}
// //                                         </p>
// //                                     </div>
// //                                 </Card.Body>
// //                             </Card>
// //                         </div>
// //                     )}
// //                 </Modal.Body>
// //                 <Modal.Footer>
// //                     <Button variant="secondary" onClick={handleModalClose} disabled={loading}>
// //                         <i className="fa-solid fa-times me-2"></i>
// //                         Cancel
// //                     </Button>
// //                     <Button variant="success" onClick={handleFinalSubmit} disabled={loading}>
// //                         {loading ? (
// //                             <>
// //                                 <Spinner animation="border" size="sm" className="me-2" />
// //                                 Submitting...
// //                             </>
// //                         ) : (
// //                             <>
// //                                 <i className="fa-solid fa-check me-2"></i>
// //                                 Confirm Submit
// //                             </>
// //                         )}
// //                     </Button>
// //                 </Modal.Footer>
// //             </Modal>

// //         </>
// //     );
// // }

// // export default BookSubmit;











// import React, { useState, useEffect } from "react";
// import { Container, Row, Col, Card, Form, Button, Spinner, Badge, InputGroup, Table, Modal, Tab, Nav } from "react-bootstrap";
// import { useNavigate } from "react-router-dom";
// import helper from "../common/helper";
// import PubSub from "pubsub-js";
// import * as constants from "../../constants/CONSTANT";
// import DataApi from "../../api/dataApi";
// import ResizableTable from "../common/ResizableTable";

// const BookSubmit = () => {
//     const navigate = useNavigate();
//     const [isbn, setIsbn] = useState("");
//     const [cardNumber, setCardNumber] = useState("");
//     const [searchMode, setSearchMode] = useState("isbn");
//     const [loading, setLoading] = useState(false);
//     const [book, setBook] = useState(null);
//     const [libraryCard, setLibraryCard] = useState(null);
//     const [cardIssues, setCardIssues] = useState([]);
//     const [issue, setIssue] = useState(null);
//     const [bookIssues, setBookIssues] = useState([]);
//     const [allIssuedBooks, setAllIssuedBooks] = useState([]);
//     const [displayedIssuedBooks, setDisplayedIssuedBooks] = useState([]);
//     const [penalty, setPenalty] = useState({ penalty: 0, daysOverdue: 0 });
//     const [conditionBefore, setConditionBefore] = useState("Good");
//     const [conditionAfter, setConditionAfter] = useState("Good");
//     const [remarks, setRemarks] = useState("");
//     const [isScanning, setIsScanning] = useState(false);
//     const [selectedIssue, setSelectedIssue] = useState(null);
//     const [activeTab, setActiveTab] = useState("submit");
//     const [submittedBooks, setSubmittedBooks] = useState([]);
//     const [loadingSubmitted, setLoadingSubmitted] = useState(false);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [currentPage, setCurrentPage] = useState(1);
//     const [showScanModal, setShowScanModal] = useState(false);
//     const [showSubmitModal, setShowSubmitModal] = useState(false);
//     const [scanMethod, setScanMethod] = useState("isbn"); // "isbn" or "card"
//     const recordsPerPage = 20;
//     const isbnInputRef = React.useRef(null);
//     const cardInputRef = React.useRef(null);

//     // ✅ Fetch all issued books on component mount
//     useEffect(() => {
//         fetchAllIssuedBooks();
//     }, []);

//     // ✅ Function to fetch all issued books
//     const fetchAllIssuedBooks = async () => {
//         try {
//             setLoading(true);
//             const issuesResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/active`, "GET");

//             if (!issuesResp.ok) {
//                 const err = await issuesResp.json().catch(() => ({}));
//                 console.error("Error fetching all issued books:", err);
//                 setAllIssuedBooks([]);
//                 setDisplayedIssuedBooks([]);
//                 return;
//             }

//             const issues = await issuesResp.json();
//             setAllIssuedBooks(issues || []);
//             setDisplayedIssuedBooks(issues || []);
//         } catch (error) {
//             console.error("Error fetching all issued books:", error);
//             setAllIssuedBooks([]);
//             setDisplayedIssuedBooks([]);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // ✅ Update displayed books when bookIssues or allIssuedBooks change
//     useEffect(() => {
//         if (bookIssues && bookIssues.length > 0) {
//             setDisplayedIssuedBooks(bookIssues);
//         }
//         else if (allIssuedBooks && allIssuedBooks.length > 0) {
//             setDisplayedIssuedBooks(allIssuedBooks);
//         }
//         else {
//             setDisplayedIssuedBooks([]);
//         }
//     }, [bookIssues, allIssuedBooks]);

//     const formatDate = (dateStr) => {
//         if (!dateStr) return "-";
//         try {
//             const d = new Date(dateStr);
//             if (isNaN(d)) return dateStr;
//             const dd = String(d.getDate()).padStart(2, "0");
//             const mm = String(d.getMonth() + 1).padStart(2, "0");
//             const yyyy = d.getFullYear();
//             return `${dd}-${mm}-${yyyy}`;
//         } catch (e) {
//             return dateStr;
//         }
//     };

//     // Navigate to user detail page
//     const handleNameClick = (userId, userName, issueData, e) => {
//         if (e) {
//             e.preventDefault();
//             e.stopPropagation();
//         }

//         if (userId) {
//             try {
//                 const prefetchData = issueData || { id: userId, name: userName };
//                 localStorage.setItem(`prefetch:user:${userId}`, JSON.stringify(prefetchData));
//             } catch (err) {
//                 console.warn("Failed to store prefetch data:", err);
//             }

//             if (e && (e.button === 2 || e.ctrlKey || e.metaKey)) {
//                 window.open(`/user/${userId}`, '_blank');
//             } else {
//                 navigate(`/user/${userId}`, {
//                     state: { userName: userName, ...issueData },
//                 });
//             }
//         }
//     };

//     // Fetch submitted books
//     useEffect(() => {
//         if (activeTab === "submitted") {
//             fetchSubmittedBooks();
//         }
//     }, [activeTab]);

//     const fetchSubmittedBooks = async () => {
//         try {
//             setLoadingSubmitted(true);
//             const submissionApi = new DataApi("book_submissions");
//             const response = await submissionApi.fetchAll();
//             let submissions = [];
//             if (response.data && response.data.success && Array.isArray(response.data.data)) {
//                 submissions = response.data.data;
//             } else if (Array.isArray(response.data)) {
//                 submissions = response.data;
//             }
//             setSubmittedBooks(submissions);
//         } catch (error) {
//             console.error("Error fetching submitted books:", error);
//             PubSub.publish("RECORD_ERROR_TOAST", {
//                 title: "Error",
//                 message: "Failed to fetch submitted books"
//             });
//             setSubmittedBooks([]);
//         } finally {
//             setLoadingSubmitted(false);
//         }
//     };

//     // Perform search with ISBN or Library Card
//     const performSearch = async (value, mode = null) => {
//         const searchType = mode || searchMode;
//         console.log("Performing search with:", value, "mode:", searchType);

//         if (!value || value.trim() === "") {
//             setDisplayedIssuedBooks(allIssuedBooks);
//             setBookIssues([]);
//             setBook(null);
//             setLibraryCard(null);
//             setCardIssues([]);

//             PubSub.publish("RECORD_ERROR_TOAST", {
//                 title: "Validation",
//                 message: `Please enter or scan ${searchType === "card" ? "Library Card Number" : "ISBN"}`
//             });
//             return;
//         }

//         try {
//             setLoading(true);

//             if (searchType === "card") {
//                 // Search by library card number
//                 const cardResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/librarycard/card/${encodeURIComponent(value.trim().toUpperCase())}`, "GET");
//                 if (!cardResp.ok) {
//                     const err = await cardResp.json().catch(() => ({}));
//                     PubSub.publish("RECORD_ERROR_TOAST", { title: "Not Found", message: err.errors || "Library card not found" });
//                     setLibraryCard(null);
//                     setCardIssues([]);
//                     setBook(null);
//                     setBookIssues([]);
//                     setDisplayedIssuedBooks(allIssuedBooks);
//                     return;
//                 }

//                 const cardData = await cardResp.json();
//                 setLibraryCard(cardData);

//                 // Find active issues for this card
//                 const issuesResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/card/${cardData.id}`, "GET");
//                 if (!issuesResp.ok) {
//                     const err = await issuesResp.json().catch(() => ({}));
//                     PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: err.errors || "Failed to fetch issue records" });
//                     setCardIssues([]);
//                     setDisplayedIssuedBooks(allIssuedBooks);
//                     return;
//                 }

//                 const issues = await issuesResp.json();
//                 if (!issues || !Array.isArray(issues) || issues.length === 0) {
//                     PubSub.publish("RECORD_ERROR_TOAST", { title: "No Active Issue", message: "No active issued record found for this library card" });
//                     setCardIssues([]);
//                     setDisplayedIssuedBooks(allIssuedBooks);
//                     return;
//                 }

//                 setCardIssues(issues);
//                 setDisplayedIssuedBooks(issues);
//                 setBook(null);
//                 setBookIssues([]);

//             } else {
//                 // Search book by ISBN
//                 const bookResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/book/isbn/${encodeURIComponent(value.trim())}`, "GET");
//                 if (!bookResp.ok) {
//                     const err = await bookResp.json().catch(() => ({}));
//                     PubSub.publish("RECORD_ERROR_TOAST", { title: "Not Found", message: err.errors || "Book not found" });
//                     setBook(null);
//                     setIssue(null);
//                     setBookIssues([]);
//                     setDisplayedIssuedBooks(allIssuedBooks);
//                     return;
//                 }

//                 const bookData = await bookResp.json();
//                 setBook(bookData);

//                 // Find active issues for this book
//                 const issuesResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/book/${bookData.id}`, "GET");
//                 if (!issuesResp.ok) {
//                     const err = await issuesResp.json().catch(() => ({}));
//                     PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: err.errors || "Failed to fetch issue records" });
//                     setIssue(null);
//                     setBookIssues([]);
//                     setDisplayedIssuedBooks(allIssuedBooks);
//                     return;
//                 }

//                 const issues = await issuesResp.json();
//                 if (!issues || !Array.isArray(issues) || issues.length === 0) {
//                     PubSub.publish("RECORD_ERROR_TOAST", { title: "No Active Issue", message: "No active issued record found for this ISBN" });
//                     setIssue(null);
//                     setBookIssues([]);
//                     setDisplayedIssuedBooks(allIssuedBooks);
//                     return;
//                 }

//                 setBookIssues(issues);
//                 setDisplayedIssuedBooks(issues);
//                 const activeIssue = issues[0];
//                 setIssue(activeIssue);

//                 // Fetch penalty info
//                 const penaltyResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/penalty/${activeIssue.id}`, "GET");
//                 if (penaltyResp.ok) {
//                     const penaltyData = await penaltyResp.json();
//                     if (penaltyData && penaltyData.success) {
//                         setPenalty(penaltyData.data || { penalty: 0, daysOverdue: 0 });
//                     } else if (penaltyData && penaltyData.data) {
//                         setPenalty(penaltyData.data);
//                     } else {
//                         setPenalty({ penalty: 0, daysOverdue: 0 });
//                     }
//                 } else {
//                     setPenalty({ penalty: 0, daysOverdue: 0 });
//                 }

//                 // Clear library card data when searching by ISBN
//                 setLibraryCard(null);
//                 setCardIssues([]);
//             }

//         } catch (error) {
//             console.error("Error searching:", error);
//             PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: error.message || "Error searching" });
//             setBook(null);
//             setIssue(null);
//             setBookIssues([]);
//             setLibraryCard(null);
//             setCardIssues([]);
//             setDisplayedIssuedBooks(allIssuedBooks);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleSearch = async () => {
//         const value = searchMode === "card" ? cardNumber : isbn;
//         await performSearch(value, searchMode);
//     };

//     const handleIsbnChange = async (e) => {
//         const value = e.target.value;
//         setIsbn(value);

//         // Auto-search when user types (with debounce)
//         if (value.trim().length >= 3) {
//             if (isbnInputRef.current?.timer) {
//                 clearTimeout(isbnInputRef.current.timer);
//             }

//             isbnInputRef.current.timer = setTimeout(async () => {
//                 if (value.trim().length >= 3) {
//                     await performSearch(value.trim(), "isbn");
//                 }
//             }, 800);
//         } else if (value.trim().length === 0) {
//             setBook(null);
//             setIssue(null);
//             setBookIssues([]);
//             setPenalty({ penalty: 0, daysOverdue: 0 });
//             setDisplayedIssuedBooks(allIssuedBooks);
//         }
//     };

//     const handleCardNumberChange = async (e) => {
//         const value = e.target.value;
//         setCardNumber(value);

//         // Auto-search when user types (with debounce)
//         if (value.trim().length >= 3) {
//             if (cardInputRef.current?.timer) {
//                 clearTimeout(cardInputRef.current.timer);
//             }

//             cardInputRef.current.timer = setTimeout(async () => {
//                 if (value.trim().length >= 3) {
//                     await performSearch(value.trim(), "card");
//                 }
//             }, 800);
//         } else if (value.trim().length === 0) {
//             setLibraryCard(null);
//             setCardIssues([]);
//             setDisplayedIssuedBooks(allIssuedBooks);
//         }
//     };

//     const handleIsbnKeyDown = async (e) => {
//         if (e.key === 'Enter') {
//             e.preventDefault();
//             if (isbnInputRef.current?.timer) {
//                 clearTimeout(isbnInputRef.current.timer);
//             }
//             setIsScanning(true);
//             await performSearch(isbn, "isbn");
//             setIsScanning(false);
//         }
//     };

//     const handleCardKeyDown = async (e) => {
//         if (e.key === 'Enter') {
//             e.preventDefault();
//             if (cardInputRef.current?.timer) {
//                 clearTimeout(cardInputRef.current.timer);
//             }
//             setIsScanning(true);
//             await performSearch(cardNumber, "card");
//             setIsScanning(false);
//         }
//     };

//     // ✅ Clear search and show all books
//     const handleClearSearch = () => {
//         if (searchMode === "isbn") {
//             if (isbnInputRef.current?.timer) {
//                 clearTimeout(isbnInputRef.current.timer);
//             }
//             setIsbn("");
//             setBook(null);
//             setIssue(null);
//             setBookIssues([]);
//             setPenalty({ penalty: 0, daysOverdue: 0 });
//             setDisplayedIssuedBooks(allIssuedBooks);
//             isbnInputRef.current?.focus();
//         } else {
//             if (cardInputRef.current?.timer) {
//                 clearTimeout(cardInputRef.current.timer);
//             }
//             setCardNumber("");
//             setLibraryCard(null);
//             setCardIssues([]);
//             setDisplayedIssuedBooks(allIssuedBooks);
//             cardInputRef.current?.focus();
//         }
//     };

//     // ✅ Handle scan button click with method selection
//     const handleScanButtonClick = (method = "isbn") => {
//         setScanMethod(method);
//         setShowScanModal(true);
//     };

//     // ✅ Handle scan submit
//     const handleScanSubmit = async () => {
//         if (isbn.trim()) {
//             setShowScanModal(false);
//             await performSearch(isbn, scanMethod);
//         }
//     };

//     // ✅ Handle scan input change in modal
//     const handleScanInputChange = (e) => {
//         const value = e.target.value;
//         setIsbn(value);

//         // Auto-submit when barcode is scanned (usually barcode scanners send Enter key)
//         if (value.length >= 8) { // Typical barcode length
//             // Small delay to capture the complete barcode
//             setTimeout(() => {
//                 handleScanSubmit();
//             }, 100);
//         }
//     };

//     // ✅ Handle scan input key down
//     const handleScanInputKeyDown = async (e) => {
//         if (e.key === 'Enter') {
//             e.preventDefault();
//             await handleScanSubmit();
//         }
//     };

//     const handleSubmitClick = (issueItem) => {
//         setSelectedIssue(issueItem);
//         setShowSubmitModal(true);
//     };

//     const handleModalClose = () => {
//         setShowSubmitModal(false);
//         setSelectedIssue(null);
//         setConditionAfter("Good");
//         setRemarks("");
//     };

//     const handleFinalSubmit = async () => {
//         if (!selectedIssue) return;

//         try {
//             setLoading(true);
//             const body = JSON.stringify({
//                 issue_id: selectedIssue.id,
//                 condition_before: selectedIssue.condition_before || conditionBefore || 'Good',
//                 condition_after: conditionAfter || 'Good',
//                 remarks: remarks || '',
//                 submit_date: new Date().toISOString().split('T')[0]
//             });

//             const resp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/book_submissions`, "POST", body);
//             if (!resp.ok) {
//                 const err = await resp.json().catch(() => ({}));
//                 PubSub.publish("RECORD_SAVED_TOAST", { title: "Error", message: err.errors || "Failed to submit book", type: "error" });
//                 return;
//             }

//             const result = await resp.json();
//             if (result && result.success) {
//                 PubSub.publish("RECORD_SAVED_TOAST", {
//                     title: "Success",
//                     message: `Book submitted successfully for ${selectedIssue.issued_to_name || selectedIssue.student_name || selectedIssue.issued_to}`
//                 });

//                 // Remove the issue from lists
//                 setBookIssues(prev => prev.filter(item => item.id !== selectedIssue.id));
//                 setCardIssues(prev => prev.filter(item => item.id !== selectedIssue.id));
//                 setAllIssuedBooks(prev => prev.filter(item => item.id !== selectedIssue.id));
//                 setDisplayedIssuedBooks(prev => prev.filter(item => item.id !== selectedIssue.id));

//                 // Close modal and reset form
//                 handleModalClose();

//                 // Clear main data if this was the last issue
//                 if (bookIssues.length === 1 && cardIssues.length === 0) {
//                     setIsbn("");
//                     setBook(null);
//                     setIssue(null);
//                     setLibraryCard(null);
//                 }
//             } else {
//                 PubSub.publish("RECORD_SAVED_TOAST", {
//                     title: "Error",
//                     message: (result && result.errors) || "Failed to submit book",
//                     type: "error"
//                 });
//             }
//         } catch (error) {
//             console.error("Error submitting book:", error);
//             PubSub.publish("RECORD_SAVED_TOAST", {
//                 title: "Error",
//                 message: error.message || "Error submitting book",
//                 type: "error"
//             });
//         } finally {
//             setLoading(false);
//         }
//     };

//     // ✅ Filter displayed issued books based on search term
//     const filteredIssuedBooks = displayedIssuedBooks.filter(issue => {
//         if (!searchTerm) return true;
//         const query = searchTerm.toLowerCase();
//         const bookTitle = (issue.book_title || "").toLowerCase();
//         const isbn = (issue.book_isbn || "").toLowerCase();
//         const studentName = (issue.issued_to_name || issue.student_name || "").toLowerCase();
//         const cardNumber = (issue.card_number || "").toLowerCase();

//         return (
//             bookTitle.includes(query) ||
//             isbn.includes(query) ||
//             studentName.includes(query) ||
//             cardNumber.includes(query)
//         );
//     });

//     const filteredSubmittedBooks = submittedBooks.filter(submission => {
//         if (!searchTerm) return true;
//         const query = searchTerm.toLowerCase();
//         const bookTitle = (submission.book_title || "").toLowerCase();
//         const isbn = (submission.book_isbn || "").toLowerCase();
//         const studentName = (submission.student_name || "").toLowerCase();
//         return (
//             bookTitle.includes(query) ||
//             isbn.includes(query) ||
//             studentName.includes(query)
//         );
//     });

//     // ✅ Define columns for issued books table
//     const issueColumns = [
//         {
//             field: "book_title",
//             label: "Book Title",
//             width: 250,
//             render: (value, record) => (
//                 <a
//                     href={`/books/${record.book_id}`}
//                     onClick={(e) => {
//                         e.preventDefault();
//                         e.stopPropagation();
//                         try {
//                             localStorage.setItem(`prefetch:book:${record.book_id}`, JSON.stringify(record));
//                         } catch (err) { }
//                         navigate(`/books/${record.book_id}`, { state: record });
//                     }}
//                     onContextMenu={(e) => {
//                         e.preventDefault();
//                         e.stopPropagation();
//                         try {
//                             localStorage.setItem(`prefetch:book:${record.book_id}`, JSON.stringify(record));
//                         } catch (err) { }
//                         window.open(`/books/${record.book_id}`, '_blank');
//                     }}
//                     style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 600, cursor: "pointer" }}
//                     onMouseEnter={(e) => {
//                         e.target.style.textDecoration = "underline";
//                     }}
//                     onMouseLeave={(e) => {
//                         e.target.style.textDecoration = "none";
//                     }}
//                     title="Click to view book details (Right-click to open in new tab)"
//                 >
//                     {value || "N/A"}
//                 </a>
//             )
//         },
//         {
//             field: "book_isbn",
//             label: "ISBN",
//             width: 150,
//             render: (value) => (
//                 <code style={{ background: "#f8f9fa", padding: "4px 8px", borderRadius: "4px" }}>
//                     {value || "-"}
//                 </code>
//             )
//         },
//         {
//             field: "issued_to_name",
//             label: "Issued To",
//             width: 200,
//             render: (value, record) => {
//                 const userId = record.user_id || record.student_id;
//                 const displayName = value || record.student_name || record.issued_to || "N/A";
//                 if (userId) {
//                     return (
//                         <a
//                             href={`/user/${userId}`}
//                             onClick={(e) => handleNameClick(userId, displayName, record, e)}
//                             onContextMenu={(e) => {
//                                 e.preventDefault();
//                                 handleNameClick(userId, displayName, record, { ...e, button: 2 });
//                             }}
//                             style={{
//                                 color: "#6f42c1",
//                                 textDecoration: "none",
//                                 fontWeight: "500",
//                                 cursor: "pointer"
//                             }}
//                             onMouseEnter={(e) => {
//                                 e.target.style.textDecoration = "underline";
//                             }}
//                             onMouseLeave={(e) => {
//                                 e.target.style.textDecoration = "none";
//                             }}
//                             title="Click to view user details (Right-click to open in new tab)"
//                         >
//                             <i className="fa-solid fa-user me-1 text-primary"></i>
//                             {displayName}
//                         </a>
//                     );
//                 }
//                 return displayName;
//             }
//         },
//         {
//             field: "card_number",
//             label: "Card No",
//             width: 120
//         },
//         {
//             field: "issue_date",
//             label: "Issue Date",
//             width: 120,
//             render: (value) => formatDate(value)
//         },
//         {
//             field: "due_date",
//             label: "Due Date",
//             width: 120,
//             render: (value) => (
//                 <span style={{
//                     color: new Date(value) < new Date() ? '#dc3545' : '#28a745',
//                     fontWeight: 'bold'
//                 }}>
//                     {formatDate(value)}
//                 </span>
//             )
//         },
//         {
//             field: "actions",
//             label: "Action",
//             width: 100,
//             render: (value, record) => (
//                 <Button
//                     size="sm"
//                     onClick={() => handleSubmitClick(record)}
//                     variant="success"
//                     disabled={loading}
//                 >
//                     {loading ? (
//                         <Spinner animation="border" size="sm" />
//                     ) : (
//                         'Submit'
//                     )}
//                 </Button>
//             )
//         }
//     ];

//     // ✅ Define columns for submitted books table
//     const submittedBooksColumns = [
//         {
//             field: "book_title",
//             label: "Book Title",
//             width: 250,
//             render: (value, record) => (
//                 <a
//                     href={`/books/${record.book_id}`}
//                     onClick={(e) => {
//                         e.preventDefault();
//                         e.stopPropagation();
//                         try {
//                             localStorage.setItem(`prefetch:book:${record.book_id}`, JSON.stringify(record));
//                         } catch (err) { }
//                         navigate(`/books/${record.book_id}`, { state: record });
//                     }}
//                     onContextMenu={(e) => {
//                         e.preventDefault();
//                         e.stopPropagation();
//                         try {
//                             localStorage.setItem(`prefetch:book:${record.book_id}`, JSON.stringify(record));
//                         } catch (err) { }
//                         window.open(`/books/${record.book_id}`, '_blank');
//                     }}
//                     style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 600, cursor: "pointer" }}
//                     onMouseEnter={(e) => {
//                         e.target.style.textDecoration = "underline";
//                     }}
//                     onMouseLeave={(e) => {
//                         e.target.style.textDecoration = "none";
//                     }}
//                     title="Click to view book details (Right-click to open in new tab)"
//                 >
//                     {value || "N/A"}
//                 </a>
//             )
//         },
//         {
//             field: "book_isbn",
//             label: "ISBN",
//             width: 150,
//             render: (value) => (
//                 <code style={{ background: "#f8f9fa", padding: "4px 8px", borderRadius: "4px" }}>
//                     {value || "-"}
//                 </code>
//             )
//         },
//         {
//             field: "student_name",
//             label: "Submitted By",
//             width: 200,
//             render: (value, record) => {
//                 const userId = record.issued_to;
//                 const displayName = value || record.student_name || "N/A";
//                 if (userId) {
//                     return (
//                         <a
//                             href={`/user/${userId}`}
//                             onClick={(e) => {
//                                 e.preventDefault();
//                                 e.stopPropagation();
//                                 try {
//                                     localStorage.setItem(`prefetch:user:${userId}`, JSON.stringify(record));
//                                 } catch (err) { }
//                                 navigate(`/user/${userId}`, { state: record });
//                             }}
//                             onContextMenu={(e) => {
//                                 e.preventDefault();
//                                 e.stopPropagation();
//                                 try {
//                                     localStorage.setItem(`prefetch:user:${userId}`, JSON.stringify(record));
//                                 } catch (err) { }
//                                 window.open(`/user/${userId}`, '_blank');
//                             }}
//                             style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 500, cursor: "pointer" }}
//                             onMouseEnter={(e) => {
//                                 e.target.style.textDecoration = "underline";
//                             }}
//                             onMouseLeave={(e) => {
//                                 e.target.style.textDecoration = "none";
//                             }}
//                             title="Click to view user details (Right-click to open in new tab)"
//                         >
//                             {displayName}
//                         </a>
//                     );
//                 }
//                 return displayName;
//             }
//         },
//         {
//             field: "submit_date",
//             label: "Submit Date",
//             width: 150,
//             render: (value) => formatDate(value)
//         },
//         {
//             field: "condition_after",
//             label: "Condition",
//             width: 120,
//             render: (value) => (
//                 <Badge bg={value === "Good" ? "success" : value === "Fair" ? "warning" : "danger"}>
//                     {value || "Good"}
//                 </Badge>
//             )
//         }
//     ];

//     return (
//         <>
//             <Container fluid className="mt-3" style={{ marginTop: "0.5rem", padding: "0 1.5rem" }}>
//                 {/* Tabs */}
//                 <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || "submit")}>
//                     <Nav variant="tabs" style={{ borderBottom: "2px solid #e5e7eb" }}>
//                         <Nav.Item>
//                             <Nav.Link
//                                 eventKey="submit"
//                                 style={{
//                                     color: activeTab === "submit" ? "#000000" : "#6b7280",
//                                     fontWeight: activeTab === "submit" ? "600" : "400",
//                                     borderBottom: activeTab === "submit" ? "3px solid #6b7280" : "none"
//                                 }}
//                             >
//                                 <i className="fa-solid fa-book-return me-2" style={{ color: activeTab === "submit" ? "#000000" : "#6b7280", fontSize: "15px" }}></i>
//                                 <span style={{ color: activeTab === "submit" ? "#000000" : "#6b7280", fontSize: "15px" }}>Submit Book</span>
//                             </Nav.Link>
//                         </Nav.Item>
//                         <Nav.Item>
//                             <Nav.Link
//                                 eventKey="submitted"
//                                 style={{
//                                     color: activeTab === "submitted" ? "#000000" : "#6b7280",
//                                     fontWeight: activeTab === "submitted" ? "600" : "400",
//                                     borderBottom: activeTab === "submitted" ? "3px solid #6b7280" : "none"
//                                 }}
//                             >
//                                 <span style={{ color: activeTab === "submitted" ? "#000000" : "#6b7280", fontSize: "15px" }}>View Submitted Books ({submittedBooks.length})</span>
//                             </Nav.Link>
//                         </Nav.Item>

//                     </Nav>

//                     <Tab.Content>
//                         {/* Submit Book Tab */}
//                         <Tab.Pane eventKey="submit">
//                             <Row>
//                                 <Col lg={3} md={12}>
//                                     {/* Book Identification Card */}
//                                     <Card className="mb-4 shadow-sm" style={{ background: "#f3e8ff", border: "1px solid #d8b4fe", borderRadius: "8px" }}>
//                                         <Card.Header style={{
//                                             background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
//                                             border: "none",
//                                             borderBottom: "2px solid #d1d5db",
//                                             padding: "20px 24px"
//                                         }}>
//                                             <h5 className="mb-0 fw-bold" style={{
//                                                 color: "#1f2937",
//                                                 fontSize: "20px",
//                                                 letterSpacing: "0.3px"
//                                             }}>
//                                                 <i className="fa-solid fa-book-open me-3" style={{ color: "#6b7280" }}></i>
//                                                 Book Identification
//                                             </h5>
//                                         </Card.Header>
//                                         <Card.Body className="p-4">
//                                             {/* Scan/Enter Section */}
//                                             <div className="mb-4">
//                                                 <div className="d-flex align-items-center gap-3 flex-wrap">
//                                                     {/* Scan Buttons */}
//                                                     <div className="d-flex gap-2">
//                                                         <Button
//                                                             variant="primary"
//                                                             onClick={() => handleScanButtonClick("isbn")}
//                                                             size="lg"
//                                                             disabled={loading}
//                                                             style={{
//                                                                 height: "48px",
//                                                                 backgroundColor: "#0d6efd",
//                                                                 border: "none",
//                                                                 borderRadius: "8px",
//                                                                 minWidth: "120px",
//                                                                 fontWeight: "600",
//                                                                 fontSize: "0.95rem",
//                                                                 boxShadow: "0 2px 4px rgba(13, 110, 253, 0.3)"
//                                                             }}
//                                                         >
//                                                             {loading ? (
//                                                                 <Spinner animation="border" size="sm" className="me-2" />
//                                                             ) : (
//                                                                 <i className="fa-solid fa-camera me-2"></i>
//                                                             )}
//                                                             Scan ISBN
//                                                         </Button>
//                                                         <Button
//                                                             variant="success"
//                                                             onClick={() => handleScanButtonClick("card")}
//                                                             size="lg"
//                                                             disabled={loading}
//                                                             style={{
//                                                                 height: "48px",
//                                                                 backgroundColor: "#198754",
//                                                                 border: "none",
//                                                                 borderRadius: "8px",
//                                                                 minWidth: "150px",
//                                                                 fontWeight: "600",
//                                                                 fontSize: "0.95rem",
//                                                                 boxShadow: "0 2px 4px rgba(25, 135, 84, 0.3)"
//                                                             }}
//                                                         >
//                                                             <i className="fa-solid fa-id-card me-2"></i>
//                                                             Scan Card
//                                                         </Button>
//                                                     </div>

//                                                     {/* Or Separator */}
//                                                     <div className="text-muted fw-bold" style={{ minWidth: "40px", textAlign: "center", fontSize: "0.9rem" }}>
//                                                         OR
//                                                     </div>

//                                                     {/* Manual Input Group */}
//                                                     <InputGroup style={{ flex: "1", minWidth: "300px" }}>
//                                                         <Form.Control
//                                                             ref={searchMode === "isbn" ? isbnInputRef : cardInputRef}
//                                                             type="text"
//                                                             placeholder={searchMode === "isbn" ? "Type ISBN number here" : "Type Library Card number here"}
//                                                             value={searchMode === "isbn" ? isbn : cardNumber}
//                                                             onChange={searchMode === "isbn" ? handleIsbnChange : handleCardNumberChange}
//                                                             onKeyDown={searchMode === "isbn" ? handleIsbnKeyDown : handleCardKeyDown}
//                                                             autoFocus
//                                                             disabled={loading}
//                                                             size="lg"
//                                                             style={{
//                                                                 border: "1px solid #dee2e6",
//                                                                 borderRadius: "8px 0 0 8px",
//                                                                 fontSize: "0.95rem",
//                                                                 padding: "0.75rem 1rem"
//                                                             }}
//                                                         />
//                                                         {loading && (
//                                                             <InputGroup.Text style={{
//                                                                 border: "1px solid #dee2e6",
//                                                                 borderLeft: "none",
//                                                                 borderRadius: "0",
//                                                                 backgroundColor: "#f8f9fa"
//                                                             }}>
//                                                                 <Spinner animation="border" size="sm" />
//                                                             </InputGroup.Text>
//                                                         )}
//                                                         <Button
//                                                             variant="outline-secondary"
//                                                             onClick={handleClearSearch}
//                                                             disabled={loading}
//                                                             size="lg"
//                                                             style={{
//                                                                 border: "1px solid #dee2e6",
//                                                                 borderLeft: loading ? "none" : "1px solid #dee2e6",
//                                                                 borderRadius: loading ? "0 8px 8px 0" : "0 8px 8px 0",
//                                                                 minWidth: "50px",
//                                                                 backgroundColor: "#f8f9fa"
//                                                             }}
//                                                         >
//                                                             <i className="fa-solid fa-xmark"></i>
//                                                         </Button>
//                                                     </InputGroup>
//                                                 </div>
//                                             </div>
//                                         </Card.Body>
//                                     </Card>

//                                     {/* Library Card Details */}
//                                     {libraryCard && (
//                                         <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
//                                             <Card.Header className="py-3 px-4" style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #6f42c1" }}>
//                                                 <div className="d-flex justify-content-between align-items-center">
//                                                     <h6 className="mb-0 fw-bold" style={{ color: "#6f42c1", fontSize: "1rem" }}>
//                                                         <i className="fa-solid fa-id-card me-2"></i>
//                                                         Library Card: {libraryCard.card_number}
//                                                     </h6>
//                                                     <Badge bg="info">
//                                                         {cardIssues.length} Active Issue{cardIssues.length !== 1 ? 's' : ''}
//                                                     </Badge>
//                                                 </div>
//                                             </Card.Header>
//                                             <Card.Body className="py-3 px-4">
//                                                 <Row>
//                                                     <Col md={6}>
//                                                         <div className="mb-2">
//                                                             <strong className="small">Card Holder:</strong>
//                                                             <div className="text-secondary">
//                                                                 {libraryCard.user_name || libraryCard.student_name || "N/A"}
//                                                             </div>
//                                                         </div>
//                                                     </Col>
//                                                     <Col md={6}>
//                                                         <div className="mb-2">
//                                                             <strong className="small">Card Number:</strong>
//                                                             <div className="text-secondary">{libraryCard.card_number}</div>
//                                                         </div>
//                                                     </Col>
//                                                 </Row>
//                                             </Card.Body>
//                                         </Card>
//                                     )}

//                                     {/* Book Details */}
//                                     {book && (
//                                         <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
//                                             <Card.Header style={{
//                                                 background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
//                                                 border: "none",
//                                                 borderBottom: "2px solid #d1d5db",
//                                                 padding: "20px 24px"
//                                             }}>
//                                                 <h5 className="mb-0 fw-bold" style={{
//                                                     color: "#1f2937",
//                                                     fontSize: "20px",
//                                                     letterSpacing: "0.3px"
//                                                 }}>
//                                                     Book Details for ISBN: {isbn}
//                                                 </h5>
//                                             </Card.Header>
//                                             <Card.Body className="py-3 px-4">
//                                                 <Row>
//                                                     <Col md={6}>
//                                                         <div className="mb-2">
//                                                             <strong className="small">Title:</strong>
//                                                             <div className="text-secondary">
//                                                                 <a
//                                                                     href={`/books/${book.id}`}
//                                                                     onClick={(e) => {
//                                                                         e.preventDefault();
//                                                                         navigate(`/books/${book.id}`);
//                                                                     }}
//                                                                     style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 600 }}
//                                                                     onMouseEnter={(e) => {
//                                                                         try {
//                                                                             localStorage.setItem(`prefetch:book:${book.id}`, JSON.stringify(book));
//                                                                         } catch (err) { }
//                                                                         e.target.style.textDecoration = "underline";
//                                                                     }}
//                                                                     onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
//                                                                 >
//                                                                     {book.title}
//                                                                 </a>
//                                                             </div>
//                                                         </div>
//                                                     </Col>
//                                                     <Col md={6}>
//                                                         <div className="mb-2">
//                                                             <strong className="small">ISBN:</strong>
//                                                             <div className="text-secondary">{book.isbn}</div>
//                                                         </div>
//                                                     </Col>
//                                                 </Row>
//                                                 <Row>
//                                                     <Col md={6}>
//                                                         <div className="mb-2">
//                                                             <strong className="small">Author:</strong>
//                                                             <div className="text-secondary">{book.author || "N/A"}</div>
//                                                         </div>
//                                                     </Col>
//                                                     <Col md={6}>
//                                                         <div className="mb-2">
//                                                             <strong className="small">Total Copies:</strong>
//                                                             <div className="text-secondary">{book.total_copies || 0}</div>
//                                                         </div>
//                                                     </Col>
//                                                 </Row>
//                                             </Card.Body>
//                                         </Card>
//                                     )}


//                                 </Col>

//                                 <Col lg={9} md={12}>
//                                     {/* ✅ All Issued Books Card */}
//                                     <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
//                                         <Card.Header style={{
//                                             background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
//                                             border: "none",
//                                             borderBottom: "2px solid #d1d5db",
//                                             // padding: "20px 24px"
//                                         }}>
//                                             <Row className="align-items-center">
//                                                 <Col>
//                                                     <h5 className="mb-0 fw-bold" style={{
//                                                         color: "#1f2937",
//                                                         fontSize: "20px",
//                                                         letterSpacing: "0.3px"
//                                                     }}>
//                                                         <i className="fa-solid fa-book-open me-3" style={{ color: "#6b7280" }}></i>
//                                                         {bookIssues.length > 0 ? "Issued Books for this ISBN" : "All Issued Books"}
//                                                         <span style={{ color: "orange", fontSize: "16px", marginLeft: "8px" }}>
//                                                             ({filteredIssuedBooks.length} Issue{filteredIssuedBooks.length !== 1 ? 's' : ''})
//                                                         </span>
//                                                     </h5>
//                                                 </Col>
//                                                 <Col xs="auto">
//                                                     {/* <InputGroup style={{ maxWidth: "300px" }}>
//                                                         <InputGroup.Text style={{ backgroundColor: "#fff", border: "2px solid #8b5cf6", borderRight: "none" }}>
//                                                             <i className="fa-solid fa-search" style={{ color: "#8b5cf6" }}></i>
//                                                         </InputGroup.Text>
//                                                         <Form.Control
//                                                             type="text"
//                                                             placeholder="Search by title, ISBN, name..."
//                                                             value={searchTerm}
//                                                             onChange={(e) => setSearchTerm(e.target.value)}
//                                                             style={{ border: "2px solid #8b5cf6", borderRadius: "8px" }}
//                                                         />
//                                                         {searchTerm && (
//                                                             <Button variant="outline-secondary" onClick={() => setSearchTerm("")} style={{ border: "2px solid #8b5cf6" }}>
//                                                                 <i className="fa-solid fa-times"></i>
//                                                             </Button>
//                                                         )}
//                                                     </InputGroup> */}
//                                                     <InputGroup style={{ width: "250px", maxWidth: "100%" }}>
//                                                         <InputGroup.Text style={{ background: "#f3e9fc", borderColor: "#e9ecef", padding: "0.375rem 0.75rem" }}>
//                                                             <i className="fa-solid fa-search" style={{ color: "#6f42c1", fontSize: "0.875rem" }}></i>
//                                                         </InputGroup.Text>
//                                                         <Form.Control
//                                                             placeholder="Search by title, ISBN, name..."
//                                                             value={searchTerm || ""}
//                                                             onChange={(e) => setSearchTerm(e.target.value)}
//                                                             style={{ borderColor: "#e9ecef", fontSize: "0.875rem", padding: "0.375rem 0.75rem" }}
//                                                         />
//                                                     </InputGroup>
//                                                     {searchTerm && (
//                                                         <Button variant="outline-secondary" onClick={() => setSearchTerm("")} style={{ border: "2px solid #8b5cf6" }}>
//                                                             <i className="fa-solid fa-times"></i>
//                                                         </Button>
//                                                     )}
//                                                 </Col>
//                                             </Row>
//                                         </Card.Header>
//                                         {/* <Card.Body > */}
//                                         <ResizableTable
//                                             data={filteredIssuedBooks}
//                                             columns={issueColumns}
//                                             loading={loading}
//                                             showCheckbox={false}
//                                             showSerialNumber={true}
//                                             showActions={false}
//                                             searchTerm={searchTerm}
//                                             currentPage={currentPage}
//                                             recordsPerPage={recordsPerPage}
//                                             onPageChange={(page) => {
//                                                 setCurrentPage(page);
//                                             }}
//                                             emptyMessage={

//                                                 book && bookIssues && bookIssues.length === 0
//                                                     ? <div className="text-center py-4">
//                                                         <i className="fa-solid fa-check-circle fa-2x text-success mb-3"></i>
//                                                         <h6 className="text-success">No Active Issues Found</h6>
//                                                         <p className="text-muted mb-0">
//                                                             This book is not currently issued to anyone or all issues have been returned.
//                                                         </p>
//                                                     </div>
//                                                     : searchTerm
//                                                         ? "No issued books found matching your search"
//                                                         : "No books have been issued yet"
//                                             }

//                                         />
//                                         {/* </Card.Body> */}
//                                     </Card>
//                                 </Col>

//                             </Row>
//                         </Tab.Pane>

//                         {/* View Submitted Books Tab */}
//                         <Tab.Pane eventKey="submitted">
//                             <Row>
//                                 <Col lg={12}>
//                                     <Card className="shadow-sm">

//                                         <Card.Body className="p-0" style={{ overflow: "hidden", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
//                                             <ResizableTable
//                                                 data={filteredSubmittedBooks}
//                                                 columns={submittedBooksColumns}
//                                                 loading={loadingSubmitted}
//                                                 showCheckbox={false}
//                                                 showSerialNumber={true}
//                                                 showActions={false}
//                                                 searchTerm={searchTerm}
//                                                 currentPage={currentPage}
//                                                 recordsPerPage={recordsPerPage}
//                                                 onPageChange={(page) => setCurrentPage(page)}
//                                                 emptyMessage={searchTerm ? "No submitted books found matching your search" : "No books have been submitted yet"}
//                                             />
//                                         </Card.Body>
//                                     </Card>
//                                 </Col>
//                             </Row>
//                         </Tab.Pane>
//                     </Tab.Content>
//                 </Tab.Container>
//             </Container>

//             {/* ✅ Scan Modal */}
//             <Modal show={showScanModal} onHide={() => setShowScanModal(false)} centered>
//                 <Modal.Header closeButton>
//                     <Modal.Title>
//                         <i className={`fa-solid ${scanMethod === "isbn" ? "fa-barcode" : "fa-address-card"} me-2`}></i>
//                         {scanMethod === "isbn" ? "Scan Book Barcode" : "Scan Library Card"}
//                     </Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body>
//                     <div className="text-center">
//                         <i className={`fa-solid ${scanMethod === "isbn" ? "fa-barcode" : "fa-address-card"} fa-4x mb-3`}
//                             style={{ color: scanMethod === "isbn" ? "#0d6efd" : "#28a745" }}></i>
//                         <h5>Ready to Scan</h5>


//                         <Form.Group className="mt-4">
//                             <Form.Label>
//                                 <strong>
//                                     {scanMethod === "isbn" ? "Scanned ISBN:" : "Scanned Library Card:"}
//                                 </strong>
//                             </Form.Label>
//                             <Form.Control
//                                 type="text"
//                                 placeholder={scanMethod === "isbn" ? "Scanning will auto-populate here..." : "LIB123456..."}
//                                 value={isbn}
//                                 onChange={handleScanInputChange}
//                                 onKeyDown={handleScanInputKeyDown}
//                                 autoFocus
//                                 className="text-center fw-bold"
//                                 style={{ fontSize: "18px" }}
//                             />
//                             <Form.Text className="text-muted">
//                                 {scanMethod === "isbn"
//                                     ? "Scan or enter 10 or 13 digit ISBN number"
//                                     : "Scan or enter library card number"}
//                             </Form.Text>
//                         </Form.Group>


//                     </div>
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={() => setShowScanModal(false)}>
//                         Cancel
//                     </Button>
//                     <Button
//                         variant="primary"
//                         onClick={handleScanSubmit}
//                         disabled={!isbn.trim() || loading}
//                     >
//                         {loading ? (
//                             <Spinner animation="border" size="sm" className="me-2" />
//                         ) : (
//                             <i className="fa-solid fa-search me-2"></i>
//                         )}
//                         {scanMethod === "isbn" ? "Search Book" : "Search Card"}
//                     </Button>
//                 </Modal.Footer>
//             </Modal>

//             {/* Submit Confirmation Modal */}
//             <Modal show={showSubmitModal} onHide={handleModalClose} centered size="lg">
//                 <Modal.Header closeButton>
//                     <Modal.Title>
//                         <i className="fa-solid fa-paper-plane me-2 text-success"></i>
//                         Submit Book Return
//                     </Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body>
//                     {selectedIssue && (
//                         <div>
//                             <h6 className="mb-3">Book Return Details</h6>

//                             {/* Issue Details */}
//                             <Card className="mb-3 ">
//                                 <Card.Header className="  py-2">
//                                     <h6 className="mb-0 small">Issue Information</h6>
//                                 </Card.Header>
//                                 <Card.Body className="py-2">
//                                     <Row>
//                                         <Col md={6}>
//                                             <strong className="small">Book Title:</strong>
//                                             <div className="text-secondary small">{selectedIssue.book_title || book?.title}</div>
//                                         </Col>
//                                         <Col md={6}>
//                                             <strong className="small">ISBN:</strong>
//                                             <div className="text-secondary small">{selectedIssue.book_isbn || book?.isbn}</div>
//                                         </Col>
//                                     </Row>
//                                     <Row className="mt-2">
//                                         <Col md={6}>
//                                             <strong className="small">Issued To:</strong>
//                                             <div className="text-secondary small">
//                                                 <Button
//                                                     variant="link"
//                                                     className="p-0 text-decoration-none"
//                                                     onClick={(e) => handleNameClick(
//                                                         selectedIssue.user_id || selectedIssue.student_id,
//                                                         selectedIssue.issued_to_name || selectedIssue.student_name || selectedIssue.issued_to,
//                                                         selectedIssue,
//                                                         e
//                                                     )}
//                                                     title="View User Details"
//                                                 >
//                                                     <i className="fa-solid fa-user me-1 text-primary"></i>
//                                                     {selectedIssue.issued_to_name || selectedIssue.student_name || selectedIssue.issued_to}
//                                                 </Button>
//                                             </div>
//                                         </Col>
//                                         <Col md={6}>
//                                             <strong className="small">Card Number:</strong>
//                                             <div className="text-secondary small">{selectedIssue.card_number || selectedIssue.card_id || '-'}</div>
//                                         </Col>
//                                     </Row>
//                                     <Row className="mt-2">
//                                         <Col md={6}>
//                                             <strong className="small">Issue Date:</strong>
//                                             <div className="text-secondary small">{formatDate(selectedIssue.issue_date)}</div>
//                                         </Col>
//                                         <Col md={6}>
//                                             <strong className="small">Due Date:</strong>
//                                             <div className="text-secondary small">{formatDate(selectedIssue.due_date)}</div>
//                                         </Col>
//                                     </Row>
//                                 </Card.Body>
//                             </Card>

//                             {/* Condition Assessment Form */}
//                             <Card className="mb-3 ">
//                                 <Card.Header className=" py-2">
//                                     <h6 className="mb-0 small">Condition Assessment</h6>
//                                 </Card.Header>
//                                 <Card.Body className="py-2">
//                                     <Row>
//                                         <Col md={6}>
//                                             <Form.Group className="mb-2">
//                                                 <Form.Label className="small fw-bold">Condition Before</Form.Label>
//                                                 <Form.Control
//                                                     type="text"
//                                                     value={selectedIssue.condition_before || conditionBefore}
//                                                     onChange={(e) => setConditionBefore(e.target.value)}
//                                                     disabled={loading}
//                                                     size="sm"
//                                                     className="small"
//                                                 />
//                                             </Form.Group>
//                                         </Col>
//                                         <Col md={6}>
//                                             <Form.Group className="mb-2">
//                                                 <Form.Label className="small fw-bold">Condition After</Form.Label>
//                                                 <Form.Select
//                                                     value={conditionAfter}
//                                                     onChange={(e) => setConditionAfter(e.target.value)}
//                                                     disabled={loading}
//                                                     size="sm"
//                                                     className="small"
//                                                 >
//                                                     <option value="Good">✅ Good</option>
//                                                     <option value="Fair">⚠️ Fair</option>
//                                                     <option value="Damaged">❌ Damaged</option>
//                                                 </Form.Select>
//                                             </Form.Group>
//                                         </Col>
//                                     </Row>
//                                     <Form.Group className="mb-2">
//                                         <Form.Label className="small fw-bold">Remarks</Form.Label>
//                                         <Form.Control
//                                             as="textarea"
//                                             rows={3}
//                                             placeholder="Add notes about book condition..."
//                                             value={remarks}
//                                             onChange={(e) => setRemarks(e.target.value)}
//                                             disabled={loading}
//                                             size="sm"
//                                             className="small"
//                                         />
//                                     </Form.Group>
//                                 </Card.Body>
//                             </Card>

//                             {/* Penalty Information */}
//                             <Card>
//                                 <Card.Header className="py-2">
//                                     <h6 className="mb-0 small">Penalty Information</h6>
//                                 </Card.Header>
//                                 <Card.Body className="py-2">
//                                     <div className="text-center">
//                                         <h5 style={{
//                                             color: penalty.penalty > 0 ? "#dc3545" : "#28a745",
//                                             fontWeight: "bold"
//                                         }}>
//                                             ₹{penalty.penalty || 0}
//                                         </h5>
//                                         <p className="small text-muted mb-0">
//                                             {penalty.daysOverdue ? `Overdue by ${penalty.daysOverdue} day(s)` : "No overdue penalty"}
//                                         </p>
//                                     </div>
//                                 </Card.Body>
//                             </Card>
//                         </div>
//                     )}
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={handleModalClose} disabled={loading}>
//                         <i className="fa-solid fa-times me-2"></i>
//                         Cancel
//                     </Button>
//                     <Button variant="success" onClick={handleFinalSubmit} disabled={loading}>
//                         {loading ? (
//                             <>
//                                 <Spinner animation="border" size="sm" className="me-2" />
//                                 Submitting...
//                             </>
//                         ) : (
//                             <>
//                                 <i className="fa-solid fa-check me-2"></i>
//                                 Confirm Submit
//                             </>
//                         )}
//                     </Button>
//                 </Modal.Footer>
//             </Modal>
//         </>
//     );
// }

// export default BookSubmit;


import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Spinner, Badge, InputGroup, Table, Modal, Tab, Nav } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import helper from "../common/helper";
import PubSub from "pubsub-js";
import * as constants from "../../constants/CONSTANT";
import DataApi from "../../api/dataApi";
import ResizableTable from "../common/ResizableTable";

const BookSubmit = () => {
    const navigate = useNavigate();
    const [isbn, setIsbn] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [searchMode, setSearchMode] = useState("isbn");
    const [loading, setLoading] = useState(false);
    const [book, setBook] = useState(null);
    const [libraryCard, setLibraryCard] = useState(null);
    const [cardIssues, setCardIssues] = useState([]);
    const [issue, setIssue] = useState(null);
    const [bookIssues, setBookIssues] = useState([]);
    const [allIssuedBooks, setAllIssuedBooks] = useState([]);
    const [displayedIssuedBooks, setDisplayedIssuedBooks] = useState([]);
    const [penalty, setPenalty] = useState({ penalty: 0, daysOverdue: 0 });
    const [conditionBefore, setConditionBefore] = useState("Good");
    const [conditionAfter, setConditionAfter] = useState("Good");
    const [remarks, setRemarks] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [activeTab, setActiveTab] = useState("submit");
    const [submittedBooks, setSubmittedBooks] = useState([]);
    const [loadingSubmitted, setLoadingSubmitted] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [showScanModal, setShowScanModal] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [scanMethod, setScanMethod] = useState("isbn");
    const recordsPerPage = 20;
    const isbnInputRef = React.useRef(null);
    const cardInputRef = React.useRef(null);

    // ✅ Fetch all issued books on component mount
    useEffect(() => {
        fetchAllIssuedBooks();
    }, []);

    // ✅ Function to fetch all issued books
    const fetchAllIssuedBooks = async () => {
        try {
            setLoading(true);
            const issuesResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/active`, "GET");

            if (!issuesResp.ok) {
                const err = await issuesResp.json().catch(() => ({}));
                console.error("Error fetching all issued books:", err);
                setAllIssuedBooks([]);
                setDisplayedIssuedBooks([]);
                return;
            }

            const issues = await issuesResp.json();
            setAllIssuedBooks(issues || []);
            setDisplayedIssuedBooks(issues || []);
        } catch (error) {
            console.error("Error fetching all issued books:", error);
            setAllIssuedBooks([]);
            setDisplayedIssuedBooks([]);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Update displayed books when bookIssues or allIssuedBooks change
    useEffect(() => {
        if (bookIssues && bookIssues.length > 0) {
            setDisplayedIssuedBooks(bookIssues);
        }
        else if (allIssuedBooks && allIssuedBooks.length > 0) {
            setDisplayedIssuedBooks(allIssuedBooks);
        }
        else {
            setDisplayedIssuedBooks([]);
        }
    }, [bookIssues, allIssuedBooks]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        try {
            const d = new Date(dateStr);
            if (isNaN(d)) return dateStr;
            const dd = String(d.getDate()).padStart(2, "0");
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const yyyy = d.getFullYear();
            return `${dd}-${mm}-${yyyy}`;
        } catch (e) {
            return dateStr;
        }
    };

    // Navigate to user detail page
    const handleNameClick = (userId, userName, issueData, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (userId) {
            try {
                const prefetchData = issueData || { id: userId, name: userName };
                localStorage.setItem(`prefetch:user:${userId}`, JSON.stringify(prefetchData));
            } catch (err) {
                console.warn("Failed to store prefetch data:", err);
            }

            if (e && (e.button === 2 || e.ctrlKey || e.metaKey)) {
                window.open(`/user/${userId}`, '_blank');
            } else {
                navigate(`/user/${userId}`, {
                    state: { userName: userName, ...issueData },
                });
            }
        }
    };

    // Fetch submitted books
    useEffect(() => {
        if (activeTab === "submitted") {
            fetchSubmittedBooks();
        }
    }, [activeTab]);

    const fetchSubmittedBooks = async () => {
        try {
            setLoadingSubmitted(true);
            const submissionApi = new DataApi("book_submissions");
            const response = await submissionApi.fetchAll();
            let submissions = [];
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                submissions = response.data.data;
            } else if (Array.isArray(response.data)) {
                submissions = response.data;
            }
            setSubmittedBooks(submissions);
        } catch (error) {
            console.error("Error fetching submitted books:", error);
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Error",
                message: "Failed to fetch submitted books"
            });
            setSubmittedBooks([]);
        } finally {
            setLoadingSubmitted(false);
        }
    };

    // Perform search with ISBN or Library Card
    const performSearch = async (value, mode = null) => {
        const searchType = mode || searchMode;
        console.log("Performing search with:", value, "mode:", searchType);

        if (!value || value.trim() === "") {
            setDisplayedIssuedBooks(allIssuedBooks);
            setBookIssues([]);
            setBook(null);
            setLibraryCard(null);
            setCardIssues([]);

            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Validation",
                message: `Please enter or scan ${searchType === "card" ? "Library Card Number" : "ISBN"}`
            });
            return;
        }

        try {
            setLoading(true);

            if (searchType === "card") {
                // Search by library card number
                const cardResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/librarycard/card/${encodeURIComponent(value.trim().toUpperCase())}`, "GET");
                if (!cardResp.ok) {
                    const err = await cardResp.json().catch(() => ({}));
                    PubSub.publish("RECORD_ERROR_TOAST", { title: "Not Found", message: err.errors || "Library card not found" });
                    setLibraryCard(null);
                    setCardIssues([]);
                    setBook(null);
                    setBookIssues([]);
                    setDisplayedIssuedBooks(allIssuedBooks);
                    return;
                }

                const cardData = await cardResp.json();
                setLibraryCard(cardData);

                // Find active issues for this card
                const issuesResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/card/${cardData.id}`, "GET");
                if (!issuesResp.ok) {
                    const err = await issuesResp.json().catch(() => ({}));
                    PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: err.errors || "Failed to fetch issue records" });
                    setCardIssues([]);
                    setDisplayedIssuedBooks(allIssuedBooks);
                    return;
                }

                const issues = await issuesResp.json();
                if (!issues || !Array.isArray(issues) || issues.length === 0) {
                    PubSub.publish("RECORD_ERROR_TOAST", { title: "No Active Issue", message: "No active issued record found for this library card" });
                    setCardIssues([]);
                    setDisplayedIssuedBooks(allIssuedBooks);
                    return;
                }

                setCardIssues(issues);
                setDisplayedIssuedBooks(issues);
                setBook(null);
                setBookIssues([]);

            } else {
                // Search book by ISBN
                const bookResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/book/isbn/${encodeURIComponent(value.trim())}`, "GET");
                if (!bookResp.ok) {
                    const err = await bookResp.json().catch(() => ({}));
                    PubSub.publish("RECORD_ERROR_TOAST", { title: "Not Found", message: err.errors || "Book not found" });
                    setBook(null);
                    setIssue(null);
                    setBookIssues([]);
                    setDisplayedIssuedBooks(allIssuedBooks);
                    return;
                }

                const bookData = await bookResp.json();
                setBook(bookData);

                // Find active issues for this book
                const issuesResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/book/${bookData.id}`, "GET");
                if (!issuesResp.ok) {
                    const err = await issuesResp.json().catch(() => ({}));
                    PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: err.errors || "Failed to fetch issue records" });
                    setIssue(null);
                    setBookIssues([]);
                    setDisplayedIssuedBooks(allIssuedBooks);
                    return;
                }

                const issues = await issuesResp.json();
                if (!issues || !Array.isArray(issues) || issues.length === 0) {
                    PubSub.publish("RECORD_ERROR_TOAST", { title: "No Active Issue", message: "No active issued record found for this ISBN" });
                    setIssue(null);
                    setBookIssues([]);
                    setDisplayedIssuedBooks(allIssuedBooks);
                    return;
                }

                setBookIssues(issues);
                setDisplayedIssuedBooks(issues);
                const activeIssue = issues[0];
                setIssue(activeIssue);

                // Fetch penalty info
                const penaltyResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/penalty/${activeIssue.id}`, "GET");
                if (penaltyResp.ok) {
                    const penaltyData = await penaltyResp.json();
                    if (penaltyData && penaltyData.success) {
                        setPenalty(penaltyData.data || { penalty: 0, daysOverdue: 0 });
                    } else if (penaltyData && penaltyData.data) {
                        setPenalty(penaltyData.data);
                    } else {
                        setPenalty({ penalty: 0, daysOverdue: 0 });
                    }
                } else {
                    setPenalty({ penalty: 0, daysOverdue: 0 });
                }

                // Clear library card data when searching by ISBN
                setLibraryCard(null);
                setCardIssues([]);
            }

        } catch (error) {
            console.error("Error searching:", error);
            PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: error.message || "Error searching" });
            setBook(null);
            setIssue(null);
            setBookIssues([]);
            setLibraryCard(null);
            setCardIssues([]);
            setDisplayedIssuedBooks(allIssuedBooks);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        const value = searchMode === "card" ? cardNumber : isbn;
        await performSearch(value, searchMode);
    };

    const handleIsbnChange = async (e) => {
        const value = e.target.value;
        setIsbn(value);

        // Auto-search when user types (with debounce)
        if (value.trim().length >= 3) {
            if (isbnInputRef.current?.timer) {
                clearTimeout(isbnInputRef.current.timer);
            }

            isbnInputRef.current.timer = setTimeout(async () => {
                if (value.trim().length >= 3) {
                    await performSearch(value.trim(), "isbn");
                }
            }, 800);
        } else if (value.trim().length === 0) {
            setBook(null);
            setIssue(null);
            setBookIssues([]);
            setPenalty({ penalty: 0, daysOverdue: 0 });
            setDisplayedIssuedBooks(allIssuedBooks);
        }
    };

    const handleCardNumberChange = async (e) => {
        const value = e.target.value;
        setCardNumber(value);

        // Auto-search when user types (with debounce)
        if (value.trim().length >= 3) {
            if (cardInputRef.current?.timer) {
                clearTimeout(cardInputRef.current.timer);
            }

            cardInputRef.current.timer = setTimeout(async () => {
                if (value.trim().length >= 3) {
                    await performSearch(value.trim(), "card");
                }
            }, 800);
        } else if (value.trim().length === 0) {
            setLibraryCard(null);
            setCardIssues([]);
            setDisplayedIssuedBooks(allIssuedBooks);
        }
    };

    const handleIsbnKeyDown = async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (isbnInputRef.current?.timer) {
                clearTimeout(isbnInputRef.current.timer);
            }
            setIsScanning(true);
            await performSearch(isbn, "isbn");
            setIsScanning(false);
        }
    };

    const handleCardKeyDown = async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (cardInputRef.current?.timer) {
                clearTimeout(cardInputRef.current.timer);
            }
            setIsScanning(true);
            await performSearch(cardNumber, "card");
            setIsScanning(false);
        }
    };

    // ✅ Clear search and show all books
    const handleClearSearch = () => {
        if (searchMode === "isbn") {
            if (isbnInputRef.current?.timer) {
                clearTimeout(isbnInputRef.current.timer);
            }
            setIsbn("");
            setBook(null);
            setIssue(null);
            setBookIssues([]);
            setPenalty({ penalty: 0, daysOverdue: 0 });
            setDisplayedIssuedBooks(allIssuedBooks);
            isbnInputRef.current?.focus();
        } else {
            if (cardInputRef.current?.timer) {
                clearTimeout(cardInputRef.current.timer);
            }
            setCardNumber("");
            setLibraryCard(null);
            setCardIssues([]);
            setDisplayedIssuedBooks(allIssuedBooks);
            cardInputRef.current?.focus();
        }
    };

    // ✅ Handle search mode change
    const handleSearchModeChange = (e) => {
        const newMode = e.target.value;
        setSearchMode(newMode);

        // Clear all previous data
        setIsbn("");
        setCardNumber("");
        setBook(null);
        setLibraryCard(null);
        setBookIssues([]);
        setCardIssues([]);
        setDisplayedIssuedBooks(allIssuedBooks);

        // Focus on the appropriate input
        setTimeout(() => {
            if (newMode === "isbn") {
                isbnInputRef.current?.focus();
            } else {
                cardInputRef.current?.focus();
            }
        }, 100);
    };

    // ✅ Handle scan button click
    const handleScanButtonClick = () => {
        setScanMethod(searchMode); // Use current search mode
        setShowScanModal(true);
    };

    // ✅ Handle scan submit
    const handleScanSubmit = async () => {
        const value = searchMode === "isbn" ? isbn : cardNumber;
        if (value.trim()) {
            setShowScanModal(false);
            await performSearch(value, searchMode);
        }
    };

    // ✅ Handle scan input change in modal
    const handleScanInputChange = (e) => {
        const value = e.target.value;
        if (searchMode === "isbn") {
            setIsbn(value);
        } else {
            setCardNumber(value);
        }

        // Auto-submit when barcode is scanned (usually barcode scanners send Enter key)
        if (value.length >= 8) { // Typical barcode length
            // Small delay to capture the complete barcode
            setTimeout(() => {
                handleScanSubmit();
            }, 100);
        }
    };

    // ✅ Handle scan input key down
    const handleScanInputKeyDown = async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            await handleScanSubmit();
        }
    };

    const handleSubmitClick = (issueItem) => {
        setSelectedIssue(issueItem);
        setShowSubmitModal(true);
    };

    const handleModalClose = () => {
        setShowSubmitModal(false);
        setSelectedIssue(null);
        setConditionAfter("Good");
        setRemarks("");
    };

    const handleFinalSubmit = async () => {
        if (!selectedIssue) return;

        try {
            setLoading(true);
            const body = JSON.stringify({
                issue_id: selectedIssue.id,
                condition_before: selectedIssue.condition_before || conditionBefore || 'Good',
                condition_after: conditionAfter || 'Good',
                remarks: remarks || '',
                submit_date: new Date().toISOString().split('T')[0]
            });

            const resp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/book_submissions`, "POST", body);
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                PubSub.publish("RECORD_SAVED_TOAST", { title: "Error", message: err.errors || "Failed to submit book", type: "error" });
                return;
            }

            const result = await resp.json();
            if (result && result.success) {
                PubSub.publish("RECORD_SAVED_TOAST", {
                    title: "Success",
                    message: `Book submitted successfully for ${selectedIssue.issued_to_name || selectedIssue.student_name || selectedIssue.issued_to}`
                });

                // Remove the issue from lists
                setBookIssues(prev => prev.filter(item => item.id !== selectedIssue.id));
                setCardIssues(prev => prev.filter(item => item.id !== selectedIssue.id));
                setAllIssuedBooks(prev => prev.filter(item => item.id !== selectedIssue.id));
                setDisplayedIssuedBooks(prev => prev.filter(item => item.id !== selectedIssue.id));

                // Close modal and reset form
                handleModalClose();

                // Clear main data if this was the last issue
                if (bookIssues.length === 1 && cardIssues.length === 0) {
                    setIsbn("");
                    setBook(null);
                    setIssue(null);
                    setLibraryCard(null);
                }
            } else {
                PubSub.publish("RECORD_SAVED_TOAST", {
                    title: "Error",
                    message: (result && result.errors) || "Failed to submit book",
                    type: "error"
                });
            }
        } catch (error) {
            console.error("Error submitting book:", error);
            PubSub.publish("RECORD_SAVED_TOAST", {
                title: "Error",
                message: error.message || "Error submitting book",
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    // ✅ Filter displayed issued books based on search term
    const filteredIssuedBooks = displayedIssuedBooks.filter(issue => {
        if (!searchTerm) return true;
        const query = searchTerm.toLowerCase();
        const bookTitle = (issue.book_title || "").toLowerCase();
        const isbn = (issue.book_isbn || "").toLowerCase();
        const studentName = (issue.issued_to_name || issue.student_name || "").toLowerCase();
        const cardNumber = (issue.card_number || "").toLowerCase();

        return (
            bookTitle.includes(query) ||
            isbn.includes(query) ||
            studentName.includes(query) ||
            cardNumber.includes(query)
        );
    });

    const filteredSubmittedBooks = submittedBooks.filter(submission => {
        if (!searchTerm) return true;
        const query = searchTerm.toLowerCase();
        const bookTitle = (submission.book_title || "").toLowerCase();
        const isbn = (submission.book_isbn || "").toLowerCase();
        const studentName = (submission.student_name || "").toLowerCase();
        return (
            bookTitle.includes(query) ||
            isbn.includes(query) ||
            studentName.includes(query)
        );
    });

    // ✅ Define columns for issued books table
    const issueColumns = [
        {
            field: "book_title",
            label: "Book Title",
            width: 250,
            render: (value, record) => (
                <a
                    href={`/book/${record.book_id}`}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                            localStorage.setItem(`prefetch:book:${record.book_id}`, JSON.stringify(record));
                        } catch (err) { }
                        navigate(`/book/${record.book_id}`, { state: record });
                    }}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                            localStorage.setItem(`prefetch:book:${record.book_id}`, JSON.stringify(record));
                        } catch (err) { }
                        window.open(`/book/${record.book_id}`, '_blank');
                    }}
                    style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 600, cursor: "pointer" }}
                    onMouseEnter={(e) => {
                        e.target.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.textDecoration = "none";
                    }}
                    title="Click to view book details (Right-click to open in new tab)"
                >
                    {value || "N/A"}
                </a>
            )
        },
        {
            field: "book_isbn",
            label: "ISBN",
            width: 150,
            render: (value) => (
                <code style={{ background: "#f8f9fa", padding: "4px 8px", borderRadius: "4px" }}>
                    {value || "-"}
                </code>
            )
        },
        {
            field: "issued_to_name",
            label: "Issued To",
            width: 200,
            render: (value, record) => {
                const userId = record.user_id || record.student_id;
                const displayName = value || record.student_name || record.issued_to || "N/A";
                if (userId) {
                    return (
                        <a
                            href={`/user/${userId}`}
                            onClick={(e) => handleNameClick(userId, displayName, record, e)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                handleNameClick(userId, displayName, record, { ...e, button: 2 });
                            }}
                            style={{
                                color: "#6f42c1",
                                textDecoration: "none",
                                fontWeight: "500",
                                cursor: "pointer"
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.textDecoration = "underline";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.textDecoration = "none";
                            }}
                            title="Click to view user details (Right-click to open in new tab)"
                        >
                            <i className="fa-solid fa-user me-1 text-primary"></i>
                            {displayName}
                        </a>
                    );
                }
                return displayName;
            }
        },
        {
            field: "card_number",
            label: "Card No",
            width: 120
        },
        {
            field: "issue_date",
            label: "Issue Date",
            width: 120,
            render: (value) => formatDate(value)
        },
        {
            field: "due_date",
            label: "Due Date",
            width: 120,
            render: (value) => (
                <span style={{
                    color: new Date(value) < new Date() ? '#dc3545' : '#28a745',
                    fontWeight: 'bold'
                }}>
                    {formatDate(value)}
                </span>
            )
        },
        {
            field: "actions",
            label: "Action",
            width: 100,
            render: (value, record) => (
                <Button
                    size="sm"
                    onClick={() => handleSubmitClick(record)}
                    variant="success"
                    disabled={loading}
                >
                    {loading ? (
                        <Spinner animation="border" size="sm" />
                    ) : (
                        'Submit'
                    )}
                </Button>
            )
        }
    ];

    // ✅ Define columns for submitted books table
    const submittedBooksColumns = [
        {
            field: "book_title",
            label: "Book Title",
            width: 250,
            render: (value, record) => (
                <a
                    href={`/book/${record.book_id}`}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                            localStorage.setItem(`prefetch:book:${record.book_id}`, JSON.stringify(record));
                        } catch (err) { }
                        navigate(`/book/${record.book_id}`, { state: record });
                    }}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                            localStorage.setItem(`prefetch:book:${record.book_id}`, JSON.stringify(record));
                        } catch (err) { }
                        window.open(`/book/${record.book_id}`, '_blank');
                    }}
                    style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 600, cursor: "pointer" }}
                    onMouseEnter={(e) => {
                        e.target.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.textDecoration = "none";
                    }}
                    title="Click to view book details (Right-click to open in new tab)"
                >
                    {value || "N/A"}
                </a>
            )
        },
        {
            field: "book_isbn",
            label: "ISBN",
            width: 150,
            render: (value) => (
                <code style={{ background: "#f8f9fa", padding: "4px 8px", borderRadius: "4px" }}>
                    {value || "-"}
                </code>
            )
        },
        {
            field: "student_name",
            label: "Submitted By",
            width: 200,
            render: (value, record) => {
                const userId = record.issued_to;
                const displayName = value || record.student_name || "N/A";
                if (userId) {
                    return (
                        <a
                            href={`/user/${userId}`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                    localStorage.setItem(`prefetch:user:${userId}`, JSON.stringify(record));
                                } catch (err) { }
                                navigate(`/user/${userId}`, { state: record });
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                    localStorage.setItem(`prefetch:user:${userId}`, JSON.stringify(record));
                                } catch (err) { }
                                window.open(`/user/${userId}`, '_blank');
                            }}
                            style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 500, cursor: "pointer" }}
                            onMouseEnter={(e) => {
                                e.target.style.textDecoration = "underline";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.textDecoration = "none";
                            }}
                            title="Click to view user details (Right-click to open in new tab)"
                        >
                            {displayName}
                        </a>
                    );
                }
                return displayName;
            }
        },
        {
            field: "submit_date",
            label: "Submit Date",
            width: 150,
            render: (value) => formatDate(value)
        },
        {
            field: "condition_after",
            label: "Condition",
            width: 120,
            render: (value) => (
                <Badge bg={value === "Good" ? "success" : value === "Fair" ? "warning" : "danger"}>
                    {value || "Good"}
                </Badge>
            )
        }
    ];

    return (
        <>
            <Container fluid className="mt-3" style={{ marginTop: "0.5rem", padding: "0 1.5rem" }}>
                {/* Tabs */}
                <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || "submit")}>
                    <Nav variant="tabs" style={{ borderBottom: "2px solid #e5e7eb", position: "relative" }}>

                        {/* Submit Tab */}
                        <Nav.Item>
                            <Nav.Link
                                eventKey="submit"
                                style={{
                                    color: activeTab === "submit" ? "#000000" : "#6b7280",
                                    fontWeight: activeTab === "submit" ? "600" : "400",
                                    borderBottom: activeTab === "submit" ? "3px solid #6b7280" : "none"
                                }}
                            >
                                <i className="fa-solid fa-book-return me-2"
                                    style={{ color: activeTab === "submit" ? "#000000" : "#6b7280" }}></i>
                                {/* Submit Book */}
                                <span style={{ color: activeTab === "submit" ? "#000000" : "#6b7280", fontSize: "15px" }}>       Submit Book</span>
                            </Nav.Link>
                        </Nav.Item>

                        {/* Submitted Tab */}
                        <Nav.Item>
                            <Nav.Link
                                eventKey="submitted"
                                style={{
                                    color: activeTab === "submitted" ? "#000000" : "#6b7280",
                                    fontWeight: activeTab === "submitted" ? "600" : "400",
                                    borderBottom: activeTab === "submitted" ? "3px solid #6b7280" : "none"
                                }}
                            >


                                <span style={{ color: activeTab === "submitted" ? "#000000" : "#6b7280", fontSize: "15px" }}>View Submitted Books ({submittedBooks.length})</span>

                            </Nav.Link>
                        </Nav.Item>

                        {/* ⭐ Search Bar Only When ActiveTab === submitted */}
                        {activeTab === "submitted" && (
                            <div
                                style={{
                                    position: "absolute",
                                    right: "0",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    paddingRight: "15px"
                                }}
                            >
                                <InputGroup style={{ maxWidth: "250px" }}>
                                    <InputGroup.Text
                                        style={{
                                            background: "#f3e9fc",
                                            borderColor: "#e9ecef",
                                            padding: "0.375rem 0.75rem"
                                        }}
                                    >
                                        <i className="fa-solid fa-search" style={{ color: "#6f42c1" }}></i>
                                    </InputGroup.Text>

                                    <Form.Control
                                        placeholder="Search books..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            borderColor: "#e9ecef",
                                            fontSize: "0.875rem",
                                            padding: "0.375rem 0.75rem"
                                        }}
                                    />

                                    {searchTerm && (
                                        <Button
                                            variant="outline-secondary"
                                            onClick={() => setSearchTerm("")}
                                            style={{
                                                border: "1px solid #d1d5db",
                                                borderRadius: "0 6px 6px 0",
                                                height: "38px"
                                            }}
                                        >
                                            <i className="fa-solid fa-times"></i>
                                        </Button>
                                    )}
                                </InputGroup>
                            </div>
                        )}

                    </Nav>
                    <Tab.Content>
                        {/* Submit Book Tab */}
                        <Tab.Pane eventKey="submit">
                            <Row>
                                <Col lg={3} md={12}>
                                    {/* Book Identification Card */}
                                    <Card className="mb-4 shadow-sm" style={{ background: "#f3e8ff", border: "1px solid #d8b4fe", borderRadius: "8px" }}>
                                        <Card.Header style={{
                                            background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                                            border: "none",
                                            borderBottom: "2px solid #d1d5db",
                                            padding: "20px 24px"
                                        }}>
                                            <h5 className="mb-0 fw-bold" style={{
                                                color: "#1f2937",
                                                fontSize: "20px",
                                                letterSpacing: "0.3px"
                                            }}>
                                                <i className="fa-solid fa-book-open me-3" style={{ color: "#6b7280" }}></i>
                                                Book Identification
                                            </h5>
                                        </Card.Header>
                                        <Card.Body className="p-4">
                                            {/* Search Mode Dropdown */}
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-bold small">Search By</Form.Label>
                                                <Form.Select
                                                    value={searchMode}
                                                    onChange={handleSearchModeChange}
                                                    style={{
                                                        border: "2px solid #8b5cf6",
                                                        borderRadius: "8px",
                                                        fontSize: "0.95rem",
                                                        padding: "0.75rem 1rem"
                                                    }}
                                                >
                                                    <option value="isbn">Search by ISBN</option>
                                                    <option value="card">Search by Library Card</option>
                                                </Form.Select>
                                            </Form.Group>

                                            {/* Manual Input Group */}
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-bold small">
                                                    {searchMode === "isbn" ? "ISBN Number" : "Library Card Number"}
                                                </Form.Label>
                                                <InputGroup>
                                                    <Form.Control
                                                        ref={searchMode === "isbn" ? isbnInputRef : cardInputRef}
                                                        type="text"
                                                        placeholder={searchMode === "isbn" ? "Enter ISBN number..." : "Enter Library Card number..."}
                                                        value={searchMode === "isbn" ? isbn : cardNumber}
                                                        onChange={searchMode === "isbn" ? handleIsbnChange : handleCardNumberChange}
                                                        onKeyDown={searchMode === "isbn" ? handleIsbnKeyDown : handleCardKeyDown}
                                                        autoFocus
                                                        disabled={loading}
                                                        style={{
                                                            border: "1px solid #dee2e6",
                                                            borderRadius: "8px 0 0 8px",
                                                            fontSize: "0.95rem",
                                                            padding: "0.75rem 1rem"
                                                        }}
                                                    />
                                                    {loading && (
                                                        <InputGroup.Text style={{
                                                            border: "1px solid #dee2e6",
                                                            borderLeft: "none",
                                                            borderRadius: "0",
                                                            backgroundColor: "#f8f9fa"
                                                        }}>
                                                            <Spinner animation="border" size="sm" />
                                                        </InputGroup.Text>
                                                    )}
                                                    <Button
                                                        variant="outline-secondary"
                                                        onClick={handleClearSearch}
                                                        disabled={loading}
                                                        style={{
                                                            border: "1px solid #dee2e6",
                                                            borderLeft: loading ? "none" : "1px solid #dee2e6",
                                                            borderRadius: loading ? "0 8px 8px 0" : "0 8px 8px 0",
                                                            minWidth: "50px",
                                                            backgroundColor: "#f8f9fa"
                                                        }}
                                                    >
                                                        <i className="fa-solid fa-xmark"></i>
                                                    </Button>
                                                </InputGroup>
                                            </Form.Group>

                                            {/* Scan Button */}
                                            <div className="text-center">
                                                <Button
                                                    variant="primary"
                                                    onClick={handleScanButtonClick}
                                                    disabled={loading}
                                                    style={{
                                                        width: "100%",
                                                        backgroundColor: "#0d6efd",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                        fontWeight: "600",
                                                        fontSize: "0.95rem",
                                                        padding: "0.75rem 1rem",
                                                        boxShadow: "0 2px 4px rgba(13, 110, 253, 0.3)"
                                                    }}
                                                >
                                                    {loading ? (
                                                        <Spinner animation="border" size="sm" className="me-2" />
                                                    ) : (
                                                        <i className="fa-solid fa-camera me-2"></i>
                                                    )}
                                                    Scan {searchMode === "isbn" ? "ISBN" : "Library Card"}
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>

                                    {/* Library Card Details */}
                                    {libraryCard && (
                                        <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                                            <Card.Header className="py-3 px-4" style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #6f42c1" }}>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <h6 className="mb-0 fw-bold" style={{ color: "#6f42c1", fontSize: "1rem" }}>
                                                        <i className="fa-solid fa-id-card me-2"></i>
                                                        Library Card: {libraryCard.card_number}
                                                    </h6>
                                                    <Badge bg="info">
                                                        {cardIssues.length} Active Issue{cardIssues.length !== 1 ? 's' : ''}
                                                    </Badge>
                                                </div>
                                            </Card.Header>
                                            <Card.Body className="py-3 px-4">
                                                <Row>
                                                    <Col md={6}>
                                                        <div className="mb-2">
                                                            <strong className="small">Card Holder:</strong>
                                                            <div className="text-secondary">
                                                                {libraryCard.user_name || libraryCard.student_name || "N/A"}
                                                            </div>
                                                        </div>
                                                    </Col>
                                                    <Col md={6}>
                                                        <div className="mb-2">
                                                            <strong className="small">Card Number:</strong>
                                                            <div className="text-secondary">{libraryCard.card_number}</div>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </Card.Body>
                                        </Card>
                                    )}

                                    {/* Book Details */}
                                    {book && (
                                        <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                                            <Card.Header style={{
                                                background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                                                border: "none",
                                                borderBottom: "2px solid #d1d5db",
                                                padding: "20px 24px"
                                            }}>
                                                <h5 className="mb-0 fw-bold" style={{
                                                    color: "#1f2937",
                                                    fontSize: "20px",
                                                    letterSpacing: "0.3px"
                                                }}>
                                                    Book Details for ISBN: {isbn}
                                                </h5>
                                            </Card.Header>
                                            <Card.Body className="py-3 px-4">
                                                <Row>
                                                    <Col md={6}>
                                                        <div className="mb-2">
                                                            <strong className="small">Title:</strong>
                                                            <div className="text-secondary">
                                                                <a
                                                                    href={`/book/${book.id}`}
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        navigate(`/book/${book.id}`);
                                                                    }}
                                                                    style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 600 }}
                                                                    onMouseEnter={(e) => {
                                                                        try {
                                                                            localStorage.setItem(`prefetch:book:${book.id}`, JSON.stringify(book));
                                                                        } catch (err) { }
                                                                        e.target.style.textDecoration = "underline";
                                                                    }}
                                                                    onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
                                                                >
                                                                    {book.title}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                    <Col md={6}>
                                                        <div className="mb-2">
                                                            <strong className="small">ISBN:</strong>
                                                            <div className="text-secondary">{book.isbn}</div>
                                                        </div>
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Col md={6}>
                                                        <div className="mb-2">
                                                            <strong className="small">Author:</strong>
                                                            <div className="text-secondary">{book.author || "N/A"}</div>
                                                        </div>
                                                    </Col>
                                                    <Col md={6}>
                                                        <div className="mb-2">
                                                            <strong className="small">Total Copies:</strong>
                                                            <div className="text-secondary">{book.total_copies || 0}</div>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </Card.Body>
                                        </Card>
                                    )}


                                </Col>

                                <Col lg={9} md={12}>
                                    {/* ✅ All Issued Books Card */}
                                    <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                                        <Card.Header style={{
                                            background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                                            border: "none",
                                            borderBottom: "2px solid #d1d5db",
                                        }}>
                                            <Row className="align-items-center">
                                                <Col>
                                                    <h5 className="mb-0 fw-bold" style={{
                                                        color: "#1f2937",
                                                        fontSize: "20px",
                                                        letterSpacing: "0.3px"
                                                    }}>
                                                        <i className="fa-solid fa-book-open me-3" style={{ color: "#6b7280" }}></i>
                                                        {bookIssues.length > 0 ? "Issued Books for this ISBN" : "All Issued Books"}
                                                        <span style={{ color: "orange", fontSize: "16px", marginLeft: "8px" }}>
                                                            ({filteredIssuedBooks.length} Issue{filteredIssuedBooks.length !== 1 ? 's' : ''})
                                                        </span>
                                                    </h5>
                                                </Col>
                                                <Col xs="auto">
                                                    {/* <InputGroup style={{ maxWidth: "300px" }}>
                                                        <InputGroup.Text style={{ backgroundColor: "#fff", border: "2px solid #8b5cf6", borderRight: "none" }}>
                                                            <i className="fa-solid fa-search" style={{ color: "#8b5cf6" }}></i>
                                                        </InputGroup.Text>
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="Search by title, ISBN, name..."
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                            style={{ border: "2px solid #8b5cf6", borderRadius: "8px" }}
                                                        />
                                                        {searchTerm && (
                                                            <Button variant="outline-secondary" onClick={() => setSearchTerm("")} style={{ border: "2px solid #8b5cf6" }}>
                                                                <i className="fa-solid fa-times"></i>
                                                            </Button>
                                                        )}
                                                    </InputGroup> */}


                                                    <InputGroup style={{ maxWidth: "250px" }}>
                                                        <InputGroup.Text
                                                            style={{
                                                                background: "#f3e9fc",
                                                                borderColor: "#e9ecef",
                                                                padding: "0.375rem 0.75rem"
                                                            }}
                                                        >
                                                            <i className="fa-solid fa-search" style={{ color: "#6f42c1" }}></i>
                                                        </InputGroup.Text>

                                                        <Form.Control
                                                            placeholder="Search by title, ISBN, name..."
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                            style={{
                                                                borderColor: "#e9ecef",
                                                                fontSize: "0.875rem",
                                                                padding: "0.375rem 0.75rem"
                                                            }}
                                                        />

                                                        {searchTerm && (
                                                            <Button
                                                                variant="outline-secondary"
                                                                onClick={() => setSearchTerm("")}
                                                                style={{
                                                                    border: "1px solid #d1d5db",
                                                                    borderRadius: "0 6px 6px 0",
                                                                    height: "38px"
                                                                }}
                                                            >
                                                                <i className="fa-solid fa-times"></i>
                                                            </Button>
                                                        )}
                                                    </InputGroup>
                                                </Col>
                                            </Row>
                                        </Card.Header>
                                        <ResizableTable
                                            data={filteredIssuedBooks}
                                            columns={issueColumns}
                                            loading={loading}
                                            showCheckbox={false}
                                            showSerialNumber={true}
                                            showActions={false}
                                            searchTerm={searchTerm}
                                            currentPage={currentPage}
                                            recordsPerPage={recordsPerPage}
                                            onPageChange={(page) => {
                                                setCurrentPage(page);
                                            }}
                                            emptyMessage={

                                                book && bookIssues && bookIssues.length === 0
                                                    ? <div className="text-center py-4">
                                                        <i className="fa-solid fa-check-circle fa-2x text-success mb-3"></i>
                                                        <h6 className="text-success">No Active Issues Found</h6>
                                                        <p className="text-muted mb-0">
                                                            This book is not currently issued to anyone or all issues have been returned.
                                                        </p>
                                                    </div>
                                                    : searchTerm
                                                        ? "No issued books found matching your search"
                                                        : "No books have been issued yet"
                                            }
                                        />
                                    </Card>
                                </Col>
                            </Row>
                        </Tab.Pane>

                        {/* View Submitted Books Tab */}
                        <Tab.Pane eventKey="submitted">
                            <Row>
                                <Col lg={12}>
                                    <Card className="shadow-sm">

                                        <Card.Body className="p-0" style={{ overflow: "hidden", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
                                            <ResizableTable
                                                data={filteredSubmittedBooks}
                                                columns={submittedBooksColumns}
                                                loading={loadingSubmitted}
                                                showCheckbox={false}
                                                showSerialNumber={true}
                                                showActions={false}
                                                searchTerm={searchTerm}
                                                currentPage={currentPage}
                                                recordsPerPage={recordsPerPage}
                                                onPageChange={(page) => setCurrentPage(page)}
                                                emptyMessage={searchTerm ? "No submitted books found matching your search" : "No books have been submitted yet"}
                                            />
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </Container >

            {/* ✅ Scan Modal */}
            < Modal show={showScanModal} onHide={() => setShowScanModal(false)} centered >
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className={`fa-solid ${scanMethod === "isbn" ? "fa-barcode" : "fa-address-card"} me-2`}></i>
                        {scanMethod === "isbn" ? "Scan Book ISBN" : "Scan Library Card"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="text-center">
                        <i className={`fa-solid ${scanMethod === "isbn" ? "fa-barcode" : "fa-address-card"} fa-4x mb-3`}
                            style={{ color: scanMethod === "isbn" ? "#0d6efd" : "#28a745" }}></i>
                        <h5>Ready to Scan</h5>
                        <p className="text-muted">
                            {scanMethod === "isbn"
                                ? "Point your barcode scanner at the book ISBN barcode"
                                : "Point your barcode scanner at the library card barcode"}
                        </p>

                        <Form.Group className="mt-4">
                            <Form.Label>
                                <strong>
                                    {scanMethod === "isbn" ? "Scanned ISBN:" : "Scanned Library Card:"}
                                </strong>
                            </Form.Label>
                            <Form.Control
                                type="text"
                                placeholder={scanMethod === "isbn" ? "Scanning will auto-populate here..." : "LIB123456..."}
                                value={scanMethod === "isbn" ? isbn : cardNumber}
                                onChange={handleScanInputChange}
                                onKeyDown={handleScanInputKeyDown}
                                autoFocus
                                className="text-center fw-bold"
                                style={{ fontSize: "18px" }}
                            />
                            <Form.Text className="text-muted">
                                {scanMethod === "isbn"
                                    ? "Scan or enter 10 or 13 digit ISBN number"
                                    : "Scan or enter library card number"}
                            </Form.Text>
                        </Form.Group>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowScanModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleScanSubmit}
                        disabled={!((scanMethod === "isbn" ? isbn : cardNumber).trim()) || loading}
                    >
                        {loading ? (
                            <Spinner animation="border" size="sm" className="me-2" />
                        ) : (
                            <i className="fa-solid fa-search me-2"></i>
                        )}
                        {scanMethod === "isbn" ? "Search Book" : "Search Card"}
                    </Button>
                </Modal.Footer>
            </Modal >

            {/* Submit Confirmation Modal */}
            < Modal show={showSubmitModal} onHide={handleModalClose} centered size="lg" >
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="fa-solid fa-paper-plane me-2 text-success"></i>
                        Submit Book Return
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedIssue && (
                        <div>
                            <h6 className="mb-3">Book Return Details</h6>

                            {/* Issue Details */}
                            <Card className="mb-3 ">
                                <Card.Header className="  py-2">
                                    <h6 className="mb-0 small">Issue Information</h6>
                                </Card.Header>
                                <Card.Body className="py-2">
                                    <Row>
                                        <Col md={6}>
                                            <strong className="small">Book Title:</strong>
                                            <div className="text-secondary small">{selectedIssue.book_title || book?.title}</div>
                                        </Col>
                                        <Col md={6}>
                                            <strong className="small">ISBN:</strong>
                                            <div className="text-secondary small">{selectedIssue.book_isbn || book?.isbn}</div>
                                        </Col>
                                    </Row>
                                    <Row className="mt-2">
                                        <Col md={6}>
                                            <strong className="small">Issued To:</strong>
                                            <div className="text-secondary small">
                                                <Button
                                                    variant="link"
                                                    className="p-0 text-decoration-none"
                                                    onClick={(e) => handleNameClick(
                                                        selectedIssue.user_id || selectedIssue.student_id,
                                                        selectedIssue.issued_to_name || selectedIssue.student_name || selectedIssue.issued_to,
                                                        selectedIssue,
                                                        e
                                                    )}
                                                    title="View User Details"
                                                >
                                                    <i className="fa-solid fa-user me-1 text-primary"></i>
                                                    {selectedIssue.issued_to_name || selectedIssue.student_name || selectedIssue.issued_to}
                                                </Button>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <strong className="small">Card Number:</strong>
                                            <div className="text-secondary small">{selectedIssue.card_number || selectedIssue.card_id || '-'}</div>
                                        </Col>
                                    </Row>
                                    <Row className="mt-2">
                                        <Col md={6}>
                                            <strong className="small">Issue Date:</strong>
                                            <div className="text-secondary small">{formatDate(selectedIssue.issue_date)}</div>
                                        </Col>
                                        <Col md={6}>
                                            <strong className="small">Due Date:</strong>
                                            <div className="text-secondary small">{formatDate(selectedIssue.due_date)}</div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Condition Assessment Form */}
                            <Card className="mb-3 ">
                                <Card.Header className=" py-2">
                                    <h6 className="mb-0 small">Condition Assessment</h6>
                                </Card.Header>
                                <Card.Body className="py-2">
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-2">
                                                <Form.Label className="small fw-bold">Condition Before</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={selectedIssue.condition_before || conditionBefore}
                                                    onChange={(e) => setConditionBefore(e.target.value)}
                                                    disabled={loading}
                                                    size="sm"
                                                    className="small"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-2">
                                                <Form.Label className="small fw-bold">Condition After</Form.Label>
                                                <Form.Select
                                                    value={conditionAfter}
                                                    onChange={(e) => setConditionAfter(e.target.value)}
                                                    disabled={loading}
                                                    size="sm"
                                                    className="small"
                                                >
                                                    <option value="Good">✅ Good</option>
                                                    <option value="Fair">⚠️ Fair</option>
                                                    <option value="Damaged">❌ Damaged</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Form.Group className="mb-2">
                                        <Form.Label className="small fw-bold">Remarks</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            placeholder="Add notes about book condition..."
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            disabled={loading}
                                            size="sm"
                                            className="small"
                                        />
                                    </Form.Group>
                                </Card.Body>
                            </Card>

                            {/* Penalty Information */}
                            <Card>
                                <Card.Header className="py-2">
                                    <h6 className="mb-0 small">Penalty Information</h6>
                                </Card.Header>
                                <Card.Body className="py-2">
                                    <div className="text-center">
                                        <h5 style={{
                                            color: penalty.penalty > 0 ? "#dc3545" : "#28a745",
                                            fontWeight: "bold"
                                        }}>
                                            ₹{penalty.penalty || 0}
                                        </h5>
                                        <p className="small text-muted mb-0">
                                            {penalty.daysOverdue ? `Overdue by ${penalty.daysOverdue} day(s)` : "No overdue penalty"}
                                        </p>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleModalClose} disabled={loading}>
                        <i className="fa-solid fa-times me-2"></i>
                        Cancel
                    </Button>
                    <Button variant="success" onClick={handleFinalSubmit} disabled={loading}>
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-check me-2"></i>
                                Confirm Submit
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal >
        </>
    );
}

export default BookSubmit;