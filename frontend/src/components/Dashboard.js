
// // // // /*
// // // // **@Author: Aabid 
// // // // **@Date: NOV-2025
// // // // */

// // // // import React, { useState, useEffect, useCallback } from "react";
// // // // import {
// // // //   Card,
// // // //   Col,
// // // //   Container,
// // // //   Row,
// // // //   Badge,
// // // //   Button,
// // // //   Dropdown,
// // // //   Modal,
// // // //   Table,
// // // //   Form
// // // // } from "react-bootstrap";
// // // // import Chart from "react-apexcharts";
// // // // import ScrollToTop from "./common/ScrollToTop";
// // // // import DataApi from "../api/dataApi";
// // // // import Loader from "./common/Loader";
// // // // import jwt_decode from "jwt-decode";
// // // // import DashboardApi from "../api/dashboardApi";
// // // // import ResizableTable from "./common/ResizableTable";

// // // // const PRIMARY_COLOR = "#4338ca";
// // // // const ACCENT_COLOR = "#6366f1";
// // // // const SUCCESS_COLOR = "#059669";
// // // // const WARNING_COLOR = "#f59e0b";
// // // // const DANGER_COLOR = "#dc2626";
// // // // const INFO_COLOR = "#8b5cf6";

// // // // const styles = {
// // // //   card: {
// // // //     border: "1px solid #e2e8f0",
// // // //     borderRadius: "16px",
// // // //     boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
// // // //     background: "#fff",
// // // //     height: "100%",
// // // //     transition: "all 0.3s ease",
// // // //     overflow: "hidden",
// // // //   },
// // // //   interactiveCard: {
// // // //     cursor: "pointer",
// // // //   },
// // // //   cardHeader: {
// // // //     background: "transparent",
// // // //     borderBottom: "1px solid #f1f5f9",
// // // //     borderRadius: "16px 16px 0 0",
// // // //     padding: "12px 16px"
// // // //   },
// // // //   cardBody: {
// // // //     padding: "16px"
// // // //   },
// // // //   sectionTitle: {
// // // //     fontSize: "15px",
// // // //     fontWeight: "600",
// // // //     color: "#0f172a",
// // // //     marginBottom: "16px",
// // // //     marginTop: "20px",
// // // //     display: "flex",
// // // //     alignItems: "center",
// // // //     gap: "10px",
// // // //     paddingLeft: "5px"
// // // //   },
// // // //   modalHeader: {
// // // //     background: `--primary-color`,
// // // //     color: "white",
// // // //     borderBottom: "none"
// // // //   }
// // // // };

// // // // const AlertCardHoverStyle = {
// // // //   "&:hover": {
// // // //     transform: "translateY(-3px)",
// // // //     boxShadow: "0 15px 40px rgba(0, 0, 0, 0.1)",
// // // //   }
// // // // };

// // // // const InteractiveCard = ({ children, style, onClick, ...props }) => {
// // // //   const [hover, setHover] = useState(false);
// // // //   return (
// // // //     <Card
// // // //       {...props}
// // // //       style={{
// // // //         ...styles.card,
// // // //         ...styles.interactiveCard,
// // // //         ...style,
// // // //         ...(hover ? AlertCardHoverStyle["&:hover"] : {}),
// // // //       }}
// // // //       onMouseEnter={() => setHover(true)}
// // // //       onMouseLeave={() => setHover(false)}
// // // //       onClick={onClick}
// // // //     >
// // // //       {children}
// // // //     </Card>
// // // //   );
// // // // };

// // // // const DetailModal = ({ show, handleClose, modalData }) => {
// // // //   const [searchTerm, setSearchTerm] = useState('');
// // // //   const [selectedItems, setSelectedItems] = useState([]);

// // // //   if (!modalData) return null;

// // // //   // Define formatCurrency function inside DetailModal
// // // //   const formatCurrency = (val) => {
// // // //     const n = Number(val);
// // // //     if (!isFinite(n)) return `₹0.00`;
// // // //     return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// // // //   };

// // // //   const formatValue = (value, isCurrency = false) => {
// // // //     if (isCurrency) {
// // // //       return formatCurrency(value);
// // // //     }
// // // //     if (typeof value === 'number') {
// // // //       return value.toLocaleString('en-IN');
// // // //     }
// // // //     return value;
// // // //   };

// // // //   const getModalContent = () => {
// // // //     switch (modalData.type) {
// // // //       case "totalBooks":
// // // //         return {
// // // //           title: "Total Books Details",
// // // //           description: "Complete inventory of all book titles in the library",
// // // //           icon: "fa-book",
// // // //           color: PRIMARY_COLOR,
// // // //           columns: [
// // // //             { key: 'serial', label: 'S.No', width: 80 },
// // // //             { key: 'title', label: 'Book Title', width: 200 },
// // // //             { key: 'author', label: 'Author', width: 150 },
// // // //             { key: 'category', label: 'Category', width: 120 },
// // // //             { key: 'isbn', label: 'ISBN', width: 120 },
// // // //             { key: 'total_copies', label: 'Total Copies', width: 100, align: 'right' },
// // // //             { key: 'available_copies', label: 'Available', width: 100, align: 'right' }
// // // //           ],
// // // //           data: modalData.data.books || [],
// // // //           summary: [
// // // //             { label: "Total Titles", value: modalData.data.totalTitles || 0 },
// // // //             { label: "Total Copies", value: modalData.data.total_copies || 0 },
// // // //             { label: "Categories", value: modalData.data.categories || 0 },
// // // //             { label: "Average Copies", value: modalData.data.avgCopies || "N/A" }
// // // //           ],
// // // //           exportFileName: "Total_Books_Report"
// // // //         };

// // // //       case "totalCopies":
// // // //         return {
// // // //           title: "Total Copies Details",
// // // //           description: "Detailed breakdown of all book copies in the library",
// // // //           icon: "fa-copy",
// // // //           color: ACCENT_COLOR,
// // // //           columns: [
// // // //             { key: 'serial', label: 'S.No', width: 80 },
// // // //             { key: 'title', label: 'Book Title', width: 200 },
// // // //             { key: 'total_copies', label: 'Total Copies', width: 100, align: 'right' },
// // // //             { key: 'available', label: 'Available', width: 100, align: 'right' },
// // // //             { key: 'issued', label: 'Issued', width: 100, align: 'right' },
// // // //             { key: 'reserved', label: 'Reserved', width: 100, align: 'right' },
// // // //             { key: 'damaged', label: 'Damaged/Lost', width: 100, align: 'right' }
// // // //           ],
// // // //           data: modalData.data.books || [],
// // // //           summary: [
// // // //             { label: "Available Copies", value: modalData.data.availableBooks || 0 },
// // // //             { label: "Issued Copies", value: modalData.data.issuedBooks || 0 },
// // // //             { label: "Reserved Copies", value: modalData.data.reserved || 0 },
// // // //             { label: "Damaged/Lost", value: modalData.data.damagedCount || 0 }
// // // //           ],
// // // //           exportFileName: "Total_Copies_Report"
// // // //         };

// // // //       case "availableCopies":
// // // //         return {
// // // //           title: "Available Copies Details",
// // // //           description: "Books currently available for issue",
// // // //           icon: "fa-book-open",
// // // //           color: SUCCESS_COLOR,
// // // //           columns: [
// // // //             { key: 'serial', label: 'S.No', width: 80 },
// // // //             { key: 'title', label: 'Book Title', width: 200 },
// // // //             { key: 'author', label: 'Author', width: 150 },
// // // //             { key: 'category', label: 'Category', width: 120 },
// // // //             { key: 'available_copies', label: 'Available Copies', width: 120, align: 'right' },
// // // //             { key: 'total_copies', label: 'Total Copies', width: 100, align: 'right' },
// // // //             { key: 'location', label: 'Location', width: 120 }
// // // //           ],
// // // //           data: modalData.data.books || [],
// // // //           summary: [
// // // //             { label: "Total Available", value: modalData.data.availableBooks || 0 },
// // // //             { label: "Available Titles", value: modalData.data.availableTitles || 0 },
// // // //             { label: "By Category", value: modalData.data.byCategory || "N/A" },
// // // //             { label: "New Arrivals", value: modalData.data.newArrivals || 0 }
// // // //           ],
// // // //           exportFileName: "Available_Copies_Report"
// // // //         };

// // // //       case "issuedCopies":
// // // //         return {
// // // //           title: "Issued Copies Details",
// // // //           description: "Books currently issued to members",
// // // //           icon: "fa-user-pen",
// // // //           color: WARNING_COLOR,
// // // //           columns: [
// // // //             { key: 'serial', label: 'S.No', width: 80 },
// // // //             { key: 'book_title', label: 'Book Title', width: 200 },
// // // //             { key: 'member_name', label: 'Member Name', width: 150 },
// // // //             { key: 'card_number', label: 'Card Number', width: 120 },
// // // //             { key: 'issue_date', label: 'Issue Date', width: 100 },
// // // //             { key: 'due_date', label: 'Due Date', width: 100 },
// // // //             { key: 'status', label: 'Status', width: 100 }
// // // //           ],
// // // //           data: modalData.data.issues || [],
// // // //           summary: [
// // // //             { label: "Total Issued", value: modalData.data.issuedBooks || 0 },
// // // //             { label: "Active Borrowers", value: modalData.data.activeBorrowers || 0 },
// // // //             { label: "Due Soon", value: modalData.data.dueSoonCount || 0 },
// // // //             { label: "Overdue", value: modalData.data.overdueCount || 0 }
// // // //           ],
// // // //           exportFileName: "Issued_Copies_Report"
// // // //         };

// // // //       case "dueSoon":
// // // //         return {
// // // //           title: "Due Soon Books",
// // // //           description: "Books that are due for return soon",
// // // //           icon: "fa-clock",
// // // //           color: WARNING_COLOR,
// // // //           columns: [
// // // //             { key: 'serial', label: 'S.No', width: 80 },
// // // //             { key: 'book_title', label: 'Book Title', width: 200 },
// // // //             { key: 'member_name', label: 'Member', width: 150 },
// // // //             { key: 'due_date', label: 'Due Date', width: 100 },
// // // //             { key: 'days_remaining', label: 'Days Remaining', width: 120, align: 'right' },
// // // //             { key: 'fine_amount', label: 'Fine if Overdue', width: 120, align: 'right', isCurrency: true },
// // // //             { key: 'contact', label: 'Contact', width: 120 }
// // // //           ],
// // // //           data: modalData.data.issues || [],
// // // //           summary: [
// // // //             { label: "Total Due Soon", value: modalData.data.count || 0 },
// // // //             { label: "Within 1 Day", value: modalData.data.within1Day || 0 },
// // // //             { label: "Within 3 Days", value: modalData.data.within3Days || 0 },
// // // //             { label: "Within 7 Days", value: modalData.data.within7Days || 0 }
// // // //           ],
// // // //           exportFileName: "Due_Soon_Books_Report"
// // // //         };

// // // //       case "overdue":
// // // //         return {
// // // //           title: "Overdue Books",
// // // //           description: "Books that are overdue for return",
// // // //           icon: "fa-circle-exclamation",
// // // //           color: DANGER_COLOR,
// // // //           columns: [
// // // //             { key: 'serial', label: 'S.No', width: 80 },
// // // //             { key: 'book_title', label: 'Book Title', width: 200 },
// // // //             { key: 'member_name', label: 'Member', width: 150 },
// // // //             { key: 'due_date', label: 'Due Date', width: 100 },
// // // //             { key: 'days_overdue', label: 'Days Overdue', width: 120, align: 'right' },
// // // //             { key: 'fine_amount', label: 'Fine Amount', width: 120, align: 'right', isCurrency: true },
// // // //             { key: 'contact', label: 'Contact', width: 120 }
// // // //           ],
// // // //           data: modalData.data.issues || [],
// // // //           summary: [
// // // //             { label: "Total Overdue", value: modalData.data.count || 0 },
// // // //             { label: "1-7 Days Overdue", value: modalData.data.overdue1to7 || 0 },
// // // //             { label: "8-30 Days Overdue", value: modalData.data.overdue8to30 || 0 },
// // // //             { label: "30+ Days Overdue", value: modalData.data.overdue30Plus || 0 }
// // // //           ],
// // // //           exportFileName: "Overdue_Books_Report"
// // // //         };

// // // //       case "fineCollected":
// // // //         return {
// // // //           title: "Fine Collection Details",
// // // //           description: "Fine collected this month",
// // // //           icon: "fa-indian-rupee-sign",
// // // //           color: SUCCESS_COLOR,
// // // //           columns: [
// // // //             { key: 'serial', label: 'S.No', width: 80 },
// // // //             { key: 'member_name', label: 'Member Name', width: 150 },
// // // //             { key: 'book_title', label: 'Book Title', width: 200 },
// // // //             { key: 'reason', label: 'Reason', width: 120 },
// // // //             { key: 'amount', label: 'Amount', width: 100, align: 'right', isCurrency: true },
// // // //             { key: 'payment_date', label: 'Payment Date', width: 100 },
// // // //             { key: 'payment_mode', label: 'Payment Mode', width: 120 }
// // // //           ],
// // // //           data: modalData.data.transactions || [],
// // // //           summary: [
// // // //             { label: "Total Collected", value: modalData.data.count || 0, isCurrency: true },
// // // //             { label: "From Overdue", value: modalData.data.fromOverdue || 0, isCurrency: true },
// // // //             { label: "From Damaged", value: modalData.data.fromDamaged || 0, isCurrency: true },
// // // //             { label: "From Lost", value: modalData.data.fromLost || 0, isCurrency: true }
// // // //           ],
// // // //           exportFileName: "Fine_Collection_Report"
// // // //         };

// // // //       case "damagedLost":
// // // //         return {
// // // //           title: "Damaged/Lost Books",
// // // //           description: "Books that are damaged or lost",
// // // //           icon: "fa-heart-crack",
// // // //           color: '#db2777',
// // // //           columns: [
// // // //             { key: 'serial', label: 'S.No', width: 80 },
// // // //             { key: 'book_title', label: 'Book Title', width: 200 },
// // // //             { key: 'type', label: 'Type', width: 100 },
// // // //             { key: 'reported_by', label: 'Reported By', width: 150 },
// // // //             { key: 'report_date', label: 'Report Date', width: 100 },
// // // //             { key: 'status', label: 'Status', width: 100 },
// // // //             { key: 'estimated_cost', label: 'Estimated Cost', width: 120, align: 'right', isCurrency: true }
// // // //           ],
// // // //           data: modalData.data.records || [],
// // // //           summary: [
// // // //             { label: "Total Damaged/Lost", value: modalData.data.count || 0 },
// // // //             { label: "Damaged Books", value: modalData.data.damaged || 0 },
// // // //             { label: "Lost Books", value: modalData.data.lost || 0 },
// // // //             { label: "Under Review", value: modalData.data.underReview || 0 }
// // // //           ],
// // // //           exportFileName: "Damaged_Lost_Books_Report"
// // // //         };

// // // //       case "latestMembers":
// // // //         return {
// // // //           title: "Latest Members",
// // // //           description: "Recently joined library members",
// // // //           icon: "fa-users",
// // // //           color: SUCCESS_COLOR,
// // // //           columns: [
// // // //             { key: 'serial', label: 'S.No', width: 80 },
// // // //             { key: 'name', label: 'Name', width: 150 },
// // // //             { key: 'email', label: 'Email', width: 200 },
// // // //             { key: 'phone', label: 'Phone', width: 120 },
// // // //             { key: 'join_date', label: 'Join Date', width: 100 },
// // // //             { key: 'card_number', label: 'Card Number', width: 120 },
// // // //             { key: 'status', label: 'Status', width: 100 }
// // // //           ],
// // // //           data: modalData.data.members || [],
// // // //           summary: [
// // // //             { label: "Total New Members", value: modalData.data.total || 0 },
// // // //             { label: "This Month", value: modalData.data.thisMonth || 0 },
// // // //             { label: "This Week", value: modalData.data.thisWeek || 0 },
// // // //             { label: "Today", value: modalData.data.today || 0 }
// // // //           ],
// // // //           exportFileName: "Latest_Members_Report"
// // // //         };

// // // //       case "topCategories":
// // // //         return {
// // // //           title: "Top Categories",
// // // //           description: "Most populated book categories",
// // // //           icon: "fa-tags",
// // // //           color: PRIMARY_COLOR,
// // // //           columns: [
// // // //             { key: 'serial', label: 'S.No', width: 80 },
// // // //             { key: 'name', label: 'Category Name', width: 150 },
// // // //             { key: 'book_count', label: 'Total Books', width: 100, align: 'right' },
// // // //             { key: 'total_copies', label: 'Total Copies', width: 100, align: 'right' },
// // // //             { key: 'available_copies', label: 'Available Copies', width: 120, align: 'right' },
// // // //             { key: 'percentage', label: 'Percentage', width: 100, align: 'right' },
// // // //             { key: 'popular_author', label: 'Popular Author', width: 150 }
// // // //           ],
// // // //           data: modalData.data.categories || [],
// // // //           summary: [
// // // //             { label: "Total Categories", value: modalData.data.totalCategories || 0 },
// // // //             { label: "Books in Top Categories", value: modalData.data.totalBooks || 0 },
// // // //             { label: "Average Books", value: modalData.data.avgBooks || "N/A" },
// // // //             { label: "Most Popular", value: modalData.data.topCategory || "N/A" }
// // // //           ],
// // // //           exportFileName: "Top_Categories_Report"
// // // //         };

// // // //       case "quickStats":
// // // //         return {
// // // //           title: "Quick Stats Details",
// // // //           description: "Detailed library activity statistics",
// // // //           icon: "fa-chart-line",
// // // //           color: INFO_COLOR,
// // // //           columns: [
// // // //             { key: 'serial', label: 'S.No', width: 80 },
// // // //             { key: 'activity', label: 'Activity', width: 200 },
// // // //             { key: 'count', label: 'Count', width: 100, align: 'right' },
// // // //             { key: 'percentage', label: 'Percentage', width: 100, align: 'right' },
// // // //             { key: 'trend', label: 'Trend', width: 80 },
// // // //             { key: 'last_updated', label: 'Last Updated', width: 120 },
// // // //             { key: 'remarks', label: 'Remarks', width: 120 }
// // // //           ],
// // // //           data: modalData.data.stats || [],
// // // //           summary: [
// // // //             { label: "New Books This Month", value: modalData.data.booksThisMonth || 0 },
// // // //             { label: "Active Borrowers", value: modalData.data.activeBorrowers || 0 },
// // // //             { label: "Utilization Rate", value: `${modalData.data.utilizationRate || 0}%` },
// // // //             { label: "Total Submissions", value: modalData.data.totalSubmissions || 0 }
// // // //           ],
// // // //           exportFileName: "Quick_Stats_Report"
// // // //         };

// // // //       default:
// // // //         return {
// // // //           title: "Details",
// // // //           description: "Detailed information",
// // // //           icon: "fa-info-circle",
// // // //           color: INFO_COLOR,
// // // //           columns: [],
// // // //           data: [],
// // // //           summary: [],
// // // //           exportFileName: "Report"
// // // //         };
// // // //     }
// // // //   };

// // // //   const content = getModalContent();

// // // //   // Add serial numbers to data
// // // //   const dataWithSerial = content.data.map((item, index) => ({
// // // //     ...item,
// // // //     serial: index + 1
// // // //   }));

// // // //   // Handle export functionality
// // // //   const handleExport = (format) => {
// // // //     const exportData = content.data.map((item, index) => {
// // // //       const row = { 'S.No': index + 1 };
// // // //       content.columns.forEach(col => {
// // // //         if (col.key !== 'serial') {
// // // //           const value = item[col.key];
// // // //           row[col.label] = col.isCurrency ? formatCurrency(value) : value;
// // // //         }
// // // //       });
// // // //       return row;
// // // //     });

// // // //     switch (format) {
// // // //       case 'csv':
// // // //         exportToCSV(exportData, content.exportFileName);
// // // //         break;
// // // //       case 'pdf':
// // // //         exportToPDF(exportData, content.title, content.description);
// // // //         break;
// // // //       case 'excel':
// // // //         exportToExcel(exportData, content.exportFileName);
// // // //         break;
// // // //     }
// // // //   };

// // // //   const exportToCSV = (data, filename) => {
// // // //     const headers = Object.keys(data[0] || {});
// // // //     const csvRows = [
// // // //       headers.join(','),
// // // //       ...data.map(row =>
// // // //         headers.map(header => {
// // // //           const cell = row[header];
// // // //           return typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell;
// // // //         }).join(',')
// // // //       )
// // // //     ];

// // // //     const csvContent = csvRows.join('\n');
// // // //     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
// // // //     const link = document.createElement('a');
// // // //     const url = URL.createObjectURL(blob);
// // // //     link.setAttribute('href', url);
// // // //     link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
// // // //     link.style.visibility = 'hidden';
// // // //     document.body.appendChild(link);
// // // //     link.click();
// // // //     document.body.removeChild(link);
// // // //   };

// // // //   const exportToPDF = (data, title, description) => {
// // // //     // For PDF export, we can use a simple approach or integrate with a PDF library
// // // //     const printContent = `
// // // //       <html>
// // // //         <head>
// // // //           <title>${title}</title>
// // // //           <style>
// // // //             body { font-family: Arial, sans-serif; }
// // // //             h1 { color: #333; }
// // // //             table { width: 100%; border-collapse: collapse; margin-top: 20px; }
// // // //             th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
// // // //             th { background-color: #f2f2f2; }
// // // //           </style>
// // // //         </head>
// // // //         <body>
// // // //           <h1>${title}</h1>
// // // //           <p>${description}</p>
// // // //           <p>Generated on: ${new Date().toLocaleString()}</p>
// // // //           <table>
// // // //             <thead>
// // // //               <tr>
// // // //                 ${Object.keys(data[0] || {}).map(key => `<th>${key}</th>`).join('')}
// // // //               </tr>
// // // //             </thead>
// // // //             <tbody>
// // // //               ${data.map(row => `
// // // //                 <tr>
// // // //                   ${Object.values(row).map(cell => `<td>${cell}</td>`).join('')}
// // // //                 </tr>
// // // //               `).join('')}
// // // //             </tbody>
// // // //           </table>
// // // //         </body>
// // // //       </html>
// // // //     `;

// // // //     const printWindow = window.open('', '_blank');
// // // //     printWindow.document.write(printContent);
// // // //     printWindow.document.close();
// // // //     printWindow.print();
// // // //   };

// // // //   const exportToExcel = (data, filename) => {
// // // //     // For Excel export, we can use CSV as Excel can open CSV files
// // // //     exportToCSV(data, filename);
// // // //   };

// // // //   // Custom cell renderer for status badges
// // // //   const renderStatusBadge = (value) => {
// // // //     let bgColor = 'secondary';
// // // //     if (value === 'Active' || value === 'Available') bgColor = 'success';
// // // //     else if (value === 'Issued' || value === 'Pending') bgColor = 'warning';
// // // //     else if (value === 'Overdue' || value === 'Damaged') bgColor = 'danger';

// // // //     return (
// // // //       <Badge bg={bgColor} className="rounded-pill">
// // // //         {value}
// // // //       </Badge>
// // // //     );
// // // //   };

// // // //   // Custom cell renderer for currency
// // // //   const renderCurrency = (value) => (
// // // //     <span className="fw-semibold" style={{ color: SUCCESS_COLOR }}>
// // // //       {formatCurrency(value)}
// // // //     </span>
// // // //   );

// // // //   // Custom cell renderer based on column type
// // // //   const cellRenderer = (column, value, row) => {
// // // //     if (column.key === 'status') {
// // // //       return renderStatusBadge(value);
// // // //     }
// // // //     if (column.isCurrency) {
// // // //       return renderCurrency(value);
// // // //     }
// // // //     return value || '-';
// // // //   };

// // // //   // Handle selection change
// // // //   const handleSelectionChange = (selected) => {
// // // //     setSelectedItems(selected);
// // // //   };

// // // //   // Custom actions renderer for export selected
// // // //   const actionsRenderer = (selectedItems) => (
// // // //     <>
// // // //       {selectedItems.length > 0 && (
// // // //         <Button
// // // //           variant="outline-primary"
// // // //           size="sm"
// // // //           onClick={() => {
// // // //             const selectedData = content.data.filter((_, index) =>
// // // //               selectedItems.includes(index)
// // // //             );
// // // //             console.log('Selected data for export:', selectedData);
// // // //             // You can implement export of selected items here
// // // //             alert(`${selectedItems.length} items selected for export`);
// // // //           }}
// // // //           className="me-2"
// // // //         >
// // // //           <i className="fa-solid fa-download me-1"></i>
// // // //           Export Selected ({selectedItems.length})
// // // //         </Button>
// // // //       )}
// // // //     </>
// // // //   );

// // // //   return (
// // // //     <Modal
// // // //       show={show}
// // // //       onHide={handleClose}
// // // //       size="xl"
// // // //       centered
// // // //       backdrop="static"
// // // //       fullscreen="lg-down"
// // // //     >
// // // //       <Modal.Header closeButton style={{ background: content.color }}>
// // // //         <Modal.Title className="d-flex align-items-center">
// // // //           <i className={`fa-solid ${content.icon} me-2`}></i>
// // // //           {content.title}
// // // //         </Modal.Title>
// // // //       </Modal.Header>
// // // //       <Modal.Body style={{ maxHeight: '70vh', overflow: 'auto' }}>
// // // //         <p className="text-muted mb-3">{content.description}</p>

// // // //         {/* Summary Cards */}
// // // //         <Row className="mb-4">
// // // //           {content.summary.map((item, idx) => (
// // // //             <Col md={3} key={idx} className="mb-3">
// // // //               <Card className="border-0 shadow-sm">
// // // //                 <Card.Body className="p-3">
// // // //                   <div className="d-flex align-items-center justify-content-between">
// // // //                     <div>
// // // //                       <p className="mb-1 text-uppercase" style={{
// // // //                         fontSize: "10px",
// // // //                         fontWeight: "600",
// // // //                         color: "#64748b"
// // // //                       }}>
// // // //                         {item.label}
// // // //                       </p>
// // // //                       <h5 className="mb-0" style={{
// // // //                         color: content.color,
// // // //                         fontWeight: "700"
// // // //                       }}>
// // // //                         {item.isCurrency ? formatCurrency(item.value) : formatValue(item.value)}
// // // //                       </h5>
// // // //                     </div>
// // // //                   </div>
// // // //                 </Card.Body>
// // // //               </Card>
// // // //             </Col>
// // // //           ))}
// // // //         </Row>

// // // //         {/* Search and Export Controls */}
// // // //         <div className="d-flex justify-content-between align-items-center mb-3">
// // // //           <div className="d-flex align-items-center gap-2">
// // // //             <div style={{ width: '300px' }}>
// // // //               <Form.Control
// // // //                 type="text"
// // // //                 placeholder="Search in table..."
// // // //                 value={searchTerm}
// // // //                 onChange={(e) => setSearchTerm(e.target.value)}
// // // //                 size="sm"
// // // //               />
// // // //             </div>
// // // //             <div className="text-muted small">
// // // //               Showing {dataWithSerial.length} records
// // // //             </div>
// // // //           </div>
// // // //           <div className="d-flex align-items-center gap-2">
// // // //             <Dropdown>
// // // //               <Dropdown.Toggle variant="primary" size="sm">
// // // //                 <i className="fa-solid fa-download me-1"></i>
// // // //                 Export
// // // //               </Dropdown.Toggle>
// // // //               <Dropdown.Menu>
// // // //                 <Dropdown.Item onClick={() => handleExport('csv')}>
// // // //                   <i className="fa-solid fa-file-csv me-2"></i>
// // // //                   Export as CSV
// // // //                 </Dropdown.Item>
// // // //                 <Dropdown.Item onClick={() => handleExport('excel')}>
// // // //                   <i className="fa-solid fa-file-excel me-2"></i>
// // // //                   Export as Excel
// // // //                 </Dropdown.Item>
// // // //                 <Dropdown.Item onClick={() => handleExport('pdf')}>
// // // //                   <i className="fa-solid fa-file-pdf me-2"></i>
// // // //                   Export as PDF
// // // //                 </Dropdown.Item>
// // // //               </Dropdown.Menu>
// // // //             </Dropdown>
// // // //           </div>
// // // //         </div>

// // // //         {/* Resizable Table */}
// // // //         <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
// // // //           <ResizableTable
// // // //             data={dataWithSerial}
// // // //             columns={content.columns}
// // // //             searchTerm={searchTerm}
// // // //             showSerialNumber={true}
// // // //             showCheckbox={true}
// // // //             showActions={true}
// // // //             cellRenderer={cellRenderer}
// // // //             actionsRenderer={actionsRenderer}
// // // //             selectedItems={selectedItems}
// // // //             onSelectionChange={handleSelectionChange}
// // // //             emptyMessage="No data available for this section"
// // // //             style={{ maxHeight: '400px', overflow: 'auto' }}
// // // //           />
// // // //         </div>

// // // //         {/* Table Info */}
// // // //         <div className="d-flex justify-content-between align-items-center mt-3">
// // // //           <div className="text-muted small">
// // // //             <i className="fa-solid fa-circle-info me-1"></i>
// // // //             Drag column borders to resize • Scroll horizontally to view all columns
// // // //           </div>
// // // //           <div className="text-muted small">
// // // //             Last Updated: {new Date().toLocaleDateString()}
// // // //           </div>
// // // //         </div>
// // // //       </Modal.Body>
// // // //       <Modal.Footer className="border-top-0">
// // // //         <Button variant="outline-secondary" onClick={handleClose}>
// // // //           Close
// // // //         </Button>
// // // //         <Button
// // // //           variant="primary"
// // // //           style={{ background: content.color, borderColor: content.color }}
// // // //           onClick={() => handleExport('csv')}
// // // //         >
// // // //           <i className="fa-solid fa-download me-2"></i>
// // // //           Export All Data
// // // //         </Button>
// // // //       </Modal.Footer>
// // // //     </Modal>
// // // //   );
// // // // };
// // // // const Dashboard = ({ userInfo: propUserInfo }) => {
// // // //   const [loading, setLoading] = useState(true);
// // // //   const [dashboardData, setDashboardData] = useState(null);
// // // //   const [userInfo, setUserInfo] = useState(null);
// // // //   const [userRole, setUserRole] = useState(null);
// // // //   const [filter, setFilter] = useState("all");
// // // //   const [showModal, setShowModal] = useState(false);
// // // //   const [modalData, setModalData] = useState(null);
// // // //   const [booksData, setBooksData] = useState([]);
// // // //   const [issuesData, setIssuesData] = useState([]);

// // // //   const [metrics, setMetrics] = useState({
// // // //     dueSoonCount: 0,
// // // //     overdueCount: 0,
// // // //     fineCollectedThisMonth: 0,
// // // //     damagedCount: 0,
// // // //     totalBooks: 0,
// // // //     totalTitles: 0,
// // // //     availableBooks: 0,
// // // //     issuedBooks: 0,
// // // //     booksThisMonth: 0,
// // // //     totalSubmissions: 0,
// // // //     total_copies: 0,
// // // //   });

// // // //   const [cardDetails, setCardDetails] = useState([]);
// // // //   const [cardLimitSetting, setCardLimitSetting] = useState(6);
// // // //   const [categories, setCategories] = useState([]);
// // // //   const [topAvailableBooks, setTopAvailableBooks] = useState([]);
// // // //   const [latestMembers, setLatestMembers] = useState([]);
// // // //   const [booksByCategory, setBooksByCategory] = useState([]);

// // // //   const formatNumber = useCallback((num) => {
// // // //     if (num === null || num === undefined || isNaN(num)) return "0";
// // // //     return Number(num).toLocaleString('en-IN');
// // // //   }, []);

// // // //   const formatCurrency = useCallback((val) => {
// // // //     const n = Number(val);
// // // //     if (!isFinite(n)) return `₹0.00`;
// // // //     return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// // // //   }, []);

// // // //   const dummyPhotos = [
// // // //     "https://randomuser.me/api/portraits/men/32.jpg",
// // // //     "https://randomuser.me/api/portraits/women/44.jpg",
// // // //     "https://randomuser.me/api/portraits/men/67.jpg",
// // // //     "https://randomuser.me/api/portraits/women/65.jpg",
// // // //     "https://randomuser.me/api/portraits/men/75.jpg"
// // // //   ];

