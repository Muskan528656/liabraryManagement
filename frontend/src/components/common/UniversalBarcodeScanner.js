
// import React, { useState, useEffect, useRef } from "react";
// import { Modal, Button, Form, InputGroup, Alert, Row, Col } from "react-bootstrap";
// import { useNavigate } from "react-router-dom";
// import DataApi from "../../api/dataApi";
// import PubSub from "pubsub-js";

// const UniversalBarcodeScanner = () => {
//     const [showModal, setShowModal] = useState(false);
//     const [scanning, setScanning] = useState(false);
//     const [barcodeInput, setBarcodeInput] = useState("");
//     const [detectedData, setDetectedData] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [bookDetails, setBookDetails] = useState({
//         title: "",
//         subtitle: "",
//         authors: [],
//         categories: [],
//         description: "",
//         pageCount: "",
//         publisher: "",
//         publishedDate: "",
//         language: "",
//         isbn10: "",
//         isbn13: "",
//         coverImage: "",
//         pages: ""
//     });
//     const [authorDetails, setAuthorDetails] = useState({
//         name: "",
//         bio: "",
//         email: "",
//         website: ""
//     });
//     const [categoryDetails, setCategoryDetails] = useState({
//         name: "",
//         description: ""
//     });
//     const [publisherDetails, setPublisherDetails] = useState({
//         name: "",
//         address: "",
//         website: ""
//     });
//     const [showAdvancedFields, setShowAdvancedFields] = useState(false);
//     const navigate = useNavigate();
//     const inputRef = useRef(null);

//     const GOOGLE_BOOKS_API_KEY = "AIzaSyAC2OqFGAIdOaCSWswm-mjiwoY-kzPJT-0";

//     useEffect(() => {
//         const token = PubSub.subscribe("OPEN_BARCODE_SCANNER", () => {
//             setShowModal(true);
//             setBarcodeInput("");
//             setDetectedData(null);
//             resetAllDetails();
//         });

//         return () => {
//             PubSub.unsubscribe(token);
//         };
//     }, []);

//     useEffect(() => {
//         if (showModal && inputRef.current) {
//             setTimeout(() => {
//                 inputRef.current?.focus();
//             }, 100);
//         }
//     }, [showModal]);

//     useEffect(() => {
//         const checkForISBN = async () => {
//             if (barcodeInput.length >= 10) {
//                 const isbnCheck = isValidISBN(barcodeInput);
//                 if (isbnCheck && !loading && !detectedData) {
//                     await detectAndProcessBarcode(barcodeInput.trim());
//                 }
//             }
//         };

//         const timeoutId = setTimeout(checkForISBN, 500);
//         return () => clearTimeout(timeoutId);
//     }, [barcodeInput]);

//     const resetAllDetails = () => {
//         setBookDetails({
//             title: "",
//             subtitle: "",
//             authors: [],
//             categories: [],
//             description: "",
//             pageCount: "",
//             publisher: "",
//             publishedDate: "",
//             language: "",
//             isbn10: "",
//             isbn13: "",
//             coverImage: "",
//             pages: ""
//         });
//         setAuthorDetails({
//             name: "",
//             bio: "",
//             email: "",
//             website: ""
//         });
//         setCategoryDetails({
//             name: "",
//             description: ""
//         });
//         setPublisherDetails({
//             name: "",
//             address: "",
//             website: ""
//         });
//     };

//     const handleBarcodeInput = (value) => {
//         setBarcodeInput(value);
//     };

//     const isValidISBN = (isbn) => {
//         if (!isbn) return false;

//         const cleanIsbn = isbn.replace(/[^\dX]/gi, '').toUpperCase();

//         if (cleanIsbn.length === 10) {
//             const isbn10Regex = /^[\d]{9}[\dX]$/;
//             if (isbn10Regex.test(cleanIsbn)) {
//                 return { type: 'isbn10', value: cleanIsbn };
//             }
//         }

//         if (cleanIsbn.length === 13) {
//             const isbn13Regex = /^[\d]{13}$/;
//             if (isbn13Regex.test(cleanIsbn)) {
//                 return { type: 'isbn13', value: cleanIsbn };
//             }
//         }

//         return false;
//     };

//     const extractISBNFromText = (text) => {
//         if (!text) return null;

//         const isbnPatterns = [
//             /ISBN[-\s:]*([\d\-X]{10,17})/gi,
//             /ISBN[-:]?\s*([\dX\-]{10,17})/gi,
//             /([\dX\-]{10,17})\s*\(ISBN\)/gi,
//             /([\dX]{10,13})/g
//         ];

//         for (const pattern of isbnPatterns) {
//             const matches = text.match(pattern);
//             if (matches) {
//                 for (const match of matches) {
//                     const cleanMatch = match.replace(/[^\dX]/gi, '').toUpperCase();
//                     const isbnCheck = isValidISBN(cleanMatch);
//                     if (isbnCheck) {
//                         return isbnCheck;
//                     }
//                 }
//             }
//         }

//         const words = text.split(/\s+/);
//         for (const word of words) {
//             const cleanWord = word.replace(/[^\dX]/gi, '').toUpperCase();
//             if (cleanWord.length >= 10) {
//                 const isbnCheck = isValidISBN(cleanWord);
//                 if (isbnCheck) {
//                     return isbnCheck;
//                 }
//             }
//         }

//         return null;
//     };

//     const detectAndProcessBarcode = async (barcode) => {
//         if (!barcode || barcode.trim().length === 0) return;

//         setLoading(true);
//         resetAllDetails();

//         try {
//             const detectedType = await detectDataType(barcode.trim());


//             if (detectedType && detectedType.type === "librarycard" && detectedType.navigate) {
//                 setLoading(false);
//                 setShowModal(false);
//                 navigate(detectedType.module);
//                 return;
//             }

//             setDetectedData(detectedType);

//             if (detectedType && detectedType.type === "book") {
//                 await extractAllBookDetails(detectedType.data);
//             }
//         } catch (error) {
//             console.error("Error detecting barcode data:", error);
//             PubSub.publish("RECORD_ERROR_TOAST", {
//                 message: "Failed to process barcode data",
//             });
//         } finally {
//             setLoading(false);
//         }
//     };

//     const extractAllBookDetails = async (bookData) => {
//         if (!bookData) return;

//         if (bookData.title) {
//             setBookDetails(prev => ({
//                 ...prev,
//                 title: bookData.title,
//                 subtitle: bookData.title || ""
//             }));
//         }

//         if (bookData.subtitle && !bookDetails.subtitle) {
//             setBookDetails(prev => ({
//                 ...prev,
//                 subtitle: bookData.title
//             }));
//         }

//         if (bookData.author_name) {
//             setBookDetails(prev => ({
//                 ...prev,
//                 authors: Array.isArray(bookData.author_name) ? bookData.author_name : [bookData.author_name]
//             }));

//             if (bookData.author_details) {
//                 setAuthorDetails({
//                     name: bookData.author_details.name || bookData.author_name,
//                     bio: bookData.author_details.bio || "",
//                     email: bookData.author_details.email || "",
//                     website: bookData.author_details.website || ""
//                 });
//             }
//         }

//         if (bookData.category_name) {
//             setBookDetails(prev => ({
//                 ...prev,
//                 categories: Array.isArray(bookData.category_name) ? bookData.category_name : [bookData.category_name]
//             }));

//             if (bookData.category_description) {
//                 setCategoryDetails({
//                     name: bookData.category_name,
//                     description: bookData.category_description
//                 });
//             }
//         }

//         if (bookData.description) {
//             setBookDetails(prev => ({
//                 ...prev,
//                 description: bookData.description
//             }));
//         }

//         if (bookData.pageCount || bookData.pages) {
//             const pages = bookData.pageCount || bookData.pages;
//             setBookDetails(prev => ({
//                 ...prev,
//                 pageCount: pages,
//                 pages: pages
//             }));
//         }

//         // ✅ FIX 3: Publisher details भी extract करें
//         if (bookData.publisher) {
//             setBookDetails(prev => ({
//                 ...prev,
//                 publisher: bookData.publisher
//             }));

//             if (bookData.publisher_details) {
//                 setPublisherDetails({
//                     name: bookData.publisher_details.name || bookData.publisher,
//                     address: bookData.publisher_details.address || "",
//                     website: bookData.publisher_details.website || ""
//                 });
//             } else {
//                 setPublisherDetails({
//                     name: bookData.publisher,
//                     address: "",
//                     website: ""
//                 });
//             }
//         }

//         if (bookData.published_date || bookData.publishedDate) {
//             setBookDetails(prev => ({
//                 ...prev,
//                 publishedDate: bookData.published_date || bookData.publishedDate
//             }));
//         }

//         if (bookData.language) {
//             setBookDetails(prev => ({
//                 ...prev,
//                 language: bookData.language
//             }));
//         }

//         if (bookData.isbn) {
//             if (bookData.isbn.length === 10) {
//                 setBookDetails(prev => ({
//                     ...prev,
//                     isbn10: bookData.isbn
//                 }));
//             } else if (bookData.isbn.length === 13) {
//                 setBookDetails(prev => ({
//                     ...prev,
//                     isbn13: bookData.isbn
//                 }));
//             }
//         } else if (bookData.isbn10) {
//             setBookDetails(prev => ({
//                 ...prev,
//                 isbn10: bookData.isbn10
//             }));
//         } else if (bookData.isbn13) {
//             setBookDetails(prev => ({
//                 ...prev,
//                 isbn13: bookData.isbn13
//             }));
//         }

//         if (bookData.cover_image) {
//             setBookDetails(prev => ({
//                 ...prev,
//                 coverImage: bookData.cover_image
//             }));
//         }

//         // Google Books से complete details fetch करें
//         const isbnToCheck = bookData.isbn || bookData.isbn13 || bookData.isbn10 || barcodeInput;
//         const isbnCheck = isValidISBN(isbnToCheck);
//         if (isbnCheck) {
//             await fetchCompleteBookDetails(isbnCheck.value);
//         }
//     };

//     const fetchCompleteBookDetails = async (isbn) => {
//         try {
//             const googleBooksData = await fetchBookFromGoogleBooks(isbn);

//             if (!googleBooksData) return;

//             const mergedData = { ...bookDetails };

//             // ✅ FIX 4: Google Books से आया पूरा टाइटल use करें
//             if (googleBooksData.title) {
//                 mergedData.title = googleBooksData.title;
//             }

//             if (googleBooksData.subtitle && !mergedData.subtitle) {
//                 mergedData.subtitle = googleBooksData.subtitle;
//             }

//             if (googleBooksData.authors && googleBooksData.authors.length > 0) {
//                 mergedData.authors = googleBooksData.authors;
//                 if (googleBooksData.author_details) {
//                     setAuthorDetails({
//                         name: googleBooksData.author_details.name || googleBooksData.authors[0],
//                         bio: googleBooksData.author_details.bio || "",
//                         email: googleBooksData.author_details.email || "",
//                         website: googleBooksData.author_details.website || ""
//                     });
//                 }
//             }

//             if (googleBooksData.categories && googleBooksData.categories.length > 0) {
//                 mergedData.categories = googleBooksData.categories;
//                 if (googleBooksData.category_description) {
//                     setCategoryDetails({
//                         name: googleBooksData.categories[0],
//                         description: googleBooksData.category_description
//                     });
//                 }
//             }

//             if (googleBooksData.description && !mergedData.description) {
//                 mergedData.description = googleBooksData.description;
//             }

//             if (googleBooksData.pageCount || googleBooksData.pages) {
//                 const pages = googleBooksData.pageCount || googleBooksData.pages;
//                 mergedData.pageCount = pages;
//                 mergedData.pages = pages;
//             }

//             // ✅ FIX 5: Publisher details Google Books से भी लें
//             if (googleBooksData.publisher && !mergedData.publisher) {
//                 mergedData.publisher = googleBooksData.publisher;

//                 if (googleBooksData.publisher_details) {
//                     setPublisherDetails({
//                         name: googleBooksData.publisher_details.name || googleBooksData.publisher,
//                         address: googleBooksData.publisher_details.address || "",
//                         website: googleBooksData.publisher_details.website || ""
//                     });
//                 } else {
//                     setPublisherDetails(prev => ({
//                         ...prev,
//                         name: googleBooksData.publisher
//                     }));
//                 }
//             }

//             if (googleBooksData.publishedDate && !mergedData.publishedDate) {
//                 mergedData.publishedDate = googleBooksData.publishedDate;
//             }

//             if (googleBooksData.language && !mergedData.language) {
//                 mergedData.language = googleBooksData.language;
//             }

//             if (googleBooksData.isbn13 && !mergedData.isbn13) {
//                 mergedData.isbn13 = googleBooksData.isbn13;
//             }

//             if (googleBooksData.isbn10 && !mergedData.isbn10) {
//                 mergedData.isbn10 = googleBooksData.isbn10;
//             }

//             if (googleBooksData.coverImage && !mergedData.coverImage) {
//                 mergedData.coverImage = googleBooksData.coverImage;
//             }

//             setBookDetails(mergedData);

//             if (detectedData && detectedData.type === "book") {
//                 const pagesValue = mergedData.pageCount || mergedData.pages || detectedData.data.pages;

//                 const updatedBookData = {
//                     ...detectedData.data,
//                     title: mergedData.title || detectedData.data.title,
//                     subtitle: mergedData.subtitle || detectedData.data.subtitle,
//                     author_name: mergedData.authors?.join(", ") || detectedData.data.author_name,
//                     category_name: mergedData.categories?.[0] || detectedData.data.category_name,
//                     description: mergedData.description || detectedData.data.description,
//                     pages: pagesValue,
//                     publisher: mergedData.publisher || detectedData.data.publisher,
//                     published_date: mergedData.publishedDate || detectedData.data.published_date,
//                     language: mergedData.language || detectedData.data.language,
//                     isbn_10: mergedData.isbn10 || detectedData.data.isbn_10,
//                     isbn_13: mergedData.isbn13 || detectedData.data.isbn_13,
//                     cover_image: mergedData.coverImage || detectedData.data.cover_image,
//                     publisher_name: mergedData.publisher || detectedData.data.publisher // Publisher name add करें
//                 };

