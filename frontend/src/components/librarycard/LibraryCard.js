import React, { useState, useEffect } from "react";
import { Button, Modal, Alert } from "react-bootstrap";
import DynamicCRUD from "../common/DynaminCrud";
import { getLibraryCardConfig } from "./librarycardconfig";
import { useDataManager } from "../common/userdatamanager";
import Loader from "../common/Loader";
import JsBarcode from "jsbarcode";
import DataApi from "../../api/dataApi";
import { API_BASE_URL } from "../../constants/CONSTANT";
import { handleDownloadBarcode } from './LibraryCardDownload';
import { handlePrintBarcode } from './LibrarycardPrint';

const LibraryCard = (props) => {
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [barcodeError, setBarcodeError] = useState(null);
  const [baseConfig, setBaseConfig] = useState(null);
  const [finalConfig, setFinalConfig] = useState(null);

  const dataDependencies = baseConfig?.dataDependencies || [];
  const { data, loading, error } = useDataManager(dataDependencies, props);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await getLibraryCardConfig();
        setBaseConfig(config);
      } catch (error) {
        console.error("Error fetching library card config:", error);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (data && baseConfig) {
      const buildFinalConfig = async () => {
        try {
          const allData = { ...(data || {}), ...props };
          const config = await getLibraryCardConfig(allData);
          const final = {
            ...config,
            onSubmit: async (formData, setFormData) => {
              if (!formData.user_id) {
                alert("Please select a user");
                return false;
              }

              if (!formData.card_number) {
                const cardNumber = await handleAutoConfig(setFormData);
                if (!cardNumber) return false;
              }

              formData.isbn_code = generateDefaultISBN({ id: formData.card_number });

              try {
                const response = await DataApi.createLibraryCard(formData);

                if (!response?.data?.success || !response.data.data) {
                  alert("Failed to create library card");
                  return false;
                }

                const newCard = response.data.data;

                handleModalOpen(newCard);

                if (setFormData) setFormData({});

                return true;
              } catch (err) {
                console.error("Error creating card:", err);
                alert("Error creating library card");
                return false;
              }
            },

            customHandlers: {
              ...config.customHandlers,
              handleBarcodePreview: handleModalOpen,
              formatDateToDDMMYYYY: formatDate,
              generateISBN13Number: generateDefaultISBN
            }
          };
          setFinalConfig(final);
        } catch (error) {
          console.error("Error building final config:", error);
        }
      };
      buildFinalConfig();
    }
  }, [data, baseConfig, props]);

  useEffect(() => {
    if (showBarcodeModal && selectedCard) {
      const timer = setTimeout(() => initializeModalBarcode(), 500);
      return () => clearTimeout(timer);
    }
  }, [showBarcodeModal, selectedCard]);

  const handleModalOpen = (card) => {
    console.log("CArd->>>", card)
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

    const cardNumber = selectedCard.card_number || "N/A";
    if (!cardNumber || cardNumber === "N/A") {
      setBarcodeError("Cannot generate barcode: card number missing");
      return;
    }

    const barcodeElement = document.getElementById(`barcode-modal-${selectedCard.id}`);
    if (!barcodeElement) return;

    try {
      barcodeElement.innerHTML = '';
      JsBarcode(barcodeElement, cardNumber, {
        width: 2,
        height: 80,
        displayValue: true,
        text: cardNumber,
        fontSize: 14,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000",
        flat: true
      });
      setBarcodeError(null);
    } catch (error) {
      console.error("Barcode generation error:", error);
      setBarcodeError("Failed to generate barcode");
    }
  };

  const handleAutoConfig = async (setFormData) => {
    try {
      const res = await fetch("/librarycard/auto-config-card");
      const data = await res.json();
      if (data.card_number) {
        setFormData(prev => ({ ...prev, card_number: data.card_number }));
        return data.card_number;
      }
      return null;
    } catch (err) {
      console.error("Auto-config failed:", err);
      return null;
    }
  };

  const generateDefaultISBN = (card) => {
    try {
      const cardId = card.id || "000000000";
      const numericPart = cardId.replace(/\D/g, '').padEnd(9, '0').substring(0, 9);
      const baseNumber = "978" + numericPart;
      const isbn12 = (baseNumber + "000").slice(0, 12);
      let sum = 0;
      for (let i = 0; i < 12; i++) sum += (i % 2 === 0 ? parseInt(isbn12[i]) : parseInt(isbn12[i]) * 3);
      const checkDigit = ((10 - (sum % 10)) % 10).toString();
      return isbn12 + checkDigit;
    } catch {
      return "9780000000000";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return 'Invalid Date';
    }
  };

  const generateCardNumber = (card) => card.card_number || 'N/A';

  if (loading || !finalConfig) return <Loader message="Loading library cards data..." />;
  if (error) return (
    <div className="alert alert-danger m-3">
      <h4>Error Loading Library Cards</h4>
      <p>{error.message}</p>
      <button className="btn btn-primary mt-2" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );



  return (
    <>
      <DynamicCRUD {...finalConfig} icon="fa-solid fa-id-card" />

      <Modal show={showBarcodeModal} onHide={handleModalClose} size="lg" centered>
        <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)", color: "white", borderBottom: "none" }}>
          <Modal.Title style={{ color: "white" }}>
            <i className="fa-solid fa-id-card me-2"></i> Member Information
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "20px", background: "#f8f9fa" }}>
          {selectedCard && (
            <div style={{ background: "white", border: "2px solid #6f42c1", borderRadius: "10px", padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                {selectedCard.image ? (
                  <img
                    src={selectedCard.image.startsWith("http") ? selectedCard.image : `${API_BASE_URL}${selectedCard.image}`}
                    alt={selectedCard.first_name || 'User'}
                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #6f42c1' }}
                  />
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', border: '3px solid #6f42c1' }}>
                    <i className="fa-solid fa-user" style={{ fontSize: "32px", color: "#6f42c1" }}></i>
                  </div>
                )}
              </div>

              <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
                <p><strong>Card No:</strong> {generateCardNumber(selectedCard)}</p>
                <p><strong>Name:</strong> {selectedCard.first_name || 'N/A'}</p>

                <p><strong>Email:</strong> {selectedCard.email || 'N/A'}</p>
                <p><strong>Registraion Date:</strong> {formatDate(selectedCard.registration_date)}</p>
                <p><strong>Status:</strong> <span style={{ color: selectedCard.is_active ? "green" : "gray", fontWeight: "bold" }}>{selectedCard.is_active ? 'Active' : 'Inactive'}</span></p>
              </div>

              {barcodeError && <Alert variant="warning" className="mb-3">{barcodeError}</Alert>}

              <div style={{ border: "1px solid #ddd", padding: "15px", background: "white", textAlign: "center", marginBottom: "15px", borderRadius: "8px" }}>
                <svg id={`barcode-modal-${selectedCard.id}`} style={{ width: '100%', height: '70px', display: 'block' }}></svg>
                <div style={{ marginTop: "10px", fontSize: "14px", fontWeight: "600", color: "#6f42c1", fontFamily: "monospace" }}>
                  {generateCardNumber(selectedCard)}
                </div>
              </div>

              <div style={{ textAlign: "center", fontSize: "12px", color: "#666", marginTop: "15px" }}>
                <p style={{ margin: 0 }}>Scan barcode to verify membership</p>
                <p style={{ margin: "5px 0 0 0" }}>Generated: {new Date().toLocaleDateString('en-GB')}</p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <div>
            <Button variant="outline-success" onClick={() => handleDownloadBarcode(selectedCard, API_BASE_URL, generateCardNumber, setBarcodeError, formatDate)} className="me-2">
              <i className="fa-solid fa-download me-1"></i> Download
            </Button>
            <Button variant="outline-primary" onClick={() => handlePrintBarcode(selectedCard, API_BASE_URL, generateCardNumber, formatDate, setBarcodeError)} className="me-2">
              <i className="fa-solid fa-print me-1"></i> Print
            </Button>
          </div>
          <Button variant="secondary" onClick={handleModalClose}><i className="fa-solid fa-times me-1"></i> Close</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default LibraryCard;
