

// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import { Container, Row, Col, Card, Button, Form, Modal, InputGroup, Badge, Dropdown } from "react-bootstrap";
// import { useNavigate } from "react-router-dom";
// import ResizableTable from "../common/ResizableTable";
// import ScrollToTop from "../common/ScrollToTop";
// import Loader from "../common/Loader";
// import DataApi from "../../api/dataApi";
// import PubSub from "pubsub-js";
// import { exportToExcel } from "../../utils/excelExport";
// import Select from "react-select";
// import JsBarcode from "jsbarcode";
// import TableHeader from "../common/TableHeader";

// const LibraryCard = () => {
//   const navigate = useNavigate();
//   const [cards, setCards] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [showModal, setShowModal] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [editingCard, setEditingCard] = useState(null);
//   const [deleteId, setDeleteId] = useState(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [issuedBooks, setIssuedBooks] = useState({});
//   const [barcodesGenerated, setBarcodesGenerated] = useState(new Set());
//   const [selectedItems, setSelectedItems] = useState([]);
//   const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
//   const [librarySettings, setLibrarySettings] = useState({ duration_days: 365 });
//   const recordsPerPage = 10;
//   const [showBarcodeModal, setShowBarcodeModal] = useState(false);
//   const [selectedCard, setSelectedCard] = useState(null); // Changed from selectedBarcode to selectedCard
//   // const handlePrintView = () => {
//   //     try {
//   //       const printWindow = window.open('', '_blank', 'width=1000,height=800');

//   //       let htmlContent = `
//   //         <!DOCTYPE html>
//   //         <html>
//   //         <head>
//   //           <title>Library Card Barcodes - Print</title>
//   //           <style>
//   //             * {
//   //               margin: 0;
//   //               padding: 0;
//   //               box-sizing: border-box;
//   //             }
//   //             body {
//   //               font-family: Arial, sans-serif;
//   //               background: white;
//   //               padding: 20px;
//   //             }
//   //             .page {
//   //               background: white;
//   //               page-break-after: always;
//   //               padding: 20px;
//   //               margin-bottom: 20px;
//   //             }
//   //             .header {
//   //               text-align: center;
//   //               margin-bottom: 20px;
//   //               border-bottom: 2px solid #6f42c1;
//   //               padding-bottom: 10px;
//   //             }
//   //             .header h1 {
//   //               color: #6f42c1;
//   //               font-size: 24px;
//   //               margin-bottom: 5px;
//   //             }
//   //             .header p {
//   //               color: #666;
//   //               font-size: 14px;
//   //             }
//   //             .cards-grid {
//   //               display: grid;
//   //               grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
//   //               gap: 15px;
//   //               margin-top: 20px;
//   //             }
//   //             .card-item {
//   //               border: 2px solid #e0e0e0;
//   //               padding: 15px;
//   //               border-radius: 8px;
//   //               text-align: center;
//   //               page-break-inside: avoid;
//   //               background: white;
//   //             }
//   //             .card-item-header {
//   //               color: #6f42c1;
//   //               font-weight: bold;
//   //               font-size: 12px;
//   //               margin-bottom: 8px;
//   //               text-transform: uppercase;
//   //               letter-spacing: 1px;
//   //             }
//   //             .barcode-container {
//   //               background: white;
//   //               padding: 8px;
//   //               border-radius: 4px;
//   //               margin: 8px 0;
//   //               min-height: 50px;
//   //               display: flex;
//   //               align-items: center;
//   //               justify-content: center;
//   //               border: 1px solid #ddd;
//   //             }
//   //             .barcode-container svg {
//   //               max-width: 100%;
//   //               height: 40px;
//   //             }
//   //             .isbn-number {
//   //               font-family: monospace;
//   //               font-size: 10px;
//   //               color: #333;
//   //               font-weight: bold;
//   //               margin: 6px 0;
//   //               word-break: break-all;
//   //             }
//   //             .card-number {
//   //               font-size: 9px;
//   //               color: #666;
//   //               margin-bottom: 4px;
//   //               font-weight: bold;
//   //             }
//   //             .user-info {
//   //               font-size: 10px;
//   //               color: #555;
//   //               margin-top: 8px;
//   //               border-top: 1px solid #e0e0e0;
//   //               padding-top: 6px;
//   //             }
//   //             .user-name {
//   //               font-weight: bold;
//   //               color: #333;
//   //               font-size: 11px;
//   //             }
//   //             .user-email {
//   //               font-size: 8px;
//   //               color: #999;
//   //             }
//   //             @media print {
//   //               body {
//   //                 background: white;
//   //                 padding: 10px;
//   //               }
//   //               .page {
//   //                 box-shadow: none;
//   //                 margin-bottom: 0;
//   //                 page-break-after: always;
//   //               }
//   //               .card-item {
//   //                 border: 1px solid #ccc;
//   //               }
//   //             }
//   //           </style>
//   //         </head>
//   //         <body>
//   //           <div class="page">
//   //             <div class="header">
//   //               <h1>📚 Library Card Barcodes</h1>
//   //               <p>Print and distribute these cards</p>
//   //               <p>Generated on ${new Date().toLocaleDateString()}</p>
//   //             </div>
//   //             <div class="cards-grid">
//   //       `;