//                 setDetectedData({
//                     ...detectedData,
//                     data: updatedBookData,
//                     fullData: googleBooksData
//                 });
//             }

//         } catch (error) {
//             console.error("Error fetching complete book details:", error);
//         }
//     };

//     const detectDataType = async (barcode) => {


//         const isbnCheck = isValidISBN(barcode);
//         if (!isbnCheck) {
//             const extractedISBN = extractISBNFromText(barcode);
//             if (extractedISBN) {
//                 const bookData = await fetchBookFromGoogleBooks(extractedISBN.value);
//                 return await processBookData(bookData, extractedISBN.value);
//             }
//         } else {
//             const bookData = await fetchBookFromGoogleBooks(isbnCheck.value);
//             return await processBookData(bookData, isbnCheck.value);
//         }

//         const cardNumberPattern = /^(LIB|LC-?)?[A-Z0-9]{6,20}$/i;
//         const barcodeTrimmed = barcode.trim();
//         if (cardNumberPattern.test(barcodeTrimmed)) {
//             try {
//                 const cardApi = new DataApi("librarycard");
//                 const allCards = await cardApi.fetchAll();
//                 if (allCards && allCards.data) {
//                     const cards = Array.isArray(allCards.data) ? allCards.data : (allCards.data.data || []);
//                     const foundCard = cards.find(card => {
//                         if (!card.card_number) return false;
//                         if (card.card_number.toUpperCase() === barcodeTrimmed.toUpperCase()) return true;
//                         if (card.card_number.toUpperCase().includes(barcodeTrimmed.toUpperCase()) ||
//                             barcodeTrimmed.toUpperCase().includes(card.card_number.toUpperCase())) return true;
//                         return false;
//                     });

//                     if (foundCard) {
//                         return {
//                             type: "librarycard",
//                             data: foundCard,
//                             module: `/librarycard/${foundCard.id}`,
//                             navigate: true
//                         };
//                     }
//                 }
//             } catch (error) {
//                 console.error("Error checking library card:", error);
//             }
//         }

//         try {
//             const jsonData = JSON.parse(barcode);
//             const result = await analyzeJsonData(jsonData);
//             if (result) return result;
//         } catch (e) {
//             // Not JSON
//         }

//         if (barcode.includes("@") && barcode.includes(".")) {
//             const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
//             const emailMatch = barcode.match(emailRegex);
//             if (emailMatch) {
//                 const email = emailMatch[0];
//                 const name = barcode.replace(email, "").trim();
//                 return {
//                     type: "supplier",
//                     data: {
//                         name: name || "Supplier",
//                         email: email,
//                     },
//                     module: "/supplier",
//                 };
//             }
//         }

//         if (/^\+?[\d\s-()]{10,}$/.test(barcode) && barcode.length >= 10) {
//             return {
//                 type: "supplier",
//                 data: { phone: barcode.trim() },
//                 module: "/supplier",
//             };
//         }

//         if (/^[A-Za-z\s.]+$/.test(barcode) && (barcode.split(/\s+/).length >= 2 || barcode.length >= 3)) {
//             const words = barcode.trim().split(/\s+/);
//             if (words.length >= 1 && words.every(w => w.length >= 2)) {
//                 return {
//                     type: "author",
//                     data: { name: barcode.trim() },
//                     module: "/author",
//                 };
//             }
//         }

//         if (/^[A-Za-z]+$/.test(barcode) && barcode.length >= 3 && barcode.length <= 30) {
//             return {
//                 type: "category",
//                 data: { name: barcode.trim() },
//                 module: "/category",
//             };
//         }

//         if (/^[A-Za-z0-9\s&.,-]+$/.test(barcode) && barcode.length > 2) {
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

//         if (/\d/.test(barcode) && /[A-Za-z]/.test(barcode)) {
//             const possibleIsbns = barcode.match(/[\dX]{10,13}/g);
//             if (possibleIsbns) {
//                 for (const possibleIsbn of possibleIsbns) {
//                     const isbnCheck = isValidISBN(possibleIsbn);
//                     if (isbnCheck) {
//                         const isbn = isbnCheck.value;
//                         const title = barcode.replace(possibleIsbn, "").trim();

//                         const bookData = await fetchBookFromGoogleBooks(isbn);

//                         if (title && !bookData.title) {
//                             bookData.title = title;
//                         }

//                         return await processBookData(bookData, isbn);
//                     }
//                 }
//             }
//         }

//         if (barcode.length > 3) {
//             return {
//                 type: "book",
//                 data: {
//                     title: barcode.trim(),
//                     total_copies: 1,
//                     available_copies: 1,
//                     pages: 0
//                 },
//                 module: "/book",
//             };
//         }

//         return null;
//     };

//     const processBookData = async (bookData, isbn) => {
//         // ✅ FIX 6: Publisher भी create करें
//         if (bookData.publisher) {
//             const publisherId = await findOrCreatePublisher(bookData.publisher, bookData.publisher_details);
//             if (publisherId) {
//                 bookData.publisher_id = publisherId;
//             }
//         }

//         if (bookData.author_name) {
//             const authorId = await findOrCreateAuthor(bookData.author_name, bookData.author_details);
//             if (authorId) {
//                 bookData.author_id = authorId;
//             }
//         }

//         if (bookData.category_name) {
//             const categoryId = await findOrCreateCategory(bookData.category_name, bookData.category_description);
//             if (categoryId) {
//                 bookData.category_id = categoryId;
//             }
//         }

//         const cleanedBookData = {
//             ...bookData,
//             isbn: isbn,
//             total_copies: bookData.total_copies || 1,
//             available_copies: bookData.available_copies || 1,
//             pages: bookData.pageCount || bookData.pages || 0
//         };

//         delete cleanedBookData.author_details;
//         delete cleanedBookData.category_description;
//         delete cleanedBookData.publisher_details;
//         delete cleanedBookData.pageCount;

//         return {
//             type: "book",
//             data: cleanedBookData,
//             module: "/book",
//             fullData: bookData
//         };
//     };

//     // ✅ FIX 7: Publisher create/update function
//     const findOrCreatePublisher = async (publisherName, publisherDetails = null) => {
//         try {
//             const publisherApi = new DataApi("publisher");
//             const publishersResponse = await publisherApi.fetchAll();

//             if (publishersResponse.data && Array.isArray(publishersResponse.data)) {
//                 // Clean publisher name
//                 const cleanPublisherName = publisherName.trim();

//                 let foundPublisher = publishersResponse.data.find(p =>
//                     p.name && p.name.toLowerCase() === cleanPublisherName.toLowerCase()
//                 );

//                 if (!foundPublisher) {
//                     const publisherData = {
//                         name: cleanPublisherName,
//                         address: publisherDetails?.address || "",
//                         website: publisherDetails?.website || "",
//                         contact_person: publisherDetails?.contact_person || ""
//                     };


//                     const newPublisherResponse = await publisherApi.create(publisherData);

//                     if (newPublisherResponse.data && newPublisherResponse.data.success) {
//                         foundPublisher = newPublisherResponse.data.data;
//                         PubSub.publish("RECORD_SAVED_TOAST", {
//                             message: `Publisher "${cleanPublisherName}" created successfully`,
//                         });

//                         return foundPublisher.id;
//                     }
//                 } else {

//                     // Update publisher details if needed
//                     if (publisherDetails) {
//                         const updateData = {};
//                         if (publisherDetails.address && !foundPublisher.address) {
//                             updateData.address = publisherDetails.address;
//                         }
//                         if (publisherDetails.website && !foundPublisher.website) {
//                             updateData.website = publisherDetails.website;
//                         }
//                         if (publisherDetails.contact_person && !foundPublisher.contact_person) {
//                             updateData.contact_person = publisherDetails.contact_person;
//                         }
//                         if (Object.keys(updateData).length > 0) {
//                             try {
//                                 await publisherApi.update({ ...foundPublisher, ...updateData }, foundPublisher.id);

//                             } catch (e) {

//                             }
//                         }
//                     }
//                     return foundPublisher.id;
//                 }
//             }
//         } catch (error) {
//             console.error("Error finding/creating publisher:", error);
//         }
//         return null;
//     };

//     const findOrCreateAuthor = async (authorName, authorDetails = null) => {
//         try {
//             const authorApi = new DataApi("author");
//             const authorsResponse = await authorApi.fetchAll();

//             if (authorsResponse.data && Array.isArray(authorsResponse.data)) {
//                 const authorNames = authorName.split(",").map(a => a.trim());
//                 const primaryAuthorName = authorNames[0];

//                 let foundAuthor = authorsResponse.data.find(a =>
//                     a.name && a.name.toLowerCase() === primaryAuthorName.toLowerCase()
//                 );

//                 if (!foundAuthor) {
//                     const authorData = {
//                         name: primaryAuthorName,
//                         email: authorDetails?.email || "",
//                         bio: authorDetails?.bio || "",
//                         website: authorDetails?.website || ""
//                     };

//                     const newAuthorResponse = await authorApi.create(authorData);
//                     if (newAuthorResponse.data && newAuthorResponse.data.success) {
//                         foundAuthor = newAuthorResponse.data.data;
//                         PubSub.publish("RECORD_SAVED_TOAST", {
//                             message: `Author "${primaryAuthorName}" created successfully`,
//                         });
//                     }
//                 } else {
//                     if (authorDetails) {
//                         const updateData = {};
//                         if (authorDetails.email && !foundAuthor.email) {
//                             updateData.email = authorDetails.email;
//                         }
//                         if (authorDetails.bio && !foundAuthor.bio) {
//                             updateData.bio = authorDetails.bio;
//                         }
//                         if (authorDetails.website && !foundAuthor.website) {
//                             updateData.website = authorDetails.website;
//                         }
//                         if (Object.keys(updateData).length > 0) {
//                             try {
//                                 await authorApi.update({ ...foundAuthor, ...updateData }, foundAuthor.id);
//                             } catch (e) {

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

//     const findOrCreateCategory = async (categoryName, categoryDescription = null) => {
//         try {
//             const categoryApi = new DataApi("category");
//             const categoriesResponse = await categoryApi.fetchAll();

//             if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
//                 let foundCategory = categoriesResponse.data.find(c =>
//                     c.name && c.name.toLowerCase() === categoryName.toLowerCase()
//                 );

//                 if (!foundCategory) {
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
//                     if (categoryDescription && !foundCategory.description) {
//                         try {
//                             await categoryApi.update({ ...foundCategory, description: categoryDescription }, foundCategory.id);
//                         } catch (e) {

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

//     const fetchBookFromGoogleBooks = async (isbn) => {


//         const bookData = {
//             isbn: isbn,
//             title: "",
//             subtitle: "",
//             authors: [],
//             categories: [],
//             description: "",
//             pageCount: 0,
//             pages: 0,
//             publisher: "",
//             publishedDate: "",
//             language: "",
//             isbn10: "",
//             isbn13: "",
//             coverImage: "",
//             total_copies: 1,
//             available_copies: 1,
//         };

//         try {
//             const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${GOOGLE_BOOKS_API_KEY}`;


//             const response = await fetch(googleBooksUrl);

//             if (response.ok) {
//                 const data = await response.json();


//                 if (data.items && data.items.length > 0) {
//                     const volumeInfo = data.items[0].volumeInfo;

//                     // ✅ FIX 8: Google Books से पूरा टाइटल और subtitle अलग-अलग लें
//                     if (volumeInfo.title) {
//                         bookData.title = volumeInfo.title;
//                     }

//                     if (volumeInfo.subtitle) {
//                         bookData.subtitle = volumeInfo.subtitle;
//                     }

//                     if (volumeInfo.authors && volumeInfo.authors.length > 0) {
//                         bookData.author_name = volumeInfo.authors.join(", ");
//                         bookData.authors = volumeInfo.authors;
//                         bookData.author_details = {
//                             name: volumeInfo.authors[0],
//                             bio: volumeInfo.description || "",
//                             email: "",
//                             website: ""
//                         };
//                     }

//                     if (volumeInfo.categories && volumeInfo.categories.length > 0) {
//                         const category = volumeInfo.categories[0];
//                         bookData.category_name = category
//                             .split("/")[0]
//                             .split(",")[0]
//                             .trim();
//                         bookData.categories = volumeInfo.categories;
//                         bookData.category_description = volumeInfo.categories.join(", ");
//                     }

//                     if (volumeInfo.description) {
//                         bookData.description = volumeInfo.description;
//                     }

//                     if (volumeInfo.pageCount) {
//                         bookData.pageCount = volumeInfo.pageCount;
//                         bookData.pages = volumeInfo.pageCount;

//                     }

//                     if (volumeInfo.publisher) {
//                         bookData.publisher = volumeInfo.publisher;
//                         bookData.publisher_details = {
//                             name: volumeInfo.publisher,
//                             address: "",
//                             website: ""
//                         };
//                     }

//                     if (volumeInfo.publishedDate) {
//                         bookData.publishedDate = volumeInfo.publishedDate;
//                         bookData.published_date = volumeInfo.publishedDate;
//                     }

//                     if (volumeInfo.language) {
//                         bookData.language = volumeInfo.language.toUpperCase();
//                     }

