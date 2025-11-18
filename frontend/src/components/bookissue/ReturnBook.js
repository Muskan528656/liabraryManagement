import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Spinner, Badge, InputGroup, Table, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import helper from "../common/helper";
import PubSub from "pubsub-js";
import * as constants from "../../constants/CONSTANT";

const ReturnBook = () => {
    const navigate = useNavigate();
    const [isbn, setIsbn] = useState("");
    const [loading, setLoading] = useState(false);
    const [book, setBook] = useState(null);
    const [issue, setIssue] = useState(null);
    const [libraryCard, setLibraryCard] = useState(null);
    const [cardIssues, setCardIssues] = useState([]);
    const [bookIssues, setBookIssues] = useState([]);
    const [penalty, setPenalty] = useState({ penalty: 0, daysOverdue: 0 });
    const [conditionBefore, setConditionBefore] = useState("Good");
    const [conditionAfter, setConditionAfter] = useState("Good");
    const [remarks, setRemarks] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [showScanModal, setShowScanModal] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [scanMethod, setScanMethod] = useState("");
    const isbnInputRef = React.useRef(null);

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

    // Navigate to user detail page - FIXED FUNCTION
    const handleNameClick = (userId, userName, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (userId) {
            navigate(`/user/${userId}`, {
                state: { userName: userName },
            });
        }
    };

    // Calculate book issue counts
    const calculateBookCounts = (issues) => {
        const counts = {};
        issues.forEach(issue => {
            const key = `${issue.book_title}_${issue.book_isbn}`;
            counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
    };

    // Perform search with ISBN or Library Card
    const performSearch = async (value, method) => {
        console.log("Performing search with value:", value, "method:", method);
        if (!value || value.trim() === "") {
            PubSub.publish("RECORD_ERROR_TOAST", { title: "Validation", message: "Please enter or scan a value" });
            return;
        }

        try {
            setLoading(true);

            // Auto-detect if method is 'auto'
            let searchMethod = method;
            if (method === 'auto') {
                searchMethod = 'isbn';
            }

            console.log("Detected search method:", searchMethod);

            if (searchMethod === 'libraryCard') {
                console.log("Searching by library card:", value);
                const cardResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/librarycard/card/${encodeURIComponent(value.trim())}`, "GET");
                console.log("Library card response:", cardResp);

                if (!cardResp.ok) {
                    const err = await cardResp.json().catch(() => ({}));
                    PubSub.publish("RECORD_ERROR_TOAST", { title: "Not Found", message: err.errors || "Library card not found" });
                    setLibraryCard(null);
                    setCardIssues([]);
                    return;
                }

                const cardData = await cardResp.json();
                setLibraryCard(cardData);

                const issuesResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/card/${cardData.id}`, "GET");
                if (!issuesResp.ok) {
                    const err = await issuesResp.json().catch(() => ({}));
                    PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: err.errors || "Failed to fetch issues for this card" });
                    setCardIssues([]);
                    return;
                }

                const issues = await issuesResp.json();
                if (!issues || !Array.isArray(issues) || issues.length === 0) {
                    PubSub.publish("RECORD_ERROR_TOAST", { title: "No Active Issues", message: "No active issued records found for this card" });
                    setCardIssues([]);
                    return;
                }

                setCardIssues(issues);
                setBook(null);
                setIssue(null);
                setBookIssues([]);
                setPenalty({ penalty: 0, daysOverdue: 0 });
                return;
            }

            // Default: ISBN -> get book and issues
            const bookResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/book/isbn/${encodeURIComponent(value.trim())}`, "GET");
            if (!bookResp.ok) {
                const err = await bookResp.json().catch(() => ({}));
                PubSub.publish("RECORD_ERROR_TOAST", { title: "Not Found", message: err.errors || "Book not found" });
                setBook(null);
                setIssue(null);
                setBookIssues([]);
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
                return;
            }

            const issues = await issuesResp.json();
            if (!issues || !Array.isArray(issues) || issues.length === 0) {
                PubSub.publish("RECORD_ERROR_TOAST", { title: "No Active Issue", message: "No active issued record found for this ISBN" });
                setIssue(null);
                setBookIssues([]);
                return;
            }

            setBookIssues(issues);
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

        } catch (error) {
            console.error("Error searching:", error);
            PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: error.message || "Error searching" });
            setBook(null);
            setIssue(null);
            setLibraryCard(null);
            setCardIssues([]);
            setBookIssues([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        await performSearch(isbn, 'auto');
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
                    await performSearch(value.trim(), 'auto');
                }
            }, 800);
        } else if (value.trim().length === 0) {
            // Clear results when input is empty
            setBook(null);
            setIssue(null);
            setLibraryCard(null);
            setCardIssues([]);
            setBookIssues([]);
            setPenalty({ penalty: 0, daysOverdue: 0 });
        }
    };

    const handleIsbnKeyDown = async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (isbnInputRef.current?.timer) {
                clearTimeout(isbnInputRef.current.timer);
            }
            setIsScanning(true);
            await performSearch(isbn, 'auto');
            setIsScanning(false);
        }
    };

    const handleScanButtonClick = (method) => {
        setScanMethod(method);
        setShowScanModal(true);
    };

    const handleScanSubmit = async () => {
        if (isbn.trim()) {
            setShowScanModal(false);
            await performSearch(isbn, scanMethod);
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

            const resp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/book-submissions`, "POST", body);
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

    // Calculate counts for display
    const bookCounts = libraryCard ? calculateBookCounts(cardIssues) : calculateBookCounts(bookIssues);

    return (
        <>
            <Container fluid className="mt-3" style={{ marginTop: "0.5rem", padding: "0 1.5rem" }}>
                {/* Header Section */}
                <Row className="mb-4">
                    <Col>
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div>
                                <h4 className="mb-1 fw-bold" style={{ color: "#6f42c1", fontSize: "1.75rem" }}>
                                    <i className="fa-solid fa-book-return me-2"></i>
                                    Book Submission
                                </h4>
                                <p className="text-muted mb-0" style={{ fontSize: "15px" }}>Return books by scanning barcode or entering ISBN</p>
                            </div>
                            <Badge bg="light" text="dark" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem", fontWeight: "500" }}>
                                <i className="fa-solid fa-bolt me-1"></i>
                                Quick Submit
                            </Badge>
                        </div>
                    </Col>
                </Row>

                {/* Main Content - Full Width */}
                <Row>
                    <Col lg={12}>
                        {/* Book Identification Card */}
                        <Card className="mb-4 shadow-sm" style={{ background: "#f3e8ff", border: "1px solid #d8b4fe", borderRadius: "8px" }}>
                            <Card.Header style={{ background: "#e9d5ff", border: "none", borderBottom: "1px solid #d8b4fe", borderRadius: "8px 8px 0 0" }}>
                                <h5 className="mb-0 fw-bold" style={{ color: "#000000", fontSize: "18px" }}>
                                    <i className="fa-solid fa-barcode me-2" style={{ color: "#6b7280" }}></i>
                                    Book Identification
                                </h5>
                            </Card.Header>
                            <Card.Body className="p-4">
                                {/* Scan/Enter ISBN Section */}
                                <div className="mb-4">
                                    <div className="d-flex align-items-center gap-3 flex-wrap">
                                        {/* Scan Button */}
                                        <Button
                                            variant="primary"
                                            onClick={() => handleScanButtonClick("scan")}
                                            size="lg"
                                            style={{
                                                height: "48px",
                                                backgroundColor: "#0d6efd",
                                                border: "none",
                                                borderRadius: "8px",
                                                minWidth: "220px",
                                                fontWeight: "600",
                                                fontSize: "0.95rem",
                                                boxShadow: "0 2px 4px rgba(13, 110, 253, 0.3)"
                                            }}
                                        >
                                            <i className="fa-solid fa-camera me-2"></i>
                                            Scan Barcode / Library Card
                                        </Button>

                                        {/* Or Separator */}
                                        <div className="text-muted fw-bold" style={{ minWidth: "40px", textAlign: "center", fontSize: "0.9rem" }}>
                                            OR
                                        </div>

                                        {/* Manual Input Group */}
                                        <InputGroup style={{ flex: "1", minWidth: "300px" }}>
                                            <Form.Control
                                                ref={isbnInputRef}
                                                type="text"
                                                placeholder="Type ISBN number here And Library Card Number"
                                                value={isbn}
                                                onChange={handleIsbnChange}
                                                onKeyDown={handleIsbnKeyDown}
                                                autoFocus
                                                disabled={loading}
                                                size="lg"
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
                                                onClick={() => {
                                                    if (isbnInputRef.current?.timer) {
                                                        clearTimeout(isbnInputRef.current.timer);
                                                    }
                                                    setIsbn("");
                                                    setBook(null);
                                                    setIssue(null);
                                                    setLibraryCard(null);
                                                    setCardIssues([]);
                                                    setBookIssues([]);
                                                    setPenalty({ penalty: 0, daysOverdue: 0 });
                                                    isbnInputRef.current?.focus();
                                                }}
                                                disabled={loading}
                                                size="lg"
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
                                    </div>
                                </div>

                            </Card.Body>
                        </Card>

                        {/* Book Details - Show ISBN search results */}
                        {book && (
                            <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                                <Card.Header className="py-3 px-4" style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #6f42c1" }}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h6 className="mb-0 fw-bold" style={{ color: "#6f42c1", fontSize: "1rem" }}>
                                            <i className="fa-solid fa-book me-2"></i>
                                            Book Details for ISBN: {isbn}
                                        </h6>
                                    </div>
                                </Card.Header>
                                <Card.Body className="py-3 px-4">
                                    <Row>
                                        <Col md={6}>
                                            <div className="mb-1">
                                                <strong className="small">Title:</strong>
                                                <div className="text-secondary small">{book.title}</div>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="mb-1">
                                                <strong className="small">ISBN:</strong>
                                                <div className="text-secondary small">{book.isbn}</div>
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <div className="mb-1">
                                                <strong className="small">Author:</strong>
                                                <div className="text-secondary small">{book.author || "N/A"}</div>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="mb-1">
                                                <strong className="small">Available Copies:</strong>
                                                <div className="text-secondary small">{book.available_copies || 0}</div>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Library Card Details */}
                        {libraryCard && (
                            <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                                <Card.Header className="py-3 px-4" style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #0d6efd" }}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h6 className="mb-0 fw-bold" style={{ color: "#0d6efd", fontSize: "1rem" }}>
                                            <i className="fa-solid fa-id-card me-2"></i>
                                            Library Card
                                        </h6>
                                        <Badge bg="primary" className="ms-2" style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}>
                                            {cardIssues.length} Books Issued
                                        </Badge>
                                    </div>
                                </Card.Header>
                                <Card.Body className="py-3 px-4">
                                    <Row>
                                        <Col md={6}>
                                            <div className="mb-1">
                                                <strong className="small">Card Number:</strong>
                                                <div className="text-secondary small">{libraryCard.card_number}</div>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="mb-1">
                                                <strong className="small">Holder:</strong>
                                                <div className="text-secondary small">{libraryCard.user_name || libraryCard.user_email || '-'}</div>
                                            </div>
                                        </Col>
                                    </Row>

                                    {cardIssues && cardIssues.length > 0 && (
                                        <div className="mt-2">
                                            <h6 className="mb-1 small">Books currently issued to this card</h6>
                                            <div className="table-responsive">
                                                <Table striped bordered hover size="sm" className="mb-0 small">
                                                    <thead style={{ backgroundColor: "white" }}>
                                                        <tr>
                                                            <th>Title</th>
                                                            <th>ISBN</th>
                                                            <th>Issue Date</th>
                                                            <th>Due Date</th>
                                                            <th style={{ width: 80 }}>Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {cardIssues.map((ci) => {
                                                            const bookKey = `${ci.book_title}_${ci.book_isbn}`;
                                                            const count = bookCounts[bookKey] || 1;
                                                            return (
                                                                <tr key={ci.id}>
                                                                    <td>
                                                                        {ci.book_title}
                                                                        {count > 1 && (
                                                                            <Badge bg="warning" text="dark" className="ms-1">
                                                                                {count}x
                                                                            </Badge>
                                                                        )}
                                                                    </td>
                                                                    <td>{ci.book_isbn}</td>
                                                                    <td>{formatDate(ci.issue_date)}</td>
                                                                    <td>{formatDate(ci.due_date)}</td>
                                                                    <td>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => handleSubmitClick(ci)}
                                                                            variant="success"
                                                                            className="small py-0"
                                                                        >
                                                                            Submit
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        )}

                        {/* Book Issues List - FIXED NAVIGATION */}
                        {bookIssues && bookIssues.length > 0 && (
                            <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                                <Card.Header className="py-3 px-4" style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #ffc107" }}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h6 className="mb-0 fw-bold" style={{ color: "#856404", fontSize: "1rem" }}>
                                            <i className="fa-solid fa-users me-2 text-warning"></i>
                                            People who have this book issued
                                        </h6>
                                    </div>
                                </Card.Header>
                                <Card.Body className="py-3 px-4">
                                    <div className="table-responsive">
                                        <Table striped bordered hover size="sm" className="mb-0 small">
                                            <thead style={{ backgroundColor: "white" }}>
                                                <tr>
                                                    <th>Issued To</th>
                                                    <th>Card No</th>
                                                    <th>Issue Date</th>
                                                    <th>Due Date</th>
                                                    <th style={{ width: 80 }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bookIssues.map((bi) => (
                                                    <tr key={bi.id}>
                                                        <td>
                                                            <Button
                                                                variant="link"
                                                                className="p-0 text-decoration-none"
                                                                onClick={(e) => handleNameClick(
                                                                    bi.user_id || bi.student_id,
                                                                    bi.issued_to_name || bi.student_name || bi.issued_to,
                                                                    e
                                                                )}
                                                                title="View User Details"
                                                            >
                                                                <i className="fa-solid fa-user me-1 text-primary"></i>
                                                                {bi.issued_to_name || bi.student_name || bi.issued_to}
                                                            </Button>
                                                        </td>
                                                        <td>{bi.card_number || bi.card_id || '-'}</td>
                                                        <td>{formatDate(bi.issue_date)}</td>
                                                        <td>{formatDate(bi.due_date)}</td>
                                                        <td>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleSubmitClick(bi)}
                                                                variant="success"
                                                                className="small py-0"
                                                            >
                                                                Submit
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                </Card.Body>
                            </Card>
                        )}
                    </Col>
                </Row>
            </Container>

            {/* Scan Modal */}
            <Modal show={showScanModal} onHide={() => setShowScanModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className={`fa-solid ${scanMethod === "isbn" ? "fa-barcode" : "fa-address-card"} me-2`}></i>
                        {scanMethod === "isbn" ? "Scan Barcode" : "Scan Library Card"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="text-center">
                        <i className={`fa-solid ${scanMethod === "isbn" ? "fa-barcode" : "fa-address-card"} fa-4x mb-3`}
                            style={{ color: scanMethod === "isbn" ? "#0d6efd" : "#28a745" }}></i>
                        <h5>Ready to Scan</h5>
                        <p className="text-muted">
                            {scanMethod === "isbn"
                                ? "Point your barcode scanner at the book barcode and scan."
                                : "Scan the library card barcode to retrieve member details."}
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
                                value={isbn}
                                onChange={handleIsbnChange}
                                onKeyDown={handleIsbnKeyDown}
                                autoFocus
                                className="text-center fw-bold"
                                style={{ fontSize: "18px" }}
                                onBlur={() => {
                                    if (isbn.trim().length >= 3 && !loading) {
                                        performSearch(isbn.trim(), 'auto');
                                    }
                                }}
                            />
                            <Form.Text className="text-muted">
                                {scanMethod === "isbn"
                                    ? "Enter 10 or 13 digit ISBN number"
                                    : "Enter library card number starting with LIB"}
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
                        disabled={!isbn.trim()}
                    >
                        <i className="fa-solid fa-check me-2"></i>
                        {scanMethod === "isbn" ? "Search Book" : "Search Card"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Submit Confirmation Modal */}
            <Modal show={showSubmitModal} onHide={handleModalClose} centered size="lg">
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
            </Modal>
        </>
    );
};

export default ReturnBook;