// // // //   useEffect(() => {
// // // //     const initializeUser = () => {
// // // //       let currentUserInfo = propUserInfo;
// // // //       if (!currentUserInfo) {
// // // //         try {
// // // //           const token = sessionStorage.getItem("token");
// // // //           if (token) {
// // // //             currentUserInfo = jwt_decode(token);
// // // //           }
// // // //         } catch (error) {
// // // //           console.error("Error decoding token:", error);
// // // //         }
// // // //       }
// // // //       setUserInfo(currentUserInfo);
// // // //       setUserRole(currentUserInfo?.userrole?.toUpperCase() || "ADMIN");
// // // //     };

// // // //     initializeUser();
// // // //   }, [propUserInfo]);

// // // //   useEffect(() => {
// // // //     let isMounted = true;

// // // //     const fetchAllDashboardData = async () => {
// // // //       try {
// // // //         setLoading(true);

// // // //         await Promise.all([
// // // //           fetchDashboardSummary(),
// // // //           fetchAlertMetrics(),
// // // //           fetchLibraryDetails(),
// // // //           fetchLatestMembers(),
// // // //           fetchAllBooks(),
// // // //           fetchAllIssues()
// // // //         ]);

// // // //       } catch (error) {
// // // //         console.error("Error in dashboard data fetch:", error);
// // // //       } finally {
// // // //         if (isMounted) {
// // // //           setLoading(false);
// // // //         }
// // // //       }
// // // //     };

// // // //     fetchAllDashboardData();

// // // //     return () => {
// // // //       isMounted = false;
// // // //     };
// // // //   }, []);

// // // //   const fetchAllBooks = async () => {
// // // //     try {
// // // //       const bookApi = new DataApi("book");
// // // //       const booksResp = await bookApi.fetchAll();
// // // //       const books = Array.isArray(booksResp?.data) ? booksResp.data :
// // // //         (booksResp?.data?.rows || booksResp || []);
// // // //       setBooksData(books);
// // // //     } catch (error) {
// // // //       console.error("Error fetching books:", error);
// // // //     }
// // // //   };

// // // //   const fetchAllIssues = async () => {
// // // //     try {
// // // //       const issueApi = new DataApi("bookissue");
// // // //       const issuesResp = await issueApi.fetchAll();
// // // //       const issues = Array.isArray(issuesResp?.data) ? issuesResp.data :
// // // //         (issuesResp?.data?.rows || issuesResp || []);
// // // //       setIssuesData(issues);
// // // //     } catch (error) {
// // // //       console.error("Error fetching issues:", error);
// // // //     }
// // // //   };

// // // //   const fetchLatestMembers = () => {
// // // //     const membersData = [
// // // //       {
// // // //         id: 1,
// // // //         name: "Alexander Perce",
// // // //         email: "alex@example.com",
// // // //         phone: "+91 98765 43210",
// // // //         join_date: "12 Jan 2024",
// // // //         card_number: "LIB2024001",
// // // //         status: "Active",
// // // //         photo: dummyPhotos[0]
// // // //       },
// // // //       {
// // // //         id: 2,
// // // //         name: "Terley Norman",
// // // //         email: "terley@example.com",
// // // //         phone: "+91 98765 43211",
// // // //         join_date: "12 Jan 2024",
// // // //         card_number: "LIB2024002",
// // // //         status: "Active",
// // // //         photo: dummyPhotos[1]
// // // //       },
// // // //       {
// // // //         id: 3,
// // // //         name: "Tromsley Latex",
// // // //         email: "tromsley@example.com",
// // // //         phone: "+91 98765 43212",
// // // //         join_date: "12 Jan 2024",
// // // //         card_number: "LIB2024003",
// // // //         status: "Active",
// // // //         photo: dummyPhotos[2]
// // // //       },
// // // //       {
// // // //         id: 4,
// // // //         name: "John Browser",
// // // //         email: "john@example.com",
// // // //         phone: "+91 98765 43213",
// // // //         join_date: "12 Jan 2024",
// // // //         card_number: "LIB2024004",
// // // //         status: "Active",
// // // //         photo: dummyPhotos[3]
// // // //       },
// // // //       {
// // // //         id: 5,
// // // //         name: "Alexander Perce",
// // // //         email: "alex2@example.com",
// // // //         phone: "+91 98765 43214",
// // // //         join_date: "11 Jan 2024",
// // // //         card_number: "LIB2024005",
// // // //         status: "Active",
// // // //         photo: dummyPhotos[4]
// // // //       },
// // // //     ];
// // // //     setLatestMembers(membersData);
// // // //   };

// // // //   const fetchDashboardSummary = async () => {
// // // //     try {
// // // //       const libraryApi = new DataApi("library");
// // // //       const dashboardResponse = await libraryApi.get("/dashboard");

// // // //       if (dashboardResponse.data?.success) {
// // // //         const data = dashboardResponse.data.data;
// // // //         setDashboardData(data);
// // // //         if (data.summary) {
// // // //           setMetrics(prev => ({
// // // //             ...prev,
// // // //             totalBooks: data.summary.totalBooks || data.summary.total_copies || 0,
// // // //             totalTitles: data.summary.totalTitles || data.summary.total_books || 0,
// // // //             availableBooks: data.summary.availableBooks || data.summary.available_copies || 0,
// // // //             issuedBooks: data.summary.issuedBooks || data.summary.issued_copies || 0,
// // // //             booksThisMonth: data.summary.booksThisMonth || data.summary.books_this_month || 0,
// // // //             totalSubmissions: data.summary.totalSubmissions || data.summary.total_submissions || 0,
// // // //             total_copies: data.summary.totalCopies || data.summary.totalCopies || 0,
// // // //           }));
// // // //         }
// // // //         if (data.booksByCategory?.length > 0) {
// // // //           setBooksByCategory(data.booksByCategory);
// // // //           const topCategories = data.booksByCategory.slice(0, 5).map(item => ({
// // // //             name: item.category_name || "Unknown",
// // // //             icon: "fa-tag",
// // // //             count: parseInt(item.book_count || 0),
// // // //           }));
// // // //           setCategories(topCategories);
// // // //         }
// // // //       }
// // // //     } catch (error) {
// // // //       console.error("Error fetching dashboard summary:", error);
// // // //     }
// // // //   };

// // // //   const fetchAlertMetrics = async () => {
// // // //     try {
// // // //       const resp = await DashboardApi.fetchAll();
// // // //       const data = resp?.data?.[0] || {};

// // // //       setMetrics(prev => ({
// // // //         ...prev,
// // // //         dueSoonCount: data.total_due_soon || 0,
// // // //         overdueCount: data.overdue_books || 0,
// // // //         fineCollectedThisMonth: data.fine_collected_this_month || 0,
// // // //         damagedCount: data.damaged_missing_books || 0,
// // // //       }));
// // // //     } catch (err) {
// // // //       console.error("Error fetching alert metrics:", err);
// // // //     }
// // // //   };

// // // //   const fetchLibraryDetails = async () => {
// // // //     try {
// // // //       const bookApi = new DataApi("book");
// // // //       const issueApi = new DataApi("bookissue");
// // // //       const settingsApi = new DataApi("librarysettings");
// // // //       const cardApi = new DataApi("librarycard");

// // // //       const booksResp = await bookApi.fetchAll();
// // // //       const books = Array.isArray(booksResp?.data) ? booksResp.data :
// // // //         (booksResp?.data?.rows || booksResp || []);

// // // //       let availableCopies = 0;
// // // //       const booksWithAvailability = [];

// // // //       if (Array.isArray(books)) {
// // // //         books.forEach((b) => {
// // // //           const total = Number(b.total_copies ?? b.totalCopies ?? 0) || 0;
// // // //           const available = Number(b.available_copies ?? b.availableCopies ?? total) || total;
// // // //           availableCopies += available;

// // // //           booksWithAvailability.push({
// // // //             title: b.title || "Unknown",
// // // //             available_copies: available,
// // // //             total_copies: total
// // // //           });
// // // //         });
// // // //       }

// // // //       const sortedBooks = [...booksWithAvailability]
// // // //         .sort((a, b) => b.available_copies - a.available_copies)
// // // //         .slice(0, 10);
// // // //       setTopAvailableBooks(sortedBooks);

// // // //       const issuesResp = await issueApi.get("/active");
// // // //       const activeIssues = Array.isArray(issuesResp?.data) ? issuesResp.data :
// // // //         (issuesResp?.data?.rows || issuesResp || []);
// // // //       const issuedCount = Array.isArray(activeIssues) ? activeIssues.length : 0;

// // // //       let cardLimit = 6;
// // // //       try {
// // // //         const settingsResp = await settingsApi.get("/all");
// // // //         const settingsData = settingsResp?.data?.data || settingsResp?.data || settingsResp;
// // // //         if (settingsData) {
// // // //           cardLimit = Number(
// // // //             settingsData.max_books_per_card ??
// // // //             settingsData.max_books ??
// // // //             settingsData.max_books_per_card?.setting_value
// // // //           ) || cardLimit;
// // // //         }
// // // //       } catch (err) {
// // // //         console.warn("Could not fetch card limit:", err);
// // // //       }

// // // //       setCardLimitSetting(cardLimit);

// // // //       await fetchCardDetails(cardApi, issueApi, cardLimit);

// // // //     } catch (error) {
// // // //       console.error("Error fetching library details:", error);
// // // //     }
// // // //   };

// // // //   const fetchCardDetails = async (cardApi, issueApi, currentLimit) => {
// // // //     try {
// // // //       const cardsResp = await cardApi.fetchAll();
// // // //       const issuesResp = await issueApi.get("/active");

// // // //       const cards = Array.isArray(cardsResp?.data) ? cardsResp.data :
// // // //         (cardsResp?.data?.rows || cardsResp || []);
// // // //       const activeIssues = Array.isArray(issuesResp?.data) ? issuesResp.data :
// // // //         (issuesResp?.data?.rows || issuesResp || []);

// // // //       const countsByCard = {};
// // // //       activeIssues.forEach((issue) => {
// // // //         const cid = issue.card_id || issue.cardId || issue.cardid;
// // // //         if (cid) {
// // // //           countsByCard[cid] = (countsByCard[cid] || 0) + 1;
// // // //         }
// // // //       });

// // // //       const details = cards.map((c) => {
// // // //         const issued = countsByCard[c.id] || 0;
// // // //         const remaining = Math.max(0, currentLimit - issued);
// // // //         return {
// // // //           id: c.id,
// // // //           user_name: c.user_name || c.userName || `Card ${c.card_number}` || "Unknown",
// // // //           issued: issued,
// // // //           remaining: remaining
// // // //         };
// // // //       });

// // // //       details.sort((a, b) => b.issued - a.issued);
// // // //       setCardDetails(details.slice(0, 10));

// // // //     } catch (error) {
// // // //       console.error("Error fetching card details:", error);
// // // //     }
// // // //   };

// // // //   const handleCardClick = (cardType) => {
// // // //     let modalData = {
// // // //       type: cardType,
// // // //       data: { ...metrics }
// // // //     };

// // // //     // Generate sample data based on card type
// // // //     switch (cardType) {
// // // //       case "totalBooks":
// // // //         modalData.data = {
// // // //           ...modalData.data,
// // // //           categories: booksByCategory.length,
// // // //           avgCopies: metrics.totalTitles > 0 ?
// // // //             (metrics.total_copies / metrics.totalTitles).toFixed(1) : 0,
// // // //           books: booksData.slice(0, 20).map((book, index) => ({
// // // //             id: book.id || index + 1,
// // // //             title: book.title || `Book ${index + 1}`,
// // // //             author: book.author_name || book.author || "Unknown Author",
// // // //             category: book.category_name || book.category || "General",
// // // //             isbn: book.isbn || `ISBN-${1000 + index}`,
// // // //             total_copies: book.total_copies || book.totalCopies || 1,
// // // //             available_copies: book.available_copies || book.availableCopies || 0
// // // //           }))
// // // //         };
// // // //         break;

// // // //       case "totalCopies":
// // // //         modalData.data = {
// // // //           ...modalData.data,
// // // //           reserved: Math.floor(metrics.total_copies * 0.05),
// // // //           books: booksData.slice(0, 15).map((book, index) => ({
// // // //             id: book.id || index + 1,
// // // //             title: book.title || `Book ${index + 1}`,
// // // //             total_copies: book.total_copies || book.totalCopies || 1,
// // // //             available: book.available_copies || book.availableCopies || 0,
// // // //             issued: (book.total_copies || 1) - (book.available_copies || 0),
// // // //             reserved: Math.floor((book.total_copies || 1) * 0.05),
// // // //             damaged: Math.floor((book.total_copies || 1) * 0.02)
// // // //           }))
// // // //         };
// // // //         break;

// // // //       case "availableCopies":
// // // //         modalData.data = {
// // // //           ...modalData.data,
// // // //           availableTitles: topAvailableBooks.length,
// // // //           byCategory: categories.length,
// // // //           newArrivals: metrics.booksThisMonth,
// // // //           books: topAvailableBooks.slice(0, 15).map((book, index) => ({
// // // //             id: index + 1,
// // // //             title: book.title,
// // // //             author: `Author ${index + 1}`,
// // // //             category: categories[index % categories.length]?.name || "General",
// // // //             available_copies: book.available_copies,
// // // //             total_copies: book.total_copies,
// // // //             location: `Shelf ${String.fromCharCode(65 + (index % 5))}-${index + 1}`
// // // //           }))
// // // //         };
// // // //         break;

// // // //       case "issuedCopies":
// // // //         modalData.data = {
// // // //           ...modalData.data,
// // // //           activeBorrowers: cardDetails.length,
// // // //           issues: issuesData.slice(0, 15).map((issue, index) => ({
// // // //             id: issue.id || index + 1,
// // // //             book_title: issue.book_title || `Book ${index + 1}`,
// // // //             member_name: issue.member_name || `Member ${index + 1}`,
// // // //             card_number: issue.card_number || `CARD${1000 + index}`,
// // // //             issue_date: new Date().toISOString().split('T')[0],
// // // //             due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
// // // //             status: index % 3 === 0 ? "Active" : "Pending Return"
// // // //           }))
// // // //         };
// // // //         break;

// // // //       case "dueSoon":
// // // //         modalData.data = {
// // // //           ...modalData.data,
// // // //           within1Day: Math.floor(metrics.dueSoonCount * 0.3),
// // // //           within3Days: Math.floor(metrics.dueSoonCount * 0.5),
// // // //           within7Days: Math.floor(metrics.dueSoonCount * 0.2),
// // // //           issues: Array.from({ length: 10 }, (_, index) => ({
// // // //             id: `DUE${1000 + index}`,
// // // //             book_title: `Book Due ${index + 1}`,
// // // //             member_name: `Member ${index + 1}`,
// // // //             due_date: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
// // // //             days_remaining: index + 1,
// // // //             fine_amount: (index + 1) * 5,
// // // //             contact: `+91 98765 ${43210 + index}`
// // // //           }))
// // // //         };
// // // //         break;

// // // //       case "overdue":
// // // //         modalData.data = {
// // // //           ...modalData.data,
// // // //           overdue1to7: Math.floor(metrics.overdueCount * 0.6),
// // // //           overdue8to30: Math.floor(metrics.overdueCount * 0.3),
// // // //           overdue30Plus: Math.floor(metrics.overdueCount * 0.1),
// // // //           issues: Array.from({ length: 10 }, (_, index) => ({
// // // //             id: `OVD${1000 + index}`,
// // // //             book_title: `Overdue Book ${index + 1}`,
// // // //             member_name: `Member ${index + 1}`,
// // // //             due_date: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
// // // //             days_overdue: index + 1,
// // // //             fine_amount: (index + 1) * 10,
// // // //             contact: `+91 98765 ${43210 + index}`
// // // //           }))
// // // //         };
// // // //         break;

// // // //       case "fineCollected":
// // // //         modalData.data = {
// // // //           ...modalData.data,
// // // //           fromOverdue: Math.floor(metrics.fineCollectedThisMonth * 0.7),
// // // //           fromDamaged: Math.floor(metrics.fineCollectedThisMonth * 0.2),
// // // //           fromLost: Math.floor(metrics.fineCollectedThisMonth * 0.1),
// // // //           transactions: Array.from({ length: 15 }, (_, index) => ({
// // // //             id: `FINE${1000 + index}`,
// // // //             member_name: `Member ${index + 1}`,
// // // //             book_title: `Book ${index + 1}`,
// // // //             reason: index % 3 === 0 ? "Overdue" : index % 3 === 1 ? "Damaged" : "Lost",
// // // //             amount: (index + 1) * 50,
// // // //             payment_date: new Date().toISOString().split('T')[0],
// // // //             payment_mode: index % 2 === 0 ? "Cash" : "Online"
// // // //           }))
// // // //         };
// // // //         break;

// // // //       case "damagedLost":
// // // //         modalData.data = {
// // // //           ...modalData.data,
// // // //           damaged: Math.floor(metrics.damagedCount * 0.7),
// // // //           lost: Math.floor(metrics.damagedCount * 0.3),
// // // //           underReview: Math.floor(metrics.damagedCount * 0.2),
// // // //           records: Array.from({ length: 10 }, (_, index) => ({
// // // //             id: `DL${1000 + index}`,
// // // //             book_title: `Book ${index + 1}`,
// // // //             type: index % 2 === 0 ? "Damaged" : "Lost",
// // // //             reported_by: `Staff ${index + 1}`,
// // // //             report_date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
// // // //             status: index % 3 === 0 ? "Under Review" : "Resolved",
// // // //             estimated_cost: (index + 1) * 1000
// // // //           }))
// // // //         };
// // // //         break;

// // // //       case "latestMembers":
// // // //         modalData.data = {
// // // //           total: latestMembers.length,
// // // //           thisMonth: Math.floor(latestMembers.length * 1.5),
// // // //           thisWeek: latestMembers.length,
// // // //           today: Math.floor(latestMembers.length * 0.3),
// // // //           members: latestMembers.map((member, index) => ({
// // // //             id: member.id,
// // // //             name: member.name,
// // // //             email: member.email,
// // // //             phone: member.phone,
// // // //             join_date: member.join_date,
// // // //             card_number: member.card_number,
// // // //             status: member.status
// // // //           }))
// // // //         };
// // // //         break;

// // // //       case "topCategories":
// // // //         modalData.data = {
// // // //           totalCategories: booksByCategory.length,
// // // //           totalBooks: booksByCategory.reduce((sum, cat) => sum + (cat.book_count || 0), 0),
// // // //           avgBooks: booksByCategory.length > 0 ?
// // // //             (booksByCategory.reduce((sum, cat) => sum + (cat.book_count || 0), 0) / booksByCategory.length).toFixed(1) : 0,
// // // //           topCategory: booksByCategory[0]?.category_name || "N/A",
// // // //           categories: categories.map((cat, index) => ({
// // // //             id: index + 1,
// // // //             name: cat.name,
// // // //             book_count: cat.count,
// // // //             total_copies: cat.count * 3,
// // // //             available_copies: Math.floor(cat.count * 2.5),
// // // //             percentage: ((cat.count / metrics.totalTitles) * 100).toFixed(1),
// // // //             popular_author: `Author ${index + 1}`
// // // //           }))
// // // //         };
// // // //         break;

// // // //       case "quickStats":
// // // //         modalData.data = {
// // // //           booksThisMonth: metrics.booksThisMonth,
// // // //           activeBorrowers: cardDetails.length,
// // // //           utilizationRate: metrics.total_copies > 0 ?
// // // //             Math.round((metrics.issuedBooks / metrics.total_copies) * 100) : 0,
// // // //           totalSubmissions: metrics.totalSubmissions,
// // // //           stats: [
// // // //             { id: 1, activity: "New Books Added", count: metrics.booksThisMonth, percentage: "15%", trend: "↑", last_updated: "Today", remarks: "Good" },
// // // //             { id: 2, activity: "Books Issued", count: metrics.issuedBooks, percentage: "45%", trend: "→", last_updated: "Today", remarks: "Normal" },
// // // //             { id: 3, activity: "Overdue Books", count: metrics.overdueCount, percentage: "5%", trend: "↓", last_updated: "Today", remarks: "Improving" },
// // // //             { id: 4, activity: "Fine Collected", count: metrics.fineCollectedThisMonth, percentage: "100%", trend: "↑", last_updated: "This Month", remarks: "Excellent" },
// // // //             { id: 5, activity: "New Members", count: latestMembers.length, percentage: "12%", trend: "→", last_updated: "This Week", remarks: "Steady" }
// // // //           ]
// // // //         };
// // // //         break;
// // // //     }

// // // //     setModalData(modalData);
// // // //     setShowModal(true);
// // // //   };

// // // //   const handleCloseModal = () => {
// // // //     setShowModal(false);
// // // //     setModalData(null);
// // // //   };

// // // //   // Chart configuration function
// // // //   const getChartConfig = (filename) => ({
// // // //     toolbar: {
// // // //       show: true,
// // // //       tools: {
// // // //         download: true,
// // // //         selection: true,
// // // //         zoom: true,
// // // //         zoomin: true,
// // // //         zoomout: true,
// // // //         pan: true,
// // // //         reset: true,
// // // //       },
// // // //       export: {
// // // //         csv: {
// // // //           filename: filename,
// // // //           headerCategory: "Category",
// // // //           columnDelimiter: ','
// // // //         },
// // // //         svg: {
// // // //           filename: filename
// // // //         },
// // // //         png: {
// // // //           filename: filename
// // // //         }
// // // //       }
// // // //     }
// // // //   });

// // // //   const funnelChartOptions = {
// // // //     chart: {
// // // //       type: 'bar',
// // // //       height: 320,
// // // //       fontFamily: 'inherit',
// // // //       toolbar: getChartConfig("Books_Highest_Available_Stock_Report").toolbar,
// // // //       zoom: {
// // // //         enabled: true,
// // // //         type: 'x',
// // // //         autoScaleYaxis: true
// // // //       },
// // // //       animations: {
// // // //         enabled: true,
// // // //         easing: 'easeinout',
// // // //         speed: 800
// // // //       }
// // // //     },
// // // //     plotOptions: {
// // // //       bar: {
// // // //         borderRadius: 6,
// // // //         horizontal: true,
// // // //         barHeight: '70%',
// // // //         distributed: false,
// // // //         dataLabels: {
// // // //           position: 'center'
// // // //         }
// // // //       }
// // // //     },
// // // //     dataLabels: {
// // // //       enabled: true,
// // // //       formatter: function (val) {
// // // //         return val + " copies";
// // // //       },
// // // //       textAnchor: 'start',
// // // //       offsetX: 10,
// // // //       style: {
// // // //         fontSize: '11px',
// // // //         colors: ['#fff'],
// // // //         fontWeight: 600,
// // // //         fontFamily: 'inherit'
// // // //       }
// // // //     },
// // // //     xaxis: {
// // // //       categories: topAvailableBooks.map(b =>
// // // //         b.title.length > 18 ? b.title.substring(0, 18) + "..." : b.title
// // // //       ),
// // // //       labels: {
// // // //         style: {
// // // //           colors: '#64748b',
// // // //           fontSize: '11px',
// // // //           fontFamily: 'inherit'
// // // //         }
// // // //       },
// // // //       title: {
// // // //         text: 'Available Copies',
// // // //         style: {
// // // //           color: '#64748b',
// // // //           fontSize: '12px',
// // // //           fontFamily: 'inherit',
// // // //           fontWeight: 600
// // // //         }
// // // //       },
// // // //       axisBorder: {
// // // //         show: true,
// // // //         color: '#e2e8f0'
// // // //       },
// // // //       axisTicks: {
// // // //         show: true,
// // // //         color: '#e2e8f0'
// // // //       }
// // // //     },
// // // //     yaxis: {
// // // //       labels: {
// // // //         style: {
// // // //           colors: '#334155',
// // // //           fontWeight: 600,
// // // //           fontSize: '12px',
// // // //           fontFamily: 'inherit'
// // // //         }
// // // //       }
// // // //     },
// // // //     colors: [
// // // //       '#4f46e5', '#6366f1', '#818cf8', '#93c5fd', '#60a5fa',
// // // //       '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'
// // // //     ].reverse(),
// // // //     tooltip: {
// // // //       theme: 'light',
// // // //       style: {
// // // //         fontSize: '12px',
// // // //         fontFamily: 'inherit'
// // // //       },
// // // //       y: {
// // // //         formatter: (val) => `${val} copies available`,
// // // //         title: {
// // // //           formatter: (seriesName) => 'Available Copies:'
// // // //         }
// // // //       },
// // // //       x: {
// // // //         formatter: (val, { series, seriesIndex, dataPointIndex, w }) => {
// // // //           const book = topAvailableBooks[dataPointIndex];
// // // //           return `<strong>${book.title}</strong><br/>Total: ${book.total_copies} copies<br/>Available: ${book.available_copies} copies`;
// // // //         }
// // // //       }
// // // //     },
// // // //     legend: {
// // // //       show: false
// // // //     },
// // // //     grid: {
// // // //       show: true,
// // // //       borderColor: '#f1f5f9',
// // // //       xaxis: {
// // // //         lines: {
// // // //           show: true
// // // //         }
// // // //       },
// // // //       yaxis: {
// // // //         lines: {
// // // //           show: true
// // // //         }
// // // //       }
// // // //     },
// // // //     states: {
// // // //       hover: {
// // // //         filter: {
// // // //           type: 'darken',
// // // //           value: 0.8
// // // //         }
// // // //       },
// // // //       active: {
// // // //         filter: {
// // // //           type: 'darken',
// // // //           value: 0.7
// // // //         }
// // // //       }
// // // //     },
// // // //     responsive: [{
// // // //       breakpoint: 768,
// // // //       options: {
// // // //         chart: {
// // // //           height: 280
// // // //         },
// // // //         dataLabels: {
// // // //           enabled: false
// // // //         }
// // // //       }
// // // //     }]
// // // //   };

// // // //   const funnelChartSeries = [{
// // // //     name: 'Available Copies',
// // // //     data: topAvailableBooks.map(b => parseInt(b.available_copies || 0))
// // // //   }];
// // // //   const donutOptions = {
// // // //     chart: {
// // // //       type: "donut",
// // // //       height: 220,
// // // //       fontFamily: 'inherit',
// // // //       toolbar: getChartConfig("Inventory_Status_Report").toolbar,
// // // //       animations: {
// // // //         enabled: true,
// // // //         easing: 'easeinout',
// // // //         speed: 800
// // // //       }
// // // //     },
// // // //     colors: [SUCCESS_COLOR, PRIMARY_COLOR],
// // // //     legend: {
// // // //       position: "bottom",
// // // //       fontSize: '12px',
// // // //       fontFamily: 'inherit',
// // // //       markers: {
// // // //         radius: 8,
// // // //         width: 12,
// // // //         height: 12
// // // //       },
// // // //       itemMargin: {
// // // //         horizontal: 8,
// // // //         vertical: 4
// // // //       },
// // // //       onItemClick: {
// // // //         toggleDataSeries: true
// // // //       },
// // // //       onItemHover: {
// // // //         highlightDataSeries: true
// // // //       }
// // // //     },
// // // //     dataLabels: {
// // // //       enabled: true,
// // // //       style: {
// // // //         fontSize: '12px',
// // // //         fontWeight: 600,
// // // //         fontFamily: 'inherit'
// // // //       },
// // // //       dropShadow: {
// // // //         enabled: true,
// // // //         top: 1,
// // // //         left: 1,
// // // //         blur: 1,
// // // //         opacity: 0.2
// // // //       },
// // // //       formatter: function (val, { seriesIndex, w }) {
// // // //         return w.config.series[seriesIndex] + '%';
// // // //       }
// // // //     },
// // // //     plotOptions: {
// // // //       pie: {
// // // //         donut: {
// // // //           size: "65%",
// // // //           labels: {
// // // //             show: true,
// // // //             total: {
// // // //               show: true,
// // // //               label: 'Total Copies',
// // // //               color: '#334155',
// // // //               fontWeight: 600,
// // // //               fontSize: '12px',
// // // //               fontFamily: 'inherit',
// // // //               formatter: () => formatNumber(metrics.totalBooks)
// // // //             },
// // // //             value: {
// // // //               show: true,
// // // //               fontSize: '20px',
// // // //               fontWeight: 700,
// // // //               color: '#1e293b',
// // // //               fontFamily: 'inherit',
// // // //               formatter: (val) => val + '%'
// // // //             }
// // // //           }
// // // //         }
// // // //       }
// // // //     },
// // // //     stroke: {
// // // //       width: 2,
// // // //       colors: ['#fff']
// // // //     },
// // // //     tooltip: {
// // // //       theme: "light",
// // // //       style: {
// // // //         fontSize: '12px',
// // // //         fontFamily: 'inherit'
// // // //       },
// // // //       y: {
// // // //         formatter: (val) => `${val}% (${formatNumber(Math.round((val / 100) * metrics.totalBooks))} copies)`,
// // // //         title: {
// // // //           formatter: (seriesName) => seriesName
// // // //         }
// // // //       }
// // // //     },
// // // //     responsive: [{
// // // //       breakpoint: 768,
// // // //       options: {
// // // //         chart: {
// // // //           height: 200
// // // //         },
// // // //         legend: {
// // // //           position: 'bottom',
// // // //           horizontalAlign: 'center'
// // // //         }
// // // //       }
// // // //     }]
// // // //   };

// // // //   const calculateDonutSeries = () => {
// // // //     if (metrics.totalBooks === 0) return [0, 0];
// // // //     const issuedPercentage = Math.round((metrics.issuedBooks / metrics.totalBooks) * 100);
// // // //     const availablePercentage = 100 - issuedPercentage;
// // // //     return [availablePercentage, issuedPercentage];
// // // //   };
// // // //   const donutChartSeries = calculateDonutSeries();

// // // //   const summaryCards = [
// // // //     {
// // // //       title: "Total Books",
// // // //       value: formatNumber(metrics.totalTitles || metrics.totalBooks),
// // // //       icon: "fa-book",
// // // //       color: PRIMARY_COLOR,
// // // //       bgColor: "#e0e7ff",
// // // //       type: "totalBooks"
// // // //     },
// // // //     {
// // // //       title: "Total Copies",
// // // //       value: formatNumber(metrics.total_copies),
// // // //       icon: "fa-copy",
// // // //       color: ACCENT_COLOR,
// // // //       bgColor: "#e0e7ff",
// // // //       type: "totalCopies"
// // // //     },
// // // //     {
// // // //       title: "Available Copies",
// // // //       value: formatNumber(metrics.availableBooks),
// // // //       icon: "fa-book-open",
// // // //       color: SUCCESS_COLOR,
// // // //       bgColor: "#d1fae5",
// // // //       type: "availableCopies"
// // // //     },
// // // //     {
// // // //       title: "Issued Copies",
// // // //       value: formatNumber(metrics.issuedBooks),
// // // //       icon: "fa-user-pen",
// // // //       color: WARNING_COLOR,
// // // //       bgColor: "#fef3c7",
// // // //       type: "issuedCopies"
// // // //     },
// // // //   ];

// // // //   const alertCards = [
// // // //     {
// // // //       count: metrics.dueSoonCount,
// // // //       label: "Due Soon",
// // // //       icon: "fa-clock",
// // // //       bg: "#fff7ed",
// // // //       color: WARNING_COLOR,
// // // //       type: "dueSoon"
// // // //     },
// // // //     {
// // // //       count: metrics.overdueCount,
// // // //       label: "Overdue",
// // // //       icon: "fa-circle-exclamation",
// // // //       bg: "#fef2f2",
// // // //       color: DANGER_COLOR,
// // // //       type: "overdue"
// // // //     },
// // // //     {
// // // //       count: metrics.fineCollectedThisMonth,
// // // //       label: "Fine Collected",
// // // //       icon: "fa-indian-rupee-sign",
// // // //       bg: "#ecfdf5",
// // // //       color: SUCCESS_COLOR,
// // // //       isCurrency: true,
// // // //       type: "fineCollected"
// // // //     },
// // // //     {
// // // //       count: metrics.damagedCount,
// // // //       label: "Damaged / Lost",
// // // //       icon: "fa-heart-crack",
// // // //       bg: "#fdf2f8",
// // // //       color: '#db2777',
// // // //       type: "damagedLost"
// // // //     }
// // // //   ];

// // // //   if (loading) {
// // // //     return (
// // // //       <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
// // // //         <Loader />
// // // //       </div>
// // // //     );
// // // //   }

