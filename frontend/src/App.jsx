
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";

import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import Main from "./components/layout/Main";
import EditProfile from "./components/EditProfile";
import Books from "./components/books/Books";
import BookDetail from "./components/books/BookDetail";

import Author from "./components/author/Author";

import Category from "./components/category/Category";

import Vendor from "./components/Vendor/Vendor";
import VendorDetail from "./components/Vendor/VendorDetail";

import Purchase from "./components/purchase/Purchase";
import User from "./components/user/User";
import UserDetail from "./components/user/UserDetail";
import LibraryCard from "./components/librarycard/LibraryCard";

import BookIssue from "./components/bookissue/BookIssue";
import BookSubmit from "./components/booksubmit/BookSubmit";
import LibrarySettings from "./components/librarysettings/LibrarySettings";


import ToastManager from "./components/common/ToastManager";
import { v4 as uuidv4 } from "uuid";
import Company from "./components/Company/Company";
import CompanyDetail from "./components/Company/CompanyDetail";
import PurchaseDetail from "./components/purchase/PurchaseDetail";
import BulkIssue from "./components/bookissue/BulkIssue";
import AuthorDetail from "./components/author/AuthorDetail";
import CategoryDetail from "./components/category/CategoryDetail";
import LibraryCardDetail from "./components/librarycard/LibraryCardDetail";
import UserRole from "./components/userrole/userrole";
import UserRoleDetail from "./components/userrole/userroleDetail";
import BulkPurchasePage from "./components/common/BulkPurchase";

import Subscription from "./components/subscription/Subscription";
import SubscriptionDetail from "./components/subscription/SubscriptionDetail";
import Permission from "./components/Permission/permission";
import { TimeZoneProvider } from "./contexts/TimeZoneContext";
import { UserProvider, useUser } from "./contexts/UserContext";
import { BookSubmissionProvider } from "./contexts/BookSubmissionContext";
import Plan from "./components/plan/Plan";
import PlanDetail from "./components/plan/PlanDetail";
import Publisher from "./components/Publisher/Publisher";
import PublisherDetail from "./components/Publisher/PublisherDetail";
import { AuthProvider } from "./contexts/authwrapper";
import { BranchProvider } from "./contexts/BranchContext";
import Loader from "./components/common/Loader";
import BookInventoryReport from "./components/reports/BookInventoryReport";
import ReportsList from "./components/reports/ReportList";
import PermissionDenied from "./components/common/PermissionDenied";
import BookPopularityReport from "./components/reports/BookPopularityReport";
import Shelf from "./components/shelf/shelf";
import ShelfDetail from "./components/shelf/shelfDetail";
import GradeSectionDetail from "./components/GradeSection/gradesectionDetail";
import GradeSection from "./components/GradeSection/gradesection";
import BookUnborrowedReport from "./components/reports/BookUnborrowedReport";
import BookOverDueReport from "./components/reports/BookOverDueReport";
import Branch from "./components/branches/branch"
import BranchDetail from "./components/branches/branchDetail"
const ENDPOINT = "http://localhost:3003";

