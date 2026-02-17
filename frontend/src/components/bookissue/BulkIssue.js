import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  Row,
  Col,
  Button,
  Form,
  Alert,
  Spinner,
  ProgressBar,
  Badge,
  Tooltip,
  OverlayTrigger,
  Table,
} from "react-bootstrap";
import Select from "react-select";
import DataApi from "../../api/dataApi";
import helper from "../common/helper";
import PubSub from "pubsub-js";
import * as constants from "../../constants/CONSTANT";
import PermissionDenied from "../../utils/permission_denied";


const styles = `
  .member-card { border-radius: 20px; overflow: hidden; }
  .stat-box { 
    padding: 15px; 
    border-radius: 12px; 
    transition: transform 0.2s;
    border: 1px solid rgba(0,0,0,0.03);
  }
  .stat-box:hover { transform: translateY(-2px); }
  .profile-header-bg {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    height: 80px;
    margin-bottom: -40px;
  }
  .avatar-container {
    position: relative;
    display: inline-block;
    padding: 3px;
    background: white;
    border-radius: 50%;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  }
  .detail-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid #f8f9fa;
  }
  .detail-row:last-child { border-bottom: none; }
`;
const BulkIssue = ({ permissions }) => {




  const [books, setBooks] = useState([]);
  const [libraryCards, setLibraryCards] = useState([]);
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);

  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedBooks, setSelectedBooks] = useState([]);

  const [durationDays, setDurationDays] = useState(15);
  const [systemMaxBooks, setSystemMaxBooks] = useState(6);
  const [memberExtraAllowance, setMemberExtraAllowance] = useState(0);
  const [totalAllowedBooks, setTotalAllowedBooks] = useState(6);
  const [dailyLimitCount, setDailyLimitCount] = useState(2);

  const [subscriptionAllowedBooks, setSubscriptionAllowedBooks] = useState(0);
  const [memberPersonalAllowedBooks, setMemberPersonalAllowedBooks] = useState(0);
  const [memberSubscription, setMemberSubscription] = useState(null);
  const [memberPlan, setMemberPlan] = useState(null);

  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState("");
  const [confirmDays, setConfirmDays] = useState(0);
  const [autoCalculated, setAutoCalculated] = useState(false);

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [memberInfo, setMemberInfo] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [memberAge, setMemberAge] = useState(null);
  const [filteredBooksByAge, setFilteredBooksByAge] = useState([]);
  const [showIssuedBooks, setShowIssuedBooks] = useState(false);


  const extractErrorMessage = (result) => {
    if (!result) return "Unknown error";

    if (result.message) return result.message;
    if (result.error) return result.error;

    if (result.errors && Array.isArray(result.errors)) {
      return result.errors.map(err => {
        if (typeof err === 'string') return err;
        if (err.msg) return err.msg;
        if (err.message) return err.message;
        return JSON.stringify(err);
      }).join(", ");
    }

    if (result.errors && typeof result.errors === 'object') {
      const messages = [];

      if (result.errors.errors && Array.isArray(result.errors.errors)) {
        return result.errors.errors.map(e => e.msg).join(", ");
      }

      for (const key in result.errors) {
        const err = result.errors[key];
        if (typeof err === 'string') {
          messages.push(err);
        } else if (err && err.msg) {
          messages.push(err.msg);
        } else if (err && err.message) {
          messages.push(err.message);
        }
      }

      if (messages.length > 0) return messages.join(", ");

      return "Validation error";
    }

    return "Unknown error occurred";
  };

  useEffect(() => {

    fetchAll();
  }, [refreshTrigger]);

  useEffect(() => {
    if (!issueDate || autoCalculated) return;

    const duration = durationDays;
    console.log("duration=>", duration);

    const d = new Date(issueDate);
    d.setDate(d.getDate() + duration);

    setDueDate(d.toISOString().split("T")[0]);
    setAutoCalculated(true);
  }, [issueDate, durationDays, autoCalculated]);

  // useEffect(() => {
  //   if (issueDate) {
  //     const duration = durationDays || 15;
  //     const d = new Date(issueDate);
  //     d.setDate(d.getDate() + duration);
  //     setDueDate(d.toISOString().split("T")[0]);
  //     const end = new Date(dueDate);
  //     const diffTime = end.getTime() - d.getTime();
  //     const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  //     setConfirmDays(diffDays);
  //   }
  // }, [issueDate,dueDate]);


  useEffect(() => {
    if (!issueDate || !dueDate) {
      setConfirmDays(0);
      return;
    }

    const start = new Date(issueDate);
    const end = new Date(dueDate);

    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    console.log("Issue and Due Date changed:", {
      issueDate,
      dueDate,
      diffDays
    });

    setConfirmDays(diffDays);
  }, [issueDate, dueDate]);


  useEffect(() => {
    console.log("Selected member info:", memberInfo);
    if (selectedCard) {
      loadMemberInfo(selectedCard.value);
    } else {
      resetMemberInfo();
    }
  }, [selectedCard, subscriptions, plans]);



  // useEffect(() => {
  //   if (!selectedCard || memberAge === null || books.length === 0) {
  //     setFilteredBooksByAge([]);
  //     return;
  //   }

  //   // const filtered = books.filter(book => {
  //   //   const min = book.min_age !== null && book.min_age !== "" ? Number(book.min_age) : null;
  //   //   const max = book.max_age !== null && book.max_age !== "" ? Number(book.max_age) : null;

  //   //   //check also zero age books 
  //   //   if (min === 0 && max === 0) {
  //   //     return true;
  //   //   }

  //   //   //if member age is zero  
  //   //   if (memberAge === 0) {
  //   //     return min === null && max === null;
  //   //   }

  //   //   if (min === null) {
  //   //     return false;
  //   //   }
  //   //   if (min < memberAge) {
  //   //     return false;
  //   //   }
  //   //   if (max !== null && memberAge > max) return false;

  //   //   return true;
  //   // });

  //   const filtered = books.filter(book => {
  //     const min = book.min_age !== null && book.min_age !== "" ? Number(book.min_age) : null;
  //     const max = book.max_age !== null && book.max_age !== "" ? Number(book.max_age) : null;


  //     if (min === null || max === null) return false;
  //     if (min === 0 && max === 0) return false;

  //     if (memberAge === null || memberAge === undefined) return false;

  //     return max <= memberAge;
  //   });





  //   console.log("Member Age:", memberAge);
  //   console.table(filtered.map(b => ({
  //     title: b.title,
  //     min: b.min_age,
  //     max: b.max_age
  //   })));

  //   console.log('filtered= ', filtered)


  //   setFilteredBooksByAge(filtered);
  // }, [books, selectedCard, memberAge]);



  useEffect(() => {
  if (!selectedCard || memberAge === null || books.length === 0) {
    setFilteredBooksByAge([]);
    return;
  }

  const filtered = books.filter(book => {
    const min = book.min_age !== null && book.min_age !== "" 
      ? Number(book.min_age) 
      : null;

    const max = book.max_age !== null && book.max_age !== "" 
      ? Number(book.max_age) 
      : null;

    if (memberAge === null || memberAge === undefined) return false;

    // ✅ If no age restriction → allow
    if (min === null && max === null) return true;

    // ✅ If only min defined
    if (min !== null && max === null) {
      return memberAge >= min;
    }

    // ✅ If only max defined
    if (min === null && max !== null) {
      return memberAge <= max;
    }

    // ✅ Normal case (min and max both exist)
    return memberAge >= min && memberAge <= max;
  });

  console.log("Member Age:", memberAge);
  console.table(filtered.map(b => ({
    title: b.title,
    min: b.min_age,
    max: b.max_age
  })));

  setFilteredBooksByAge(filtered);

}, [books, selectedCard, memberAge]);


  const getNumberValue = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const num = parseInt(value);
    return isNaN(num) ? null : num;
  };

  const resetMemberInfo = () => {
    setMemberInfo(null);
    setMemberSubscription(null);
    setMemberPlan(null);
    setSubscriptionAllowedBooks(0);
    setMemberPersonalAllowedBooks(0);
    setMemberExtraAllowance(0);
    setTotalAllowedBooks(6);
    setSystemMaxBooks(6);
    setMemberAge(null);
    setDailyLimitCount(2);
  };


  const fetchAll = async () => {
    setLoading(true);
    try {
      const bookApi = new DataApi("book");
      const cardApi = new DataApi("librarycard");
      const userApi = new DataApi("user");
      const issueApi = new DataApi("bookissue");
      const subscriptionApi = new DataApi("subscriptions");
      const planApi = new DataApi("plans");

      console.log("cardapi", cardApi)
      const [
        booksResp,
        cardsResp,
        usersResp,
        issuesResp,
        subscriptionResponse,
        planResponse
      ] = await Promise.all([
        bookApi.fetchAll(),
        cardApi.fetchAll(),
        userApi.fetchAll(),
        issueApi.fetchAll(),
        subscriptionApi.fetchAll(),
        planApi.fetchAll()
      ]);

      const booksList = normalize(booksResp);
      const cardsList = normalize(cardsResp);
      const usersList = normalize(usersResp);
      const issuesList = normalize(issuesResp);
      console.log("usersList", usersList);

      console.log("cardsList", cardsList);

      let subscriptionsList = [];
      if (subscriptionResponse?.data?.data) {
        subscriptionsList = subscriptionResponse.data.data;
      } else if (subscriptionResponse?.data) {
        subscriptionsList = Array.isArray(subscriptionResponse.data) ?
          subscriptionResponse.data :
          [subscriptionResponse.data];
      } else if (Array.isArray(subscriptionResponse)) {
        subscriptionsList = subscriptionResponse;
      }

      let plansList = [];
      if (planResponse?.data?.data) {
        plansList = planResponse.data.data;
      } else if (planResponse?.data) {
        plansList = Array.isArray(planResponse.data) ?
          planResponse.data :
          [planResponse.data];
      } else if (Array.isArray(planResponse)) {
        plansList = planResponse;
      }

      setBooks(booksList);
      setFilteredBooksByAge(booksList);
      setUsers(usersList);
      setSubscriptions(subscriptionsList);
      setPlans(plansList);
      console.log("subscriptionsList", subscriptionsList);
      console.log("cardsList", cardsList);

      const activeCards = cardsList.filter((c) =>
        c.is_active === true || c.is_active === "true" || c.is_active === 1
      );
      setLibraryCards(activeCards);

      let submissionsList = [];
      try {
        const submissionsResp = await helper.fetchWithAuth(`${constants.API_BASE_URL}/api/book_submissions`, "GET");
        if (submissionsResp.ok) {
          const submissionsData = await submissionsResp.json();
          submissionsList = normalize(submissionsData);
        }
      } catch (error) {
        console.error("Error fetching submissions:", error);
      }

      const allNonReturnedIssues = issuesList.filter(
        (issue) => issue.status !== "returned"
      );

      const transformedSubmissions = submissionsList.map(submission => ({
        id: `submission_${submission.id}`,
        book_id: submission.book_id,
        book_title: submission.book_title,
        book_isbn: submission.book_isbn,
        card_id: submission.card_id || submission.issued_to,
        card_number: submission.card_number,
        issued_to: submission.issued_to,
        issued_to_name: submission.issued_to_name,
        issue_date: submission.issue_date,
        due_date: submission.due_date,
        status: "submitted",
        quantity: 1,
        condition_before: submission.condition_before,
        remarks: submission.remarks,
        submit_date: submission.submit_date,
        penalty: submission.penalty_amount || submission.penalty,
        condition_after: submission.condition_after
      }));

      const combinedBooks = [...allNonReturnedIssues, ...transformedSubmissions];

      setIssuedBooks(combinedBooks);

      setDurationDays(0);
      setSystemMaxBooks(6);
      setTotalAllowedBooks(6);
      setDailyLimitCount(2);

    } catch (err) {
      console.error("Error fetching lists:", err);
      showErrorToast("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const normalize = (resp) => {
    if (Array.isArray(resp?.data)) return resp.data;
    if (Array.isArray(resp)) return resp;
    if (resp?.data && !Array.isArray(resp.data)) return [resp.data];
    return [];
  };

  const loadMemberInfo = async (cardId) => {
    try {
      const cardApi = new DataApi("librarycard");
      const memberResp = await cardApi.fetchById(cardId);

      if (memberResp && memberResp.data) {
        const member = memberResp.data;
        setMemberInfo(member);

        const memberDob = member.dob || member.date_of_birth || member.birth_date;
        let age = null;

        if (memberDob) {
          age = calculateMemberAge(memberDob);
          setMemberAge(age);
          console.log("Member age calculated:", {
            dob: memberDob,
            age,
            memberName: `${member.first_name || ''} ${member.last_name || ''}`
          });
        } else {
          setMemberAge(null);

        }

        let personalAllowed = 0;
        if (member.allowed_books !== undefined && member.allowed_books !== null) {
          personalAllowed = parseInt(member.allowed_books);
        } else if (member.allowedBooks !== undefined && member.allowedBooks !== null) {
          personalAllowed = parseInt(member.allowedBooks);
        } else if (member.allowed !== undefined && member.allowed !== null) {
          personalAllowed = parseInt(member.allowed);
        }

        if (isNaN(personalAllowed) || personalAllowed < 0) {
          personalAllowed = 0;
        }

        setMemberPersonalAllowedBooks(personalAllowed);
        setMemberExtraAllowance(personalAllowed);

        let planId = null;
        if (member.plan_id) {
          planId = member.plan_id;
        } else if (member.planId) {
          planId = member.planId;
        }

        let subscription = null;
        let plan = null;
        let subscriptionBooks = 0;
        let planDuration = 0;
        let dailyLimit = 2;

        if (planId && plans.length > 0) {
          plan = plans.find(p => {
            return (
              p.id?.toString() === planId.toString() ||
              p._id?.toString() === planId.toString()
            );
          });

          if (plan) {
            subscriptionBooks = parseInt(plan.allowed_books || 0);
            if (isNaN(subscriptionBooks) || subscriptionBooks < 0) {
              subscriptionBooks = 0;
            }
            if (plan.duration_days) {
              planDuration = parseInt(plan.duration_days);
            }

            if (plan.max_allowed_books_at_time !== undefined && plan.max_allowed_books_at_time !== null) {
              dailyLimit = parseInt(plan.max_allowed_books_at_time);
              if (isNaN(dailyLimit) || dailyLimit < 1) {
                dailyLimit = 2;
              }
            } else {
              dailyLimit = 2;
            }

            const isPlanActive = plan.is_active === true ||
              plan.is_active === "true" ||
              plan.is_active === 1;

            if (!isPlanActive) {
              subscriptionBooks = 0;
            }
          }
        }

        if (!plan && subscriptions.length > 0) {
          let subscriptionId = null;
          if (member.subscription_id) {
            subscriptionId = member.subscription_id;
          } else if (member.subscriptionId) {
            subscriptionId = member.subscriptionId;
          } else if (member.subscription) {
            subscriptionId = member.subscription;
          }

          if (subscriptionId) {
            subscription = subscriptions.find(sub => {
              return (
                sub.id?.toString() === subscriptionId.toString() ||
                sub._id?.toString() === subscriptionId.toString() ||
                sub.plan_id?.toString() === subscriptionId.toString() ||
                sub.planId?.toString() === subscriptionId.toString()
              );
            });

            if (subscription) {
              subscriptionBooks = parseInt(subscription.allowed_books || 0);
              if (isNaN(subscriptionBooks) || subscriptionBooks < 0) {
                subscriptionBooks = 0;
              }

              if (subscription.duration_days) {
                planDuration = parseInt(subscription.duration_days);
              } else if (subscription.duration) {
                planDuration = parseInt(subscription.duration);
              }

              if (subscription.max_allowed_books_at_time !== undefined && subscription.max_allowed_books_at_time !== null) {
                dailyLimit = parseInt(subscription.max_allowed_books_at_time);
              } else if (subscription.maxBooksAtTime !== undefined && subscription.maxBooksAtTime !== null) {
                dailyLimit = parseInt(subscription.maxBooksAtTime);
              } else if (subscription.max_at_time !== undefined && subscription.max_at_time !== null) {
                dailyLimit = parseInt(subscription.max_at_time);
              } else if (subscription.daily_limit !== undefined && subscription.daily_limit !== null) {
                dailyLimit = parseInt(subscription.daily_limit);
              }

              if (isNaN(dailyLimit) || dailyLimit < 1) {
                dailyLimit = 2;
              }

              const isSubscriptionActive = subscription.is_active === true ||
                subscription.is_active === "true" ||
                subscription.is_active === 1 ||
                subscription.status === "active";

              if (!isSubscriptionActive) {
                subscriptionBooks = 0;
              }
            }
          }
        }

        setMemberPlan(plan);
        setMemberSubscription(subscription);
        setSubscriptionAllowedBooks(subscriptionBooks);
        setDurationDays(planDuration);
        setDailyLimitCount(dailyLimit);

        // Calculate due date based on new duration
        const d = new Date(issueDate);
        d.setDate(d.getDate() + planDuration);
        setDueDate(d.toISOString().split("T")[0]);
        setAutoCalculated(true);

        const systemMax = subscriptionBooks > 0 ? subscriptionBooks : 6;
        setSystemMaxBooks(systemMax);

        let totalAllowed = systemMax;
        if (personalAllowed > 0) {
          totalAllowed += personalAllowed;
        }

        setTotalAllowedBooks(totalAllowed);

      } else {
        console.warn("No member data found for card:", cardId);
        resetMemberInfo();
      }
    } catch (err) {
      console.error("Error loading member info:", err);
      resetMemberInfo();
    }
  };

  const calculateMemberAge = (dobString) => {
    if (!dobString) return null;

    const dob = new Date(dobString);
    const today = new Date();

    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age;
  };

  const findUserByCardId = (cardId) => {
    if (!cardId) return null;

    const card = libraryCards.find(c => c.id.toString() === cardId.toString());
    if (!card) return null;

    const userId = card.user_id || card.userId;
    if (userId) {
      return users.find(u => u.id.toString() === userId.toString());
    }

    if (card.user_name || card.student_name) {
      return {
        name: card.user_name || card.student_name,
        email: card.email || 'N/A',
        phone: card.phone || 'N/A'
      };
    }

    return null;
  };

  const computeIssuedCountForCard = (cardId) => {
    if (!cardId) return 0;
    return issuedBooks.filter(
      (i) => {
        const issCardId = i.card_id || i.cardId || i.library_card_id;
        return issCardId?.toString() === cardId.toString() && i.status === "issued";
      }
    ).length;
  };

  const computeIssuedTodayForCard = (cardId) => {
    if (!cardId) return 0;
    const today = new Date().toISOString().split("T")[0];

    return issuedBooks.filter(
      (i) => {
        const issCardId = i.card_id || i.cardId || i.library_card_id;
        const issueDate = i.issue_date || i.issueDate;
        return (
          issCardId?.toString() === cardId.toString() &&
          issueDate?.toString().split("T")[0] === today
        );
      }
    ).length;
  };

  const isBookIssuedToSelectedCard = (bookId) => {
    if (!selectedCard) return false;

    return issuedBooks.some(
      (iss) => {
        const issCardId = iss.card_id || iss.cardId || iss.library_card_id;
        const issBookId = iss.book_id || iss.bookId;

        return (
          issCardId?.toString() === selectedCard.value.toString() &&
          issBookId?.toString() === bookId.toString() &&
          iss.status === "issued" &&
          (iss.return_date == null || iss.return_date === undefined || iss.return_date === "")
        );
      }
    );
  };

  const getBookOptions = () => {
    const booksToShow = filteredBooksByAge;

    if (booksToShow.length === 0) {
      return [{
        label: selectedCard && memberAge !== null
          ? `No books available for age ${memberAge} years`
          : "No books available",
        options: []
      }];
    }

    const options = booksToShow.map((book) => {
      const minAge = getNumberValue(book.min_age);
      const maxAge = getNumberValue(book.max_age);

      const isGeneral =
        (minAge === 0 && maxAge === 0) ||
        (book.min_age === null && book.max_age === null);

      const ageLabel = isGeneral ? "All Ages" : `${minAge}-${maxAge} years`;

      const isAlreadyIssued = selectedCard ? isBookIssuedToSelectedCard(book.id) : false;

      const available = parseInt(book.available_copies || 0);
      const isOutOfStock = available <= 0;

      let label = `${book.title} ${book.isbn ? `(${book.isbn})` : ""}`;

      // 🧠 Inform only — not blocking
      if (isAlreadyIssued) {
        label += " (Already Issued)";
      }

      if (isOutOfStock) {
        label += " (Out of Stock)";
      }

      return {
        value: book.id,
        label,
        subLabel: `Available: ${available} | Age: ${ageLabel}`,
        data: book,

        // ✅ Only stock controls disabling
        isDisabled: isOutOfStock,
      };
    });

    return [{
      label: selectedCard && memberAge !== null
        ? `Books for age ${memberAge} years (${booksToShow.length})`
        : `All Books (${booksToShow.length})`,
      options
    }];
  };


  const availableForSelect = (option) => {
    const b = option.data;

    if (b.available_copies !== undefined && parseInt(b.available_copies) <= 0) {
      return {
        ...option,
        isDisabled: true,
        label: `${b.title} ${b.isbn ? `(${b.isbn})` : ""} (Out of Stock)`,
        data: { ...b, isOutOfStock: true }
      };
    }


    return {
      ...option,
      data: { ...b, isOutOfStock: false }
    };
  };


  const showSuccessToast = (message) => {
    PubSub.publish("RECORD_SUCCESS_TOAST", {
      title: "Success",
      message: message,
    });
  };

  const showErrorToast = (message) => {
    PubSub.publish("RECORD_ERROR_TOAST", {
      title: "Error",
      message: message,
    });
  };

  const showWarningToast = (message) => {
    PubSub.publish("RECORD_WARNING_TOAST", {
      title: "Warning",
      message: message,
    });
  };

  const validateIssuance = () => {
    if (!selectedCard) {
      showErrorToast("Please select a library card first.");
      return false;
    }

    if (selectedBooks.length === 0) {
      showErrorToast("Please select at least one book to issue.");
      return false;
    }

    if (selectedBooks.length > dailyLimitCount) {
      showErrorToast(
        `Daily limit is ${dailyLimitCount} books per day. ` +
        `Currently selected: ${selectedBooks.length} books.`
      );
      return false;
    }

    const issuedTodayCount = computeIssuedTodayForCard(selectedCard.value);
    const availableToday = Math.max(0, dailyLimitCount - issuedTodayCount);

    if (selectedBooks.length > availableToday) {
      showErrorToast(
        `Daily limit is ${dailyLimitCount} books. ` +
        `Already issued today: ${issuedTodayCount}, ` +
        `Trying to issue: ${selectedBooks.length}. ` +
        `Available for today: ${availableToday}`
      );
      return false;
    }

    const bookIds = selectedBooks.map(b => b.value);
    const uniqueBookIds = [...new Set(bookIds)];
    if (bookIds.length !== uniqueBookIds.length) {
      showWarningToast("You have selected the same book multiple times. Please select only one copy of each book.");
      return false;
    }

    const issuedCount = computeIssuedCountForCard(selectedCard.value);
    const toIssueCount = selectedBooks.length;

    if (issuedCount + toIssueCount > totalAllowedBooks) {
      showErrorToast(
        `Maximum ${totalAllowedBooks} books allowed for this member. ` +
        `Already issued: ${issuedCount}, Trying to issue: ${toIssueCount}. ` +
        `(Plan max: ${systemMaxBooks} + Extra allowance: ${memberExtraAllowance})`
      );
      return false;
    }

    const alreadyIssuedBooks = [];
    selectedBooks.forEach(book => {
      if (isBookIssuedToSelectedCard(book.value)) {
        alreadyIssuedBooks.push(book.data.title);
      }
    });

    // if (alreadyIssuedBooks.length > 0) {
    //   showErrorToast(
    //     `Following books are already issued to this member: ${alreadyIssuedBooks.join(", ")}. ` +
    //     `Please remove them from selection.`
    //   );
    // return false;
    // }

    const unavailableBooks = [];
    selectedBooks.forEach(book => {
      const bookData = book.data;
      if (bookData.available_copies !== undefined && parseInt(bookData.available_copies) <= 0) {
        unavailableBooks.push(bookData.title);
      }
    });

    if (unavailableBooks.length > 0) {
      showErrorToast(
        `Following books are not available (no copies left): ${unavailableBooks.join(", ")}`
      );
      return false;
    }

    if (memberInfo && memberInfo.is_active !== undefined && !memberInfo.is_active) {
      showErrorToast("This library member is inactive. Please select an active member.");
      return false;
    }

    return true;
  };

  const handleIssue = async () => {
    if (!validateIssuance()) {
      return;
    }

    setProcessing(true);
    try {
      const successBooks = [];
      const failedBooks = [];
      const memberName = memberInfo ?
        `${memberInfo.first_name || ''} ${memberInfo.last_name || ''}`.trim() :
        "Unknown Member";

      for (const b of selectedBooks) {
        try {
          const body = {
            book_id: b.value,
            card_id: selectedCard.value,
            issue_date: issueDate,
            due_date: dueDate,
            condition_before: "Good",
            remarks: "",
          };

          const response = await helper.fetchWithAuth(
            `${constants.API_BASE_URL}/api/bookissue/issue`,
            "POST",
            JSON.stringify(body)
          );

          const result = await response.json();

          if (response.ok && result.success) {
            successBooks.push({
              title: b.data.title,
              data: result.data
            });
          } else {
            const errorMessage = extractErrorMessage(result);
            failedBooks.push({
              book: b.data.title,
              error: errorMessage,
              details: result.details || {}
            });
          }
        } catch (bookErr) {
          failedBooks.push({
            book: b.data.title,
            error: "Network error: " + bookErr.message,
            details: { network_error: bookErr.message }
          });
        }
      }

      if (successBooks.length > 0) {
        const successTitles = successBooks.map(b => b.title);
        const newIssuedCount = computeIssuedCountForCard(selectedCard.value) + successBooks.length;
        const remaining = Math.max(0, totalAllowedBooks - newIssuedCount);

        const planMaxUsed = Math.min(newIssuedCount, systemMaxBooks);
        const planMaxRemaining = Math.max(0, systemMaxBooks - planMaxUsed);

        const extraUsed = Math.max(0, newIssuedCount - systemMaxBooks);
        const extraRemaining = Math.max(0, memberExtraAllowance - extraUsed);

        const issuedToday = computeIssuedTodayForCard(selectedCard.value) + successBooks.length;
        const remainingToday = Math.max(0, dailyLimitCount - issuedToday);

        let extraMessage = "";
        if (memberExtraAllowance > 0) {
          extraMessage = ` (Plan: ${planMaxRemaining} remaining, Extra: ${extraRemaining} remaining)`;
        }

        showSuccessToast(
          `Successfully issued ${successBooks.length} book(s) to ${memberName}: ` +
          `${successTitles.join(", ")}. ` +
          `Remaining allowed: ${remaining}${extraMessage} ` +
          `Daily limit: ${issuedToday}/${dailyLimitCount} books (${remainingToday} remaining for today).`
        );
      }

      if (failedBooks.length > 0) {
        failedBooks.forEach(failed => {
          let errorMessage = `${failed.book}: ${failed.error}`;

          if (failed.details && typeof failed.details === 'object') {
            if (failed.details.currently_issued !== undefined && failed.details.member_allowed !== undefined) {
              errorMessage += ` (Issued: ${failed.details.currently_issued}, Allowed: ${failed.details.member_allowed})`;
            }
          }

          showErrorToast(errorMessage);
        });
      }

      if (failedBooks.length === 0) {
        setSelectedBooks([]);
        setRefreshTrigger(prev => prev + 1);
      } else {
        const remainingBooks = selectedBooks.filter(book =>
          !successBooks.some(success => success.title === book.data.title)
        );
        setSelectedBooks(remainingBooks);
        setRefreshTrigger(prev => prev + 1);
      }

    } catch (err) {
      console.error("Bulk issue error:", err);
      let errorMsg = err.message || "Failed to issue books. Please try again.";
      showErrorToast(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const issuedCountForSelectedCard = selectedCard
    ? computeIssuedCountForCard(selectedCard.value)
    : 0;

  const issuedTodayForSelectedCard = selectedCard
    ? computeIssuedTodayForCard(selectedCard.value)
    : 0;

  const remainingForCard = Math.max(
    0,
    totalAllowedBooks - issuedCountForSelectedCard
  );

  const remainingForToday = Math.max(
    0,
    dailyLimitCount - issuedTodayForSelectedCard
  );

  const planMaxUsed = Math.min(issuedCountForSelectedCard, systemMaxBooks);
  const planMaxRemaining = Math.max(0, systemMaxBooks - planMaxUsed);

  const extraUsed = Math.max(0, issuedCountForSelectedCard - systemMaxBooks);
  const extraRemaining = Math.max(0, memberExtraAllowance - extraUsed);

  const getIssuedBooksForSelectedCard = () => {
    if (!selectedCard) return [];
    return issuedBooks.filter(
      (i) => {
        const issCardId = i.card_id || i.cardId || i.library_card_id;
        return issCardId?.toString() === selectedCard.value.toString();
      }
    );
  };

  const cardOptions = libraryCards.map((c) => {
    const getFullName = () => {
      if (c.first_name || c.last_name) {
        return `${c.first_name || ''} ${c.last_name || ''}`.trim();
      } else if (c.user_name) {
        return c.user_name;
      } else if (c.student_name) {
        return c.student_name;
      } else if (c.name) {
        return c.name;
      }
      return "Unknown Member";
    };

    const fullName = getFullName();
    const cardNumber = c.card_number || "No Card Number";

    return {
      value: c.id,
      label: `${cardNumber} - ${fullName}`,
      subLabel: `Email: ${c.email || 'N/A'} | Phone: ${c.phone_number || 'N/A'}`,
      data: c,
    };
  });

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      borderColor: "#dee2e6",
      boxShadow: "none",
      "&:hover": { borderColor: "#8b5cf6" },
      padding: "4px",
      zIndex: 1,
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
      position: "absolute",
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "var(--primary-color)"
        : state.isFocused
          ? "#f3f0ff"
          : "white",
      color: state.isDisabled ? "#999" : "inherit",
      cursor: state.isDisabled ? "not-allowed" : "pointer",
    }),
  };
  const getImageUrl = (image) => {
    if (!image) return "/default-avatar.png";

  if (image.startsWith("http")) {
    return image;
  }
  const baseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:9028"
      : process.env.REACT_APP_API_URL;

    if (image.startsWith("http")) {
      return image;
    }
    // const baseUrl =
    //   process.env.NODE_ENV === "development"
    //     ? "http://localhost:3003"
    //     : process.env.REACT_APP_API_URL;

    // return `${baseUrl}${image}`;
  };
  const getMemberName = () => {
    if (!selectedCard) return "Unknown";

    if (memberInfo) {
      console.log("memberInfo", memberInfo);
      return `${memberInfo.first_name || ''} ${memberInfo.last_name || ''}`.trim() ||
        memberInfo.user_name ||
        memberInfo.student_name ||
        "Unknown Member";
    }

    const user = findUserByCardId(selectedCard.value);
    return user ? (user.name || user.full_name || user.username) :
      (selectedCard.data.user_name || selectedCard.data.student_name || "Unknown User");
  };


 const getMemberAge = () => {
  let dob = null;

  if (memberInfo) {
    dob = memberInfo.dob || memberInfo.date_of_birth;
  } else {
    const user = findUserByCardId(selectedCard?.value);
    dob = user?.dob || user?.date_of_birth || selectedCard?.data?.dob;
  }

  if (!dob) return "N/A";

  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // Adjust if birthday hasn't occurred yet this year
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};



  const limitsTooltip = (props) => (
    <Tooltip id="limits-tooltip" {...props}>
      <div className="text-start">
        <strong>Limits Breakdown:</strong>
        <div className="small">
          {memberPlan || memberSubscription ? (
            <>
              <div className="fw-bold text-success">Current Plan:</div>
              <div className="ps-2">
                <div>Plan: {memberPlan?.plan_name || memberSubscription?.plan_name || memberSubscription?.name || 'N/A'}</div>
                <div>Total Allowed: {systemMaxBooks} books</div>
                <div>Daily Limit: {dailyLimitCount} books per day</div>
                <div>Duration: {durationDays} days</div>
                <div>Status: {(memberPlan?.is_active || memberSubscription?.is_active) ? "Active ✓" : "Inactive ✗"}</div>
              </div>
              <hr className="my-1" />
            </>
          ) : (
            <>
              <div className="fw-bold text-dark">System Default:</div>
              <div className="ps-2">
                <div>No active subscription/plan</div>
                <div>Default Maximum: {systemMaxBooks} books</div>
                <div>Default Daily Limit: {dailyLimitCount} books per day</div>
                <div>Default Duration: {durationDays} days</div>
              </div>
              <hr className="my-1" />
            </>
          )}

          {memberExtraAllowance > 0 && (
            <>
              <div className="fw-bold text-dark">Personal Allowance:</div>
              <div className="ps-2">
                <div>Extra Books: {memberExtraAllowance} books</div>
              </div>
              <hr className="my-1" />
            </>
          )}

          <div className="fw-bold">Current Status:</div>
          <div className="ps-2">
            <div>Total Issued: {issuedCountForSelectedCard}</div>
            <div>From Plan/Default: {planMaxUsed}/{systemMaxBooks}</div>
            {memberExtraAllowance > 0 && (
              <div>From Extra Allowance: {extraUsed}/{memberExtraAllowance}</div>
            )}
            <div className="fw-bold mt-1">Can Issue More Today: {Math.min(remainingForCard, remainingForToday)}</div>
            <div className="text-success mt-1">Daily limit resets every day at midnight</div>
          </div>
        </div>
      </div>
    </Tooltip>
  );


  // if(!permissions?.allowCreate) {
  //   return  <PermissionDenied />;
  // }

  return (
    <Container
      fluid
      className="p-4"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      {loading ? (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "300px" }}
        >
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <Row>
          <Col lg={4} md={5} className="mb-4">
            <Card
              className="shadow-sm border-0 mb-4"
              style={{ borderRadius: "16px" }}
            >
              <Card.Body className="p-4">
                <h6 className="fw-bold text-uppercase text-muted small mb-3">
                  Step 1: Select Member
                </h6>
                <Select
                  options={cardOptions}
                  value={selectedCard}
                  onChange={(v) => {
                    setSelectedCard(v);
                    setSelectedBooks([]);
                    resetMemberInfo();
                  }}
                  isClearable
                  placeholder="Search by card number, name, email..."
                  styles={customSelectStyles}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  formatOptionLabel={({ label, subLabel, data }) => {
                    const parts = label.split(' - ');
                    const cardNumber = parts[0] || 'N/A';
                    const memberName = parts.slice(1).join(' - ') || 'Unknown Member';

                    return (
                      <div className="d-flex flex-column">
                        <div className="d-flex align-items-center">
                          <Badge
                            bg="primary"
                            className="me-2 px-2 py-1"
                            style={{
                              minWidth: '90px',
                              fontSize: '0.55rem',
                              fontWeight: 'bold'
                            }}
                          >
                            <i className="fa-solid fa-id-card me-1"></i>
                            {cardNumber}
                          </Badge>

                          <div className="fw-bold" style={{ flex: 1 }}>
                            {memberName}
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
              </Card.Body>
            </Card>

            <Card
              className="shadow-sm border-0"
              style={{
                borderRadius: "16px",
                background: selectedCard ? "white" : "#f1f3f5",
                opacity: selectedCard ? 1 : 0.7,
              }}
            >
              <Card.Body className="p-4">
                {!selectedCard ? (
                  <div className="py-4 text-muted text-center">
                    <i className="fa-solid fa-id-card fa-3x mb-3 text-secondary"></i>
                    <p className="mb-0">Select a card above to view member details</p>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-3">
                      <div className="mb-2">
                        <div
                          className="rounded-circle d-flex justify-content-center align-items-center mx-auto position-relative overflow-hidden"
                          style={{
                            width: "80px",
                            height: "80px",
                            border: "3px solid #8b5cf6",
                            backgroundColor: "#e9ecef"
                          }}
                        >
                          {memberInfo?.image ? (
                            <img
                              src={getImageUrl(memberInfo.image)}
                              alt={getMemberName()}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                position: "absolute"
                              }}
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                color: "#8b5cf6",
                                fontSize: "2.5rem",
                                fontWeight: "bold",
                                zIndex: 1
                              }}
                            >
                              {getMemberName()?.charAt(0).toUpperCase() || "?"}
                            </div>
                          )}
                        </div>
                      </div>

                      <h5 className="fw-bold mb-1">{getMemberName()}</h5>
                       <span className="fw-bold mb-1"> Age: {getMemberAge()}</span>
                    </div>

                    <Row className="g-2 mb-3">
                      <Col xs={4}>
                        <div className="b-none bg-light rounded-3">
                          <Button
                            variant=""
                            size="sm"
                            onClick={() => setShowIssuedBooks(!showIssuedBooks)}
                            className="mb-2"
                          >
                            <div className="small text-muted">
                              {showIssuedBooks} Issued Books
                            </div>
                            <div className="h5 mb-0 fw-bold text-dark">
                              {issuedCountForSelectedCard}
                            </div>
                          </Button>

                        </div>
                      </Col>
                      <Col xs={4}>
                        <div className="p-2 bg-light rounded-3">
                          <div className="small text-muted">Issued Today</div>
                          <div className="h5 mb-0 fw-bold text-dark">
                            {issuedTodayForSelectedCard}/{dailyLimitCount}
                          </div>
                        </div>
                      </Col>
                      <Col xs={4}>
                        <div className="p-2 bg-light rounded-3">
                          <div className="small text-muted">Total Allowed</div>
                          <div className="h5 mb-0 fw-bold text-dark">
                            {totalAllowedBooks}
                          </div>
                        </div>
                      </Col>
                    </Row>

                    <div>

                      {showIssuedBooks && (
                        <div className="mt-3 rounded">

                          <Table striped bordered hover size="sm">
                            <thead>
                              <tr>
                                <th>Title</th>
                                <th>Quantity</th>
                                <th>ISBN</th>
                                <th>Language</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getIssuedBooksForSelectedCard().map((issue, index) => {
                                const book = books.find(b => b.id?.toString() === (issue.book_id || issue.bookId)?.toString());
                                const title = book ? book.title : 'Unknown Book';
                                const isbn = book ? book.isbn : 'N/A';
                                const language = book ? book.language : 'N/A';
                                const quantity = issue.quantity || issue.qty || 1;

                                return (
                                  <tr key={index}>
                                    <td>{title}</td>
                                    <td>{quantity || 0}</td>
                                    <td>{isbn}</td>
                                    <td>{language}</td>
                                    <td>
                                      {issue.status === "issued" ? (
                                        <Badge bg="success">Issued</Badge>
                                      ) : issue.status === "submitted" ? (
                                        <Badge bg="secondary">Submitted</Badge>
                                      ) : (
                                        <Badge bg="danger">Cancelled</Badge>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </div>

                    <div className="text-start">
                      <div className="d-flex justify-content-between small mb-1">
                        <span>
                          Daily Limit: {issuedTodayForSelectedCard}/{dailyLimitCount}
                          {memberExtraAllowance > 0 && (
                            <span className="ms-1 text-success">
                              (Total: {systemMaxBooks} + {memberExtraAllowance})
                            </span>
                          )}
                        </span>
                        <span>
                          {totalAllowedBooks > 0
                            ? Math.round((issuedCountForSelectedCard / totalAllowedBooks) * 100)
                            : 0}%
                        </span>
                      </div>
                      <ProgressBar
                        now={
                          totalAllowedBooks > 0
                            ? (issuedCountForSelectedCard / totalAllowedBooks) * 100
                            : 0
                        }
                        variant={
                          remainingForCard === 0 ? "danger" :
                            remainingForCard <= 2 ? "warning" : "primary"
                        }
                        style={{ height: "10px", borderRadius: "10px" }}
                      />
                      <div className="small text-muted mt-1">
                        <div className="d-flex justify-content-between">
                          <span>
                            {issuedCountForSelectedCard} of {totalAllowedBooks} books
                          </span>
                          <span>
                            {remainingForCard} books remaining
                          </span>
                        </div>
                        <div className="d-flex justify-content-between mt-1">
                          <span className="text-dark">
                            <i className="fa-solid fa-calendar-day me-1"></i>
                            Today: {issuedTodayForSelectedCard}/{dailyLimitCount}
                          </span>
                          <span className="text-success">
                            Available today: {remainingForToday}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedCard && remainingForToday === 0 && remainingForCard > 0 && (
                      <Alert variant="warning" className="mt-3 small p-2">
                        <i className="fa-solid fa-triangle-exclamation me-1"></i>
                        Daily limit reached! Can issue {remainingForCard} more books tomorrow.
                      </Alert>
                    )}

                    {memberInfo && !memberInfo.is_active && (
                      <Alert variant="danger" className="mt-3 small p-2">
                        <i className="fa-solid fa-triangle-exclamation me-1"></i>
                        This member is inactive and cannot issue books.
                      </Alert>
                    )}

                    {/* {memberAge !== null && (
                      <Alert variant="info" className="mt-3 small p-2">
                        <i className="fa-solid fa-filter me-1"></i>
                        Books filtered for age {memberAge} years. Showing {filteredBooksByAge.length} of {books.length} books.
                      </Alert>
                    )} */}
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>


          <Col lg={8} md={7}>
            <Card
              className="shadow-sm border-0"
              style={{ borderRadius: "16px", height: "100%" }}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-uppercase text-muted small mb-0">
                    Step 2: Select Books
                  </h6>
                  {selectedBooks.length > 0 && (
                    <Badge bg="primary" pill>
                      {selectedBooks.length} Selected
                    </Badge>
                  )}
                </div>

                <div className="mb-4">
                  <Select
                    options={getBookOptions()}
                    isMulti
                    value={selectedBooks}
                    onChange={(v) => {
                      if (selectedCard && v) {
                        const availableToday = Math.max(0, dailyLimitCount - issuedTodayForSelectedCard);
                        const limitedSelection = v.slice(0, availableToday);

                        if (limitedSelection.length !== v.length) {
                          showErrorToast(
                            `Daily limit is ${dailyLimitCount} books. You can select only ${availableToday} more books today.`
                          );
                        }

                        const filtered = limitedSelection.filter((sel) => {
                          return !isBookIssuedToSelectedCard(sel.value);
                        });

                        if (filtered.length !== limitedSelection.length) {
                          showErrorToast(
                            "Some books are already issued to this member. They have been removed from selection."
                          );
                        }

                        setSelectedBooks(filtered || []);
                      } else {
                        setSelectedBooks(v || []);
                      }
                    }}
                    controlShouldRenderValue={false}
                    placeholder={
                      !selectedCard
                        ? "Select card first..."
                        : memberInfo && !memberInfo.is_active
                          ? "Member is inactive"
                          : Math.min(remainingForCard, remainingForToday) === 0
                            ? `Daily limit reached (${issuedTodayForSelectedCard}/${dailyLimitCount})`
                            : `Select up to ${Math.min(remainingForCard, remainingForToday) - selectedBooks.length} more book(s)... (${selectedBooks.length}/${Math.min(remainingForCard, remainingForToday)})`
                    }
                    isDisabled={
                      !selectedCard ||
                      (memberInfo && !memberInfo.is_active) ||
                      remainingForCard === 0 ||
                      remainingForToday === 0 ||
                      selectedBooks.length >= Math.min(remainingForCard, remainingForToday)
                    }
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    formatOptionLabel={({ label, subLabel, isDisabled, data }) => (
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex flex-column">
                          <span className={isDisabled ? "text-muted" : ""}>
                            {label}
                            {isDisabled && data?.issuedToCurrentMember && (
                              <i className="fa-solid fa-user-check ms-2 text-danger" title="Already issued to this member"></i>
                            )}
                            {isDisabled && data?.isOutOfStock && (
                              <i className="fa-solid fa-box-open ms-2 text-warning" title="Out of stock"></i>
                            )}
                          </span>
                          {data?.min_age !== undefined && data?.max_age !== undefined && (
                            <small className="text-dark">
                              <i className="fa-solid fa-user-group me-1"></i>
                              Age: {data.min_age || 0} - {data.max_age || "Any"} years
                            </small>
                          )}
                          {isDisabled && data?.issuedToCurrentMember && (
                            <small className="text-danger">
                              <i className="fa-solid fa-ban me-1"></i>
                              Already issued to this member
                            </small>
                          )}
                          {isDisabled && data?.isOutOfStock && (
                            <small className="text-warning">
                              <i className="fa-solid fa-exclamation-circle me-1"></i>
                              No copies available
                            </small>
                          )}
                        </div>
                        <Badge
                          bg={isDisabled ? "secondary" :
                            parseInt(data?.available_copies) > 0 ? "success" : "danger"}
                          text={isDisabled ? "white" : "dark"}
                        >
                          {subLabel}
                        </Badge>
                      </div>
                    )}
                    formatGroupLabel={(group) => (
                      <div className="fw-bold text-primary">
                        {group.label}
                      </div>
                    )}
                  />

                  {!selectedCard && (
                    <Form.Text className="text-danger">
                      <i className="fa-solid fa-circle-info me-1"></i>
                      Please select a library card first.
                    </Form.Text>
                  )}

                  {selectedCard && memberInfo && !memberInfo.is_active && (
                    <Form.Text className="text-danger fw-bold">
                      <i className="fa-solid fa-circle-exclamation me-1"></i>
                      This member is inactive and cannot issue books.
                    </Form.Text>
                  )}

                  {selectedCard && (
                    <Form.Text className="text-dark small d-block mt-1">
                      <i className="fa-solid fa-lightbulb me-1"></i>
                      Already issued books are disabled. After successful issue, refresh the list to select them again.
                    </Form.Text>
                  )}

                  {selectedCard && memberAge !== null && (
                    <Form.Text className="text-info small d-block mt-1">
                      <i className="fa-solid fa-filter me-1"></i>
                      Showing books filtered for age {memberAge} years. {filteredBooksByAge.length} of {books.length} books available.
                    </Form.Text>
                  )}
                </div>

                <div className="mb-4">
                  {selectedBooks.length === 0 ? (
                    <div
                      className="text-center p-5 border rounded-3"
                      style={{
                        borderStyle: "dashed",
                        borderColor: "#dee2e6",
                        backgroundColor: "#f8f9fa",
                      }}
                    >
                      <i className="fa-solid fa-book-open text-muted fa-2x mb-2 opacity-50"></i>
                      <p className="text-muted mb-0">No books selected yet.</p>
                      {selectedCard && memberAge !== null && (
                        <p className="text-dark small mt-2">
                          Books filtered for age {memberAge} years
                        </p>
                      )}
                      {selectedCard && dailyLimitCount > 0 && (
                        <p className="text-dark small mt-2">
                          Daily limit: {dailyLimitCount} books per day
                        </p>
                      )}
                    </div>
                  ) : (
                    <Row className="g-3">
                      {selectedBooks.map((book) => (
                        <Col xl={6} key={book.value}>
                          <div className="p-3 border rounded-3 d-flex justify-content-between align-items-center position-relative bg-white shadow-sm">
                            <div className="d-flex align-items-center">
                              <div
                                className="me-3 d-flex align-items-center justify-content-center rounded bg-light"
                                style={{ width: "50px", height: "60px" }}
                              >
                                <i className="fa-solid fa-book text-primary fa-lg"></i>
                              </div>
                              <div>
                                <div
                                  className="fw-bold text-dark text-truncate"
                                  style={{ maxWidth: "200px" }}
                                >
                                  {book.data.title}
                                </div>
                                <div className="text-muted small">
                                  ISBN: {book.data.isbn || "N/A"}
                                </div>
                                <div className="text-muted small">
                                  Author: {book.data.author || "Unknown"}
                                </div>
                                {(book.data.min_age || book.data.max_age) && (
                                  <div className="text-dark small">
                                    <i className="fa-solid fa-user-group me-1"></i>
                                    Age: {book.data.min_age || "Any"} - {book.data.max_age || "Any"} years
                                  </div>
                                )}
                                <div className="small">
                                  <Badge bg={book.data.available_copies > 0 ? "success" : "danger"}>
                                    Available: {book.data.available_copies || 0}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="light"
                              className="text-danger border-0 shadow-none"
                              size="sm"
                              onClick={() =>
                                setSelectedBooks((prev) =>
                                  prev.filter((x) => x.value !== book.value)
                                )
                              }
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </Button>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  )}
                </div>

                <hr style={{ borderColor: "#f0f0f0" }} />

                <Row className="g-3 align-items-end">
                  <Col md={4}>
                    <Form.Label className="fw-bold small text-muted text-uppercase">
                      Issue Date
                    </Form.Label>
                    <Form.Control
                      type="date"
                      value={issueDate}
                      onChange={(e) => {
                        setIssueDate(e.target.value);
                        setAutoCalculated(false);
                      }}
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label className="fw-bold small text-muted text-uppercase">
                      Due Date
                    </Form.Label>
                    <Form.Control
                      type="date"
                      value={dueDate}
                      min={issueDate}
                      onChange={(e) => {
                        setDueDate(e.target.value);
                        setAutoCalculated(true);
                      }}
                    />
                  </Col>
                  <Col md={4}>
                    <Button
                      className="btn btn-custom "
                      style={{
                        backgroundColor: `var(--primary-color)`,
                      }}
                      onClick={handleIssue}
                      disabled={
                        processing ||
                        selectedBooks.length === 0 ||
                        !selectedCard ||
                        (memberInfo && !memberInfo.is_active) ||
                        (selectedCard && selectedBooks.length > Math.min(remainingForCard, remainingForToday))
                      }
                    >
                      {processing ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            className="me-2"
                          />{" "}
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className=" fa-solid fa-book me-2"></i>
                          Confirm Issue
                        </>
                      )}
                      <Form.Text className="m-1 text-white small">
                        {confirmDays} days
                      </Form.Text>
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default BulkIssue;