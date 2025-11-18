import React, { useState, useEffect } from "react";
import { Modal, Button, Tab, Nav, Form, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import PubSub from "pubsub-js";
import Select from 'react-select';

const QuickActions = ({ show, onHide, actionType }) => {
  const navigate = useNavigate();
  const [barcodeInput, setBarcodeInput] = useState("");
  const [activeTab, setActiveTab] = useState("barcode");
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedLibraryCard, setSelectedLibraryCard] = useState(null);
  const [books, setBooks] = useState([]);
  const [libraryCards, setLibraryCards] = useState([]);
  const [userDetails, setUserDetails] = useState(null);

  // Mock data for books and library cards
  useEffect(() => {
    // Simulating API call to fetch books
    const mockBooks = [
      { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "9780743273565" },
      { id: 2, title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "9780061120084" },
      { id: 3, title: "1984", author: "George Orwell", isbn: "9780451524935" },
      { id: 4, title: "Pride and Prejudice", author: "Jane Austen", isbn: "9780141439518" },
    ];

    // Simulating API call to fetch library cards
    const mockLibraryCards = [
      { id: 1, cardNumber: "LC001", userName: "John Doe", email: "john@example.com", phone: "+1-555-0101" },
      { id: 2, cardNumber: "LC002", userName: "Jane Smith", email: "jane@example.com", phone: "+1-555-0102" },
      { id: 3, cardNumber: "LC003", userName: "Bob Johnson", email: "bob@example.com", phone: "+1-555-0103" },
    ];

    // Transform data for React Select
    const bookOptions = mockBooks.map(book => ({
      value: book.id,
      label: `${book.title} - ${book.author}`,
      data: book
    }));

    const libraryCardOptions = mockLibraryCards.map(card => ({
      value: card.id,
      label: `${card.cardNumber} - ${card.userName}`,
      data: card
    }));

    setBooks(bookOptions);
    setLibraryCards(libraryCardOptions);
  }, []);

  // Fetch user details when library card is selected
  useEffect(() => {
    if (selectedLibraryCard) {
      setUserDetails(selectedLibraryCard.data);
    } else {
      setUserDetails(null);
    }
  }, [selectedLibraryCard]);

  const handleManualAction = () => {
    onHide();
    if (actionType === "book") {
      navigate("/books");
      setTimeout(() => {
        PubSub.publish("OPEN_ADD_BOOK_MODAL");
      }, 100);
    } else if (actionType === "bookissue") {
      navigate("/bookissue");
      setTimeout(() => {
        PubSub.publish("OPEN_ADD_BOOK_ISSUE_MODAL");
      }, 100);
    } else if (actionType === "author") {
      navigate("/author");
      setTimeout(() => {
        PubSub.publish("OPEN_ADD_AUTHOR_MODAL");
      }, 100);
    }
  };

  const handleBarcodeScan = () => {
    onHide();
    setTimeout(() => {
      PubSub.publish("OPEN_BARCODE_SCANNER");
    }, 100);
  };

  const handleBookIssue = () => {
    if (!selectedBook || !selectedLibraryCard) {
      alert("Please select both a book and a library card");
      return;
    }

    // Here you would typically make an API call to issue the book
    const selectedBookData = selectedBook.data;
    const selectedUserData = selectedLibraryCard.data;

    console.log("Issuing book:", {
      book: selectedBookData,
      user: selectedUserData
    });

    // Show success message or navigate
    alert(`Book "${selectedBookData.title}" issued to ${selectedUserData.userName} successfully!`);
    onHide();

    // Reset form
    setSelectedBook(null);
    setSelectedLibraryCard(null);
    setUserDetails(null);
  };

  // Custom styles for React Select
  const customStyles = {
    control: (base, state) => ({
      ...base,
      border: '2px solid #8b5cf6',
      borderRadius: '8px',
      padding: '4px 8px',
      fontSize: '14px',
      boxShadow: 'none',
      minHeight: '44px',
      '&:hover': {
        borderColor: '#7c3aed'
      }
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#8b5cf6' : state.isFocused ? '#f3e8ff' : 'white',
      color: state.isSelected ? 'white' : '#374151',
      padding: '8px 12px',
      fontSize: '14px',
      cursor: 'pointer'
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      zIndex: 9999
    }),
    placeholder: (base) => ({
      ...base,
      color: '#9ca3af',
      fontSize: '14px'
    }),
    singleValue: (base) => ({
      ...base,
      color: '#374151',
      fontSize: '14px'
    })
  };

  // const getActionInfo = () => {
  //   switch (actionType) {
  //     case "book":
  //       return {
  //         title: "Add Book",
  //         icon: "fa-book",
  //         manualLabel: "Add Book Manually",
  //         barcodeLabel: "Scan Book Barcode",
  //       };
  //     case "bookissue":
  //       return {
  //         title: "Issue Book",
  //         icon: "fa-hand-holding",
  //         manualLabel: "Issue Book Manually",
  //         barcodeLabel: "Scan Book/User Barcode",
  //       };
  //     case "author":
  //       return {
  //         title: "Add Author",
  //         icon: "fa-user-pen",
  //         manualLabel: "Add Author Manually",
  //         barcodeLabel: "Scan Author Barcode",
  //       };
  //     default:
  //       return {
  //         title: "Quick Action",
  //         icon: "fa-plus",
  //         manualLabel: "Manual Entry",
  //         barcodeLabel: "Scan Barcode",
  //       };
  //   }
  // };

  // const actionInfo = getActionInfo();

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #e9d5ff 0%, #f3e8ff 100%)", borderBottom: "none" }}>
        {/* <Modal.Title style={{ color: "#6f42c1", fontWeight: "600" }}>
          <i className={`fa-solid ${actionInfo.icon} me-2`}></i>
          {actionInfo.title}
        </Modal.Title> */}
      </Modal.Header>

      <Tab.Container activeKey={activeTab}>
        <Tab.Content>
          <Tab.Pane eventKey="barcode">
            {actionType === "bookissue" ? (
              <div>
                {/* Two Column Layout for Book and Library Card Selection */}
                <Row className="g-3 mb-4">
                  {/* Book Selection Column */}
                  <Col md={6}>
                    <div className="h-100">
                      <label style={{ fontWeight: "600", color: "#495057", marginBottom: "8px", display: "block" }}>
                        <i className="fa-solid fa-book me-2"></i>
                        Select Book
                      </label>
                      <Select
                        value={selectedBook}
                        onChange={setSelectedBook}
                        options={books}
                        styles={customStyles}
                        placeholder="Search or select book..."
                        isSearchable
                        noOptionsMessage={() => "No books found"}
                      />
                      <div className="text-end mt-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            const randomBook = books[Math.floor(Math.random() * books.length)];
                            setSelectedBook(randomBook);
                          }}
                          style={{
                            border: "1px solid #8b5cf6",
                            color: "#8b5cf6",
                            borderRadius: "6px",
                            padding: "4px 12px",
                            fontSize: "12px"
                          }}
                        >
                          <i className="fa-solid fa-barcode me-1"></i>
                          Scan Book
                        </Button>
                      </div>
                    </div>
                  </Col>

                  {/* Library Card Selection Column */}
                  <Col md={6}>
                    <div className="h-100">
                      <label style={{ fontWeight: "600", color: "#495057", marginBottom: "8px", display: "block" }}>
                        <i className="fa-solid fa-address-card me-2"></i>
                        Select Library Card
                      </label>
                      <Select
                        value={selectedLibraryCard}
                        onChange={setSelectedLibraryCard}
                        options={libraryCards}
                        styles={customStyles}
                        placeholder="Search or select card..."
                        isSearchable
                        noOptionsMessage={() => "No library cards found"}
                      />
                      <div className="text-end mt-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            const randomCard = libraryCards[Math.floor(Math.random() * libraryCards.length)];
                            setSelectedLibraryCard(randomCard);
                          }}
                          style={{
                            border: "1px solid #8b5cf6",
                            color: "#8b5cf6",
                            borderRadius: "6px",
                            padding: "4px 12px",
                            fontSize: "12px"
                          }}
                        >
                          <i className="fa-solid fa-barcode me-1"></i>
                          Scan Card
                        </Button>
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* User Details Display - Full Width */}
                {userDetails && (
                  <div
                    style={{
                      border: "2px solid #e9d5ff",
                      borderRadius: "12px",
                      padding: "20px",
                      backgroundColor: "#faf5ff",
                      marginBottom: "24px",
                      boxShadow: "0 2px 4px rgba(139, 92, 246, 0.1)"
                    }}
                  >
                    <Row className="align-items-center">
                      <Col md={8}>
                        <h6 style={{ color: "#6f42c1", fontWeight: "600", marginBottom: "8px" }}>
                          <i className="fa-solid fa-user-circle me-2"></i>
                          User Details
                        </h6>
                        <Row>
                          <Col sm={6}>
                            <div style={{ marginBottom: "8px" }}>
                              <strong style={{ color: "#6f42c1", display: "block", fontSize: "12px" }}>Full Name</strong>
                              <span style={{ fontSize: "14px", fontWeight: "500" }}>{userDetails.userName}</span>
                            </div>
                            <div style={{ marginBottom: "8px" }}>
                              <strong style={{ color: "#6f42c1", display: "block", fontSize: "12px" }}>Card Number</strong>
                              <span style={{ fontSize: "14px", fontWeight: "500" }}>{userDetails.cardNumber}</span>
                            </div>
                          </Col>
                          <Col sm={6}>
                            <div style={{ marginBottom: "8px" }}>
                              <strong style={{ color: "#6f42c1", display: "block", fontSize: "12px" }}>Email</strong>
                              <span style={{ fontSize: "14px", fontWeight: "500" }}>{userDetails.email}</span>
                            </div>
                            <div style={{ marginBottom: "8px" }}>
                              <strong style={{ color: "#6f42c1", display: "block", fontSize: "12px" }}>Phone</strong>
                              <span style={{ fontSize: "14px", fontWeight: "500" }}>{userDetails.phone}</span>
                            </div>
                          </Col>
                        </Row>
                      </Col>
                      <Col md={4} className="text-center">
                        <div style={{
                          padding: "12px",
                          backgroundColor: "#dcfce7",
                          borderRadius: "8px",
                          display: "inline-block"
                        }}>
                          <i className="fa-solid fa-circle-check me-2" style={{ color: "#16a34a", fontSize: "18px" }}></i>
                          <span style={{ color: "#166534", fontWeight: "600", fontSize: "14px" }}>Active Member</span>
                        </div>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Issue Book Button */}
                <div className="text-center">
                  <Button
                    onClick={handleBookIssue}
                    disabled={!selectedBook || !selectedLibraryCard}
                    style={{
                      background: (selectedBook && selectedLibraryCard)
                        ? "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)"
                        : "#ccc",
                      border: "none",
                      padding: "14px 32px",
                      fontWeight: "600",
                      borderRadius: "8px",
                      width: "100%",
                      fontSize: "16px",
                      transition: "all 0.3s ease"
                    }}
                  >
                    <i className="fa-solid fa-hand-holding me-2"></i>
                    {userDetails ? `Issue Book to ${userDetails.userName}` : 'Issue Book'}
                  </Button>
                </div>
              </div>
            ) : (
              // Original barcode scan for other actions
              <div className="text-center py-4">
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    margin: "0 auto 20px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #e9d5ff 0%, #f3e8ff 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i className="fa-solid fa-barcode" style={{ fontSize: "32px", color: "#6f42c1" }}></i>
                </div>
                {/* <p style={{ color: "#6c757d", marginBottom: "24px" }}>{actionInfo.barcodeLabel}</p> */}
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter or scan barcode..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && barcodeInput.trim()) {
                        handleBarcodeScan();
                      }
                    }}
                    autoFocus
                    style={{
                      border: "2px solid #8b5cf6",
                      borderRadius: "8px",
                      padding: "12px",
                      fontSize: "16px",
                    }}
                  />
                </div>
                <Button
                  onClick={handleBarcodeScan}
                  disabled={!barcodeInput.trim()}
                  style={{
                    background: barcodeInput.trim()
                      ? "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)"
                      : "#ccc",
                    border: "none",
                    padding: "10px 32px",
                  }}
                >
                  <i className="fa-solid fa-barcode me-2"></i>Scan Now
                </Button>
              </div>
            )}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Modal>
  );
};

export default QuickActions;