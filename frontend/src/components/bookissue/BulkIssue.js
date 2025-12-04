import React, { useEffect, useState } from "react";
// We import this, though for input fields we often need raw YYYY-MM-DD
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import {
  Container,
  Card,
  Row,
  Col,
  Button,
  Form,
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

  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBooks, setSelectedBooks] = useState([]);

  const [durationDays, setDurationDays] = useState(7);
  const [maxBooksPerCard, setMaxBooksPerCard] = useState(1);

  // Initialize with empty string, will populate once TZ is known
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [timeZone, setTimeZone] = useState(null);

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // --- TIMEZONE HELPERS ---

  /**
   * Returns "YYYY-MM-DD" for the current moment in the specific timezone.
   * This ensures that if it's Dec 4th in India but Dec 3rd in New York,
   * the input field shows Dec 4th.
   */
  const getCurrentDateInTimezone = (tz) => {
    try {
      // 'en-CA' format is YYYY-MM-DD
      const safeTz = tz || Intl.DateTimeFormat().resolvedOptions().timeZone;
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: safeTz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
    } catch (e) {
      console.warn("Error calculating timezone date", e);
      return new Date().toISOString().split("T")[0]; // Fallback to UTC
    }
  };

  function getCompanyIdFromToken() {
    const token = sessionStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.companyid || payload.companyid || null;
  }

  const fetchCompany = async () => {
    try {
      const companyid = getCompanyIdFromToken();
      if (!companyid) return;

      const companyApi = new DataApi("company");
      const response = await companyApi.fetchById(companyid);
      console.log("response ", response)

      if (response.data) {
        const companyTz = response.data.time_zone || response.data.timezone;
        console.log("companyTz" , companyTz);
        setTimeZone(companyTz);

        const companyToday = getCurrentDateInTimezone(companyTz);
        setIssueDate(companyToday);
      }
    } catch (error) {
      console.error("Error fetching company by ID:", error);
      // Fallback if API fails
      setIssueDate(getCurrentDateInTimezone(null));
    }
  };

  // --- EFFECTS ---

  useEffect(() => {
    // If issueDate hasn't been set yet (waiting for company API), don't set default
    if (!issueDate) {
      // Optional: Set a temporary browser-based date if you don't want to wait
      // setIssueDate(new Date().toISOString().split("T")[0]);
    }
    fetchAll();
    fetchCompany();
  }, []);

  // Update Due Date whenever Issue Date or Duration changes
  useEffect(() => {
    if (issueDate) {
      const duration = parseInt(durationDays) || 7;
      
      // Safe Date Addition: Parse YYYY-MM-DD, add days, format back
      const resultDate = new Date(issueDate);
      resultDate.setDate(resultDate.getDate() + duration);
      
      // Format back to YYYY-MM-DD for the input
      // We use ISO slice here because Date arithmetic on YYYY-MM-DD strings 
      // is usually treated as UTC midnight, which is safe for this operation.
      const resultString = resultDate.toISOString().split("T")[0];
      
      setDueDate(resultString);
    }
  }, [issueDate, durationDays]);

  // --- API CALLS ---

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
      const issuesList = normalize(issuesResp);

      setBooks(booksList);
      setLibraryCards(
        cardsList.filter((c) => String(c.is_active) === "true" || c.is_active === true)
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

  // --- LOGIC ---

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
          (iss.card_id || iss.cardId || iss.library_card_id)?.toString() ===
            selectedCard.value.toString() &&
          iss.book_id?.toString() === b.id.toString() &&
          iss.status !== "returned"
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

  const issuedCountForSelectedCard = selectedCard
    ? computeIssuedCountForCard(selectedCard.value)
    : 0;
  const remainingForCard = Math.max(
    0,
    (parseInt(maxBooksPerCard) || 1) - issuedCountForSelectedCard
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
    }),
  };

  console.log("timeZone",timeZone)

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
                  {selectedCard &&
                    selectedBooks.length >= remainingForCard &&
                    remainingForCard > 0 && (
                      <Form.Text className="text-warning fw-bold">
                        <i className="fa-solid fa-lock me-1"></i>
                        You have selected the maximum allowed books.
                      </Form.Text>
                    )}
                  {selectedCard && remainingForCard === 0 && (
                    <Form.Text className="text-danger fw-bold">
                      This card has reached its issue limit.
                    </Form.Text>
                  )}
                </div>

                {/* SELECTED BOOKS GRID */}
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
                    {timeZone && (
                      <Form.Text className="text-muted small">
                        Zone: {timeZone}
                      </Form.Text>
                    )}
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