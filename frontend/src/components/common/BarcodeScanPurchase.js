import React from 'react';
import { Form, InputGroup, Button, Alert, Row, Col } from 'react-bootstrap';

const BarcodeScanPurchase = ({
  barcodeInput,
  setBarcodeInput,
  scanningBook,
  setScanningBook,
  multiInsertRows,
  setMultiInsertRows,
  currentRowIndex,
  setCurrentRowIndex,
  setActiveTab,
  onBarcodeScan,
  loading
}) => {

  const handleAddToPurchase = () => {
    const currentRow = multiInsertRows[currentRowIndex];
    if (currentRow && !currentRow.book_id) {
      const updatedRows = [...multiInsertRows];
      updatedRows[currentRowIndex] = {
        ...updatedRows[currentRowIndex],
        book_id: scanningBook.id
      };
      setMultiInsertRows(updatedRows);
    } else {
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
  };

  return (
    <div className="barcode-section">
      <h6 className="mb-3">Scan Book Barcode</h6>
      <Form.Group className="mb-3">
        <Form.Label className="fw-medium mb-2">
          <i className="fa-solid fa-barcode me-2"></i>
          Barcode / ISBN
        </Form.Label>
        <InputGroup className="barcode-input-group">
          <Form.Control
            type="text"
            placeholder="Enter barcode/ISBN"
            value={barcodeInput}
            onChange={(e) => {
              setBarcodeInput(e.target.value);
              if (e.target.value.length >= 10) {
                onBarcodeScan(e.target.value);
              }
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && barcodeInput.trim()) {
                onBarcodeScan(barcodeInput.trim());
              }
            }}
            disabled={loading}
          />
          <Button
            variant="outline-primary"
            onClick={() => barcodeInput.trim() && onBarcodeScan(barcodeInput.trim())}
            disabled={loading || !barcodeInput.trim()}
          >
            <i className={`fa-solid ${loading ? 'fa-spinner fa-spin' : 'fa-search'}`}></i>
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
        <div className="book-details-card">
          <h6 className="text-purple mb-3">Book Details</h6>
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
                onClick={handleAddToPurchase}
                className="bg-purple border-0 mt-2"
              >
                <i className="fa-solid fa-plus me-2"></i>
                Add to Purchase
              </Button>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanPurchase;