import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  InputGroup,
  Badge,
  Spinner,
  Alert,
  Tab,
  Nav,
  Dropdown,
} from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import DataApi from "../../api/dataApi";
import PubSub from "pubsub-js";
import helper from "../common/helper";
import * as constants from "../../constants/CONSTANT";
import ResizableTable from "../common/ResizableTable";
import { exportToExcel } from "../../utils/excelExport";
const BookIssue = () => {
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [libraryCards, setLibraryCards] = useState([]);
  const [users, setUsers] = useState([]);

  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedLibraryCard, setSelectedLibraryCard] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    book_id: "",
    card_id: "",
    issued_to: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: "",
    condition_before: "Good",
    remarks: "",
  });

  const [loading, setLoading] = useState(false);
  const [searchingBooks, setSearchingBooks] = useState(false);
  const [searchingCards, setSearchingCards] = useState(false);

  const [userDetails, setUserDetails] = useState(null);

  const [issuedBooks, setIssuedBooks] = useState([]);
  const [loadingIssuedBooks, setLoadingIssuedBooks] = useState(false);
  const [activeTab, setActiveTab] = useState("issue");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;

  const [durationDays, setDurationDays] = useState(7);
  const [maxBooksPerCard, setMaxBooksPerCard] = useState(1);
  const [showCardDetails, setShowCardDetails] = useState(true);

  const [bookSearchField, setBookSearchField] = useState("all");
  const [cardSearchField, setCardSearchField] = useState("all");
  const [bookSearchInput, setBookSearchInput] = useState("");
  const [cardSearchInput, setCardSearchInput] = useState("");

  const [bookSearchFields, setBookSearchFields] = useState({
    title: true,
    author: true,
    isbn: true,
    language: true,
    category: true,
    publisher: true,
  });

  const [cardSearchFields, setCardSearchFields] = useState({
    card_number: true,
    user_name: true,
    student_name: true,
    phone: true,
    email: true,
  });

  // User search field checkboxes
  const [userSearchFields, setUserSearchFields] = useState({
    firstname: true,
    lastname: true,
    email: true,
    phone: true,
  });

  // Refs for inputs
  const bookInputRef = useRef(null);
  const cardInputRef = useRef(null);
  const userInputRef = useRef(null);
  const bookSearchInputRef = useRef(null);
  const cardSearchInputRef = useRef(null);

  // Barcode detection
  const bookInputTimer = useRef(null);
  const cardInputTimer = useRef(null);
  const lastBookInputTime = useRef(0);
  const lastCardInputTime = useRef(0);

  useEffect(() => {
    fetchBooks();
    fetchLibraryCards();
    fetchUsers();
    fetchIssuedBooks();
    fetchLibrarySettings();

    // Auto-focus on book input when component mounts
    setTimeout(() => {
      const bookSelect = bookInputRef.current?.querySelector("input");
      if (bookSelect) {
        bookSelect.focus();
        bookSelect.click();
      }
    }, 300);

    // Listen for quick action trigger
    const token = PubSub.subscribe("OPEN_ADD_BOOK_ISSUE_MODAL", () => {
      resetForm();
      setActiveTab("issue");
      setTimeout(() => {
        const bookSelect = bookInputRef.current?.querySelector("input");
        if (bookSelect) {
          bookSelect.focus();
          bookSelect.click();
        }
      }, 100);
    });

    return () => {
      PubSub.unsubscribe(token);
      if (bookInputTimer.current) clearTimeout(bookInputTimer.current);
      if (cardInputTimer.current) clearTimeout(cardInputTimer.current);
    };
  }, []);

  // Fetch library settings
  const fetchLibrarySettings = async () => {
    try {
      const settingsApi = new DataApi("librarysettings");
      // Use /all endpoint to get key-value pairs
      const response = await settingsApi.get("/all");
      if (response.data && response.data.success && response.data.data) {
        // Response format: { success: true, data: { duration_days: "15", ... } }
        const duration = parseInt(response.data.data.duration_days) || 7;
        const maxBooks = parseInt(response.data.data.max_books_per_card) || 1;
        setDurationDays(duration);
        setMaxBooksPerCard(maxBooks);
      } else if (
        response.data &&
        typeof response.data === "object" &&
        !Array.isArray(response.data)
      ) {
        // Direct object response
        const duration = parseInt(response.data.duration_days) || 7;
        const maxBooks = parseInt(response.data.max_books_per_card) || 1;
        setDurationDays(duration);
        setMaxBooksPerCard(maxBooks);
      }
    } catch (error) {
      console.error("Error fetching library settings:", error);
      // Keep default 7 days on error
    }
  };

  // Calculate default due date based on library settings
  useEffect(() => {
    if (!formData.due_date && durationDays) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + durationDays);
      setFormData((prev) => ({
        ...prev,
        due_date: dueDate.toISOString().split("T")[0],
      }));
    }
  }, [durationDays]);

  // Update user details when library card or user is selected
  useEffect(() => {
    if (selectedLibraryCard && selectedLibraryCard.data) {
      setUserDetails(selectedLibraryCard.data);
      setFormData((prev) => ({
        ...prev,
        card_id: selectedLibraryCard.data.id,
        issued_to:
          selectedLibraryCard.data.user_id ||
          selectedLibraryCard.data.student_id ||
          "",
      }));
      setSelectedUser(null);
    } else if (selectedUser && selectedUser.data) {
      setUserDetails(selectedUser.data);
      setFormData((prev) => ({
        ...prev,
        issued_to: selectedUser.data.id,
        card_id: "",
      }));
      setSelectedLibraryCard(null);
    } else {
      setUserDetails(null);
    }
  }, [selectedLibraryCard, selectedUser]);

  // Update form when book is selected
  useEffect(() => {
    if (selectedBook && selectedBook.data) {
      setFormData((prev) => ({
        ...prev,
        book_id: selectedBook.data.id,
      }));
    }
  }, [selectedBook]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const bookApi = new DataApi("book");
      const response = await bookApi.fetchAll();

      // Handle different response structures
      let booksData = [];
      if (Array.isArray(response.data)) {
        // If response.data is directly an array
        booksData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        // If response.data.data is the array
        booksData = response.data.data;
      } else if (Array.isArray(response)) {
        // If response itself is the array
        booksData = response;
      }

      console.log("Total books fetched:", booksData.length);
      console.log("Sample book data:", booksData[0]);

      // Store ALL books (don't filter here - filter in search/display logic)
      setBooks(booksData);
    } catch (error) {
      console.error("Error fetching books:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to fetch books. Please refresh the page.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLibraryCards = async () => {
    try {
      const cardApi = new DataApi("librarycard");
      const response = await cardApi.fetchAll();
      if (response.data && Array.isArray(response.data)) {
        const activeCards = response.data.filter(
          (card) => card.is_active === true || card.is_active === "true"
        );
        setLibraryCards(activeCards);
      }
    } catch (error) {
      console.error("Error fetching library cards:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const userApi = new DataApi("user");
      const response = await userApi.fetchAll();
      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchIssuedBooks = async () => {
    try {
      setLoadingIssuedBooks(true);
      const issueApi = new DataApi("bookissue");
      const response = await issueApi.fetchAll();
      if (response.data && Array.isArray(response.data)) {
        // Filter only active/issued books (not returned)
        const activeIssues = response.data.filter(
          (issue) =>
            issue.status === "issued" ||
            issue.status === null ||
            issue.status === undefined ||
            issue.return_date === null
        );
        setIssuedBooks(activeIssues);
      }
    } catch (error) {
      console.error("Error fetching issued books:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to fetch issued books",
      });
    } finally {
      setLoadingIssuedBooks(false);
    }
  };

  // Handle book search
  const handleBookSearch = async () => {
    if (!bookSearchInput.trim()) return;

    const query = bookSearchInput.trim();
    const cleanInput = query.replace(/[-\s]/g, "");
    const isBarcode = /^\d{10,13}$/.test(cleanInput);

    // If barcode detected, search by ISBN
    if (isBarcode) {
      const results = await loadBookOptionsByField(cleanInput, "isbn");
      if (results && results.length > 0) {
        setSelectedBook(results[0]);
      }
    } else {
      const results = await loadBookOptionsByField(
        query.toLowerCase(),
        bookSearchField
      );
      if (results && results.length > 0) {
        // If only one result, auto-select it
        if (results.length === 1) {
          setSelectedBook(results[0]);
        }
      }
    }
  };

  // Load book options by specific field
  const loadBookOptionsByField = async (inputValue, fieldType = "all") => {
    if (!inputValue || inputValue.length < 1) {
      // Show ALL books (not just available ones) - user can see all data
      return books.slice(0, 50).map((book) => ({
        value: book.id,
        label: `${book.title}${book.isbn ? ` (ISBN: ${book.isbn})` : ""}${
          book.available_copies !== undefined
            ? ` - Available: ${book.available_copies || 0}`
            : ""
        }`,
        data: book,
      }));
    }

    const query = inputValue.toLowerCase().trim();
    const cleanInput = inputValue.replace(/[-\s]/g, "");
    const isBarcode = /^\d{10,13}$/.test(cleanInput);

    if (isBarcode || fieldType === "isbn") {
      // Try to find by ISBN directly
      const foundBook = books.find(
        (book) =>
          book.isbn &&
          book.isbn.replace(/[-\s]/g, "").toLowerCase() ===
            cleanInput.toLowerCase()
      );

      if (foundBook) {
        // Return ALL books, not just available ones
        return [
          {
            value: foundBook.id,
            label: `${foundBook.title} (ISBN: ${foundBook.isbn})${
              foundBook.available_copies !== undefined
                ? ` - Available: ${foundBook.available_copies || 0}`
                : ""
            }`,
            data: foundBook,
          },
        ];
      }

      // If not found locally, search via API
      try {
        setSearchingBooks(true);
        const bookResp = await helper.fetchWithAuth(
          `${constants.API_BASE_URL}/api/book/isbn/${encodeURIComponent(
            cleanInput
          )}`,
          "GET"
        );

        if (bookResp.ok) {
          const bookData = await bookResp.json();
          // Return ALL books, not just available ones
          if (!books.find((b) => b.id === bookData.id)) {
            setBooks((prev) => [...prev, bookData]);
          }
          return [
            {
              value: bookData.id,
              label: `${bookData.title} (ISBN: ${bookData.isbn})${
                bookData.available_copies !== undefined
                  ? ` - Available: ${bookData.available_copies || 0}`
                  : ""
              }`,
              data: bookData,
            },
          ];
        }
      } catch (error) {
        console.error("Error searching book by ISBN:", error);
      } finally {
        setSearchingBooks(false);
      }
    }

    // Regular text search - search only in selected fields based on checkboxes
    // Show ALL books, not just available ones
    const filtered = books.filter((book) => {
      // Remove the available_copies filter to show all books

      // Get all searchable fields
      const title = (book.title || "").toLowerCase();
      const isbn = (book.isbn || "").replace(/[-\s]/g, "").toLowerCase();
      const author = (book.author_name || "").toLowerCase();
      const category = (book.category_name || "").toLowerCase();
      const publisher = (book.publisher || "").toLowerCase();
      const language = (book.language || "").toLowerCase();
      const edition = (book.edition || "").toString().toLowerCase();
      const description = (book.description || "").toLowerCase();

      const searchTerm = query.replace(/[-\s]/g, "");
      const queryNumbers = query.replace(/\D/g, "");

      // Check if at least one field is selected
      const hasSelectedFields = Object.values(bookSearchFields).some(
        (val) => val === true
      );

      // If no fields selected, search all fields (fallback)
      if (!hasSelectedFields) {
        return (
          title.includes(query) ||
          isbn.includes(searchTerm) ||
          author.includes(query) ||
          category.includes(query) ||
          publisher.includes(query) ||
          language.includes(query) ||
          edition.includes(query) ||
          description.includes(query) ||
          (queryNumbers.length > 0 &&
            (isbn.includes(queryNumbers) ||
              (book.id && book.id.toString().includes(queryNumbers))))
        );
      }

      // Search only in selected fields
      let matches = false;
      if (bookSearchFields.title && title.includes(query)) matches = true;
      if (
        bookSearchFields.isbn &&
        (isbn.includes(searchTerm) ||
          (queryNumbers.length > 0 && isbn.includes(queryNumbers)))
      )
        matches = true;
      if (bookSearchFields.author && author.includes(query)) matches = true;
      if (bookSearchFields.category && category.includes(query)) matches = true;
      if (bookSearchFields.publisher && publisher.includes(query))
        matches = true;
      if (bookSearchFields.language && language.includes(query)) matches = true;

      // Also check ISBN for numeric queries if ISBN is selected
      if (
        bookSearchFields.isbn &&
        queryNumbers.length > 0 &&
        isbn.includes(queryNumbers)
      )
        matches = true;

      return matches;
    });

    return filtered.slice(0, 50).map((book) => ({
      value: book.id,
      label: `${book.title}${book.isbn ? ` (ISBN: ${book.isbn})` : ""}${
        book.available_copies ? ` - Available: ${book.available_copies}` : ""
      }`,
      data: book,
    }));
  };

  // Load book options with search - always search all fields in dropdown
  const loadBookOptions = async (inputValue) => {
    // When typing in dropdown, always search all fields for better UX
    return loadBookOptionsByField(inputValue, "all");
  };

  // Handle card search
  const handleCardSearch = async () => {
    if (!cardSearchInput.trim()) return;

    const query = cardSearchInput.trim();
    const results = await loadCardOptionsByField(query, cardSearchField);
    if (results && results.length > 0) {
      // If only one result, auto-select it
      if (results.length === 1) {
        setSelectedLibraryCard(results[0]);
      }
    }
  };

  // Load card options by specific field
  const loadCardOptionsByField = async (inputValue, fieldType = "all") => {
    if (!inputValue || inputValue.length < 1) {
      return libraryCards.slice(0, 50).map((card) => ({
        value: card.id,
        label: `${card.card_number || "N/A"} - ${
          card.user_name || card.student_name || "Unknown"
        }`,
        data: card,
      }));
    }

    const query = inputValue.trim();
    const queryLower = query.toLowerCase();
    const queryNumbers = query.replace(/\D/g, "");

    // Check if it's a barcode scan (card number format)
    const isBarcode =
      query.length >= 3 &&
      (query.match(/^[A-Z]{2,}/i) || /^\d{6,}$/.test(query));

    if (isBarcode || fieldType === "card_number") {
      // Try to find by card number directly
      const foundCard = libraryCards.find(
        (card) =>
          card.card_number &&
          card.card_number.toUpperCase() === query.toUpperCase()
      );

      if (foundCard) {
        setSelectedLibraryCard({
          value: foundCard.id,
          label: `${foundCard.card_number} - ${
            foundCard.user_name || foundCard.student_name || "Unknown"
          }`,
          data: foundCard,
        });
        return [
          {
            value: foundCard.id,
            label: `${foundCard.card_number} - ${
              foundCard.user_name || foundCard.student_name || "Unknown"
            }`,
            data: foundCard,
          },
        ];
      }

      // If not found locally, search via API
      try {
        setSearchingCards(true);
        const cardResp = await helper.fetchWithAuth(
          `${constants.API_BASE_URL}/api/librarycard/card/${encodeURIComponent(
            query.toUpperCase()
          )}`,
          "GET"
        );

        if (cardResp.ok) {
          const cardData = await cardResp.json();
          if (!libraryCards.find((c) => c.id === cardData.id)) {
            setLibraryCards((prev) => [...prev, cardData]);
          }
          setSelectedLibraryCard({
            value: cardData.id,
            label: `${cardData.card_number} - ${
              cardData.user_name || cardData.student_name || "Unknown"
            }`,
            data: cardData,
          });
          return [
            {
              value: cardData.id,
              label: `${cardData.card_number} - ${
                cardData.user_name || cardData.student_name || "Unknown"
              }`,
              data: cardData,
            },
          ];
        }
      } catch (error) {
        console.error("Error searching card:", error);
      } finally {
        setSearchingCards(false);
      }
    }

    // Regular text search based on selected checkboxes
    const filtered = libraryCards.filter((card) => {
      const userName = (card.user_name || "").toLowerCase();
      const studentName = (card.student_name || "").toLowerCase();
      const cardNumber = (card.card_number || "").toLowerCase();
      const phone = (card.phone || card.whatsapp_number || "").replace(
        /\D/g,
        ""
      );
      const email = (card.user_email || card.email || "").toLowerCase();

      // Check if at least one field is selected
      const hasSelectedFields = Object.values(cardSearchFields).some(
        (val) => val === true
      );

      // If no fields selected, search all fields (fallback)
      if (!hasSelectedFields) {
        return (
          userName.includes(queryLower) ||
          studentName.includes(queryLower) ||
          cardNumber.includes(queryLower) ||
          phone.includes(queryNumbers) ||
          email.includes(queryLower)
        );
      }

      // Search only in selected fields
      let matches = false;
      if (cardSearchFields.card_number && cardNumber.includes(queryLower))
        matches = true;
      if (cardSearchFields.user_name && userName.includes(queryLower))
        matches = true;
      if (cardSearchFields.student_name && studentName.includes(queryLower))
        matches = true;
      if (cardSearchFields.phone && phone.includes(queryNumbers))
        matches = true;
      if (cardSearchFields.email && email.includes(queryLower)) matches = true;

      return matches;
    });

    return filtered.slice(0, 50).map((card) => ({
      value: card.id,
      label: `${card.card_number || "N/A"} - ${
        card.user_name || card.student_name || "Unknown"
      }`,
      data: card,
    }));
  };

  // Load library card options with search
  const loadCardOptions = async (inputValue) => {
    return loadCardOptionsByField(inputValue, cardSearchField);
  };

  // Load user options with search
  const loadUserOptions = async (inputValue) => {
    if (!inputValue || inputValue.length < 1) {
      return users.slice(0, 50).map((user) => ({
        value: user.id,
        label:
          `${user.firstname || ""} ${user.lastname || ""}`.trim() ||
          user.email ||
          "Unknown",
        data: user,
      }));
    }

    const query = inputValue.trim().toLowerCase();
    const queryNumbers = query.replace(/\D/g, "");

    const filtered = users.filter((user) => {
      const firstName = (user.firstname || "").toLowerCase();
      const lastName = (user.lastname || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      const phone = (user.phone || user.whatsapp_number || "").replace(
        /\D/g,
        ""
      );

      // Check if at least one field is selected
      const hasSelectedFields = Object.values(userSearchFields).some(
        (val) => val === true
      );

      // If no fields selected, search all fields (fallback)
      if (!hasSelectedFields) {
        return (
          firstName.includes(query) ||
          lastName.includes(query) ||
          `${firstName} ${lastName}`.includes(query) ||
          email.includes(query) ||
          phone.includes(queryNumbers)
        );
      }

      // Search only in selected fields
      let matches = false;
      if (userSearchFields.firstname && firstName.includes(query))
        matches = true;
      if (userSearchFields.lastname && lastName.includes(query)) matches = true;
      if (
        userSearchFields.firstname &&
        userSearchFields.lastname &&
        `${firstName} ${lastName}`.includes(query)
      )
        matches = true;
      if (userSearchFields.email && email.includes(query)) matches = true;
      if (userSearchFields.phone && phone.includes(queryNumbers))
        matches = true;

      return matches;
    });

    return filtered.slice(0, 50).map((user) => ({
      value: user.id,
      label:
        `${user.firstname || ""} ${user.lastname || ""}`.trim() ||
        user.email ||
        "Unknown",
      data: user,
    }));
  };

  // Handle book selection change
  const handleBookChange = (selectedOption) => {
    setSelectedBook(selectedOption);
    if (selectedOption) {
      // Auto-focus on card input after book selection
      setTimeout(() => {
        const cardSelect = cardInputRef.current?.querySelector("input");
        if (cardSelect) {
          cardSelect.focus();
          cardSelect.click();
        }
      }, 200);
    }
  };

  // Handle library card selection change
  const handleCardChange = (selectedOption) => {
    setSelectedLibraryCard(selectedOption);
    if (selectedOption) {
      // Auto-focus on due date after card selection
      setTimeout(() => {
        document.getElementById("due_date")?.focus();
      }, 200);
    }
  };

  // Handle user selection change
  const handleUserChange = (selectedOption) => {
    setSelectedUser(selectedOption);
    if (selectedOption) {
      // Auto-focus on due date after user selection
      setTimeout(() => {
        document.getElementById("due_date")?.focus();
      }, 200);
    }
  };

  // Handle form submission
  const handleIssueBook = async () => {
    // Validation
    if (!formData.book_id) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Validation Error",
        message: "Please select a book",
      });
      return;
    }

    if (!formData.card_id && !formData.issued_to) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Validation Error",
        message: "Please select a library card or user",
      });
      return;
    }

    if (!formData.due_date) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Validation Error",
        message: "Please select a due date",
      });
      return;
    }

    try {
      setLoading(true);

      const issueData = {
        book_id: formData.book_id,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        condition_before: formData.condition_before,
        remarks: formData.remarks || "",
      };

      // Add either card_id or issued_to
      if (formData.card_id) {
        issueData.card_id = formData.card_id;
      } else if (formData.issued_to) {
        issueData.issued_to = formData.issued_to;
      }

      const response = await helper.fetchWithAuth(
        `${constants.API_BASE_URL}/api/bookissue/issue`,
        "POST",
        JSON.stringify(issueData)
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          PubSub.publish("RECORD_SAVED_TOAST", {
            title: "Success",
            message: `Book "${
              selectedBook?.data?.title || "Book"
            }" issued successfully to ${
              userDetails?.user_name || userDetails?.firstname || "User"
            }`,
          });
          resetForm();
          // Refresh books to update available copies
          fetchBooks();
          // Refresh issued books list
          fetchIssuedBooks();
        } else {
          PubSub.publish("RECORD_ERROR_TOAST", {
            title: "Error",
            message: result.errors || "Failed to issue book",
          });
        }
      } else {
        const error = await response.json().catch(() => ({}));
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Error",
          message: error.errors || "Failed to issue book",
        });
      }
    } catch (error) {
      console.error("Error issuing book:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: error.message || "Failed to issue book",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedBook(null);
    setSelectedLibraryCard(null);
    setSelectedUser(null);
    setUserDetails(null);
    setBookSearchInput("");
    setCardSearchInput("");
    setFormData({
      book_id: "",
      card_id: "",
      issued_to: "",
      issue_date: new Date().toISOString().split("T")[0],
      due_date: (() => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + durationDays);
        return dueDate.toISOString().split("T")[0];
      })(),
      condition_before: "Good",
      remarks: "",
    });
    // Auto-focus on book search input after reset
    setTimeout(() => {
      if (bookSearchInputRef.current) {
        bookSearchInputRef.current.focus();
      }
    }, 200);
  };

  // Custom styles for react-select
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      border: "2px solid #8b5cf6",
      borderRadius: "8px",
      padding: "4px 8px",
      fontSize: "14px",
      boxShadow: state.isFocused
        ? "0 0 0 0.2rem rgba(139, 92, 246, 0.25)"
        : "none",
      minHeight: "44px",
      "&:hover": {
        borderColor: "#7c3aed",
      },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#8b5cf6"
        : state.isFocused
        ? "#f3e8ff"
        : "white",
      color: state.isSelected ? "white" : "#374151",
      padding: "10px 12px",
      fontSize: "14px",
      cursor: "pointer",
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "8px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      zIndex: 9999,
    }),
    placeholder: (base) => ({
      ...base,
      color: "#9ca3af",
      fontSize: "14px",
    }),
    singleValue: (base) => ({
      ...base,
      color: "#374151",
      fontSize: "14px",
    }),
    input: (base) => ({
      ...base,
      color: "#374151",
      fontSize: "14px",
    }),
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      return dateString;
    }
  };

  // Filter issued books based on search term
  const filteredIssuedBooks = issuedBooks.filter((issue) => {
    if (!searchTerm) return true;
    const query = searchTerm.toLowerCase();
    const bookTitle = (issue.book_title || "").toLowerCase();
    const isbn = (issue.book_isbn || "").toLowerCase();
    const userName = (
      issue.issued_to_name ||
      issue.student_name ||
      issue.issued_to ||
      ""
    ).toLowerCase();
    const cardNumber = (issue.card_number || "").toLowerCase();

    return (
      bookTitle.includes(query) ||
      isbn.includes(query) ||
      userName.includes(query) ||
      cardNumber.includes(query)
    );
  });

  // Calculate days remaining
  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    try {
      const due = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      const diffTime = due - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return null;
    }
  };

  // Compute issued books for currently selected card
  const issuedListForSelected = selectedLibraryCard
    ? issuedBooks.filter((issue) => {
        try {
          const issueCardId = issue.card_id || issue.cardId || issue.library_card_id;
          return (
            issueCardId &&
            selectedLibraryCard.data &&
            issueCardId.toString() === selectedLibraryCard.data.id.toString() &&
            (issue.status !== "returned" && issue.return_date == null)
          );
        } catch (e) {
          return false;
        }
      })
    : [];

  const computedIssuedCount = selectedLibraryCard
    ? parseInt(selectedLibraryCard.data.issued_count) || issuedListForSelected.length
    : 0;

  // Handle export to Excel
  const handleExport = async () => {
    try {
      const exportData = filteredIssuedBooks.map((issue) => {
        const daysRemaining = getDaysRemaining(issue.due_date);
        let statusText = "";
        if (daysRemaining !== null && daysRemaining < 0) {
          statusText = `Overdue by ${Math.abs(daysRemaining)} day${
            Math.abs(daysRemaining) !== 1 ? "s" : ""
          }`;
        } else if (
          daysRemaining !== null &&
          daysRemaining >= 0 &&
          daysRemaining <= 3
        ) {
          statusText =
            daysRemaining === 0
              ? "Due Today"
              : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left`;
        } else if (daysRemaining !== null) {
          statusText = `${daysRemaining} day${
            daysRemaining !== 1 ? "s" : ""
          } left`;
        }

        return {
          "Book Title": issue.book_title || "N/A",
          ISBN: issue.book_isbn || "-",
          "Issued To":
            issue.issued_to_name ||
            issue.student_name ||
            issue.issued_to ||
            "N/A",
          "Card Number": issue.card_number || "-",
          "Issue Date": formatDate(issue.issue_date),
          "Submission Date": formatDate(issue.due_date),
          "Days Remaining": statusText || "-",
          Status: issue.status === "returned" ? "Returned" : "Issued",
        };
      });

      const columns = [
        { key: "Book Title", header: "Book Title", width: 40 },
        { key: "ISBN", header: "ISBN", width: 20 },
        { key: "Issued To", header: "Issued To", width: 30 },
        { key: "Card Number", header: "Card Number", width: 20 },
        { key: "Issue Date", header: "Issue Date", width: 15 },
        { key: "Submission Date", header: "Submission Date", width: 15 },
        { key: "Days Remaining", header: "Days Remaining", width: 20 },
        { key: "Status", header: "Status", width: 15 },
      ];

      const filename = searchTerm
        ? `issued_books_filtered_${new Date().toISOString().split("T")[0]}`
        : `issued_books_${new Date().toISOString().split("T")[0]}`;

      await exportToExcel(exportData, filename, "Issued Books", columns);

      PubSub.publish("RECORD_SAVED_TOAST", {
        title: "Export Success",
        message: `Exported ${exportData.length} issued book(s) to Excel`,
      });
    } catch (error) {
      console.error("Error exporting issued books:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Export Error",
        message: "Failed to export issued books",
      });
    }
  };

  const issueColumns = [
    {
      field: "book_title",
      label: "Book Title",
      width: 250,
      render: (value, record) => (
        <a
          href={`/books/${record.book_id}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/books/${record.book_id}`);
          }}
          style={{
            color: "#6f42c1",
            textDecoration: "none",
            fontWeight: "600",
          }}
          onMouseEnter={(e) => {
            try {
              const bookPrefetch = {
                id: record.book_id,
                title: record.book_title,
                isbn: record.book_isbn,
                author_name: record.author_name,
              };
              localStorage.setItem(
                `prefetch:book:${record.book_id}`,
                JSON.stringify(bookPrefetch)
              );
            } catch (err) {}
            e.target.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
        >
          <strong>{value || "N/A"}</strong>
        </a>
      ),
    },
    {
      field: "book_isbn",
      label: "ISBN",
      width: 150,
      render: (value) => (
        <code
          style={{
            background: "#f8f9fa",
            padding: "4px 8px",
            borderRadius: "4px",
          }}
        >
          {value || "-"}
        </code>
      ),
    },
    {
      field: "issued_to_name",
      label: "Issued To",
      width: 200,
      render: (value, record) => {
        const userId = record.user_id || record.student_id || record.issued_to;
        const displayName =
          record.issued_to_name ||
          record.student_name ||
          record.issued_to ||
          "N/A";
        if (userId) {
          return (
            <a
              href={`/user/${userId}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  localStorage.setItem(
                    `prefetch:user:${userId}`,
                    JSON.stringify(record)
                  );
                } catch (err) {}
                navigate(`/user/${userId}`, { state: record });
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  localStorage.setItem(
                    `prefetch:user:${userId}`,
                    JSON.stringify(record)
                  );
                } catch (err) {}
                window.open(`/user/${userId}`, "_blank");
              }}
              style={{
                color: "#6f42c1",
                textDecoration: "none",
                fontWeight: 500,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.target.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.target.style.textDecoration = "none";
              }}
              title="Click to view user details (Right-click to open in new tab)"
            >
              {displayName}
            </a>
          );
        }
        return displayName;
      },
    },
    {
      field: "card_number",
      label: "Card Number",
      width: 150,
      render: (value) => value || "-",
    },
    {
      field: "issue_date",
      label: "Issue Date",
      width: 120,
      render: (value) => formatDate(value),
    },
    {
      field: "due_date",
      label: "Submission Date",
      width: 180,
      render: (value, record) => {
        const daysRemaining = getDaysRemaining(value);
        const isOverdue = daysRemaining !== null && daysRemaining < 0;
        const isDueSoon =
          daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3;

        return (
          <div>
            <div>{formatDate(value)}</div>
            {daysRemaining !== null && (
              <div className="small mt-1">
                {isOverdue ? (
                  <Badge bg="danger">
                    Overdue by {Math.abs(daysRemaining)} day
                    {Math.abs(daysRemaining) !== 1 ? "s" : ""}
                  </Badge>
                ) : isDueSoon ? (
                  <Badge bg="warning" text="dark">
                    {daysRemaining === 0
                      ? "Due Today"
                      : `${daysRemaining} day${
                          daysRemaining !== 1 ? "s" : ""
                        } left`}
                  </Badge>
                ) : (
                  <Badge bg="success">
                    {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left
                  </Badge>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      field: "status",
      label: "Status",
      width: 120,
      render: (value) => (
        <Badge bg={value === "returned" ? "secondary" : "primary"}>
          {value === "returned" ? "Returned" : "Issued"}
        </Badge>
      ),
    },
  ];

  return (
    <Container
      fluid
      className="mt-4"
      style={{ marginTop: "90px", padding: "0 1.5rem" }}
    >
      {/* Header Card */}

      {/* Tabs */}
      <Tab.Container
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || "issue")}
      >
        <Nav
          variant="tabs"
          style={{ borderBottom: "2px solid #e5e7eb", position: "relative" }}
        >
          <Nav.Item>
            <Nav.Link
              eventKey="issue"
              style={{
                color: activeTab === "submit" ? "#000000" : "#6b7280",
                fontWeight: activeTab === "submit" ? "600" : "400",
                borderBottom:
                  activeTab === "submit" ? "3px solid #6b7280" : "none",
              }}
            >
              <i
                className="fa-solid fa-book-return me-2"
                style={{
                  color: activeTab === "submit" ? "#000000" : "#6b7280",
                  fontSize: "15px",
                }}
              ></i>
              <span
                style={{
                  color: activeTab === "submit" ? "#000000" : "#6b7280",
                  fontSize: "15px",
                }}
              >
                Issue New Book
              </span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              eventKey="list"
              style={{
                color: activeTab === "submitted" ? "#000000" : "#6b7280",
                fontWeight: activeTab === "submitted" ? "600" : "400",
                borderBottom:
                  activeTab === "submitted" ? "3px solid #6b7280" : "none",
              }}
            >
              <span
                style={{
                  color: activeTab === "submitted" ? "#000000" : "#6b7280",
                  fontSize: "15px",
                }}
              >
                View Issued Books ({issuedBooks.length})
              </span>
            </Nav.Link>
          </Nav.Item>

          {/* Right aligned search bar */}
          {activeTab === "list" && (
            <div
              style={{
                position: "absolute",
                right: "0",
                top: "50%",
                transform: "translateY(-50%)",
                paddingRight: "15px",
              }}
            >
              <InputGroup style={{ maxWidth: "250px" }}>
                <InputGroup style={{ width: "250px", maxWidth: "100%" }}>
                  <InputGroup.Text
                    style={{
                      background: "#f3e9fc",
                      borderColor: "#e9ecef",
                      padding: "0.375rem 0.75rem",
                    }}
                  >
                    <i
                      className="fa-solid fa-search"
                      style={{ color: "#6f42c1", fontSize: "0.875rem" }}
                    ></i>
                  </InputGroup.Text>

                  <Form.Control
                    placeholder="Search books..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      borderColor: "#e9ecef",
                      fontSize: "0.875rem",
                      padding: "0.375rem 0.75rem",
                    }}
                  />
                </InputGroup>

                {searchTerm && (
                  <Button
                    variant="outline-secondary"
                    onClick={() => setSearchTerm("")}
                    style={{
                      border: "1px solid #d1d5db",
                      borderRadius: "0 6px 6px 0",
                      marginLeft: "-1px",
                      height: "38px",
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
          <Tab.Pane eventKey="issue">
            <Row>
              <Col>
                <Col lg={12}>
                  {/* <Card className="shadow-sm" style={{ position: "sticky", top: "100px", background: "#ffffff", border: "1px solid #e5e7eb" }}> */}
                  <Row>
                    {/* Left Side - Form Section */}
                    <Col lg={12}>
                      <Card className="shadow-sm h-100">
                        <Card.Header
                          style={{
                            background:
                              "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                            border: "none",
                            borderBottom: "2px solid #d1d5db",
                            padding: "20px 24px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <h5
                            className="mb-0 fw-bold"
                            style={{
                              color: "#1f2937",
                              fontSize: "20px",
                              letterSpacing: "0.3px",
                            }}
                          >
                            <i
                              className="fa-solid fa-book-open me-3"
                              style={{ color: "#6b7280" }}
                            ></i>
                            Issue New Book
                          </h5>
                          <NavLink to="/bulkissued" style={{ textDecoration: "none" }}>
                            <Button style={{ backgroundColor: "blue", color: "#fff" }}>
                              <i className="fa-solid fa-plus me-2"></i>
                              Bulk Issue
                            </Button>
                          </NavLink>

                        </Card.Header>
                        <Card.Body className="p-4">
                          {/* Top Row - 2 Fields */}
                          <Row className="g-3 mb-4">
                            {/* Book Selection */}
                            <Col lg={6}>
                              <Form.Group>
                                <Form.Label
                                  className="fw-bold mb-2"
                                  style={{ color: "#374151", fontSize: "14px" }}
                                >
                                  {/* <i className="fa-solid fa-book me-2" style={{ color: "#6b7280" }}></i> */}
                                  Select Book *
                                </Form.Label>
                                <div ref={bookInputRef}>
                                  <AsyncSelect
                                    cacheOptions
                                    defaultOptions
                                    loadOptions={loadBookOptions}
                                    value={selectedBook}
                                    onChange={handleBookChange}
                                    styles={customSelectStyles}
                                    placeholder="Search by book name, author, ISBN..."
                                    isSearchable
                                    isLoading={searchingBooks}
                                    noOptionsMessage={({ inputValue }) =>
                                      inputValue
                                        ? "No books found. Try different search terms."
                                        : "Start typing to search books..."
                                    }
                                  />
                                </div>
                                <Form.Text className="text-muted mt-1 d-block small">
                                  {/* <i className="fa-solid fa-info-circle me-1"></i> */}
                                  Search by title, author, ISBN, language, or
                                  scan barcode
                                </Form.Text>
                              </Form.Group>
                            </Col>

                            {/* Library Card Selection */}
                            <Col lg={6}>
                              <Form.Group>
                                <Form.Label
                                  className="fw-bold mb-2"
                                  style={{ color: "#374151", fontSize: "14px" }}
                                >
                                  {/* <i className="fa-solid fa-id-card me-2" style={{ color: "#6b7280" }}></i> */}
                                  Select Library Card *
                                </Form.Label>
                                <div ref={cardInputRef}>
                                  <AsyncSelect
                                    cacheOptions
                                    defaultOptions
                                    loadOptions={loadCardOptions}
                                    value={selectedLibraryCard}
                                    onChange={handleCardChange}
                                    styles={customSelectStyles}
                                    placeholder="Search by card number, name, phone..."
                                    isSearchable
                                    isLoading={searchingCards}
                                    noOptionsMessage={({ inputValue }) =>
                                      inputValue
                                        ? "No cards found. Try different search terms."
                                        : "Start typing to search cards..."
                                    }
                                  />
                                </div>
                                <Form.Text className="text-muted mt-1 d-block small">
                                  {/* <i className="fa-solid fa-info-circle me-1"></i> */}
                                  Search by card number, user name, phone,
                                  email, or scan barcode
                                </Form.Text>
                              </Form.Group>
                            </Col>
                          </Row>
                          {/* {issued Quantity Details } */}
                          <Row className="mb-4">
                            {/* give me issued quantity input box */}
                            <Col> 
                              {selectedLibraryCard && (() => {
                                const allowed = parseInt(maxBooksPerCard) || 1;
                                const issued = computedIssuedCount || 0;
                                const remaining = Math.max(0, allowed - issued);

                                return (
                                  <div
                                    style={{
                                      background: "#e6f0ff",
                                      border: "1px solid #cfe0ff",
                                      borderRadius: "8px",
                                      padding: "12px 16px",
                                      fontSize: "14px",
                                      color: "#0f172a",
                                    }}
                                  >
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                      <div style={{ fontWeight: 900 }}>
                                        Card: {selectedLibraryCard.data.card_number || selectedLibraryCard.label}
                                      </div>
                                      <div>
                                        <Button
                                          variant="link"
                                          size="sm"
                                          onClick={() => setShowCardDetails(!showCardDetails)}
                                          style={{ textDecoration: 'none' }}
                                        >
                                          {showCardDetails ? 'Minimize' : 'Expand'}
                                        </Button>
                                      </div>
                                    </div>

                                    {!showCardDetails ? (
                                      <div>
                                        <strong style={{ color: '#0b5ed7' }}>Issued:</strong> {issued} &nbsp;•&nbsp;
                                        <strong style={{ color: '#0b5ed7' }}>Allowed:</strong> {allowed} &nbsp;•&nbsp;
                                        <strong style={{ color: '#0b5ed7' }}>Remaining:</strong> {remaining}
                                      </div>
                                    ) : (
                                      <div>
                                        <div className="mb-2">
                                          <div><strong style={{ color: '#0b5ed7' }}>Issued:</strong> {issued}</div>
                                          <div><strong style={{ color: '#0b5ed7' }}>Allowed:</strong> {allowed}</div>
                                          <div><strong style={{ color: '#0b5ed7' }}>Remaining:</strong> {remaining}</div>
                                        </div>

                                        <div>
                                          <strong className="d-block mb-2">Books currently issued on this card:</strong>
                                          {issuedListForSelected && issuedListForSelected.length > 0 ? (
                                            <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                              {issuedListForSelected.map((iss) => (
                                                <li key={iss.id || iss.book_id || Math.random()} style={{ marginBottom: '6px' }}>
                                                  <div style={{ fontSize: '14px' }}>
                                                    {iss.book_title || iss.title || 'Unknown Book'}
                                                    {iss.due_date && (
                                                      <small className="text-muted"> &nbsp;— due {new Date(iss.due_date).toLocaleDateString()}</small>
                                                    )}
                                                  </div>
                                                </li>
                                              ))}
                                            </ul>
                                          ) : (
                                            <div className="text-muted">No active issued books on this card.</div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </Col>
                          </Row>  
                           
                          {/* Bottom Row - 2 Fields */}
                          <Row className="g-3">
                            {/* Issue Date */}
                            <Col lg={6}>
                              <Form.Group>
                                <Form.Label
                                  className="fw-bold mb-2"
                                  style={{ color: "#374151", fontSize: "14px" }}
                                >
                                  {/* <i className="fa-solid fa-calendar me-2" style={{ color: "#6b7280" }}></i> */}
                                  Issue Date
                                </Form.Label>
                                <Form.Control
                                  type="date"
                                  value={formData.issue_date}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      issue_date: e.target.value,
                                    })
                                  }
                                  style={{
                                    border: "2px solid #e5e7eb",
                                    borderRadius: "8px",
                                    padding: "10px",
                                    fontSize: "14px",
                                  }}
                                />
                              </Form.Group>
                            </Col>

                            {/* Submission Date */}
                            <Col lg={6}>
                              <Form.Group>
                                <Form.Label
                                  className="fw-bold mb-2"
                                  style={{ color: "#374151", fontSize: "14px" }}
                                >
                                  {/* <i className="fa-solid fa-calendar-check me-2" style={{ color: "#6b7280" }}></i> */}
                                  Submission Date{" "}
                                  <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  id="due_date"
                                  type="date"
                                  value={formData.due_date}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      due_date: e.target.value,
                                    })
                                  }
                                  min={formData.issue_date}
                                  required
                                  style={{
                                    border: "2px solid #e5e7eb",
                                    borderRadius: "8px",
                                    padding: "10px",
                                    fontSize: "14px",
                                  }}
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          {/* Additional Fields Row */}
                          <Row className="g-3 mt-3">
                            {/* Book Condition */}
                            <Col lg={6}>
                              <Form.Group>
                                <Form.Label
                                  className="fw-bold mb-2"
                                  style={{ color: "#374151", fontSize: "14px" }}
                                >
                                  {/* <i className="fa-solid fa-clipboard-check me-2" style={{ color: "#6b7280" }}></i> */}
                                  Book Condition
                                </Form.Label>
                                <Form.Select
                                  value={formData.condition_before}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      condition_before: e.target.value,
                                    })
                                  }
                                  style={{
                                    border: "2px solid #e5e7eb",
                                    borderRadius: "8px",
                                    padding: "10px",
                                    fontSize: "14px",
                                  }}
                                >
                                  <option value="Good">✅ Good</option>
                                  <option value="Fair">⚠️ Fair</option>
                                  <option value="Damaged">❌ Damaged</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>

                            {/* Remarks */}
                            <Col lg={6}>
                              <Form.Group>
                                <Form.Label
                                  className="fw-bold mb-2"
                                  style={{ color: "#374151", fontSize: "14px" }}
                                >
                                  {/* <i className="fa-solid fa-comment me-2" style={{ color: "#6b7280" }}></i> */}
                                  Remarks (Optional)
                                </Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={2}
                                  placeholder="Add any additional notes or remarks..."
                                  value={formData.remarks}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      remarks: e.target.value,
                                    })
                                  }
                                  style={{
                                    border: "2px solid #e5e7eb",
                                    borderRadius: "8px",
                                    padding: "10px",
                                    fontSize: "14px",
                                    resize: "vertical",
                                  }}
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          {/* Action Buttons */}
                          <Row className="mt-4">
                            <Col lg={12}>
                              <div className="d-flex gap-3">
                                <Button
                                  // variant="outline-secondary"
                                  onClick={resetForm}
                                  disabled={loading}
                                  className="btn-cancel"
                                >
                                  Reset
                                </Button>
                                <Button
                                  onClick={handleIssueBook}
                                  disabled={
                                    loading ||
                                    !formData.book_id ||
                                    (!formData.card_id && !formData.issued_to) ||
                                    !formData.due_date ||
                                    (formData.card_id && (computedIssuedCount >= (parseInt(maxBooksPerCard) || 1)))
                                  }
                                  className="btn-submit"
                                >
                                  {loading ? (
                                    <>
                                      <Spinner
                                        animation="border"
                                        size="sm"
                                        className="me-2"
                                      />
                                      Issuing...
                                    </>
                                  ) : (
                                    <>Issue Book</>
                                  )}
                                </Button>
                              </div>
                            </Col>
                            {formData.card_id && (computedIssuedCount >= (parseInt(maxBooksPerCard) || 1)) && (
                              <Col lg={12} className="mt-2">
                                <Alert variant="warning" className="py-2">
                                  This card has reached the issue limit ({maxBooksPerCard}). You cannot issue more books to this card until some are returned.
                                </Alert>
                              </Col>
                            )}
                          </Row>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  {/* </Card> */}
                </Col>
              </Col>

              <Col>
                <Col lg={12}>
                  <Card
                    className="shadow-sm"
                    style={{
                      position: "sticky",
                      top: "100px",
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      height: "539px",
                    }}
                  >
                    <Card.Header
                      style={{
                        background:
                          "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                        border: "none",
                        borderBottom: "2px solid #d1d5db",
                        padding: "20px 24px",
                      }}
                    >
                      <h5
                        className="mb-0 fw-bold"
                        style={{
                          color: "#1f2937",
                          fontSize: "20px",
                          letterSpacing: "0.3px",
                        }}
                      >
                        <i
                          className="fa-solid fa-book-open me-3"
                          style={{ color: "#6b7280" }}
                        ></i>
                        Issue Summary
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        {/* Book Information - Left Side */}
                        <Col lg={6}>
                          <Card className="h-100">
                            <Card.Header
                              style={{
                                background:
                                  "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                                border: "none",
                                borderBottom: "2px solid #d1d5db",
                                padding: "10px 24px",
                              }}
                            >
                              <h5
                                className="mb-0 fw-bold"
                                style={{
                                  color: "#1f2937",
                                  fontSize: "14px",
                                  letterSpacing: "0.3px",
                                }}
                              >
                                Book Information
                              </h5>
                            </Card.Header>
                            <Card.Body>
                              {selectedBook && selectedBook.data ? (
                                <div>
                                  <Row>
                                    <Col xs={4} className="text-end pe-3">
                                      <strong>Title:</strong>
                                    </Col>
                                    <Col xs={8}>{selectedBook.data.title}</Col>
                                  </Row>
                                  {selectedBook.data.isbn && (
                                    <Row className="mb-2">
                                      <Col xs={4} className="text-end pe-3">
                                        <strong>ISBN:</strong>
                                      </Col>
                                      <Col xs={8}>{selectedBook.data.isbn}</Col>
                                    </Row>
                                  )}
                                  {selectedBook.data.author_name && (
                                    <Row className="mb-2">
                                      <Col xs={4} className="text-end pe-3">
                                        <strong>Author:</strong>
                                      </Col>
                                      <Col xs={8}>
                                        {selectedBook.data.author_name}
                                      </Col>
                                    </Row>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center text-muted py-3">
                                  <i
                                    className="fa-solid fa-book"
                                    style={{ fontSize: "48px", opacity: 0.3 }}
                                  ></i>
                                  <p className="mt-2">No book selected</p>
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>

                        {/* Member Information - Right Side */}
                        <Col lg={6}>
                          <Card className="h-100">
                            <Card.Header
                              style={{
                                background:
                                  "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                                border: "none",
                                borderBottom: "2px solid #d1d5db",
                                padding: "10px 24px",
                              }}
                            >
                              <h5
                                className="mb-0 fw-bold"
                                style={{
                                  color: "#1f2937",
                                  fontSize: "14px",
                                  letterSpacing: "0.3px",
                                }}
                              >
                                Member Information
                              </h5>
                            </Card.Header>
                            <Card.Body>
                              {userDetails ? (
                                <div>
                                  <Row className="mb-2">
                                    <Col xs={4} className="text-end pe-3">
                                      <strong>Name:</strong>
                                    </Col>
                                    <Col xs={8}>
                                      {userDetails.user_name ||
                                        userDetails.student_name ||
                                        `${userDetails.firstname || ""} ${
                                          userDetails.lastname || ""
                                        }`.trim() ||
                                        "Unknown"}
                                    </Col>
                                  </Row>
                                  {userDetails.card_number && (
                                    <Row className="mb-2">
                                      <Col xs={4} className="text-end pe-3">
                                        <strong>Card:</strong>
                                      </Col>
                                      <Col xs={8}>
                                        {userDetails.card_number}
                                      </Col>
                                    </Row>
                                  )}
                                  {userDetails.email && (
                                    <Row className="mb-2">
                                      <Col xs={4} className="text-end pe-3">
                                        <strong>Email:</strong>
                                      </Col>
                                      <Col xs={8}>{userDetails.email}</Col>
                                    </Row>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center text-muted py-3">
                                  <i
                                    className="fa-solid fa-user"
                                    style={{ fontSize: "48px", opacity: 0.3 }}
                                  ></i>
                                  <p className="mt-2">No member selected</p>
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>

                        {/* Issue Dates and Condition - Full Width */}
                        <Col lg={12} className="mt-2">
                          <Card>
                            <Card.Header
                              style={{
                                background:
                                  "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                                border: "none",
                                borderBottom: "2px solid #d1d5db",
                                padding: "10px 24px",
                              }}
                            >
                              <h5
                                className="mb-0 fw-bold"
                                style={{
                                  color: "#1f2937",
                                  fontSize: "14px",
                                  letterSpacing: "0.3px",
                                }}
                              >
                                Issue Details
                              </h5>
                            </Card.Header>
                            <Card.Body>
                              <Row>
                                {formData.due_date && (
                                  <Col lg={6}>
                                    <Row className="mb-2">
                                      <Col xs={5} className="text-end pe-3">
                                        <strong>Issue Date:</strong>
                                      </Col>
                                      <Col xs={7}>
                                        {new Date(
                                          formData.issue_date
                                        ).toLocaleDateString()}
                                      </Col>
                                    </Row>
                                    <Row className="mb-2">
                                      <Col xs={5} className="text-end pe-3">
                                        <strong>Submission Date:</strong>
                                      </Col>
                                      <Col xs={7}>
                                        {new Date(
                                          formData.due_date
                                        ).toLocaleDateString()}
                                      </Col>
                                    </Row>
                                    <Row className="mb-2">
                                      <Col xs={5} className="text-end pe-3">
                                        <strong>Duration:</strong>
                                      </Col>
                                      <Col xs={7}>
                                        {Math.ceil(
                                          (new Date(formData.due_date) -
                                            new Date(formData.issue_date)) /
                                            (1000 * 60 * 60 * 24)
                                        )}{" "}
                                        days
                                      </Col>
                                    </Row>
                                  </Col>
                                )}

                                {formData.condition_before && (
                                  <Col lg={6}>
                                    <div className="text-center">
                                      <strong className="d-block mb-2">
                                        Book Condition Before Issue:
                                      </strong>
                                      <Badge
                                        bg={
                                          formData.condition_before === "Good"
                                            ? "success"
                                            : formData.condition_before ===
                                              "Fair"
                                            ? "warning"
                                            : "danger"
                                        }
                                        className="fs-6 py-2 px-3"
                                      >
                                        {formData.condition_before}
                                      </Badge>
                                    </div>
                                  </Col>
                                )}
                              </Row>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Col>
            </Row>

            {/* </Card> */}
          </Tab.Pane>

          {/* Issued Books List Tab */}
          <Tab.Pane eventKey="list">
            <Card className="shadow-sm">
              <Card.Body className="p-0" style={{ overflow: "hidden" }}>
                <ResizableTable
                  data={filteredIssuedBooks}
                  columns={issueColumns}
                  loading={loadingIssuedBooks}
                  showCheckbox={false}
                  showSerialNumber={true}
                  showActions={false}
                  searchTerm={searchTerm}
                  currentPage={currentPage}
                  recordsPerPage={recordsPerPage}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                  }}
                  emptyMessage={
                    searchTerm
                      ? "No issued books found matching your search"
                      : "No books have been issued yet"
                  }
                  onRowClick={(issue) => {
                    // Optional: Navigate to issue details or show more info
                    console.log("Issue clicked:", issue);
                  }}
                />
              </Card.Body>
              {filteredIssuedBooks.length > 0 && (
                <Card.Footer
                  style={{
                    background: "#f8f9fa",
                    borderTop: "1px solid #e9ecef",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>Total Issued Books:</strong>{" "}
                      {filteredIssuedBooks.length}
                      {searchTerm && (
                        <span className="text-muted ms-2">
                          (Filtered from {issuedBooks.length} total)
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => {
                        fetchIssuedBooks();
                        setCurrentPage(1);
                      }}
                      disabled={loadingIssuedBooks}
                    >
                      <i className="fa-solid fa-sync me-2"></i>
                      Refresh
                    </Button>
                  </div>
                </Card.Footer>
              )}
            </Card>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Container>
  );
};

export default BookIssue;

// import React, { useState, useEffect, useRef } from "react";
// import { Container, Row, Col, Card, Button, Form, InputGroup, Badge, Spinner, Alert, Tab, Nav, Dropdown } from "react-bootstrap";
// import { useNavigate } from "react-router-dom";
// import Select from "react-select";
// import AsyncSelect from "react-select/async";
// import DataApi from "../../api/dataApi";
// import PubSub from "pubsub-js";
// import helper from "../common/helper";
// import * as constants from "../../constants/CONSTANT";
// import ResizableTable from "../common/ResizableTable";
// import { exportToExcel } from "../../utils/excelExport";
// const BookIssue = () => {
//   const navigate = useNavigate();

//   const [books, setBooks] = useState([]);
//   const [libraryCards, setLibraryCards] = useState([]);
//   const [users, setUsers] = useState([]);

//   const [selectedBook, setSelectedBook] = useState(null);
//   const [selectedLibraryCard, setSelectedLibraryCard] = useState(null);
//   const [selectedUser, setSelectedUser] = useState(null);

//   const [formData, setFormData] = useState({
//     book_id: "",
//     card_id: "",
//     issued_to: "",
//     issue_date: new Date().toISOString().split('T')[0],
//     due_date: "",
//     condition_before: "Good",
//     remarks: "",
//   });

//   const [loading, setLoading] = useState(false);
//   const [searchingBooks, setSearchingBooks] = useState(false);
//   const [searchingCards, setSearchingCards] = useState(false);

//   const [userDetails, setUserDetails] = useState(null);

//   const [issuedBooks, setIssuedBooks] = useState([]);
//   const [loadingIssuedBooks, setLoadingIssuedBooks] = useState(false);
//   const [activeTab, setActiveTab] = useState("issue");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const recordsPerPage = 20;

//   const [durationDays, setDurationDays] = useState(7);

//   const [bookSearchField, setBookSearchField] = useState("all");
//   const [cardSearchField, setCardSearchField] = useState("all");
//   const [bookSearchInput, setBookSearchInput] = useState("");
//   const [cardSearchInput, setCardSearchInput] = useState("");

//   const [bookSearchFields, setBookSearchFields] = useState({
//     title: true,
//     author: true,
//     isbn: true,
//     language: true,
//     category: true,
//     publisher: true,
//   });

//   const [cardSearchFields, setCardSearchFields] = useState({
//     card_number: true,
//     user_name: true,
//     student_name: true,
//     phone: true,
//     email: true,
//   });

//   // User search field checkboxes
//   const [userSearchFields, setUserSearchFields] = useState({
//     firstname: true,
//     lastname: true,
//     email: true,
//     phone: true,
//   });

//   // Refs for inputs
//   const bookInputRef = useRef(null);
//   const cardInputRef = useRef(null);
//   const userInputRef = useRef(null);
//   const bookSearchInputRef = useRef(null);
//   const cardSearchInputRef = useRef(null);

//   // Barcode detection
//   const bookInputTimer = useRef(null);
//   const cardInputTimer = useRef(null);
//   const lastBookInputTime = useRef(0);
//   const lastCardInputTime = useRef(0);

//   useEffect(() => {
//     fetchBooks();
//     fetchLibraryCards();
//     fetchUsers();
//     fetchIssuedBooks();
//     fetchLibrarySettings();

//     // Auto-focus on book input when component mounts
//     setTimeout(() => {
//       const bookSelect = bookInputRef.current?.querySelector('input');
//       if (bookSelect) {
//         bookSelect.focus();
//         bookSelect.click();
//       }
//     }, 300);

//     // Listen for quick action trigger
//     const token = PubSub.subscribe("OPEN_ADD_BOOK_ISSUE_MODAL", () => {
//       resetForm();
//       setActiveTab("issue");
//       setTimeout(() => {
//         const bookSelect = bookInputRef.current?.querySelector('input');
//         if (bookSelect) {
//           bookSelect.focus();
//           bookSelect.click();
//         }
//       }, 100);
//     });

//     return () => {
//       PubSub.unsubscribe(token);
//       if (bookInputTimer.current) clearTimeout(bookInputTimer.current);
//       if (cardInputTimer.current) clearTimeout(cardInputTimer.current);
//     };
//   }, []);

//   // Fetch library settings
//   const fetchLibrarySettings = async () => {
//     try {
//       const settingsApi = new DataApi("librarysettings");
//       // Use /all endpoint to get key-value pairs
//       const response = await settingsApi.get("/all");
//       if (response.data && response.data.success && response.data.data) {
//         // Response format: { success: true, data: { duration_days: "15", ... } }
//         const duration = parseInt(response.data.data.duration_days) || 7;
//         setDurationDays(duration);
//       } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
//         // Direct object response
//         const duration = parseInt(response.data.duration_days) || 7;
//         setDurationDays(duration);
//       }
//     } catch (error) {
//       console.error("Error fetching library settings:", error);
//       // Keep default 7 days on error
//     }
//   };

//   // Calculate default due date based on library settings
//   useEffect(() => {
//     if (!formData.due_date && durationDays) {
//       const dueDate = new Date();
//       dueDate.setDate(dueDate.getDate() + durationDays);
//       setFormData(prev => ({
//         ...prev,
//         due_date: dueDate.toISOString().split('T')[0]
//       }));
//     }
//   }, [durationDays]);

//   // Update user details when library card or user is selected
//   useEffect(() => {
//     if (selectedLibraryCard && selectedLibraryCard.data) {
//       setUserDetails(selectedLibraryCard.data);
//       setFormData(prev => ({
//         ...prev,
//         card_id: selectedLibraryCard.data.id,
//         issued_to: selectedLibraryCard.data.user_id || selectedLibraryCard.data.student_id || ""
//       }));
//       setSelectedUser(null);
//     } else if (selectedUser && selectedUser.data) {
//       setUserDetails(selectedUser.data);
//       setFormData(prev => ({
//         ...prev,
//         issued_to: selectedUser.data.id,
//         card_id: ""
//       }));
//       setSelectedLibraryCard(null);
//     } else {
//       setUserDetails(null);
//     }
//   }, [selectedLibraryCard, selectedUser]);

//   // Update form when book is selected
//   useEffect(() => {
//     if (selectedBook && selectedBook.data) {
//       setFormData(prev => ({
//         ...prev,
//         book_id: selectedBook.data.id
//       }));
//     }
//   }, [selectedBook]);

//   const fetchBooks = async () => {
//     try {
//       setLoading(true);
//       const bookApi = new DataApi("book");
//       const response = await bookApi.fetchAll();

//       // Handle different response structures
//       let booksData = [];
//       if (Array.isArray(response.data)) {
//         // If response.data is directly an array
//         booksData = response.data;
//       } else if (response.data && Array.isArray(response.data.data)) {
//         // If response.data.data is the array
//         booksData = response.data.data;
//       } else if (Array.isArray(response)) {
//         // If response itself is the array
//         booksData = response;
//       }

//       console.log("Total books fetched:", booksData.length);
//       console.log("Sample book data:", booksData[0]);

//       // Store ALL books (don't filter here - filter in search/display logic)
//       setBooks(booksData);
//     } catch (error) {
//       console.error("Error fetching books:", error);
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Error",
//         message: "Failed to fetch books. Please refresh the page.",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchLibraryCards = async () => {
//     try {
//       const cardApi = new DataApi("librarycard");
//       const response = await cardApi.fetchAll();
//       if (response.data && Array.isArray(response.data)) {
//         const activeCards = response.data.filter(card =>
//           card.is_active === true || card.is_active === "true"
//         );
//         setLibraryCards(activeCards);
//       }
//     } catch (error) {
//       console.error("Error fetching library cards:", error);
//     }
//   };

//   const fetchUsers = async () => {
//     try {
//       const userApi = new DataApi("user");
//       const response = await userApi.fetchAll();
//       if (response.data && Array.isArray(response.data)) {
//         setUsers(response.data);
//       }
//     } catch (error) {
//       console.error("Error fetching users:", error);
//     }
//   };

//   const fetchIssuedBooks = async () => {
//     try {
//       setLoadingIssuedBooks(true);
//       const issueApi = new DataApi("bookissue");
//       const response = await issueApi.fetchAll();
//       if (response.data && Array.isArray(response.data)) {
//         // Filter only active/issued books (not returned)
//         const activeIssues = response.data.filter(issue =>
//           issue.status === "issued" || issue.status === null || issue.status === undefined || issue.return_date === null
//         );
//         setIssuedBooks(activeIssues);
//       }
//     } catch (error) {
//       console.error("Error fetching issued books:", error);
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Error",
//         message: "Failed to fetch issued books"
//       });
//     } finally {
//       setLoadingIssuedBooks(false);
//     }
//   };

//   // Handle book search
//   const handleBookSearch = async () => {
//     if (!bookSearchInput.trim()) return;

//     const query = bookSearchInput.trim();
//     const cleanInput = query.replace(/[-\s]/g, '');
//     const isBarcode = /^\d{10,13}$/.test(cleanInput);

//     // If barcode detected, search by ISBN
//     if (isBarcode) {
//       const results = await loadBookOptionsByField(cleanInput, "isbn");
//       if (results && results.length > 0) {
//         setSelectedBook(results[0]);
//       }
//     } else {
//       const results = await loadBookOptionsByField(query.toLowerCase(), bookSearchField);
//       if (results && results.length > 0) {
//         // If only one result, auto-select it
//         if (results.length === 1) {
//           setSelectedBook(results[0]);
//         }
//       }
//     }
//   };

//   // Load book options by specific field
//   const loadBookOptionsByField = async (inputValue, fieldType = "all") => {
//     if (!inputValue || inputValue.length < 1) {
//       // Show ALL books (not just available ones) - user can see all data
//       return books
//         .slice(0, 50)
//         .map(book => ({
//           value: book.id,
//           label: `${book.title}${book.isbn ? ` (ISBN: ${book.isbn})` : ""}${book.available_copies !== undefined ? ` - Available: ${book.available_copies || 0}` : ""}`,
//           data: book
//         }));
//     }

//     const query = inputValue.toLowerCase().trim();
//     const cleanInput = inputValue.replace(/[-\s]/g, '');
//     const isBarcode = /^\d{10,13}$/.test(cleanInput);

//     if (isBarcode || fieldType === "isbn") {
//       // Try to find by ISBN directly
//       const foundBook = books.find(book =>
//         book.isbn && book.isbn.replace(/[-\s]/g, '').toLowerCase() === cleanInput.toLowerCase()
//       );

//       if (foundBook) {
//         // Return ALL books, not just available ones
//         return [{
//           value: foundBook.id,
//           label: `${foundBook.title} (ISBN: ${foundBook.isbn})${foundBook.available_copies !== undefined ? ` - Available: ${foundBook.available_copies || 0}` : ""}`,
//           data: foundBook
//         }];
//       }

//       // If not found locally, search via API
//       try {
//         setSearchingBooks(true);
//         const bookResp = await helper.fetchWithAuth(
//           `${constants.API_BASE_URL}/api/book/isbn/${encodeURIComponent(cleanInput)}`,
//           "GET"
//         );

//         if (bookResp.ok) {
//           const bookData = await bookResp.json();
//           // Return ALL books, not just available ones
//           if (!books.find(b => b.id === bookData.id)) {
//             setBooks(prev => [...prev, bookData]);
//           }
//           return [{
//             value: bookData.id,
//             label: `${bookData.title} (ISBN: ${bookData.isbn})${bookData.available_copies !== undefined ? ` - Available: ${bookData.available_copies || 0}` : ""}`,
//             data: bookData
//           }];
//         }
//       } catch (error) {
//         console.error("Error searching book by ISBN:", error);
//       } finally {
//         setSearchingBooks(false);
//       }
//     }

//     // Regular text search - search only in selected fields based on checkboxes
//     // Show ALL books, not just available ones
//     const filtered = books.filter(book => {
//       // Remove the available_copies filter to show all books

//       // Get all searchable fields
//       const title = (book.title || "").toLowerCase();
//       const isbn = (book.isbn || "").replace(/[-\s]/g, '').toLowerCase();
//       const author = (book.author_name || "").toLowerCase();
//       const category = (book.category_name || "").toLowerCase();
//       const publisher = (book.publisher || "").toLowerCase();
//       const language = (book.language || "").toLowerCase();
//       const edition = (book.edition || "").toString().toLowerCase();
//       const description = (book.description || "").toLowerCase();

//       const searchTerm = query.replace(/[-\s]/g, '');
//       const queryNumbers = query.replace(/\D/g, "");

//       // Check if at least one field is selected
//       const hasSelectedFields = Object.values(bookSearchFields).some(val => val === true);

//       // If no fields selected, search all fields (fallback)
//       if (!hasSelectedFields) {
//         return (
//           title.includes(query) ||
//           isbn.includes(searchTerm) ||
//           author.includes(query) ||
//           category.includes(query) ||
//           publisher.includes(query) ||
//           language.includes(query) ||
//           edition.includes(query) ||
//           description.includes(query) ||
//           (queryNumbers.length > 0 && (
//             isbn.includes(queryNumbers) ||
//             (book.id && book.id.toString().includes(queryNumbers))
//           ))
//         );
//       }

//       // Search only in selected fields
//       let matches = false;
//       if (bookSearchFields.title && title.includes(query)) matches = true;
//       if (bookSearchFields.isbn && (isbn.includes(searchTerm) || (queryNumbers.length > 0 && isbn.includes(queryNumbers)))) matches = true;
//       if (bookSearchFields.author && author.includes(query)) matches = true;
//       if (bookSearchFields.category && category.includes(query)) matches = true;
//       if (bookSearchFields.publisher && publisher.includes(query)) matches = true;
//       if (bookSearchFields.language && language.includes(query)) matches = true;

//       // Also check ISBN for numeric queries if ISBN is selected
//       if (bookSearchFields.isbn && queryNumbers.length > 0 && isbn.includes(queryNumbers)) matches = true;

//       return matches;
//     });

//     return filtered.slice(0, 50).map(book => ({
//       value: book.id,
//       label: `${book.title}${book.isbn ? ` (ISBN: ${book.isbn})` : ""}${book.available_copies ? ` - Available: ${book.available_copies}` : ""}`,
//       data: book
//     }));
//   };

//   // Load book options with search - always search all fields in dropdown
//   const loadBookOptions = async (inputValue) => {
//     // When typing in dropdown, always search all fields for better UX
//     return loadBookOptionsByField(inputValue, "all");
//   };

//   // Handle card search
//   const handleCardSearch = async () => {
//     if (!cardSearchInput.trim()) return;

//     const query = cardSearchInput.trim();
//     const results = await loadCardOptionsByField(query, cardSearchField);
//     if (results && results.length > 0) {
//       // If only one result, auto-select it
//       if (results.length === 1) {
//         setSelectedLibraryCard(results[0]);
//       }
//     }
//   };

//   // Load card options by specific field
//   const loadCardOptionsByField = async (inputValue, fieldType = "all") => {
//     if (!inputValue || inputValue.length < 1) {
//       return libraryCards
//         .slice(0, 50)
//         .map(card => ({
//           value: card.id,
//           label: `${card.card_number || "N/A"} - ${card.user_name || card.student_name || "Unknown"}`,
//           data: card
//         }));
//     }

//     const query = inputValue.trim();
//     const queryLower = query.toLowerCase();
//     const queryNumbers = query.replace(/\D/g, "");

//     // Check if it's a barcode scan (card number format)
//     const isBarcode = query.length >= 3 && (query.match(/^[A-Z]{2,}/i) || /^\d{6,}$/.test(query));

//     if (isBarcode || fieldType === "card_number") {
//       // Try to find by card number directly
//       const foundCard = libraryCards.find(card =>
//         card.card_number && card.card_number.toUpperCase() === query.toUpperCase()
//       );

//       if (foundCard) {
//         setSelectedLibraryCard({
//           value: foundCard.id,
//           label: `${foundCard.card_number} - ${foundCard.user_name || foundCard.student_name || "Unknown"}`,
//           data: foundCard
//         });
//         return [{
//           value: foundCard.id,
//           label: `${foundCard.card_number} - ${foundCard.user_name || foundCard.student_name || "Unknown"}`,
//           data: foundCard
//         }];
//       }

//       // If not found locally, search via API
//       try {
//         setSearchingCards(true);
//         const cardResp = await helper.fetchWithAuth(
//           `${constants.API_BASE_URL}/api/librarycard/card/${encodeURIComponent(query.toUpperCase())}`,
//           "GET"
//         );

//         if (cardResp.ok) {
//           const cardData = await cardResp.json();
//           if (!libraryCards.find(c => c.id === cardData.id)) {
//             setLibraryCards(prev => [...prev, cardData]);
//           }
//           setSelectedLibraryCard({
//             value: cardData.id,
//             label: `${cardData.card_number} - ${cardData.user_name || cardData.student_name || "Unknown"}`,
//             data: cardData
//           });
//           return [{
//             value: cardData.id,
//             label: `${cardData.card_number} - ${cardData.user_name || cardData.student_name || "Unknown"}`,
//             data: cardData
//           }];
//         }
//       } catch (error) {
//         console.error("Error searching card:", error);
//       } finally {
//         setSearchingCards(false);
//       }
//     }

//     // Regular text search based on selected checkboxes
//     const filtered = libraryCards.filter(card => {
//       const userName = (card.user_name || "").toLowerCase();
//       const studentName = (card.student_name || "").toLowerCase();
//       const cardNumber = (card.card_number || "").toLowerCase();
//       const phone = (card.phone || card.whatsapp_number || "").replace(/\D/g, "");
//       const email = (card.user_email || card.email || "").toLowerCase();

//       // Check if at least one field is selected
//       const hasSelectedFields = Object.values(cardSearchFields).some(val => val === true);

//       // If no fields selected, search all fields (fallback)
//       if (!hasSelectedFields) {
//         return (
//           userName.includes(queryLower) ||
//           studentName.includes(queryLower) ||
//           cardNumber.includes(queryLower) ||
//           phone.includes(queryNumbers) ||
//           email.includes(queryLower)
//         );
//       }

//       // Search only in selected fields
//       let matches = false;
//       if (cardSearchFields.card_number && cardNumber.includes(queryLower)) matches = true;
//       if (cardSearchFields.user_name && userName.includes(queryLower)) matches = true;
//       if (cardSearchFields.student_name && studentName.includes(queryLower)) matches = true;
//       if (cardSearchFields.phone && phone.includes(queryNumbers)) matches = true;
//       if (cardSearchFields.email && email.includes(queryLower)) matches = true;

//       return matches;
//     });

//     return filtered.slice(0, 50).map(card => ({
//       value: card.id,
//       label: `${card.card_number || "N/A"} - ${card.user_name || card.student_name || "Unknown"}`,
//       data: card
//     }));
//   };

//   // Load library card options with search
//   const loadCardOptions = async (inputValue) => {
//     return loadCardOptionsByField(inputValue, cardSearchField);
//   };

//   // Load user options with search
//   const loadUserOptions = async (inputValue) => {
//     if (!inputValue || inputValue.length < 1) {
//       return users
//         .slice(0, 50)
//         .map(user => ({
//           value: user.id,
//           label: `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.email || "Unknown",
//           data: user
//         }));
//     }

//     const query = inputValue.trim().toLowerCase();
//     const queryNumbers = query.replace(/\D/g, "");

//     const filtered = users.filter(user => {
//       const firstName = (user.firstname || "").toLowerCase();
//       const lastName = (user.lastname || "").toLowerCase();
//       const email = (user.email || "").toLowerCase();
//       const phone = (user.phone || user.whatsapp_number || "").replace(/\D/g, "");

//       // Check if at least one field is selected
//       const hasSelectedFields = Object.values(userSearchFields).some(val => val === true);

//       // If no fields selected, search all fields (fallback)
//       if (!hasSelectedFields) {
//         return (
//           firstName.includes(query) ||
//           lastName.includes(query) ||
//           `${firstName} ${lastName}`.includes(query) ||
//           email.includes(query) ||
//           phone.includes(queryNumbers)
//         );
//       }

//       // Search only in selected fields
//       let matches = false;
//       if (userSearchFields.firstname && firstName.includes(query)) matches = true;
//       if (userSearchFields.lastname && lastName.includes(query)) matches = true;
//       if (userSearchFields.firstname && userSearchFields.lastname && `${firstName} ${lastName}`.includes(query)) matches = true;
//       if (userSearchFields.email && email.includes(query)) matches = true;
//       if (userSearchFields.phone && phone.includes(queryNumbers)) matches = true;

//       return matches;
//     });

//     return filtered.slice(0, 50).map(user => ({
//       value: user.id,
//       label: `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.email || "Unknown",
//       data: user
//     }));
//   };

//   // Handle book selection change
//   const handleBookChange = (selectedOption) => {
//     setSelectedBook(selectedOption);
//     if (selectedOption) {
//       // Auto-focus on card input after book selection
//       setTimeout(() => {
//         const cardSelect = cardInputRef.current?.querySelector('input');
//         if (cardSelect) {
//           cardSelect.focus();
//           cardSelect.click();
//         }
//       }, 200);
//     }
//   };

//   // Handle library card selection change
//   const handleCardChange = (selectedOption) => {
//     setSelectedLibraryCard(selectedOption);
//     if (selectedOption) {
//       // Auto-focus on due date after card selection
//       setTimeout(() => {
//         document.getElementById("due_date")?.focus();
//       }, 200);
//     }
//   };

//   // Handle user selection change
//   const handleUserChange = (selectedOption) => {
//     setSelectedUser(selectedOption);
//     if (selectedOption) {
//       // Auto-focus on due date after user selection
//       setTimeout(() => {
//         document.getElementById("due_date")?.focus();
//       }, 200);
//     }
//   };

//   // Handle form submission
//   const handleIssueBook = async () => {
//     // Validation
//     if (!formData.book_id) {
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Validation Error",
//         message: "Please select a book"
//       });
//       return;
//     }

//     if (!formData.card_id && !formData.issued_to) {
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Validation Error",
//         message: "Please select a library card or user"
//       });
//       return;
//     }

//     if (!formData.due_date) {
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Validation Error",
//         message: "Please select a due date"
//       });
//       return;
//     }

//     try {
//       setLoading(true);

//       const issueData = {
//         book_id: formData.book_id,
//         issue_date: formData.issue_date,
//         due_date: formData.due_date,
//         condition_before: formData.condition_before,
//         remarks: formData.remarks || ""
//       };

//       // Add either card_id or issued_to
//       if (formData.card_id) {
//         issueData.card_id = formData.card_id;
//       } else if (formData.issued_to) {
//         issueData.issued_to = formData.issued_to;
//       }

//       const response = await helper.fetchWithAuth(
//         `${constants.API_BASE_URL}/api/bookissue/issue`,
//         "POST",
//         JSON.stringify(issueData)
//       );

//       if (response.ok) {
//         const result = await response.json();
//         if (result.success) {
//           PubSub.publish("RECORD_SAVED_TOAST", {
//             title: "Success",
//             message: `Book "${selectedBook?.data?.title || 'Book'}" issued successfully to ${userDetails?.user_name || userDetails?.firstname || 'User'}`
//           });
//           resetForm();
//           // Refresh books to update available copies
//           fetchBooks();
//           // Refresh issued books list
//           fetchIssuedBooks();
//         } else {
//           PubSub.publish("RECORD_ERROR_TOAST", {
//             title: "Error",
//             message: result.errors || "Failed to issue book"
//           });
//         }
//       } else {
//         const error = await response.json().catch(() => ({}));
//         PubSub.publish("RECORD_ERROR_TOAST", {
//           title: "Error",
//           message: error.errors || "Failed to issue book"
//         });
//       }
//     } catch (error) {
//       console.error("Error issuing book:", error);
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Error",
//         message: error.message || "Failed to issue book"
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const resetForm = () => {
//     setSelectedBook(null);
//     setSelectedLibraryCard(null);
//     setSelectedUser(null);
//     setUserDetails(null);
//     setBookSearchInput("");
//     setCardSearchInput("");
//     setFormData({
//       book_id: "",
//       card_id: "",
//       issued_to: "",
//       issue_date: new Date().toISOString().split('T')[0],
//       due_date: (() => {
//         const dueDate = new Date();
//         dueDate.setDate(dueDate.getDate() + durationDays);
//         return dueDate.toISOString().split('T')[0];
//       })(),
//       condition_before: "Good",
//       remarks: "",
//     });
//     // Auto-focus on book search input after reset
//     setTimeout(() => {
//       if (bookSearchInputRef.current) {
//         bookSearchInputRef.current.focus();
//       }
//     }, 200);
//   };

//   // Custom styles for react-select
//   const customSelectStyles = {
//     control: (base, state) => ({
//       ...base,
//       border: '2px solid #8b5cf6',
//       borderRadius: '8px',
//       padding: '4px 8px',
//       fontSize: '14px',
//       boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(139, 92, 246, 0.25)' : 'none',
//       minHeight: '44px',
//       '&:hover': {
//         borderColor: '#7c3aed'
//       }
//     }),
//     option: (base, state) => ({
//       ...base,
//       backgroundColor: state.isSelected ? '#8b5cf6' : state.isFocused ? '#f3e8ff' : 'white',
//       color: state.isSelected ? 'white' : '#374151',
//       padding: '10px 12px',
//       fontSize: '14px',
//       cursor: 'pointer'
//     }),
//     menu: (base) => ({
//       ...base,
//       borderRadius: '8px',
//       boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
//       zIndex: 9999
//     }),
//     placeholder: (base) => ({
//       ...base,
//       color: '#9ca3af',
//       fontSize: '14px'
//     }),
//     singleValue: (base) => ({
//       ...base,
//       color: '#374151',
//       fontSize: '14px'
//     }),
//     input: (base) => ({
//       ...base,
//       color: '#374151',
//       fontSize: '14px'
//     })
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return "-";
//     try {
//       const date = new Date(dateString);
//       if (isNaN(date.getTime())) return dateString;
//       const day = String(date.getDate()).padStart(2, '0');
//       const month = String(date.getMonth() + 1).padStart(2, '0');
//       const year = date.getFullYear();
//       return `${day}-${month}-${year}`;
//     } catch (error) {
//       return dateString;
//     }
//   };

//   // Filter issued books based on search term
//   const filteredIssuedBooks = issuedBooks.filter(issue => {
//     if (!searchTerm) return true;
//     const query = searchTerm.toLowerCase();
//     const bookTitle = (issue.book_title || "").toLowerCase();
//     const isbn = (issue.book_isbn || "").toLowerCase();
//     const userName = (issue.issued_to_name || issue.student_name || issue.issued_to || "").toLowerCase();
//     const cardNumber = (issue.card_number || "").toLowerCase();

//     return (
//       bookTitle.includes(query) ||
//       isbn.includes(query) ||
//       userName.includes(query) ||
//       cardNumber.includes(query)
//     );
//   });

//   // Calculate days remaining
//   const getDaysRemaining = (dueDate) => {
//     if (!dueDate) return null;
//     try {
//       const due = new Date(dueDate);
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       due.setHours(0, 0, 0, 0);
//       const diffTime = due - today;
//       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//       return diffDays;
//     } catch (error) {
//       return null;
//     }
//   };

//   // Handle export to Excel
//   const handleExport = async () => {
//     try {
//       const exportData = filteredIssuedBooks.map((issue) => {
//         const daysRemaining = getDaysRemaining(issue.due_date);
//         let statusText = "";
//         if (daysRemaining !== null && daysRemaining < 0) {
//           statusText = `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''}`;
//         } else if (daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3) {
//           statusText = daysRemaining === 0 ? "Due Today" : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`;
//         } else if (daysRemaining !== null) {
//           statusText = `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`;
//         }

//         return {
//           "Book Title": issue.book_title || "N/A",
//           "ISBN": issue.book_isbn || "-",
//           "Issued To": issue.issued_to_name || issue.student_name || issue.issued_to || "N/A",
//           "Card Number": issue.card_number || "-",
//           "Issue Date": formatDate(issue.issue_date),
//           "Submission Date": formatDate(issue.due_date),
//           "Days Remaining": statusText || "-",
//           "Status": issue.status === "returned" ? "Returned" : "Issued"
//         };
//       });

//       const columns = [
//         { key: 'Book Title', header: 'Book Title', width: 40 },
//         { key: 'ISBN', header: 'ISBN', width: 20 },
//         { key: 'Issued To', header: 'Issued To', width: 30 },
//         { key: 'Card Number', header: 'Card Number', width: 20 },
//         { key: 'Issue Date', header: 'Issue Date', width: 15 },
//         { key: 'Submission Date', header: 'Submission Date', width: 15 },
//         { key: 'Days Remaining', header: 'Days Remaining', width: 20 },
//         { key: 'Status', header: 'Status', width: 15 }
//       ];

//       const filename = searchTerm
//         ? `issued_books_filtered_${new Date().toISOString().split('T')[0]}`
//         : `issued_books_${new Date().toISOString().split('T')[0]}`;

//       await exportToExcel(exportData, filename, 'Issued Books', columns);

//       PubSub.publish("RECORD_SAVED_TOAST", {
//         title: "Export Success",
//         message: `Exported ${exportData.length} issued book(s) to Excel`
//       });
//     } catch (error) {
//       console.error('Error exporting issued books:', error);
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Export Error",
//         message: "Failed to export issued books"
//       });
//     }
//   };

//   const issueColumns = [
//     {
//       field: "book_title",
//       label: "Book Title",
//       width: 250,
//       render: (value, record) => (
//         <a
//           href={`/books/${record.book_id}`}
//           onClick={(e) => {
//             e.preventDefault();
//             navigate(`/books/${record.book_id}`);
//           }}
//           style={{ color: "#6f42c1", textDecoration: "none", fontWeight: "600" }}
//           onMouseEnter={(e) => {
//             try {
//               const bookPrefetch = {
//                 id: record.book_id,
//                 title: record.book_title,
//                 isbn: record.book_isbn,
//                 author_name: record.author_name
//               };
//               localStorage.setItem(`prefetch:book:${record.book_id}`, JSON.stringify(bookPrefetch));
//             } catch (err) { }
//             e.target.style.textDecoration = "underline";
//           }}
//           onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
//         >
//           <strong>{value || "N/A"}</strong>
//         </a>
//       )
//     },
//     {
//       field: "book_isbn",
//       label: "ISBN",
//       width: 150,
//       render: (value) => (
//         <code style={{ background: "#f8f9fa", padding: "4px 8px", borderRadius: "4px" }}>
//           {value || "-"}
//         </code>
//       )
//     },
//     {
//       field: "issued_to_name",
//       label: "Issued To",
//       width: 200,
//       render: (value, record) => {
//         const userId = record.user_id || record.student_id || record.issued_to;
//         const displayName = record.issued_to_name || record.student_name || record.issued_to || "N/A";
//         if (userId) {
//           return (
//             <a
//               href={`/user/${userId}`}
//               onClick={(e) => {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 try {
//                   localStorage.setItem(`prefetch:user:${userId}`, JSON.stringify(record));
//                 } catch (err) { }
//                 navigate(`/user/${userId}`, { state: record });
//               }}
//               onContextMenu={(e) => {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 try {
//                   localStorage.setItem(`prefetch:user:${userId}`, JSON.stringify(record));
//                 } catch (err) { }
//                 window.open(`/user/${userId}`, '_blank');
//               }}
//               style={{ color: "#6f42c1", textDecoration: "none", fontWeight: 500, cursor: "pointer" }}
//               onMouseEnter={(e) => {
//                 e.target.style.textDecoration = "underline";
//               }}
//               onMouseLeave={(e) => {
//                 e.target.style.textDecoration = "none";
//               }}
//               title="Click to view user details (Right-click to open in new tab)"
//             >
//               {displayName}
//             </a>
//           );
//         }
//         return displayName;
//       }
//     },
//     {
//       field: "card_number",
//       label: "Card Number",
//       width: 150,
//       render: (value) => value || "-"
//     },
//     {
//       field: "issue_date",
//       label: "Issue Date",
//       width: 120,
//       render: (value) => formatDate(value)
//     },
//     {
//       field: "due_date",
//       label: "Submission Date",
//       width: 180,
//       render: (value, record) => {
//         const daysRemaining = getDaysRemaining(value);
//         const isOverdue = daysRemaining !== null && daysRemaining < 0;
//         const isDueSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3;

//         return (
//           <div>
//             <div>{formatDate(value)}</div>
//             {daysRemaining !== null && (
//               <div className="small mt-1">
//                 {isOverdue ? (
//                   <Badge bg="danger">
//                     Overdue by {Math.abs(daysRemaining)} day{Math.abs(daysRemaining) !== 1 ? 's' : ''}
//                   </Badge>
//                 ) : isDueSoon ? (
//                   <Badge bg="warning" text="dark">
//                     {daysRemaining === 0 ? "Due Today" : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`}
//                   </Badge>
//                 ) : (
//                   <Badge bg="success">
//                     {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
//                   </Badge>
//                 )}
//               </div>
//             )}
//           </div>
//         );
//       }
//     },
//     {
//       field: "status",
//       label: "Status",
//       width: 120,
//       render: (value) => (
//         <Badge bg={value === "returned" ? "secondary" : "primary"}>
//           {value === "returned" ? "Returned" : "Issued"}
//         </Badge>
//       )
//     }
//   ];

//   return (
//     <Container fluid className="mt-4" style={{ marginTop: "90px", padding: "0 1.5rem" }}>
//       {/* Header Card */}

//       {/* Tabs */}
//       <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || "issue")}>
//         <Nav variant="tabs" className="mb-4" style={{ borderBottom: "2px solid #e5e7eb" }}>
//           <Nav.Item>
//             <Nav.Link
//               eventKey="issue"
//               style={{
//                 color: activeTab === "issue" ? "#000000" : "#6b7280",
//                 fontWeight: activeTab === "issue" ? "600" : "400",
//                 borderBottom: activeTab === "issue" ? "3px solid #6b7280" : "none"
//               }}
//               className={activeTab !== "issue" ? "text-black" : ""}
//             >
//               <i className="fa-solid fa-hand-holding me-2" style={{ color: activeTab === "issue" ? "#000000" : "#6b7280", fontSize: "15px" }}></i>
//               <span style={{ color: activeTab === "issue" ? "#000000" : "#6b7280", fontSize: "15px" }}>Issue New Book</span>
//             </Nav.Link>
//           </Nav.Item>
//           <Nav.Item>
//             <Nav.Link
//               eventKey="list"
//               style={{
//                 color: activeTab === "list" ? "#000000" : "#6b7280",
//                 fontWeight: activeTab === "list" ? "600" : "400",
//                 borderBottom: activeTab === "list" ? "3px solid #6b7280" : "none"
//               }}
//               className={activeTab !== "list" ? "text-black" : ""}
//             >
//               <i className="fa-solid fa-list me-2" style={{ color: activeTab === "list" ? "#000000" : "#6b7280", fontSize: "15px" }}></i>
//               <span style={{ color: activeTab === "list" ? "#000000" : "#6b7280", fontSize: "15px" }}>View Issued Books ({issuedBooks.length})</span>
//             </Nav.Link>
//           </Nav.Item>
//         </Nav>

//         <Tab.Content>

//           <Tab.Pane eventKey="issue">
//             <Row style={{ border: "1px solid red" }}>
//               <Col lg={6} >
//                 {/* Book Selection Card */}
//                 <Card className="mb-4 shadow-sm" style={{ background: "#f3e8ff", border: "1px solid #d8b4fe" }}>
//                   <Card.Header style={{ background: "#e9d5ff", border: "none", borderBottom: "1px solid #d8b4fe" }}>
//                     <div className="d-flex justify-content-between align-items-center">
//                       <h5 className="mb-0 fw-bold" style={{ color: "#000000", fontSize: "18px" }}>
//                         <i className="fa-solid fa-book me-2" style={{ color: "#6b7280" }}></i>
//                         Select Book
//                       </h5>
//                       {/* Column Visibility Dropdown */}
//                       {/* <Dropdown>
//                         <Dropdown.Toggle
//                           variant="link"
//                           size="sm"
//                           style={{
//                             color: "#6b7280",
//                             textDecoration: "none",
//                             border: "none",
//                             padding: "4px 8px"
//                           }}
//                         >
//                           <i className="fa-solid fa-gear"></i>
//                         </Dropdown.Toggle>
//                         <Dropdown.Menu align="end" style={{ minWidth: "220px", maxHeight: "400px", overflowY: "auto" }}>
//                           <Dropdown.Header>Search Fields</Dropdown.Header>
//                           <Dropdown.Divider />
//                           <Dropdown.Item
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               setBookSearchFields(prev => ({ ...prev, title: !prev.title }));
//                             }}
//                             style={{ padding: "8px 16px" }}
//                           >
//                             <div className="d-flex align-items-center">
//                               <input
//                                 type="checkbox"
//                                 checked={bookSearchFields.title}
//                                 onChange={() => setBookSearchFields(prev => ({ ...prev, title: !prev.title }))}
//                                 onClick={(e) => e.stopPropagation()}
//                                 style={{ marginRight: "8px", cursor: "pointer" }}
//                               />
//                               <span>Book Name</span>
//                             </div>
//                           </Dropdown.Item>
//                           <Dropdown.Item
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               setBookSearchFields(prev => ({ ...prev, author: !prev.author }));
//                             }}
//                             style={{ padding: "8px 16px" }}
//                           >
//                             <div className="d-flex align-items-center">
//                               <input
//                                 type="checkbox"
//                                 checked={bookSearchFields.author}
//                                 onChange={() => setBookSearchFields(prev => ({ ...prev, author: !prev.author }))}
//                                 onClick={(e) => e.stopPropagation()}
//                                 style={{ marginRight: "8px", cursor: "pointer" }}
//                               />
//                               <span>Author Name</span>
//                             </div>
//                           </Dropdown.Item>
//                           <Dropdown.Item
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               setBookSearchFields(prev => ({ ...prev, isbn: !prev.isbn }));
//                             }}
//                             style={{ padding: "8px 16px" }}
//                           >
//                             <div className="d-flex align-items-center">
//                               <input
//                                 type="checkbox"
//                                 checked={bookSearchFields.isbn}
//                                 onChange={() => setBookSearchFields(prev => ({ ...prev, isbn: !prev.isbn }))}
//                                 onClick={(e) => e.stopPropagation()}
//                                 style={{ marginRight: "8px", cursor: "pointer" }}
//                               />
//                               <span>ISBN Number</span>
//                             </div>
//                           </Dropdown.Item>
//                           <Dropdown.Item
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               setBookSearchFields(prev => ({ ...prev, language: !prev.language }));
//                             }}
//                             style={{ padding: "8px 16px" }}
//                           >
//                             <div className="d-flex align-items-center">
//                               <input
//                                 type="checkbox"
//                                 checked={bookSearchFields.language}
//                                 onChange={() => setBookSearchFields(prev => ({ ...prev, language: !prev.language }))}
//                                 onClick={(e) => e.stopPropagation()}
//                                 style={{ marginRight: "8px", cursor: "pointer" }}
//                               />
//                               <span>Language</span>
//                             </div>
//                           </Dropdown.Item>
//                           <Dropdown.Item
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               setBookSearchFields(prev => ({ ...prev, category: !prev.category }));
//                             }}
//                             style={{ padding: "8px 16px" }}
//                           >
//                             <div className="d-flex align-items-center">
//                               <input
//                                 type="checkbox"
//                                 checked={bookSearchFields.category}
//                                 onChange={() => setBookSearchFields(prev => ({ ...prev, category: !prev.category }))}
//                                 onClick={(e) => e.stopPropagation()}
//                                 style={{ marginRight: "8px", cursor: "pointer" }}
//                               />
//                               <span>Category</span>
//                             </div>
//                           </Dropdown.Item>
//                           <Dropdown.Item
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               setBookSearchFields(prev => ({ ...prev, publisher: !prev.publisher }));
//                             }}
//                             style={{ padding: "8px 16px" }}
//                           >
//                             <div className="d-flex align-items-center">
//                               <input
//                                 type="checkbox"
//                                 checked={bookSearchFields.publisher}
//                                 onChange={() => setBookSearchFields(prev => ({ ...prev, publisher: !prev.publisher }))}
//                                 onClick={(e) => e.stopPropagation()}
//                                 style={{ marginRight: "8px", cursor: "pointer" }}
//                               />
//                               <span>Publisher</span>
//                             </div>
//                           </Dropdown.Item>
//                         </Dropdown.Menu>
//                       </Dropdown> */}
//                     </div>
//                   </Card.Header>
//                   <Card.Body className="p-4">
//                     <Form.Group>

//                       <div ref={bookInputRef}>
//                         <AsyncSelect
//                           cacheOptions
//                           defaultOptions
//                           loadOptions={loadBookOptions}
//                           value={selectedBook}
//                           onChange={handleBookChange}
//                           styles={customSelectStyles}
//                           placeholder="Search by book name, author, ISBN, language..."
//                           isSearchable
//                           isLoading={searchingBooks}
//                           noOptionsMessage={({ inputValue }) =>
//                             inputValue ? "No books found. Try searching by book name, author name, ISBN number, or language." : "Start typing to search by book name, author, ISBN, language..."
//                           }
//                           menuIsOpen={undefined}
//                           onMenuOpen={() => { }}
//                           onInputChange={(inputValue, { action }) => {
//                             // Auto-open menu when typing
//                             if (action === 'input-change' && inputValue) {
//                               // Menu will auto-open via AsyncSelect
//                             }
//                           }}
//                         />
//                       </div>
//                       <Form.Text className="text-muted mt-2 d-block">
//                         <i className="fa-solid fa-info-circle me-1"></i>
//                         Search by book name, author name, ISBN number, language, category, publisher, or scan barcode
//                       </Form.Text>
//                     </Form.Group>

//                     {/* {selectedBook && selectedBook.data && (
//                       <Alert variant="success" className="mt-3 mb-0" style={{ borderRadius: "8px" }}>
//                         <div className="d-flex align-items-center">
//                           <i className="fa-solid fa-circle-check me-2" style={{ fontSize: "20px" }}></i>
//                           <div className="flex-grow-1">
//                             <strong>{selectedBook.data.title}</strong>
//                             {selectedBook.data.isbn && (
//                               <div className="small text-muted">ISBN: {selectedBook.data.isbn}</div>
//                             )}
//                             {selectedBook.data.author_name && (
//                               <div className="small text-muted">Author: {selectedBook.data.author_name}</div>
//                             )}
//                             {selectedBook.data.available_copies !== undefined && (
//                               <Badge bg="info" className="mt-1">
//                                 Available: {selectedBook.data.available_copies} copies
//                               </Badge>
//                             )}
//                           </div>
//                         </div>
//                       </Alert>
//                     )} */}
//                   </Card.Body>
//                 </Card>

//                 {/* Library Card / User Selection Card */}
//                 <Card className="mb-4 shadow-sm" style={{ background: "#f3e8ff", border: "1px solid #d8b4fe" }}>
//                   <Card.Header style={{ background: "#e9d5ff", border: "none", borderBottom: "1px solid #d8b4fe" }}>
//                     <h5 className="mb-0 fw-bold" style={{ color: "#000000", fontSize: "18px" }}>
//                       <i className="fa-solid fa-id-card me-2" style={{ color: "#6b7280" }}></i>
//                       Select Library Card or User
//                     </h5>
//                   </Card.Header>
//                   <Card.Body className="p-4">
//                     <Row className="g-3">
//                       <Col md={12}>
//                         <Form.Group>
//                           <div className="d-flex justify-content-between align-items-center mb-2">
//                             <Form.Label className="fw-bold mb-0" style={{ color: "#000000", fontSize: "15px" }}>
//                               <i className="fa-solid fa-id-card me-2" style={{ color: "#6b7280" }}></i>
//                               Select Library Card
//                             </Form.Label>
//                             {/* Library Card Search Fields Dropdown */}
//                             <Dropdown>
//                               <Dropdown.Toggle
//                                 variant="link"
//                                 size="sm"
//                                 style={{
//                                   color: "#6b7280",
//                                   textDecoration: "none",
//                                   border: "none",
//                                   padding: "4px 8px"
//                                 }}
//                               >
//                                 <i className="fa-solid fa-gear"></i>
//                               </Dropdown.Toggle>
//                               <Dropdown.Menu align="end" style={{ minWidth: "220px", maxHeight: "400px", overflowY: "auto" }}>
//                                 <Dropdown.Header>Search Fields</Dropdown.Header>
//                                 <Dropdown.Divider />
//                                 <Dropdown.Item
//                                   onClick={(e) => {
//                                     e.stopPropagation();
//                                     setCardSearchFields(prev => ({ ...prev, card_number: !prev.card_number }));
//                                   }}
//                                   style={{ padding: "8px 16px" }}
//                                 >
//                                   <div className="d-flex align-items-center">
//                                     <input
//                                       type="checkbox"
//                                       checked={cardSearchFields.card_number}
//                                       onChange={() => setCardSearchFields(prev => ({ ...prev, card_number: !prev.card_number }))}
//                                       onClick={(e) => e.stopPropagation()}
//                                       style={{ marginRight: "8px", cursor: "pointer" }}
//                                     />
//                                     <span>Card Number</span>
//                                   </div>
//                                 </Dropdown.Item>
//                                 <Dropdown.Item
//                                   onClick={(e) => {
//                                     e.stopPropagation();
//                                     setCardSearchFields(prev => ({ ...prev, user_name: !prev.user_name }));
//                                   }}
//                                   style={{ padding: "8px 16px" }}
//                                 >
//                                   <div className="d-flex align-items-center">
//                                     <input
//                                       type="checkbox"
//                                       checked={cardSearchFields.user_name}
//                                       onChange={() => setCardSearchFields(prev => ({ ...prev, user_name: !prev.user_name }))}
//                                       onClick={(e) => e.stopPropagation()}
//                                       style={{ marginRight: "8px", cursor: "pointer" }}
//                                     />
//                                     <span>User Name</span>
//                                   </div>
//                                 </Dropdown.Item>
//                                 <Dropdown.Item
//                                   onClick={(e) => {
//                                     e.stopPropagation();
//                                     setCardSearchFields(prev => ({ ...prev, student_name: !prev.student_name }));
//                                   }}
//                                   style={{ padding: "8px 16px" }}
//                                 >
//                                   <div className="d-flex align-items-center">
//                                     <input
//                                       type="checkbox"
//                                       checked={cardSearchFields.student_name}
//                                       onChange={() => setCardSearchFields(prev => ({ ...prev, student_name: !prev.student_name }))}
//                                       onClick={(e) => e.stopPropagation()}
//                                       style={{ marginRight: "8px", cursor: "pointer" }}
//                                     />
//                                     <span>Student Name</span>
//                                   </div>
//                                 </Dropdown.Item>
//                                 <Dropdown.Item
//                                   onClick={(e) => {
//                                     e.stopPropagation();
//                                     setCardSearchFields(prev => ({ ...prev, phone: !prev.phone }));
//                                   }}
//                                   style={{ padding: "8px 16px" }}
//                                 >
//                                   <div className="d-flex align-items-center">
//                                     <input
//                                       type="checkbox"
//                                       checked={cardSearchFields.phone}
//                                       onChange={() => setCardSearchFields(prev => ({ ...prev, phone: !prev.phone }))}
//                                       onClick={(e) => e.stopPropagation()}
//                                       style={{ marginRight: "8px", cursor: "pointer" }}
//                                     />
//                                     <span>Phone</span>
//                                   </div>
//                                 </Dropdown.Item>
//                                 <Dropdown.Item
//                                   onClick={(e) => {
//                                     e.stopPropagation();
//                                     setCardSearchFields(prev => ({ ...prev, email: !prev.email }));
//                                   }}
//                                   style={{ padding: "8px 16px" }}
//                                 >
//                                   <div className="d-flex align-items-center">
//                                     <input
//                                       type="checkbox"
//                                       checked={cardSearchFields.email}
//                                       onChange={() => setCardSearchFields(prev => ({ ...prev, email: !prev.email }))}
//                                       onClick={(e) => e.stopPropagation()}
//                                       style={{ marginRight: "8px", cursor: "pointer" }}
//                                     />
//                                     <span>Email</span>
//                                   </div>
//                                 </Dropdown.Item>
//                               </Dropdown.Menu>
//                             </Dropdown>
//                           </div>
//                           <div ref={cardInputRef}>
//                             <AsyncSelect
//                               cacheOptions
//                               defaultOptions
//                               loadOptions={loadCardOptions}
//                               value={selectedLibraryCard}
//                               onChange={handleCardChange}
//                               styles={customSelectStyles}
//                               placeholder="Or select from dropdown..."
//                               isSearchable
//                               isLoading={searchingCards}
//                               noOptionsMessage={({ inputValue }) =>
//                                 inputValue ? "No cards found. Try scanning barcode or searching by name/phone." : "Start typing or scan barcode..."
//                               }
//                             />
//                           </div>
//                           <Form.Text className="text-muted mt-2 d-block">
//                             <i className="fa-solid fa-info-circle me-1"></i>
//                             Select search field, type or scan card barcode, then click search icon
//                           </Form.Text>
//                         </Form.Group>
//                       </Col>

//                     </Row>

//                     {userDetails && (
//                       <Alert variant="info" className="mt-3 mb-0" style={{ borderRadius: "8px", background: "#f3f4f6", border: "1px solid #e5e7eb" }}>
//                         <div className="d-flex align-items-start">
//                           <i className="fa-solid fa-user-circle me-3" style={{ fontSize: "32px", color: "#6b7280" }}></i>
//                           <div className="flex-grow-1">
//                             <h6 className="mb-2 fw-bold" style={{ color: "#000000" }}>
//                               {userDetails.user_name || userDetails.student_name || `${userDetails.firstname || ""} ${userDetails.lastname || ""}`.trim() || "User"}
//                             </h6>
//                             <Row>
//                               {userDetails.card_number && (
//                                 <Col sm={6} className="mb-2">
//                                   <strong>Card Number:</strong> {userDetails.card_number}
//                                 </Col>
//                               )}
//                               {userDetails.email && (
//                                 <Col sm={6} className="mb-2">
//                                   <strong>Email:</strong> {userDetails.email}
//                                 </Col>
//                               )}
//                               {(userDetails.phone || userDetails.whatsapp_number) && (
//                                 <Col sm={6} className="mb-2">
//                                   <strong>Phone:</strong> {userDetails.phone || userDetails.whatsapp_number}
//                                 </Col>
//                               )}
//                               {userDetails.is_active !== undefined && (
//                                 <Col sm={6} className="mb-2">
//                                   <Badge bg={userDetails.is_active ? "success" : "danger"}>
//                                     {userDetails.is_active ? "Active" : "Inactive"}
//                                   </Badge>
//                                 </Col>
//                               )}
//                             </Row>
//                           </div>
//                         </div>
//                       </Alert>
//                     )}
//                   </Card.Body>
//                 </Card>

//                 {/* Issue Details Card */}
//                 <Card className="mb-4 shadow-sm" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
//                   <Card.Header style={{ background: "#f3f4f6", border: "none", borderBottom: "1px solid #e5e7eb" }}>
//                     <h5 className="mb-0 fw-bold" style={{ color: "#000000", fontSize: "18px" }}>
//                       <i className="fa-solid fa-calendar-days me-2" style={{ color: "#6b7280" }}></i>
//                       Issue Details
//                     </h5>
//                   </Card.Header>
//                   <Card.Body className="p-4">
//                     <Row className="g-3">
//                       <Col md={6}>
//                         <Form.Group>
//                           <Form.Label className="fw-bold" style={{ color: "#000000", fontSize: "15px" }}>
//                             <i className="fa-solid fa-calendar me-2" style={{ color: "#6b7280" }}></i>
//                             Issue Date
//                           </Form.Label>
//                           <Form.Control
//                             type="date"
//                             value={formData.issue_date}
//                             onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
//                             style={{ border: "2px solid #e9ecef", borderRadius: "8px", padding: "10px" }}
//                           />
//                         </Form.Group>
//                       </Col>
//                       <Col md={6}>
//                         <Form.Group>
//                           <Form.Label className="fw-bold" style={{ color: "#000000", fontSize: "15px" }}>
//                             <i className="fa-solid fa-calendar-check me-2" style={{ color: "#6b7280" }}></i>
//                             Submission Date <span className="text-danger">*</span>
//                           </Form.Label>
//                           <Form.Control
//                             id="due_date"
//                             type="date"
//                             value={formData.due_date}
//                             onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
//                             min={formData.issue_date}
//                             required
//                             style={{ border: "2px solid #e9ecef", borderRadius: "8px", padding: "10px" }}
//                           />
//                         </Form.Group>
//                       </Col>
//                       <Col md={6}>
//                         <Form.Group>
//                           <Form.Label className="fw-bold" style={{ color: "#000000", fontSize: "15px" }}>
//                             <i className="fa-solid fa-clipboard-check me-2" style={{ color: "#6b7280" }}></i>
//                             Book Condition Before Issue
//                           </Form.Label>
//                           <Form.Select
//                             value={formData.condition_before}
//                             onChange={(e) => setFormData({ ...formData, condition_before: e.target.value })}
//                             style={{ border: "2px solid #e9ecef", borderRadius: "8px", padding: "10px" }}
//                           >
//                             <option value="Good">✅ Good</option>
//                             <option value="Fair">⚠️ Fair</option>
//                             <option value="Damaged">❌ Damaged</option>
//                           </Form.Select>
//                         </Form.Group>
//                       </Col>
//                       <Col md={12}>
//                         <Form.Group>
//                           <Form.Label className="fw-bold" style={{ color: "#000000", fontSize: "15px" }}>
//                             <i className="fa-solid fa-comment me-2" style={{ color: "#6b7280" }}></i>
//                             Remarks (Optional)
//                           </Form.Label>
//                           <Form.Control
//                             as="textarea"
//                             rows={3}
//                             placeholder="Add any additional notes or remarks..."
//                             value={formData.remarks}
//                             onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
//                             style={{ border: "2px solid #e9ecef", borderRadius: "8px", padding: "10px" }}
//                           />
//                         </Form.Group>
//                       </Col>
//                     </Row>
//                   </Card.Body>
//                 </Card>

//                 {/* Issue Button */}
//                 <div className="d-flex gap-3">
//                   <Button
//                     variant="primary"
//                     onClick={handleIssueBook}
//                     disabled={loading || !formData.book_id || (!formData.card_id && !formData.issued_to) || !formData.due_date}
//                     className="flex-grow-1"
//                     style={{
//                       background: (loading || !formData.book_id || (!formData.card_id && !formData.issued_to) || !formData.due_date)
//                         ? "#ccc"
//                         : "#6b7280",
//                       border: "none",
//                       padding: "14px 32px",
//                       fontWeight: "600",
//                       borderRadius: "8px",
//                       fontSize: "16px",
//                       height: "50px",
//                       color: "#ffffff"
//                     }}
//                   >
//                     {loading ? (
//                       <>
//                         <Spinner animation="border" size="sm" className="me-2" />
//                         Issuing...
//                       </>
//                     ) : (
//                       <>
//                         <i className="fa-solid fa-hand-holding me-2"></i>
//                         Issue Book
//                       </>
//                     )}
//                   </Button>
//                   <Button
//                     variant="outline-secondary"
//                     onClick={resetForm}
//                     disabled={loading}
//                     style={{
//                       border: "2px solid #6c757d",
//                       color: "#6c757d",
//                       padding: "14px 24px",
//                       fontWeight: "600",
//                       borderRadius: "8px",
//                       height: "50px"
//                     }}
//                   >
//                     <i className="fa-solid fa-rotate me-2"></i>
//                     Reset
//                   </Button>
//                 </div>
//               </Col>
//               {/* Summary Card */}
//               <Col lg={4}>
//                 <Card className="shadow-sm" style={{ position: "sticky", top: "100px", background: "#ffffff", border: "1px solid #e5e7eb" }}>
//                   <Card.Header style={{ background: "#f3f4f6", border: "none", borderBottom: "1px solid #e5e7eb" }}>
//                     <h5 className="mb-0 fw-bold" style={{ color: "#000000", fontSize: "18px" }}>
//                       <i className="fa-solid fa-info-circle me-2" style={{ color: "#6b7280" }}></i>
//                       Issue Summary
//                     </h5>
//                   </Card.Header>
//                   <Card.Body className="p-4">
//                     {selectedBook && selectedBook.data ? (
//                       <div className="mb-3">
//                         <h6 className="fw-bold text-muted mb-2">Book Information</h6>
//                         <p className="mb-1"><strong>Title:</strong> {selectedBook.data.title}</p>
//                         {selectedBook.data.isbn && (
//                           <p className="mb-1"><strong>ISBN:</strong> {selectedBook.data.isbn}</p>
//                         )}
//                         {selectedBook.data.author_name && (
//                           <p className="mb-1"><strong>Author:</strong> {selectedBook.data.author_name}</p>
//                         )}
//                       </div>
//                     ) : (
//                       <div className="text-center text-muted py-3">
//                         <i className="fa-solid fa-book" style={{ fontSize: "48px", opacity: 0.3 }}></i>
//                         <p className="mt-2">No book selected</p>
//                       </div>
//                     )}

//                     {userDetails ? (
//                       <div className="mb-3">
//                         <h6 className="fw-bold text-muted mb-2">Member Information</h6>
//                         <p className="mb-1">
//                           <strong>Name:</strong> {userDetails.user_name || userDetails.student_name || `${userDetails.firstname || ""} ${userDetails.lastname || ""}`.trim() || "Unknown"}
//                         </p>
//                         {userDetails.card_number && (
//                           <p className="mb-1"><strong>Card:</strong> {userDetails.card_number}</p>
//                         )}
//                         {userDetails.email && (
//                           <p className="mb-1"><strong>Email:</strong> {userDetails.email}</p>
//                         )}
//                       </div>
//                     ) : (
//                       <div className="text-center text-muted py-3">
//                         <i className="fa-solid fa-user" style={{ fontSize: "48px", opacity: 0.3 }}></i>
//                         <p className="mt-2">No member selected</p>
//                       </div>
//                     )}

//                     {formData.due_date && (
//                       <div className="mb-3">
//                         <h6 className="fw-bold text-muted mb-2">Issue Dates</h6>
//                         <p className="mb-1">
//                           <strong>Issue Date:</strong> {new Date(formData.issue_date).toLocaleDateString()}
//                         </p>
//                         <p className="mb-1">
//                           <strong>Submission Date:</strong> {new Date(formData.due_date).toLocaleDateString()}
//                         </p>
//                         <p className="mb-0">
//                           <strong>Duration:</strong> {Math.ceil((new Date(formData.due_date) - new Date(formData.issue_date)) / (1000 * 60 * 60 * 24))} days
//                         </p>
//                       </div>
//                     )}

//                     {formData.condition_before && (
//                       <div>
//                         <h6 className="fw-bold text-muted mb-2">Condition</h6>
//                         <Badge bg={formData.condition_before === "Good" ? "success" : formData.condition_before === "Fair" ? "warning" : "danger"}>
//                           {formData.condition_before}
//                         </Badge>
//                       </div>
//                     )}
//                   </Card.Body>
//                 </Card>
//               </Col>
//             </Row>
//           </Tab.Pane>

//           {/* Issued Books List Tab */}
//           <Tab.Pane eventKey="list">
//             <Card className="shadow-sm">

//               <Card.Body className="p-0" style={{ overflow: "hidden", }}>
//                 <ResizableTable
//                   data={filteredIssuedBooks}
//                   columns={issueColumns}
//                   loading={loadingIssuedBooks}
//                   showCheckbox={false}
//                   showSerialNumber={true}
//                   showActions={false}
//                   searchTerm={searchTerm}
//                   currentPage={currentPage}
//                   recordsPerPage={recordsPerPage}
//                   onPageChange={(page) => {
//                     setCurrentPage(page);
//                   }}
//                   emptyMessage={searchTerm ? "No issued books found matching your search" : "No books have been issued yet"}
//                   onRowClick={(issue) => {
//                     // Optional: Navigate to issue details or show more info
//                     console.log("Issue clicked:", issue);
//                   }}
//                 />
//               </Card.Body>
//               {filteredIssuedBooks.length > 0 && (
//                 <Card.Footer style={{ background: "#f8f9fa", borderTop: "1px solid #e9ecef" }}>
//                   <div className="d-flex justify-content-between align-items-center">
//                     <div>
//                       <strong>Total Issued Books:</strong> {filteredIssuedBooks.length}
//                       {searchTerm && (
//                         <span className="text-muted ms-2">
//                           (Filtered from {issuedBooks.length} total)
//                         </span>
//                       )}
//                     </div>
//                     <Button
//                       variant="outline-primary"
//                       size="sm"
//                       onClick={() => {
//                         fetchIssuedBooks();
//                         setCurrentPage(1);
//                       }}
//                       disabled={loadingIssuedBooks}
//                     >
//                       <i className="fa-solid fa-sync me-2"></i>
//                       Refresh
//                     </Button>
//                   </div>
//                 </Card.Footer>
//               )}
//             </Card>
//           </Tab.Pane>
//         </Tab.Content>
//       </Tab.Container >
//     </Container >
//   );
// };

// export default BookIssue;
