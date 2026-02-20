import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import ModuleDetail from "../common/ModuleDetail";
import DataApi from "../../api/dataApi";
import { Card, Col, Row } from "react-bootstrap";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import { useTimeZone } from "../../contexts/TimeZoneContext";


const BookDetail = ({ permissions }) => {

  console.log("BookDetail permission prop:", permissions);
  const { id } = useParams();
  const [externalData, setExternalData] = useState({ authors: [], classifications: [] });

  const [book, setBook] = useState(null);
  const [relatedModules, setRelatedModules] = useState([]);
  const { timeZone } = useTimeZone();
  const fetchBookData = async (bookId) => {
    try {

      const bookApi = new DataApi("book");


      const bookResponse = await bookApi.fetchById(bookId);
      const bookData = bookResponse?.data || {};
      console.log("bookData ->", bookData);

      setRelatedModules(bookData.copies);
      // Populate classification_label for the AsyncSelect display
      setBook(bookData);
    } catch (error) {
      console.error("Error fetching book:", error);
    }
  };

  const fetchExternalData = async () => {
    console.log("Fetching external data for BookDetail");
    try {
      const authorApi = new DataApi("author");
      const authorsResponse = await authorApi.fetchAll();
      const authors = authorsResponse?.data?.data || authorsResponse?.data || [];

      const classificationApi = new DataApi("classification");
      const classificationsResponse = await classificationApi.fetchAll();
      const classifications = classificationsResponse?.data?.data || classificationsResponse?.data || [];

      const shelfApi = new DataApi("shelf/grouped");
      const groupedShelvesResponse = await shelfApi.fetchAll();
      const groupedShelves = groupedShelvesResponse?.data?.data || groupedShelvesResponse?.data || [];

      console.log("Fetched authors:", authors);
      console.log("Fetched classifications:", classifications);
      console.log("Fetched groupedShelves:", groupedShelves);

      setExternalData({
        authors: Array.isArray(authors) ? authors : [],
        classifications: Array.isArray(classifications) ? classifications : [],
      });
    } catch (error) {
      console.error("Error fetching external data:", error);
    }
  };

  useEffect(() => {
    console.log("BookDetail useEffect triggered");
    fetchExternalData();
    if (id) {
      fetchBookData(id);
    }
  }, [id]);

  useEffect(() => {
    if (book?.classification_id && externalData.classifications.length) {
      const selected = externalData.classifications.find(c => c.id === book.classification_id);
      if (selected) {
        // Update classification metadata in book state if missing
        if (!book.classification_category || !book.classification_type) {
          setBook(prev => ({
            ...prev,
            classification_category: selected.category || '',
            classification_type: selected.classification_type || '',
            classification_from: selected.classification_from || '',
            classification_to: selected.classification_to || ''
          }));
        }
      }
    }
  }, [book?.classification_id, externalData.classifications]);

  const inventoryBindings = useMemo(() => [
    { value: "hardcover", label: "Hardcover" },
    { value: "paperback", label: "Paperback" },
    { value: "spiral", label: "Spiral" },
  ], []);

  const fields = useMemo(() => ({
    title: "title",
    subtitle: "isbn",
    details: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "price", label: "Price", type: "text" },
      { key: "isbn", label: "ISBN", type: "text", required: true },
      {
        key: "author_id",
        label: "Author",
        type: "select",
        options: "authors",
        displayKey: "author_name",
        required: true
      },
      {
        key: "publisher_id",
        label: "Publisher",
        type: "select",
        options: "publisher",
        displayKey: "publisher_name"
      },
      { key: "classification_code", label: "Class Code", type: "text" },
      {
        key: "classification_name",
        label: "Classification",
        type: "select",
        asyncSelect: true,
        displayKey: "classification_name",
        loadOptions: async (inputValue) => {
          try {
            const api = (await import('../../api/dataApi')).default;
            const classificationApi = new api('classification');
            const response = await classificationApi.get('/');
            const classifications = response.data || [];
            const filtered = inputValue
              ? classifications.filter(item =>
                item.category?.toLowerCase().includes(inputValue.toLowerCase()) ||
                item.name?.toLowerCase().includes(inputValue.toLowerCase()) ||
                item.code?.toLowerCase().includes(inputValue.toLowerCase())
              )
              : classifications;
            return filtered.map(item => ({
              value: item.id,
              label: `${item.category || ''} - ${item.name} (${item.code})`,
              data: item
            }));
          } catch (e) { return []; }
        },
        onChange: (value, formData, setFormData) => {
          if (value?.data) {
            setFormData(prev => ({
              ...prev,
              classification_id: value.value,
              classification_category: value.data.category || '',
              classification_type: value.data.classification_type || '',
              classification_from: value.data.classification_from || '',
              classification_to: value.data.classification_to || ''
            }));
          }
        }
      },
      { key: "classification_type", label: "Classification Type", type: "text", readOnly: true },
      { key: "classification_from", label: "Range From", type: "text", readOnly: true },
      { key: "classification_to", label: "Range To", type: "text", readOnly: true },


      { key: 'min_age', label: 'Min Age', type: 'number' },
      { key: 'max_age', label: 'Max Age', type: 'number' },
      { key: "inventory_binding", label: "Inventory Binding", type: "select", options: inventoryBindings },
      { key: "language", label: "Language", type: "text" },
      { key: "edition", label: "Edition", type: "text" },
      { key: "publication_year", label: "Publication Year", type: "number" },
      { key: "pages", label: "Total Pages", type: "number" },
      { key: "status", label: "Status", type: "toggle" },

    ],
    other: [
      { key: "createdbyid", label: "Created By", type: "text" },

      {
        key: "createddate", label: "Created Date", type: "date", render: (value) => {
          return convertToUserTimezone(value, timeZone)
        },
      },
      {
        key: "lastmodifieddate", label: "Last Modified Date", type: "date", render: (value) => {
          return convertToUserTimezone(value, timeZone)
        },
      },
      { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },
    ],
  }), [inventoryBindings, timeZone]);

  const lookupNavigation = {
    author_name: {
      path: "author",
      idField: "author_id",
      labelField: "author_name"
    },
    classification_name: {
      path: "classification",
      idField: "classification_id",
      labelField: "classification_name"
    }
  };


  console.log("BookDetail permissions:", permissions);

  const copies = Array.isArray(book?.copies) ? book.copies : [];
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 5;

  const filteredCopies = useMemo(() => {
    if (!searchTerm) return copies;
    const lowerSearch = searchTerm.toLowerCase();
    return copies.filter(copy =>
      copy.barcode?.toLowerCase().includes(lowerSearch) ||
      copy.itemcallnumber?.toLowerCase().includes(lowerSearch) ||
      copy.status?.toLowerCase().includes(lowerSearch) ||
      copy.full_location_code?.toLowerCase().includes(lowerSearch)
    );
  }, [copies, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCopies = filteredCopies.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCopies.length / itemsPerPage);

  const statusBadgeStyle = (status) => {
    const map = {
      AVAILABLE: { background: "#d1fae5", color: "#065f46" },
      BORROWED: { background: "#dbeafe", color: "#1e40af" },
      MAINTENANCE: { background: "#fef3c7", color: "#92400e" },
      LOST: { background: "#fee2e2", color: "#991b1b" },
      DAMAGED: { background: "#f3e8ff", color: "#6b21a8" },
    };
    return map[status] || { background: "#f3f4f6", color: "#374151" };
  };

  return (
    <>
      <Row>
        <Col lg={12} className="mb-3">
          {book && (
            <ModuleDetail
              moduleName="book"
              moduleApi="book"
              moduleLabel="Book"
              icon="fa-solid fa-book"
              fields={fields}
              lookupNavigation={lookupNavigation}
              externalData={externalData}
              data={book}
              fetchBookData={fetchBookData}
              permissions={permissions || {}}
            />
          )}
        </Col>
      </Row>

      {/* Book Copies Table */}
      {book && (
        <Row className="mb-4 px-3">
          <Col lg={12}>
            <Card style={{
              border: "none",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              overflow: "hidden"
            }}>
              {/* Header */}
              <div style={{
                padding: "16px 24px",
                borderBottom: "1px solid #e9ecef",
                background: "linear-gradient(to right, #f8f9fa, #ffffff)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <h6 style={{
                  margin: 0,
                  color: "var(--primary-color)",
                  fontSize: "15px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <i className="fa-solid fa-layer-group"></i>
                  Inventory / Book Copies
                </h6>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <div style={{ position: "relative" }}>
                    <i className="fa-solid fa-magnifying-glass" style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                      fontSize: "13px"
                    }}></i>
                    <input
                      type="text"
                      placeholder="Search barcode, call no..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        padding: "6px 12px 6px 35px",
                        fontSize: "13px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        width: "220px",
                        outline: "none",
                        transition: "all 0.2s"
                      }}
                      onFocus={(e) => e.target.style.borderColor = "var(--primary-color)"}
                      onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                    />
                  </div>
                  <span style={{
                    background: "var(--primary-color)",
                    color: "#fff",
                    borderRadius: "20px",
                    padding: "2px 12px",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}>
                    {filteredCopies.length} {filteredCopies.length === 1 ? "Copy" : "Copies"}
                  </span>
                </div>
              </div>

              <Card.Body style={{ padding: 0 }}>
                {filteredCopies.length === 0 ? (
                  <div style={{
                    padding: "40px 16px",
                    textAlign: "center",
                    background: "#f8f9fa"
                  }}>
                    <i className="fa-solid fa-circle-info" style={{ fontSize: "32px", color: "#adb5bd", display: "block", marginBottom: "8px" }}></i>
                    <p style={{ color: "#6c757d", margin: 0, fontSize: "14px" }}>
                      {searchTerm ? `No copies found matching "${searchTerm}"` : "No book copies found for this branch."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #e9ecef" }}>
                            {["#", "Barcode", "Call Number", "Status", "Price (₹)", "Rack Location", "Date Accessioned"].map((label, i) => (
                              <th key={i} style={{
                                padding: "12px 16px",
                                textAlign: "left",
                                fontWeight: "600",
                                color: "#495057",
                                whiteSpace: "nowrap"
                              }}>
                                {label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {currentCopies.map((copy, idx) => {
                            const badge = statusBadgeStyle(copy.status);
                            const dateStr = copy.date_accessioned
                              ? new Date(copy.date_accessioned).toLocaleDateString("en-IN")
                              : "—";
                            return (
                              <tr
                                key={copy.id || idx}
                                style={{ borderBottom: "1px solid #e9ecef", transition: "background 0.15s" }}
                                onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                              >
                                <td style={{ padding: "12px 16px", color: "#6c757d", fontWeight: "600" }}>{indexOfFirstItem + idx + 1}</td>
                                <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: "600", color: "#1e293b" }}>
                                  {copy.barcode || "—"}
                                </td>
                                <td style={{ padding: "12px 16px", color: "#374151" }}>
                                  {copy.itemcallnumber || `${copy.cn_class || ""} ${copy.cn_item || ""} ${copy.cn_suffix || ""}`.trim() || "—"}
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                  <span style={{
                                    ...badge,
                                    borderRadius: "20px",
                                    padding: "3px 12px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    display: "inline-block"
                                  }}>
                                    {copy.status || "—"}
                                  </span>
                                </td>
                                <td style={{ padding: "12px 16px", color: "#374151" }}>
                                  {copy.item_price != null ? `₹${parseFloat(copy.item_price).toFixed(2)}` : "—"}
                                </td>
                                <td style={{ padding: "12px 16px", color: "#6c757d", fontFamily: "monospace", fontSize: "12px" }}>
                                  {copy.full_location_code
                                    ? <><i className="fa-solid fa-location-dot me-1" style={{ color: "var(--primary-color)" }}></i>{copy.full_location_code}{copy.rack_name ? ` (${copy.rack_name})` : ""}</>
                                    : <span style={{ color: "#adb5bd" }}>Not assigned</span>
                                  }
                                </td>
                                <td style={{ padding: "12px 16px", color: "#6c757d" }}>{dateStr}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination UI */}
                    {totalPages > 1 && (
                      <div className="d-flex justify-content-between align-items-center px-4 py-3" style={{ borderTop: "1px solid #e9ecef", background: "#fdfdfd" }}>
                        <div style={{ color: "#6c757d", fontSize: "13px" }}>
                          Showing <b>{indexOfFirstItem + 1}</b> to <b>{Math.min(indexOfLastItem, filteredCopies.length)}</b> of <b>{filteredCopies.length}</b> copies
                        </div>
                        <ul className="pagination pagination-sm mb-0">
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setCurrentPage(prev => prev - 1)}>&laquo;</button>
                          </li>
                          {[...Array(totalPages)].map((_, i) => (
                            <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                              <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                            </li>
                          ))}
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setCurrentPage(prev => prev + 1)}>&raquo;</button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
};

export default BookDetail;