// // // //   if (userRole === "STUDENT") {
// // // //     return (
// // // //       <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "20px" }}>
// // // //         <ScrollToTop />
// // // //         <Container fluid>
// // // //           <Card style={{
// // // //             ...styles.card,
// // // //             background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${INFO_COLOR} 100%)`,
// // // //             color: "white",
// // // //             marginBottom: "30px",
// // // //             border: 'none'
// // // //           }}>
// // // //             <Card.Body className="p-4">
// // // //               <h1 className="fw-bolder mb-2" style={{ fontSize: '24px' }}>
// // // //                 Welcome Back, {userInfo?.firstname || 'Student'}! 👋
// // // //               </h1>
// // // //               <p className="mb-0 opacity-75" style={{ fontSize: '16px' }}>
// // // //                 Your personalized library dashboard is ready. Check your borrowed books and upcoming deadlines.
// // // //               </p>
// // // //             </Card.Body>
// // // //           </Card>

// // // //           <Row>
// // // //             <Col lg={8} className="mx-auto">
// // // //               <Card style={styles.card}>
// // // //                 <Card.Header style={styles.cardHeader}>
// // // //                   <h5 className="fw-bold mb-0">Your Currently Issued Books</h5>
// // // //                 </Card.Header>
// // // //                 <Card.Body>
// // // //                   <div className="text-center py-5">
// // // //                     <i className="fa-solid fa-book-open-reader fa-3x text-muted mb-3"></i>
// // // //                     <p className="text-muted">No books currently issued</p>
// // // //                     <button className="btn btn-primary mt-2">
// // // //                       Browse Library
// // // //                     </button>
// // // //                   </div>
// // // //                 </Card.Body>
// // // //               </Card>
// // // //             </Col>
// // // //           </Row>
// // // //         </Container>
// // // //       </div>
// // // //     );
// // // //   }

// // // //   return (
// // // //     <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "16px" }}>
// // // //       <ScrollToTop />
// // // //       <Container fluid className="px-2 py-2">
// // // //         {/* Header with Filter */}
// // // //         <div className="d-flex justify-content-between align-items-center mb-3">
// // // //           <div>
// // // //             <h6 >
// // // //               📚   Real-time analytics for efficient library management
// // // //             </h6>
// // // //           </div>

// // // //           <Dropdown>
// // // //             <Dropdown.Toggle
// // // //               variant="outline-secondary"
// // // //               size="sm"
// // // //               className="rounded-pill px-3"
// // // //               style={{
// // // //                 borderColor: '#e2e8f0',
// // // //                 fontSize: '12px',
// // // //                 fontWeight: '500'
// // // //               }}
// // // //             >
// // // //               <i className="fa-solid fa-filter me-1"></i>
// // // //               Filter: {filter === 'all' ? 'All Time' : filter === 'week' ? 'This Week' : filter === 'month' ? 'This Month' : 'This Year'}
// // // //             </Dropdown.Toggle>
// // // //             <Dropdown.Menu>
// // // //               <Dropdown.Item onClick={() => setFilter("all")}>All Time</Dropdown.Item>
// // // //               <Dropdown.Item onClick={() => setFilter("week")}>This Week</Dropdown.Item>
// // // //               <Dropdown.Item onClick={() => setFilter("month")}>This Month</Dropdown.Item>
// // // //               <Dropdown.Item onClick={() => setFilter("year")}>This Year</Dropdown.Item>
// // // //             </Dropdown.Menu>
// // // //           </Dropdown>
// // // //         </div>

// // // //         {/* 1. Core Library Inventory - Clickable Cards */}
// // // //         <Row className="mb-3 g-2">
// // // //           {summaryCards.map((card, index) => (
// // // //             <Col xl={3} lg={6} md={6} sm={12} key={index}>
// // // //               <InteractiveCard
// // // //                 onClick={() => handleCardClick(card.type)}
// // // //               >
// // // //                 <Card.Body className="p-2">
// // // //                   <div className="d-flex align-items-center justify-content-between">
// // // //                     <div>
// // // //                       <p className="mb-1 text-uppercase" style={{
// // // //                         fontSize: "10px",
// // // //                         fontWeight: "700",
// // // //                         color: "#64748b"
// // // //                       }}>
// // // //                         {card.title}
// // // //                       </p>
// // // //                       <h2 className="mb-0" style={{
// // // //                         color: card.color,
// // // //                         fontSize: "20px",
// // // //                         fontWeight: "800"
// // // //                       }}>
// // // //                         {card.value}
// // // //                       </h2>
// // // //                     </div>
// // // //                     <div style={{
// // // //                       width: "40px",
// // // //                       height: "40px",
// // // //                       borderRadius: "10px",
// // // //                       backgroundColor: card.bgColor,
// // // //                       display: "flex",
// // // //                       alignItems: "center",
// // // //                       justifyContent: "center",
// // // //                       minWidth: "40px"
// // // //                     }}>
// // // //                       <i className={`fa-solid ${card.icon}`} style={{
// // // //                         fontSize: "18px",
// // // //                         color: card.color
// // // //                       }}></i>
// // // //                     </div>
// // // //                   </div>
// // // //                   <p className="mb-0 small text-muted mt-1" style={{ fontSize: '11px', cursor: 'pointer' }}>
// // // //                     <i className="fa-solid fa-magnifying-glass me-1"></i>
// // // //                     Click to view details
// // // //                   </p>
// // // //                 </Card.Body>
// // // //               </InteractiveCard>
// // // //             </Col>
// // // //           ))}
// // // //         </Row>

// // // //         {/* Detail Modal */}
// // // //         <DetailModal
// // // //           show={showModal}
// // // //           handleClose={handleCloseModal}
// // // //           modalData={modalData}
// // // //         />

// // // //         {/* 2. Urgent Actions & Financial Metrics - Clickable Cards */}
// // // //         <div style={styles.sectionTitle}>
// // // //           <i className="fa-solid fa-bell" style={{ color: WARNING_COLOR, fontSize: '14px' }}></i>
// // // //           Urgent Actions
// // // //         </div>
// // // //         <Row className="mb-3 g-2">
// // // //           {alertCards.map((item, idx) => (
// // // //             <Col xl={3} lg={6} md={6} sm={12} key={idx}>
// // // //               <InteractiveCard
// // // //                 style={{ borderLeft: `4px solid ${item.color}` }}
// // // //                 onClick={() => handleCardClick(item.type)}
// // // //               >
// // // //                 <Card.Body className="p-2">
// // // //                   <div className="d-flex align-items-center">
// // // //                     <div className="me-2" style={{
// // // //                       width: "36px",
// // // //                       height: "36px",
// // // //                       borderRadius: '8px',
// // // //                       background: item.bg,
// // // //                       display: 'flex',
// // // //                       alignItems: 'center',
// // // //                       justifyContent: 'center',
// // // //                       fontSize: '14px',
// // // //                       color: item.color,
// // // //                       flexShrink: 0
// // // //                     }}>
// // // //                       <i className={`fa-solid ${item.icon}`}></i>
// // // //                     </div>
// // // //                     <div>
// // // //                       <h4 className="mb-0 fw-bolder" style={{
// // // //                         color: item.color,
// // // //                         fontSize: "16px"
// // // //                       }}>
// // // //                         {item.isCurrency ? formatCurrency(item.count) : formatNumber(item.count)}
// // // //                       </h4>
// // // //                       <small className="text-muted fw-semibold" style={{ fontSize: '11px' }}>
// // // //                         {item.label}
// // // //                       </small>
// // // //                     </div>
// // // //                   </div>
// // // //                   <p className="mb-0 small text-muted mt-1" style={{ fontSize: '10px', cursor: 'pointer' }}>
// // // //                     <i className="fa-solid fa-magnifying-glass me-1"></i>
// // // //                     Click for detailed report
// // // //                   </p>
// // // //                 </Card.Body>
// // // //               </InteractiveCard>
// // // //             </Col>
// // // //           ))}
// // // //         </Row>

// // // //         {/* 3. Main Charts Section */}
// // // //         <Row className="mb-3 g-2">
// // // //           {/* Latest Members - Clickable Card */}
// // // //           <Col lg={4}>
// // // //             <InteractiveCard onClick={() => handleCardClick("latestMembers")}>
// // // //               <Card.Header style={styles.cardHeader}>
// // // //                 <div className="d-flex justify-content-between align-items-center">
// // // //                   <div>
// // // //                     <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '14px' }}>Latest Members</h6>
// // // //                     <small className="text-muted" style={{ fontSize: '11px' }}>Recently joined library members</small>
// // // //                   </div>
// // // //                   <Badge className="px-2 py-1" style={{
// // // //                     borderRadius: '30px',
// // // //                     fontSize: '9px',
// // // //                     fontWeight: 600,
// // // //                     background: SUCCESS_COLOR,
// // // //                     color: 'white'
// // // //                   }}>
// // // //                     NEW
// // // //                   </Badge>
// // // //                 </div>
// // // //               </Card.Header>
// // // //               <Card.Body className="p-0">
// // // //                 <div className="list-group list-group-flush">
// // // //                   {latestMembers.slice(0, 5).map((member, idx) => (
// // // //                     <div key={member.id} className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
// // // //                       <div className="d-flex align-items-center">
// // // //                         <div className="position-relative me-2">
// // // //                           <img
// // // //                             src={member.photo}
// // // //                             alt={member.name}
// // // //                             style={{
// // // //                               width: "36px",
// // // //                               height: "36px",
// // // //                               borderRadius: "50%",
// // // //                               objectFit: "cover",
// // // //                               border: "2px solid #e2e8f0"
// // // //                             }}
// // // //                           />
// // // //                           <div style={{
// // // //                             position: "absolute",
// // // //                             bottom: 0,
// // // //                             right: 0,
// // // //                             width: "10px",
// // // //                             height: "10px",
// // // //                             borderRadius: "50%",
// // // //                             background: SUCCESS_COLOR,
// // // //                             border: "2px solid white"
// // // //                           }}></div>
// // // //                         </div>
// // // //                         <div>
// // // //                           <p className="mb-0 fw-semibold" style={{ fontSize: '13px' }}>
// // // //                             {member.name}
// // // //                           </p>
// // // //                           <small className="text-muted" style={{ fontSize: '11px' }}>
// // // //                             <i className="fa-solid fa-calendar-days me-1"></i>
// // // //                             Joined {member.join_date}
// // // //                           </small>
// // // //                         </div>
// // // //                       </div>
// // // //                     </div>
// // // //                   ))}
// // // //                 </div>
// // // //                 <div className="px-2 py-1 border-top">
// // // //                   <div className="text-center">
// // // //                     <small className="fw-semibold" style={{ color: PRIMARY_COLOR, fontSize: '11px', cursor: 'pointer' }}>
// // // //                       <i className="fa-solid fa-magnifying-glass me-1"></i>
// // // //                       Click to view all members
// // // //                     </small>
// // // //                   </div>
// // // //                 </div>
// // // //               </Card.Body>
// // // //             </InteractiveCard>
// // // //           </Col>

// // // //           {/* Funnel Chart */}
// // // //           <Col lg={8}>
// // // //             <Card style={styles.card}>
// // // //               <Card.Header style={styles.cardHeader}>
// // // //                 <div className="d-flex justify-content-between align-items-center">
// // // //                   <div>
// // // //                     <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '14px' }}>Books with Highest Available Stock</h6>
// // // //                     <small className="text-muted" style={{ fontSize: '11px' }}>Top 10 books by available copies</small>
// // // //                   </div>
// // // //                 </div>
// // // //               </Card.Header>
// // // //               <Card.Body className="p-2">
// // // //                 {topAvailableBooks.length > 0 ? (
// // // //                   <Chart
// // // //                     options={funnelChartOptions}
// // // //                     series={funnelChartSeries}
// // // //                     type="bar"
// // // //                     height={280}
// // // //                   />
// // // //                 ) : (
// // // //                   <div className="d-flex flex-column align-items-center justify-content-center py-4 text-muted">
// // // //                     <i className="fa-solid fa-book-open-reader fa-2x mb-2"></i>
// // // //                     <small>No inventory data available</small>
// // // //                   </div>
// // // //                 )}
// // // //                 <div className="mt-2 text-center">
// // // //                   <small className="text-muted" style={{ fontSize: '10px' }}>
// // // //                     <i className="fa-solid fa-circle-info me-1"></i>
// // // //                     Hover for details | Click toolbar for export options (PNG, SVG, CSV)
// // // //                   </small>
// // // //                 </div>
// // // //               </Card.Body>
// // // //             </Card>
// // // //           </Col>
// // // //         </Row>

// // // //         {/* 4. Secondary Analytics */}
// // // //         <Row className="g-2">
// // // //           {/* Top Categories - Clickable Card */}
// // // //           <Col lg={4}>
// // // //             <InteractiveCard onClick={() => handleCardClick("topCategories")}>
// // // //               <Card.Header style={styles.cardHeader}>
// // // //                 <div className="d-flex justify-content-between align-items-center">
// // // //                   <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '14px' }}>Top Categories by Stock</h6>
// // // //                   <Badge className="px-2 py-1" style={{
// // // //                     borderRadius: '30px',
// // // //                     fontSize: '9px',
// // // //                     fontWeight: 600,
// // // //                     background: PRIMARY_COLOR,
// // // //                     color: 'white',
// // // //                     cursor: 'pointer'
// // // //                   }}>
// // // //                     VIEW ALL
// // // //                   </Badge>
// // // //                 </div>
// // // //                 <small className="text-muted" style={{ fontSize: '11px' }}>Most populated categories</small>
// // // //               </Card.Header>
// // // //               <Card.Body className="p-0">
// // // //                 <div className="list-group list-group-flush">
// // // //                   {categories.length > 0 ? categories.slice(0, 5).map((cat, idx) => (
// // // //                     <div key={idx} className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
// // // //                       <div className="d-flex align-items-center">
// // // //                         <div className="me-2 rounded-circle d-flex align-items-center justify-content-center"
// // // //                           style={{
// // // //                             width: 32,
// // // //                             height: 32,
// // // //                             background: '#e0e7ff',
// // // //                             color: PRIMARY_COLOR
// // // //                           }}>
// // // //                           <i className={`fa-solid ${cat.icon}`}></i>
// // // //                         </div>
// // // //                         <span className="fw-semibold text-dark" style={{ fontSize: '13px' }}>
// // // //                           {cat.name.length > 18 ? cat.name.substring(0, 18) + "..." : cat.name}
// // // //                         </span>
// // // //                       </div>
// // // //                       <Badge style={{
// // // //                         background: PRIMARY_COLOR,
// // // //                         color: 'white',
// // // //                         fontWeight: 600,
// // // //                         fontSize: '11px'
// // // //                       }} className="rounded-pill px-2 py-1">
// // // //                         {formatNumber(cat.count)}
// // // //                       </Badge>
// // // //                     </div>
// // // //                   )) : (
// // // //                     <div className="text-center py-3 text-muted">
// // // //                       <i className="fa-solid fa-tags fa-lg mb-2"></i>
// // // //                       <p className="mb-0" style={{ fontSize: '12px' }}>No category data available</p>
// // // //                     </div>
// // // //                   )}
// // // //                 </div>
// // // //               </Card.Body>
// // // //             </InteractiveCard>
// // // //           </Col>

// // // //           {/* Donut Chart */}
// // // //           <Col lg={4}>
// // // //             <Card style={styles.card}>
// // // //               <Card.Body className="text-center p-2">
// // // //                 <div className="d-flex justify-content-between align-items-center mb-2">
// // // //                   <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '14px' }}>
// // // //                     Inventory Status
// // // //                   </h6>
// // // //                   <Badge className="px-2 py-1" style={{
// // // //                     borderRadius: '30px',
// // // //                     fontSize: '9px',
// // // //                     fontWeight: 600,
// // // //                     background: INFO_COLOR,
// // // //                     color: 'white'
// // // //                   }}>
// // // //                     DONUT CHART
// // // //                   </Badge>
// // // //                 </div>
// // // //                 <Chart
// // // //                   options={donutOptions}
// // // //                   series={donutChartSeries}
// // // //                   type="donut"
// // // //                   height={180}
// // // //                 />
// // // //                 <div className="mt-2">
// // // //                   <div className="d-flex justify-content-center align-items-center mb-1">
// // // //                     <div className="me-1" style={{
// // // //                       width: '8px',
// // // //                       height: '8px',
// // // //                       borderRadius: '50%',
// // // //                       background: SUCCESS_COLOR
// // // //                     }}></div>
// // // //                     <span className="text-muted small me-2" style={{ fontSize: '11px' }}>Available: {donutChartSeries[0]}%</span>
// // // //                     <div className="me-1" style={{
// // // //                       width: '8px',
// // // //                       height: '8px',
// // // //                       borderRadius: '50%',
// // // //                       background: PRIMARY_COLOR
// // // //                     }}></div>
// // // //                     <span className="text-muted small" style={{ fontSize: '11px' }}>Issued: {donutChartSeries[1]}%</span>
// // // //                   </div>
// // // //                   <h4 className="fw-bolder mt-1" style={{
// // // //                     color: WARNING_COLOR,
// // // //                     fontSize: '18px'
// // // //                   }}>
// // // //                     {donutChartSeries[1]}%
// // // //                   </h4>
// // // //                   <small className="text-muted" style={{ fontSize: '11px' }}>of total copies currently issued</small>
// // // //                 </div>
// // // //               </Card.Body>
// // // //             </Card>
// // // //           </Col>

// // // //           {/* Quick Stats - Clickable Card */}
// // // //           <Col lg={4}>
// // // //             <InteractiveCard onClick={() => handleCardClick("quickStats")}>
// // // //               <Card.Header style={styles.cardHeader}>
// // // //                 <div className="d-flex justify-content-between align-items-center">
// // // //                   <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '14px' }}>Quick Stats</h6>
// // // //                   <Badge className="px-2 py-1" style={{
// // // //                     borderRadius: '30px',
// // // //                     fontSize: '9px',
// // // //                     fontWeight: 600,
// // // //                     background: INFO_COLOR,
// // // //                     color: 'white',
// // // //                     cursor: 'pointer'
// // // //                   }}>
// // // //                     DETAILS
// // // //                   </Badge>
// // // //                 </div>
// // // //                 <small className="text-muted" style={{ fontSize: '11px' }}>Recent library activity</small>
// // // //               </Card.Header>
// // // //               <Card.Body className="p-0">
// // // //                 <div className="list-group list-group-flush">
// // // //                   <div className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
// // // //                     <div className="d-flex align-items-center">
// // // //                       <div className="me-2" style={{
// // // //                         width: 32,
// // // //                         height: 32,
// // // //                         borderRadius: '8px',
// // // //                         background: '#e0e7ff',
// // // //                         color: PRIMARY_COLOR,
// // // //                         display: 'flex',
// // // //                         alignItems: 'center',
// // // //                         justifyContent: 'center'
// // // //                       }}>
// // // //                         <i className="fa-solid fa-book-medical"></i>
// // // //                       </div>
// // // //                       <div>
// // // //                         <p className="mb-0 fw-semibold" style={{ fontSize: '13px' }}>New Books This Month</p>
// // // //                         <small className="text-muted" style={{ fontSize: '11px' }}>Added in last 30 days</small>
// // // //                       </div>
// // // //                     </div>
// // // //                     <Badge className="rounded-pill px-2 py-1" style={{
// // // //                       background: PRIMARY_COLOR,
// // // //                       fontSize: '12px',
// // // //                       fontWeight: '600'
// // // //                     }}>
// // // //                       {formatNumber(metrics.booksThisMonth)}
// // // //                     </Badge>
// // // //                   </div>

// // // //                   <div className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
// // // //                     <div className="d-flex align-items-center">
// // // //                       <div className="me-2" style={{
// // // //                         width: 32,
// // // //                         height: 32,
// // // //                         borderRadius: '8px',
// // // //                         background: '#ecfdf5',
// // // //                         color: SUCCESS_COLOR,
// // // //                         display: 'flex',
// // // //                         alignItems: 'center',
// // // //                         justifyContent: 'center'
// // // //                       }}>
// // // //                         <i className="fa-solid fa-users"></i>
// // // //                       </div>
// // // //                       <div>
// // // //                         <p className="mb-0 fw-semibold" style={{ fontSize: '13px' }}>Active Borrowers</p>
// // // //                         <small className="text-muted" style={{ fontSize: '11px' }}>Currently issued books</small>
// // // //                       </div>
// // // //                     </div>
// // // //                     <Badge className="rounded-pill px-2 py-1" style={{
// // // //                       background: SUCCESS_COLOR,
// // // //                       fontSize: '12px',
// // // //                       fontWeight: '600'
// // // //                     }}>
// // // //                       {formatNumber(cardDetails.length)}
// // // //                     </Badge>
// // // //                   </div>

// // // //                   <div className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
// // // //                     <div className="d-flex align-items-center">
// // // //                       <div className="me-2" style={{
// // // //                         width: 32,
// // // //                         height: 32,
// // // //                         borderRadius: '8px',
// // // //                         background: '#fef3c7',
// // // //                         color: WARNING_COLOR,
// // // //                         display: 'flex',
// // // //                         alignItems: 'center',
// // // //                         justifyContent: 'center'
// // // //                       }}>
// // // //                         <i className="fa-solid fa-percentage"></i>
// // // //                       </div>
// // // //                       <div>
// // // //                         <p className="mb-0 fw-semibold" style={{ fontSize: '13px' }}>Utilization Rate</p>
// // // //                         <small className="text-muted" style={{ fontSize: '11px' }}>Library capacity usage</small>
// // // //                       </div>
// // // //                     </div>
// // // //                     <Badge className="rounded-pill px-2 py-1" style={{
// // // //                       background: WARNING_COLOR,
// // // //                       fontSize: '12px',
// // // //                       fontWeight: '600'
// // // //                     }}>
// // // //                       {metrics.total_copies > 0 ? Math.round((metrics.issuedBooks / metrics.total_copies) * 100) : 0}%
// // // //                     </Badge>
// // // //                   </div>
// // // //                 </div>
// // // //               </Card.Body>
// // // //             </InteractiveCard>
// // // //           </Col>
// // // //         </Row>
// // // //       </Container>
// // // //     </div>
// // // //   );
// // // // };

// // // // export default Dashboard;



// // // /*
// // // **@Author: Aabid 
// // // **@Date: NOV-2025
// // // */

// // // import React, { useState, useEffect, useCallback } from "react";
// // // import { Card, Col, Container, Row, Badge, Button, Dropdown } from "react-bootstrap";
// // // import Chart from "react-apexcharts";
// // // import ScrollToTop from "./common/ScrollToTop";
// // // import DataApi from "../api/dataApi";
// // // import Loader from "./common/Loader";
// // // import jwt_decode from "jwt-decode";
// // // import DashboardApi from "../api/dashboardApi";

// // // const PRIMARY_COLOR = "#4338ca";
// // // const ACCENT_COLOR = "#6366f1";
// // // const SUCCESS_COLOR = "#059669";
// // // const WARNING_COLOR = "#f59e0b";
// // // const DANGER_COLOR = "#dc2626";
// // // const INFO_COLOR = "#8b5cf6";

// // // const styles = {
// // //   card: {
// // //     border: "1px solid #e2e8f0",
// // //     borderRadius: "16px",
// // //     boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
// // //     background: "#fff",
// // //     height: "100%",
// // //     transition: "all 0.3s ease",
// // //     overflow: "hidden",
// // //   },
// // //   interactiveCard: {
// // //     cursor: "pointer",
// // //   },
// // //   cardHeader: {
// // //     background: "transparent",
// // //     borderBottom: "1px solid #f1f5f9",
// // //     borderRadius: "16px 16px 0 0",
// // //     padding: "12px 16px"
// // //   },
// // //   cardBody: {
// // //     padding: "16px"
// // //   },
// // //   sectionTitle: {
// // //     fontSize: "15px",
// // //     fontWeight: "600",
// // //     color: "#0f172a",
// // //     marginBottom: "16px",
// // //     marginTop: "20px",
// // //     display: "flex",
// // //     alignItems: "center",
// // //     gap: "10px",
// // //     paddingLeft: "5px"
// // //   }
// // // };

// // // const AlertCardHoverStyle = {
// // //   "&:hover": {
// // //     transform: "translateY(-3px)",
// // //     boxShadow: "0 15px 40px rgba(0, 0, 0, 0.1)",
// // //   }
// // // };

// // // const InteractiveCard = ({ children, style, ...props }) => {
// // //   const [hover, setHover] = useState(false);
// // //   return (
// // //     <Card
// // //       {...props}
// // //       style={{
// // //         ...styles.card,
// // //         ...styles.interactiveCard,
// // //         ...style,
// // //         ...(hover ? AlertCardHoverStyle["&:hover"] : {}),
// // //       }}
// // //       onMouseEnter={() => setHover(true)}
// // //       onMouseLeave={() => setHover(false)}
// // //     >
// // //       {children}
// // //     </Card>
// // //   );
// // // };

// // // const Dashboard = ({ userInfo: propUserInfo }) => {
// // //   const [loading, setLoading] = useState(true);
// // //   const [dashboardData, setDashboardData] = useState(null);
// // //   const [userInfo, setUserInfo] = useState(null);
// // //   const [userRole, setUserRole] = useState(null);
// // //   const [filter, setFilter] = useState("all");

// // //   const [metrics, setMetrics] = useState({
// // //     dueSoonCount: 0,
// // //     overdueCount: 0,
// // //     fineCollectedThisMonth: 0,
// // //     damagedCount: 0,
// // //     totalBooks: 0,
// // //     totalTitles: 0,
// // //     availableBooks: 0,
// // //     issuedBooks: 0,
// // //     booksThisMonth: 0,
// // //     totalSubmissions: 0,
// // //     total_copies: 0,
// // //   });

// // //   const [cardDetails, setCardDetails] = useState([]);
// // //   const [cardLimitSetting, setCardLimitSetting] = useState(6);
// // //   const [categories, setCategories] = useState([]);
// // //   const [topAvailableBooks, setTopAvailableBooks] = useState([]);
// // //   const [latestMembers, setLatestMembers] = useState([]);

// // //   const formatNumber = useCallback((num) => {
// // //     if (num === null || num === undefined || isNaN(num)) return "0";
// // //     return Number(num).toLocaleString('en-IN');
// // //   }, []);

// // //   const formatCurrency = useCallback((val) => {
// // //     const n = Number(val);
// // //     if (!isFinite(n)) return `₹0.00`;
// // //     return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// // //   }, []);

// // //   const dummyPhotos = [
// // //     "https://randomuser.me/api/portraits/men/32.jpg",
// // //     "https://randomuser.me/api/portraits/women/44.jpg",
// // //     "https://randomuser.me/api/portraits/men/67.jpg",
// // //     "https://randomuser.me/api/portraits/women/65.jpg",
// // //     "https://randomuser.me/api/portraits/men/75.jpg"
// // //   ];

// // //   useEffect(() => {
// // //     const initializeUser = () => {
// // //       let currentUserInfo = propUserInfo;
// // //       if (!currentUserInfo) {
// // //         try {
// // //           const token = sessionStorage.getItem("token");
// // //           if (token) {
// // //             currentUserInfo = jwt_decode(token);
// // //           }
// // //         } catch (error) {
// // //           console.error("Error decoding token:", error);
// // //         }
// // //       }
// // //       setUserInfo(currentUserInfo);
// // //       setUserRole(currentUserInfo?.userrole?.toUpperCase() || "ADMIN");
// // //     };

// // //     initializeUser();
// // //   }, [propUserInfo]);

// // //   useEffect(() => {
// // //     let isMounted = true;

// // //     const fetchAllDashboardData = async () => {
// // //       try {
// // //         setLoading(true);

// // //         await Promise.all([
// // //           fetchDashboardSummary(),
// // //           fetchAlertMetrics(),
// // //           fetchLibraryDetails(),
// // //           fetchLatestMembers()
// // //         ]);

// // //       } catch (error) {
// // //         console.error("Error in dashboard data fetch:", error);
// // //       } finally {
// // //         if (isMounted) {
// // //           setLoading(false);
// // //         }
// // //       }
// // //     };

// // //     fetchAllDashboardData();

// // //     return () => {
// // //       isMounted = false;
// // //     };
// // //   }, []);

// // //   const fetchLatestMembers = () => {
// // //     const membersData = [
// // //       { id: 1, name: "Alexander Perce", date: "12 Jan", photo: dummyPhotos[0] },
// // //       { id: 2, name: "Terley Norman", date: "12 Jan", photo: dummyPhotos[1] },
// // //       { id: 3, name: "Tromsley Latex", date: "12 Jan", photo: dummyPhotos[2] },
// // //       { id: 4, name: "John Browser", date: "12 Jan", photo: dummyPhotos[3] },
// // //       { id: 5, name: "Alexander Perce", date: "11 Jan", photo: dummyPhotos[4] },
// // //     ];
// // //     setLatestMembers(membersData);
// // //   };

// // //   const fetchDashboardSummary = async () => {
// // //     try {
// // //       const libraryApi = new DataApi("library");
// // //       const dashboardResponse = await libraryApi.get("/dashboard");

// // //       if (dashboardResponse.data?.success) {
// // //         const data = dashboardResponse.data.data;
// // //         setDashboardData(data);
// // //         if (data.summary) {
// // //           setMetrics(prev => ({
// // //             ...prev,
// // //             totalBooks: data.summary.totalBooks || data.summary.total_copies || 0,
// // //             totalTitles: data.summary.totalTitles || data.summary.total_books || 0,
// // //             availableBooks: data.summary.availableBooks || data.summary.available_copies || 0,
// // //             issuedBooks: data.summary.issuedBooks || data.summary.issued_copies || 0,
// // //             booksThisMonth: data.summary.booksThisMonth || data.summary.books_this_month || 0,
// // //             totalSubmissions: data.summary.totalSubmissions || data.summary.total_submissions || 0,
// // //             total_copies: data.summary.totalCopies || data.summary.totalCopies || 0,
// // //           }));
// // //         }
// // //         if (data.booksByCategory?.length > 0) {
// // //           const topCategories = data.booksByCategory.slice(0, 5).map(item => ({
// // //             name: item.category_name || "Unknown",
// // //             icon: "fa-tag",
// // //             count: parseInt(item.book_count || 0),
// // //           }));
// // //           setCategories(topCategories);
// // //         }
// // //       }
// // //     } catch (error) {
// // //       console.error("Error fetching dashboard summary:", error);
// // //     }
// // //   };

// // //   const fetchAlertMetrics = async () => {
// // //     try {
// // //       const resp = await DashboardApi.fetchAll();
// // //       const data = resp?.data?.[0] || {};

// // //       setMetrics(prev => ({
// // //         ...prev,
// // //         dueSoonCount: data.total_due_soon || 0,
// // //         overdueCount: data.overdue_books || 0,
// // //         fineCollectedThisMonth: data.fine_collected_this_month || 0,
// // //         damagedCount: data.damaged_missing_books || 0,
// // //       }));
// // //     } catch (err) {
// // //       console.error("Error fetching alert metrics:", err);
// // //     }
// // //   };

// // //   const fetchLibraryDetails = async () => {
// // //     try {
// // //       const bookApi = new DataApi("book");
// // //       const issueApi = new DataApi("bookissue");
// // //       const settingsApi = new DataApi("librarysettings");
// // //       const cardApi = new DataApi("librarycard");

// // //       const booksResp = await bookApi.fetchAll();
// // //       const books = Array.isArray(booksResp?.data) ? booksResp.data :
// // //         (booksResp?.data?.rows || booksResp || []);

// // //       let availableCopies = 0;
// // //       const booksWithAvailability = [];

// // //       if (Array.isArray(books)) {
// // //         books.forEach((b) => {
// // //           const total = Number(b.total_copies ?? b.totalCopies ?? 0) || 0;
// // //           const available = Number(b.available_copies ?? b.availableCopies ?? total) || total;
// // //           availableCopies += available;

// // //           booksWithAvailability.push({
// // //             title: b.title || "Unknown",
// // //             available_copies: available,
// // //             total_copies: total
// // //           });
// // //         });
// // //       }

// // //       const sortedBooks = [...booksWithAvailability]
// // //         .sort((a, b) => b.available_copies - a.available_copies)
// // //         .slice(0, 10);
// // //       setTopAvailableBooks(sortedBooks);

// // //       const issuesResp = await issueApi.get("/active");
// // //       const activeIssues = Array.isArray(issuesResp?.data) ? issuesResp.data :
// // //         (issuesResp?.data?.rows || issuesResp || []);
// // //       const issuedCount = Array.isArray(activeIssues) ? activeIssues.length : 0;

