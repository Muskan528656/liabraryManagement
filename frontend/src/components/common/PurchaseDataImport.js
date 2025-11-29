 
 

 
 
 
 
 
 
 

 
 
 
 
 
 

 
 
 
 

 
 
 

 
 
 
 
 
 
 
 

 
 

 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 


 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 


 
import React, { useState } from 'react';
import { Card, Form, Button, Table, Alert, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';

const PurchaseDataImport = ({ selectedFile, onFileChange, loading }) => {
    const [previewData, setPreviewData] = useState([]);
    const [mapping, setMapping] = useState({});
    const [importProgress, setImportProgress] = useState(0);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
 
            const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
            if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
                toast.error('Please upload a CSV or Excel file');
                return;
            }

            onFileChange(file);
 
            simulatePreviewData();
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
            toast.error('Please select a file first');
            return;
        }

        if (Object.keys(mapping).length === 0) {
            toast.error('Please map all required columns');
            return;
        }

        try {
            setImportProgress(0);
 
            for (let i = 0; i <= 100; i += 10) {
                setImportProgress(i);
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            toast.success('Purchase data imported successfully!');
 
            setPreviewData([]);
            setMapping({});
            setImportProgress(0);
            onFileChange(null);
            
 
            document.getElementById('fileInput').value = '';
            
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Failed to import purchase data');
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
                                    {previewData.map((row, index) => (
                                        <tr key={index}>
                                            <td>{row.vendor}</td>
                                            <td>{row.book}</td>
                                            <td>{row.isbn}</td>
                                            <td>{row.quantity}</td>
                                            <td>${row.unit_price}</td>
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
                            <strong>{new Set(previewData.map(row => row.vendor)).size}</strong>
                        </div>
                        <div>
                            <span className="text-muted">Books: </span>
                            <strong>{new Set(previewData.map(row => row.book)).size}</strong>
                        </div>
                        <div>
                            <span className="text-muted">Total Value: </span>
                            <strong>
                                ₹{previewData.reduce((sum, row) => sum + (row.quantity * row.unit_price), 0).toFixed(2)}
                            </strong>
                        </div>
                    </div>
                </Alert>
            )}
        </div>
    );
};

export default PurchaseDataImport;