import React, { useState, useEffect } from 'react';
import {
    Container, Row, Col, Card, Button, Form, Table,
    Tabs, Tab, Alert, Modal
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import DataApi from '../../api/dataApi';
import Loader from '../common/Loader';
import { toast } from "react-toastify";
import BarcodeScanPurchase from "../common/BarcodeScanPurchase";
import PurchaseDataImport from "../common/PurchaseDataImport";
import UniversalBarcodeScanner from './UniversalBarcodeScanner';
import PubSub from 'pubsub-js';
const BulkPurchasePage = () => {
    const navigate = useNavigate();
    const [multiInsertRows, setMultiInsertRows] = useState([{
        vendor_id: "",
        book_id: "",
        quantity: 1,
        unit_price: 0,
        purchase_date: new Date().toISOString().split('T')[0],
        notes: ""
    }]);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [books, setBooks] = useState([]);
    const [saving, setSaving] = useState(false);
    const [currentRowIndex, setCurrentRowIndex] = useState(0);
    const [activeTab, setActiveTab] = useState("single");
    const [selectedFile, setSelectedFile] = useState(null);
    const [barcodeInput, setBarcodeInput] = useState("");
    const [scanningBook, setScanningBook] = useState(null);
    const [loading, setLoading] = useState(false);

    // New states for modals
    const [showAddVendorModal, setShowAddVendorModal] = useState(false);
    const [showAddBookModal, setShowAddBookModal] = useState(false);
    const [vendorFormData, setVendorFormData] = useState({
        name: "",
        company_name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
        status: "active",
    });
    const [bookFormData, setBookFormData] = useState({
        title: "",
        author_id: "",
        category_id: "",
        isbn: "",
        language: "",
        total_copies: 1,
        available_copies: 1,
    });
    const [authors, setAuthors] = useState([]);
    const [categories, setCategories] = useState([]);
    const [autoLookupTimeout, setAutoLookupTimeout] = useState(null);
    const [barcodeProcessing, setBarcodeProcessing] = useState(false);
    const [newlyAddedBookId, setNewlyAddedBookId] = useState(null);

    const handleFileChange = (file) => {
        if (file) {
            setSelectedFile(file);
        } else {
            setSelectedFile(null);
        }
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

    const fetchBookByISBN = async (isbn) => {
        console.log("Fetching book data for ISBN:", isbn);

       
        const bookData = {
            isbn: isbn,
            title: "",
            total_copies: 1,
            available_copies: 1,
        };

        try {
          
            const openLibraryUrl = `https://openlibrary.org/isbn/${isbn}.json`;
            console.log("Trying Open Library API:", openLibraryUrl);

            const openLibraryResponse = await fetch(openLibraryUrl);

            if (openLibraryResponse.ok) {
                const data = await openLibraryResponse.json();
                console.log("Open Library response:", data);

                bookData.title = data.title || "";

        
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

        console.log("Both APIs failed, returning basic data");
        return bookData;
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
                        bio: authorDetails?.bio || (authorDetails?.fullData?.bio ?
                            (typeof authorDetails.fullData.bio === "string"
                                ? authorDetails.fullData.bio
                                : authorDetails.fullData.bio.value || "")
                            : "")
                    };

                    const newAuthorResponse = await authorApi.create(authorData);
                    if (newAuthorResponse.data && newAuthorResponse.data.success) {
                        foundAuthor = newAuthorResponse.data.data;
                        toast.success(`Author "${primaryAuthorName}" created successfully`);
                        // Refresh authors list
                        await fetchAuthors();
                    }
                } else {
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
            toast.error("Error creating author");
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
                        toast.success(`Category "${categoryName}" created successfully`);
                        // Refresh categories list
                        await fetchCategories();
                    }
                } else {
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
            toast.error("Error creating category");
        }
        return null;
    };

    const processBarcodeData = async (barcode) => {
        if (!barcode || barcode.trim().length === 0) return null;

        setBarcodeProcessing(true);
        try {
            console.log("Processing barcode:", barcode);

            const isbnCheck = isValidISBN(barcode);
            if (isbnCheck) {
                console.log("Valid ISBN detected:", isbnCheck);
                const isbn = isbnCheck.value;

               
                const bookData = await fetchBookByISBN(isbn);
                console.log("Fetched book data:", bookData);
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

                return {
                    title: bookData.title || "",
                    author_id: bookData.author_id || "",
                    category_id: bookData.category_id || "",
                    isbn: bookData.isbn || isbn,
                    language: bookData.language || "",
                    total_copies: bookData.total_copies || 1,
                    available_copies: bookData.available_copies || 1
                };
            }

            if (/\d/.test(barcode) && /[A-Za-z]/.test(barcode)) {
                const possibleIsbns = barcode.match(/[\dX]{10,13}/g);
                if (possibleIsbns) {
                    for (const possibleIsbn of possibleIsbns) {
                        const isbnCheck = isValidISBN(possibleIsbn);
                        if (isbnCheck) {
                            const isbn = isbnCheck.value;
                            const title = barcode.replace(possibleIsbn, "").trim();

                            const bookData = await fetchBookByISBN(isbn);

                            if (title && !bookData.title) {
                                bookData.title = title;
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

                            return {
                                title: bookData.title || title || "",
                                author_id: bookData.author_id || "",
                                category_id: bookData.category_id || "",
                                isbn: bookData.isbn || isbn,
                                language: bookData.language || "",
                                total_copies: bookData.total_copies || 1,
                                available_copies: bookData.available_copies || 1
                            };
                        }
                    }
                }
            }

          
            if (barcode.length > 3) {
                return {
                    title: barcode.trim(),
                    author_id: "",
                    category_id: "",
                    isbn: barcode,
                    language: "",
                    total_copies: 1,
                    available_copies: 1
                };
            }

            return null;
        } catch (error) {
            console.error("Error processing barcode data:", error);
            toast.error("Failed to process barcode data");
            return null;
        } finally {
            setBarcodeProcessing(false);
        }
    };

    const handleBarcodeLookup = async (barcode) => {
        if (!barcode.trim()) {
            toast.error("Please enter a barcode/ISBN");
            return;
        }

        try {
            setLoading(true);

            const processedData = await processBarcodeData(barcode.trim());

            if (processedData) {
                setBookFormData(prev => ({
                    ...prev,
                    ...processedData
                }));

                setBarcodeInput(processedData.isbn || barcode);

                if (processedData.title) {
                    toast.success(`Book data loaded: ${processedData.title}`);
                } else {
                    toast.info("Basic book data prepared. Please fill remaining details.");
                }

           
            } else {
                setBookFormData(prev => ({
                    ...prev,
                    isbn: barcode
                }));
                toast.info("Could not auto-detect book details. Please fill manually.");
            }
        } catch (error) {
            console.error('Barcode lookup error:', error);
            setBookFormData(prev => ({
                ...prev,
                isbn: barcode
            }));
            toast.error("Failed to process barcode. Please check the format and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleBarcodeScanned = (barcode) => {
        console.log('Barcode scanned:', barcode);
        setBarcodeInput(barcode);

        setTimeout(() => {
            handleBarcodeLookup(barcode);
        }, 500);
    };

    const handleBarcodeScan = async (barcode) => {
        if (!barcode || barcode.trim().length < 10) {
            toast.error("Please enter a valid barcode/ISBN (minimum 10 characters)");
            return;
        }

        try {
            setLoading(true);
            const bookApi = new DataApi("book");
            const allBooks = await bookApi.fetchAll();
            const bookData = allBooks?.data || allBooks || [];

            const foundBook = bookData.find(book =>
                book.isbn && (
                    book.isbn === barcode.trim() ||
                    book.isbn.replace(/[-\s]/g, '') === barcode.trim().replace(/[-\s]/g, '') ||
                    book.isbn.includes(barcode.trim()) ||
                    barcode.trim().includes(book.isbn)
                )
            );

            if (foundBook) {
                setScanningBook(foundBook);
                toast.success(`Book found: ${foundBook.title}`);
            } else {
                toast.error("Book not found with this ISBN/Barcode");
                setScanningBook(null);
            }
        } catch (error) {
            console.error("Error scanning barcode:", error);
            toast.error("Failed to scan barcode. Please try again.");
            setScanningBook(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
        fetchBooks();
        fetchAuthors();
        fetchCategories();
    }, []);

    useEffect(() => {
        if (newlyAddedBookId && books.length > 0) {
            const newBook = books.find(book => book.id === newlyAddedBookId);
            if (newBook) {
                const updatedRows = [...multiInsertRows];
                updatedRows[currentRowIndex] = {
                    ...updatedRows[currentRowIndex],
                    book_id: newlyAddedBookId
                };
                setMultiInsertRows(updatedRows);

                toast.success(`Book "${newBook.title}" added and selected successfully`);
                setNewlyAddedBookId(null); 
            }
        }
    }, [newlyAddedBookId, books, currentRowIndex, multiInsertRows]);

    useEffect(() => {
        if (showAddBookModal) {
            setBookFormData({
                title: "",
                author_id: "",
                category_id: "",
                isbn: barcodeInput || "",
                language: "",
                total_copies: 1,
                available_copies: 1,
            });
        }
    }, [showAddBookModal]);

    const fetchVendors = async () => {
        try {
            const vendorApi = new DataApi("vendor");
            const response = await vendorApi.fetchAll();
            if (response.data) {
                setVendors(response.data);
            }
        } catch (error) {
            console.error("Error fetching vendors:", error);
        }
    };

    const fetchBooks = async () => {
        try {
            const bookApi = new DataApi("book");
            const response = await bookApi.fetchAll();
            if (response.data) {
                setBooks(response.data);
            }
        } catch (error) {
            console.error("Error fetching books:", error);
        }
    };

    const fetchAuthors = async () => {
        try {
            const authorApi = new DataApi("author");
            const response = await authorApi.fetchAll();
            if (response.data) {
                setAuthors(response.data);
            }
        } catch (error) {
            console.error("Error fetching authors:", error);
        }
    };

    const fetchCategories = async () => {
        try {
            const categoryApi = new DataApi("category");
            const response = await categoryApi.fetchAll();
            if (response.data) {
                setCategories(response.data);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const vendorOptions = vendors.map((vendor) => ({
        value: vendor.id,
        label: vendor.name
    }));

    const bookOptions = books.map((book) => ({
        value: book.id,
        label: `${book.title}${book.isbn ? ` (${book.isbn})` : ''}`
    }));

    const authorOptions = authors.map((author) => ({
        value: author.id,
        label: author.name
    }));

    const categoryOptions = categories.map((category) => ({
        value: category.id,
        label: category.name
    }));

    const getSelectedAuthor = () => {
        if (!bookFormData.author_id) return null;
        return authorOptions.find(option => option.value === bookFormData.author_id) || null;
    };

    const getSelectedCategory = () => {
        if (!bookFormData.category_id) return null;
        return categoryOptions.find(option => option.value === bookFormData.category_id) || null;
    };

    const getSelectedBook = (rowIndex) => {
        const row = multiInsertRows[rowIndex];
        if (!row.book_id) return null;
        return bookOptions.find(option => option.value === row.book_id) || null;
    };

    const handleMultiRowChange = (index, field, value) => {
        const updatedRows = [...multiInsertRows];
        updatedRows[index] = { ...updatedRows[index], [field]: value };
        setMultiInsertRows(updatedRows);
    };

    const handleAddBookRow = () => {
        const newRow = {
            vendor_id: activeTab === "single" ? (selectedVendor ? selectedVendor.value : "") : "",
            book_id: "",
            quantity: 1,
            unit_price: 0,
            purchase_date: new Date().toISOString().split('T')[0],
            notes: ""
        };
        setMultiInsertRows([...multiInsertRows, newRow]);
    };

    const handleAddVendorRow = () => {
        const newRow = {
            vendor_id: "",
            book_id: "",
            quantity: 1,
            unit_price: 0,
            purchase_date: new Date().toISOString().split('T')[0],
            notes: ""
        };
        setMultiInsertRows([...multiInsertRows, newRow]);
    };

    const handleRemoveRow = (index) => {
        if (multiInsertRows.length > 1) {
            setMultiInsertRows(multiInsertRows.filter((_, i) => i !== index));
        }
    };

    const handleVendorChange = (selectedOption) => {
        setSelectedVendor(selectedOption);
        if (activeTab === "single") {
            const updatedRows = multiInsertRows.map(row => ({
                ...row,
                vendor_id: selectedOption ? selectedOption.value : ""
            }));
            setMultiInsertRows(updatedRows);
        }
    };

    const handleAddVendor = async () => {
        if (!vendorFormData.name || !vendorFormData.name.trim()) {
            toast.error("Vendor name is required");
            return;
        }

        try {
            setLoading(true);
            const vendorApi = new DataApi("vendor");
            const response = await vendorApi.create(vendorFormData);

            if (response.data) {
                toast.success("Vendor added successfully");
                setShowAddVendorModal(false);
                setVendorFormData({
                    name: "",
                    company_name: "",
                    email: "",
                    phone: "",
                    address: "",
                    city: "",
                    state: "",
                    pincode: "",
                    country: "India",
                    status: "active",
                });
                await fetchVendors();
            }
        } catch (error) {
            console.error("Error adding vendor:", error);
            toast.error("Failed to add vendor");
        } finally {
            setLoading(false);
        }
    };

    const handleAddBook = async () => {
        if (!bookFormData.title || !bookFormData.title.trim()) {
            toast.error("Book title is required");
            return;
        }

        if (!bookFormData.author_id) {
            toast.error("Author is required");
            return;
        }

        if (!bookFormData.category_id) {
            toast.error("Category is required");
            return;
        }

        try {
            setLoading(true);
            const bookApi = new DataApi("book");
            const response = await bookApi.create(bookFormData);

            if (response && response.data) {
                const newBook = response.data;
                const newBookId = newBook.id || newBook._id;

                if (newBookId) {
                    setNewlyAddedBookId(newBookId);

                    await fetchBooks();

                    toast.success("Book added successfully");

                    setShowAddBookModal(false);
                    setBookFormData({
                        title: "",
                        author_id: "",
                        category_id: "",
                        isbn: "",
                        language: "",
                        total_copies: 1,
                        available_copies: 1,
                    });
                    setBarcodeInput("");
                }
            }
        } catch (error) {
            console.error("Error adding book:", error);
            toast.error("Failed to add book");
        } finally {
            setLoading(false);
        }
    };

    const handleSavePurchases = async () => {
        const partiallyFilledRows = [];
        multiInsertRows.forEach((row, index) => {
            const hasSomeFields = row.vendor_id || row.book_id || row.quantity || row.unit_price;
            const hasAllRequiredFields = row.vendor_id && row.book_id && row.quantity && row.unit_price;

            if (hasSomeFields && !hasAllRequiredFields) {
                partiallyFilledRows.push(index + 1);
            }
        });

        if (partiallyFilledRows.length > 0) {
            toast.error(`Row(s) ${partiallyFilledRows.join(", ")} are partially filled. Please fill all required fields.`);
            return;
        }

        const convertedData = multiInsertRows
            .map((row) => {
                if (!row.vendor_id || !row.book_id || !row.quantity || !row.unit_price) {
                    return null;
                }
                return {
                    vendor_id: row.vendor_id,
                    book_id: row.book_id,
                    quantity: parseInt(row.quantity) || 1,
                    unit_price: parseFloat(row.unit_price) || 0,
                    purchase_date: row.purchase_date || new Date().toISOString().split('T')[0],
                    notes: row.notes || "",
                    total_amount: (parseInt(row.quantity) || 1) * (parseFloat(row.unit_price) || 0),
                };
            })
            .filter((purchase) => purchase !== null);

        if (convertedData.length === 0) {
            toast.error("Please fill at least one complete purchase entry");
            return;
        }

        try {
            setSaving(true);
            const purchaseApi = new DataApi("purchase");
            let successCount = 0;
            let failCount = 0;

            for (const purchaseData of convertedData) {
                try {
                    await purchaseApi.create(purchaseData);
                    successCount++;
                } catch (error) {
                    console.error("Error creating purchase:", error);
                    failCount++;
                    const errorMsg = error.response?.data?.error || error.response?.data?.errors || error.message || "Failed to create purchase";
                    PubSub.publish("RECORD_ERROR_TOAST", {
                        title: "Purchase Error",
                        message: errorMsg
                    });
                }
            }

            if (successCount > 0) {
                toast.success(`Successfully created ${successCount} purchase${successCount > 1 ? 's' : ''}. Redirecting to purchases list...`);
                setMultiInsertRows([{
                    vendor_id: "",
                    book_id: "",
                    quantity: 1,
                    unit_price: 0,
                    purchase_date: new Date().toISOString().split('T')[0],
                    notes: ""
                }]);
                setSelectedVendor(null);
                navigate('/purchase');
            }

            if (failCount > 0) {
                toast.error(`Failed to create ${failCount} purchase${failCount > 1 ? 's' : ''}`);
            }
        } catch (error) {
            console.error("Error in bulk insert:", error);
            const errorMsg = error.response?.data?.error || error.response?.data?.errors || error.message || "Failed to save purchases";
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Error",
                message: errorMsg
            });
        } finally {
            setSaving(false);
        }
    };

    const totalAmount = multiInsertRows.reduce((sum, row) => sum + ((parseFloat(row.quantity) || 0) * (parseFloat(row.unit_price) || 0)), 0);
    const uniqueVendors = [...new Set(multiInsertRows.map(row => row.vendor_id).filter(Boolean))];
    const totalBooks = multiInsertRows.reduce((sum, row) => sum + (parseInt(row.quantity) || 0), 0);

    if (loading) {
        return <Loader />;
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case "single":
                return (
                    <>
                        <Row className="align-items-center mb-4">
                            <Col md={8}>
                                <Form.Group>
                                    <Form.Label className="fw-bold">
                                        <i className="fa-solid fa-user-tie me-2 text-primary"></i>
                                        Select Vendor <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Select
                                        value={selectedVendor}
                                        onChange={handleVendorChange}
                                        options={vendorOptions}
                                        placeholder="Choose vendor for all purchases..."
                                        isClearable
                                        isSearchable
                                        menuPlacement="auto"
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                minHeight: "45px",
                                                fontSize: "16px",
                                                border: "2px solid #6f42c1",
                                                borderRadius: "8px",
                                                "&:hover": {
                                                    borderColor: "#8b5cf6",
                                                },
                                            }),
                                            menu: (base) => ({
                                                ...base,
                                                zIndex: 9999,
                                                position: 'absolute'
                                            }),
                                            menuPortal: (base) => ({
                                                ...base,
                                                zIndex: 9999
                                            })
                                        }}
                                        menuPortalTarget={document.body}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4} className="text-end">
                                <Button
                                    variant="outline-primary"
                                    onClick={() => setShowAddVendorModal(true)}
                                    className="mt-4"
                                >
                                    <i className="fa-solid fa-plus me-2"></i>
                                    Add New Vendor
                                </Button>
                            </Col>
                        </Row>

                        {renderPurchaseEntries("single")}
                    </>
                );

            case "multiple":
                return (
                    <>
                        <Alert variant="info" className="mb-4">
                            <i className="fa-solid fa-info-circle me-2"></i>
                            Add purchases from different vendors in one go. Each row can have a different vendor.
                        </Alert>
                        {renderPurchaseEntries("multiple")}
                    </>
                );

            case "scan":
                return (
                    <BarcodeScanPurchase
                        barcodeInput={barcodeInput}
                        setBarcodeInput={setBarcodeInput}
                        scanningBook={scanningBook}
                        setScanningBook={setScanningBook}
                        multiInsertRows={multiInsertRows}
                        setMultiInsertRows={setMultiInsertRows}
                        currentRowIndex={setCurrentRowIndex}
                        setCurrentRowIndex={setCurrentRowIndex}
                        setActiveTab={setActiveTab}
                        onBarcodeScan={handleBarcodeScan}
                        loading={loading}
                    />
                );

            case "import":
                return (
                    <PurchaseDataImport
                        selectedFile={selectedFile}
                        onFileChange={handleFileChange}
                        loading={loading}
                    />
                );

            default:
                return null;
        }
    };

    const renderPurchaseEntries = (tabType) => {
        return (
            <>
                {/* Purchase Entries Header */}
                <div className="mb-3 d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="mb-1">
                            <i className="fa-solid fa-book me-2 text-success"></i>
                            {tabType === "single" ? "Add Books for Purchase" : "Purchase Entries"}
                        </h5>
                        {tabType === "single" && selectedVendor && (
                            <small className="text-muted">
                                Adding books for vendor: <strong>{selectedVendor.label}</strong>
                            </small>
                        )}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <span className="text-muted">
                            Entries: {multiInsertRows.length}
                        </span>
                        <Button
                            size='sm'
                            variant={tabType === "single" ? "success" : "info"}
                            onClick={tabType === "single" ? handleAddBookRow : handleAddVendorRow}
                            disabled={tabType === "single" && !selectedVendor}
                        >
                            <i className="fa-solid fa-plus me-1"></i>
                            {tabType === "single" ? "Add Book" : "Add Entry"}
                        </Button>
                    </div>
                </div>

                {tabType === "single" && !selectedVendor ? (
                    <div className="text-center py-5 border rounded bg-light">
                        <i className="fa-solid fa-user-tie fa-3x text-muted mb-3"></i>
                        <h5 className="text-muted">Please select a vendor first</h5>
                        <p className="text-muted">Choose a vendor above to start adding books for purchase</p>
                    </div>
                ) : (
                    <Row className="g-4">
                        <Col lg={6}>
                            <div className="table-responsive" style={{ position: 'relative', zIndex: 5, maxHeight: '65vh', overflowY: 'auto' }}>
                                <Table bordered hover>
                                    <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 6 }}>
                                        <tr>
                                            {tabType === "multiple" && (
                                                <th width="20%">
                                                    Vendor <span className="text-danger">*</span>
                                                </th>
                                            )}
                                            <th width={tabType === "multiple" ? "20%" : "25%"}>
                                                Book <span className="text-danger">*</span>
                                            </th>
                                            <th width="8%">
                                                Qty <span className="text-danger">*</span>
                                            </th>
                                            <th width="10%">
                                                Unit Price <span className="text-danger">*</span>
                                            </th>
                                            <th width="12%">
                                                Total Amount
                                            </th>
                                            <th width="12%">
                                                Purchase Date
                                            </th>
                                            <th width={tabType === "multiple" ? "12%" : "15%"}>
                                                Notes
                                            </th>
                                            <th width="5%" className="text-center">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {multiInsertRows.map((row, index) => (
                                            <tr key={index}>
                                                {tabType === "multiple" && (
                                                    <td>
                                                        <div className="d-flex gap-1">
                                                            <div className="flex-grow-1">
                                                                <Select
                                                                    value={vendorOptions.find((v) => v.value === row.vendor_id) || null}
                                                                    onChange={(selectedOption) => handleMultiRowChange(index, "vendor_id", selectedOption ? selectedOption.value : "")}
                                                                    options={vendorOptions}
                                                                    placeholder="Select Vendor"
                                                                    isClearable
                                                                    isSearchable
                                                                    menuPlacement="auto"
                                                                    styles={{
                                                                        menu: (base) => ({
                                                                            ...base,
                                                                            zIndex: 9999,
                                                                            position: 'absolute'
                                                                        }),
                                                                        menuPortal: (base) => ({
                                                                            ...base,
                                                                            zIndex: 9999
                                                                        })
                                                                    }}
                                                                    menuPortalTarget={document.body}
                                                                />
                                                            </div>
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                onClick={() => setShowAddVendorModal(true)}
                                                            >
                                                                <i className="fa-solid fa-plus"></i>
                                                            </Button>
                                                        </div>
                                                    </td>
                                                )}
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <div className="flex-grow-1">
                                                            <Select
                                                                value={getSelectedBook(index)}
                                                                onChange={(selectedOption) => handleMultiRowChange(index, "book_id", selectedOption ? selectedOption.value : "")}
                                                                options={bookOptions}
                                                                placeholder="Select Book"
                                                                isClearable
                                                                isSearchable
                                                                menuPlacement="auto"
                                                                styles={{
                                                                    menu: (base) => ({
                                                                        ...base,
                                                                        zIndex: 9999,
                                                                        position: 'absolute'
                                                                    }),
                                                                    menuPortal: (base) => ({
                                                                        ...base,
                                                                        zIndex: 9999
                                                                    })
                                                                }}
                                                                menuPortalTarget={document.body}
                                                            />
                                                        </div>
                                                        <Button
                                                            variant="outline-success"
                                                            size="sm"
                                                            onClick={() => {
                                                                setCurrentRowIndex(index);
                                                                setShowAddBookModal(true);
                                                            }}
                                                        >
                                                            <i className="fa-solid fa-plus"></i>
                                                        </Button>
                                                    </div>
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        value={row.quantity}
                                                        onChange={(e) => handleMultiRowChange(index, "quantity", e.target.value)}
                                                        min="1"
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        value={row.unit_price}
                                                        onChange={(e) => handleMultiRowChange(index, "unit_price", e.target.value)}
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        type="text"
                                                        value={`₹${((parseFloat(row.quantity) || 0) * (parseFloat(row.unit_price) || 0)).toFixed(2)}`}
                                                        readOnly
                                                        className="bg-light"
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        type="date"
                                                        value={row.purchase_date}
                                                        onChange={(e) => handleMultiRowChange(index, "purchase_date", e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        type="text"
                                                        value={row.notes}
                                                        onChange={(e) => handleMultiRowChange(index, "notes", e.target.value)}
                                                        placeholder="Notes..."
                                                    />
                                                </td>
                                                <td className="text-center">
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleRemoveRow(index)}
                                                        disabled={multiInsertRows.length === 1}
                                                    >
                                                        <i className="fa-solid fa-trash"></i>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Col>
                        <Col lg={6}>
                            <Card className="shadow-sm sticky-top" style={{ top: '90px' }}>
                                <Card.Body>
                                    <h5 className="fw-bold mb-3">
                                        <i className="fa-solid fa-clipboard-check me-2 text-primary"></i>
                                        Purchase Summary
                                    </h5>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">Entries</span>
                                        <span className="fw-semibold">{multiInsertRows.length}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">Vendors</span>
                                        <span className="fw-semibold">{uniqueVendors.length}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-3">
                                        <span className="text-muted">Books</span>
                                        <span className="fw-semibold">{totalBooks}</span>
                                    </div>
                                    <div className="p-3 rounded bg-light mb-4">
                                        <small className="text-muted text-uppercase">Total Value</small>
                                        <div className="h4 mb-0">₹{totalAmount.toFixed(2)}</div>
                                    </div>
                                    <Button
                                        variant="primary"
                                        className="w-100 mb-2"
                                        onClick={handleSavePurchases}
                                        disabled={saving || multiInsertRows.length === 0}
                                    >
                                        {saving ? (
                                            <>
                                                <i className="fa-solid fa-spinner fa-spin me-2"></i>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa-solid fa-save me-2"></i>
                                                Save Purchases
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline-secondary"
                                        className="w-100"
                                        onClick={() => navigate('/purchase')}
                                    >
                                        Cancel
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                )}
            </>
        );
    };

    return (
        <Container fluid className="py-4" style={{ position: 'relative', zIndex: 1 }}>
            <Row className="mb-4">
                <Col>
                    <Card>
                        <Card.Header style={{ background: "var(--primary-background-color)" }}>
                            <div className="d-flex align-items-center">
                                <button
                                    onClick={() => navigate('/purchase')}
                                    style={{
                                        border: '2px solid var(--primary-color)',
                                        borderRadius: '50%',
                                        background: 'transparent',
                                        color: 'var(--primary-color)',
                                        width: '40px',
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '16px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        marginRight: '15px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = 'var(--primary-color)';
                                        e.target.style.color = 'white';
                                        e.target.style.transform = 'translateX(-3px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'transparent';
                                        e.target.style.color = 'var(--primary-color)';
                                        e.target.style.transform = 'translateX(0)';
                                    }}
                                >
                                    <i className="fa-solid fa-arrow-left"></i>
                                </button>

                                <h1 className="h3 fw-bold mb-0" style={{ color: "var(--primary-color)" }}>
                                    <i className="fa-solid fa-layer-group me-2"></i>
                                    Purchase Management
                                </h1>
                            </div>
                        </Card.Header>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col lg={12}>
                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-white border-bottom-0 py-3">
                            <Tabs
                                activeKey={activeTab}
                                onSelect={(k) => setActiveTab(k)}
                                className="border-0"
                            >
                                <Tab
                                    eventKey="single"
                                    title={
                                        <span className="d-flex align-items-center">
                                            <i className="fa-solid fa-user me-2"></i>
                                            Single Vendor
                                        </span>
                                    }
                                />
                                <Tab eventKey="import" title="Import File" />
                            </Tabs>
                        </Card.Header>

                        {/* Card Body */}
                        <Card.Body className="p-4">
                            {renderTabContent()}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Add Vendor Modal */}
            <Modal show={showAddVendorModal} onHide={() => setShowAddVendorModal(false)} size="lg" centered>
                <Modal.Header closeButton className="border-bottom-0 pb-0">
                    <Modal.Title className="fw-bold">
                        <i className="fa-solid fa-user-tie me-2 text-primary"></i>
                        Add New Vendor
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-0">
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={vendorFormData.name}
                                        onChange={(e) => setVendorFormData({ ...vendorFormData, name: e.target.value })}
                                        placeholder="Enter vendor name"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Company Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={vendorFormData.company_name}
                                        onChange={(e) => setVendorFormData({ ...vendorFormData, company_name: e.target.value })}
                                        placeholder="Enter company name"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={vendorFormData.email}
                                        onChange={(e) => setVendorFormData({ ...vendorFormData, email: e.target.value })}
                                        placeholder="Enter email address"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Phone</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        value={vendorFormData.phone}
                                        onChange={(e) => setVendorFormData({ ...vendorFormData, phone: e.target.value })}
                                        placeholder="Enter phone number"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Address</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={vendorFormData.address}
                                        onChange={(e) => setVendorFormData({ ...vendorFormData, address: e.target.value })}
                                        placeholder="Enter address"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>City</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={vendorFormData.city}
                                        onChange={(e) => setVendorFormData({ ...vendorFormData, city: e.target.value })}
                                        placeholder="Enter city"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>State</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={vendorFormData.state}
                                        onChange={(e) => setVendorFormData({ ...vendorFormData, state: e.target.value })}
                                        placeholder="Enter state"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Pincode</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={vendorFormData.pincode}
                                        onChange={(e) => setVendorFormData({ ...vendorFormData, pincode: e.target.value })}
                                        placeholder="Enter pincode"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="border-top-0">
                    <Button variant="outline-secondary" onClick={() => setShowAddVendorModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleAddVendor} disabled={loading}>
                        {loading ? 'Adding...' : 'Add Vendor'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Add Book Modal with Barcode Scan - ENHANCED */}
            <Modal show={showAddBookModal} onHide={() => {
                setShowAddBookModal(false);
                setBarcodeInput("");
            }} size="lg" centered>
                <Modal.Header closeButton className="border-bottom-0 pb-0">
                    <Modal.Title className="fw-bold">
                        <i className="fa-solid fa-book me-2 text-success"></i>
                        Add New Book
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-0">
                    {/* Barcode Scan Section */}
                    <Card className="mb-4 border-0 bg-light">
                        <Card.Body className="p-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-1 fw-semibold">
                                        <i className="fa-solid fa-barcode me-2"></i>
                                        Scan Barcode
                                    </h6>
                                    <p className="mb-0 text-muted small">Enter ISBN to auto-fill details and auto-create author/category</p>
                                </div>
                                {(loading || barcodeProcessing) && (
                                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                )}
                            </div>

                            <Form.Group className="mt-3">
                                <Form.Label className="small fw-semibold">Enter ISBN/Barcode</Form.Label>

                                <div className="mb-2">
                                    <Form.Control
                                        type="text"
                                        value={barcodeInput}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setBarcodeInput(value);

                                            if (autoLookupTimeout) {
                                                clearTimeout(autoLookupTimeout);
                                            }

                                            if (value.length >= 10) {
                                                const timeout = setTimeout(() => {
                                                    handleBarcodeLookup(value);
                                                }, 1500);
                                                setAutoLookupTimeout(timeout);
                                            }
                                        }}
                                        placeholder="Enter ISBN or barcode number"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleBarcodeLookup(barcodeInput);
                                            }
                                        }}
                                    />
                                </div>

                                {/* Scanner Section */}
                                <div className="d-flex gap-2 align-items-center">
                                    <div className="flex-grow-1">
                                        <UniversalBarcodeScanner onBarcodeScanned={handleBarcodeScanned} />
                                    </div>
                                    <Button
                                        variant="primary"
                                        onClick={() => handleBarcodeLookup(barcodeInput)}
                                        disabled={!barcodeInput.trim() || loading || barcodeProcessing}
                                    >
                                        {loading || barcodeProcessing ? (
                                            <i className="fa-solid fa-spinner fa-spin"></i>
                                        ) : (
                                            <i className="fa-solid fa-search"></i>
                                        )}
                                    </Button>
                                </div>

                                <Form.Text className="text-muted">
                                    Enter 10 or 13 digit ISBN to auto-fill book details, create authors and categories automatically
                                </Form.Text>
                            </Form.Group>
                        </Card.Body>
                    </Card>

                    <Form>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Title <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={bookFormData.title}
                                        onChange={(e) => setBookFormData({ ...bookFormData, title: e.target.value })}
                                        placeholder="Enter book title"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Author <span className="text-danger">*</span></Form.Label>
                                    <Select
                                        value={getSelectedAuthor()}
                                        onChange={(selectedOption) => setBookFormData({
                                            ...bookFormData,
                                            author_id: selectedOption ? selectedOption.value : ""
                                        })}
                                        options={authorOptions}
                                        placeholder="Select Author"
                                        isClearable
                                        isSearchable
                                        styles={{
                                            menu: (base) => ({
                                                ...base,
                                                zIndex: 9999,
                                            })
                                        }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Category <span className="text-danger">*</span></Form.Label>
                                    <Select
                                        value={getSelectedCategory()}
                                        onChange={(selectedOption) => setBookFormData({
                                            ...bookFormData,
                                            category_id: selectedOption ? selectedOption.value : ""
                                        })}
                                        options={categoryOptions}
                                        placeholder="Select Category"
                                        isClearable
                                        isSearchable
                                        styles={{
                                            menu: (base) => ({
                                                ...base,
                                                zIndex: 9999,
                                            })
                                        }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>ISBN/Barcode</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={bookFormData.isbn}
                                        onChange={(e) => setBookFormData({ ...bookFormData, isbn: e.target.value })}
                                        placeholder="Enter ISBN or barcode number"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Language</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={bookFormData.language}
                                        onChange={(e) => setBookFormData({ ...bookFormData, language: e.target.value })}
                                        placeholder="Enter language"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Total Copies</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={bookFormData.total_copies}
                                        onChange={(e) => setBookFormData({ ...bookFormData, total_copies: parseInt(e.target.value) || 1 })}
                                        min="1"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Available Copies</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={bookFormData.available_copies}
                                        onChange={(e) => setBookFormData({ ...bookFormData, available_copies: parseInt(e.target.value) || 1 })}
                                        min="1"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="border-top-0">
                    <Button variant="outline-secondary" onClick={() => {
                        setShowAddBookModal(false);
                        setBarcodeInput("");
                    }}>
                        Cancel
                    </Button>
                    <Button variant="success" onClick={handleAddBook} disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Adding...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-plus me-2"></i>
                                Add Book
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default BulkPurchasePage;