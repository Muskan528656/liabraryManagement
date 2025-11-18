// import React, { useState, useEffect, useRef } from "react";
// import { Modal, Button, Form, InputGroup, Alert } from "react-bootstrap";
// import { useNavigate } from "react-router-dom";
// import DataApi from "../../api/dataApi";
// import PubSub from "pubsub-js";

// const UniversalBarcodeScanner = () => {
//     const [showModal, setShowModal] = useState(false);
//     const [scanning, setScanning] = useState(false);
//     const [barcodeInput, setBarcodeInput] = useState("");
//     const [detectedData, setDetectedData] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const navigate = useNavigate();
//     const inputRef = useRef(null);

//     // Listen for global scan trigger
//     useEffect(() => {
//         const token = PubSub.subscribe("OPEN_BARCODE_SCANNER", () => {
//             setShowModal(true);
//             setBarcodeInput("");
//             setDetectedData(null);
//         });

//         return () => {
//             PubSub.unsubscribe(token);
//         };
//     }, []);

//     // Focus input when modal opens
//     useEffect(() => {
//         if (showModal && inputRef.current) {
//             setTimeout(() => {
//                 inputRef.current?.focus();
//             }, 100);
//         }
//     }, [showModal]);

//     const handleBarcodeInput = (value) => {
//         setBarcodeInput(value);
//         if (value.length > 3) {
//             // Auto-detect when barcode is entered
//             detectAndProcessBarcode(value);
//         }
//     };

//     const detectAndProcessBarcode = async (barcode) => {
//         if (!barcode || barcode.trim().length === 0) return;

//         setLoading(true);
//         try {
//             // Try to detect what type of data this is
//             const detectedType = await detectDataType(barcode.trim());
//             console.log("=>>>>>>>>>>>>>>>>>>>>>>>>>", detectedType);
//             setDetectedData(detectedType);
//         } catch (error) {
//             console.error("Error detecting barcode data:", error);
//             PubSub.publish("RECORD_ERROR_TOAST", {
//                 message: "Failed to process barcode data",
//             });
//         } finally {
//             setLoading(false);
//         }
//     };

//     const detectDataType = async (barcode) => {
//         // Try to parse as JSON first
//         try {
//             const jsonData = JSON.parse(barcode);
//             const result = await analyzeJsonData(jsonData);
//             if (result) return result;
//         } catch (e) {
//             // Not JSON, try other formats
//         }

//         // Check if it contains email (supplier data)
//         if (barcode.includes("@") && barcode.includes(".")) {
//             const parts = barcode.split(/\s+/);
//             const emailPart = parts.find(p => p.includes("@"));
//             const namePart = parts.filter(p => !p.includes("@")).join(" ");
//             return {
//                 type: "supplier",
//                 data: {
//                     name: namePart || "Supplier",
//                     email: emailPart || "",
//                 },
//                 module: "/supplier",
//             };
//         }

//         // Try ISBN format (usually 10 or 13 digits, may have dashes)
//         const isbnMatch = barcode.match(/^(\d{10,13}|\d{3}-\d{10}|\d{13})$/);
//         if (isbnMatch) {
//             const isbn = barcode.replace(/-/g, "");
//             // Fetch book data from external API
//             const bookData = await fetchBookByISBN(isbn);

//             // Create author and category if they exist, and get their IDs
//             if (bookData.author_name) {
//                 const authorId = await findOrCreateAuthor(bookData.author_name, bookData.author_details);
//                 if (authorId) {
//                     bookData.author_id = authorId;
//                 }
//             }

//             if (bookData.category_name) {
//                 const categoryId = await findOrCreateCategory(bookData.category_name, bookData.category_description);
//                 if (categoryId) {
//                     bookData.category_id = categoryId;
//                 }
//             }

//             // Clean up temporary fields before setting in detectedData
//             const cleanedBookData = { ...bookData };
//             delete cleanedBookData.author_details;
//             delete cleanedBookData.category_description;
//             delete cleanedBookData.description;

//             return {
//                 type: "book",
//                 data: cleanedBookData,
//                 module: "/books",
//             };
//         }

//         // Check for phone number pattern (supplier)
//         if (/^\+?[\d\s-()]{10,}$/.test(barcode) && barcode.length >= 10) {
//             return {
//                 type: "supplier",
//                 data: { phone: barcode.trim() },
//                 module: "/supplier",
//             };
//         }

//         // Try to check if it's an author name (text only, 2+ words or single word 3+ chars)
//         if (/^[A-Za-z\s.]+$/.test(barcode) && (barcode.split(/\s+/).length >= 2 || barcode.length >= 3)) {
//             // Check if it looks like a name (has spaces or is capitalized)
//             const words = barcode.trim().split(/\s+/);
//             if (words.length >= 1 && words.every(w => w.length >= 2)) {
//                 return {
//                     type: "author",
//                     data: { name: barcode.trim() },
//                     module: "/author",
//                 };
//             }
//         }

//         // Try to check if it's a category (single word, 3+ chars, no numbers)
//         if (/^[A-Za-z]+$/.test(barcode) && barcode.length >= 3 && barcode.length <= 30) {
//             return {
//                 type: "category",
//                 data: { name: barcode.trim() },
//                 module: "/category",
//             };
//         }

//         // Try to check if it's a supplier name (contains alphanumeric, may have special chars)
//         if (/^[A-Za-z0-9\s&.,-]+$/.test(barcode) && barcode.length > 2) {
//             // Check if it contains supplier keywords
//             const supplierKeywords = ["supplier", "vendor", "distributor", "company", "ltd", "inc", "corp"];
//             const lowerBarcode = barcode.toLowerCase();
//             if (supplierKeywords.some((keyword) => lowerBarcode.includes(keyword))) {
//                 return {
//                     type: "supplier",
//                     data: { name: barcode.trim() },
//                     module: "/supplier",
//                 };
//             }
//         }

//         // If contains numbers and text, might be book title with ISBN
//         if (/\d/.test(barcode) && /[A-Za-z]/.test(barcode)) {
//             // Try to extract ISBN
//             const isbnMatch = barcode.match(/\d{10,13}/);
//             if (isbnMatch) {
//                 const isbn = isbnMatch[0];
//                 const title = barcode.replace(/\d{10,13}/, "").trim();
//                 // Fetch book data from external API
//                 const bookData = await fetchBookByISBN(isbn);
//                 // Merge with extracted title if available
//                 if (title && !bookData.title) {
//                     bookData.title = title;
//                 }

//                 // Create author and category if they exist, and get their IDs
//                 if (bookData.author_name) {
//                     const authorId = await findOrCreateAuthor(bookData.author_name, bookData.author_details);
//                     if (authorId) {
//                         bookData.author_id = authorId;
//                     }
//                 }

//                 if (bookData.category_name) {
//                     const categoryId = await findOrCreateCategory(bookData.category_name, bookData.category_description);
//                     if (categoryId) {
//                         bookData.category_id = categoryId;
//                     }
//                 }

//                 // Clean up temporary fields before setting in detectedData
//                 const cleanedBookData = { ...bookData };
//                 delete cleanedBookData.author_details;
//                 delete cleanedBookData.category_description;
//                 delete cleanedBookData.description;

//                 return {
//                     type: "book",
//                     data: cleanedBookData,
//                     module: "/books",
//                 };
//             }
//         }

//         // Default: try as book (might be title)
//         if (barcode.length > 3) {
//             return {
//                 type: "book",
//                 data: { title: barcode.trim() },
//                 module: "/books",
//             };
//         }

//         return null;
//     };