// // //       let cardLimit = 6;
// // //       try {
// // //         const settingsResp = await settingsApi.get("/all");
// // //         const settingsData = settingsResp?.data?.data || settingsResp?.data || settingsResp;
// // //         if (settingsData) {
// // //           cardLimit = Number(
// // //             settingsData.max_books_per_card ??
// // //             settingsData.max_books ??
// // //             settingsData.max_books_per_card?.setting_value
// // //           ) || cardLimit;
// // //         }
// // //       } catch (err) {
// // //         console.warn("Could not fetch card limit:", err);
// // //       }

// // //       setCardLimitSetting(cardLimit);

// // //       await fetchCardDetails(cardApi, issueApi, cardLimit);

// // //     } catch (error) {
// // //       console.error("Error fetching library details:", error);
// // //     }
// // //   };

// // //   const fetchCardDetails = async (cardApi, issueApi, currentLimit) => {
// // //     try {
// // //       const cardsResp = await cardApi.fetchAll();
// // //       const issuesResp = await issueApi.get("/active");

// // //       const cards = Array.isArray(cardsResp?.data) ? cardsResp.data :
// // //         (cardsResp?.data?.rows || cardsResp || []);
// // //       const activeIssues = Array.isArray(issuesResp?.data) ? issuesResp.data :
// // //         (issuesResp?.data?.rows || issuesResp || []);

// // //       const countsByCard = {};
// // //       activeIssues.forEach((issue) => {
// // //         const cid = issue.card_id || issue.cardId || issue.cardid;
// // //         if (cid) {
// // //           countsByCard[cid] = (countsByCard[cid] || 0) + 1;
// // //         }
// // //       });

// // //       const details = cards.map((c) => {
// // //         const issued = countsByCard[c.id] || 0;
// // //         const remaining = Math.max(0, currentLimit - issued);
// // //         return {
// // //           id: c.id,
// // //           user_name: c.user_name || c.userName || `Card ${c.card_number}` || "Unknown",
// // //           issued: issued,
// // //           remaining: remaining
// // //         };
// // //       });

// // //       details.sort((a, b) => b.issued - a.issued);
// // //       setCardDetails(details.slice(0, 10));

// // //     } catch (error) {
// // //       console.error("Error fetching card details:", error);
// // //     }
// // //   };


// // //   const getChartConfig = (filename) => ({
// // //     toolbar: {
// // //       show: true,
// // //       tools: {
// // //         download: true,
// // //         selection: true,
// // //         zoom: true,
// // //         zoomin: true,
// // //         zoomout: true,
// // //         pan: true,
// // //         reset: true,
// // //       },
// // //       export: {
// // //         csv: {
// // //           filename: filename,
// // //           headerCategory: "Category",
// // //           columnDelimiter: ','
// // //         },
// // //         svg: {
// // //           filename: filename
// // //         },
// // //         png: {
// // //           filename: filename
// // //         }
// // //       }
// // //     }
// // //   });


// // //   const funnelChartOptions = {
// // //     chart: {
// // //       type: 'bar',
// // //       height: 320,
// // //       fontFamily: 'inherit',
// // //       toolbar: getChartConfig("Books_Highest_Available_Stock_Report").toolbar,
// // //       zoom: {
// // //         enabled: true,
// // //         type: 'x',
// // //         autoScaleYaxis: true
// // //       },
// // //       animations: {
// // //         enabled: true,
// // //         easing: 'easeinout',
// // //         speed: 800
// // //       }
// // //     },
// // //     plotOptions: {
// // //       bar: {
// // //         borderRadius: 6,
// // //         horizontal: true,
// // //         barHeight: '70%',
// // //         distributed: false,
// // //         dataLabels: {
// // //           position: 'center'
// // //         }
// // //       }
// // //     },
// // //     dataLabels: {
// // //       enabled: true,
// // //       formatter: function (val) {
// // //         return val + " copies";
// // //       },
// // //       textAnchor: 'start',
// // //       offsetX: 10,
// // //       style: {
// // //         fontSize: '11px',
// // //         colors: ['#fff'],
// // //         fontWeight: 600,
// // //         fontFamily: 'inherit'
// // //       }
// // //     },
// // //     xaxis: {
// // //       categories: topAvailableBooks.map(b =>
// // //         b.title.length > 18 ? b.title.substring(0, 18) + "..." : b.title
// // //       ),
// // //       labels: {
// // //         style: {
// // //           colors: '#64748b',
// // //           fontSize: '11px',
// // //           fontFamily: 'inherit'
// // //         }
// // //       },
// // //       title: {
// // //         text: 'Available Copies',
// // //         style: {
// // //           color: '#64748b',
// // //           fontSize: '12px',
// // //           fontFamily: 'inherit',
// // //           fontWeight: 600
// // //         }
// // //       },
// // //       axisBorder: {
// // //         show: true,
// // //         color: '#e2e8f0'
// // //       },
// // //       axisTicks: {
// // //         show: true,
// // //         color: '#e2e8f0'
// // //       }
// // //     },
// // //     yaxis: {
// // //       labels: {
// // //         style: {
// // //           colors: '#334155',
// // //           fontWeight: 600,
// // //           fontSize: '12px',
// // //           fontFamily: 'inherit'
// // //         }
// // //       }
// // //     },
// // //     colors: [
// // //       '#4f46e5', '#6366f1', '#818cf8', '#93c5fd', '#60a5fa',
// // //       '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'
// // //     ].reverse(),
// // //     tooltip: {
// // //       theme: 'light',
// // //       style: {
// // //         fontSize: '12px',
// // //         fontFamily: 'inherit'
// // //       },
// // //       y: {
// // //         formatter: (val) => `${val} copies available`,
// // //         title: {
// // //           formatter: (seriesName) => 'Available Copies:'
// // //         }
// // //       },
// // //       x: {
// // //         formatter: (val, { series, seriesIndex, dataPointIndex, w }) => {
// // //           const book = topAvailableBooks[dataPointIndex];
// // //           return `<strong>${book.title}</strong><br/>Total: ${book.total_copies} copies<br/>Available: ${book.available_copies} copies`;
// // //         }
// // //       }
// // //     },
// // //     legend: {
// // //       show: false
// // //     },
// // //     grid: {
// // //       show: true,
// // //       borderColor: '#f1f5f9',
// // //       xaxis: {
// // //         lines: {
// // //           show: true
// // //         }
// // //       },
// // //       yaxis: {
// // //         lines: {
// // //           show: true
// // //         }
// // //       }
// // //     },
// // //     states: {
// // //       hover: {
// // //         filter: {
// // //           type: 'darken',
// // //           value: 0.8
// // //         }
// // //       },
// // //       active: {
// // //         filter: {
// // //           type: 'darken',
// // //           value: 0.7
// // //         }
// // //       }
// // //     },
// // //     responsive: [{
// // //       breakpoint: 768,
// // //       options: {
// // //         chart: {
// // //           height: 280
// // //         },
// // //         dataLabels: {
// // //           enabled: false
// // //         }
// // //       }
// // //     }]
// // //   };

// // //   const funnelChartSeries = [{
// // //     name: 'Available Copies',
// // //     data: topAvailableBooks.map(b => parseInt(b.available_copies || 0))
// // //   }];


// // //   const donutOptions = {
// // //     chart: {
// // //       type: "donut",
// // //       height: 220,
// // //       fontFamily: 'inherit',
// // //       toolbar: getChartConfig("Inventory_Status_Report").toolbar,
// // //       animations: {
// // //         enabled: true,
// // //         easing: 'easeinout',
// // //         speed: 800
// // //       }
// // //     },
// // //     colors: [SUCCESS_COLOR, PRIMARY_COLOR],
// // //     legend: {
// // //       position: "bottom",
// // //       fontSize: '12px',
// // //       fontFamily: 'inherit',
// // //       markers: {
// // //         radius: 8,
// // //         width: 12,
// // //         height: 12
// // //       },
// // //       itemMargin: {
// // //         horizontal: 8,
// // //         vertical: 4
// // //       },
// // //       onItemClick: {
// // //         toggleDataSeries: true
// // //       },
// // //       onItemHover: {
// // //         highlightDataSeries: true
// // //       }
// // //     },
// // //     dataLabels: {
// // //       enabled: true,
// // //       style: {
// // //         fontSize: '12px',
// // //         fontWeight: 600,
// // //         fontFamily: 'inherit'
// // //       },
// // //       dropShadow: {
// // //         enabled: true,
// // //         top: 1,
// // //         left: 1,
// // //         blur: 1,
// // //         opacity: 0.2
// // //       },
// // //       formatter: function (val, { seriesIndex, w }) {
// // //         return w.config.series[seriesIndex] + '%';
// // //       }
// // //     },
// // //     plotOptions: {
// // //       pie: {
// // //         donut: {
// // //           size: "65%",
// // //           labels: {
// // //             show: true,
// // //             total: {
// // //               show: true,
// // //               label: 'Total Copies',
// // //               color: '#334155',
// // //               fontWeight: 600,
// // //               fontSize: '12px',
// // //               fontFamily: 'inherit',
// // //               formatter: () => formatNumber(metrics.totalBooks)
// // //             },
// // //             value: {
// // //               show: true,
// // //               fontSize: '20px',
// // //               fontWeight: 700,
// // //               color: '#1e293b',
// // //               fontFamily: 'inherit',
// // //               formatter: (val) => val + '%'
// // //             }
// // //           }
// // //         }
// // //       }
// // //     },
// // //     stroke: {
// // //       width: 2,
// // //       colors: ['#fff']
// // //     },
// // //     tooltip: {
// // //       theme: "light",
// // //       style: {
// // //         fontSize: '12px',
// // //         fontFamily: 'inherit'
// // //       },
// // //       y: {
// // //         formatter: (val) => `${val}% (${formatNumber(Math.round((val / 100) * metrics.totalBooks))} copies)`,
// // //         title: {
// // //           formatter: (seriesName) => seriesName
// // //         }
// // //       }
// // //     },
// // //     responsive: [{
// // //       breakpoint: 768,
// // //       options: {
// // //         chart: {
// // //           height: 200
// // //         },
// // //         legend: {
// // //           position: 'bottom',
// // //           horizontalAlign: 'center'
// // //         }
// // //       }
// // //     }]
// // //   };

// // //   const calculateDonutSeries = () => {
// // //     if (metrics.totalBooks === 0) return [0, 0];

// // //     const issuedPercentage = Math.round((metrics.issuedBooks / metrics.totalBooks) * 100);
// // //     const availablePercentage = 100 - issuedPercentage;

// // //     return [availablePercentage, issuedPercentage];
// // //   };

// // //   const donutChartSeries = calculateDonutSeries();

// // //   const summaryCards = [
// // //     {
// // //       title: "Total Books",
// // //       value: formatNumber(metrics.totalTitles || metrics.totalBooks),
// // //       icon: "fa-book",
// // //       color: PRIMARY_COLOR,
// // //       bgColor: "#e0e7ff",

// // //     },
// // //     {
// // //       title: "Total Copies",
// // //       value: formatNumber(metrics.total_copies),
// // //       icon: "fa-copy",
// // //       color: ACCENT_COLOR,
// // //       bgColor: "#e0e7ff",

// // //     },
// // //     {
// // //       title: "Available Copies",
// // //       value: formatNumber(metrics.availableBooks),
// // //       icon: "fa-book-open",
// // //       color: SUCCESS_COLOR,
// // //       bgColor: "#d1fae5",

// // //     },
// // //     {
// // //       title: "Issued Copies",
// // //       value: formatNumber(metrics.issuedBooks),
// // //       icon: "fa-user-pen",
// // //       color: WARNING_COLOR,
// // //       bgColor: "#fef3c7",

// // //     },
// // //   ];

// // //   const alertCards = [
// // //     {
// // //       count: metrics.dueSoonCount,
// // //       label: "Due Soon",
// // //       icon: "fa-clock",
// // //       bg: "#fff7ed",
// // //       color: WARNING_COLOR,

// // //     },
// // //     {
// // //       count: metrics.overdueCount,
// // //       label: "Overdue",
// // //       icon: "fa-circle-exclamation",
// // //       bg: "#fef2f2",
// // //       color: DANGER_COLOR,

// // //     },
// // //     {
// // //       count: metrics.fineCollectedThisMonth,
// // //       label: "Fine Collected",
// // //       icon: "fa-indian-rupee-sign",
// // //       bg: "#ecfdf5",
// // //       color: SUCCESS_COLOR,
// // //       isCurrency: true,

// // //     },
// // //     {
// // //       count: metrics.damagedCount,
// // //       label: "Damaged / Lost",
// // //       icon: "fa-heart-crack",
// // //       bg: "#fdf2f8",
// // //       color: '#db2777',

// // //     }
// // //   ];

// // //   if (loading) {
// // //     return (
// // //       <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
// // //         <Loader />
// // //       </div>
// // //     );
// // //   }

// // //   if (userRole === "STUDENT") {
// // //     return (
// // //       <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "20px" }}>
// // //         <ScrollToTop />
// // //         <Container fluid>
// // //           <Card style={{
// // //             ...styles.card,
// // //             background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${INFO_COLOR} 100%)`,
// // //             color: "white",
// // //             marginBottom: "30px",
// // //             border: 'none'
// // //           }}>
// // //             <Card.Body className="p-4">
// // //               <h1 className="fw-bolder mb-2" style={{ fontSize: '24px' }}>
// // //                 Welcome Back, {userInfo?.firstname || 'Student'}! 👋
// // //               </h1>
// // //               <p className="mb-0 opacity-75" style={{ fontSize: '16px' }}>
// // //                 Your personalized library dashboard is ready. Check your borrowed books and upcoming deadlines.
// // //               </p>
// // //             </Card.Body>
// // //           </Card>

// // //           <Row>
// // //             <Col lg={8} className="mx-auto">
// // //               <Card style={styles.card}>
// // //                 <Card.Header style={styles.cardHeader}>
// // //                   <h5 className="fw-bold mb-0">Your Currently Issued Books</h5>
// // //                 </Card.Header>
// // //                 <Card.Body>
// // //                   <div className="text-center py-5">
// // //                     <i className="fa-solid fa-book-open-reader fa-3x text-muted mb-3"></i>
// // //                     <p className="text-muted">No books currently issued</p>
// // //                     <button className="btn btn-primary mt-2">
// // //                       Browse Library
// // //                     </button>
// // //                   </div>
// // //                 </Card.Body>
// // //               </Card>
// // //             </Col>
// // //           </Row>
// // //         </Container>
// // //       </div>
// // //     );
// // //   }

// // //   return (
// // //     <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "16px" }}>
// // //       <ScrollToTop />
// // //       <Container fluid className="px-2 py-2">
// // //         {/* Header with Filter */}
// // //         <div className="d-flex justify-content-between align-items-center mb-3">
// // //           <div>

// // //             <h6 >
// // //               📚   Real-time analytics for efficient library management
// // //             </h6>
// // //           </div>

// // //           <Dropdown>
// // //             <Dropdown.Toggle
// // //               variant="outline-secondary"
// // //               size="sm"
// // //               className="rounded-pill px-3"
// // //               style={{
// // //                 borderColor: '#e2e8f0',
// // //                 fontSize: '12px',
// // //                 fontWeight: '500'
// // //               }}
// // //             >
// // //               <i className="fa-solid fa-filter me-1"></i>
// // //               Filter: {filter === 'all' ? 'All Time' : filter === 'week' ? 'This Week' : filter === 'month' ? 'This Month' : 'This Year'}
// // //             </Dropdown.Toggle>
// // //             <Dropdown.Menu>
// // //               <Dropdown.Item onClick={() => setFilter("all")}>All Time</Dropdown.Item>
// // //               <Dropdown.Item onClick={() => setFilter("week")}>This Week</Dropdown.Item>
// // //               <Dropdown.Item onClick={() => setFilter("month")}>This Month</Dropdown.Item>
// // //               <Dropdown.Item onClick={() => setFilter("year")}>This Year</Dropdown.Item>
// // //             </Dropdown.Menu>
// // //           </Dropdown>
// // //         </div>

// // //         {/* 1. Core Library Inventory */}
// // //         <Row className="mb-3 g-2">
// // //           {summaryCards.map((card, index) => (
// // //             <Col xl={3} lg={6} md={6} sm={12} key={index}>
// // //               <Card style={styles.card}>
// // //                 <Card.Body className="p-2">
// // //                   <div className="d-flex align-items-center justify-content-between">
// // //                     <div>
// // //                       <p className="mb-1 text-uppercase" style={{
// // //                         fontSize: "10px",
// // //                         fontWeight: "700",
// // //                         color: "#64748b"
// // //                       }}>
// // //                         {card.title}
// // //                       </p>
// // //                       <h2 className="mb-0" style={{
// // //                         color: card.color,
// // //                         fontSize: "20px",
// // //                         fontWeight: "800"
// // //                       }}>
// // //                         {card.value}
// // //                       </h2>
// // //                     </div>
// // //                     <div style={{
// // //                       width: "40px",
// // //                       height: "40px",
// // //                       borderRadius: "10px",
// // //                       backgroundColor: card.bgColor,
// // //                       display: "flex",
// // //                       alignItems: "center",
// // //                       justifyContent: "center",
// // //                       minWidth: "40px"
// // //                     }}>
// // //                       <i className={`fa-solid ${card.icon}`} style={{
// // //                         fontSize: "18px",
// // //                         color: card.color
// // //                       }}></i>
// // //                     </div>
// // //                   </div>
// // //                   <p className="mb-0 small text-muted mt-1" style={{ fontSize: '11px' }}>{card.description}</p>
// // //                 </Card.Body>
// // //               </Card>
// // //             </Col>
// // //           ))}
// // //         </Row>

// // //         {/* 2. Urgent Actions & Financial Metrics */}
// // //         <div style={styles.sectionTitle}>
// // //           <i className="fa-solid fa-bell" style={{ color: WARNING_COLOR, fontSize: '14px' }}></i>
// // //           Urgent Actions
// // //         </div>
// // //         <Row className="mb-3 g-2">
// // //           {alertCards.map((item, idx) => (
// // //             <Col xl={3} lg={6} md={6} sm={12} key={idx}>
// // //               <InteractiveCard style={{ borderLeft: `4px solid ${item.color}` }}>
// // //                 <Card.Body className="p-2">
// // //                   <div className="d-flex align-items-center">
// // //                     <div className="me-2" style={{
// // //                       width: "36px",
// // //                       height: "36px",
// // //                       borderRadius: '8px',
// // //                       background: item.bg,
// // //                       display: 'flex',
// // //                       alignItems: 'center',
// // //                       justifyContent: 'center',
// // //                       fontSize: '14px',
// // //                       color: item.color,
// // //                       flexShrink: 0
// // //                     }}>
// // //                       <i className={`fa-solid ${item.icon}`}></i>
// // //                     </div>
// // //                     <div>
// // //                       <h4 className="mb-0 fw-bolder" style={{
// // //                         color: item.color,
// // //                         fontSize: "16px"
// // //                       }}>
// // //                         {item.isCurrency ? formatCurrency(item.count) : formatNumber(item.count)}
// // //                       </h4>
// // //                       <small className="text-muted fw-semibold" style={{ fontSize: '11px' }}>
// // //                         {item.label}
// // //                       </small>
// // //                     </div>
// // //                   </div>
// // //                   <p className="mb-0 small text-muted mt-1" style={{ fontSize: '10px' }}>{item.description}</p>
// // //                 </Card.Body>
// // //               </InteractiveCard>
// // //             </Col>
// // //           ))}
// // //         </Row>

// // //         {/* 3. Main Charts Section */}
// // //         <Row className="mb-3 g-2">
// // //           {/* Latest Members */}
// // //           <Col lg={4}>
// // //             <Card style={styles.card}>
// // //               <Card.Header style={styles.cardHeader}>
// // //                 <div className="d-flex justify-content-between align-items-center">
// // //                   <div>
// // //                     <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '14px' }}>Latest Members</h6>
// // //                     <small className="text-muted" style={{ fontSize: '11px' }}>Recently joined library members</small>
// // //                   </div>
// // //                   <Badge className="px-2 py-1" style={{
// // //                     borderRadius: '30px',
// // //                     fontSize: '9px',
// // //                     fontWeight: 600,
// // //                     background: SUCCESS_COLOR,
// // //                     color: 'white'
// // //                   }}>
// // //                     NEW
// // //                   </Badge>
// // //                 </div>
// // //               </Card.Header>
// // //               <Card.Body className="p-0">
// // //                 <div className="list-group list-group-flush">
// // //                   {latestMembers.map((member, idx) => (
// // //                     <div key={member.id} className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
// // //                       <div className="d-flex align-items-center">
// // //                         <div className="position-relative me-2">
// // //                           <img
// // //                             src={member.photo}
// // //                             alt={member.name}
// // //                             style={{
// // //                               width: "36px",
// // //                               height: "36px",
// // //                               borderRadius: "50%",
// // //                               objectFit: "cover",
// // //                               border: "2px solid #e2e8f0"
// // //                             }}
// // //                           />
// // //                           <div style={{
// // //                             position: "absolute",
// // //                             bottom: 0,
// // //                             right: 0,
// // //                             width: "10px",
// // //                             height: "10px",
// // //                             borderRadius: "50%",
// // //                             background: SUCCESS_COLOR,
// // //                             border: "2px solid white"
// // //                           }}></div>
// // //                         </div>
// // //                         <div>
// // //                           <p className="mb-0 fw-semibold" style={{ fontSize: '13px' }}>
// // //                             {member.name}
// // //                           </p>
// // //                           <small className="text-muted" style={{ fontSize: '11px' }}>
// // //                             <i className="fa-solid fa-calendar-days me-1"></i>
// // //                             Joined {member.date}
// // //                           </small>
// // //                         </div>
// // //                       </div>
// // //                       <Button variant="outline-primary" size="sm" className="rounded-pill px-2" style={{ fontSize: '11px' }}>
// // //                         View
// // //                       </Button>
// // //                     </div>
// // //                   ))}
// // //                 </div>
// // //                 <div className="px-2 py-1 border-top">
// // //                   <Button variant="link" className="text-decoration-none p-0 w-100 text-center">
// // //                     <small className="fw-semibold" style={{ color: PRIMARY_COLOR, fontSize: '11px' }}>
// // //                       <i className="fa-solid fa-arrow-right me-1"></i>
// // //                       View All Members
// // //                     </small>
// // //                   </Button>
// // //                 </div>
// // //               </Card.Body>
// // //             </Card>
// // //           </Col>

// // //           {/* Funnel Chart - Top Available Books with Full ApexCharts Features */}
// // //           <Col lg={8}>
// // //             <Card style={styles.card}>
// // //               <Card.Header style={styles.cardHeader}>
// // //                 <div className="d-flex justify-content-between align-items-center">
// // //                   <div>
// // //                     <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '14px' }}>Books with Highest Available Stock</h6>
// // //                     <small className="text-muted" style={{ fontSize: '11px' }}>Top 10 books by available copies</small>
// // //                   </div>

// // //                 </div>
// // //               </Card.Header>
// // //               <Card.Body className="p-2">
// // //                 {topAvailableBooks.length > 0 ? (
// // //                   <Chart
// // //                     options={funnelChartOptions}
// // //                     series={funnelChartSeries}
// // //                     type="bar"
// // //                     height={280}
// // //                   />
// // //                 ) : (
// // //                   <div className="d-flex flex-column align-items-center justify-content-center py-4 text-muted">
// // //                     <i className="fa-solid fa-book-open-reader fa-2x mb-2"></i>
// // //                     <small>No inventory data available</small>
// // //                   </div>
// // //                 )}
// // //                 <div className="mt-2 text-center">
// // //                   <small className="text-muted" style={{ fontSize: '10px' }}>
// // //                     <i className="fa-solid fa-circle-info me-1"></i>
// // //                     Hover for details | Click toolbar for export options (PNG, SVG, CSV)
// // //                   </small>
// // //                 </div>
// // //               </Card.Body>
// // //             </Card>
// // //           </Col>
// // //         </Row>

// // //         {/* 4. Secondary Analytics */}
// // //         <Row className="g-2">
// // //           {/* Top Categories */}
// // //           <Col lg={4}>
// // //             <Card style={styles.card}>
// // //               <Card.Header style={styles.cardHeader}>
// // //                 <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '14px' }}>Top Categories by Stock</h6>
// // //                 <small className="text-muted" style={{ fontSize: '11px' }}>Most populated categories</small>
// // //               </Card.Header>
// // //               <Card.Body className="p-0">
// // //                 <div className="list-group list-group-flush">
// // //                   {categories.length > 0 ? categories.map((cat, idx) => (
// // //                     <div key={idx} className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
// // //                       <div className="d-flex align-items-center">
// // //                         <div className="me-2 rounded-circle d-flex align-items-center justify-content-center"
// // //                           style={{
// // //                             width: 32,
// // //                             height: 32,
// // //                             background: '#e0e7ff',
// // //                             color: PRIMARY_COLOR
// // //                           }}>
// // //                           <i className={`fa-solid ${cat.icon}`}></i>
// // //                         </div>
// // //                         <span className="fw-semibold text-dark" style={{ fontSize: '13px' }}>
// // //                           {cat.name.length > 18 ? cat.name.substring(0, 18) + "..." : cat.name}
// // //                         </span>
// // //                       </div>
// // //                       <Badge style={{
// // //                         background: PRIMARY_COLOR,
// // //                         color: 'white',
// // //                         fontWeight: 600,
// // //                         fontSize: '11px'
// // //                       }} className="rounded-pill px-2 py-1">
// // //                         {formatNumber(cat.count)}
// // //                       </Badge>
// // //                     </div>
// // //                   )) : (
// // //                     <div className="text-center py-3 text-muted">
// // //                       <i className="fa-solid fa-tags fa-lg mb-2"></i>
// // //                       <p className="mb-0" style={{ fontSize: '12px' }}>No category data available</p>
// // //                     </div>
// // //                   )}
// // //                 </div>
// // //               </Card.Body>
// // //             </Card>
// // //           </Col>

// // //           {/* Donut Chart with Full ApexCharts Features */}
// // //           <Col lg={4}>
// // //             <Card style={styles.card}>
// // //               <Card.Body className="text-center p-2">
// // //                 <div className="d-flex justify-content-between align-items-center mb-2">
// // //                   <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '14px' }}>
// // //                     Inventory Status
// // //                   </h6>
// // //                   <Badge className="px-2 py-1" style={{
// // //                     borderRadius: '30px',
// // //                     fontSize: '9px',
// // //                     fontWeight: 600,
// // //                     background: INFO_COLOR,
// // //                     color: 'white'
// // //                   }}>
// // //                     DONUT CHART
// // //                   </Badge>
// // //                 </div>
// // //                 <Chart
// // //                   options={donutOptions}
// // //                   series={donutChartSeries}
// // //                   type="donut"
// // //                   height={180}
// // //                 />
// // //                 <div className="mt-2">
// // //                   <div className="d-flex justify-content-center align-items-center mb-1">
// // //                     <div className="me-1" style={{
// // //                       width: '8px',
// // //                       height: '8px',
// // //                       borderRadius: '50%',
// // //                       background: SUCCESS_COLOR
// // //                     }}></div>
// // //                     <span className="text-muted small me-2" style={{ fontSize: '11px' }}>Available: {donutChartSeries[0]}%</span>
// // //                     <div className="me-1" style={{
// // //                       width: '8px',
// // //                       height: '8px',
// // //                       borderRadius: '50%',
// // //                       background: PRIMARY_COLOR
// // //                     }}></div>
// // //                     <span className="text-muted small" style={{ fontSize: '11px' }}>Issued: {donutChartSeries[1]}%</span>
// // //                   </div>
// // //                   <h4 className="fw-bolder mt-1" style={{
// // //                     color: WARNING_COLOR,
// // //                     fontSize: '18px'
// // //                   }}>
// // //                     {donutChartSeries[1]}%
// // //                   </h4>
// // //                   <small className="text-muted" style={{ fontSize: '11px' }}>of total copies currently issued</small>
// // //                 </div>
// // //               </Card.Body>
// // //             </Card>
// // //           </Col>

// // //           {/* Quick Stats */}
// // //           <Col lg={4}>
// // //             <Card style={styles.card}>
// // //               <Card.Header style={styles.cardHeader}>
// // //                 <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '14px' }}>Quick Stats</h6>
// // //                 <small className="text-muted" style={{ fontSize: '11px' }}>Recent library activity</small>
// // //               </Card.Header>
// // //               <Card.Body className="p-0">
// // //                 <div className="list-group list-group-flush">
// // //                   <div className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
// // //                     <div className="d-flex align-items-center">
// // //                       <div className="me-2" style={{
// // //                         width: 32,
// // //                         height: 32,
// // //                         borderRadius: '8px',
// // //                         background: '#e0e7ff',
// // //                         color: PRIMARY_COLOR,
// // //                         display: 'flex',
// // //                         alignItems: 'center',
// // //                         justifyContent: 'center'
// // //                       }}>
// // //                         <i className="fa-solid fa-book-medical"></i>
// // //                       </div>
// // //                       <div>
// // //                         <p className="mb-0 fw-semibold" style={{ fontSize: '13px' }}>New Books This Month</p>
// // //                         <small className="text-muted" style={{ fontSize: '11px' }}>Added in last 30 days</small>
// // //                       </div>
// // //                     </div>
// // //                     <Badge className="rounded-pill px-2 py-1" style={{
// // //                       background: PRIMARY_COLOR,
// // //                       fontSize: '12px',
// // //                       fontWeight: '600'
// // //                     }}>
// // //                       {formatNumber(metrics.booksThisMonth)}
// // //                     </Badge>
// // //                   </div>

// // //                   <div className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
// // //                     <div className="d-flex align-items-center">
// // //                       <div className="me-2" style={{
// // //                         width: 32,
// // //                         height: 32,
// // //                         borderRadius: '8px',
// // //                         background: '#ecfdf5',
// // //                         color: SUCCESS_COLOR,
// // //                         display: 'flex',
// // //                         alignItems: 'center',
// // //                         justifyContent: 'center'
// // //                       }}>
// // //                         <i className="fa-solid fa-users"></i>
// // //                       </div>
// // //                       <div>
// // //                         <p className="mb-0 fw-semibold" style={{ fontSize: '13px' }}>Active Borrowers</p>
// // //                         <small className="text-muted" style={{ fontSize: '11px' }}>Currently issued books</small>
// // //                       </div>
// // //                     </div>
// // //                     <Badge className="rounded-pill px-2 py-1" style={{
// // //                       background: SUCCESS_COLOR,
// // //                       fontSize: '12px',
// // //                       fontWeight: '600'
// // //                     }}>
// // //                       {formatNumber(cardDetails.length)}
// // //                     </Badge>
// // //                   </div>

// // //                   <div className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
// // //                     <div className="d-flex align-items-center">
// // //                       <div className="me-2" style={{
// // //                         width: 32,
// // //                         height: 32,
// // //                         borderRadius: '8px',
// // //                         background: '#fef3c7',
// // //                         color: WARNING_COLOR,
// // //                         display: 'flex',
// // //                         alignItems: 'center',
// // //                         justifyContent: 'center'
// // //                       }}>
// // //                         <i className="fa-solid fa-percentage"></i>
// // //                       </div>
// // //                       <div>
// // //                         <p className="mb-0 fw-semibold" style={{ fontSize: '13px' }}>Utilization Rate</p>
// // //                         <small className="text-muted" style={{ fontSize: '11px' }}>Library capacity usage</small>
// // //                       </div>
// // //                     </div>
// // //                     <Badge className="rounded-pill px-2 py-1" style={{
// // //                       background: WARNING_COLOR,
// // //                       fontSize: '12px',
// // //                       fontWeight: '600'
// // //                     }}>
// // //                       {metrics.total_copies > 0 ? Math.round((metrics.issuedBooks / metrics.total_copies) * 100) : 0}%
// // //                     </Badge>
// // //                   </div>
// // //                 </div>
// // //               </Card.Body>
// // //             </Card>
// // //           </Col>
// // //         </Row>
// // //       </Container>
// // //     </div>
// // //   );
// // // };

// // // export default Dashboard;
// // /*
// // **@Author: Aabid 
// // **@Date: NOV-2025
// // */

// // import React, { useState, useEffect, useCallback } from "react";
// // import {
// //   Card,
// //   Col,
// //   Container,
// //   Row,
// //   Badge,
// //   Button,
// //   Dropdown,
// //   Modal,
// //   Table,
// //   Form
// // } from "react-bootstrap";
// // import Chart from "react-apexcharts";
// // import ScrollToTop from "./common/ScrollToTop";
// // import DataApi from "../api/dataApi";
// // import Loader from "./common/Loader";
// // import jwt_decode from "jwt-decode";
// // import DashboardApi from "../api/dashboardApi";
// // import ResizableTable from "./common/ResizableTable";

