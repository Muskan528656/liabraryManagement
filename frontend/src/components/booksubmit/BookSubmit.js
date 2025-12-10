





















































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Spinner, Badge, InputGroup, Table, Modal, Tab, Nav } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import helper from "../common/helper";
import PubSub from "pubsub-js";
import * as constants from "../../constants/CONSTANT";
import DataApi from "../../api/dataApi";
import ResizableTable from "../common/ResizableTable";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import moment from "moment";

const BookSubmit = () => {
    const navigate = useNavigate();
    const [isbn, setIsbn] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [searchMode, setSearchMode] = useState("isbn");
    const [loading, setLoading] = useState(false);
    const [book, setBook] = useState(null);
    const [libraryCard, setLibraryCard] = useState(null);
    const [cardIssues, setCardIssues] = useState([]);
    const [issue, setIssue] = useState(null);
    const [bookIssues, setBookIssues] = useState([]);
    const [allIssuedBooks, setAllIssuedBooks] = useState([]);
    const [displayedIssuedBooks, setDisplayedIssuedBooks] = useState([]);
    const [penalty, setPenalty] = useState({ penalty: 0, daysOverdue: 0 });
    const [conditionBefore, setConditionBefore] = useState("Good");
    const [conditionAfter, setConditionAfter] = useState("Good");
    const [remarks, setRemarks] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [activeTab, setActiveTab] = useState("submit");
    const [submittedBooks, setSubmittedBooks] = useState([]);
    const [loadingSubmitted, setLoadingSubmitted] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [showScanModal, setShowScanModal] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [timeZone, setTimeZone] = useState(null);
    const [scanMethod, setScanMethod] = useState("isbn");
    const recordsPerPage = 20;
    const isbnInputRef = React.useRef(null);
    const cardInputRef = React.useRef(null);

    useEffect(() => {
        fetchAllIssuedBooks();
        const storedTimeZone = localStorage.getItem('userTimeZone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimeZone(storedTimeZone);
    }, []);

    const fetchAllIssuedBooks = async () => {
        try {
            setLoading(true);
            const issuesResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/bookissue/active`, "GET");

            if (!issuesResp.ok) {
                const err = await issuesResp.json().catch(() => ({}));
                console.error("Error fetching all issued books:", err);
                setAllIssuedBooks([]);
                setDisplayedIssuedBooks([]);
                return;
            }

            const issues = await issuesResp.json();
            console.log("All issued books:", issues);
            setAllIssuedBooks(issues || []);
            setDisplayedIssuedBooks(issues || []);
        } catch (error) {
            console.error("Error fetching all issued books:", error);
            setAllIssuedBooks([]);
            setDisplayedIssuedBooks([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        try {
            return moment(dateStr).format('DD-MM-YYYY');
        } catch (e) {
            return dateStr;
        }
    };

    const getUserDisplayName = (record) => {
        if (!record) return "Unknown User";
        
        const nameFields = [
            record.issued_to_name,
            record.member_name,
            record.student_name,
            record.user_name,
            record.full_name,
            record.name,
            `${record.first_name || ""} ${record.last_name || ""}`.trim(),
            record.issued_to ? `User ${record.issued_to}` : null,
            record.user_id ? `User ${record.user_id}` : null
        ];

        for (let name of nameFields) {
            if (name && name.trim() !== "" && name !== "undefined undefined" && name !== " ") {
                return name.trim();
            }
        }

        return "Unknown User";
    };

    const getSubmittedByDisplayName = (record) => {
        if (!record) return "Unknown User";
        
        console.log("Submitted book record:", record);
        

        const nameFields = [
            record.student_name,
            record.issued_to_name,
            record.user_name,
            record.member_name,
            record.submitted_by,
            record.cardholder_name,
            record.name,
            record.full_name,
            `${record.first_name || ""} ${record.last_name || ""}`.trim(),
            record.issued_to ? `User ${record.issued_to}` : null
        ];

        for (let name of nameFields) {
            if (name && name.trim() !== "" && name !== "undefined undefined" && name !== " ") {
                return name.trim();
            }
        }

        return "Unknown User";
    };

    useEffect(() => {
        if (activeTab === "submitted") {
            fetchSubmittedBooks();
        }
    }, [activeTab]);

    const fetchSubmittedBooks = async () => {
        try {
            setLoadingSubmitted(true);


            const submissionsResp = await helper.fetchWithAuth(
                `${constants.API_BASE_URL}/api/book_submissions`,
                "GET"
            );

            if (!submissionsResp.ok) {
                throw new Error(`HTTP ${submissionsResp.status}`);
            }

            const response = await submissionsResp.json();
            console.log("Submitted Books API Response:", response);

            let submissions = [];


            if (response.success !== undefined) {

                if (Array.isArray(response.data)) {
                    submissions = response.data;
                }

                else if (response.data && Array.isArray(response.data.data)) {
                    submissions = response.data.data;
                }
            }

            else if (Array.isArray(response)) {
                submissions = response;
            }

            else if (response.data && Array.isArray(response.data)) {
                submissions = response.data;
            }

            console.log("Processed Submitted Books:", submissions);
            

            if (submissions.length > 0) {
                console.log("First submitted book record fields:", Object.keys(submissions[0]));
                console.log("First submitted book record values:", submissions[0]);
            }
            
            setSubmittedBooks(submissions);

        } catch (error) {
            console.error("Error fetching submitted books:", error);
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Error",
                message: "Failed to fetch submitted books"
            });
            setSubmittedBooks([]);
        } finally {
            setLoadingSubmitted(false);
        }
    };

    const performSearch = async (value, mode = null) => {
        const searchType = mode || searchMode;
        console.log("Performing search with:", value, "mode:", searchType);

        if (!value || value.trim() === "") {
            setDisplayedIssuedBooks(allIssuedBooks);
            setBookIssues([]);
            setBook(null);
            setLibraryCard(null);
            setCardIssues([]);
            setPenalty({ penalty: 0, daysOverdue: 0 });

            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Validation",
                message: `Please enter or scan ${searchType === "card" ? "Library Card Number" : "ISBN"}`
            });
            return;
        }

        try {
            setLoading(true);

            if (searchType === "card") {
                const cardResp = await helper.fetchWithAuth(
                    `${constants.API_BASE_URL}/api/librarycard/card/${encodeURIComponent(value.trim().toUpperCase())}`,
                    "GET"
                );

                if (!cardResp.ok) {
                    const err = await cardResp.json().catch(() => ({}));
                    PubSub.publish("RECORD_ERROR_TOAST", {
                        title: "Not Found",
                        message: err.errors || "Library card not found"
                    });
                    setLibraryCard(null);
                    setCardIssues([]);
                    setBook(null);
                    setBookIssues([]);
                    setDisplayedIssuedBooks(allIssuedBooks);
                    return;
                }

                const cardData = await cardResp.json();
                console.log("Library Card Data:", cardData);
                setLibraryCard(cardData);

                const issuesResp = await helper.fetchWithAuth(
                    `${constants.API_BASE_URL}/api/bookissue/card/${cardData.id}`,
                    "GET"
                );

                if (!issuesResp.ok) {
                    const err = await issuesResp.json().catch(() => ({}));
                    PubSub.publish("RECORD_ERROR_TOAST", {
                        title: "Error",
                        message: err.errors || "Failed to fetch issue records"
                    });
                    setCardIssues([]);
                    setDisplayedIssuedBooks(allIssuedBooks);
                    return;
                }

                const issues = await issuesResp.json();
                console.log("Card Issues Data:", issues);

                if (!issues || !Array.isArray(issues) || issues.length === 0) {
                    PubSub.publish("RECORD_ERROR_TOAST", {
                        title: "No Active Issue",
                        message: "No active issued record found for this library card"
                    });
                    setCardIssues([]);
                    setDisplayedIssuedBooks(allIssuedBooks);
                    return;
                }

                setCardIssues(issues);
                setDisplayedIssuedBooks(issues);
                setBook(null);
                setBookIssues([]);

            } else {
                const bookResp = await helper.fetchWithAuth(
                    `${constants.API_BASE_URL}/api/book/isbn/${encodeURIComponent(value.trim())}`,
                    "GET"
                );

                if (!bookResp.ok) {
                    const err = await bookResp.json().catch(() => ({}));
                    PubSub.publish("RECORD_ERROR_TOAST", {
                        title: "Not Found",
                        message: err.errors || "Book not found"
                    });
                    setBook(null);
                    setIssue(null);
                    setBookIssues([]);
                    setDisplayedIssuedBooks(allIssuedBooks);
                    return;
                }

                const bookData = await bookResp.json();
                console.log("Book Data:", bookData);
                setBook(bookData);

                const issuesResp = await helper.fetchWithAuth(
                    `${constants.API_BASE_URL}/api/bookissue/book/${bookData.id}`,
                    "GET"
                );

                if (!issuesResp.ok) {
                    const err = await issuesResp.json().catch(() => ({}));
                    PubSub.publish("RECORD_ERROR_TOAST", {
                        title: "Error",
                        message: err.errors || "Failed to fetch issue records"
                    });
                    setIssue(null);
                    setBookIssues([]);
                    setDisplayedIssuedBooks(allIssuedBooks);
                    return;
                }

                const issues = await issuesResp.json();
                console.log("Book Issues Data:", issues);

                if (!issues || !Array.isArray(issues) || issues.length === 0) {
                    PubSub.publish("RECORD_ERROR_TOAST", {
                        title: "No Active Issue",
                        message: "No active issued record found for this ISBN"
                    });
                    setIssue(null);
                    setBookIssues([]);
                    setDisplayedIssuedBooks(allIssuedBooks);
                    return;
                }

                setBookIssues(issues);
                setDisplayedIssuedBooks(issues);
                const activeIssue = issues[0];
                setIssue(activeIssue);

                const penaltyResp = await helper.fetchWithAuth(
                    `${constants.API_BASE_URL}/api/bookissue/penalty/${activeIssue.id}`,
                    "GET"
                );

                if (penaltyResp.ok) {
                    const penaltyData = await penaltyResp.json();
                    if (penaltyData && penaltyData.success) {
                        setPenalty(penaltyData.data || { penalty: 0, daysOverdue: 0 });
                    } else if (penaltyData && penaltyData.data) {
                        setPenalty(penaltyData.data);
                    } else {
                        setPenalty({ penalty: 0, daysOverdue: 0 });
                    }
                } else {
                    setPenalty({ penalty: 0, daysOverdue: 0 });
                }

                setLibraryCard(null);
                setCardIssues([]);
            }

        } catch (error) {
            console.error("Error searching:", error);
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Error",
                message: error.message || "Error searching"
            });
            setBook(null);
            setIssue(null);
            setBookIssues([]);
            setLibraryCard(null);
            setCardIssues([]);
            setDisplayedIssuedBooks(allIssuedBooks);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        const value = searchMode === "card" ? cardNumber : isbn;
        await performSearch(value, searchMode);
    };

    const handleIsbnChange = async (e) => {
        const value = e.target.value;
        setIsbn(value);

        if (value.trim().length >= 3) {
            if (isbnInputRef.current?.timer) {
                clearTimeout(isbnInputRef.current.timer);
            }

            isbnInputRef.current.timer = setTimeout(async () => {
                if (value.trim().length >= 3) {
                    await performSearch(value.trim(), "isbn");
                }
            }, 800);
        } else if (value.trim().length === 0) {
            setBook(null);
            setIssue(null);
            setBookIssues([]);
            setPenalty({ penalty: 0, daysOverdue: 0 });
            setDisplayedIssuedBooks(allIssuedBooks);
        }
    };

    const handleCardNumberChange = async (e) => {
        const value = e.target.value;
        setCardNumber(value);

        if (value.trim().length >= 3) {
            if (cardInputRef.current?.timer) {
                clearTimeout(cardInputRef.current.timer);
            }

            cardInputRef.current.timer = setTimeout(async () => {
                if (value.trim().length >= 3) {
                    await performSearch(value.trim(), "card");
                }
            }, 800);
        } else if (value.trim().length === 0) {
            setLibraryCard(null);
            setCardIssues([]);
            setDisplayedIssuedBooks(allIssuedBooks);
        }
    };

    const handleIsbnKeyDown = async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (isbnInputRef.current?.timer) {
                clearTimeout(isbnInputRef.current.timer);
            }
            setIsScanning(true);
            await performSearch(isbn, "isbn");
            setIsScanning(false);
        }
    };

    const handleCardKeyDown = async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (cardInputRef.current?.timer) {
                clearTimeout(cardInputRef.current.timer);
            }
            setIsScanning(true);
            await performSearch(cardNumber, "card");
            setIsScanning(false);
        }
    };

    const handleClearSearch = () => {
        if (searchMode === "isbn") {
            if (isbnInputRef.current?.timer) {
                clearTimeout(isbnInputRef.current.timer);
            }
            setIsbn("");
            setBook(null);
            setIssue(null);
            setBookIssues([]);
            setPenalty({ penalty: 0, daysOverdue: 0 });
            setDisplayedIssuedBooks(allIssuedBooks);
            isbnInputRef.current?.focus();
        } else {
            if (cardInputRef.current?.timer) {
                clearTimeout(cardInputRef.current.timer);
            }
            setCardNumber("");
            setLibraryCard(null);
            setCardIssues([]);
            setDisplayedIssuedBooks(allIssuedBooks);
            cardInputRef.current?.focus();
        }
    };

    const handleSearchModeChange = (e) => {
        const newMode = e.target.value;
        setSearchMode(newMode);

        setIsbn("");
        setCardNumber("");
        setBook(null);
        setLibraryCard(null);
        setBookIssues([]);
        setCardIssues([]);
        setPenalty({ penalty: 0, daysOverdue: 0 });
        setDisplayedIssuedBooks(allIssuedBooks);

        setTimeout(() => {
            if (newMode === "isbn") {
                isbnInputRef.current?.focus();
            } else {
                cardInputRef.current?.focus();
            }
        }, 100);
    };

    const handleScanButtonClick = () => {
        setScanMethod(searchMode);
        setShowScanModal(true);
    };

    const handleScanSubmit = async () => {
        const value = searchMode === "isbn" ? isbn : cardNumber;
        if (value.trim()) {
            setShowScanModal(false);
            await performSearch(value, searchMode);
        }
    };

    const handleScanInputChange = (e) => {
        const value = e.target.value;
        if (searchMode === "isbn") {
            setIsbn(value);
        } else {
            setCardNumber(value);
        }

        if (value.length >= 8) {
            setTimeout(() => {
                handleScanSubmit();
            }, 100);
        }
    };

    const handleScanInputKeyDown = async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            await handleScanSubmit();
        }
    };

    const handleSubmitClick = (issueItem) => {
        setSelectedIssue(issueItem);
        setShowSubmitModal(true);
    };

    const handleModalClose = () => {
        setShowSubmitModal(false);
        setSelectedIssue(null);
        setConditionAfter("Good");
        setRemarks("");
    };

    const handleFinalSubmit = async () => {
        if (!selectedIssue) return;

        try {
            setLoading(true);
            

            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            
            const submitData = {
                issue_id: selectedIssue.id,
                book_id: selectedIssue.book_id || book?.id,
                book_title: selectedIssue.book_title || book?.title,
                book_isbn: selectedIssue.book_isbn || book?.isbn,
                issued_to: selectedIssue.issued_to,
                issued_to_name: getUserDisplayName(selectedIssue),
                card_number: selectedIssue.card_number,
                condition_before: selectedIssue.condition_before || conditionBefore || 'Good',
                condition_after: conditionAfter || 'Good',
                remarks: remarks || '',
                penalty_amount: penalty.penalty || 0,
                days_overdue: penalty.daysOverdue || 0,
                submit_date: new Date().toISOString(),
                submitted_by: userData?.name || userData?.username || 'System'
            };

            console.log("Submitting book data:", submitData);

            const resp = await helper.fetchWithAuth(
                `${constants.API_BASE_URL}/api/book_submissions`,
                "POST",
                JSON.stringify(submitData)
            );

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                PubSub.publish("RECORD_SAVED_TOAST", {
                    title: "Error",
                    message: err.errors || "Failed to submit book",
                    type: "error"
                });
                return;
            }

            const result = await resp.json();
            console.log("Submit response:", result);
            
            if (result && result.success) {
                PubSub.publish("RECORD_SAVED_TOAST", {
                    title: "Success",
                    message: `Book submitted successfully for ${getUserDisplayName(selectedIssue)}`
                });


                const updatedBookIssues = bookIssues.filter(item => item.id !== selectedIssue.id);
                const updatedCardIssues = cardIssues.filter(item => item.id !== selectedIssue.id);
                const updatedAllIssues = allIssuedBooks.filter(item => item.id !== selectedIssue.id);
                const updatedDisplayedIssues = displayedIssuedBooks.filter(item => item.id !== selectedIssue.id);
                
                setBookIssues(updatedBookIssues);
                setCardIssues(updatedCardIssues);
                setAllIssuedBooks(updatedAllIssues);
                setDisplayedIssuedBooks(updatedDisplayedIssues);


                setSubmittedBooks(prev => [...prev, submitData]);

                handleModalClose();


                if (updatedBookIssues.length === 0 && updatedCardIssues.length === 0) {
                    setIsbn("");
                    setBook(null);
                    setIssue(null);
                    setLibraryCard(null);
                }
            } else {
                PubSub.publish("RECORD_SAVED_TOAST", {
                    title: "Error",
                    message: (result && result.errors) || "Failed to submit book",
                    type: "error"
                });
            }
        } catch (error) {
            console.error("Error submitting book:", error);
            PubSub.publish("RECORD_SAVED_TOAST", {
                title: "Error",
                message: error.message || "Error submitting book",
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredIssuedBooks = displayedIssuedBooks.filter(issue => {
        if (!searchTerm) return true;
        const query = searchTerm.toLowerCase();
        const bookTitle = (issue.book_title || "").toLowerCase();
        const isbn = (issue.book_isbn || "").toLowerCase();
        const studentName = getUserDisplayName(issue).toLowerCase();
        const cardNumber = (issue.card_number || "").toLowerCase();

        return (
            bookTitle.includes(query) ||
            isbn.includes(query) ||
            studentName.includes(query) ||
            cardNumber.includes(query)
        );
    });

    const filteredSubmittedBooks = submittedBooks.filter(submission => {
        if (!searchTerm) return true;
        const query = searchTerm.toLowerCase();
        const bookTitle = (submission.book_title || "").toLowerCase();
        const isbn = (submission.book_isbn || "").toLowerCase();
        const studentName = getSubmittedByDisplayName(submission).toLowerCase();
        return (
            bookTitle.includes(query) ||
            isbn.includes(query) ||
            studentName.includes(query)
        );
    });

    const issueColumns = [
        {
            field: "book_title",
            label: "Book Title",
            width: 250,
            render: (value, record) => {
                const bookId = record.book_id || record.bookId || record.book?.id;
                if (!bookId) {
                    return <span>{value || "N/A"}</span>;
                }
                return (
                    <a
                        href={`/book/${bookId}`}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                                localStorage.setItem(`prefetch:book:${bookId}`, JSON.stringify(record));
                            } catch (err) { }
                            navigate(`/book/${bookId}`, { state: record });
                        }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                                localStorage.setItem(`prefetch:book:${bookId}`, JSON.stringify(record));
                            } catch (err) { }
                            window.open(`/book/${bookId}`, '_blank');
                        }}
                        style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 600, cursor: "pointer" }}
                        onMouseEnter={(e) => {
                            e.target.style.textDecoration = "underline";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.textDecoration = "none";
                        }}
                        title="Click to view book details (Right-click to open in new tab)"
                    >
                        {value || "N/A"}
                    </a>
                );
            }
        },
        {
            field: "book_isbn",
            label: "ISBN",
            width: 150,
            render: (value) => (
                <code style={{ background: "#f8f9fa", padding: "4px 8px", borderRadius: "4px" }}>
                    {value || "-"}
                </code>
            )
        },
        {
            field: "issued_to_name",
            label: "Issued To",
            width: 200,
            render: (value, record) => {
                const displayName = getUserDisplayName(record);
                const userId = record.issued_to || record.card_id || record.member_id;

                if (userId && displayName !== "Unknown User") {
                    return (
                        <a
                            href={`/librarycard/${userId}`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/librarycard/${userId}`, { state: record });
                            }}
                            style={{
                                color: "#6f42c1",
                                textDecoration: "none",
                                fontWeight: 500,
                                cursor: "pointer"
                            }}
                            onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                            onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                        >
                            {displayName}
                        </a>
                    );
                }

                return displayName;
            }
        },
        {
            field: "card_number",
            label: "Card No",
            width: 120
        },
        {
            field: "issue_date",
            label: "Issue Date",
            width: 120,
            render: (value) => {
                return value ? moment(value).format('DD-MM-YYYY') : "-";
            }
        },
        {
            field: "due_date",
            label: "Due Date",
            width: 120,
            render: (value) => {
                if (!value) return "—";
                const displayDate = moment(value).format('DD-MM-YYYY');
                const isOverdue = new Date(value) < new Date();

                return (
                    <span
                        style={{
                            color: isOverdue ? "#dc3545" : "#28a745",
                            fontWeight: "bold",
                        }}
                    >
                        {displayDate}
                    </span>
                );
            }
        },
        {
            field: "actions",
            label: "Action",
            width: 100,
            render: (value, record) => (
                <Button
                    size="sm"
                    onClick={() => handleSubmitClick(record)}
                    variant="success"
                    disabled={loading}
                >
                    {loading ? (
                        <Spinner animation="border" size="sm" />
                    ) : (
                        'Submit'
                    )}
                </Button>
            )
        }
    ];

    const submittedBooksColumns = [
        {
            field: "book_title",
            label: "Book Title",
            width: 250,
            render: (value, record) => {
                const bookId = record.book_id || record.bookId || record.book?.id;
                if (!bookId) {
                    return <span>{value || "N/A"}</span>;
                }
                return (
                    <a
                        href={`/book/${bookId}`}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                                localStorage.setItem(`prefetch:book:${bookId}`, JSON.stringify(record));
                            } catch (err) { }
                            navigate(`/book/${bookId}`, { state: record });
                        }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                                localStorage.setItem(`prefetch:book:${bookId}`, JSON.stringify(record));
                            } catch (err) { }
                            window.open(`/book/${bookId}`, '_blank');
                        }}
                        style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 600, cursor: "pointer" }}
                        onMouseEnter={(e) => {
                            e.target.style.textDecoration = "underline";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.textDecoration = "none";
                        }}
                        title="Click to view book details (Right-click to open in new tab)"
                    >
                        {value || "N/A"}
                    </a>
                );
            }
        },
        {
            field: "book_isbn",
            label: "ISBN",
            width: 150,
            render: (value) => (
                <code style={{ background: "#f8f9fa", padding: "4px 8px", borderRadius: "4px" }}>
                    {value || "-"}
                </code>
            )
        },
        {
            field: "issued_to_name",
            label: "Submitted By",
            width: 200,
            render: (value, record) => {
                const displayName = getSubmittedByDisplayName(record);
                const userId = record.issued_to || record.user_id || record.member_id;

                if (userId && displayName !== "Unknown User") {
                    return (
                        <a
                            href={`/librarycard/${userId}`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/librarycard/${userId}`, { state: record });
                            }}
                            style={{
                                color: "#6f42c1",
                                textDecoration: "none",
                                fontWeight: 500,
                                cursor: "pointer"
                            }}
                            onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
                            onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
                        >
                            {displayName}
                        </a>
                    );
                }
                return displayName;
            }
        },
        {
            field: "submit_date",
            label: "Submit Date",
            width: 150,
            render: (value) => {
                if (!value) return "-";
                try {
                    return moment(value).format('DD-MM-YYYY HH:mm');
                } catch (e) {
                    return value;
                }
            }
        },
        {
            field: "condition_after",
            label: "Condition",
            width: 120,
            render: (value) => (
                <Badge bg={value === "Good" ? "success" : value === "Fair" ? "warning" : "danger"}>
                    {value || "Good"}
                </Badge>
            )
        }
    ];

    return (
        <>
            <Container fluid className="mt-4" style={{ marginTop: "0.5rem", padding: "0 1.5rem" }}>
                <Card style={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "4px", overflow: "hidden" }}>
                    <Card.Body className="">
                        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || "submit")}>
                            <Nav variant="tabs" className="custom-nav-tabs">
                                <Nav.Item>
                                    <Nav.Link eventKey="submit">
                                        <i className="fa-solid fa-book-return me-2"></i>
                                        <span>Submit Book</span>
                                    </Nav.Link>
                                </Nav.Item>

                                <Nav.Item>
                                    <Nav.Link eventKey="submitted">
                                        <span>View Submitted Books ({submittedBooks.length})</span>
                                    </Nav.Link>
                                </Nav.Item>
                                {activeTab === "submitted" && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            right: "20px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            marginTop: "10px"
                                        }}
                                    >
                                        <InputGroup style={{ maxWidth: "250px" }}>
                                            <InputGroup.Text
                                                style={{
                                                    background: "#f3e9fc",
                                                    borderColor: "#e9ecef",
                                                    padding: "0.375rem 0.75rem"
                                                }}
                                            >
                                                <i className="fa-solid fa-search" style={{ color: "#6f42c1" }}></i>
                                            </InputGroup.Text>

                                            <Form.Control
                                                placeholder="Search submitted books..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                style={{
                                                    borderColor: "#e9ecef",
                                                    fontSize: "0.875rem",
                                                    padding: "0.375rem 0.75rem"
                                                }}
                                            />

                                            {searchTerm && (
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={() => setSearchTerm("")}
                                                    style={{
                                                        border: "1px solid #d1d5db",
                                                        borderRadius: "0 6px 6px 0",
                                                        height: "38px"
                                                    }}
                                                >
                                                    <i className="fa-solid fa-times"></i>
                                                </Button>
                                            )}
                                        </InputGroup>
                                    </div>
                                )}
                            </Nav>
                            <Tab.Content>
                                <Tab.Pane eventKey="submit">
                                    <Row>
                                        <Col lg={3} md={12}>
                                            <Card className="mb-4 shadow-sm" style={{ background: "#f3e8ff", border: "1px solid #d8b4fe", borderRadius: "8px" }}>
                                                <Card.Header style={{
                                                    background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                                                    border: "none",
                                                    borderBottom: "2px solid #d1d5db",
                                                    padding: "15px 20px"
                                                }}>
                                                    <h3 className="mb-0 fw-bold" style={{
                                                        color: "#1f2937",
                                                        fontSize: "16px",
                                                        letterSpacing: "0.3px"
                                                    }}>
                                                        <i className="fa-solid fa-book-open me-3" style={{ color: "#6b7280" }}></i>
                                                        Book Identification
                                                    </h3>
                                                </Card.Header>
                                                <Card.Body className="p-4">
                                                    <Form.Group className="mb-3">
                                                        <Form.Label className="fw-bold small">Search By</Form.Label>
                                                        <Form.Select
                                                            value={searchMode}
                                                            onChange={handleSearchModeChange}
                                                            style={{
                                                                border: "2px solid #8b5cf6",
                                                                borderRadius: "8px",
                                                                fontSize: "0.7rem",
                                                                padding: "0.5rem 1rem"
                                                            }}
                                                        >
                                                            <option value="isbn">Search by ISBN</option>
                                                            <option value="card">Search by Library Card</option>
                                                        </Form.Select>
                                                    </Form.Group>

                                                    <Form.Group className="mb-3">
                                                        <Form.Label className="fw-bold small">
                                                            {searchMode === "isbn" ? "ISBN Number" : "Library Card Number"}
                                                        </Form.Label>
                                                        <InputGroup>
                                                            <Form.Control
                                                                ref={searchMode === "isbn" ? isbnInputRef : cardInputRef}
                                                                type="text"
                                                                placeholder={searchMode === "isbn" ? "Enter ISBN number..." : "Enter Library Card number..."}
                                                                value={searchMode === "isbn" ? isbn : cardNumber}
                                                                onChange={searchMode === "isbn" ? handleIsbnChange : handleCardNumberChange}
                                                                onKeyDown={searchMode === "isbn" ? handleIsbnKeyDown : handleCardKeyDown}
                                                                autoFocus
                                                                disabled={loading}
                                                                style={{
                                                                    border: "1px solid #dee2e6",
                                                                    borderRadius: "8px 0 0 8px",
                                                                    fontSize: "0.7rem",
                                                                    padding: "0.5rem 1rem"
                                                                }}
                                                            />
                                                            {loading && (
                                                                <InputGroup.Text style={{
                                                                    border: "1px solid #dee2e6",
                                                                    borderLeft: "none",
                                                                    borderRadius: "0",
                                                                    backgroundColor: "#f8f9fa"
                                                                }}>
                                                                    <Spinner animation="border" size="sm" />
                                                                </InputGroup.Text>
                                                            )}
                                                            <Button
                                                                variant="outline-secondary"
                                                                onClick={handleClearSearch}
                                                                disabled={loading}
                                                                style={{
                                                                    border: "1px solid #dee2e6",
                                                                    borderLeft: loading ? "none" : "1px solid #dee2e6",
                                                                    borderRadius: loading ? "0 8px 8px 0" : "0 8px 8px 0",
                                                                    minWidth: "50px",
                                                                    backgroundColor: "#f8f9fa"
                                                                }}
                                                            >
                                                                <i className="fa-solid fa-xmark"></i>
                                                            </Button>
                                                        </InputGroup>
                                                    </Form.Group>

                                                    <div className="text-center">
                                                        <Button
                                                            variant="primary"
                                                            onClick={handleScanButtonClick}
                                                            disabled={loading}
                                                            style={{
                                                                width: "100%",
                                                                backgroundColor: "#0d6efd",
                                                                border: "none",
                                                                borderRadius: "8px",
                                                                fontWeight: "600",
                                                                fontSize: "0.95rem",
                                                                padding: "0.75rem 1rem",
                                                                boxShadow: "0 2px 4px rgba(13, 110, 253, 0.3)"
                                                            }}
                                                        >
                                                            {loading ? (
                                                                <Spinner animation="border" size="sm" className="me-2" />
                                                            ) : (
                                                                <i className="fa-solid fa-camera me-2"></i>
                                                            )}
                                                            Scan {searchMode === "isbn" ? "ISBN" : "Library Card"}
                                                        </Button>
                                                    </div>
                                                </Card.Body>
                                            </Card>

                                            {libraryCard && (
                                                <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                                                    <Card.Header className="py-3 px-4" style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #6f42c1" }}>
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <h6 className="mb-0 fw-bold" style={{ color: "#6f42c1", fontSize: "1rem" }}>
                                                                <i className="fa-solid fa-id-card me-2"></i>
                                                                Library Card: {libraryCard.card_number}
                                                            </h6>
                                                            <Badge bg="info">
                                                                {cardIssues.length} Active Issue{cardIssues.length !== 1 ? 's' : ''}
                                                            </Badge>
                                                        </div>
                                                    </Card.Header>
                                                    <Card.Body className="py-3 px-4">
                                                        <Row>
                                                            <Col md={6}>
                                                                <div className="mb-2">
                                                                    <strong className="small">Card Holder:</strong>
                                                                    <div className="text-secondary">
                                                                        {getUserDisplayName(libraryCard)}
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                            <Col md={6}>
                                                                <div className="mb-2">
                                                                    <strong className="small">Card Number:</strong>
                                                                    <div className="text-secondary">{libraryCard.card_number}</div>
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </Card.Body>
                                                </Card>
                                            )}

                                            {book && (
                                                <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                                                    <Card.Header style={{
                                                        background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                                                        border: "none",
                                                        borderBottom: "2px solid #d1d5db",
                                                        padding: "20px 24px"
                                                    }}>
                                                        <h5 className="mb-0 fw-bold" style={{
                                                            color: "#1f2937",
                                                            fontSize: "20px",
                                                            letterSpacing: "0.3px"
                                                        }}>
                                                            Book Details for ISBN: {isbn}
                                                        </h5>
                                                    </Card.Header>
                                                    <Card.Body className="py-3 px-4">
                                                        <Row>
                                                            <Col md={6}>
                                                                <div className="mb-2">
                                                                    <strong className="small">Title:</strong>
                                                                    <div className="text-secondary">
                                                                        <a
                                                                            href={`/book/${book.id}`}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                navigate(`/book/${book.id}`);
                                                                            }}
                                                                            style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 600 }}
                                                                            onMouseEnter={(e) => {
                                                                                try {
                                                                                    localStorage.setItem(`prefetch:book:${book.id}`, JSON.stringify(book));
                                                                                } catch (err) { }
                                                                                e.target.style.textDecoration = "underline";
                                                                            }}
                                                                            onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
                                                                        >
                                                                            {book.title}
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                            <Col md={6}>
                                                                <div className="mb-2">
                                                                    <strong className="small">ISBN:</strong>
                                                                    <div className="text-secondary">{book.isbn}</div>
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                        <Row>
                                                            <Col md={6}>
                                                                <div className="mb-2">
                                                                    <strong className="small">Author:</strong>
                                                                    <div className="text-secondary">{book.author || "N/A"}</div>
                                                                </div>
                                                            </Col>
                                                            <Col md={6}>
                                                                <div className="mb-2">
                                                                    <strong className="small">Total Copies:</strong>
                                                                    <div className="text-secondary">{book.total_copies || 0}</div>
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </Card.Body>
                                                </Card>
                                            )}
                                        </Col>

                                        <Col lg={9} md={12}>
                                            <Card className="mb-4 shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                                                <Card.Header style={{
                                                    background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                                                    border: "none",
                                                    borderBottom: "2px solid #d1d5db",
                                                }}>
                                                    <Row className="align-items-center">
                                                        <Col>
                                                            <h5 className="mb-0 fw-bold" style={{
                                                                color: "#1f2937",
                                                                fontSize: "18px",
                                                                letterSpacing: "0.3px"
                                                            }}>
                                                                <i className="fa-solid fa-book-open me-3" style={{ color: "#6b7280" }}></i>
                                                                {bookIssues.length > 0 ? "Issued Books for this ISBN" :
                                                                    cardIssues.length > 0 ? "Issued Books for this Library Card" :
                                                                        "All Issued Books"}
                                                                <span style={{ color: "orange", fontSize: "14px", marginLeft: "8px" }}>
                                                                    ({filteredIssuedBooks.length} Issue{filteredIssuedBooks.length !== 1 ? 's' : ''})
                                                                </span>
                                                            </h5>
                                                        </Col>
                                                        <Col xs="auto">
                                                            <InputGroup style={{ maxWidth: "250px" }}>
                                                                <InputGroup.Text
                                                                    style={{
                                                                        background: "#f3e9fc",
                                                                        borderColor: "#e9ecef",
                                                                        padding: "0.375rem 0.75rem"
                                                                    }}
                                                                >
                                                                    <i className="fa-solid fa-search" style={{ color: "#6f42c1" }}></i>
                                                                </InputGroup.Text>

                                                                <Form.Control
                                                                    placeholder="Search by title, ISBN, name..."
                                                                    value={searchTerm}
                                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                                    style={{
                                                                        borderColor: "#e9ecef",
                                                                        fontSize: "0.875rem",
                                                                        padding: "0.375rem 0.75rem"
                                                                    }}
                                                                />

                                                                {searchTerm && (
                                                                    <Button
                                                                        variant="outline-secondary"
                                                                        onClick={() => setSearchTerm("")}
                                                                        style={{
                                                                            border: "1px solid #d1d5db",
                                                                            borderRadius: "0 6px 6px 0",
                                                                            height: "38px"
                                                                        }}
                                                                    >
                                                                        <i className="fa-solid fa-times"></i>
                                                                    </Button>
                                                                )}
                                                            </InputGroup>
                                                        </Col>
                                                    </Row>
                                                </Card.Header>
                                                <ResizableTable
                                                    data={filteredIssuedBooks}
                                                    columns={issueColumns}
                                                    loading={loading}
                                                    showCheckbox={false}
                                                    showSerialNumber={true}
                                                    showActions={false}
                                                    searchTerm={searchTerm}
                                                    currentPage={currentPage}
                                                    recordsPerPage={recordsPerPage}
                                                    onPageChange={(page) => setCurrentPage(page)}
                                                    emptyMessage={
                                                        book && bookIssues && bookIssues.length === 0
                                                            ? <div className="text-center py-4">
                                                                <i className="fa-solid fa-check-circle fa-2x text-success mb-3"></i>
                                                                <h6 className="text-success">No Active Issues Found</h6>
                                                                <p className="text-muted mb-0">
                                                                    This book is not currently issued to anyone or all issues have been returned.
                                                                </p>
                                                            </div>
                                                            : libraryCard && cardIssues && cardIssues.length === 0
                                                                ? <div className="text-center py-4">
                                                                    <i className="fa-solid fa-check-circle fa-2x text-success mb-3"></i>
                                                                    <h6 className="text-success">No Active Issues Found</h6>
                                                                    <p className="text-muted mb-0">
                                                                        This library card has no active book issues.
                                                                    </p>
                                                                </div>
                                                                : searchTerm
                                                                    ? "No issued books found matching your search"
                                                                    : "No books have been issued yet"
                                                    }
                                                />
                                            </Card>
                                        </Col>
                                    </Row>
                                </Tab.Pane>

                                <Tab.Pane eventKey="submitted">
                                    <Row>
                                        <Col lg={12}>
                                            <Card className="shadow-sm">
                                               
                                                <Card.Body className="p-0" style={{ overflow: "hidden", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
                                                    <ResizableTable
                                                        data={filteredSubmittedBooks}
                                                        columns={submittedBooksColumns}
                                                        loading={loadingSubmitted}
                                                        showCheckbox={false}
                                                        showSerialNumber={true}
                                                        showActions={false}
                                                        searchTerm={searchTerm}
                                                        currentPage={currentPage}
                                                        recordsPerPage={recordsPerPage}
                                                        onPageChange={(page) => setCurrentPage(page)}
                                                        emptyMessage={loadingSubmitted ?
                                                            <div className="text-center py-5">
                                                                <Spinner animation="border" variant="primary" />
                                                                <p className="mt-2">Loading submitted books...</p>
                                                            </div>
                                                            : searchTerm ?
                                                                "No submitted books found matching your search"
                                                                : "No books have been submitted yet"}
                                                    />
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                </Tab.Pane>
                            </Tab.Content>
                        </Tab.Container>
                    </Card.Body>
                </Card>
            </Container>

            {/* Scan Modal */}
            <Modal show={showScanModal} onHide={() => setShowScanModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className={`fa-solid ${scanMethod === "isbn" ? "fa-barcode" : "fa-address-card"} me-2`}></i>
                        {scanMethod === "isbn" ? "Scan Book ISBN" : "Scan Library Card"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="text-center">
                        <i className={`fa-solid ${scanMethod === "isbn" ? "fa-barcode" : "fa-address-card"} fa-4x mb-3`}
                            style={{ color: scanMethod === "isbn" ? "#0d6efd" : "#28a745" }}></i>
                        <h5>Ready to Scan</h5>
                        <p className="text-muted">
                            {scanMethod === "isbn"
                                ? "Point your barcode scanner at the book ISBN barcode"
                                : "Point your barcode scanner at the library card barcode"}
                        </p>

                        <Form.Group className="mt-4">
                            <Form.Label>
                                <strong>
                                    {scanMethod === "isbn" ? "Scanned ISBN:" : "Scanned Library Card:"}
                                </strong>
                            </Form.Label>
                            <Form.Control
                                type="text"
                                placeholder={scanMethod === "isbn" ? "Scanning will auto-populate here..." : "LIB123456..."}
                                value={scanMethod === "isbn" ? isbn : cardNumber}
                                onChange={handleScanInputChange}
                                onKeyDown={handleScanInputKeyDown}
                                autoFocus
                                className="text-center fw-bold"
                                style={{ fontSize: "18px" }}
                            />
                            <Form.Text className="text-muted">
                                {scanMethod === "isbn"
                                    ? "Scan or enter 10 or 13 digit ISBN number"
                                    : "Scan or enter library card number"}
                            </Form.Text>
                        </Form.Group>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowScanModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleScanSubmit}
                        disabled={!((scanMethod === "isbn" ? isbn : cardNumber).trim()) || loading}
                    >
                        {loading ? (
                            <Spinner animation="border" size="sm" className="me-2" />
                        ) : (
                            <i className="fa-solid fa-search me-2"></i>
                        )}
                        {scanMethod === "isbn" ? "Search Book" : "Search Card"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Submit Modal */}
            <Modal show={showSubmitModal} onHide={handleModalClose} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="fa-solid fa-paper-plane me-2 text-success"></i>
                        Submit Book Return
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedIssue && (
                        <div>
                            <h6 className="mb-3">Book Return Details</h6>

                            <Card className="mb-3">
                                <Card.Header className="py-2">
                                    <h6 className="mb-0 small">Issue Information</h6>
                                </Card.Header>
                                <Card.Body className="py-2">
                                    <Row>
                                        <Col md={6}>
                                            <strong className="small">Book Title:</strong>
                                            <div className="text-secondary small">{selectedIssue.book_title || book?.title}</div>
                                        </Col>
                                        <Col md={6}>
                                            <strong className="small">ISBN:</strong>
                                            <div className="text-secondary small">{selectedIssue.book_isbn || book?.isbn}</div>
                                        </Col>
                                    </Row>
                                    <Row className="mt-2">
                                        <Col md={6}>
                                            <strong className="small">Issued To:</strong>
                                            <div className="text-secondary small">
                                                {getUserDisplayName(selectedIssue)}
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <strong className="small">Card Number:</strong>
                                            <div className="text-secondary small">{selectedIssue.card_number || selectedIssue.card_id || '-'}</div>
                                        </Col>
                                    </Row>
                                    <Row className="mt-2">
                                        <Col md={6}>
                                            <strong className="small">Issue Date:</strong>
                                            <div className="text-secondary small">{formatDate(selectedIssue.issue_date)}</div>
                                        </Col>
                                        <Col md={6}>
                                            <strong className="small">Due Date:</strong>
                                            <div className="text-secondary small">{formatDate(selectedIssue.due_date)}</div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            <Card className="mb-3">
                                <Card.Header className="py-2">
                                    <h6 className="mb-0 small">Condition Assessment</h6>
                                </Card.Header>
                                <Card.Body className="py-2">
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-2">
                                                <Form.Label className="small fw-bold">Condition Before</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={selectedIssue.condition_before || conditionBefore}
                                                    onChange={(e) => setConditionBefore(e.target.value)}
                                                    disabled={loading}
                                                    size="sm"
                                                    className="small"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-2">
                                                <Form.Label className="small fw-bold">Condition After</Form.Label>
                                                <Form.Select
                                                    value={conditionAfter}
                                                    onChange={(e) => setConditionAfter(e.target.value)}
                                                    disabled={loading}
                                                    size="sm"
                                                    className="small"
                                                >
                                                    <option value="Good">✅ Good</option>
                                                    <option value="Fair">⚠️ Fair</option>
                                                    <option value="Damaged">❌ Damaged</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Form.Group className="mb-2">
                                        <Form.Label className="small fw-bold">Remarks</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            placeholder="Add notes about book condition..."
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            disabled={loading}
                                            size="sm"
                                            className="small"
                                        />
                                    </Form.Group>
                                </Card.Body>
                            </Card>

                            <Card>
                                <Card.Header className="py-2">
                                    <h6 className="mb-0 small">Penalty Information</h6>
                                </Card.Header>
                                <Card.Body className="py-2">
                                    <div className="text-center">
                                        <h5 style={{
                                            color: penalty.penalty > 0 ? "#dc3545" : "#28a745",
                                            fontWeight: "bold"
                                        }}>
                                            ₹{penalty.penalty || 0}
                                        </h5>
                                        <p className="small text-muted mb-0">
                                            {penalty.daysOverdue ? `Overdue by ${penalty.daysOverdue} day(s)` : "No overdue penalty"}
                                        </p>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleModalClose} disabled={loading}>
                        <i className="fa-solid fa-times me-2"></i>
                        Cancel
                    </Button>
                    <Button variant="success" onClick={handleFinalSubmit} disabled={loading}>
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-check me-2"></i>
                                Confirm Submit
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default BookSubmit;