//     // Find or create author and return its ID
//     const findOrCreateAuthor = async (authorName, authorDetails = null) => {
//         try {
//             const authorApi = new DataApi("author");
//             const authorsResponse = await authorApi.fetchAll();

//             if (authorsResponse.data && Array.isArray(authorsResponse.data)) {
//                 // Split multiple authors (comma-separated) and use first one
//                 const authorNames = authorName.split(",").map(a => a.trim());
//                 const primaryAuthorName = authorNames[0];

//                 // Try to find existing author by name
//                 let foundAuthor = authorsResponse.data.find(a =>
//                     a.name && a.name.toLowerCase() === primaryAuthorName.toLowerCase()
//                 );

//                 if (!foundAuthor) {
//                     // Create new author with all available details
//                     const authorData = {
//                         name: primaryAuthorName,
//                         email: authorDetails?.email || "",
//                         bio: authorDetails?.bio || (authorDetails?.fullData?.bio ?
//                             (typeof authorDetails.fullData.bio === "string"
//                                 ? authorDetails.fullData.bio
//                                 : authorDetails.fullData.bio.value || "")
//                             : "")
//                     };

//                     const newAuthorResponse = await authorApi.create(authorData);
//                     if (newAuthorResponse.data && newAuthorResponse.data.success) {
//                         foundAuthor = newAuthorResponse.data.data;
//                         PubSub.publish("RECORD_SAVED_TOAST", {
//                             message: `Author "${primaryAuthorName}" created successfully`,
//                         });
//                     }
//                 } else {
//                     // Update existing author if we have more details
//                     if (authorDetails && (authorDetails.email || authorDetails.bio)) {
//                         const updateData = {};
//                         if (authorDetails.email && !foundAuthor.email) {
//                             updateData.email = authorDetails.email;
//                         }
//                         if (authorDetails.bio && !foundAuthor.bio) {
//                             updateData.bio = authorDetails.bio;
//                         }
//                         if (Object.keys(updateData).length > 0) {
//                             try {
//                                 await authorApi.update({ ...foundAuthor, ...updateData }, foundAuthor.id);
//                             } catch (e) {
//                                 console.log("Could not update author details:", e);
//                             }
//                         }
//                     }
//                 }

//                 if (foundAuthor) {
//                     return foundAuthor.id;
//                 }
//             }
//         } catch (error) {
//             console.error("Error finding/creating author:", error);
//         }
//         return null;
//     };

//     // Find or create category and return its ID
//     const findOrCreateCategory = async (categoryName, categoryDescription = null) => {
//         try {
//             const categoryApi = new DataApi("category");
//             const categoriesResponse = await categoryApi.fetchAll();

//             if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
//                 // Try to find existing category by name
//                 let foundCategory = categoriesResponse.data.find(c =>
//                     c.name && c.name.toLowerCase() === categoryName.toLowerCase()
//                 );

//                 if (!foundCategory) {
//                     // Create new category with description if available
//                     const categoryData = {
//                         name: categoryName,
//                         description: categoryDescription || ""
//                     };

//                     const newCategoryResponse = await categoryApi.create(categoryData);
//                     if (newCategoryResponse.data && newCategoryResponse.data.success) {
//                         foundCategory = newCategoryResponse.data.data;
//                         PubSub.publish("RECORD_SAVED_TOAST", {
//                             message: `Category "${categoryName}" created successfully`,
//                         });
//                     }
//                 } else {
//                     // Update existing category if we have description and it's missing
//                     if (categoryDescription && !foundCategory.description) {
//                         try {
//                             await categoryApi.update({ ...foundCategory, description: categoryDescription }, foundCategory.id);
//                         } catch (e) {
//                             console.log("Could not update category description:", e);
//                         }
//                     }
//                 }

//                 if (foundCategory) {
//                     return foundCategory.id;
//                 }
//             }
//         } catch (error) {
//             console.error("Error finding/creating category:", error);
//         }
//         return null;
//     };

//     // Fetch book data from external API using ISBN
//     const fetchBookByISBN = async (isbn) => {
//         try {
//             // Try Open Library API first
//             const openLibraryUrl = `https://openlibrary.org/isbn/${isbn}.json`;
//             const response = await fetch(openLibraryUrl);

//             if (response.ok) {
//                 const data = await response.json();
//                 const bookData = {
//                     isbn: isbn,
//                     title: data.title || "",
//                     total_copies: 1,
//                     available_copies: 1,
//                 };

//                 // Try to get author names and details
//                 if (data.authors && data.authors.length > 0) {
//                     try {
//                         const authorPromises = data.authors.slice(0, 3).map(async (author) => {
//                             const authorKey = author.key || author;
//                             const authorUrl = `https://openlibrary.org${authorKey}.json`;
//                             const authorResponse = await fetch(authorUrl);
//                             if (authorResponse.ok) {
//                                 const authorData = await authorResponse.json();
//                                 return {
//                                     name: authorData.name || "",
//                                     bio: authorData.bio ? (typeof authorData.bio === "string" ? authorData.bio : authorData.bio.value || "") : "",
//                                     email: authorData.email || "",
//                                     // Store full author data for later use
//                                     fullData: authorData
//                                 };
//                             }
//                             return { name: "", bio: "", email: "", fullData: null };
//                         });
//                         const authorDetails = await Promise.all(authorPromises);
//                         const validAuthors = authorDetails.filter(a => a.name);
//                         if (validAuthors.length > 0) {
//                             bookData.author_name = validAuthors.map(a => a.name).join(", ");
//                             // Store first author's details for creation
//                             bookData.author_details = validAuthors[0];
//                         }
//                     } catch (e) {
//                         console.log("Could not fetch author details:", e);
//                     }
//                 }

//                 // Try to get subject/category from Open Library
//                 if (data.subjects && data.subjects.length > 0) {
//                     // Use first subject as category, clean it up
//                     const subject = data.subjects[0];
//                     // Remove common prefixes and clean the category name
//                     const categoryName = subject
//                         .replace(/^Fiction\s*[-–—]\s*/i, "")
//                         .replace(/^Non-fiction\s*[-–—]\s*/i, "")
//                         .split(",")[0]
//                         .trim();
//                     bookData.category_name = categoryName;
//                     // Store category description (can use subject as description)
//                     bookData.category_description = subject;
//                 }

//                 // Also try to get from subject_places or subject_people if available
//                 if (!bookData.category_name && data.subject_places && data.subject_places.length > 0) {
//                     bookData.category_name = data.subject_places[0];
//                     bookData.category_description = data.subject_places.join(", ");
//                 }

//                 // Try subject_people as fallback
//                 if (!bookData.category_name && data.subject_people && data.subject_people.length > 0) {
//                     bookData.category_name = data.subject_people[0];
//                     bookData.category_description = data.subject_people.join(", ");
//                 }

//                 return bookData;
//             }
//         } catch (error) {
//             console.log("Open Library API failed, trying Google Books API:", error);
//         }

//         // Fallback to Google Books API
//         try {
//             const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
//             const response = await fetch(googleBooksUrl);

//             if (response.ok) {
//                 const data = await response.json();
//                 if (data.items && data.items.length > 0) {
//                     const volumeInfo = data.items[0].volumeInfo;
//                     const bookData = {
//                         isbn: isbn,
//                         title: volumeInfo.title || "",
//                         total_copies: 1,
//                         available_copies: 1,
//                     };

//                     // Get authors (Google Books doesn't provide detailed author info, just names)
//                     if (volumeInfo.authors && volumeInfo.authors.length > 0) {
//                         bookData.author_name = volumeInfo.authors.join(", ");
//                         // Store first author name for creation (email/bio not available from Google Books)
//                         bookData.author_details = {
//                             name: volumeInfo.authors[0],
//                             bio: "",
//                             email: "",
//                             fullData: null
//                         };
//                     }