// // const PRIMARY_COLOR = "#f3e9fc";
// // const ACCENT_COLOR = "#6366f1";
// // const SUCCESS_COLOR = "#059669";
// // const WARNING_COLOR = "#f59e0b";
// // const DANGER_COLOR = "#dc2626";
// // const INFO_COLOR = "#8b5cf6";

// // const styles = {
// //   card: {
// //     border: "1px solid #e2e8f0",
// //     borderRadius: "16px",
// //     boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
// //     background: "#fff",
// //     height: "100%",
// //     transition: "all 0.3s ease",
// //     overflow: "hidden",
// //   },
// //   interactiveCard: {
// //     cursor: "pointer",
// //   },
// //   cardHeader: {
// //     background: "transparent",
// //     borderBottom: "1px solid #f1f5f9",
// //     borderRadius: "16px 16px 0 0",
// //     padding: "12px 16px"
// //   },
// //   cardBody: {
// //     padding: "16px"
// //   },
// //   sectionTitle: {
// //     fontSize: "15px",
// //     fontWeight: "600",
// //     color: "#0f172a",
// //     marginBottom: "16px",
// //     marginTop: "20px",
// //     display: "flex",
// //     alignItems: "center",
// //     gap: "10px",
// //     paddingLeft: "5px"
// //   }
// // };

// // const AlertCardHoverStyle = {
// //   "&:hover": {
// //     transform: "translateY(-3px)",
// //     boxShadow: "0 15px 40px rgba(0, 0, 0, 0.1)",
// //   }
// // };

// // const InteractiveCard = ({ children, style, onClick, ...props }) => {
// //   const [hover, setHover] = useState(false);
// //   return (
// //     <Card
// //       {...props}
// //       style={{
// //         ...styles.card,
// //         ...styles.interactiveCard,
// //         ...style,
// //         ...(hover ? AlertCardHoverStyle["&:hover"] : {}),
// //       }}
// //       onMouseEnter={() => setHover(true)}
// //       onMouseLeave={() => setHover(false)}
// //       onClick={onClick}
// //     >
// //       {children}
// //     </Card>
// //   );
// // };

// // const DetailModal = ({ show, handleClose, modalData }) => {
// //   const [searchTerm, setSearchTerm] = useState('');
// //   const [selectedItems, setSelectedItems] = useState([]);

// //   if (!modalData) return null;

// //   // Define formatCurrency function inside DetailModal
// //   const formatCurrency = (val) => {
// //     const n = Number(val);
// //     if (!isFinite(n)) return `₹0.00`;
// //     return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// //   };

// //   const formatValue = (value, isCurrency = false) => {
// //     if (isCurrency) {
// //       return formatCurrency(value);
// //     }
// //     if (typeof value === 'number') {
// //       return value.toLocaleString('en-IN');
// //     }
// //     return value || '-';
// //   };

// //   const getModalContent = () => {
// //     switch (modalData.type) {
// //       case "totalBooks":
// //         return {
// //           title: "Total Books Details",
// //           description: "Complete inventory of all book titles in the library",
// //           icon: "fa-book",
// //           color: PRIMARY_COLOR,
// //           columns: [
// //             { key: 'serial', label: 'S.No', width: 80 },
// //             { key: 'title', label: 'Book Title', width: 200 },
// //             { key: 'author', label: 'Author', width: 150 },
// //             { key: 'category', label: 'Category', width: 120 },
// //             { key: 'isbn', label: 'ISBN', width: 120 },
// //             { key: 'total_copies', label: 'Total Copies', width: 100, align: 'right' },
// //             { key: 'available_copies', label: 'Available', width: 100, align: 'right' }
// //           ],
// //           data: modalData.data.books || [],
// //           summary: [
// //             { label: "Total Titles", value: modalData.data.totalTitles || 0 },
// //             { label: "Total Copies", value: modalData.data.total_copies || 0 },
// //             { label: "Categories", value: modalData.data.categories || 0 },
// //             { label: "Average Copies", value: modalData.data.avgCopies || "N/A" }
// //           ],
// //           exportFileName: "Total_Books_Report"
// //         };

// //       case "totalCopies":
// //         return {
// //           title: "Total Copies Details",
// //           description: "Detailed breakdown of all book copies in the library",
// //           icon: "fa-copy",
// //           color: ACCENT_COLOR,
// //           columns: [
// //             { key: 'serial', label: 'S.No', width: 80 },
// //             { key: 'title', label: 'Book Title', width: 200 },
// //             { key: 'total_copies', label: 'Total Copies', width: 100, align: 'right' },
// //             { key: 'available', label: 'Available', width: 100, align: 'right' },
// //             { key: 'issued', label: 'Issued', width: 100, align: 'right' },
// //             { key: 'reserved', label: 'Reserved', width: 100, align: 'right' },
// //             { key: 'damaged', label: 'Damaged/Lost', width: 100, align: 'right' }
// //           ],
// //           data: modalData.data.books || [],
// //           summary: [
// //             { label: "Available Copies", value: modalData.data.availableBooks || 0 },
// //             { label: "Issued Copies", value: modalData.data.issuedBooks || 0 },
// //             { label: "Reserved Copies", value: modalData.data.reserved || 0 },
// //             { label: "Damaged/Lost", value: modalData.data.damagedCount || 0 }
// //           ],
// //           exportFileName: "Total_Copies_Report"
// //         };

// //       case "availableCopies":
// //         return {
// //           title: "Available Copies Details",
// //           description: "Books currently available for issue",
// //           icon: "fa-book-open",
// //           color: SUCCESS_COLOR,
// //           columns: [
// //             { key: 'serial', label: 'S.No', width: 80 },
// //             { key: 'title', label: 'Book Title', width: 200 },
// //             { key: 'author', label: 'Author', width: 150 },
// //             { key: 'category', label: 'Category', width: 120 },
// //             { key: 'available_copies', label: 'Available Copies', width: 120, align: 'right' },
// //             { key: 'total_copies', label: 'Total Copies', width: 100, align: 'right' },
// //             { key: 'location', label: 'Location', width: 120 }
// //           ],
// //           data: modalData.data.books || [],
// //           summary: [
// //             { label: "Total Available", value: modalData.data.availableBooks || 0 },
// //             { label: "Available Titles", value: modalData.data.availableTitles || 0 },
// //             { label: "By Category", value: modalData.data.byCategory || "N/A" },
// //             { label: "New Arrivals", value: modalData.data.newArrivals || 0 }
// //           ],
// //           exportFileName: "Available_Copies_Report"
// //         };

// //       case "issuedCopies":
// //         return {
// //           title: "Issued Copies Details",
// //           description: "Books currently issued to members",
// //           icon: "fa-user-pen",
// //           color: WARNING_COLOR,
// //           columns: [
// //             { key: 'serial', label: 'S.No', width: 80 },
// //             { key: 'book_title', label: 'Book Title', width: 200 },
// //             { key: 'member_name', label: 'Member Name', width: 150 },
// //             { key: 'card_number', label: 'Card Number', width: 120 },
// //             { key: 'issue_date', label: 'Issue Date', width: 100 },
// //             { key: 'due_date', label: 'Due Date', width: 100 },
// //             { key: 'status', label: 'Status', width: 100 }
// //           ],
// //           data: modalData.data.issues || [],
// //           summary: [
// //             { label: "Total Issued", value: modalData.data.issuedBooks || 0 },
// //             { label: "Active Borrowers", value: modalData.data.activeBorrowers || 0 },
// //             { label: "Due Soon", value: modalData.data.dueSoonCount || 0 },
// //             { label: "Overdue", value: modalData.data.overdueCount || 0 }
// //           ],
// //           exportFileName: "Issued_Copies_Report"
// //         };

// //       case "dueSoon":
// //         return {
// //           title: "Due Soon Books",
// //           description: "Books that are due for return soon",
// //           icon: "fa-clock",
// //           color: WARNING_COLOR,
// //           columns: [
// //             { key: 'serial', label: 'S.No', width: 80 },
// //             { key: 'book_title', label: 'Book Title', width: 200 },
// //             { key: 'member_name', label: 'Member', width: 150 },
// //             { key: 'due_date', label: 'Due Date', width: 100 },
// //             { key: 'days_remaining', label: 'Days Remaining', width: 120, align: 'right' },
// //             { key: 'fine_amount', label: 'Fine if Overdue', width: 120, align: 'right', isCurrency: true },
// //             { key: 'contact', label: 'Contact', width: 120 }
// //           ],
// //           data: modalData.data.issues || [],
// //           summary: [
// //             { label: "Total Due Soon", value: modalData.data.count || 0 },
// //             { label: "Within 1 Day", value: modalData.data.within1Day || 0 },
// //             { label: "Within 3 Days", value: modalData.data.within3Days || 0 },
// //             { label: "Within 7 Days", value: modalData.data.within7Days || 0 }
// //           ],
// //           exportFileName: "Due_Soon_Books_Report"
// //         };

// //       case "overdue":
// //         return {
// //           title: "Overdue Books",
// //           description: "Books that are overdue for return",
// //           icon: "fa-circle-exclamation",
// //           color: DANGER_COLOR,
// //           columns: [
// //             { key: 'serial', label: 'S.No', width: 80 },
// //             { key: 'book_title', label: 'Book Title', width: 200 },
// //             { key: 'member_name', label: 'Member', width: 150 },
// //             { key: 'due_date', label: 'Due Date', width: 100 },
// //             { key: 'days_overdue', label: 'Days Overdue', width: 120, align: 'right' },
// //             { key: 'fine_amount', label: 'Fine Amount', width: 120, align: 'right', isCurrency: true },
// //             { key: 'contact', label: 'Contact', width: 120 }
// //           ],
// //           data: modalData.data.issues || [],
// //           summary: [
// //             { label: "Total Overdue", value: modalData.data.count || 0 },
// //             { label: "1-7 Days Overdue", value: modalData.data.overdue1to7 || 0 },
// //             { label: "8-30 Days Overdue", value: modalData.data.overdue8to30 || 0 },
// //             { label: "30+ Days Overdue", value: modalData.data.overdue30Plus || 0 }
// //           ],
// //           exportFileName: "Overdue_Books_Report"
// //         };

// //       case "fineCollected":
// //         return {
// //           title: "Fine Collection Details",
// //           description: "Fine collected this month",
// //           icon: "fa-indian-rupee-sign",
// //           color: SUCCESS_COLOR,
// //           columns: [
// //             { key: 'serial', label: 'S.No', width: 80 },
// //             { key: 'member_name', label: 'Member Name', width: 150 },
// //             { key: 'book_title', label: 'Book Title', width: 200 },
// //             { key: 'reason', label: 'Reason', width: 120 },
// //             { key: 'amount', label: 'Amount', width: 100, align: 'right', isCurrency: true },
// //             { key: 'payment_date', label: 'Payment Date', width: 100 },
// //             { key: 'payment_mode', label: 'Payment Mode', width: 120 }
// //           ],
// //           data: modalData.data.transactions || [],
// //           summary: [
// //             { label: "Total Collected", value: modalData.data.count || 0, isCurrency: true },
// //             { label: "From Overdue", value: modalData.data.fromOverdue || 0, isCurrency: true },
// //             { label: "From Damaged", value: modalData.data.fromDamaged || 0, isCurrency: true },
// //             { label: "From Lost", value: modalData.data.fromLost || 0, isCurrency: true }
// //           ],
// //           exportFileName: "Fine_Collection_Report"
// //         };

// //       case "damagedLost":
// //         return {
// //           title: "Damaged/Lost Books",
// //           description: "Books that are damaged or lost",
// //           icon: "fa-heart-crack",
// //           color: '#db2777',
// //           columns: [
// //             { key: 'serial', label: 'S.No', width: 80 },
// //             { key: 'book_title', label: 'Book Title', width: 200 },
// //             { key: 'type', label: 'Type', width: 100 },
// //             { key: 'reported_by', label: 'Reported By', width: 150 },
// //             { key: 'report_date', label: 'Report Date', width: 100 },
// //             { key: 'status', label: 'Status', width: 100 },
// //             { key: 'estimated_cost', label: 'Estimated Cost', width: 120, align: 'right', isCurrency: true }
// //           ],
// //           data: modalData.data.records || [],
// //           summary: [
// //             { label: "Total Damaged/Lost", value: modalData.data.count || 0 },
// //             { label: "Damaged Books", value: modalData.data.damaged || 0 },
// //             { label: "Lost Books", value: modalData.data.lost || 0 },
// //             { label: "Under Review", value: modalData.data.underReview || 0 }
// //           ],
// //           exportFileName: "Damaged_Lost_Books_Report"
// //         };

// //       case "latestMembers":
// //         return {
// //           title: "Latest Members",
// //           description: "Recently joined library members",
// //           icon: "fa-users",
// //           color: SUCCESS_COLOR,
// //           columns: [
// //             { key: 'serial', label: 'S.No', width: 80 },
// //             { key: 'name', label: 'Name', width: 150 },
// //             { key: 'email', label: 'Email', width: 200 },
// //             { key: 'phone', label: 'Phone', width: 120 },
// //             { key: 'join_date', label: 'Join Date', width: 100 },
// //             { key: 'card_number', label: 'Card Number', width: 120 },
// //             { key: 'status', label: 'Status', width: 100 }
// //           ],
// //           data: modalData.data.members || [],
// //           summary: [
// //             { label: "Total New Members", value: modalData.data.total || 0 },
// //             { label: "This Month", value: modalData.data.thisMonth || 0 },
// //             { label: "This Week", value: modalData.data.thisWeek || 0 },
// //             { label: "Today", value: modalData.data.today || 0 }
// //           ],
// //           exportFileName: "Latest_Members_Report"
// //         };

// //       case "topCategories":
// //         return {
// //           title: "Top Categories",
// //           description: "Most populated book categories",
// //           icon: "fa-tags",
// //           color: PRIMARY_COLOR,
// //           columns: [
// //             { key: 'serial', label: 'S.No', width: 80 },
// //             { key: 'name', label: 'Category Name', width: 150 },
// //             { key: 'book_count', label: 'Total Books', width: 100, align: 'right' },
// //             { key: 'total_copies', label: 'Total Copies', width: 100, align: 'right' },
// //             { key: 'available_copies', label: 'Available Copies', width: 120, align: 'right' },
// //             { key: 'percentage', label: 'Percentage', width: 100, align: 'right' },
// //             { key: 'popular_author', label: 'Popular Author', width: 150 }
// //           ],
// //           data: modalData.data.categories || [],
// //           summary: [
// //             { label: "Total Categories", value: modalData.data.totalCategories || 0 },
// //             { label: "Books in Top Categories", value: modalData.data.totalBooks || 0 },
// //             { label: "Average Books", value: modalData.data.avgBooks || "N/A" },
// //             { label: "Most Popular", value: modalData.data.topCategory || "N/A" }
// //           ],
// //           exportFileName: "Top_Categories_Report"
// //         };

// //       case "quickStats":
// //         return {
// //           title: "Quick Stats Details",
// //           description: "Detailed library activity statistics",
// //           icon: "fa-chart-line",
// //           color: INFO_COLOR,
// //           columns: [
// //             { key: 'serial', label: 'S.No', width: 80 },
// //             { key: 'activity', label: 'Activity', width: 200 },
// //             { key: 'count', label: 'Count', width: 100, align: 'right' },
// //             { key: 'percentage', label: 'Percentage', width: 100, align: 'right' },
// //             { key: 'trend', label: 'Trend', width: 80 },
// //             { key: 'last_updated', label: 'Last Updated', width: 120 },
// //             { key: 'remarks', label: 'Remarks', width: 120 }
// //           ],
// //           data: modalData.data.stats || [],
// //           summary: [
// //             { label: "New Books This Month", value: modalData.data.booksThisMonth || 0 },
// //             { label: "Active Borrowers", value: modalData.data.activeBorrowers || 0 },
// //             { label: "Utilization Rate", value: `${modalData.data.utilizationRate || 0}%` },
// //             { label: "Total Submissions", value: modalData.data.totalSubmissions || 0 }
// //           ],
// //           exportFileName: "Quick_Stats_Report"
// //         };

// //       default:
// //         return {
// //           title: "Details",
// //           description: "Detailed information",
// //           icon: "fa-info-circle",
// //           color: INFO_COLOR,
// //           columns: [],
// //           data: [],
// //           summary: [],
// //           exportFileName: "Report"
// //         };
// //     }
// //   };

// //   const content = getModalContent();

// //   // Add serial numbers to data
// //   const dataWithSerial = content.data.map((item, index) => ({
// //     ...item,
// //     serial: index + 1
// //   }));

// //   // Handle export functionality
// //   const handleExport = (format) => {
// //     const exportData = content.data.map((item, index) => {
// //       const row = { 'S.No': index + 1 };
// //       content.columns.forEach(col => {
// //         if (col.key !== 'serial') {
// //           const value = item[col.key];
// //           row[col.label] = col.isCurrency ? formatCurrency(value) : value;
// //         }
// //       });
// //       return row;
// //     });

// //     switch (format) {
// //       case 'csv':
// //         exportToCSV(exportData, content.exportFileName);
// //         break;
// //       case 'pdf':
// //         exportToPDF(exportData, content.title, content.description);
// //         break;
// //       case 'excel':
// //         exportToExcel(exportData, content.exportFileName);
// //         break;
// //     }
// //   };

// //   const exportToCSV = (data, filename) => {
// //     const headers = Object.keys(data[0] || {});
// //     const csvRows = [
// //       headers.join(','),
// //       ...data.map(row =>
// //         headers.map(header => {
// //           const cell = row[header];
// //           return typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell;
// //         }).join(',')
// //       )
// //     ];

// //     const csvContent = csvRows.join('\n');
// //     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
// //     const link = document.createElement('a');
// //     const url = URL.createObjectURL(blob);
// //     link.setAttribute('href', url);
// //     link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
// //     link.style.visibility = 'hidden';
// //     document.body.appendChild(link);
// //     link.click();
// //     document.body.removeChild(link);
// //   };

// //   const exportToPDF = (data, title, description) => {
// //     // For PDF export, we can use a simple approach or integrate with a PDF library
// //     const printContent = `
// //       <html>
// //         <head>
// //           <title>${title}</title>
// //           <style>
// //             body { font-family: Arial, sans-serif; }
// //             h1 { color: #333; }
// //             table { width: 100%; border-collapse: collapse; margin-top: 20px; }
// //             th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
// //             th { background-color: #f2f2f2; }
// //           </style>
// //         </head>
// //         <body>
// //           <h1>${title}</h1>
// //           <p>${description}</p>
// //           <p>Generated on: ${new Date().toLocaleString()}</p>
// //           <table>
// //             <thead>
// //               <tr>
// //                 ${Object.keys(data[0] || {}).map(key => `<th>${key}</th>`).join('')}
// //               </tr>
// //             </thead>
// //             <tbody>
// //               ${data.map(row => `
// //                 <tr>
// //                   ${Object.values(row).map(cell => `<td>${cell}</td>`).join('')}
// //                 </tr>
// //               `).join('')}
// //             </tbody>
// //           </table>
// //         </body>
// //       </html>
// //     `;

// //     const printWindow = window.open('', '_blank');
// //     printWindow.document.write(printContent);
// //     printWindow.document.close();
// //     printWindow.print();
// //   };

// //   const exportToExcel = (data, filename) => {
// //     // For Excel export, we can use CSV as Excel can open CSV files
// //     exportToCSV(data, filename);
// //   };

// //   // Custom cell renderer for status badges
// //   const renderStatusBadge = (value) => {
// //     let bgColor = 'secondary';
// //     if (value === 'Active' || value === 'Available') bgColor = 'success';
// //     else if (value === 'Issued' || value === 'Pending') bgColor = 'warning';
// //     else if (value === 'Overdue' || value === 'Damaged') bgColor = 'danger';

// //     return (
// //       <Badge bg={bgColor} className="rounded-pill">
// //         {value}
// //       </Badge>
// //     );
// //   };

// //   // Custom cell renderer for currency
// //   const renderCurrency = (value) => (
// //     <span className="fw-semibold" style={{ color: SUCCESS_COLOR }}>
// //       {formatCurrency(value)}
// //     </span>
// //   );

// //   // Custom cell renderer based on column type
// //   const cellRenderer = (column, value, row) => {
// //     if (column.key === 'status') {
// //       return renderStatusBadge(value);
// //     }
// //     if (column.isCurrency) {
// //       return renderCurrency(value);
// //     }
// //     return value || '-';
// //   };

// //   // Handle selection change
// //   const handleSelectionChange = (selected) => {
// //     setSelectedItems(selected);
// //   };

// //   // Custom actions renderer for export selected
// //   const actionsRenderer = (selectedItems) => (
// //     <>
// //       {selectedItems.length > 0 && (
// //         <Button
// //           variant="outline-primary"
// //           size="sm"
// //           onClick={() => {
// //             const selectedData = content.data.filter((_, index) =>
// //               selectedItems.includes(index)
// //             );
// //             console.log('Selected data for export:', selectedData);
// //             // You can implement export of selected items here
// //             alert(`${selectedItems.length} items selected for export`);
// //           }}
// //           className="me-2"
// //         >
// //           <i className="fa-solid fa-download me-1"></i>
// //           Export Selected ({selectedItems.length})
// //         </Button>
// //       )}
// //     </>
// //   );

// //   return (
// //     <Modal
// //       show={show}
// //       onHide={handleClose}
// //       size="xl"
// //       centered
// //       backdrop="static"
// //       fullscreen="lg-down"
// //     >
// //       <Modal.Header closeButton style={{ background: PRIMARY_COLOR }}>
// //         <Modal.Title className="d-flex align-items-center">
// //           <i className={`fa-solid ${content.icon} me-2`}></i>
// //           {content.title}
// //         </Modal.Title>
// //       </Modal.Header>
// //       <Modal.Body style={{ maxHeight: '70vh', overflow: 'auto' }}>
// //         <p className="text-muted mb-3">{content.description}</p>

// //         {/* Summary Cards */}
// //         <Row className="mb-4">
// //           {content.summary.map((item, idx) => (
// //             <Col md={3} key={idx} className="mb-3">
// //               <Card className="border-0 shadow-sm">
// //                 <Card.Body className="p-3">
// //                   <div className="d-flex align-items-center justify-content-between">
// //                     <div>
// //                       <p className="mb-1 text-uppercase" style={{
// //                         fontSize: "10px",
// //                         fontWeight: "600",
// //                         color: "#64748b"
// //                       }}>
// //                         {item.label}
// //                       </p>
// //                       <h5 className="mb-0" style={{
// //                         color: content.color,
// //                         fontWeight: "700"
// //                       }}>
// //                         {item.isCurrency ? formatCurrency(item.value) : formatValue(item.value)}
// //                       </h5>
// //                     </div>
// //                   </div>
// //                 </Card.Body>
// //               </Card>
// //             </Col>
// //           ))}
// //         </Row>

// //         {/* Search and Export Controls */}
// //         <div className="d-flex justify-content-between align-items-center mb-3">
// //           <div className="d-flex align-items-center gap-2">
// //             <div style={{ width: '300px' }}>
// //               <Form.Control
// //                 type="text"
// //                 placeholder="Search in table..."
// //                 value={searchTerm}
// //                 onChange={(e) => setSearchTerm(e.target.value)}
// //                 size="sm"
// //               />
// //             </div>
// //             <div className="text-muted small">
// //               Showing {dataWithSerial.length} records
// //             </div>
// //           </div>
// //           <div className="d-flex align-items-center gap-2">
// //             <Dropdown>
// //               <Dropdown.Toggle variant="primary" size="sm" style={{ background: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}>
// //                 <i className="fa-solid fa-download me-1"></i>
// //                 Export
// //               </Dropdown.Toggle>
// //               <Dropdown.Menu>
// //                 <Dropdown.Item onClick={() => handleExport('csv')}>
// //                   <i className="fa-solid fa-file-csv me-2"></i>
// //                   Export as CSV
// //                 </Dropdown.Item>
// //                 <Dropdown.Item onClick={() => handleExport('excel')}>
// //                   <i className="fa-solid fa-file-excel me-2"></i>
// //                   Export as Excel
// //                 </Dropdown.Item>
// //                 <Dropdown.Item onClick={() => handleExport('pdf')}>
// //                   <i className="fa-solid fa-file-pdf me-2"></i>
// //                   Export as PDF
// //                 </Dropdown.Item>
// //               </Dropdown.Menu>
// //             </Dropdown>
// //           </div>
// //         </div>

// //         {/* Resizable Table */}
// //         <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
// //           <ResizableTable
// //             data={dataWithSerial}
// //             columns={content.columns}
// //             searchTerm={searchTerm}
// //             showSerialNumber={true}
// //             showCheckbox={true}
// //             showActions={true}
// //             cellRenderer={cellRenderer}
// //             actionsRenderer={actionsRenderer}
// //             selectedItems={selectedItems}
// //             onSelectionChange={handleSelectionChange}
// //             emptyMessage="No data available for this section"
// //             style={{ maxHeight: '400px', overflow: 'auto' }}
// //           />
// //         </div>

// //         {/* Table Info */}
// //         <div className="d-flex justify-content-between align-items-center mt-3">
// //           <div className="text-muted small">
// //             <i className="fa-solid fa-circle-info me-1"></i>
// //             Drag column borders to resize • Scroll horizontally to view all columns
// //           </div>
// //           <div className="text-muted small">
// //             Last Updated: {new Date().toLocaleDateString()}
// //           </div>
// //         </div>
// //       </Modal.Body>
// //       <Modal.Footer className="border-top-0">
// //         <Button variant="outline-secondary" onClick={handleClose}>
// //           Close
// //         </Button>
// //         <Button
// //           variant="primary"
// //           style={{ background: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
// //           onClick={() => handleExport('csv')}
// //         >
// //           <i className="fa-solid fa-download me-2"></i>
// //           Export All Data
// //         </Button>
// //       </Modal.Footer>
// //     </Modal>
// //   );
// // };

// // const Dashboard = ({ userInfo: propUserInfo }) => {
// //   const [loading, setLoading] = useState(true);
// //   const [dashboardData, setDashboardData] = useState(null);
// //   const [userInfo, setUserInfo] = useState(null);
// //   const [userRole, setUserRole] = useState(null);
// //   const [filter, setFilter] = useState("all");
// //   const [showModal, setShowModal] = useState(false);
// //   const [modalData, setModalData] = useState(null);
// //   const [booksData, setBooksData] = useState([]);
// //   const [issuesData, setIssuesData] = useState([]);

// //   const [metrics, setMetrics] = useState({
// //     dueSoonCount: 0,
// //     overdueCount: 0,
// //     fineCollectedThisMonth: 0,
// //     damagedCount: 0,
// //     totalBooks: 0,
// //     totalTitles: 0,
// //     availableBooks: 0,
// //     issuedBooks: 0,
// //     booksThisMonth: 0,
// //     totalSubmissions: 0,
// //     total_copies: 0,
// //   });

// //   const [cardDetails, setCardDetails] = useState([]);
// //   const [cardLimitSetting, setCardLimitSetting] = useState(6);
// //   const [categories, setCategories] = useState([]);
// //   const [topAvailableBooks, setTopAvailableBooks] = useState([]);
// //   const [latestMembers, setLatestMembers] = useState([]);
// //   const [booksByCategory, setBooksByCategory] = useState([]);

// //   const formatNumber = useCallback((num) => {
// //     if (num === null || num === undefined || isNaN(num)) return "0";
// //     return Number(num).toLocaleString('en-IN');
// //   }, []);

// //   const formatCurrency = useCallback((val) => {
// //     const n = Number(val);
// //     if (!isFinite(n)) return `₹0.00`;
// //     return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// //   }, []);

// //   const dummyPhotos = [
// //     "https://randomuser.me/api/portraits/men/32.jpg",
// //     "https://randomuser.me/api/portraits/women/44.jpg",
// //     "https://randomuser.me/api/portraits/men/67.jpg",
// //     "https://randomuser.me/api/portraits/women/65.jpg",
// //     "https://randomuser.me/api/portraits/men/75.jpg"
// //   ];

// //   useEffect(() => {
// //     const initializeUser = () => {
// //       let currentUserInfo = propUserInfo;
// //       if (!currentUserInfo) {
// //         try {
// //           const token = sessionStorage.getItem("token");
// //           if (token) {
// //             currentUserInfo = jwt_decode(token);
// //           }
// //         } catch (error) {
// //           console.error("Error decoding token:", error);
// //         }
// //       }
// //       setUserInfo(currentUserInfo);
// //       setUserRole(currentUserInfo?.userrole?.toUpperCase() || "ADMIN");
// //     };

// //     initializeUser();
// //   }, [propUserInfo]);

// //   useEffect(() => {
// //     let isMounted = true;

// //     const fetchAllDashboardData = async () => {
// //       try {
// //         setLoading(true);

// //         await Promise.all([
// //           fetchDashboardSummary(),
// //           fetchAlertMetrics(),
// //           fetchLibraryDetails(),
// //           fetchLatestMembers(),
// //           fetchAllBooks(),
// //           fetchAllIssues()
// //         ]);

// //       } catch (error) {
// //         console.error("Error in dashboard data fetch:", error);
// //       } finally {
// //         if (isMounted) {
// //           setLoading(false);
// //         }
// //       }
// //     };

// //     fetchAllDashboardData();

// //     return () => {
// //       isMounted = false;
// //     };
// //   }, []);

// //   const fetchAllBooks = async () => {
// //     try {
// //       const bookApi = new DataApi("book");
// //       const booksResp = await bookApi.fetchAll();
// //       const books = Array.isArray(booksResp?.data) ? booksResp.data :
// //         (booksResp?.data?.rows || booksResp || []);
// //       setBooksData(books);
// //     } catch (error) {
// //       console.error("Error fetching books:", error);
// //     }
// //   };

// //   const fetchAllIssues = async () => {
// //     try {
// //       const issueApi = new DataApi("bookissue");
// //       const issuesResp = await issueApi.fetchAll();
// //       const issues = Array.isArray(issuesResp?.data) ? issuesResp.data :
// //         (issuesResp?.data?.rows || issuesResp || []);
// //       setIssuesData(issues);
// //     } catch (error) {
// //       console.error("Error fetching issues:", error);
// //     }
// //   };

// //   const fetchLatestMembers = () => {
// //     const membersData = [
// //       {
// //         id: 1,
// //         name: "Alexander Perce",
// //         email: "alex@example.com",
// //         phone: "+91 98765 43210",
// //         join_date: "12 Jan 2024",
// //         card_number: "LIB2024001",
// //         status: "Active",
// //         photo: dummyPhotos[0]
// //       },
// //       {
// //         id: 2,
// //         name: "Terley Norman",
// //         email: "terley@example.com",
// //         phone: "+91 98765 43211",
// //         join_date: "12 Jan 2024",
// //         card_number: "LIB2024002",
// //         status: "Active",
// //         photo: dummyPhotos[1]
// //       },
// //       {
// //         id: 3,
// //         name: "Tromsley Latex",
// //         email: "tromsley@example.com",
// //         phone: "+91 98765 43212",
// //         join_date: "12 Jan 2024",
// //         card_number: "LIB2024003",
// //         status: "Active",
// //         photo: dummyPhotos[2]
// //       },
// //       {
// //         id: 4,
// //         name: "John Browser",
// //         email: "john@example.com",
// //         phone: "+91 98765 43213",
// //         join_date: "12 Jan 2024",
// //         card_number: "LIB2024004",
// //         status: "Active",
// //         photo: dummyPhotos[3]
// //       },
// //       {
// //         id: 5,
// //         name: "Alexander Perce",
// //         email: "alex2@example.com",
// //         phone: "+91 98765 43214",
// //         join_date: "11 Jan 2024",
// //         card_number: "LIB2024005",
// //         status: "Active",
// //         photo: dummyPhotos[4]
// //       },
// //     ];
// //     setLatestMembers(membersData);
// //   };

// //   const fetchDashboardSummary = async () => {
// //     try {
// //       const libraryApi = new DataApi("library");
// //       const dashboardResponse = await libraryApi.get("/dashboard");

