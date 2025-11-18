import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Card, Button, Form, Modal, Alert } from "react-bootstrap";
import { Html5QrcodeScanner } from "html5-qrcode";
import ScrollToTop from "../common/ScrollToTop";
import Loader from "../common/Loader";
import DataApi from "../../api/dataApi";
import PubSub from "pubsub-js";
import { useNavigate } from "react-router-dom";

const ScanBook = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [bookDetails, setBookDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    author_id: "",
    category_id: "",
    isbn: "",
    total_copies: 1,
    available_copies: 1,
  });

  useEffect(() => {
    fetchAuthors();
    fetchCategories();
    return () => {
      // Cleanup scanner on unmount
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear();
      }
    };
  }, []);

  const fetchAuthors = async () => {
    try {
      const authorApi = new DataApi("author");
      const response = await authorApi.fetchAll();
      if (response.data && Array.isArray(response.data)) {
        setAuthors(response.data);
      }
    } catch (error) {
      console.error("Error fetching authors:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoryApi = new DataApi("category");
      const response = await categoryApi.fetchAll();
      if (response.data && Array.isArray(response.data)) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchBookDetailsFromISBN = async (isbn) => {
    try {
      setLoading(true);
      // Try Open Library API
      const response = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
      if (response.ok) {
        const data = await response.json();
        
        // Extract book details
        const title = data.title || "";
        const authorNames = data.authors?.map(author => author.name || "") || [];
        const authorName = authorNames[0] || "";
        
        // Find matching author in our database
        const author = authors.find(a => 
          a.name && a.name.toLowerCase().includes(authorName.toLowerCase())
        );

        // Try to get more details
        let description = "";
        if (data.description) {
          description = typeof data.description === 'string' 
            ? data.description 
            : data.description.value || "";
        }

        setBookDetails({
          title,
          authorName,
          author_id: author ? author.id : "",
          isbn: isbn,
          description
        });

        // Auto-fill form
        setFormData({
          title: title,
          author_id: author ? author.id : "",
          category_id: "",
          isbn: isbn,
          total_copies: 1,
          available_copies: 1,
        });

        setShowFormModal(true);
        PubSub.publish("RECORD_SAVED_TOAST", {
          title: "Success",
          message: "Book details fetched successfully!",
        });
      } else {
        // If Open Library doesn't have it, just use ISBN
        setFormData({
          title: "",
          author_id: "",
          category_id: "",
          isbn: isbn,
          total_copies: 1,
          available_copies: 1,
        });
        setShowFormModal(true);
        PubSub.publish("RECORD_SAVED_TOAST", {
          title: "Info",
          message: "ISBN scanned. Please fill in the details manually.",
        });
      }
    } catch (error) {
      console.error("Error fetching book details:", error);
      // Still open form with ISBN
      setFormData({
        title: "",
        author_id: "",
        category_id: "",
        isbn: isbn,
        total_copies: 1,
        available_copies: 1,
      });
      setShowFormModal(true);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Could not fetch book details. Please fill manually.",
      });
    } finally {
      setLoading(false);
    }
  };

  const startScanner = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear();
    }

    setScanning(true);
    setScannedData(null);

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      supportedScanTypes: [0, 1], // Support both QR code and barcode
    };

    const onScanSuccess = (decodedText, decodedResult) => {
      console.log("Scanned:", decodedText);
      setScannedData(decodedText);
      setScanning(false);
      
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear();
      }

      // Assume scanned text is ISBN
      fetchBookDetailsFromISBN(decodedText);
    };

    const onScanFailure = (error) => {
      // Ignore scan failures (continuous scanning)
    };

    try {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        config,
        false
      );
      
      html5QrcodeScannerRef.current = scanner;
      scanner.render(onScanSuccess, onScanFailure);
    } catch (error) {
      console.error("Error starting scanner:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to start camera. Please check permissions.",
      });
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear();
      html5QrcodeScannerRef.current = null;
    }
    setScanning(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "total_copies" || name === "available_copies" ? parseInt(value) || 0 : value
    });
  };

  const handleManualISBN = () => {
    const isbn = prompt("Enter ISBN or Barcode:");
    if (isbn && isbn.trim()) {
      fetchBookDetailsFromISBN(isbn.trim());
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.title.trim()) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Validation Error",
        message: "Title is required",
      });
      return;
    }

    if (!formData.author_id || formData.author_id === "") {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Validation Error",
        message: "Please select an author",
      });
      return;
    }

    if (!formData.category_id || formData.category_id === "") {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Validation Error",
        message: "Please select a category",
      });
      return;
    }

    if (!formData.isbn || !formData.isbn.trim()) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Validation Error",
        message: "ISBN is required",
      });
      return;
    }

    try {
      setLoading(true);
      const bookApi = new DataApi("book");

      const bookData = {
        title: formData.title.trim(),
        author_id: formData.author_id,
        category_id: formData.category_id,
        isbn: formData.isbn.trim(),
        total_copies: parseInt(formData.total_copies) || 1,
        available_copies: parseInt(formData.available_copies) || (parseInt(formData.total_copies) || 1),
      };

      const response = await bookApi.create(bookData);
      if (response.data && response.data.success) {
        PubSub.publish("RECORD_SAVED_TOAST", {
          title: "Success",
          message: "Book added successfully!",
        });
        setShowFormModal(false);
        setFormData({
          title: "",
          author_id: "",
          category_id: "",
          isbn: "",
          total_copies: 1,
          available_copies: 1,
        });
        navigate("/books");
      } else {
        const errorMsg = Array.isArray(response.data?.errors)
          ? response.data.errors.map(e => e.msg || e).join(", ")
          : (response.data?.errors || "Failed to create book");
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Error",
          message: errorMsg,
        });
      }
    } catch (error) {
      console.error("Error saving book:", error);
      const errorMsg = error.response?.data?.errors
        ? (Array.isArray(error.response.data.errors)
          ? error.response.data.errors.map(e => e.msg || e).join(", ")
          : error.response.data.errors)
        : error.message || "Failed to save book";
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid>
      <ScrollToTop />
      <Row className="mb-4">
        <Col>
          <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.1)" }}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0 fw-bold" style={{ color: "#6f42c1" }}>
                  <i className="fa-solid fa-qrcode me-2"></i>Scan Book
                </h4>
                <Button
                  variant="outline-primary"
                  onClick={() => navigate("/books")}
                >
                  <i className="fa-solid fa-arrow-left me-2"></i>Back to Books
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={6} md={12} className="mb-3">
          <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.1)" }}>
            <Card.Body className="p-4">
              <h5 className="mb-3 fw-bold">Barcode Scanner</h5>
              <div className="mb-3">
                {!scanning ? (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={startScanner}
                    style={{
                      background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                      border: "none",
                      width: "100%",
                    }}
                  >
                    <i className="fa-solid fa-camera me-2"></i>Start Scanner
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    size="lg"
                    onClick={stopScanner}
                    style={{ width: "100%" }}
                  >
                    <i className="fa-solid fa-stop me-2"></i>Stop Scanner
                  </Button>
                )}
              </div>

              <div className="mb-3">
                <Button
                  variant="outline-secondary"
                  onClick={handleManualISBN}
                  style={{ width: "100%" }}
                >
                  <i className="fa-solid fa-keyboard me-2"></i>Enter ISBN Manually
                </Button>
              </div>

              {scanning && (
                <div id="qr-reader" style={{ width: "100%", marginTop: "20px" }}></div>
              )}

              {scannedData && !scanning && (
                <Alert variant="success" className="mt-3">
                  <strong>Scanned:</strong> {scannedData}
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} md={12} className="mb-3">
          <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.1)" }}>
            <Card.Body className="p-4">
              <h5 className="mb-3 fw-bold">Instructions</h5>
              <ol>
                <li>Click "Start Scanner" to activate your camera</li>
                <li>Point the camera at the book's barcode or ISBN</li>
                <li>The scanner will automatically detect and fetch book details</li>
                <li>Review and fill in any missing information</li>
                <li>Click "Save Book" to add it to the library</li>
              </ol>
              <div className="mt-3">
                <Alert variant="info">
                  <strong>Tip:</strong> You can also manually enter ISBN using the "Enter ISBN Manually" button.
                </Alert>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Book Form Modal */}
      <Modal show={showFormModal} onHide={() => setShowFormModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fa-solid fa-book me-2" style={{ color: "#6f42c1" }}></i>
            Add Book
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {bookDetails && (
            <Alert variant="success" className="mb-3">
              <strong>Book details fetched!</strong> Please review and complete the form.
            </Alert>
          )}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter book title"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Author <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="author_id"
                value={formData.author_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Author</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>ISBN <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="isbn"
                value={formData.isbn}
                onChange={handleInputChange}
                placeholder="Enter ISBN"
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Copies</Form.Label>
                  <Form.Control
                    type="number"
                    name="total_copies"
                    value={formData.total_copies}
                    onChange={handleInputChange}
                    min="1"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Available Copies</Form.Label>
                  <Form.Control
                    type="number"
                    name="available_copies"
                    value={formData.available_copies}
                    onChange={handleInputChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFormModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
              border: "none",
            }}
          >
            {loading ? "Saving..." : "Save Book"}
          </Button>
        </Modal.Footer>
      </Modal>

      {loading && <Loader />}
    </Container>
  );
};

export default ScanBook;

