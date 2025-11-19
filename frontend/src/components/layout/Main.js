import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
// import Sidebar from "./Sidebar"; // Commented out - modules now in header
import Footer from "./Footer";
// import Libr
// aryWorkflowGuide from "../common/LibraryWorkflowGuide";
import UniversalBarcodeScanner from "../common/UniversalBarcodeScanner";

export default function Main({ socket }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb" }}>
      {/* Sidebar - Commented out as per requirement */}
      {/* <Sidebar open={sidebarOpen} handleDrawerClose={() => setSidebarOpen(false)} /> */}
      <div
        style={{
          flexGrow: 1,
          marginLeft: "0", // No sidebar margin
          transition: "margin-left 0.3s ease",
          minHeight: "100vh",
          width: "100%", // Full width without sidebar
          position: "relative",
        }}
      >
        <Header open={sidebarOpen} handleDrawerOpen={toggleSidebar} socket={socket} />
        <UniversalBarcodeScanner />
        <main
          style={{
            padding: "1rem 1.5rem",
            marginTop: "140px",
            paddingBottom: "80px",
            overflowY: "auto",
            minHeight: "calc(100vh - 140px)",
            background: "#f9fafb",
          }}
        >
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
