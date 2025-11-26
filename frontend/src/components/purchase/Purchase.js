import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form, Modal, InputGroup, Badge, Table, Alert, Tab, Tabs } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import ResizableTable from "../common/ResizableTable";
import ScrollToTop from "../common/ScrollToTop";
import Loader from "../common/Loader";
import TableHeader from "../common/TableHeader";
import FormModal from "../common/FormModal";
import DataApi from "../../api/dataApi";
import PubSub from "pubsub-js";
import { exportToExcel } from "../../utils/excelExport";
import Select from "react-select";
import { toast } from "react-toastify";

const Purchase = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [purchases, setPurchases] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [books, setBooks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkInsertModal, setShowBulkInsertModal] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [bulkInsertData, setBulkInsertData] = useState([]);
  const [multiInsertRows, setMultiInsertRows] = useState([{ vendor_id: "", book_id: "", quantity: 1, unit_price: 0, purchase_date: new Date().toISOString().split('T')[0], notes: "" }]);
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("manual");
  const [selectedFile, setSelectedFile] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanningBook, setScanningBook] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendorFormData, setVendorFormData] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    status: "active",
  });
  const [bookFormData, setBookFormData] = useState({
    title: "",
    author_id: "",
    category_id: "",
    isbn: "",
    language: "",
    total_copies: 1,
    available_copies: 1,
  });
  const recordsPerPage = 10;

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    vendor_name: true,
    book_title: true,
    book_isbn: true,
    quantity: true,
    unit_price: true,
    total_amount: true,
    purchase_date: true,
    notes: true,
  });

  const [formData, setFormData] = useState({
    vendor_id: "",
    book_id: "",
    quantity: 1,
    unit_price: 0,
    purchase_date: new Date().toISOString().split('T')[0],
    notes: "",
  });

  useEffect(() => {
    fetchPurchases();
    fetchVendors();
    fetchBooks();
    fetchAuthors();
    fetchCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    // Clear selection when search changes
    setSelectedItems([]);
  }, [searchTerm]);

  // Clear selection when purchases data changes
  useEffect(() => {
    // Keep only selected items that still exist in the data
    const validIds = purchases.map(p => p.id);
    setSelectedItems(prev => prev.filter(id => validIds.includes(id)));
  }, [purchases]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const purchaseApi = new DataApi("purchase");
      const response = await purchaseApi.fetchAll();
      console.log("Purchases:", response.data);
      if (response.data) {
        setPurchases(response.data);
      }
    } catch (error) {
      console.error("Error fetching purchases:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to fetch purchases",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const vendorApi = new DataApi("vendor");
      const response = await vendorApi.fetchAll();
      if (response.data) {
        setVendors(response.data);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const fetchBooks = async () => {
    try {
      const bookApi = new DataApi("book");
      const response = await bookApi.fetchAll();
      console.log("Books:", response.data);
      if (response.data) {
        setBooks(response.data);
      }
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  const fetchAuthors = async () => {
    try {
      const authorApi = new DataApi("author");
      const response = await authorApi.fetchAll();
      if (response.data && Array.isArray(response.data)) {
        setAuthors(response.data);
      }
    } catch (error) {
      console.error("Error fetching authors:", error);
      setAuthors([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoryApi = new DataApi("category");
      const response = await categoryApi.fetchAll();
      if (response.data && Array.isArray(response.data)) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const handleBookChange = (selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      book_id: selectedOption ? selectedOption.value : "",
    }));
  };

  const bookOptions = books.map((book) => ({
    value: book.id,
    label: `${book.title}${book.isbn ? ` (${book.isbn})` : ""}`,
  }));
  const handleVendorChange = (selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      vendor_id: selectedOption ? selectedOption.value : "",
    }));
  };
console.log("Vendors:", vendors);
  const vendorOptions = vendors.map((vendor) => ({
    value: vendor.id,
    label: vendor.name,
  }));
console.log("Vendor Options:", vendorOptions);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };

    // Calculate total amount
    if (name === "quantity" || name === "unit_price") {
      updatedData.total_amount = (parseFloat(updatedData.quantity) || 0) * (parseFloat(updatedData.unit_price) || 0);
    }

    setFormData(updatedData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const purchaseApi = new DataApi("purchase");

      if (editingPurchase) {
        await purchaseApi.update(formData, editingPurchase.id);
        PubSub.publish("RECORD_SUCCESS_TOAST", {
          title: "Success",
          message: "Purchase updated successfully",
        });
      } else {
        await purchaseApi.create(formData);
        PubSub.publish("RECORD_SUCCESS_TOAST", {
          title: "Success",
          message: "Purchase created successfully",
        });
      }

      setShowModal(false);
      resetForm();
      fetchPurchases();
    } catch (error) {
      console.error("Error saving purchase:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: error.response?.data?.errors || "Failed to save purchase",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (purchase) => {
    setEditingPurchase(purchase);
    setFormData({
      vendor_id: purchase.vendor_id || "",
      book_id: purchase.book_id || "",
      quantity: purchase.quantity || 1,
      unit_price: purchase.unit_price || 0,
      purchase_date: purchase.purchase_date || new Date().toISOString().split('T')[0],
      notes: purchase.notes || "",
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setLoading(true);
      const purchaseApi = new DataApi("purchase");
      await purchaseApi.delete(deleteId);
      PubSub.publish("RECORD_SUCCESS_TOAST", {
        title: "Success",
        message: "Purchase deleted successfully",
      });
      setShowDeleteModal(false);
      setDeleteId(null);
      fetchPurchases();
    } catch (error) {
      console.error("Error deleting purchase:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to delete purchase",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vendor_id: "",
      book_id: "",
      quantity: 1,
      unit_price: 0,
      purchase_date: new Date().toISOString().split('T')[0],
      notes: "",
    });
    setEditingPurchase(null);
  };

  const handleBulkInsert = () => {
    setBulkInsertData([]);
    setMultiInsertRows([{ vendor_id: "", book_id: "", quantity: 1, unit_price: 0, purchase_date: new Date().toISOString().split('T')[0], notes: "" }]);
    setActiveTab("manual");
    setSelectedFile(null);
    setShowBulkInsertModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleBarcodeScan = async (barcode) => {
    if (!barcode || barcode.trim().length < 10) {
      toast.error("Please enter a valid barcode/ISBN (minimum 10 characters)");
      return;
    }

    try {
      setLoading(true);
      const bookApi = new DataApi("book");

      // Try to find book by ISBN
      const allBooks = await bookApi.fetchAll();
      const bookData = allBooks?.data || allBooks || [];

      // Search by ISBN (exact match or partial)
      const foundBook = bookData.find(book =>
        book.isbn && (
          book.isbn === barcode.trim() ||
          book.isbn.replace(/[-\s]/g, '') === barcode.trim().replace(/[-\s]/g, '') ||
          book.isbn.includes(barcode.trim()) ||
          barcode.trim().includes(book.isbn)
        )
      );

      if (foundBook) {
        setScanningBook(foundBook);
        toast.success(`Book found: ${foundBook.title}`);
      } else {
        toast.error("Book not found with this ISBN/Barcode");
        setScanningBook(null);
      }
    } catch (error) {
      console.error("Error scanning barcode:", error);
      toast.error("Failed to scan barcode. Please try again.");
      setScanningBook(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMultiRow = () => {
    setMultiInsertRows([...multiInsertRows, { vendor_id: "", book_id: "", quantity: 1, unit_price: 0, purchase_date: new Date().toISOString().split('T')[0], notes: "" }]);
  };

  const handleRemoveMultiRow = (index) => {
    if (multiInsertRows.length > 1) {
      setMultiInsertRows(multiInsertRows.filter((_, i) => i !== index));
    }
  };

  const handleMultiRowChange = (index, field, value) => {
    const updatedRows = [...multiInsertRows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setMultiInsertRows(updatedRows);
  };

  const handleAddVendor = async () => {
    if (!vendorFormData.name || !vendorFormData.name.trim()) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Validation Error",
        message: "Vendor name is required",
      });
      return;
    }

    try {
      setLoading(true);
      const vendorApi = new DataApi("purchasevendor");
      const response = await vendorApi.create(vendorFormData);

      if (response.data) {
        const newVendorId = response.data.id || response.data;
        PubSub.publish("RECORD_SUCCESS_TOAST", {
          title: "Success",
          message: "Vendor added successfully",
        });
        setShowAddVendorModal(false);
        setVendorFormData({
          name: "",
          company_name: "",
          email: "",
          phone: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
          status: "active",
        });
        await fetchVendors();
        // Auto-select the newly added vendor in the current row
        if (typeof newVendorId !== 'undefined') {
          const updatedRows = [...multiInsertRows];
          updatedRows[currentRowIndex] = { ...updatedRows[currentRowIndex], vendor_id: newVendorId };
          setMultiInsertRows(updatedRows);
        }
      }
    } catch (error) {
      console.error("Error adding vendor:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: error.response?.data?.errors || "Failed to add vendor",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async () => {
    if (!bookFormData.title || !bookFormData.title.trim()) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Validation Error",
        message: "Book title is required",
      });
      return;
    }

    if (!bookFormData.author_id) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Validation Error",
        message: "Author is required",
      });
      return;
    }

    if (!bookFormData.category_id) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Validation Error",
        message: "Category is required",
      });
      return;
    }

    try {
      setLoading(true);
      const bookApi = new DataApi("book");
      const response = await bookApi.create(bookFormData);

      if (response.data) {
        const newBookId = response.data.id || response.data;
        PubSub.publish("RECORD_SUCCESS_TOAST", {
          title: "Success",
          message: "Book added successfully",
        });
        setShowAddBookModal(false);
        setBookFormData({
          title: "",
          author_id: "",
          category_id: "",
          isbn: "",
          language: "",
          total_copies: 1,
          available_copies: 1,
        });
        await fetchBooks();
        // Auto-select the newly added book in the current row
        if (typeof newBookId !== 'undefined') {
          const updatedRows = [...multiInsertRows];
          updatedRows[currentRowIndex] = { ...updatedRows[currentRowIndex], book_id: newBookId };
          setMultiInsertRows(updatedRows);
        }
      }
    } catch (error) {
      console.error("Error adding book:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: error.response?.data?.errors || "Failed to add book",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMultiInsertSave = async () => {
    // Check for partially filled rows
    const partiallyFilledRows = [];
    multiInsertRows.forEach((row, index) => {
      const hasSomeFields = row.vendor_id || row.book_id || row.quantity || row.unit_price;
      const hasAllRequiredFields = row.vendor_id && row.book_id && row.quantity && row.unit_price;

      if (hasSomeFields && !hasAllRequiredFields) {
        partiallyFilledRows.push(index + 1); // Row number (1-based)
      }
    });

    if (partiallyFilledRows.length > 0) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Validation Error",
        message: `Row(s) ${partiallyFilledRows.join(", ")} are partially filled. Please fill all required fields (Vendor, Book, Quantity, Unit Price) or delete the row(s).`,
      });
      return;
    }

    // Convert multiInsertRows to purchase data format - only include fully filled rows
    const convertedData = multiInsertRows
      .map((row) => {
        if (!row.vendor_id || !row.book_id || !row.quantity || !row.unit_price) {
          return null;
        }
        return {
          vendor_id: row.vendor_id,
          book_id: row.book_id,
          quantity: parseInt(row.quantity) || 1,
          unit_price: parseFloat(row.unit_price) || 0,
          purchase_date: row.purchase_date || new Date().toISOString().split('T')[0],
          notes: row.notes || "",
          total_amount: (parseInt(row.quantity) || 1) * (parseFloat(row.unit_price) || 0),
        };
      })
      .filter((purchase) => purchase !== null);

    if (convertedData.length === 0) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Please fill at least one complete purchase entry (Vendor, Book, Quantity, and Unit Price are required)",
      });
      return;
    }

    try {
      setLoading(true);
      const purchaseApi = new DataApi("purchase");
      let successCount = 0;
      let failCount = 0;

      for (const purchaseData of convertedData) {
        try {
          await purchaseApi.create(purchaseData);
          successCount++;
        } catch (error) {
          console.error("Error creating purchase:", error);
          failCount++;
        }
      }

      if (successCount > 0) {
        PubSub.publish("RECORD_SUCCESS_TOAST", {
          title: "Success",
          message: `Successfully created ${successCount} purchase${successCount > 1 ? 's' : ''}`,
        });
        setShowBulkInsertModal(false);
        setMultiInsertRows([{ vendor_id: "", book_id: "", quantity: 1, unit_price: 0, purchase_date: new Date().toISOString().split('T')[0], notes: "" }]);
        fetchPurchases();
      }

      if (failCount > 0) {
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Error",
          message: `Failed to create ${failCount} purchase${failCount > 1 ? 's' : ''}`,
        });
      }
    } catch (error) {
      console.error("Error in bulk insert:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to save purchases",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Export only selected items if any are selected, otherwise export all
    const dataToExport = selectedItems.length > 0
      ? filteredPurchases.filter(p => selectedItems.includes(p.id))
      : filteredPurchases;

    if (dataToExport.length === 0) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Export Error",
        message: selectedItems.length > 0
          ? "No selected items to export"
          : "No data to export",
      });
      return;
    }

    const exportData = dataToExport.map((p) => ({
      "Vendor": p.vendor_name || "N/A",
      "Book": p.book_title || "N/A",
      "ISBN": p.book_isbn || "N/A",
      "Quantity": p.quantity,
      "Unit Price": p.unit_price,
      "Total Amount": p.total_amount,
      "Purchase Date": p.purchase_date,
      "Notes": p.notes || "",
    }));
    exportToExcel(exportData, "Purchases");

    PubSub.publish("RECORD_SAVED_TOAST", {
      title: "Success",
      message: `Exported ${dataToExport.length} purchase${dataToExport.length > 1 ? 's' : ''}`,
    });
  };

  const handleMultiDelete = async () => {
    if (selectedItems.length === 0) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Please select items to delete",
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedItems.length} selected purchase(s)?`)) {
      return;
    }

    try {
      setLoading(true);
      const purchaseApi = new DataApi("purchase");
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedItems) {
        try {
          await purchaseApi.delete(id);
          successCount++;
        } catch (error) {
          console.error(`Error deleting purchase ${id}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        PubSub.publish("RECORD_SAVED_TOAST", {
          title: "Success",
          message: `Deleted ${successCount} purchase(s) successfully`,
        });
        setSelectedItems([]);
        fetchPurchases();
      }

      if (failCount > 0) {
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Error",
          message: `Failed to delete ${failCount} purchase(s)`,
        });
      }
    } catch (error) {
      console.error("Error in multi-delete:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to delete purchases",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchases = purchases.filter((purchase) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (purchase.vendor_name && purchase.vendor_name.toLowerCase().includes(searchLower)) ||
      (purchase.book_title && purchase.book_title.toLowerCase().includes(searchLower)) ||
      (purchase.book_isbn && purchase.book_isbn.toLowerCase().includes(searchLower))
    );
  });

  const allColumns = [
    {
      field: "vendor_name",
      label: "Vendor",
      sortable: true,
      render: (value, record) => (
        <a
          href={`/vendor/${record.vendor_id}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/vendor/${record.vendor_id}`);
          }}
          style={{ color: "#6f42c1", textDecoration: "none", fontWeight: "500" }}
          onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
        >
          {value || "N/A"}
        </a>
      ),
    },
    {
      field: "book_title",
      label: "Book",
      sortable: true,
      render: (value, record) => (
        <a
          href={`/book/${record.book_id}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/book/${record.book_id}`);
          }}
          style={{ color: "#6f42c1", textDecoration: "none", fontWeight: "500" }}
          onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
        >
          {value || "N/A"}
        </a>
      ),
    },
    { field: "book_isbn", label: "ISBN" },
    {
      field: "quantity",
      label: "Quantity",
      sortable: true,
      render: (value, record) => record.quantity || 0
    },
    {
      field: "unit_price",
      label: "Unit Price",
      sortable: true,
      render: (value, record) => `₹${parseFloat(record.unit_price || 0).toFixed(2)}`
    },
    {
      field: "total_amount",
      label: "Total Amount",
      sortable: true,
      render: (value, record) => `₹${parseFloat(record.total_amount || 0).toFixed(2)}`
    },
    {
      field: "purchase_date",
      label: "Purchase Date",
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : "-"
    },
    {
      field: "notes",
      label: "Notes",
      render: (value, record) => record.notes || "-"
    },
  ];

  // Filter columns based on visibility
  const columns = allColumns.filter(col => visibleColumns[col.field] !== false);

  // Toggle column visibility
  const toggleColumnVisibility = (field) => {
    setVisibleColumns(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const actionsRenderer = (purchase) => (
    <>
      <Button
        variant="link"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(purchase);
        }}
        style={{ padding: "0.25rem 0.5rem" }}
      >
        <i className=" fs-5 fas fa-edit text-primary"></i>
      </Button>
      <Button
        variant="link"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setDeleteId(purchase.id);
          setShowDeleteModal(true);
        }}
        style={{ padding: "0.25rem 0.5rem" }}
      >
        <i className=" fs-5 fas fa-trash text-danger"></i>
      </Button>
    </>
  );

  return (
    <Container fluid >
      <ScrollToTop />
      <Row className="mb-3" style={{ marginTop: "0.5rem" }}>
        <Col>
          <TableHeader
            title="Purchase Management"
            icon="fa-solid fa-shopping-cart"
            totalCount={filteredPurchases.length}
            totalLabel={filteredPurchases.length === 1 ? "Purchase" : "Purchases"}
            searchPlaceholder="Search purchases..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            showColumnVisibility={true}
            allColumns={allColumns}
            visibleColumns={visibleColumns}
            onToggleColumnVisibility={toggleColumnVisibility}
            actionButtons={[
              {
                variant: "outline-success",
                size: "sm",
                icon: "fa-solid fa-download",
                label: "Export",
                onClick: handleExport,
              },
              {
                size: "sm",
                icon: "fa-solid fa-layer-group",
                label: "Add Purchase",
                onClick: handleBulkInsert,
                style: {
                  background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                  border: "none",
                },
              },
            ]}
          />
        </Col>
      </Row>
      {loading && purchases.length === 0 ? (
        <Loader />
      ) : (
        <>

          <Row style={{ margin: 0, width: "100%", maxWidth: "100%" }}>
            <Col style={{ padding: 0, width: "100%", maxWidth: "100%" }}>
              <Card style={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "4px", overflow: "hidden", width: "100%", maxWidth: "100%" }}>
                <Card.Body className="p-0" style={{ overflow: "hidden", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
                  {loading ? (
                    <Loader />
                  ) : (
                    <ResizableTable
                      data={filteredPurchases}
                      columns={columns}
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                      currentPage={currentPage}
                      totalRecords={filteredPurchases.length}
                      recordsPerPage={recordsPerPage}
                      onPageChange={setCurrentPage}
                      headerActions={[]}
                      actionsRenderer={actionsRenderer}
                      loading={loading}
                      showSerialNumber={true}
                      showActions={true}
                      showCheckbox={true}
                      selectedItems={selectedItems}
                      onSelectionChange={setSelectedItems}
                      showSearch={false}
                      emptyMessage="No purchases found"
                    />
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

        </>
      )}


      {/* Add/Edit Modal */}
      < Modal show={showModal} onHide={() => { setShowModal(false); resetForm(); }} size="lg" >
        <Modal.Header closeButton>
          <Modal.Title>{editingPurchase ? "Edit Purchase" : "Add Purchase"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vendor <span className="text-danger">*</span></Form.Label>
                  <Select
                    name="vendor_id"
                    value={
                      vendorOptions.find((v) => v.value === formData.vendor_id) || null
                    }
                    onChange={handleVendorChange}
                    options={vendorOptions}
                    placeholder="Select Vendor"
                    isClearable
                    isSearchable
                    styles={{
                      control: (base) => ({
                        ...base,
                        border: "2px solid #c084fc",
                        borderRadius: "8px",
                        boxShadow: "none",
                        padding: "2px",
                        "&:hover": { borderColor: "#a855f7" },
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused ? "#f3e8ff" : "white",
                        color: "#4c1d95",
                        cursor: "pointer",
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: "#6b7280",
                      }),
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Book <span className="text-danger">*</span></Form.Label>
                  <Select
                    name="book_id"
                    value={bookOptions.find((b) => b.value === formData.book_id) || null}
                    onChange={handleBookChange}
                    options={bookOptions}
                    placeholder="Select Book"
                    isClearable
                    isSearchable
                    styles={{
                      control: (base) => ({
                        ...base,
                        border: "2px solid #c084fc",
                        borderRadius: "8px",
                        boxShadow: "none",
                        padding: "2px",
                        "&:hover": { borderColor: "#a855f7" },
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused ? "#f3e8ff" : "white",
                        color: "#4c1d95",
                        cursor: "pointer",
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: "#6b7280",
                      }),
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit Price <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="unit_price"
                    value={formData.unit_price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Amount</Form.Label>
                  <Form.Control
                    type="text"
                    value={`₹${((parseFloat(formData.quantity) || 0) * (parseFloat(formData.unit_price) || 0)).toFixed(2)}`}
                    readOnly
                    className="bg-light"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Purchase Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="purchase_date"
                    value={formData.purchase_date}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Additional notes..."
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "Saving..." : editingPurchase ? "Update" : "Create"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal >

      {/* Delete Confirmation Modal */}
      < Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this purchase? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal >

      {/* Bulk Insert Modal */}
      <Modal show={showBulkInsertModal} onHide={() => setShowBulkInsertModal(false)} size="xl" centered>
        <Modal.Header closeButton style={{
          background: "linear-gradient(to right, #f3e9fc, #ffffff)",
          color: "#6f42c1",
          borderBottom: "1px solid #e9ecef",
          padding: "20px 24px"
        }}>
          <Modal.Title style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "20px", fontWeight: "600", color: "#6f42c1" }}>
            <i className="fa-solid fa-layer-group" style={{ fontSize: "24px" }}></i>
            Bulk Purchase Insert
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "0", maxHeight: "70vh", overflowY: "auto" }}>
          <style>{`
            .nav-tabs {
              border-bottom: 1px solid #e9ecef;
              padding: 0 24px;
              margin: 0;
            }
            .nav-tabs .nav-link {
              border: none;
              border-bottom: 3px solid transparent;
              color: #6c757d;
              padding: 12px 20px;
              font-weight: 500;
              background: transparent;
            }
            .nav-tabs .nav-link:hover {
              border-color: transparent;
              color: #6f42c1;
            }
            .nav-tabs .nav-link.active {
              color: #6f42c1;
              background: transparent;
              border-bottom: 3px solid #6f42c1;
              font-weight: 600;
            }
            .tab-content {
              padding: 24px;
            }
          `}</style>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-0"
          >
            <Tab
              eventKey="manual"
              title="Manual Entry"
            >
              {/* <div className="mb-3 d-flex justify-content-between align-items-center">
                <h6 style={{ color: "#333", fontWeight: "600", margin: 0 }}>Add Purchases Manually</h6>
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleAddMultiRow}
                  className="custom-btn-primary"

                >
                  <i className="fa-solid fa-plus"></i>
                  Add Row
                </Button>
              </div>
              <div className="mb-3">
                <span style={{ color: "#6c757d", fontSize: "14px", fontWeight: "500" }}>
                  Total Rows: {multiInsertRows.length}
                </span>
              </div>

              <div className="table-responsive">
                <Table bordered hover style={{ marginBottom: 0 }}>
                  <thead style={{ background: "#f8f9fa" }}>
                    <tr>
                      <th style={{ width: "20%", padding: "12px", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #dee2e6" }}>
                        Vendor <span className="text-danger">*</span>
                      </th>
                      <th style={{ width: "20%", padding: "12px", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #dee2e6" }}>
                        Book <span className="text-danger">*</span>
                      </th>
                      <th style={{ width: "10%", padding: "12px", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #dee2e6" }}>
                        Quantity <span className="text-danger">*</span>
                      </th>
                      <th style={{ width: "12%", padding: "12px", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #dee2e6" }}>
                        Unit Price <span className="text-danger">*</span>
                      </th>
                      <th style={{ width: "12%", padding: "12px", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #dee2e6" }}>
                        Total Amount
                      </th>
                      <th style={{ width: "12%", padding: "12px", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #dee2e6" }}>
                        Purchase Date
                      </th>
                      <th style={{ width: "10%", padding: "12px", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #dee2e6" }}>
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {multiInsertRows.map((row, index) => (
                      <tr key={index}>
                        <td style={{ position: "relative", zIndex: 1, padding: "12px", verticalAlign: "middle" }}>
                          <div className="d-flex gap-1" style={{ position: "relative" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Select
                                value={vendorOptions.find((v) => v.value === row.vendor_id) || null}
                                onChange={(selectedOption) => handleMultiRowChange(index, "vendor_id", selectedOption ? selectedOption.value : "")}
                                options={vendorOptions}
                                placeholder="Select Vendor"
                                isClearable
                                isSearchable
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    minHeight: "38px",
                                    fontSize: "14px",
                                    width: "100%",
                                    border: "1px solid #ced4da",
                                    borderRadius: "4px",
                                    "&:hover": {
                                      borderColor: "#6f42c1",
                                    },
                                  }),
                                  menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                  }),
                                  menu: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                  }),
                                }}
                              />
                            </div>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => {
                                setCurrentRowIndex(index);
                                setShowAddVendorModal(true);
                              }}
                              style={{
                                minWidth: "38px",
                                padding: "6px 8px",
                                flexShrink: 0,
                                borderColor: "#6f42c1",
                                color: "#6f42c1"
                              }}
                              title="Add New Vendor"
                            >
                              <i className="fa-solid fa-plus"></i>
                            </Button>
                          </div>
                        </td>
                        <td style={{ position: "relative", zIndex: 1, padding: "12px", verticalAlign: "middle" }}>
                          <div className="d-flex gap-1" style={{ position: "relative" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Select
                                value={bookOptions.find((b) => b.value === row.book_id) || null}
                                onChange={(selectedOption) => handleMultiRowChange(index, "book_id", selectedOption ? selectedOption.value : "")}
                                options={bookOptions}
                                placeholder="Select Book"
                                isClearable
                                isSearchable
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    minHeight: "38px",
                                    fontSize: "14px",
                                    width: "100%",
                                    border: "1px solid #ced4da",
                                    borderRadius: "4px",
                                    "&:hover": {
                                      borderColor: "#6f42c1",
                                    },
                                  }),
                                  menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                  }),
                                  menu: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                  }),
                                }}
                              />
                            </div>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => {
                                setCurrentRowIndex(index);
                                setShowAddBookModal(true);
                              }}
                              style={{
                                minWidth: "38px",
                                padding: "6px 8px",
                                flexShrink: 0,
                                borderColor: "#6f42c1",
                                color: "#6f42c1"
                              }}
                              title="Add New Book"
                            >
                              <i className="fa-solid fa-plus"></i>
                            </Button>
                          </div>
                        </td>
                        <td style={{ padding: "12px", verticalAlign: "middle" }}>
                          <Form.Control
                            type="number"
                            value={row.quantity}
                            onChange={(e) => handleMultiRowChange(index, "quantity", e.target.value)}
                            min="1"
                            style={{ fontSize: "14px", height: "38px", border: "1px solid #ced4da" }}
                          />
                        </td>
                        <td style={{ padding: "12px", verticalAlign: "middle" }}>
                          <Form.Control
                            type="number"
                            value={row.unit_price}
                            onChange={(e) => handleMultiRowChange(index, "unit_price", e.target.value)}
                            min="0"
                            step="0.01"
                            style={{ fontSize: "14px", height: "38px", border: "1px solid #ced4da" }}
                          />
                        </td>
                        <td style={{ padding: "12px", verticalAlign: "middle" }}>
                          <Form.Control
                            type="text"
                            value={`₹${((parseFloat(row.quantity) || 0) * (parseFloat(row.unit_price) || 0)).toFixed(2)}`}
                            readOnly
                            className="bg-light"
                            style={{ fontSize: "14px", height: "38px", border: "1px solid #ced4da", backgroundColor: "#f8f9fa" }}
                          />
                        </td>
                        <td style={{ padding: "12px", verticalAlign: "middle" }}>
                          <Form.Control
                            type="date"
                            value={row.purchase_date}
                            onChange={(e) => handleMultiRowChange(index, "purchase_date", e.target.value)}
                            style={{ fontSize: "14px", height: "38px", border: "1px solid #ced4da" }}
                          />
                        </td>
                        <td style={{ padding: "12px", verticalAlign: "middle" }}>
                          <Form.Control
                            type="text"
                            value={row.notes}
                            onChange={(e) => handleMultiRowChange(index, "notes", e.target.value)}
                            placeholder="Notes..."
                            style={{ fontSize: "14px", height: "38px", border: "1px solid #ced4da" }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div> */}

              <div className="mb-3 d-flex justify-content-between align-items-center">
                <h6 style={{ color: "#333", fontWeight: "600", margin: 0 }}>Add Purchases Manually</h6>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ color: "#6c757d", fontSize: "14px", fontWeight: "500" }}>
                    Total Rows: {multiInsertRows.length}
                  </span>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={handleAddMultiRow}
                    className="custom-btn-primary"
                  >
                    <i className="fa-solid fa-plus me-1"></i>
                    Add Row
                  </Button>
                </div>
              </div>

              <div className="table-responsive">
                <Table bordered hover style={{ marginBottom: 0 }}>
                  <thead style={{ background: "#f8f9fa" }}>
                    <tr>
                      <th style={{ width: "20%", padding: "12px", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #dee2e6" }}>
                        Vendor <span className="text-danger">*</span>
                      </th>
                      <th style={{ width: "20%", padding: "12px", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #dee2e6" }}>
                        Book <span className="text-danger">*</span>
                      </th>
                      <th style={{ width: "10%", padding: "12px", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #dee2e6" }}>
                        Quantity <span className="text-danger">*</span>
                      </th>
                      <th style={{ width: "12%", padding: "12px", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #dee2e6" }}>
                        Unit Price <span className="text-danger">*</span>
                      </th>
                      <th style={{ width: "12%", padding: "12px", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #dee2e6" }}>
                        Total Amount
                      </th>
                      <th style={{ width: "12%", padding: "12px", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #dee2e6" }}>
                        Purchase Date
                      </th>
                      <th style={{ width: "10%", padding: "12px", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #dee2e6" }}>
                        Notes
                      </th>
                      {/* नया Actions column जोड़ें */}
                      <th style={{ width: "5%", padding: "12px", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #dee2e6", textAlign: "center" }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {multiInsertRows.map((row, index) => (
                      <tr key={index}>
                        <td style={{ position: "relative", zIndex: 1, padding: "12px", verticalAlign: "middle" }}>
                          <div className="d-flex gap-1" style={{ position: "relative" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Select
                                value={vendorOptions.find((v) => v.value === row.vendor_id) || null}
                                onChange={(selectedOption) => handleMultiRowChange(index, "vendor_id", selectedOption ? selectedOption.value : "")}
                                options={vendorOptions}
                                placeholder="Select Vendor"
                                isClearable
                                isSearchable
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    minHeight: "38px",
                                    fontSize: "14px",
                                    width: "100%",
                                    border: "1px solid #ced4da",
                                    borderRadius: "4px",
                                    "&:hover": {
                                      borderColor: "#6f42c1",
                                    },
                                  }),
                                  menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                  }),
                                  menu: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                  }),
                                }}
                              />
                            </div>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => {
                                setCurrentRowIndex(index);
                                setShowAddVendorModal(true);
                              }}
                              style={{
                                minWidth: "38px",
                                padding: "6px 8px",
                                flexShrink: 0,
                                borderColor: "#6f42c1",
                                color: "#6f42c1"
                              }}
                              title="Add New Vendor"
                            >
                              <i className="fa-solid fa-plus"></i>
                            </Button>
                          </div>
                        </td>
                        <td style={{ position: "relative", zIndex: 1, padding: "12px", verticalAlign: "middle" }}>
                          <div className="d-flex gap-1" style={{ position: "relative" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Select
                                value={bookOptions.find((b) => b.value === row.book_id) || null}
                                onChange={(selectedOption) => handleMultiRowChange(index, "book_id", selectedOption ? selectedOption.value : "")}
                                options={bookOptions}
                                placeholder="Select Book"
                                isClearable
                                isSearchable
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    minHeight: "38px",
                                    fontSize: "14px",
                                    width: "100%",
                                    border: "1px solid #ced4da",
                                    borderRadius: "4px",
                                    "&:hover": {
                                      borderColor: "#6f42c1",
                                    },
                                  }),
                                  menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                  }),
                                  menu: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                  }),
                                }}
                              />
                            </div>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => {
                                setCurrentRowIndex(index);
                                setShowAddBookModal(true);
                              }}
                              style={{
                                minWidth: "38px",
                                padding: "6px 8px",
                                flexShrink: 0,
                                borderColor: "#6f42c1",
                                color: "#6f42c1"
                              }}
                              title="Add New Book"
                            >
                              <i className="fa-solid fa-plus"></i>
                            </Button>
                          </div>
                        </td>
                        <td style={{ padding: "12px", verticalAlign: "middle" }}>
                          <Form.Control
                            type="number"
                            value={row.quantity}
                            onChange={(e) => handleMultiRowChange(index, "quantity", e.target.value)}
                            min="1"
                            style={{ fontSize: "14px", height: "38px", border: "1px solid #ced4da" }}
                          />
                        </td>
                        <td style={{ padding: "12px", verticalAlign: "middle" }}>
                          <Form.Control
                            type="number"
                            value={row.unit_price}
                            onChange={(e) => handleMultiRowChange(index, "unit_price", e.target.value)}
                            min="0"
                            step="0.01"
                            style={{ fontSize: "14px", height: "38px", border: "1px solid #ced4da" }}
                          />
                        </td>
                        <td style={{ padding: "12px", verticalAlign: "middle" }}>
                          <Form.Control
                            type="text"
                            value={`₹${((parseFloat(row.quantity) || 0) * (parseFloat(row.unit_price) || 0)).toFixed(2)}`}
                            readOnly
                            className="bg-light"
                            style={{ fontSize: "14px", height: "38px", border: "1px solid #ced4da", backgroundColor: "#f8f9fa" }}
                          />
                        </td>
                        <td style={{ padding: "12px", verticalAlign: "middle" }}>
                          <Form.Control
                            type="date"
                            value={row.purchase_date}
                            onChange={(e) => handleMultiRowChange(index, "purchase_date", e.target.value)}
                            style={{ fontSize: "14px", height: "38px", border: "1px solid #ced4da" }}
                          />
                        </td>
                        <td style={{ padding: "12px", verticalAlign: "middle" }}>
                          <Form.Control
                            type="text"
                            value={row.notes}
                            onChange={(e) => handleMultiRowChange(index, "notes", e.target.value)}
                            placeholder="Notes..."
                            style={{ fontSize: "14px", height: "38px", border: "1px solid #ced4da" }}
                          />
                        </td>
                        {/* नया Actions cell जोड़ें - Delete button के लिए */}
                        <td style={{ padding: "12px", verticalAlign: "middle", textAlign: "center" }}>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveMultiRow(index)}
                            disabled={multiInsertRows.length === 1}
                            style={{
                              minWidth: "32px",
                              padding: "4px 6px",
                              borderColor: "#dc3545",
                              color: "#dc3545"
                            }}
                            title="Delete Row"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Tab>
            <Tab
              eventKey="scan"
              title="Scan Barcode"
            >
              <div className="mb-4">
                <h6 style={{ color: "#333", fontWeight: "600", marginBottom: "15px" }}>Scan Book Barcode</h6>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: "500", marginBottom: "10px" }}>
                    <i className="fa-solid fa-barcode me-2"></i>
                    Barcode / ISBN
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Scan or enter book barcode/ISBN"
                      value={barcodeInput}
                      onChange={(e) => {
                        setBarcodeInput(e.target.value);
                        if (e.target.value.length >= 10) {
                          handleBarcodeScan(e.target.value);
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && barcodeInput.trim()) {
                          handleBarcodeScan(barcodeInput.trim());
                        }
                      }}
                      style={{
                        padding: "12px",
                        fontSize: "16px",
                        border: "2px solid #6f42c1",
                        borderRadius: "8px"
                      }}
                    />
                    <Button
                      variant="outline-primary"
                      onClick={() => {
                        if (barcodeInput.trim()) {
                          handleBarcodeScan(barcodeInput.trim());
                        }
                      }}
                      style={{
                        border: "2px solid #6f42c1",
                        color: "#6f42c1",
                        borderRadius: "0 8px 8px 0"
                      }}
                    >
                      <i className="fa-solid fa-search"></i>
                    </Button>
                  </InputGroup>
                  {scanningBook && (
                    <Alert variant="success" className="mt-3">
                      <i className="fa-solid fa-check-circle me-2"></i>
                      Book found: <strong>{scanningBook.title}</strong> (ISBN: {scanningBook.isbn})
                    </Alert>
                  )}
                </Form.Group>
                {scanningBook && (
                  <div className="mt-3 p-3" style={{
                    background: "#f3e9fc",
                    borderRadius: "8px",
                    border: "1px solid #6f42c1"
                  }}>
                    <h6 style={{ color: "#6f42c1", marginBottom: "15px" }}>Book Details</h6>
                    <Row>
                      <Col md={6}>
                        <p><strong>Title:</strong> {scanningBook.title}</p>
                        <p><strong>ISBN:</strong> {scanningBook.isbn || "N/A"}</p>
                        <p><strong>Author:</strong> {scanningBook.author_name || "N/A"}</p>
                      </Col>
                      <Col md={6}>
                        <p><strong>Category:</strong> {scanningBook.category_name || "N/A"}</p>
                        <p><strong>Available Copies:</strong> {scanningBook.available_copies || 0}</p>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            // Add to current row or new row
                            const currentRow = multiInsertRows[currentRowIndex];
                            if (currentRow && !currentRow.book_id) {
                              const updatedRows = [...multiInsertRows];
                              updatedRows[currentRowIndex] = {
                                ...updatedRows[currentRowIndex],
                                book_id: scanningBook.id
                              };
                              setMultiInsertRows(updatedRows);
                            } else {
                              // Add new row with scanned book
                              setMultiInsertRows([...multiInsertRows, {
                                vendor_id: "",
                                book_id: scanningBook.id,
                                quantity: 1,
                                unit_price: 0,
                                purchase_date: new Date().toISOString().split('T')[0],
                                notes: ""
                              }]);
                              setCurrentRowIndex(multiInsertRows.length);
                            }
                            setBarcodeInput("");
                            setScanningBook(null);
                            setActiveTab("manual");
                          }}
                          style={{
                            background: "#6f42c1",
                            border: "none",
                            marginTop: "10px"
                          }}
                        >
                          <i className="fa-solid fa-plus me-2"></i>
                          Add to Purchase Entry
                        </Button>
                      </Col>
                    </Row>
                  </div>
                )}
              </div>
            </Tab>
            <Tab
              eventKey="import"
              title="Import File"
            >
              <div className="mb-4">
                <h6 style={{ color: "#333", fontWeight: "600", marginBottom: "15px" }}>Or Select Excel/CSV File</h6>
                <Form.Group>
                  <Form.Label style={{ fontWeight: "500", marginBottom: "10px" }}>Upload File</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    style={{
                      padding: "10px",
                      border: "2px dashed #ced4da",
                      borderRadius: "8px",
                      cursor: "pointer"
                    }}
                  />
                  {selectedFile && (
                    <small className="text-muted mt-2 d-block">
                      Selected: {selectedFile.name}
                    </small>
                  )}
                  {!selectedFile && (
                    <small className="text-muted mt-2 d-block">
                      No file chosen
                    </small>
                  )}
                </Form.Group>
                <div className="mt-3 p-3" style={{
                  background: "#f8f9fa",
                  borderRadius: "6px",
                  border: "1px solid #e9ecef"
                }}>
                  <small className="text-muted" style={{ fontSize: "13px" }}>
                    <strong>File should contain columns:</strong> Vendor, Book, Quantity, Unit Price, Purchase Date, Notes
                  </small>
                </div>
              </div>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "1px solid #e9ecef", padding: "16px 24px", justifyContent: "flex-end", gap: "10px" }}>
          <Button
            variant="secondary"
            onClick={() => {
              setShowBulkInsertModal(false);
              setActiveTab("manual");
              setSelectedFile(null);
              setBarcodeInput("");
              setScanningBook(null);
            }}
            style={{
              background: "white",
              border: "1px solid #6f42c1",
              color: "#6f42c1",
              padding: "8px 20px",
              borderRadius: "6px",
              fontWeight: "500"
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={activeTab === "manual" ? handleMultiInsertSave : activeTab === "import" ? () => {
              // Handle file import logic here
              toast.error("File import functionality coming soon");
            } : undefined}
            disabled={loading || (activeTab === "import" && !selectedFile) || activeTab === "scan"}
            style={{
              background: loading ? "#6c757d" : (activeTab === "manual" ? "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)" : activeTab === "import" ? "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)" : "#6c757d"),
              border: "none",
              color: "white",
              padding: "8px 24px",
              borderRadius: "6px",
              fontWeight: "500"
            }}
          >
            {loading ? "Saving..." : activeTab === "manual"
              ? `Save ${multiInsertRows.filter(row => row.vendor_id && row.book_id && row.quantity && row.unit_price).length} Purchase${multiInsertRows.filter(row => row.vendor_id && row.book_id && row.quantity && row.unit_price).length !== 1 ? 's' : ''}`
              : activeTab === "import" ? "Import File"
                : "Scan Barcode First"
            }
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Vendor Modal */}
      <FormModal
        show={showAddVendorModal}
        onHide={() => {
          setShowAddVendorModal(false);
          setVendorFormData({
            name: "",
            company_name: "",
            email: "",
            phone: "",
            address: "",
            city: "",
            state: "",
            pincode: "",
            country: "India",
            status: "active",
          });
        }}
        title="Add New Vendor"
        icon="fa-solid fa-user-tie"
        formData={vendorFormData}
        setFormData={setVendorFormData}
        fields={[
          {
            name: "name",
            label: "Name",
            type: "text",
            required: true,
            placeholder: "Enter vendor name",
            colSize: 6,
          },
          {
            name: "company_name",
            label: "Company Name",
            type: "text",
            placeholder: "Enter company name",
            colSize: 6,
          },
          {
            name: "email",
            label: "Email",
            type: "email",
            placeholder: "Enter email address",
            colSize: 6,
          },
          {
            name: "phone",
            label: "Phone",
            type: "tel",
            placeholder: "Enter phone number",
            colSize: 6,
          },
          {
            name: "address",
            label: "Address",
            type: "textarea",
            placeholder: "Enter address",
            colSize: 12,
          },
          {
            name: "city",
            label: "City",
            type: "text",
            placeholder: "Enter city",
            colSize: 4,
          },
          {
            name: "state",
            label: "State",
            type: "text",
            placeholder: "Enter state",
            colSize: 4,
          },
          {
            name: "pincode",
            label: "Pincode",
            type: "text",
            placeholder: "Enter pincode",
            colSize: 4,
          },
        ]}
        onSubmit={handleAddVendor}
        loading={loading}
      />

      {/* Add Book Modal */}
      <FormModal
        show={showAddBookModal}
        onHide={() => {
          setShowAddBookModal(false);
          setBookFormData({
            title: "",
            author_id: "",
            category_id: "",
            isbn: "",
            language: "",
            total_copies: 1,
            available_copies: 1,
          });
        }}
        title="Add New Book"
        icon="fa-solid fa-book"
        formData={bookFormData}
        setFormData={setBookFormData}
        fields={[
          {
            name: "title",
            label: "Title",
            type: "text",
            required: true,
            placeholder: "Enter book title",
            colSize: 12,
          },
          {
            name: "author_id",
            label: "Author",
            type: "custom",
            required: true,
            colSize: 6,
            render: () => (
              <Form.Group className="mb-3">
                <Form.Label>Author <span className="text-danger">*</span></Form.Label>
                <Select
                  value={authors.find((a) => a.id === bookFormData.author_id) ? { value: bookFormData.author_id, label: authors.find((a) => a.id === bookFormData.author_id).name } : null}
                  onChange={(selectedOption) => setBookFormData({ ...bookFormData, author_id: selectedOption ? selectedOption.value : "" })}
                  options={authors.map((a) => ({ value: a.id, label: a.name }))}
                  placeholder="Select Author"
                  isClearable
                  isSearchable
                  styles={{
                    control: (base) => ({
                      ...base,
                      border: "2px solid #c084fc",
                      borderRadius: "8px",
                      boxShadow: "none",
                      "&:hover": { borderColor: "#a855f7" },
                    }),
                  }}
                />
              </Form.Group>
            ),
          },
          {
            name: "category_id",
            label: "Category",
            type: "custom",
            required: true,
            colSize: 6,
            render: () => (
              <Form.Group className="mb-3">
                <Form.Label>Category <span className="text-danger">*</span></Form.Label>
                <Select
                  value={categories.find((c) => c.id === bookFormData.category_id) ? { value: bookFormData.category_id, label: categories.find((c) => c.id === bookFormData.category_id).name } : null}
                  onChange={(selectedOption) => setBookFormData({ ...bookFormData, category_id: selectedOption ? selectedOption.value : "" })}
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Select Category"
                  isClearable
                  isSearchable
                  styles={{
                    control: (base) => ({
                      ...base,
                      border: "2px solid #c084fc",
                      borderRadius: "8px",
                      boxShadow: "none",
                      "&:hover": { borderColor: "#a855f7" },
                    }),
                  }}
                />
              </Form.Group>
            ),
          },
          {
            name: "isbn",
            label: "ISBN",
            type: "text",
            placeholder: "Enter ISBN number",
            colSize: 6,
          },
          {
            name: "language",
            label: "Language",
            type: "text",
            placeholder: "Enter language",
            colSize: 6,
          },
          {
            name: "total_copies",
            label: "Total Copies",
            type: "number",
            placeholder: "Enter total copies",
            colSize: 6,
          },
          {
            name: "available_copies",
            label: "Available Copies",
            type: "number",
            placeholder: "Enter available copies",
            colSize: 6,
          },
        ]}
        onSubmit={handleAddBook}
        loading={loading}
      />
    </Container >
  );
};

export default Purchase;