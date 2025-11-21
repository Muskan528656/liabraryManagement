// import React, { useState, useEffect } from "react";
// import { Container, Row, Col, Card, Button, Form, Modal, InputGroup, Badge, Dropdown } from "react-bootstrap";
// import * as XLSX from "xlsx";
// import { useNavigate, useLocation } from "react-router-dom";
// import ResizableTable from "../common/ResizableTable";
// import ScrollToTop from "../common/ScrollToTop";
// import Loader from "../common/Loader";
// import TableHeader from "../common/TableHeader";
// import FormModal from "../common/FormModal";
// import DataApi from "../../api/dataApi";
// import PubSub from "pubsub-js";
// import { exportToExcel } from "../../utils/excelExport";
// // import * as constants from "../../constants/constants";

// const Category = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [categories, setCategories] = useState([]);
//   const [showModal, setShowModal] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
//   const [editingCategory, setEditingCategory] = useState(null);
//   const [deleteId, setDeleteId] = useState(null);
//   const [selectedItems, setSelectedItems] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const recordsPerPage = 10;
//   const [formData, setFormData] = useState({
//     name: "",
//     description: "",
//   });
//   const [rolePermissions, setRolePermissions] = useState({});

//   // Column visibility state
//   const [visibleColumns, setVisibleColumns] = useState({
//     name: true,
//     description: true,
//   });

//   // Fetch role permissions from token on mount
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       try {
//         const payload = JSON.parse(atob(token.split(".")[1]));
//         setRolePermissions(payload.rolePermissions || {});
//       } catch (error) {
//         console.error("Error decoding token:", error);
//       }
//     }
//   }, []);

//   // Fetch categories from API on mount
//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   // Reset to first page when search term changes
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm]);

//   // Check for edit query parameter and open edit modal
//   useEffect(() => {
//     const params = new URLSearchParams(location.search);
//     const editId = params.get("edit");
//     if (editId && categories.length > 0 && !editingCategory) {
//       const categoryToEdit = categories.find((c) => c.id === editId);
//       if (categoryToEdit) {
//         setEditingCategory(categoryToEdit);
//         setFormData({
//           name: categoryToEdit.name || "",
//           description: categoryToEdit.description || "",
//         });
//         setShowModal(true);
//         // Remove edit parameter from URL
//         params.delete("edit");
//         navigate(`/category?${params.toString()}`, { replace: true });
//       }
//     }
//   }, [location.search, categories]);

//   // Fetch categories from API
//   const fetchCategories = async () => {
//     try {
//       setLoading(true);
//       const categoryApi = new DataApi("category");
//       const response = await categoryApi.fetchAll();
//       if (response.data && Array.isArray(response.data)) {
//         setCategories(response.data);
//       }
//     } catch (error) {
//       console.error("Error fetching categories:", error);
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Error",
//         message: "Failed to fetch categories",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleAdd = () => {
//     setEditingCategory(null);
//     setFormData({ name: "", description: "" });
//     setShowModal(true);
//   };

//   const handleEdit = (category) => {
//     setEditingCategory(category);
//     setFormData({
//       name: category.name || "",
//       description: category.description || "",
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
//       const categoryApi = new DataApi("category");
//       const response = await categoryApi.delete(deleteId);
//       if (response.data && response.data.success) {
//         PubSub.publish("RECORD_SAVED_TOAST", {
//           title: "Success",
//           message: "Category deleted successfully",
//         });
//         fetchCategories(); // Refresh the list
//         setShowDeleteModal(false);
//         setDeleteId(null);
//       } else {
//         PubSub.publish("RECORD_ERROR_TOAST", {
//           title: "Error",
//           message: response.data?.errors || "Failed to delete category",
//         });
//       }
//     } catch (error) {
//       console.error("Error deleting category:", error);
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Error",
//         message: error.response?.data?.errors || "Failed to delete category",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const checkDuplicateCategory = (name, excludeId = null) => {
//     return categories.some(
//       (category) =>
//         category.name &&
//         category.name.toLowerCase().trim() === name.toLowerCase().trim() &&
//         category.id !== excludeId
//     );
//   };