function AppContent() {
  const { userInfo, isLoading, permissions } = useUser();

  console.log("App permissions:", permissions);



  const getPermissionForModule = (moduleName) => {
    console.log("Getting permissions for module:", moduleName);
    return permissions ? permissions.find(p => p && p.moduleName === moduleName) || {} : {};
  };


  const hasAnyViewPermission = () => {
    console.log("Checking view permissions in:", permissions);
    if (!permissions || permissions.length === 0) return false;
    return permissions.some(p =>
      p && (p.allowView === true || p.can_view === true || p.view === true || p.has_access === true)
    );
  };

  console.log("Has any view permission:", hasAnyViewPermission());

  const [connectedSocket, setConnectedSocket] = useState();
  const [deviceId] = useState(() => {
    let existingId = sessionStorage.getItem("deviceId");
    if (!existingId) {
      existingId = uuidv4();
      sessionStorage.setItem("deviceId", existingId);
    }
    return existingId;
  });

  useEffect(() => {
    if (userInfo) {
      const socket = io(ENDPOINT, {
        path: "/ibs/socket.io",
        transports: ["websocket"],
        reconnection: true,
      });

      socket.on("connect", () => {
        socket.emit("setup", {
          ...userInfo,
          deviceId,
        });
        setConnectedSocket(socket);
      });

      socket.on("permissions_updated", (data) => {
        console.log("Permissions updated notification received:", data);
        window.dispatchEvent(new Event("permissionsUpdated"));
      });

      return () => {
        if (connectedSocket) {
          connectedSocket.disconnect();
        }
      };
    }
  }, [userInfo, deviceId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }


  if (!userInfo) {
    return (
      <>
        <ToastManager />
        <div className="app-watermark">
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Login />} />
            </Routes>
          </Router>
        </div>
      </>
    );
  }

  return (
    <TimeZoneProvider>
      <BookSubmissionProvider>
        <BranchProvider>
          <AuthProvider>
            <ToastManager />
            <Router >
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Main socket={connectedSocket} />}>
                  <Route
                    index
                    element={
                      hasAnyViewPermission() ? (
                        <Dashboard />
                      ) : (
                        <>
                          <div style={{ opacity: 0.5, pointerEvents: 'none', filter: 'grayscale(50%)' }}>
                            <Dashboard disabled={true} />
                          </div>
                          <PermissionDenied />
                        </>
                      )
                    }
                  />
                  <Route path="userroles" element={<UserRole permissions={getPermissionForModule("User Roles")} />} />
                  <Route path="user-role/:id" element={<UserRoleDetail permissions={getPermissionForModule("User Roles")} />} />
                  <Route path="/publisher" element={<Publisher permissions={getPermissionForModule("Publisher")} />} />
                  <Route path="/publisher/:id" element={<PublisherDetail permissions={getPermissionForModule("Publisher")} />} />
                  <Route path="author" element={<Author permissions={getPermissionForModule("Authors")} />} />
                  <Route path="author/:id" element={<AuthorDetail permissions={getPermissionForModule("Authors")} />} />
                  <Route path="plans" element={<Plan permissions={getPermissionForModule("Plan")} />} />
                  <Route path="plans/:id" element={<PlanDetail permissions={getPermissionForModule("Plan")} />} />
                  <Route path="book" element={<Books permissions={getPermissionForModule("Books")} />} />
                  <Route path="book/:id" element={<BookDetail permissions={getPermissionForModule("Books")} />} />
                  <Route path="classification" element={<Category permissions={getPermissionForModule("Categories")} />} />
                  <Route path="classification/:id" element={<CategoryDetail permissions={getPermissionForModule("Categories")} />} />
                  <Route path="vendor" element={<Vendor permissions={getPermissionForModule("Vendors")} />} />
                  <Route path="vendor/:id" element={<VendorDetail permissions={getPermissionForModule("Vendors")} />} />
                  <Route path="purchase" element={<Purchase permissions={getPermissionForModule("Purchases")} />} />
                  <Route path="purchase/:id" element={<PurchaseDetail permissions={getPermissionForModule("Purchases")} />} />
                  <Route path="/purchase/bulk" element={<BulkPurchasePage permissions={getPermissionForModule("Purchases")} />} />
                  {/* <Route path="subscriptions" element={<Subscription />} /> */}
                  <Route path="subscriptions/:id" element={<SubscriptionDetail permissions={getPermissionForModule("Plan")} />} />
                  <Route path="permissions" element={<Permission permissions={getPermissionForModule("Permission")} />} />
                  <Route path="user" element={<User permissions={getPermissionForModule("Users")} />} />
                  <Route path="user/:id" element={<UserDetail permissions={getPermissionForModule("Users")} />} />
                  <Route path="librarycard" element={<LibraryCard permissions={getPermissionForModule("Library Members")} />} />
                  <Route path="librarycard/:id" element={<LibraryCardDetail permissions={getPermissionForModule("Library Members")} />} />

                  <Route path="bookissue" element={<BookIssue permissions={getPermissionForModule("Book Issue")} />} />
                  {/* <Route path="bulkissued" element={<BulkIssue/>} /> */}
                  <Route path="bookreturn" element={<BookSubmit permissions={getPermissionForModule("Book Submissions")} />} />
                  <Route path="librarycardtype" element={<LibrarySettings permissions={getPermissionForModule("Settings")} />} />
                  <Route path="booksubmit" element={<BookSubmit permissions={getPermissionForModule("Book Submissions")} />} />
                  <Route path="myprofile" element={<EditProfile />} />
                  <Route path="Company" element={<Company permissions={getPermissionForModule("Company")} />} />
                  <Route path="/company/:id" element={<CompanyDetail permissions={getPermissionForModule("Company")} />} />
                  <Route path="reports/bookinventoryreport" element={<BookInventoryReport permissions={getPermissionForModule("Reports")} />} />

                  <Route path="/shelf" element={<Shelf permissions={getPermissionForModule("Shelf")} />} />
                  <Route path="/shelf/:id" element={<ShelfDetail permissions={getPermissionForModule("Shelf")} />} />
                  <Route path="/grade-sections" element={<GradeSection permissions={getPermissionForModule("Grade")} />} />
                  <Route path="/grade-sections/:id" element={<GradeSectionDetail permissions={getPermissionForModule("Grade")} />} />
                  <Route path="/branches" element={<Branch permissions={getPermissionForModule("Branches")} />} />
                  <Route path="/branches/:id" element={<BranchDetail permissions={getPermissionForModule("Branches")} />} />
                  <Route path="reports" element={<ReportsList permissions={getPermissionForModule("Reports")} />} />
                  <Route path="reports/bookpopularityreport" element={<BookPopularityReport />} />
                  <Route path="reports/inactivebooks" element={<BookUnborrowedReport permissions={getPermissionForModule("Reports")} />} />
                  <Route path="reports/book-borrowing" element={<BookOverDueReport permissions={getPermissionForModule("Reports")} />} />
                </Route>
              </Routes>
            </Router>
          </AuthProvider>
        </BranchProvider>
      </BookSubmissionProvider>
    </TimeZoneProvider>
  );
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;

