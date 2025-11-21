// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import { Container, Row, Col, Card, Button, Form, Modal, Alert, Dropdown } from "react-bootstrap";
// import DynamicCRUD from "../common/DynaminCrud";
// import { getLibraryCardConfig } from "./librarycardconfig";
// import { useDataManager } from "../common/userdatamanager";
// import Loader from "../common/Loader";
// import JsBarcode from "jsbarcode";

// const LibraryCard = (props) => {
//   const [showBarcodeModal, setShowBarcodeModal] = useState(false);
//   const [selectedCard, setSelectedCard] = useState(null);
//   const [barcodeError, setBarcodeError] = useState(null);
//   const [barcodeData, setBarcodeData] = useState("");

//   const baseConfig = getLibraryCardConfig();
//   const dataDependencies = baseConfig.dataDependencies || [];
//   const { data, loading, error } = useDataManager(dataDependencies, props);

//   useEffect(() => {
//     if (showBarcodeModal && selectedCard) {
//       const timer = setTimeout(() => {
//         initializeModalBarcode();
//       }, 500);
//       return () => clearTimeout(timer);
//     }
//   }, [showBarcodeModal, selectedCard]);

//   const handleModalOpen = (card) => {
//     console.log("Opening modal for card:", card);
//     setSelectedCard(card);
//     setBarcodeError(null);

//     const cardData = generateBarcodeData(card);
//     setBarcodeData(cardData);

//     setShowBarcodeModal(true);
//   };

//   const handleModalClose = () => {
//     setShowBarcodeModal(false);
//     setSelectedCard(null);
//     setBarcodeError(null);
//     setBarcodeData("");
//   };

//   const generateBarcodeData = (card) => {
//     const cardData = {
//       cardNumber: generateCardNumber(card),
//       memberId: card.user_id || card.id,
//       memberName: card.user_name || 'N/A',
//       email: card.user_email || 'N/A',
//       issueDate: formatDate(card.issue_date),
//       expiryDate: formatDate(card.expiry_date),
//       status: card.status || 'active',
//       libraryId: "LIB001", // Your library ID
//       generatedAt: new Date().toISOString()
//     };

//     const jsonString = JSON.stringify(cardData);
//     return btoa(unescape(encodeURIComponent(jsonString)));
//   };

//   const decodeBarcodeData = (barcodeString) => {
//     try {
//       const decodedString = decodeURIComponent(escape(atob(barcodeString)));
//       return JSON.parse(decodedString);
//     } catch (error) {
//       console.error("Error decoding barcode data:", error);
//       return null;
//     }
//   };

//   const initializeModalBarcode = () => {
//     if (!selectedCard || !showBarcodeModal || !barcodeData) return;

//     const barcodeId = `barcode-modal-${selectedCard.id}`;

//     setTimeout(() => {
//       const barcodeElement = document.getElementById(barcodeId);
//       if (!barcodeElement) {
//         setBarcodeError("Barcode element not found");
//         return;
//       }

//       try {
//         barcodeElement.innerHTML = '';

//         // Consistent barcode settings for all views
//         JsBarcode(barcodeElement, barcodeData, {
//           format: "CODE128",
//           width: 2, // Fixed width
//           height: 80,
//           displayValue: true, // Show text below barcode
//           text: generateCardNumber(selectedCard),
//           fontSize: 14,
//           margin: 10,
//           background: "#ffffff",
//           lineColor: "#000000",
//           flat: true
//         });

//         setBarcodeError(null);
//       } catch (error) {
//         console.error("Barcode generation error:", error);
//         setBarcodeError("Barcode generation failed: " + error.message);
//       }
//     }, 100);
//   };

//   const handleDownloadBarcode = (card) => {
//     if (!card) return;

//     try {
//       // Create new canvas
//       const canvas = document.createElement('canvas');
//       const ctx = canvas.getContext('2d');

//       // Set dimensions
//       canvas.width = 400;
//       canvas.height = 200;