//   const handleSave = async () => {
//     // Validation
//     if (!formData.name || formData.name.trim() === "") {
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Validation Error",
//         message: "Name is required",
//       });
//       return;
//     }

//     // Check for duplicate name
//     if (checkDuplicateCategory(formData.name.trim(), editingCategory?.id)) {
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Duplicate Error",
//         message: "Category with this name already exists",
//       });
//       return;
//     }

//     try {
//       setLoading(true);
//       const categoryApi = new DataApi("category");
//       let response;

//       console.log("Saving category data:", formData);
//       console.log("Editing category:", editingCategory);

//       if (editingCategory) {
//         // Update existing category
//         console.log("Updating category with ID:", editingCategory.id);
//         response = await categoryApi.update(formData, editingCategory.id);
//         console.log("Update response:", response);
//       } else {
//         // Create new category
//         console.log("Creating new category");
//         response = await categoryApi.create(formData);
//         console.log("Create response:", response);
//       }

//       if (response && response.data) {
//         if (response.data.success) {
//           PubSub.publish("RECORD_SAVED_TOAST", {
//             title: "Success",
//             message: editingCategory ? "Category updated successfully" : "Category created successfully",
//           });
//           fetchCategories(); // Refresh the list
//           setShowModal(false);
//           setFormData({ name: "", description: "" });
//           setEditingCategory(null);
//         } else {
//           const errorMessage = response.data?.errors
//             ? (Array.isArray(response.data.errors)
//               ? response.data.errors.map(e => e.msg || e).join(", ")
//               : response.data.errors)
//             : "Failed to save category";
//           console.error("Save failed:", errorMessage);
//           PubSub.publish("RECORD_ERROR_TOAST", {
//             title: "Error",
//             message: errorMessage,
//           });
//         }
//       } else {
//         console.error("Invalid response:", response);
//         PubSub.publish("RECORD_ERROR_TOAST", {
//           title: "Error",
//           message: "Invalid response from server",
//         });
//       }
//     } catch (error) {
//       console.error("Error saving category:", error);
//       console.error("Error response:", error.response);
//       const errorMessage = error.response?.data?.errors
//         ? (Array.isArray(error.response.data.errors)
//           ? error.response.data.errors.map(e => e.msg || e).join(", ")
//           : error.response.data.errors)
//         : (error.response?.data?.message || error.message || "Failed to save category");
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Error",
//         message: errorMessage,
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleImport = async (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setLoading(true);
//       const reader = new FileReader();
//       reader.onload = async (event) => {
//         try {
//           const data = new Uint8Array(event.target.result);
//           const workbook = XLSX.read(data, { type: "array" });
//           const sheet = workbook.Sheets[workbook.SheetNames[0]];
//           const jsonData = XLSX.utils.sheet_to_json(sheet);
//           const importedCategories = jsonData
//             .filter((item) => item.Name || item.name) // Filter out empty rows
//             .map((item) => ({
//               name: String(item.Name || item.name || "").trim(),
//               description: String(item.Description || item.description || "").trim(),
//             }))
//             .filter((category) => category.name); // Remove categories without name

//           // Import each category to DB
//           const categoryApi = new DataApi("category");
//           let successCount = 0;
//           let errorCount = 0;

//           for (const category of importedCategories) {
//             try {
//               await categoryApi.create(category);
//               successCount++;
//             } catch (error) {
//               console.error("Error importing category:", category.name, error);
//               errorCount++;
//             }
//           }

//           PubSub.publish("RECORD_SAVED_TOAST", {
//             title: "Import Complete",
//             message: `Successfully imported ${successCount} category(ies)${errorCount > 0 ? `. ${errorCount} failed.` : ""}`,
//           });

//           fetchCategories(); // Refresh the list
//         } catch (error) {
//           console.error("Error importing file:", error);
//           PubSub.publish("RECORD_ERROR_TOAST", {
//             title: "Import Error",
//             message: "Failed to import file",
//           });
//         } finally {
//           setLoading(false);
//         }
//       };
//       reader.readAsArrayBuffer(file);
//     }
//   };

//   const handleExport = async () => {
//     try {
//       // Export only selected items if any are selected, otherwise export all
//       const dataToExport = selectedItems.length > 0
//         ? filteredCategories.filter(category => selectedItems.includes(category.id))
//         : filteredCategories;

//       if (dataToExport.length === 0) {
//         PubSub.publish("RECORD_ERROR_TOAST", {
//           title: "Export Error",
//           message: selectedItems.length > 0
//             ? "No selected items to export"
//             : "No data to export",
//         });
//         return;
//       }

//       const exportData = dataToExport.map((category) => ({
//         Name: category.name || "",
//         Description: category.description || "",
//       }));

//       const columns = [
//         { key: 'Name', header: 'Name', width: 30 },
//         { key: 'Description', header: 'Description', width: 50 }
//       ];

//       await exportToExcel(exportData, 'categories', 'Categories', columns);

//       PubSub.publish("RECORD_SAVED_TOAST", {
//         title: "Export Successful",
//         message: `Exported ${dataToExport.length} categor${dataToExport.length > 1 ? 'ies' : 'y'}`,
//       });
//     } catch (error) {
//       console.error('Error exporting categories:', error);
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Export Error",
//         message: "Failed to export categories",
//       });
//     }
//   };

//   const handleBulkDelete = async () => {
//     if (selectedItems.length === 0) {
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Error",
//         message: "Please select at least one category to delete",
//       });
//       return;
//     }

//     setShowBulkDeleteModal(true);
//   };

//   const confirmBulkDelete = async () => {
//     try {
//       setLoading(true);
//       const categoryApi = new DataApi("category");
//       let successCount = 0;
//       let errorCount = 0;

//       for (const categoryId of selectedItems) {
//         try {
//           await categoryApi.delete(categoryId);
//           successCount++;
//         } catch (error) {
//           console.error("Error deleting category:", categoryId, error);
//           errorCount++;
//         }
//       }

//       if (successCount > 0) {
//         PubSub.publish("RECORD_SAVED_TOAST", {
//           title: "Delete Complete",
//           message: `Successfully deleted ${successCount} categor${successCount > 1 ? 'ies' : 'y'}${errorCount > 0 ? `. ${errorCount} failed.` : ""}`,
//         });
//         setSelectedItems([]);
//         fetchCategories();
//       } else {
//         PubSub.publish("RECORD_ERROR_TOAST", {
//           title: "Delete Error",
//           message: "Failed to delete selected categories",
//         });
//       }

//       setShowBulkDeleteModal(false);
//     } catch (error) {
//       console.error("Error in bulk delete:", error);
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Error",
//         message: "Failed to delete categories",
//       });
//       setShowBulkDeleteModal(false);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filteredCategories = categories.filter(
//     (category) =>
//       (category.name && String(category.name).toLowerCase().includes(searchTerm.toLowerCase())) ||
//       (category.description && String(category.description).toLowerCase().includes(searchTerm.toLowerCase()))
//   );

//   const allColumns = [
//     {
//       field: "name",
//       label: "Name",
//       render: (value, record) => (
//         <div className="d-flex align-items-center">
//           <div
//             className="rounded-circle d-flex align-items-center justify-content-center me-2"
//             style={{
//               width: "32px",
//               height: "32px",
//               background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
//               color: "white",
//               fontSize: "14px",
//             }}
//           >
//             <i className="fa-solid fa-tags"></i>
//           </div>
//           <a
//             href={`/category/${record.id}`}
//             onClick={(e) => {
//               e.preventDefault();
//               navigate(`/category/${record.id}`);
//             }}
//             style={{ color: "#6f42c1", textDecoration: "none", fontWeight: "500" }}
//             onMouseEnter={(e) => {
//               try { localStorage.setItem(`prefetch:category:${record.id}`, JSON.stringify(record)); } catch (err) {}
//               e.target.style.textDecoration = "underline";
//             }}
//             onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
//           >
//             {value}
//           </a>
//         </div>
//       ),
//     },
//     {
//       field: "description",
//       label: "Description",
//       render: (value) => <span style={{ color: "#6c757d" }}>{value || ""}</span>,
//     },
//   ];

//   // Filter columns based on visibility
//   const columns = allColumns.filter(col => visibleColumns[col.field] !== false);

//   // Toggle column visibility
//   const toggleColumnVisibility = (field) => {
//     setVisibleColumns(prev => ({
//       ...prev,
//       [field]: !prev[field]
//     }));
//   };

//   const actionsRenderer = (category) => (
//     <div className="d-flex gap-2">
//       <Button
//         variant="link"
//         size="sm"
//         onClick={(e) => {
//           e.stopPropagation();
//           handleEdit(category);
//         }}
//         className="action-btn"
//         style={{ color: "#6f42c1", padding: "4px 8px" }}
//       >
//         <i className="fa-solid fa-edit"></i>
//       </Button>
//       <Button
//         variant="link"
//         size="sm"
//         onClick={(e) => {
//           e.stopPropagation();
//           handleDelete(category.id);
//         }}
//         className="action-btn"
//         style={{ color: "#dc3545", padding: "4px 8px" }}
//       >
//         <i className="fa-solid fa-trash"></i>
//       </Button>
//     </div>
//   );

//   return (
//     <Container fluid>
//       <ScrollToTop />
//       {/* Category Management Header - Top Position */}
//       <Row className="mb-3" style={{ marginTop: "0.5rem" }}>
//         <Col>
//           <TableHeader
//             title="Category Management"
//             icon="fa-solid fa-tags"
//             totalCount={categories.length}
//             totalLabel={categories.length === 1 ? "Category" : "Categories"}
//             filteredCount={filteredCategories.length}
//             showFiltered={true}
//             searchPlaceholder="Search categories..."
//             searchValue={searchTerm}
//             onSearchChange={setSearchTerm}
//             showColumnVisibility={true}
//             allColumns={allColumns}
//             visibleColumns={visibleColumns}
//             onToggleColumnVisibility={toggleColumnVisibility}
//             actionButtons={[
//               {
//                 variant: "outline-primary",
//                 icon: "fa-solid fa-upload",
//                 label: "Import",
//                 onClick: () => document.getElementById("importCategoryFile").click(),
//                 style: { borderColor: "#6f42c1", color: "#6f42c1" },
//               },
//               ...(selectedItems.length > 0 ? [{
//                 variant: "outline-danger",
//                 icon: "fa-solid fa-trash",
//                 label: `Delete (${selectedItems.length})`,
//                 onClick: handleBulkDelete,
//                 disabled: loading,
//               }] : []),
//               {
//                 variant: "outline-success",
//                 icon: "fa-solid fa-download",
//                 label: "Export",
//                 onClick: handleExport,
//               },
//               {
//                 icon: "fa-solid fa-plus",
//                 label: "Add Category",
//                 onClick: handleAdd,
//               },
//             ]}
//           />
//                   <input
//                     type="file"
//                     id="importCategoryFile"
//                     accept=".xlsx,.xls,.csv"
//                     onChange={handleImport}
//                     style={{ display: "none" }}
//                   />
//         </Col>
//       </Row>

//       <Row style={{ margin: 0, width: "100%", maxWidth: "100%" }}>
//         <Col style={{ padding: 0, width: "100%", maxWidth: "100%" }}>
//           {/* Check read permission
//           {!rolePermissions["category"]?.can_read ? ( */}
//             {/* <Card style={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "4px", overflow: "hidden", width: "100%", maxWidth: "100%" }}>
//               <Card.Body className="p-4" style={{ textAlign: "center", background: "#fff5f5" }}>
//                 <div style={{ marginBottom: "1rem" }}>
//                   <i className="fa-solid fa-lock" style={{ fontSize: "48px", color: "#dc3545", opacity: 0.5 }}></i>
//                 </div>
//                 <h5 style={{ color: "#dc3545", fontWeight: "600" }}>No Permission</h5>
//                 <p className="text-muted" style={{ marginBottom: 0 }}>
//                   You don't have permission to view categories. Please contact your administrator to request access.
//                 </p>
//               </Card.Body>
//             </Card> */}
//           {/* ) : ( */}
//             <Card style={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "4px", overflow: "hidden", width: "100%", maxWidth: "100%" }}>
//               <Card.Body className="p-0" style={{ overflow: "hidden", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
//                 {loading ? (
//                   <Loader />
//                 ) : (
//                   <ResizableTable
//                     data={filteredCategories}
//                     columns={columns}
//                     loading={loading}
//                     currentPage={currentPage}
//                     totalRecords={filteredCategories.length}
//                     recordsPerPage={recordsPerPage}
//                     onPageChange={setCurrentPage}
//                     showSerialNumber={true}
//                     showActions={true}
//                     showCheckbox={true}
//                     selectedItems={selectedItems}
//                     onSelectionChange={setSelectedItems}
//                     actionsRenderer={actionsRenderer}
//                     showSearch={false}
//                     emptyMessage="No categories found"
//                   />
//                 )}
//               </Card.Body>
//             </Card>
//           {/* )} */}

//         </Col>
//       </Row>

//       {/* Add/Edit Modal */}
//       <FormModal
//         show={showModal}
//         onHide={() => setShowModal(false)}
//         title={editingCategory ? "Edit Category" : "Add New Category"}
//         icon="fa-solid fa-tags"
//         formData={formData}
//         setFormData={setFormData}
//         fields={[
//           {
//             name: "name",
//             label: "Name",
//             type: "text",
//             required: true,
//             placeholder: "Enter category name",
//             colSize: 12,
//           },
//           {
//             name: "description",
//             label: "Description",
//             type: "textarea",
//             rows: 3,
//             placeholder: "Enter category description",
//             colSize: 12,
//           },
//         ]}
//         onSubmit={handleSave}
//         loading={loading}
//         editingItem={editingCategory}
//       />

//       {/* Delete Confirmation Modal */}
//       <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
//         <Modal.Header closeButton>
//           <Modal.Title>Confirm Delete</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>Are you sure you want to delete this category?</Modal.Body>
//         <Modal.Footer>
//           <Button variant="outline-secondary" onClick={() => setShowDeleteModal(false)}>
//             Cancel
//           </Button>
//           <Button variant="danger" onClick={confirmDelete}>
//             Delete
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </Container>
//   );
// };

// export default Category;




import React from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getCategoryConfig } from "./CategoryConfig";
import { useDataManager } from "../common/UserDataManager";
import Loader from "../common/Loader";

const Category = (props) => {
  // Get config structure first
  const baseConfig = getCategoryConfig();

  // Fetch data if needed (though categories don't have dependencies)
  const { data, loading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );

  if (loading) {
    return <Loader message="Loading categories data..." />;
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <h4>Error Loading Categories</h4>
        <p>{error.message}</p>
        <button
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  // Merge props data and fetched data
  const allData = {
    ...data,
    ...props
  };

  // Get final config with all data
  const finalConfig = getCategoryConfig(allData);

  return <DynamicCRUD {...finalConfig} />;
};

export default Category;