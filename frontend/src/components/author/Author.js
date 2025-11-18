import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form, Modal, InputGroup, Badge, Dropdown } from "react-bootstrap";
import * as XLSX from "xlsx";
import { useNavigate, useLocation } from "react-router-dom";
import ResizableTable from "../common/ResizableTable";
import ScrollToTop from "../common/ScrollToTop";
import Loader from "../common/Loader";
import TableHeader from "../common/TableHeader";
import FormModal from "../common/FormModal";
import DataApi from "../../api/dataApi";
import PubSub from "pubsub-js";
import { exportToExcel } from "../../utils/excelExport";

const Author = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [authors, setAuthors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const recordsPerPage = 10;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
  });

  // Column visibility state (checkbox is always shown, not in visibility toggle)
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    email: true,
    bio: true,
  });

  // Fetch authors from API on mount
  useEffect(() => {
    fetchAuthors();
  }, []);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Check for edit query parameter and open edit modal
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get("edit");
    if (editId && authors.length > 0 && !editingAuthor) {
      const authorToEdit = authors.find((a) => a.id === editId);
      if (authorToEdit) {
        setEditingAuthor(authorToEdit);
        setFormData({
          name: authorToEdit.name || "",
          email: authorToEdit.email || "",
          bio: authorToEdit.bio || "",
        });
        setShowModal(true);
        // Remove edit parameter from URL
        params.delete("edit");
        navigate(`/author?${params.toString()}`, { replace: true });
      }
    }
  }, [location.search, authors]);

  // Listen for PubSub event to open add author modal
  useEffect(() => {
    const token = PubSub.subscribe("OPEN_ADD_AUTHOR_MODAL", () => {
      handleAdd();
    });
    return () => {
      PubSub.unsubscribe(token);
    };
  }, []);

  // Fetch authors from API
  const fetchAuthors = async () => {
    try {
      setLoading(true);
      const authorApi = new DataApi("author");
      const response = await authorApi.fetchAll();
      if (response.data && Array.isArray(response.data)) {
        setAuthors(response.data);
      }
    } catch (error) {
      console.error("Error fetching authors:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to fetch authors",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdd = () => {
    setEditingAuthor(null);
    setFormData({ name: "", email: "", bio: "" });
    setShowModal(true);
  };

  const handleEdit = (author) => {
    setEditingAuthor(author);
    setFormData({
      name: author.name || "",
      email: author.email || "",
      bio: author.bio || "",
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      const authorApi = new DataApi("author");
      const response = await authorApi.delete(deleteId);
      if (response.data && response.data.success) {
        PubSub.publish("RECORD_SAVED_TOAST", {
          title: "Success",
          message: "Author deleted successfully",
        });
        fetchAuthors(); // Refresh the list
        setShowDeleteModal(false);
        setDeleteId(null);
      } else {
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Error",
          message: response.data?.errors || "Failed to delete author",
        });
      }
    } catch (error) {
      console.error("Error deleting author:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: error.response?.data?.errors || "Failed to delete author",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkDuplicateAuthor = (name, excludeId = null) => {
    return authors.some(
      (author) =>
        author.name &&
        author.name.toLowerCase().trim() === name.toLowerCase().trim() &&
        author.id !== excludeId
    );
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name || formData.name.trim() === "") {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Validation Error",
        message: "Name is required",
      });
      return;
    }

    // Check for duplicate name
    if (checkDuplicateAuthor(formData.name.trim(), editingAuthor?.id)) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Duplicate Error",
        message: "Author with this name already exists",
      });
      return;
    }

    try {
      setLoading(true);
      const authorApi = new DataApi("author");
      let response;

      console.log("Saving author data:", formData);
      console.log("Editing author:", editingAuthor);

      if (editingAuthor) {
        // Update existing author
        console.log("Updating author with ID:", editingAuthor.id);
        response = await authorApi.update(formData, editingAuthor.id);
        console.log("Update response:", response);
      } else {
        // Create new author
        console.log("Creating new author");
        response = await authorApi.create(formData);
        console.log("Create response:", response);
      }

      // Check if response has success flag
      if (response && response.data && response.data.success) {
        PubSub.publish("RECORD_SAVED_TOAST", {
          title: "Success",
          message: editingAuthor ? "Author updated successfully" : "Author created successfully",
        });
        fetchAuthors(); // Refresh the list
        setShowModal(false);
        setFormData({ name: "", email: "", bio: "" });
        setEditingAuthor(null);
      } else if (response && response.data && response.data.errors) {
        // Handle error in response data
        const errorMessage = typeof response.data.errors === 'string'
          ? response.data.errors
          : Array.isArray(response.data.errors)
            ? response.data.errors.map(e => e.msg || e).join(", ")
            : response.data.errors;
        console.error("Save failed:", errorMessage);
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Error",
          message: errorMessage,
        });
      } else {
        console.error("Invalid response:", response);
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Error",
          message: "Failed to save author",
        });
      }
    } catch (error) {
      console.error("Error saving author:", error);
      console.error("Error response:", error.response);

      // Extract error message from error response
      let errorMessage = "Failed to save author";

      if (error.response && error.response.data) {
        if (error.response.data.errors) {
          // Handle errors field (can be string, array, or object)
          if (typeof error.response.data.errors === 'string') {
            errorMessage = error.response.data.errors;
          } else if (Array.isArray(error.response.data.errors)) {
            errorMessage = error.response.data.errors.map(e => e.msg || e).join(", ");
          } else if (typeof error.response.data.errors === 'object') {
            // If errors is an object, try to extract message
            errorMessage = error.response.data.errors.message || JSON.stringify(error.response.data.errors);
          }
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          const importedAuthors = jsonData
            .filter((item) => item.Name || item.name) // Filter out empty rows
            .map((item) => ({
              name: String(item.Name || item.name || "").trim(),
              email: String(item.Email || item.email || "").trim(),
              bio: String(item.Bio || item.bio || "").trim(),
            }))
            .filter((author) => author.name); // Remove authors without name

          // Import each author to DB
          const authorApi = new DataApi("author");
          let successCount = 0;
          let errorCount = 0;

          for (const author of importedAuthors) {
            try {
              await authorApi.create(author);
              successCount++;
            } catch (error) {
              console.error("Error importing author:", author.name, error);
              errorCount++;
            }
          }

          PubSub.publish("RECORD_SAVED_TOAST", {
            title: "Import Complete",
            message: `Successfully imported ${successCount} author(s)${errorCount > 0 ? `. ${errorCount} failed.` : ""}`,
          });

          fetchAuthors(); // Refresh the list
        } catch (error) {
          console.error("Error importing file:", error);
          PubSub.publish("RECORD_ERROR_TOAST", {
            title: "Import Error",
            message: "Failed to import file",
          });
        } finally {
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleExport = async () => {
    try {
      // If items are selected, export only selected items; otherwise export all filtered items
      const exportList = (selectedItems && selectedItems.length > 0)
        ? filteredAuthors.filter(a => (selectedItems || []).includes(a.id))
        : filteredAuthors;

      if (exportList.length === 0) {
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Error",
          message: "No authors to export. Please select authors or clear search filter.",
        });
        return;
      }

      const exportData = exportList.map((author) => ({
        Name: author.name || "",
        Email: author.email || "",
        Bio: author.bio || "",
      }));

      const columns = [
        { key: 'Name', header: 'Name', width: 30 },
        { key: 'Email', header: 'Email', width: 30 },
        { key: 'Bio', header: 'Bio', width: 50 }
      ];

      await exportToExcel(exportData, 'authors', 'Authors', columns);

      PubSub.publish("RECORD_SAVED_TOAST", {
        title: "Export Successful",
        message: `Exported ${exportList.length} author${exportList.length > 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error('Error exporting authors:', error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Export Error",
        message: "Failed to export authors",
      });
    }
  };

  const filteredAuthors = authors.filter(
    (author) =>
      (author.name && String(author.name).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (author.email && String(author.email).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (author.bio && String(author.bio).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle individual checkbox toggle
  const toggleSelectItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectedItems.length === filteredAuthors.length) {
      // If all are selected, deselect all
      setSelectedItems([]);
    } else {
      // Select all filtered authors
      setSelectedItems(filteredAuthors.map(author => author.id));
    }
  };

  const allColumns = [
    {
      field: "checkbox",
      label: (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Form.Check
            type="checkbox"
            checked={selectedItems.length === filteredAuthors.length && filteredAuthors.length > 0}
            indeterminate={selectedItems.length > 0 && selectedItems.length < filteredAuthors.length}
            onChange={handleSelectAll}
            title="Select all"
            style={{ margin: 0 }}
          />
        </div>
      ),
      render: (value, record) => (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Form.Check
            type="checkbox"
            checked={selectedItems.includes(record.id)}
            onChange={() => toggleSelectItem(record.id)}
            onClick={(e) => e.stopPropagation()}
            style={{ margin: 0 }}
          />
        </div>
      ),
      sortable: false,
      width: 50,
    },
    {
      field: "sr_no",
      label: "SR.NO",
      render: (value, record) => {
        const idx = filteredAuthors.findIndex(r => r.id === record.id);
        return idx >= 0 ? idx + 1 : "";
      },
      sortable: false,
      width: 80,
    },
    {
      field: "name",
      label: "Name",
      render: (value, record) => (
        <div className="d-flex align-items-center">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center me-2"
            style={{
              width: "32px",
              height: "32px",
              background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
              color: "white",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            {value.charAt(0)}
          </div>
          <a
            href={`/author/${record.id}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/author/${record.id}`);
            }}
            style={{ color: "#6f42c1", textDecoration: "none", fontWeight: "500" }}
            onMouseEnter={(e) => {
              try { localStorage.setItem(`prefetch:author:${record.id}`, JSON.stringify(record)); } catch (err) {}
              e.target.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
          >
            {value}
          </a>
        </div>
      ),
    },
    {
      field: "email",
      label: "Email",
      render: (value) => <span style={{ color: "#6c757d" }}>{value}</span>,
    },
    {
      field: "bio",
      label: "Bio",
    },
  ];

  // Filter columns based on visibility (always include checkbox and SR.NO)
  const columns = [
    allColumns[0], // Always include checkbox
    allColumns[1], // Always include SR.NO
    ...allColumns.slice(2).filter(col => visibleColumns[col.field] !== false)
  ];

  // Columns for visibility toggle (exclude checkbox and SR.NO)
  const columnsForVisibilityToggle = allColumns.slice(2);

  // Toggle column visibility
  const toggleColumnVisibility = (field) => {
    setVisibleColumns(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const actionsRenderer = (author) => (
    <div className="d-flex gap-2">
      <Button
        variant="link"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(author);
        }}
        className="action-btn"
        style={{ color: "#6f42c1", padding: "4px 8px" }}
      >
        <i className="fa-solid fa-edit"></i>
      </Button>
      <Button
        variant="link"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(author.id);
        }}
        className="action-btn"
        style={{ color: "#dc3545", padding: "4px 8px" }}
      >
        <i className="fa-solid fa-trash"></i>
      </Button>
    </div>
  );

  return (
    <Container fluid>
      <ScrollToTop />
      <Row className="mb-4">
        <Col>
          <TableHeader
            title="Author Management"
            icon="fa-solid fa-user-pen"
            totalCount={authors.length}
            totalLabel={authors.length === 1 ? "Author" : "Authors"}
            searchPlaceholder="Search authors..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            showColumnVisibility={true}
            allColumns={columnsForVisibilityToggle}
            visibleColumns={visibleColumns}
            onToggleColumnVisibility={toggleColumnVisibility}
            actionButtons={[
              {
                variant: "outline-primary",
                icon: "fa-solid fa-upload",
                label: "Import",
                onClick: () => document.getElementById("importAuthorFile").click(),
                style: { borderColor: "#6f42c1", color: "#6f42c1" },
              },
              {
                variant: "outline-success",
                icon: "fa-solid fa-download",
                label: "Export",
                onClick: handleExport,
              },
              {
                icon: "fa-solid fa-plus",
                label: "Add Author",
                onClick: handleAdd,
              },
            ]}
          />
          <input
            type="file"
            id="importAuthorFile"
            accept=".xlsx,.xls,.csv"
            onChange={handleImport}
            style={{ display: "none" }}
          />
        </Col>
      </Row>

      <Row className="mb-3">
        <Col>
          <InputGroup>
            <InputGroup.Text style={{ background: "#f3e9fc", borderColor: "#e9ecef" }}>
              <i className="fa-solid fa-search" style={{ color: "#6f42c1" }}></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Search authors by name, email, or bio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ borderColor: "#e9ecef" }}
            />
          </InputGroup>


        </Col>
      </Row>

      <Row style={{ margin: 0, width: "100%", maxWidth: "100%" }}>
        <Col style={{ padding: 0, width: "100%", maxWidth: "100%" }}>
          <Card style={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "4px", overflow: "hidden", width: "100%", maxWidth: "100%" }}>
            <Card.Body className="p-0" style={{ overflow: "hidden", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
              {loading ? (
                <Loader />
              ) : (
                <ResizableTable
                  data={filteredAuthors}
                  columns={columns}
                  loading={loading}
                  currentPage={currentPage}
                  totalRecords={filteredAuthors.length}
                  recordsPerPage={recordsPerPage}
                  onPageChange={setCurrentPage}
                  showSerialNumber={false}
                  showCheckbox={false}
                  showActions={true}
                  actionsRenderer={actionsRenderer}
                  showSearch={false}
                  emptyMessage="No authors found"
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add/Edit Modal */}
      <FormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title={editingAuthor ? "Edit Author" : "Add New Author"}
        icon="fa-solid fa-user-pen"
        formData={formData}
        setFormData={setFormData}
        fields={[
          {
            name: "name",
            label: "Name",
            type: "text",
            required: true,
            placeholder: "Enter author name",
            colSize: 12,
          },
          {
            name: "email",
            label: "Email",
            type: "email",
            placeholder: "Enter email",
            colSize: 12,
          },
          {
            name: "bio",
            label: "Bio",
            type: "textarea",
            rows: 3,
            placeholder: "Enter author bio",
            colSize: 12,
          },
        ]}
        onSubmit={handleSave}
        loading={loading}
        editingItem={editingAuthor}
      />

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this author?</Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Author;
