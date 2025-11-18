import React, { useState, useEffect, useRef } from "react";
import { Modal, Form, InputGroup, Button, ListGroup, Badge, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import DataApi from "../../api/dataApi";
import PubSub from "pubsub-js";

const UniversalSearch = ({ show, onHide, initialQuery = "" }) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState({
    books: [],
    authors: [],
    categories: [],
    suppliers: [],
    users: [],
    libraryCards: [],
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (show && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [show]);

  useEffect(() => {
    if (show && initialQuery) {
      setSearchQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [show, initialQuery]);

  const handleSearch = async (query) => {
    if (!query || query.trim().length === 0) {
      setSearchResults({
        books: [],
        authors: [],
        categories: [],
        suppliers: [],
        users: [],
        libraryCards: [],
      });
      return;
    }

    setLoading(true);
    const searchTerm = query.trim().toLowerCase();

    try {
      // Search in parallel across all modules
      const [booksRes, authorsRes, categoriesRes, suppliersRes, usersRes, cardsRes] = await Promise.all([
        searchBooks(searchTerm),
        searchAuthors(searchTerm),
        searchCategories(searchTerm),
        searchSuppliers(searchTerm),
        searchUsers(searchTerm),
        searchLibraryCards(searchTerm),
      ]);

      setSearchResults({
        books: booksRes,
        authors: authorsRes,
        categories: categoriesRes,
        suppliers: suppliersRes,
        users: usersRes,
        libraryCards: cardsRes,
      });
    } catch (error) {
      console.error("Error in universal search:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchBooks = async (searchTerm) => {
    try {
      const bookApi = new DataApi("book");
      const response = await bookApi.fetchAll();
      if (response.data && Array.isArray(response.data)) {
        return response.data.filter(
          (book) =>
            (book.title && book.title.toLowerCase().includes(searchTerm)) ||
            (book.isbn && book.isbn.includes(searchTerm)) ||
            (book.author_name && book.author_name.toLowerCase().includes(searchTerm)) ||
            (book.category_name && book.category_name.toLowerCase().includes(searchTerm))
        );
      }
    } catch (error) {
      console.error("Error searching books:", error);
    }
    return [];
  };

  const searchAuthors = async (searchTerm) => {
    try {
      const authorApi = new DataApi("author");
      const response = await authorApi.fetchAll();
      if (response.data && Array.isArray(response.data)) {
        return response.data.filter(
          (author) =>
            (author.name && author.name.toLowerCase().includes(searchTerm)) ||
            (author.email && author.email.toLowerCase().includes(searchTerm))
        );
      }
    } catch (error) {
      console.error("Error searching authors:", error);
    }
    return [];
  };

  const searchCategories = async (searchTerm) => {
    try {
      const categoryApi = new DataApi("category");
      const response = await categoryApi.fetchAll();
      if (response.data && Array.isArray(response.data)) {
        return response.data.filter(
          (category) => category.name && category.name.toLowerCase().includes(searchTerm)
        );
      }
    } catch (error) {
      console.error("Error searching categories:", error);
    }
    return [];
  };

  const searchSuppliers = async (searchTerm) => {
    try {
      const supplierApi = new DataApi("supplier");
      const response = await supplierApi.fetchAll();
      if (response.data && Array.isArray(response.data)) {
        return response.data.filter((supplier) => {
          const nameMatch = supplier.name && supplier.name.toLowerCase().includes(searchTerm);
          let contactMatch = false;
          if (supplier.contact_info) {
            try {
              const contact = typeof supplier.contact_info === "string" 
                ? JSON.parse(supplier.contact_info) 
                : supplier.contact_info;
              contactMatch =
                (contact.email && contact.email.toLowerCase().includes(searchTerm)) ||
                (contact.phone && contact.phone.includes(searchTerm));
            } catch (e) {
              // Ignore parse errors
            }
          }
          return nameMatch || contactMatch;
        });
      }
    } catch (error) {
      console.error("Error searching suppliers:", error);
    }
    return [];
  };

  const searchUsers = async (searchTerm) => {
    try {
      const userApi = new DataApi("user");
      const response = await userApi.fetchAll();
      if (response.data && Array.isArray(response.data)) {
        return response.data.filter(
          (user) =>
            (user.firstname && user.firstname.toLowerCase().includes(searchTerm)) ||
            (user.lastname && user.lastname.toLowerCase().includes(searchTerm)) ||
            (user.email && user.email.toLowerCase().includes(searchTerm))
        );
      }
    } catch (error) {
      console.error("Error searching users:", error);
    }
    return [];
  };

  const searchLibraryCards = async (searchTerm) => {
    try {
      const cardApi = new DataApi("librarycard");
      const response = await cardApi.fetchAll();
      if (response.data && Array.isArray(response.data)) {
        return response.data.filter(
          (card) =>
            (card.card_number && card.card_number.includes(searchTerm)) ||
            (card.user_name && card.user_name.toLowerCase().includes(searchTerm)) ||
            (card.student_name && card.student_name.toLowerCase().includes(searchTerm))
        );
      }
    } catch (error) {
      console.error("Error searching library cards:", error);
    }
    return [];
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Auto-search as user types (debounced)
    if (value.trim().length > 2) {
      const timeoutId = setTimeout(() => {
        handleSearch(value);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults({
        books: [],
        authors: [],
        categories: [],
        suppliers: [],
        users: [],
        libraryCards: [],
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const getTotalResults = () => {
    return (
      searchResults.books.length +
      searchResults.authors.length +
      searchResults.categories.length +
      searchResults.suppliers.length +
      searchResults.users.length +
      searchResults.libraryCards.length
    );
  };

  const renderResults = () => {
    const allResults = [
      ...searchResults.books.map((item) => ({ ...item, type: "book", module: "/books" })),
      ...searchResults.authors.map((item) => ({ ...item, type: "author", module: "/author" })),
      ...searchResults.categories.map((item) => ({ ...item, type: "category", module: "/category" })),
      ...searchResults.suppliers.map((item) => ({ ...item, type: "supplier", module: "/supplier" })),
      ...searchResults.users.map((item) => ({ ...item, type: "user", module: "/user" })),
      ...searchResults.libraryCards.map((item) => ({ ...item, type: "libraryCard", module: "/librarycard" })),
    ];

    if (allResults.length === 0 && !loading && searchQuery.trim().length > 2) {
      return (
        <div className="text-center py-5">
          <i className="fa-solid fa-search" style={{ fontSize: "48px", color: "#ccc", marginBottom: "16px" }}></i>
          <p style={{ color: "#6c757d" }}>No results found</p>
        </div>
      );
    }

    if (allResults.length === 0 && searchQuery.trim().length <= 2) {
      return (
        <div className="text-center py-5">
          <i className="fa-solid fa-barcode" style={{ fontSize: "48px", color: "#e9d5ff", marginBottom: "16px" }}></i>
          <p style={{ color: "#6c757d" }}>Enter at least 3 characters or scan a barcode to search</p>
        </div>
      );
    }

    return (
      <ListGroup variant="flush">
        {allResults.map((item, index) => (
          <ListGroup.Item
            key={`${item.type}-${item.id || index}`}
            action
            onClick={() => {
              navigate(item.module);
              onHide();
            }}
            style={{
              cursor: "pointer",
              borderLeft: `4px solid ${
                item.type === "book" ? "#6f42c1" :
                item.type === "author" ? "#0d6efd" :
                item.type === "category" ? "#28a745" :
                item.type === "supplier" ? "#ffc107" :
                item.type === "user" ? "#17a2b8" :
                "#8b5cf6"
              }`,
              padding: "12px 16px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f8f9fa";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
            }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div style={{ flex: 1 }}>
                <div className="d-flex align-items-center mb-1">
                  <Badge
                    bg={
                      item.type === "book" ? "primary" :
                      item.type === "author" ? "info" :
                      item.type === "category" ? "success" :
                      item.type === "supplier" ? "warning" :
                      item.type === "user" ? "secondary" :
                      "purple"
                    }
                    className="me-2"
                    style={{ fontSize: "11px" }}
                  >
                    {item.type === "libraryCard" ? "Card" : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </Badge>
                  <strong style={{ fontSize: "14px" }}>
                    {item.title || item.name || `${item.firstname || ""} ${item.lastname || ""}`.trim() || item.card_number || "N/A"}
                  </strong>
                </div>
                <div style={{ fontSize: "12px", color: "#6c757d", marginTop: "4px" }}>
                  {item.type === "book" && (
                    <>
                      {item.isbn && <span>ISBN: {item.isbn}</span>}
                      {item.author_name && <span className="ms-2">Author: {item.author_name}</span>}
                      {item.category_name && <span className="ms-2">Category: {item.category_name}</span>}
                    </>
                  )}
                  {item.type === "author" && item.email && <span>Email: {item.email}</span>}
                  {item.type === "supplier" && item.contact_info && (
                    <span>
                      {(() => {
                        try {
                          const contact = typeof item.contact_info === "string" 
                            ? JSON.parse(item.contact_info) 
                            : item.contact_info;
                          return contact.email || contact.phone || "";
                        } catch (e) {
                          return "";
                        }
                      })()}
                    </span>
                  )}
                  {item.type === "user" && item.email && <span>Email: {item.email}</span>}
                  {item.type === "libraryCard" && item.user_name && <span>User: {item.user_name}</span>}
                </div>
              </div>
              <i className="fa-solid fa-chevron-right" style={{ color: "#ccc", fontSize: "12px" }}></i>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    );
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header
        closeButton
        style={{
          background: "linear-gradient(135deg, #e9d5ff 0%, #f3e8ff 100%)",
          borderBottom: "none",
        }}
      >
        <Modal.Title style={{ color: "#6f42c1", fontWeight: "600" }}>
          <i className="fa-solid fa-search me-2"></i>Universal Library Search
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: "24px", maxHeight: "70vh", overflowY: "auto" }}>
        <Form onSubmit={handleSubmit}>
          <InputGroup className="mb-3">
            <InputGroup.Text style={{ background: "#e9d5ff", borderColor: "#e9ecef" }}>
              <i className="fa-solid fa-barcode" style={{ color: "#6f42c1" }}></i>
            </InputGroup.Text>
            <Form.Control
              ref={inputRef}
              type="text"
              placeholder="Scan barcode or search by ISBN, title, author, category, supplier, user..."
              value={searchQuery}
              onChange={handleInputChange}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSubmit(e);
                }
              }}
              style={{
                borderColor: "#e9ecef",
                fontSize: "14px",
                padding: "10px 12px",
              }}
              autoFocus
            />
            <Button
              type="submit"
              variant="outline-primary"
              disabled={loading}
              style={{
                borderColor: "#8b5cf6",
                color: "#6f42c1",
                background: "#e9d5ff",
              }}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm"></span>
              ) : (
                <i className="fa-solid fa-search"></i>
              )}
            </Button>
          </InputGroup>
        </Form>

        {loading && (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Searching...</span>
            </div>
            <p className="mt-2 text-muted">Searching across all modules...</p>
          </div>
        )}

        {!loading && searchQuery.trim().length > 2 && (
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <strong style={{ fontSize: "14px", color: "#6f42c1" }}>
                Search Results ({getTotalResults()})
              </strong>
            </div>
            {renderResults()}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default UniversalSearch;

