import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";

import Footer from "./Footer";


import UniversalBarcodeScanner from "../common/UniversalBarcodeScanner";

export default function Main({ socket }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb" }}>

      <div
        style={{
          flexGrow: 1,
          marginLeft: "0",
          transition: "margin-left 0.3s ease",
          minHeight: "100vh",
          width: "100%",
          position: "relative",
        }}
      >
        <Header open={sidebarOpen} handleDrawerOpen={toggleSidebar} socket={socket} />
        <UniversalBarcodeScanner />
        <main
          style={{

            marginTop: "116px",
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