//   //       // Add each card with barcode
//   //       filteredCards.forEach((card, index) => {
//   //         let isbn13Number;
//   //         try {
//   //           isbn13Number = generateISBN13Number(card);
//   //           if (!isbn13Number || !/^\d+$/.test(isbn13Number)) {
//   //             isbn13Number = generateSimpleISBN13(card, index);
//   //           }
//   //         } catch (error) {
//   //           isbn13Number = generateSimpleISBN13(card, index);
//   //         }

//   //         const cardNumber = generateCardNumber(card);
//   //         const userName = card.user_name || card.student_name || '-';
//   //         const userEmail = card.user_email || card.email || '-';

//   //         // Generate barcode SVG using the same method as in table
//   //         const barcodeSvg = generateBarcodeSvgForPrint(isbn13Number);

//   //         htmlContent += `
//   //           <div class="card-item">
//   //             <div class="card-item-header">📋 Library Card</div>
//   //             <div class="barcode-container">
//   //               ${barcodeSvg}
//   //             </div>
//   //             <div class="isbn-number">${isbn13Number}</div>
//   //             <div class="card-number">Card: ${cardNumber}</div>
//   //             <div class="user-info">
//   //               <div class="user-name">${userName}</div>
//   //               <div class="user-email">${userEmail}</div>
//   //             </div>
//   //           </div>
//   //         `;
//   //       });

//   //       htmlContent += `
//   //             </div>
//   //           </div>
//   //           <script>
//   //             // Auto print after content loads
//   //             window.onload = function() {
//   //               setTimeout(() => {
//   //                 window.print();
//   //                 // Close window after printing
//   //                 setTimeout(() => {
//   //                   window.close();
//   //                 }, 500);
//   //               }, 1000);
//   //             };
//   //           </script>
//   //         </body>
//   //         </html>
//   //       `;

//   //       printWindow.document.write(htmlContent);
//   //       printWindow.document.close();

//   //       PubSub.publish("RECORD_SAVED_TOAST", {
//   //         title: "Print View Opened",
//   //         message: "Barcode cards are ready to print",
//   //       });
//   //     } catch (error) {
//   //       console.error("Error opening print view:", error);
//   //       PubSub.publish("RECORD_ERROR_TOAST", {
//   //         title: "Error",
//   //         message: "Failed to open print view",
//   //       });
//   //     }
//   //   };

//   // Add this function to generate barcode SVG for print
//   // const generateBarcodeSvgForPrint = (barcodeNumber) => {
//   //   if (!barcodeNumber || barcodeNumber.length < 12) {
//   //     barcodeNumber = '9780000000000';
//   //   }

//   //   // Create EAN-13 barcode pattern
//   //   let bars = '';
//   //   const barWidth = 1.5;
//   //   let xPosition = 20;

//   //   // EAN-13 pattern: 3 start bars + 6 left digits + 5 middle bars + 6 right digits + 3 end bars
//   //   const patterns = {
//   //     '0': '0001101', '1': '0011001', '2': '0010011', '3': '0111101', '4': '0100011',
//   //     '5': '0110001', '6': '0101111', '7': '0111011', '8': '0110111', '9': '0001011'
//   //   };

