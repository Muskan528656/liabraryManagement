import React, { useRef } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';

const PurchaseDataImport = ({
    selectedFile,
    onFileChange,
    onDemoDownload,
    loading = false
}) => {
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0]; // Safe access using optional chaining
        if (file) {
            onFileChange(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const files = e.dataTransfer?.files; // Safe access
        if (files && files.length > 0) {
            const file = files[0];
            if (isValidFileType(file)) {
                onFileChange(file);
            }
        }
    };

    const isValidFileType = (file) => {
        if (!file) return false;

        const validTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
        ];
        return validTypes.includes(file.type) ||
            file.name?.endsWith('.xlsx') ||
            file.name?.endsWith('.xls') ||
            file.name?.endsWith('.csv');
    };

    // Demo data for template
    const demoData = [
        {
            "Vendor": "Book World Publishers",
            "Book": "The Great Gatsby",
            "Quantity": 10,
            "Unit Price": 450.00,
            "Purchase Date": "2024-01-15",
            "Notes": "Classic literature purchase"
        },
        {
            "Vendor": "Readers Paradise",
            "Book": "To Kill a Mockingbird",
            "Quantity": 8,
            "Unit Price": 380.50,
            "Purchase Date": "2024-01-16",
            "Notes": "School curriculum books"
        },
        {
            "Vendor": "Global Books Inc",
            "Book": "1984",
            "Quantity": 15,
            "Unit Price": 320.75,
            "Purchase Date": "2024-01-17",
            "Notes": "Dystopian fiction collection"
        }
    ];

    const handleDemoDownload = () => {
        // Create CSV content
        const headers = Object.keys(demoData[0]).join(',');
        const rows = demoData.map(row =>
            Object.values(row).map(value =>
                typeof value === 'string' && value.includes(',') ? `"${value}"` : value
            ).join(',')
        );
        const csvContent = [headers, ...rows].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'purchase_import_template.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    return (
        <div style={{ padding: '0.5rem' }}>
            {/* Demo File Section */}
            {/* <Card 
        style={{ 
          border: '1px solid #e3f2fd',
          background: 'linear-gradient(135deg, #f8fbff 0%, #ffffff 100%)',
          marginBottom: '1.5rem'
        }}
      >
        <Card.Body style={{ padding: '1rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}>
             */}


            <Button
                variant="outline-primary"
                size="sm"
                onClick={onDemoDownload || handleDemoDownload}
                style={{
                    borderColor: '#1976d2',
                    color: '#1976d2',
                    fontWeight: '500'
                }}
                className='custom-btn-primary'
            >
                <i className="fa-solid fa-file-excel me-2"></i>
                Download CSV Template
            </Button>
            {/* </div> */}
            {/* //     </Card.Body> */}
            {/* //   </Card> */}

            {/* File Upload Section */}
            <div style={{ marginBottom: '1.3rem' }}>

                <div
                    style={{
                        border: selectedFile ? '2px dashed #28a745' : '2px dashed #dee2e6',
                        borderRadius: '12px',
                        padding: '2.5rem 1.5rem',
                        background: selectedFile ? '#f8fff9' : '#fafbfc',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        position: 'relative'
                    }}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />

                    <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                        {selectedFile ? (
                            <>
                                <i
                                    className="fa-solid fa-file-excel text-success"
                                    style={{ fontSize: '3rem', marginBottom: '1rem' }}
                                ></i>
                                <h6 style={{ color: '#28a745', marginBottom: '0.5rem' }}>
                                    File Selected
                                </h6>
                                <p style={{
                                    fontWeight: '600',
                                    color: '#28a745',
                                    marginBottom: '0.25rem',
                                    wordBreak: 'break-all'
                                }}>
                                    {selectedFile.name}
                                </p>
                                <small style={{ color: '#6c757d' }}>
                                    Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </small>
                                <div style={{ marginTop: '1rem' }}>
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onFileChange(null);
                                        }}
                                    >
                                        <i className="fa-solid fa-times me-2"></i>
                                        Remove File
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <i
                                    className="fa-solid fa-cloud-arrow-up text-muted"
                                    style={{ fontSize: '3rem', marginBottom: '1rem' }}
                                ></i>
                                <h6 style={{ marginBottom: '0.5rem' }}>Drop your file here</h6>
                                <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
                                    or click to browse
                                </p>
                                <div style={{ marginTop: '1rem' }}>
                                    <small style={{ color: '#6c757d' }}>
                                        Supports: .xlsx, .xls, .csv
                                    </small>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Instructions Section */}
            <Alert
                variant="info"
                style={{
                    border: '1px solid #bee5eb',
                    borderLeft: '4px solid #1976d2',
                    background: '#f8fbff',
                    marginTop: '1.5rem'
                }}
            >
                <Alert.Heading style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#1976d2',
                    marginBottom: '0.5rem'
                }}>
                    <i className="fa-solid fa-circle-info me-2"></i>
                    File Requirements
                </Alert.Heading>
                <div style={{ fontSize: '0.875rem' }}>
                    <strong>Required Columns:</strong>
                    <ul style={{ marginBottom: 0, marginTop: '0.5rem' }}>
                        <li>
                            <code style={{
                                background: '#e3f2fd',
                                color: '#1976d2',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: '500'
                            }}>
                                Vendor
                            </code> - Vendor name or ID
                        </li>
                        <li>
                            <code style={{
                                background: '#e3f2fd',
                                color: '#1976d2',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: '500'
                            }}>
                                Book
                            </code> - Book title or ID
                        </li>
                        <li>
                            <code style={{
                                background: '#e3f2fd',
                                color: '#1976d2',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: '500'
                            }}>
                                Quantity
                            </code> - Number of copies (positive integer)
                        </li>
                        <li>
                            <code style={{
                                background: '#e3f2fd',
                                color: '#1976d2',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: '500'
                            }}>
                                Unit Price
                            </code> - Price per book (decimal)
                        </li>
                        <li>
                            <code style={{
                                background: '#e3f2fd',
                                color: '#1976d2',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: '500'
                            }}>
                                Purchase Date
                            </code> - Date in YYYY-MM-DD format
                        </li>
                        <li>
                            <code style={{
                                background: '#e3f2fd',
                                color: '#1976d2',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: '500'
                            }}>
                                Notes
                            </code> - Optional comments
                        </li>
                    </ul>
                </div>
            </Alert>

            {/* Validation Status */}
            {selectedFile && (
                <Alert
                    variant="success"
                    style={{
                        borderLeft: '4px solid #28a745',
                        background: '#f8fff9',
                        marginTop: '1rem'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <i className="fa-solid fa-circle-check me-2"></i>
                        <div>
                            <strong>File ready for import</strong>
                            <div style={{ fontSize: '0.875rem' }}>
                                Click "Import File" button to process your data
                            </div>
                        </div>
                    </div>
                </Alert>
            )}
        </div>
    );
};

export default PurchaseDataImport;