//       // Create barcode with SAME settings as modal
//       const barcodeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

//       JsBarcode(barcodeSvg, barcodeData, {
//         format: "CODE128",
//         width: 2,
//         height: 80,
//         displayValue: true,
//         text: generateCardNumber(card),
//         fontSize: 14,
//         margin: 10,
//         background: "#ffffff",
//         lineColor: "#000000",
//         flat: true
//       });

//       // Set SVG dimensions
//       barcodeSvg.setAttribute("width", "400");
//       barcodeSvg.setAttribute("height", "120");

//       const svgData = new XMLSerializer().serializeToString(barcodeSvg);
//       const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
//       const url = URL.createObjectURL(svgBlob);
//       const img = new Image();

//       img.onload = () => {
//         // White background
//         ctx.fillStyle = "#ffffff";
//         ctx.fillRect(0, 0, canvas.width, canvas.height);

//         // Draw barcode centered
//         ctx.drawImage(img, 50, 30, 300, 120);

//         // Convert to PNG and download
//         const pngUrl = canvas.toDataURL('image/png');
//         const downloadLink = document.createElement('a');
//         downloadLink.href = pngUrl;
//         downloadLink.download = `library-card-${generateCardNumber(card)}.png`;
//         document.body.appendChild(downloadLink);
//         downloadLink.click();
//         document.body.removeChild(downloadLink);

//         URL.revokeObjectURL(url);
//       };

//       img.src = url;

//     } catch (error) {
//       console.error("Download error:", error);
//       setBarcodeError("Failed to download barcode");
//     }
//   };
//   const handlePrintBarcode = (card) => {
//     if (!card) return;

//     try {
//       // First ensure barcode is rendered in modal
//       const barcodeId = `barcode-modal-${card.id}`;
//       const barcodeElement = document.getElementById(barcodeId);

//       if (!barcodeElement) {
//         setBarcodeError("Barcode not found for printing");
//         return;
//       }

//       const printContent = `
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <title>Library Card - ${generateCardNumber(card)}</title>
//           <style>
//             body { 
//               margin: 0; 
//               padding: 20px; 
//               font-family: Arial, sans-serif; 
//               background: white;
//             }
//             .library-card {
//               border: 3px solid #6f42c1;
//               border-radius: 15px;
//               max-width: 500px;
//               margin: 0 auto;
//               background: white;
//             }
//             .card-header {
//               background: #6f42c1;
//               color: white;
//               padding: 15px;
//               text-align: center;
//               border-radius: 12px 12px 0 0;
//             }
//             .card-body {
//               padding: 20px;
//             }
//             .member-info {
//               text-align: left;
//               margin-bottom: 20px;
//             }
//             .member-info p {
//               margin: 8px 0;
//               font-size: 14px;
//             }
//             .barcode-container {
//               border: 1px solid #ddd;
//               padding: 15px;
//               background: white;
//               text-align: center;
//               margin: 15px 0;
//             }
//             .barcode-svg {
//               width: 100%;
//               max-width: 350px;
//               height: auto;
//             }
//             .footer {
//               text-align: center;
//               font-size: 12px;
//               color: #666;
//               margin-top: 15px;
//             }
//             @media print {
//               body { margin: 0; padding: 0; }
//               .library-card { border: 2px solid #000; }
//               button { display: none !important; }
//               @page { margin: 0.5cm; }
//             }
//           </style>
//         </head>
//         <body>
//           <div class="library-card">
//             <div class="card-header">
//               <h2 style="margin: 0; font-size: 24px;">LIBRARY CARD</h2>
//             </div>

//             <div class="card-body">
//               <div class="member-info">
//                 <p><strong>Card No:</strong> ${generateCardNumber(card)}</p>
//                 <p><strong>Name:</strong> ${card.user_name || 'N/A'}</p>
//                 <p><strong>Email:</strong> ${card.user_email || 'N/A'}</p>
//                 <p><strong>Issue Date:</strong> ${formatDate(card.issue_date)}</p>
//                 <p><strong>Expiry Date:</strong> ${formatDate(card.expiry_date) || 'N/A'}</p>
//                 <p><strong>Status:</strong> <span style="color: green; font-weight: bold;">${card.status || 'Active'}</span></p>
//               </div>