//   //   // Start pattern (3 bars)
//   //   bars += '<rect x="' + xPosition + '" y="5" width="' + barWidth + '" height="40" fill="black"/>';
//   //   xPosition += barWidth;
//   //   bars += '<rect x="' + xPosition + '" y="5" width="' + barWidth + '" height="40" fill="white"/>';
//   //   xPosition += barWidth;
//   //   bars += '<rect x="' + xPosition + '" y="5" width="' + barWidth + '" height="40" fill="black"/>';
//   //   xPosition += barWidth;

//   //   // Left 6 digits
//   //   for (let i = 0; i < 6; i++) {
//   //     const digit = barcodeNumber[i];
//   //     const pattern = patterns[digit];
//   //     for (let j = 0; j < 7; j++) {
//   //       if (pattern[j] === '1') {
//   //         bars += '<rect x="' + xPosition + '" y="5" width="' + barWidth + '" height="40" fill="black"/>';
//   //       } else {
//   //         bars += '<rect x="' + xPosition + '" y="5" width="' + barWidth + '" height="40" fill="white"/>';
//   //       }
//   //       xPosition += barWidth;
//   //     }
//   //   }

//   //   // Middle pattern (5 bars)
//   //   bars += '<rect x="' + xPosition + '" y="5" width="' + barWidth + '" height="40" fill="white"/>';
//   //   xPosition += barWidth;
//   //   bars += '<rect x="' + xPosition + '" y="5" width="' + barWidth + '" height="40" fill="black"/>';
//   //   xPosition += barWidth;
//   //   bars += '<rect x="' + xPosition + '" y="5" width="' + barWidth + '" height="40" fill="white"/>';
//   //   xPosition += barWidth;
//   //   bars += '<rect x="' + xPosition + '" y="5" width="' + barWidth + '" height="40" fill="black"/>';
//   //   xPosition += barWidth;
//   //   bars += '<rect x="' + xPosition + '" y="5" width="' + barWidth + '" height="40" fill="white"/>';
//   //   xPosition += barWidth;

//   //   // Right 6 digits
//   //   for (let i = 6; i < 12; i++) {
//   //     const digit = barcodeNumber[i];
//   //     const pattern = patterns[digit];
//   //     for (let j = 0; j < 7; j++) {
//   //       if (pattern[j] === '1') {
//   //         bars += '<rect x="' + xPosition + '" y="5" width="' + barWidth + '" height="40" fill="black"/>';
//   //       } else {
//   //         bars += '<rect x="' + xPosition + '" y="5" width="' + barWidth + '" height="40" fill="white"/>';
//   //       }
//   //       xPosition += barWidth;
//   //     }
//   //   }

//   //   // End pattern (3 bars)
//   //   bars += '<rect x="' + xPosition + '" y="5" width="' + barWidth + '" height="40" fill="black"/>';
//   //   xPosition += barWidth;
//   //   bars += '<rect x="' + xPosition + '" y="5" width="' + barWidth + '" height="40" fill="white"/>';
//   //   xPosition += barWidth;
//   //   bars += '<rect x="' + xPosition + '" y="5" width="' + barWidth + '" height="40" fill="black"/>';
//   //   xPosition += barWidth;

//   //   const totalWidth = xPosition + 20;

//   //   return `
//   //   <svg width="${totalWidth}" height="60" viewBox="0 0 ${totalWidth} 60" xmlns="http://www.w3.org/2000/svg">
//   //     <rect width="100%" height="100%" fill="white"/>
//   //     ${bars}
//   //     <text x="${totalWidth / 2}" y="55" text-anchor="middle" font-family="Arial" font-size="8" fill="black">${barcodeNumber}</text>
//   //   </svg>
//   // `;
//   // };

//   // Column visibility state
//   const [visibleColumns, setVisibleColumns] = useState({
//     card_number: true,
//     user_name: true,
//     user_email: true,
//     issue_date: true,
//     expiry_date: true,
//     is_active: true,
//     barcode: true,
//   });

//   const [formData, setFormData] = useState({
//     user_id: "",
//     issue_date: new Date().toISOString().split('T')[0],
//     expiry_date: "",
//     is_active: true,
//   });

//   // Format date to DD-MM-YYYY
//   const formatDateToDDMMYYYY = (dateString) => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     const day = String(date.getDate()).padStart(2, '0');
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const year = date.getFullYear();
//     return `${day}-${month}-${year}`;
//   };

