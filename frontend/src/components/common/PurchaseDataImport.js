 
 

 
 
 
 
 
 
 

 
 
 
 
 
 

 
 
 
 

 
 
 

 
 
 
 
 
 
 
 

 
 

 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 


 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 


 
import React, { useState } from 'react';
import { Card, Form, Button, Table, Alert, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import PubSub from 'pubsub-js';
import { saveImportedData } from '../../utils/importHelpers';
import Papa from 'papaparse';

const PurchaseDataImport = ({ selectedFile, onFileChange, loading, vendors, books }) => {
    const [previewData, setPreviewData] = useState([]);
    const [mapping, setMapping] = useState({});
    const [importProgress, setImportProgress] = useState(0);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {

            const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
            if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
                PubSub.publish("RECORD_ERROR_TOAST", {
                    title: "Import Error",
                    message: "Please upload a CSV or Excel file"
                });
                return;
            }

            onFileChange(file);

            // Parse CSV file
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        console.error('CSV parsing errors:', results.errors);
                        PubSub.publish("RECORD_ERROR_TOAST", {
                            title: "CSV Parse Error",
                            message: "Failed to parse CSV file. Please check the format."
                        });
                        return;
                    }

                    const data = results.data;
                    if (data.length === 0) {
                        PubSub.publish("RECORD_ERROR_TOAST", {
                            title: "Empty File",
                            message: "The uploaded file appears to be empty."
                        });
                        return;
                    }

                    console.log('Parsed CSV data:', data.slice(0, 5)); // Log first 5 rows for debugging
                    setPreviewData(data);

                    // Auto-map columns based on common patterns
                    const csvHeaders = results.meta.fields || [];
                    const autoMapping = {};

                    csvHeaders.forEach(header => {
                        const lowerHeader = header.toLowerCase().trim();

                        // Auto-map vendor field
                        if (lowerHeader.includes('vendor') || lowerHeader.includes('supplier') || lowerHeader.includes('publisher')) {
                            autoMapping.vendor = header;
                        }

                        // Auto-map book field
                        if (lowerHeader.includes('book') || lowerHeader.includes('title') || lowerHeader.includes('name')) {
                            autoMapping.book = header;
                        }

                        // Auto-map ISBN field
                        if (lowerHeader.includes('isbn') || lowerHeader === 'isbn') {
                            autoMapping.isbn = header;
                        }

                        // Auto-map quantity field
                        if (lowerHeader.includes('quantity') || lowerHeader.includes('qty') || lowerHeader.includes('copies')) {
                            autoMapping.quantity = header;
                        }

                        // Auto-map unit_price field
                        if (lowerHeader.includes('price') || lowerHeader.includes('cost') || lowerHeader.includes('unit_price') || lowerHeader.includes('rate')) {
                            autoMapping.unit_price = header;
                        }

                        // Auto-map purchase_date field
                        if (lowerHeader.includes('date') || lowerHeader.includes('purchase_date')) {
                            autoMapping.purchase_date = header;
                        }

                        // Auto-map notes field
                        if (lowerHeader.includes('notes') || lowerHeader.includes('comment') || lowerHeader.includes('remark')) {
                            autoMapping.notes = header;
                        }
                    });

                    setMapping(autoMapping);
                },
                error: (error) => {
                    console.error('Papa Parse error:', error);
                    PubSub.publish("RECORD_ERROR_TOAST", {
                        title: "File Read Error",
                        message: "Failed to read the uploaded file."
                    });
                }
            });
        }
    };

    const simulatePreviewData = () => {
 
        const mockData = [
            { vendor: 'ABC Publishers', book: 'The Great Gatsby', isbn: '9780141182636', quantity: 5, unit_price: 12.99 },
            { vendor: 'XYZ Books', book: 'To Kill a Mockingbird', isbn: '9780061120084', quantity: 3, unit_price: 10.50 },
            { vendor: 'ABC Publishers', book: '1984', isbn: '9780451524935', quantity: 8, unit_price: 8.75 }
        ];
        setPreviewData(mockData);
        
 
        setMapping({
            vendor: 'vendor',
            book: 'book',
            isbn: 'isbn',
            quantity: 'quantity',
            unit_price: 'unit_price'
        });
    };

    const handleMappingChange = (field, column) => {
        setMapping(prev => ({
            ...prev,
            [field]: column
        }));
    };

    const handleImport = async () => {
        if (!selectedFile) {
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Import Error",
                message: "Please select a file first"
            });
            return;
        }

        if (!mapping.vendor || !mapping.book || !mapping.quantity || !mapping.unit_price) {
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Import Error",
                message: "Please map all required columns (vendor, book, quantity, unit_price)"
            });
            return;
        }

        try {
            setImportProgress(10);

            // Transform the data according to mapping
            const transformedData = previewData.map(row => {
                const transformedRow = {};

                // Map required fields
                transformedRow.vendor = row[mapping.vendor]?.trim();
                transformedRow.book = row[mapping.book]?.trim();
                transformedRow.quantity = parseInt(row[mapping.quantity]) || 0;
                transformedRow.unit_price = parseFloat(row[mapping.unit_price]) || 0;

                // Map optional fields
                if (mapping.isbn && row[mapping.isbn]) {
                    transformedRow.isbn = row[mapping.isbn]?.trim();
                }
                if (mapping.purchase_date && row[mapping.purchase_date]) {
                    transformedRow.purchase_date = row[mapping.purchase_date]?.trim();
                }
                if (mapping.notes && row[mapping.notes]) {
                    transformedRow.notes = row[mapping.notes]?.trim();
                }

                return transformedRow;
            });

            setImportProgress(30);

            console.log('Transformed purchase data:', transformedData.slice(0, 3));

            // Use the import helper function
            const result = await saveImportedData({
                data: transformedData,
                apiEndpoint: 'purchase',
                formFields: [
                    { name: 'vendor_id', label: 'vendor', type: 'select', options: 'vendors', required: true },
                    { name: 'book_id', label: 'book', type: 'select', options: 'books', required: true },
                    { name: 'quantity', label: 'quantity', type: 'number', required: true },
                    { name: 'unit_price', label: 'unit_price', type: 'number', required: true },
                    { name: 'isbn', label: 'isbn', type: 'text' },
                    { name: 'purchase_date', label: 'purchase_date', type: 'text' },
                    { name: 'notes', label: 'notes', type: 'text' }
                ],
                relatedData: {
                    vendors: vendors,
                    books: books
                },
                moduleLabel: 'Purchase',
                autoCreateRelated: {
                    vendors: {
                        endpoint: 'vendor',
                        labelField: 'name',
                        extraPayload: { status: 'active' }
                    },
                    books: {
                        endpoint: 'book',
                        labelField: 'title',
                        extraPayload: { total_copies: 1, available_copies: 1, language: 'English' }
                    }
                }
            });

            setImportProgress(100);

            if (result.success) {
                toast.success(`Purchase data imported successfully! ${result.importedCount} records imported.`);
                if (result.duplicatesSkipped > 0) {
                    PubSub.publish("RECORD_ERROR_TOAST", {
                        title: "Import Warning",
                        message: `${result.duplicatesSkipped} duplicate records were skipped.`
                    });
                }
            } else {
                throw new Error(result.error || 'Import failed');
            }

            setPreviewData([]);
            setMapping({});
            setImportProgress(0);
            onFileChange(null);

            document.getElementById('fileInput').value = '';

        } catch (error) {
            console.error('Import error:', error);
            setImportProgress(0);
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Import Error",
                message: error.message || "Failed to import purchase data"
            });
        }
    };

    const requiredFields = ['vendor', 'book', 'quantity', 'unit_price'];
    const optionalFields = ['isbn', 'purchase_date', 'notes'];

    return (
        <div>
            {/* File Upload Section */}
            <Card className="mb-4">
                <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">
                        <i className="fa-solid fa-upload me-2"></i>
                        Upload Purchase Data File
                    </h5>
                </Card.Header>
                <Card.Body>
                    <Form.Group>
                        <Form.Label className="fw-semibold">
                            Select CSV or Excel File
                        </Form.Label>
                        <Form.Control
                            id="fileInput"
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileUpload}
                            disabled={loading}
                        />
                        <Form.Text className="text-muted">
                            Supported formats: CSV, Excel (.xlsx, .xls). File should contain vendor, book, quantity, and price information.
                        </Form.Text>
                    </Form.Group>

                    {selectedFile && (
                        <Alert variant="success" className="mt-3">
                            <i className="fa-solid fa-file me-2"></i>
                            Selected file: <strong>{selectedFile.name}</strong> 
                            ({Math.round(selectedFile.size / 1024)} KB)
                        </Alert>
                    )}
                </Card.Body>
            </Card>

            {/* Data Preview Section */}
            {previewData.length > 0 && (
                <Card className="mb-4">
                    <Card.Header className="bg-info text-white">
                        <h5 className="mb-0">
                            <i className="fa-solid fa-table me-2"></i>
                            Data Preview
                        </h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped bordered hover>
                                <thead className="table-light">
                                    <tr>
                                        <th>Vendor</th>
                                        <th>Book</th>
                                        <th>ISBN</th>
                                        <th>Quantity</th>
                                        <th>Unit Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 5).map((row, index) => (
                                        <tr key={index}>
                                            <td>{mapping.vendor ? row[mapping.vendor] : ''}</td>
                                            <td>{mapping.book ? row[mapping.book] : ''}</td>
                                            <td>{mapping.isbn ? row[mapping.isbn] : ''}</td>
                                            <td>{mapping.quantity ? row[mapping.quantity] : ''}</td>
                                            <td>{mapping.unit_price ? `$${row[mapping.unit_price]}` : ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                        <small className="text-muted">
                            Showing {previewData.length} sample records
                        </small>
                    </Card.Body>
                </Card>
            )}

            {/* Column Mapping Section */}
            {previewData.length > 0 && (
                <Card className="mb-4">
                    <Card.Header className="bg-warning text-dark">
                        <h5 className="mb-0">
                            <i className="fa-solid fa-columns me-2"></i>
                            Column Mapping
                        </h5>
                    </Card.Header>
                    <Card.Body>
                        <Alert variant="info" className="mb-3">
                            <i className="fa-solid fa-info-circle me-2"></i>
                            Map your file columns to the required purchase fields
                        </Alert>
                        
                        <Row>
                            <Col md={6}>
                                <h6 className="fw-bold mb-3">Required Fields</h6>
                                {requiredFields.map(field => (
                                    <Form.Group key={field} className="mb-3">
                                        <Form.Label className="text-capitalize">
                                            {field.replace('_', ' ')} <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Select
                                            value={mapping[field] || ''}
                                            onChange={(e) => handleMappingChange(field, e.target.value)}
                                        >
                                            <option value="">Select column...</option>
                                            {Object.keys(previewData[0] || {}).map(col => (
                                                <option key={col} value={col}>
                                                    {col} ({typeof previewData[0][col]})
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                ))}
                            </Col>
                            <Col md={6}>
                                <h6 className="fw-bold mb-3">Optional Fields</h6>
                                {optionalFields.map(field => (
                                    <Form.Group key={field} className="mb-3">
                                        <Form.Label className="text-capitalize">
                                            {field.replace('_', ' ')}
                                        </Form.Label>
                                        <Form.Select
                                            value={mapping[field] || ''}
                                            onChange={(e) => handleMappingChange(field, e.target.value)}
                                        >
                                            <option value="">Not mapped</option>
                                            {Object.keys(previewData[0] || {}).map(col => (
                                                <option key={col} value={col}>
                                                    {col} ({typeof previewData[0][col]})
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                ))}
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Import Progress Section */}
            {importProgress > 0 && importProgress < 100 && (
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">
                            <i className="fa-solid fa-sync fa-spin me-2"></i>
                            Importing Data...
                        </h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="progress mb-3" style={{ height: '20px' }}>
                            <div 
                                className="progress-bar progress-bar-striped progress-bar-animated" 
                                style={{ width: `${importProgress}%` }}
                            >
                                {importProgress}%
                            </div>
                        </div>
                        <small className="text-muted">
                            Processing purchase records... Please wait.
                        </small>
                    </Card.Body>
                </Card>
            )}

            {/* Action Buttons */}
            <div className="d-flex gap-3 justify-content-end">
                <Button 
                    variant="outline-secondary"
                    onClick={() => {
                        setPreviewData([]);
                        setMapping({});
                        setImportProgress(0);
                        onFileChange(null);
                        document.getElementById('fileInput').value = '';
                    }}
                >
                    <i className="fa-solid fa-times me-2"></i>
                    Cancel
                </Button>
                
                <Button 
                    variant="success"
                    onClick={handleImport}
                    disabled={loading || previewData.length === 0 || Object.keys(mapping).length < requiredFields.length}
                >
                    {loading ? (
                        <>
                            <i className="fa-solid fa-spinner fa-spin me-2"></i>
                            Importing...
                        </>
                    ) : (
                        <>
                            <i className="fa-solid fa-file-import me-2"></i>
                            Import Purchases
                        </>
                    )}
                </Button>
            </div>

            {/* Import Summary */}
            {previewData.length > 0 && (
                <Alert variant="light" className="mt-4">
                    <div className="d-flex justify-content-between">
                        <div>
                            <strong>Import Summary:</strong>
                        </div>
                        <div>
                            <span className="text-muted">Records: </span>
                            <strong>{previewData.length}</strong>
                        </div>
                        <div>
                            <span className="text-muted">Vendors: </span>
                            <strong>{new Set(previewData.map(row => mapping.vendor ? row[mapping.vendor] : '').filter(Boolean)).size}</strong>
                        </div>
                        <div>
                            <span className="text-muted">Books: </span>
                            <strong>{new Set(previewData.map(row => mapping.book ? row[mapping.book] : '').filter(Boolean)).size}</strong>
                        </div>
                        <div>
                            <span className="text-muted">Total Value: </span>
                            <strong>
                                ₹{previewData.reduce((sum, row) => {
                                    const quantity = mapping.quantity ? parseFloat(row[mapping.quantity]) || 0 : 0;
                                    const unitPrice = mapping.unit_price ? parseFloat(row[mapping.unit_price]) || 0 : 0;
                                    return sum + (quantity * unitPrice);
                                }, 0).toFixed(2)}
                            </strong>
                        </div>
                    </div>
                </Alert>
            )}
        </div>
    );
};

export default PurchaseDataImport;