// // import React, { useState, useEffect } from "react";
// // import { Container, Row, Col, Card, Button, Form, Modal, InputGroup, Badge } from "react-bootstrap";
// // import { useNavigate } from "react-router-dom";
// // import ResizableTable from "../common/ResizableTable";
// // import ScrollToTop from "../common/ScrollToTop";
// // import Loader from "../common/Loader";
// // import DataApi from "../../api/dataApi";
// // import PubSub from "pubsub-js";
// // import WhatsAppAPI from "../../api/WhatsAppAPI";
// // import { exportToExcel } from "../../utils/excelExport";
// // import Select from "react-select";

// // const LibraryCard = () => {
// //   const navigate = useNavigate();
// //   const [cards, setCards] = useState([]);
// //   const [users, setUsers] = useState([]);
// //   const [cardTypes, setCardTypes] = useState([]);
// //   const [showModal, setShowModal] = useState(false);
// //   const [showDeleteModal, setShowDeleteModal] = useState(false);
// //   const [editingCard, setEditingCard] = useState(null);
// //   const [deleteId, setDeleteId] = useState(null);
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [currentPage, setCurrentPage] = useState(1);
// //   const [loading, setLoading] = useState(false);
// //   const [scanning, setScanning] = useState(false);
// //   const [barcodeInput, setBarcodeInput] = useState("");
// //   const recordsPerPage = 10;

// //   const [formData, setFormData] = useState({
// //     user_id: "",
// //     card_type_id: "",
// //     issue_date: new Date().toISOString().split('T')[0],
// //     expiry_date: "",
// //     is_active: true,
// //   });

// //   useEffect(() => {
// //     fetchCards();
// //     fetchUsers();
// //     // fetchCardTypes();
// //   }, []);

// //   // Reset to first page when search term changes
// //   useEffect(() => {
// //     setCurrentPage(1);
// //   }, [searchTerm]);
// //   const userOptions = users.length
// //     ? users.map((user) => {
// //       const existingCard = cards.find(
// //         (c) =>
// //           c.user_id === user.id ||
// //           c.user_id?.toString() === user.id?.toString()
// //       );
// //       const hasActiveCard = existingCard && existingCard.is_active;

// //       return {
// //         value: user.id,
// //         label: `${user.firstname || ""} ${user.lastname || ""} ${user.email ? `(${user.email})` : ""
// //           } ${hasActiveCard ? " - Has Active Card" : ""}`,
// //       };
// //     })
// //     : [];

// //   const fetchUsers = async () => {
// //     try {
// //       // Use the user API endpoint which returns all users from the user table
// //       const userApi = new DataApi("user");
// //       const response = await userApi.fetchAll();
// //       console.log("Fetched users:", response.data); // Debug log
// //       if (response.data && Array.isArray(response.data) && response.data.length > 0) {
// //         // Show all users from the user table (no filtering)
// //         setUsers(response.data);
// //         console.log("All users set:", response.data.length); // Debug log
// //       } else {
// //         setUsers([]);
// //         console.warn("No users found or invalid response:", response.data);
// //       }
// //     } catch (error) {
// //       console.error("Error fetching users:", error);
// //       PubSub.publish("RECORD_ERROR_TOAST", {
// //         title: "Error",
// //         message: "Failed to fetch users. Please refresh the page.",
// //       });
// //     }
// //   };

// //   // const fetchCardTypes = async () => {
// //   //   try {
// //   //     const cardTypeApi = new DataApi("librarycardtype");
// //   //     const response = await cardTypeApi.fetchAll();
// //   //     if (response.data && Array.isArray(response.data)) {
// //   //       // Filter only active card types
// //   //       const activeCardTypes = response.data.filter(ct => ct.is_active !== false);
// //   //       setCardTypes(activeCardTypes);
// //   //     } else {
// //   //       setCardTypes([]);
// //   //     }
// //   //   } catch (error) {
// //   //     console.error("Error fetching card types:", error);
// //   //     PubSub.publish("RECORD_ERROR_TOAST", {
// //   //       title: "Error",
// //   //       message: "Failed to fetch card types",
// //   //     });
// //   //   }
// //   // };

// //   const fetchCards = async () => {
// //     try {
// //       setLoading(true);
// //       const cardApi = new DataApi("librarycard");
// //       const response = await cardApi.fetchAll();
// //       if (response.data) {
// //         setCards(response.data);
// //         // Refresh users list after fetching cards to ensure dropdown is updated
// //         fetchUsers();
// //       }
// //     } catch (error) {
// //       console.error("Error fetching library cards:", error);
// //       PubSub.publish("RECORD_ERROR_TOAST", {
// //         title: "Error",
// //         message: "Failed to fetch library cards",
// //       });
// //     } finally {
// //       setLoading(false);
// //     }
// //   };


// //   const handleInputChange = (e) => {
// //     const { name, value } = e.target;
// //     setFormData({ ...formData, [name]: value });
// //   };

// //   const handleAdd = () => {
// //     setEditingCard(null);
// //     setFormData({
// //       user_id: "",
// //       card_type_id: "",
// //       issue_date: new Date().toISOString().split('T')[0],
// //       expiry_date: "",
// //       is_active: true,
// //     });
// //     setBarcodeInput("");
// //     // Refresh users list and card types when opening modal
// //     fetchUsers();
// //     // fetchCardTypes();
// //     setShowModal(true);
// //   };

// //   const handleBarcodeScan = () => {
// //     if (scanning) {
// //       setScanning(false);
// //       setBarcodeInput("");
// //     } else {
// //       setScanning(true);
// //       // Focus on barcode input field
// //       setTimeout(() => {
// //         const input = document.getElementById("barcode-input");
// //         if (input) {
// //           input.focus();
// //         }
// //       }, 100);
// //     }
// //   };

// //   const handleBarcodeInputChange = (e) => {
// //     const value = e.target.value;
// //     setBarcodeInput(value);

// //     // Auto-submit when barcode is entered (assuming barcode is user ID or card number)
// //     if (value.length >= 8) {
// //       // Try to find user by ID or search in users list
// //       const foundUser = users.find(u =>
// //         u.id === value ||
// //         (u.firstname && u.lastname && `${u.firstname} ${u.lastname}`.toLowerCase().includes(value.toLowerCase()))
// //       );

// //       if (foundUser) {
// //         setFormData({ ...formData, user_id: foundUser.id });
// //         setBarcodeInput("");
// //         setScanning(false);
// //       }
// //     }
// //   };

// //   const handleBarcodeKeyPress = (e) => {
// //     if (e.key === 'Enter' && barcodeInput.trim()) {
// //       // Try to find user
// //       const foundUser = users.find(u =>
// //         u.id === barcodeInput.trim() ||
// //         u.email === barcodeInput.trim() ||
// //         (u.firstname && u.lastname && `${u.firstname} ${u.lastname}`.toLowerCase() === barcodeInput.trim().toLowerCase())
// //       );

// //       if (foundUser) {
// //         setFormData({ ...formData, user_id: foundUser.id });
// //         setBarcodeInput("");
// //         setScanning(false);
// //         PubSub.publish("RECORD_SAVED_TOAST", {
// //           title: "Success",
// //           message: `User selected: ${foundUser.firstname} ${foundUser.lastname}`,
// //         });
// //       } else {
// //         PubSub.publish("RECORD_ERROR_TOAST", {
// //           title: "Error",
// //           message: "User not found. Please try again.",
// //         });
// //       }
// //     }
// //   };

// //   const handleEdit = (card) => {
// //     setEditingCard(card);
// //     setFormData({
// //       user_id: card.user_id || "",
// //       card_type_id: card.card_type_id || "",
// //       issue_date: card.issue_date ? card.issue_date.split('T')[0] : new Date().toISOString().split('T')[0],
// //       expiry_date: card.expiry_date ? card.expiry_date.split('T')[0] : "",
// //       is_active: card.is_active !== undefined ? card.is_active : true,
// //     });
// //     setShowModal(true);
// //   };

// //   const handleDelete = (id) => {
// //     setDeleteId(id);
// //     setShowDeleteModal(true);
// //   };