//   // Format date to YYYY-MM-DD for input fields
//   const formatDateToYYYYMMDD = (dateString) => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
//   };

//   // Generate ISBN13 number
//   const generateISBN13Number = useCallback((card) => {
//     const prefix = "978";
//     const uuidPart = card.id.replace(/-/g, '').substring(0, 8);
//     let numericPart = '';

//     for (let i = 0; i < uuidPart.length; i++) {
//       const charCode = uuidPart.charCodeAt(i);
//       numericPart += (charCode % 10).toString()
//     }

//     const cardIdNumeric = numericPart.padEnd(6, '0').substring(0, 6);
//     const timestamp = Date.now().toString().slice(-4);
//     const base12Digits = prefix + cardIdNumeric + timestamp;
//     const final12Digits = base12Digits.slice(0, 12);
//     const checkDigit = calculateISBN13CheckDigit(final12Digits);

//     return final12Digits + checkDigit;
//   }, []);
//   const handleExport = async () => {
//     try {
//       const dataToExport = selectedItems.length > 0
//         ? filteredCards.filter(card => selectedItems.includes(card.id))
//         : filteredCards;

//       if (dataToExport.length === 0) {
//         PubSub.publish("RECORD_ERROR_TOAST", {
//           title: "Export Error",
//           message: selectedItems.length > 0
//             ? "No selected items to export"
//             : "No data to export",
//         });
//         return;
//       }

//       const exportData = dataToExport.map((card, index) => ({
//         "Card Number": generateCardNumber(card),
//         "User Name": card.user_name || "",
//         "Email": card.user_email || "",
//         "Issue Date": formatDateToDDMMYYYY(card.issue_date),
//         "Expiry Date": formatDateToDDMMYYYY(card.expiry_date),
//         "Status": card.is_active ? "Active" : "Inactive",
//         "Barcode Number": generateISBN13Number(card)
//       }));

//       const columns = [
//         { key: 'Card Number', header: 'Card Number', width: 20 },
//         { key: 'User Name', header: 'User Name', width: 25 },
//         { key: 'Email', header: 'Email', width: 30 },
//         { key: 'Issue Date', header: 'Issue Date', width: 15 },
//         { key: 'Expiry Date', header: 'Expiry Date', width: 15 },
//         { key: 'Status', header: 'Status', width: 12 },
//         { key: 'Barcode Number', header: 'Barcode Number', width: 20 }
//       ];

//       await exportToExcel(exportData, 'library_cards', 'Library Cards', columns);

//       PubSub.publish("RECORD_SAVED_TOAST", {
//         title: "Export Successful",
//         message: `Exported ${dataToExport.length} library card${dataToExport.length > 1 ? 's' : ''}`,
//       });
//     } catch (error) {
//       console.error('Error exporting library cards:', error);
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Export Error",
//         message: "Failed to export library cards",
//       });
//     }
//   };

//   const calculateISBN13CheckDigit = (first12Digits) => {
//     if (first12Digits.length !== 12) {
//       throw new Error("ISBN-13 requires exactly 12 digits for check digit calculation");
//     }

//     let sum = 0;
//     for (let i = 0; i < 12; i++) {
//       const digit = parseInt(first12Digits[i], 10);
//       sum += (i % 2 === 0) ? digit : digit * 3;
//     }

//     const remainder = sum % 10;
//     const checkDigit = remainder === 0 ? 0 : 10 - remainder;
//     return checkDigit.toString();
//   };

//   // Generate card number
//   const generateCardNumber = useCallback((card) => {
//     try {
//       const isbn13Number = generateISBN13Number(card);
//       if (/^\d+$/.test(isbn13Number) && isbn13Number.length === 13) {
//         return isbn13Number;
//       }
//     } catch (error) {
//       console.warn("Error generating ISBN for card number, using fallback");
//     }

//     const uuidPart = card.id.replace(/-/g, '').substring(0, 8).toUpperCase();
//     return `LIB${uuidPart}`;
//   }, [generateISBN13Number]);

//   // Handle barcode preview - UPDATED FUNCTION
//   const handleBarcodePreview = (card) => {
//     console.log("Previewing barcode for:", card);
//     setSelectedCard(card); // Set the entire card object
//     setShowBarcodeModal(true);
//   };