//                     // Get categories from Google Books
//                     if (volumeInfo.categories && volumeInfo.categories.length > 0) {
//                         // Use first category, clean it up
//                         const category = volumeInfo.categories[0];
//                         const categoryName = category
//                             .split("/")[0] // Take first part if separated by /
//                             .split(",")[0] // Take first part if separated by comma
//                             .trim();
//                         bookData.category_name = categoryName;
//                         // Use category as description
//                         bookData.category_description = category;
//                     }

//                     // Also try to get from subject if categories not available
//                     if (!bookData.category_name && volumeInfo.subject) {
//                         const subjects = Array.isArray(volumeInfo.subject)
//                             ? volumeInfo.subject
//                             : volumeInfo.subject.split(",");
//                         if (subjects.length > 0) {
//                             const subjectName = subjects[0]
//                                 .split("/")[0]
//                                 .trim();
//                             bookData.category_name = subjectName;
//                             bookData.category_description = Array.isArray(volumeInfo.subject)
//                                 ? volumeInfo.subject.join(", ")
//                                 : volumeInfo.subject;
//                         }
//                     }

//                     // Get description
//                     if (volumeInfo.description) {
//                         bookData.description = volumeInfo.description;
//                     }

//                     return bookData;
//                 }
//             }
//         } catch (error) {
//             console.log("Google Books API also failed:", error);
//         }

//         // If both APIs fail, return basic data with ISBN (don't put ISBN in title)
//         return {
//             isbn: isbn,
//             title: "", // Keep title empty, don't use ISBN as title
//             total_copies: 1,
//             available_copies: 1,
//         };
//     };

//     const analyzeJsonData = async (data) => {
//         if (!data || typeof data !== "object") return null;

//         // Check for book data (highest priority if has ISBN or title)
//         if (data.isbn || data.title || data.bookTitle || data.book_title) {
//             let bookData = {
//                 title: data.title || data.bookTitle || data.book_title || "",
//                 isbn: data.isbn || data.ISBN || "",
//                 author_id: data.author_id || data.authorId || "",
//                 category_id: data.category_id || data.categoryId || "",
//                 total_copies: data.total_copies || data.totalCopies || 1,
//                 available_copies: data.available_copies || data.availableCopies || 1,
//             };

//             // If ISBN is provided but no title, try to fetch from API
//             if (bookData.isbn && !bookData.title) {
//                 const fetchedData = await fetchBookByISBN(bookData.isbn);
//                 bookData = { ...fetchedData, ...bookData };
//             }

//             return {
//                 type: "book",
//                 data: bookData,
//                 module: "/books",
//             };
//         }

//         // Check for author data
//         if (data.authorName || data.author_name || (data.name && !data.email && !data.phone)) {
//             // If it has name but no email/phone, likely author
//             if (!data.email && !data.phone && !data.address) {
//                 return {
//                     type: "author",
//                     data: {
//                         name: data.name || data.authorName || data.author_name || data.author || "",
//                     },
//                     module: "/author",
//                 };
//             }
//         }

//         // Check for supplier data (has email or phone)
//         if (data.supplierName || data.supplier_name || data.supplier || (data.name && (data.email || data.phone))) {
//             return {
//                 type: "supplier",
//                 data: {
//                     name: data.name || data.supplierName || data.supplier_name || data.supplier || "",
//                     email: data.email || "",
//                     phone: data.phone || "",
//                     address: data.address || "",
//                 },
//                 module: "/supplier",
//             };
//         }

//         // Check for category data
//         if (data.category || data.categoryName || data.category_name) {
//             return {
//                 type: "category",
//                 data: {
//                     name: data.category || data.categoryName || data.category_name || "",
//                 },
//                 module: "/category",
//             };
//         }

//         // If just has name, try to determine by context
//         if (data.name) {
//             // If name is short and single word, might be category
//             if (data.name.split(/\s+/).length === 1 && data.name.length <= 30) {
//                 return {
//                     type: "category",
//                     data: { name: data.name },
//                     module: "/category",
//                 };
//             }
//             // Otherwise, try author
//             return {
//                 type: "author",
//                 data: { name: data.name },
//                 module: "/author",
//             };
//         }

//         return null;
//     };

//     const handleInsert = async () => {
//         if (!detectedData) {
//             PubSub.publish("RECORD_ERROR_TOAST", {
//                 message: "No data detected to insert",
//             });
//             return;
//         }

//         setLoading(true);
//         try {
//             // Prepare data with defaults for missing required fields (for barcode scanning)
//             let dataToInsert = { ...detectedData.data };

//             // Add default values for missing required fields based on type
//             if (detectedData.type === "book") {
//                 // Books require: title, author_id, category_id, isbn
//                 // Author and category are already created during ISBN fetch, so IDs should be available

//                 // Don't use ISBN as title - keep them separate
//                 if (!dataToInsert.title) {
//                     // Only set default title if ISBN is not available, otherwise leave empty
//                     dataToInsert.title = dataToInsert.isbn ? "" : "Scanned Book";
//                 }
//                 // Ensure ISBN is set (use scanned ISBN or generate one)
//                 if (!dataToInsert.isbn) {
//                     dataToInsert.isbn = `SCAN-${Date.now()}`;
//                 }
//                 if (!dataToInsert.author_id) dataToInsert.author_id = null; // Allow null
//                 if (!dataToInsert.category_id) dataToInsert.category_id = null; // Allow null
//                 if (!dataToInsert.total_copies) dataToInsert.total_copies = 1;
//                 if (!dataToInsert.available_copies) dataToInsert.available_copies = 1;

//                 // Remove temporary fields (author_name and category_name should already be converted to IDs)
//                 delete dataToInsert.author_name;
//                 delete dataToInsert.category_name;
//                 delete dataToInsert.description;
//                 delete dataToInsert.author_details; // Remove author_details object
//                 delete dataToInsert.category_description; // Remove category_description
//             } else if (detectedData.type === "author") {
//                 // Authors require: name
//                 if (!dataToInsert.name) dataToInsert.name = "Scanned Author";
//             } else if (detectedData.type === "category") {
//                 // Categories require: name
//                 if (!dataToInsert.name) dataToInsert.name = "Scanned Category";
//             } else if (detectedData.type === "supplier") {
//                 // Suppliers might require: name
//                 if (!dataToInsert.name) dataToInsert.name = dataToInsert.email || dataToInsert.phone || "Scanned Supplier";
//                 // Ensure contact_info is properly formatted
//                 if (!dataToInsert.contact_info && (dataToInsert.email || dataToInsert.phone || dataToInsert.address)) {
//                     dataToInsert.contact_info = {
//                         email: dataToInsert.email || "",
//                         phone: dataToInsert.phone || "",
//                         address: dataToInsert.address || ""
//                     };
//                 }
//             }

//             const api = new DataApi(detectedData.type);
//             const response = await api.create(dataToInsert);

