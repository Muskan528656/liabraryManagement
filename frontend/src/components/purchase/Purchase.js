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
import ConfirmationModal from "../common/ConfirmationModal";
import BulkPurchasePage from "../common/BulkPurchase";
import BarcodeScanPurchase from "../common/BarcodeScanPurchase";
import PurchaseDataImport from "../common/PurchaseDataImport";
const Purchase = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [purchases, setPurchases] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [books, setBooks] = useState([]);
  const [showModal, setShowModal] = useState(false);
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

  const [visibleColumns, setVisibleColumns] = useState({
    vendor_name: true,
    purchase_serial_no: true,
    book_title: false,
    book_isbn: false,
    quantity: false,
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
    setSelectedItems([]);
  }, [searchTerm]);

  useEffect(() => {
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

  // const handleBookChange = (selectedOption) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     book_id: selectedOption ? selectedOption.value : "",
  //   }));
  // };

  const bookOptions = books.map((book) => ({
    value: book.id,
    label: `${book.title}${book.isbn ? ` (${book.isbn})` : ""}`,
  }));

  // const handleVendorChange = (selectedOption) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     vendor_id: selectedOption ? selectedOption.value : "",
  //   }));
  // };

  const vendorOptions = vendors.map((vendor) => ({
    value: vendor.id,
    label: vendor.name,
  }));

  // const handleInputChange = (e) => {
  //   const { name, value } = e.target;
  //   const updatedData = { ...formData, [name]: value };

  //   // Calculate total amount
  //   if (name === "quantity" || name === "unit_price") {
  //     updatedData.total_amount = (parseFloat(updatedData.quantity) || 0) * (parseFloat(updatedData.unit_price) || 0);
  //   }

  //   setFormData(updatedData);
  // };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   try {
  //     setLoading(true);
  //     const purchaseApi = new DataApi("purchase");

  //     if (editingPurchase) {
  //       await purchaseApi.update(formData, editingPurchase.id);
  //       PubSub.publish("RECORD_SUCCESS_TOAST", {
  //         title: "Success",
  //         message: "Purchase updated successfully",
  //       });
  //     } else {
  //       await purchaseApi.create(formData);
  //       PubSub.publish("RECORD_SUCCESS_TOAST", {
  //         title: "Success",
  //         message: "Purchase created successfully",
  //       });
  //     }

  //     setShowModal(false);
  //     resetForm();
  //     fetchPurchases();
  //   } catch (error) {
  //     console.error("Error saving purchase:", error);
  //     PubSub.publish("RECORD_ERROR_TOAST", {
  //       title: "Error",
  //       message: error.response?.data?.errors || "Failed to save purchase",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleEdit = (purchase) => {
  //   setEditingPurchase(purchase);
  //   setFormData({
  //     vendor_id: purchase.vendor_id || "",
  //     book_id: purchase.book_id || "",
  //     quantity: purchase.quantity || 1,
  //     unit_price: purchase.unit_price || 0,
  //     purchase_date: purchase.purchase_date || new Date().toISOString().split('T')[0],
  //     notes: purchase.notes || "",
  //   });
  //   setShowModal(true);
  // };

  const confirmDelete = async () => {
    try {
      const api = new DataApi("purchase");
      await api.delete(deleteId);
      PubSub.publish("RECORD_SUCCESS_TOAST", {
        title: "Success",
        message: "Purchase deleted successfully",
      });
      setShowConfirmModal(false);
      setDeleteId(null);
      fetchPurchases();
    } catch (error) {
      console.error("Error deleting purchase:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to delete purchase",
      });
    };
  }

  // const resetForm = () => {
  //   setFormData({
  //     vendor_id: "",
  //     book_id: "",
  //     quantity: 1,
  //     unit_price: 0,
  //     purchase_date: new Date().toISOString().split('T')[0],
  //     notes: "",
  //   });
  //   setEditingPurchase(null);
  // };

  const handleBulkInsert = () => {
    navigate('/purchase/bulk');
    // setBulkInsertData([]);
    // setMultiInsertRows([{ vendor_id: "", book_id: "", quantity: 1, unit_price: 0, purchase_date: new Date().toISOString().split('T')[0], notes: "" }]);
    // setActiveTab("manual");
    // setSelectedFile(null);
    // setShowBulkInsertModal(true);
  };

  // const handleFileChange = (file) => {
  //   if (file) {
  //     setSelectedFile(file);
  //   } else {
  //     setSelectedFile(null);
  //   }
  // };
  // const handleBarcodeScan = async (barcode) => {
  //   if (!barcode || barcode.trim().length < 10) {
  //     toast.error("Please enter a valid barcode/ISBN (minimum 10 characters)");
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     const bookApi = new DataApi("book");

  //     // Try to find book by ISBN
  //     const allBooks = await bookApi.fetchAll();
  //     const bookData = allBooks?.data || allBooks || [];

  //     // Search by ISBN (exact match or partial)
  //     const foundBook = bookData.find(book =>
  //       book.isbn && (
  //         book.isbn === barcode.trim() ||
  //         book.isbn.replace(/[-\s]/g, '') === barcode.trim().replace(/[-\s]/g, '') ||
  //         book.isbn.includes(barcode.trim()) ||
  //         barcode.trim().includes(book.isbn)
  //       )
  //     );

  //     if (foundBook) {
  //       setScanningBook(foundBook);
  //       toast.success(`Book found: ${foundBook.title}`);
  //     } else {
  //       toast.error("Book not found with this ISBN/Barcode");
  //       setScanningBook(null);
  //     }
  //   } catch (error) {
  //     console.error("Error scanning barcode:", error);
  //     toast.error("Failed to scan barcode. Please try again.");
  //     setScanningBook(null);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Bulk Insert Table के लिए functions
  // const handleAddMultiRow = () => {
  //   setMultiInsertRows([...multiInsertRows, { vendor_id: "", book_id: "", quantity: 1, unit_price: 0, purchase_date: new Date().toISOString().split('T')[0], notes: "" }]);
  // };

  // const handleRemoveMultiRow = (index) => {
  //   if (multiInsertRows.length > 1) {
  //     setMultiInsertRows(multiInsertRows.filter((_, i) => i !== index));
  //   }
  // };

  // const handleMultiRowChange = (index, field, value) => {
  //   const updatedRows = [...multiInsertRows];
  //   updatedRows[index] = { ...updatedRows[index], [field]: value };
  //   setMultiInsertRows(updatedRows);
  // };

  // const handleAddVendorFromTable = (index) => {
  //   setCurrentRowIndex(index);
  //   setShowAddVendorModal(true);
  // };

  // const handleAddBookFromTable = (index) => {
  //   setCurrentRowIndex(index);
  //   setShowAddBookModal(true);
  // };

  // const handleAddVendor = async () => {
  //   if (!vendorFormData.name || !vendorFormData.name.trim()) {
  //     PubSub.publish("RECORD_ERROR_TOAST", {
  //       title: "Validation Error",
  //       message: "Vendor name is required",
  //     });
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     const vendorApi = new DataApi("vendor");
  //     const response = await vendorApi.create(vendorFormData);

  //     if (response.data) {
  //       const newVendorId = response.data.id || response.data;
  //       PubSub.publish("RECORD_SUCCESS_TOAST", {
  //         title: "Success",
  //         message: "Vendor added successfully",
  //       });
  //       setShowAddVendorModal(false);
  //       setVendorFormData({
  //         name: "",
  //         company_name: "",
  //         email: "",
  //         phone: "",
  //         address: "",
  //         city: "",
  //         state: "",
  //         pincode: "",
  //         country: "India",
  //         status: "active",
  //       });
  //       await fetchVendors();
  //       if (typeof newVendorId !== 'undefined') {
  //         const updatedRows = [...multiInsertRows];
  //         updatedRows[currentRowIndex] = { ...updatedRows[currentRowIndex], vendor_id: newVendorId };
  //         setMultiInsertRows(updatedRows);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error adding vendor:", error);
  //     PubSub.publish("RECORD_ERROR_TOAST", {
  //       title: "Error",
  //       message: error.response?.data?.errors || "Failed to add vendor",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleAddBook = async () => {
  //   if (!bookFormData.title || !bookFormData.title.trim()) {
  //     PubSub.publish("RECORD_ERROR_TOAST", {
  //       title: "Validation Error",
  //       message: "Book title is required",
  //     });
  //     return;
  //   }

  //   if (!bookFormData.author_id) {
  //     PubSub.publish("RECORD_ERROR_TOAST", {
  //       title: "Validation Error",
  //       message: "Author is required",
  //     });
  //     return;
  //   }

  //   if (!bookFormData.category_id) {
  //     PubSub.publish("RECORD_ERROR_TOAST", {
  //       title: "Validation Error",
  //       message: "Category is required",
  //     });
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     const bookApi = new DataApi("book");
  //     const response = await bookApi.create(bookFormData);

  //     if (response.data) {
  //       const newBookId = response.data.id || response.data;
  //       PubSub.publish("RECORD_SUCCESS_TOAST", {
  //         title: "Success",
  //         message: "Book added successfully",
  //       });
  //       setShowAddBookModal(false);
  //       setBookFormData({
  //         title: "",
  //         author_id: "",
  //         category_id: "",
  //         isbn: "",
  //         language: "",
  //         total_copies: 1,
  //         available_copies: 1,
  //       });
  //       await fetchBooks();
  //       if (typeof newBookId !== 'undefined') {
  //         const updatedRows = [...multiInsertRows];
  //         updatedRows[currentRowIndex] = { ...updatedRows[currentRowIndex], book_id: newBookId };
  //         setMultiInsertRows(updatedRows);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error adding book:", error);
  //     PubSub.publish("RECORD_ERROR_TOAST", {
  //       title: "Error",
  //       message: error.response?.data?.errors || "Failed to add book",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleMultiInsertSave = async () => {
  //   // Check for partially filled rows
  //   const partiallyFilledRows = [];
  //   multiInsertRows.forEach((row, index) => {
  //     const hasSomeFields = row.vendor_id || row.book_id || row.quantity || row.unit_price;
  //     const hasAllRequiredFields = row.vendor_id && row.book_id && row.quantity && row.unit_price;

  //     if (hasSomeFields && !hasAllRequiredFields) {
  //       partiallyFilledRows.push(index + 1); // Row number (1-based)
  //     }
  //   });

  //   if (partiallyFilledRows.length > 0) {
  //     PubSub.publish("RECORD_ERROR_TOAST", {
  //       title: "Validation Error",
  //       message: `Row(s) ${partiallyFilledRows.join(", ")} are partially filled. Please fill all required fields (Vendor, Book, Quantity, Unit Price) or delete the row(s).`,
  //     });
  //     return;
  //   }

  //   // Convert multiInsertRows to purchase data format - only include fully filled rows
  //   const convertedData = multiInsertRows
  //     .map((row) => {
  //       if (!row.vendor_id || !row.book_id || !row.quantity || !row.unit_price) {
  //         return null;
  //       }
  //       return {
  //         vendor_id: row.vendor_id,
  //         book_id: row.book_id,
  //         quantity: parseInt(row.quantity) || 1,
  //         unit_price: parseFloat(row.unit_price) || 0,
  //         purchase_date: row.purchase_date || new Date().toISOString().split('T')[0],
  //         notes: row.notes || "",
  //         total_amount: (parseInt(row.quantity) || 1) * (parseFloat(row.unit_price) || 0),
  //       };
  //     })
  //     .filter((purchase) => purchase !== null);

  //   if (convertedData.length === 0) {
  //     PubSub.publish("RECORD_ERROR_TOAST", {
  //       title: "Error",
  //       message: "Please fill at least one complete purchase entry (Vendor, Book, Quantity, and Unit Price are required)",
  //     });
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     const purchaseApi = new DataApi("purchase");
  //     let successCount = 0;
  //     let failCount = 0;

  //     for (const purchaseData of convertedData) {
  //       try {
  //         await purchaseApi.create(purchaseData);
  //         successCount++;
  //       } catch (error) {
  //         console.error("Error creating purchase:", error);
  //         failCount++;
  //       }
  //     }

  //     if (successCount > 0) {
  //       PubSub.publish("RECORD_SUCCESS_TOAST", {
  //         title: "Success",
  //         message: `Successfully created ${successCount} purchase${successCount > 1 ? 's' : ''}`,
  //       });
  //       setShowBulkInsertModal(false);
  //       setMultiInsertRows([{ vendor_id: "", book_id: "", quantity: 1, unit_price: 0, purchase_date: new Date().toISOString().split('T')[0], notes: "" }]);
  //       fetchPurchases();
  //     }

  //     if (failCount > 0) {
  //       PubSub.publish("RECORD_ERROR_TOAST", {
  //         title: "Error",
  //         message: `Failed to create ${failCount} purchase${failCount > 1 ? 's' : ''}`,
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Error in bulk insert:", error);
  //     PubSub.publish("RECORD_ERROR_TOAST", {
  //       title: "Error",
  //       message: "Failed to save purchases",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleExport = () => {
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

  // const handleMultiDelete = async () => {
  //   if (selectedItems.length === 0) {
  //     PubSub.publish("RECORD_ERROR_TOAST", {
  //       title: "Error",
  //       message: "Please select items to delete",
  //     });
  //     return;
  //   }

  //   if (!window.confirm(`Are you sure you want to delete ${selectedItems.length} selected purchase(s)?`)) {
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     const purchaseApi = new DataApi("purchase");
  //     let successCount = 0;
  //     let failCount = 0;

  //     for (const id of selectedItems) {
  //       try {
  //         await purchaseApi.delete(id);
  //         successCount++;
  //       } catch (error) {
  //         console.error(`Error deleting purchase ${id}:`, error);
  //         failCount++;
  //       }
  //     }

  //     if (successCount > 0) {
  //       PubSub.publish("RECORD_SAVED_TOAST", {
  //         title: "Success",
  //         message: `Deleted ${successCount} purchase(s) successfully`,
  //       });
  //       setSelectedItems([]);
  //       fetchPurchases();
  //     }

  //     if (failCount > 0) {
  //       PubSub.publish("RECORD_ERROR_TOAST", {
  //         title: "Error",
  //         message: `Failed to delete ${failCount} purchase(s)`,
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Error in multi-delete:", error);
  //     PubSub.publish("RECORD_ERROR_TOAST", {
  //       title: "Error",
  //       message: "Failed to delete purchases",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

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
      field: "purchase_serial_no", label: "Purchase Seriol No", sortable: true,
      render: (value, record) => (
        <a
          href={`/purchase/${record.id}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/purchase/${record.id}`);
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

  const columns = allColumns.filter(col => visibleColumns[col.field] !== false);

  const toggleColumnVisibility = (field) => {
    setVisibleColumns(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleNameClick = (e, record, navigate, isRightClick = false, isEdit) => {
    e.preventDefault();
    e.stopPropagation();

    const purchaseId = record.id;

    if (isRightClick) {
      window.open(`/purchase/${purchaseId}`, "_blank");
    } else {
      if (isEdit) {
        navigate(`/purchase/${purchaseId}`, { state: { isEdit: true, rowData: record }, });
      } else {
        navigate(`/purchase/${purchaseId}`, { state: record });
      }
    }
  };

  const actionsRenderer = (purchase) => (
    <>
      <button

        onClick={(e) => {
          handleNameClick(e, purchase, navigate, false, true);
        }}
        className="custom-btn-edit"
      >
        <i className="fs-7 fa-solid fa-pen-to-square"></i>
      </button>
      <button

        onClick={(e) => {
          e.stopPropagation();
          setDeleteId(purchase.id);
          setShowConfirmModal(true);
        }}
        className="custom-btn-delete"
      >
        <i className="fs-7 fa-solid fa-trash"></i>
      </button>
    </>
  );

  // const handleFileImport = async () => {
  //   if (!selectedFile) {
  //     PubSub.publish("RECORD_ERROR_TOAST", {
  //       title: "Error",
  //       message: "Please select a file to import"
  //     });
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     const reader = new FileReader();

  //     reader.onload = async (e) => {
  //       try {
  //         const csvContent = e.target.result;
  //         console.log("CSV Content:", csvContent);

  //         const rows = csvContent.split('\n');
  //         const headers = rows[0].split(',').map(header => header.trim());

  //         console.log("Headers:", headers);
  //         console.log("Rows:", rows);


  //         const requiredHeaders = ['Vendor', 'Book', 'Quantity', 'Unit Price', 'Purchase Date'];
  //         const missingHeaders = requiredHeaders.filter(header =>
  //           !headers.includes(header)
  //         );

  //         if (missingHeaders.length > 0) {
  //           PubSub.publish("RECORD_ERROR_TOAST", {
  //             title: "Invalid File Format",
  //             message: `Missing required columns: ${missingHeaders.join(', ')}`
  //           });
  //           return;
  //         }

  //         const purchaseData = [];
  //         let successCount = 0;
  //         let errorCount = 0;

  //         for (let i = 1; i < rows.length; i++) {
  //           if (!rows[i].trim()) continue;

  //           const rowData = rows[i].split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
  //           console.log(`Row ${i}:`, rowData);

  //           if (rowData.length >= 5) {
  //             try {
  //               const vendorName = rowData[headers.indexOf('Vendor')];
  //               const bookTitle = rowData[headers.indexOf('Book')];
  //               const quantity = parseInt(rowData[headers.indexOf('Quantity')]);
  //               const unitPrice = parseFloat(rowData[headers.indexOf('Unit Price')]);
  //               const purchaseDate = rowData[headers.indexOf('Purchase Date')];
  //               const notes = rowData[headers.indexOf('Notes')] || '';


  //               if (!vendorName || !bookTitle || isNaN(quantity) || isNaN(unitPrice) || !purchaseDate) {
  //                 console.warn(`Skipping invalid row ${i}:`, rowData);
  //                 errorCount++;
  //                 continue;
  //               }


  //               const vendor = vendors.find(v =>
  //                 v.name.toLowerCase().includes(vendorName.toLowerCase()) ||
  //                 v.id === vendorName
  //               );


  //               const book = books.find(b =>
  //                 b.title.toLowerCase().includes(bookTitle.toLowerCase()) ||
  //                 b.id === bookTitle
  //               );

  //               if (!vendor || !book) {
  //                 console.warn(`Vendor or book not found for row ${i}`);
  //                 errorCount++;
  //                 continue;
  //               }

  //               const purchaseRecord = {
  //                 vendor_id: vendor.id,
  //                 book_id: book.id,
  //                 quantity: quantity,
  //                 unit_price: unitPrice,
  //                 purchase_date: purchaseDate,
  //                 notes: notes,
  //                 total_amount: quantity * unitPrice
  //               };

  //               purchaseData.push(purchaseRecord);

  //             } catch (error) {
  //               console.error(`Error processing row ${i}:`, error);
  //               errorCount++;
  //             }
  //           }
  //         }
  //         console.log("Processed purchase data:", purchaseData);
  //         if (purchaseData.length === 0) {
  //           PubSub.publish("RECORD_ERROR_TOAST", {
  //             title: "No Valid Data",
  //             message: "No valid purchase records found in the file"
  //           });
  //           return;
  //         }
  //         const purchaseApi = new DataApi("purchase");

  //         for (const data of purchaseData) {
  //           try {
  //             await purchaseApi.create(data);
  //             successCount++;
  //           } catch (error) {
  //             console.error("Error creating purchase:", error);
  //             errorCount++;
  //           }
  //         }

  //         if (successCount > 0) {
  //           PubSub.publish("RECORD_SUCCESS_TOAST", {
  //             title: "Import Successful",
  //             message: `Successfully imported ${successCount} purchase${successCount > 1 ? 's' : ''}`
  //           });

  //           setShowBulkInsertModal(false);
  //           setSelectedFile(null);
  //           fetchPurchases();
  //         }

  //         if (errorCount > 0) {
  //           PubSub.publish("RECORD_ERROR_TOAST", {
  //             title: "Partial Import",
  //             message: `${errorCount} record${errorCount > 1 ? 's' : ''} failed to import`
  //           });
  //         }

  //       } catch (error) {
  //         console.error("Error processing file:", error);
  //         PubSub.publish("RECORD_ERROR_TOAST", {
  //           title: "Import Error",
  //           message: "Failed to process the file. Please check the format."
  //         });
  //       }
  //     };

  //     reader.onerror = () => {
  //       PubSub.publish("RECORD_ERROR_TOAST", {
  //         title: "File Read Error",
  //         message: "Failed to read the selected file"
  //       });
  //     };

  //     if (selectedFile.name.endsWith('.csv')) {
  //       reader.readAsText(selectedFile);
  //     } else {
  //       PubSub.publish("RECORD_ERROR_TOAST", {
  //         title: "Unsupported Format",
  //         message: "Please use CSV files for now. Excel support coming soon."
  //       });
  //     }

  //   } catch (error) {
  //     console.error("Error in file import:", error);
  //     PubSub.publish("RECORD_ERROR_TOAST", {
  //       title: "Import Failed",
  //       message: "An unexpected error occurred during import"
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  return (
    <Container fluid className="py-4">
      <ScrollToTop />
      <Row className="justify-content-center">
        <Col lg={12} xl={12}>
          <Card style={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "4px", overflow: "hidden" }}>
            <Card.Body className="">
              {loading ? (
                <Loader />
              ) : (
                <>
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

                      },
                    ]}
                  />

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
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        onConfirm={confirmDelete}
        title={`Delete Purchase `}
        message={`Are you sure you want to delete this Purchase?`}
        confirmText="Delete"
        cancelText="Cancel"
      />


    </Container >
  );
};

export default Purchase;