//                     if (volumeInfo.industryIdentifiers) {
//                         const isbn13 = volumeInfo.industryIdentifiers.find(id => id.type === "ISBN_13");
//                         const isbn10 = volumeInfo.industryIdentifiers.find(id => id.type === "ISBN_10");

//                         if (isbn13) {
//                             bookData.isbn = isbn13.identifier;
//                             bookData.isbn13 = isbn13.identifier;
//                         } else if (isbn10) {
//                             bookData.isbn = isbn10.identifier;
//                             bookData.isbn10 = isbn10.identifier;
//                         }
//                     }

//                     if (volumeInfo.imageLinks) {
//                         bookData.coverImage = volumeInfo.imageLinks.thumbnail ||
//                             volumeInfo.imageLinks.smallThumbnail ||
//                             volumeInfo.imageLinks.medium ||
//                             volumeInfo.imageLinks.large;
//                         bookData.cover_image = bookData.coverImage;
//                     }


//                     return bookData;
//                 } else {

//                     bookData.title = `Book with ISBN: ${isbn}`;
//                     return bookData;
//                 }
//             } else {

//                 bookData.title = `Book with ISBN: ${isbn}`;
//                 return bookData;
//             }
//         } catch (error) {
//             console.error("Error fetching from Google Books API:", error);
//             bookData.title = `Book with ISBN: ${isbn}`;
//             return bookData;
//         }
//     };

//     const analyzeJsonData = async (data) => {
//         if (!data || typeof data !== "object") return null;

//         if (data.isbn || data.title || data.bookTitle || data.book_title) {
//             let bookData = {
//                 title: data.title || data.bookTitle || data.book_title || "",
//                 subtitle: data.subtitle || "",
//                 isbn: data.isbn || data.ISBN || "",
//                 author_id: data.author_id || data.authorId || "",
//                 category_id: data.category_id || data.categoryId || "",
//                 publisher_id: data.publisher_id || data.publisherId || "",
//                 description: data.description || data.bookDescription || "",
//                 pageCount: data.pageCount || data.pages || 0,
//                 pages: data.pages || data.pageCount || 0,
//                 publisher: data.publisher || "",
//                 publishedDate: data.publishedDate || data.published_date || "",
//                 language: data.language || "",
//                 coverImage: data.coverImage || data.cover_image || "",
//                 total_copies: data.total_copies || data.totalCopies || 1,
//                 available_copies: data.available_copies || data.availableCopies || 1,
//             };

//             if (bookData.isbn && !bookData.title) {
//                 const fetchedData = await fetchBookFromGoogleBooks(bookData.isbn);
//                 bookData = { ...fetchedData, ...bookData };
//             }

//             return {
//                 type: "book",
//                 data: bookData,
//                 module: "/book",
//                 fullData: bookData
//             };
//         }

//         if (data.authorName || data.author_name || (data.name && !data.email && !data.phone)) {
//             if (!data.email && !data.phone && !data.address) {
//                 return {
//                     type: "author",
//                     data: {
//                         name: data.name || data.authorName || data.author_name || data.author || "",
//                         bio: data.bio || "",
//                         email: data.email || "",
//                         website: data.website || ""
//                     },
//                     module: "/author",
//                 };
//             }
//         }

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

//         if (data.category || data.categoryName || data.category_name) {
//             return {
//                 type: "category",
//                 data: {
//                     name: data.category || data.categoryName || data.category_name || "",
//                     description: data.description || data.categoryDescription || ""
//                 },
//                 module: "/category",
//             };
//         }

//         if (data.name) {
//             if (data.name.split(/\s+/).length === 1 && data.name.length <= 30) {
//                 return {
//                     type: "category",
//                     data: {
//                         name: data.name,
//                         description: data.description || ""
//                     },
//                     module: "/category",
//                 };
//             }
//             return {
//                 type: "author",
//                 data: {
//                     name: data.name,
//                     bio: data.bio || "",
//                     email: data.email || "",
//                     website: data.website || ""
//                 },
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
//             let dataToInsert = { ...detectedData.data };

//             if (detectedData.type === "book") {
//                 // ✅ FIX 9: पूरा टाइटल insert करें
//                 const fullTitle = bookDetails.title || dataToInsert.title;
//                 const fullSubtitle = bookDetails.subtitle || dataToInsert.subtitle;

//                 // Combine title and subtitle if needed
//                 if (fullSubtitle && !fullTitle.includes(fullSubtitle)) {
//                     dataToInsert.title = `${fullTitle}: ${fullSubtitle}`;
//                 } else {
//                     dataToInsert.title = fullTitle;
//                 }

//                 dataToInsert.description = bookDetails.description || dataToInsert.description || "";

//                 const pagesValue = bookDetails.pages || bookDetails.pageCount;
//                 if (pagesValue) {
//                     dataToInsert.pages = parseInt(pagesValue) || 0;
//                 }

//                 dataToInsert.publisher = bookDetails.publisher || dataToInsert.publisher || "";
//                 dataToInsert.published_date = bookDetails.publishedDate || dataToInsert.published_date || "";
//                 dataToInsert.language = bookDetails.language || dataToInsert.language || "";
//                 dataToInsert.isbn_10 = bookDetails.isbn10 || dataToInsert.isbn_10 || "";
//                 dataToInsert.isbn_13 = bookDetails.isbn13 || dataToInsert.isbn_13 || "";
//                 dataToInsert.cover_image = bookDetails.coverImage || dataToInsert.cover_image || "";

//                 if (!dataToInsert.isbn) {
//                     dataToInsert.isbn = dataToInsert.isbn_13 || dataToInsert.isbn_10 || `SCAN-${Date.now()}`;
//                 }
//                 if (!dataToInsert.total_copies) dataToInsert.total_copies = 1;
//                 if (!dataToInsert.available_copies) dataToInsert.available_copies = 1;
//                 if (!dataToInsert.author_id) dataToInsert.author_id = null;
//                 if (!dataToInsert.category_id) dataToInsert.category_id = null;
//                 if (!dataToInsert.publisher_id) dataToInsert.publisher_id = null;

//             } else if (detectedData.type === "author") {
//                 if (!dataToInsert.name) dataToInsert.name = "Scanned Author";
//                 dataToInsert.bio = authorDetails.bio || dataToInsert.bio || "";
//                 dataToInsert.email = authorDetails.email || dataToInsert.email || "";
//                 dataToInsert.website = authorDetails.website || dataToInsert.website || "";

//             } else if (detectedData.type === "category") {
//                 if (!dataToInsert.name) dataToInsert.name = "Scanned Category";
//                 dataToInsert.description = categoryDetails.description || dataToInsert.description || "";

//             } else if (detectedData.type === "supplier") {
//                 if (!dataToInsert.name) dataToInsert.name = dataToInsert.email || dataToInsert.phone || "Scanned Supplier";
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
//                 resetAllDetails();
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

//     const renderBookDetails = () => {
//         if (!detectedData || detectedData.type !== "book") return null;

//         return (
//             <div className="mt-4">
//                 <div className="d-flex justify-content-between align-items-center mb-3">
//                     <h6 style={{ color: "var(--primary-color)", fontWeight: "600" }}>
//                         <i className="fa-solid fa-book me-2"></i>Book Details
//                     </h6>
//                     <Button
//                         variant="link"
//                         onClick={() => setShowAdvancedFields(!showAdvancedFields)}
//                         style={{ color: "var(--primary-color)", textDecoration: "none", fontSize: "14px" }}
//                     >
//                         <i className={`fa-solid fa-${showAdvancedFields ? "chevron-up" : "chevron-down"} me-2`}></i>
//                         {showAdvancedFields ? "Hide Details" : "Show Details"}
//                     </Button>
//                 </div>

//                 <Row className="mb-3">
//                     <Col md={12}>
//                         <Form.Group>
//                             <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                 Title <span className="text-danger">*</span>
//                             </Form.Label>
//                             <Form.Control
//                                 type="text"
//                                 value={bookDetails.title}
//                                 onChange={(e) => setBookDetails({ ...bookDetails, title: e.target.value })}
//                                 placeholder="Full book title"
//                                 style={{ fontSize: "14px" }}
//                             />

//                         </Form.Group>
//                     </Col>
//                 </Row>

//                 <Row className="mb-3">
//                     <Col md={12}>
//                         <Form.Group>
//                             <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                 Subtitle
//                             </Form.Label>
//                             <Form.Control
//                                 type="text"
//                                 value={bookDetails.subtitle}
//                                 onChange={(e) => setBookDetails({ ...bookDetails, subtitle: e.target.value })}
//                                 placeholder="Book subtitle (if any)"
//                                 style={{ fontSize: "14px" }}
//                             />
//                         </Form.Group>
//                     </Col>
//                 </Row>

//                 <Row className="mb-3">
//                     <Col md={6}>
//                         <Form.Group>
//                             <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                 Authors
//                             </Form.Label>
//                             <Form.Control
//                                 type="text"
//                                 value={bookDetails.authors.join(", ")}
//                                 onChange={(e) => setBookDetails({ ...bookDetails, authors: e.target.value.split(",").map(a => a.trim()) })}
//                                 placeholder="Enter authors, separated by commas"
//                                 style={{ fontSize: "14px" }}
//                             />
//                         </Form.Group>
//                     </Col>
//                     <Col md={6}>
//                         <Form.Group>
//                             <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                 ISBN-13
//                             </Form.Label>
//                             <Form.Control
//                                 type="text"
//                                 value={bookDetails.isbn13}
//                                 onChange={(e) => setBookDetails({ ...bookDetails, isbn13: e.target.value })}
//                                 placeholder="13-digit ISBN"
//                                 style={{ fontSize: "14px" }}
//                             />
//                         </Form.Group>
//                     </Col>
//                 </Row>

//                 {showAdvancedFields && (
//                     <>
//                         <Row className="mb-3">
//                             <Col md={6}>
//                                 <Form.Group>
//                                     <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                         Categories
//                                     </Form.Label>
//                                     <Form.Control
//                                         type="text"
//                                         value={bookDetails.categories.join(", ")}
//                                         onChange={(e) => setBookDetails({ ...bookDetails, categories: e.target.value.split(",").map(c => c.trim()) })}
//                                         placeholder="Enter categories, separated by commas"
//                                         style={{ fontSize: "14px" }}
//                                     />
//                                 </Form.Group>
//                             </Col>
//                             <Col md={6}>
//                                 <Form.Group>
//                                     <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                         ISBN-10
//                                     </Form.Label>
//                                     <Form.Control
//                                         type="text"
//                                         value={bookDetails.isbn10}
//                                         onChange={(e) => setBookDetails({ ...bookDetails, isbn10: e.target.value })}
//                                         placeholder="10-digit ISBN"
//                                         style={{ fontSize: "14px" }}
//                                     />
//                                 </Form.Group>
//                             </Col>
//                         </Row>

//                         <Row className="mb-3">
//                             <Col md={6}>
//                                 <Form.Group>
//                                     <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                         Publisher
//                                     </Form.Label>
//                                     <Form.Control
//                                         type="text"
//                                         value={bookDetails.publisher}
//                                         onChange={(e) => setBookDetails({ ...bookDetails, publisher: e.target.value })}
//                                         placeholder="Publisher name"
//                                         style={{ fontSize: "14px" }}
//                                     />
//                                 </Form.Group>
//                             </Col>
//                             <Col md={6}>
//                                 <Form.Group>
//                                     <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                         Published Date
//                                     </Form.Label>
//                                     <Form.Control
//                                         type="text"
//                                         value={bookDetails.publishedDate}
//                                         onChange={(e) => setBookDetails({ ...bookDetails, publishedDate: e.target.value })}
//                                         placeholder="YYYY-MM-DD"
//                                         style={{ fontSize: "14px" }}
//                                     />
//                                 </Form.Group>
//                             </Col>
//                         </Row>

//                         <Row className="mb-3">
//                             <Col md={6}>
//                                 <Form.Group>
//                                     <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                         Language
//                                     </Form.Label>
//                                     <Form.Control
//                                         type="text"
//                                         value={bookDetails.language}
//                                         onChange={(e) => setBookDetails({ ...bookDetails, language: e.target.value })}
//                                         placeholder="e.g., EN, HI"
//                                         style={{ fontSize: "14px" }}
//                                     />
//                                 </Form.Group>
//                             </Col>
//                             <Col md={6}>
//                                 <Form.Group>
//                                     <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                         Page Count
//                                     </Form.Label>
//                                     <Form.Control
//                                         type="number"
//                                         value={bookDetails.pages || bookDetails.pageCount || ""}
//                                         onChange={(e) => {
//                                             const value = e.target.value;
//                                             setBookDetails({
//                                                 ...bookDetails,
//                                                 pages: value,
//                                                 pageCount: value
//                                             });

//                                             if (detectedData && detectedData.type === "book") {
//                                                 setDetectedData({
//                                                     ...detectedData,
//                                                     data: {
//                                                         ...detectedData.data,
//                                                         pages: parseInt(value) || 0
//                                                     }
//                                                 });
//                                             }
//                                         }}
//                                         placeholder="Number of pages"
//                                         style={{ fontSize: "14px" }}
//                                     />
//                                 </Form.Group>
//                             </Col>
//                         </Row>

//                         <Row className="mb-3">
//                             <Col md={12}>
//                                 <Form.Group>
//                                     <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                         Description
//                                     </Form.Label>
//                                     <Form.Control
//                                         as="textarea"
//                                         rows={3}
//                                         value={bookDetails.description}
//                                         onChange={(e) => setBookDetails({ ...bookDetails, description: e.target.value })}
//                                         placeholder="Book description"
//                                         style={{ fontSize: "14px" }}
//                                     />
//                                 </Form.Group>
//                             </Col>
//                         </Row>

