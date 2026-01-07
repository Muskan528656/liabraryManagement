import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  InputGroup,
  Badge,
  Tab,
  Nav,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import DataApi from "../../api/dataApi";
import PubSub from "pubsub-js";
import ResizableTable from "../common/ResizableTable";
import BulkIssue from "./BulkIssue";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import moment from "moment";
const BookIssue = () => {
  const navigate = useNavigate();
  const { timeZone } = useTimeZone();
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedLibraryCard, setSelectedLibraryCard] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    book_id: "",
    card_id: "",
    issued_to: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: "",
    condition_before: "Good",
    remarks: "",
  });
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [loadingIssuedBooks, setLoadingIssuedBooks] = useState(false);
  const [activeTab, setActiveTab] = useState("issue");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;
  const [durationDays, setDurationDays] = useState(7);

  const bookInputRef = useRef(null);
  const bookSearchInputRef = useRef(null);
  const bookInputTimer = useRef(null);
  const cardInputTimer = useRef(null);

  useEffect(() => {
    fetchIssuedBooks();
    fetchLibrarySettings();

    setTimeout(() => {
      const bookSelect = bookInputRef.current?.querySelector("input");
      if (bookSelect) {
        bookSelect.focus();
        bookSelect.click();
      }
    }, 300);


    const token = PubSub.subscribe("OPEN_ADD_BOOK_ISSUE_MODAL", () => {
      resetForm();
      setActiveTab("issue");
      setTimeout(() => {
        const bookSelect = bookInputRef.current?.querySelector("input");
        if (bookSelect) {
          bookSelect.focus();
          bookSelect.click();
        }
      }, 100);
    });

    return () => {
      PubSub.unsubscribe(token);
      if (bookInputTimer.current) clearTimeout(bookInputTimer.current);
      if (cardInputTimer.current) clearTimeout(cardInputTimer.current);
    };
  }, []);


  const fetchLibrarySettings = async () => {
    try {
      const settingsApi = new DataApi("librarysettings");

      const response = await settingsApi.get("/all");
      if (response.data && response.data.success && response.data.data) {

      } else if (
        response.data &&
        typeof response.data === "object" &&
        !Array.isArray(response.data)
      ) {

        const duration = parseInt(response.data.duration_days) || 7;
        setDurationDays(duration);
      }
    } catch (error) {
      console.error("Error fetching library settings:", error);

    }
  };


  useEffect(() => {
    if (!formData.due_date && durationDays) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + durationDays);
      setFormData((prev) => ({
        ...prev,
        due_date: dueDate.toISOString().split("T")[0],
      }));
    }
  }, [durationDays]);


  useEffect(() => {
    if (selectedLibraryCard && selectedLibraryCard.data) {
      setFormData((prev) => ({
        ...prev,
        card_id: selectedLibraryCard.data.id,
        issued_to:
          selectedLibraryCard.data.user_id ||
          selectedLibraryCard.data.student_id ||
          "",
      }));
      setSelectedUser(null);
    } else if (selectedUser && selectedUser.data) {
      setFormData((prev) => ({
        ...prev,
        issued_to: selectedUser.data.id,
        card_id: "",
      }));
      setSelectedLibraryCard(null);
    }
  }, [selectedLibraryCard, selectedUser]);


  useEffect(() => {
    if (selectedBook && selectedBook.data) {
      setFormData((prev) => ({
        ...prev,
        book_id: selectedBook.data.id,
      }));
    }
  }, [selectedBook]);


  const fetchIssuedBooks = async () => {
    try {
      setLoadingIssuedBooks(true);
      const issueApi = new DataApi("bookissue");
      const response = await issueApi.fetchAll();
      console.log("reposne->>>", response)
      if (response.data && Array.isArray(response.data)) {

        const activeIssues = response.data.filter(
          (issue) =>
            issue.status === "issued" ||
            issue.status === null ||
            issue.status === undefined ||
            issue.return_date === null
        );
        setIssuedBooks(activeIssues);
      }
    } catch (error) {
      console.error("Error fetching issued books:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to fetch issued books",
      });
    } finally {
      setLoadingIssuedBooks(false);
    }
  };

  const resetForm = () => {
    setSelectedBook(null);
    setSelectedLibraryCard(null);
    setSelectedUser(null);
    setFormData({
      book_id: "",
      card_id: "",
      issued_to: "",
      issue_date: new Date().toISOString().split("T")[0],
      due_date: (() => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + durationDays);
        return dueDate.toISOString().split("T")[0];
      })(),
      condition_before: "Good",
      remarks: "",
    });

    setTimeout(() => {
      if (bookSearchInputRef.current) {
        bookSearchInputRef.current.focus();
      }
    }, 200);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      return dateString;
    }
  };


  const filteredIssuedBooks = issuedBooks.filter((issue) => {
    if (!searchTerm) return true;
    const query = searchTerm.toLowerCase();
    const bookTitle = (issue.book_title || "").toLowerCase();
    const isbn = (issue.book_isbn || "").toLowerCase();
    const userName = (
      issue.issued_to_name ||
      issue.student_name ||
      issue.issued_to ||
      ""
    ).toLowerCase();
    const cardNumber = (issue.card_number || "").toLowerCase();

    return (
      bookTitle.includes(query) ||
      isbn.includes(query) ||
      userName.includes(query) ||
      cardNumber.includes(query)
    );
  });


  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    try {
      const due = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      const diffTime = due - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return null;
    }
  };

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
            navigate(`/book/${record.book_id}`);
          }}
          style={{
            color: "#6f42c1",
            textDecoration: "none",
            fontWeight: "600",
          }}
          onMouseEnter={(e) => {
            try {
              const bookPrefetch = {
                id: record.book_id,
                title: record.book_title,
                isbn: record.book_isbn,
                author_name: record.author_name,
              };
              localStorage.setItem(
                `prefetch:book:${record.book_id}`,
                JSON.stringify(bookPrefetch)
              );
            } catch (err) { }
            e.target.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
        >
          <strong>{value || "N/A"}</strong>
        </a>
      ),
    },
















    {
      field: "issued_to_name",
      label: "Issued To",
      width: 200,
      render: (value, record) => {

        const displayName =
          record.issued_to_name ||
          record.member_name ||
          record.student_name ||
          record.user_name ||
          record.name ||
          `${record.first_name || ''} ${record.last_name || ''}`.trim() ||
          "N/A";

        const userId = record.issued_to || record.card_id;

        if (userId && displayName !== "N/A") {
          return (
            <a
              href={`/librarycard/${userId}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/librarycard/${userId}`, { state: record });
              }}
              style={{
                color: "#6f42c1",
                textDecoration: "none",
                fontWeight: 500,
              }}
              onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
              onMouseLeave={(e) => e.target.style.textDecoration = "none"}
            >
              {displayName}
            </a>
          );
        }

        return displayName;
      },
    },
    {
      field: "issued_by",
      label: "Issued By",
      width: 200,
      render: (value, record) => {
        const userId = record.issued_by;
        const displayName = record.issued_by_name || "N/A";

        if (userId) {
          return (
            <a
              href={`/user/${userId}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  localStorage.setItem(
                    `prefetch:user:${userId}`,
                    JSON.stringify(record)
                  );
                } catch (err) { }
                navigate(`/user/${userId}`, { state: record });
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  localStorage.setItem(
                    `prefetch:user:${userId}`,
                    JSON.stringify(record)
                  );
                } catch (err) { }
                window.open(`/user/${userId}`, "_blank");
              }}
              style={{
                color: "#6f42c1",
                textDecoration: "none",
                fontWeight: 500,
                cursor: "pointer",
              }}
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
      },
    },


    {
      field: "card_number",
      label: "Card Number",
      width: 150,
      render: (value) => value || "-",
    },
    {
      field: "issue_date",
      label: "Issue Date",
      width: 120,

      render: (value) => {

        return moment(convertToUserTimezone(value, timeZone)).format('l')
      }
    },
    {
      field: "due_date",
      label: "Submission Date",
      width: 180,
      render: (value, record) => {

        if (!value) return "—";

        const displayDate = moment(convertToUserTimezone(value, timeZone)).format('l');


        const dueObj = new Date(value);
        const nowObj = new Date();

        dueObj.setHours(0, 0, 0, 0);
        nowObj.setHours(0, 0, 0, 0);


        const diffTime = dueObj - nowObj;

        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const isOverdue = daysRemaining < 0;
        const isDueSoon = daysRemaining >= 0 && daysRemaining <= 3;

        return (
          <div>

            <div style={{ fontWeight: 500 }}>{displayDate}</div>

            <div className="small mt-1">
              {isOverdue ? (
                <Badge bg="danger">
                  Overdue by {Math.abs(daysRemaining)} day
                  {Math.abs(daysRemaining) !== 1 ? "s" : ""}
                </Badge>
              ) : isDueSoon ? (
                <Badge bg="warning" text="dark">
                  {daysRemaining === 0
                    ? "Due Today"
                    : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""
                    } left`}
                </Badge>
              ) : (
                <Badge bg="success">
                  {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      field: "status",
      label: "Status",
      width: 120,
      render: (value) => (
        <Badge bg={value === "submitted" ? "secondary" : "primary"}>
          {value === "submitted" ? "Submitted" : "Issued"}
        </Badge>
      ),
    },
  ];

  return (


    <Card style={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "8px", overflow: "hidden" }}>
      <Card.Body >
        <Tab.Container
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k || "issue")}
          id="book-tabs-container"
        >
          <div className="d-flex align-items-center justify-content-between border-bottom pb-2">
            <Nav variant="tabs" className="border-bottom-0">
              <Nav.Item>
                <Nav.Link
                  eventKey="issue"
                  className={`fw-semibold ${activeTab === 'issue' ? 'active' : ''}`}
                  style={{
                    border: "none",
                    borderRadius: "8px 8px 0 0",
                    padding: "12px 24px",

                    backgroundColor: activeTab === 'issue' ? "var(--primary-color)" : "#f8f9fa",
                    color: activeTab === 'issue' ? "white" : "#64748b",
                    borderTop: activeTab === 'issue' ? "3px solid var(--primary-color)" : "3px solid transparent",
                    fontSize: "14px",
                    transition: "all 0.3s ease",
                    marginBottom: "-1px"
                  }}
                >
                  <span>Issue New Book</span>
                </Nav.Link>
              </Nav.Item>

              <Nav.Item>
                <Nav.Link
                  eventKey="list"
                  className={`fw-semibold ${activeTab === 'list' ? 'active' : ''}`}
                  style={{
                    border: "none",
                    borderRadius: "8px 8px 0 0",
                    padding: "12px 24px",

                    backgroundColor: activeTab === 'list' ? "var(--primary-color)" : "#f8f9fa",
                    color: activeTab === 'list' ? "white" : "#64748b",
                    borderTop: activeTab === 'list' ? "3px solid var(--primary-color)" : "3px solid transparent",
                    fontSize: "14px",
                    transition: "all 0.3s ease",
                    marginBottom: "-1px"
                  }}
                >
                  <span>View Issued Books ({issuedBooks.length})</span>
                </Nav.Link>
              </Nav.Item>
            </Nav>

            {/* Search Bar - Only for List Tab */}
            {activeTab === "list" && (
              <div className="d-flex align-items-center">
                <InputGroup style={{ width: "250px", maxWidth: "100%" }}>
                  <InputGroup.Text
                    style={{
                      background: "#f3e9fc",
                      borderColor: "#e9ecef",
                      padding: "0.375rem 0.75rem",
                      borderRight: "none",
                      borderTopLeftRadius: "6px",
                      borderBottomLeftRadius: "6px"
                    }}
                  >
                    <i
                      className="fa-solid fa-search"
                      style={{ color: "#6f42c1", fontSize: "0.875rem" }}
                    ></i>
                  </InputGroup.Text>

                  <Form.Control
                    placeholder="Search books..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      borderColor: "#e9ecef",
                      fontSize: "0.875rem",
                      padding: "0.375rem 0.75rem",
                      borderLeft: "none",
                      borderRight: searchTerm ? "none" : "1px solid #e9ecef"
                    }}
                  />

                  {searchTerm && (
                    <Button
                      variant="outline-secondary"
                      onClick={() => setSearchTerm("")}
                      style={{
                        border: "1px solid #d1d5db",
                        borderLeft: "none",
                        height: "38px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 12px",
                        borderTopRightRadius: "6px",
                        borderBottomRightRadius: "6px"
                      }}
                    >
                      <i className="fa-solid fa-times"></i>
                    </Button>
                  )}
                </InputGroup>
              </div>
            )}
          </div>

          <Tab.Content className="pt-3">
            <Tab.Pane eventKey="issue">
              {/* <Card className="shadow-sm h-100 border-0"> */}
              {/* <Card.Body className="p-0" style={{ overflow: "hidden" }}> */}
              <BulkIssue />
              {/* </Card.Body> */}
              {/* </Card> */}
            </Tab.Pane>

            <Tab.Pane eventKey="list">
              <Card className="shadow-sm border-0">
                <Card.Body className="p-0" style={{ overflow: "hidden" }}>
                  <ResizableTable
                    data={filteredIssuedBooks}
                    columns={issueColumns}
                    loading={loadingIssuedBooks}
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
                      searchTerm
                        ? "No issued books found matching your search"
                        : "No books have been issued yet"
                    }
                    onRowClick={(issue) => {
                      console.log("Issue clicked:", issue);
                    }}
                  />
                </Card.Body>
                {filteredIssuedBooks.length > 0 && (
                  <Card.Footer
                    style={{
                      background: "#f8f9fa",
                      borderTop: "1px solid #e9ecef",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>Total Issued Books:</strong>{" "}
                        {filteredIssuedBooks.length}
                        {searchTerm && (
                          <span className="text-muted ms-2">
                            (Filtered from {issuedBooks.length} total)
                          </span>
                        )}
                      </div>
                    </div>
                  </Card.Footer>
                )}
              </Card>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Card.Body>
    </Card>

  );
};

export default BookIssue;
