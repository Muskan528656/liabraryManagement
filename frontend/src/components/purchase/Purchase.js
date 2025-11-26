// import React, { useState, useEffect } from "react";
// import { Container, Row, Col, Card, Button, Form, Modal, InputGroup, Badge, Table, Alert, Tab, Tabs } from "react-bootstrap";
// import { useNavigate, useLocation } from "react-router-dom";
// import ResizableTable from "../common/ResizableTable";
// import ScrollToTop from "../common/ScrollToTop";
// import Loader from "../common/Loader";
// import TableHeader from "../common/TableHeader";

// import DataApi from "../../api/dataApi";
// import PubSub from "pubsub-js";
// import { exportToExcel } from "../../utils/excelExport";

// import ConfirmationModal from "../common/ConfirmationModal";

// const Purchase = () => {
//   const navigate = useNavigate();

//   const [purchases, setPurchases] = useState([]);
//   const [showConfirmModal, setShowConfirmModal] = useState(false);
//   const [vendors, setVendors] = useState([]);
//   const [books, setBooks] = useState([]);

//   const [deleteId, setDeleteId] = useState(null);


//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [selectedItems, setSelectedItems] = useState([]);
//   const [authors, setAuthors] = useState([]);
//   const [categories, setCategories] = useState([]);

//   const recordsPerPage = 10;

//   const [visibleColumns, setVisibleColumns] = useState({
//     vendor_name: true,
//     purchase_serial_no: true,
//     book_title: false,
//     book_isbn: false,
//     quantity: false,
//     unit_price: true,
//     total_amount: true,
//     purchase_date: true,
//     notes: true,
//   });

//   useEffect(() => {
//     fetchPurchases();
//     fetchVendors();
//     fetchBooks();
//     fetchAuthors();
//     fetchCategories();
//   }, []);

//   useEffect(() => {
//     setCurrentPage(1);
//     setSelectedItems([]);
//   }, [searchTerm]);

//   useEffect(() => {
//     const validIds = purchases.map(p => p.id);
//     setSelectedItems(prev => prev.filter(id => validIds.includes(id)));
//   }, [purchases]);

//   const fetchPurchases = async () => {
//     try {
//       setLoading(true);
//       const purchaseApi = new DataApi("purchase");
//       const response = await purchaseApi.fetchAll();
//       console.log("Purchases:", response.data);
//       if (response.data) {
//         setPurchases(response.data);
//       }
//     } catch (error) {
//       console.error("Error fetching purchases:", error);
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Error",
//         message: "Failed to fetch purchases",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchVendors = async () => {
//     try {
//       const vendorApi = new DataApi("vendor");
//       const response = await vendorApi.fetchAll();
//       if (response.data) {
//         setVendors(response.data);
//       }
//     } catch (error) {
//       console.error("Error fetching vendors:", error);
//     }
//   };

//   const fetchBooks = async () => {
//     try {
//       const bookApi = new DataApi("book");
//       const response = await bookApi.fetchAll();
//       console.log("Books:", response.data);
//       if (response.data) {
//         setBooks(response.data);
//       }
//     } catch (error) {
//       console.error("Error fetching books:", error);
//     }
//   };

//   const fetchAuthors = async () => {
//     try {
//       const authorApi = new DataApi("author");
//       const response = await authorApi.fetchAll();
//       if (response.data && Array.isArray(response.data)) {
//         setAuthors(response.data);
//       }
//     } catch (error) {
//       console.error("Error fetching authors:", error);
//       setAuthors([]);
//     }
//   };

//   const fetchCategories = async () => {
//     try {
//       const categoryApi = new DataApi("category");
//       const response = await categoryApi.fetchAll();
//       if (response.data && Array.isArray(response.data)) {
//         setCategories(response.data);
//       }
//     } catch (error) {
//       console.error("Error fetching categories:", error);
//       setCategories([]);
//     }
//   };




//   const confirmDelete = async () => {
//     try {
//       const api = new DataApi("purchase");
//       await api.delete(deleteId);
//       PubSub.publish("RECORD_SUCCESS_TOAST", {
//         title: "Success",
//         message: "Purchase deleted successfully",
//       });
//       setShowConfirmModal(false);
//       setDeleteId(null);
//       fetchPurchases();
//     } catch (error) {
//       console.error("Error deleting purchase:", error);
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Error",
//         message: "Failed to delete purchase",
//       });
//     };
//   }



