
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Container, Row, Col, Card, Button, Form, Modal, Alert, Dropdown } from "react-bootstrap";
import DynamicCRUD from "../common/DynaminCrud";
import { getLibraryCardConfig } from "./librarycardconfig";
import { useDataManager } from "../common/userdatamanager";
import Loader from "../common/Loader";
import JsBarcode from "jsbarcode";
import DataApi from "../../api/dataApi";
import { API_BASE_URL } from "../../constants/CONSTANT";

const LibraryCard = (props) => {
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [barcodeError, setBarcodeError] = useState(null);
  const [barcodeData, setBarcodeData] = useState("");

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

    const cardData = generateBarcodeData(card);
    setBarcodeData(cardData);

    setShowBarcodeModal(true);
  };

  const handleModalClose = () => {
    setShowBarcodeModal(false);
    setSelectedCard(null);
    setBarcodeError(null);
    setBarcodeData("");
  };

  const generateBarcodeData = (card) => {
    // Use actual card_number from database, not generated
    const cardNumber = card.card_number || generateCardNumber(card);
    const cardData = {
      cardNumber: cardNumber,
      cardId: card.id,
      memberId: card.user_id || card.id,
      memberName: card.user_name || 'N/A',
      email: card.user_email || 'N/A',
      issueDate: formatDate(card.issue_date),
      expiryDate: formatDate(card.expiry_date),
      status: card.status || card.is_active ? 'active' : 'inactive',
      libraryId: "LIB001",
      generatedAt: new Date().toISOString()
    };

    return cardNumber;
  };

  const decodeBarcodeData = async (barcodeString) => {
    if (!barcodeString) return null;

    try {
      const cardNumber = barcodeString.trim();
      const api = new DataApi("librarycard");
      const response = await api.fetchAll();
      const cards = response?.data?.data || response?.data || [];

      const foundCard = cards.find(card =>
        card.card_number === cardNumber ||
        card.card_number?.toLowerCase() === cardNumber.toLowerCase()
      );

      if (foundCard) {
        return {
          cardNumber: foundCard.card_number || generateCardNumber(foundCard),
          cardId: foundCard.id,
          memberId: foundCard.user_id,
          memberName: foundCard.user_name || 'N/A',
          email: foundCard.user_email || 'N/A',
          issueDate: formatDate(foundCard.issue_date),
          expiryDate: formatDate(foundCard.expiry_date),
          status: foundCard.is_active ? 'active' : 'inactive',
          issuedBooks: foundCard.issued_books_count || 0,
          submittedBooks: foundCard.submitted_books_count || 0,
          libraryId: "LIB001"
        };
      }

      try {
        const decodedString = decodeURIComponent(escape(atob(barcodeString)));
        return JSON.parse(decodedString);
      } catch (e) {
        return null;
      }
    } catch (error) {
      console.error("Error decoding barcode data:", error);
      return null;
    }
  };

  const initializeModalBarcode = () => {
    if (!selectedCard || !showBarcodeModal || !barcodeData) return;

    const barcodeId = `barcode-modal-${selectedCard.id}`;

    setTimeout(() => {
      const barcodeElement = document.getElementById(barcodeId);
      if (!barcodeElement) {
        setBarcodeError("Barcode element not found");
        return;
      }

      try {
        barcodeElement.innerHTML = '';

        // Use card_number directly for barcode
        const cardNumber = selectedCard.card_number || generateCardNumber(selectedCard);
        JsBarcode(barcodeElement, cardNumber, {
          format: "CODE128",
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
        setBarcodeError("Barcode generation failed: " + error.message);
      }
    }, 100);
  };

  const handleDownloadBarcode = (card) => {
    if (!card) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = 400;
      canvas.height = 200;

      const barcodeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

      // Use card_number directly for barcode
      const cardNumber = card.card_number || generateCardNumber(card);
      JsBarcode(barcodeSvg, cardNumber, {
        format: "CODE128",
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

      barcodeSvg.setAttribute("width", "400");
      barcodeSvg.setAttribute("height", "120");

      const svgData = new XMLSerializer().serializeToString(barcodeSvg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        // Increase canvas size to accommodate image
        canvas.width = 600;
        canvas.height = 400;
        // Get new context after resizing canvas
        const newCtx = canvas.getContext('2d');

        // White background
        newCtx.fillStyle = "#ffffff";
        newCtx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw user image if available
        const imagePath = card.user_image || card.image;
        if (imagePath) {
          const userImg = new Image();
          userImg.crossOrigin = 'anonymous';

          // Construct full image URL
          let imageUrl = imagePath;
          if (!imagePath.startsWith('http://') && !imagePath.startsWith('https://')) {
            if (imagePath.startsWith('/uploads/')) {
              imageUrl = `${API_BASE_URL.replace('/ibs', '')}${imagePath}`;
            } else {
              imageUrl = `${API_BASE_URL.replace('/ibs', '')}/uploads/librarycards/${imagePath}`;
            }
          }

          userImg.onload = () => {
            // Draw user image
            const imgSize = 100;
            const imgX = (canvas.width - imgSize) / 2;
            const imgY = 20;
            newCtx.save();
            newCtx.beginPath();
            newCtx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
            newCtx.clip();
            newCtx.drawImage(userImg, imgX, imgY, imgSize, imgSize);
            newCtx.restore();

            // Draw border around image
            newCtx.strokeStyle = "#6f42c1";
            newCtx.lineWidth = 3;
            newCtx.beginPath();
            newCtx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
            newCtx.stroke();

            // Draw barcode below image
            newCtx.drawImage(img, 150, 140, 300, 120);

            // Draw card details
            newCtx.fillStyle = "#000000";
            newCtx.font = "bold 16px Arial";
            newCtx.textAlign = "center";
            newCtx.fillText(card.user_name || 'N/A', canvas.width / 2, 280);
            newCtx.font = "14px Arial";
            newCtx.fillText(cardNumber, canvas.width / 2, 300);

            // Download
            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `library-card-${generateCardNumber(card)}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            URL.revokeObjectURL(url);
          };
          userImg.onerror = () => {
            // If image fails to load, just draw barcode
            newCtx.drawImage(img, 150, 100, 300, 120);
            newCtx.fillStyle = "#000000";
            newCtx.font = "bold 16px Arial";
            newCtx.textAlign = "center";
            newCtx.fillText(cardNumber, canvas.width / 2, 250);

            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `library-card-${generateCardNumber(card)}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            URL.revokeObjectURL(url);
          };
          userImg.src = imageUrl;
        } else {
          // No image, just draw barcode
          newCtx.drawImage(img, 150, 100, 300, 120);
          newCtx.fillStyle = "#000000";
          newCtx.font = "bold 16px Arial";
          newCtx.textAlign = "center";
          newCtx.fillText(cardNumber, canvas.width / 2, 250);

          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `library-card-${generateCardNumber(card)}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          URL.revokeObjectURL(url);
        }
      };

      img.src = url;

    } catch (error) {
      console.error("Download error:", error);
      setBarcodeError("Failed to download barcode");
    }
  };

  const handlePrintBarcode = (card) => {
    if (!card) return;

    try {
      const barcodeId = `barcode-modal-${card.id}`;
      const barcodeElement = document.getElementById(barcodeId);

      if (!barcodeElement) {
        setBarcodeError("Barcode not found for printing");
        return;
      }

      const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Library Card - ${generateCardNumber(card)}</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: Arial, sans-serif; 
              background: white;
            }
            .library-card {
              border: 3px solid #6f42c1;
              border-radius: 15px;
              max-width: 500px;
              margin: 0 auto;
              background: white;
            }
            .card-header {
              background: #6f42c1;
              color: white;
              padding: 15px;
              text-align: center;
              border-radius: 12px 12px 0 0;
            }
            .card-body {
              padding: 20px;
            }
            .member-info {
              text-align: left;
              margin-bottom: 20px;
            }
            .member-info p {
              margin: 8px 0;
              font-size: 14px;
            }
            .barcode-container {
              border: 1px solid #ddd;
              padding: 15px;
              background: white;
              text-align: center;
              margin: 15px 0;
            }
            .barcode-svg {
              width: 100%;
              max-width: 350px;
              height: auto;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #666;
              margin-top: 15px;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .library-card { border: 2px solid #000; }
              button { display: none !important; }
              @page { margin: 0.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="library-card">
            <div class="card-header">
              <h2 style="margin: 0; font-size: 24px;">LIBRARY CARD</h2>
            </div>
            
            <div class="card-body">
              ${(() => {
          const imagePath = card.user_image || card.image;
          let imageUrl = null;
          const baseUrl = API_BASE_URL.replace('/ibs', '');
          if (imagePath) {
            if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
              imageUrl = imagePath;
            } else if (imagePath.startsWith('/uploads/')) {
              imageUrl = baseUrl + imagePath;
            } else {
              imageUrl = baseUrl + '/uploads/librarycards/' + imagePath;
            }
          }
          if (imageUrl) {
            return '<div style="text-align: center; margin-bottom: 20px;"><img src="' + imageUrl + '" alt="' + (card.user_name || 'User') + '" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #6f42c1; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" /></div>';
          } else {
            return '<div style="text-align: center; margin-bottom: 20px;"><div style="width: 80px; height: 80px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; margin: 0 auto; border: 3px solid #6f42c1;"><i class="fa-solid fa-user" style="font-size: 32px; color: #6f42c1;"></i></div></div>';
          }
        })()}
              <div class="member-info">
                <p><strong>Card No:</strong> ${generateCardNumber(card)}</p>
                <p><strong>Name:</strong> ${card.user_name || 'N/A'}</p>
                <p><strong>Email:</strong> ${card.user_email || 'N/A'}</p>
                <p><strong>Issue Date:</strong> ${formatDate(card.issue_date)}</p>
                <p><strong>Submission Date:</strong> ${formatDate(card.expiry_date) || 'N/A'}</p>
                <p><strong>Status:</strong> <span style="color: ${card.is_active ? 'green' : 'gray'}; font-weight: bold;">${card.is_active ? 'Active' : 'Inactive'}</span></p>
              </div>
              
              <div class="barcode-container">
                ${barcodeElement.outerHTML}
              </div>
              
              <div class="footer">  
                <p>Scan barcode to verify membership</p>
                <p>Generated: ${new Date().toLocaleDateString('en-GB')}</p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; display: none;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #6f42c1; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Print Now
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
              Close
            </button>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => {
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();

    } catch (error) {
      console.error("Print error:", error);
      setBarcodeError("Failed to generate print view");
    }
  };

  const testBarcodeScan = async () => {
    if (!barcodeData && !selectedCard) return;

    const barcodeToScan = barcodeData || (selectedCard?.card_number || generateCardNumber(selectedCard));
    const decodedData = await decodeBarcodeData(barcodeToScan);

    if (decodedData) {
      const dataString = `
Card Number: ${decodedData.cardNumber}
Member Name: ${decodedData.memberName}
Email: ${decodedData.email}
Issue Date: ${decodedData.issueDate}
Submission Date: ${decodedData.expiryDate || 'N/A'}
Status: ${decodedData.status}
Issued Books: ${decodedData.issuedBooks || 0}
Submitted Books: ${decodedData.submittedBooks || 0}
      `.trim();

      alert(`Barcode Scan Test Successful!\n\n${dataString}`);
    } else {
      alert("Failed to decode barcode data. Please ensure the barcode is valid.");
    }
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
    return card.card_number || (card.id ? `LC-${card.id.substring(0, 8).toUpperCase()}` : 'N/A');
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


    initialFormData: {
      user_id: "",
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: "",
      is_active: true,
      image: null
    },

    onSubmit: async (formData, isEditing) => {

      if (!formData.user_id) {
        alert(' Please select a user');
        return false;
      }

      if (formData.image instanceof File) {
        console.log(' Image file selected:', formData.image.name);
      }

      return true;
    },

    customHandlers: {
      ...getLibraryCardConfig(allData).customHandlers,
      handleBarcodePreview: handleModalOpen,
      generateCardNumber: generateCardNumber,
      formatDateToDDMMYYYY: formatDate,
      generateISBN13Number: generateDefaultISBN,
      calculateISBN13CheckDigit: calculateCheckDigit,
    }
  };

  return (
    <>
      <DynamicCRUD {...finalConfig} />

      <Modal show={showBarcodeModal} onHide={handleModalClose} size="lg" centered>
        <Modal.Header closeButton style={{
          background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
          color: "white",
          borderBottom: "none"
        }}>
          <Modal.Title style={{ color: "white" }}>
            <i className="fa-solid fa-id-card me-2"></i>
            Member Information
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "20px", background: "#f8f9fa" }}>
          {selectedCard && (
            <div style={{
              background: "white",
              border: "2px solid #6f42c1",
              borderRadius: "10px",
              padding: "20px",
              maxWidth: "500px",
              margin: "0 auto"
            }}>


              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                {(() => {
                  const imagePath = selectedCard.user_image || selectedCard.image;
                  let imageUrl = null;

                  if (imagePath) {
                    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
                      imageUrl = imagePath;
                    }
                    else if (imagePath.startsWith('/uploads/')) {
                      const baseUrl = API_BASE_URL.replace('/ibs', '');
                      imageUrl = `${baseUrl}${imagePath}`;
                    }
                    else {
                      const baseUrl = API_BASE_URL.replace('/ibs', '');
                      imageUrl = `${baseUrl}/uploads/librarycards/${imagePath}`;
                    }
                  }

                  return imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={selectedCard.user_name || 'User'}
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #6f42c1',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null;
                })()}
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: '#f0f0f0',
                  display: (selectedCard.user_image || selectedCard.image) ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  border: '3px solid #6f42c1'
                }}>
                  <i className="fa-solid fa-user" style={{ fontSize: "32px", color: "#6f42c1" }}></i>
                </div>
              </div>

              {/* Member Info */}
              <div style={{
                background: "#f8f9fa",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "20px"
              }}>
                <p style={{ margin: "5px 0" }}>
                  <strong>Card No:</strong> {generateCardNumber(selectedCard)}
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Name:</strong> {selectedCard.user_name || 'N/A'}
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Email:</strong> {selectedCard.user_email || 'N/A'}
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Issue Date:</strong> {formatDate(selectedCard.issue_date)}
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Submission Date:</strong> {formatDate(selectedCard.expiry_date) || 'N/A'}
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Status:</strong>{' '}
                  <span style={{ color: selectedCard.is_active ? "green" : "gray", fontWeight: "bold" }}>
                    {selectedCard.is_active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>

              {/* Barcode Section */}
              {barcodeError && <Alert variant="warning" className="mb-3">{barcodeError}</Alert>}

              <div style={{
                border: "1px solid #ddd",
                padding: "15px",
                background: "white",
                textAlign: "center",
                marginBottom: "15px",
                borderRadius: "8px"
              }}>
                <div style={{
                  maxWidth: '300px',
                  margin: '0 auto',
                  overflow: 'hidden'
                }}>
                  <svg
                    id={`barcode-modal-${selectedCard.id}`}
                    style={{
                      width: '100%',
                      height: '70px',
                      display: 'block'
                    }}
                  ></svg>
                </div>
                <div style={{
                  marginTop: "10px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#6f42c1",
                  fontFamily: "monospace"
                }}>
                  {generateCardNumber(selectedCard)}
                </div>
              </div>

              {/* Test Barcode Button */}
              <div className="text-center">
                <Button
                  variant="primary"
                  onClick={testBarcodeScan}
                  style={{
                    background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 20px",
                    fontWeight: "600"
                  }}
                >
                  <i className="fa-solid fa-qrcode me-2"></i>
                  Test Barcode Scan
                </Button>
              </div>

              {/* Footer */}
              <div style={{
                textAlign: "center",
                fontSize: "12px",
                color: "#666",
                marginTop: "15px"
              }}>
                <p style={{ margin: 0 }}>Scan barcode to verify membership</p>
                <p style={{ margin: "5px 0 0 0" }}>Generated: {new Date().toLocaleDateString('en-GB')}</p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <div>
            <Button
              variant="outline-success"
              onClick={() => handleDownloadBarcode(selectedCard)}
              className="me-2"
            >
              <i className="fa-solid fa-download me-1"></i>
              Download
            </Button>

            <Button
              variant="outline-primary"
              onClick={() => handlePrintBarcode(selectedCard)}
              className="me-2"
            >
              <i className="fa-solid fa-print me-1"></i>
              Print
            </Button>
          </div>

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