//                         <Row className="mb-3">
//                             <Col md={12}>
//                                 <Form.Group>
//                                     <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                         Cover Image URL
//                                     </Form.Label>
//                                     <Form.Control
//                                         type="text"
//                                         value={bookDetails.coverImage}
//                                         onChange={(e) => setBookDetails({ ...bookDetails, coverImage: e.target.value })}
//                                         placeholder="Cover image URL"
//                                         style={{ fontSize: "14px" }}
//                                     />
//                                 </Form.Group>
//                             </Col>
//                         </Row>

//                         {bookDetails.coverImage && (
//                             <div className="text-center mb-3">
//                                 <img
//                                     src={bookDetails.coverImage}
//                                     alt="Book Cover"
//                                     style={{
//                                         maxWidth: "150px",
//                                         maxHeight: "200px",
//                                         borderRadius: "8px",
//                                         boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
//                                     }}
//                                 />
//                             </div>
//                         )}

//                         <h6 style={{ color: "var(--primary-color)", fontWeight: "600", marginTop: "20px", marginBottom: "15px" }}>
//                             <i className="fa-solid fa-user-pen me-2"></i>Author Details
//                         </h6>
//                         <Row className="mb-3">
//                             <Col md={6}>
//                                 <Form.Group>
//                                     <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                         Author Name
//                                     </Form.Label>
//                                     <Form.Control
//                                         type="text"
//                                         value={authorDetails.name}
//                                         onChange={(e) => setAuthorDetails({ ...authorDetails, name: e.target.value })}
//                                         placeholder="Author name"
//                                         style={{ fontSize: "14px" }}
//                                     />
//                                 </Form.Group>
//                             </Col>
//                             <Col md={6}>
//                                 <Form.Group>
//                                     <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                         Author Email
//                                     </Form.Label>
//                                     <Form.Control
//                                         type="email"
//                                         value={authorDetails.email}
//                                         onChange={(e) => setAuthorDetails({ ...authorDetails, email: e.target.value })}
//                                         placeholder="author@example.com"
//                                         style={{ fontSize: "14px" }}
//                                     />
//                                 </Form.Group>
//                             </Col>
//                         </Row>

//                         <Row className="mb-3">
//                             <Col md={12}>
//                                 <Form.Group>
//                                     <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                         Author Bio
//                                     </Form.Label>
//                                     <Form.Control
//                                         as="textarea"
//                                         rows={2}
//                                         value={authorDetails.bio}
//                                         onChange={(e) => setAuthorDetails({ ...authorDetails, bio: e.target.value })}
//                                         placeholder="Author biography"
//                                         style={{ fontSize: "14px" }}
//                                     />
//                                 </Form.Group>
//                             </Col>
//                         </Row>

//                         <h6 style={{ color: "var(--primary-color)", fontWeight: "600", marginTop: "20px", marginBottom: "15px" }}>
//                             <i className="fa-solid fa-tags me-2"></i>Category Details
//                         </h6>
//                         <Row className="mb-3">
//                             <Col md={6}>
//                                 <Form.Group>
//                                     <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                         Category Name
//                                     </Form.Label>
//                                     <Form.Control
//                                         type="text"
//                                         value={categoryDetails.name}
//                                         onChange={(e) => setCategoryDetails({ ...categoryDetails, name: e.target.value })}
//                                         placeholder="Category name"
//                                         style={{ fontSize: "14px" }}
//                                     />
//                                 </Form.Group>
//                             </Col>
//                             <Col md={6}>
//                                 <Form.Group>
//                                     <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                         Description
//                                     </Form.Label>
//                                     <Form.Control
//                                         type="text"
//                                         value={categoryDetails.description}
//                                         onChange={(e) => setCategoryDetails({ ...categoryDetails, description: e.target.value })}
//                                         placeholder="Category description"
//                                         style={{ fontSize: "14px" }}
//                                     />
//                                 </Form.Group>
//                             </Col>
//                         </Row>

//                         <h6 style={{ color: "var(--primary-color)", fontWeight: "600", marginTop: "20px", marginBottom: "15px" }}>
//                             <i className="fa-solid fa-building me-2"></i>Publisher Details
//                         </h6>
//                         <Row className="mb-3">
//                             <Col md={6}>
//                                 <Form.Group>
//                                     <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                         Publisher Name
//                                     </Form.Label>
//                                     <Form.Control
//                                         type="text"
//                                         value={publisherDetails.name}
//                                         onChange={(e) => setPublisherDetails({ ...publisherDetails, name: e.target.value })}
//                                         placeholder="Publisher name"
//                                         style={{ fontSize: "14px" }}
//                                     />
//                                 </Form.Group>
//                             </Col>
//                             <Col md={6}>
//                                 <Form.Group>
//                                     <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                         Website
//                                     </Form.Label>
//                                     <Form.Control
//                                         type="text"
//                                         value={publisherDetails.website}
//                                         onChange={(e) => setPublisherDetails({ ...publisherDetails, website: e.target.value })}
//                                         placeholder="Publisher website"
//                                         style={{ fontSize: "14px" }}
//                                     />
//                                 </Form.Group>
//                             </Col>
//                         </Row>

//                         <Row className="mb-3">
//                             <Col md={12}>
//                                 <Form.Group>
//                                     <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                         Address
//                                     </Form.Label>
//                                     <Form.Control
//                                         as="textarea"
//                                         rows={2}
//                                         value={publisherDetails.address}
//                                         onChange={(e) => setPublisherDetails({ ...publisherDetails, address: e.target.value })}
//                                         placeholder="Publisher address"
//                                         style={{ fontSize: "14px" }}
//                                     />
//                                 </Form.Group>
//                             </Col>
//                         </Row>
//                     </>
//                 )}

//                 <Row className="mb-3">
//                     <Col md={6}>
//                         <Form.Group>
//                             <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                 Total Copies
//                             </Form.Label>
//                             <Form.Control
//                                 type="number"
//                                 min="1"
//                                 value={detectedData.data.total_copies || 1}
//                                 onChange={(e) => setDetectedData({
//                                     ...detectedData,
//                                     data: {
//                                         ...detectedData.data,
//                                         total_copies: parseInt(e.target.value) || 1
//                                     }
//                                 })}
//                                 style={{ fontSize: "14px" }}
//                             />
//                         </Form.Group>
//                     </Col>
//                     <Col md={6}>
//                         <Form.Group>
//                             <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                 Available Copies
//                             </Form.Label>
//                             <Form.Control
//                                 type="number"
//                                 min="0"
//                                 max={detectedData.data.total_copies || 1}
//                                 value={detectedData.data.available_copies || 1}
//                                 onChange={(e) => setDetectedData({
//                                     ...detectedData,
//                                     data: {
//                                         ...detectedData.data,
//                                         available_copies: parseInt(e.target.value) || 1
//                                     }
//                                 })}
//                                 style={{ fontSize: "14px" }}
//                             />
//                         </Form.Group>
//                     </Col>
//                 </Row>
//             </div>
//         );
//     };

//     const renderOtherDetails = () => {
//         if (!detectedData || detectedData.type === "book") return null;

//         if (detectedData.type === "author") {
//             return (
//                 <div className="mt-4">
//                     <h6 style={{ color: "var(--primary-color)", fontWeight: "600", marginBottom: "15px" }}>
//                         <i className="fa-solid fa-user-pen me-2"></i>Author Details
//                     </h6>
//                     <Row className="mb-3">
//                         <Col md={12}>
//                             <Form.Group>
//                                 <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                     Name <span className="text-danger">*</span>
//                                 </Form.Label>
//                                 <Form.Control
//                                     type="text"
//                                     value={authorDetails.name || detectedData.data.name || ""}
//                                     onChange={(e) => {
//                                         setAuthorDetails({ ...authorDetails, name: e.target.value });
//                                         setDetectedData({
//                                             ...detectedData,
//                                             data: { ...detectedData.data, name: e.target.value }
//                                         });
//                                     }}
//                                     placeholder="Author name"
//                                     style={{ fontSize: "14px" }}
//                                 />
//                             </Form.Group>
//                         </Col>
//                     </Row>
//                     <Row className="mb-3">
//                         <Col md={6}>
//                             <Form.Group>
//                                 <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                     Email
//                                 </Form.Label>
//                                 <Form.Control
//                                     type="email"
//                                     value={authorDetails.email || ""}
//                                     onChange={(e) => setAuthorDetails({ ...authorDetails, email: e.target.value })}
//                                     placeholder="author@example.com"
//                                     style={{ fontSize: "14px" }}
//                                 />
//                             </Form.Group>
//                         </Col>
//                         <Col md={6}>
//                             <Form.Group>
//                                 <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                     Website
//                                 </Form.Label>
//                                 <Form.Control
//                                     type="text"
//                                     value={authorDetails.website || ""}
//                                     onChange={(e) => setAuthorDetails({ ...authorDetails, website: e.target.value })}
//                                     placeholder="Author website"
//                                     style={{ fontSize: "14px" }}
//                                 />
//                             </Form.Group>
//                         </Col>
//                     </Row>
//                     <Row className="mb-3">
//                         <Col md={12}>
//                             <Form.Group>
//                                 <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                     Bio
//                                 </Form.Label>
//                                 <Form.Control
//                                     as="textarea"
//                                     rows={3}
//                                     value={authorDetails.bio || ""}
//                                     onChange={(e) => setAuthorDetails({ ...authorDetails, bio: e.target.value })}
//                                     placeholder="Author biography"
//                                     style={{ fontSize: "14px" }}
//                                 />
//                             </Form.Group>
//                         </Col>
//                     </Row>
//                 </div>
//             );
//         }

//         if (detectedData.type === "category") {
//             return (
//                 <div className="mt-4">
//                     <h6 style={{ color: "var(--primary-color)", fontWeight: "600", marginBottom: "15px" }}>
//                         <i className="fa-solid fa-tags me-2"></i>Category Details
//                     </h6>
//                     <Row className="mb-3">
//                         <Col md={6}>
//                             <Form.Group>
//                                 <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                     Name <span className="text-danger">*</span>
//                                 </Form.Label>
//                                 <Form.Control
//                                     type="text"
//                                     value={categoryDetails.name || detectedData.data.name || ""}
//                                     onChange={(e) => {
//                                         setCategoryDetails({ ...categoryDetails, name: e.target.value });
//                                         setDetectedData({
//                                             ...detectedData,
//                                             data: { ...detectedData.data, name: e.target.value }
//                                         });
//                                     }}
//                                     placeholder="Category name"
//                                     style={{ fontSize: "14px" }}
//                                 />
//                             </Form.Group>
//                         </Col>
//                         <Col md={6}>
//                             <Form.Group>
//                                 <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                     Description
//                                 </Form.Label>
//                                 <Form.Control
//                                     type="text"
//                                     value={categoryDetails.description || ""}
//                                     onChange={(e) => setCategoryDetails({ ...categoryDetails, description: e.target.value })}
//                                     placeholder="Category description"
//                                     style={{ fontSize: "14px" }}
//                                 />
//                             </Form.Group>
//                         </Col>
//                     </Row>
//                 </div>
//             );
//         }

//         if (detectedData.type === "supplier") {
//             return (
//                 <div className="mt-4">
//                     <h6 style={{ color: "var(--primary-color)", fontWeight: "600", marginBottom: "15px" }}>
//                         <i className="fa-solid fa-truck me-2"></i>Supplier Details
//                     </h6>
//                     <Row className="mb-3">
//                         <Col md={12}>
//                             <Form.Group>
//                                 <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                     Name <span className="text-danger">*</span>
//                                 </Form.Label>
//                                 <Form.Control
//                                     type="text"
//                                     value={detectedData.data.name || ""}
//                                     onChange={(e) => setDetectedData({
//                                         ...detectedData,
//                                         data: { ...detectedData.data, name: e.target.value }
//                                     })}
//                                     placeholder="Supplier name"
//                                     style={{ fontSize: "14px" }}
//                                 />
//                             </Form.Group>
//                         </Col>
//                     </Row>
//                     <Row className="mb-3">
//                         <Col md={6}>
//                             <Form.Group>
//                                 <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                     Email
//                                 </Form.Label>
//                                 <Form.Control
//                                     type="email"
//                                     value={detectedData.data.email || ""}
//                                     onChange={(e) => setDetectedData({
//                                         ...detectedData,
//                                         data: { ...detectedData.data, email: e.target.value }
//                                     })}
//                                     placeholder="supplier@example.com"
//                                     style={{ fontSize: "14px" }}
//                                 />
//                             </Form.Group>
//                         </Col>
//                         <Col md={6}>
//                             <Form.Group>
//                                 <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                     Phone
//                                 </Form.Label>
//                                 <Form.Control
//                                     type="text"
//                                     value={detectedData.data.phone || ""}
//                                     onChange={(e) => setDetectedData({
//                                         ...detectedData,
//                                         data: { ...detectedData.data, phone: e.target.value }
//                                     })}
//                                     placeholder="Phone number"
//                                     style={{ fontSize: "14px" }}
//                                 />
//                             </Form.Group>
//                         </Col>
//                     </Row>
//                     <Row className="mb-3">
//                         <Col md={12}>
//                             <Form.Group>
//                                 <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
//                                     Address
//                                 </Form.Label>
//                                 <Form.Control
//                                     as="textarea"
//                                     rows={3}
//                                     value={detectedData.data.address || ""}
//                                     onChange={(e) => setDetectedData({
//                                         ...detectedData,
//                                         data: { ...detectedData.data, address: e.target.value }
//                                     })}
//                                     placeholder="Supplier address"
//                                     style={{ fontSize: "14px" }}
//                                 />
//                             </Form.Group>
//                         </Col>
//                     </Row>
//                 </div>
//             );
//         }

