// import React, { useState, useEffect } from "react";
// import { Container, Row, Col, Card, Button, Form, Modal, Badge, Dropdown, Table } from "react-bootstrap";
// import * as XLSX from "xlsx";
// import { useLocation, useNavigate } from "react-router-dom";
// import ResizableTable from "../common/ResizableTable";
// import ScrollToTop from "../common/ScrollToTop";
// import Loader from "../common/Loader";
// import TableHeader from "../common/TableHeader";
// import FormModal from "../common/FormModal";
// import DataApi from "../../api/dataApi";
// import PubSub from "pubsub-js";
// import { exportToExcel } from "../../utils/excelExport";
// import jwt_decode from "jwt-decode";
// import * as constants from "../../constants/CONSTANT";
// import helper from "../common/helper";
// import Select from "react-select";

// const Books = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [books, setBooks] = useState([]);
//   const [authors, setAuthors] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [showModal, setShowModal] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [showBulkInsertModal, setShowBulkInsertModal] = useState(false);
//   const [editingBook, setEditingBook] = useState(null);
//   const [deleteId, setDeleteId] = useState(null);
//   const [bulkInsertData, setBulkInsertData] = useState([]);
//   const [multiInsertRows, setMultiInsertRows] = useState([{ title: "", author_id: "", category_id: "", isbn: "", total_copies: 1, available_copies: 1 }]);

//   const getSearchFromURL = () => {
//     const params = new URLSearchParams(location.search);
//     return params.get("q") || "";
//   };

//   const [searchTerm, setSearchTerm] = useState(getSearchFromURL());
//   const [currentPage, setCurrentPage] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [selectedItems, setSelectedItems] = useState([]);
//   const [userInfo, setUserInfo] = useState(null);
//   // const [rolePermissions, setRolePermissions] = useState({});
//   const recordsPerPage = 10;
//   const [formData, setFormData] = useState({
//     title: "",
//     author_id: "",
//     category_id: "",
//     isbn: "",
//     total_copies: 1,
//     available_copies: 1,
//   });
//   const [visibleColumns, setVisibleColumns] = useState({
//     title: true,
//     author_name: true,
//     language: true,
//     category_name: true,
//     isbn: true,
//     available_copies: true,
//     total_copies: true,
//   });
//   // Fetch user info and permissions on mount
//   useEffect(() => {
//     try {
//       const token = sessionStorage.getItem("token");
//       if (token) {
//         const user = jwt_decode(token);
//         setUserInfo(user);
//         if (user.userrole) {
//           fetchRolePermissions(user.userrole);
//         }
//       }
//     } catch (error) {
//       console.error("Error decoding token:", error);
//     }
//   }, []);

//   useEffect(() => {
//     const urlSearch = getSearchFromURL();
//     setSearchTerm(urlSearch);
//     setCurrentPage(1);
//   }, [location.search]);

//   useEffect(() => {
//     setSelectedItems([]);
//   }, [searchTerm]);

//   useEffect(() => {
//     const validIds = books.map(b => b.id);
//     setSelectedItems(prev => (prev || []).filter(id => validIds.includes(id)));
//   }, [books]);

//   useEffect(() => {
//     const params = new URLSearchParams(location.search);
//     const editId = params.get("edit");
//     if (editId && books.length > 0 && !editingBook) {
//       const bookToEdit = books.find((b) => b.id === editId);
//       if (bookToEdit) {
//         setEditingBook(bookToEdit);
//         setFormData({
//           title: bookToEdit.title || "",
//           author_id: bookToEdit.author_id || "",
//           category_id: bookToEdit.category_id || "",
//           isbn: bookToEdit.isbn || "",
//           total_copies: bookToEdit.total_copies || 1,
//           available_copies: bookToEdit.available_copies || 1,
//         });
//         setShowModal(true);
//         params.delete("edit");
//         navigate(`/books?${params.toString()}`, { replace: true });
//       }
//     }
//   }, [location.search, books]);

//   useEffect(() => {
//     const token = PubSub.subscribe("OPEN_ADD_BOOK_MODAL", () => {
//       handleAdd();
//     });
//     return () => {
//       PubSub.unsubscribe(token);
//     };
//   }, []);



//   // // Fetch role permissions
//   // const fetchRolePermissions = async (userRole) => {
//   //   try {
//   //     // Always fetch from API to check actual permissions (even for ADMIN)
//   //     const response = await helper.fetchWithAuth(
//   //       `${constants.API_BASE_URL}/api/role-permissions/current-user`,
//   //       "GET"
//   //     );
//   //     const result = await response.json();

//   //     if (result.success) {
//   //       const permMap = {};
//   //       result.permissions.forEach(perm => {
//   //         permMap[perm.module_name] = {
//   //           can_create: perm.can_create,
//   //           can_read: perm.can_read,
//   //           can_update: perm.can_update,
//   //           can_delete: perm.can_delete
//   //         };
//   //       });
//   //       setRolePermissions(permMap);
//   //     } else {
//   //       setRolePermissions({});
//   //     }
//   //   } catch (error) {
//   //     console.error("Error fetching role permissions:", error);
//   //     setRolePermissions({});
//   //   }
//   // };



//   // Fetch books when userInfo changes (for STUDENT filtering)
//   useEffect(() => {
//     if (userInfo) {
//       fetchBooks();
//       fetchAuthors();
//       fetchCategories();
//     }
//   }, [userInfo]);

//   // Fetch books from API
//   const fetchBooks = async () => {
//       const bookApi = new DataApi("book");
//         const response = await bookApi.fetchAll();
//         if (response.data) {
//           setBooks(response.data);
//         }

//     // try {
//     //   setLoading(true);

//     //   // If user is STUDENT, show only their assigned books
//     //   if (userInfo?.userrole === "STUDENT" && userInfo?.id) {
//     //     const issueApi = new DataApi("bookissue");
//     //     const issuesResponse = await issueApi.get(`/user/${userInfo.id}`);

//     //     if (issuesResponse.data && Array.isArray(issuesResponse.data)) {
//     //       // Extract unique book IDs from issued books
//     //       const assignedBookIds = [...new Set(issuesResponse.data.map(issue => issue.book_id))];

//     //       // Fetch all books
//     //       const bookApi = new DataApi("book");
//     //       const allBooksResponse = await bookApi.fetchAll();