//               <div class="barcode-container">
//                 ${barcodeElement.outerHTML}
//               </div>

//               <div class="footer">
//                 <p>Scan barcode to verify membership</p>
//                 <p>Generated: ${new Date().toLocaleDateString('en-GB')}</p>
//               </div>
//             </div>
//           </div>

//           <div style="text-align: center; margin-top: 20px; display: none;">
//             <button onclick="window.print()" style="padding: 10px 20px; background: #6f42c1; color: white; border: none; border-radius: 4px; cursor: pointer;">
//               Print Now
//             </button>
//             <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
//               Close
//             </button>
//           </div>

//           <script>
//             // Auto-print and close after printing
//             window.onload = function() {
//               window.print();
//               setTimeout(() => {
//                 window.close();
//               }, 500);
//             };
//           </script>
//         </body>
//       </html>
//     `;

//       const printWindow = window.open('', '_blank');
//       printWindow.document.write(printContent);
//       printWindow.document.close();

//     } catch (error) {
//       console.error("Print error:", error);
//       setBarcodeError("Failed to generate print view");
//     }
//   };

//   const testBarcodeScan = () => {
//     if (!barcodeData) return;

//     const decodedData = decodeBarcodeData(barcodeData);
//     if (decodedData) {
//       alert(`Barcode Scan Test Successful!\n\nDecoded Data:\n${JSON.stringify(decodedData, null, 2)}`);
//     } else {
//       alert("Failed to decode barcode data");
//     }
//   };

//   const generateDefaultISBN = (card) => {
//     try {
//       const cardId = card.id || "000000000";
//       const numericPart = cardId.replace(/\D/g, '').padEnd(9, '0').substring(0, 9);
//       const baseNumber = "978" + numericPart;
//       const isbn12 = (baseNumber + "000").slice(0, 12);
//       const checkDigit = calculateCheckDigit(isbn12);
//       return isbn12 + checkDigit;
//     } catch (error) {
//       return "9780000000000";
//     }
//   };

//   const calculateCheckDigit = (isbn12) => {
//     let sum = 0;
//     for (let i = 0; i < 12; i++) {
//       const digit = parseInt(isbn12[i]);
//       sum += (i % 2 === 0) ? digit : digit * 3;
//     }
//     return ((10 - (sum % 10)) % 10).toString();
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return 'N/A';
//     try {
//       return new Date(dateString).toLocaleDateString('en-GB');
//     } catch {
//       return 'Invalid Date';
//     }
//   };

//   const generateCardNumber = (card) => {
//     return card.id ? `LC-${card.id.substring(0, 8).toUpperCase()}` : 'N/A';
//   };

//   if (loading) return <Loader message="Loading library cards data..." />;
//   if (error) return (
//     <div className="alert alert-danger m-3">
//       <h4>Error Loading Library Cards</h4>
//       <p>{error.message}</p>
//       <button className="btn btn-primary mt-2" onClick={() => window.location.reload()}>
//         Retry
//       </button>
//     </div>
//   );

//   const allData = {
//     ...(data || {}),
//     ...props
//   };

//   const finalConfig = {
//     ...getLibraryCardConfig(allData),
//     customHandlers: {
//       ...getLibraryCardConfig(allData).customHandlers,
//       handleBarcodePreview: handleModalOpen,
//       generateCardNumber: generateCardNumber,
//       formatDateToDDMMYYYY: formatDate,
//       generateISBN13Number: generateDefaultISBN,
//       calculateISBN13CheckDigit: calculateCheckDigit,
//     }
//   };

//   return (
//     <>
//       <DynamicCRUD {...finalConfig} />