//   const handleBulkInsert = () => {
//     navigate('/purchase/bulk');

//   };


//   const handleExport = () => {
//     const dataToExport = selectedItems.length > 0
//       ? filteredPurchases.filter(p => selectedItems.includes(p.id))
//       : filteredPurchases;

//     if (dataToExport.length === 0) {
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Export Error",
//         message: selectedItems.length > 0
//           ? "No selected items to export"
//           : "No data to export",
//       });
//       return;
//     }

//     const exportData = dataToExport.map((p) => ({
//       "Vendor": p.vendor_name || "N/A",
//       "Book": p.book_title || "N/A",
//       "ISBN": p.book_isbn || "N/A",
//       "Quantity": p.quantity,
//       "Unit Price": p.unit_price,
//       "Total Amount": p.total_amount,
//       "Purchase Date": p.purchase_date,
//       "Notes": p.notes || "",
//     }));
//     exportToExcel(exportData, "Purchases");

//     PubSub.publish("RECORD_SAVED_TOAST", {
//       title: "Success",
//       message: `Exported ${dataToExport.length} purchase${dataToExport.length > 1 ? 's' : ''}`,
//     });
//   };


//   const filteredPurchases = purchases.filter((purchase) => {
//     const searchLower = searchTerm.toLowerCase();
//     return (
//       (purchase.vendor_name && purchase.vendor_name.toLowerCase().includes(searchLower)) ||
//       (purchase.book_title && purchase.book_title.toLowerCase().includes(searchLower)) ||
//       (purchase.book_isbn && purchase.book_isbn.toLowerCase().includes(searchLower))
//     );
//   });

//   const allColumns = [
//     {
//       field: "purchase_serial_no", label: "Purchase Seriol No", sortable: true,
//       render: (value, record) => (
//         <a
//           href={`/purchase/${record.id}`}
//           onClick={(e) => {
//             e.preventDefault();
//             navigate(`/purchase/${record.id}`);
//           }}
//           style={{ color: "#6f42c1", textDecoration: "none", fontWeight: "500" }}
//           onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
//           onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
//         >
//           {value || "N/A"}
//         </a>
//       ),
//     },
//     {
//       field: "vendor_name",
//       label: "Vendor",
//       sortable: true,
//       render: (value, record) => (
//         <a
//           href={`/vendor/${record.vendor_id}`}
//           onClick={(e) => {
//             e.preventDefault();
//             navigate(`/vendor/${record.vendor_id}`);
//           }}
//           style={{ color: "#6f42c1", textDecoration: "none", fontWeight: "500" }}
//           onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
//           onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
//         >
//           {value || "N/A"}
//         </a>
//       ),
//     },
//     {
//       field: "book_title",
//       label: "Book",
//       sortable: true,
//       render: (value, record) => (
//         <a
//           href={`/book/${record.book_id}`}
//           onClick={(e) => {
//             e.preventDefault();
//             navigate(`/book/${record.book_id}`);
//           }}
//           style={{ color: "#6f42c1", textDecoration: "none", fontWeight: "500" }}
//           onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
//           onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
//         >
//           {value || "N/A"}
//         </a>
//       ),
//     },
//     { field: "book_isbn", label: "ISBN" },

//     {
//       field: "quantity",
//       label: "Quantity",
//       sortable: true,
//       render: (value, record) => record.quantity || 0
//     },
//     {
//       field: "unit_price",
//       label: "Unit Price",
//       sortable: true,
//       render: (value, record) => `₹${parseFloat(record.unit_price || 0).toFixed(2)}`
//     },
//     {
//       field: "total_amount",
//       label: "Total Amount",
//       sortable: true,
//       render: (value, record) => `₹${parseFloat(record.total_amount || 0).toFixed(2)}`
//     },
//     {
//       field: "purchase_date",
//       label: "Purchase Date",
//       sortable: true,
//       render: (value) => value ? new Date(value).toLocaleDateString() : "-"
//     },
//     {
//       field: "notes",
//       label: "Notes",
//       render: (value, record) => record.notes || "-"
//     },
//   ];

//   const columns = allColumns.filter(col => visibleColumns[col.field] !== false);