//   // Initialize barcode in modal - NEW FUNCTION
//   const initializeModalBarcode = useCallback(() => {
//     if (selectedCard && showBarcodeModal) {
//       const barcodeId = `barcode-modal-${selectedCard.id}`;

//       setTimeout(() => {
//         try {
//           const barcodeElement = document.getElementById(barcodeId);
//           if (barcodeElement && !barcodeElement.hasAttribute('data-barcode-generated')) {
//             let isbn13Number;

//             try {
//               isbn13Number = generateISBN13Number(selectedCard);
//               if (!/^\d+$/.test(isbn13Number) || isbn13Number.length !== 13) {
//                 throw new Error("Invalid ISBN format");
//               }
//             } catch (error) {
//               console.warn("Using fallback ISBN generation for modal");
//               // Use simple fallback
//               isbn13Number = "978" + (selectedCard.id.replace(/-/g, '').substring(0, 9) + "0000").slice(0, 10);
//               isbn13Number = isbn13Number.padEnd(12, '0');
//               isbn13Number += calculateISBN13CheckDigit(isbn13Number);
//             }

//             JsBarcode(`#${barcodeId}`, isbn13Number, {
//               format: "EAN13",
//               width: 2,
//               height: 80,
//               displayValue: true,
//               font: "Arial",
//               textAlign: "center",
//               textMargin: 2,
//               fontSize: 14,
//               background: "#ffffff",
//               lineColor: "#000000",
//               margin: 10
//             });

//             barcodeElement.setAttribute('data-barcode-generated', 'true');
//           }
//         } catch (error) {
//           console.error("Error generating barcode in modal:", error);
//         }
//       }, 100);
//     }
//   }, [selectedCard, showBarcodeModal, generateISBN13Number]);

//   // Initialize barcode when modal opens
//   useEffect(() => {
//     if (showBarcodeModal && selectedCard) {
//       initializeModalBarcode();
//     }
//   }, [showBarcodeModal, selectedCard, initializeModalBarcode]);

//   // Rest of your existing functions (fetchCards, fetchUsers, handleSave, etc.)
//   useEffect(() => {
//     fetchCards();
//     fetchUsers();
//     fetchLibrarySettings();
//   }, []);

//   const fetchLibrarySettings = async () => {
//     try {
//       const settingsApi = new DataApi("librarysettings");
//       const response = await settingsApi.fetchAll();
//       if (response.data && response.data.duration_days) {
//         setLibrarySettings(response.data);

//         const durationDays = parseInt(response.data.duration_days || 365);
//         const issueDate = new Date();
//         const expiryDate = new Date(issueDate);
//         expiryDate.setDate(expiryDate.getDate() + durationDays);

//         setFormData(prev => ({
//           ...prev,
//           expiry_date: expiryDate.toISOString().split('T')[0]
//         }));
//       }
//     } catch (error) {
//       console.error("Error fetching library settings:", error);
//       setLibrarySettings({ duration_days: 365 });
//     }
//   };

//   const fetchCards = async () => {
//     try {
//       setLoading(true);
//       const cardApi = new DataApi("librarycard");
//       const response = await cardApi.fetchAll();
//       if (response.data) {
//         setCards(response.data);
//       }
//     } catch (error) {
//       console.error("Error fetching library cards:", error);
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Error",
//         message: "Failed to fetch library cards",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };
//   const handleAdd = () => {
//     setEditingCard(null);

//     const durationDays = parseInt(librarySettings.duration_days || 365);
//     const issueDate = new Date();
//     const expiryDate = new Date(issueDate);
//     expiryDate.setDate(expiryDate.getDate() + durationDays);

//     setFormData({
//       user_id: "",
//       issue_date: issueDate.toISOString().split('T')[0],
//       expiry_date: expiryDate.toISOString().split('T')[0],
//       is_active: true,
//     });
//     fetchUsers();
//     setShowModal(true);
//   };

//   const fetchUsers = async () => {
//     try {
//       const userApi = new DataApi("user");
//       const response = await userApi.fetchAll();

//       let usersData = [];