//       <Modal show={showBarcodeModal} onHide={handleModalClose} size="lg" centered>
//         <Modal.Header closeButton>
//           <Modal.Title>
//             <i className="fa-solid fa-barcode me-2"></i>
//             Library Card Barcode
//           </Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           {selectedCard && (
//             <Card>
//               <Card.Header className="bg-light fw-bold">
//                 <i className="fa-solid fa-user me-2"></i>
//                 Member Information
//               </Card.Header>
//               <Card.Body>
//                 <Row className="mb-2">
//                   <Col lg={6} className="text-start fw-medium">Card Number:</Col>
//                   <Col lg={6} className="text-end text-primary fw-bold">
//                     {generateCardNumber(selectedCard)}
//                   </Col>
//                 </Row>

//                 <Row className="mb-2">
//                   <Col lg={6} className="text-start fw-medium">Member Name:</Col>
//                   <Col lg={6} className="text-end">
//                     {selectedCard.user_name || 'N/A'}
//                   </Col>
//                 </Row>

//                 <Row className="mb-2">
//                   <Col lg={6} className="text-start fw-medium">Email:</Col>
//                   <Col lg={6} className="text-end">
//                     {selectedCard.user_email || 'N/A'}
//                   </Col>
//                 </Row>

//                 <Row className="mb-2">
//                   <Col lg={6} className="text-start fw-medium">Issue Date:</Col>
//                   <Col lg={6} className="text-end">
//                     {formatDate(selectedCard.issue_date)}
//                   </Col>
//                 </Row>

//                 <Row className="mb-3">
//                   <Col lg={6} className="text-start fw-medium">Expiry Date:</Col>
//                   <Col lg={6} className="text-end">
//                     {formatDate(selectedCard.expiry_date) || 'N/A'}
//                   </Col>
//                 </Row>

//                 {barcodeError && <Alert variant="warning">{barcodeError}</Alert>}


//                 <div className="barcode-container bg-white p-3 rounded border text-center">
//                   <div className="mb-1 text-muted small">
//                     <i className="fa-solid fa-info-circle me-1"></i>
//                     Scan this barcode
//                   </div>

//                   <div style={{
//                     maxWidth: '300px',
//                     margin: '0 auto',
//                     overflow: 'hidden'
//                   }}>
//                     <svg
//                       id={`barcode-modal-${selectedCard.id}`}
//                       style={{
//                         width: '100%',
//                         height: '70px',
//                         display: 'block'
//                       }}
//                     ></svg>
//                   </div>

//                   <div className="mt-1 text-muted small fw-bold">
//                     {generateCardNumber(selectedCard)}
//                   </div>
//                 </div>

//                 <div className="text-center mt-3">
//                   <Button
//                     variant="outline-info"
//                     size="sm"
//                     onClick={testBarcodeScan}
//                   >
//                     <i className="fa-solid fa-qrcode me-1"></i>
//                     Test Barcode Scan
//                   </Button>
//                 </div>
//               </Card.Body>
//             </Card>
//           )}
//         </Modal.Body>
//         <Modal.Footer className="d-flex justify-content-between">
//           <div>
//             <Button
//               variant="outline-success"
//               onClick={() => handleDownloadBarcode(selectedCard)}
//               className="me-2"
//             >
//               <i className="fa-solid fa-download me-1"></i>
//               Download
//             </Button>

//             <Button
//               variant="outline-primary"
//               onClick={() => handlePrintBarcode(selectedCard)}
//               className="me-2"
//             >
//               <i className="fa-solid fa-print me-1"></i>
//               Print
//             </Button>
//           </div>

//           <Button variant="secondary" onClick={handleModalClose}>
//             <i className="fa-solid fa-times me-1"></i>
//             Close
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </>
//   );
// };