// //   const confirmDelete = async () => {
// //     try {
// //       setLoading(true);
// //       const cardApi = new DataApi("librarycard");
// //       const response = await cardApi.delete(deleteId);
// //       if (response.data && response.data.success) {
// //         PubSub.publish("RECORD_SAVED_TOAST", {
// //           title: "Success",
// //           message: "Library card deleted successfully",
// //         });
// //         fetchCards();
// //         setShowDeleteModal(false);
// //         setDeleteId(null);
// //       } else {
// //         PubSub.publish("RECORD_ERROR_TOAST", {
// //           title: "Error",
// //           message: response.data?.errors || "Failed to delete library card",
// //         });
// //       }
// //     } catch (error) {
// //       console.error("Error deleting library card:", error);
// //       PubSub.publish("RECORD_ERROR_TOAST", {
// //         title: "Error",
// //         message: "Failed to delete library card",
// //       });
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleSave = async () => {
// //     if (!formData.user_id || formData.user_id === "") {
// //       PubSub.publish("RECORD_ERROR_TOAST", {
// //         title: "Validation Error",
// //         message: "Please enter a User ID",
// //       });
// //       return;
// //     }

// //     // Check if user already has a card (only for new cards)
// //     if (!editingCard) {
// //       const existingCard = cards.find(c => c.user_id === formData.user_id);
// //       if (existingCard) {
// //         PubSub.publish("RECORD_ERROR_TOAST", {
// //           title: "Validation Error",
// //           message: "User already has a library card",
// //         });
// //         return;
// //       }
// //     }

// //     try {
// //       setLoading(true);
// //       const cardApi = new DataApi("librarycard");

// //       const cardData = {
// //         user_id: formData.user_id,
// //         card_type_id: formData.card_type_id || null,
// //         issue_date: formData.issue_date,
// //         expiry_date: formData.expiry_date || null,
// //         is_active: formData.is_active,
// //       };

// //       let response;
// //       if (editingCard) {
// //         response = await cardApi.update(cardData, editingCard.id);
// //         if (response.data && response.data.success) {
// //           PubSub.publish("RECORD_SAVED_TOAST", {
// //             title: "Success",
// //             message: "Library card updated successfully",
// //           });
// //           fetchCards();
// //           setShowModal(false);
// //           setEditingCard(null);
// //         } else {
// //           const errorMsg = Array.isArray(response.data?.errors)
// //             ? response.data.errors.map((e) => e.msg || e).join(", ")
// //             : response.data?.errors || "Failed to update library card";
// //           PubSub.publish("RECORD_ERROR_TOAST", {
// //             title: "Error",
// //             message: errorMsg,
// //           });
// //         }
// //       } else {
// //         response = await cardApi.create(cardData);
// //         if (response.data && response.data.success) {
// //           PubSub.publish("RECORD_SAVED_TOAST", {
// //             title: "Success",
// //             message: "Library card created successfully",
// //           });
// //           fetchCards();
// //           setShowModal(false);
// //         } else {
// //           const errorMsg = Array.isArray(response.data?.errors)
// //             ? response.data.errors.map((e) => e.msg || e).join(", ")
// //             : response.data?.errors || "Failed to create library card";
// //           PubSub.publish("RECORD_ERROR_TOAST", {
// //             title: "Error",
// //             message: errorMsg,
// //           });
// //         }
// //       }
// //     } catch (error) {
// //       console.error("Error saving library card:", error);
// //       const errorMsg =
// //         error.response?.data?.errors
// //           ? Array.isArray(error.response.data.errors)
// //             ? error.response.data.errors.map((e) => e.msg || e).join(", ")
// //             : error.response.data.errors
// //           : error.message || "Failed to save library card";
// //       PubSub.publish("RECORD_ERROR_TOAST", {
// //         title: "Error",
// //         message: errorMsg,
// //       });
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleExport = async () => {
// //     try {
// //       const exportData = filteredCards.map((card) => ({
// //         "Card Number": card.card_number || "",
// //         "User Name": card.user_name || "",
// //         "Email": card.user_email || "",
// //         "Issue Date": card.issue_date || "",
// //         "Expiry Date": card.expiry_date || "",
// //         "Status": card.is_active ? "Active" : "Inactive",
// //       }));

// //       const columns = [
// //         { key: 'Card Number', header: 'Card Number', width: 20 },
// //         { key: 'User Name', header: 'User Name', width: 25 },
// //         { key: 'Email', header: 'Email', width: 30 },
// //         { key: 'Issue Date', header: 'Issue Date', width: 15 },
// //         { key: 'Expiry Date', header: 'Expiry Date', width: 15 },
// //         { key: 'Status', header: 'Status', width: 12 }
// //       ];

// //       await exportToExcel(exportData, 'library_cards', 'Library Cards', columns);
// //     } catch (error) {
// //       console.error('Error exporting library cards:', error);
// //       PubSub.publish("RECORD_ERROR_TOAST", {
// //         title: "Export Error",
// //         message: "Failed to export library cards",
// //       });
// //     }
// //   };

// //   const filteredCards = cards.filter((card) => {
// //     const searchLower = searchTerm.toLowerCase();
// //     return (
// //       String(card.card_number || "").toLowerCase().includes(searchLower) ||
// //       String(card.user_name || "").toLowerCase().includes(searchLower) ||
// //       String(card.user_email || "").toLowerCase().includes(searchLower) ||
// //       String(card.user_id || "").toLowerCase().includes(searchLower)
// //     );
// //   });

// //   const columns = [
// //     { field: "card_number", label: "Card Number", sortable: true },
// //     { field: "user_name", label: "User Name", sortable: true },
// //     { field: "user_email", label: "Email", sortable: true },
// //     { field: "issue_date", label: "Issue Date", sortable: true },
// //     { field: "expiry_date", label: "Expiry Date", sortable: true },
// //     {
// //       field: "is_active",
// //       label: "Status",
// //       sortable: true,
// //       render: (value) => (
// //         <Badge bg={value ? "success" : "secondary"}>
// //           {value ? "Active" : "Inactive"}
// //         </Badge>
// //       )
// //     },
// //   ];

// //   const headerActions = [
// //     {
// //       label: "Export",
// //       icon: "fas fa-download",
// //       variant: "outline-success",
// //       onClick: handleExport,
// //     },
// //     {
// //       label: "Add",
// //       icon: "fas fa-plus",
// //       variant: "primary",
// //       onClick: handleAdd,
// //     },
// //   ];

// //   const actionsRenderer = (card) => (
// //     <>
// //       <Button
// //         variant="link"
// //         size="sm"
// //         onClick={(e) => {
// //           e.stopPropagation();
// //           handleEdit(card);
// //         }}
// //         style={{ padding: "0.25rem 0.5rem" }}
// //         title="Edit"
// //       >
// //         <i className="fas fa-edit text-primary"></i>
// //       </Button>
// //       <Button
// //         variant="link"
// //         size="sm"
// //         onClick={(e) => {
// //           e.stopPropagation();
// //           handleDelete(card.id);
// //         }}
// //         style={{ padding: "0.25rem 0.5rem" }}
// //         title="Delete"
// //       >
// //         <i className="fas fa-trash text-danger"></i>
// //       </Button>
// //     </>
// //   );

// //   return (
// //     <Container fluid>
// //       <ScrollToTop />
// //       {/* Library Card Management Header - Top Position */}
// //       <Row className="mb-3" style={{ marginTop: "0.5rem" }}>
// //         <Col>
// //           <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.1)" }}>
// //             <Card.Body className="p-3">
// //               <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
// //                 <div className="d-flex align-items-center gap-3">
// //                   <h4 className="mb-0 fw-bold" style={{ color: "#6f42c1" }}>Library Card Management</h4>
// //                   {/* Total Records Pills */}
// //                   <Badge bg="light" text="dark" style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}>
// //                     <i className="fa-solid fa-id-card me-1"></i>
// //                     Total: {filteredCards.length} {filteredCards.length === 1 ? 'Card' : 'Cards'}
// //                   </Badge>
// //                   {searchTerm && (
// //                     <Badge bg="info" style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}>
// //                       <i className="fa-solid fa-filter me-1"></i>
// //                       Filtered: {filteredCards.length}
// //                     </Badge>
// //                   )}
// //                 </div>
// //                 <div className="d-flex gap-2 flex-wrap">
// //                   {/* Compact Search Bar */}
// //                   <InputGroup style={{ width: "250px" }}>
// //                     <InputGroup.Text style={{ background: "#f3e9fc", borderColor: "#e9ecef", padding: "0.375rem 0.75rem" }}>
// //                       <i className="fa-solid fa-search" style={{ color: "#6f42c1", fontSize: "0.875rem" }}></i>
// //                     </InputGroup.Text>
// //                     <Form.Control
// //                       placeholder="Search library cards..."
// //                       value={searchTerm}
// //                       onChange={(e) => setSearchTerm(e.target.value)}
// //                       style={{ borderColor: "#e9ecef", fontSize: "0.875rem", padding: "0.375rem 0.75rem" }}
// //                     />
// //                   </InputGroup>
// //                   <Button
// //                     variant="outline-success"
// //                     size="sm"
// //                     onClick={handleExport}
// //                   >
// //                     <i className="fa-solid fa-download me-1"></i>Export
// //                   </Button>
// //                   <Button
// //                     onClick={handleAdd}
// //                     size="sm"
// //                     style={{
// //                       background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
// //                       border: "none",
// //                     }}
// //                   >
// //                     <i className="fa-solid fa-plus me-1"></i>Add Card
// //                   </Button>
// //                 </div>
// //               </div>
// //             </Card.Body>
// //           </Card>
// //         </Col>
// //       </Row>

// //       <Row style={{ margin: 0, width: "100%", maxWidth: "100%" }}>
// //         <Col style={{ padding: 0, width: "100%", maxWidth: "100%" }}>
// //           <Card style={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "4px", overflow: "hidden", width: "100%", maxWidth: "100%" }}>
// //             <Card.Body className="p-0" style={{ overflow: "hidden", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
// //               {loading ? (
// //                 <Loader />
// //               ) : (
// //                 <ResizableTable
// //                   data={filteredCards}
// //                   columns={columns}
// //                   loading={loading}
// //                   currentPage={currentPage}
// //                   totalRecords={filteredCards.length}
// //                   recordsPerPage={recordsPerPage}
// //                   onPageChange={setCurrentPage}
// //                   showSerialNumber={true}
// //                   showActions={true}
// //                   actionsRenderer={actionsRenderer}
// //                   onRowClick={(card) => navigate(`/librarycard/${card.id}`)}
// //                   showSearch={false}
// //                   emptyMessage="No library cards found"
// //                 />
// //               )}
// //             </Card.Body>
// //           </Card>
// //         </Col>
// //       </Row>

// //       {/* Add/Edit Modal */}
// //       <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
// //         <Modal.Header closeButton>
// //           <Modal.Title>{editingCard ? "Edit Library Card" : "Add Library Card"}</Modal.Title>
// //         </Modal.Header>
// //         <Modal.Body>
// //           <Form>
// //             <Form.Group className="mb-3">
// //               <Form.Label>Select User <span className="text-danger">*</span></Form.Label>
// //               <div className="d-flex gap-2 mb-2">
// //                 <Select
// //                   name="user_id"
// //                   value={userOptions.find((u) => u.value === formData.user_id) || null}
// //                   onChange={handleInputChange}
// //                   options={userOptions}
// //                   isDisabled={!!editingCard}
// //                   isLoading={!users.length}
// //                   placeholder="-- Select User --"
// //                   styles={{
// //                     control: (provided) => ({
// //                       ...provided,
// //                       borderColor: "#8b5cf6",
// //                       borderRadius: "8px",
// //                       padding: "2px",
// //                       fontWeight: "500",
// //                     }),
// //                     option: (provided, state) => ({
// //                       ...provided,
// //                       backgroundColor: state.isFocused ? "#f3e8ff" : "white",
// //                       color: "#333",
// //                     }),
// //                   }}
// //                 />
// //               </div>

// //             </Form.Group>

// //             {/* <Form.Group className="mb-3">
// //               <Form.Label>Card Type</Form.Label>
// //               <Form.Select
// //                 name="card_type_id"
// //                 value={formData.card_type_id}
// //                 onChange={handleInputChange}
// //               >
// //                 <option value="">-- Select Card Type --</option>
// //                 {cardTypes.length > 0 ? (
// //                   cardTypes.map((cardType) => (
// //                     <option key={cardType.id} value={cardType.id}>
// //                       {cardType.name} {cardType.price > 0 ? `(₹${cardType.price})` : ""}
// //                     </option>
// //                   ))
// //                 ) : (
// //                   <option value="" disabled>No card types available</option>
// //                 )}
// //               </Form.Select>
// //               <Form.Text className="text-muted">
// //                 Select the type of library card (e.g., Student, Teacher, Staff)
// //               </Form.Text>
// //             </Form.Group> */}

// //             <Form.Group className="mb-3">
// //               <Form.Label>Issue Date <span className="text-danger">*</span></Form.Label>
// //               <Form.Control
// //                 type="date"
// //                 name="issue_date"
// //                 value={formData.issue_date}
// //                 onChange={handleInputChange}
// //                 required
// //               />
// //             </Form.Group>

// //             <Form.Group className="mb-3">
// //               <Form.Label>Expiry Date</Form.Label>
// //               <Form.Control
// //                 type="date"
// //                 name="expiry_date"
// //                 value={formData.expiry_date}
// //                 onChange={handleInputChange}
// //               />
// //             </Form.Group>

// //             <Form.Group className="mb-3">
// //               <Form.Label>Status <span className="text-danger">*</span></Form.Label>
// //               <Form.Select
// //                 name="is_active"
// //                 value={formData.is_active ? "true" : "false"}
// //                 onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
// //                 required
// //               >
// //                 <option value="true">Active</option>
// //                 <option value="false">Inactive</option>
// //               </Form.Select>
// //             </Form.Group>
// //           </Form>
// //         </Modal.Body>
// //         <Modal.Footer>
// //           <Button variant="secondary" onClick={() => setShowModal(false)}>
// //             Cancel
// //           </Button>
// //           <Button variant="primary" onClick={handleSave} disabled={loading}>
// //             {loading ? "Saving..." : "Save"}
// //           </Button>
// //         </Modal.Footer>
// //       </Modal>

// //       {/* Delete Confirmation Modal */}
// //       <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
// //         <Modal.Header closeButton>
// //           <Modal.Title>Confirm Delete</Modal.Title>
// //         </Modal.Header>
// //         <Modal.Body>Are you sure you want to delete this library card?</Modal.Body>
// //         <Modal.Footer>
// //           <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
// //             Cancel
// //           </Button>
// //           <Button variant="danger" onClick={confirmDelete} disabled={loading}>
// //             {loading ? "Deleting..." : "Delete"}
// //           </Button>
// //         </Modal.Footer>
// //       </Modal>
// //     </Container >
// //   );
// // };

// // export default LibraryCard;




// import React, { useState, useEffect } from "react";
// import { Container, Row, Col, Card, Button, Form, Modal, InputGroup, Badge } from "react-bootstrap";
// import { useNavigate } from "react-router-dom";
// import ResizableTable from "../common/ResizableTable";
// import ScrollToTop from "../common/ScrollToTop";
// import Loader from "../common/Loader";
// import DataApi from "../../api/dataApi";
// import PubSub from "pubsub-js";
// import WhatsAppAPI from "../../api/WhatsAppAPI";
// import { exportToExcel } from "../../utils/excelExport";
// import Select from "react-select";
// import { QRCodeSVG } from "qrcode.react";
// import JsBarcode from "jsbarcode";

// const LibraryCard = () => {
//   const navigate = useNavigate();
//   const [cards, setCards] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [cardTypes, setCardTypes] = useState([]);
//   const [showModal, setShowModal] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [editingCard, setEditingCard] = useState(null);
//   const [deleteId, setDeleteId] = useState(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [scanning, setScanning] = useState(false);
//   const [barcodeInput, setBarcodeInput] = useState("");
//   const [issuedBooks, setIssuedBooks] = useState({}); // Store issued books for each card
//   const [showBarcodeModal, setShowBarcodeModal] = useState(false);
//   const [selectedCard, setSelectedCard] = useState(null);
//   const recordsPerPage = 10;

//   const [formData, setFormData] = useState({
//     user_id: "",
//     card_type_id: "",
//     issue_date: new Date().toISOString().split('T')[0],
//     expiry_date: "",
//     is_active: true,
//   });

//   useEffect(() => {
//     fetchCards();
//     fetchUsers();
//   }, []);

//   // Reset to first page when search term changes
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm]);

