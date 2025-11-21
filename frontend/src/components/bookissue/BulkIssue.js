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

// BulkIssue: issue multiple books to a single user/card
const BulkIssue = () => {
  const [books, setBooks] = useState([]);
  const [libraryCards, setLibraryCards] = useState([]);
  const [users, setUsers] = useState([]);
  const [issuedBooks, setIssuedBooks] = useState([]); // active issued records

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

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (!dueDate) {
      const d = new Date();
      d.setDate(d.getDate() + (durationDays || 7));
      setDueDate(d.toISOString().split("T")[0]);
    }
  }, [durationDays]);

  // When issueDate changes, update dueDate automatically to issueDate + durationDays
  useEffect(() => {
    if (issueDate) {
      const duration = durationDays || 15;
      const d = new Date(issueDate);
      d.setDate(d.getDate() + duration);
      setDueDate(d.toISOString().split("T")[0]);
    }
  }, [issueDate, durationDays]);

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
      const booksList = Array.isArray(booksResp?.data)
        ? booksResp.data
        : Array.isArray(booksResp)
        ? booksResp
        : [];
      const cardsList = Array.isArray(cardsResp?.data)
        ? cardsResp.data
        : Array.isArray(cardsResp)
        ? cardsResp
        : [];
      const usersList = Array.isArray(usersResp?.data)
        ? usersResp.data
        : Array.isArray(usersResp)
        ? usersResp
        : [];
      const issuesList = Array.isArray(issuesResp?.data)
        ? issuesResp.data
        : Array.isArray(issuesResp)
        ? issuesResp
        : [];

      setBooks(booksList);
      setLibraryCards(
        cardsList.filter((c) => c.is_active === true || c.is_active === "true")
      );
      setUsers(usersList);

      // Only active issues
      const activeIssues = issuesList.filter(
        (issue) =>
          issue.status !== "returned" &&
          (issue.return_date == null || issue.return_date === undefined)
      );
      setIssuedBooks(activeIssues);

      // settingsResp returns object with duration_days and max_books_per_card
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

  // helper to call settings /all endpoint safely
  const settingsRespTry = async (settingsApi) => {
    try {
      const r = await settingsApi.get("/all");
      if (r?.data && r.data.success && r.data.data) return r.data.data;
      return r?.data || r;
    } catch (e) {
      return null;
    }
  };

  const bookOptions = books.map((b) => ({
    value: b.id,
    label: `${b.title || "Untitled"}${b.isbn ? ` (ISBN: ${b.isbn})` : ""}${
      b.available_copies !== undefined
        ? ` - Available: ${b.available_copies || 0}`
        : ""
    }`,
    data: b,
  }));

  const cardOptions = libraryCards.map((c) => ({
    value: c.id,
    label: `${c.card_number || "N/A"} - ${
      c.user_name || c.student_name || "Unknown"
    }`,
    data: c,
  }));
  const userOptions = users.map((u) => ({
    value: u.id,
    label:
      `${u.firstname || ""} ${u.lastname || ""}`.trim() || u.email || "Unknown",
    data: u,
  }));

  const computeIssuedCountForCard = (cardId) => {
    if (!cardId) return 0;
    return issuedBooks.filter(
      (i) =>
        (i.card_id || i.cardId || i.library_card_id)?.toString() ===
        cardId.toString()
    ).length;
  };

  const handleIssue = async () => {
    if ((!selectedCard && !selectedUser) || selectedBooks.length === 0) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Validation",
        message: "Select a card/user and at least one book",
      });
      return;
    }

    // check limit
    if (selectedCard) {
      const issuedCount = computeIssuedCountForCard(selectedCard.value) + 0;
      const toIssueCount = selectedBooks.length;
      if (issuedCount + toIssueCount > (parseInt(maxBooksPerCard) || 1)) {
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Limit Exceeded",
          message: `This card can only have ${maxBooksPerCard} books. Selected ${toIssueCount}, already issued ${issuedCount}.`,
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

        const resp = await helper.fetchWithAuth(
          `${constants.API_BASE_URL}/api/bookissue/issue`,
          "POST",
          JSON.stringify(body)
        );
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          console.error("Issue failed for book", b, err);
        }
      }

      PubSub.publish("RECORD_SAVED_TOAST", {
        title: "Success",
        message: `${selectedBooks.length} book(s) issued successfully`,
      });
      // reset
      setSelectedBooks([]);
      setSelectedCard(null);
      setSelectedUser(null);
      // refresh available lists
      fetchAll();
    } catch (err) {
      console.error("Bulk issue error:", err);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to issue books. See console.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const availableForSelect = (option) => {
    // hide books with 0 available copies
    const b = option.data;
    if (b.available_copies !== undefined && parseInt(b.available_copies) <= 0)
      return false;
    // If a card is selected, hide books already issued on that card
    if (selectedCard) {
      const alreadyIssued = issuedBooks.some(
        (iss) =>
          (iss.card_id || iss.cardId || iss.library_card_id)?.toString() ===
            selectedCard.value.toString() &&
          iss.book_id?.toString() === b.id.toString() &&
          iss.status !== "returned" &&
          (iss.return_date == null || iss.return_date === undefined)
      );
      if (alreadyIssued) return false;
    }
    return true;
  };

  const issuedCountForSelectedCard = selectedCard
    ? computeIssuedCountForCard(selectedCard.value)
    : 0;
  const remainingForCard = Math.max(
    0,
    (parseInt(maxBooksPerCard) || 1) - issuedCountForSelectedCard
  );

  return (
    <>
      {/* i need three card to show issued books and remaing books and alloted books */}

      <div className="d-flex justify-content-between mt-4 gap-4 flex-wrap">
        {/* Card Data */}
        {[
          {
            title: "Issued",
            value: issuedCountForSelectedCard,
            icon: "fa-book",
          },
          {
            title: "Allotted",
            value: maxBooksPerCard,
            icon: "fa-layer-group",
          },
          {
            title: "Remaining",
            value: remainingForCard,
            icon: "fa-chart-pie",
          },
        ].map((item, index) => (
          <Card
            key={index}
            className="text-center shadow-sm"
            style={{
              flex: "1 1 200px",
              minWidth: "200px",
              borderRadius: "20px",
              border: "none",
              background: "linear-gradient(135deg, #ffffff 0%, #f7f9fc 100%)",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
            }}
           
          >
            <Card.Body
              style={{
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background:"linear-gradient(135deg, rgb(111, 66, 193) 0%, rgb(139, 92, 246) 100%)",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "26px",
                  marginBottom: "12px",
                  boxShadow: "0 6px 12px rgba(76, 110, 245, 0.35)",
                  mariginleft: "20px",
                }}
              >
                <i className={`fa-solid ${item.icon}`}></i>
              </div>

              <Card.Title
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 600,
                  color: "#2b2b2b",
                  marginTop: "-78px",
                  marginBottom: "0",
                }}
              >
                {item.title}
              </Card.Title>

              <Card.Text  style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#12141aff",
                  marginTop: "10px",
                }}
              >
                {item.value}
              </Card.Text>
            </Card.Body>
          </Card>
        ))}
      </div>

      <Container fluid className="mt-4" style={{ padding: "1rem" }}>
        <Card className="shadow-sm">
          <Card.Header>
            <strong>Bulk Issue Books</strong>
            <div className="text-muted small">
              Issue multiple books to a single user or card
            </div>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <div className="text-center p-4">
                <Spinner />
              </div>
            ) : (
              <Row className="g-3">
                <Col md={6}>
                  <Form.Label className="fw-bold">
                    Select Library Card
                  </Form.Label>
                  <Select
                    options={cardOptions}
                    value={selectedCard}
                    onChange={(v) => {
                      setSelectedCard(v);
                      setSelectedUser(null);
                    }}
                    isClearable
                  />
                  <Form.Text className="text-muted">
                    Or select a user below instead of card
                  </Form.Text>

                  {selectedCard && (
                    <div
                      className="mt-2"
                      style={{
                        background: "#eef6ff",
                        padding: "10px",
                        borderRadius: 6,
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>Card:</strong> {selectedCard.label}
                        </div>
                        <div>
                          <Badge bg="info" className="me-2">
                            Allowed: {maxBooksPerCard}
                          </Badge>
                          <Badge bg="secondary">
                            Issued: {issuedCountForSelectedCard}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2">
                        <ProgressBar
                          now={Math.min(
                            100,
                            (issuedCountForSelectedCard /
                              (parseInt(maxBooksPerCard) || 1)) *
                              100
                          )}
                          label={`${remainingForCard} left`}
                        />
                      </div>
                    </div>
                  )}
                </Col>

                <Col md={6}>
                  <Form.Label className="fw-bold">
                    Select Books (multiple)
                  </Form.Label>
                  <Select
                    options={bookOptions.filter(availableForSelect)}
                    isMulti
                    value={selectedBooks}
                    onChange={(v) => {
                      // If a card is selected, prevent selection of books already issued
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
                              iss.status !== "returned" &&
                              (iss.return_date == null ||
                                iss.return_date === undefined)
                          );
                        });
                        if (invalid) {
                          PubSub.publish("RECORD_ERROR_TOAST", {
                            title: "Already Issued",
                            message: `Book '${invalid.label}' is already issued on this card.`,
                          });
                          return;
                        }
                      }
                      setSelectedBooks(v || []);
                      // Auto-set due date to issue date + durationDays (default 15)
                      const duration = durationDays || 15;
                      const baseDate = issueDate
                        ? new Date(issueDate)
                        : new Date();
                      baseDate.setDate(baseDate.getDate() + duration);
                      setDueDate(baseDate.toISOString().split("T")[0]);
                    }}
                    closeMenuOnSelect={false}
                    isDisabled={
                      selectedCard && selectedBooks.length >= remainingForCard
                    }
                  />
                  <Form.Text className="text-danger">
                    You can select multiple books. Books with zero available
                    copies are hidden.
                  </Form.Text>

                  {selectedBooks && selectedBooks.length > 0 && (
                    <div
                      className="mt-3"
                      style={{
                        border: "1px solid #e9ecef",
                        padding: 10,
                        borderRadius: 6,
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong>Selected Books ({selectedBooks.length})</strong>
                        <div>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => setSelectedBooks([])}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                      <div>
                        {selectedBooks.map((b) => (
                          <div
                            key={b.value}
                            className="d-flex justify-content-between align-items-center mb-1"
                          >
                            <div style={{ maxWidth: "80%" }}>{b.label}</div>
                            <div>
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() =>
                                  setSelectedBooks((prev) =>
                                    prev.filter((x) => x.value !== b.value)
                                  )
                                }
                                style={{ textDecoration: "none" }}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Col>

                {/* <Col md={6}>
                <Form.Label className="fw-bold">Select User</Form.Label>
                <Select
                  options={userOptions}
                  value={selectedUser}
                  onChange={(v) => { setSelectedUser(v); setSelectedCard(null); }}
                  isClearable
                />
              </Col> */}

                <Col md={4}>
                  <Form.Label className="fw-bold">Issue Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </Col>

                <Col md={4}>
                  <Form.Label className="fw-bold">Submission Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={issueDate}
                  />
                </Col>

                <Col md={4} className="d-flex align-items-end">
                  <div>
                    <Button
                      style={{
                        background:"linear-gradient(135deg, rgb(111, 66, 193) 0%, rgb(139, 92, 246) 100%)"
                      }}
                      onClick={handleIssue}
                      disabled={
                        processing ||
                        selectedBooks.length === 0 ||
                        (!selectedCard && !selectedUser) ||
                        (selectedCard &&
                          selectedBooks.length > remainingForCard)
                      }
                    >
                      {processing ? (
                        <>
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-2"
                          />
                          Processing...
                        </>
                      ) : (
                        <>Issue Selected Books</>
                      )}
                    </Button>
                    {selectedCard &&
                      selectedBooks.length > remainingForCard && (
                        <div className="mt-2">
                          <Alert variant="warning">
                            Selected {selectedBooks.length} books but only{" "}
                            {remainingForCard} can be issued to this card.
                          </Alert>
                        </div>
                      )}
                  </div>
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>
      </Container>
    </>
  );
};

export default BulkIssue;