// export default LibraryCard;

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Container, Row, Col, Card, Button, Form, Modal, Alert, Dropdown } from "react-bootstrap";
import DynamicCRUD from "../common/DynaminCrud";
import { getLibraryCardConfig } from "./librarycardconfig";
import { useDataManager } from "../common/userdatamanager";
import Loader from "../common/Loader";
import JsBarcode from "jsbarcode";

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
    const cardData = {
      cardNumber: generateCardNumber(card),
      memberId: card.user_id || card.id,
      memberName: card.user_name || 'N/A',
      email: card.user_email || 'N/A',
      issueDate: formatDate(card.issue_date),
      expiryDate: formatDate(card.expiry_date),
      status: card.status || 'active',
      libraryId: "LIB001",
      generatedAt: new Date().toISOString()
    };

    const jsonString = JSON.stringify(cardData);
    return btoa(unescape(encodeURIComponent(jsonString)));
  };

  const decodeBarcodeData = (barcodeString) => {
    try {
      const decodedString = decodeURIComponent(escape(atob(barcodeString)));
      return JSON.parse(decodedString);
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

        JsBarcode(barcodeElement, barcodeData, {
          format: "CODE128",
          width: 2,
          height: 80,
          displayValue: true,
          text: generateCardNumber(selectedCard),
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

      JsBarcode(barcodeSvg, barcodeData, {
        format: "CODE128",
        width: 2,
        height: 80,
        displayValue: true,
        text: generateCardNumber(card),
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
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, 50, 30, 300, 120);

        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `library-card-${generateCardNumber(card)}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        URL.revokeObjectURL(url);
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
              <div class="member-info">
                <p><strong>Card No:</strong> ${generateCardNumber(card)}</p>
                <p><strong>Name:</strong> ${card.user_name || 'N/A'}</p>
                <p><strong>Email:</strong> ${card.user_email || 'N/A'}</p>
                <p><strong>Issue Date:</strong> ${formatDate(card.issue_date)}</p>
                <p><strong>Expiry Date:</strong> ${formatDate(card.expiry_date) || 'N/A'}</p>
                <p><strong>Status:</strong> <span style="color: green; font-weight: bold;">${card.status || 'Active'}</span></p>
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

  const testBarcodeScan = () => {
    if (!barcodeData) return;

    const decodedData = decodeBarcodeData(barcodeData);
    if (decodedData) {
      alert(`Barcode Scan Test Successful!\n\nDecoded Data:\n${JSON.stringify(decodedData, null, 2)}`);
    } else {
      alert("Failed to decode barcode data");
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

    // ✅ FIXED: Proper initial form data
    initialFormData: {
      user_id: "",
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: "",
      is_active: true,
      image: null
    },

    // ✅ FIXED: Form submission handling
    onSubmit: async (formData, isEditing) => {
      console.log('🎯 Submitting library card:', formData);

      // Validate required fields
      if (!formData.user_id) {
        alert('❌ Please select a user');
        return false;
      }

      // Handle file upload
      if (formData.image instanceof File) {
        console.log('📁 Image file selected:', formData.image.name);
        // File upload logic here
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

                <Row className="mb-2">
                  <Col lg={6} className="text-start fw-medium">Issue Date:</Col>
                  <Col lg={6} className="text-end">
                    {formatDate(selectedCard.issue_date)}
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col lg={6} className="text-start fw-medium">Expiry Date:</Col>
                  <Col lg={6} className="text-end">
                    {formatDate(selectedCard.expiry_date) || 'N/A'}
                  </Col>
                </Row>

                {barcodeError && <Alert variant="warning">{barcodeError}</Alert>}

                <div className="barcode-container bg-white p-3 rounded border text-center">
                  <div className="mb-1 text-muted small">
                    <i className="fa-solid fa-info-circle me-1"></i>
                    Scan this barcode
                  </div>

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

                  <div className="mt-1 text-muted small fw-bold">
                    {generateCardNumber(selectedCard)}
                  </div>
                </div>

                <div className="text-center mt-3">
                  <Button
                    variant="outline-info"
                    size="sm"
                    onClick={testBarcodeScan}
                  >
                    <i className="fa-solid fa-qrcode me-1"></i>
                    Test Barcode Scan
                  </Button>
                </div>
              </Card.Body>
            </Card>
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