//   // Fetch issued books for all cards
//   useEffect(() => {
//     if (cards.length > 0) {
//       fetchIssuedBooksForCards();
//     }
//   }, [cards]);

//   // Initialize barcodes when component mounts or cards change
//   useEffect(() => {
//     if (cards.length > 0) {
//       initializeBarcodes();
//     }
//   }, [cards]);

//   const initializeBarcodes = () => {
//     // Barcodes will be initialized when the modal opens
//   };

//   const fetchIssuedBooksForCards = async () => {
//     try {
//       const bookIssueApi = new DataApi("bookissue");
//       const response = await bookIssueApi.fetchAll();

//       if (response.data && Array.isArray(response.data)) {
//         const booksByCard = {};

//         response.data.forEach(issue => {
//           if (issue.library_card_id && issue.status === "issued") {
//             if (!booksByCard[issue.library_card_id]) {
//               booksByCard[issue.library_card_id] = [];
//             }
//             booksByCard[issue.library_card_id].push(issue);
//           }
//         });

//         setIssuedBooks(booksByCard);
//       }
//     } catch (error) {
//       console.error("Error fetching issued books:", error);
//     }
//   };

//   const userOptions = users.length
//     ? users.map((user) => {
//       const existingCard = cards.find(
//         (c) =>
//           c.user_id === user.id ||
//           c.user_id?.toString() === user.id?.toString()
//       );
//       const hasActiveCard = existingCard && existingCard.is_active;

//       return {
//         value: user.id,
//         label: `${user.firstname || ""} ${user.lastname || ""} ${user.email ? `(${user.email})` : ""
//           } ${hasActiveCard ? " - Has Active Card" : ""}`,
//       };
//     })
//     : [];

//   const fetchUsers = async () => {
//     try {
//       const userApi = new DataApi("user");
//       const response = await userApi.fetchAll();
//       console.log("Fetched users:", response.data);
//       if (response.data && Array.isArray(response.data) && response.data.length > 0) {
//         setUsers(response.data);
//         console.log("All users set:", response.data.length);
//       } else {
//         setUsers([]);
//         console.warn("No users found or invalid response:", response.data);
//       }
//     } catch (error) {
//       console.error("Error fetching users:", error);
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Error",
//         message: "Failed to fetch users. Please refresh the page.",
//       });
//     }
//   };

