import "./App.css";
// import "./Sidebar.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import React, { useEffect, useState } from "react";
import { UserAdd, UserList, UserTracking, UserView } from "./components/user";
import jwt_decode from "jwt-decode";
import io from "socket.io-client";
import Main from "./components/layout/Main";
import EditProfile from "./components/EditProfile";
import Books from "./components/books/Books";
import BookDetail from "./components/books/BookDetail";
import Author from "./components/author/Author";
import AuthorDetail from "./components/author/AuthorDetail";
import Category from "./components/category/Category";
import CategoryDetail from "./components/category/CategoryDetail";
import PurchaseVendor from "./components/Vendor";
import VendorDetail from "./components/VendorDetail";
import Purchase from "./components/purchase/Purchase";
import PurchaseDetail from "./components/purchase/PurchaseDetail";
import User from "./components/user/User";
import UserDetail from "./components/user/UserDetail";
import LibraryCard from "./components/librarycard/LibraryCard";
import LibraryCardDetail from "./components/librarycard/LibraryCardDetail";
import BookIssue from "./components/bookissue/BookIssue";
import ReturnBook from "./components/bookissue/ReturnBook";
import LibrarySettings from "./components/librarysettings/LibrarySettings";
// import MemberPortal from "./components/memberportal/MemberPortal";
import RequestBook from "./components/bookrequest/RequestBook";
import ToastManager from "./components/common/ToastManager";
import { v4 as uuidv4 } from "uuid";
import Company from "./components/Company/Company";
import CompanyDetail from "./components/Company/CompanyDetail";
// import Settings from "./components/librarycardtype/LibraryCardType";
const ENDPOINT = "https://admin.watconnect.com" || "http://localhost:3003";
function App() {
  const [userInfo, setUserInfo] = useState(null); // null = not yet loaded
  const [connectedSocket, setConnectedSocket] = useState();
  const [deviceId, setDeviceId] = useState(() => {
    let existingId = sessionStorage.getItem("deviceId");
    if (!existingId) {
      existingId = uuidv4();
      sessionStorage.setItem("deviceId", existingId);
    }
    return existingId;
  });
  useEffect(() => {
    try {
      const token = sessionStorage.getItem("token");
      if (token) {
        let user;
        try {
          user = jwt_decode(token);
          setUserInfo(user);
        } catch (decodeError) {
          console.error("Invalid token:", decodeError);
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("r-t");
          setUserInfo(false);
          return;
        }

        let socket = io(ENDPOINT, {
          path: "/ibs/socket.io",
          transports: ["websocket"],
          reconnection: true,

        });

        socket.on("connect", () => {
          socket.emit("setup", {
            ...user,
            deviceId,
          });

          setConnectedSocket(socket);
        });

        // socket.on("connected", () => {
        // });

        // socket.on("receivedwhatsappmessage", (item) => {

        // });

        // socket.on("disconnect", (reason) => {
        //   // console.log('Socket disconnected:', reason);
        // });

        // socket.on("connect_error", (err) => {
        //   // console.error('Connection error:', err);
        // });

        setConnectedSocket(socket);

        return () => {
          if (connectedSocket) {
            connectedSocket.disconnect();
          }
        };
      } else {
        setUserInfo(false);


      }
    } catch (error) {
      setUserInfo(false);

    }
  }, [sessionStorage.getItem("token")]);

  if (userInfo === null) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <ToastManager />
      <Router>
        <Routes>
          {/* Login separate */}
          <Route path="/login" element={<Login />} />

          {/* All other pages under Main layout */}
          <Route path="/" element={<Main socket={connectedSocket} />}>
            <Route index element={<Home userInfo={userInfo} />} />
            <Route path="author" element={<Author />} />
            <Route path="author/:id" element={<AuthorDetail />} />
            <Route path="books" element={<Books />} />
            <Route path="books/:id" element={<BookDetail />} />
            <Route path="category" element={<Category />} />
            <Route path="category/:id" element={<CategoryDetail />} />
            <Route path="vendor" element={<PurchaseVendor />} />
            <Route path="vendor/:id" element={<VendorDetail />} />
            <Route path="purchase" element={<Purchase />} />
            <Route path="purchase/:id" element={<PurchaseDetail />} />
            <Route path="user" element={<User />} />
            <Route path="user/:id" element={<UserDetail />} />
            <Route path="librarycard" element={<LibraryCard />} />
            <Route path="librarycard/:id" element={<LibraryCardDetail />} />
            <Route path="bookissue" element={<BookIssue />} />
            <Route path="bookreturn" element={<ReturnBook />} />
            <Route path="librarysettings" element={<LibrarySettings />} />
            <Route path="requestbook" element={<RequestBook />} />
            <Route path="librarycardtype" element={<LibrarySettings />} />
            <Route path="booksubmit" element={<ReturnBook />} />
            <Route path="users" element={<UserList />} />
            <Route path="users/e" element={<UserAdd />} />
            <Route path="users/:id/e" element={<UserAdd />} />
            <Route path="users/:id" element={<UserView />} />
            <Route path="usertracking" element={<UserTracking />} />
            <Route path="myprofile" element={<EditProfile />} />
            <Route path="Company" element={<Company />} />
            <Route path="/company/:id" element={<CompanyDetail />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