//   const toggleColumnVisibility = (field) => {
//     setVisibleColumns(prev => ({
//       ...prev,
//       [field]: !prev[field]
//     }));
//   };

//   const handleNameClick = (e, record, navigate, isRightClick = false, isEdit) => {
//     e.preventDefault();
//     e.stopPropagation();

//     const purchaseId = record.id;

//     if (isRightClick) {
//       window.open(`/purchase/${purchaseId}`, "_blank");
//     } else {
//       if (isEdit) {
//         navigate(`/purchase/${purchaseId}`, { state: { isEdit: true, rowData: record }, });
//       } else {
//         navigate(`/purchase/${purchaseId}`, { state: record });
//       }
//     }
//   };

//   const actionsRenderer = (purchase) => (
//     <>
//       <button

//         onClick={(e) => {
//           handleNameClick(e, purchase, navigate, false, true);
//         }}
//         className="custom-btn-edit"
//       >
//         <i className="fs-5 fa-solid fa-pen-to-square"></i>
//       </button>
//       <button

//         onClick={(e) => {
//           e.stopPropagation();
//           setDeleteId(purchase.id);
//           setShowConfirmModal(true);
//         }}
//         className="custom-btn-delete"
//       >
//         <i className="fs-5 fa-solid fa-trash"></i>
//       </button>
//     </>
//   );

//   return (
//     <Container fluid className="py-4">
//       <ScrollToTop />
//       <Row className="justify-content-center">
//         <Col lg={12} xl={12}>
//           <Card style={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "4px", overflow: "hidden" }}>
//             <Card.Body className="">
//               {loading ? (
//                 <Loader />
//               ) : (
//                 <>
//                   <TableHeader
//                     title="Purchase Management"
//                     icon="fa-solid fa-shopping-cart"
//                     totalCount={filteredPurchases.length}
//                     totalLabel={filteredPurchases.length === 1 ? "Purchase" : "Purchases"}
//                     searchPlaceholder="Search purchases..."
//                     searchValue={searchTerm}
//                     onSearchChange={setSearchTerm}
//                     showColumnVisibility={true}
//                     allColumns={allColumns}
//                     visibleColumns={visibleColumns}
//                     onToggleColumnVisibility={toggleColumnVisibility}
//                     actionButtons={[
//                       {
//                         variant: "outline-success",
//                         size: "sm",
//                         icon: "fa-solid fa-download",
//                         label: "Export",
//                         onClick: handleExport,
//                       },
//                       {
//                         size: "sm",
//                         icon: "fa-solid fa-layer-group",
//                         label: "Add Purchase",
//                         onClick: handleBulkInsert,

//                       },
//                     ]}
//                   />

//                   <ResizableTable
//                     data={filteredPurchases}
//                     columns={columns}
//                     searchTerm={searchTerm}
//                     onSearchChange={setSearchTerm}
//                     currentPage={currentPage}
//                     totalRecords={filteredPurchases.length}
//                     recordsPerPage={recordsPerPage}
//                     onPageChange={setCurrentPage}
//                     headerActions={[]}
//                     actionsRenderer={actionsRenderer}
//                     loading={loading}
//                     showSerialNumber={true}
//                     showActions={true}
//                     showCheckbox={true}
//                     selectedItems={selectedItems}
//                     onSelectionChange={setSelectedItems}
//                     showSearch={false}
//                     emptyMessage="No purchases found"
//                   />
//                 </>
//               )}
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>


//       <ConfirmationModal
//         show={showConfirmModal}
//         onHide={() => setShowConfirmModal(false)}
//         onConfirm={confirmDelete}
//         title={`Delete Purchase `}
//         message={`Are you sure you want to delete this Purchase?`}
//         confirmText="Delete"
//         cancelText="Cancel"
//       />


//     </Container >
//   );
// };

// export default Purchase;


// Purchase.js
import React from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getPurchaseConfig } from "./PurchaseConfig";
import { useDataManager } from "../common/userdatamanager";

const Purchase = (props) => {
  const baseConfig = getPurchaseConfig();

  const { data, loading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );

  if (loading) {
    return <div>Loading purchase data...</div>;
  }

  const finalConfig = getPurchaseConfig(data, props);
  console.log("Final Purchase Config:", finalConfig);

  return <DynamicCRUD {...finalConfig} icon="fa-solid fa-shopping-cart" />;
};

export default Purchase;