//   const fetchCards = async () => {
//     try {
//       setLoading(true);
//       const cardApi = new DataApi("librarycard");
//       const response = await cardApi.fetchAll();
//       if (response.data) {
//         setCards(response.data);
//         fetchUsers();
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

//   // Generate barcode data for a library card
//   const generateBarcodeData = (card) => {
//     const cardBooks = issuedBooks[card.id] || [];

//     const barcodeData = {
//       card_id: card.id,
//       card_number: card.card_number,
//       user_name: card.user_name,
//       user_email: card.user_email,
//       issue_date: card.issue_date,
//       expiry_date: card.expiry_date,
//       status: card.is_active ? "Active" : "Inactive",
//       total_books: cardBooks.length,
//       books: cardBooks.map(book => ({
//         title: book.book_title || 'Unknown Book',
//         due_date: book.due_date || 'Not set',
//         issue_date: book.issue_date || 'Not set'
//       }))
//     };

//     return JSON.stringify(barcodeData);
//   };

//   // Generate barcode number (numeric format for traditional barcode)
//   const generateBarcodeNumber = (card) => {
//     // Create a numeric barcode from card ID and timestamp
//     const timestamp = new Date().getTime().toString().slice(-6);
//     const cardId = card.id.toString().padStart(6, '0');
//     return `LC${cardId}${timestamp}`;
//   };

//   // Initialize barcode when modal opens
//   const initializeBarcode = (card) => {
//     setTimeout(() => {
//       const barcodeNumber = generateBarcodeNumber(card);
//       try {
//         JsBarcode("#barcode-svg", barcodeNumber, {
//           format: "CODE128",
//           width: 2,
//           height: 80,
//           displayValue: true,
//           fontOptions: "bold",
//           font: "Arial",
//           textAlign: "center",
//           textMargin: 10,
//           fontSize: 16,
//           background: "#ffffff",
//           lineColor: "#000000",
//           margin: 10
//         });
//       } catch (error) {
//         console.error("Error generating barcode:", error);
//       }
//     }, 100);
//   };

//   // Show barcode modal
//   const showBarcode = (card) => {
//     setSelectedCard(card);
//     setShowBarcodeModal(true);
//   };

//   // Download barcode as PNG
//   const downloadBarcode = (card) => {
//     try {
//       const svgElement = document.getElementById("barcode-svg");
//       if (svgElement) {
//         const svgData = new XMLSerializer().serializeToString(svgElement);
//         const canvas = document.createElement('canvas');
//         const ctx = canvas.getContext('2d');
//         const img = new Image();

//         img.onload = function () {
//           canvas.width = img.width;
//           canvas.height = img.height;
//           ctx.drawImage(img, 0, 0);

//           const pngUrl = canvas.toDataURL("image/png");
//           const downloadLink = document.createElement("a");
//           downloadLink.href = pngUrl;
//           downloadLink.download = `library-card-barcode-${card.card_number || card.id}.png`;
//           document.body.appendChild(downloadLink);
//           downloadLink.click();
//           document.body.removeChild(downloadLink);

//           PubSub.publish("RECORD_SAVED_TOAST", {
//             title: "Success",
//             message: "Barcode downloaded successfully",
//           });
//         };

//         img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
//       }
//     } catch (error) {
//       console.error("Error downloading barcode:", error);
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Error",
//         message: "Failed to download barcode",
//       });
//     }
//   };

//   // Generate QR Code data for a library card
//   const generateQRCodeData = (card) => {
//     const cardBooks = issuedBooks[card.id] || [];
//     const bookDetails = cardBooks.map(book => ({
//       book_title: book.book_title || 'Unknown Book',
//       due_date: book.due_date || 'Not set',
//       issue_date: book.issue_date || 'Not set'
//     }));

//     const cardData = {
//       card_id: card.id,
//       card_number: card.card_number,
//       user_name: card.user_name,
//       user_email: card.user_email,
//       issue_date: card.issue_date,
//       expiry_date: card.expiry_date,
//       status: card.is_active ? "Active" : "Inactive",
//       total_books_issued: cardBooks.length,
//       issued_books: bookDetails
//     };
//     return JSON.stringify(cardData);
//   };

//   // Download QR Code as PNG
//   const downloadQRCodeAsPNG = (card) => {
//     try {
//       const svgElement = document.getElementById(`qrcode-${card.id}`);
//       if (svgElement) {
//         const canvas = document.createElement('canvas');
//         const ctx = canvas.getContext('2d');
//         const svgData = new XMLSerializer().serializeToString(svgElement);
//         const img = new Image();

//         img.onload = function () {
//           canvas.width = img.width;
//           canvas.height = img.height;
//           ctx.drawImage(img, 0, 0);

//           const pngUrl = canvas.toDataURL("image/png");
//           const downloadLink = document.createElement("a");
//           downloadLink.href = pngUrl;
//           downloadLink.download = `library-card-${card.card_number || card.id}.png`;
//           document.body.appendChild(downloadLink);
//           downloadLink.click();
//           document.body.removeChild(downloadLink);
//         };

//         img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
//       }
//     } catch (error) {
//       console.error("Error generating PNG:", error);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
//   };

//   const handleAdd = () => {
//     setEditingCard(null);
//     setFormData({
//       user_id: "",
//       card_type_id: "",
//       issue_date: new Date().toISOString().split('T')[0],
//       expiry_date: "",
//       is_active: true,
//     });
//     setBarcodeInput("");
//     fetchUsers();
//     setShowModal(true);
//   };

//   const handleEdit = (card) => {
//     setEditingCard(card);
//     setFormData({
//       user_id: card.user_id || "",
//       card_type_id: card.card_type_id || "",
//       issue_date: card.issue_date ? card.issue_date.split('T')[0] : new Date().toISOString().split('T')[0],
//       expiry_date: card.expiry_date ? card.expiry_date.split('T')[0] : "",
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

//   const handleSave = async () => {
//     if (!formData.user_id || formData.user_id === "") {
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Validation Error",
//         message: "Please enter a User ID",
//       });
//       return;
//     }

//     if (!editingCard) {
//       const existingCard = cards.find(c => c.user_id === formData.user_id);
//       if (existingCard) {
//         PubSub.publish("RECORD_ERROR_TOAST", {
//           title: "Validation Error",
//           message: "User already has a library card",
//         });
//         return;
//       }
//     }

//     try {
//       setLoading(true);
//       const cardApi = new DataApi("librarycard");

//       const cardData = {
//         user_id: formData.user_id,
//         card_type_id: formData.card_type_id || null,
//         issue_date: formData.issue_date,
//         expiry_date: formData.expiry_date || null,
//         is_active: formData.is_active,
//       };

