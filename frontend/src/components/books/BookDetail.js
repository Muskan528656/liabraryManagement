import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Table } from "react-bootstrap";
import DataApi from "../../api/dataApi";
import Loader from "../common/Loader";
import PubSub from "pubsub-js";

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [book, setBook] = useState(null);
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    fetchBook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchBook = async () => {
    try {
      setLoading(true);
      const api = new DataApi("book");
      const resp = await api.get(`/${id}`);
      const data = resp.data && resp.data.data ? resp.data.data : resp.data;
      setBook(data || null);

      // fetch borrow history (book issues) - fetch all issues including returned ones
      try {
        const issueApi = new DataApi("bookissue");
        // Try to fetch all issues for this book
        const ir = await issueApi.get(`/book/${id}`);
        let idata = ir.data && ir.data.data ? ir.data.data : ir.data;
        // If response is not an array, try to get all issues
        if (!Array.isArray(idata)) {
          // Try fetching all issues and filter by book_id
          const allIssuesResp = await issueApi.fetchAll();
          const allIssues = allIssuesResp.data && Array.isArray(allIssuesResp.data) 
            ? allIssuesResp.data 
            : (allIssuesResp.data?.data && Array.isArray(allIssuesResp.data.data) 
              ? allIssuesResp.data.data 
              : []);
          idata = allIssues.filter(issue => issue.book_id === id || issue.book_id === parseInt(id));
        }
        setIssues(Array.isArray(idata) ? idata : []);
      } catch (ie) {
        console.error("Error fetching issues", ie);
        setIssues([]);
      }
    } catch (error) {
      console.error("Error fetching book:", error);
      PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: "Failed to load book details" });
      navigate("/books");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  if (!book) {
    return (
      <Container fluid>
        <Card>
          <Card.Body>
            <p>No book found</p>
            <Button onClick={() => navigate("/books")}>Back to list</Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }
  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <Container fluid>
      <Row className="mb-3" style={{ marginTop: "0.5rem" }}>
        <Col>
          <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.1)" }}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start">
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{ width: 120, height: 160, background: "#f8f9fa", borderRadius: 6, overflow: "hidden" }}>
                    {book.cover_image ? (
                      <img src={book.cover_image} alt={book.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
                        No Image
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="mb-2 fw-bold" style={{ color: "#6f42c1" }}>{book.title}</h2>
                    <div className="text-muted mb-2">By {book.author_name || book.author || "-"}</div>
                    <div style={{ maxWidth: 720 }} className="text-secondary">
                      {book.description || book.overview || "No description available."}
                    </div>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <Button variant="outline-secondary" onClick={() => navigate("/books")}>Back</Button>
                  <Button variant="primary" onClick={() => navigate(`/books?edit=${id}`)} style={{ background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)", border: "none" }}>
                    <i className="fa-solid fa-edit me-2"></i>Edit
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={8}>
          <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.06)" }}>
            <Card.Body>
              <h5 className="mb-3">Borrow History</h5>
              <Table responsive bordered>
                <thead>
                  <tr>
                    <th>Member Name</th>
                    <th>Issued Date</th>
                    <th>Return Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-muted">No borrow history</td>
                    </tr>
                  ) : (
                    issues.map((it) => (
                      <tr key={it.id}>
                        <td>
                          {(() => {
                            const userId = it.user_id || it.student_id || it.issued_to;
                            const displayName = it.issued_to_name || it.student_name || it.issued_to || "-";
                            if (userId) {
                              return (
                                <a
                                  href={`/user/${userId}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    try {
                                      localStorage.setItem(`prefetch:user:${userId}`, JSON.stringify(it));
                                    } catch (err) {}
                                    navigate(`/user/${userId}`, { state: it });
                                  }}
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    try {
                                      localStorage.setItem(`prefetch:user:${userId}`, JSON.stringify(it));
                                    } catch (err) {}
                                    window.open(`/user/${userId}`, '_blank');
                                  }}
                                  style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 600, cursor: "pointer" }}
                                  onMouseEnter={(e) => {
                                    e.target.style.textDecoration = "underline";
                                  }}
                                  onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
                                  title="Click to view user details (Right-click to open in new tab)"
                                >
                                  {displayName}
                                </a>
                              );
                            }
                            return displayName;
                          })()}
                        </td>
                        <td>{formatDate(it.issue_date)}</td>
                        <td>{formatDate(it.return_date)}</td>
                        {/* <td>{it.issue_date || "-"}</td>
                        <td>{it.return_date || "-"}</td> */}
                        <td>--</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.06)" }}>
            <Card.Body>
              <h6 className="text-muted">Book Details</h6>
              <hr />
              <div className="mb-2"><strong>Publisher:</strong> <div className="text-secondary d-inline">{book.publisher || "-"}</div></div>
              <div className="mb-2"><strong>Publication Year:</strong> <div className="text-secondary d-inline">{book.publication_year || "-"}</div></div>
              <div className="mb-2"><strong>Editions:</strong> <div className="text-secondary d-inline">{book.edition || "-"}</div></div>
              <div className="mb-2"><strong>Language:</strong> <div className="text-secondary d-inline">{book.language || "-"}</div></div>
              <div className="mb-2"><strong>Genre:</strong> <div className="text-secondary d-inline">{book.genre || "-"}</div></div>
              <div className="mb-2"><strong>Number of Copies:</strong> <div className="text-secondary d-inline">{book.total_copies || book.number_of_copies || 0}</div></div>
              <div className="mb-2"><strong>ISBN Code:</strong> <div className="text-secondary d-inline">{book.isbn || "-"}</div></div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default BookDetail;

