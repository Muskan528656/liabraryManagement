
import React, { useState, useEffect } from 'react';
import {
    Container, Row, Col, Card, Button, Form, Table,
    Tabs, Tab, Alert, Breadcrumb, Modal
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import DataApi from '../../api/dataApi';
import Loader from '../common/Loader';
import { toast } from "react-toastify";
import BarcodeScanPurchase from "../common/BarcodeScanPurchase";
import PurchaseDataImport from "../common/PurchaseDataImport";


const BulkPurchasePage = () => {
    const navigate = useNavigate();
    const [multiInsertRows, setMultiInsertRows] = useState([{
        vendor_id: "",
        book_id: "",
        quantity: 1,
        unit_price: 0,
        purchase_date: new Date().toISOString().split('T')[0],
        notes: ""
    }]);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [books, setBooks] = useState([]);
    const [saving, setSaving] = useState(false);
    const [currentRowIndex, setCurrentRowIndex] = useState(0);
    const [activeTab, setActiveTab] = useState("single");
    const [selectedFile, setSelectedFile] = useState(null);
    const [barcodeInput, setBarcodeInput] = useState("");
    const [scanningBook, setScanningBook] = useState(null);
    const [loading, setLoading] = useState(false);

    // New states for modals
    const [showAddVendorModal, setShowAddVendorModal] = useState(false);
    const [showAddBookModal, setShowAddBookModal] = useState(false);
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
    const [authors, setAuthors] = useState([]);
    const [categories, setCategories] = useState([]);

    const handleFileChange = (file) => {
        if (file) {
            setSelectedFile(file);
        } else {
            setSelectedFile(null);
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
            const allBooks = await bookApi.fetchAll();
            const bookData = allBooks?.data || allBooks || [];

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

    // Fetch data on component mount
    useEffect(() => {
        fetchVendors();
        fetchBooks();
        fetchAuthors();
        fetchCategories();
    }, []);

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
            if (response.data) {
                setAuthors(response.data);
            }
        } catch (error) {
            console.error("Error fetching authors:", error);
        }
    };

    const fetchCategories = async () => {
        try {
            const categoryApi = new DataApi("category");
            const response = await categoryApi.fetchAll();
            if (response.data) {
                setCategories(response.data);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const vendorOptions = vendors.map((vendor) => ({
        value: vendor.id,
        label: vendor.name
    }));

    const bookOptions = books.map((book) => ({
        value: book.id,
        label: `${book.title}${book.isbn ? ` (${book.isbn})` : ''}`
    }));

    const handleMultiRowChange = (index, field, value) => {
        const updatedRows = [...multiInsertRows];
        updatedRows[index] = { ...updatedRows[index], [field]: value };
        setMultiInsertRows(updatedRows);
    };

    const handleAddBookRow = () => {
        const newRow = {
            vendor_id: activeTab === "single" ? (selectedVendor ? selectedVendor.value : "") : "",
            book_id: "",
            quantity: 1,
            unit_price: 0,
            purchase_date: new Date().toISOString().split('T')[0],
            notes: ""
        };
        setMultiInsertRows([...multiInsertRows, newRow]);
    };

    const handleAddVendorRow = () => {
        const newRow = {
            vendor_id: "",
            book_id: "",
            quantity: 1,
            unit_price: 0,
            purchase_date: new Date().toISOString().split('T')[0],
            notes: ""
        };
        setMultiInsertRows([...multiInsertRows, newRow]);
    };

    const handleRemoveRow = (index) => {
        if (multiInsertRows.length > 1) {
            setMultiInsertRows(multiInsertRows.filter((_, i) => i !== index));
        }
    };

    const handleVendorChange = (selectedOption) => {
        setSelectedVendor(selectedOption);
        if (activeTab === "single") {
            const updatedRows = multiInsertRows.map(row => ({
                ...row,
                vendor_id: selectedOption ? selectedOption.value : ""
            }));
            setMultiInsertRows(updatedRows);
        }
    };

    // Handle Add Vendor
    const handleAddVendor = async () => {
        if (!vendorFormData.name || !vendorFormData.name.trim()) {
            toast.error("Vendor name is required");
            return;
        }

        try {
            setLoading(true);
            const vendorApi = new DataApi("vendor");
            const response = await vendorApi.create(vendorFormData);

            if (response.data) {
                toast.success("Vendor added successfully");
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
            }
        } catch (error) {
            console.error("Error adding vendor:", error);
            toast.error("Failed to add vendor");
        } finally {
            setLoading(false);
        }
    };

    // Handle Add Book
    const handleAddBook = async () => {
        if (!bookFormData.title || !bookFormData.title.trim()) {
            toast.error("Book title is required");
            return;
        }

        if (!bookFormData.author_id) {
            toast.error("Author is required");
            return;
        }

        if (!bookFormData.category_id) {
            toast.error("Category is required");
            return;
        }

        try {
            setLoading(true);
            const bookApi = new DataApi("book");
            const response = await bookApi.create(bookFormData);

            if (response.data) {
                toast.success("Book added successfully");
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
            }
        } catch (error) {
            console.error("Error adding book:", error);
            toast.error("Failed to add book");
        } finally {
            setLoading(false);
        }
    };

    // Save purchases
    const handleSavePurchases = async () => {
        const partiallyFilledRows = [];
        multiInsertRows.forEach((row, index) => {
            const hasSomeFields = row.vendor_id || row.book_id || row.quantity || row.unit_price;
            const hasAllRequiredFields = row.vendor_id && row.book_id && row.quantity && row.unit_price;

            if (hasSomeFields && !hasAllRequiredFields) {
                partiallyFilledRows.push(index + 1);
            }
        });

        if (partiallyFilledRows.length > 0) {
            toast.error(`Row(s) ${partiallyFilledRows.join(", ")} are partially filled. Please fill all required fields.`);
            return;
        }

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
            toast.error("Please fill at least one complete purchase entry");
            return;
        }

        try {
            setSaving(true);
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
                toast.success(`Successfully created ${successCount} purchase${successCount > 1 ? 's' : ''}. Redirecting to purchases list...`);
                setMultiInsertRows([{
                    vendor_id: "",
                    book_id: "",
                    quantity: 1,
                    unit_price: 0,
                    purchase_date: new Date().toISOString().split('T')[0],
                    notes: ""
                }]);
                setSelectedVendor(null);
                navigate('/purchase');
            }

            if (failCount > 0) {
                toast.error(`Failed to create ${failCount} purchase${failCount > 1 ? 's' : ''}`);
            }
        } catch (error) {
            console.error("Error in bulk insert:", error);
            toast.error("Failed to save purchases");
        } finally {
            setSaving(false);
        }
    };

    // Calculate totals
    const totalAmount = multiInsertRows.reduce((sum, row) => sum + ((parseFloat(row.quantity) || 0) * (parseFloat(row.unit_price) || 0)), 0);
    const uniqueVendors = [...new Set(multiInsertRows.map(row => row.vendor_id).filter(Boolean))];
    const totalBooks = multiInsertRows.reduce((sum, row) => sum + (parseInt(row.quantity) || 0), 0);

    if (loading) {
        return <Loader />;
    }

    // Render content based on active tab
    const renderTabContent = () => {
        switch (activeTab) {
            case "single":
                return (
                    <>
                        <Row className="align-items-center mb-4">
                            <Col md={8}>
                                <Form.Group>
                                    <Form.Label className="fw-bold">
                                        <i className="fa-solid fa-user-tie me-2 text-primary"></i>
                                        Select Vendor <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Select
                                        value={selectedVendor}
                                        onChange={handleVendorChange}
                                        options={vendorOptions}
                                        placeholder="Choose vendor for all purchases..."
                                        isClearable
                                        isSearchable
                                        menuPlacement="auto"
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                minHeight: "45px",
                                                fontSize: "16px",
                                                border: "2px solid #6f42c1",
                                                borderRadius: "8px",
                                                "&:hover": {
                                                    borderColor: "#8b5cf6",
                                                },
                                            }),
                                            menu: (base) => ({
                                                ...base,
                                                zIndex: 9999,
                                                position: 'absolute'
                                            }),
                                            menuPortal: (base) => ({
                                                ...base,
                                                zIndex: 9999
                                            })
                                        }}
                                        menuPortalTarget={document.body}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4} className="text-end">
                                <Button
                                    variant="outline-primary"
                                    onClick={() => setShowAddVendorModal(true)}
                                    className="mt-4"
                                >
                                    <i className="fa-solid fa-plus me-2"></i>
                                    Add New Vendor
                                </Button>
                            </Col>
                        </Row>


                        {/* Purchase Entries for Single Vendor */}
                        {renderPurchaseEntries("single")}
                    </>
                );

            case "multiple":
                return (
                    <>
                        <Alert variant="info" className="mb-4">
                            <i className="fa-solid fa-info-circle me-2"></i>
                            Add purchases from different vendors in one go. Each row can have a different vendor.
                        </Alert>
                        {renderPurchaseEntries("multiple")}
                    </>
                );

            case "scan":
                return (
                    <BarcodeScanPurchase
                        barcodeInput={barcodeInput}
                        setBarcodeInput={setBarcodeInput}
                        scanningBook={scanningBook}
                        setScanningBook={setScanningBook}
                        multiInsertRows={multiInsertRows}
                        setMultiInsertRows={setMultiInsertRows}
                        currentRowIndex={currentRowIndex}
                        setCurrentRowIndex={setCurrentRowIndex}
                        setActiveTab={setActiveTab}
                        onBarcodeScan={handleBarcodeScan}
                        loading={loading}
                    />
                );

            case "import":
                return (
                    <PurchaseDataImport
                        selectedFile={selectedFile}
                        onFileChange={handleFileChange}
                        loading={loading}
                    />
                );

            default:
                return null;
        }
    };

    // Render purchase entries table for single and multiple vendors
    const renderPurchaseEntries = (tabType) => {
        return (
            <>
                {/* Purchase Entries Header */}
                <div className="mb-3 d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="mb-1">
                            <i className="fa-solid fa-book me-2 text-success"></i>
                            {tabType === "single" ? "Add Books for Purchase" : "Purchase Entries"}
                        </h5>
                        {tabType === "single" && selectedVendor && (
                            <small className="text-muted">
                                Adding books for vendor: <strong>{selectedVendor.label}</strong>
                            </small>
                        )}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <span className="text-muted">
                            Entries: {multiInsertRows.length}
                        </span>
                        <Button
                            size='sm'
                            variant={tabType === "single" ? "success" : "info"}
                            onClick={tabType === "single" ? handleAddBookRow : handleAddVendorRow}
                            disabled={tabType === "single" && !selectedVendor}
                        >
                            <i className="fa-solid fa-plus me-1"></i>
                            {tabType === "single" ? "Add Book" : "Add Entry"}
                        </Button>
                    </div>
                </div>

                {tabType === "single" && !selectedVendor ? (
                    <div className="text-center py-5 border rounded bg-light">
                        <i className="fa-solid fa-user-tie fa-3x text-muted mb-3"></i>
                        <h5 className="text-muted">Please select a vendor first</h5>
                        <p className="text-muted">Choose a vendor above to start adding books for purchase</p>
                    </div>
                ) : (
                    <>
                        <div className="table-responsive" style={{ position: 'relative', zIndex: 5 }}>
                            <Table bordered hover>
                                <thead className="table-light">
                                    <tr>
                                        {tabType === "multiple" && (
                                            <th width="20%">
                                                Vendor <span className="text-danger">*</span>
                                            </th>
                                        )}
                                        <th width={tabType === "multiple" ? "20%" : "25%"}>
                                            Book <span className="text-danger">*</span>
                                        </th>
                                        <th width="8%">
                                            Qty <span className="text-danger">*</span>
                                        </th>
                                        <th width="10%">
                                            Unit Price <span className="text-danger">*</span>
                                        </th>
                                        <th width="12%">
                                            Total Amount
                                        </th>
                                        <th width="12%">
                                            Purchase Date
                                        </th>
                                        <th width={tabType === "multiple" ? "12%" : "15%"}>
                                            Notes
                                        </th>
                                        <th width="5%" className="text-center">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {multiInsertRows.map((row, index) => (
                                        <tr key={index}>
                                            {tabType === "multiple" && (
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <div className="flex-grow-1">
                                                            <Select
                                                                value={vendorOptions.find((v) => v.value === row.vendor_id) || null}
                                                                onChange={(selectedOption) => handleMultiRowChange(index, "vendor_id", selectedOption ? selectedOption.value : "")}
                                                                options={vendorOptions}
                                                                placeholder="Select Vendor"
                                                                isClearable
                                                                isSearchable
                                                                menuPlacement="auto"
                                                                styles={{
                                                                    menu: (base) => ({
                                                                        ...base,
                                                                        zIndex: 9999,
                                                                        position: 'absolute'
                                                                    }),
                                                                    menuPortal: (base) => ({
                                                                        ...base,
                                                                        zIndex: 9999
                                                                    })
                                                                }}
                                                                menuPortalTarget={document.body}
                                                            />
                                                        </div>
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => setShowAddVendorModal(true)}
                                                        >
                                                            <i className="fa-solid fa-plus"></i>
                                                        </Button>
                                                    </div>
                                                </td>
                                            )}
                                            <td>
                                                <div className="d-flex gap-1">
                                                    <div className="flex-grow-1">
                                                        <Select
                                                            value={bookOptions.find((b) => b.value === row.book_id) || null}
                                                            onChange={(selectedOption) => handleMultiRowChange(index, "book_id", selectedOption ? selectedOption.value : "")}
                                                            options={bookOptions}
                                                            placeholder="Select Book"
                                                            isClearable
                                                            isSearchable
                                                            menuPlacement="auto"
                                                            styles={{
                                                                menu: (base) => ({
                                                                    ...base,
                                                                    zIndex: 9999,
                                                                    position: 'absolute'
                                                                }),
                                                                menuPortal: (base) => ({
                                                                    ...base,
                                                                    zIndex: 9999
                                                                })
                                                            }}
                                                            menuPortalTarget={document.body}
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="outline-success"
                                                        size="sm"
                                                        onClick={() => setShowAddBookModal(true)}
                                                    >
                                                        <i className="fa-solid fa-plus"></i>
                                                    </Button>
                                                </div>
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="number"
                                                    value={row.quantity}
                                                    onChange={(e) => handleMultiRowChange(index, "quantity", e.target.value)}
                                                    min="1"
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="number"
                                                    value={row.unit_price}
                                                    onChange={(e) => handleMultiRowChange(index, "unit_price", e.target.value)}
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="text"
                                                    value={`₹${((parseFloat(row.quantity) || 0) * (parseFloat(row.unit_price) || 0)).toFixed(2)}`}
                                                    readOnly
                                                    className="bg-light"
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="date"
                                                    value={row.purchase_date}
                                                    onChange={(e) => handleMultiRowChange(index, "purchase_date", e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="text"
                                                    value={row.notes}
                                                    onChange={(e) => handleMultiRowChange(index, "notes", e.target.value)}
                                                    placeholder="Notes..."
                                                />
                                            </td>
                                            <td className="text-center">
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleRemoveRow(index)}
                                                    disabled={multiInsertRows.length === 1}
                                                >
                                                    <i className="fa-solid fa-trash"></i>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>

                        {/* Summary Section */}
                        {/* {multiInsertRows.length > 0 && (
                            <Card className={`mt-3 ${tabType === "single" ? "border-success" : "border-info"}`}>
                                <Card.Body>
                                    <Row className="align-items-center">
                                        <Col>
                                            <h6 className="mb-1">Summary</h6>
                                            <p className="mb-0 text-muted">
                                                {multiInsertRows.length} entr{multiInsertRows.length !== 1 ? 'ies' : 'y'} •
                                                {tabType === "multiple" && ` ${uniqueVendors.length} vendor${uniqueVendors.length !== 1 ? 's' : ''}`} •
                                                {` ${totalBooks} book${totalBooks !== 1 ? 's' : ''}`}
                                            </p>
                                        </Col>
                                        <Col xs="auto">
                                            <h4 className={`mb-0 ${tabType === "single" ? "text-success" : "text-info"}`}>
                                                ₹{totalAmount.toFixed(2)}
                                            </h4>
                                            <small className="text-muted">Total Amount</small>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        )} */}

                        {/* Action Buttons */}
                        <div className="d-flex justify-content-between mt-4">
                            <Button
                                variant="outline-secondary"
                                onClick={() => navigate('/purchase')}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSavePurchases}
                                disabled={saving || multiInsertRows.length === 0}
                                size="lg"
                            >
                                {saving ? (
                                    <>
                                        <i className="fa-solid fa-spinner fa-spin me-2"></i>
                                        Saving Purchases...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-save me-2"></i>
                                        Save {multiInsertRows.length} Purchase{multiInsertRows.length !== 1 ? 's' : ''}
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </>
        );
    };

    return (
        <Container fluid className="py-4" style={{ position: 'relative', zIndex: 1 }}>
            {/* Page Header */}
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h1 className="h3 fw-bold mb-1">
                                <i className="fa-solid fa-layer-group me-2 text-purple"></i>
                                Purchase Management
                            </h1>

                        </div>
                        <div className="d-flex gap-2">
                            <Button
                                variant="outline-secondary"
                                onClick={() => navigate('/purchase')}
                            >
                                <i className="fa-solid fa-arrow-left me-2"></i>
                                Back to Purchases
                            </Button>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Main Content */}
            <Row>
                <Col lg={12}>
                    <Card style={{ position: 'relative', zIndex: 10 }}>
                        <Card.Body style={{ position: 'relative', zIndex: 100 }}>
                            {/* Mode Selection Tabs */}
                            <Tabs
                                activeKey={activeTab}
                                onSelect={(k) => setActiveTab(k)}
                                className="mb-4"
                            >
                                <Tab eventKey="single" title={<span><i className="fa-solid fa-user me-2"></i>Single Vendor</span>} />
                                <Tab eventKey="multiple" title={<span><i className="fa-solid fa-users me-2"></i>Multiple Vendors</span>} />
                                <Tab eventKey="scan" title="Scan Barcode" />
                                <Tab eventKey="import" title="Import File" />
                            </Tabs>

                            {/* Render Tab Specific Content */}
                            {renderTabContent()}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Add Vendor Modal */}
            <Modal show={showAddVendorModal} onHide={() => setShowAddVendorModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="fa-solid fa-user-tie me-2 text-primary"></i>
                        Add New Vendor
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={vendorFormData.name}
                                        onChange={(e) => setVendorFormData({ ...vendorFormData, name: e.target.value })}
                                        placeholder="Enter vendor name"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Company Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={vendorFormData.company_name}
                                        onChange={(e) => setVendorFormData({ ...vendorFormData, company_name: e.target.value })}
                                        placeholder="Enter company name"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={vendorFormData.email}
                                        onChange={(e) => setVendorFormData({ ...vendorFormData, email: e.target.value })}
                                        placeholder="Enter email address"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Phone</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        value={vendorFormData.phone}
                                        onChange={(e) => setVendorFormData({ ...vendorFormData, phone: e.target.value })}
                                        placeholder="Enter phone number"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Address</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={vendorFormData.address}
                                        onChange={(e) => setVendorFormData({ ...vendorFormData, address: e.target.value })}
                                        placeholder="Enter address"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>City</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={vendorFormData.city}
                                        onChange={(e) => setVendorFormData({ ...vendorFormData, city: e.target.value })}
                                        placeholder="Enter city"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>State</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={vendorFormData.state}
                                        onChange={(e) => setVendorFormData({ ...vendorFormData, state: e.target.value })}
                                        placeholder="Enter state"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Pincode</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={vendorFormData.pincode}
                                        onChange={(e) => setVendorFormData({ ...vendorFormData, pincode: e.target.value })}
                                        placeholder="Enter pincode"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddVendorModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleAddVendor} disabled={loading}>
                        {loading ? 'Adding...' : 'Add Vendor'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Add Book Modal */}
            <Modal show={showAddBookModal} onHide={() => setShowAddBookModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="fa-solid fa-book me-2 text-success"></i>
                        Add New Book
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Title <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={bookFormData.title}
                                        onChange={(e) => setBookFormData({ ...bookFormData, title: e.target.value })}
                                        placeholder="Enter book title"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Author <span className="text-danger">*</span></Form.Label>
                                    <Select
                                        value={authors.find((a) => a.id === bookFormData.author_id) ?
                                            { value: bookFormData.author_id, label: authors.find((a) => a.id === bookFormData.author_id).name } : null}
                                        onChange={(selectedOption) => setBookFormData({ ...bookFormData, author_id: selectedOption ? selectedOption.value : "" })}
                                        options={authors.map((a) => ({ value: a.id, label: a.name }))}
                                        placeholder="Select Author"
                                        isClearable
                                        isSearchable
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Category <span className="text-danger">*</span></Form.Label>
                                    <Select
                                        value={categories.find((c) => c.id === bookFormData.category_id) ?
                                            { value: bookFormData.category_id, label: categories.find((c) => c.id === bookFormData.category_id).name } : null}
                                        onChange={(selectedOption) => setBookFormData({ ...bookFormData, category_id: selectedOption ? selectedOption.value : "" })}
                                        options={categories.map((c) => ({ value: c.id, label: c.name }))}
                                        placeholder="Select Category"
                                        isClearable
                                        isSearchable
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>ISBN</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={bookFormData.isbn}
                                        onChange={(e) => setBookFormData({ ...bookFormData, isbn: e.target.value })}
                                        placeholder="Enter ISBN number"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Language</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={bookFormData.language}
                                        onChange={(e) => setBookFormData({ ...bookFormData, language: e.target.value })}
                                        placeholder="Enter language"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Total Copies</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={bookFormData.total_copies}
                                        onChange={(e) => setBookFormData({ ...bookFormData, total_copies: parseInt(e.target.value) || 1 })}
                                        min="1"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Available Copies</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={bookFormData.available_copies}
                                        onChange={(e) => setBookFormData({ ...bookFormData, available_copies: parseInt(e.target.value) || 1 })}
                                        min="1"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddBookModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleAddBook} disabled={loading}>
                        {loading ? 'Adding...' : 'Add Book'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default BulkPurchasePage;