// //       if (dashboardResponse.data?.success) {
// //         const data = dashboardResponse.data.data;
// //         setDashboardData(data);
// //         if (data.summary) {
// //           setMetrics(prev => ({
// //             ...prev,
// //             totalBooks: data.summary.totalBooks || data.summary.total_copies || 0,
// //             totalTitles: data.summary.totalTitles || data.summary.total_books || 0,
// //             availableBooks: data.summary.availableBooks || data.summary.available_copies || 0,
// //             issuedBooks: data.summary.issuedBooks || data.summary.issued_copies || 0,
// //             booksThisMonth: data.summary.booksThisMonth || data.summary.books_this_month || 0,
// //             totalSubmissions: data.summary.totalSubmissions || data.summary.total_submissions || 0,
// //             total_copies: data.summary.totalCopies || data.summary.totalCopies || 0,
// //           }));
// //         }
// //         if (data.booksByCategory?.length > 0) {
// //           setBooksByCategory(data.booksByCategory);
// //           const topCategories = data.booksByCategory.slice(0, 5).map(item => ({
// //             name: item.category_name || "Unknown",
// //             icon: "fa-tag",
// //             count: parseInt(item.book_count || 0),
// //           }));
// //           setCategories(topCategories);
// //         }
// //       }
// //     } catch (error) {
// //       console.error("Error fetching dashboard summary:", error);
// //     }
// //   };

// //   const fetchAlertMetrics = async () => {
// //     try {
// //       const resp = await DashboardApi.fetchAll();
// //       const data = resp?.data?.[0] || {};

// //       setMetrics(prev => ({
// //         ...prev,
// //         dueSoonCount: data.total_due_soon || 0,
// //         overdueCount: data.overdue_books || 0,
// //         fineCollectedThisMonth: data.fine_collected_this_month || 0,
// //         damagedCount: data.damaged_missing_books || 0,
// //       }));
// //     } catch (err) {
// //       console.error("Error fetching alert metrics:", err);
// //     }
// //   };

// //   const fetchLibraryDetails = async () => {
// //     try {
// //       const bookApi = new DataApi("book");
// //       const issueApi = new DataApi("bookissue");
// //       const settingsApi = new DataApi("librarysettings");
// //       const cardApi = new DataApi("librarycard");

// //       const booksResp = await bookApi.fetchAll();
// //       const books = Array.isArray(booksResp?.data) ? booksResp.data :
// //         (booksResp?.data?.rows || booksResp || []);

// //       let availableCopies = 0;
// //       const booksWithAvailability = [];

// //       if (Array.isArray(books)) {
// //         books.forEach((b) => {
// //           const total = Number(b.total_copies ?? b.totalCopies ?? 0) || 0;
// //           const available = Number(b.available_copies ?? b.availableCopies ?? total) || total;
// //           availableCopies += available;

// //           booksWithAvailability.push({
// //             title: b.title || "Unknown",
// //             available_copies: available,
// //             total_copies: total
// //           });
// //         });
// //       }

// //       const sortedBooks = [...booksWithAvailability]
// //         .sort((a, b) => b.available_copies - a.available_copies)
// //         .slice(0, 10);
// //       setTopAvailableBooks(sortedBooks);

// //       const issuesResp = await issueApi.get("/active");
// //       const activeIssues = Array.isArray(issuesResp?.data) ? issuesResp.data :
// //         (issuesResp?.data?.rows || issuesResp || []);
// //       const issuedCount = Array.isArray(activeIssues) ? activeIssues.length : 0;

// //       let cardLimit = 6;
// //       try {
// //         const settingsResp = await settingsApi.get("/all");
// //         const settingsData = settingsResp?.data?.data || settingsResp?.data || settingsResp;
// //         if (settingsData) {
// //           cardLimit = Number(
// //             settingsData.max_books_per_card ??
// //             settingsData.max_books ??
// //             settingsData.max_books_per_card?.setting_value
// //           ) || cardLimit;
// //         }
// //       } catch (err) {
// //         console.warn("Could not fetch card limit:", err);
// //       }

// //       setCardLimitSetting(cardLimit);

// //       await fetchCardDetails(cardApi, issueApi, cardLimit);

// //     } catch (error) {
// //       console.error("Error fetching library details:", error);
// //     }
// //   };

// //   const fetchCardDetails = async (cardApi, issueApi, currentLimit) => {
// //     try {
// //       const cardsResp = await cardApi.fetchAll();
// //       const issuesResp = await issueApi.get("/active");

// //       const cards = Array.isArray(cardsResp?.data) ? cardsResp.data :
// //         (cardsResp?.data?.rows || cardsResp || []);
// //       const activeIssues = Array.isArray(issuesResp?.data) ? issuesResp.data :
// //         (issuesResp?.data?.rows || issuesResp || []);

// //       const countsByCard = {};
// //       activeIssues.forEach((issue) => {
// //         const cid = issue.card_id || issue.cardId || issue.cardid;
// //         if (cid) {
// //           countsByCard[cid] = (countsByCard[cid] || 0) + 1;
// //         }
// //       });

// //       const details = cards.map((c) => {
// //         const issued = countsByCard[c.id] || 0;
// //         const remaining = Math.max(0, currentLimit - issued);
// //         return {
// //           id: c.id,
// //           user_name: c.user_name || c.userName || `Card ${c.card_number}` || "Unknown",
// //           issued: issued,
// //           remaining: remaining
// //         };
// //       });

// //       details.sort((a, b) => b.issued - a.issued);
// //       setCardDetails(details.slice(0, 10));

// //     } catch (error) {
// //       console.error("Error fetching card details:", error);
// //     }
// //   };

// //   const handleCardClick = (cardType) => {
// //     let modalData = {
// //       type: cardType,
// //       data: { ...metrics }
// //     };

// //     // Generate sample data based on card type
// //     switch (cardType) {
// //       case "totalBooks":
// //         modalData.data = {
// //           ...modalData.data,
// //           categories: booksByCategory.length,
// //           avgCopies: metrics.totalTitles > 0 ?
// //             (metrics.total_copies / metrics.totalTitles).toFixed(1) : 0,
// //           books: booksData.slice(0, 20).map((book, index) => ({
// //             id: book.id || index + 1,
// //             title: book.title || `Book ${index + 1}`,
// //             author: book.author_name || book.author || "Unknown Author",
// //             category: book.category_name || book.category || "General",
// //             isbn: book.isbn || `ISBN-${1000 + index}`,
// //             total_copies: book.total_copies || book.totalCopies || 1,
// //             available_copies: book.available_copies || book.availableCopies || 0
// //           }))
// //         };
// //         break;

// //       case "totalCopies":
// //         modalData.data = {
// //           ...modalData.data,
// //           reserved: Math.floor(metrics.total_copies * 0.05),
// //           books: booksData.slice(0, 15).map((book, index) => ({
// //             id: book.id || index + 1,
// //             title: book.title || `Book ${index + 1}`,
// //             total_copies: book.total_copies || book.totalCopies || 1,
// //             available: book.available_copies || book.availableCopies || 0,
// //             issued: (book.total_copies || 1) - (book.available_copies || 0),
// //             reserved: Math.floor((book.total_copies || 1) * 0.05),
// //             damaged: Math.floor((book.total_copies || 1) * 0.02)
// //           }))
// //         };
// //         break;

// //       case "availableCopies":
// //         modalData.data = {
// //           ...modalData.data,
// //           availableTitles: topAvailableBooks.length,
// //           byCategory: categories.length,
// //           newArrivals: metrics.booksThisMonth,
// //           books: topAvailableBooks.slice(0, 15).map((book, index) => ({
// //             id: index + 1,
// //             title: book.title,
// //             author: `Author ${index + 1}`,
// //             category: categories[index % categories.length]?.name || "General",
// //             available_copies: book.available_copies,
// //             total_copies: book.total_copies,
// //             location: `Shelf ${String.fromCharCode(65 + (index % 5))}-${index + 1}`
// //           }))
// //         };
// //         break;

// //       case "issuedCopies":
// //         modalData.data = {
// //           ...modalData.data,
// //           activeBorrowers: cardDetails.length,
// //           issues: issuesData.slice(0, 15).map((issue, index) => ({
// //             id: issue.id || index + 1,
// //             book_title: issue.book_title || `Book ${index + 1}`,
// //             member_name: issue.member_name || `Member ${index + 1}`,
// //             card_number: issue.card_number || `CARD${1000 + index}`,
// //             issue_date: new Date().toISOString().split('T')[0],
// //             due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
// //             status: index % 3 === 0 ? "Active" : "Pending Return"
// //           }))
// //         };
// //         break;

// //       case "dueSoon":
// //         modalData.data = {
// //           ...modalData.data,
// //           within1Day: Math.floor(metrics.dueSoonCount * 0.3),
// //           within3Days: Math.floor(metrics.dueSoonCount * 0.5),
// //           within7Days: Math.floor(metrics.dueSoonCount * 0.2),
// //           issues: Array.from({ length: 10 }, (_, index) => ({
// //             id: `DUE${1000 + index}`,
// //             book_title: `Book Due ${index + 1}`,
// //             member_name: `Member ${index + 1}`,
// //             due_date: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
// //             days_remaining: index + 1,
// //             fine_amount: (index + 1) * 5,
// //             contact: `+91 98765 ${43210 + index}`
// //           }))
// //         };
// //         break;

// //       case "overdue":
// //         modalData.data = {
// //           ...modalData.data,
// //           overdue1to7: Math.floor(metrics.overdueCount * 0.6),
// //           overdue8to30: Math.floor(metrics.overdueCount * 0.3),
// //           overdue30Plus: Math.floor(metrics.overdueCount * 0.1),
// //           issues: Array.from({ length: 10 }, (_, index) => ({
// //             id: `OVD${1000 + index}`,
// //             book_title: `Overdue Book ${index + 1}`,
// //             member_name: `Member ${index + 1}`,
// //             due_date: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
// //             days_overdue: index + 1,
// //             fine_amount: (index + 1) * 10,
// //             contact: `+91 98765 ${43210 + index}`
// //           }))
// //         };
// //         break;

// //       case "fineCollected":
// //         modalData.data = {
// //           ...modalData.data,
// //           fromOverdue: Math.floor(metrics.fineCollectedThisMonth * 0.7),
// //           fromDamaged: Math.floor(metrics.fineCollectedThisMonth * 0.2),
// //           fromLost: Math.floor(metrics.fineCollectedThisMonth * 0.1),
// //           transactions: Array.from({ length: 15 }, (_, index) => ({
// //             id: `FINE${1000 + index}`,
// //             member_name: `Member ${index + 1}`,
// //             book_title: `Book ${index + 1}`,
// //             reason: index % 3 === 0 ? "Overdue" : index % 3 === 1 ? "Damaged" : "Lost",
// //             amount: (index + 1) * 50,
// //             payment_date: new Date().toISOString().split('T')[0],
// //             payment_mode: index % 2 === 0 ? "Cash" : "Online"
// //           }))
// //         };
// //         break;

// //       case "damagedLost":
// //         modalData.data = {
// //           ...modalData.data,
// //           damaged: Math.floor(metrics.damagedCount * 0.7),
// //           lost: Math.floor(metrics.damagedCount * 0.3),
// //           underReview: Math.floor(metrics.damagedCount * 0.2),
// //           records: Array.from({ length: 10 }, (_, index) => ({
// //             id: `DL${1000 + index}`,
// //             book_title: `Book ${index + 1}`,
// //             type: index % 2 === 0 ? "Damaged" : "Lost",
// //             reported_by: `Staff ${index + 1}`,
// //             report_date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
// //             status: index % 3 === 0 ? "Under Review" : "Resolved",
// //             estimated_cost: (index + 1) * 1000
// //           }))
// //         };
// //         break;

// //       case "latestMembers":
// //         modalData.data = {
// //           total: latestMembers.length,
// //           thisMonth: Math.floor(latestMembers.length * 1.5),
// //           thisWeek: latestMembers.length,
// //           today: Math.floor(latestMembers.length * 0.3),
// //           members: latestMembers.map((member, index) => ({
// //             id: member.id,
// //             name: member.name,
// //             email: member.email,
// //             phone: member.phone,
// //             join_date: member.join_date,
// //             card_number: member.card_number,
// //             status: member.status
// //           }))
// //         };
// //         break;

// //       case "topCategories":
// //         modalData.data = {
// //           totalCategories: booksByCategory.length,
// //           totalBooks: booksByCategory.reduce((sum, cat) => sum + (cat.book_count || 0), 0),
// //           avgBooks: booksByCategory.length > 0 ?
// //             (booksByCategory.reduce((sum, cat) => sum + (cat.book_count || 0), 0) / booksByCategory.length).toFixed(1) : 0,
// //           topCategory: booksByCategory[0]?.category_name || "N/A",
// //           categories: categories.map((cat, index) => ({
// //             id: index + 1,
// //             name: cat.name,
// //             book_count: cat.count,
// //             total_copies: cat.count * 3,
// //             available_copies: Math.floor(cat.count * 2.5),
// //             percentage: ((cat.count / metrics.totalTitles) * 100).toFixed(1),
// //             popular_author: `Author ${index + 1}`
// //           }))
// //         };
// //         break;

// //       case "quickStats":
// //         modalData.data = {
// //           booksThisMonth: metrics.booksThisMonth,
// //           activeBorrowers: cardDetails.length,
// //           utilizationRate: metrics.total_copies > 0 ?
// //             Math.round((metrics.issuedBooks / metrics.total_copies) * 100) : 0,
// //           totalSubmissions: metrics.totalSubmissions,
// //           stats: [
// //             { id: 1, activity: "New Books Added", count: metrics.booksThisMonth, percentage: "15%", trend: "↑", last_updated: "Today", remarks: "Good" },
// //             { id: 2, activity: "Books Issued", count: metrics.issuedBooks, percentage: "45%", trend: "→", last_updated: "Today", remarks: "Normal" },
// //             { id: 3, activity: "Overdue Books", count: metrics.overdueCount, percentage: "5%", trend: "↓", last_updated: "Today", remarks: "Improving" },
// //             { id: 4, activity: "Fine Collected", count: metrics.fineCollectedThisMonth, percentage: "100%", trend: "↑", last_updated: "This Month", remarks: "Excellent" },
// //             { id: 5, activity: "New Members", count: latestMembers.length, percentage: "12%", trend: "→", last_updated: "This Week", remarks: "Steady" }
// //           ]
// //         };
// //         break;
// //     }

// //     setModalData(modalData);
// //     setShowModal(true);
// //   };

// //   const handleCloseModal = () => {
// //     setShowModal(false);
// //     setModalData(null);
// //   };

// //   // Chart configuration function
// //   const getChartConfig = (filename) => ({
// //     toolbar: {
// //       show: true,
// //       tools: {
// //         download: true,
// //         selection: true,
// //         zoom: true,
// //         zoomin: true,
// //         zoomout: true,
// //         pan: true,
// //         reset: true,
// //       },
// //       export: {
// //         csv: {
// //           filename: filename,
// //           headerCategory: "Category",
// //           columnDelimiter: ','
// //         },
// //         svg: {
// //           filename: filename
// //         },
// //         png: {
// //           filename: filename
// //         }
// //       }
// //     }
// //   });

// //   const funnelChartOptions = {
// //     chart: {
// //       type: 'bar',
// //       height: 320,
// //       fontFamily: 'inherit',
// //       toolbar: getChartConfig("Books_Highest_Available_Stock_Report").toolbar,
// //       zoom: {
// //         enabled: true,
// //         type: 'x',
// //         autoScaleYaxis: true
// //       },
// //       animations: {
// //         enabled: true,
// //         easing: 'easeinout',
// //         speed: 800
// //       }
// //     },
// //     plotOptions: {
// //       bar: {
// //         borderRadius: 6,
// //         horizontal: true,
// //         barHeight: '70%',
// //         distributed: false,
// //         dataLabels: {
// //           position: 'center'
// //         }
// //       }
// //     },
// //     dataLabels: {
// //       enabled: true,
// //       formatter: function (val) {
// //         return val + " copies";
// //       },
// //       textAnchor: 'start',
// //       offsetX: 10,
// //       style: {
// //         fontSize: '11px',
// //         colors: ['#fff'],
// //         fontWeight: 600,
// //         fontFamily: 'inherit'
// //       }
// //     },
// //     xaxis: {
// //       categories: topAvailableBooks.map(b =>
// //         b.title.length > 18 ? b.title.substring(0, 18) + "..." : b.title
// //       ),
// //       labels: {
// //         style: {
// //           colors: '#64748b',
// //           fontSize: '11px',
// //           fontFamily: 'inherit'
// //         }
// //       },
// //       title: {
// //         text: 'Available Copies',
// //         style: {
// //           color: '#64748b',
// //           fontSize: '12px',
// //           fontFamily: 'inherit',
// //           fontWeight: 600
// //         }
// //       },
// //       axisBorder: {
// //         show: true,
// //         color: '#e2e8f0'
// //       },
// //       axisTicks: {
// //         show: true,
// //         color: '#e2e8f0'
// //       }
// //     },
// //     yaxis: {
// //       labels: {
// //         style: {
// //           colors: '#334155',
// //           fontWeight: 600,
// //           fontSize: '12px',
// //           fontFamily: 'inherit'
// //         }
// //       }
// //     },
// //     colors: [
// //       '#4f46e5', '#6366f1', '#818cf8', '#93c5fd', '#60a5fa',
// //       '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'
// //     ].reverse(),
// //     tooltip: {
// //       theme: 'light',
// //       style: {
// //         fontSize: '12px',
// //         fontFamily: 'inherit'
// //       },
// //       y: {
// //         formatter: (val) => `${val} copies available`,
// //         title: {
// //           formatter: (seriesName) => 'Available Copies:'
// //         }
// //       },
// //       x: {
// //         formatter: (val, { series, seriesIndex, dataPointIndex, w }) => {
// //           const book = topAvailableBooks[dataPointIndex];
// //           return `<strong>${book.title}</strong><br/>Total: ${book.total_copies} copies<br/>Available: ${book.available_copies} copies`;
// //         }
// //       }
// //     },
// //     legend: {
// //       show: false
// //     },
// //     grid: {
// //       show: true,
// //       borderColor: '#f1f5f9',
// //       xaxis: {
// //         lines: {
// //           show: true
// //         }
// //       },
// //       yaxis: {
// //         lines: {
// //           show: true
// //         }
// //       }
// //     },
// //     states: {
// //       hover: {
// //         filter: {
// //           type: 'darken',
// //           value: 0.8
// //         }
// //       },
// //       active: {
// //         filter: {
// //           type: 'darken',
// //           value: 0.7
// //         }
// //       }
// //     },
// //     responsive: [{
// //       breakpoint: 768,
// //       options: {
// //         chart: {
// //           height: 280
// //         },
// //         dataLabels: {
// //           enabled: false
// //         }
// //       }
// //     }]
// //   };

// //   const funnelChartSeries = [{
// //     name: 'Available Copies',
// //     data: topAvailableBooks.map(b => parseInt(b.available_copies || 0))
// //   }];
// //   const donutOptions = {
// //     chart: {
// //       type: "donut",
// //       height: 220,
// //       fontFamily: 'inherit',
// //       toolbar: getChartConfig("Inventory_Status_Report").toolbar,
// //       animations: {
// //         enabled: true,
// //         easing: 'easeinout',
// //         speed: 800
// //       }
// //     },
// //     colors: [SUCCESS_COLOR, PRIMARY_COLOR],
// //     legend: {
// //       position: "bottom",
// //       fontSize: '12px',
// //       fontFamily: 'inherit',
// //       markers: {
// //         radius: 8,
// //         width: 12,
// //         height: 12
// //       },
// //       itemMargin: {
// //         horizontal: 8,
// //         vertical: 4
// //       },
// //       onItemClick: {
// //         toggleDataSeries: true
// //       },
// //       onItemHover: {
// //         highlightDataSeries: true
// //       }
// //     },
// //     dataLabels: {
// //       enabled: true,
// //       style: {
// //         fontSize: '12px',
// //         fontWeight: 600,
// //         fontFamily: 'inherit'
// //       },
// //       dropShadow: {
// //         enabled: true,
// //         top: 1,
// //         left: 1,
// //         blur: 1,
// //         opacity: 0.2
// //       },
// //       formatter: function (val, { seriesIndex, w }) {
// //         return w.config.series[seriesIndex] + '%';
// //       }
// //     },
// //     plotOptions: {
// //       pie: {
// //         donut: {
// //           size: "65%",
// //           labels: {
// //             show: true,
// //             total: {
// //               show: true,
// //               label: 'Total Copies',
// //               color: '#334155',
// //               fontWeight: 600,
// //               fontSize: '12px',
// //               fontFamily: 'inherit',
// //               formatter: () => formatNumber(metrics.totalBooks)
// //             },
// //             value: {
// //               show: true,
// //               fontSize: '20px',
// //               fontWeight: 700,
// //               color: '#1e293b',
// //               fontFamily: 'inherit',
// //               formatter: (val) => val + '%'
// //             }
// //           }
// //         }
// //       }
// //     },
// //     stroke: {
// //       width: 2,
// //       colors: ['#fff']
// //     },
// //     tooltip: {
// //       theme: "light",
// //       style: {
// //         fontSize: '12px',
// //         fontFamily: 'inherit'
// //       },
// //       y: {
// //         formatter: (val) => `${val}% (${formatNumber(Math.round((val / 100) * metrics.totalBooks))} copies)`,
// //         title: {
// //           formatter: (seriesName) => seriesName
// //         }
// //       }
// //     },
// //     responsive: [{
// //       breakpoint: 768,
// //       options: {
// //         chart: {
// //           height: 200
// //         },
// //         legend: {
// //           position: 'bottom',
// //           horizontalAlign: 'center'
// //         }
// //       }
// //     }]
// //   };

// //   const calculateDonutSeries = () => {
// //     if (metrics.totalBooks === 0) return [0, 0];
// //     const issuedPercentage = Math.round((metrics.issuedBooks / metrics.totalBooks) * 100);
// //     const availablePercentage = 100 - issuedPercentage;
// //     return [availablePercentage, issuedPercentage];
// //   };
// //   const donutChartSeries = calculateDonutSeries();

// //   const summaryCards = [
// //     {
// //       title: "Total Books",
// //       value: formatNumber(metrics.totalTitles || metrics.totalBooks),
// //       icon: "fa-book",
// //       color: PRIMARY_COLOR,
// //       bgColor: "#e0e7ff",
// //       type: "totalBooks"
// //     },
// //     {
// //       title: "Total Copies",
// //       value: formatNumber(metrics.total_copies),
// //       icon: "fa-copy",
// //       color: ACCENT_COLOR,
// //       bgColor: "#e0e7ff",
// //       type: "totalCopies"
// //     },
// //     {
// //       title: "Available Copies",
// //       value: formatNumber(metrics.availableBooks),
// //       icon: "fa-book-open",
// //       color: SUCCESS_COLOR,
// //       bgColor: "#d1fae5",
// //       type: "availableCopies"
// //     },
// //     {
// //       title: "Issued Copies",
// //       value: formatNumber(metrics.issuedBooks),
// //       icon: "fa-user-pen",
// //       color: WARNING_COLOR,
// //       bgColor: "#fef3c7",
// //       type: "issuedCopies"
// //     },
// //   ];

// //   const alertCards = [
// //     {
// //       count: metrics.dueSoonCount,
// //       label: "Due Soon",
// //       icon: "fa-clock",
// //       bg: "#fff7ed",
// //       color: WARNING_COLOR,
// //       type: "dueSoon"
// //     },
// //     {
// //       count: metrics.overdueCount,
// //       label: "Overdue",
// //       icon: "fa-circle-exclamation",
// //       bg: "#fef2f2",
// //       color: DANGER_COLOR,
// //       type: "overdue"
// //     },
// //     {
// //       count: metrics.fineCollectedThisMonth,
// //       label: "Fine Collected",
// //       icon: "fa-indian-rupee-sign",
// //       bg: "#ecfdf5",
// //       color: SUCCESS_COLOR,
// //       isCurrency: true,
// //       type: "fineCollected"
// //     },
// //     {
// //       count: metrics.damagedCount,
// //       label: "Damaged / Lost",
// //       icon: "fa-heart-crack",
// //       bg: "#fdf2f8",
// //       color: '#db2777',
// //       type: "damagedLost"
// //     }
// //   ];

// //   if (loading) {
// //     return (
// //       <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
// //         <Loader />
// //       </div>
// //     );
// //   }

// //   if (userRole === "STUDENT") {
// //     return (
// //       <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "20px" }}>
// //         <ScrollToTop />
// //         <Container fluid>
// //           <Card style={{
// //             ...styles.card,
// //             background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${INFO_COLOR} 100%)`,
// //             color: "white",
// //             marginBottom: "30px",
// //             border: 'none'
// //           }}>
// //             <Card.Body className="p-4">
// //               <h1 className="fw-bolder mb-2" style={{ fontSize: '24px' }}>
// //                 Welcome Back, {userInfo?.firstname || 'Student'}! 👋
// //               </h1>
// //               <p className="mb-0 opacity-75" style={{ fontSize: '16px' }}>
// //                 Your personalized library dashboard is ready. Check your borrowed books and upcoming deadlines.
// //               </p>
// //             </Card.Body>
// //           </Card>

// //           <Row>
// //             <Col lg={8} className="mx-auto">
// //               <Card style={styles.card}>
// //                 <Card.Header style={styles.cardHeader}>
// //                   <h5 className="fw-bold mb-0">Your Currently Issued Books</h5>
// //                 </Card.Header>
// //                 <Card.Body>
// //                   <div className="text-center py-5">
// //                     <i className="fa-solid fa-book-open-reader fa-3x text-muted mb-3"></i>
// //                     <p className="text-muted">No books currently issued</p>
// //                     <button className="btn btn-primary mt-2">
// //                       Browse Library
// //                     </button>
// //                   </div>
// //                 </Card.Body>
// //               </Card>
// //             </Col>
// //           </Row>
// //         </Container>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "16px" }}>
// //       <ScrollToTop />
// //       <Container fluid className="px-2 py-2">
// //         {/* Header with Filter */}
// //         <div className="d-flex justify-content-between align-items-center mb-3">
// //           <div>
// //             <h6 >
// //               📚   Real-time analytics for efficient library management
// //             </h6>
// //           </div>

// //           <Dropdown>
// //             <Dropdown.Toggle
// //               variant="outline-secondary"
// //               size="sm"
// //               className="rounded-pill px-3"
// //               style={{
// //                 borderColor: '#e2e8f0',
// //                 fontSize: '12px',
// //                 fontWeight: '500'
// //               }}
// //             >
// //               <i className="fa-solid fa-filter me-1"></i>
// //               Filter: {filter === 'all' ? 'All Time' : filter === 'week' ? 'This Week' : filter === 'month' ? 'This Month' : 'This Year'}
// //             </Dropdown.Toggle>
// //             <Dropdown.Menu>
// //               <Dropdown.Item onClick={() => setFilter("all")}>All Time</Dropdown.Item>
// //               <Dropdown.Item onClick={() => setFilter("week")}>This Week</Dropdown.Item>
// //               <Dropdown.Item onClick={() => setFilter("month")}>This Month</Dropdown.Item>
// //               <Dropdown.Item onClick={() => setFilter("year")}>This Year</Dropdown.Item>
// //             </Dropdown.Menu>
// //           </Dropdown>
// //         </div>

// //         {/* 1. Core Library Inventory - Clickable Cards */}
// //         <Row className="mb-3 g-2">
// //           {summaryCards.map((card, index) => (
// //             <Col xl={3} lg={6} md={6} sm={12} key={index}>
// //               <InteractiveCard
// //                 onClick={() => handleCardClick(card.type)}
// //               >
// //                 <Card.Body className="p-2">
// //                   <div className="d-flex align-items-center justify-content-between">
// //                     <div>
// //                       <p className="mb-1 text-uppercase" style={{
// //                         fontSize: "10px",
// //                         fontWeight: "700",
// //                         color: "#64748b"
// //                       }}>
// //                         {card.title}
// //                       </p>
// //                       <h2 className="mb-0" style={{
// //                         color: card.color,
// //                         fontSize: "20px",
// //                         fontWeight: "800"
// //                       }}>
// //                         {card.value}
// //                       </h2>
// //                     </div>
// //                     <div style={{
// //                       width: "40px",
// //                       height: "40px",
// //                       borderRadius: "10px",
// //                       backgroundColor: card.bgColor,
// //                       display: "flex",
// //                       alignItems: "center",
// //                       justifyContent: "center",
// //                       minWidth: "40px"
// //                     }}>
// //                       <i className={`fa-solid ${card.icon}`} style={{
// //                         fontSize: "18px",
// //                         color: card.color
// //                       }}></i>
// //                     </div>
// //                   </div>
// //                   <p className="mb-0 small text-muted mt-1" style={{ fontSize: '11px', cursor: 'pointer' }}>
// //                     <i className="fa-solid fa-magnifying-glass me-1"></i>
// //                     Click to view details
// //                   </p>
// //                 </Card.Body>
// //               </InteractiveCard>
// //             </Col>
// //           ))}
// //         </Row>

// //         {/* Detail Modal */}
// //         <DetailModal
// //           show={showModal}
// //           handleClose={handleCloseModal}
// //           modalData={modalData}
// //         />

// //         {/* 2. Urgent Actions & Financial Metrics - Clickable Cards */}
// //         <div style={styles.sectionTitle}>
// //           <i className="fa-solid fa-bell" style={{ color: WARNING_COLOR, fontSize: '14px' }}></i>
// //           Urgent Actions
// //         </div>
// //         <Row className="mb-3 g-2">
// //           {alertCards.map((item, idx) => (
// //             <Col xl={3} lg={6} md={6} sm={12} key={idx}>
// //               <InteractiveCard
// //                 style={{ borderLeft: `4px solid ${item.color}` }}
// //                 onClick={() => handleCardClick(item.type)}
// //               >
// //                 <Card.Body className="p-2">
// //                   <div className="d-flex align-items-center">
// //                     <div className="me-2" style={{
// //                       width: "36px",
// //                       height: "36px",
// //                       borderRadius: '8px',
// //                       background: item.bg,
// //                       display: 'flex',
// //                       alignItems: 'center',
// //                       justifyContent: 'center',
// //                       fontSize: '14px',
// //                       color: item.color,
// //                       flexShrink: 0
// //                     }}>
// //                       <i className={`fa-solid ${item.icon}`}></i>
// //                     </div>
// //                     <div>
// //                       <h4 className="mb-0 fw-bolder" style={{
// //                         color: item.color,
// //                         fontSize: "16px"
// //                       }}>
// //                         {item.isCurrency ? formatCurrency(item.count) : formatNumber(item.count)}
// //                       </h4>
// //                       <small className="text-muted fw-semibold" style={{ fontSize: '11px' }}>
// //                         {item.label}
// //                       </small>
// //                     </div>
// //                   </div>
// //                   <p className="mb-0 small text-muted mt-1" style={{ fontSize: '10px', cursor: 'pointer' }}>
// //                     <i className="fa-solid fa-magnifying-glass me-1"></i>
// //                     Click for detailed report
// //                   </p>
// //                 </Card.Body>
// //               </InteractiveCard>
// //             </Col>
// //           ))}
// //         </Row>

// //         {/* 3. Main Charts Section */}
// //         <Row className="mb-3 g-2">
// //           {/* Latest Members - Clickable Card */}
// //           <Col lg={4}>
// //             <InteractiveCard onClick={() => handleCardClick("latestMembers")}>
// //               <Card.Header style={styles.cardHeader}>
// //                 <div className="d-flex justify-content-between align-items-center">
// //                   <div>
// //                     <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '14px' }}>Latest Members</h6>
// //                     <small className="text-muted" style={{ fontSize: '11px' }}>Recently joined library members</small>
// //                   </div>
// //                   <Badge className="px-2 py-1" style={{
// //                     borderRadius: '30px',
// //                     fontSize: '9px',
// //                     fontWeight: 600,
// //                     background: SUCCESS_COLOR,
// //                     color: 'white'
// //                   }}>
// //                     NEW
// //                   </Badge>
// //                 </div>
// //               </Card.Header>
// //               <Card.Body className="p-0">
// //                 <div className="list-group list-group-flush">
// //                   {latestMembers.slice(0, 5).map((member, idx) => (
// //                     <div key={member.id} className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
// //                       <div className="d-flex align-items-center">
// //                         <div className="position-relative me-2">
// //                           <img
// //                             src={member.photo}
// //                             alt={member.name}
// //                             style={{
// //                               width: "36px",
// //                               height: "36px",
// //                               borderRadius: "50%",
// //                               objectFit: "cover",
// //                               border: "2px solid #e2e8f0"
// //                             }}
// //                           />
// //                           <div style={{
// //                             position: "absolute",
// //                             bottom: 0,
// //                             right: 0,
// //                             width: "10px",
// //                             height: "10px",
// //                             borderRadius: "50%",
// //                             background: SUCCESS_COLOR,
// //                             border: "2px solid white"
// //                           }}></div>
// //                         </div>
// //                         <div>
// //                           <p className="mb-0 fw-semibold" style={{ fontSize: '13px' }}>
// //                             {member.name}
// //                           </p>
// //                           <small className="text-muted" style={{ fontSize: '11px' }}>
// //                             <i className="fa-solid fa-calendar-days me-1"></i>
// //                             Joined {member.join_date}
// //                           </small>
// //                         </div>
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //                 <div className="px-2 py-1 border-top">
// //                   <div className="text-center">
// //                     <small className="fw-semibold" style={{ color: PRIMARY_COLOR, fontSize: '11px', cursor: 'pointer' }}>
// //                       <i className="fa-solid fa-magnifying-glass me-1"></i>
// //                       Click to view all members
// //                     </small>
// //                   </div>
// //                 </div>
// //               </Card.Body>
// //             </InteractiveCard>
// //           </Col>