//       if (response.data) {
//         if (Array.isArray(response.data)) {
//           usersData = response.data;
//         }
//         else if (response.data.records && Array.isArray(response.data.records)) {
//           usersData = response.data.records;
//         }
//         else if (response.data.data && Array.isArray(response.data.data)) {
//           usersData = response.data.data;
//         }
//         else if (response.data.success && response.data.records && Array.isArray(response.data.records)) {
//           usersData = response.data.records;
//         }
//       }

//       if (usersData.length > 0) {
//         setUsers(usersData);
//       } else {
//         setUsers([]);
//         console.warn("No users found or invalid response format:", response.data);
//       }
//     } catch (error) {
//       console.error("Error fetching users:", error);
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Error",
//         message: error.response?.data?.message || error.message || "Failed to fetch users. Please refresh the page.",
//       });
//     }
//   };

//   // Table columns - UPDATED BARCODE COLUMN
//   const allColumns = [
//     {
//       field: "card_number",
//       label: "Card Number",
//       sortable: true,
//       render: (value, card) => (
//         <div>
//           <strong style={{ fontFamily: 'monospace', fontSize: '14px' }}>
//             {generateCardNumber(card)}
//           </strong>
//           <div style={{ fontSize: '11px', color: '#666' }}>
//             ISBN-13 Format
//           </div>
//         </div>
//       )
//     },
//     { field: "user_name", label: "User Name", sortable: true },
//     { field: "user_email", label: "Email", sortable: true },
//     {
//       field: "issue_date",
//       label: "Issue Date",
//       sortable: true,
//       render: (value) => formatDateToDDMMYYYY(value)
//     },
//     {
//       field: "expiry_date",
//       label: "Expiry Date",
//       sortable: true,
//       render: (value) => value ? formatDateToDDMMYYYY(value) : '-'
//     },
//     {
//       field: "is_active",
//       label: "Status",
//       sortable: true,
//       render: (value) => (
//         <Badge bg={value ? "success" : "secondary"}>
//           {value ? "Active" : "Inactive"}
//         </Badge>
//       )
//     },
//     {
//       field: "barcode",
//       label: "Barcode",
//       sortable: false,
//       render: (value, card) => (
//         <div className="d-flex align-items-center">
//           <Button
//             variant="outline-primary"
//             size="sm"
//             onClick={() => handleBarcodePreview(card)}
//             title="View Barcode"
//           >
//             <i className="fa-solid fa-eye me-1"></i>
//             View Barcode
//           </Button>
//         </div>
//       )
//     }
//   ];

//   // Filter columns based on visibility
//   const columns = allColumns.filter(col => visibleColumns[col.field] !== false);

//   const actionsRenderer = (card) => (
//     <>
//       <Button
//         variant="link"
//         size="sm"
//         onClick={(e) => {
//           e.stopPropagation();
//           handleEdit(card);
//         }}
//         style={{ padding: "0.25rem 0.5rem" }}
//         title="Edit"
//       >
//         <i className="fas fa-edit text-primary"></i>
//       </Button>
//       <Button
//         variant="link"
//         size="sm"
//         onClick={(e) => {
//           e.stopPropagation();
//           handleDelete(card.id);
//         }}
//         style={{ padding: "0.25rem 0.5rem" }}
//         title="Delete"
//       >
//         <i className="fas fa-trash text-danger"></i>
//       </Button>
//     </>
//   );

//   const handleEdit = (card) => {
//     setEditingCard(card);
//     setFormData({
//       user_id: card.user_id || "",
//       issue_date: card.issue_date ? formatDateToYYYYMMDD(card.issue_date) : new Date().toISOString().split('T')[0],
//       expiry_date: card.expiry_date ? formatDateToYYYYMMDD(card.expiry_date) : "",
//       is_active: card.is_active !== undefined ? card.is_active : true,
//     });
//     setShowModal(true);
//   };

//   const handleDelete = (id) => {
//     setDeleteId(id);
//     setShowDeleteModal(true);
//   };

