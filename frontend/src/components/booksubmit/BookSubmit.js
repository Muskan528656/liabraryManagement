
import React, { useState, useEffect } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Form,
    Button,
    Spinner,
    Badge,
    InputGroup,
    Table,
    Modal,
    Tab,
    Nav,
    Dropdown,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import helper from "../common/helper";
import PubSub from "pubsub-js";
import * as constants from "../../constants/CONSTANT";
import DataApi from "../../api/dataApi";
import ResizableTable from "../common/ResizableTable";
import AdvancedFilter, { applyAdvancedFilters } from "../common/AdvancedFilter";
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
    const [penalty, setPenalty] = useState({
        penalty: 0,
        daysOverdue: 0,
        finePerDay: 0,
        breakdown: [],
        calculated: false
    });
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
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [timeZone, setTimeZone] = useState(null);
    const [scanMethod, setScanMethod] = useState("isbn");
    const [librarySettings, setLibrarySettings] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [penaltyBreakdown, setPenaltyBreakdown] = useState([]);
    const [bookPurchaseDetails, setBookPurchaseDetails] = useState(null);
    const [isLoadingPurchaseDetails, setIsLoadingPurchaseDetails] = useState(false);
    const [lostBookPrice, setLostBookPrice] = useState("");
    const [lostBookPriceError, setLostBookPriceError] = useState("");
    const [editFormData, setEditFormData] = useState({
        issue_date: "",
        due_date: "",
        condition_before: "Good",
        remarks: ""
    });
    const [submittedBooksFilters, setSubmittedBooksFilters] = useState({});

    const recordsPerPage = 20;
    const isbnInputRef = React.useRef(null);
    const cardInputRef = React.useRef(null);

    // Helper function to safely get book price from purchase details
    const getBookPriceFromPurchaseDetails = (purchaseDetails) => {
        if (!purchaseDetails) return 0;

        // Try to parse different possible price fields
        const priceFields = ['price', 'unit_price', 'total_price'];
        for (const field of priceFields) {
            if (purchaseDetails[field] !== undefined && purchaseDetails[field] !== null) {
                const parsed = parseFloat(purchaseDetails[field]);
                if (!isNaN(parsed)) {
                    return parsed;
                }
            }
        }
        return 0;
    };

    useEffect(() => {
        fetchAllIssuedBooks();
        fetchLibrarySettings();
        const storedTimeZone = localStorage.getItem('userTimeZone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimeZone(storedTimeZone);
    }, []);

    const fetchLibrarySettings = async () => {
        try {
            const resp = await helper.fetchWithAuth(
                `${constants.API_BASE_URL}/api/librarysettings`,
                "GET"
            );

            if (resp.ok) {
                const data = await resp.json();
                console.log("Library Settings:", data);

                let settings = {};
                if (data.success && data.data && Array.isArray(data.data)) {
                    settings = data.data[0] || {};
                } else if (Array.isArray(data)) {
                    settings = data[0] || {};
                } else if (data.data && typeof data.data === 'object') {
                    settings = data.data;
                }

                setLibrarySettings(settings);
                console.log("Fine per day set to:", settings.fine_per_day);
            } else {
                console.error("Failed to fetch library settings");
                const defaultSettings = {
                    fine_per_day: 5,
                    max_books_per_card: 6,
                    damage_percentage: 50,
                    lost_percentage: 100
                };
                setLibrarySettings(defaultSettings);
            }
        } catch (error) {
            console.error("Error fetching library settings:", error);
            const defaultSettings = {
                fine_per_day: 5,
                max_books_per_card: 6,
                damage_percentage: 50,
                lost_percentage: 100
            };
            setLibrarySettings(defaultSettings);
        }
    };

    const fetchBookPurchaseDetails = async (bookId) => {
        if (!bookId) return null;

        try {
            setIsLoadingPurchaseDetails(true);
            const resp = await helper.fetchWithAuth(
                `${constants.API_BASE_URL}/api/purchase/book/${bookId}`,
                "GET"
            );

            console.log("Fetch Purchase Details Response:", resp);

            if (resp.ok) {
                const data = await resp.json();
                console.log("Book Purchase Details:", data);

                let purchaseDetails = null;
                if (data.success && data.data) {
                    purchaseDetails = data.data;
                } else if (data && data.length > 0) {
                    purchaseDetails = data[0];
                } else if (data && data.data && data.data.length > 0) {
                    purchaseDetails = data.data[0];
                }

                setBookPurchaseDetails(purchaseDetails);

                if (conditionAfter === "Lost" && purchaseDetails) {
                    const price = getBookPriceFromPurchaseDetails(purchaseDetails);
                    setLostBookPrice(price.toString());
                }

                return purchaseDetails;
            }
            return null;
        } catch (error) {
            console.error("Error fetching purchase details:", error);
            return null;
        } finally {
            setIsLoadingPurchaseDetails(false);
        }
    };

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
            console.log("Fetched active issues:", issues);
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
            record.submitted_by_name,
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

    const getSubmittedByDisplayName = (record) => {
        if (!record) return "Unknown User";

        const nameFields = [
            record.submitted_by_name,
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
            console.log("Fetch Submitted Books Response:", submissionsResp);
            if (!submissionsResp.ok) {
                throw new Error(`HTTP ${submissionsResp.status}`);
            }

            const response = await submissionsResp.json();
            let submissions = [];
            console.log("Submitted Books Data:", response);
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

    const calculatePenalty = async (issueRecord, condition = "Good", manualLostPrice = null) => {
        if (!issueRecord) {
            return {
                penalty: 0,
                daysOverdue: 0,
                finePerDay: 0,
                breakdown: [],
                calculated: false
            };
        }

        setIsCalculating(true);

        const finePerDay = librarySettings?.fine_per_day || 5;
        const damagePercentage = librarySettings?.damage_percentage || 50;
        const lostPercentage = librarySettings?.lost_percentage || 100;

        console.log("Library settings for penalty:", {
            finePerDay,
            damagePercentage,
            lostPercentage
        });

        const today = new Date();
        const dueDate = new Date(issueRecord.due_date);
        const daysOverdue = Math.max(0, Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24)));

        let totalPenalty = 0;
        const breakdown = [];

        let bookPrice = 0;

        if (condition && condition.toLowerCase() === "damaged") {
            const purchaseDetails = await fetchBookPurchaseDetails(issueRecord.book_id || book?.id);
            if (purchaseDetails) {
                bookPrice = getBookPriceFromPurchaseDetails(purchaseDetails);
            }
        }

        if (condition && condition.toLowerCase() === "lost") {
            if (manualLostPrice !== null && manualLostPrice !== "") {
                bookPrice = parseFloat(manualLostPrice);
            } else {
                const purchaseDetails = await fetchBookPurchaseDetails(issueRecord.book_id || book?.id);
                if (purchaseDetails) {
                    bookPrice = getBookPriceFromPurchaseDetails(purchaseDetails);
                }
            }
        }

        console.log("Penalty calculation params:", {
            condition,
            daysOverdue,
            finePerDay,
            bookPrice,
            manualLostPrice,
            damagePercentage,
            lostPercentage
        });

        if (daysOverdue > 0 && finePerDay > 0) {
            const latePenalty = daysOverdue * finePerDay;
            totalPenalty += latePenalty;
            breakdown.push({
                type: "Late Return",
                description: `${daysOverdue} day(s) overdue`,
                calculation: `${daysOverdue} days × ₹${finePerDay}/day`,
                amount: latePenalty,
                color: "#f59e0b"
            });
        }

        if (condition && condition.toLowerCase() === "damaged" && bookPrice > 0) {
            const damagePenalty = (bookPrice * damagePercentage) / 100;
            totalPenalty += damagePenalty;
            breakdown.push({
                type: "Book Damage",
                description: `Damage penalty (${damagePercentage}% of book price)`,
                calculation: `₹${bookPrice} × ${damagePercentage}%`,
                amount: damagePenalty,
                color: "#ef4444"
            });
        }

        if (condition && condition.toLowerCase() === "lost" && bookPrice > 0) {
            const lostPenalty = (bookPrice * lostPercentage) / 100;
            totalPenalty += lostPenalty;
            breakdown.push({
                type: "Book Lost",
                description: `Lost book (${lostPercentage}% of book price)`,
                calculation: `₹${bookPrice} × ${lostPercentage}%`,
                amount: lostPenalty,
                color: "#dc2626"
            });
        }

        if (bookPrice > 0 && (condition.toLowerCase() === "damaged" || condition.toLowerCase() === "lost")) {
            breakdown.unshift({
                type: "Book Price",
                description: condition.toLowerCase() === "lost" ? "Lost book value" : "Latest purchase price",
                calculation: condition.toLowerCase() === "lost" ? "Manual entry" : "From purchase records",
                amount: bookPrice,
                color: "#10b981",
                isInfo: true
            });
        }

        console.log("Final penalty calculation:", {
            totalPenalty,
            daysOverdue,
            finePerDay,
            breakdown
        });

        setIsCalculating(false);

        return {
            penalty: totalPenalty,
            daysOverdue: daysOverdue,
            finePerDay: finePerDay,
            bookPrice: bookPrice,
            breakdown: breakdown,
            calculated: true
        };
    };

    useEffect(() => {
        if (selectedIssue) {
            const recalculatePenalty = async () => {
                const manualPrice = conditionAfter === "Lost" ? lostBookPrice : null;
                const calculatedPenalty = await calculatePenalty(selectedIssue, conditionAfter, manualPrice);
                setPenalty(calculatedPenalty);
                setPenaltyBreakdown(calculatedPenalty.breakdown);
            };
            recalculatePenalty();
        }
    }, [selectedIssue, conditionAfter, lostBookPrice]);

    useEffect(() => {
        if (selectedIssue && librarySettings) {
            const recalculatePenalty = async () => {
                const manualPrice = conditionAfter === "Lost" ? lostBookPrice : null;
                const calculatedPenalty = await calculatePenalty(selectedIssue, conditionAfter, manualPrice);
                setPenalty(calculatedPenalty);
                setPenaltyBreakdown(calculatedPenalty.breakdown);
            };
            recalculatePenalty();
        }
    }, [librarySettings]);

    const handleConditionAfterChange = async (e) => {
        const newCondition = e.target.value;
        setConditionAfter(newCondition);

        if (newCondition !== "Lost") {
            setLostBookPrice("");
            setLostBookPriceError("");
        } else {
            if (selectedIssue) {
                const purchaseDetails = await fetchBookPurchaseDetails(selectedIssue.book_id || book?.id);
                if (purchaseDetails) {
                    const price = getBookPriceFromPurchaseDetails(purchaseDetails);
                    setLostBookPrice(price.toString());
                }
            }
        }
    };

    const handleLostBookPriceChange = (e) => {
        const value = e.target.value;

        if (value === "" || /^\d*\.?\d*$/.test(value)) {
            setLostBookPrice(value);

            if (value !== "" && parseFloat(value) <= 0) {
                setLostBookPriceError("Book price must be greater than 0");
            } else {
                setLostBookPriceError("");

                if (selectedIssue && conditionAfter === "Lost") {
                    const recalculatePenalty = async () => {
                        const calculatedPenalty = await calculatePenalty(selectedIssue, conditionAfter, value);
                        setPenalty(calculatedPenalty);
                        setPenaltyBreakdown(calculatedPenalty.breakdown);
                    };
                    recalculatePenalty();
                }
            }
        }
    };

    useEffect(() => {
        if (showSubmitModal && selectedIssue && conditionAfter === "Lost") {
            fetchBookPurchaseDetails(selectedIssue.book_id || book?.id);
        }
    }, [showSubmitModal, selectedIssue, conditionAfter]);

    const performSearch = async (value, mode = null) => {
        const searchType = mode || searchMode;

        if (!value || value.trim() === "") {
            setDisplayedIssuedBooks(allIssuedBooks);
            setBookIssues([]);
            setBook(null);
            setLibraryCard(null);
            setCardIssues([]);
            setPenalty({
                penalty: 0,
                daysOverdue: 0,
                finePerDay: 0,
                breakdown: [],
                calculated: false
            });

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

                if (!issues || !Array.isArray(issues) || issues.length === 0) {
                    PubSub.publish("RECORD_ERROR_TOAST", {
                        title: "No Active Issue",
                        message: "No active issued record found for this library card"
                    });
                    setCardIssues([]);
                    setDisplayedIssuedBooks(allIssuedBooks);
                    return;
                }

                const enrichedIssues = issues.map(issue => ({
                    ...issue,
                    issued_to_name: getUserDisplayName(cardData) || issue.issued_to_name,
                    card_number: cardData.card_number || issue.card_number,
                }));

                setCardIssues(enrichedIssues);
                setDisplayedIssuedBooks(enrichedIssues);
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

                const enrichedIssues = await Promise.all(issues.map(async (issue) => {
                    if (issue.card_id) {
                        try {
                            const cardResp = await helper.fetchWithAuth(
                                `${constants.API_BASE_URL}/api/librarycard/card/${issue.card_id}`,
                                "GET"
                            );

                            if (cardResp.ok) {
                                const cardData = await cardResp.json();
                                return {
                                    ...issue,
                                    card_number: cardData.card_number || issue.card_number,
                                    issued_to_name: getUserDisplayName(cardData) || issue.issued_to_name,
                                };
                            }
                        } catch (error) {
                            console.error("Error fetching card data for issue:", issue.id, error);
                        }
                    }
                    return issue;
                }));

                setBookIssues(enrichedIssues);
                setDisplayedIssuedBooks(enrichedIssues);
                const activeIssue = enrichedIssues[0];
                setIssue(activeIssue);

                const calculatedPenalty = await calculatePenalty(activeIssue, "Good");
                setPenalty(calculatedPenalty);

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
            setPenalty({
                penalty: 0,
                daysOverdue: 0,
                finePerDay: 0,
                breakdown: [],
                calculated: false
            });
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
            setPenalty({
                penalty: 0,
                daysOverdue: 0,
                finePerDay: 0,
                breakdown: [],
                calculated: false
            });
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

        // ✅ CLEAR BOTH TIMERS
        if (isbnInputRef.current?.timer) {
            clearTimeout(isbnInputRef.current.timer);
        }
        if (cardInputRef.current?.timer) {
            clearTimeout(cardInputRef.current.timer);
        }

        setSearchMode(newMode);

        setIsbn("");
        setCardNumber("");
        setBook(null);
        setLibraryCard(null);
        setBookIssues([]);
        setCardIssues([]);
        setPenalty({
            penalty: 0,
            daysOverdue: 0,
            finePerDay: 0,
            breakdown: [],
            calculated: false
        });
        setDisplayedIssuedBooks(allIssuedBooks);

        setTimeout(() => {
            newMode === "isbn"
                ? isbnInputRef.current?.focus()
                : cardInputRef.current?.focus();
        }, 100);
    };

    const handleScanButtonClick = async () => {
        if (searchMode === "isbn" && isbnInputRef.current?.timer) {
            clearTimeout(isbnInputRef.current.timer);
        }
        if (searchMode === "card" && cardInputRef.current?.timer) {
            clearTimeout(cardInputRef.current.timer);
        }

        setIsScanning(true);
        await handleSearch();   // ✅ single source
        setIsScanning(false);
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

    // Handle Edit Click
    const handleEditClick = (issueItem) => {
        setSelectedIssue(issueItem);
        setEditFormData({
            issue_date: issueItem.issue_date ? issueItem.issue_date.split('T')[0] : "",
            due_date: issueItem.due_date ? issueItem.due_date.split('T')[0] : "",
            condition_before: issueItem.condition_before || "Good",
            remarks: issueItem.remarks || ""
        });
        setShowEditModal(true);
    };

    const handleCancelClick = (issueItem) => {
        setSelectedIssue(issueItem);
        setShowCancelModal(true);
    };

    const handleSubmitClick = async (issueItem) => {
        setSelectedIssue(issueItem);
        setConditionAfter("Good");
        setRemarks("");
        setLostBookPrice("");
        setLostBookPriceError("");

        const initialPenalty = await calculatePenalty(issueItem, "Good");
        setPenalty(initialPenalty);
        setPenaltyBreakdown(initialPenalty.breakdown);

        setShowSubmitModal(true);
    };

    const handleEditSubmit = async () => {
        if (!selectedIssue) return;

        try {
            setLoading(true);

            const updateData = {
                issue_date: editFormData.issue_date,
                due_date: editFormData.due_date,
                condition_before: editFormData.condition_before,
                remarks: editFormData.remarks,
                // Keep other fields same as original record
                book_id: selectedIssue.book_id,
                issued_to: selectedIssue.issued_to,
                book_title: selectedIssue.book_title,
                book_isbn: selectedIssue.book_isbn,
                card_id: selectedIssue.card_id,
                card_number: selectedIssue.card_number
            };

            // Use PUT request to update the entire issue record
            const resp = await helper.fetchWithAuth(
                `${constants.API_BASE_URL}/api/bookissue/${selectedIssue.id}`,
                "PUT",
                JSON.stringify(updateData)
            );

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                PubSub.publish("RECORD_ERROR_TOAST", {
                    title: "Error",
                    message: err.errors || "Failed to update issue"
                });
                return;
            }

            const result = await resp.json();

            if (result.success) {
                PubSub.publish("RECORD_SUCCESS_TOAST", {
                    title: "Success",
                    message: "Issue updated successfully"
                });

                // Refresh the list
                await fetchAllIssuedBooks();
                // If we have current search results, update them too
                if (bookIssues.length > 0) {
                    const updatedBookIssues = bookIssues.map(item =>
                        item.id === selectedIssue.id ? { ...item, ...updateData } : item
                    );
                    setBookIssues(updatedBookIssues);
                    setDisplayedIssuedBooks(updatedBookIssues);
                }
                if (cardIssues.length > 0) {
                    const updatedCardIssues = cardIssues.map(item =>
                        item.id === selectedIssue.id ? { ...item, ...updateData } : item
                    );
                    setCardIssues(updatedCardIssues);
                    setDisplayedIssuedBooks(updatedCardIssues);
                }

                setShowEditModal(false);
                setSelectedIssue(null);
            } else {
                PubSub.publish("RECORD_ERROR_TOAST", {
                    title: "Error",
                    message: result.errors || "Failed to update issue"
                });
            }
        } catch (error) {
            console.error("Error updating issue:", error);
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Error",
                message: error.message || "Error updating issue"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelConfirm = async () => {
        console.log("Cancelling issue:", selectedIssue);
        if (!selectedIssue) return;

        try {
            setLoading(true);

            // Prepare the cancellation data - update status to "cancelled"
            const cancelData = {
                status: "cancelled",
                cancellation_reason: "Cancelled by librarian",
                cancellation_date: new Date().toISOString(),
                // Keep all other original data
                book_id: selectedIssue.book_id,
                issued_to: selectedIssue.issued_to,
                book_title: selectedIssue.book_title,
                book_isbn: selectedIssue.book_isbn,
                card_id: selectedIssue.card_id,
                card_number: selectedIssue.card_number,
                issue_date: selectedIssue.issue_date,
                due_date: selectedIssue.due_date,
                condition_before: selectedIssue.condition_before,
                remarks: selectedIssue.remarks
            };

            // Use PUT request to update the status
            const resp = await helper.fetchWithAuth(
                `${constants.API_BASE_URL}/api/bookissue/${selectedIssue.id}`,
                "PUT",
                JSON.stringify(cancelData)
            );

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                PubSub.publish("RECORD_ERROR_TOAST", {
                    title: "Error",
                    message: err.errors || "Failed to cancel issue"
                });
                return;
            }

            const result = await resp.json();

            if (result.success) {
                PubSub.publish("RECORD_SUCCESS_TOAST", {
                    title: "Success",
                    message: "Issue cancelled successfully"
                });

                // Refresh the list
                await fetchAllIssuedBooks();
                // Update local state to remove the cancelled issue from current view
                const updatedBookIssues = bookIssues.filter(item => item.id !== selectedIssue.id);
                const updatedCardIssues = cardIssues.filter(item => item.id !== selectedIssue.id);
                const updatedAllIssues = allIssuedBooks.filter(item => item.id !== selectedIssue.id);
                const updatedDisplayedIssues = displayedIssuedBooks.filter(item => item.id !== selectedIssue.id);

                setBookIssues(updatedBookIssues);
                setCardIssues(updatedCardIssues);
                setAllIssuedBooks(updatedAllIssues);
                setDisplayedIssuedBooks(updatedDisplayedIssues);

                setShowCancelModal(false);
                setSelectedIssue(null);
            } else {
                PubSub.publish("RECORD_ERROR_TOAST", {
                    title: "Error",
                    message: result.errors || "Failed to cancel issue"
                });
            }
        } catch (error) {
            console.error("Error cancelling issue:", error);
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Error",
                message: error.message || "Error cancelling issue"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleModalClose = () => {
        setShowSubmitModal(false);
        setShowEditModal(false);
        setShowCancelModal(false);
        setSelectedIssue(null);
        setConditionAfter("Good");
        setRemarks("");
        setLostBookPrice("");
        setLostBookPriceError("");
        setEditFormData({
            issue_date: "",
            due_date: "",
            condition_before: "Good",
            remarks: ""
        });
        setPenalty({
            penalty: 0,
            daysOverdue: 0,
            finePerDay: 0,
            breakdown: [],
            calculated: false
        });
        setPenaltyBreakdown([]);
        setBookPurchaseDetails(null);
    };

    const handleFinalSubmit = async () => {
        if (!selectedIssue) return;

        if (conditionAfter === "Lost") {
            if (!lostBookPrice || lostBookPrice.trim() === "") {
                setLostBookPriceError("Please enter the book price");
                PubSub.publish("RECORD_ERROR_TOAST", {
                    title: "Validation Error",
                    message: "Please enter the book price for lost book"
                });
                return;
            }

            const price = parseFloat(lostBookPrice);
            if (isNaN(price) || price <= 0) {
                setLostBookPriceError("Please enter a valid book price greater than 0");
                PubSub.publish("RECORD_ERROR_TOAST", {
                    title: "Validation Error",
                    message: "Please enter a valid book price greater than 0"
                });
                return;
            }
        }

        try {
            setLoading(true);

            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const companyId = userData?.company_id || userData?.companyId || 1;

            const manualPrice = conditionAfter === "Lost" ? lostBookPrice : null;
            const finalPenalty = await calculatePenalty(selectedIssue, conditionAfter, manualPrice);

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
                penalty_amount: finalPenalty.penalty || 0,
                days_overdue: finalPenalty.daysOverdue || 0,
                submit_date: new Date().toISOString(),
                submitted_by: userData?.name || userData?.username || 'System',
                company_id: companyId,
                book_price: finalPenalty.bookPrice || 0,
                fine_per_day: finalPenalty.finePerDay || 0,
                lost_book_price: conditionAfter === "Lost" ? parseFloat(lostBookPrice) : null,
                lost_percentage: conditionAfter === "Lost" ? (librarySettings?.lost_percentage || 100) : null,
                lost_penalty_amount: conditionAfter === "Lost" ? finalPenalty.penalty : null
            };

            const cleanedData = Object.fromEntries(
                Object.entries(submitData).filter(([_, v]) => v !== undefined)
            );

            console.log("Submitting book data:", cleanedData);

            const resp = await helper.fetchWithAuth(
                `${constants.API_BASE_URL}/api/book_submissions`,
                "POST",
                JSON.stringify(cleanedData)
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

            if (result && result.success) {
                PubSub.publish("RECORD_SAVED_TOAST", {
                    title: "Success",
                    message: `Book submitted successfully for ${getUserDisplayName(selectedIssue)}`,
                    type: "success"
                });

                const updatedBookIssues = bookIssues.filter(item => item.id !== selectedIssue.id);
                const updatedCardIssues = cardIssues.filter(item => item.id !== selectedIssue.id);
                const updatedAllIssues = allIssuedBooks.filter(item => item.id !== selectedIssue.id);
                const updatedDisplayedIssues = displayedIssuedBooks.filter(item => item.id !== selectedIssue.id);

                setBookIssues(updatedBookIssues);
                setCardIssues(updatedCardIssues);
                setAllIssuedBooks(updatedAllIssues);
                setDisplayedIssuedBooks(updatedDisplayedIssues);

                const newSubmission = {
                    ...cleanedData,
                    id: result.data?.submission_id || Date.now(),
                    submit_date: new Date().toISOString(),
                    submitted_by_name: userData?.name || userData?.username || 'System',
                    penalty_type: result.data?.penalty_type || (conditionAfter !== "Good" ? conditionAfter.toLowerCase() : "late"),
                    penalty_amount: result.data?.penalty_amount || cleanedData.penalty_amount,
                    days_overdue: result.data?.days_overdue || cleanedData.days_overdue,
                    lost_book_price: conditionAfter === "Lost" ? parseFloat(lostBookPrice) : null
                };
                setSubmittedBooks(prev => [...prev, newSubmission]);

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
    }).filter(submission => {
        // Apply advanced filters
        return applyAdvancedFilters([submission], submittedBooksFilters).length > 0;
    });

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'issued':
                return <Badge bg="primary">Issued</Badge>;
            case 'returned':
                return <Badge bg="success">Returned</Badge>;
            case 'submitted':
                return <Badge bg="info">Submitted</Badge>;
            case 'cancelled':
                return <Badge bg="secondary">Cancelled</Badge>;
            case 'overdue':
                return <Badge bg="danger">Overdue</Badge>;
            default:
                return <Badge bg="warning">Unknown</Badge>;
        }
    };

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
                        style={{ color: "var(--primary-color)", textDecoration: "none", fontWeight: 600, cursor: "pointer" }}
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
                                color: "var(--primary-color)",
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
            width: 120,
            render: (value, record) => value || record.card_id || '-'
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
            field: "status",
            label: "Status",
            width: 100,
            render: (value) => getStatusBadge(value)
        },
        {
            field: "actions",
            label: "Actions",
            width: 200,
            render: (value, record) => {
                const isIssued = record.status?.toLowerCase() === 'issued';

                if (!isIssued) {
                    return <Badge bg="secondary">No Actions</Badge>;
                }

                return (
                    <div className="btn-group">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSubmitClick(record)}
                            title="Submit Return"
                        >
                            <i className="fa-solid fa-check-circle"></i> Submit
                        </Button>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleEditClick(record)}
                            title="Edit Issue"
                        >
                            <i className="fa-solid fa-edit"></i>
                        </Button>
                        <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleCancelClick(record)}
                            title="Cancel Issue"
                        >
                            <i className="fa-solid fa-times"></i>
                        </Button>
                    </div>
                );
            }
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
                        style={{ color: "var(--primary-color)", textDecoration: "none", fontWeight: 600, cursor: "pointer" }}
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
                                color: "var(--primary-color)",
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
        },
        {
            field: "penalty",
            label: "Penalty",
            width: 100,
            render: (value) => (
                <span className={`fw-bold ${value > 0 ? "text-danger" : "text-success"}`}>
                    ₹{parseFloat(value || 0).toFixed(2)}
                </span>
            )
        },
        {
            field: "status",
            label: "Status",
            width: 100,
            render: (value) => getStatusBadge(value)
        }
    ];

    // Advanced Filter Configuration for Submitted Books
    const submittedBooksFilterFields = [
        {
            name: "status",
            label: "Status",
            type: "select",
            options: [
                { value: "cancel", label: "Cancel" },
                { value: "issued", label: "Issued" },
                { value: "lost", label: "Lost" },
                { value: "damage", label: "Damage" },
                { value: "fair", label: "Fair" }
            ]
        },
        {
            name: "book_title",
            label: "Book Name",
            type: "text"
        },
        {
            name: "issued_to_name",
            label: "Member Name",
            type: "text"
        },
        {
            name: "submit_date",
            label: "Submission Date",
            type: "date"
        }
    ];

    return (
        <>
            <Container fluid className="mt-2">
                <Card style={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "8px", overflow: "hidden" }}>
                    <Card.Body className="p-0">
                        <Tab.Container
                            activeKey={activeTab}
                            onSelect={(k) => setActiveTab(k || "submit")}
                            id="book-tabs-container"
                        >
                            <Nav variant="tabs" className="border-bottom-0 position-relative">
                                <Nav.Item>
                                    <Nav.Link
                                        eventKey="submit"
                                        className={`fw-semibold ${activeTab === 'submit' ? 'active' : ''}`}
                                        style={{
                                            border: "none",
                                            borderRadius: "8px 8px 0 0",
                                            padding: "12px 24px",
                                            backgroundColor: activeTab === 'submit' ? "var(--primary-color)" : "var(--secondary-background-color)",
                                            color: activeTab === 'submit' ? "white" : "#64748b",
                                            borderTop: activeTab === 'submit' ? "3px solid var(--primary-color)" : "3px solid transparent",
                                            fontSize: "14px",
                                            transition: "all 0.3s ease",
                                            marginBottom: "-1px"
                                        }}
                                    >
                                        <i className="fa-solid fa-book-return me-2"></i>
                                        <span>Submit Book</span>
                                    </Nav.Link>
                                </Nav.Item>

                                <Nav.Item>
                                    <Nav.Link
                                        eventKey="submitted"
                                        className={`fw-semibold ${activeTab === 'submitted' ? 'active' : ''}`}
                                        style={{
                                            border: "none",
                                            borderRadius: "8px 8px 0 0",
                                            padding: "12px 24px",
                                            backgroundColor: activeTab === 'submitted' ? "var(--primary-color)" : "transparent",
                                            color: activeTab === 'submitted' ? "white" : "#64748b",
                                            borderTop: activeTab === 'submitted' ? "3px solid var(--primary-color)" : "3px solid transparent",
                                            fontSize: "14px",
                                            transition: "all 0.3s ease",
                                            marginBottom: "-1px"
                                        }}
                                    >
                                        <span>View Submitted Books ({submittedBooks.length})</span>
                                    </Nav.Link>
                                </Nav.Item>

                                {/* Search bar for submitted tab */}
                                {activeTab === "submitted" && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            right: "20px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            zIndex: 10
                                        }}
                                    >
                                        <InputGroup style={{ maxWidth: "250px" }}>
                                            <InputGroup.Text
                                                style={{
                                                    background: "var(--primary-color)",
                                                    borderColor: "var(--primary-color)",
                                                    padding: "0.375rem 0.75rem"
                                                }}
                                            >
                                                <i className="fa-solid fa-search" style={{ color: "white" }}></i>
                                            </InputGroup.Text>

                                            <Form.Control
                                                placeholder="Search submitted books..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                style={{
                                                    borderColor: "var(--primary-color)",
                                                    fontSize: "0.875rem",
                                                    padding: "0.375rem 0.75rem"
                                                }}
                                            />

                                            {searchTerm && (
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={() => setSearchTerm("")}
                                                    style={{
                                                        border: "1px solid #3b82f6",
                                                        backgroundColor: "white",
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

                            <Tab.Content style={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderTop: "none", borderRadius: "0 8px 8px 8px", padding: "20px" }}>
                                <Tab.Pane eventKey="submit">
                                    <Row>
                                        <Col xs={12}>
                                            <Card className="shadow-sm" style={{
                                                background: "#f3e8ff",
                                                border: "1px solid #d8b4fe",
                                                borderRadius: "8px"
                                            }}>
                                                <Card.Body>
                                                    <Row className="align-items-center">
                                                        {/* Search By Dropdown */}
                                                        <Col md={3}>
                                                            <Form.Group className="mb-0">
                                                                <Form.Label className="fw-bold small">Search By</Form.Label>
                                                                <Form.Select
                                                                    value={searchMode}
                                                                    onChange={handleSearchModeChange}
                                                                    style={{
                                                                        border: "2px solid #8b5cf6",
                                                                        borderRadius: "6px",
                                                                        fontSize: "0.9rem",
                                                                        height: "40px",
                                                                        padding: "0.375rem 0.75rem"
                                                                    }}
                                                                >
                                                                    <option value="isbn">Search by ISBN</option>
                                                                    <option value="card">Search by Library Card</option>
                                                                </Form.Select>
                                                            </Form.Group>
                                                        </Col>

                                                        {/* Search Input with Scan Button */}
                                                        <Col md={6}>
                                                            <Form.Group className="mb-0">
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
                                                                            borderRadius: "6px 0 0 6px",
                                                                            height: "40px",
                                                                            fontSize: "0.9rem",
                                                                            padding: "0.375rem 0.75rem"
                                                                        }}
                                                                    />
                                                                    {loading && (
                                                                        <InputGroup.Text style={{
                                                                            border: "1px solid #dee2e6",
                                                                            borderLeft: "none",
                                                                            borderRadius: "0",
                                                                            backgroundColor: "#f8f9fa",
                                                                            height: "40px",
                                                                            padding: "0.375rem 0.75rem"
                                                                        }}>
                                                                            <Spinner animation="border" size="sm" />
                                                                        </InputGroup.Text>
                                                                    )}

                                                                    {/* Clear Button */}
                                                                    <Button
                                                                        variant="outline-secondary"
                                                                        onClick={handleClearSearch}
                                                                        disabled={loading}
                                                                        style={{
                                                                            border: "1px solid #dee2e6",
                                                                            borderLeft: loading ? "none" : "1px solid #dee2e6",
                                                                            borderRadius: "0",
                                                                            minWidth: "40px",
                                                                            backgroundColor: "#f8f9fa",
                                                                            height: "40px",
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            justifyContent: "center",
                                                                            padding: "0.375rem"
                                                                        }}
                                                                    >
                                                                        <i className="fa-solid fa-xmark"></i>
                                                                    </Button>

                                                                    {/* Scan Button */}
                                                                    <Button
                                                                        variant="primary"
                                                                        onClick={handleScanButtonClick}
                                                                        disabled={loading}
                                                                        style={{
                                                                            backgroundColor: "#1e3a8a",
                                                                            border: "none",
                                                                            borderRadius: "0 6px 6px 0",
                                                                            fontWeight: "600",
                                                                            fontSize: "0.875rem",
                                                                            padding: "0.375rem 0.75rem",
                                                                            height: "40px",
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            justifyContent: "center",
                                                                            minWidth: "80px"
                                                                        }}
                                                                    >
                                                                        {loading ? (
                                                                            <Spinner animation="border" size="sm" className="me-1" />
                                                                        ) : (
                                                                            <i className="fa-solid fa-camera me-1"></i>
                                                                        )}
                                                                        Scan
                                                                    </Button>
                                                                </InputGroup>
                                                            </Form.Group>
                                                        </Col>

                                                        {/* Book Details Column - Shows book info right next to search input */}
                                                        <Col md={3}>
                                                            {book && (
                                                                <div className="h-100 d-flex align-items-center">
                                                                    <Card className="w-100" style={{
                                                                        border: "1px solid #e5e7eb",
                                                                        borderRadius: "6px",
                                                                        background: "#f8f9fa",
                                                                        marginTop: "24px"
                                                                    }}>
                                                                        <Card.Body className="p-2">
                                                                            <h6 className="mb-2 fw-bold" style={{
                                                                                color: "#1e3a8a",
                                                                                fontSize: "13px",
                                                                                whiteSpace: "nowrap",
                                                                                overflow: "hidden",
                                                                                textOverflow: "ellipsis"
                                                                            }}>
                                                                                <i className="fa-solid fa-book me-2"></i>
                                                                                Book Found
                                                                            </h6>
                                                                            <div className="small" style={{ fontSize: "12px" }}>
                                                                                <div className="text-truncate mb-1" title={book.title} style={{ marginBottom: "4px" }}>
                                                                                    <strong>Title:</strong> <span style={{ marginLeft: "124px" }}>{book.title}</span>
                                                                                </div>
                                                                                <div className="mb-1" style={{ marginBottom: "4px" }}>
                                                                                    <strong>ISBN:</strong> <span style={{ marginLeft: "124px" }}>{book.isbn}</span>
                                                                                </div>
                                                                                <div className="text-truncate">
                                                                                    <strong>Author:</strong> <span style={{ marginLeft: "124px" }}>{book.author || "N/A"}</span>
                                                                                </div>
                                                                            </div>
                                                                        </Card.Body>
                                                                    </Card>
                                                                </div>
                                                            )}

                                                            {libraryCard && !book && (
                                                                <div className="h-100 d-flex align-items-center">
                                                                    <Card className="w-100" style={{
                                                                        border: "1px solid #e5e7eb",
                                                                        borderRadius: "6px",
                                                                        background: "#f8f9fa",
                                                                        marginTop: "24px"
                                                                    }}>
                                                                        <Card.Body className="p-2">
                                                                            <h6 className="mb-2 fw-bold" style={{
                                                                                color: "#1e3a8a",
                                                                                fontSize: "13px",
                                                                                whiteSpace: "nowrap",
                                                                                overflow: "hidden",
                                                                                textOverflow: "ellipsis"
                                                                            }}>
                                                                                <i className="fa-solid fa-id-card me-2"></i>
                                                                                Card Found
                                                                            </h6>
                                                                            <div className="small" style={{ fontSize: "12px" }}>
                                                                                <div className="text-truncate mb-1" title={getUserDisplayName(libraryCard)} style={{ marginBottom: "4px" }}>
                                                                                    <strong>Holder:</strong> <span style={{ marginLeft: "8px" }}>{getUserDisplayName(libraryCard)}</span>
                                                                                </div>
                                                                                <div className="mb-1" style={{ marginBottom: "4px" }}>
                                                                                    <strong>Card No:</strong> <span style={{ marginLeft: "8px" }}>{libraryCard.card_number}</span>
                                                                                </div>
                                                                                <div>
                                                                                    <strong>Issues:</strong> <span style={{ marginLeft: "8px" }}>{cardIssues.length}</span>
                                                                                </div>
                                                                            </div>
                                                                        </Card.Body>
                                                                    </Card>
                                                                </div>
                                                            )}
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>

                                    {/* Table Section - Takes full width below the Book Identification card */}
                                    <Row className="mt-4">
                                        <Col xs={12}>
                                            <Card className="shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                                                <Card.Header style={{
                                                    background: "#f8fafc",
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
                                                                        background: "#1e3a8a",
                                                                        borderColor: "#1e3a8a",
                                                                        padding: "0.375rem 0.75rem"
                                                                    }}
                                                                >
                                                                    <i className="fa-solid fa-search" style={{ color: "White" }}></i>
                                                                </InputGroup.Text>

                                                                <Form.Control
                                                                    placeholder="Search by title, ISBN, name..."
                                                                    value={searchTerm}
                                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                                    style={{
                                                                        borderColor: "#1e3a8a",
                                                                        fontSize: "0.875rem",
                                                                        padding: "0.375rem 0.75rem"
                                                                    }}
                                                                />

                                                                {searchTerm && (
                                                                    <Button
                                                                        variant="outline-secondary"
                                                                        onClick={() => setSearchTerm("")}
                                                                        style={{
                                                                            border: "1px solid #1e3a8a",
                                                                            backgroundColor: "white",
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
                                            {/* Advanced Filter for Submitted Books */}
                                            <AdvancedFilter
                                                fields={submittedBooksFilterFields}
                                                onFilterChange={setSubmittedBooksFilters}
                                                onClear={() => setSubmittedBooksFilters({})}
                                            />

                                            <Card className="shadow-sm" style={{ border: "none" }}>
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
                <Modal.Header closeButton style={{ backgroundColor: "#1e3a8a", color: "white" }}>
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
                        style={{ backgroundColor: "#1e3a8a", border: "none" }}
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
                <Modal.Header closeButton style={{
                    padding: "15px 20px", backgroundColor: "var(--secondary-color)", color: "var(--primary-color)", fontWeight: "bold"
                }}>
                    <Modal.Title style={{ fontSize: "18px", fontWeight: "600" }}>
                        Submit Book Return
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: "20px" }}>
                    {selectedIssue && (
                        <div>
                            <Row>
                                <Col md={8}>
                                    {/* Left Column - Issue Information and Condition Assessment */}
                                    <Card className="mb-3" style={{ border: "1px solid #e5e7eb", boxShadow: "none" }}>
                                        <Card.Header className="py-2 px-3" style={{ backgroundColor: "var(--secondary-color)", }}>
                                            <h6 className="mb-0" style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                                                Issue Information
                                            </h6>
                                        </Card.Header>
                                        <Card.Body className="py-2 px-3">
                                            <Row className="g-2">
                                                <Col md={6}>
                                                    <div className="mb-1">
                                                        <div className="d-flex">
                                                            <div style={{ width: "100px", fontSize: "13px", color: "#6b7280" }}>Book Title:</div>
                                                            <div style={{ fontSize: "13px", fontWeight: "500", color: "#1f2937", flex: 1 }}>{selectedIssue.book_title || book?.title}</div>
                                                        </div>
                                                    </div>
                                                </Col>
                                                <Col md={6}>
                                                    <div className="mb-1">
                                                        <div className="d-flex">
                                                            <div style={{ width: "100px", fontSize: "13px", color: "#6b7280" }}>ISBN:</div>
                                                            <div style={{ fontSize: "13px", fontWeight: "500", color: "#1f2937", flex: 1 }}>{selectedIssue.book_isbn || book?.isbn}</div>
                                                        </div>
                                                    </div>
                                                </Col>
                                                <Col md={6}>
                                                    <div className="mb-1">
                                                        <div className="d-flex">
                                                            <div style={{ width: "100px", fontSize: "13px", color: "#6b7280" }}>Issued To:</div>
                                                            <div style={{ fontSize: "13px", fontWeight: "500", color: "#1f2937", flex: 1 }}>
                                                                {getUserDisplayName(selectedIssue)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Col>
                                                <Col md={6}>
                                                    <div className="mb-1">
                                                        <div className="d-flex">
                                                            <div style={{ width: "100px", fontSize: "13px", color: "#6b7280" }}>Card Number:</div>
                                                            <div style={{ fontSize: "13px", fontWeight: "500", color: "#1f2937", flex: 1 }}>{selectedIssue.card_number || selectedIssue.card_id || '-'}</div>
                                                        </div>
                                                    </div>
                                                </Col>
                                                <Col md={6}>
                                                    <div className="mb-1">
                                                        <div className="d-flex">
                                                            <div style={{ width: "100px", fontSize: "13px", color: "#6b7280" }}>Issue Date:</div>
                                                            <div style={{ fontSize: "13px", fontWeight: "500", color: "#1f2937", flex: 1 }}>{formatDate(selectedIssue.issue_date)}</div>
                                                        </div>
                                                    </div>
                                                </Col>
                                                <Col md={6}>
                                                    <div className="mb-1">
                                                        <div className="d-flex">
                                                            <div style={{ width: "100px", fontSize: "13px", color: "#6b7280" }}>Due Date:</div>
                                                            <div style={{ fontSize: "13px", fontWeight: "500", color: "#1f2937", flex: 1 }}>{formatDate(selectedIssue.due_date)}</div>
                                                        </div>
                                                        {penalty.daysOverdue > 0 && (
                                                            <div style={{ fontSize: "12px", color: "#dc2626", fontWeight: "600", marginTop: "2px", marginLeft: "100px" }}>
                                                                Overdue by {penalty.daysOverdue} day(s)
                                                            </div>
                                                        )}
                                                    </div>
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>

                                    <Card className="mb-3" style={{ border: "1px solid #e5e7eb", boxShadow: "none" }}>
                                        <Card.Header className="py-2 px-3" style={{ backgroundColor: "#f8f9fa", borderBottom: "1px solid #e5e7eb" }}>
                                            <h6 className="mb-0" style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                                                Condition Assessment
                                            </h6>
                                        </Card.Header>
                                        <Card.Body className="py-2 px-3">
                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-2">
                                                        <Form.Label style={{ fontSize: "13px", fontWeight: "600", color: "#4b5563", marginBottom: "4px" }}>
                                                            Condition Before
                                                        </Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={selectedIssue.condition_before || conditionBefore}
                                                            onChange={(e) => setConditionBefore(e.target.value)}
                                                            disabled={loading}
                                                            size="sm"
                                                            style={{ fontSize: "13px", padding: "6px 10px" }}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-2">
                                                        <Form.Label style={{ fontSize: "13px", fontWeight: "600", color: "#4b5563", marginBottom: "4px" }}>
                                                            Condition After
                                                        </Form.Label>
                                                        <Form.Select
                                                            value={conditionAfter}
                                                            onChange={handleConditionAfterChange}
                                                            disabled={loading}
                                                            size="sm"
                                                            style={{ fontSize: "13px", padding: "6px 10px" }}
                                                        >
                                                            <option value="Good">Good</option>
                                                            <option value="Fair">Fair</option>
                                                            <option value="Damaged">Damaged</option>
                                                            <option value="Lost">Lost</option>
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            {conditionAfter === "Lost" && (
                                                <Form.Group className="mb-2">
                                                    <Form.Label style={{ fontSize: "13px", fontWeight: "600", color: "#4b5563", marginBottom: "4px" }}>
                                                        Book Purchase Price
                                                    </Form.Label>
                                                    <div className="d-flex align-items-center">
                                                        <div style={{ flex: 1 }}>
                                                            <Form.Control
                                                                type="text"
                                                                placeholder="Enter book purchase price..."
                                                                value={lostBookPrice}
                                                                onChange={handleLostBookPriceChange}
                                                                disabled={loading || isLoadingPurchaseDetails}
                                                                size="sm"
                                                                style={{ fontSize: "13px", padding: "6px 10px" }}
                                                                isInvalid={!!lostBookPriceError}
                                                            />
                                                            <Form.Control.Feedback type="invalid" style={{ fontSize: "12px" }}>
                                                                {lostBookPriceError}
                                                            </Form.Control.Feedback>
                                                            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                                                                {isLoadingPurchaseDetails ? (
                                                                    <>
                                                                        <Spinner animation="border" size="sm" className="me-1" />
                                                                        Loading purchase details...
                                                                    </>
                                                                ) : bookPurchaseDetails ? (
                                                                    <>
                                                                        Auto-filled from purchase records: ₹
                                                                        {getBookPriceFromPurchaseDetails(bookPurchaseDetails).toFixed(2)}
                                                                        {bookPurchaseDetails.purchase_date && (
                                                                            <> (Purchased on: {formatDate(bookPurchaseDetails.purchase_date)})</>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        Enter the price at which this book was purchased
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Form.Group>
                                            )}

                                            <Form.Group className="mb-2">
                                                <Form.Label style={{ fontSize: "13px", fontWeight: "600", color: "#4b5563", marginBottom: "4px" }}>
                                                    Remarks
                                                </Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={2}
                                                    placeholder="Add notes about book condition..."
                                                    value={remarks}
                                                    onChange={(e) => setRemarks(e.target.value)}
                                                    disabled={loading}
                                                    size="sm"
                                                    style={{ fontSize: "13px", padding: "6px 10px" }}
                                                />
                                            </Form.Group>
                                        </Card.Body>
                                    </Card>
                                </Col>

                                <Col md={4}>
                                    {/* Right Column - Penalty Summary */}
                                    <Card style={{ border: "1px solid #e5e7eb", boxShadow: "none", height: "100%" }}>
                                        <Card.Header className="py-2 px-3" style={{ backgroundColor: "#f8f9fa", borderBottom: "1px solid #e5e7eb" }}>
                                            <h6 className="mb-0" style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                                                Penalty Summary
                                            </h6>
                                        </Card.Header>
                                        <Card.Body className="py-2 px-3">
                                            {isCalculating || isLoadingPurchaseDetails ? (
                                                <div className="text-center py-4">
                                                    <Spinner animation="border" variant="primary" size="sm" />
                                                    <p className="small text-muted mt-2">Calculating penalty...</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    {/* Penalty Breakdown */}
                                                    {penaltyBreakdown.length > 0 ? (
                                                        <div>
                                                            <div className="mb-2" style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: "8px" }}>

                                                                <div style={{ maxHeight: "180px", overflowY: "auto" }}>
                                                                    {penaltyBreakdown.map((item, index) => (
                                                                        <div key={index} style={{ marginBottom: "6px", paddingBottom: "6px", borderBottom: index < penaltyBreakdown.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                                                                            <div className="d-flex justify-content-between align-items-start">
                                                                                <div style={{ flex: 1 }}>
                                                                                    <div style={{ fontSize: "12px", fontWeight: "600", color: item.isInfo ? "#10b981" : "#374151" }}>
                                                                                        {item.type}
                                                                                    </div>
                                                                                    <div style={{ fontSize: "11px", color: "#6b7280" }}>{item.description}</div>
                                                                                </div>
                                                                                <div style={{ textAlign: "right", minWidth: "80px" }}>
                                                                                    <div style={{ fontSize: "11px", color: "#6b7280" }}>{item.calculation}</div>
                                                                                    <div style={{ fontSize: "13px", fontWeight: "600", color: item.isInfo ? "#10b981" : "#dc2626" }}>
                                                                                        ₹{item.amount?.toFixed(2)}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Total Penalty */}
                                                            <div className="text-center p-3 border rounded" style={{
                                                                background: penalty.penalty > 0
                                                                    ? "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)"
                                                                    : "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                                                                borderLeft: `3px solid ${penalty.penalty > 0 ? "#ef4444" : "#10b981"}`
                                                            }}>
                                                                <h4 style={{
                                                                    color: penalty.penalty > 0 ? "#dc2626" : "#059669",
                                                                    fontWeight: "bold",
                                                                    fontSize: "1.3rem"
                                                                }}>
                                                                    Total Penalty: ₹{penalty.penalty?.toFixed(2) || "0.00"}
                                                                </h4>
                                                                <p style={{
                                                                    fontSize: "12px",
                                                                    color: penalty.penalty > 0 ? "#dc2626" : "#059669",
                                                                    marginBottom: "0"
                                                                }}>
                                                                    {penalty.penalty > 0
                                                                        ? `This amount will be charged to ${getUserDisplayName(selectedIssue)}`
                                                                        : "No penalty applicable"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center p-4 border rounded" style={{
                                                            background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                                                            borderLeft: "3px solid #10b981"
                                                        }}>
                                                            <h4 style={{ color: "#059669", fontWeight: "bold", fontSize: "1.3rem" }}>
                                                                ₹{penalty.penalty?.toFixed(2) || "0.00"}
                                                            </h4>
                                                            <p style={{ fontSize: "12px", color: "#059669", marginBottom: "0" }}>
                                                                No penalty applicable
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer style={{ padding: "15px 20px" }}>
                    <Button variant="secondary" onClick={handleModalClose} disabled={loading} style={{ fontSize: "14px", padding: "8px 16px" }}>
                        Cancel
                    </Button>
                    <Button
                        variant="success"
                        onClick={handleFinalSubmit}
                        disabled={loading || isCalculating || isLoadingPurchaseDetails || (conditionAfter === "Lost" && (!lostBookPrice || !!lostBookPriceError))}
                        style={{
                            background: penalty.penalty > 0
                                ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                                : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            border: "none",
                            fontSize: "14px",
                            padding: "8px 20px",
                            fontWeight: "600"
                        }}
                    >
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                {penalty.penalty > 0 ? "Submit with Penalty" : "Confirm Submit"}
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Modal */}
            <Modal show={showEditModal} onHide={handleModalClose} centered>
                <Modal.Header closeButton style={{ backgroundColor: "var(--secondary-color)", color: "var(--primary-color)" }}>
                    <Modal.Title>
                        Edit Issue
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedIssue && (
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Issue Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={editFormData.issue_date}
                                    onChange={(e) => setEditFormData({ ...editFormData, issue_date: e.target.value })}
                                    disabled={loading}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Due Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={editFormData.due_date}
                                    onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
                                    disabled={loading}
                                    min={editFormData.issue_date}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Condition Before</Form.Label>
                                <Form.Select
                                    value={editFormData.condition_before}
                                    onChange={(e) => setEditFormData({ ...editFormData, condition_before: e.target.value })}
                                    disabled={loading}
                                >
                                    <option value="Good">Good</option>
                                    <option value="Fair">Fair</option>
                                    <option value="Damaged">Damaged</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Remarks</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={editFormData.remarks}
                                    onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })}
                                    disabled={loading}
                                    placeholder="Enter any remarks..."
                                />
                            </Form.Group>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleModalClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleEditSubmit} disabled={loading}>
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Updating...
                            </>
                        ) : (
                            'Update Issue'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Cancel Modal */}
            <Modal show={showCancelModal} onHide={handleModalClose} centered>
                <Modal.Header closeButton style={{ backgroundColor: "var(--primary-background-color)", color: "var(--primary-color)" }}>
                    <Modal.Title>
                        Cancel Issue
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedIssue && (
                        <div>
                            <p className="fw-bold">Are you sure you want to cancel this issue?</p>

                            <div className="mt-3">
                                <p><strong>Book:</strong> {selectedIssue.book_title}</p>
                                <p><strong>Issued To:</strong> {getUserDisplayName(selectedIssue)}</p>
                                <p><strong>Card Number:</strong> {selectedIssue.card_number}</p>
                                <p><strong>Issue Date:</strong> {formatDate(selectedIssue.issue_date)}</p>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleModalClose} disabled={loading}>
                        No
                    </Button>
                    <Button className="btn-primary-custom" onClick={handleCancelConfirm} disabled={loading}>
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Cancelling...
                            </>
                        ) : (
                            'Yes, Cancel'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default BookSubmit;