//             if (response.data && response.data.success) {
//                 PubSub.publish("RECORD_SAVED_TOAST", {
//                     message: `${detectedData.type.charAt(0).toUpperCase() + detectedData.type.slice(1)} added successfully`,
//                 });
//                 setShowModal(false);
//                 setBarcodeInput("");
//                 setDetectedData(null);
//                 // Navigate to the module
//                 navigate(detectedData.module);
//             } else {
//                 const errorMsg = Array.isArray(response.data?.errors)
//                     ? response.data.errors.map((e) => e.msg || e).join(", ")
//                     : response.data?.errors || "Failed to insert";
//                 PubSub.publish("RECORD_ERROR_TOAST", {
//                     message: errorMsg,
//                 });
//             }
//         } catch (error) {
//             console.error("Error inserting data:", error);
//             const errorMsg =
//                 error.response?.data?.errors
//                     ? Array.isArray(error.response.data.errors)
//                         ? error.response.data.errors.map((e) => e.msg || e).join(", ")
//                         : error.response.data.errors
//                     : error.message || "Failed to insert";
//             PubSub.publish("RECORD_ERROR_TOAST", {
//                 message: errorMsg,
//             });
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleManualInput = () => {
//         if (barcodeInput.trim()) {
//             detectAndProcessBarcode(barcodeInput.trim());
//         }
//     };

//     return (
//         <>
//             {/* Floating Scan Button */}
//             <Button
//                 onClick={() => setShowModal(true)}
//                 className="shadow-lg"
//                 style={{
//                     position: "fixed",
//                     bottom: "100px",
//                     right: "20px",
//                     zIndex: 1000,
//                     width: "64px",
//                     height: "64px",
//                     borderRadius: "50%",
//                     background: "linear-gradient(135deg, #e9d5ff 0%, #f3e8ff 100%)",
//                     border: "2px solid #8b5cf6",
//                     boxShadow: "0 4px 16px rgba(139, 92, 246, 0.3)",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     transition: "all 0.3s ease",
//                 }}
//                 onMouseEnter={(e) => {
//                     e.currentTarget.style.transform = "scale(1.1)";
//                     e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 92, 246, 0.4)";
//                     e.currentTarget.style.borderColor = "#6f42c1";
//                 }}
//                 onMouseLeave={(e) => {
//                     e.currentTarget.style.transform = "scale(1)";
//                     e.currentTarget.style.boxShadow = "0 4px 16px rgba(139, 92, 246, 0.3)";
//                     e.currentTarget.style.borderColor = "#8b5cf6";
//                 }}
//                 title="Scan Barcode - Universal Scanner"
//             >
//                 <i className="fa-solid fa-barcode" style={{ fontSize: "26px", color: "#6f42c1" }}></i>
//             </Button>

//             {/* Scanner Modal */}
//             <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
//                 <Modal.Header
//                     closeButton
//                     style={{
//                         background: "linear-gradient(135deg, #e9d5ff 0%, #f3e8ff 100%)",
//                         borderBottom: "none",
//                         borderRadius: "8px 8px 0 0"
//                     }}
//                 >
//                     <Modal.Title style={{ color: "#6f42c1", fontWeight: "600" }}>
//                         <i className="fa-solid fa-barcode me-2"></i>Universal Barcode Scanner
//                     </Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body style={{ padding: "24px" }}>
//                     <div className="mb-4">
//                         <Form.Label style={{ fontWeight: "500", color: "#333", marginBottom: "10px", fontSize: "14px" }}>
//                             <i className="fa-solid fa-qrcode me-2" style={{ color: "#8b5cf6" }}></i>Scan or Enter Barcode/Data
//                         </Form.Label>
//                         <InputGroup>
//                             <InputGroup.Text style={{ background: "#e9d5ff", borderColor: "#e9ecef" }}>
//                                 <i className="fa-solid fa-barcode" style={{ color: "#6f42c1" }}></i>
//                             </InputGroup.Text>
//                             <Form.Control
//                                 ref={inputRef}
//                                 type="text"
//                                 placeholder="Scan barcode, enter ISBN, author name, supplier info, or paste JSON data..."
//                                 value={barcodeInput}
//                                 onChange={(e) => handleBarcodeInput(e.target.value)}
//                                 onKeyPress={(e) => {
//                                     if (e.key === "Enter") {
//                                         handleManualInput();
//                                     }
//                                 }}
//                                 style={{
//                                     borderColor: "#e9ecef",
//                                     borderRadius: "0",
//                                     fontSize: "14px",
//                                     padding: "10px 12px"
//                                 }}
//                                 onFocus={(e) => e.target.style.borderColor = "#8b5cf6"}
//                                 onBlur={(e) => e.target.style.borderColor = "#e9ecef"}
//                                 autoFocus
//                             />
//                             <Button
//                                 variant="outline-primary"
//                                 onClick={handleManualInput}
//                                 disabled={!barcodeInput.trim() || loading}
//                                 style={{
//                                     borderColor: "#8b5cf6",
//                                     color: "#6f42c1",
//                                     background: "#e9d5ff"
//                                 }}
//                             >
//                                 <i className="fa-solid fa-search"></i>
//                             </Button>
//                         </InputGroup>
//                         <Form.Text className="text-muted" style={{ fontSize: "12px", marginTop: "6px", display: "block" }}>
//                             <i className="fa-solid fa-info-circle me-1"></i>
//                             Enter barcode code, ISBN, author name, supplier info, or paste JSON data. The system will auto-detect the type and route to the appropriate module.
//                         </Form.Text>
//                     </div>

//                     {loading && (
//                         <Alert
//                             variant="info"
//                             className="text-center"
//                             style={{
//                                 background: "#e9d5ff",
//                                 borderColor: "#8b5cf6",
//                                 color: "#6f42c1",
//                                 borderRadius: "8px",
//                                 padding: "16px"
//                             }}
//                         >
//                             <i className="fa-solid fa-spinner fa-spin me-2"></i>
//                             <strong>
//                                 {barcodeInput.match(/^\d{10,13}$/) || barcodeInput.match(/^\d{3}-\d{10}$/) || barcodeInput.match(/^\d{13}$/)
//                                     ? "Fetching book data from ISBN..."
//                                     : "Detecting data type..."}
//                             </strong>
//                         </Alert>
//                     )}

//                     {detectedData && !loading && (
//                         <Alert
//                             variant="success"
//                             style={{
//                                 background: "#C8E6C9",
//                                 borderColor: "#2E7D32",
//                                 color: "#2E7D32",
//                                 borderRadius: "8px",
//                                 padding: "16px"
//                             }}
//                         >
//                             <div className="d-flex align-items-center mb-3">
//                                 <div
//                                     style={{
//                                         width: "40px",
//                                         height: "40px",
//                                         borderRadius: "50%",
//                                         background: "#2E7D32",
//                                         display: "flex",
//                                         alignItems: "center",
//                                         justifyContent: "center",
//                                         marginRight: "12px"
//                                     }}
//                                 >
//                                     <i className="fa-solid fa-circle-check" style={{ fontSize: "20px", color: "white" }}></i>
//                                 </div>
//                                 <div>
//                                     <strong style={{ fontSize: "16px" }}>
//                                         Data Detected: {detectedData.type.charAt(0).toUpperCase() + detectedData.type.slice(1)}
//                                     </strong>
//                                     <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "2px" }}>
//                                         Will be inserted into <strong>{detectedData.module}</strong> module
//                                     </div>
//                                 </div>
//                             </div>
//                             <div className="mt-3" style={{ background: "white", padding: "12px", borderRadius: "6px" }}>
//                                 <strong style={{ fontSize: "14px", color: "#2E7D32" }}>Detected Fields:</strong>
//                                 <div className="mt-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
//                                     {Object.entries(detectedData.data).filter(([_, value]) => value).map(([key, value]) => (
//                                         <div key={key} style={{ fontSize: "13px" }}>
//                                             <span style={{ fontWeight: "600", color: "#2E7D32" }}>
//                                                 {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}:
//                                             </span>{" "}
//                                             <span style={{ color: "#333" }}>{value}</span>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         </Alert>
//                     )}

//                     {!detectedData && barcodeInput.length > 3 && !loading && (
//                         <Alert
//                             variant="warning"
//                             style={{
//                                 background: "#fff3cd",
//                                 borderColor: "#ff9800",
//                                 color: "#856404",
//                                 borderRadius: "8px",
//                                 padding: "16px"
//                             }}
//                         >
//                             <div className="d-flex align-items-center">
//                                 <i className="fa-solid fa-exclamation-triangle me-2" style={{ fontSize: "18px" }}></i>
//                                 <div>
//                                     <strong>Could not detect data type.</strong>
//                                     <div style={{ fontSize: "12px", marginTop: "4px" }}>
//                                         Please check the barcode format or try manual entry. Supported formats: ISBN, Author Name, Supplier Info, or JSON data.
//                                     </div>
//                                 </div>
//                             </div>
//                         </Alert>
//                     )}
//                 </Modal.Body>
//                 <Modal.Footer style={{ borderTop: "1px solid #e9ecef", padding: "16px 24px" }}>
//                     <Button
//                         variant="outline-secondary"
//                         onClick={() => {
//                             setShowModal(false);
//                             setBarcodeInput("");
//                             setDetectedData(null);
//                         }}
//                         style={{
//                             borderColor: "#8b5cf6",
//                             color: "#6f42c1",
//                             background: "white",
//                             padding: "8px 20px",
//                             borderRadius: "6px"
//                         }}
//                     >
//                         Cancel
//                     </Button>
//                     <Button
//                         onClick={handleInsert}
//                         disabled={!detectedData || loading}
//                         style={{
//                             background: detectedData && !loading
//                                 ? "linear-gradient(135deg, #e9d5ff 0%, #f3e8ff 100%)"
//                                 : "#ccc",
//                             border: detectedData && !loading ? "2px solid #8b5cf6" : "none",
//                             color: detectedData && !loading ? "#6f42c1" : "#999",
//                             padding: "8px 24px",
//                             borderRadius: "6px",
//                             fontWeight: "500"
//                         }}
//                     >
//                         {loading ? (
//                             <>
//                                 <span className="spinner-border spinner-border-sm me-2"></span>
//                                 Processing...
//                             </>
//                         ) : (
//                             <>
//                                 <i className="fa-solid fa-plus me-2"></i>
//                                 Insert into {detectedData?.type?.charAt(0).toUpperCase() + detectedData?.type?.slice(1) || "Module"}
//                             </>
//                         )}
//                     </Button>
//                 </Modal.Footer>
//             </Modal>
//         </>
//     );
// };

// export default UniversalBarcodeScanner;



import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form, InputGroup, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import DataApi from "../../api/dataApi";
import PubSub from "pubsub-js";

const UniversalBarcodeScanner = () => {
    const [showModal, setShowModal] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [barcodeInput, setBarcodeInput] = useState("");
    const [detectedData, setDetectedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const inputRef = useRef(null);

    // Listen for global scan trigger
    useEffect(() => {
        const token = PubSub.subscribe("OPEN_BARCODE_SCANNER", () => {
            setShowModal(true);
            setBarcodeInput("");
            setDetectedData(null);
        });

        return () => {
            PubSub.unsubscribe(token);
        };
    }, []);

    // Focus input when modal opens
    useEffect(() => {
        if (showModal && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [showModal]);

    const handleBarcodeInput = (value) => {
        setBarcodeInput(value);
        // Remove auto-detect on input to prevent premature detection
    };

    // Improved ISBN validation function
    const isValidISBN = (isbn) => {
        if (!isbn) return false;

        // Clean the ISBN - remove all non-digit characters except X (for ISBN-10)
        const cleanIsbn = isbn.replace(/[^\dX]/gi, '').toUpperCase();

        // Check for ISBN-10 (10 digits, last character can be X)
        if (cleanIsbn.length === 10) {
            const isbn10Regex = /^[\d]{9}[\dX]$/;
            if (isbn10Regex.test(cleanIsbn)) {
                return { type: 'isbn10', value: cleanIsbn };
            }
        }

        // Check for ISBN-13 (exactly 13 digits)
        if (cleanIsbn.length === 13) {
            const isbn13Regex = /^[\d]{13}$/;
            if (isbn13Regex.test(cleanIsbn)) {
                return { type: 'isbn13', value: cleanIsbn };
            }
        }

        return false;
    };

    const detectAndProcessBarcode = async (barcode) => {
        if (!barcode || barcode.trim().length === 0) return;

        setLoading(true);
        try {
            // Try to detect what type of data this is
            const detectedType = await detectDataType(barcode.trim());
            console.log("Detected data type:", detectedType);
            setDetectedData(detectedType);
        } catch (error) {
            console.error("Error detecting barcode data:", error);
            PubSub.publish("RECORD_ERROR_TOAST", {
                message: "Failed to process barcode data",
            });
        } finally {
            setLoading(false);
        }
    };

    const detectDataType = async (barcode) => {
        console.log("Processing barcode:", barcode);

        // First, check if it's a valid ISBN (highest priority)
        const isbnCheck = isValidISBN(barcode);
        if (isbnCheck) {
            console.log("Valid ISBN detected:", isbnCheck);
            const isbn = isbnCheck.value;

            // Fetch book data from external API
            const bookData = await fetchBookByISBN(isbn);
            console.log("Fetched book data:", bookData);

            // Create author and category if they exist, and get their IDs
            if (bookData.author_name) {
                const authorId = await findOrCreateAuthor(bookData.author_name, bookData.author_details);
                if (authorId) {
                    bookData.author_id = authorId;
                }
            }

            if (bookData.category_name) {
                const categoryId = await findOrCreateCategory(bookData.category_name, bookData.category_description);
                if (categoryId) {
                    bookData.category_id = categoryId;
                }
            }

            // Clean up temporary fields before setting in detectedData
            const cleanedBookData = { ...bookData };
            delete cleanedBookData.author_details;
            delete cleanedBookData.category_description;
            delete cleanedBookData.description;

            return {
                type: "book",
                data: cleanedBookData,
                module: "/books",
            };
        }

        // Try to parse as JSON first
        try {
            const jsonData = JSON.parse(barcode);
            const result = await analyzeJsonData(jsonData);
            if (result) return result;
        } catch (e) {
            // Not JSON, try other formats
        }

        // Check if it contains email (supplier data)
        if (barcode.includes("@") && barcode.includes(".")) {
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
            const emailMatch = barcode.match(emailRegex);
            if (emailMatch) {
                const email = emailMatch[0];
                const name = barcode.replace(email, "").trim();
                return {
                    type: "supplier",
                    data: {
                        name: name || "Supplier",
                        email: email,
                    },
                    module: "/supplier",
                };
            }
        }

        // Check for phone number pattern (supplier)
        if (/^\+?[\d\s-()]{10,}$/.test(barcode) && barcode.length >= 10) {
            return {
                type: "supplier",
                data: { phone: barcode.trim() },
                module: "/supplier",
            };
        }

        // Try to check if it's an author name (text only, 2+ words or single word 3+ chars)
        if (/^[A-Za-z\s.]+$/.test(barcode) && (barcode.split(/\s+/).length >= 2 || barcode.length >= 3)) {
            // Check if it looks like a name (has spaces or is capitalized)
            const words = barcode.trim().split(/\s+/);
            if (words.length >= 1 && words.every(w => w.length >= 2)) {
                return {
                    type: "author",
                    data: { name: barcode.trim() },
                    module: "/author",
                };
            }
        }

        // Try to check if it's a category (single word, 3+ chars, no numbers)
        if (/^[A-Za-z]+$/.test(barcode) && barcode.length >= 3 && barcode.length <= 30) {
            return {
                type: "category",
                data: { name: barcode.trim() },
                module: "/category",
            };
        }

        // Try to check if it's a supplier name (contains alphanumeric, may have special chars)
        if (/^[A-Za-z0-9\s&.,-]+$/.test(barcode) && barcode.length > 2) {
            // Check if it contains supplier keywords
            const supplierKeywords = ["supplier", "vendor", "distributor", "company", "ltd", "inc", "corp"];
            const lowerBarcode = barcode.toLowerCase();
            if (supplierKeywords.some((keyword) => lowerBarcode.includes(keyword))) {
                return {
                    type: "supplier",
                    data: { name: barcode.trim() },
                    module: "/supplier",
                };
            }
        }

        // If contains numbers and text, might be book title with embedded ISBN
        if (/\d/.test(barcode) && /[A-Za-z]/.test(barcode)) {
            // Try to extract ISBN using improved validation
            const possibleIsbns = barcode.match(/[\dX]{10,13}/g);
            if (possibleIsbns) {
                for (const possibleIsbn of possibleIsbns) {
                    const isbnCheck = isValidISBN(possibleIsbn);
                    if (isbnCheck) {
                        const isbn = isbnCheck.value;
                        const title = barcode.replace(possibleIsbn, "").trim();

                        // Fetch book data from external API
                        const bookData = await fetchBookByISBN(isbn);

                        // Merge with extracted title if available
                        if (title && !bookData.title) {
                            bookData.title = title;
                        }

                        // Create author and category if they exist, and get their IDs
                        if (bookData.author_name) {
                            const authorId = await findOrCreateAuthor(bookData.author_name, bookData.author_details);
                            if (authorId) {
                                bookData.author_id = authorId;
                            }
                        }

                        if (bookData.category_name) {
                            const categoryId = await findOrCreateCategory(bookData.category_name, bookData.category_description);
                            if (categoryId) {
                                bookData.category_id = categoryId;
                            }
                        }

                        // Clean up temporary fields before setting in detectedData
                        const cleanedBookData = { ...bookData };
                        delete cleanedBookData.author_details;
                        delete cleanedBookData.category_description;
                        delete cleanedBookData.description;

                        return {
                            type: "book",
                            data: cleanedBookData,
                            module: "/books",
                        };
                    }
                }
            }
        }

        // Default: try as book (might be title)
        if (barcode.length > 3) {
            return {
                type: "book",
                data: { title: barcode.trim() },
                module: "/books",
            };
        }

        return null;
    };

    // Find or create author and return its ID
    const findOrCreateAuthor = async (authorName, authorDetails = null) => {
        try {
            const authorApi = new DataApi("author");
            const authorsResponse = await authorApi.fetchAll();

            if (authorsResponse.data && Array.isArray(authorsResponse.data)) {
                // Split multiple authors (comma-separated) and use first one
                const authorNames = authorName.split(",").map(a => a.trim());
                const primaryAuthorName = authorNames[0];

                // Try to find existing author by name
                let foundAuthor = authorsResponse.data.find(a =>
                    a.name && a.name.toLowerCase() === primaryAuthorName.toLowerCase()
                );

                if (!foundAuthor) {
                    // Create new author with all available details
                    const authorData = {
                        name: primaryAuthorName,
                        email: authorDetails?.email || "",
                        bio: authorDetails?.bio || (authorDetails?.fullData?.bio ?
                            (typeof authorDetails.fullData.bio === "string"
                                ? authorDetails.fullData.bio
                                : authorDetails.fullData.bio.value || "")
                            : "")
                    };

                    const newAuthorResponse = await authorApi.create(authorData);
                    if (newAuthorResponse.data && newAuthorResponse.data.success) {
                        foundAuthor = newAuthorResponse.data.data;
                        PubSub.publish("RECORD_SAVED_TOAST", {
                            message: `Author "${primaryAuthorName}" created successfully`,
                        });
                    }
                } else {
                    // Update existing author if we have more details
                    if (authorDetails && (authorDetails.email || authorDetails.bio)) {
                        const updateData = {};
                        if (authorDetails.email && !foundAuthor.email) {
                            updateData.email = authorDetails.email;
                        }
                        if (authorDetails.bio && !foundAuthor.bio) {
                            updateData.bio = authorDetails.bio;
                        }
                        if (Object.keys(updateData).length > 0) {
                            try {
                                await authorApi.update({ ...foundAuthor, ...updateData }, foundAuthor.id);
                            } catch (e) {
                                console.log("Could not update author details:", e);
                            }
                        }
                    }
                }

                if (foundAuthor) {
                    return foundAuthor.id;
                }
            }
        } catch (error) {
            console.error("Error finding/creating author:", error);
        }
        return null;
    };

    // Find or create category and return its ID
    const findOrCreateCategory = async (categoryName, categoryDescription = null) => {
        try {
            const categoryApi = new DataApi("category");
            const categoriesResponse = await categoryApi.fetchAll();

            if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
                // Try to find existing category by name
                let foundCategory = categoriesResponse.data.find(c =>
                    c.name && c.name.toLowerCase() === categoryName.toLowerCase()
                );

                if (!foundCategory) {
                    // Create new category with description if available
                    const categoryData = {
                        name: categoryName,
                        description: categoryDescription || ""
                    };

                    const newCategoryResponse = await categoryApi.create(categoryData);
                    if (newCategoryResponse.data && newCategoryResponse.data.success) {
                        foundCategory = newCategoryResponse.data.data;
                        PubSub.publish("RECORD_SAVED_TOAST", {
                            message: `Category "${categoryName}" created successfully`,
                        });
                    }
                } else {
                    // Update existing category if we have description and it's missing
                    if (categoryDescription && !foundCategory.description) {
                        try {
                            await categoryApi.update({ ...foundCategory, description: categoryDescription }, foundCategory.id);
                        } catch (e) {
                            console.log("Could not update category description:", e);
                        }
                    }
                }

                if (foundCategory) {
                    return foundCategory.id;
                }
            }
        } catch (error) {
            console.error("Error finding/creating category:", error);
        }
        return null;
    };

    // Enhanced ISBN fetching with better error handling
    const fetchBookByISBN = async (isbn) => {
        console.log("Fetching book data for ISBN:", isbn);

        // Basic book data structure
        const bookData = {
            isbn: isbn,
            title: "",
            total_copies: 1,
            available_copies: 1,
        };

        try {
            // Try Open Library API first
            const openLibraryUrl = `https://openlibrary.org/isbn/${isbn}.json`;
            console.log("Trying Open Library API:", openLibraryUrl);

            const openLibraryResponse = await fetch(openLibraryUrl);

            if (openLibraryResponse.ok) {
                const data = await openLibraryResponse.json();
                console.log("Open Library response:", data);

                bookData.title = data.title || "";

                // Try to get author names and details
                if (data.authors && data.authors.length > 0) {
                    try {
                        const authorPromises = data.authors.slice(0, 3).map(async (author) => {
                            const authorKey = author.key || author;
                            const authorUrl = `https://openlibrary.org${authorKey}.json`;
                            const authorResponse = await fetch(authorUrl);
                            if (authorResponse.ok) {
                                const authorData = await authorResponse.json();
                                return {
                                    name: authorData.name || "",
                                    bio: authorData.bio ? (typeof authorData.bio === "string" ? authorData.bio : authorData.bio.value || "") : "",
                                    email: authorData.email || "",
                                    fullData: authorData
                                };
                            }
                            return { name: "", bio: "", email: "", fullData: null };
                        });
                        const authorDetails = await Promise.all(authorPromises);
                        const validAuthors = authorDetails.filter(a => a.name);
                        if (validAuthors.length > 0) {
                            bookData.author_name = validAuthors.map(a => a.name).join(", ");
                            bookData.author_details = validAuthors[0];
                        }
                    } catch (e) {
                        console.log("Could not fetch author details:", e);
                    }
                }

                // Try to get subject/category from Open Library
                if (data.subjects && data.subjects.length > 0) {
                    const subject = data.subjects[0];
                    const categoryName = subject
                        .replace(/^Fiction\s*[-–—]\s*/i, "")
                        .replace(/^Non-fiction\s*[-–—]\s*/i, "")
                        .split(",")[0]
                        .trim();
                    bookData.category_name = categoryName;
                    bookData.category_description = subject;
                }

                // Also try to get from subject_places or subject_people if available
                if (!bookData.category_name && data.subject_places && data.subject_places.length > 0) {
                    bookData.category_name = data.subject_places[0];
                    bookData.category_description = data.subject_places.join(", ");
                }

                if (!bookData.category_name && data.subject_people && data.subject_people.length > 0) {
                    bookData.category_name = data.subject_people[0];
                    bookData.category_description = data.subject_people.join(", ");
                }

                console.log("Final book data from Open Library:", bookData);
                return bookData;
            }
        } catch (error) {
            console.log("Open Library API failed:", error);
        }

        // Fallback to Google Books API
        try {
            const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
            console.log("Trying Google Books API:", googleBooksUrl);

            const googleResponse = await fetch(googleBooksUrl);

            if (googleResponse.ok) {
                const data = await googleResponse.json();
                console.log("Google Books response:", data);

                if (data.items && data.items.length > 0) {
                    const volumeInfo = data.items[0].volumeInfo;
                    bookData.title = volumeInfo.title || "";

                    // Get authors
                    if (volumeInfo.authors && volumeInfo.authors.length > 0) {
                        bookData.author_name = volumeInfo.authors.join(", ");
                        bookData.author_details = {
                            name: volumeInfo.authors[0],
                            bio: "",
                            email: "",
                            fullData: null
                        };
                    }

                    // Get categories
                    if (volumeInfo.categories && volumeInfo.categories.length > 0) {
                        const category = volumeInfo.categories[0];
                        const categoryName = category
                            .split("/")[0]
                            .split(",")[0]
                            .trim();
                        bookData.category_name = categoryName;
                        bookData.category_description = category;
                    }

                    // Get description
                    if (volumeInfo.description) {
                        bookData.description = volumeInfo.description;
                    }

                    console.log("Final book data from Google Books:", bookData);
                    return bookData;
                }
            }
        } catch (error) {
            console.log("Google Books API also failed:", error);
        }

        // If both APIs fail, return basic data with ISBN
        console.log("Both APIs failed, returning basic data");
        return bookData;
    };

    const analyzeJsonData = async (data) => {
        if (!data || typeof data !== "object") return null;

        // Check for book data (highest priority if has ISBN or title)
        if (data.isbn || data.title || data.bookTitle || data.book_title) {
            let bookData = {
                title: data.title || data.bookTitle || data.book_title || "",
                isbn: data.isbn || data.ISBN || "",
                author_id: data.author_id || data.authorId || "",
                category_id: data.category_id || data.categoryId || "",
                total_copies: data.total_copies || data.totalCopies || 1,
                available_copies: data.available_copies || data.availableCopies || 1,
            };

            // If ISBN is provided but no title, try to fetch from API
            if (bookData.isbn && !bookData.title) {
                const fetchedData = await fetchBookByISBN(bookData.isbn);
                bookData = { ...fetchedData, ...bookData };
            }

            return {
                type: "book",
                data: bookData,
                module: "/books",
            };
        }

        // Check for author data
        if (data.authorName || data.author_name || (data.name && !data.email && !data.phone)) {
            if (!data.email && !data.phone && !data.address) {
                return {
                    type: "author",
                    data: {
                        name: data.name || data.authorName || data.author_name || data.author || "",
                    },
                    module: "/author",
                };
            }
        }

        // Check for supplier data (has email or phone)
        if (data.supplierName || data.supplier_name || data.supplier || (data.name && (data.email || data.phone))) {
            return {
                type: "supplier",
                data: {
                    name: data.name || data.supplierName || data.supplier_name || data.supplier || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    address: data.address || "",
                },
                module: "/supplier",
            };
        }

        // Check for category data
        if (data.category || data.categoryName || data.category_name) {
            return {
                type: "category",
                data: {
                    name: data.category || data.categoryName || data.category_name || "",
                },
                module: "/category",
            };
        }

        // If just has name, try to determine by context
        if (data.name) {
            if (data.name.split(/\s+/).length === 1 && data.name.length <= 30) {
                return {
                    type: "category",
                    data: { name: data.name },
                    module: "/category",
                };
            }
            return {
                type: "author",
                data: { name: data.name },
                module: "/author",
            };
        }

        return null;
    };

    const handleInsert = async () => {
        if (!detectedData) {
            PubSub.publish("RECORD_ERROR_TOAST", {
                message: "No data detected to insert",
            });
            return;
        }

        setLoading(true);
        try {
            // Prepare data with defaults for missing required fields
            let dataToInsert = { ...detectedData.data };

            // Add default values for missing required fields based on type
            if (detectedData.type === "book") {
                if (!dataToInsert.title) {
                    dataToInsert.title = dataToInsert.isbn ? "" : "Scanned Book";
                }
                if (!dataToInsert.isbn) {
                    dataToInsert.isbn = `SCAN-${Date.now()}`;
                }
                if (!dataToInsert.author_id) dataToInsert.author_id = null;
                if (!dataToInsert.category_id) dataToInsert.category_id = null;
                if (!dataToInsert.total_copies) dataToInsert.total_copies = 1;
                if (!dataToInsert.available_copies) dataToInsert.available_copies = 1;

                // Remove temporary fields
                delete dataToInsert.author_name;
                delete dataToInsert.category_name;
                delete dataToInsert.description;
                delete dataToInsert.author_details;
                delete dataToInsert.category_description;
            } else if (detectedData.type === "author") {
                if (!dataToInsert.name) dataToInsert.name = "Scanned Author";
            } else if (detectedData.type === "category") {
                if (!dataToInsert.name) dataToInsert.name = "Scanned Category";
            } else if (detectedData.type === "supplier") {
                if (!dataToInsert.name) dataToInsert.name = dataToInsert.email || dataToInsert.phone || "Scanned Supplier";
                if (!dataToInsert.contact_info && (dataToInsert.email || dataToInsert.phone || dataToInsert.address)) {
                    dataToInsert.contact_info = {
                        email: dataToInsert.email || "",
                        phone: dataToInsert.phone || "",
                        address: dataToInsert.address || ""
                    };
                }
            }

            const api = new DataApi(detectedData.type);
            const response = await api.create(dataToInsert);

            if (response.data && response.data.success) {
                PubSub.publish("RECORD_SAVED_TOAST", {
                    message: `${detectedData.type.charAt(0).toUpperCase() + detectedData.type.slice(1)} added successfully`,
                });
                setShowModal(false);
                setBarcodeInput("");
                setDetectedData(null);
                navigate(detectedData.module);
            } else {
                const errorMsg = Array.isArray(response.data?.errors)
                    ? response.data.errors.map((e) => e.msg || e).join(", ")
                    : response.data?.errors || "Failed to insert";
                PubSub.publish("RECORD_ERROR_TOAST", {
                    message: errorMsg,
                });
            }
        } catch (error) {
            console.error("Error inserting data:", error);
            const errorMsg =
                error.response?.data?.errors
                    ? Array.isArray(error.response.data.errors)
                        ? error.response.data.errors.map((e) => e.msg || e).join(", ")
                        : error.response.data.errors
                    : error.message || "Failed to insert";
            PubSub.publish("RECORD_ERROR_TOAST", {
                message: errorMsg,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleManualInput = () => {
        if (barcodeInput.trim()) {
            detectAndProcessBarcode(barcodeInput.trim());
        }
    };

    return (
        <>
            {/* Floating Scan Button */}
            <Button
                onClick={() => setShowModal(true)}
                className="shadow-lg"
                style={{
                    position: "fixed",
                    bottom: "100px",
                    right: "20px",
                    zIndex: 1000,
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #e9d5ff 0%, #f3e8ff 100%)",
                    border: "2px solid #8b5cf6",
                    boxShadow: "0 4px 16px rgba(139, 92, 246, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.1)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 92, 246, 0.4)";
                    e.currentTarget.style.borderColor = "#6f42c1";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(139, 92, 246, 0.3)";
                    e.currentTarget.style.borderColor = "#8b5cf6";
                }}
                title="Scan Barcode - Universal Scanner"
            >
                <i className="fa-solid fa-barcode" style={{ fontSize: "26px", color: "#6f42c1" }}></i>
            </Button>

            {/* Scanner Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header
                    closeButton
                    style={{
                        background: "linear-gradient(135deg, #e9d5ff 0%, #f3e8ff 100%)",
                        borderBottom: "none",
                        borderRadius: "8px 8px 0 0"
                    }}
                >
                    <Modal.Title style={{ color: "#6f42c1", fontWeight: "600" }}>
                        <i className="fa-solid fa-barcode me-2"></i>Universal Barcode Scanner
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: "24px" }}>
                    <div className="mb-4">
                        <Form.Label style={{ fontWeight: "500", color: "#333", marginBottom: "10px", fontSize: "14px" }}>
                            <i className="fa-solid fa-qrcode me-2" style={{ color: "#8b5cf6" }}></i>Scan or Enter Barcode/Data
                        </Form.Label>
                        <InputGroup>
                            <InputGroup.Text style={{ background: "#e9d5ff", borderColor: "#e9ecef" }}>
                                <i className="fa-solid fa-barcode" style={{ color: "#6f42c1" }}></i>
                            </InputGroup.Text>
                            <Form.Control
                                ref={inputRef}
                                type="text"
                                placeholder="Enter 10 or 13 digit ISBN, author name, supplier info, or paste JSON data..."
                                value={barcodeInput}
                                onChange={(e) => handleBarcodeInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                        handleManualInput();
                                    }
                                }}
                                style={{
                                    borderColor: "#e9ecef",
                                    borderRadius: "0",
                                    fontSize: "14px",
                                    padding: "10px 12px"
                                }}
                                onFocus={(e) => e.target.style.borderColor = "#8b5cf6"}
                                onBlur={(e) => e.target.style.borderColor = "#e9ecef"}
                                autoFocus
                            />
                            <Button
                                variant="outline-primary"
                                onClick={handleManualInput}
                                disabled={!barcodeInput.trim() || loading}
                                style={{
                                    borderColor: "#8b5cf6",
                                    color: "#6f42c1",
                                    background: "#e9d5ff"
                                }}
                            >
                                <i className="fa-solid fa-search"></i>
                            </Button>
                        </InputGroup>
                        <Form.Text className="text-muted" style={{ fontSize: "12px", marginTop: "6px", display: "block" }}>
                            <i className="fa-solid fa-info-circle me-1"></i>
                            Enter ISBN (10 or 13 digits), author name, supplier info, or paste JSON data. ISBN detection is prioritized.
                        </Form.Text>
                    </div>

                    {loading && (
                        <Alert
                            variant="info"
                            className="text-center"
                            style={{
                                background: "#e9d5ff",
                                borderColor: "#8b5cf6",
                                color: "#6f42c1",
                                borderRadius: "8px",
                                padding: "16px"
                            }}
                        >
                            <i className="fa-solid fa-spinner fa-spin me-2"></i>
                            <strong>
                                {isValidISBN(barcodeInput)
                                    ? `Fetching book data for ISBN: ${barcodeInput}...`
                                    : "Detecting data type..."}
                            </strong>
                        </Alert>
                    )}

                    {detectedData && !loading && (
                        <Alert
                            variant="success"
                            style={{
                                background: "#C8E6C9",
                                borderColor: "#2E7D32",
                                color: "#2E7D32",
                                borderRadius: "8px",
                                padding: "16px"
                            }}
                        >
                            <div className="d-flex align-items-center mb-3">
                                <div
                                    style={{
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "50%",
                                        background: "#2E7D32",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginRight: "12px"
                                    }}
                                >
                                    <i className="fa-solid fa-circle-check" style={{ fontSize: "20px", color: "white" }}></i>
                                </div>
                                <div>
                                    <strong style={{ fontSize: "16px" }}>
                                        Data Detected: {detectedData.type.charAt(0).toUpperCase() + detectedData.type.slice(1)}
                                    </strong>
                                    <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "2px" }}>
                                        Will be inserted into <strong>{detectedData.module}</strong> module
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3" style={{ background: "white", padding: "12px", borderRadius: "6px" }}>
                                <strong style={{ fontSize: "14px", color: "#2E7D32" }}>Detected Fields:</strong>
                                <div className="mt-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                                    {Object.entries(detectedData.data).filter(([_, value]) => value).map(([key, value]) => (
                                        <div key={key} style={{ fontSize: "13px" }}>
                                            <span style={{ fontWeight: "600", color: "#2E7D32" }}>
                                                {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}:
                                            </span>{" "}
                                            <span style={{ color: "#333" }}>{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Alert>
                    )}

                    {!detectedData && barcodeInput.length > 3 && !loading && (
                        <Alert
                            variant="warning"
                            style={{
                                background: "#fff3cd",
                                borderColor: "#ff9800",
                                color: "#856404",
                                borderRadius: "8px",
                                padding: "16px"
                            }}
                        >
                            <div className="d-flex align-items-center">
                                <i className="fa-solid fa-exclamation-triangle me-2" style={{ fontSize: "18px" }}></i>
                                <div>
                                    <strong>Could not detect data type.</strong>
                                    <div style={{ fontSize: "12px", marginTop: "4px" }}>
                                        Please check the format. For ISBN, enter exactly 10 or 13 digits.
                                    </div>
                                </div>
                            </div>
                        </Alert>
                    )}
                </Modal.Body>
                <Modal.Footer style={{ borderTop: "1px solid #e9ecef", padding: "16px 24px" }}>
                    <Button
                        variant="outline-secondary"
                        onClick={() => {
                            setShowModal(false);
                            setBarcodeInput("");
                            setDetectedData(null);
                        }}
                        style={{
                            borderColor: "#8b5cf6",
                            color: "#6f42c1",
                            background: "white",
                            padding: "8px 20px",
                            borderRadius: "6px"
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleInsert}
                        disabled={!detectedData || loading}
                        style={{
                            background: detectedData && !loading
                                ? "linear-gradient(135deg, #e9d5ff 0%, #f3e8ff 100%)"
                                : "#ccc",
                            border: detectedData && !loading ? "2px solid #8b5cf6" : "none",
                            color: detectedData && !loading ? "#6f42c1" : "#999",
                            padding: "8px 24px",
                            borderRadius: "6px",
                            fontWeight: "500"
                        }}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Processing...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-plus me-2"></i>
                                Insert into {detectedData?.type?.charAt(0).toUpperCase() + detectedData?.type?.slice(1) || "Module"}
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default UniversalBarcodeScanner;