//   const confirmDelete = async () => {
//     try {
//       setLoading(true);
//       const cardApi = new DataApi("librarycard");
//       const response = await cardApi.delete(deleteId);
//       if (response.data && response.data.success) {
//         PubSub.publish("RECORD_SAVED_TOAST", {
//           title: "Success",
//           message: "Library card deleted successfully",
//         });
//         fetchCards();
//         setShowDeleteModal(false);
//         setDeleteId(null);
//       } else {
//         PubSub.publish("RECORD_ERROR_TOAST", {
//           title: "Error",
//           message: response.data?.errors || "Failed to delete library card",
//         });
//       }
//     } catch (error) {
//       console.error("Error deleting library card:", error);
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Error",
//         message: "Failed to delete library card",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Action buttons for the header
//   const actionButtons = [
//     {
//       variant: "outline-success",
//       size: "sm",
//       icon: "fa-solid fa-download",
//       label: "Export",
//       onClick: () => { handleExport() }, // Add your export function
//     },
//     {
//       variant: "outline-primary",
//       size: "sm",
//       icon: "fa-solid fa-print",
//       label: "Print View",
//       onClick: () => { }, // Add your print function
//       style: { borderColor: "#6f42c1", color: "#6f42c1" },
//     },
//     {
//       size: "sm",
//       icon: "fa-solid fa-plus",
//       label: "Add Card",
//       onClick: () => setShowModal(true),
//       style: {
//         background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
//         border: "none",
//       },
//     },
//   ];

//   const filteredCards = useMemo(() => {
//     const searchLower = searchTerm.toLowerCase();
//     return cards.filter((card) => {
//       const cardNumber = generateCardNumber(card);
//       return (
//         String(cardNumber || "").toLowerCase().includes(searchLower) ||
//         String(card.user_name || "").toLowerCase().includes(searchLower) ||
//         String(card.user_email || "").toLowerCase().includes(searchLower) ||
//         String(card.user_id || "").toLowerCase().includes(searchLower)
//       );
//     });
//   }, [cards, searchTerm, generateCardNumber]);

//   return (
//     <Container fluid>
//       <ScrollToTop />

//       <TableHeader
//         title="Library Cards Management"
//         icon="fa-solid fa-address-card"
//         searchPlaceholder="Search library cards..."
//         searchValue={searchTerm}
//         onSearchChange={setSearchTerm}
//         // actionButtons={actionButtons}
//         actionButtons={[
//           {
//             variant: "outline-success",
//             size: "sm",
//             icon: "fa-solid fa-download",
//             label: "Export",
//             onClick: handleExport,
//           },
//           {
//             variant: "outline-primary",
//             size: "sm",
//             icon: "fa-solid fa-upload",
//             label: "Import",
//             onClick: () => document.getElementById("importFile").click(),
//             style: { borderColor: "#6f42c1", color: "#6f42c1" },
//           },
//           // {
//           //   variant: "outline-primary",
//           //   size: "sm",
//           //   icon: "fa-solid fa-layer-group",
//           //   label: "Bulk Insert",
//           //   onClick: handleBulkInsert,
//           //   style: { borderColor: "#6f42c1", color: "#6f42c1" },
//           // },
//           {
//             size: "sm",
//             icon: "fa-solid fa-plus",
//             label: "Add Book",
//             onClick: handleAdd,
//             style: {
//               background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
//               border: "none",
//             },
//           },
//         ]}
//       />

//       <Row style={{ margin: 0, width: "100%", maxWidth: "100%" }}>
//         <Col style={{ padding: 0, width: "100%", maxWidth: "100%" }}>
//           <Card style={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "4px", overflow: "hidden", width: "100%", maxWidth: "100%" }}>
//             <Card.Body className="p-0" style={{ overflow: "hidden", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
//               {loading ? (
//                 <Loader />
//               ) : (
//                 <ResizableTable
//                   data={filteredCards}
//                   columns={columns}
//                   loading={loading}
//                   currentPage={currentPage}
//                   totalRecords={filteredCards.length}
//                   recordsPerPage={recordsPerPage}
//                   onPageChange={setCurrentPage}
//                   showSerialNumber={true}
//                   showActions={true}
//                   showCheckbox={true}
//                   selectedItems={selectedItems}
//                   onSelectionChange={setSelectedItems}
//                   actionsRenderer={actionsRenderer}
//                   showSearch={false}
//                   emptyMessage="No library cards found"
//                 />
//               )}
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>

//       {/* Add/Edit Modal - Your existing modal */}
//       <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
//         {/* Your existing add/edit modal content */}
//       </Modal>

//       {/* Delete Confirmation Modal */}
//       <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
//         {/* Your existing delete modal content */}
//       </Modal>

