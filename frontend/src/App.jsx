
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
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
import AutoConfig from "./components/autoconfig/AutoConfig";
import AutoConfigDetail from "./components/autoconfig/AutoConfigDetail";
import Subscription from "./components/subscription/Subscription";
import SubscriptionDetail from "./components/subscription/SubscriptionDetail";
import Permission from "./components/Permission/permission";
import { TimeZoneProvider } from "./contexts/TimeZoneContext";
import { UserProvider, useUser } from "./contexts/UserContext";

const ENDPOINT = "https://admin.watconnect.com" || "http://localhost:3003";

function AppContent() {
  const { userInfo, isLoading } = useUser();
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
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Login />} />
          </Routes>
        </Router>
      </>
    );
  }

  return (
    <TimeZoneProvider>
      <ToastManager />
      <Router>
        <Routes>
          {/* Login separate */}
          <Route path="/login" element={<Login />} />

          {/* All other pages under Main layout */}
          <Route path="/" element={<Main socket={connectedSocket} />}>
            <Route index element={<Dashboard />} />

            <Route path="userroles" element={<UserRole />} />
            <Route path="user-role/:id" element={<UserRoleDetail />} />
            {/* <Route path="autoconfig" element={<AutoConfig />} /> */}
            {/* <Route path="auto-config/:id" element={<AutoConfigDetail />} /> */}
            <Route path="author" element={<Author />} />
            <Route path="author/:id" element={<AuthorDetail />} />
            <Route path="book" element={<Books />} />
            <Route path="book/:id" element={<BookDetail />} />
            <Route path="category" element={<Category />} />
            <Route path="category/:id" element={<CategoryDetail />} />
            <Route path="vendor" element={<Vendor />} />
            <Route path="vendor/:id" element={<VendorDetail />} />
            <Route path="purchase" element={<Purchase />} />
            <Route path="purchase/:id" element={<PurchaseDetail />} />
            <Route path="/purchase/bulk" element={<BulkPurchasePage />} />
            <Route path="subscriptions" element={<Subscription />} />
            <Route path="subscriptions/:id" element={<SubscriptionDetail />} />
            <Route path="permissions" element={<Permission />} />
            {/* <Route path="permissions/:id" element={<PermissionDetail />} /> */}
            <Route path="user" element={<User />} />
            <Route path="user/:id" element={<UserDetail />} />
            <Route path="librarycard" element={<LibraryCard />} />
            <Route path="librarycard/:id" element={<LibraryCardDetail />} />
            <Route path="bookissue" element={<BookIssue />} />
            <Route path="bookreturn" element={<BookSubmit />} />
            <Route path="librarysettings" element={<LibrarySettings />} />
            {/* <Route path="requestbook" element={<RequestBook />} /> */}
            <Route path="librarycardtype" element={<LibrarySettings />} />
            <Route path="booksubmit" element={<BookSubmit />} />

            <Route path="myprofile" element={<EditProfile />} />
            <Route path="Company" element={<Company />} />
            <Route path="/company/:id" element={<CompanyDetail />} />

            {/* {bluk issued component route added here} */}
            <Route path="bulkissued" element={<BulkIssue />} />
          </Route>
        </Routes>
      </Router>
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

