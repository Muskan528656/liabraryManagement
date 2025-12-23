

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Col,
  Container,
  Row,
  Badge,
  Button,
  Dropdown,
  Modal,
  Form
} from "react-bootstrap";
import Chart from "react-apexcharts";
import ScrollToTop from "./common/ScrollToTop";
import DataApi from "../api/dataApi";
import Loader from "./common/Loader";
import jwt_decode from "jwt-decode";
import DashboardApi from "../api/dashboardApi";
import { useNavigate } from "react-router-dom";

const PRIMARY_COLOR = "#4338ca";
const ACCENT_COLOR = "#6366f1";
const SUCCESS_COLOR = "#059669";
const WARNING_COLOR = "#f59e0b";
const DANGER_COLOR = "#dc2626";
const INFO_COLOR = "#8b5cf6";
const API_BASE_URL = "http://localhost:3001";
const styles = {
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
    background: "#fff",
    height: "100%",
    transition: "all 0.3s ease",
    overflow: "hidden",
  },
  interactiveCard: {
    cursor: "pointer",
  },
  cardHeader: {
    background: "transparent",
    borderBottom: "1px solid #f1f5f9",
    borderRadius: "16px 16px 0 0",
    padding: "12px 16px"
  },
  cardBody: {
    padding: "16px"
  },
  sectionTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "16px",
    marginTop: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    paddingLeft: "5px"
  }
};

const AlertCardHoverStyle = {
  "&:hover": {
    transform: "translateY(-3px)",
    boxShadow: "0 15px 40px rgba(0, 0, 0, 0.1)",
  }
};

