
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Container, Row, Col, Card, Button, Form, Modal, Alert, Dropdown } from "react-bootstrap";

import DynamicCRUD from "../common/DynaminCrud";
import { getLibraryCardConfig } from "./LibraryCardConfig";
import { useDataManager } from "../common/UserDataManager";
import Loader from "../common/Loader";
import JsBarcode from "jsbarcode";
const LibraryCard = (props) => {
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [barcodeError, setBarcodeError] = useState(null);

  // Pehle base config lein
  const baseConfig = getLibraryCardConfig();
  const dataDependencies = baseConfig.dataDependencies || [];
  const { data, loading, error } = useDataManager(dataDependencies, props);

  useEffect(() => {
    if (showBarcodeModal && selectedCard) {
      const timer = setTimeout(() => {
        initializeModalBarcode();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showBarcodeModal, selectedCard]);

  const handleModalOpen = (card) => {
    console.log("Opening modal for card:", card);
    setSelectedCard(card);
    setBarcodeError(null);
    setShowBarcodeModal(true);
  };

  const handleModalClose = () => {
    setShowBarcodeModal(false);
    setSelectedCard(null);
    setBarcodeError(null);
  };

  const initializeModalBarcode = () => {
    if (!selectedCard || !showBarcodeModal) return;

    const barcodeId = `barcode-modal-${selectedCard.id}`;
    
    setTimeout(() => {
      const barcodeElement = document.getElementById(barcodeId);
      if (!barcodeElement) {
        setBarcodeError("Barcode element not found");
        return;
      }

      try {
        barcodeElement.innerHTML = '';
        const isbn13Number = generateDefaultISBN(selectedCard);
        
        JsBarcode(barcodeElement, isbn13Number, {
          format: "EAN13",
          width: 2,
          height: 80,
          displayValue: true,
        });

        setBarcodeError(null);
      } catch (error) {
        setBarcodeError(error.message);
      }
    }, 300);
  };

  const generateDefaultISBN = (card) => {
    try {
      const cardId = card.id || "000000000";
      const numericPart = cardId.replace(/\D/g, '').padEnd(9, '0').substring(0, 9);
      const baseNumber = "978" + numericPart;
      const isbn12 = (baseNumber + "000").slice(0, 12);
      const checkDigit = calculateCheckDigit(isbn12);
      return isbn12 + checkDigit;
    } catch (error) {
      return "9780000000000";
    }
  };

  const calculateCheckDigit = (isbn12) => {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(isbn12[i]);
      sum += (i % 2 === 0) ? digit : digit * 3;
    }
    return ((10 - (sum % 10)) % 10).toString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return 'Invalid Date';
    }
  };

  const generateCardNumber = (card) => {
    return card.id ? `LC-${card.id.substring(0, 8).toUpperCase()}` : 'N/A';
  };

  if (loading) return <Loader message="Loading library cards data..." />;
  if (error) return (
    <div className="alert alert-danger m-3">
      <h4>Error Loading Library Cards</h4>
      <p>{error.message}</p>
      <button className="btn btn-primary mt-2" onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  );

  const allData = { 
    ...(data || {}), 
    ...props 
  };

  const finalConfig = {
    ...getLibraryCardConfig(allData),
    customHandlers: {
      ...getLibraryCardConfig(allData).customHandlers,
      handleBarcodePreview: handleModalOpen, 
      generateCardNumber: generateCardNumber,
      formatDateToDDMMYYYY: formatDate,
      generateISBN13Number: generateDefaultISBN,
      calculateISBN13CheckDigit: calculateCheckDigit,
    }
  };

  console.log("Final Config with handlers:", finalConfig.customHandlers);

  return (
    <>
      <DynamicCRUD {...finalConfig} />

      <Modal show={showBarcodeModal} onHide={handleModalClose} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fa-solid fa-barcode me-2"></i>
            Library Card Barcode
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCard && (
            <Card>
              <Card.Header className="bg-light fw-bold">
                <i className="fa-solid fa-user me-2"></i>
                Member Information
              </Card.Header>
              <Card.Body>
                <Row className="mb-2">
                  <Col lg={6} className="text-start fw-medium">Card Number:</Col>
                  <Col lg={6} className="text-end text-primary fw-bold">
                    {generateCardNumber(selectedCard)}
                  </Col>
                </Row>

                <Row className="mb-2">
                  <Col lg={6} className="text-start fw-medium">Member Name:</Col>
                  <Col lg={6} className="text-end">
                    {selectedCard.user_name || 'N/A'}
                  </Col>
                </Row>

                <Row className="mb-2">
                  <Col lg={6} className="text-start fw-medium">Email:</Col>
                  <Col lg={6} className="text-end">
                    {selectedCard.user_email || 'N/A'}
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col lg={6} className="text-start fw-medium">Issue Date:</Col>
                  <Col lg={6} className="text-end">
                    {formatDate(selectedCard.issue_date)}
                  </Col>
                </Row>
                
                {barcodeError && <Alert variant="warning">{barcodeError}</Alert>}
                
                <div className="barcode-container bg-light p-3 rounded border text-center">
                  <svg
                    id={`barcode-modal-${selectedCard.id}`}
                    style={{ width: '100%', height: '80px' }}
                  ></svg>
                </div>
              </Card.Body>
            </Card>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            <i className="fa-solid fa-times me-1"></i>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};


export default LibraryCard;