//       let response;
//       if (editingCard) {
//         response = await cardApi.update(cardData, editingCard.id);
//         if (response.data && response.data.success) {
//           PubSub.publish("RECORD_SAVED_TOAST", {
//             title: "Success",
//             message: "Library card updated successfully",
//           });
//           fetchCards();
//           setShowModal(false);
//           setEditingCard(null);
//         } else {
//           const errorMsg = Array.isArray(response.data?.errors)
//             ? response.data.errors.map((e) => e.msg || e).join(", ")
//             : response.data?.errors || "Failed to update library card";
//           PubSub.publish("RECORD_ERROR_TOAST", {
//             title: "Error",
//             message: errorMsg,
//           });
//         }
//       } else {
//         response = await cardApi.create(cardData);
//         if (response.data && response.data.success) {
//           PubSub.publish("RECORD_SAVED_TOAST", {
//             title: "Success",
//             message: "Library card created successfully",
//           });
//           fetchCards();
//           setShowModal(false);
//         } else {
//           const errorMsg = Array.isArray(response.data?.errors)
//             ? response.data.errors.map((e) => e.msg || e).join(", ")
//             : response.data?.errors || "Failed to create library card";
//           PubSub.publish("RECORD_ERROR_TOAST", {
//             title: "Error",
//             message: errorMsg,
//           });
//         }
//       }
//     } catch (error) {
//       console.error("Error saving library card:", error);
//       const errorMsg =
//         error.response?.data?.errors
//           ? Array.isArray(error.response.data.errors)
//             ? error.response.data.errors.map((e) => e.msg || e).join(", ")
//             : error.response.data.errors
//           : error.message || "Failed to save library card";
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Error",
//         message: errorMsg,
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleExport = async () => {
//     try {
//       const exportData = filteredCards.map((card) => ({
//         "Card Number": card.card_number || "",
//         "User Name": card.user_name || "",
//         "Email": card.user_email || "",
//         "Issue Date": card.issue_date || "",
//         "Expiry Date": card.expiry_date || "",
//         "Status": card.is_active ? "Active" : "Inactive",
//       }));

//       const columns = [
//         { key: 'Card Number', header: 'Card Number', width: 20 },
//         { key: 'User Name', header: 'User Name', width: 25 },
//         { key: 'Email', header: 'Email', width: 30 },
//         { key: 'Issue Date', header: 'Issue Date', width: 15 },
//         { key: 'Expiry Date', header: 'Expiry Date', width: 15 },
//         { key: 'Status', header: 'Status', width: 12 }
//       ];

//       await exportToExcel(exportData, 'library_cards', 'Library Cards', columns);
//     } catch (error) {
//       console.error('Error exporting library cards:', error);
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Export Error",
//         message: "Failed to export library cards",
//       });
//     }
//   };

//   const filteredCards = cards.filter((card) => {
//     const searchLower = searchTerm.toLowerCase();
//     return (
//       String(card.card_number || "").toLowerCase().includes(searchLower) ||
//       String(card.user_name || "").toLowerCase().includes(searchLower) ||
//       String(card.user_email || "").toLowerCase().includes(searchLower) ||
//       String(card.user_id || "").toLowerCase().includes(searchLower)
//     );
//   });

//   const columns = [
//     { field: "card_number", label: "Card Number", sortable: true },
//     { field: "user_name", label: "User Name", sortable: true },
//     { field: "user_email", label: "Email", sortable: true },
//     { field: "issue_date", label: "Issue Date", sortable: true },
//     { field: "expiry_date", label: "Expiry Date", sortable: true },
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
//         <div className="text-center">
//           <Button
//             variant="outline-primary"
//             size="sm"
//             onClick={() => showBarcode(card)}
//             title="View Barcode"
//           >
//             <i className="fa-solid fa-barcode me-1"></i>
//             Barcode
//           </Button>
//           {issuedBooks[card.id] && issuedBooks[card.id].length > 0 && (
//             <Badge bg="info" className="mt-1 d-block">
//               {issuedBooks[card.id].length} book(s)
//             </Badge>
//           )}
//         </div>
//       )
//     },
//   ];

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

//   return (
//     <Container fluid>
//       <ScrollToTop />
//       {/* Library Card Management Header - Top Position */}
//       <Row className="mb-3" style={{ marginTop: "0.5rem" }}>
//         <Col>
//           <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.1)" }}>
//             <Card.Body className="p-3">
//               <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
//                 <div className="d-flex align-items-center gap-3">
//                   <h4 className="mb-0 fw-bold" style={{ color: "#6f42c1" }}>Library Card Management</h4>
//                   {/* Total Records Pills */}
//                   <Badge bg="light" text="dark" style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}>
//                     <i className="fa-solid fa-id-card me-1"></i>
//                     Total: {filteredCards.length} {filteredCards.length === 1 ? 'Card' : 'Cards'}
//                   </Badge>
//                   {searchTerm && (
//                     <Badge bg="info" style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}>
//                       <i className="fa-solid fa-filter me-1"></i>
//                       Filtered: {filteredCards.length}
//                     </Badge>
//                   )}
//                 </div>
//                 <div className="d-flex gap-2 flex-wrap">
//                   {/* Compact Search Bar */}
//                   <InputGroup style={{ width: "250px" }}>
//                     <InputGroup.Text style={{ background: "#f3e9fc", borderColor: "#e9ecef", padding: "0.375rem 0.75rem" }}>
//                       <i className="fa-solid fa-search" style={{ color: "#6f42c1", fontSize: "0.875rem" }}></i>
//                     </InputGroup.Text>
//                     <Form.Control
//                       placeholder="Search library cards..."
//                       value={searchTerm}
//                       onChange={(e) => setSearchTerm(e.target.value)}
//                       style={{ borderColor: "#e9ecef", fontSize: "0.875rem", padding: "0.375rem 0.75rem" }}
//                     />
//                   </InputGroup>
//                   <Button
//                     variant="outline-success"
//                     size="sm"
//                     onClick={handleExport}
//                   >
//                     <i className="fa-solid fa-download me-1"></i>Export
//                   </Button>
//                   <Button
//                     onClick={handleAdd}
//                     size="sm"
//                     style={{
//                       background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
//                       border: "none",
//                     }}
//                   >
//                     <i className="fa-solid fa-plus me-1"></i>Add Card
//                   </Button>
//                 </div>
//               </div>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>

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
//                   actionsRenderer={actionsRenderer}
//                   onRowClick={(card) => navigate(`/librarycard/${card.id}`)}
//                   showSearch={false}
//                   emptyMessage="No library cards found"
//                 />
//               )}
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>

//       {/* Barcode Modal */}
//       <Modal show={showBarcodeModal} onHide={() => setShowBarcodeModal(false)} size="lg" onEntered={() => selectedCard && initializeBarcode(selectedCard)}>
//         <Modal.Header closeButton>
//           <Modal.Title>Library Card Barcode</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           {selectedCard && (
//             <div className="text-center">
//               {/* Card Information */}
//               <div className="mb-4 p-3 border rounded bg-light">
//                 <h5 className="fw-bold">{selectedCard.user_name}</h5>
//                 <p className="mb-1"><strong>Card Number:</strong> {selectedCard.card_number}</p>
//                 <p className="mb-1"><strong>Email:</strong> {selectedCard.user_email}</p>
//                 <p className="mb-1"><strong>Issue Date:</strong> {selectedCard.issue_date}</p>
//                 <p className="mb-1"><strong>Expiry Date:</strong> {selectedCard.expiry_date || 'Not set'}</p>
//                 <p className="mb-0"><strong>Status:</strong>
//                   <Badge bg={selectedCard.is_active ? "success" : "secondary"} className="ms-2">
//                     {selectedCard.is_active ? "Active" : "Inactive"}
//                   </Badge>
//                 </p>
//               </div>

//               {/* Barcode */}
//               <div className="border p-4 bg-white rounded">
//                 <h6 className="mb-3">Library Card Barcode</h6>
//                 <svg id="barcode-svg"></svg>
//                 <p className="text-muted mt-2">Scan this barcode to get card details</p>
//               </div>

//               {/* Issued Books Information */}
//               {issuedBooks[selectedCard.id] && issuedBooks[selectedCard.id].length > 0 && (
//                 <div className="mt-4 p-3 border rounded">
//                   <h6 className="fw-bold mb-3">Issued Books ({issuedBooks[selectedCard.id].length})</h6>
//                   <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
//                     {issuedBooks[selectedCard.id].map((book, index) => (
//                       <div key={index} className="border-bottom pb-2 mb-2">
//                         <p className="mb-1"><strong>Book:</strong> {book.book_title || 'Unknown Book'}</p>
//                         <p className="mb-1"><strong>Issued:</strong> {book.issue_date || 'Not set'}</p>
//                         <p className="mb-0"><strong>Due:</strong> {book.due_date || 'Not set'}</p>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Download Button */}
//               <Button
//                 variant="primary"
//                 className="mt-3"
//                 onClick={() => downloadBarcode(selectedCard)}
//               >
//                 <i className="fa-solid fa-download me-2"></i>
//                 Download Barcode
//               </Button>
//             </div>
//           )}
//         </Modal.Body>
//       </Modal>

//       {/* Add/Edit Modal */}
//       <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
//         <Modal.Header closeButton>
//           <Modal.Title>{editingCard ? "Edit Library Card" : "Add Library Card"}</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <Form>
//             <Form.Group className="mb-3">
//               <Form.Label>Select User <span className="text-danger">*</span></Form.Label>
//               <div className="d-flex gap-2 mb-2">
//                 <Select
//                   name="user_id"
//                   value={userOptions.find((u) => u.value === formData.user_id) || null}
//                   onChange={(selectedOption) => setFormData({ ...formData, user_id: selectedOption ? selectedOption.value : "" })}
//                   options={userOptions}
//                   isDisabled={!!editingCard}
//                   isLoading={!users.length}
//                   placeholder="-- Select User --"
//                   styles={{
//                     control: (provided) => ({
//                       ...provided,
//                       borderColor: "#8b5cf6",
//                       borderRadius: "8px",
//                       padding: "2px",
//                       fontWeight: "500",
//                     }),
//                     option: (provided, state) => ({
//                       ...provided,
//                       backgroundColor: state.isFocused ? "#f3e8ff" : "white",
//                       color: "#333",
//                     }),
//                   }}
//                 />
//               </div>
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Issue Date <span className="text-danger">*</span></Form.Label>
//               <Form.Control
//                 type="date"
//                 name="issue_date"
//                 value={formData.issue_date}
//                 onChange={handleInputChange}
//                 required
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Expiry Date</Form.Label>
//               <Form.Control
//                 type="date"
//                 name="expiry_date"
//                 value={formData.expiry_date}
//                 onChange={handleInputChange}
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Status <span className="text-danger">*</span></Form.Label>
//               <Form.Select
//                 name="is_active"
//                 value={formData.is_active ? "true" : "false"}
//                 onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
//                 required
//               >
//                 <option value="true">Active</option>
//                 <option value="false">Inactive</option>
//               </Form.Select>
//             </Form.Group>
//           </Form>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowModal(false)}>
//             Cancel
//           </Button>
//           <Button variant="primary" onClick={handleSave} disabled={loading}>
//             {loading ? "Saving..." : "Save"}
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       {/* Delete Confirmation Modal */}
//       <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
//         <Modal.Header closeButton>
//           <Modal.Title>Confirm Delete</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>Are you sure you want to delete this library card?</Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
//             Cancel
//           </Button>
//           <Button variant="danger" onClick={confirmDelete} disabled={loading}>
//             {loading ? "Deleting..." : "Delete"}
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </Container>
//   );
// };

// export default LibraryCard;
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Container, Row, Col, Card, Button, Form, Modal, InputGroup, Badge, Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import ResizableTable from "../common/ResizableTable";
import ScrollToTop from "../common/ScrollToTop";
import Loader from "../common/Loader";
import DataApi from "../../api/dataApi";
import PubSub from "pubsub-js";
import { exportToExcel } from "../../utils/excelExport";
import Select from "react-select";
import JsBarcode from "jsbarcode";

const LibraryCard = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [issuedBooks, setIssuedBooks] = useState({});
  const [barcodesGenerated, setBarcodesGenerated] = useState(new Set());
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const recordsPerPage = 10;

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    card_number: true,
    user_name: true,
    user_email: true,
    issue_date: true,
    expiry_date: true,
    is_active: true,
    barcode: true,
  });

  const [formData, setFormData] = useState({
    user_id: "",
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: "",
    is_active: true,
  });

  useEffect(() => {
    fetchCards();
    fetchUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (cards.length > 0) {
      fetchIssuedBooksForCards();
    }
  }, [cards]);

  // Optimized barcode initialization
  useEffect(() => {
    if (cards.length > 0) {
      initializeBarcodes();
    }
  }, [cards]);

  // FIXED: Generate numeric ISBN-13 compatible number - THIS WILL BE OUR CARD NUMBER
  const generateISBN13Number = useCallback((card) => {
    const prefix = "978"; // ISBN prefix

    // Convert UUID to numeric string by taking first 8 characters and converting to numbers
    const uuidPart = card.id.replace(/-/g, '').substring(0, 8);
    let numericPart = '';

    // Convert each character to its numeric representation
    for (let i = 0; i < uuidPart.length; i++) {
      const charCode = uuidPart.charCodeAt(i);
      numericPart += (charCode % 10).toString(); // Get last digit of char code
    }

    // Pad with zeros if needed and take first 6 digits
    const cardIdNumeric = numericPart.padEnd(6, '0').substring(0, 6);

    // Use timestamp for uniqueness
    const timestamp = Date.now().toString().slice(-4);

    // Combine to get 12 digits
    const base12Digits = prefix + cardIdNumeric + timestamp;
    const final12Digits = base12Digits.slice(0, 12);

    // Calculate check digit
    const checkDigit = calculateISBN13CheckDigit(final12Digits);

    return final12Digits + checkDigit;
  }, []);

  // Calculate ISBN-13 check digit
  const calculateISBN13CheckDigit = (first12Digits) => {
    if (first12Digits.length !== 12) {
      throw new Error("ISBN-13 requires exactly 12 digits for check digit calculation");
    }

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(first12Digits[i], 10);
      sum += (i % 2 === 0) ? digit : digit * 3;
    }

    const remainder = sum % 10;
    const checkDigit = remainder === 0 ? 0 : 10 - remainder;
    return checkDigit.toString();
  };

  // Generate human readable card number - NOW USING ISBN AS CARD NUMBER
  const generateCardNumber = useCallback((card) => {
    // Use the ISBN number as card number
    try {
      const isbn13Number = generateISBN13Number(card);
      if (/^\d+$/.test(isbn13Number) && isbn13Number.length === 13) {
        return isbn13Number;
      }
    } catch (error) {
      console.warn("Error generating ISBN for card number, using fallback");
    }

    // Fallback: Use the numeric part of UUID for card number
    const uuidPart = card.id.replace(/-/g, '').substring(0, 8).toUpperCase();
    return `LIB${uuidPart}`;
  }, [generateISBN13Number]);

  // ALTERNATIVE SIMPLE METHOD: Use sequential numbers if available
  const generateSimpleISBN13 = useCallback((card, index) => {
    const prefix = "978";
    // Use index or create a simple numeric ID
    const numericId = (index + 1).toString().padStart(6, '0');
    const base12Digits = prefix + numericId + "0000".slice(0, 4);
    const final12Digits = base12Digits.slice(0, 12);
    const checkDigit = calculateISBN13CheckDigit(final12Digits);
    return final12Digits + checkDigit;
  }, []);

  // Optimized barcode initialization
  const initializeBarcodes = useCallback(() => {
    cards.forEach((card, index) => {
      const barcodeId = `barcode-${card.id}`;

      // Skip if already generated
      if (barcodesGenerated.has(card.id)) return;

      setTimeout(() => {
        try {
          const barcodeElement = document.getElementById(barcodeId);
          if (barcodeElement && !barcodeElement.hasAttribute('data-barcode-generated')) {
            let isbn13Number;

            // Try the main method first, fallback to simple method if it fails
            try {
              isbn13Number = generateISBN13Number(card);
              // Validate that it's a proper numeric string
              if (!/^\d+$/.test(isbn13Number) || isbn13Number.length !== 13) {
                throw new Error("Invalid ISBN format");
              }
            } catch (error) {
              console.warn("Falling back to simple ISBN generation for card:", card.id);
              isbn13Number = generateSimpleISBN13(card, index);
            }

            JsBarcode(`#${barcodeId}`, isbn13Number, {
              format: "EAN13",
              width: 1.5,
              height: 60,
              displayValue: true,
              font: "Arial",
              textAlign: "center",
              textMargin: 2,
              fontSize: 12,
              background: "#ffffff",
              lineColor: "#000000",
              margin: 5
            });

            // Mark as generated
            barcodeElement.setAttribute('data-barcode-generated', 'true');
            setBarcodesGenerated(prev => new Set([...prev, card.id]));
          }
        } catch (error) {
          console.error("Error generating barcode for card:", card.id, error);
        }
      }, 50);
    });
  }, [cards, barcodesGenerated, generateISBN13Number, generateSimpleISBN13]);

  // Enhanced download function with better error handling
  const downloadBarcode = useCallback(async (card, index) => {
    try {
      const barcodeId = `barcode-${card.id}`;
      const svgElement = document.getElementById(barcodeId);

      if (!svgElement) {
        throw new Error("Barcode element not found");
      }

      let isbn13Number;

      // Generate or get the ISBN number
      try {
        isbn13Number = generateISBN13Number(card);
        if (!/^\d+$/.test(isbn13Number) || isbn13Number.length !== 13) {
          throw new Error("Invalid ISBN format");
        }
      } catch (error) {
        console.warn("Using fallback ISBN generation for download");
        isbn13Number = generateSimpleISBN13(card, index);
      }

      // Ensure barcode is generated with valid data
      if (!svgElement.hasAttribute('data-barcode-generated')) {
        JsBarcode(`#${barcodeId}`, isbn13Number, {
          format: "EAN13",
          width: 1.5,
          height: 60,
          displayValue: true
        });
        svgElement.setAttribute('data-barcode-generated', 'true');
      }

      await convertSvgToPngAndDownload(svgElement, card, isbn13Number);

      PubSub.publish("RECORD_SAVED_TOAST", {
        title: "Success",
        message: "Barcode downloaded successfully",
      });

    } catch (error) {
      console.error("Error downloading barcode:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to download barcode: " + error.message,
      });
    }
  }, [generateISBN13Number, generateSimpleISBN13]);

  // Separate PNG conversion function
  const convertSvgToPngAndDownload = (svgElement, card, isbn13Number) => {
    return new Promise((resolve, reject) => {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = function () {
        try {
          canvas.width = img.width;
          canvas.height = img.height + 40;

          // White background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw barcode
          ctx.drawImage(img, 0, 0);

          // Add card details
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';

          const cardNumber = generateCardNumber(card);

          // Card number (ISBN number)
          ctx.fillText(`Library Card: ${cardNumber}`, canvas.width / 2, canvas.height - 25);

          // ISBN number
          ctx.font = '12px Arial';
          ctx.fillText(`ISBN-13: ${isbn13Number}`, canvas.width / 2, canvas.height - 8);

          // Download
          const pngUrl = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.href = pngUrl;
          downloadLink.download = `library-card-${cardNumber}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          resolve();
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error("Failed to load SVG image"));
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    });
  };

  // Bulk download barcodes with better error handling
  const handleBulkDownload = async () => {
    try {
      setLoading(true);
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < filteredCards.length; i++) {
        const card = filteredCards[i];
        try {
          await downloadBarcode(card, i);
          successCount++;

          // Add small delay to avoid overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Failed to download barcode for card ${card.id}:`, error);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        PubSub.publish("RECORD_SAVED_TOAST", {
          title: "Success",
          message: `All ${successCount} barcodes downloaded successfully`,
        });
      } else {
        PubSub.publish("RECORD_WARNING_TOAST", {
          title: "Partial Success",
          message: `${successCount} barcodes downloaded, ${errorCount} failed`,
        });
      }

    } catch (error) {
      console.error("Error in bulk download:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to download barcodes",
      });
    } finally {
      setLoading(false);
    }
  };

  // Rest of your existing functions remain the same...
  const fetchIssuedBooksForCards = async () => {
    try {
      const bookIssueApi = new DataApi("bookissue");
      const response = await bookIssueApi.fetchAll();

      if (response.data && Array.isArray(response.data)) {
        const booksByCard = {};

        response.data.forEach(issue => {
          if (issue.library_card_id && issue.status === "issued") {
            if (!booksByCard[issue.library_card_id]) {
              booksByCard[issue.library_card_id] = [];
            }
            booksByCard[issue.library_card_id].push(issue);
          }
        });

        setIssuedBooks(booksByCard);
      }
    } catch (error) {
      console.error("Error fetching issued books:", error);
    }
  };

  // Memoized user options
  const userOptions = useMemo(() => {
    return users.length
      ? users.map((user) => {
        const existingCard = cards.find(
          (c) =>
            c.user_id === user.id ||
            c.user_id?.toString() === user.id?.toString()
        );
        const hasActiveCard = existingCard && existingCard.is_active;

        return {
          value: user.id,
          label: `${user.firstname || ""} ${user.lastname || ""} ${user.email ? `(${user.email})` : ""
            } ${hasActiveCard ? " - Has Active Card" : ""}`,
        };
      })
      : [];
  }, [users, cards]);

  const fetchUsers = async () => {
    try {
      const userApi = new DataApi("user");
      const response = await userApi.fetchAll();

      // Handle different response formats
      let usersData = [];

      if (response.data) {
        // Check if response.data is an array
        if (Array.isArray(response.data)) {
          usersData = response.data;
        }
        // Check if response.data has a records property
        else if (response.data.records && Array.isArray(response.data.records)) {
          usersData = response.data.records;
        }
        // Check if response.data has a data property
        else if (response.data.data && Array.isArray(response.data.data)) {
          usersData = response.data.data;
        }
        // Check if response.data.success and has records
        else if (response.data.success && response.data.records && Array.isArray(response.data.records)) {
          usersData = response.data.records;
        }
      }

      if (usersData.length > 0) {
        setUsers(usersData);
      } else {
        setUsers([]);
        console.warn("No users found or invalid response format:", response.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: error.response?.data?.message || error.message || "Failed to fetch users. Please refresh the page.",
      });
    }
  };

  const fetchCards = async () => {
    try {
      setLoading(true);
      const cardApi = new DataApi("librarycard");
      const response = await cardApi.fetchAll();
      if (response.data) {
        setCards(response.data);
        fetchUsers();
      }
    } catch (error) {
      console.error("Error fetching library cards:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to fetch library cards",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAdd = () => {
    setEditingCard(null);
    setFormData({
      user_id: "",
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: "",
      is_active: true,
    });
    fetchUsers();
    setShowModal(true);
  };

  const handleEdit = (card) => {
    setEditingCard(card);
    setFormData({
      user_id: card.user_id || "",
      issue_date: card.issue_date ? card.issue_date.split('T')[0] : new Date().toISOString().split('T')[0],
      expiry_date: card.expiry_date ? card.expiry_date.split('T')[0] : "",
      is_active: card.is_active !== undefined ? card.is_active : true,
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      const cardApi = new DataApi("librarycard");
      const response = await cardApi.delete(deleteId);
      if (response.data && response.data.success) {
        PubSub.publish("RECORD_SAVED_TOAST", {
          title: "Success",
          message: "Library card deleted successfully",
        });
        fetchCards();
        setShowDeleteModal(false);
        setDeleteId(null);
      } else {
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Error",
          message: response.data?.errors || "Failed to delete library card",
        });
      }
    } catch (error) {
      console.error("Error deleting library card:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to delete library card",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.user_id || formData.user_id === "") {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Validation Error",
        message: "Please select a user",
      });
      return;
    }

    if (!editingCard) {
      const existingCard = cards.find(c => c.user_id === formData.user_id);
      if (existingCard) {
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Validation Error",
          message: "User already has a library card",
        });
        return;
      }
    }

    try {
      setLoading(true);
      const cardApi = new DataApi("librarycard");

      const cardData = {
        user_id: formData.user_id,
        issue_date: formData.issue_date,
        expiry_date: formData.expiry_date || null,
        is_active: formData.is_active,
      };

      let response;
      if (editingCard) {
        response = await cardApi.update(cardData, editingCard.id);
        if (response.data && response.data.success) {
          PubSub.publish("RECORD_SAVED_TOAST", {
            title: "Success",
            message: "Library card updated successfully",
          });
          fetchCards();
          setShowModal(false);
          setEditingCard(null);
        } else {
          const errorMsg = Array.isArray(response.data?.errors)
            ? response.data.errors.map((e) => e.msg || e).join(", ")
            : response.data?.errors || "Failed to update library card";
          PubSub.publish("RECORD_ERROR_TOAST", {
            title: "Error",
            message: errorMsg,
          });
        }
      } else {
        response = await cardApi.create(cardData);
        if (response.data && response.data.success) {
          PubSub.publish("RECORD_SAVED_TOAST", {
            title: "Success",
            message: "Library card created successfully",
          });
          fetchCards();
          setShowModal(false);
        } else {
          const errorMsg = Array.isArray(response.data?.errors)
            ? response.data.errors.map((e) => e.msg || e).join(", ")
            : response.data?.errors || "Failed to create library card";
          PubSub.publish("RECORD_ERROR_TOAST", {
            title: "Error",
            message: errorMsg,
          });
        }
      }
    } catch (error) {
      console.error("Error saving library card:", error);
      const errorMsg =
        error.response?.data?.errors
          ? Array.isArray(error.response.data.errors)
            ? error.response.data.errors.map((e) => e.msg || e).join(", ")
            : error.response.data.errors
          : error.message || "Failed to save library card";
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      // Export only selected items if any are selected, otherwise export all
      const dataToExport = selectedItems.length > 0
        ? filteredCards.filter(card => selectedItems.includes(card.id))
        : filteredCards;

      if (dataToExport.length === 0) {
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Export Error",
          message: selectedItems.length > 0
            ? "No selected items to export"
            : "No data to export",
        });
        return;
      }

      const exportData = dataToExport.map((card, index) => ({
        "Card Number": generateCardNumber(card), // This will now show ISBN number
        "User Name": card.user_name || "",
        "Email": card.user_email || "",
        "Issue Date": card.issue_date || "",
        "Expiry Date": card.expiry_date || "",
        "Status": card.is_active ? "Active" : "Inactive",
        "Barcode Number": generateISBN13Number(card)
      }));

      const columns = [
        { key: 'Card Number', header: 'Card Number', width: 20 },
        { key: 'User Name', header: 'User Name', width: 25 },
        { key: 'Email', header: 'Email', width: 30 },
        { key: 'Issue Date', header: 'Issue Date', width: 15 },
        { key: 'Expiry Date', header: 'Expiry Date', width: 15 },
        { key: 'Status', header: 'Status', width: 12 },
        { key: 'Barcode Number', header: 'Barcode Number', width: 20 }
      ];

      await exportToExcel(exportData, 'library_cards', 'Library Cards', columns);

      PubSub.publish("RECORD_SAVED_TOAST", {
        title: "Export Successful",
        message: `Exported ${dataToExport.length} library card${dataToExport.length > 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error('Error exporting library cards:', error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Export Error",
        message: "Failed to export library cards",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Please select at least one card to delete",
      });
      return;
    }

    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    try {
      setLoading(true);
      const cardApi = new DataApi("librarycard");
      let successCount = 0;
      let errorCount = 0;

      for (const cardId of selectedItems) {
        try {
          await cardApi.delete(cardId);
          successCount++;
        } catch (error) {
          console.error("Error deleting card:", cardId, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        PubSub.publish("RECORD_SAVED_TOAST", {
          title: "Delete Complete",
          message: `Successfully deleted ${successCount} card(s)${errorCount > 0 ? `. ${errorCount} failed.` : ""}`,
        });
        setSelectedItems([]);
        fetchCards();
      } else {
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Delete Error",
          message: "Failed to delete selected cards",
        });
      }

      setShowBulkDeleteModal(false);
    } catch (error) {
      console.error("Error in bulk delete:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to delete cards",
      });
      setShowBulkDeleteModal(false);
    } finally {
      setLoading(false);
    }
  };

  const filteredCards = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return cards.filter((card) => {
      const cardNumber = generateCardNumber(card);
      return (
        String(cardNumber || "").toLowerCase().includes(searchLower) ||
        String(card.user_name || "").toLowerCase().includes(searchLower) ||
        String(card.user_email || "").toLowerCase().includes(searchLower) ||
        String(card.user_id || "").toLowerCase().includes(searchLower)
      );
    });
  }, [cards, searchTerm, generateCardNumber]);

  // Enhanced barcode column with better UI
  const allColumns = [
    {
      field: "card_number",
      label: "Card Number",
      sortable: true,
      render: (value, card) => (
        <div>
          <strong style={{ fontFamily: 'monospace', fontSize: '14px' }}>
            {generateCardNumber(card)}
          </strong>
          <div style={{ fontSize: '11px', color: '#666' }}>
            ISBN-13 Format
          </div>
        </div>
      )
    },
    { field: "user_name", label: "User Name", sortable: true },
    { field: "user_email", label: "Email", sortable: true },
    { field: "issue_date", label: "Issue Date", sortable: true },
    { field: "expiry_date", label: "Expiry Date", sortable: true },
    {
      field: "is_active",
      label: "Status",
      sortable: true,
      render: (value) => (
        <Badge bg={value ? "success" : "secondary"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      )
    },
    {
      field: "barcode",
      label: "Barcode",
      sortable: false,
      render: (value, card, index) => {
        let isbn13Number;
        try {
          isbn13Number = generateISBN13Number(card);
          if (!/^\d+$/.test(isbn13Number)) {
            isbn13Number = generateSimpleISBN13(card, index);
          }
        } catch (error) {
          isbn13Number = generateSimpleISBN13(card, index);
        }

        const cardNumber = generateCardNumber(card);

        return (
          <div className="text-center">
            <div className="mb-2">
              <Card
                style={{
                  border: '1px solid #e0e0e0',
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  display: 'inline-block',
                  minWidth: '200px'
                }}
              >
                <Card.Body className="p-2">
                  {/* Library Info Header */}
                  <div style={{
                    fontSize: '10px',
                    textAlign: 'center',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    color: '#6f42c1',
                    borderBottom: '1px solid #f0f0f0',
                    paddingBottom: '3px'
                  }}>
                    LIBRARY CARD
                  </div>

                  {/* Barcode */}
                  <svg
                    id={`barcode-${card.id}`}
                    style={{
                      maxWidth: '100%',
                      height: '50px',
                      display: 'block'
                    }}
                  ></svg>

                  {/* ISBN Number */}
                  <div style={{
                    fontSize: '9px',
                    textAlign: 'center',
                    marginTop: '3px',
                    fontWeight: 'bold',
                    color: '#333',
                    fontFamily: 'monospace'
                  }}>
                    {isbn13Number}
                  </div>

                  {/* Card Number */}
                  <div style={{
                    fontSize: '10px',
                    textAlign: 'center',
                    marginTop: '2px',
                    color: '#666'
                  }}>
                    Card: {cardNumber}
                  </div>
                </Card.Body>
              </Card>
            </div>

            {/* Download Button */}
            <Button
              variant="outline-primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                downloadBarcode(card, index);
              }}
              title="Download Barcode"
              style={{ fontSize: '12px', padding: '2px 8px' }}
            >
              <i className="fa-solid fa-download me-1"></i>
              Download
            </Button>
          </div>
        );
      }
    },
  ];

  // Filter columns based on visibility
  const columns = allColumns.filter(col => visibleColumns[col.field] !== false);

  // Toggle column visibility
  const toggleColumnVisibility = (field) => {
    setVisibleColumns(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const actionsRenderer = (card) => (
    <>
      <Button
        variant="link"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(card);
        }}
        style={{ padding: "0.25rem 0.5rem" }}
        title="Edit"
      >
        <i className="fas fa-edit text-primary"></i>
      </Button>
      <Button
        variant="link"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(card.id);
        }}
        style={{ padding: "0.25rem 0.5rem" }}
        title="Delete"
      >
        <i className="fas fa-trash text-danger"></i>
      </Button>
    </>
  );

  return (
    <Container fluid>
      <ScrollToTop />
      {/* Library Card Management Header - Top Position */}
      <Row className="mb-3" style={{ marginTop: "0.5rem" }}>
        <Col>
          <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.1)" }}>
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div className="d-flex align-items-center gap-3">
                  <h4 className="mb-0 fw-bold" style={{ color: "#6f42c1" }}>Library Card Management</h4>
                  {/* Total Records Pills */}
                  <Badge bg="light" text="dark" style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}>
                    <i className="fa-solid fa-id-card me-1"></i>
                    Total: {filteredCards.length} {filteredCards.length === 1 ? 'Card' : 'Cards'}
                  </Badge>
                  {searchTerm && (
                    <Badge bg="info" style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}>
                      <i className="fa-solid fa-filter me-1"></i>
                      Filtered: {filteredCards.length}
                    </Badge>
                  )}
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  {/* Compact Search Bar */}
                  <InputGroup style={{ width: "250px" }}>
                    <InputGroup.Text style={{ background: "#f3e9fc", borderColor: "#e9ecef", padding: "0.375rem 0.75rem" }}>
                      <i className="fa-solid fa-search" style={{ color: "#6f42c1", fontSize: "0.875rem" }}></i>
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Search library cards..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ borderColor: "#e9ecef", fontSize: "0.875rem", padding: "0.375rem 0.75rem" }}
                    />
                  </InputGroup>

                  {/* Bulk Download Button */}
                  {filteredCards.length > 0 && (
                    <Button
                      variant="outline-info"
                      size="sm"
                      onClick={handleBulkDownload}
                      disabled={loading}
                    >
                      <i className="fa-solid fa-download me-1"></i>
                      Bulk Download
                    </Button>
                  )}

                  {/* Column Visibility Dropdown */}
                  <Dropdown>
                    <Dropdown.Toggle
                      variant="outline-secondary"
                      size="sm"
                      style={{
                        borderColor: "#6c757d",
                        color: "#6c757d",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <i className="fa-solid fa-gear"></i>
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end" style={{ minWidth: "200px", maxHeight: "400px", overflowY: "auto" }}>
                      <Dropdown.Header>Show/Hide Columns</Dropdown.Header>
                      <Dropdown.Divider />
                      {allColumns.map((col) => (
                        <Dropdown.Item
                          key={col.field}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleColumnVisibility(col.field);
                          }}
                          style={{ padding: "8px 16px" }}
                        >
                          <div className="d-flex align-items-center">
                            <input
                              type="checkbox"
                              checked={visibleColumns[col.field] !== false}
                              onChange={() => toggleColumnVisibility(col.field)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ marginRight: "8px", cursor: "pointer" }}
                            />
                            <span>{col.label}</span>
                          </div>
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                  {selectedItems.length > 0 && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={loading}
                    >
                      <i className="fa-solid fa-trash me-1"></i>
                      Delete ({selectedItems.length})
                    </Button>
                  )}
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={handleExport}
                  >
                    <i className="fa-solid fa-file-excel me-1"></i>Export
                  </Button>
                  <Button
                    onClick={handleAdd}
                    size="sm"
                    style={{
                      background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                      border: "none",
                    }}
                  >
                    <i className="fa-solid fa-plus me-1"></i>Add Card
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Rest of your JSX remains the same */}
      <Row style={{ margin: 0, width: "100%", maxWidth: "100%" }}>
        <Col style={{ padding: 0, width: "100%", maxWidth: "100%" }}>
          <Card style={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "4px", overflow: "hidden", width: "100%", maxWidth: "100%" }}>
            <Card.Body className="p-0" style={{ overflow: "hidden", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
              {loading ? (
                <Loader />
              ) : (
                <ResizableTable
                  data={filteredCards}
                  columns={columns}
                  loading={loading}
                  currentPage={currentPage}
                  totalRecords={filteredCards.length}
                  recordsPerPage={recordsPerPage}
                  onPageChange={setCurrentPage}
                  showSerialNumber={true}
                  showActions={true}
                  showCheckbox={true}
                  selectedItems={selectedItems}
                  onSelectionChange={setSelectedItems}
                  actionsRenderer={actionsRenderer}
                  showSearch={false}
                  emptyMessage="No library cards found"
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add/Edit Modal - Same as before */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingCard ? "Edit Library Card" : "Add Library Card"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select User <span className="text-danger">*</span></Form.Label>
              <div className="d-flex gap-2 mb-2">
                <Select
                  name="user_id"
                  value={userOptions.find((u) => u.value === formData.user_id) || null}
                  onChange={(selectedOption) => setFormData({ ...formData, user_id: selectedOption ? selectedOption.value : "" })}
                  options={userOptions}
                  isDisabled={!!editingCard}
                  isLoading={!users.length}
                  placeholder="-- Select User --"
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      borderColor: "#8b5cf6",
                      borderRadius: "8px",
                      padding: "2px",
                      fontWeight: "500",
                      width: "100%",
                    }),
                    container: (provided) => ({
                      ...provided,
                      width: "100%",
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      backgroundColor: state.isFocused ? "#f3e8ff" : "white",
                      color: "#333",
                    }),
                  }}
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Issue Date <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="date"
                name="issue_date"
                value={formData.issue_date}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Expiry Date</Form.Label>
              <Form.Control
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="is_active"
                value={formData.is_active ? "true" : "false"}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
                required
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this library card?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal show={showBulkDeleteModal} onHide={() => setShowBulkDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Bulk Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete {selectedItems.length} selected library card(s)? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmBulkDelete} disabled={loading}>
            {loading ? "Deleting..." : `Delete ${selectedItems.length} Card(s)`}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default LibraryCard;