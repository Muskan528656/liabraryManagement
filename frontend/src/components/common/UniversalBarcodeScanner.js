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


    useEffect(() => {
        if (showModal && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [showModal]);

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

    const detectAndProcessBarcode = async (barcode) => {
        if (!barcode || barcode.trim().length === 0) return;

        setLoading(true);
        try {

            const detectedType = await detectDataType(barcode.trim());
            console.log("Detected data type:", detectedType);


            if (detectedType && detectedType.type === "librarycard" && detectedType.navigate) {
                setLoading(false);
                setShowModal(false);
                navigate(detectedType.module);
                return;
            }

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


            const cleanedBookData = { ...bookData };
            delete cleanedBookData.author_details;
            delete cleanedBookData.category_description;
            delete cleanedBookData.description;

            return {
                type: "book",
                data: cleanedBookData,
                module: "/book",
            };
        }


        try {
            const jsonData = JSON.parse(barcode);
            const result = await analyzeJsonData(jsonData);
            if (result) return result;
        } catch (e) {

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


                        const cleanedBookData = { ...bookData };
                        delete cleanedBookData.author_details;
                        delete cleanedBookData.category_description;
                        delete cleanedBookData.description;

                        return {
                            type: "book",
                            data: cleanedBookData,
                            module: "/book",
                        };
                    }
                }
            }
        }


        if (barcode.length > 3) {
            return {
                type: "book",
                data: { title: barcode.trim() },
                module: "/book",
            };
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

    const analyzeJsonData = async (data) => {
        if (!data || typeof data !== "object") return null;


        if (data.isbn || data.title || data.bookTitle || data.book_title) {
            let bookData = {
                title: data.title || data.bookTitle || data.book_title || "",
                isbn: data.isbn || data.ISBN || "",
                author_id: data.author_id || data.authorId || "",
                category_id: data.category_id || data.categoryId || "",
                total_copies: data.total_copies || data.totalCopies || 1,
                available_copies: data.available_copies || data.availableCopies || 1,
            };


            if (bookData.isbn && !bookData.title) {
                const fetchedData = await fetchBookByISBN(bookData.isbn);
                bookData = { ...fetchedData, ...bookData };
            }

            return {
                type: "book",
                data: bookData,
                module: "/book",
            };
        }


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
                },
                module: "/category",
            };
        }


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

            let dataToInsert = { ...detectedData.data };


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