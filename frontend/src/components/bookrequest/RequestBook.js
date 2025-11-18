import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form, Alert, Badge, Modal } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DataApi from "../../api/dataApi";
import jwt_decode from "jwt-decode";
import ScrollToTop from "../common/ScrollToTop";
import Loader from "../common/Loader";
import ResizableTable from "../common/ResizableTable";
import * as constants from "../../constants/CONSTANT";
import helper from "../common/helper";
import PubSub from "pubsub-js";
// Poll for request status updates every 10 seconds
const POLL_INTERVAL = 10000;

const RequestBook = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [requestingBookId, setRequestingBookId] = useState(null);
  const [bookRequests, setBookRequests] = useState({}); // Map of book_id -> request status
  const [activeBookIssues, setActiveBookIssues] = useState({}); // Map of book_id -> active issue count
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token) {
      try {
        const user = jwt_decode(token);
        setUserInfo(user);
        fetchBooks();
        if (user.id) {
          fetchUserRequests(user.id);
          fetchActiveBookIssues(user.id);

          // Poll for request status updates
          const pollInterval = setInterval(() => {
            fetchUserRequests(user.id);
            fetchActiveBookIssues(user.id);
          }, POLL_INTERVAL);

          return () => clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  // Fetch user's book requests to track status
  const fetchUserRequests = async (userId) => {
    try {
      const response = await helper.fetchWithAuth(
        `${constants.API_BASE_URL}/api/bookrequest/user/${userId}`,
        "GET"
      );
      const result = await response.json();

      if (result && Array.isArray(result)) {
        const requestsMap = {};
        result.forEach(request => {
          if (request.book_id) {
            requestsMap[request.book_id] = {
              status: request.status,
              id: request.id
            };
          }
        });
        setBookRequests(requestsMap);
      }
    } catch (error) {
      console.error("Error fetching user requests:", error);
    }
  };

  // Fetch user's active book issues (not returned) to check if book is currently issued
  const fetchActiveBookIssues = async (userId) => {
    try {
      const response = await helper.fetchWithAuth(
        `${constants.API_BASE_URL}/api/bookissue/user/${userId}`,
        "GET"
      );
      const result = await response.json();

      if (result && Array.isArray(result)) {
        const issuesMap = {};
        result.forEach(issue => {
          if (issue.book_id && !issue.return_date) {
            // Count active (not returned) issues per book
            if (!issuesMap[issue.book_id]) {
              issuesMap[issue.book_id] = 0;
            }
            issuesMap[issue.book_id] += 1;
          }
        });
        setActiveBookIssues(issuesMap);
      }
    } catch (error) {
      console.error("Error fetching active book issues:", error);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const filtered = books.filter(
        (book) =>
          book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.author_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.isbn?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBooks(filtered);
    } else {
      setFilteredBooks(books);
    }
    // Reset to first page when search term changes
    setCurrentPage(1);
  }, [searchTerm, books]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const bookApi = new DataApi("book");
      const response = await bookApi.fetchAll();
      if (response.data) {
        setBooks(response.data);
        setFilteredBooks(response.data);
      }
    } catch (error) {
      console.error("Error fetching books:", error);
      toast.error("Failed to fetch books");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestClick = (book) => {
    // Double check if book is available before opening modal
    if (!book.available_copies || book.available_copies <= 0) {
      toast.error("This book is currently out of stock. No copies are available for request.");
      return;
    }

    setSelectedBook(book);
    setQuantity(1);
    setShowQuantityModal(true);
  };

  const handleRequestBook = async () => {
    if (!userInfo || !userInfo.id) {
      toast.error("User information not found");
      return;
    }

    if (!selectedBook) {
      toast.error("Book information not found");
      return;
    }

    if (!quantity || quantity < 1) {
      toast.error("Please enter a valid quantity (minimum 1)");
      return;
    }

    // Check if book is still available
    if (!selectedBook.available_copies || selectedBook.available_copies <= 0) {
      toast.error("This book is currently out of stock. No copies are available for request.");
      setShowQuantityModal(false);
      setSelectedBook(null);
      setQuantity(1);
      // Refresh books list to get updated availability
      fetchBooks();
      return;
    }

    // Check if requested quantity exceeds available copies
    if (selectedBook.available_copies < quantity) {
      toast.error(`Only ${selectedBook.available_copies} copy/copies are available. Please request a lower quantity.`);
      return;
    }

    try {
      setRequestingBookId(selectedBook.id);
      const response = await helper.fetchWithAuth(
        `${constants.API_BASE_URL}/api/bookrequest`,
        "POST",
        JSON.stringify({
          book_id: selectedBook.id,
          quantity: parseInt(quantity),
        })
      );

      const result = await response.json();

      if (result.success || result.data) {
        PubSub.publish("RECORD_SAVED_TOAST", {
          title: "Success",
          message: `\u2705 Request for ${quantity} book(s) submitted successfully! Admin will review your request.`,
        });

        // Update book requests map to show pending status
        const requestData = result.data || result;
        setBookRequests(prev => ({
          ...prev,
          [selectedBook.id]: {
            status: 'pending',
            id: requestData.id
          }
        }));

        // Refresh user requests and active issues to get latest status
        if (userInfo?.id) {
          fetchUserRequests(userInfo.id);
          fetchActiveBookIssues(userInfo.id);
        }

        // Refresh books list to update available copies
        fetchBooks();

        // Close modal and reset
        setShowQuantityModal(false);
        setSelectedBook(null);
        setQuantity(1);
      } else {
        const errorMsg = result.message || result.errors || "Failed to submit book request";
        toast.error(errorMsg);
        // If book is out of stock, refresh the books list
        if (errorMsg.includes("out of stock") || errorMsg.includes("No copies are available")) {
          fetchBooks();
        }
      }
    } catch (error) {
      console.error("Error requesting book:", error);
      const errorMessage = error.message || "Failed to submit book request";
      toast.error(errorMessage);
      // If book is out of stock, refresh the books list
      if (errorMessage.includes("out of stock") || errorMessage.includes("No copies are available")) {
        fetchBooks();
      }
    } finally {
      setRequestingBookId(null);
    }
  };

  // Define columns for ResizableTable
  const columns = [
    {
      field: "title",
      label: "Title",
      render: (value) => <span style={{ fontWeight: "500" }}>{value || "N/A"}</span>,
    },
    {
      field: "author_name",
      label: "Author",
      render: (value) => <span>{value || "N/A"}</span>,
    },
    {
      field: "category_name",
      label: "Category",
      render: (value) => (
        <span
          className="badge"
          style={{
            background: "#f3e9fc",
            color: "#6f42c1",
            padding: "4px 10px",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          {value || "N/A"}
        </span>
      ),
    },
    {
      field: "isbn",
      label: "ISBN",
      render: (value) => <span style={{ color: "#6c757d" }}>{value || "N/A"}</span>,
    },
    {
      field: "available_copies",
      label: "Available Copies",
      render: (value, record) => (
        <Badge bg={value > 0 ? "success" : "danger"}>
          {value || 0}
        </Badge>
      ),
    },
    {
      field: "total_copies",
      label: "Total Copies",
      render: (value) => <span>{value || 0}</span>,
    },
  ];

  // Actions renderer for ResizableTable
  const actionsRenderer = (book) => {
    const requestStatus = bookRequests[book.id];
    const activeIssueCount = activeBookIssues[book.id] || 0;
    const hasActiveIssue = activeIssueCount > 0;
    const isAvailable = book.available_copies && book.available_copies > 0;

    if (requestingBookId === book.id) {
      return (
        <Button
          variant="primary"
          size="sm"
          disabled
          style={{
            background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
            border: "none",
          }}
        >
          <span
            className="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          Requesting...
        </Button>
      );
    }

    // Show status for pending requests
    if (requestStatus && requestStatus.status === 'pending') {
      return (
        <Badge bg="warning" style={{ fontSize: "12px", padding: "6px 12px" }}>
          <i className="fa-solid fa-clock me-1"></i>
          Pending
        </Badge>
      );
    }

    // If book is currently issued (not returned) to user, show "Already Issued" but allow requesting more if available
    if (hasActiveIssue) {
      // If there are still available copies, allow requesting more
      if (isAvailable) {
        return (
          <div className="d-flex align-items-center gap-2">
            <Badge bg="info" style={{ fontSize: "12px", padding: "6px 12px" }}>
              <i className="fa-solid fa-book me-1"></i>
              Already Issued ({activeIssueCount})
            </Badge>
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRequestClick(book);
              }}
              style={{
                background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                border: "none",
                fontSize: "12px",
                padding: "4px 12px",
              }}
              title="Request additional copies"
            >
              <i className="fa-solid fa-plus me-1"></i>
              Request More
            </Button>
          </div>
        );
      }
      // If no copies available, just show the badge
      return (
        <Badge bg="info" style={{ fontSize: "12px", padding: "6px 12px" }}>
          <i className="fa-solid fa-book me-1"></i>
          Already Issued ({activeIssueCount})
        </Badge>
      );
    }

    // Show rejected/cancelled status but still allow requesting if available
    if (requestStatus) {
      if (requestStatus.status === 'rejected') {
        // Allow requesting again if available
        if (isAvailable) {
          return (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRequestClick(book);
              }}
              style={{
                background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                border: "none",
              }}
            >
              <i className="fa-solid fa-hand-holding me-2"></i>
              Request Again
            </Button>
          );
        }
        return (
          <Badge bg="danger" style={{ fontSize: "12px", padding: "6px 12px" }}>
            <i className="fa-solid fa-times-circle me-1"></i>
            Rejected
          </Badge>
        );
      } else if (requestStatus.status === 'cancelled') {
        // Allow requesting again if available
        if (isAvailable) {
          return (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRequestClick(book);
              }}
              style={{
                background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                border: "none",
              }}
            >
              <i className="fa-solid fa-hand-holding me-2"></i>
              Request
            </Button>
          );
        }
        return (
          <Badge bg="secondary" style={{ fontSize: "12px", padding: "6px 12px" }}>
            <i className="fa-solid fa-ban me-1"></i>
            Cancelled
          </Badge>
        );
      } else if (requestStatus.status === 'approved') {
        // If approved but book has been returned, allow requesting again
        if (!hasActiveIssue && isAvailable) {
          return (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRequestClick(book);
              }}
              style={{
                background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                border: "none",
              }}
            >
              <i className="fa-solid fa-hand-holding me-2"></i>
              Request Again
            </Button>
          );
        }
      }
    }

    // Default: Allow requesting if available copies > 0
    return (
      <Button
        variant="primary"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleRequestClick(book);
        }}
        disabled={!isAvailable}
        title={!isAvailable ? "This book is out of stock. No copies available." : "Click to request this book"}
        style={{
          background: !isAvailable
            ? "#6c757d"
            : "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
          border: "none",
          opacity: !isAvailable ? 0.6 : 1,
        }}
      >
        <i className="fa-solid fa-hand-holding me-2"></i>
        {!isAvailable ? "Out of Stock" : "Request"}
      </Button>
    );
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <Container fluid className="mt-4">
      <ScrollToTop />
      <Row className="mb-3">
        <Col>
          <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.1)" }}>
            <Card.Header
              style={{
                background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0" style={{ color: "#fff" }}>
                  Request Book
                </h5>
                <Form.Control
                  type="text"
                  placeholder="Search books by title, author, category, or ISBN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: "400px", maxWidth: "100%" }}
                />
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <ResizableTable
                data={filteredBooks}
                columns={columns}
                loading={loading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                currentPage={currentPage}
                totalRecords={filteredBooks.length}
                recordsPerPage={recordsPerPage}
                onPageChange={setCurrentPage}
                showSerialNumber={true}
                showActions={true}
                showSearch={false}
                actionsRenderer={actionsRenderer}
                emptyMessage={searchTerm ? `No books found matching "${searchTerm}"` : "No books available in the library"}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quantity Modal */}
      <Modal show={showQuantityModal} onHide={() => {
        setShowQuantityModal(false);
        setSelectedBook(null);
        setQuantity(1);
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Request Book</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBook && (
            <div>
              <div className="mb-3">
                <strong>Book:</strong> {selectedBook.title}
              </div>
              <div className="mb-3">
                <strong>Author:</strong> {selectedBook.author_name || "N/A"}
              </div>
              <div className="mb-3">
                <strong>Available Copies:</strong>{" "}
                <Badge bg={selectedBook.available_copies > 0 ? "success" : "danger"}>
                  {selectedBook.available_copies || 0}
                </Badge>
              </div>
              <Form.Group className="mt-3">
                <Form.Label>
                  How many books do you need? <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max={selectedBook.available_copies || 1}
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    const maxValue = selectedBook.available_copies || 1;
                    setQuantity(Math.min(Math.max(1, value), maxValue));
                  }}
                  placeholder="Enter quantity"
                  required
                />
                <Form.Text className="text-muted">
                  Maximum {selectedBook.available_copies || 0} copies available
                </Form.Text>
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowQuantityModal(false);
              setSelectedBook(null);
              setQuantity(1);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleRequestBook}
            disabled={!quantity || quantity < 1 || requestingBookId === selectedBook?.id}
            style={{
              background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
              border: "none",
            }}
          >
            {requestingBookId === selectedBook?.id ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Submitting...
              </>
            ) : (
              <>
                <i className="fa-solid fa-check me-2"></i>
                Submit Request
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer />
    </Container>
  );
};

export default RequestBook;