const InteractiveCard = ({ children, style, onClick, ...props }) => {
  const [hover, setHover] = useState(false);
  return (
    <Card
      {...props}
      style={{
        ...styles.card,
        ...styles.interactiveCard,
        ...style,
        ...(hover ? AlertCardHoverStyle["&:hover"] : {}),
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      {children}
    </Card>
  );
};

const Dashboard = ({ userInfo: propUserInfo }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [filter, setFilter] = useState("all");
  const [booksData, setBooksData] = useState([]);
  const [issuesData, setIssuesData] = useState([]);
  const [upcomingDueMembers, setUpcomingDueMembers] = useState([]);
  const [metrics, setMetrics] = useState({
    dueSoonCount: 0,
    overdueCount: 0,
    fineCollectedThisMonth: 0,
    damagedCount: 0,
    totalBooks: 0,
    totalTitles: 0,
    availableBooks: 0,
    issuedBooks: 0,
    booksThisMonth: 0,
    totalSubmissions: 0,
    total_copies: 0,
  });

  const [cardDetails, setCardDetails] = useState([]);
  const [cardLimitSetting, setCardLimitSetting] = useState(6);
  const [categories, setCategories] = useState([]);
  const [topAvailableBooks, setTopAvailableBooks] = useState([]);
  const [latestMembers, setLatestMembers] = useState([]);
  const [booksByCategory, setBooksByCategory] = useState([]);

  const formatNumber = useCallback((num) => {
    if (num === null || num === undefined || isNaN(num)) return "0";
    return Number(num).toLocaleString('en-IN');
  }, []);

  const formatCurrency = useCallback((val) => {
    const n = Number(val);
    if (!isFinite(n)) return `₹0.00`;
    return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  useEffect(() => {
    const initializeUser = () => {
      let currentUserInfo = propUserInfo;
      if (!currentUserInfo) {
        try {
          const token = sessionStorage.getItem("token");
          if (token) {
            currentUserInfo = jwt_decode(token);
          }
        } catch (error) {
          console.error("Error decoding token:", error);
        }
      }
      setUserInfo(currentUserInfo);
      setUserRole(currentUserInfo?.userrole?.toUpperCase() || "ADMIN");
    };

    initializeUser();
  }, [propUserInfo]);

  useEffect(() => {
    let isMounted = true;

    const fetchAllDashboardData = async () => {
      try {
        setLoading(true);

        await Promise.all([
          fetchDashboardSummary(),
          fetchAlertMetrics(),
          fetchLibraryDetails(),
          fetchLatestMembers(),
          fetchAllBooks(),
          fetchAllIssues()
        ]);

      } catch (error) {
        console.error("Error in dashboard data fetch:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAllDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchAllBooks = async () => {
    try {
      const bookApi = new DataApi("book");
      const booksResp = await bookApi.fetchAll();
      const books = Array.isArray(booksResp?.data) ? booksResp.data :
        (booksResp?.data?.rows || booksResp || []);
      setBooksData(books);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  const fetchAllIssues = async () => {
    try {
      const issueApi = new DataApi("bookissue");
      const issuesResp = await issueApi.fetchAll();
      const issues = Array.isArray(issuesResp?.data) ? issuesResp.data :
        (issuesResp?.data?.rows || issuesResp || []);
      setIssuesData(issues);

      processUpcomingDueDates(issues);

    } catch (error) {
      console.error("Error fetching issues:", error);
    }
  };
  const processUpcomingDueDates = (issues) => {
    if (!Array.isArray(issues)) return;

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    dayAfterTomorrow.setHours(0, 0, 0, 0);

    const upcomingIssues = issues.filter(issue => {
      if (!issue.due_date) return false;
      const dueDate = new Date(issue.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= tomorrow && dueDate <= dayAfterTomorrow &&
        (issue.status === 'issued' || issue.status === 'active');
    });

    const membersMap = new Map();

    upcomingIssues.forEach(issue => {
      const memberId = issue.member_id || issue.card_id || issue.memberId;
      const dueDate = new Date(issue.due_date);

      if (!membersMap.has(memberId)) {
        membersMap.set(memberId, {
          id: memberId,
          // Map all possible name fields from issues API
          name: issue.member_name || issue.user_name || `${issue.member_firstname || ''} ${issue.member_lastname || ''}`.trim() || `Member ${memberId}`,
          email: issue.member_email || '',
          phone: issue.member_phone || '',
          due_date: formatDate(dueDate),
          due_count: 1,
          books: [issue.book_title || issue.title || 'Unknown Book'],
          card_number: issue.card_number || `CARD${memberId}`,
          status: 'Due Soon',
          // Use the actual image field from issues API
          image: issue.member_image || issue.profile_pic || getDefaultPhoto(memberId)
        });
      } else {
        const member = membersMap.get(memberId);
        member.due_count += 1;
        if (issue.book_title || issue.title) {
          member.books.push(issue.book_title || issue.title);
        }
      }
    });

    const membersList = Array.from(membersMap.values())
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 5);

    setUpcomingDueMembers(membersList);
  };
  // const processUpcomingDueDates = (issues) => {
  //   if (!Array.isArray(issues)) return;

  //   const now = new Date();
  //   const tomorrow = new Date(now);
  //   tomorrow.setDate(tomorrow.getDate() + 1);
  //   tomorrow.setHours(0, 0, 0, 0);

  //   const dayAfterTomorrow = new Date(now);
  //   dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  //   dayAfterTomorrow.setHours(0, 0, 0, 0);

  //   const upcomingIssues = issues.filter(issue => {
  //     if (!issue.due_date) return false;

  //     const dueDate = new Date(issue.due_date);
  //     dueDate.setHours(0, 0, 0, 0);

  //     return dueDate >= tomorrow && dueDate <= dayAfterTomorrow &&
  //       (issue.status === 'issued' || issue.status === 'active');
  //   });

  //   const membersMap = new Map();

  //   upcomingIssues.forEach(issue => {
  //     const memberId = issue.member_id || issue.card_id;
  //     const dueDate = new Date(issue.due_date);
  //     console.log("Processing issue for member ID:", memberId, "Due Date:", dueDate);
  //     console.log("Issue details:", issue);
  //     console.log("Current membersMap:", membersMap);
  //     if (!membersMap.has(memberId)) {
  //       membersMap.set(memberId, {
  //         id: memberId,
  //         name: issue.member_name || issue.user_name || `Member ${memberId}`,
  //         email: issue.member_email || '',
  //         phone: issue.member_phone || '',
  //         due_date: formatDate(dueDate),
  //         due_count: 1,
  //         books: [issue.book_title || 'Unknown Book'],
  //         card_number: issue.card_number || `CARD${memberId}`,
  //         status: 'Due Soon',
  //         image: issue.member_image || issue.profile_pic || getDefaultPhoto(memberId)
  //       });
  //     } else {
  //       const member = membersMap.get(memberId);
  //       member.due_count += 1;
  //       if (issue.book_title) {
  //         member.books.push(issue.book_title);
  //       }
  //     }
  //   });

  //   const membersList = Array.from(membersMap.values())
  //     .sort((a, b) => {
  //       const dateA = new Date(a.due_date);
  //       const dateB = new Date(b.due_date);
  //       return dateA - dateB;
  //     })
  //     .slice(0, 5);

  //   setUpcomingDueMembers(membersList);

  //   console.log("Upcoming Due Members:", upcomingDueMembers);
  // };

  const getDefaultPhoto = (id) => {

    const defaultPhotos = [
      "/default-user.png",
      "https://randomuser.me/api/portraits/men/32.jpg",
      "https://randomuser.me/api/portraits/women/44.jpg",
      "https://randomuser.me/api/portraits/men/67.jpg",
      "https://randomuser.me/api/portraits/women/65.jpg",
    ];
    return defaultPhotos[id % defaultPhotos.length];
  };

  const formatDate = (date) => {
    const options = {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-GB', options);
  };

  const getDueStatusColor = (dueDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return DANGER_COLOR;
    if (diffDays === 1) return WARNING_COLOR;
    return INFO_COLOR;
  }; const fetchLatestMembers = async () => {
    try {
      const memberApi = new DataApi("librarycard");
      const response = await memberApi.fetchAll();

      let members = [];
      if (response?.data) {
        members = Array.isArray(response.data) ? response.data : (response.data.rows || []);
      }

      // Properly map the API response fields
      const latestMembersSorted = members.map(member => ({
        id: member.id || member.member_id,
        // Check for various possible name fields
        name: `${member.firstname || member.first_name || member.name || ''} ${member.lastname || member.last_name || ''}`.trim() || `Member ${member.id}`,
        email: member.email || '',
        phone: member.phone || member.phone_number || '',
        created_at: member.created_at || member.createdAt,
        // Use the actual profile image field from your API
        image: member.image ? `/uploads/librarycards/${member.image}` : getDefaultPhoto(member.id),
        card_number: member.card_number || `CARD${member.id}`,
        status: member.status || 'active'
      }))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      console.log("Latest Members:", latestMembersSorted);

      setLatestMembers(latestMembersSorted);

    } catch (error) {
      console.error("Error fetching latest members:", error);
      // Keep minimal fallback
      setLatestMembers([]);
    }
  };

  // const fetchLatestMembers = async () => {
  //   try {
  //     const memberApi = new DataApi("librarycard");
  //     const response = await memberApi.fetchAll();

  //     let members = [];
  //     if (response?.data) {
  //       members = Array.isArray(response.data) ? response.data :
  //         (response.data.rows || []);
  //     }

  //     if (members.length === 0) {

  //       members = [
  //         {
  //           id: 1,
  //           firstname: "Alexander",
  //           lastname: "Perce",
  //           email: "alex@example.com",
  //           phone: "+91 98765 43210",
  //           created_at: new Date().toISOString(),
  //           updated_at: new Date().toISOString(),
  //           image: "https://randomuser.me/api/portraits/men/32.jpg",
  //           card_number: "LIB2024001",
  //           status: "active"
  //         }
  //       ];
  //     }

  //     const latestMembersSorted = members
  //       .sort((a, b) => {
  //         const dateA = new Date(a.updated_at || a.created_at);
  //         const dateB = new Date(b.updated_at || b.created_at);
  //         return dateB - dateA;
  //       })
  //       .slice(0, 5)
  //       .map(member => ({
  //         id: member.id,
  //         name: `${member.firstname || ''} ${member.lastname || ''}`.trim() || `Member ${member.id}`,
  //         email: member.email || '',
  //         phone: member.phone || '',
  //         created_at: member.created_at,
  //         updated_at: member.updated_at,
  //         image: member.image || member.profile_pic || getDefaultPhoto(member.id),
  //         card_number: member.card_number || `CARD${member.id}`,
  //         status: member.status || 'active'
  //       }));

  //     setLatestMembers(latestMembersSorted);

  //   } catch (error) {
  //     console.error("Error fetching latest members:", error);

  //     const fallbackMembers = [
  //       {
  //         id: 1,
  //         name: "Alexander Perce",
  //         email: "alex@example.com",
  //         phone: "+91 98765 43210",
  //         created_at: new Date().toISOString(),
  //         updated_at: new Date().toISOString(),
  //         image: "https://randomuser.me/api/portraits/men/32.jpg",
  //         card_number: "LIB2024001",
  //         status: "active"
  //       }
  //     ];
  //     setLatestMembers(fallbackMembers);
  //   }
  // };

  const fetchDashboardSummary = async () => {
    try {
      const libraryApi = new DataApi("library");
      const dashboardResponse = await libraryApi.get("/dashboard");

      if (dashboardResponse.data?.success) {
        const data = dashboardResponse.data.data;
        setDashboardData(data);
        if (data.summary) {
          setMetrics(prev => ({
            ...prev,
            totalBooks: data.summary.totalBooks || data.summary.total_copies || 0,
            totalTitles: data.summary.totalTitles || data.summary.total_books || 0,
            availableBooks: data.summary.availableBooks || data.summary.available_copies || 0,
            issuedBooks: data.summary.issuedBooks || data.summary.issued_copies || 0,
            booksThisMonth: data.summary.booksThisMonth || data.summary.books_this_month || 0,
            totalSubmissions: data.summary.totalSubmissions || data.summary.total_submissions || 0,
            total_copies: data.summary.totalCopies || data.summary.totalCopies || 0,
          }));
        }
        if (data.booksByCategory?.length > 0) {
          setBooksByCategory(data.booksByCategory);
          const topCategories = data.booksByCategory.slice(0, 5).map(item => ({
            name: item.category_name || "Unknown",
            icon: "fa-tag",
            count: parseInt(item.book_count || 0),
          }));
          setCategories(topCategories);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
    }
  };

  const fetchAlertMetrics = async () => {
    try {
      const resp = await DashboardApi.fetchAll();
      const data = resp?.data?.[0] || {};

      setMetrics(prev => ({
        ...prev,
        dueSoonCount: data.total_due_soon || 0,
        overdueCount: data.overdue_books || 0,
        fineCollectedThisMonth: data.fine_collected_this_month || 0,
        damagedCount: data.damaged_missing_books || 0,
      }));
    } catch (err) {
      console.error("Error fetching alert metrics:", err);
    }
  };

  const fetchLibraryDetails = async () => {
    try {
      const bookApi = new DataApi("book");
      const issueApi = new DataApi("bookissue");
      const settingsApi = new DataApi("librarysettings");
      const cardApi = new DataApi("librarycard");

      const booksResp = await bookApi.fetchAll();
      const books = Array.isArray(booksResp?.data) ? booksResp.data :
        (booksResp?.data?.rows || booksResp || []);

      let availableCopies = 0;
      const booksWithAvailability = [];

      if (Array.isArray(books)) {
        books.forEach((b) => {
          const total = Number(b.total_copies ?? b.totalCopies ?? 0) || 0;
          const available = Number(b.available_copies ?? b.availableCopies ?? total) || total;
          availableCopies += available;

          booksWithAvailability.push({
            title: b.title || "Unknown",
            available_copies: available,
            total_copies: total
          });
        });
      }

      const sortedBooks = [...booksWithAvailability]
        .sort((a, b) => b.available_copies - a.available_copies)
        .slice(0, 10);
      setTopAvailableBooks(sortedBooks);

      const issuesResp = await issueApi.get("/active");
      const activeIssues = Array.isArray(issuesResp?.data) ? issuesResp.data :
        (issuesResp?.data?.rows || issuesResp || []);
      const issuedCount = Array.isArray(activeIssues) ? activeIssues.length : 0;

      let cardLimit = 6;
      try {
        const settingsResp = await settingsApi.get("/all");
        const settingsData = settingsResp?.data?.data || settingsResp?.data || settingsResp;
        if (settingsData) {
          cardLimit = Number(
            settingsData.max_books_per_card ??
            settingsData.max_books ??
            settingsData.max_books_per_card?.setting_value
          ) || cardLimit;
        }
      } catch (err) {
        console.warn("Could not fetch card limit:", err);
      }

      setCardLimitSetting(cardLimit);

      await fetchCardDetails(cardApi, issueApi, cardLimit);

    } catch (error) {
      console.error("Error fetching library details:", error);
    }
  };

  const fetchCardDetails = async (cardApi, issueApi, currentLimit) => {
    try {
      const cardsResp = await cardApi.fetchAll();
      const issuesResp = await issueApi.get("/active");

      const cards = Array.isArray(cardsResp?.data) ? cardsResp.data :
        (cardsResp?.data?.rows || cardsResp || []);
      const activeIssues = Array.isArray(issuesResp?.data) ? issuesResp.data :
        (issuesResp?.data?.rows || issuesResp || []);

      const countsByCard = {};
      activeIssues.forEach((issue) => {
        const cid = issue.card_id || issue.cardId || issue.cardid;
        if (cid) {
          countsByCard[cid] = (countsByCard[cid] || 0) + 1;
        }
      });

      const details = cards.map((c) => {
        const issued = countsByCard[c.id] || 0;
        const remaining = Math.max(0, currentLimit - issued);
        return {
          id: c.id,
          user_name: c.user_name || c.userName || `Card ${c.card_number}` || "Unknown",
          issued: issued,
          remaining: remaining
        };
      });

      details.sort((a, b) => b.issued - a.issued);
      setCardDetails(details.slice(0, 10));

    } catch (error) {
      console.error("Error fetching card details:", error);
    }
  };

  const handleCardClick = (type) => {
    switch (type) {
      case 'dueSoon':
        navigate("/bookissue?filter=due_soon");
        break;
      case 'overdue':
        navigate("/bookissue?filter=overdue");
        break;
      default:
        navigate("/book");
    }
  };

  const handleMemberClick = (memberId) => {
    navigate(`/librarycard/${memberId}`);
  };

  const handleTopCategoriesClick = () => {
    navigate("/category");
  };

  const handleQuickStatsClick = () => {
    navigate("/book");
  };

  const handleUpcomingDueClick = () => {
    navigate("/bookissue?filter=due_soon");
  };

  const getChartConfig = (filename) => ({
    toolbar: {
      show: true,
      tools: {
        download: true,
        selection: true,
        zoom: true,
        zoomin: true,
        zoomout: true,
        pan: true,
        reset: true,
      },
      export: {
        csv: {
          filename: filename,
          headerCategory: "Category",
          columnDelimiter: ','
        },
        svg: {
          filename: filename
        },
        png: {
          filename: filename
        }
      }
    }
  });

  const funnelChartOptions = {
    chart: {
      type: 'bar',
      height: 320,
      fontFamily: 'inherit',
      toolbar: getChartConfig("Books_Highest_Available_Stock_Report").toolbar,
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: true
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        horizontal: true,
        barHeight: '70%',
        distributed: false,
        dataLabels: {
          position: 'center'
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val + " copies";
      },
      textAnchor: 'start',
      offsetX: 10,
      style: {
        fontSize: '11px',
        colors: ['#fff'],
        fontWeight: 600,
        fontFamily: 'inherit'
      }
    },
    xaxis: {
      categories: topAvailableBooks.map(b =>
        b.title.length > 18 ? b.title.substring(0, 18) + "..." : b.title
      ),
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '11px',
          fontFamily: 'inherit'
        }
      },
      title: {
        text: 'Available Copies',
        style: {
          color: '#64748b',
          fontSize: '12px',
          fontFamily: 'inherit',
          fontWeight: 600
        }
      },
      axisBorder: {
        show: true,
        color: '#e2e8f0'
      },
      axisTicks: {
        show: true,
        color: '#e2e8f0'
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#334155',
          fontWeight: 600,
          fontSize: '12px',
          fontFamily: 'inherit'
        }
      }
    },
    colors: [
      '#4f46e5', '#6366f1', '#818cf8', '#93c5fd', '#60a5fa',
      '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'
    ].reverse(),
    tooltip: {
      theme: 'light',
      style: {
        fontSize: '12px',
        fontFamily: 'inherit'
      },
      y: {
        formatter: (val) => `${val} copies available`,
        title: {
          formatter: (seriesName) => 'Available Copies:'
        }
      },
      x: {
        formatter: (val, { series, seriesIndex, dataPointIndex, w }) => {
          const book = topAvailableBooks[dataPointIndex];
          return `<strong>${book.title}</strong><br/>Total: ${book.total_copies} copies<br/>Available: ${book.available_copies} copies`;
        }
      }
    },
    legend: {
      show: false
    },
    grid: {
      show: true,
      borderColor: '#f1f5f9',
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    states: {
      hover: {
        filter: {
          type: 'darken',
          value: 0.8
        }
      },
      active: {
        filter: {
          type: 'darken',
          value: 0.7
        }
      }
    },
    responsive: [{
      breakpoint: 768,
      options: {
        chart: {
          height: 280
        },
        dataLabels: {
          enabled: false
        }
      }
    }]
  };

  const funnelChartSeries = [{
    name: 'Available Copies',
    data: topAvailableBooks.map(b => parseInt(b.available_copies || 0))
  }];

  const donutOptions = {
    chart: {
      type: "donut",
      height: 220,
      fontFamily: 'inherit',
      toolbar: getChartConfig("Inventory_Status_Report").toolbar,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    colors: [SUCCESS_COLOR, PRIMARY_COLOR],
    legend: {
      position: "bottom",
      fontSize: '12px',
      fontFamily: 'inherit',
      markers: {
        radius: 8,
        width: 12,
        height: 12
      },
      itemMargin: {
        horizontal: 8,
        vertical: 4
      },
      onItemClick: {
        toggleDataSeries: true
      },
      onItemHover: {
        highlightDataSeries: true
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        fontWeight: 600,
        fontFamily: 'inherit'
      },
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 1,
        opacity: 0.2
      },
      formatter: function (val, { seriesIndex, w }) {
        return w.config.series[seriesIndex] + '%';
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Copies',
              color: '#334155',
              fontWeight: 600,
              fontSize: '12px',
              fontFamily: 'inherit',
              formatter: () => formatNumber(metrics.totalBooks)
            },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: 700,
              color: '#1e293b',
              fontFamily: 'inherit',
              formatter: (val) => val + '%'
            }
          }
        }
      }
    },
    stroke: {
      width: 2,
      colors: ['#fff']
    },
    tooltip: {
      theme: "light",
      style: {
        fontSize: '12px',
        fontFamily: 'inherit'
      },
      y: {
        formatter: (val) => `${val}% (${formatNumber(Math.round((val / 100) * metrics.totalBooks))} copies)`,
        title: {
          formatter: (seriesName) => seriesName
        }
      }
    },
    responsive: [{
      breakpoint: 768,
      options: {
        chart: {
          height: 200
        },
        legend: {
          position: 'bottom',
          horizontalAlign: 'center'
        }
      }
    }]
  };

  const calculateDonutSeries = () => {
    if (metrics.totalBooks === 0) return [0, 0];
    const issuedPercentage = Math.round((metrics.issuedBooks / metrics.totalBooks) * 100);
    const availablePercentage = 100 - issuedPercentage;
    return [availablePercentage, issuedPercentage];
  };

  const donutChartSeries = calculateDonutSeries();

  const summaryCards = [
    {
      title: "Total Books",
      value: formatNumber(metrics.totalTitles || metrics.totalBooks),
      icon: "fa-book",
      color: PRIMARY_COLOR,
      bgColor: "#e0e7ff",
      type: "totalBooks"
    },
    {
      title: "Book Copies Availability",
      value: `${formatNumber(metrics.total_copies)}/${formatNumber(metrics.availableBooks)}`,
      icon: "fa-layer-group",
      color: ACCENT_COLOR,
      bgColor: "#e0e7ff",
      type: "copiesStatus"
    },
    {
      title: "Due Soon",
      value: formatNumber(metrics.dueSoonCount),
      icon: "fa-clock",
      color: WARNING_COLOR,
      bgColor: "#fff7ed",
      type: "dueSoon"
    },
    {
      title: "Overdue",
      value: formatNumber(metrics.overdueCount),
      icon: "fa-circle-exclamation",
      color: DANGER_COLOR,
      bgColor: "#fef2f2",
      type: "overdue"
    },
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <Loader />
      </div>
    );
  }

  if (userRole === "STUDENT") {
    return (
      <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "20px" }}>
        <ScrollToTop />
        <Container fluid>
          <Card style={{
            ...styles.card,
            background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${INFO_COLOR} 100%)`,
            color: "white",
            marginBottom: "30px",
            border: 'none'
          }}>
            <Card.Body className="p-4">
              <h1 className="fw-bolder mb-2" style={{ fontSize: '24px' }}>
                Welcome Back, {userInfo?.firstname || 'Student'}! 👋
              </h1>
              <p className="mb-0 opacity-75" style={{ fontSize: '16px' }}>
                Your personalized library dashboard is ready. Check your borrowed books and upcoming deadlines.
              </p>
            </Card.Body>
          </Card>

          <Row>
            <Col lg={8} className="mx-auto">
              <Card style={styles.card}>
                <Card.Header style={styles.cardHeader}>
                  <h5 className="fw-bold mb-0">Your Currently Issued Books</h5>
                </Card.Header>
                <Card.Body>
                  <div className="text-center py-5">
                    <i className="fa-solid fa-book-open-reader fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No books currently issued</p>
                    <button className="btn btn-primary mt-2" onClick={() => navigate("/book")}>
                      Browse Library
                    </button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "16px" }}>
      <ScrollToTop />
      <Container fluid className="px-2 py-2">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h6>
              📚 Real-time analytics for efficient library management
            </h6>
          </div>
        </div>

        {/* 1. Core Library Inventory - Clickable Cards */}
        <Row className="mb-3 g-2">
          {summaryCards.map((card, index) => (
            <Col xl={3} lg={6} md={6} sm={12} key={index}>
              <InteractiveCard
                onClick={() => handleCardClick(card.type)}
                style={card.type === "dueSoon" || card.type === "overdue" ? {
                  borderLeft: `4px solid ${card.color}`
                } : {}}
              >
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 text-uppercase" style={{
                        fontSize: "10px",
                        fontWeight: "700",
                        color: "#64748b"
                      }}>
                        {card.title}
                      </p>

                      {card.subtitle ? (
                        <div>
                          <h2 className="mb-0" style={{
                            color: card.color,
                            fontSize: "20px",
                            fontWeight: "800"
                          }}>
                            {card.value}
                          </h2>
                        </div>
                      ) : (
                        <h2 className="mb-0" style={{
                          color: card.color,
                          fontSize: "20px",
                          fontWeight: "800"
                        }}>
                          {card.value}
                        </h2>
                      )}
                    </div>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      backgroundColor: card.bgColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: "40px"
                    }}>
                      <i className={`fa-solid ${card.icon}`} style={{
                        fontSize: "18px",
                        color: card.color
                      }}></i>
                    </div>
                  </div>
                </Card.Body>
              </InteractiveCard>
            </Col>
          ))}
        </Row>

        {/* 2. Urgent Actions */}
        <div style={styles.sectionTitle}>
          <i className="fa-solid fa-bell" style={{ color: WARNING_COLOR, fontSize: '14px' }}></i>
          Urgent Actions
        </div>

        {/* 3. Main Charts Section */}
        <Row className="mb-3 g-2">
          {/* Latest Members Card */}
          <Col lg={4}>
            <InteractiveCard onClick={handleUpcomingDueClick}>
              <Card.Header style={styles.cardHeader}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '14px' }}>
                      Members with Upcoming Due Dates
                    </h6>
                    <small className="text-muted" style={{ fontSize: '11px' }}>
                      Due in next 48 hours
                    </small>
                  </div>
                  <Badge className="px-2 py-1" style={{
                    borderRadius: '30px',
                    fontSize: '9px',
                    fontWeight: 600,
                    background: WARNING_COLOR,
                    color: 'white'
                  }}>
                    {upcomingDueMembers.length} DUE
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="list-group list-group-flush">
                  {upcomingDueMembers.length > 0 ? (
                    upcomingDueMembers.slice(0, 5).map((member, idx) => {
                      const statusColor = getDueStatusColor(member.due_date);
                      return (
                        <div
                          key={member.id}
                          className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light"
                          style={{ cursor: "pointer" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMemberClick(member.id);
                          }}
                        >
                          <div className="d-flex align-items-center">
                            <div className="position-relative me-2">
                              <img
                                src={member.image}
                                alt={member.name}
                                onError={(e) => {
                                  console.log("Image failed to load:", member.image);
                                  e.target.onerror = null;
                                  e.target.src = `${API_BASE_URL}/uploads/librarycards/default-user.png`;
                                }}
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                  border: "2px solid #e2e8f0"
                                }}
                              />
                              <div style={{
                                position: "absolute",
                                bottom: 0,
                                right: 0,
                                width: "10px",
                                height: "10px",
                                borderRadius: "50%",
                                background: statusColor,
                                border: "2px solid white"
                              }}></div>
                            </div>
                            <div>
                              <p className="mb-0 fw-semibold" style={{ fontSize: '13px' }}>
                                {member.name}
                              </p>
                              <small className="text-muted" style={{ fontSize: '11px' }}>
                                <i className="fa-solid fa-calendar-days me-1"></i>
                                Due on <span style={{ color: statusColor, fontWeight: 600 }}>
                                  {member.due_date}
                                </span>
                              </small>
                              <small className="d-block text-muted" style={{ fontSize: '10px' }}>
                                <i className="fa-solid fa-book me-1"></i>
                                {member.due_count} book{member.due_count > 1 ? 's' : ''}
                              </small>
                            </div>
                          </div>
                          <div className="text-end">
                            <Badge style={{
                              background: statusColor,
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '9px'
                            }} className="rounded-pill px-2 py-1">
                              DUE SOON
                            </Badge>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-3 text-muted">
                      <i className="fa-solid fa-calendar-check fa-lg mb-2"></i>
                      <p className="mb-0" style={{ fontSize: '12px' }}>No upcoming due dates</p>
                    </div>
                  )}
                </div>
                <div className="px-2 py-1 border-top">
                  <div className="text-center">
                    <small className="fw-semibold" style={{ color: PRIMARY_COLOR, fontSize: '11px', cursor: 'pointer' }}>
                      <i className="fa-solid fa-magnifying-glass me-1"></i>
                      Click to view all due books
                    </small>
                  </div>
                </div>
              </Card.Body>
            </InteractiveCard>
          </Col>

          {/* Funnel Chart */}
          <Col lg={8}>
            <Card style={styles.card}>
              <Card.Header style={styles.cardHeader}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '14px' }}>Books with Highest Available Stock</h6>
                    <small className="text-muted" style={{ fontSize: '11px' }}>Top 10 books by available copies</small>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="p-2">
                {topAvailableBooks.length > 0 ? (
                  <Chart
                    options={funnelChartOptions}
                    series={funnelChartSeries}
                    type="bar"
                    height={280}
                  />
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center py-4 text-muted">
                    <i className="fa-solid fa-book-open-reader fa-2x mb-2"></i>
                    <small>No inventory data available</small>
                  </div>
                )}
                <div className="mt-2 text-center">
                  <small className="text-muted" style={{ fontSize: '10px' }}>
                    <i className="fa-solid fa-circle-info me-1"></i>
                    Hover for details | Click toolbar for export options (PNG, SVG, CSV)
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* 4. Secondary Analytics */}
        <Row className="g-2">
          {/* Top Categories - Clickable Card */}
          <Col lg={4}>
            <InteractiveCard onClick={handleTopCategoriesClick}>
              <Card.Header style={styles.cardHeader}>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '14px' }}>Top Categories by Stock</h6>
                  <Badge className="px-2 py-1" style={{
                    borderRadius: '30px',
                    fontSize: '9px',
                    fontWeight: 600,
                    background: PRIMARY_COLOR,
                    color: 'white',
                    cursor: 'pointer'
                  }}>
                    VIEW ALL
                  </Badge>
                </div>
                <small className="text-muted" style={{ fontSize: '11px' }}>Most populated categories</small>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="list-group list-group-flush">
                  {categories.length > 0 ? categories.slice(0, 5).map((cat, idx) => (
                    <div key={idx} className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
                      <div className="d-flex align-items-center">
                        <div className="me-2 rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: 32,
                            height: 32,
                            background: '#e0e7ff',
                            color: PRIMARY_COLOR
                          }}>
                          <i className={`fa-solid ${cat.icon}`}></i>
                        </div>
                        <span className="fw-semibold text-dark" style={{ fontSize: '13px' }}>
                          {cat.name.length > 18 ? cat.name.substring(0, 18) + "..." : cat.name}
                        </span>
                      </div>
                      <Badge style={{
                        background: PRIMARY_COLOR,
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '11px'
                      }} className="rounded-pill px-2 py-1">
                        {formatNumber(cat.count)}
                      </Badge>
                    </div>
                  )) : (
                    <div className="text-center py-3 text-muted">
                      <i className="fa-solid fa-tags fa-lg mb-2"></i>
                      <p className="mb-0" style={{ fontSize: '12px' }}>No category data available</p>
                    </div>
                  )}
                </div>
              </Card.Body>
            </InteractiveCard>
          </Col>

          {/* Donut Chart */}
          <Col lg={4}>
            <Card style={styles.card}>
              <Card.Body className="text-center p-2">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '14px' }}>
                    Books Copies Status
                  </h6>
                  <Badge className="px-2 py-1" style={{
                    borderRadius: '30px',
                    fontSize: '9px',
                    fontWeight: 600,
                    background: INFO_COLOR,
                    color: 'white'
                  }}>
                    DONUT CHART
                  </Badge>
                </div>
                <Chart
                  options={donutOptions}
                  series={donutChartSeries}
                  type="donut"
                  height={180}
                />
                <div className="mt-2">
                  <div className="d-flex justify-content-center align-items-center mb-1">
                    <div className="me-1" style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: SUCCESS_COLOR
                    }}></div>
                    <span className="text-muted small me-2" style={{ fontSize: '11px' }}>Available: {donutChartSeries[0]}%</span>
                    <div className="me-1" style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: PRIMARY_COLOR
                    }}></div>
                    <span className="text-muted small" style={{ fontSize: '11px' }}>Issued: {donutChartSeries[1]}%</span>
                  </div>
                  <h4 className="fw-bolder mt-1" style={{
                    color: WARNING_COLOR,
                    fontSize: '18px'
                  }}>
                    {donutChartSeries[1]}%
                  </h4>
                  <small className="text-muted" style={{ fontSize: '11px' }}>of total copies currently issued</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Dashboard;