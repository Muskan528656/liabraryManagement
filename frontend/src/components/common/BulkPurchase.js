import React, { useState, useEffect, useRef } from 'react';
import {
    Container, Row, Col, Card, Button, Form, Table,
    Tabs, Tab, Alert, Modal, Badge,
    Nav
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import DataApi from '../../api/dataApi';
import Loader from '../common/Loader';
import { toast } from "react-toastify";
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
    const [activeTab, setActiveTab] = useState("single");
    const [selectedFile, setSelectedFile] = useState(null);
    const [barcodeInput, setBarcodeInput] = useState("");
    const [scanningBook, setScanningBook] = useState(null);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        issued: 0,
        purchased: 0,
        available: 0
    });

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

    useEffect(() => {
        fetchVendors();
        fetchBooks();
        fetchAuthors();
        fetchCategories();
        fetchStats();
    }, []);

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

    const fetchStats = async () => {
        try {
            const issuedApi = new DataApi("bookissue");
            const issuedResponse = await issuedApi.fetchAll();

            const purchaseApi = new DataApi("purchase");
            const purchaseResponse = await purchaseApi.fetchAll();

            const bookApi = new DataApi("book");
            const bookResponse = await bookApi.fetchAll();

            let currentIssuedCount = 0;
            let totalIssuedRecords = 0;
            let returnedCount = 0;
            let purchasedCount = 0;
            let availableCount = 0;
            let totalBooksCount = 0;


            if (issuedResponse.data && Array.isArray(issuedResponse.data)) {
                totalIssuedRecords = issuedResponse.data.length;

                currentIssuedCount = issuedResponse.data.filter(issue =>
                    issue.status.toLowerCase() === "issued"
                ).length;

                returnedCount = issuedResponse.data.filter(issue =>
                    issue.status.toLowerCase() === "returned"
                ).length;

                console.log(`Total Issue Records: ${totalIssuedRecords}`);
                console.log(`Currently Issued: ${currentIssuedCount}`);
                console.log(`Returned: ${returnedCount}`);
            }


            if (purchaseResponse.data && Array.isArray(purchaseResponse.data)) {
                purchasedCount = purchaseResponse.data.reduce((sum, purchase) =>
                    sum + (parseInt(purchase.quantity) || 0), 0);
                console.log(`Total Purchased Quantity: ${purchasedCount}`);
            }


            if (bookResponse.data && Array.isArray(bookResponse.data)) {
                totalBooksCount = bookResponse.data.length;

                availableCount = bookResponse.data.reduce((sum, book) =>
                    sum + (parseInt(book.available_copies) || 0), 0);

                console.log(`Total Books: ${totalBooksCount}`);
                console.log(`Total Available Copies: ${availableCount}`);
            }


            setStats({
                issued: currentIssuedCount,
                purchased: purchasedCount,
                available: availableCount,

                totalIssuedRecords: totalIssuedRecords,
                returnedBooks: returnedCount,
                totalBooks: totalBooksCount
            });

        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };
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

                    if (volumeInfo.authors && volumeInfo.authors.length > 0) {
                        bookData.author_name = volumeInfo.authors.join(", ");
                        bookData.author_details = {
                            name: volumeInfo.authors[0],
                            bio: "",
                            email: "",
                            fullData: null
                        };
                    }

                    if (volumeInfo.categories && volumeInfo.categories.length > 0) {
                        const category = volumeInfo.categories[0];
                        const categoryName = category
                            .split("/")[0]
                            .split(",")[0]
                            .trim();
                        bookData.category_name = categoryName;
                        bookData.category_description = category;
                    }

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

    const getSelectedVendorForRow = (rowIndex) => {
        const row = multiInsertRows[rowIndex];
        if (!row.vendor_id) return null;
        return vendorOptions.find(option => option.value === row.vendor_id) || null;
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

    const handleRemoveRow = (index) => {
        if (multiInsertRows.length > 1) {
            const updatedRows = multiInsertRows.filter((_, i) => i !== index);
            setMultiInsertRows(updatedRows);
        }
    };

    const handleVendorChange = (selectedOption) => {
        setSelectedVendor(selectedOption);

        if (activeTab === "single") {
            const vendorId = selectedOption ? selectedOption.value : "";


            const updatedRows = multiInsertRows.map(row => {
                if (!row.vendor_id || row.vendor_id === "") {
                    return {
                        ...row,
                        vendor_id: vendorId
                    };
                }

                return row;
            });

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

            console.log("🔍 Full API Response:", response);

            let newBookId = null;

            if (response && response.data) {
                const bookData = response.data;
                newBookId = bookData.id || bookData._id;
            }

            if (!newBookId && response && response.data && response.data.data) {
                const bookData = response.data.data;
                newBookId = bookData.id || bookData._id;
            }

            if (!newBookId && response) {
                newBookId = response.id || response._id;
            }

            console.log("🔍 Final Book ID:", newBookId);

            if (newBookId) {
                setNewlyAddedBookId(newBookId);
                await fetchBooks();
                toast.success("Book added successfully");

                setTimeout(() => {
                    setShowAddBookModal(false);
                }, 300);

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
            } else {
                toast.error("Book created but could not get book ID");
                setShowAddBookModal(false);
            }
        } catch (error) {
            console.error("❌ Error adding book:", error);
            toast.error("Failed to add book: " + (error.message || "Unknown error"));
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
                            <Col lg={8}>
                                <Form.Group>
                                    <Form.Label className="fw-bold mb-2">
                                        Select Default Vendor <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Select
                                        value={selectedVendor}
                                        onChange={handleVendorChange}
                                        options={vendorOptions}
                                        placeholder="Choose default vendor for all rows..."
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
                                            }),
                                            menuPortal: (base) => ({
                                                ...base,
                                                zIndex: 9999
                                            })
                                        }}
                                        menuPortalTarget={document.body}
                                        menuShouldScrollIntoView={false}
                                    />
                                </Form.Group>
                            </Col>
                            <Col lg={2}></Col> {/* Empty column for spacing */}
                            <Col lg={2} className="d-flex justify-content-end">
                                <Button
                                    size="sm"
                                    onClick={handleAddBookRow}
                                    className="mt-4 custom-btn-primary"
                                >
                                    <i className="fa-solid fa-plus me-1"></i>
                                    Add New Row
                                </Button>
                            </Col>
                        </Row>


                        {renderPurchaseEntries("single")}
                    </>
                );

            case "import":
                return (
                    <PurchaseDataImport
                        selectedFile={selectedFile}
                        onFileChange={handleFileChange}
                        loading={loading}
                        vendors={vendors}
                        books={books}
                    />
                );

            default:
                return null;
        }
    };

    const renderPurchaseEntries = (tabType) => {
        return (
            <>
                {/* Table Header with Add Button */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">
                        Purchase Items ({multiInsertRows.length})
                    </h6>
                </div>

                {/* Table with Horizontal and Vertical Scroll - FIXED */}
                <div className="border rounded" style={{
                    maxHeight: 'calc(100vh - 400px)',
                    overflow: 'auto',
                    backgroundColor: 'white',
                    width: '100%',
                    position: 'relative',
                    zIndex: 1
                }}>
                    <div style={{
                        minWidth: '1200px',
                        width: '100%',
                        position: 'relative',
                        zIndex: 1
                    }}>
                        <Table bordered hover className="mb-0" style={{ width: '100%', tableLayout: 'fixed' }}>
                            <thead style={{
                                position: 'sticky',
                                top: 0,
                                zIndex: 10,
                                backgroundColor: '#f8f9fa'
                            }}>
                                <tr >
                                    <th style={{ background: 'var( --primary-background-color)' }} className="border-end p-3">
                                        <div className="d-flex align-items-center">
                                            <span>Vendor</span>
                                            <span className="text-danger ms-1">*</span>
                                        </div>
                                    </th>
                                    <th style={{ background: 'var( --primary-background-color)' }} className="border-end p-3">
                                        <div className="d-flex align-items-center">
                                            <span>Book</span>
                                            <span className="text-danger ms-1">*</span>
                                        </div>
                                    </th>
                                    <th style={{ background: 'var( --primary-background-color)' }} className="border-end p-3">
                                        <div className="d-flex align-items-center">
                                            <span>Qty</span>
                                            <span className="text-danger ms-1">*</span>
                                        </div>
                                    </th>
                                    <th style={{ background: 'var( --primary-background-color)' }} className="border-end p-3">
                                        <div className="d-flex align-items-center">
                                            <span>Unit Price</span>
                                            <span className="text-danger ms-1">*</span>
                                        </div>
                                    </th>
                                    <th style={{ background: 'var( --primary-background-color)' }} className="border-end p-3">
                                        <div>Total Amount</div>
                                    </th>
                                    <th style={{ background: 'var( --primary-background-color)' }} className="border-end p-3">
                                        <div>Purchase Date</div>
                                    </th>
                                    <th style={{ background: 'var( --primary-background-color)' }} className="border-end p-3">
                                        <div>Notes</div>
                                    </th>
                                    <th style={{ background: 'var( --primary-background-color)' }} className="text-center p-3">
                                        <div>Actions</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {multiInsertRows.map((row, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'table-row-light' : ''}>
                                        <td className="border-end p-2" style={{ width: '20%' }}>
                                            <div className="d-flex gap-1 align-items-center">
                                                <div className="flex-grow-1">
                                                    <Select
                                                        value={getSelectedVendorForRow(index)}
                                                        onChange={(selectedOption) => handleMultiRowChange(index, "vendor_id", selectedOption ? selectedOption.value : "")}
                                                        options={vendorOptions}
                                                        placeholder="Select Vendor"
                                                        isClearable
                                                        isSearchable
                                                        menuPlacement="auto"
                                                        styles={{
                                                            control: (base, state) => ({
                                                                ...base,
                                                                minHeight: "36px",
                                                                fontSize: "14px",
                                                                borderColor: state.isFocused ? "#8b5cf6" : row.vendor_id ? "#28a745" : "#dee2e6",
                                                                backgroundColor: row.vendor_id ? "#f8fff9" : "white",
                                                                "&:hover": {
                                                                    borderColor: row.vendor_id ? "#28a745" : "#8b5cf6",
                                                                },
                                                            }),
                                                            menu: (base) => ({
                                                                ...base,
                                                                zIndex: 9999,
                                                            }),
                                                            menuPortal: (base) => ({
                                                                ...base,
                                                                zIndex: 9999
                                                            })
                                                        }}
                                                        menuPortalTarget={document.body}
                                                        menuShouldScrollIntoView={false}
                                                    />
                                                </div>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    onClick={() => setShowAddVendorModal(true)}
                                                    title="Add New Vendor"
                                                    className="p-0 text-primary"
                                                >
                                                    <i className="fs-4 fa-solid fa-plus-square"></i>
                                                </Button>
                                            </div>
                                        </td>
                                        <td className="border-end p-2" style={{ width: '25%' }}>
                                            <div className="d-flex gap-1 align-items-center">
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
                                                            control: (base, state) => ({
                                                                ...base,
                                                                minHeight: "36px",
                                                                fontSize: "14px",
                                                                borderColor: state.isFocused ? "#8b5cf6" : row.book_id ? "#28a745" : "#dee2e6",
                                                                backgroundColor: row.book_id ? "#f8fff9" : "white",
                                                                "&:hover": {
                                                                    borderColor: row.book_id ? "#28a745" : "#8b5cf6",
                                                                },
                                                            }),
                                                            menu: (base) => ({
                                                                ...base,
                                                                zIndex: 9999,
                                                            }),
                                                            menuPortal: (base) => ({
                                                                ...base,
                                                                zIndex: 9999
                                                            })
                                                        }}
                                                        menuPortalTarget={document.body}
                                                        menuShouldScrollIntoView={false}
                                                    />
                                                </div>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    onClick={() => setShowAddBookModal(true)}
                                                    title="Add New Book"
                                                    className="p-0 text-success"
                                                >
                                                    <i className="fs-4  fa-solid fa-plus-square"></i>
                                                </Button>
                                            </div>
                                        </td>
                                        <td className="border-end p-2" style={{ width: '8%' }}>
                                            <Form.Control
                                                type="number"
                                                value={row.quantity}
                                                onChange={(e) => handleMultiRowChange(index, "quantity", e.target.value)}
                                                min="1"
                                                className="border-0 p-2"
                                                style={{ width: '100%' }}
                                            />
                                        </td>
                                        <td className="border-end p-2" style={{ width: '10%' }}>
                                            <Form.Control
                                                type="number"
                                                value={row.unit_price}
                                                onChange={(e) => handleMultiRowChange(index, "unit_price", e.target.value)}
                                                min="0"
                                                step="0.01"
                                                className="border-0 p-2"
                                                style={{ width: '100%' }}
                                            />
                                        </td>
                                        <td className="border-end p-2" style={{ width: '12%' }}>
                                            <div className="bg-light p-2 rounded text-center">
                                                <span className="fw-semibold text-primary">
                                                    ₹{((parseFloat(row.quantity) || 0) * (parseFloat(row.unit_price) || 0)).toFixed(2)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="border-end p-2" style={{ width: '12%' }}>
                                            <Form.Control
                                                type="date"
                                                value={row.purchase_date}
                                                onChange={(e) => handleMultiRowChange(index, "purchase_date", e.target.value)}
                                                className="border-0 p-2"
                                                style={{ width: '100%' }}
                                            />
                                        </td>
                                        <td className="border-end p-2" style={{ width: '15%' }}>
                                            <Form.Control
                                                type="text"
                                                value={row.notes}
                                                onChange={(e) => handleMultiRowChange(index, "notes", e.target.value)}
                                                placeholder="Add notes..."
                                                className="border-0 p-2"
                                                style={{ width: '100%' }}
                                            />
                                        </td>
                                        <td className="text-center p-2" style={{ width: '5%' }}>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                onClick={() => handleRemoveRow(index)}
                                                disabled={multiInsertRows.length === 1}
                                                title="Remove Row"
                                                className="p-0 text-danger"
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </div>

                {/* Purchase Summary Card - Below Table */}
                <Row className="mt-4">
                    <Col lg={8}>
                        {/* Empty column for alignment */}
                    </Col>
                    <Col lg={4}>
                        <Card className="shadow-sm border-0" style={{
                            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                            borderRadius: '12px'
                        }}>
                            <Card.Body className="p-4">
                                <h6 className="fw-bold mb-3 d-flex align-items-center">
                                    <i className="fa-solid fa-clipboard-check me-2 text-primary"></i>
                                    Purchase Summary
                                </h6>

                                <div className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2 p-2 bg-white rounded">
                                        <span className="text-muted">Total Entries</span>
                                        <Badge bg="primary" pill>{multiInsertRows.length}</Badge>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center mb-2 p-2 bg-white rounded">
                                        <span className="text-muted">Vendors</span>
                                        <div className="d-flex align-items-center">
                                            <Badge bg={uniqueVendors.length > 1 ? "warning" : "success"} pill>
                                                {uniqueVendors.length}
                                            </Badge>
                                            {uniqueVendors.length > 1 && (
                                                <i className="fa-solid fa-exclamation-triangle ms-2 text-warning small"
                                                    title="Multiple vendors selected"></i>
                                            )}
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center p-2 bg-white rounded">
                                        <span className="text-muted">Total Books</span>
                                        <Badge bg="info" pill>{totalBooks}</Badge>
                                    </div>
                                </div>

                                {/* Total Value Section */}
                                <div className="p-3 rounded mb-3 text-center" style={{
                                    background: 'linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)',
                                    color: 'white'
                                }}>
                                    <small className="text-white-50 text-uppercase">Total Value</small>
                                    <div className="h4 mb-0 fw-bold">₹{totalAmount.toFixed(2)}</div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-3">
                                    <Button
                                        variant="primary"
                                        className="w-100 mb-2 py-2 fw-bold"
                                        onClick={handleSavePurchases}
                                        disabled={saving || multiInsertRows.length === 0}
                                        style={{
                                            background: 'linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)',
                                            border: 'none'
                                        }}
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
                                        className="w-100 py-2"
                                        onClick={() => navigate('/purchase')}
                                    >
                                        <i className="fa-solid fa-arrow-left me-2"></i>
                                        Back to List
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </>
        );
    };

    return (
        <>
            <Row className="align-items-center">
                <Col lg={6}>
                    {/* Left side content - this will be empty or can be used for other content */}
                </Col>

                <Col lg={6}>
                    <div className="d-flex gap-3 mb-3 justify-content-end">
                        <Card className="shadow-sm border-0" style={{
                            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                            borderRadius: "10px",
                            border: 'none',
                            width: '220px'
                        }}>
                            <Card.Body className="p-3">
                                <div className="d-flex align-items-center">
                                    <div className="p-2 rounded-circle me-2" style={{
                                        background: 'rgba(13, 110, 253, 0.15)'
                                    }}>
                                        <i className="fa-solid fa-book-open text-primary fa-sm"></i>
                                    </div>
                                    <div>
                                        <p className="mb-0 small text-muted">Issued</p>
                                        <h5 className="mb-0 fw-bold text-primary">{stats.issued}</h5>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                        <Card className="shadow-sm border-0" style={{
                            background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                            borderRadius: "10px",
                            border: 'none',
                            width: '220px'
                        }}>
                            <Card.Body className="p-3">
                                <div className="d-flex align-items-center">
                                    <div className="p-2 rounded-circle me-2" style={{
                                        background: 'rgba(40, 167, 69, 0.15)'
                                    }}>
                                        <i className="fa-solid fa-cart-shopping text-success fa-sm"></i>
                                    </div>
                                    <div>
                                        <p className="mb-0 small text-muted">Purchased</p>
                                        <h5 className="mb-0 fw-bold text-success">{stats.purchased}</h5>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                        <Card className="shadow-sm border-0" style={{
                            background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
                            borderRadius: "10px",
                            border: 'none',
                            width: '220px'
                        }}>
                            <Card.Body className="p-3">
                                <div className="d-flex align-items-center">
                                    <div className="p-2 rounded-circle me-2" style={{
                                        background: 'rgba(255, 193, 7, 0.15)'
                                    }}>
                                        <i className="fa-solid fa-layer-group text-warning fa-sm"></i>
                                    </div>
                                    <div>
                                        <p className="mb-0 small text-muted">Available</p>
                                        <h5 className="mb-0 fw-bold text-warning">{stats.available}</h5>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                </Col>
            </Row>
            <Container fluid className="py-3" style={{
                minHeight: '100vh',
                backgroundColor: '#f5f7fb'
            }}>
                {/* Header with Stats Cards on Right Side */}
                <Row className="mb-4">
                    {/* Stats Cards on Right Side - Horizontal */}
                </Row>

                {/* Improved Styled Tabs */}
                <div className="mb-1">
                    <h4 className="fw-bold text-dark mb-1">
                        <i className="fa-solid fa-cart-plus me-2" style={{ color: '#6f42c1' }}></i>
                        Bulk Purchase Entry
                    </h4>
                    <Tabs
                        activeKey={activeTab}
                        onSelect={(k) => setActiveTab(k)}
                        className="custom-tabs"
                        id="purchase-tabs"
                    >
                        <Tab
                            eventKey="single"
                            title={
                                <div className="d-flex align-items-center px-3 py-2">
                                    Single Vendor
                                </div>
                            }
                            className="pt-3"
                        />
                        <Tab
                            eventKey="import"
                            title={
                                <div className="d-flex align-items-center px-3 py-2">
                                    Import File
                                </div>
                            }
                            className="pt-1"
                        />
                    </Tabs>
                </div>

                {/* Main Content Card */}
                <Row>
                    <Col lg={12}>
                        <Card className="shadow-sm border-0" style={{
                            background: 'white',
                            borderRadius: '12px'
                        }}>
                            <Card.Body className="p-4">
                                {renderTabContent()}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Modals remain the same */}
                <Modal show={showAddVendorModal} onHide={() => setShowAddVendorModal(false)} size="lg" centered>
                    <Modal.Header closeButton className="border-bottom-0 pb-0" style={{ background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)", color: "white" }}>
                        <Modal.Title className="fw-bold">
                            Add New Vendor
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="pt-0">
                        <Form>
                            {/* Contact Person Information Section */}
                            <div className="mt-2 mb-4">
                                <div className="d-flex align-items-center mb-3" style={{ padding: "10px", background: "#f8f9fa", borderRadius: "8px" }}>

                                    <h6 className="mb-0 fw-bold" style={{ color: "#6f42c1" }}>Contact Person Information</h6>
                                </div>

                                <Row>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Contact Person Name <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="name"
                                                value={vendorFormData.name}
                                                onChange={(e) => setVendorFormData({ ...vendorFormData, name: e.target.value })}
                                                placeholder="Enter contact person name"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Phone</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                name="phone"
                                                value={vendorFormData.phone}
                                                onChange={(e) => setVendorFormData({ ...vendorFormData, phone: e.target.value })}
                                                placeholder="Enter phone number"
                                            />
                                            {vendorFormData.phone && !/^[0-9+\-\s()]{10,15}$/.test(vendorFormData.phone) && (
                                                <small className="text-danger">Please enter a valid phone number</small>
                                            )}
                                        </Form.Group>
                                    </Col>

                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Email</Form.Label>
                                            <Form.Control
                                                type="email"
                                                name="email"
                                                value={vendorFormData.email}
                                                onChange={(e) => setVendorFormData({ ...vendorFormData, email: e.target.value })}
                                                placeholder="Enter email address"
                                            />
                                            {vendorFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendorFormData.email) && (
                                                <small className="text-danger">Please enter a valid email</small>
                                            )}
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </div>

                            {/* Company Information Section */}
                            <div className="mb-4">
                                <div className="d-flex align-items-center mb-3" style={{ padding: "10px", background: "#f8f9fa", borderRadius: "8px" }}>

                                    <h6 className="mb-0 fw-bold" style={{ color: "#6f42c1" }}>Company Information</h6>
                                </div>

                                <Row>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Company Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="company_name"
                                                value={vendorFormData.company_name}
                                                onChange={(e) => setVendorFormData({ ...vendorFormData, company_name: e.target.value })}
                                                placeholder="Enter company name"
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>GST Number</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="gst_number"
                                                value={vendorFormData.gst_number}
                                                onChange={(e) => setVendorFormData({ ...vendorFormData, gst_number: e.target.value })}
                                                placeholder="Enter GST number"
                                                maxLength={15}
                                            />
                                            {vendorFormData.gst_number && vendorFormData.gst_number.length !== 15 && (
                                                <small className="text-warning">GST number must be 15 characters</small>
                                            )}
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>PAN Number</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="pan_number"
                                                value={vendorFormData.pan_number}
                                                onChange={(e) => setVendorFormData({ ...vendorFormData, pan_number: e.target.value.toUpperCase() })}
                                                placeholder="Enter PAN number (e.g., ABCDE1234F)"
                                                maxLength={10}
                                            />
                                            {vendorFormData.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(vendorFormData.pan_number) && (
                                                <small className="text-warning">PAN must be 10 characters (e.g., ABCDE1234F)</small>
                                            )}
                                        </Form.Group>
                                    </Col>

                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Address</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                name="address"
                                                value={vendorFormData.address}
                                                onChange={(e) => setVendorFormData({ ...vendorFormData, address: e.target.value })}
                                                placeholder="Enter address"
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Country</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="country"
                                                value={vendorFormData.country || "India"}
                                                onChange={(e) => setVendorFormData({ ...vendorFormData, country: e.target.value })}
                                                placeholder="Enter country"
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Pincode</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="pincode"
                                                value={vendorFormData.pincode}
                                                onChange={(e) => setVendorFormData({ ...vendorFormData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                                placeholder="Enter pincode"
                                                maxLength={6}
                                            />
                                            {vendorFormData.pincode && vendorFormData.pincode.length !== 6 && (
                                                <small className="text-warning">Pincode must be 6 digits</small>
                                            )}
                                        </Form.Group>
                                    </Col>

                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Status</Form.Label>
                                            <Form.Select
                                                name="status"
                                                value={vendorFormData.status || "active"}
                                                onChange={(e) => setVendorFormData({ ...vendorFormData, status: e.target.value })}
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="suspended">Suspended</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </div>

                            {/* Additional Information Section (Optional) */}
                            <div className="mb-3">
                                <div className="d-flex align-items-center mb-3" style={{ padding: "10px", background: "#f8f9fa", borderRadius: "8px" }}>
                                    <i className="fa-solid fa-info-circle me-2 text-primary"></i>
                                    <h6 className="mb-0 fw-bold" style={{ color: "#6f42c1" }}>Additional Information (Optional)</h6>
                                </div>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Website</Form.Label>
                                            <Form.Control
                                                type="url"
                                                name="website"
                                                value={vendorFormData.website}
                                                onChange={(e) => setVendorFormData({ ...vendorFormData, website: e.target.value })}
                                                placeholder="https://example.com"
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Payment Terms</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="payment_terms"
                                                value={vendorFormData.payment_terms}
                                                onChange={(e) => setVendorFormData({ ...vendorFormData, payment_terms: e.target.value })}
                                                placeholder="e.g., Net 30 days"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </div>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer className="border-top-0">
                        <Button variant="outline-secondary" onClick={() => setShowAddVendorModal(false)} style={{ borderColor: "#6f42c1", color: "#6f42c1" }}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleAddVendor} disabled={loading} style={{ background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)", border: "none" }}>
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Adding...
                                </>
                            ) : (
                                <>
                                    Add Vendor
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Modal>
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
                        <Card className="mb-4 border-0 bg-light">
                            <Card.Body className="p-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="mb-1 fw-semibold">
                                            <i className="fa-solid fa-barcode me-2"></i>
                                            Scan Barcode
                                        </h6>
                                        <p className="mb-0 text-muted small">
                                            Enter ISBN to auto-fill details and auto-create author/category.
                                            <strong> Book will be created only when you click "Add Book"</strong>
                                        </p>
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
                                                }),
                                                menuPortal: (base) => ({
                                                    ...base,
                                                    zIndex: 9999
                                                })
                                            }}
                                            menuPortalTarget={document.body}
                                            menuShouldScrollIntoView={false}
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
                                                }),
                                                menuPortal: (base) => ({
                                                    ...base,
                                                    zIndex: 9999
                                                })
                                            }}
                                            menuPortalTarget={document.body}
                                            menuShouldScrollIntoView={false}
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

                {/* Add custom CSS for better tabs */}
                <style>{`
                .custom-tabs .nav-link {
                    border: none;
                    color: #6c757d;
                    font-weight: 500;
                    padding: 0.5rem 1rem;
                    margin-right: 0.5rem;
                    border-radius: 8px 8px 0 0;
                    transition: all 0.3s ease;
                }
                .custom-tabs .nav-link:hover {
                    color: #6f42c1;
                    background-color: rgba(111, 66, 193, 0.1);
                }
                .custom-tabs .nav-link.active {
                    color: #6f42c1;
                    background-color: white;
                    border-bottom: 3px solid #6f42c1;
                    font-weight: 600;
                }
                .custom-tabs .nav-tabs {
                    border-bottom: 1px solid #dee2e6;
                }
                .table-row-light {
                    background-color: #fafafa;
                }
                .table-row-light:hover {
                    background-color: #f0f0f0;
                }
                
                /* नया CSS जोड़ें - Dropdown को ऊपर लाने के लिए */
                .react-select__menu {
                    z-index: 9999 !important;
                }
                .react-select__menu-portal {
                    z-index: 9999 !important;
                }
                .table-container {
                    position: relative;
                    z-index: 1;
                }
            `}</style>
            </Container>
        </>
    );
};

export default BulkPurchasePage;