//         return null;
//     };

//     return (
//         <>


//             <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered scrollable>
//                 <Modal.Header
//                     closeButton
//                     style={{
//                         background: "var(--primary-background-color)",
//                         borderBottom: "none",
//                         borderRadius: "8px 8px 0 0"
//                     }}
//                 >
//                     <Modal.Title style={{ color: "var(--primary-color)", fontWeight: "600" }}>
//                         <i className="fa-solid fa-barcode me-2"></i>Universal Data Scanner
//                     </Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body style={{ padding: "24px" }}>
//                     <div className="mb-4">
//                         <Form.Label style={{ fontWeight: "500", color: "#333", marginBottom: "10px", fontSize: "14px" }}>
//                             <i className="fa-solid fa-qrcode me-2" style={{ color: "var(--primary-color)" }}></i>Scan or Enter ISBN/Barcode/Data
//                         </Form.Label>
//                         <InputGroup>
//                             <InputGroup.Text style={{ background: "var(--primary-background-color)", borderColor: "#e9ecef" }}>
//                                 <i className="fa-solid fa-barcode" style={{ color: "var(--primary-color)" }}></i>
//                             </InputGroup.Text>
//                             <Form.Control
//                                 ref={inputRef}
//                                 type="text"
//                                 placeholder="Enter ISBN (10 or 13 digits), author name, supplier info, category, or paste JSON data..."
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
//                                 }}
//                                 onFocus={(e) => e.target.style.borderColor = "var(--primary-color)"}
//                                 onBlur={(e) => e.target.style.borderColor = "#e9ecef"}
//                                 autoFocus
//                             />
//                             <Button
//                                 variant="outline-primary"
//                                 onClick={handleManualInput}
//                                 disabled={!barcodeInput.trim() || loading}
//                                 style={{
//                                     borderColor: "#8b5cf6",
//                                     color: "#8b5cf6",
//                                     background: "#e9d5ff"
//                                 }}
//                             >
//                                 <i className="fa-solid fa-search"></i>
//                             </Button>
//                         </InputGroup>
//                         <Form.Text className="text-muted" style={{ fontSize: "12px", marginTop: "6px", display: "block" }}>
//                             <i className="fa-solid fa-info-circle me-1"></i>
//                             Enter ISBN (10 or 13 digits) - book data will be fetched automatically from Google Books API.
//                             Also supports author names, supplier info, category, or JSON data.
//                         </Form.Text>
//                     </div>

//                     {loading && (
//                         <Alert
//                             variant="info"
//                             className="text-center"
//                             style={{
//                                 background: "#e9d5ff",
//                                 borderColor: "#8b5cf6",
//                                 color: "#8b5cf6",
//                                 borderRadius: "8px",
//                                 padding: "16px"
//                             }}
//                         >
//                             <i className="fa-solid fa-spinner fa-spin me-2"></i>
//                             <strong>
//                                 {isValidISBN(barcodeInput)
//                                     ? `Fetching complete book data from Google Books for ISBN: ${barcodeInput}...`
//                                     : "Detecting data type and fetching details..."}
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
//                                 padding: "16px",
//                                 marginBottom: "20px"
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
//                         </Alert>
//                     )}

//                     {renderBookDetails()}
//                     {renderOtherDetails()}