// //           {/* Funnel Chart */}
// //           <Col lg={8}>
// //             <Card style={styles.card}>
// //               <Card.Header style={styles.cardHeader}>
// //                 <div className="d-flex justify-content-between align-items-center">
// //                   <div>
// //                     <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '14px' }}>Books with Highest Available Stock</h6>
// //                     <small className="text-muted" style={{ fontSize: '11px' }}>Top 10 books by available copies</small>
// //                   </div>
// //                 </div>
// //               </Card.Header>
// //               <Card.Body className="p-2">
// //                 {topAvailableBooks.length > 0 ? (
// //                   <Chart
// //                     options={funnelChartOptions}
// //                     series={funnelChartSeries}
// //                     type="bar"
// //                     height={280}
// //                   />
// //                 ) : (
// //                   <div className="d-flex flex-column align-items-center justify-content-center py-4 text-muted">
// //                     <i className="fa-solid fa-book-open-reader fa-2x mb-2"></i>
// //                     <small>No inventory data available</small>
// //                   </div>
// //                 )}
// //                 <div className="mt-2 text-center">
// //                   <small className="text-muted" style={{ fontSize: '10px' }}>
// //                     <i className="fa-solid fa-circle-info me-1"></i>
// //                     Hover for details | Click toolbar for export options (PNG, SVG, CSV)
// //                   </small>
// //                 </div>
// //               </Card.Body>
// //             </Card>
// //           </Col>
// //         </Row>

// //         {/* 4. Secondary Analytics */}
// //         <Row className="g-2">
// //           {/* Top Categories - Clickable Card */}
// //           <Col lg={4}>
// //             <InteractiveCard onClick={() => handleCardClick("topCategories")}>
// //               <Card.Header style={styles.cardHeader}>
// //                 <div className="d-flex justify-content-between align-items-center">
// //                   <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '14px' }}>Top Categories by Stock</h6>
// //                   <Badge className="px-2 py-1" style={{
// //                     borderRadius: '30px',
// //                     fontSize: '9px',
// //                     fontWeight: 600,
// //                     background: PRIMARY_COLOR,
// //                     color: 'white',
// //                     cursor: 'pointer'
// //                   }}>
// //                     VIEW ALL
// //                   </Badge>
// //                 </div>
// //                 <small className="text-muted" style={{ fontSize: '11px' }}>Most populated categories</small>
// //               </Card.Header>
// //               <Card.Body className="p-0">
// //                 <div className="list-group list-group-flush">
// //                   {categories.length > 0 ? categories.slice(0, 5).map((cat, idx) => (
// //                     <div key={idx} className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
// //                       <div className="d-flex align-items-center">
// //                         <div className="me-2 rounded-circle d-flex align-items-center justify-content-center"
// //                           style={{
// //                             width: 32,
// //                             height: 32,
// //                             background: '#e0e7ff',
// //                             color: PRIMARY_COLOR
// //                           }}>
// //                           <i className={`fa-solid ${cat.icon}`}></i>
// //                         </div>
// //                         <span className="fw-semibold text-dark" style={{ fontSize: '13px' }}>
// //                           {cat.name.length > 18 ? cat.name.substring(0, 18) + "..." : cat.name}
// //                         </span>
// //                       </div>
// //                       <Badge style={{
// //                         background: PRIMARY_COLOR,
// //                         color: 'white',
// //                         fontWeight: 600,
// //                         fontSize: '11px'
// //                       }} className="rounded-pill px-2 py-1">
// //                         {formatNumber(cat.count)}
// //                       </Badge>
// //                     </div>
// //                   )) : (
// //                     <div className="text-center py-3 text-muted">
// //                       <i className="fa-solid fa-tags fa-lg mb-2"></i>
// //                       <p className="mb-0" style={{ fontSize: '12px' }}>No category data available</p>
// //                     </div>
// //                   )}
// //                 </div>
// //               </Card.Body>
// //             </InteractiveCard>
// //           </Col>

// //           {/* Donut Chart */}
// //           <Col lg={4}>
// //             <Card style={styles.card}>
// //               <Card.Body className="text-center p-2">
// //                 <div className="d-flex justify-content-between align-items-center mb-2">
// //                   <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '14px' }}>
// //                     Inventory Status
// //                   </h6>
// //                   <Badge className="px-2 py-1" style={{
// //                     borderRadius: '30px',
// //                     fontSize: '9px',
// //                     fontWeight: 600,
// //                     background: INFO_COLOR,
// //                     color: 'white'
// //                   }}>
// //                     DONUT CHART
// //                   </Badge>
// //                 </div>
// //                 <Chart
// //                   options={donutOptions}
// //                   series={donutChartSeries}
// //                   type="donut"
// //                   height={180}
// //                 />
// //                 <div className="mt-2">
// //                   <div className="d-flex justify-content-center align-items-center mb-1">
// //                     <div className="me-1" style={{
// //                       width: '8px',
// //                       height: '8px',
// //                       borderRadius: '50%',
// //                       background: SUCCESS_COLOR
// //                     }}></div>
// //                     <span className="text-muted small me-2" style={{ fontSize: '11px' }}>Available: {donutChartSeries[0]}%</span>
// //                     <div className="me-1" style={{
// //                       width: '8px',
// //                       height: '8px',
// //                       borderRadius: '50%',
// //                       background: PRIMARY_COLOR
// //                     }}></div>
// //                     <span className="text-muted small" style={{ fontSize: '11px' }}>Issued: {donutChartSeries[1]}%</span>
// //                   </div>
// //                   <h4 className="fw-bolder mt-1" style={{
// //                     color: WARNING_COLOR,
// //                     fontSize: '18px'
// //                   }}>
// //                     {donutChartSeries[1]}%
// //                   </h4>
// //                   <small className="text-muted" style={{ fontSize: '11px' }}>of total copies currently issued</small>
// //                 </div>
// //               </Card.Body>
// //             </Card>
// //           </Col>

// //           {/* Quick Stats - Clickable Card */}
// //           <Col lg={4}>
// //             <InteractiveCard onClick={() => handleCardClick("quickStats")}>
// //               <Card.Header style={styles.cardHeader}>
// //                 <div className="d-flex justify-content-between align-items-center">
// //                   <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '14px' }}>Quick Stats</h6>
// //                   <Badge className="px-2 py-1" style={{
// //                     borderRadius: '30px',
// //                     fontSize: '9px',
// //                     fontWeight: 600,
// //                     background: INFO_COLOR,
// //                     color: 'white',
// //                     cursor: 'pointer'
// //                   }}>
// //                     DETAILS
// //                   </Badge>
// //                 </div>
// //                 <small className="text-muted" style={{ fontSize: '11px' }}>Recent library activity</small>
// //               </Card.Header>
// //               <Card.Body className="p-0">
// //                 <div className="list-group list-group-flush">
// //                   <div className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
// //                     <div className="d-flex align-items-center">
// //                       <div className="me-2" style={{
// //                         width: 32,
// //                         height: 32,
// //                         borderRadius: '8px',
// //                         background: '#e0e7ff',
// //                         color: PRIMARY_COLOR,
// //                         display: 'flex',
// //                         alignItems: 'center',
// //                         justifyContent: 'center'
// //                       }}>
// //                         <i className="fa-solid fa-book-medical"></i>
// //                       </div>
// //                       <div>
// //                         <p className="mb-0 fw-semibold" style={{ fontSize: '13px' }}>New Books This Month</p>
// //                         <small className="text-muted" style={{ fontSize: '11px' }}>Added in last 30 days</small>
// //                       </div>
// //                     </div>
// //                     <Badge className="rounded-pill px-2 py-1" style={{
// //                       background: PRIMARY_COLOR,
// //                       fontSize: '12px',
// //                       fontWeight: '600'
// //                     }}>
// //                       {formatNumber(metrics.booksThisMonth)}
// //                     </Badge>
// //                   </div>

// //                   <div className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
// //                     <div className="d-flex align-items-center">
// //                       <div className="me-2" style={{
// //                         width: 32,
// //                         height: 32,
// //                         borderRadius: '8px',
// //                         background: '#ecfdf5',
// //                         color: SUCCESS_COLOR,
// //                         display: 'flex',
// //                         alignItems: 'center',
// //                         justifyContent: 'center'
// //                       }}>
// //                         <i className="fa-solid fa-users"></i>
// //                       </div>
// //                       <div>
// //                         <p className="mb-0 fw-semibold" style={{ fontSize: '13px' }}>Active Borrowers</p>
// //                         <small className="text-muted" style={{ fontSize: '11px' }}>Currently issued books</small>
// //                       </div>
// //                     </div>
// //                     <Badge className="rounded-pill px-2 py-1" style={{
// //                       background: SUCCESS_COLOR,
// //                       fontSize: '12px',
// //                       fontWeight: '600'
// //                     }}>
// //                       {formatNumber(cardDetails.length)}
// //                     </Badge>
// //                   </div>

// //                   <div className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
// //                     <div className="d-flex align-items-center">
// //                       <div className="me-2" style={{
// //                         width: 32,
// //                         height: 32,
// //                         borderRadius: '8px',
// //                         background: '#fef3c7',
// //                         color: WARNING_COLOR,
// //                         display: 'flex',
// //                         alignItems: 'center',
// //                         justifyContent: 'center'
// //                       }}>
// //                         <i className="fa-solid fa-percentage"></i>
// //                       </div>
// //                       <div>
// //                         <p className="mb-0 fw-semibold" style={{ fontSize: '13px' }}>Utilization Rate</p>
// //                         <small className="text-muted" style={{ fontSize: '11px' }}>Library capacity usage</small>
// //                       </div>
// //                     </div>
// //                     <Badge className="rounded-pill px-2 py-1" style={{
// //                       background: WARNING_COLOR,
// //                       fontSize: '12px',
// //                       fontWeight: '600'
// //                     }}>
// //                       {metrics.total_copies > 0 ? Math.round((metrics.issuedBooks / metrics.total_copies) * 100) : 0}%
// //                     </Badge>
// //                   </div>
// //                 </div>
// //               </Card.Body>
// //             </InteractiveCard>
// //           </Col>
// //         </Row>
// //       </Container>
// //     </div>
// //   );
// // };

// // export default Dashboard;


// /*
// **@Author: Aabid 
// **@Date: NOV-2025
// */

// import React, { useState, useEffect, useCallback } from "react";
// import {
//   Card,
//   Col,
//   Container,
//   Row,
//   Badge,
//   Button,
//   Dropdown,
//   Modal,
//   Form
// } from "react-bootstrap";
// import Chart from "react-apexcharts";
// import ScrollToTop from "./common/ScrollToTop";
// import DataApi from "../api/dataApi";
// import Loader from "./common/Loader";
// import jwt_decode from "jwt-decode";
// import DashboardApi from "../api/dashboardApi";
// import { useNavigate } from "react-router-dom";

// const PRIMARY_COLOR = "#f3e9fc";
// const ACCENT_COLOR = "#6366f1";
// const SUCCESS_COLOR = "#059669";
// const WARNING_COLOR = "#f59e0b";
// const DANGER_COLOR = "#dc2626";
// const INFO_COLOR = "#8b5cf6";

// const styles = {
//   card: {
//     border: "1px solid #e2e8f0",
//     borderRadius: "16px",
//     boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
//     background: "#fff",
//     height: "100%",
//     transition: "all 0.3s ease",
//     overflow: "hidden",
//   },
//   interactiveCard: {
//     cursor: "pointer",
//   },
//   cardHeader: {
//     background: "transparent",
//     borderBottom: "1px solid #f1f5f9",
//     borderRadius: "16px 16px 0 0",
//     padding: "12px 16px"
//   },
//   cardBody: {
//     padding: "16px"
//   },
//   sectionTitle: {
//     fontSize: "15px",
//     fontWeight: "600",
//     color: "#0f172a",
//     marginBottom: "16px",
//     marginTop: "20px",
//     display: "flex",
//     alignItems: "center",
//     gap: "10px",
//     paddingLeft: "5px"
//   }
// };

// const AlertCardHoverStyle = {
//   "&:hover": {
//     transform: "translateY(-3px)",
//     boxShadow: "0 15px 40px rgba(0, 0, 0, 0.1)",
//   }
// };

// const InteractiveCard = ({ children, style, onClick, ...props }) => {
//   const [hover, setHover] = useState(false);
//   return (
//     <Card
//       {...props}
//       style={{
//         ...styles.card,
//         ...styles.interactiveCard,
//         ...style,
//         ...(hover ? AlertCardHoverStyle["&:hover"] : {}),
//       }}
//       onMouseEnter={() => setHover(true)}
//       onMouseLeave={() => setHover(false)}
//       onClick={onClick}
//     >
//       {children}
//     </Card>
//   );
// };

// const Dashboard = ({ userInfo: propUserInfo }) => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [dashboardData, setDashboardData] = useState(null);
//   const [userInfo, setUserInfo] = useState(null);
//   const [userRole, setUserRole] = useState(null);
//   const [filter, setFilter] = useState("all");
//   const [booksData, setBooksData] = useState([]);
//   const [issuesData, setIssuesData] = useState([]);

//   const [metrics, setMetrics] = useState({
//     dueSoonCount: 0,
//     overdueCount: 0,
//     fineCollectedThisMonth: 0,
//     damagedCount: 0,
//     totalBooks: 0,
//     totalTitles: 0,
//     availableBooks: 0,
//     issuedBooks: 0,
//     booksThisMonth: 0,
//     totalSubmissions: 0,
//     total_copies: 0,
//   });

//   const [cardDetails, setCardDetails] = useState([]);
//   const [cardLimitSetting, setCardLimitSetting] = useState(6);
//   const [categories, setCategories] = useState([]);
//   const [topAvailableBooks, setTopAvailableBooks] = useState([]);
//   const [latestMembers, setLatestMembers] = useState([]);
//   const [booksByCategory, setBooksByCategory] = useState([]);

//   const formatNumber = useCallback((num) => {
//     if (num === null || num === undefined || isNaN(num)) return "0";
//     return Number(num).toLocaleString('en-IN');
//   }, []);

//   const formatCurrency = useCallback((val) => {
//     const n = Number(val);
//     if (!isFinite(n)) return `₹0.00`;
//     return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
//   }, []);

//   const dummyPhotos = [
//     "https://randomuser.me/api/portraits/men/32.jpg",
//     "https://randomuser.me/api/portraits/women/44.jpg",
//     "https://randomuser.me/api/portraits/men/67.jpg",
//     "https://randomuser.me/api/portraits/women/65.jpg",
//     "https://randomuser.me/api/portraits/men/75.jpg"
//   ];

//   useEffect(() => {
//     const initializeUser = () => {
//       let currentUserInfo = propUserInfo;
//       if (!currentUserInfo) {
//         try {
//           const token = sessionStorage.getItem("token");
//           if (token) {
//             currentUserInfo = jwt_decode(token);
//           }
//         } catch (error) {
//           console.error("Error decoding token:", error);
//         }
//       }
//       setUserInfo(currentUserInfo);
//       setUserRole(currentUserInfo?.userrole?.toUpperCase() || "ADMIN");
//     };

//     initializeUser();
//   }, [propUserInfo]);

//   useEffect(() => {
//     let isMounted = true;

//     const fetchAllDashboardData = async () => {
//       try {
//         setLoading(true);

//         await Promise.all([
//           fetchDashboardSummary(),
//           fetchAlertMetrics(),
//           fetchLibraryDetails(),
//           fetchLatestMembers(),
//           fetchAllBooks(),
//           fetchAllIssues()
//         ]);

//       } catch (error) {
//         console.error("Error in dashboard data fetch:", error);
//       } finally {
//         if (isMounted) {
//           setLoading(false);
//         }
//       }
//     };

//     fetchAllDashboardData();

//     return () => {
//       isMounted = false;
//     };
//   }, []);

//   const fetchAllBooks = async () => {
//     try {
//       const bookApi = new DataApi("book");
//       const booksResp = await bookApi.fetchAll();
//       const books = Array.isArray(booksResp?.data) ? booksResp.data :
//         (booksResp?.data?.rows || booksResp || []);
//       setBooksData(books);
//     } catch (error) {
//       console.error("Error fetching books:", error);
//     }
//   };

//   const fetchAllIssues = async () => {
//     try {
//       const issueApi = new DataApi("bookissue");
//       const issuesResp = await issueApi.fetchAll();
//       const issues = Array.isArray(issuesResp?.data) ? issuesResp.data :
//         (issuesResp?.data?.rows || issuesResp || []);
//       setIssuesData(issues);
//     } catch (error) {
//       console.error("Error fetching issues:", error);
//     }
//   };

//   const fetchLatestMembers = () => {
//     const membersData = [
//       {
//         id: 1,
//         name: "Alexander Perce",
//         email: "alex@example.com",
//         phone: "+91 98765 43210",
//         join_date: "12 Jan 2024",
//         card_number: "LIB2024001",
//         status: "Active",
//         photo: dummyPhotos[0]
//       },
//       {
//         id: 2,
//         name: "Terley Norman",
//         email: "terley@example.com",
//         phone: "+91 98765 43211",
//         join_date: "12 Jan 2024",
//         card_number: "LIB2024002",
//         status: "Active",
//         photo: dummyPhotos[1]
//       },
//       {
//         id: 3,
//         name: "Tromsley Latex",
//         email: "tromsley@example.com",
//         phone: "+91 98765 43212",
//         join_date: "12 Jan 2024",
//         card_number: "LIB2024003",
//         status: "Active",
//         photo: dummyPhotos[2]
//       },
//       {
//         id: 4,
//         name: "John Browser",
//         email: "john@example.com",
//         phone: "+91 98765 43213",
//         join_date: "12 Jan 2024",
//         card_number: "LIB2024004",
//         status: "Active",
//         photo: dummyPhotos[3]
//       },
//       {
//         id: 5,
//         name: "Alexander Perce",
//         email: "alex2@example.com",
//         phone: "+91 98765 43214",
//         join_date: "11 Jan 2024",
//         card_number: "LIB2024005",
//         status: "Active",
//         photo: dummyPhotos[4]
//       },
//     ];
//     setLatestMembers(membersData);
//   };

//   const fetchDashboardSummary = async () => {
//     try {
//       const libraryApi = new DataApi("library");
//       const dashboardResponse = await libraryApi.get("/dashboard");

//       if (dashboardResponse.data?.success) {
//         const data = dashboardResponse.data.data;
//         setDashboardData(data);
//         if (data.summary) {
//           setMetrics(prev => ({
//             ...prev,
//             totalBooks: data.summary.totalBooks || data.summary.total_copies || 0,
//             totalTitles: data.summary.totalTitles || data.summary.total_books || 0,
//             availableBooks: data.summary.availableBooks || data.summary.available_copies || 0,
//             issuedBooks: data.summary.issuedBooks || data.summary.issued_copies || 0,
//             booksThisMonth: data.summary.booksThisMonth || data.summary.books_this_month || 0,
//             totalSubmissions: data.summary.totalSubmissions || data.summary.total_submissions || 0,
//             total_copies: data.summary.totalCopies || data.summary.totalCopies || 0,
//           }));
//         }
//         if (data.booksByCategory?.length > 0) {
//           setBooksByCategory(data.booksByCategory);
//           const topCategories = data.booksByCategory.slice(0, 5).map(item => ({
//             name: item.category_name || "Unknown",
//             icon: "fa-tag",
//             count: parseInt(item.book_count || 0),
//           }));
//           setCategories(topCategories);
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching dashboard summary:", error);
//     }
//   };

//   const fetchAlertMetrics = async () => {
//     try {
//       const resp = await DashboardApi.fetchAll();
//       const data = resp?.data?.[0] || {};

//       setMetrics(prev => ({
//         ...prev,
//         dueSoonCount: data.total_due_soon || 0,
//         overdueCount: data.overdue_books || 0,
//         fineCollectedThisMonth: data.fine_collected_this_month || 0,
//         damagedCount: data.damaged_missing_books || 0,
//       }));
//     } catch (err) {
//       console.error("Error fetching alert metrics:", err);
//     }
//   };

//   const fetchLibraryDetails = async () => {
//     try {
//       const bookApi = new DataApi("book");
//       const issueApi = new DataApi("bookissue");
//       const settingsApi = new DataApi("librarysettings");
//       const cardApi = new DataApi("librarycard");

//       const booksResp = await bookApi.fetchAll();
//       const books = Array.isArray(booksResp?.data) ? booksResp.data :
//         (booksResp?.data?.rows || booksResp || []);

//       let availableCopies = 0;
//       const booksWithAvailability = [];

//       if (Array.isArray(books)) {
//         books.forEach((b) => {
//           const total = Number(b.total_copies ?? b.totalCopies ?? 0) || 0;
//           const available = Number(b.available_copies ?? b.availableCopies ?? total) || total;
//           availableCopies += available;

//           booksWithAvailability.push({
//             title: b.title || "Unknown",
//             available_copies: available,
//             total_copies: total
//           });
//         });
//       }

//       const sortedBooks = [...booksWithAvailability]
//         .sort((a, b) => b.available_copies - a.available_copies)
//         .slice(0, 10);
//       setTopAvailableBooks(sortedBooks);

//       const issuesResp = await issueApi.get("/active");
//       const activeIssues = Array.isArray(issuesResp?.data) ? issuesResp.data :
//         (issuesResp?.data?.rows || issuesResp || []);
//       const issuedCount = Array.isArray(activeIssues) ? activeIssues.length : 0;

//       let cardLimit = 6;
//       try {
//         const settingsResp = await settingsApi.get("/all");
//         const settingsData = settingsResp?.data?.data || settingsResp?.data || settingsResp;
//         if (settingsData) {
//           cardLimit = Number(
//             settingsData.max_books_per_card ??
//             settingsData.max_books ??
//             settingsData.max_books_per_card?.setting_value
//           ) || cardLimit;
//         }
//       } catch (err) {
//         console.warn("Could not fetch card limit:", err);
//       }

//       setCardLimitSetting(cardLimit);

//       await fetchCardDetails(cardApi, issueApi, cardLimit);

//     } catch (error) {
//       console.error("Error fetching library details:", error);
//     }
//   };

//   const fetchCardDetails = async (cardApi, issueApi, currentLimit) => {
//     try {
//       const cardsResp = await cardApi.fetchAll();
//       const issuesResp = await issueApi.get("/active");

//       const cards = Array.isArray(cardsResp?.data) ? cardsResp.data :
//         (cardsResp?.data?.rows || cardsResp || []);
//       const activeIssues = Array.isArray(issuesResp?.data) ? issuesResp.data :
//         (issuesResp?.data?.rows || issuesResp || []);

//       const countsByCard = {};
//       activeIssues.forEach((issue) => {
//         const cid = issue.card_id || issue.cardId || issue.cardid;
//         if (cid) {
//           countsByCard[cid] = (countsByCard[cid] || 0) + 1;
//         }
//       });

//       const details = cards.map((c) => {
//         const issued = countsByCard[c.id] || 0;
//         const remaining = Math.max(0, currentLimit - issued);
//         return {
//           id: c.id,
//           user_name: c.user_name || c.userName || `Card ${c.card_number}` || "Unknown",
//           issued: issued,
//           remaining: remaining
//         };
//       });

//       details.sort((a, b) => b.issued - a.issued);
//       setCardDetails(details.slice(0, 10));

//     } catch (error) {
//       console.error("Error fetching card details:", error);
//     }
//   };

//   const handleCardClick = () => {
//     // Navigate to /book page instead of opening modal
//     navigate("/book");
//   };

//   const handleLatestMembersClick = () => {
//     navigate("/librarycard");
//   };

//   const handleTopCategoriesClick = () => {
//     navigate("/category");
//   };

//   const handleQuickStatsClick = () => {
//     navigate("/book");
//   };

//   // Chart configuration function
//   const getChartConfig = (filename) => ({
//     toolbar: {
//       show: true,
//       tools: {
//         download: true,
//         selection: true,
//         zoom: true,
//         zoomin: true,
//         zoomout: true,
//         pan: true,
//         reset: true,
//       },
//       export: {
//         csv: {
//           filename: filename,
//           headerCategory: "Category",
//           columnDelimiter: ','
//         },
//         svg: {
//           filename: filename
//         },
//         png: {
//           filename: filename
//         }
//       }
//     }
//   });

//   const funnelChartOptions = {
//     chart: {
//       type: 'bar',
//       height: 320,
//       fontFamily: 'inherit',
//       toolbar: getChartConfig("Books_Highest_Available_Stock_Report").toolbar,
//       zoom: {
//         enabled: true,
//         type: 'x',
//         autoScaleYaxis: true
//       },
//       animations: {
//         enabled: true,
//         easing: 'easeinout',
//         speed: 800
//       }
//     },
//     plotOptions: {
//       bar: {
//         borderRadius: 6,
//         horizontal: true,
//         barHeight: '70%',
//         distributed: false,
//         dataLabels: {
//           position: 'center'
//         }
//       }
//     },
//     dataLabels: {
//       enabled: true,
//       formatter: function (val) {
//         return val + " copies";
//       },
//       textAnchor: 'start',
//       offsetX: 10,
//       style: {
//         fontSize: '11px',
//         colors: ['#fff'],
//         fontWeight: 600,
//         fontFamily: 'inherit'
//       }
//     },
//     xaxis: {
//       categories: topAvailableBooks.map(b =>
//         b.title.length > 18 ? b.title.substring(0, 18) + "..." : b.title
//       ),
//       labels: {
//         style: {
//           colors: '#64748b',
//           fontSize: '11px',
//           fontFamily: 'inherit'
//         }
//       },
//       title: {
//         text: 'Available Copies',
//         style: {
//           color: '#64748b',
//           fontSize: '12px',
//           fontFamily: 'inherit',
//           fontWeight: 600
//         }
//       },
//       axisBorder: {
//         show: true,
//         color: '#e2e8f0'
//       },
//       axisTicks: {
//         show: true,
//         color: '#e2e8f0'
//       }
//     },
//     yaxis: {
//       labels: {
//         style: {
//           colors: '#334155',
//           fontWeight: 600,
//           fontSize: '12px',
//           fontFamily: 'inherit'
//         }
//       }
//     },
//     colors: [
//       '#4f46e5', '#6366f1', '#818cf8', '#93c5fd', '#60a5fa',
//       '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'
//     ].reverse(),
//     tooltip: {
//       theme: 'light',
//       style: {
//         fontSize: '12px',
//         fontFamily: 'inherit'
//       },
//       y: {
//         formatter: (val) => `${val} copies available`,
//         title: {
//           formatter: (seriesName) => 'Available Copies:'
//         }
//       },
//       x: {
//         formatter: (val, { series, seriesIndex, dataPointIndex, w }) => {
//           const book = topAvailableBooks[dataPointIndex];
//           return `<strong>${book.title}</strong><br/>Total: ${book.total_copies} copies<br/>Available: ${book.available_copies} copies`;
//         }
//       }
//     },
//     legend: {
//       show: false
//     },
//     grid: {
//       show: true,
//       borderColor: '#f1f5f9',
//       xaxis: {
//         lines: {
//           show: true
//         }
//       },
//       yaxis: {
//         lines: {
//           show: true
//         }
//       }
//     },
//     states: {
//       hover: {
//         filter: {
//           type: 'darken',
//           value: 0.8
//         }
//       },
//       active: {
//         filter: {
//           type: 'darken',
//           value: 0.7
//         }
//       }
//     },
//     responsive: [{
//       breakpoint: 768,
//       options: {
//         chart: {
//           height: 280
//         },
//         dataLabels: {
//           enabled: false
//         }
//       }
//     }]
//   };

//   const funnelChartSeries = [{
//     name: 'Available Copies',
//     data: topAvailableBooks.map(b => parseInt(b.available_copies || 0))
//   }];

//   const donutOptions = {
//     chart: {
//       type: "donut",
//       height: 220,
//       fontFamily: 'inherit',
//       toolbar: getChartConfig("Inventory_Status_Report").toolbar,
//       animations: {
//         enabled: true,
//         easing: 'easeinout',
//         speed: 800
//       }
//     },
//     colors: [SUCCESS_COLOR, PRIMARY_COLOR],
//     legend: {
//       position: "bottom",
//       fontSize: '12px',
//       fontFamily: 'inherit',
//       markers: {
//         radius: 8,
//         width: 12,
//         height: 12
//       },
//       itemMargin: {
//         horizontal: 8,
//         vertical: 4
//       },
//       onItemClick: {
//         toggleDataSeries: true
//       },
//       onItemHover: {
//         highlightDataSeries: true
//       }
//     },
//     dataLabels: {
//       enabled: true,
//       style: {
//         fontSize: '12px',
//         fontWeight: 600,
//         fontFamily: 'inherit'
//       },
//       dropShadow: {
//         enabled: true,
//         top: 1,
//         left: 1,
//         blur: 1,
//         opacity: 0.2
//       },
//       formatter: function (val, { seriesIndex, w }) {
//         return w.config.series[seriesIndex] + '%';
//       }
//     },
//     plotOptions: {
//       pie: {
//         donut: {
//           size: "65%",
//           labels: {
//             show: true,
//             total: {
//               show: true,
//               label: 'Total Copies',
//               color: '#334155',
//               fontWeight: 600,
//               fontSize: '12px',
//               fontFamily: 'inherit',
//               formatter: () => formatNumber(metrics.totalBooks)
//             },
//             value: {
//               show: true,
//               fontSize: '20px',
//               fontWeight: 700,
//               color: '#1e293b',
//               fontFamily: 'inherit',
//               formatter: (val) => val + '%'
//             }
//           }
//         }
//       }
//     },
//     stroke: {
//       width: 2,
//       colors: ['#fff']
//     },
//     tooltip: {
//       theme: "light",
//       style: {
//         fontSize: '12px',
//         fontFamily: 'inherit'
//       },
//       y: {
//         formatter: (val) => `${val}% (${formatNumber(Math.round((val / 100) * metrics.totalBooks))} copies)`,
//         title: {
//           formatter: (seriesName) => seriesName
//         }
//       }
//     },
//     responsive: [{
//       breakpoint: 768,
//       options: {
//         chart: {
//           height: 200
//         },
//         legend: {
//           position: 'bottom',
//           horizontalAlign: 'center'
//         }
//       }
//     }]
//   };

//   const calculateDonutSeries = () => {
//     if (metrics.totalBooks === 0) return [0, 0];
//     const issuedPercentage = Math.round((metrics.issuedBooks / metrics.totalBooks) * 100);
//     const availablePercentage = 100 - issuedPercentage;
//     return [availablePercentage, issuedPercentage];
//   };

//   const donutChartSeries = calculateDonutSeries();

//   const summaryCards = [
//     {
//       title: "Total Books",
//       value: formatNumber(metrics.totalTitles || metrics.totalBooks),
//       icon: "fa-book",
//       color: PRIMARY_COLOR,
//       bgColor: "#e0e7ff",
//       type: "totalBooks"
//     },
//     {
//       title: "Total Copies",
//       value: formatNumber(metrics.total_copies),
//       icon: "fa-copy",
//       color: ACCENT_COLOR,
//       bgColor: "#e0e7ff",
//       type: "totalCopies"
//     },
//     {
//       title: "Available Copies",
//       value: formatNumber(metrics.availableBooks),
//       icon: "fa-book-open",
//       color: SUCCESS_COLOR,
//       bgColor: "#d1fae5",
//       type: "availableCopies"
//     },
//     {
//       title: "Issued Copies",
//       value: formatNumber(metrics.issuedBooks),
//       icon: "fa-user-pen",
//       color: WARNING_COLOR,
//       bgColor: "#fef3c7",
//       type: "issuedCopies"
//     },
//   ];