//     //       if (allBooksResponse.data) {
//     //         // Filter to show only assigned books
//     //         const assignedBooks = allBooksResponse.data.filter(book =>
//     //           assignedBookIds.includes(book.id)
//     //         );
//     //         setBooks(assignedBooks);
//     //       }
//     //     } else {
//     //       setBooks([]); // No books assigned
//     //     }
//     //   } else {
//         // For ADMIN, ADMIN - show all books

//     // } catch (error) {
//     //   console.error("Error fetching books:", error);
//     //   PubSub.publish("RECORD_ERROR_TOAST", {
//     //     title: "Error",
//     //     message: "Failed to fetch books",
//     //   });
//     // } finally {
//     //   setLoading(false);
//     // }
//   };

//   // Fetch authors from API
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

//   const handleChange = (selectedOption) => {
//     setFormData((prev) => ({
//       ...prev,
//       author_id: selectedOption ? selectedOption.value : "",
//     }));
//   };

//   const authorOptions = authors.map((author) => ({
//     value: author.id,
//     label: author.name,
//   }));

//   const handleCategoryChange = (selectedOption) => {
//     setFormData((prev) => ({
//       ...prev,
//       category_id: selectedOption ? selectedOption.value : "",
//     }));
//   };

//   const categoryOptions = categories && categories.length > 0
//     ? categories.map((category) => ({
//       value: category.id,
//       label: category.name || "Unnamed Category",
//     }))
//     : [];

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({
//       ...formData,
//       [name]: name === "total_copies" || name === "available_copies" ? parseInt(value) || 0 : value
//     });
//   };

//   const handleAdd = () => {
//     setEditingBook(null);
//     setFormData({
//       title: "",
//       author_id: "",
//       category_id: "",
//       isbn: "",
//       total_copies: 1,
//       available_copies: 1,
//     });
//     setShowModal(true);
//   };

//   const handleEdit = (book) => {
//     setEditingBook(book);
//     setFormData({
//       title: book.title || "",
//       author_id: book.author_id || "",
//       category_id: book.category_id || "",
//       isbn: book.isbn || "",
//       total_copies: book.total_copies || 1,
//       available_copies: book.available_copies || 1,
//     });
//     setShowModal(true);
//   };
//   const confirmDelete = async () => {
//     try {
//       setLoading(true);
//       const bookApi = new DataApi("book");
//       const response = await bookApi.delete(deleteId);
//       if (response.data && response.data.success) {
//         PubSub.publish("RECORD_SAVED_TOAST", {
//           title: "Success",
//           message: "Book deleted successfully",
//         });
//         fetchBooks(); // Refresh the list
//         setShowDeleteModal(false);
//         setDeleteId(null);
//       } else {
//         PubSub.publish("RECORD_ERROR_TOAST", {
//           title: "Error",
//           message: response.data?.errors || "Failed to delete book",
//         });
//       }
//     } catch (error) {
//       console.error("Error deleting book:", error);
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Error",
//         message: "Failed to delete book",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleView = (book) => {
//     const newTab = window.open(`/books/${book.id}`, '_blank');
//     if (newTab) {
//       newTab.focus();
//     }
//   };

//   const handleIssueDetails = (book) => {
//     const newTab = window.open(`/books/${book.id}`, '_blank');
//     if (newTab) {
//       newTab.focus();
//     }
//   };

//   const handleSave = async () => {
//     if (!formData.title || !formData.title.trim()) {
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Validation Error",
//         message: "Title is required",
//       });
//       return;
//     }

//     if (!formData.author_id || formData.author_id === "") {
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Validation Error",
//         message: "Please select an author",
//       });
//       return;
//     }

//     if (!formData.category_id || formData.category_id === "") {
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Validation Error",
//         message: "Please select a category",
//       });
//       return;
//     }

//     if (!formData.isbn || !formData.isbn.trim()) {
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Validation Error",
//         message: "ISBN is required",
//       });
//       return;
//     }

//     const duplicateBook = books.find(
//       (book) =>
//         book.isbn &&
//         book.isbn.trim() === formData.isbn.trim() &&
//         book.id !== editingBook?.id
//     );
//     if (duplicateBook) {
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Duplicate Error",
//         message: "Book with this ISBN already exists",
//       });
//       return;
//     }

//     try {
//       setLoading(true);
//       const bookApi = new DataApi("book");

//       const bookData = {
//         title: formData.title.trim(),
//         author_id: formData.author_id,
//         category_id: formData.category_id,
//         isbn: formData.isbn.trim(),
//         total_copies: parseInt(formData.total_copies) || 1,
//         language: formData.language || "",
//         available_copies: parseInt(formData.available_copies) || (parseInt(formData.total_copies) || 1),
//       };

//       console.log("Sending book data:", bookData);

//       let response;
//       if (editingBook) {
//         response = await bookApi.update(bookData, editingBook.id);
//         console.log("Update response:", response);
//         if (response.data && response.data.success) {
//           PubSub.publish("RECORD_SAVED_TOAST", {
//             title: "Success",
//             message: "Book updated successfully",
//           });
//           fetchBooks();
//           setShowModal(false);
//           setEditingBook(null);
//           setFormData({
//             title: "",
//             author_id: "",
//             category_id: "",
//             isbn: "",
//             total_copies: 1,
//             available_copies: 1,
//           });
//         } else {
//           const errorMsg = Array.isArray(response.data?.errors)
//             ? response.data.errors.map(e => e.msg || e).join(", ")
//             : (response.data?.errors || "Failed to update book");
//           PubSub.publish("RECORD_ERROR_TOAST", {
//             title: "Error",
//             message: errorMsg,
//           });
//         }
//       } else {
//       response = await bookApi.create(bookData);
//         console.log("Create response:", response);
//         if (response.data && response.data.success) {
//           PubSub.publish("RECORD_SAVED_TOAST", {
//             title: "Success",
//             message: "Book created successfully",
//           });
//           fetchBooks();
//           setShowModal(false);
//           setFormData({
//             title: "",
//             author_id: "",
//             category_id: "",
//             isbn: "",
//             total_copies: 1,
//             available_copies: 1,
//           });
//         } else {
//           const errorMsg = Array.isArray(response.data?.errors)
//             ? response.data.errors.map(e => e.msg || e).join(", ")
//             : (response.data?.errors || "Failed to create book");
//           PubSub.publish("RECORD_ERROR_TOAST", {
//             title: "Error",
//             message: errorMsg,
//           });
//         }
//       }
//     } catch (error) {
//       console.error("Error saving book:", error);
//       const errorMsg = error.response?.data?.errors
//         ? (Array.isArray(error.response.data.errors)
//           ? error.response.data.errors.map(e => e.msg || e).join(", ")
//           : error.response.data.errors)
//         : error.message || "Failed to save book";
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Error",
//         message: errorMsg,
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleBulkInsert = () => {
//     setBulkInsertData([]);
//     setMultiInsertRows([{ title: "", author_id: "", category_id: "", isbn: "", total_copies: 1, available_copies: 1 }]);
//     setShowBulkInsertModal(true);
//   };

//   const handleAddMultiRow = () => {
//     setMultiInsertRows([...multiInsertRows, { title: "", author_id: "", category_id: "", isbn: "", total_copies: 1, available_copies: 1 }]);
//   };

//   const handleRemoveMultiRow = (index) => {
//     if (multiInsertRows.length > 1) {
//       setMultiInsertRows(multiInsertRows.filter((_, i) => i !== index));
//     }
//   };

//   const handleMultiRowChange = (index, field, value) => {
//     const updatedRows = [...multiInsertRows];
//     updatedRows[index] = { ...updatedRows[index], [field]: value };
//     setMultiInsertRows(updatedRows);
//   };

//   const handleMultiInsertSave = async () => {
//     const convertedData = multiInsertRows.map((row) => {
//       const authorName = authors.find(a => a.id === row.author_id)?.name || "";
//       const categoryName = categories.find(c => c.id === row.category_id)?.name || "";
//       return {
//         title: row.title.trim(),
//         author_id: row.author_id,
//         category_id: row.category_id,
//         isbn: row.isbn.trim(),
//         total_copies: parseInt(row.total_copies) || 1,
//         available_copies: parseInt(row.available_copies) || (parseInt(row.total_copies) || 1),
//         authorName: authorName,
//         categoryName: categoryName,
//       };
//     }).filter(book => book.title || book.isbn); // Only include rows with at least title or ISBN

//     if (convertedData.length === 0) {
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Error",
//         message: "Please add at least one book",
//       });
//       return;
//     }

//     // Use the same save logic as file import
//     setBulkInsertData(convertedData);
//     await handleBulkInsertSave();
//   };

//   const handleBulkInsertFileSelect = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setLoading(true);
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         try {
//           const data = new Uint8Array(event.target.result);
//           const workbook = XLSX.read(data, { type: "array" });
//           const sheet = workbook.Sheets[workbook.SheetNames[0]];
//           const jsonData = XLSX.utils.sheet_to_json(sheet);

//           // Map Excel columns to book fields
//           const importedBooks = jsonData
//             .filter((item) => item.Title || item.title) // Filter out empty rows
//             .map((item) => {
//               // Find author by name
//               const authorName = String(item.Author || item.author || "").trim();
//               const author = authors.find(a => a.name && a.name.toLowerCase() === authorName.toLowerCase());

//               // Find category by name
//               const categoryName = String(item.Category || item.category || "").trim();
//               const category = categories.find(c => c.name && c.name.toLowerCase() === categoryName.toLowerCase());

//               return {
//                 title: String(item.Title || item.title || "").trim(),
//                 author_id: author ? author.id : "",
//                 category_id: category ? category.id : "",
//                 isbn: String(item.ISBN || item.isbn || "").trim(),
//                 total_copies: parseInt(item["Total Copies"] || item.total_copies || item["Total Copies"] || 1) || 1,
//                 available_copies: parseInt(item["Available Copies"] || item.available_copies || item["Available Copies"] || item["Total Copies"] || item.total_copies || 1) || 1,
//                 authorName: authorName, // For display
//                 categoryName: categoryName, // For display
//               };
//             })
//             .filter((book) => book.title); // Remove books without title

//           setBulkInsertData(importedBooks);
//         } catch (error) {
//           console.error("Error parsing file:", error);
//           PubSub.publish("RECORD_ERROR_TOAST", {
//             title: "Error",
//             message: "Failed to parse file",
//           });
//         } finally {
//           setLoading(false);
//         }
//       };
//       reader.readAsArrayBuffer(file);
//     }
//   };

//   const handleBulkInsertSave = async () => {

//     // Validate all records
//     const invalidRecords = bulkInsertData.filter(book =>
//       !book.title || !book.isbn || !book.author_id || !book.category_id
//     );

//     if (invalidRecords.length > 0) {
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Validation Error",
//         message: `${invalidRecords.length} record(s) are missing required fields (Title, ISBN, Author, Category)`,
//       });
//       return;
//     }

//     try {
//       setLoading(true);
//       const bookApi = new DataApi("book");
//       let successCount = 0;
//       let errorCount = 0;
//       const errors = [];

//       // Insert books one by one (or you can create a bulk insert endpoint)
//       for (const book of bulkInsertData) {
//         try {
//           const bookData = {
//             title: book.title,
//             author_id: book.author_id,
//             category_id: book.category_id,
//             isbn: book.isbn,
//             total_copies: book.total_copies,
//             available_copies: book.available_copies,
//           };
//           await bookApi.create(bookData);
//           successCount++;
//         } catch (error) {
//           errorCount++;
//           const errorMsg = error.response?.data?.errors
//             ? (Array.isArray(error.response.data.errors)
//               ? error.response.data.errors.map(e => e.msg || e).join(", ")
//               : error.response.data.errors)
//             : error.message || "Failed to insert";
//           errors.push(`${book.title}: ${errorMsg}`);
//         }
//       }

//       PubSub.publish("RECORD_SAVED_TOAST", {
//         title: "Bulk Insert Complete",
//         message: `Successfully inserted ${successCount} book(s)${errorCount > 0 ? `. ${errorCount} failed.` : ""}`,
//       });

//       if (errors.length > 0 && errors.length <= 5) {
//         // Show first few errors
//         setTimeout(() => {
//           PubSub.publish("RECORD_ERROR_TOAST", {
//             title: "Some records failed",
//             message: errors.slice(0, 3).join("; "),
//           });
//         }, 1000);
//       }

//       fetchBooks(); // Refresh the list
//       setShowBulkInsertModal(false);
//       setBulkInsertData([]);
//     } catch (error) {
//       console.error("Error in bulk insert:", error);
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Error",
//         message: "Failed to insert books",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };
//   const handleImport = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     setLoading(true);

//     try {
//       // Ensure authors and categories are fetched first
//       await Promise.all([fetchAuthors(), fetchCategories()]);

//       const reader = new FileReader();

//       reader.onload = async (event) => {
//         try {
//           const data = new Uint8Array(event.target.result);
//           const workbook = XLSX.read(data, { type: "array" });
//           const sheet = workbook.Sheets[workbook.SheetNames[0]];
//           const jsonData = XLSX.utils.sheet_to_json(sheet);

//           console.log("📥 Raw Excel Data:", jsonData);

//           const importedBooks = jsonData
//             .filter((item) => item.Title || item.title || item['Book Title'] || item['Book Title'] || item['Book_Name'] || item.book_name) // Multiple possible column names
//             .map((item, index) => {
//               try {
//                 // Handle different column name variations
//                 const title = String(
//                   item.Title || item.title || item['Book Title'] || item['Book Title'] || item['Book_Name'] || item.book_name || ""
//                 ).trim();

//                 const authorName = String(
//                   item.Author || item.author || item['Author Name'] || item['Author_Name'] || item.author_name || ""
//                 ).trim();

//                 const categoryName = String(
//                   item.Category || item.category || item['Book Category'] || item['Book_Category'] || item.category_name || ""
//                 ).trim();

//                 const isbn = String(
//                   item.ISBN || item.isbn || item['Book ISBN'] || item['Book_ISBN'] || item.book_isbn || ""
//                 ).trim();

//                 // Find author by name (case insensitive, partial match)
//                 const author = authors.find(a =>
//                   a.name && a.name.toLowerCase().includes(authorName.toLowerCase())
//                 );

//                 // Find category by name (case insensitive, partial match)
//                 const category = categories.find(c =>
//                   c.name && c.name.toLowerCase().includes(categoryName.toLowerCase())
//                 );

//                 // If author not found, use first author or create a default
//                 let author_id = author ? author.id : null;
//                 if (!author_id && authors.length > 0) {
//                   author_id = authors[0].id; // Use first author as fallback
//                 }

//                 // If category not found, use first category or create a default
//                 let category_id = category ? category.id : null;
//                 if (!category_id && categories.length > 0) {
//                   category_id = categories[0].id; // Use first category as fallback
//                 }

//                 // Validate and parse numbers with defaults
//                 const total_copies = Math.max(1, parseInt(
//                   item["Total Copies"] || item.total_copies || item["Total_Copies"] ||
//                   item.total_copies_count || item.Copies || item.copies || "1"
//                 ) || 1);

//                 const available_copies = Math.max(0, parseInt(
//                   item["Available Copies"] || item.available_copies || item["Available_Copies"] ||
//                   item.available_copies_count || item["Available"] || item.available ||
//                   String(total_copies) // Default to total copies if not specified
//                 ) || total_copies);

//                 const bookData = {
//                   title: title,
//                   author_id: author_id,
//                   category_id: category_id,
//                   isbn: isbn || `IMPORT-${Date.now()}-${index}`, // Generate unique ISBN if missing
//                   total_copies: total_copies,
//                   available_copies: Math.min(available_copies, total_copies), // Ensure available doesn't exceed total
//                   description: String(item.Description || item.description || "").trim(),
//                   publisher: String(item.Publisher || item.publisher || "").trim(),
//                   published_year: parseInt(item["Published Year"] || item.published_year || item.Year || item.year || new Date().getFullYear()) || new Date().getFullYear(),
//                 };

//                 // Remove empty fields
//                 Object.keys(bookData).forEach(key => {
//                   if (bookData[key] === null || bookData[key] === undefined || bookData[key] === "") {
//                     delete bookData[key];
//                   }
//                 });

//                 // Validate required fields
//                 if (!bookData.title) {
//                   throw new Error("Title is required");
//                 }

//                 console.log(`📖 Processed Book ${index + 1}:`, bookData);
//                 return bookData;

//               } catch (itemError) {
//                 console.error(`❌ Error processing row ${index + 1}:`, item, itemError);
//                 return null;
//               }
//             })
//             .filter((book) => book !== null && book.title); // Remove null and empty titles

//           console.log("✅ Final Books for Import:", importedBooks);

//           if (importedBooks.length === 0) {
//             PubSub.publish("RECORD_ERROR_TOAST", {
//               title: "Import Error",
//               message: "No valid books found in the file. Please check the column names.",
//             });
//             setLoading(false);
//             return;
//           }

//           // Import each book to DB
//           const bookApi = new DataApi("book");
//           let successCount = 0;
//           let errorCount = 0;
//           let errors = [];

//           for (const [index, book] of importedBooks.entries()) {
//             try {
//               console.log(`🔄 Importing book ${index + 1}:`, book);

//               // Validate data before sending
//               const validationErrors = validateBookData(book);
//               if (validationErrors.length > 0) {
//                 throw new Error(validationErrors.join(", "));
//               }

//               const response = await bookApi.create(book);
//               console.log(`✅ Successfully imported: ${book.title}`, response);
//               successCount++;

//             } catch (error) {
//               console.error(`❌ Failed to import: ${book.title}`, error);
//               errorCount++;

//               // Get detailed error message
//               let errorMessage = "Unknown error";
//               if (error.response?.data) {
//                 // Handle different error response formats
//                 if (typeof error.response.data === 'string') {
//                   errorMessage = error.response.data;
//                 } else if (error.response.data.message) {
//                   errorMessage = error.response.data.message;
//                 } else if (error.response.data.errors) {
//                   errorMessage = Array.isArray(error.response.data.errors)
//                     ? error.response.data.errors.map(e => e.msg || e).join(", ")
//                     : error.response.data.errors;
//                 } else {
//                   errorMessage = JSON.stringify(error.response.data);
//                 }
//               } else if (error.message) {
//                 errorMessage = error.message;
//               }

//               errors.push(`"${book.title}": ${errorMessage}`);
//             }
//           }

//           // Show result toast
//           if (successCount > 0) {
//             PubSub.publish("RECORD_SAVED_TOAST", {
//               title: "Import Complete",
//               message: `Successfully imported ${successCount} book(s)` +
//                 (errorCount > 0 ? `, ${errorCount} failed` : ""),
//             });
//           }

//           if (errorCount > 0) {
//             PubSub.publish("RECORD_ERROR_TOAST", {
//               title: `Import Errors (${errorCount} failed)`,
//               message: errors.slice(0, 5).join(", ") +
//                 (errors.length > 5 ? `... and ${errors.length - 5} more errors` : ""),
//             });
//           }

//           // Refresh the books list
//           await fetchBooks();

//           // Reset file input
//           e.target.value = "";

//         } catch (error) {
//           console.error("❌ Error processing file:", error);
//           PubSub.publish("RECORD_ERROR_TOAST", {
//             title: "Import Error",
//             message: "Failed to process file: " + (error.message || "Unknown error"),
//           });
//         } finally {
//           setLoading(false);
//         }
//       };

//       reader.onerror = () => {
//         console.error("❌ File reading error");
//         PubSub.publish("RECORD_ERROR_TOAST", {
//           title: "Import Error",
//           message: "Failed to read file",
//         });
//         setLoading(false);
//       };

//       reader.readAsArrayBuffer(file);

//     } catch (error) {
//       console.error("❌ Error in handleImport:", error);
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Import Error",
//         message: "Failed to start import process: " + (error.message || "Unknown error"),
//       });
//       setLoading(false);
//     }
//   };

//   // Add validation function
//   const validateBookData = (book) => {
//     const errors = [];

//     if (!book.title || book.title.trim() === '') {
//       errors.push('Title is required');
//     }

//     if (book.title && book.title.length > 500) {
//       errors.push('Title is too long');
//     }

//     if (!book.author_id) {
//       errors.push('Author is required');
//     }

//     if (!book.category_id) {
//       errors.push('Category is required');
//     }

//     if (book.total_copies && (book.total_copies < 1 || book.total_copies > 10000)) {
//       errors.push('Total copies must be between 1 and 10000');
//     }

//     if (book.available_copies && (book.available_copies < 0 || book.available_copies > book.total_copies)) {
//       errors.push('Available copies cannot exceed total copies');
//     }

//     if (book.isbn && book.isbn.length > 20) {
//       errors.push('ISBN is too long');
//     }

//     return errors;
//   };
//   // const handleImport = async (e) => {
//   //   const file = e.target.files[0];
//   //   if (file) {
//   //     setLoading(true);
//   //     const reader = new FileReader();
//   //     reader.onload = async (event) => {
//   //       try {
//   //         const data = new Uint8Array(event.target.result);
//   //         const workbook = XLSX.read(data, { type: "array" });
//   //         const sheet = workbook.Sheets[workbook.SheetNames[0]];
//   //         const jsonData = XLSX.utils.sheet_to_json(sheet);

//   //         // Map Excel columns to book fields
//   //         const importedBooks = jsonData
//   //           .filter((item) => item.Title || item.title) // Filter out empty rows
//   //           .map((item) => {
//   //             // Find author by name
//   //             const authorName = String(item.Author || item.author || "").trim();
//   //             const author = authors.find(a => a.name && a.name.toLowerCase() === authorName.toLowerCase());

//   //             // Find category by name
//   //             const categoryName = String(item.Category || item.category || "").trim();
//   //             const category = categories.find(c => c.name && c.name.toLowerCase() === categoryName.toLowerCase());

//   //             return {
//   //               title: String(item.Title || item.title || "").trim(),
//   //               author_id: author ? author.id : "",
//   //               category_id: category ? category.id : "",
//   //               isbn: String(item.ISBN || item.isbn || "").trim(),
//   //               total_copies: parseInt(item["Total Copies"] || item.total_copies || 1) || 1,
//   //               available_copies: parseInt(item["Available Copies"] || item.available_copies || item["Total Copies"] || item.total_copies || 1) || 1,
//   //             };
//   //           })
//   //           .filter((book) => book.title); // Remove books without title

//   //         // Import each book to DB
//   //         const bookApi = new DataApi("book");
//   //         let successCount = 0;
//   //         let errorCount = 0;

//   //         for (const book of importedBooks) {
//   //           try {
//   //             await bookApi.create(book);
//   //             successCount++;
//   //           } catch (error) {
//   //             console.error("Error importing book:", book.title, error);
//   //             errorCount++;
//   //           }
//   //         }

//   //         PubSub.publish("RECORD_SAVED_TOAST", {
//   //           title: "Import Complete",
//   //           message: `Successfully imported ${successCount} book(s)${errorCount > 0 ? `. ${errorCount} failed.` : ""}`,
//   //         });

//   //         fetchBooks(); // Refresh the list
//   //       } catch (error) {
//   //         console.error("Error importing file:", error);
//   //         PubSub.publish("RECORD_ERROR_TOAST", {
//   //           title: "Import Error",
//   //           message: "Failed to import file",
//   //         });
//   //       } finally {
//   //         setLoading(false);
//   //       }
//   //     };
//   //     reader.readAsArrayBuffer(file);
//   //   }
//   // };

//   const handleExport = async () => {
//     try {
//       const exportList = (selectedItems && selectedItems.length > 0)
//         ? filteredBooks.filter(b => (selectedItems || []).includes(b.id))
//         : filteredBooks;

//       const exportData = exportList.map((book) => ({
//         Title: book.title,
//         Author: book.author_name || "",
//         Category: book.category_name || "",
//         ISBN: book.isbn,
//         "Total Copies": book.total_copies || 0,
//         "Available Copies": book.available_copies || 0,
//       }));

//       const columns = [
//         { key: 'Title', header: 'Title', width: 40 },
//         { key: 'Author', header: 'Author', width: 25 },
//         { key: 'Category', header: 'Category', width: 25 },
//         { key: 'ISBN', header: 'ISBN', width: 20 },
//         { key: 'Total Copies', header: 'Total Copies', width: 15 },
//         { key: 'Available Copies', header: 'Available Copies', width: 18 }
//       ];

//       await exportToExcel(exportData, 'books', 'Books', columns);
//     } catch (error) {
//       console.error('Error exporting books:', error);
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Export Error",
//         message: "Failed to export books",
//       });
//     }
//   };

//   const filteredBooks = books.filter(
//     (book) =>
//       (book.title && String(book.title).toLowerCase().includes(searchTerm.toLowerCase())) ||
//       (book.author_name && String(book.author_name).toLowerCase().includes(searchTerm.toLowerCase())) ||
//       (book.category_name && String(book.category_name).toLowerCase().includes(searchTerm.toLowerCase())) ||
//       (book.isbn && String(book.isbn).includes(searchTerm))
//   );

//   const allColumns = [
//     {
//       field: "title",
//       label: "Title",
//       render: (value, record) => (
//         <a
//           href={`/books/${record.id}`}
//           onClick={(e) => {
//             e.preventDefault();
//             navigate(`/books/${record.id}`);
//           }}
//           style={{ color: "#6f42c1", textDecoration: "none", fontWeight: "500" }}
//           onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
//           onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
//         >
//           {value}
//         </a>
//       ),
//     },
//     {
//       field: "author_name",
//       label: "Author",
//     },
//     {
//       field: "language",
//       label: "Language",
//     },
//     {
//       field: "category_name",
//       label: "Category",
//       render: (value) => (
//         <span
//           className="badge"
//           style={{
//             background: "#f3e9fc",
//             color: "#6f42c1",
//             padding: "4px 10px",
//             borderRadius: "4px",
//             fontSize: "12px",
//           }}
//         >
//           {value}
//         </span>
//       ),
//     },
//     {
//       field: "isbn",
//       label: "ISBN",
//       render: (value) => <span style={{ color: "#6c757d" }}>{value}</span>,
//     },
//     {
//       field: "available_copies",
//       label: "Available",
//       render: (value, record) => (
//         <span
//           className={`badge ${value > 0 ? "bg-success" : "bg-danger"}`}
//           style={{ fontSize: "12px", padding: "4px 10px" }}
//         >
//           {value} / {record.total_copies}
//         </span>
//       ),
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

//   // Updated actionsRenderer with three-dot dropdown - Opens in new tabs
//   const actionsRenderer = (book) => {
//     return (
//       <div className="d-flex gap-2">
//         <Dropdown>
//           <Dropdown.Toggle
//             variant="link"
//             size="sm"
//             className="action-btn"
//             style={{
//               color: "#6f42c1",
//               padding: "4px 8px",
//               border: "none",
//               boxShadow: "none"
//             }}
//             id={`dropdown-${book.id}`}
//           >
//             <i className="fa-solid fa-ellipsis-vertical"></i>
//           </Dropdown.Toggle>

//           <Dropdown.Menu>
//             <Dropdown.Item
//               onClick={(e) => {
//                 e.stopPropagation();
//                 handleView(book);
//               }}
//               className="d-flex align-items-center"
//             >
//               <i className="fa-solid fa-eye me-2" style={{ width: "16px" }}></i>
//               View
//             </Dropdown.Item>

//             <Dropdown.Item
//               onClick={(e) => {
//                 e.stopPropagation();
//                 handleEdit(book);
//               }}
//               className="d-flex align-items-center"
//             >
//               <i className="fa-solid fa-edit me-2" style={{ width: "16px" }}></i>
//               Edit
//             </Dropdown.Item>

//             <Dropdown.Divider />

//             <Dropdown.Item
//               onClick={(e) => {
//                 e.stopPropagation();
//                 handleIssueDetails(book);
//               }}
//               className="d-flex align-items-center"
//             >
//               <i className="fa-solid fa-user-check me-2" style={{ width: "16px" }}></i>
//               Issue Details
//             </Dropdown.Item>
//           </Dropdown.Menu>
//         </Dropdown>
//       </div>
//     );
//   };

//   return (
//     <Container fluid>
//       <ScrollToTop />
//       {/* Books Management Header - Top Position */}
//       <Row className="mb-3" style={{ marginTop: "0.5rem" }}>
//         <Col>
//           <TableHeader
//             title="Books Management"
//             icon="fa-solid fa-book"
//             totalCount={filteredBooks.length}
//             totalLabel={filteredBooks.length === 1 ? "Book" : "Books"}
//             searchPlaceholder="Search books..."
//             searchValue={searchTerm}
//             onSearchChange={setSearchTerm}
//             showColumnVisibility={true}
//             allColumns={allColumns}
//             visibleColumns={visibleColumns}
//             onToggleColumnVisibility={toggleColumnVisibility}
//             actionButtons={[
//               {
//                 variant: "outline-success",
//                 size: "sm",
//                 icon: "fa-solid fa-download",
//                 label: "Export",
//                 onClick: handleExport,
//               },
//               {
//                 variant: "outline-primary",
//                 size: "sm",
//                 icon: "fa-solid fa-upload",
//                 label: "Import",
//                 onClick: () => document.getElementById("importFile").click(),
//                 style: { borderColor: "#6f42c1", color: "#6f42c1" },
//               },
//               {
//                 variant: "outline-primary",
//                 size: "sm",
//                 icon: "fa-solid fa-layer-group",
//                 label: "Bulk Insert",
//                 onClick: handleBulkInsert,
//                 style: { borderColor: "#6f42c1", color: "#6f42c1" },
//               },
//               {
//                 size: "sm",
//                 icon: "fa-solid fa-plus",
//                 label: "Add Book",
//                 onClick: handleAdd,
//                 style: {
//                   background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
//                   border: "none",
//                 },
//               },
//             ]}
//           />
//           <input
//             type="file"
//             id="importFile"
//             accept=".xlsx,.xls,.csv"
//             onChange={handleImport}
//             style={{ display: "none" }}
//           />
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
//                   data={filteredBooks}
//                   columns={columns}
//                   loading={loading}
//                   showCheckbox={true}
//                   selectedItems={selectedItems}
//                   onSelectionChange={setSelectedItems}
//                   searchTerm={searchTerm}
//                   onSearchChange={setSearchTerm}
//                   currentPage={currentPage}
//                   totalRecords={filteredBooks.length}
//                   recordsPerPage={recordsPerPage}
//                   onPageChange={setCurrentPage}
//                   showSerialNumber={true}
//                   showActions={true}
//                   showSearch={false}
//                   actionsRenderer={actionsRenderer}
//                   emptyMessage="No books found"
//                 />
//               )}
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>

//       {/* Add/Edit Modal */}
//       <FormModal
//         show={showModal}
//         onHide={() => setShowModal(false)}
//         title={editingBook ? "Edit Book" : "Add New Book"}
//         icon="fa-solid fa-book"
//         formData={formData}
//         setFormData={setFormData}
//         fields={[
//           {
//             name: "title",
//             label: "Title",
//             type: "text",
//             required: true,
//             placeholder: "Enter book title",
//             colSize: 12,
//           },
//           {
//             name: "author_id",
//             label: "Author",
//             type: "custom",
//             required: true,
//             colSize: 6,
//             render: (value) => (
//               <Form.Group className="mb-3">
//                 <Form.Label>Author <span className="text-danger">*</span></Form.Label>
//                 <Select
//                   name="author_id"
//                   value={authorOptions.find((a) => a.value === formData.author_id) || null}
//                   onChange={handleChange}
//                   options={authorOptions}
//                   placeholder="Select Author"
//                   isClearable
//                   isSearchable
//                   styles={{
//                     control: (base) => ({
//                       ...base,
//                       border: "2px solid #c084fc",
//                       borderRadius: "8px",
//                       boxShadow: "none",
//                       "&:hover": { borderColor: "#a855f7" },
//                     }),
//                     option: (base, state) => ({
//                       ...base,
//                       backgroundColor: state.isFocused ? "#f3e8ff" : "white",
//                       color: "#4c1d95",
//                       cursor: "pointer",
//                     }),
//                   }}
//                 />
//               </Form.Group>
//             ),
//           },
//           {
//             name: "category_id",
//             label: "Category",
//             type: "custom",
//             required: true,
//             colSize: 6,
//             render: (value) => (
//               <Form.Group className="mb-3">
//                 <Form.Label>Category <span className="text-danger">*</span></Form.Label>
//                 <Select
//                   name="category_id"
//                   value={categoryOptions.find((c) => c.value === formData.category_id) || null}
//                   onChange={handleCategoryChange}
//                   options={categoryOptions}
//                   placeholder={categoryOptions.length === 0 ? "No categories available. Please add categories first." : "Select Category"}
//                   isClearable
//                   isSearchable
//                   isDisabled={categoryOptions.length === 0}
//                   styles={{
//                     control: (base) => ({
//                       ...base,
//                       border: "2px solid #c084fc",
//                       borderRadius: "8px",
//                       boxShadow: "none",
//                       "&:hover": { borderColor: "#a855f7" },
//                     }),
//                     option: (base, state) => ({
//                       ...base,
//                       backgroundColor: state.isFocused ? "#f3e8ff" : "white",
//                       color: "#4c1d95",
//                       cursor: "pointer",
//                     }),
//                   }}
//                 />
//               </Form.Group>
//             ),
//           },
//           {
//             name: "isbn",
//             label: "ISBN",
//             type: "text",
//             required: true,
//             placeholder: "Enter ISBN",
//             colSize: 6,
//           },
//           {
//             name: "language",
//             label: "Language",
//             type: "text",
//             placeholder: "Enter Languages",
//             colSize: 6,
//           },
//           {
//             name: "total_copies",
//             label: "Total Copies",
//             type: "number",
//             placeholder: "Enter total copies",
//             colSize: 6,
//             props: {
//               min: 1,
//             },
//           },
//           {
//             name: "available_copies",
//             label: "Available Copies",
//             type: "number",
//             placeholder: "Enter available copies",
//             colSize: 6,
//             props: {
//               min: 0,
//             },
//           },
//         ]}
//         onSubmit={handleSave}
//         loading={loading}
//         editingItem={editingBook}
//       />

//       {/* Delete Confirmation Modal */}
//       <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
//         <Modal.Header closeButton>
//           <Modal.Title>Confirm Delete</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>Are you sure you want to delete this book?</Modal.Body>
//         <Modal.Footer>
//           <Button variant="outline-secondary" onClick={() => setShowDeleteModal(false)}>
//             Cancel
//           </Button>
//           <Button variant="danger" onClick={confirmDelete}>
//             Delete
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       {/* Bulk Insert Modal */}
//       <Modal
//         show={showBulkInsertModal}
//         onHide={() => {
//           setShowBulkInsertModal(false);
//           setBulkInsertData([]);
//           setMultiInsertRows([{ title: "", author_id: "", category_id: "", isbn: "", total_copies: 1, available_copies: 1 }]);
//         }}
//         size="xl"
//         centered
//       >
//         <Modal.Header closeButton style={{
//           background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
//           color: "white",
//           borderBottom: "none",
//           padding: "20px 24px"
//         }}>
//           <Modal.Title style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "20px", fontWeight: "600", color: "white" }}>
//             <i className="fa-solid fa-layer-group" style={{ fontSize: "24px" }}></i>
//             Bulk Insert Books
//           </Modal.Title>
//         </Modal.Header>
//         <Modal.Body style={{ padding: "24px", maxHeight: "70vh", overflowY: "auto" }}>
//           <div className="mb-3 d-flex justify-content-between align-items-center">
//             <h6 style={{ color: "#333", fontWeight: "600", margin: 0 }}>Add Books Manually</h6>
//             <Button
//               variant="success"
//               size="sm"
//               onClick={handleAddMultiRow}
//               style={{
//                 background: "#28a745",
//                 border: "none",
//                 padding: "8px 16px",
//                 borderRadius: "6px",
//                 fontWeight: "500",
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "6px"
//               }}
//             >
//               <i className="fa-solid fa-plus"></i>
//               Add Row
//             </Button>
//           </div>
//           <div className="mb-3">
//             <Badge bg="primary" style={{ fontSize: "14px", padding: "6px 12px" }}>
//               Total Rows: {multiInsertRows.length}
//             </Badge>
//           </div>

//           <div className="table-responsive">
//             <Table bordered hover style={{ marginBottom: 0 }}>
//               <thead style={{ background: "#f8f9fa" }}>
//                 <tr>
//                   <th style={{ width: "18%", padding: "12px", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #dee2e6" }}>
//                     Title <span className="text-danger">*</span>
//                   </th>
//                   <th style={{ width: "16%", padding: "12px", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #dee2e6" }}>
//                     Author <span className="text-danger">*</span>
//                   </th>
//                   <th style={{ width: "16%", padding: "12px", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #dee2e6" }}>
//                     Category <span className="text-danger">*</span>
//                   </th>
//                   <th style={{ width: "16%", padding: "12px", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #dee2e6" }}>
//                     ISBN <span className="text-danger">*</span>
//                   </th>
//                   <th style={{ width: "12%", padding: "12px", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #dee2e6" }}>
//                     Total Copies
//                   </th>
//                   <th style={{ width: "12%", padding: "12px", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #dee2e6" }}>
//                     Available Copies
//                   </th>
//                   <th style={{ width: "10%", padding: "12px", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #dee2e6" }}>
//                     Action
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {multiInsertRows.map((row, index) => (
//                   <tr key={index}>
//                     <td style={{ padding: "12px", verticalAlign: "middle" }}>
//                       <Form.Control
//                         size="sm"
//                         value={row.title}
//                         onChange={(e) => handleMultiRowChange(index, "title", e.target.value)}
//                         placeholder="Enter book title"
//                         style={{ border: "1px solid #ced4da", borderRadius: "4px" }}
//                       />
//                     </td>
//                     <td style={{ padding: "12px", verticalAlign: "middle" }}>
//                       <Form.Select
//                         size="sm"
//                         value={row.author_id}
//                         onChange={(e) => handleMultiRowChange(index, "author_id", e.target.value)}
//                         style={{ border: "1px solid #ced4da", borderRadius: "4px" }}
//                       >
//                         <option value="">Select Author</option>
//                         {authors.map((author) => (
//                           <option key={author.id} value={author.id}>
//                             {author.name}
//                           </option>
//                         ))}
//                       </Form.Select>
//                     </td>
//                     <td style={{ padding: "12px", verticalAlign: "middle" }}>
//                       <Form.Select
//                         size="sm"
//                         value={row.category_id}
//                         onChange={(e) => handleMultiRowChange(index, "category_id", e.target.value)}
//                         style={{ border: "1px solid #ced4da", borderRadius: "4px" }}
//                       >
//                         <option value="">Select Category</option>
//                         {categories.map((category) => (
//                           <option key={category.id} value={category.id}>
//                             {category.name}
//                           </option>
//                         ))}
//                       </Form.Select>
//                     </td>
//                     <td style={{ padding: "12px", verticalAlign: "middle" }}>
//                       <Form.Control
//                         size="sm"
//                         value={row.isbn}
//                         onChange={(e) => handleMultiRowChange(index, "isbn", e.target.value)}
//                         placeholder="Enter ISBN"
//                         style={{ border: "1px solid #ced4da", borderRadius: "4px" }}
//                       />
//                     </td>
//                     <td style={{ padding: "12px", verticalAlign: "middle" }}>
//                       <Form.Control
//                         size="sm"
//                         type="number"
//                         min="1"
//                         value={row.total_copies}
//                         onChange={(e) => handleMultiRowChange(index, "total_copies", parseInt(e.target.value) || 1)}
//                         style={{ border: "1px solid #ced4da", borderRadius: "4px" }}
//                       />
//                     </td>
//                     <td style={{ padding: "12px", verticalAlign: "middle" }}>
//                       <Form.Control
//                         size="sm"
//                         type="number"
//                         min="0"
//                         value={row.available_copies}
//                         onChange={(e) => handleMultiRowChange(index, "available_copies", parseInt(e.target.value) || 0)}
//                         style={{ border: "1px solid #ced4da", borderRadius: "4px" }}
//                       />
//                     </td>
//                     <td style={{ padding: "12px", verticalAlign: "middle", textAlign: "center" }}>
//                       {multiInsertRows.length > 1 && (
//                         <Button
//                           variant="link"
//                           size="sm"
//                           onClick={() => handleRemoveMultiRow(index)}
//                           style={{ color: "#dc3545", padding: "4px 8px" }}
//                           title="Remove Row"
//                         >
//                           <i className="fa-solid fa-trash"></i>
//                         </Button>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </Table>
//           </div>
//         </Modal.Body>
//         <Modal.Footer style={{ borderTop: "1px solid #e9ecef", padding: "16px 24px", justifyContent: "flex-end", gap: "10px" }}>
//           <Button
//             variant="secondary"
//             onClick={() => {
//               setShowBulkInsertModal(false);
//               setBulkInsertData([]);
//               setMultiInsertRows([{ title: "", author_id: "", category_id: "", isbn: "", total_copies: 1, available_copies: 1 }]);
//             }}
//             style={{
//               background: "white",
//               border: "1px solid #6f42c1",
//               color: "#6f42c1",
//               padding: "8px 20px",
//               borderRadius: "6px",
//               fontWeight: "500"
//             }}
//           >
//             Cancel
//           </Button>
//           <Button
//             variant="primary"
//             onClick={handleMultiInsertSave}
//             disabled={loading || multiInsertRows.filter(r => r.title || r.isbn).length === 0}
//             style={{
//               background: loading ? "#6c757d" : "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
//               border: "none",
//               color: "white",
//               padding: "8px 24px",
//               borderRadius: "6px",
//               fontWeight: "500"
//             }}
//           >
//             {loading ? "Inserting..." : `Insert ${multiInsertRows.filter(r => r.title || r.isbn).length} Book${multiInsertRows.filter(r => r.title || r.isbn).length !== 1 ? 's' : ''}`}
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </Container>
//   );
// };

// export default Books;


// pages/Books.js
// pages/Books.js// pages/Books.js
// pages/Books.js
// pages/Books.js - CORRECTED
import React from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getBooksConfig } from "./bookconfig";
import { useDataManager } from "../common/userdatamanager";

const Books = (props) => {
  // Pehle config lo WITHOUT data
  const baseConfig = getBooksConfig();
  
  // Phir data fetch karo
  const { data, loading, error } = useDataManager(
    baseConfig.dataDependencies, 
    props  // Direct props pass karo
  );

  if (loading) {
    return <div>Loading books data...</div>;
  }

  // Ab data ke saath config banayo
  const finalConfig = getBooksConfig(data, props);

  return <DynamicCRUD {...finalConfig} />;
};

export default Books;