//       {/* UPDATED: Barcode Preview Modal */}
//       <Modal show={showBarcodeModal} onHide={() => setShowBarcodeModal(false)} size="lg" centered>
//         <Modal.Header closeButton className=" text-dark">
//           <Modal.Title>
//             <i className="fa-solid fa-barcode me-2"></i>
//             Library Card Details
//           </Modal.Title>
//         </Modal.Header>

//         <Modal.Body className="text-center">
//           {selectedCard && (

//             // <div className="card-content p-4 border">
//             <Row className="align-items-center">
//               {/* User Information */}
//               <Col md={12}>
//                 <Card className="h-100">
//                   <Card.Header className="bg-light fw-bold">
//                     <i className="fa-solid fa-user me-2"></i>
//                     Member Information
//                   </Card.Header>
//                   <Card.Body>
//                     <Row className="mb-2">
//                       <Col lg={6} className="text-start fw-medium">Card Number:</Col>
//                       <Col lg={6} className="text-end text-primary fw-bold">
//                         {generateCardNumber(selectedCard)}
//                       </Col>
//                     </Row>

//                     <Row className="mb-2">
//                       <Col lg={6} className="text-start fw-medium">Member Name:</Col>
//                       <Col lg={6} className="text-end">
//                         {selectedCard.user_name || 'N/A'}
//                       </Col>
//                     </Row>

//                     <Row className="mb-2">
//                       <Col lg={6} className="text-start fw-medium">Email:</Col>
//                       <Col lg={6} className="text-end text-truncate">
//                         {selectedCard.user_email || 'N/A'}
//                       </Col>
//                     </Row>

//                     <Row className="mb-2">
//                       <Col lg={6} className="text-start fw-medium">Issue Date:</Col>
//                       <Col lg={6} className="text-end">
//                         {formatDateToDDMMYYYY(selectedCard.issue_date)}
//                       </Col>
//                     </Row>

//                     <Row className="mb-2">
//                       <Col lg={6} className="text-start fw-medium">Expiry Date:</Col>
//                       <Col lg={6} className={`text-end ${new Date(selectedCard.expiry_date) < new Date() ? 'text-danger fw-bold' : ''}`}>
//                         {selectedCard.expiry_date ? formatDateToDDMMYYYY(selectedCard.expiry_date) : 'N/A'}
//                       </Col>
//                     </Row>

//                     <Row className="mb-2">
//                       <Col lg={6} className="text-start fw-medium">Status:</Col>
//                       <Col lg={6} className="text-end">
//                         <Badge bg={selectedCard.is_active ? "success" : "secondary"}>
//                           {selectedCard.is_active ? "Active" : "Inactive"}
//                         </Badge>
//                       </Col>
//                     </Row>

//                     <Row>    <div className="barcode-container bg-light p-3 rounded border">
//                       <svg
//                         id={`barcode-modal-${selectedCard.id}`}
//                         className="barcode-svg"
//                       ></svg>
//                     </div></Row>
//                   </Card.Body>
//                 </Card>
//               </Col>

//             </Row>


//           )}
//         </Modal.Body>

//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowBarcodeModal(false)}>
//             <i className="fa-solid fa-times me-1"></i>
//             Close
//           </Button>
//           <Button
//             variant="primary"
//             onClick={() => {
//               // Add print functionality here if needed
//               window.print();
//             }}
//           >
//             <i className="fa-solid fa-print me-1"></i>
//             Print Card
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </Container>
//   );
// };

// export default LibraryCard;

// components/librarycards/LibraryCard.js
// LibraryCard.js
// LibraryCard.js


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

  // ✅ YE FUNCTION THEEK SE BANAYEIN
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

  // ✅ DATA MERGE KARTE TIME CUSTOM HANDLERS THEEK SE PASS KAREIN
  const allData = { 
    ...(data || {}), 
    ...props 
  };

  // ✅ FINAL CONFIG BANATE TIME CUSTOM HANDLERS DIRECT PASS KAREIN
  const finalConfig = {
    ...getLibraryCardConfig(allData),
    // ✅ YE LINE ADD KAREIN - customHandlers ko directly pass karein
    customHandlers: {
      ...getLibraryCardConfig(allData).customHandlers,
      handleBarcodePreview: handleModalOpen, // ✅ Ye function directly pass karein
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