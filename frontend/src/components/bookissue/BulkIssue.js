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
} from "react-bootstrap";
import Select from "react-select";
import DataApi from "../../api/dataApi";
import helper from "../common/helper";
import PubSub from "pubsub-js";
import * as constants from "../../constants/CONSTANT";

const BulkIssue = () => {
  const [books, setBooks] = useState([]);
  const [libraryCards, setLibraryCards] = useState([]);
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [librarySettings, setLibrarySettings] = useState({});
  const [subscriptions, setSubscriptions] = useState([]); // YEH ADD KARO

  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBooks, setSelectedBooks] = useState([]);

  const [durationDays, setDurationDays] = useState(7);
  const [systemMaxBooks, setSystemMaxBooks] = useState(6);
  const [memberExtraAllowance, setMemberExtraAllowance] = useState(0);
  const [totalAllowedBooks, setTotalAllowedBooks] = useState(6);

  // YEH NEW STATES ADD KARO
  const [subscriptionAllowedBooks, setSubscriptionAllowedBooks] = useState(0);
  const [memberPersonalAllowedBooks, setMemberPersonalAllowedBooks] = useState(0);
  const [memberSubscription, setMemberSubscription] = useState(null);

  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [memberInfo, setMemberInfo] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchAll();
  }, [refreshTrigger]);

  useEffect(() => {
    if (issueDate) {
      const duration = durationDays || 15;
      const d = new Date(issueDate);
      d.setDate(d.getDate() + duration);
      setDueDate(d.toISOString().split("T")[0]);
    }
  }, [issueDate, durationDays]);

  useEffect(() => {
    if (selectedCard) {
      loadMemberInfo(selectedCard.value);
    } else {
      resetMemberInfo();
    }
  }, [selectedCard, systemMaxBooks, subscriptions]); // subscriptions ko bhi dependency mein add karo

  // RESET MEMBER INFO FUNCTION ADD KARO
  const resetMemberInfo = () => {
    setMemberInfo(null);
    setMemberSubscription(null);
    setSubscriptionAllowedBooks(0);
    setMemberPersonalAllowedBooks(0);
    setMemberExtraAllowance(0);
    setTotalAllowedBooks(systemMaxBooks);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const bookApi = new DataApi("book");
      const cardApi = new DataApi("librarycard");
      const userApi = new DataApi("user");
      const issueApi = new DataApi("bookissue");
      const subscriptionApi = new DataApi("subscriptions");

      const [booksResp, cardsResp, usersResp, issuesResp, subscriptionResponse] =
        await Promise.all([
          bookApi.fetchAll(),
          cardApi.fetchAll(),
          userApi.fetchAll(),
          issueApi.fetchAll(),
          subscriptionApi.fetchAll()
        ]);

      console.log("Cards List Response:", cardsResp);
      console.log("Subscription Response:", subscriptionResponse);

      const booksList = normalize(booksResp);
      const cardsList = normalize(cardsResp);
      const usersList = normalize(usersResp);
      const issuesList = normalize(issuesResp);

      // Subscription data ko normalize karo
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

      console.log("Normalized Subscriptions:", subscriptionsList);

      setBooks(booksList);
      setUsers(usersList);
      setSubscriptions(subscriptionsList); // Subscriptions set karo

      // Sirf active cards filter karo
      const activeCards = cardsList.filter((c) =>
        c.is_active === true || c.is_active === "true" || c.is_active === 1
      );
      setLibraryCards(activeCards);

      const activeIssues = issuesList.filter(
        (issue) =>
          issue.status !== "returned" &&
          (issue.return_date == null || issue.return_date === undefined || issue.return_date === "")
      );
      setIssuedBooks(activeIssues);

      // System defaults set karo (agar settings API nahi hai to)
      setDurationDays(7);
      setSystemMaxBooks(6);
      setTotalAllowedBooks(6);

      // Cards list se kisi bhi member ka subscription check karo
      // First card jo subscription_id rakhta hai uska data show karte hain demo ke liye
      const cardWithSubscription = cardsList.find(card => card.subscription_id);

      if (cardWithSubscription && subscriptionsList.length > 0) {
        console.log("Found card with subscription:", cardWithSubscription);

        const matchedPlan = subscriptionsList.find(
          (p) => p.id === cardWithSubscription.subscription_id
        );

        if (matchedPlan) {
          console.log("Matched Subscription Plan:", matchedPlan);

          // Duration calculate karo (subscription ke start_date aur end_date se)
          if (matchedPlan.start_date && matchedPlan.end_date) {
            const start = new Date(matchedPlan.start_date);
            const end = new Date(matchedPlan.end_date);
            const dur = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            setDurationDays(dur);
            console.log("Subscription Duration:", dur, "days");
          }

          // Allowed books subscription se lo
          const maxBooks = Number(matchedPlan.allowed_books) || 0;
          setSystemMaxBooks(maxBooks);

          // Member ki personal allowance card list se lo
          const personalAllowance = Number(cardWithSubscription.allowed_books) || 0;

          // Total calculate karo: subscription allowed + personal allowance
          const totalAllowed = maxBooks + personalAllowance;
          setTotalAllowedBooks(totalAllowed);
          setMemberExtraAllowance(personalAllowance);

          console.log("Book Limits:", {
            subscriptionAllowed: maxBooks,
            personalAllowance: personalAllowance,
            totalAllowed: totalAllowed
          });
        } else {
          console.log("No matching plan found for subscription_id:", cardWithSubscription.subscription_id);
        }
      }

    } catch (err) {
      console.error("Error fetching lists:", err);
      showErrorToast("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Normalize function
  const normalize = (resp) => {
    console.log("Normalizing response:", resp);

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

        // Get member's personal allowed books (from library_members table)
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

        // Find member's subscription from subscriptions list
        let subscription = null;
        let subscriptionBooks = 0;

        if (member.subscription_id && subscriptions.length > 0) {
          subscription = subscriptions.find(
            sub => sub.id.toString() === member.subscription_id.toString()
          );

          if (subscription) {
            // Subscription se allowed_books lena hai
            subscriptionBooks = parseInt(subscription.allowed_books || 0);
            if (isNaN(subscriptionBooks) || subscriptionBooks < 0) {
              subscriptionBooks = 0;
            }

            // Check if subscription is active
            const isSubscriptionActive = subscription.is_active === true ||
              subscription.is_active === "true" ||
              subscription.is_active === 1;

            if (!isSubscriptionActive) {
              subscriptionBooks = 0;
              console.log("Subscription is inactive:", subscription.plan_name);
            }
          }
        }

        setMemberSubscription(subscription);
        setSubscriptionAllowedBooks(subscriptionBooks);


        let totalAllowed = 0;

        if (subscriptionBooks > 0) {

          totalAllowed = subscriptionBooks;
        } else {

          totalAllowed = systemMaxBooks;
        }


        if (personalAllowed > 0) {
          totalAllowed += personalAllowed;
        }

        setTotalAllowedBooks(totalAllowed);

        console.log("Member Info Loaded:", {
          memberName: `${member.first_name || ''} ${member.last_name || ''}`,
          cardNumber: member.card_number,
          subscriptionId: member.subscription_id,
          subscriptionPlan: subscription?.plan_name || "None",
          subscriptionBooks: subscriptionBooks,
          systemMaxBooks: systemMaxBooks,
          personalAllowed: personalAllowed,
          totalAllowed: totalAllowed,
          formula: `${subscriptionBooks > 0 ? subscriptionBooks : systemMaxBooks} ${personalAllowed > 0 ? `+ ${personalAllowed} = ${totalAllowed}` : ''}`
        });

      } else {
        console.warn("No member data found for card:", cardId);
        resetMemberInfo();
      }
    } catch (err) {
      console.error("Error loading member info:", err);
      resetMemberInfo();
    }
  };

  // const settingsRespTry = async (settingsApi) => {
  //   try {
  //     const r = await settingsApi.get("/all");
  //     console.log("R->>>>>>>>>>>>>>", r)
  //     if (r?.data && r.data.success && r.data.data) return r.data.data;
  //     return r?.data || r;
  //   } catch (e) {
  //     return null;
  //   }
  // };

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
        return issCardId?.toString() === cardId.toString();
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
          iss.status !== "returned" &&
          (iss.return_date == null || iss.return_date === undefined || iss.return_date === "")
        );
      }
    );
  };

  const availableForSelect = (option) => {
    const b = option.data;

    // Check available copies
    if (b.available_copies !== undefined && parseInt(b.available_copies) <= 0) {
      return {
        ...option,
        isDisabled: true,
        label: `${b.title} ${b.isbn ? `(${b.isbn})` : ""} (Out of Stock)`,
        data: { ...b, isOutOfStock: true, issuedToCurrentMember: false }
      };
    }

    if (selectedCard) {
      // Check if already issued to this card
      const alreadyIssued = isBookIssuedToSelectedCard(b.id);

      if (alreadyIssued) {
        return {
          ...option,
          isDisabled: true,
          label: `${b.title} ${b.isbn ? `(${b.isbn})` : ""} (Already Issued)`,
          data: { ...b, issuedToCurrentMember: true, isOutOfStock: false }
        };
      }

      // Check if already selected in current selection
      const alreadySelected = selectedBooks.some(sel => sel.value.toString() === b.id.toString());
      if (alreadySelected) {
        return {
          ...option,
          isDisabled: false,
          label: `${b.title} ${b.isbn ? `(${b.isbn})` : ""} (Selected)`,
          data: { ...b, alreadySelected: true, issuedToCurrentMember: false, isOutOfStock: false }
        };
      }
    }

    return {
      ...option,
      data: { ...b, issuedToCurrentMember: false, alreadySelected: false, isOutOfStock: false }
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
    // 1. Basic validation
    if (!selectedCard) {
      showErrorToast("Please select a library card first.");
      return false;
    }

    if (selectedBooks.length === 0) {
      showErrorToast("Please select at least one book to issue.");
      return false;
    }

    // 2. Check for duplicate book selection
    const bookIds = selectedBooks.map(b => b.value);
    const uniqueBookIds = [...new Set(bookIds)];
    if (bookIds.length !== uniqueBookIds.length) {
      showWarningToast("You have selected the same book multiple times. Please select only one copy of each book.");
      return false;
    }

    // 3. Get current issued count
    const issuedCount = computeIssuedCountForCard(selectedCard.value);
    const toIssueCount = selectedBooks.length;

    // 4. Check against total allowed books
    if (issuedCount + toIssueCount > totalAllowedBooks) {
      showErrorToast(
        `Maximum ${totalAllowedBooks} books allowed for this member. ` +
        `Already issued: ${issuedCount}, Trying to issue: ${toIssueCount}. ` +
        `(System max: ${systemMaxBooks} + Extra allowance: ${memberExtraAllowance})`
      );
      return false;
    }

    // 5. Check for already issued books
    const alreadyIssuedBooks = [];
    selectedBooks.forEach(book => {
      if (isBookIssuedToSelectedCard(book.value)) {
        alreadyIssuedBooks.push(book.data.title);
      }
    });

    if (alreadyIssuedBooks.length > 0) {
      showErrorToast(
        `Following books are already issued to this member: ${alreadyIssuedBooks.join(", ")}. ` +
        `Please remove them from selection.`
      );
      return false;
    }

    // 6. Check available copies
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

    // 7. Check if member is active
    if (memberInfo && memberInfo.is_active !== undefined && !memberInfo.is_active) {
      showErrorToast("This library member is inactive. Please select an active member.");
      return false;
    }

    return true;
  };

  const handleIssue = async () => {
    // Validate before proceeding
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
            failedBooks.push({
              book: b.data.title,
              error: result.message || result.error || "Unknown error",
              details: result.details || {}
            });
          }
        } catch (bookErr) {
          failedBooks.push({
            book: b.data.title,
            error: "Network error",
            details: { network_error: bookErr.message }
          });
        }
      }

      // Show success/error messages
      if (successBooks.length > 0) {
        const successTitles = successBooks.map(b => b.title);
        const newIssuedCount = computeIssuedCountForCard(selectedCard.value) + successBooks.length;
        const remaining = Math.max(0, totalAllowedBooks - newIssuedCount);

        // Calculate system max remaining and extra remaining
        const systemMaxUsed = Math.min(newIssuedCount, systemMaxBooks);
        const systemMaxRemaining = Math.max(0, systemMaxBooks - systemMaxUsed);

        const extraUsed = Math.max(0, newIssuedCount - systemMaxBooks);
        const extraRemaining = Math.max(0, memberExtraAllowance - extraUsed);

        let extraMessage = "";
        if (memberExtraAllowance > 0) {
          extraMessage = ` (System: ${systemMaxRemaining} remaining, Extra: ${extraRemaining} remaining)`;
        }

        showSuccessToast(
          `Successfully issued ${successBooks.length} book(s) to ${memberName}: ` +
          `${successTitles.join(", ")}. ` +
          `Remaining allowed: ${remaining}${extraMessage}`
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

      // Reset and refresh
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
      showErrorToast(
        err.message || "Failed to issue books. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  const issuedCountForSelectedCard = selectedCard
    ? computeIssuedCountForCard(selectedCard.value)
    : 0;

  // Calculate remaining books
  const remainingForCard = Math.max(
    0,
    totalAllowedBooks - issuedCountForSelectedCard
  );

  // Calculate how many from system max are used/remaining
  const systemMaxUsed = Math.min(issuedCountForSelectedCard, systemMaxBooks);
  const systemMaxRemaining = Math.max(0, systemMaxBooks - systemMaxUsed);

  // Calculate extra allowance used/remaining
  const extraUsed = Math.max(0, issuedCountForSelectedCard - systemMaxBooks);
  const extraRemaining = Math.max(0, memberExtraAllowance - extraUsed);

  const bookOptions = books.map((b) => ({
    value: b.id,
    label: `${b.title} ${b.isbn ? `(${b.isbn})` : ""}`,
    subLabel: `Available: ${b.available_copies || 0}`,
    data: b,
  }));

  const cardOptions = libraryCards.map((c) => ({
    value: c.id,
    label: `${c.card_number}`,
    subLabel: c.user_name || c.student_name || "Unknown",
    data: c,
  }));

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      borderColor: "#dee2e6",
      boxShadow: "none",
      "&:hover": { borderColor: "#8b5cf6" },
      padding: "4px",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#8b5cf6"
        : state.isFocused
          ? "#f3f0ff"
          : "white",
      color: state.isDisabled ? "#999" : "inherit",
      cursor: state.isDisabled ? "not-allowed" : "pointer",
    }),
  };

  const getMemberName = () => {
    if (!selectedCard) return "Unknown";

    if (memberInfo) {
      return `${memberInfo.first_name || ''} ${memberInfo.last_name || ''}`.trim() ||
        memberInfo.user_name ||
        memberInfo.student_name ||
        "Unknown Member";
    }

    const user = findUserByCardId(selectedCard.value);
    return user ? (user.name || user.full_name || user.username) :
      (selectedCard.data.user_name || selectedCard.data.student_name || "Unknown User");
  };

  // Tooltip for member limits
  const limitsTooltip = (props) => (
    <Tooltip id="limits-tooltip" {...props}>
      <div className="text-start">
        <strong>Limits Breakdown:</strong>
        <div className="small">
          {memberSubscription ? (
            <>
              <div className="fw-bold text-success">Subscription Plan:</div>
              <div className="ps-2">
                <div>Plan: {memberSubscription.plan_name}</div>
                <div>Allowed: {subscriptionAllowedBooks} books</div>
                <div>Status: {memberSubscription.is_active ? "Active ✓" : "Inactive ✗"}</div>
              </div>
              <hr className="my-1" />
            </>
          ) : (
            <>
              <div className="fw-bold text-info">System Default:</div>
              <div className="ps-2">
                <div>No active subscription</div>
                <div>System Maximum: {systemMaxBooks} books</div>
              </div>
              <hr className="my-1" />
            </>
          )}

          {memberExtraAllowance > 0 && (
            <>
              <div className="fw-bold text-info">Personal Allowance:</div>
              <div className="ps-2">
                <div>Extra Books: {memberExtraAllowance} books</div>
              </div>
              <hr className="my-1" />
            </>
          )}

          <div className="fw-bold">Current Status:</div>
          <div className="ps-2">
            <div>Currently Issued: {issuedCountForSelectedCard}</div>
            <div>From System Max: {systemMaxUsed}/{systemMaxBooks}</div>
            {memberExtraAllowance > 0 && (
              <div>From Extra Allowance: {extraUsed}/{memberExtraAllowance}</div>
            )}
            <div className="fw-bold mt-1">Can Issue More: {remainingForCard}</div>
          </div>
        </div>
      </div>
    </Tooltip>
  );

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
          {/* LEFT COLUMN: CARD SELECTION & STATS */}
          <Col lg={4} md={5} className="mb-4">
            {/* 1. Select Library Card */}
            <Card
              className="shadow-sm border-0 mb-4"
              style={{ borderRadius: "16px" }}
            >
              <Card.Body className="p-4">
                <h6 className="fw-bold text-uppercase text-muted small mb-3">
                  Step 1: Select Member
                </h6>
                <Form.Label className="fw-bold">Find Library Card</Form.Label>
                <Select
                  options={cardOptions}
                  value={selectedCard}
                  onChange={(v) => {
                    setSelectedCard(v);
                    setSelectedUser(null);
                    setSelectedBooks([]);
                    resetMemberInfo(); // resetMemberInfo use karo
                  }}
                  isClearable
                  placeholder="Search by card number or name..."
                  styles={customSelectStyles}
                  formatOptionLabel={({ label, subLabel }) => (
                    <div className="d-flex flex-column">
                      <span className="fw-bold">{label}</span>
                      <span className="small text-muted">{subLabel}</span>
                    </div>
                  )}
                />
              </Card.Body>
            </Card>

            {/* 2. Member Profile / Stats Preview */}
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
                      {/* Member Photo or Avatar */}
                      {memberInfo?.image ? (
                        <div className="mb-2">
                          <img
                            src={memberInfo.image}
                            alt={getMemberName()}
                            className="rounded-circle"
                            style={{
                              width: "80px",
                              height: "80px",
                              objectFit: "cover",
                              border: "3px solid #8b5cf6"
                            }}
                          />
                        </div>
                      ) : (
                        <div className="mb-2">
                          <i className="fa-solid fa-user-circle fa-3x text-primary"></i>
                        </div>
                      )}

                      <h5 className="fw-bold mb-1">
                        {getMemberName()}
                      </h5>

                      {/* Card Number */}
                      {memberInfo?.card_number && (
                        <div className="text-muted small mb-2">
                          <i className="fa-solid fa-id-card me-1"></i>
                          Card: {memberInfo.card_number}
                        </div>
                      )}

                      {/* Basic Contact Info in Compact Form */}
                      <div className="small text-muted">
                        {memberInfo?.email && (
                          <div className="mb-1">
                            <i className="fa-solid fa-envelope me-1"></i>
                            <span className="text-truncate d-inline-block" style={{ maxWidth: "200px" }}>
                              {memberInfo.email}
                            </span>
                          </div>
                        )}

                        {memberInfo?.phone_number && (
                          <div>
                            <i className="fa-solid fa-phone me-1"></i>
                            {memberInfo.phone_number}
                            {memberInfo?.country_code && (
                              <span className="ms-1">({memberInfo.country_code})</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Subscription Info Badge */}
                      {memberSubscription && (
                        <div className="mt-2">
                          <Badge
                            bg={memberSubscription.is_active ? "success" : "danger"}
                            className="mb-1"
                          >
                            {memberSubscription.plan_name}
                            {memberSubscription.is_active ? " ✓" : " ✗"}
                          </Badge>

                        </div>
                      )}


                    </div>

                    <hr className="my-3" style={{ borderColor: "#f0f0f0" }} />

                    {/* Limits Information */}
                    <div className="mb-3">
                      <div className="small text-muted">
                        {memberSubscription ? (
                          <div className="text-success fw-bold small mb-1">
                            <i className="fa-solid fa-crown me-1"></i>
                            Subscription: {memberSubscription.plan_name} ({subscriptionAllowedBooks} books)
                          </div>
                        ) : (
                          <div className="text-info small mb-1">
                            <i className="fa-solid fa-info-circle me-1"></i>
                            System Limit: {systemMaxBooks} books
                          </div>
                        )}
                        {memberExtraAllowance > 0 && (
                          <div className="text-success fw-bold small mb-1">
                            <i className="fa-solid fa-plus-circle me-1"></i>
                            Extra Allowance: +{memberExtraAllowance} books
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <Row className="g-2 mb-3">
                      <Col xs={4}>
                        <div className="p-2 bg-light rounded-3">
                          <div className="small text-muted">Currently Issued</div>
                          <div className="h5 mb-0 fw-bold text-primary">
                            {issuedCountForSelectedCard}
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
                      <Col xs={4}>
                        <div className="p-2 bg-light rounded-3">
                          <div className="small text-muted">Can Issue More</div>
                          <div className="h5 mb-0 fw-bold text-success">
                            {remainingForCard}
                          </div>
                        </div>
                      </Col>
                    </Row>

                    {/* Detailed Usage Breakdown */}
                    {/* <div className="mb-3 p-3 bg-light rounded-3">
                      <div className="small text-muted mb-2">Usage Breakdown:</div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="small">
                          {memberSubscription ? 'Subscription' : 'System'} Limit ({systemMaxBooks}):
                        </span>
                        <span className="small fw-bold">
                          {systemMaxUsed}/{systemMaxBooks} books
                        </span>
                      </div>
                      {memberExtraAllowance > 0 && (
                        <div className="d-flex justify-content-between mb-1">
                          <span className="small text-success">Extra Allowance ({memberExtraAllowance}):</span>
                          <span className="small fw-bold text-success">
                            {extraUsed}/{memberExtraAllowance} books
                          </span>
                        </div>
                      )}
                      <div className="d-flex justify-content-between mt-2 pt-2 border-top">
                        <span className="small fw-bold">Total Used:</span>
                        <span className="small fw-bold">
                          {issuedCountForSelectedCard}/{totalAllowedBooks} books
                        </span>
                      </div>
                    </div> */}

                    {/* Progress Bar */}
                    <div className="text-start">
                      <div className="d-flex justify-content-between small mb-1">
                        <span>
                          Overall Usage
                          {memberExtraAllowance > 0 && (
                            <span className="ms-1 text-success">
                              ({systemMaxBooks} + {memberExtraAllowance})
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
                      </div>
                    </div>

                    {/* Warning if member is inactive */}
                    {memberInfo && !memberInfo.is_active && (
                      <Alert variant="danger" className="mt-3 small p-2">
                        <i className="fa-solid fa-triangle-exclamation me-1"></i>
                        This member is inactive and cannot issue books.
                      </Alert>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* RIGHT COLUMN: BOOK SELECTION & ACTION */}
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
                    options={bookOptions.map(availableForSelect)}
                    isMulti
                    value={selectedBooks}
                    onChange={(v) => {
                      if (selectedCard && v) {
                        // Filter out any books that are already issued to this member
                        const filtered = v.filter((sel) => {
                          return !isBookIssuedToSelectedCard(sel.value);
                        });

                        if (filtered.length !== v.length) {
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
                          : selectedBooks.length >= remainingForCard
                            ? `Limit Reached (${selectedBooks.length}/${totalAllowedBooks})`
                            : `Select up to ${remainingForCard - selectedBooks.length} more book(s)... (${selectedBooks.length}/${totalAllowedBooks})`
                    }
                    isDisabled={
                      !selectedCard ||
                      (memberInfo && !memberInfo.is_active) ||
                      remainingForCard === 0 ||
                      selectedBooks.length >= remainingForCard
                    }
                    styles={customSelectStyles}
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
                  />

                  {/* Helper messages */}
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

                  {selectedCard && memberInfo && memberInfo.is_active && selectedBooks.length >= remainingForCard && remainingForCard > 0 && (
                    <Form.Text className="text-warning fw-bold">
                      <i className="fa-solid fa-lock me-1"></i>
                      You have selected the maximum allowed books for this transaction.
                    </Form.Text>
                  )}

                  {selectedCard && remainingForCard === 0 && (
                    <Form.Text className="text-danger fw-bold">
                      <i className="fa-solid fa-ban me-1"></i>
                      This card has reached its issue limit.
                    </Form.Text>
                  )}

                  {/* Show limits info */}
                  {selectedCard && remainingForCard > 0 && (
                    <Form.Text className="text-muted small">
                      <i className="fa-solid fa-info-circle me-1"></i>
                      Member can issue {remainingForCard} more book(s).
                      <OverlayTrigger placement="top" overlay={limitsTooltip}>
                        <span className="ms-1 text-primary cursor-pointer">
                          (Total allowed: {totalAllowedBooks})
                        </span>
                      </OverlayTrigger>
                    </Form.Text>
                  )}

                  {/* Info about disabled books */}
                  {selectedCard && (
                    <Form.Text className="text-info small d-block mt-1">
                      <i className="fa-solid fa-lightbulb me-1"></i>
                      Already issued books are disabled. After successful issue, refresh the list to select them again.
                    </Form.Text>
                  )}
                </div>

                {/* SELECTED BOOKS GRID */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">
                    Books to be Issued
                    {selectedBooks.length > 0 && ` (${selectedBooks.length})`}
                  </h6>
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

                {/* DATES & CONFIRM */}
                <Row className="g-3 align-items-end">
                  <Col md={4}>
                    <Form.Label className="fw-bold small text-muted text-uppercase">
                      Issue Date
                    </Form.Label>
                    <Form.Control
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label className="fw-bold small text-muted text-uppercase">
                      Due Date
                    </Form.Label>
                    <Form.Control
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      min={issueDate}
                    />
                    <Form.Text className="text-muted small">
                      Duration: {durationDays} days
                    </Form.Text>
                  </Col>
                  <Col md={4}>
                    <Button
                      className="w-100 py-2 fw-bold text-white border-0"
                      style={{
                        background:
                          "linear-gradient(135deg, rgb(111, 66, 193) 0%, rgb(139, 92, 246) 100%)",
                        boxShadow: "0 4px 12px rgba(111, 66, 193, 0.3)",
                      }}
                      onClick={handleIssue}
                      disabled={
                        processing ||
                        selectedBooks.length === 0 ||
                        !selectedCard ||
                        (memberInfo && !memberInfo.is_active) ||
                        (selectedCard && selectedBooks.length > remainingForCard)
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
                          <i className="fa-solid fa-book me-2"></i>
                          Confirm Issue ({selectedBooks.length})
                        </>
                      )}
                    </Button>

                    {/* Summary info */}
                    {selectedBooks.length > 0 && selectedCard && (
                      <div className="mt-2 small text-center">
                        <span className="text-muted">
                          Issuing {selectedBooks.length} book(s) to {getMemberName()}
                        </span>
                        <br />
                        <span className="text-muted">
                          Will have {issuedCountForSelectedCard + selectedBooks.length} issued,
                          {Math.max(0, remainingForCard - selectedBooks.length)} remaining
                          <br />
                          (Total allowed: {totalAllowedBooks})
                          {memberExtraAllowance > 0 && (
                            <span className="text-success">
                              <br />
                              <i className="fa-solid fa-calculator me-1"></i>
                              {systemMaxBooks} ({memberSubscription ? 'Subscription' : 'System'}) + {memberExtraAllowance} (Extra) = {totalAllowedBooks}
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Info about refresh */}
                    {selectedCard && (
                      <div className="mt-2 small text-info text-center">
                        <i className="fa-solid fa-rotate me-1"></i>
                        List refreshes after successful issue
                      </div>
                    )}
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