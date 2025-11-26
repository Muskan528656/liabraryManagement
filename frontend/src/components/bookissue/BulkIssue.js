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
  const [users, setUsers] = useState([]);
  const [issuedBooks, setIssuedBooks] = useState([]);

  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBooks, setSelectedBooks] = useState([]);

  const [durationDays, setDurationDays] = useState(7);
  const [maxBooksPerCard, setMaxBooksPerCard] = useState(1);

  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // --- Effects ---
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

  // --- Data Fetching ---
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

      // Normalize responses
      const booksList = normalize(booksResp);
      const cardsList = normalize(cardsResp);
      const usersList = normalize(usersResp);
      const issuesList = normalize(issuesResp);

      setBooks(booksList);
      setLibraryCards(
        cardsList.filter((c) => c.is_active === true || c.is_active === "true")
      );
      setUsers(usersList);

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
      }
    } catch (err) {
      console.error("Error fetching lists:", err);
    } finally {
      setLoading(false);
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

  // --- Logic Helpers ---
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
    if (b.available_copies !== undefined && parseInt(b.available_copies) <= 0)
      return false;

    if (selectedCard) {
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
      if (alreadyIssued) return false;
    }
    return true;
  };

  const handleIssue = async () => {
    if ((!selectedCard && !selectedUser) || selectedBooks.length === 0) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Validation",
        message: "Select a card and at least one book",
      });
      return;
    }

    if (selectedCard) {
      const issuedCount = computeIssuedCountForCard(selectedCard.value);
      const toIssueCount = selectedBooks.length;
      if (issuedCount + toIssueCount > (parseInt(maxBooksPerCard) || 1)) {
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Limit Exceeded",
          message: `Limit: ${maxBooksPerCard}. Selected: ${toIssueCount}, Issued: ${issuedCount}.`,
        });
        return;
      }
    }

    setProcessing(true);
    try {
      for (const b of selectedBooks) {
        const body = {
          book_id: b.value,
          issue_date: issueDate,
          due_date: dueDate,
          condition_before: "Good",
          remarks: "",
        };
        if (selectedCard) body.card_id = selectedCard.value;
        else if (selectedUser) body.issued_to = selectedUser.value;

        await helper.fetchWithAuth(
          `${constants.API_BASE_URL}/api/bookissue/issue`,
          "POST",
          JSON.stringify(body)
        );
      }

      PubSub.publish("RECORD_SAVED_TOAST", {
        title: "Success",
        message: `${selectedBooks.length} book(s) issued successfully`,
      });
      setSelectedBooks([]);
      setSelectedCard(null);
      setSelectedUser(null);
      fetchAll();
    } catch (err) {
      console.error("Bulk issue error:", err);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to issue books.",
      });
    } finally {
      setProcessing(false);
    }
  };

  // --- Calculated Values ---
  const issuedCountForSelectedCard = selectedCard
    ? computeIssuedCountForCard(selectedCard.value)
    : 0;
  const remainingForCard = Math.max(
    0,
    (parseInt(maxBooksPerCard) || 1) - issuedCountForSelectedCard
  );

  // React Select Options
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

  // --- Custom Styles for React Select to match theme ---
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
    }),
  };

  return (
    <Container
      fluid
      className="p-4"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      {/* Header Section */}
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-1">Bulk Books Issue Process... </h3>
        <p className="text-muted">
          Streamline the book issuing process for library members.
        </p>
      </div>

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
              <Card.Body className="p-4 text-center">
                {!selectedCard ? (
                  <div className="py-4 text-muted">
                    <i className="fa-solid fa-id-card fa-3x mb-3 text-secondary"></i>
                    <p className="mb-0">Select a card above to view status</p>
                  </div>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="text-start">
                        <h5 className="fw-bold mb-0">
                          {selectedCard.data.user_name ||
                            selectedCard.data.student_name}
                        </h5>
                        <span className="text-muted small">
                          {selectedCard.label}
                        </span>
                      </div>
                      <Badge
                        bg={remainingForCard > 0 ? "success" : "danger"}
                        pill
                      >
                        {remainingForCard > 0 ? "Active" : "Limit Reached"}
                      </Badge>
                    </div>

                    <hr className="my-3" style={{ borderColor: "#f0f0f0" }} />

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
                          <div className="small text-muted">Limit</div>
                          <div className="h5 mb-0 fw-bold text-dark">
                            {maxBooksPerCard}
                          </div>
                        </div>
                      </Col>
                      <Col xs={4}>
                        <div className="p-2 bg-light rounded-3">
                          <div className="small text-muted">Left</div>
                          <div className="h5 mb-0 fw-bold text-success">
                            {remainingForCard}
                          </div>
                        </div>
                      </Col>
                    </Row>

                    <div className="text-start">
                      <div className="d-flex justify-content-between small mb-1">
                        <span>Usage</span>
                        <span>
                          {Math.round(
                            (issuedCountForSelectedCard / maxBooksPerCard) * 100
                          )}
                          %
                        </span>
                      </div>
                      <ProgressBar
                        now={
                          (issuedCountForSelectedCard / maxBooksPerCard) * 100
                        }
                        variant={remainingForCard === 0 ? "danger" : "primary"}
                        style={{ height: "8px", borderRadius: "10px" }}
                      />
                    </div>
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
                    options={bookOptions.filter(availableForSelect)}
                    isMulti
                    value={selectedBooks}
                    onChange={(v) => {
                      if (selectedCard && v) {
                        // Validation Logic
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
                          PubSub.publish("RECORD_ERROR_TOAST", {
                            title: "Already Issued",
                            message: `Book '${invalid.label}' is already issued.`,
                          });
                          return;
                        }
                      }
                      setSelectedBooks(v || []);
                    }}
                    // Hide default dropdown when selected to use custom grid below
                    controlShouldRenderValue={false}
                    placeholder={
                      !selectedCard
                        ? "Select card first..."
                        : selectedBooks.length >= remainingForCard
                        ? "Limit Reached"
                        : `Select up to ${
                            remainingForCard - selectedBooks.length
                          } more book(s)...`
                    }
                    /* 
                       UPDATED LOGIC HERE:
                       Disable if:
                       1. No card is selected OR
                       2. The card has 0 remaining slots initially OR
                       3. The user has ALREADY selected enough books to fill the slots
                    */
                    isDisabled={
                      !selectedCard ||
                      remainingForCard === 0 ||
                      selectedBooks.length >= remainingForCard
                    }
                    styles={customSelectStyles}
                    formatOptionLabel={({ label, subLabel }) => (
                      <div className="d-flex justify-content-between">
                        <span>{label}</span>
                        <Badge bg="light" text="dark">
                          {subLabel}
                        </Badge>
                      </div>
                    )}
                  />
                  {!selectedCard && (
                    <Form.Text className="text-danger">
                      Please select a library card first.
                    </Form.Text>
                  )}
                  {/* Show specific message when selection limit is hit */}
                  {selectedCard &&
                    selectedBooks.length >= remainingForCard &&
                    remainingForCard > 0 && (
                      <Form.Text className="text-warning fw-bold">
                        <i className="fa-solid fa-lock me-1"></i>
                        You have selected the maximum allowed books for this
                        transaction.
                      </Form.Text>
                    )}
                  {selectedCard && remainingForCard === 0 && (
                    <Form.Text className="text-danger fw-bold">
                      This card has reached its issue limit.
                    </Form.Text>
                  )}
                </div>

                {/* SELECTED BOOKS GRID (Cards Below) */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">Books to be Issued</h6>
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
                          <div className="p-3 border rounded-3 d-flex justify-content-between align-items-center position-relative bg-white shadow-sm hover-shadow">
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
                        (selectedCard &&
                          selectedBooks.length > remainingForCard)
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
                        <>Confirm Issue ({selectedBooks.length})</>
                      )}
                    </Button>
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