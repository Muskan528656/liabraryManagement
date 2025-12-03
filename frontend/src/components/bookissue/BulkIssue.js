import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  Row,
  Col,
  Button,
  Form,
  Alert,
  Spinner,
  ProgressBar,
  Badge,
} from "react-bootstrap";
import Select from "react-select";
import DataApi from "../../api/dataApi";
import helper from "../common/helper";
import PubSub from "pubsub-js";
import * as constants from "../../constants/CONSTANT";

const BulkIssue = () => {
  const [books, setBooks] = useState([]);
  const [libraryCards, setLibraryCards] = useState([]);
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [librarySettings, setLibrarySettings] = useState({});

  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBooks, setSelectedBooks] = useState([]);

  const [durationDays, setDurationDays] = useState(7);
  const [maxBooksPerCard, setMaxBooksPerCard] = useState(1);
  const [memberAllowedBooks, setMemberAllowedBooks] = useState(1);
  const [effectiveAllowedBooks, setEffectiveAllowedBooks] = useState(1);

  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [memberInfo, setMemberInfo] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (issueDate) {
      const duration = durationDays || 15;
      const d = new Date(issueDate);
      d.setDate(d.getDate() + duration);
      setDueDate(d.toISOString().split("T")[0]);
    }
  }, [issueDate, durationDays]);

  // Reset member info when card changes
  useEffect(() => {
    if (selectedCard) {
      loadMemberInfo(selectedCard.value);
    } else {
      setMemberInfo(null);
      setMemberAllowedBooks(maxBooksPerCard);
      setEffectiveAllowedBooks(maxBooksPerCard);
    }
  }, [selectedCard, maxBooksPerCard]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const bookApi = new DataApi("book");
      const cardApi = new DataApi("librarycard");
      const userApi = new DataApi("user");
      const issueApi = new DataApi("bookissue");
      const settingsApi = new DataApi("librarysettings");

      const [booksResp, cardsResp, usersResp, issuesResp, settingsResp] =
        await Promise.all([
          bookApi.fetchAll(),
          cardApi.fetchAll(),
          userApi.fetchAll(),
          issueApi.fetchAll(),
          settingsRespTry(settingsApi),
        ]);

      const booksList = normalize(booksResp);
      const cardsList = normalize(cardsResp);
      const usersList = normalize(usersResp);
      const issuesList = normalize(issuesResp);

      setBooks(booksList);
      setUsers(usersList);
      setLibraryCards(
        cardsList.filter((c) => c.is_active === true || c.is_active === "true")
      );

      const activeIssues = issuesList.filter(
        (issue) =>
          issue.status !== "returned" &&
          (issue.return_date == null || issue.return_date === undefined)
      );
      setIssuedBooks(activeIssues);

      if (settingsResp && typeof settingsResp === "object") {
        const dur =
          parseInt(settingsResp.duration_days) ||
          parseInt(settingsResp?.data?.duration_days) ||
          7;
        const maxBooks =
          parseInt(settingsResp.max_books_per_card) ||
          parseInt(settingsResp?.data?.max_books_per_card) ||
          1;
        setDurationDays(dur);
        setMaxBooksPerCard(maxBooks);
        setLibrarySettings(settingsResp);
        // Initialize with system max
        setMemberAllowedBooks(maxBooks);
        setEffectiveAllowedBooks(maxBooks);
      }
    } catch (err) {
      console.error("Error fetching lists:", err);
      showErrorToast("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadMemberInfo = async (cardId) => {
    try {
      // Fetch detailed member info including allowed_books
      const cardApi = new DataApi("librarycard");
      const memberResp = await cardApi.fetchById(cardId);
      
      if (memberResp && memberResp.data) {
        const member = memberResp.data;
        setMemberInfo(member);
        
        // Get member's allowed_books, default to system max if not set
        const memberAllowed = parseInt(member.allowed_books) || maxBooksPerCard;
        setMemberAllowedBooks(memberAllowed);
        
        // Effective allowed = min(member_allowed, system_max)
        const effective = Math.min(memberAllowed, maxBooksPerCard);
        setEffectiveAllowedBooks(effective);
      }
    } catch (err) {
      console.error("Error loading member info:", err);
    }
  };

  const normalize = (resp) => {
    if (Array.isArray(resp?.data)) return resp.data;
    if (Array.isArray(resp)) return resp;
    return [];
  };

  const settingsRespTry = async (settingsApi) => {
    try {
      const r = await settingsApi.get("/all");
      if (r?.data && r.data.success && r.data.data) return r.data.data;
      return r?.data || r;
    } catch (e) {
      return null;
    }
  };

  // Function to find user by card
  const findUserByCardId = (cardId) => {
    if (!cardId) return null;
    
    // पहले card से user खोजें
    const card = libraryCards.find(c => c.id.toString() === cardId.toString());
    if (!card) return null;
    
    // Card में user_id या userId हो तो उससे user ढूंढें
    const userId = card.user_id || card.userId;
    if (userId) {
      return users.find(u => u.id.toString() === userId.toString());
    }
    
    // अगर card में user_name है तो उसका उपयोग करें
    if (card.user_name || card.student_name) {
      return {
        name: card.user_name || card.student_name,
        email: card.email || 'N/A',
        phone: card.phone || 'N/A'
      };
    }
    
    return null;
  };

  const computeIssuedCountForCard = (cardId) => {
    if (!cardId) return 0;
    return issuedBooks.filter(
      (i) =>
        (i.card_id || i.cardId || i.library_card_id)?.toString() ===
        cardId.toString()
    ).length;
  };

  const availableForSelect = (option) => {
    const b = option.data;
    
    // Check available copies
    if (b.available_copies !== undefined && parseInt(b.available_copies) <= 0) {
      return {
        ...option,
        isDisabled: true,
        label: `${b.title} ${b.isbn ? `(${b.isbn})` : ""} (Out of Stock)`
      };
    }

    if (selectedCard) {
      // Check if already issued to this card
      const alreadyIssued = issuedBooks.some(
        (iss) =>
          (
            iss.card_id ||
            iss.cardId ||
            iss.library_card_id
          )?.toString() === selectedCard.value.toString() &&
          iss.book_id?.toString() === b.id.toString() &&
          iss.status !== "returned" &&
          (iss.return_date == null || iss.return_date === undefined)
      );
      
      if (alreadyIssued) {
        return {
          ...option,
          isDisabled: true,
          label: `${b.title} ${b.isbn ? `(${b.isbn})` : ""} (Already Issued)`
        };
      }
    }

    return option;
  };

  const showSuccessToast = (message) => {
    PubSub.publish("RECORD_SUCCESS_TOAST", {
      title: "Success",
      message: message,
    });
  };

  const showErrorToast = (message) => {
    PubSub.publish("RECORD_ERROR_TOAST", {
      title: "Error",
      message: message,
    });
  };

  const showWarningToast = (message) => {
    PubSub.publish("RECORD_WARNING_TOAST", {
      title: "Warning",
      message: message,
    });
  };

  const validateIssuance = () => {
    // 1. Basic validation
    if (!selectedCard) {
      showErrorToast("Please select a library card first.");
      return false;
    }

    if (selectedBooks.length === 0) {
      showErrorToast("Please select at least one book to issue.");
      return false;
    }

    // 2. Check for duplicate book selection in current transaction
    const bookIds = selectedBooks.map(b => b.value);
    const uniqueBookIds = [...new Set(bookIds)];
    if (bookIds.length !== uniqueBookIds.length) {
      showWarningToast("You have selected the same book multiple times. Please select only one copy of each book.");
      return false;
    }

    // 3. Get current issued count
    const issuedCount = computeIssuedCountForCard(selectedCard.value);
    const toIssueCount = selectedBooks.length;
    
    // 4. Check against effective allowed books (min of member_allowed and system_max)
    if (issuedCount + toIssueCount > effectiveAllowedBooks) {
      showErrorToast(
        `Maximum ${effectiveAllowedBooks} books allowed per card. ` +
        `Already issued: ${issuedCount}, Trying to issue: ${toIssueCount}. ` +
        `(Member limit: ${memberAllowedBooks}, System limit: ${maxBooksPerCard})`
      );
      return false;
    }

    // 5. Check for already issued books
    const alreadyIssuedBooks = [];
    selectedBooks.forEach(book => {
      const isAlreadyIssued = issuedBooks.some(
        (iss) =>
          (
            iss.card_id ||
            iss.cardId ||
            iss.library_card_id
          )?.toString() === selectedCard.value.toString() &&
          iss.book_id?.toString() === book.value.toString() &&
          iss.status !== "returned" &&
          (iss.return_date == null || iss.return_date === undefined)
      );
      if (isAlreadyIssued) {
        alreadyIssuedBooks.push(book.data.title);
      }
    });

    if (alreadyIssuedBooks.length > 0) {
      showWarningToast(
        `Following books are already issued to this member: ${alreadyIssuedBooks.join(", ")}. ` +
        `Please select other books.`
      );
      return false;
    }

    // 6. Check available copies
    const unavailableBooks = [];
    selectedBooks.forEach(book => {
      const bookData = book.data;
      if (bookData.available_copies !== undefined && parseInt(bookData.available_copies) <= 0) {
        unavailableBooks.push(bookData.title);
      }
    });

    if (unavailableBooks.length > 0) {
      showErrorToast(
        `Following books are not available (no copies left): ${unavailableBooks.join(", ")}`
      );
      return false;
    }

    // 7. Check if member is active
    if (memberInfo && !memberInfo.is_active) {
      showErrorToast("This library member is inactive. Please select an active member.");
      return false;
    }

    return true;
  };

  const handleIssue = async () => {
    // Validate before proceeding
    if (!validateIssuance()) {
      return;
    }

    setProcessing(true);
    try {
      const successBooks = [];
      const failedBooks = [];
      const memberName = memberInfo ? 
        `${memberInfo.first_name || ''} ${memberInfo.last_name || ''}`.trim() : 
        "Unknown Member";
      
      for (const b of selectedBooks) {
        try {
          const body = {
            book_id: b.value,
            card_id: selectedCard.value,
            issue_date: issueDate,
            due_date: dueDate,
            condition_before: "Good",
            remarks: "",
          };

          const response = await helper.fetchWithAuth(
            `${constants.API_BASE_URL}/api/bookissue/issue`,
            "POST",
            JSON.stringify(body)
          );

          const result = await response.json();
          
          if (response.ok && result.success) {
            successBooks.push({
              title: b.data.title,
              data: result.data
            });
          } else {
            failedBooks.push({
              book: b.data.title,
              error: result.message || result.error || "Unknown error",
              details: result.details || {}
            });
          }
        } catch (bookErr) {
          failedBooks.push({
            book: b.data.title,
            error: "Network error",
            details: { network_error: bookErr.message }
          });
        }
      }

      // Show success/error messages
      if (successBooks.length > 0) {
        const successTitles = successBooks.map(b => b.title);
        const newIssuedCount = computeIssuedCountForCard(selectedCard.value) + successBooks.length;
        const remaining = Math.max(0, effectiveAllowedBooks - newIssuedCount);
        
        showSuccessToast(
          `Successfully issued ${successBooks.length} book(s) to ${memberName}: ` +
          `${successTitles.join(", ")}. ` +
          `Remaining allowed: ${remaining}`
        );
      }
      
      if (failedBooks.length > 0) {
        failedBooks.forEach(failed => {
          let errorMessage = `${failed.book}: ${failed.error}`;
          
          // Add details if available
          if (failed.details && typeof failed.details === 'object') {
            if (failed.details.currently_issued !== undefined && failed.details.member_allowed !== undefined) {
              errorMessage += ` (Issued: ${failed.details.currently_issued}, Allowed: ${failed.details.member_allowed})`;
            }
          }
          
          showErrorToast(errorMessage);
        });
      }

      // Reset and refresh
      if (failedBooks.length === 0) {
        // All successful - reset form
        setSelectedBooks([]);
        setSelectedCard(null);
        setSelectedUser(null);
        setMemberInfo(null);
        fetchAll();
      } else {
        // Some failed - remove only successful books from selection
        const remainingBooks = selectedBooks.filter(book => 
          !successBooks.some(success => success.title === book.data.title)
        );
        setSelectedBooks(remainingBooks);
        
        // Refresh data to get updated counts
        fetchAll();
      }

    } catch (err) {
      console.error("Bulk issue error:", err);
      showErrorToast(
        err.message || "Failed to issue books. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  const issuedCountForSelectedCard = selectedCard
    ? computeIssuedCountForCard(selectedCard.value)
    : 0;
  
  // Calculate remaining books based on effective allowed (min of member_allowed and system_max)
  const remainingForCard = Math.max(
    0,
    effectiveAllowedBooks - issuedCountForSelectedCard
  );

  const bookOptions = books.map((b) => ({
    value: b.id,
    label: `${b.title} ${b.isbn ? `(${b.isbn})` : ""}`,
    subLabel: `Available: ${b.available_copies || 0}`,
    data: b,
  }));

  const cardOptions = libraryCards.map((c) => ({
    value: c.id,
    label: `${c.card_number}`,
    subLabel: c.user_name || c.student_name || "Unknown",
    data: c,
  }));

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      borderColor: "#dee2e6",
      boxShadow: "none",
      "&:hover": { borderColor: "#8b5cf6" },
      padding: "4px",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#8b5cf6"
        : state.isFocused
          ? "#f3f0ff"
          : "white",
      color: state.isDisabled ? "#999" : "inherit",
      cursor: state.isDisabled ? "not-allowed" : "pointer",
    }),
  };

  const getMemberName = () => {
    if (!selectedCard) return "Unknown";
    
    if (memberInfo) {
      return `${memberInfo.first_name || ''} ${memberInfo.last_name || ''}`.trim() ||
             memberInfo.user_name ||
             memberInfo.student_name ||
             "Unknown Member";
    }
    
    const user = findUserByCardId(selectedCard.value);
    return user ? (user.name || user.full_name || user.username) : 
           (selectedCard.data.user_name || selectedCard.data.student_name || "Unknown User");
  };

  return (
    <Container
      fluid
      className="p-4"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      {loading ? (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "300px" }}
        >
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <Row>
          {/* LEFT COLUMN: CARD SELECTION & STATS */}
          <Col lg={4} md={5} className="mb-4">
            {/* 1. Select Library Card */}
            <Card
              className="shadow-sm border-0 mb-4"
              style={{ borderRadius: "16px" }}
            >
              <Card.Body className="p-4">
                <h6 className="fw-bold text-uppercase text-muted small mb-3">
                  Step 1: Select Member
                </h6>
                <Form.Label className="fw-bold">Find Library Card</Form.Label>
                <Select
                  options={cardOptions}
                  value={selectedCard}
                  onChange={(v) => {
                    setSelectedCard(v);
                    setSelectedUser(null);
                    setSelectedBooks([]);
                    setMemberInfo(null);
                  }}
                  isClearable
                  placeholder="Search by card number or name..."
                  styles={customSelectStyles}
                  formatOptionLabel={({ label, subLabel }) => (
                    <div className="d-flex flex-column">
                      <span className="fw-bold">{label}</span>
                      <span className="small text-muted">{subLabel}</span>
                    </div>
                  )}
                />
              </Card.Body>
            </Card>

            {/* 2. Member Profile / Stats Preview */}
            <Card
              className="shadow-sm border-0"
              style={{
                borderRadius: "16px",
                background: selectedCard ? "white" : "#f1f3f5",
                opacity: selectedCard ? 1 : 0.7,
              }}
            >
              <Card.Body className="p-4">
                {!selectedCard ? (
                  <div className="py-4 text-muted text-center">
                    <i className="fa-solid fa-id-card fa-3x mb-3 text-secondary"></i>
                    <p className="mb-0">Select a card above to view member details</p>
                  </div>
                ) : (
                  <>
                    {/* User Details Section */}
                    <div className="text-center mb-3">
                      <div className="mb-2">
                        <i className="fa-solid fa-user-circle fa-2x text-primary"></i>
                      </div>
                      <h5 className="fw-bold mb-1">
                        {getMemberName()}
                      </h5>
                      <div className="small text-muted">
                        Card: {selectedCard.label}
                        {(() => {
                          const user = findUserByCardId(selectedCard.value);
                          return user && user.email ? ` • ${user.email}` : '';
                        })()}
                      </div>
                      
                      {/* Member Status Badge */}
                      {memberInfo && (
                        <Badge 
                          bg={memberInfo.is_active ? "success" : "danger"} 
                          className="mt-2"
                          pill
                        >
                          {memberInfo.is_active ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </div>

                    <hr className="my-3" style={{ borderColor: "#f0f0f0" }} />

                    {/* Limits Information */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="small text-muted">Issuing Limits</span>
                        <Badge bg="info">
                          Effective: {effectiveAllowedBooks}
                        </Badge>
                      </div>
                      <div className="small text-muted mb-1">
                        <div className="d-flex justify-content-between">
                          <span>Member Limit:</span>
                          <span>{memberAllowedBooks}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>System Limit:</span>
                          <span>{maxBooksPerCard}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <Row className="g-2 mb-3">
                      <Col xs={4}>
                        <div className="p-2 bg-light rounded-3">
                          <div className="small text-muted">Issued</div>
                          <div className="h5 mb-0 fw-bold text-primary">
                            {issuedCountForSelectedCard}
                          </div>
                        </div>
                      </Col>
                      <Col xs={4}>
                        <div className="p-2 bg-light rounded-3">
                          <div className="small text-muted">Allowed</div>
                          <div className="h5 mb-0 fw-bold text-dark">
                            {effectiveAllowedBooks}
                          </div>
                        </div>
                      </Col>
                      <Col xs={4}>
                        <div className="p-2 bg-light rounded-3">
                          <div className="small text-muted">Remaining</div>
                          <div className="h5 mb-0 fw-bold text-success">
                            {remainingForCard}
                          </div>
                        </div>
                      </Col>
                    </Row>

                    {/* Progress Bar */}
                    <div className="text-start">
                      <div className="d-flex justify-content-between small mb-1">
                        <span>Usage</span>
                        <span>
                          {Math.round(
                            (issuedCountForSelectedCard / effectiveAllowedBooks) * 100
                          )}
                          %
                        </span>
                      </div>
                      <ProgressBar
                        now={
                          (issuedCountForSelectedCard / effectiveAllowedBooks) * 100
                        }
                        variant={
                          remainingForCard === 0 ? "danger" : 
                          remainingForCard <= 2 ? "warning" : "primary"
                        }
                        style={{ height: "8px", borderRadius: "10px" }}
                      />
                    </div>

                    {/* Warning if member is inactive */}
                    {memberInfo && !memberInfo.is_active && (
                      <Alert variant="danger" className="mt-3 small p-2">
                        <i className="fa-solid fa-triangle-exclamation me-1"></i>
                        This member is inactive and cannot issue books.
                      </Alert>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* RIGHT COLUMN: BOOK SELECTION & ACTION */}
          <Col lg={8} md={7}>
            <Card
              className="shadow-sm border-0"
              style={{ borderRadius: "16px", height: "100%" }}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-uppercase text-muted small mb-0">
                    Step 2: Select Books
                  </h6>
                  {selectedBooks.length > 0 && (
                    <Badge bg="primary" pill>
                      {selectedBooks.length} Selected
                    </Badge>
                  )}
                </div>

                <div className="mb-4">
                  <Select
                    options={bookOptions.map(availableForSelect)}
                    isMulti
                    value={selectedBooks}
                    onChange={(v) => {
                      if (selectedCard && v) {
                        const invalid = v.find((sel) => {
                          const b = sel.data;
                          return issuedBooks.some(
                            (iss) =>
                              (
                                iss.card_id ||
                                iss.cardId ||
                                iss.library_card_id
                              )?.toString() === selectedCard.value.toString() &&
                              iss.book_id?.toString() === b.id.toString() &&
                              iss.status !== "returned"
                          );
                        });
                        if (invalid) {
                          showErrorToast(
                            `Book '${invalid.data.title}' is already issued to this member.`
                          );
                          return;
                        }
                      }
                      setSelectedBooks(v || []);
                    }}
                    controlShouldRenderValue={false}
                    placeholder={
                      !selectedCard
                        ? "Select card first..."
                        : memberInfo && !memberInfo.is_active
                        ? "Member is inactive"
                        : selectedBooks.length >= remainingForCard
                        ? "Limit Reached"
                        : `Select up to ${remainingForCard - selectedBooks.length} more book(s)...`
                    }
                    isDisabled={
                      !selectedCard ||
                      (memberInfo && !memberInfo.is_active) ||
                      remainingForCard === 0 ||
                      selectedBooks.length >= remainingForCard
                    }
                    styles={customSelectStyles}
                    formatOptionLabel={({ label, subLabel, isDisabled }) => (
                      <div className="d-flex justify-content-between align-items-center">
                        <span className={isDisabled ? "text-muted" : ""}>{label}</span>
                        <Badge 
                          bg={isDisabled ? "secondary" : "light"} 
                          text={isDisabled ? "white" : "dark"}
                        >
                          {subLabel}
                        </Badge>
                      </div>
                    )}
                  />
                  
                  {/* Helper messages */}
                  {!selectedCard && (
                    <Form.Text className="text-danger">
                      Please select a library card first.
                    </Form.Text>
                  )}
                  
                  {selectedCard && memberInfo && !memberInfo.is_active && (
                    <Form.Text className="text-danger fw-bold">
                      <i className="fa-solid fa-circle-exclamation me-1"></i>
                      This member is inactive and cannot issue books.
                    </Form.Text>
                  )}
                  
                  {selectedCard && memberInfo && memberInfo.is_active && selectedBooks.length >= remainingForCard && remainingForCard > 0 && (
                    <Form.Text className="text-warning fw-bold">
                      <i className="fa-solid fa-lock me-1"></i>
                      You have selected the maximum allowed books for this transaction.
                    </Form.Text>
                  )}
                  
                  {selectedCard && remainingForCard === 0 && (
                    <Form.Text className="text-danger fw-bold">
                      <i className="fa-solid fa-ban me-1"></i>
                      This card has reached its issue limit.
                    </Form.Text>
                  )}
                  
                  {/* Show limits info */}
                  {selectedCard && remainingForCard > 0 && (
                    <Form.Text className="text-muted small">
                      <i className="fa-solid fa-info-circle me-1"></i>
                      Member can issue {remainingForCard} more book(s). 
                      (Member limit: {memberAllowedBooks}, System limit: {maxBooksPerCard})
                    </Form.Text>
                  )}
                </div>

                {/* SELECTED BOOKS GRID */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">
                    Books to be Issued 
                    {selectedBooks.length > 0 && ` (${selectedBooks.length})`}
                  </h6>
                  {selectedBooks.length === 0 ? (
                    <div
                      className="text-center p-5 border rounded-3"
                      style={{
                        borderStyle: "dashed",
                        borderColor: "#dee2e6",
                        backgroundColor: "#f8f9fa",
                      }}
                    >
                      <i className="fa-solid fa-book-open text-muted fa-2x mb-2 opacity-50"></i>
                      <p className="text-muted mb-0">No books selected yet.</p>
                    </div>
                  ) : (
                    <Row className="g-3">
                      {selectedBooks.map((book) => (
                        <Col xl={6} key={book.value}>
                          <div className="p-3 border rounded-3 d-flex justify-content-between align-items-center position-relative bg-white shadow-sm">
                            <div className="d-flex align-items-center">
                              <div
                                className="me-3 d-flex align-items-center justify-content-center rounded bg-light"
                                style={{ width: "50px", height: "60px" }}
                              >
                                <i className="fa-solid fa-book text-primary fa-lg"></i>
                              </div>
                              <div>
                                <div
                                  className="fw-bold text-dark text-truncate"
                                  style={{ maxWidth: "200px" }}
                                >
                                  {book.data.title}
                                </div>
                                <div className="text-muted small">
                                  ISBN: {book.data.isbn || "N/A"}
                                </div>
                                <div className="text-muted small">
                                  Author: {book.data.author || "Unknown"}
                                </div>
                                <div className="small">
                                  <Badge bg={book.data.available_copies > 0 ? "success" : "danger"}>
                                    Available: {book.data.available_copies || 0}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="light"
                              className="text-danger border-0 shadow-none"
                              size="sm"
                              onClick={() =>
                                setSelectedBooks((prev) =>
                                  prev.filter((x) => x.value !== book.value)
                                )
                              }
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </Button>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  )}
                </div>

                <hr style={{ borderColor: "#f0f0f0" }} />

                {/* DATES & CONFIRM */}
                <Row className="g-3 align-items-end">
                  <Col md={4}>
                    <Form.Label className="fw-bold small text-muted text-uppercase">
                      Issue Date
                    </Form.Label>
                    <Form.Control
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label className="fw-bold small text-muted text-uppercase">
                      Due Date
                    </Form.Label>
                    <Form.Control
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      min={issueDate}
                    />
                    <Form.Text className="text-muted small">
                      Duration: {durationDays} days
                    </Form.Text>
                  </Col>
                  <Col md={4}>
                    <Button
                      className="w-100 py-2 fw-bold text-white border-0"
                      style={{
                        background:
                          "linear-gradient(135deg, rgb(111, 66, 193) 0%, rgb(139, 92, 246) 100%)",
                        boxShadow: "0 4px 12px rgba(111, 66, 193, 0.3)",
                      }}
                      onClick={handleIssue}
                      disabled={
                        processing ||
                        selectedBooks.length === 0 ||
                        !selectedCard ||
                        (memberInfo && !memberInfo.is_active) ||
                        (selectedCard && selectedBooks.length > remainingForCard)
                      }
                    >
                      {processing ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            className="me-2"
                          />{" "}
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-book me-2"></i>
                          Confirm Issue ({selectedBooks.length})
                        </>
                      )}
                    </Button>
                    
                    {/* Summary info */}
                    {selectedBooks.length > 0 && selectedCard && (
                      <div className="mt-2 small text-center">
                        <span className="text-muted">
                          Issuing {selectedBooks.length} book(s) to {getMemberName()}
                        </span>
                        <br />
                        <span className="text-muted">
                          Will have {issuedCountForSelectedCard + selectedBooks.length} issued, 
                          {remainingForCard - selectedBooks.length} remaining
                        </span>
                      </div>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default BulkIssue;