//   const alertCards = [
//     {
//       count: metrics.dueSoonCount,
//       label: "Due Soon",
//       icon: "fa-clock",
//       bg: "#fff7ed",
//       color: WARNING_COLOR,
//       type: "dueSoon"
//     },
//     {
//       count: metrics.overdueCount,
//       label: "Overdue",
//       icon: "fa-circle-exclamation",
//       bg: "#fef2f2",
//       color: DANGER_COLOR,
//       type: "overdue"
//     },
//     {
//       count: metrics.fineCollectedThisMonth,
//       label: "Fine Collected",
//       icon: "fa-indian-rupee-sign",
//       bg: "#ecfdf5",
//       color: SUCCESS_COLOR,
//       isCurrency: true,
//       type: "fineCollected"
//     },
//     {
//       count: metrics.damagedCount,
//       label: "Damaged / Lost",
//       icon: "fa-heart-crack",
//       bg: "#fdf2f8",
//       color: '#db2777',
//       type: "damagedLost"
//     }
//   ];

//   if (loading) {
//     return (
//       <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
//         <Loader />
//       </div>
//     );
//   }

//   if (userRole === "STUDENT") {
//     return (
//       <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "20px" }}>
//         <ScrollToTop />
//         <Container fluid>
//           <Card style={{
//             ...styles.card,
//             background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${INFO_COLOR} 100%)`,
//             color: "white",
//             marginBottom: "30px",
//             border: 'none'
//           }}>
//             <Card.Body className="p-4">
//               <h1 className="fw-bolder mb-2" style={{ fontSize: '24px' }}>
//                 Welcome Back, {userInfo?.firstname || 'Student'}! 👋
//               </h1>
//               <p className="mb-0 opacity-75" style={{ fontSize: '16px' }}>
//                 Your personalized library dashboard is ready. Check your borrowed books and upcoming deadlines.
//               </p>
//             </Card.Body>
//           </Card>

//           <Row>
//             <Col lg={8} className="mx-auto">
//               <Card style={styles.card}>
//                 <Card.Header style={styles.cardHeader}>
//                   <h5 className="fw-bold mb-0">Your Currently Issued Books</h5>
//                 </Card.Header>
//                 <Card.Body>
//                   <div className="text-center py-5">
//                     <i className="fa-solid fa-book-open-reader fa-3x text-muted mb-3"></i>
//                     <p className="text-muted">No books currently issued</p>
//                     <button className="btn btn-primary mt-2" onClick={() => navigate("/book")}>
//                       Browse Library
//                     </button>
//                   </div>
//                 </Card.Body>
//               </Card>
//             </Col>
//           </Row>
//         </Container>
//       </div>
//     );
//   }

//   return (
//     <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "16px" }}>
//       <ScrollToTop />
//       <Container fluid className="px-2 py-2">
//         {/* Header with Filter */}
//         <div className="d-flex justify-content-between align-items-center mb-3">
//           <div>
//             <h6 >
//               📚   Real-time analytics for efficient library management
//             </h6>
//           </div>

//           <Dropdown>
//             <Dropdown.Toggle
//               variant="outline-secondary"
//               size="sm"
//               className="rounded-pill px-3"
//               style={{
//                 borderColor: '#e2e8f0',
//                 fontSize: '12px',
//                 fontWeight: '500'
//               }}
//             >
//               <i className="fa-solid fa-filter me-1"></i>
//               Filter: {filter === 'all' ? 'All Time' : filter === 'week' ? 'This Week' : filter === 'month' ? 'This Month' : 'This Year'}
//             </Dropdown.Toggle>
//             <Dropdown.Menu>
//               <Dropdown.Item onClick={() => setFilter("all")}>All Time</Dropdown.Item>
//               <Dropdown.Item onClick={() => setFilter("week")}>This Week</Dropdown.Item>
//               <Dropdown.Item onClick={() => setFilter("month")}>This Month</Dropdown.Item>
//               <Dropdown.Item onClick={() => setFilter("year")}>This Year</Dropdown.Item>
//             </Dropdown.Menu>
//           </Dropdown>
//         </div>

//         {/* 1. Core Library Inventory - Clickable Cards */}
//         <Row className="mb-3 g-2">
//           {summaryCards.map((card, index) => (
//             <Col xl={3} lg={6} md={6} sm={12} key={index}>
//               <InteractiveCard
//                onClick={handleCardClick}
//               >
//                 <Card.Body className="p-2">
//                   <div className="d-flex align-items-center justify-content-between">
//                     <div>
//                       <p className="mb-1 text-uppercase" style={{
//                         fontSize: "10px",
//                         fontWeight: "700",
//                         color: "black"
//                       }}>
//                         {card.title}
//                       </p>
//                       <h2 className="mb-0" style={{
//                         color: card.color,
//                         fontSize: "20px",
//                         fontWeight: "800"
//                       }}>
//                         {card.value}
//                       </h2>
//                     </div>
//                     <div style={{
//                       width: "40px",
//                       height: "40px",
//                       borderRadius: "10px",
//                       backgroundColor: card.bgColor,
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "center",
//                       minWidth: "40px"
//                     }}>
//                       <i className={`fa-solid ${card.icon}`} style={{
//                         fontSize: "18px",
//                         color: card.color
//                       }}></i>
//                     </div>
//                   </div>
//                   <p className="mb-0 small text-dark mt-1" style={{ fontSize: '11px', cursor: 'pointer' }}>
//                     <i className="fa-solid fa-magnifying-glass me-1"></i>
//                     Click to view books
//                   </p>
//                 </Card.Body>
//               </InteractiveCard>
//             </Col>
//           ))}
//         </Row>

//         {/* 2. Urgent Actions & Financial Metrics - Clickable Cards */}
//         <div style={styles.sectionTitle}>
//           <i className="fa-solid fa-bell" style={{ color: WARNING_COLOR, fontSize: '14px' }}></i>
//           Urgent Actions
//         </div>
//         <Row className="mb-3 g-2">
//           {alertCards.map((item, idx) => (
//             <Col xl={3} lg={6} md={6} sm={12} key={idx}>
//               <InteractiveCard
//                 style={{ borderLeft: `4px solid ${item.color}` }}
//                 // onClick={handleCardClick}
//               >
//                 <Card.Body className="p-2">
//                   <div className="d-flex align-items-center">
//                     <div className="me-2" style={{
//                       width: "36px",
//                       height: "36px",
//                       borderRadius: '8px',
//                       background: item.bg,
//                       display: 'flex',
//                       alignItems: 'center',
//                       justifyContent: 'center',
//                       fontSize: '14px',
//                       color: item.color,
//                       flexShrink: 0
//                     }}>
//                       <i className={`fa-solid ${item.icon}`}></i>
//                     </div>
//                     <div>
//                       <h4 className="mb-0 fw-bolder" style={{
//                         color: item.color,
//                         fontSize: "16px"
//                       }}>
//                         {item.isCurrency ? formatCurrency(item.count) : formatNumber(item.count)}
//                       </h4>
//                       <small className="text-muted fw-semibold" style={{ fontSize: '11px' }}>
//                         {item.label}
//                       </small>
//                     </div>
//                   </div>
//                   <p className="mb-0 small text-muted mt-1" style={{ fontSize: '10px', cursor: 'pointer' }}>
//                     <i className="fa-solid fa-magnifying-glass me-1"></i>
//                     Click to view books
//                   </p>
//                 </Card.Body>
//               </InteractiveCard>
//             </Col>
//           ))}
//         </Row>

//         {/* 3. Main Charts Section */}
//         <Row className="mb-3 g-2">
//           {/* Latest Members - Clickable Card */}
//           <Col lg={4}>
//             <InteractiveCard onClick={handleLatestMembersClick}>
//               <Card.Header style={styles.cardHeader}>
//                 <div className="d-flex justify-content-between align-items-center">
//                   <div>
//                     <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '14px' }}>Latest Members</h6>
//                     <small className="text-muted" style={{ fontSize: '11px' }}>Recently joined library members</small>
//                   </div>
//                   <Badge className="px-2 py-1" style={{
//                     borderRadius: '30px',
//                     fontSize: '9px',
//                     fontWeight: 600,
//                     background: SUCCESS_COLOR,
//                     color: 'white'
//                   }}>
//                     NEW
//                   </Badge>
//                 </div>
//               </Card.Header>
//               <Card.Body className="p-0">
//                 <div className="list-group list-group-flush">
//                   {latestMembers.slice(0, 5).map((member, idx) => (
//                     <div key={member.id} className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
//                       <div className="d-flex align-items-center">
//                         <div className="position-relative me-2">
//                           <img
//                             src={member.photo}
//                             alt={member.name}
//                             style={{
//                               width: "36px",
//                               height: "36px",
//                               borderRadius: "50%",
//                               objectFit: "cover",
//                               border: "2px solid #e2e8f0"
//                             }}
//                           />
//                           <div style={{
//                             position: "absolute",
//                             bottom: 0,
//                             right: 0,
//                             width: "10px",
//                             height: "10px",
//                             borderRadius: "50%",
//                             background: SUCCESS_COLOR,
//                             border: "2px solid white"
//                           }}></div>
//                         </div>
//                         <div>
//                           <p className="mb-0 fw-semibold" style={{ fontSize: '13px' }}>
//                             {member.name}
//                           </p>
//                           <small className="text-muted" style={{ fontSize: '11px' }}>
//                             <i className="fa-solid fa-calendar-days me-1"></i>
//                             Joined {member.join_date}
//                           </small>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//                 <div className="px-2 py-1 border-top">
//                   <div className="text-center">
//                     <small className="fw-semibold" style={{ color: PRIMARY_COLOR, fontSize: '11px', cursor: 'pointer' }}>
//                       <i className="fa-solid fa-magnifying-glass me-1"></i>
//                       Click to view books
//                     </small>
//                   </div>
//                 </div>
//               </Card.Body>
//             </InteractiveCard>
//           </Col>

//           {/* Funnel Chart */}
//           <Col lg={8}>
//             <Card style={styles.card}>
//               <Card.Header style={styles.cardHeader}>
//                 <div className="d-flex justify-content-between align-items-center">
//                   <div>
//                     <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '14px' }}>Books with Highest Available Stock</h6>
//                     <small className="text-muted" style={{ fontSize: '11px' }}>Top 10 books by available copies</small>
//                   </div>
//                 </div>
//               </Card.Header>
//               <Card.Body className="p-2">
//                 {topAvailableBooks.length > 0 ? (
//                   <Chart
//                     options={funnelChartOptions}
//                     series={funnelChartSeries}
//                     type="bar"
//                     height={280}
//                   />
//                 ) : (
//                   <div className="d-flex flex-column align-items-center justify-content-center py-4 text-muted">
//                     <i className="fa-solid fa-book-open-reader fa-2x mb-2"></i>
//                     <small>No inventory data available</small>
//                   </div>
//                 )}
//                 <div className="mt-2 text-center">
//                   <small className="text-muted" style={{ fontSize: '10px' }}>
//                     <i className="fa-solid fa-circle-info me-1"></i>
//                     Hover for details | Click toolbar for export options (PNG, SVG, CSV)
//                   </small>
//                 </div>
//               </Card.Body>
//             </Card>
//           </Col>
//         </Row>

//         {/* 4. Secondary Analytics */}
//         <Row className="g-2">
//           {/* Top Categories - Clickable Card */}
//           <Col lg={4}>
//             <InteractiveCard onClick={handleTopCategoriesClick}>
//               <Card.Header style={styles.cardHeader}>
//                 <div className="d-flex justify-content-between align-items-center">
//                   <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '14px' }}>Top Categories by Stock</h6>
//                   <Badge className="px-2 py-1" style={{
//                     borderRadius: '30px',
//                     fontSize: '9px',
//                     fontWeight: 600,
//                     background: PRIMARY_COLOR,
//                     color: 'white',
//                     cursor: 'pointer'
//                   }}>
//                     VIEW ALL
//                   </Badge>
//                 </div>
//                 <small className="text-muted" style={{ fontSize: '11px' }}>Most populated categories</small>
//               </Card.Header>
//               <Card.Body className="p-0">
//                 <div className="list-group list-group-flush">
//                   {categories.length > 0 ? categories.slice(0, 5).map((cat, idx) => (
//                     <div key={idx} className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
//                       <div className="d-flex align-items-center">
//                         <div className="me-2 rounded-circle d-flex align-items-center justify-content-center"
//                           style={{
//                             width: 32,
//                             height: 32,
//                             background: '#e0e7ff',
//                             color: PRIMARY_COLOR
//                           }}>
//                           <i className={`fa-solid ${cat.icon}`}></i>
//                         </div>
//                         <span className="fw-semibold text-dark" style={{ fontSize: '13px' }}>
//                           {cat.name.length > 18 ? cat.name.substring(0, 18) + "..." : cat.name}
//                         </span>
//                       </div>
//                       <Badge style={{
//                         background: PRIMARY_COLOR,
//                         color: 'white',
//                         fontWeight: 600,
//                         fontSize: '11px'
//                       }} className="rounded-pill px-2 py-1">
//                         {formatNumber(cat.count)}
//                       </Badge>
//                     </div>
//                   )) : (
//                     <div className="text-center py-3 text-muted">
//                       <i className="fa-solid fa-tags fa-lg mb-2"></i>
//                       <p className="mb-0" style={{ fontSize: '12px' }}>No category data available</p>
//                     </div>
//                   )}
//                 </div>
//               </Card.Body>
//             </InteractiveCard>
//           </Col>

//           {/* Donut Chart */}
//           <Col lg={4}>
//             <Card style={styles.card}>
//               <Card.Body className="text-center p-2">
//                 <div className="d-flex justify-content-between align-items-center mb-2">
//                   <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '14px' }}>
//                     Books Copies Status
//                   </h6>
//                   <Badge className="px-2 py-1" style={{
//                     borderRadius: '30px',
//                     fontSize: '9px',
//                     fontWeight: 600,
//                     background: INFO_COLOR,
//                     color: 'black'
//                   }}>
//                     DONUT CHART
//                   </Badge>
//                 </div>
//                 <Chart
//                   options={donutOptions}
//                   series={donutChartSeries}
//                   type="donut"
//                   height={180}
//                 />
//                 <div className="mt-2">
//                   <div className="d-flex justify-content-center align-items-center mb-1">
//                     <div className="me-1" style={{
//                       width: '8px',
//                       height: '8px',
//                       borderRadius: '50%',
//                       background: SUCCESS_COLOR
//                     }}></div>
//                     <span className="text-muted small me-2" style={{ fontSize: '11px' }}>Available: {donutChartSeries[0]}%</span>
//                     <div className="me-1" style={{
//                       width: '8px',
//                       height: '8px',
//                       borderRadius: '50%',
//                       background: PRIMARY_COLOR
//                     }}></div>
//                     <span className="text-muted small" style={{ fontSize: '11px' }}>Issued: {donutChartSeries[1]}%</span>
//                   </div>
//                   <h4 className="fw-bolder mt-1" style={{
//                     color: WARNING_COLOR,
//                     fontSize: '18px'
//                   }}>
//                     {donutChartSeries[1]}%
//                   </h4>
//                   <small className="text-muted" style={{ fontSize: '11px' }}>of total copies currently issued</small>
//                 </div>
//               </Card.Body>
//             </Card>
//           </Col>

//           {/* Quick Stats - Clickable Card */}
//           <Col lg={4}>
//             <InteractiveCard onClick={handleQuickStatsClick}>
//               <Card.Header style={styles.cardHeader}>
//                 <div className="d-flex justify-content-between align-items-center">
//                   <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '14px' }}>Quick Stats</h6>
//                   <Badge className="px-2 py-1" style={{
//                     borderRadius: '30px',
//                     fontSize: '9px',
//                     fontWeight: 600,
//                     background: INFO_COLOR,
//                     color: 'white',
//                     cursor: 'pointer'
//                   }}>
//                     DETAILS
//                   </Badge>
//                 </div>
//                 <small className="text-muted" style={{ fontSize: '11px' }}>Recent library activity</small>
//               </Card.Header>
//               <Card.Body className="p-0">
//                 <div className="list-group list-group-flush">
//                   <div className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
//                     <div className="d-flex align-items-center">
//                       <div className="me-2" style={{
//                         width: 32,
//                         height: 32,
//                         borderRadius: '8px',
//                         background: '#e0e7ff',
//                         color: PRIMARY_COLOR,
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center'
//                       }}>
//                         <i className="fa-solid fa-book-medical"></i>
//                       </div>
//                       <div>
//                         <p className="mb-0 fw-semibold" style={{ fontSize: '13px' }}>New Books This Month</p>
//                         <small className="text-muted" style={{ fontSize: '11px' }}>Added in last 30 days</small>
//                       </div>
//                     </div>
//                     <Badge className="rounded-pill px-2 py-1" style={{
//                       background: PRIMARY_COLOR,
//                       fontSize: '12px',
//                       fontWeight: '600'
//                     }}>
//                       {formatNumber(metrics.booksThisMonth)}
//                     </Badge>
//                   </div>

//                   <div className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
//                     <div className="d-flex align-items-center">
//                       <div className="me-2" style={{
//                         width: 32,
//                         height: 32,
//                         borderRadius: '8px',
//                         background: '#ecfdf5',
//                         color: SUCCESS_COLOR,
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center'
//                       }}>
//                         <i className="fa-solid fa-users"></i>
//                       </div>
//                       <div>
//                         <p className="mb-0 fw-semibold" style={{ fontSize: '13px' }}>Active Borrowers</p>
//                         <small className="text-muted" style={{ fontSize: '11px' }}>Currently issued books</small>
//                       </div>
//                     </div>
//                     <Badge className="rounded-pill px-2 py-1" style={{
//                       background: SUCCESS_COLOR,
//                       fontSize: '12px',
//                       fontWeight: '600'
//                     }}>
//                       {formatNumber(cardDetails.length)}
//                     </Badge>
//                   </div>

//                   <div className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
//                     <div className="d-flex align-items-center">
//                       <div className="me-2" style={{
//                         width: 32,
//                         height: 32,
//                         borderRadius: '8px',
//                         background: '#fef3c7',
//                         color: WARNING_COLOR,
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center'
//                       }}>
//                         <i className="fa-solid fa-percentage"></i>
//                       </div>
//                       <div>
//                         <p className="mb-0 fw-semibold" style={{ fontSize: '13px' }}>Utilization Rate</p>
//                         <small className="text-muted" style={{ fontSize: '11px' }}>Library capacity usage</small>
//                       </div>
//                     </div>
//                     <Badge className="rounded-pill px-2 py-1" style={{
//                       background: WARNING_COLOR,
//                       fontSize: '12px',
//                       fontWeight: '600'
//                     }}>
//                       {metrics.total_copies > 0 ? Math.round((metrics.issuedBooks / metrics.total_copies) * 100) : 0}%
//                     </Badge>
//                   </div>
//                 </div>
//               </Card.Body>
//             </InteractiveCard>
//           </Col>
//         </Row>
//       </Container>
//     </div>
//   );
// };

// export default Dashboard;




/*
**@Author: Aabid 
**@Date: NOV-2025
*/

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

  const dummyPhotos = [
    "https://randomuser.me/api/portraits/men/32.jpg",
    "https://randomuser.me/api/portraits/women/44.jpg",
    "https://randomuser.me/api/portraits/men/67.jpg",
    "https://randomuser.me/api/portraits/women/65.jpg",
    "https://randomuser.me/api/portraits/men/75.jpg"
  ];

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
    } catch (error) {
      console.error("Error fetching issues:", error);
    }
  };

  const fetchLatestMembers = () => {
    const membersData = [
      {
        id: 1,
        name: "Alexander Perce",
        email: "alex@example.com",
        phone: "+91 98765 43210",
        join_date: "12 Jan 2024",
        card_number: "LIB2024001",
        status: "Active",
        photo: dummyPhotos[0]
      },
      {
        id: 2,
        name: "Terley Norman",
        email: "terley@example.com",
        phone: "+91 98765 43211",
        join_date: "12 Jan 2024",
        card_number: "LIB2024002",
        status: "Active",
        photo: dummyPhotos[1]
      },
      {
        id: 3,
        name: "Tromsley Latex",
        email: "tromsley@example.com",
        phone: "+91 98765 43212",
        join_date: "12 Jan 2024",
        card_number: "LIB2024003",
        status: "Active",
        photo: dummyPhotos[2]
      },
      {
        id: 4,
        name: "John Browser",
        email: "john@example.com",
        phone: "+91 98765 43213",
        join_date: "12 Jan 2024",
        card_number: "LIB2024004",
        status: "Active",
        photo: dummyPhotos[3]
      },
      {
        id: 5,
        name: "Alexander Perce",
        email: "alex2@example.com",
        phone: "+91 98765 43214",
        join_date: "11 Jan 2024",
        card_number: "LIB2024005",
        status: "Active",
        photo: dummyPhotos[4]
      },
    ];
    setLatestMembers(membersData);
  };

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

  const handleCardClick = () => {
    // Navigate to /book page instead of opening modal
    navigate("/book");
  };

  const handleLatestMembersClick = () => {
    navigate("/librarycard");
  };

  const handleTopCategoriesClick = () => {
    navigate("/category");
  };

  const handleQuickStatsClick = () => {
    navigate("/book");
  };

  // Chart configuration function
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

  // const summaryCards = [
  //   {
  //     title: "Total Books",
  //     value: formatNumber(metrics.totalTitles || metrics.totalBooks),
  //     icon: "fa-book",
  //     color: PRIMARY_COLOR,
  //     bgColor: "#e0e7ff",
  //     type: "totalBooks"
  //   },
  //   {
  //     title: "Total Copies",
  //     value: formatNumber(metrics.total_copies),
  //     icon: "fa-copy",
  //     color: ACCENT_COLOR,
  //     bgColor: "#e0e7ff",
  //     type: "totalCopies"
  //   },
  //   {
  //     title: "Available Copies",
  //     value: formatNumber(metrics.availableBooks),
  //     icon: "fa-book-open",
  //     color: SUCCESS_COLOR,
  //     bgColor: "#d1fae5",
  //     type: "availableCopies"
  //   },
  //   {
  //     title: "Issued Copies",
  //     value: formatNumber(metrics.issuedBooks),
  //     icon: "fa-user-pen",
  //     color: WARNING_COLOR,
  //     bgColor: "#fef3c7",
  //     type: "issuedCopies"
  //   },
  // ];
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
      // subtitle: "Total/Available",
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
  // const alertCards = [
  //   {
  //     count: metrics.dueSoonCount,
  //     label: "Due Soon",
  //     icon: "fa-clock",
  //     bg: "#fff7ed",
  //     color: WARNING_COLOR,
  //     type: "dueSoon"
  //   },
  //   {
  //     count: metrics.overdueCount,
  //     label: "Overdue",
  //     icon: "fa-circle-exclamation",
  //     bg: "#fef2f2",
  //     color: DANGER_COLOR,
  //     type: "overdue"
  //   },
  //   {
  //     count: metrics.fineCollectedThisMonth,
  //     label: "Fine Collected",
  //     icon: "fa-indian-rupee-sign",
  //     bg: "#ecfdf5",
  //     color: SUCCESS_COLOR,
  //     isCurrency: true,
  //     type: "fineCollected"
  //   },
  //   {
  //     count: metrics.damagedCount,
  //     label: "Damaged / Lost",
  //     icon: "fa-heart-crack",
  //     bg: "#fdf2f8",
  //     color: '#db2777',
  //     type: "damagedLost"
  //   }
  // ];

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
        {/* Header with Filter */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h6 >
              📚   Real-time analytics for efficient library management
            </h6>
          </div>

          <Dropdown>
            <Dropdown.Toggle
              variant="outline-secondary"
              size="sm"
              className="rounded-pill px-3"
              style={{
                borderColor: '#e2e8f0',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              <i className="fa-solid fa-filter me-1"></i>
              Filter: {filter === 'all' ? 'All Time' : filter === 'week' ? 'This Week' : filter === 'month' ? 'This Month' : 'This Year'}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setFilter("all")}>All Time</Dropdown.Item>
              <Dropdown.Item onClick={() => setFilter("week")}>This Week</Dropdown.Item>
              <Dropdown.Item onClick={() => setFilter("month")}>This Month</Dropdown.Item>
              <Dropdown.Item onClick={() => setFilter("year")}>This Year</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* 1. Core Library Inventory - Clickable Cards */}
        <Row className="mb-3 g-2">
          {/* {summaryCards.map((card, index) => (
            <Col xl={3} lg={6} md={6} sm={12} key={index}>
              <InteractiveCard
                onClick={handleCardClick}
              >
                <Card.Body className="p-2">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 text-uppercase" style={{
                        fontSize: "10px",
                        fontWeight: "700",
                        color: "#64748b"
                      }}>
                        {card.title}
                      </p>
                      <h2 className="mb-0" style={{
                        color: card.color,
                        fontSize: "20px",
                        fontWeight: "800"
                      }}>
                        {card.value}
                      </h2>
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
                  <p className="mb-0 small text-muted mt-1" style={{ fontSize: '11px', cursor: 'pointer' }}>
                    <i className="fa-solid fa-magnifying-glass me-1"></i>
                    Click to view books
                  </p>
                </Card.Body>
              </InteractiveCard>
            </Col>
          ))} */}

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

                      {/* Special rendering for copies status card */}
                      {card.subtitle ? (
                        <div>
                          <h2 className="mb-0" style={{
                            color: card.color,
                            fontSize: "20px",
                            fontWeight: "800"
                          }}>
                            {card.value}
                          </h2>
                          <p className="mb-0 small text-muted" style={{
                            fontSize: '9px',
                            fontWeight: '600'
                          }}>
                            <i className="fa-solid fa-arrow-up me-1" style={{ color: SUCCESS_COLOR }}></i>
                            <span style={{ color: SUCCESS_COLOR }}>
                              {formatNumber(metrics.availableBooks)} Available
                            </span>
                            <span className="mx-1">•</span>
                            <i className="fa-solid fa-users me-1" style={{ color: WARNING_COLOR }}></i>
                            <span style={{ color: WARNING_COLOR }}>
                              {formatNumber(metrics.issuedBooks)} Issued
                            </span>
                          </p>
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
                  <p className="mb-0 small text-muted mt-1" style={{ fontSize: '11px', cursor: 'pointer' }}>
                  
                    {card.type === "copiesStatus"
                      ? ""
                      : card.type === "dueSoon" || card.type === "overdue"
                        ? ""
                        : ""}
                  </p>
                </Card.Body>
              </InteractiveCard>
            </Col>
          ))}
        </Row>

        {/* 2. Urgent Actions & Financial Metrics - Clickable Cards */}
        <div style={styles.sectionTitle}>
          <i className="fa-solid fa-bell" style={{ color: WARNING_COLOR, fontSize: '14px' }}></i>
          Urgent Actions
        </div>
        {/* <Row className="mb-3 g-2">
          {alertCards.map((item, idx) => (
            <Col xl={3} lg={6} md={6} sm={12} key={idx}>
              <InteractiveCard
                style={{ borderLeft: `4px solid ${item.color}` }}
              >
                <Card.Body className="p-2">
                  <div className="d-flex align-items-center">
                    <div className="me-2" style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: '8px',
                      background: item.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      color: item.color,
                      flexShrink: 0
                    }}>
                      <i className={`fa-solid ${item.icon}`}></i>
                    </div>
                    <div>
                      <h4 className="mb-0 fw-bolder" style={{
                        color: item.color,
                        fontSize: "16px"
                      }}>
                        {item.isCurrency ? formatCurrency(item.count) : formatNumber(item.count)}
                      </h4>
                      <small className="text-muted fw-semibold" style={{ fontSize: '11px' }}>
                        {item.label}
                      </small>
                    </div>
                  </div>
                  <p className="mb-0 small text-muted mt-1" style={{ fontSize: '10px', cursor: 'pointer' }}>
                    <i className="fa-solid fa-magnifying-glass me-1"></i>
                    Click to view books
                  </p>
                </Card.Body>
              </InteractiveCard>
            </Col>
          ))}
        </Row> */}

        {/* 3. Main Charts Section */}
        <Row className="mb-3 g-2">
          {/* Latest Members - Clickable Card */}
          <Col lg={4}>
            <InteractiveCard onClick={handleLatestMembersClick}>
              <Card.Header style={styles.cardHeader}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '14px' }}>Members with Upcoming Due Dates</h6>
                    <small className="text-muted" style={{ fontSize: '11px' }}>Due reminders for library members</small>
                  </div>
                  <Badge className="px-2 py-1" style={{
                    borderRadius: '30px',
                    fontSize: '9px',
                    fontWeight: 600,
                    background: SUCCESS_COLOR,
                    color: 'white'
                  }}>
                    NEW
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="list-group list-group-flush">
                  {latestMembers.slice(0, 5).map((member, idx) => (
                    <div key={member.id} className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
                      <div className="d-flex align-items-center">
                        <div className="position-relative me-2">
                          <img
                            src={member.photo}
                            alt={member.name}
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
                            background: SUCCESS_COLOR,
                            border: "2px solid white"
                          }}></div>
                        </div>
                        <div>
                          <p className="mb-0 fw-semibold" style={{ fontSize: '13px' }}>
                            {member.name}
                          </p>
                          <small className="text-muted" style={{ fontSize: '11px' }}>
                            <i className="fa-solid fa-calendar-days me-1"></i>
                            Due on {member.join_date}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-2 py-1 border-top">
                  <div className="text-center">
                    <small className="fw-semibold" style={{ color: PRIMARY_COLOR, fontSize: '11px', cursor: 'pointer' }}>
                      <i className="fa-solid fa-magnifying-glass me-1"></i>
                      Click to view library cards
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

          {/* Quick Stats - Clickable Card */}
          {/* <Col lg={4}>
            <InteractiveCard onClick={handleQuickStatsClick}>
              <Card.Header style={styles.cardHeader}>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '14px' }}>Quick Stats</h6>
                  <Badge className="px-2 py-1" style={{
                    borderRadius: '30px',
                    fontSize: '9px',
                    fontWeight: 600,
                    background: INFO_COLOR,
                    color: 'white',
                    cursor: 'pointer'
                  }}>
                    DETAILS
                  </Badge>
                </div>
                <small className="text-muted" style={{ fontSize: '11px' }}>Recent library activity</small>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="list-group list-group-flush">
                  <div className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
                    <div className="d-flex align-items-center">
                      <div className="me-2" style={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        background: '#e0e7ff',
                        color: PRIMARY_COLOR,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <i className="fa-solid fa-book-medical"></i>
                      </div>
                      <div>
                        <p className="mb-0 fw-semibold" style={{ fontSize: '13px' }}>New Books This Month</p>
                        <small className="text-muted" style={{ fontSize: '11px' }}>Added in last 30 days</small>
                      </div>
                    </div>
                    <Badge className="rounded-pill px-2 py-1" style={{
                      background: PRIMARY_COLOR,
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {formatNumber(metrics.booksThisMonth)}
                    </Badge>
                  </div>

                  <div className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
                    <div className="d-flex align-items-center">
                      <div className="me-2" style={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        background: '#ecfdf5',
                        color: SUCCESS_COLOR,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <i className="fa-solid fa-users"></i>
                      </div>
                      <div>
                        <p className="mb-0 fw-semibold" style={{ fontSize: '13px' }}>Active Borrowers</p>
                        <small className="text-muted" style={{ fontSize: '11px' }}>Currently issued books</small>
                      </div>
                    </div>
                    <Badge className="rounded-pill px-2 py-1" style={{
                      background: SUCCESS_COLOR,
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {formatNumber(cardDetails.length)}
                    </Badge>
                  </div>

                  <div className="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-light">
                    <div className="d-flex align-items-center">
                      <div className="me-2" style={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        background: '#fef3c7',
                        color: WARNING_COLOR,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <i className="fa-solid fa-percentage"></i>
                      </div>
                      <div>
                        <p className="mb-0 fw-semibold" style={{ fontSize: '13px' }}>Utilization Rate</p>
                        <small className="text-muted" style={{ fontSize: '11px' }}>Library capacity usage</small>
                      </div>
                    </div>
                    <Badge className="rounded-pill px-2 py-1" style={{
                      background: WARNING_COLOR,
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {metrics.total_copies > 0 ? Math.round((metrics.issuedBooks / metrics.total_copies) * 100) : 0}%
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </InteractiveCard>
          </Col> */}
        </Row>
      </Container>
    </div>
  );
};

export default Dashboard;