import React, { useEffect, useState } from "react";
import { Container, Card, Row, Col, Button, Table, Spinner, Form } from "react-bootstrap";
import DataApi from "../../api/dataApi";
import helper from "../common/helper";
import * as constants from "../../constants/CONSTANT";
import { exportToExcel } from "../../utils/excelExport";

// Component: BlukIssued (Bulk Issued Books management)
// Features:
// - Fetch issued books (active / not returned)
// - Select multiple issued records
// - Bulk-return selected records (calls return endpoint per record)
// - Export selected or all to Excel

const BlukIssued = () => {
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchIssuedBooks();
  }, []);

  const fetchIssuedBooks = async () => {
    try {
      setLoading(true);
      const api = new DataApi("bookissue");
      const resp = await api.fetchAll();
      let data = [];
      if (resp && Array.isArray(resp)) data = resp;
      else if (resp?.data && Array.isArray(resp.data)) data = resp.data;

      // only active (not returned) issues
      const active = data.filter(
        (i) => i.status !== "returned" && (i.return_date === null || i.return_date === undefined)
      );

      setIssuedBooks(active);
      setSelected({});
      setSelectAll(false);
    } catch (err) {
      console.error("Error fetching issued books:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const copy = { ...prev };
      if (copy[id]) delete copy[id];
      else copy[id] = true;
      return copy;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelected({});
      setSelectAll(false);
    } else {
      const newSel = {};
      filtered.forEach((r) => (newSel[r.id] = true));
      setSelected(newSel);
      setSelectAll(true);
    }
  };

  const filtered = issuedBooks.filter((issue) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (issue.book_title || "").toLowerCase().includes(q) ||
      (issue.book_isbn || "").toLowerCase().includes(q) ||
      ((issue.issued_to_name || issue.student_name || "") + "").toLowerCase().includes(q) ||
      (issue.card_number || "").toLowerCase().includes(q)
    );
  });

  const bulkReturn = async () => {
    const ids = Object.keys(selected);
    if (!ids.length) return;

    if (!window.confirm(`Return ${ids.length} book(s)?`)) return;

    setProcessing(true);
    try {
      // Try to call backend return endpoint. If no bulk endpoint, call per-item.
      // Endpoint used in this app: POST /api/bookissue/return (single) OR /api/bookissue/return/:id
      // We'll call `/api/bookissue/return` with body { id } if available; otherwise try `/api/bookissue/return/${id}`.

      for (const id of ids) {
        try {
          // attempt POST with id in body
          const resp = await helper.fetchWithAuth(
            `${constants.API_BASE_URL}/api/bookissue/return`,
            "POST",
            JSON.stringify({ id })
          );

          if (!resp.ok) {
            // fallback to /return/:id
            await helper.fetchWithAuth(
              `${constants.API_BASE_URL}/api/bookissue/return/${encodeURIComponent(id)}`,
              "POST"
            );
          }
        } catch (e) {
          console.error("Error returning issue id", id, e);
        }
      }

      // refresh
      await fetchIssuedBooks();
      alert("Selected books processed for return (check list). If some failed, see console.");
    } catch (err) {
      console.error(err);
      alert("Error processing bulk return. See console for details.");
    } finally {
      setProcessing(false);
    }
  };

  const handleExport = (onlySelected = false) => {
    const rows = (onlySelected ? filtered.filter((r) => selected[r.id]) : filtered).map((r) => ({
      id: r.id,
      book_title: r.book_title || r.title || "",
      isbn: r.book_isbn || r.isbn || "",
      issued_to: r.issued_to_name || r.student_name || r.issued_to || "",
      card_number: r.card_number || "",
      issue_date: r.issue_date || "",
      due_date: r.due_date || "",
    }));

    if (!rows.length) {
      alert("No rows to export.");
      return;
    }

    exportToExcel(rows, "bulk_issued_export");
  };

  return (
    <Container fluid className="mt-4" style={{ padding: "1rem" }}>
      <Card className="shadow-sm">
        <Card.Header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>Bulk Issued Books</strong>
            <div className="text-muted" style={{ fontSize: "0.9rem" }}>Manage multiple issued books (return/export)</div>
          </div>
          <div className="d-flex gap-2">
            <Form.Control
              placeholder="Search by book, ISBN, user or card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 320 }}
            />
            <Button variant="outline-primary" size="sm" onClick={() => handleExport(false)}>
              Export All
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={() => handleExport(true)}>
              Export Selected
            </Button>
            <Button variant="primary" size="sm" onClick={bulkReturn} disabled={processing || Object.keys(selected).length === 0}>
              {processing ? <Spinner animation="border" size="sm" /> : "Return Selected"}
            </Button>
            <Button variant="light" size="sm" onClick={fetchIssuedBooks} disabled={loading}>
              Refresh
            </Button>
          </div>
        </Card.Header>
        <Card.Body style={{ padding: 0 }}>
          {loading ? (
            <div className="p-4 text-center">
              <Spinner animation="border" />
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <Table hover responsive className="mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <Form.Check type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
                    </th>
                    <th>#</th>
                    <th>Book</th>
                    <th>ISBN</th>
                    <th>Issued To</th>
                    <th>Card</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-muted">
                        No issued books found
                      </td>
                    </tr>
                  )}

                  {filtered.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={!!selected[row.id]}
                          onChange={() => toggleSelect(row.id)}
                        />
                      </td>
                      <td>{idx + 1}</td>
                      <td>
                        <strong style={{ color: "#6f42c1" }}>{row.book_title || row.title || "-"}</strong>
                      </td>
                      <td>
                        <code style={{ background: "#f8f9fa", padding: "4px 8px", borderRadius: 4 }}>{row.book_isbn || row.isbn || "-"}</code>
                      </td>
                      <td>{row.issued_to_name || row.student_name || row.issued_to || "-"}</td>
                      <td>{row.card_number || "-"}</td>
                      <td>{row.issue_date ? new Date(row.issue_date).toLocaleDateString() : "-"}</td>
                      <td>{row.due_date ? new Date(row.due_date).toLocaleDateString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
                    
          )}
        </Card.Body>
        <Card.Footer>
          <Row>
            <Col>
              <div>
                Selected: <strong>{Object.keys(selected).length}</strong> / {filtered.length}
              </div>
            </Col>
            <Col className="text-end text-muted">
              Showing {filtered.length} records
            </Col>
          </Row>
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default BlukIssued;