//                     {!detectedData && barcodeInput.length >= 10 && !loading && (
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
//                                         Please check the format. For ISBN, enter exactly 10 or 13 digits.
//                                         The scanner will automatically fetch book data for valid ISBNs.
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
//                             resetAllDetails();
//                         }}
//                         style={{
//                             borderColor: "#8b5cf6",
//                             color: "#8b5cf6",
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
//                                 ? "linear-gradient(135deg, #8b5cf6 0%, #f3e8ff 100%)"
//                                 : "#ccc",
//                             border: detectedData && !loading ? "2px solid #8b5cf6" : "none",
//                             color: detectedData && !loading ? "white" : "#999",
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
//                                 Insert {detectedData?.type?.charAt(0).toUpperCase() + detectedData?.type?.slice(1) || "Data"}
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
import { Modal, Button, Form, InputGroup, Alert, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import DataApi from "../../api/dataApi";
import PubSub from "pubsub-js";

const UniversalBarcodeScanner = ({ externalShow = false, onClose = null }) => {
    // Props से modal control करें
    const [showModal, setShowModal] = useState(externalShow);
    const [scanning, setScanning] = useState(false);
    const [barcodeInput, setBarcodeInput] = useState("");
    const [detectedData, setDetectedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [bookDetails, setBookDetails] = useState({
        title: "",
        subtitle: "",
        authors: [],
        categories: [],
        description: "",
        pageCount: "",
        publisher: "",
        publishedDate: "",
        language: "",
        isbn10: "",
        isbn13: "",
        coverImage: "",
        pages: ""
    });
    const [authorDetails, setAuthorDetails] = useState({
        name: "",
        bio: "",
        email: "",
        website: ""
    });
    const [categoryDetails, setCategoryDetails] = useState({
        name: "",
        description: ""
    });
    const [publisherDetails, setPublisherDetails] = useState({
        name: "",
        address: "",
        website: ""
    });
    const [showAdvancedFields, setShowAdvancedFields] = useState(false);
    const navigate = useNavigate();
    const inputRef = useRef(null);

    const GOOGLE_BOOKS_API_KEY = "AIzaSyAC2OqFGAIdOaCSWswm-mjiwoY-kzPJT-0";

    // External show prop को track करें
    useEffect(() => {
        if (externalShow !== undefined) {
            setShowModal(externalShow);
        }
    }, [externalShow]);

    useEffect(() => {
        const token = PubSub.subscribe("OPEN_BARCODE_SCANNER", () => {
            setShowModal(true);
            setBarcodeInput("");
            setDetectedData(null);
            resetAllDetails();
        });

        return () => {
            PubSub.unsubscribe(token);
        };
    }, []);

    useEffect(() => {
        if (showModal && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [showModal]);

    useEffect(() => {
        const checkForISBN = async () => {
            if (barcodeInput.length >= 10) {
                const isbnCheck = isValidISBN(barcodeInput);
                if (isbnCheck && !loading && !detectedData) {
                    await detectAndProcessBarcode(barcodeInput.trim());
                }
            }
        };

        const timeoutId = setTimeout(checkForISBN, 500);
        return () => clearTimeout(timeoutId);
    }, [barcodeInput]);

    const resetAllDetails = () => {
        setBookDetails({
            title: "",
            subtitle: "",
            authors: [],
            categories: [],
            description: "",
            pageCount: "",
            publisher: "",
            publishedDate: "",
            language: "",
            isbn10: "",
            isbn13: "",
            coverImage: "",
            pages: ""
        });
        setAuthorDetails({
            name: "",
            bio: "",
            email: "",
            website: ""
        });
        setCategoryDetails({
            name: "",
            description: ""
        });
        setPublisherDetails({
            name: "",
            address: "",
            website: ""
        });
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setBarcodeInput("");
        setDetectedData(null);
        resetAllDetails();

        // Call onClose callback if provided
        if (onClose) {
            onClose();
        }
    };

    const handleBarcodeInput = (value) => {
        setBarcodeInput(value);
    };

    const isValidISBN = (isbn) => {
        if (!isbn) return false;

        const cleanIsbn = isbn.replace(/[^\dX]/gi, '').toUpperCase();

        if (cleanIsbn.length === 10) {
            const isbn10Regex = /^[\d]{9}[\dX]$/;
            if (isbn10Regex.test(cleanIsbn)) {
                return { type: 'isbn10', value: cleanIsbn };
            }
        }

        if (cleanIsbn.length === 13) {
            const isbn13Regex = /^[\d]{13}$/;
            if (isbn13Regex.test(cleanIsbn)) {
                return { type: 'isbn13', value: cleanIsbn };
            }
        }

        return false;
    };

    const extractISBNFromText = (text) => {
        if (!text) return null;

        const isbnPatterns = [
            /ISBN[-\s:]*([\d\-X]{10,17})/gi,
            /ISBN[-:]?\s*([\dX\-]{10,17})/gi,
            /([\dX\-]{10,17})\s*\(ISBN\)/gi,
            /([\dX]{10,13})/g
        ];

        for (const pattern of isbnPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                for (const match of matches) {
                    const cleanMatch = match.replace(/[^\dX]/gi, '').toUpperCase();
                    const isbnCheck = isValidISBN(cleanMatch);
                    if (isbnCheck) {
                        return isbnCheck;
                    }
                }
            }
        }

        const words = text.split(/\s+/);
        for (const word of words) {
            const cleanWord = word.replace(/[^\dX]/gi, '').toUpperCase();
            if (cleanWord.length >= 10) {
                const isbnCheck = isValidISBN(cleanWord);
                if (isbnCheck) {
                    return isbnCheck;
                }
            }
        }

        return null;
    };

    const detectAndProcessBarcode = async (barcode) => {
        if (!barcode || barcode.trim().length === 0) return;

        setLoading(true);
        resetAllDetails();

        try {
            const detectedType = await detectDataType(barcode.trim());

            if (detectedType && detectedType.type === "librarycard" && detectedType.navigate) {
                setLoading(false);
                handleCloseModal();
                navigate(detectedType.module);
                return;
            }

            setDetectedData(detectedType);

            if (detectedType && detectedType.type === "book") {
                await extractAllBookDetails(detectedType.data);
            }
        } catch (error) {
            console.error("Error detecting barcode data:", error);
            PubSub.publish("RECORD_ERROR_TOAST", {
                message: "Failed to process barcode data",
            });
        } finally {
            setLoading(false);
        }
    };

    const extractAllBookDetails = async (bookData) => {
        if (!bookData) return;

        if (bookData.title) {
            setBookDetails(prev => ({
                ...prev,
                title: bookData.title,
                subtitle: bookData.title || ""
            }));
        }

        if (bookData.subtitle && !bookDetails.subtitle) {
            setBookDetails(prev => ({
                ...prev,
                subtitle: bookData.title
            }));
        }

        if (bookData.author_name) {
            setBookDetails(prev => ({
                ...prev,
                authors: Array.isArray(bookData.author_name) ? bookData.author_name : [bookData.author_name]
            }));

            if (bookData.author_details) {
                setAuthorDetails({
                    name: bookData.author_details.name || bookData.author_name,
                    bio: bookData.author_details.bio || "",
                    email: bookData.author_details.email || "",
                    website: bookData.author_details.website || ""
                });
            }
        }

        if (bookData.category_name) {
            setBookDetails(prev => ({
                ...prev,
                categories: Array.isArray(bookData.category_name) ? bookData.category_name : [bookData.category_name]
            }));

            if (bookData.category_description) {
                setCategoryDetails({
                    name: bookData.category_name,
                    description: bookData.category_description
                });
            }
        }

        if (bookData.description) {
            setBookDetails(prev => ({
                ...prev,
                description: bookData.description
            }));
        }

        if (bookData.pageCount || bookData.pages) {
            const pages = bookData.pageCount || bookData.pages;
            setBookDetails(prev => ({
                ...prev,
                pageCount: pages,
                pages: pages
            }));
        }

        // ✅ FIX 3: Publisher details भी extract करें
        if (bookData.publisher) {
            setBookDetails(prev => ({
                ...prev,
                publisher: bookData.publisher
            }));

            if (bookData.publisher_details) {
                setPublisherDetails({
                    name: bookData.publisher_details.name || bookData.publisher,
                    address: bookData.publisher_details.address || "",
                    website: bookData.publisher_details.website || ""
                });
            } else {
                setPublisherDetails({
                    name: bookData.publisher,
                    address: "",
                    website: ""
                });
            }
        }

        if (bookData.published_date || bookData.publishedDate) {
            setBookDetails(prev => ({
                ...prev,
                publishedDate: bookData.published_date || bookData.publishedDate
            }));
        }

        if (bookData.language) {
            setBookDetails(prev => ({
                ...prev,
                language: bookData.language
            }));
        }

        if (bookData.isbn) {
            if (bookData.isbn.length === 10) {
                setBookDetails(prev => ({
                    ...prev,
                    isbn10: bookData.isbn
                }));
            } else if (bookData.isbn.length === 13) {
                setBookDetails(prev => ({
                    ...prev,
                    isbn13: bookData.isbn
                }));
            }
        } else if (bookData.isbn10) {
            setBookDetails(prev => ({
                ...prev,
                isbn10: bookData.isbn10
            }));
        } else if (bookData.isbn13) {
            setBookDetails(prev => ({
                ...prev,
                isbn13: bookData.isbn13
            }));
        }

        if (bookData.cover_image) {
            setBookDetails(prev => ({
                ...prev,
                coverImage: bookData.cover_image
            }));
        }

        // Google Books से complete details fetch करें
        const isbnToCheck = bookData.isbn || bookData.isbn13 || bookData.isbn10 || barcodeInput;
        const isbnCheck = isValidISBN(isbnToCheck);
        if (isbnCheck) {
            await fetchCompleteBookDetails(isbnCheck.value);
        }
    };

    const fetchCompleteBookDetails = async (isbn) => {
        try {
            const googleBooksData = await fetchBookFromGoogleBooks(isbn);

            if (!googleBooksData) return;

            const mergedData = { ...bookDetails };

            // ✅ FIX 4: Google Books से आया पूरा टाइटल use करें
            if (googleBooksData.title) {
                mergedData.title = googleBooksData.title;
            }

            if (googleBooksData.subtitle && !mergedData.subtitle) {
                mergedData.subtitle = googleBooksData.subtitle;
            }

            if (googleBooksData.authors && googleBooksData.authors.length > 0) {
                mergedData.authors = googleBooksData.authors;
                if (googleBooksData.author_details) {
                    setAuthorDetails({
                        name: googleBooksData.author_details.name || googleBooksData.authors[0],
                        bio: googleBooksData.author_details.bio || "",
                        email: googleBooksData.author_details.email || "",
                        website: googleBooksData.author_details.website || ""
                    });
                }
            }

            if (googleBooksData.categories && googleBooksData.categories.length > 0) {
                mergedData.categories = googleBooksData.categories;
                if (googleBooksData.category_description) {
                    setCategoryDetails({
                        name: googleBooksData.categories[0],
                        description: googleBooksData.category_description
                    });
                }
            }

            if (googleBooksData.description && !mergedData.description) {
                mergedData.description = googleBooksData.description;
            }

            if (googleBooksData.pageCount || googleBooksData.pages) {
                const pages = googleBooksData.pageCount || googleBooksData.pages;
                mergedData.pageCount = pages;
                mergedData.pages = pages;
            }

            // ✅ FIX 5: Publisher details Google Books से भी लें
            if (googleBooksData.publisher && !mergedData.publisher) {
                mergedData.publisher = googleBooksData.publisher;

                if (googleBooksData.publisher_details) {
                    setPublisherDetails({
                        name: googleBooksData.publisher_details.name || googleBooksData.publisher,
                        address: googleBooksData.publisher_details.address || "",
                        website: googleBooksData.publisher_details.website || ""
                    });
                } else {
                    setPublisherDetails(prev => ({
                        ...prev,
                        name: googleBooksData.publisher
                    }));
                }
            }

            if (googleBooksData.publishedDate && !mergedData.publishedDate) {
                mergedData.publishedDate = googleBooksData.publishedDate;
            }

            if (googleBooksData.language && !mergedData.language) {
                mergedData.language = googleBooksData.language;
            }

            if (googleBooksData.isbn13 && !mergedData.isbn13) {
                mergedData.isbn13 = googleBooksData.isbn13;
            }

            if (googleBooksData.isbn10 && !mergedData.isbn10) {
                mergedData.isbn10 = googleBooksData.isbn10;
            }

            if (googleBooksData.coverImage && !mergedData.coverImage) {
                mergedData.coverImage = googleBooksData.coverImage;
            }

            setBookDetails(mergedData);

            if (detectedData && detectedData.type === "book") {
                const pagesValue = mergedData.pageCount || mergedData.pages || detectedData.data.pages;

                const updatedBookData = {
                    ...detectedData.data,
                    title: mergedData.title || detectedData.data.title,
                    subtitle: mergedData.subtitle || detectedData.data.subtitle,
                    author_name: mergedData.authors?.join(", ") || detectedData.data.author_name,
                    category_name: mergedData.categories?.[0] || detectedData.data.category_name,
                    description: mergedData.description || detectedData.data.description,
                    pages: pagesValue,
                    publisher: mergedData.publisher || detectedData.data.publisher,
                    published_date: mergedData.publishedDate || detectedData.data.published_date,
                    language: mergedData.language || detectedData.data.language,
                    isbn_10: mergedData.isbn10 || detectedData.data.isbn_10,
                    isbn_13: mergedData.isbn13 || detectedData.data.isbn_13,
                    cover_image: mergedData.coverImage || detectedData.data.cover_image,
                    publisher_name: mergedData.publisher || detectedData.data.publisher // Publisher name add करें
                };

                setDetectedData({
                    ...detectedData,
                    data: updatedBookData,
                    fullData: googleBooksData
                });
            }

        } catch (error) {
            console.error("Error fetching complete book details:", error);
        }
    };

    const detectDataType = async (barcode) => {
        const isbnCheck = isValidISBN(barcode);
        if (!isbnCheck) {
            const extractedISBN = extractISBNFromText(barcode);
            if (extractedISBN) {
                const bookData = await fetchBookFromGoogleBooks(extractedISBN.value);
                return await processBookData(bookData, extractedISBN.value);
            }
        } else {
            const bookData = await fetchBookFromGoogleBooks(isbnCheck.value);
            return await processBookData(bookData, isbnCheck.value);
        }

        const cardNumberPattern = /^(LIB|LC-?)?[A-Z0-9]{6,20}$/i;
        const barcodeTrimmed = barcode.trim();
        if (cardNumberPattern.test(barcodeTrimmed)) {
            try {
                const cardApi = new DataApi("librarycard");
                const allCards = await cardApi.fetchAll();
                if (allCards && allCards.data) {
                    const cards = Array.isArray(allCards.data) ? allCards.data : (allCards.data.data || []);
                    const foundCard = cards.find(card => {
                        if (!card.card_number) return false;
                        if (card.card_number.toUpperCase() === barcodeTrimmed.toUpperCase()) return true;
                        if (card.card_number.toUpperCase().includes(barcodeTrimmed.toUpperCase()) ||
                            barcodeTrimmed.toUpperCase().includes(card.card_number.toUpperCase())) return true;
                        return false;
                    });

                    if (foundCard) {
                        return {
                            type: "librarycard",
                            data: foundCard,
                            module: `/librarycard/${foundCard.id}`,
                            navigate: true
                        };
                    }
                }
            } catch (error) {
                console.error("Error checking library card:", error);
            }
        }

        try {
            const jsonData = JSON.parse(barcode);
            const result = await analyzeJsonData(jsonData);
            if (result) return result;
        } catch (e) {
            // Not JSON
        }

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

        if (/^\+?[\d\s-()]{10,}$/.test(barcode) && barcode.length >= 10) {
            return {
                type: "supplier",
                data: { phone: barcode.trim() },
                module: "/supplier",
            };
        }

        if (/^[A-Za-z\s.]+$/.test(barcode) && (barcode.split(/\s+/).length >= 2 || barcode.length >= 3)) {
            const words = barcode.trim().split(/\s+/);
            if (words.length >= 1 && words.every(w => w.length >= 2)) {
                return {
                    type: "author",
                    data: { name: barcode.trim() },
                    module: "/author",
                };
            }
        }

        if (/^[A-Za-z]+$/.test(barcode) && barcode.length >= 3 && barcode.length <= 30) {
            return {
                type: "category",
                data: { name: barcode.trim() },
                module: "/category",
            };
        }

        if (/^[A-Za-z0-9\s&.,-]+$/.test(barcode) && barcode.length > 2) {
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

        if (/\d/.test(barcode) && /[A-Za-z]/.test(barcode)) {
            const possibleIsbns = barcode.match(/[\dX]{10,13}/g);
            if (possibleIsbns) {
                for (const possibleIsbn of possibleIsbns) {
                    const isbnCheck = isValidISBN(possibleIsbn);
                    if (isbnCheck) {
                        const isbn = isbnCheck.value;
                        const title = barcode.replace(possibleIsbn, "").trim();

                        const bookData = await fetchBookFromGoogleBooks(isbn);

                        if (title && !bookData.title) {
                            bookData.title = title;
                        }

                        return await processBookData(bookData, isbn);
                    }
                }
            }
        }

        if (barcode.length > 3) {
            return {
                type: "book",
                data: {
                    title: barcode.trim(),
                    total_copies: 1,
                    available_copies: 1,
                    pages: 0
                },
                module: "/book",
            };
        }

        return null;
    };

    const processBookData = async (bookData, isbn) => {
        // ✅ FIX 6: Publisher भी create करें
        if (bookData.publisher) {
            const publisherId = await findOrCreatePublisher(bookData.publisher, bookData.publisher_details);
            if (publisherId) {
                bookData.publisher_id = publisherId;
            }
        }

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

        const cleanedBookData = {
            ...bookData,
            isbn: isbn,
            total_copies: bookData.total_copies || 1,
            available_copies: bookData.available_copies || 1,
            pages: bookData.pageCount || bookData.pages || 0
        };

        delete cleanedBookData.author_details;
        delete cleanedBookData.category_description;
        delete cleanedBookData.publisher_details;
        delete cleanedBookData.pageCount;

        return {
            type: "book",
            data: cleanedBookData,
            module: "/book",
            fullData: bookData
        };
    };

    // ✅ FIX 7: Publisher create/update function
    const findOrCreatePublisher = async (publisherName, publisherDetails = null) => {
        try {
            const publisherApi = new DataApi("publisher");
            const publishersResponse = await publisherApi.fetchAll();

            if (publishersResponse.data && Array.isArray(publishersResponse.data)) {
                // Clean publisher name
                const cleanPublisherName = publisherName.trim();

                let foundPublisher = publishersResponse.data.find(p =>
                    p.name && p.name.toLowerCase() === cleanPublisherName.toLowerCase()
                );

                if (!foundPublisher) {
                    const publisherData = {
                        name: cleanPublisherName,
                        address: publisherDetails?.address || "",
                        website: publisherDetails?.website || "",
                        contact_person: publisherDetails?.contact_person || ""
                    };

                    const newPublisherResponse = await publisherApi.create(publisherData);

                    if (newPublisherResponse.data && newPublisherResponse.data.success) {
                        foundPublisher = newPublisherResponse.data.data;
                        PubSub.publish("RECORD_SAVED_TOAST", {
                            message: `Publisher "${cleanPublisherName}" created successfully`,
                        });

                        return foundPublisher.id;
                    }
                } else {
                    // Update publisher details if needed
                    if (publisherDetails) {
                        const updateData = {};
                        if (publisherDetails.address && !foundPublisher.address) {
                            updateData.address = publisherDetails.address;
                        }
                        if (publisherDetails.website && !foundPublisher.website) {
                            updateData.website = publisherDetails.website;
                        }
                        if (publisherDetails.contact_person && !foundPublisher.contact_person) {
                            updateData.contact_person = publisherDetails.contact_person;
                        }
                        if (Object.keys(updateData).length > 0) {
                            try {
                                await publisherApi.update({ ...foundPublisher, ...updateData }, foundPublisher.id);
                            } catch (e) {
                                // Silent fail
                            }
                        }
                    }
                    return foundPublisher.id;
                }
            }
        } catch (error) {
            console.error("Error finding/creating publisher:", error);
        }
        return null;
    };

    const findOrCreateAuthor = async (authorName, authorDetails = null) => {
        try {
            const authorApi = new DataApi("author");
            const authorsResponse = await authorApi.fetchAll();

            if (authorsResponse.data && Array.isArray(authorsResponse.data)) {
                const authorNames = authorName.split(",").map(a => a.trim());
                const primaryAuthorName = authorNames[0];

                let foundAuthor = authorsResponse.data.find(a =>
                    a.name && a.name.toLowerCase() === primaryAuthorName.toLowerCase()
                );

                if (!foundAuthor) {
                    const authorData = {
                        name: primaryAuthorName,
                        email: authorDetails?.email || "",
                        bio: authorDetails?.bio || "",
                        website: authorDetails?.website || ""
                    };

                    const newAuthorResponse = await authorApi.create(authorData);
                    if (newAuthorResponse.data && newAuthorResponse.data.success) {
                        foundAuthor = newAuthorResponse.data.data;
                        PubSub.publish("RECORD_SAVED_TOAST", {
                            message: `Author "${primaryAuthorName}" created successfully`,
                        });
                    }
                } else {
                    if (authorDetails) {
                        const updateData = {};
                        if (authorDetails.email && !foundAuthor.email) {
                            updateData.email = authorDetails.email;
                        }
                        if (authorDetails.bio && !foundAuthor.bio) {
                            updateData.bio = authorDetails.bio;
                        }
                        if (authorDetails.website && !foundAuthor.website) {
                            updateData.website = authorDetails.website;
                        }
                        if (Object.keys(updateData).length > 0) {
                            try {
                                await authorApi.update({ ...foundAuthor, ...updateData }, foundAuthor.id);
                            } catch (e) {
                                // Silent fail
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

    const findOrCreateCategory = async (categoryName, categoryDescription = null) => {
        try {
            const categoryApi = new DataApi("category");
            const categoriesResponse = await categoryApi.fetchAll();

            if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
                let foundCategory = categoriesResponse.data.find(c =>
                    c.name && c.name.toLowerCase() === categoryName.toLowerCase()
                );

                if (!foundCategory) {
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
                    if (categoryDescription && !foundCategory.description) {
                        try {
                            await categoryApi.update({ ...foundCategory, description: categoryDescription }, foundCategory.id);
                        } catch (e) {
                            // Silent fail
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

    const fetchBookFromGoogleBooks = async (isbn) => {
        const bookData = {
            isbn: isbn,
            title: "",
            subtitle: "",
            authors: [],
            categories: [],
            description: "",
            pageCount: 0,
            pages: 0,
            publisher: "",
            publishedDate: "",
            language: "",
            isbn10: "",
            isbn13: "",
            coverImage: "",
            total_copies: 1,
            available_copies: 1,
        };

        try {
            const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${GOOGLE_BOOKS_API_KEY}`;

            const response = await fetch(googleBooksUrl);

            if (response.ok) {
                const data = await response.json();

                if (data.items && data.items.length > 0) {
                    const volumeInfo = data.items[0].volumeInfo;

                    // ✅ FIX 8: Google Books से पूरा टाइटल और subtitle अलग-अलग लें
                    if (volumeInfo.title) {
                        bookData.title = volumeInfo.title;
                    }

                    if (volumeInfo.subtitle) {
                        bookData.subtitle = volumeInfo.subtitle;
                    }

                    if (volumeInfo.authors && volumeInfo.authors.length > 0) {
                        bookData.author_name = volumeInfo.authors.join(", ");
                        bookData.authors = volumeInfo.authors;
                        bookData.author_details = {
                            name: volumeInfo.authors[0],
                            bio: volumeInfo.description || "",
                            email: "",
                            website: ""
                        };
                    }

                    if (volumeInfo.categories && volumeInfo.categories.length > 0) {
                        const category = volumeInfo.categories[0];
                        bookData.category_name = category
                            .split("/")[0]
                            .split(",")[0]
                            .trim();
                        bookData.categories = volumeInfo.categories;
                        bookData.category_description = volumeInfo.categories.join(", ");
                    }

                    if (volumeInfo.description) {
                        bookData.description = volumeInfo.description;
                    }

                    if (volumeInfo.pageCount) {
                        bookData.pageCount = volumeInfo.pageCount;
                        bookData.pages = volumeInfo.pageCount;
                    }

                    if (volumeInfo.publisher) {
                        bookData.publisher = volumeInfo.publisher;
                        bookData.publisher_details = {
                            name: volumeInfo.publisher,
                            address: "",
                            website: ""
                        };
                    }

                    if (volumeInfo.publishedDate) {
                        bookData.publishedDate = volumeInfo.publishedDate;
                        bookData.published_date = volumeInfo.publishedDate;
                    }

                    if (volumeInfo.language) {
                        bookData.language = volumeInfo.language.toUpperCase();
                    }

                    if (volumeInfo.industryIdentifiers) {
                        const isbn13 = volumeInfo.industryIdentifiers.find(id => id.type === "ISBN_13");
                        const isbn10 = volumeInfo.industryIdentifiers.find(id => id.type === "ISBN_10");

                        if (isbn13) {
                            bookData.isbn = isbn13.identifier;
                            bookData.isbn13 = isbn13.identifier;
                        } else if (isbn10) {
                            bookData.isbn = isbn10.identifier;
                            bookData.isbn10 = isbn10.identifier;
                        }
                    }

                    if (volumeInfo.imageLinks) {
                        bookData.coverImage = volumeInfo.imageLinks.thumbnail ||
                            volumeInfo.imageLinks.smallThumbnail ||
                            volumeInfo.imageLinks.medium ||
                            volumeInfo.imageLinks.large;
                        bookData.cover_image = bookData.coverImage;
                    }

                    return bookData;
                } else {
                    bookData.title = `Book with ISBN: ${isbn}`;
                    return bookData;
                }
            } else {
                bookData.title = `Book with ISBN: ${isbn}`;
                return bookData;
            }
        } catch (error) {
            console.error("Error fetching from Google Books API:", error);
            bookData.title = `Book with ISBN: ${isbn}`;
            return bookData;
        }
    };

    const analyzeJsonData = async (data) => {
        if (!data || typeof data !== "object") return null;

        if (data.isbn || data.title || data.bookTitle || data.book_title) {
            let bookData = {
                title: data.title || data.bookTitle || data.book_title || "",
                subtitle: data.subtitle || "",
                isbn: data.isbn || data.ISBN || "",
                author_id: data.author_id || data.authorId || "",
                category_id: data.category_id || data.categoryId || "",
                publisher_id: data.publisher_id || data.publisherId || "",
                description: data.description || data.bookDescription || "",
                pageCount: data.pageCount || data.pages || 0,
                pages: data.pages || data.pageCount || 0,
                publisher: data.publisher || "",
                publishedDate: data.publishedDate || data.published_date || "",
                language: data.language || "",
                coverImage: data.coverImage || data.cover_image || "",
                total_copies: data.total_copies || data.totalCopies || 1,
                available_copies: data.available_copies || data.availableCopies || 1,
            };

            if (bookData.isbn && !bookData.title) {
                const fetchedData = await fetchBookFromGoogleBooks(bookData.isbn);
                bookData = { ...fetchedData, ...bookData };
            }

            return {
                type: "book",
                data: bookData,
                module: "/book",
                fullData: bookData
            };
        }

        if (data.authorName || data.author_name || (data.name && !data.email && !data.phone)) {
            if (!data.email && !data.phone && !data.address) {
                return {
                    type: "author",
                    data: {
                        name: data.name || data.authorName || data.author_name || data.author || "",
                        bio: data.bio || "",
                        email: data.email || "",
                        website: data.website || ""
                    },
                    module: "/author",
                };
            }
        }

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

        if (data.category || data.categoryName || data.category_name) {
            return {
                type: "category",
                data: {
                    name: data.category || data.categoryName || data.category_name || "",
                    description: data.description || data.categoryDescription || ""
                },
                module: "/category",
            };
        }

        if (data.name) {
            if (data.name.split(/\s+/).length === 1 && data.name.length <= 30) {
                return {
                    type: "category",
                    data: {
                        name: data.name,
                        description: data.description || ""
                    },
                    module: "/category",
                };
            }
            return {
                type: "author",
                data: {
                    name: data.name,
                    bio: data.bio || "",
                    email: data.email || "",
                    website: data.website || ""
                },
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
            let dataToInsert = { ...detectedData.data };

            if (detectedData.type === "book") {
                // ✅ FIX 9: पूरा टाइटल insert करें
                const fullTitle = bookDetails.title || dataToInsert.title;
                const fullSubtitle = bookDetails.subtitle || dataToInsert.subtitle;

                // Combine title and subtitle if needed
                if (fullSubtitle && !fullTitle.includes(fullSubtitle)) {
                    dataToInsert.title = `${fullTitle}: ${fullSubtitle}`;
                } else {
                    dataToInsert.title = fullTitle;
                }

                dataToInsert.description = bookDetails.description || dataToInsert.description || "";

                const pagesValue = bookDetails.pages || bookDetails.pageCount;
                if (pagesValue) {
                    dataToInsert.pages = parseInt(pagesValue) || 0;
                }

                dataToInsert.publisher = bookDetails.publisher || dataToInsert.publisher || "";
                dataToInsert.published_date = bookDetails.publishedDate || dataToInsert.published_date || "";
                dataToInsert.language = bookDetails.language || dataToInsert.language || "";
                dataToInsert.isbn_10 = bookDetails.isbn10 || dataToInsert.isbn_10 || "";
                dataToInsert.isbn_13 = bookDetails.isbn13 || dataToInsert.isbn_13 || "";
                dataToInsert.cover_image = bookDetails.coverImage || dataToInsert.cover_image || "";

                if (!dataToInsert.isbn) {
                    dataToInsert.isbn = dataToInsert.isbn_13 || dataToInsert.isbn_10 || `SCAN-${Date.now()}`;
                }
                if (!dataToInsert.total_copies) dataToInsert.total_copies = 1;
                if (!dataToInsert.available_copies) dataToInsert.available_copies = 1;
                if (!dataToInsert.author_id) dataToInsert.author_id = null;
                if (!dataToInsert.category_id) dataToInsert.category_id = null;
                if (!dataToInsert.publisher_id) dataToInsert.publisher_id = null;

            } else if (detectedData.type === "author") {
                if (!dataToInsert.name) dataToInsert.name = "Scanned Author";
                dataToInsert.bio = authorDetails.bio || dataToInsert.bio || "";
                dataToInsert.email = authorDetails.email || dataToInsert.email || "";
                dataToInsert.website = authorDetails.website || dataToInsert.website || "";

            } else if (detectedData.type === "category") {
                if (!dataToInsert.name) dataToInsert.name = "Scanned Category";
                dataToInsert.description = categoryDetails.description || dataToInsert.description || "";

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
                handleCloseModal();
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

    const renderBookDetails = () => {
        if (!detectedData || detectedData.type !== "book") return null;

        return (
            <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 style={{ color: "var(--primary-color)", fontWeight: "600" }}>
                        <i className="fa-solid fa-book me-2"></i>Book Details
                    </h6>
                    <Button
                        variant="link"
                        onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                        style={{ color: "var(--primary-color)", textDecoration: "none", fontSize: "14px" }}
                    >
                        <i className={`fa-solid fa-${showAdvancedFields ? "chevron-up" : "chevron-down"} me-2`}></i>
                        {showAdvancedFields ? "Hide Details" : "Show Details"}
                    </Button>
                </div>

                <Row className="mb-3">
                    <Col md={12}>
                        <Form.Group>
                            <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                Title <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                                type="text"
                                value={bookDetails.title}
                                onChange={(e) => setBookDetails({ ...bookDetails, title: e.target.value })}
                                placeholder="Full book title"
                                style={{ fontSize: "14px" }}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col md={12}>
                        <Form.Group>
                            <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                Subtitle
                            </Form.Label>
                            <Form.Control
                                type="text"
                                value={bookDetails.subtitle}
                                onChange={(e) => setBookDetails({ ...bookDetails, subtitle: e.target.value })}
                                placeholder="Book subtitle (if any)"
                                style={{ fontSize: "14px" }}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                Authors
                            </Form.Label>
                            <Form.Control
                                type="text"
                                value={bookDetails.authors.join(", ")}
                                onChange={(e) => setBookDetails({ ...bookDetails, authors: e.target.value.split(",").map(a => a.trim()) })}
                                placeholder="Enter authors, separated by commas"
                                style={{ fontSize: "14px" }}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                ISBN-13
                            </Form.Label>
                            <Form.Control
                                type="text"
                                value={bookDetails.isbn13}
                                onChange={(e) => setBookDetails({ ...bookDetails, isbn13: e.target.value })}
                                placeholder="13-digit ISBN"
                                style={{ fontSize: "14px" }}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                {showAdvancedFields && (
                    <>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                        Categories
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={bookDetails.categories.join(", ")}
                                        onChange={(e) => setBookDetails({ ...bookDetails, categories: e.target.value.split(",").map(c => c.trim()) })}
                                        placeholder="Enter categories, separated by commas"
                                        style={{ fontSize: "14px" }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                        ISBN-10
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={bookDetails.isbn10}
                                        onChange={(e) => setBookDetails({ ...bookDetails, isbn10: e.target.value })}
                                        placeholder="10-digit ISBN"
                                        style={{ fontSize: "14px" }}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                        Publisher
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={bookDetails.publisher}
                                        onChange={(e) => setBookDetails({ ...bookDetails, publisher: e.target.value })}
                                        placeholder="Publisher name"
                                        style={{ fontSize: "14px" }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                        Published Date
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={bookDetails.publishedDate}
                                        onChange={(e) => setBookDetails({ ...bookDetails, publishedDate: e.target.value })}
                                        placeholder="YYYY-MM-DD"
                                        style={{ fontSize: "14px" }}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                        Language
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={bookDetails.language}
                                        onChange={(e) => setBookDetails({ ...bookDetails, language: e.target.value })}
                                        placeholder="e.g., EN, HI"
                                        style={{ fontSize: "14px" }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                        Page Count
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={bookDetails.pages || bookDetails.pageCount || ""}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setBookDetails({
                                                ...bookDetails,
                                                pages: value,
                                                pageCount: value
                                            });

                                            if (detectedData && detectedData.type === "book") {
                                                setDetectedData({
                                                    ...detectedData,
                                                    data: {
                                                        ...detectedData.data,
                                                        pages: parseInt(value) || 0
                                                    }
                                                });
                                            }
                                        }}
                                        placeholder="Number of pages"
                                        style={{ fontSize: "14px" }}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                        Description
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={bookDetails.description}
                                        onChange={(e) => setBookDetails({ ...bookDetails, description: e.target.value })}
                                        placeholder="Book description"
                                        style={{ fontSize: "14px" }}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                        Cover Image URL
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={bookDetails.coverImage}
                                        onChange={(e) => setBookDetails({ ...bookDetails, coverImage: e.target.value })}
                                        placeholder="Cover image URL"
                                        style={{ fontSize: "14px" }}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {bookDetails.coverImage && (
                            <div className="text-center mb-3">
                                <img
                                    src={bookDetails.coverImage}
                                    alt="Book Cover"
                                    style={{
                                        maxWidth: "150px",
                                        maxHeight: "200px",
                                        borderRadius: "8px",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                                    }}
                                />
                            </div>
                        )}

                        <h6 style={{ color: "var(--primary-color)", fontWeight: "600", marginTop: "20px", marginBottom: "15px" }}>
                            <i className="fa-solid fa-user-pen me-2"></i>Author Details
                        </h6>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                        Author Name
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={authorDetails.name}
                                        onChange={(e) => setAuthorDetails({ ...authorDetails, name: e.target.value })}
                                        placeholder="Author name"
                                        style={{ fontSize: "14px" }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                        Author Email
                                    </Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={authorDetails.email}
                                        onChange={(e) => setAuthorDetails({ ...authorDetails, email: e.target.value })}
                                        placeholder="author@example.com"
                                        style={{ fontSize: "14px" }}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                        Author Bio
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        value={authorDetails.bio}
                                        onChange={(e) => setAuthorDetails({ ...authorDetails, bio: e.target.value })}
                                        placeholder="Author biography"
                                        style={{ fontSize: "14px" }}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <h6 style={{ color: "var(--primary-color)", fontWeight: "600", marginTop: "20px", marginBottom: "15px" }}>
                            <i className="fa-solid fa-tags me-2"></i>Category Details
                        </h6>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                        Category Name
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={categoryDetails.name}
                                        onChange={(e) => setCategoryDetails({ ...categoryDetails, name: e.target.value })}
                                        placeholder="Category name"
                                        style={{ fontSize: "14px" }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                        Description
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={categoryDetails.description}
                                        onChange={(e) => setCategoryDetails({ ...categoryDetails, description: e.target.value })}
                                        placeholder="Category description"
                                        style={{ fontSize: "14px" }}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <h6 style={{ color: "var(--primary-color)", fontWeight: "600", marginTop: "20px", marginBottom: "15px" }}>
                            <i className="fa-solid fa-building me-2"></i>Publisher Details
                        </h6>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                        Publisher Name
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={publisherDetails.name}
                                        onChange={(e) => setPublisherDetails({ ...publisherDetails, name: e.target.value })}
                                        placeholder="Publisher name"
                                        style={{ fontSize: "14px" }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                        Website
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={publisherDetails.website}
                                        onChange={(e) => setPublisherDetails({ ...publisherDetails, website: e.target.value })}
                                        placeholder="Publisher website"
                                        style={{ fontSize: "14px" }}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                        Address
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        value={publisherDetails.address}
                                        onChange={(e) => setPublisherDetails({ ...publisherDetails, address: e.target.value })}
                                        placeholder="Publisher address"
                                        style={{ fontSize: "14px" }}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </>
                )}

                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                Total Copies
                            </Form.Label>
                            <Form.Control
                                type="number"
                                min="1"
                                value={detectedData.data.total_copies || 1}
                                onChange={(e) => setDetectedData({
                                    ...detectedData,
                                    data: {
                                        ...detectedData.data,
                                        total_copies: parseInt(e.target.value) || 1
                                    }
                                })}
                                style={{ fontSize: "14px" }}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                Available Copies
                            </Form.Label>
                            <Form.Control
                                type="number"
                                min="0"
                                max={detectedData.data.total_copies || 1}
                                value={detectedData.data.available_copies || 1}
                                onChange={(e) => setDetectedData({
                                    ...detectedData,
                                    data: {
                                        ...detectedData.data,
                                        available_copies: parseInt(e.target.value) || 1
                                    }
                                })}
                                style={{ fontSize: "14px" }}
                            />
                        </Form.Group>
                    </Col>
                </Row>
            </div>
        );
    };

    const renderOtherDetails = () => {
        if (!detectedData || detectedData.type === "book") return null;

        if (detectedData.type === "author") {
            return (
                <div className="mt-4">
                    <h6 style={{ color: "var(--primary-color)", fontWeight: "600", marginBottom: "15px" }}>
                        <i className="fa-solid fa-user-pen me-2"></i>Author Details
                    </h6>
                    <Row className="mb-3">
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                    Name <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    value={authorDetails.name || detectedData.data.name || ""}
                                    onChange={(e) => {
                                        setAuthorDetails({ ...authorDetails, name: e.target.value });
                                        setDetectedData({
                                            ...detectedData,
                                            data: { ...detectedData.data, name: e.target.value }
                                        });
                                    }}
                                    placeholder="Author name"
                                    style={{ fontSize: "14px" }}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                    Email
                                </Form.Label>
                                <Form.Control
                                    type="email"
                                    value={authorDetails.email || ""}
                                    onChange={(e) => setAuthorDetails({ ...authorDetails, email: e.target.value })}
                                    placeholder="author@example.com"
                                    style={{ fontSize: "14px" }}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                    Website
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    value={authorDetails.website || ""}
                                    onChange={(e) => setAuthorDetails({ ...authorDetails, website: e.target.value })}
                                    placeholder="Author website"
                                    style={{ fontSize: "14px" }}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                    Bio
                                </Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={authorDetails.bio || ""}
                                    onChange={(e) => setAuthorDetails({ ...authorDetails, bio: e.target.value })}
                                    placeholder="Author biography"
                                    style={{ fontSize: "14px" }}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </div>
            );
        }

        if (detectedData.type === "category") {
            return (
                <div className="mt-4">
                    <h6 style={{ color: "var(--primary-color)", fontWeight: "600", marginBottom: "15px" }}>
                        <i className="fa-solid fa-tags me-2"></i>Category Details
                    </h6>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                    Name <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    value={categoryDetails.name || detectedData.data.name || ""}
                                    onChange={(e) => {
                                        setCategoryDetails({ ...categoryDetails, name: e.target.value });
                                        setDetectedData({
                                            ...detectedData,
                                            data: { ...detectedData.data, name: e.target.value }
                                        });
                                    }}
                                    placeholder="Category name"
                                    style={{ fontSize: "14px" }}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                    Description
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    value={categoryDetails.description || ""}
                                    onChange={(e) => setCategoryDetails({ ...categoryDetails, description: e.target.value })}
                                    placeholder="Category description"
                                    style={{ fontSize: "14px" }}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </div>
            );
        }

        if (detectedData.type === "supplier") {
            return (
                <div className="mt-4">
                    <h6 style={{ color: "var(--primary-color)", fontWeight: "600", marginBottom: "15px" }}>
                        <i className="fa-solid fa-truck me-2"></i>Supplier Details
                    </h6>
                    <Row className="mb-3">
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                    Name <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    value={detectedData.data.name || ""}
                                    onChange={(e) => setDetectedData({
                                        ...detectedData,
                                        data: { ...detectedData.data, name: e.target.value }
                                    })}
                                    placeholder="Supplier name"
                                    style={{ fontSize: "14px" }}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                    Email
                                </Form.Label>
                                <Form.Control
                                    type="email"
                                    value={detectedData.data.email || ""}
                                    onChange={(e) => setDetectedData({
                                        ...detectedData,
                                        data: { ...detectedData.data, email: e.target.value }
                                    })}
                                    placeholder="supplier@example.com"
                                    style={{ fontSize: "14px" }}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                    Phone
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    value={detectedData.data.phone || ""}
                                    onChange={(e) => setDetectedData({
                                        ...detectedData,
                                        data: { ...detectedData.data, phone: e.target.value }
                                    })}
                                    placeholder="Phone number"
                                    style={{ fontSize: "14px" }}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label style={{ fontSize: "14px", fontWeight: "500" }}>
                                    Address
                                </Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={detectedData.data.address || ""}
                                    onChange={(e) => setDetectedData({
                                        ...detectedData,
                                        data: { ...detectedData.data, address: e.target.value }
                                    })}
                                    placeholder="Supplier address"
                                    style={{ fontSize: "14px" }}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </div>
            );
        }

        return null;
    };

    // Agar externalShow true hai, तो Modal न render करें
    if (externalShow) {
        return (
            <div>
                <div className="mb-4">
                    <Form.Label style={{ fontWeight: "500", color: "#333", marginBottom: "10px", fontSize: "14px" }}>
                        <i className="fa-solid fa-qrcode me-2" style={{ color: "var(--primary-color)" }}></i>Scan or Enter ISBN/Barcode/Data
                    </Form.Label>
                    <InputGroup>
                        <InputGroup.Text style={{ background: "var(--primary-background-color)", borderColor: "#e9ecef" }}>
                            <i className="fa-solid fa-barcode" style={{ color: "var(--primary-color)" }}></i>
                        </InputGroup.Text>
                        <Form.Control
                            ref={inputRef}
                            type="text"
                            placeholder="Enter ISBN (10 or 13 digits), author name, supplier info, category, or paste JSON data..."
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
                            }}
                            onFocus={(e) => e.target.style.borderColor = "var(--primary-color)"}
                            onBlur={(e) => e.target.style.borderColor = "#e9ecef"}
                            autoFocus
                        />
                        <Button
                            variant="outline-primary"
                            onClick={handleManualInput}
                            disabled={!barcodeInput.trim() || loading}
                            style={{
                                borderColor: "#8b5cf6",
                                color: "#8b5cf6",
                                background: "#e9d5ff"
                            }}
                        >
                            <i className="fa-solid fa-search"></i>
                        </Button>
                    </InputGroup>
                    <Form.Text className="text-muted" style={{ fontSize: "12px", marginTop: "6px", display: "block" }}>
                        <i className="fa-solid fa-info-circle me-1"></i>
                        Enter ISBN (10 or 13 digits) - book data will be fetched automatically from Google Books API.
                        Also supports author names, supplier info, category, or JSON data.
                    </Form.Text>
                </div>

                {loading && (
                    <Alert
                        variant="info"
                        className="text-center"
                        style={{
                            background: "#e9d5ff",
                            borderColor: "#8b5cf6",
                            color: "#8b5cf6",
                            borderRadius: "8px",
                            padding: "16px"
                        }}
                    >
                        <i className="fa-solid fa-spinner fa-spin me-2"></i>
                        <strong>
                            {isValidISBN(barcodeInput)
                                ? `Fetching complete book data from Google Books for ISBN: ${barcodeInput}...`
                                : "Detecting data type and fetching details..."}
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
                            padding: "16px",
                            marginBottom: "20px"
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
                    </Alert>
                )}

                {renderBookDetails()}
                {renderOtherDetails()}

                {!detectedData && barcodeInput.length >= 10 && !loading && (
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
                                    The scanner will automatically fetch book data for valid ISBNs.
                                </div>
                            </div>
                        </div>
                    </Alert>
                )}

                <div className="d-flex justify-content-end mt-4">
                    <Button
                        variant="outline-secondary"
                        onClick={handleCloseModal}
                        style={{
                            borderColor: "#8b5cf6",
                            color: "#8b5cf6",
                            background: "white",
                            padding: "8px 20px",
                            borderRadius: "6px",
                            marginRight: "10px"
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleInsert}
                        disabled={!detectedData || loading}
                        style={{
                            background: detectedData && !loading
                                ? "linear-gradient(135deg, #8b5cf6 0%, #f3e8ff 100%)"
                                : "#ccc",
                            border: detectedData && !loading ? "2px solid #8b5cf6" : "none",
                            color: detectedData && !loading ? "white" : "#999",
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
                                Insert {detectedData?.type?.charAt(0).toUpperCase() + detectedData?.type?.slice(1) || "Data"}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        );
    }


    return (
        <>
            {/* Floating Scan Button */}
            {/* <Button
                onClick={() => setShowModal(true)}
                className="shadow-lg pulse-button"
                style={{
                    position: "fixed",
                    bottom: "100px",
                    right: "20px",
                    zIndex: 1000,
                    width: "54px",
                    height: "54px",
                    borderRadius: "50%",
                    backgroundImage: "url('/logoo.webp')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    border: "2px solid var(--primary-color)",
                    boxShadow: "0 4px 16px rgba(139, 92, 246, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0",
                    transition: "all 0.3s ease",
                }}
                title="Open Library / Book Scanner"
            /> */}

            <Modal    backdrop="static"  show={showModal} onHide={handleCloseModal} size="lg" centered scrollable>
                <Modal.Header
                    closeButton
                    style={{
                        background: "var(--primary-background-color)",
                        borderBottom: "none",
                        borderRadius: "8px 8px 0 0"
                    }}
                >
                    <Modal.Title style={{ color: "var(--primary-color)", fontWeight: "600" }}>
                        <i className="fa-solid fa-barcode me-2"></i>Universal Data Scanner
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: "24px" }}>
                    <div className="mb-4">
                        <Form.Label style={{ fontWeight: "500", color: "#333", marginBottom: "10px", fontSize: "14px" }}>
                            <i className="fa-solid fa-qrcode me-2" style={{ color: "var(--primary-color)" }}></i>Scan or Enter ISBN/Barcode/Data
                        </Form.Label>
                        <InputGroup>
                            <InputGroup.Text style={{ background: "var(--primary-background-color)", borderColor: "#e9ecef" }}>
                                <i className="fa-solid fa-barcode" style={{ color: "var(--primary-color)" }}></i>
                            </InputGroup.Text>
                            <Form.Control
                                ref={inputRef}
                                type="text"
                                placeholder="Enter ISBN (10 or 13 digits), author name, supplier info, category, or paste JSON data..."
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
                                }}
                                onFocus={(e) => e.target.style.borderColor = "var(--primary-color)"}
                                onBlur={(e) => e.target.style.borderColor = "#e9ecef"}
                                autoFocus
                            />
                            <Button
                                variant="outline-primary"
                                onClick={handleManualInput}
                                disabled={!barcodeInput.trim() || loading}
                                style={{
                                    borderColor: "#8b5cf6",
                                    color: "#8b5cf6",
                                    background: "#e9d5ff"
                                }}
                            >
                                <i className="fa-solid fa-search"></i>
                            </Button>
                        </InputGroup>
                        <Form.Text className="text-muted" style={{ fontSize: "12px", marginTop: "6px", display: "block" }}>
                            <i className="fa-solid fa-info-circle me-1"></i>
                            Enter ISBN (10 or 13 digits) - book data will be fetched automatically from Google Books API.
                            Also supports author names, supplier info, category, or JSON data.
                        </Form.Text>
                    </div>

                    {loading && (
                        <Alert
                            variant="info"
                            className="text-center"
                            style={{
                                background: "#e9d5ff",
                                borderColor: "#8b5cf6",
                                color: "#8b5cf6",
                                borderRadius: "8px",
                                padding: "16px"
                            }}
                        >
                            <i className="fa-solid fa-spinner fa-spin me-2"></i>
                            <strong>
                                {isValidISBN(barcodeInput)
                                    ? `Fetching complete book data from Google Books for ISBN: ${barcodeInput}...`
                                    : "Detecting data type and fetching details..."}
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
                                padding: "16px",
                                marginBottom: "20px"
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
                        </Alert>
                    )}

                    {renderBookDetails()}
                    {renderOtherDetails()}

                    {!detectedData && barcodeInput.length >= 10 && !loading && (
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
                                        The scanner will automatically fetch book data for valid ISBNs.
                                    </div>
                                </div>
                            </div>
                        </Alert>
                    )}
                </Modal.Body>
                <Modal.Footer style={{ borderTop: "1px solid #e9ecef", padding: "16px 24px" }}>
                    <Button
                        variant="outline-secondary"
                        onClick={handleCloseModal}
                        style={{
                            borderColor: "#8b5cf6",
                            color: "#8b5cf6",
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
                                ? "linear-gradient(135deg, #8b5cf6 0%, #f3e8ff 100%)"
                                : "#ccc",
                            border: detectedData && !loading ? "2px solid #8b5cf6" : "none",
                            color: detectedData && !loading ? "white" : "#999",
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
                                Insert {detectedData?.type?.charAt(0).toUpperCase() + detectedData?.type?.slice(1) || "Data"}
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default UniversalBarcodeScanner;