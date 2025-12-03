import React, { useEffect, useState } from "react";
import "./CustomToast.css";

const CustomToast = ({ show, message, type = "success", onClose, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsExiting(false);

 
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300); // Match animation duration
  };

  if (!isVisible && !show) return null;

  const getToastStyles = () => {
    switch (type) {
      case "error":
        return {
          backgroundColor: "#DC3545", // Red
          icon: "fa-circle-exclamation",
          textColor: "#FFFFFF", // White text
        };
      case "warning":
        return {
          backgroundColor: "#FF9800", // Orange
          icon: "fa-triangle-exclamation",
          textColor: "#FFFFFF", // White text
        };
      case "success":
      default:
        return {
          backgroundColor: "#C8E6C9", // Very Light Green
          icon: "fa-circle-check",
          textColor: "#2E7D32", // Dark green for text contrast
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div
      className={`custom-toast ${isExiting ? "toast-exit" : "toast-enter"}`}
      style={{
        backgroundColor: styles.backgroundColor,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      }}
    >
      <div className="toast-content">
        <div className="toast-icon-wrapper">
          <i className={`fa-solid ${styles.icon} toast-icon`} style={{ color: styles.textColor || "#FFFFFF" }}></i>
        </div>
        <div className="toast-message" style={{ color: styles.textColor || "#FFFFFF" }}>{message}</div>
        <div className="toast-separator" style={{ backgroundColor: styles.textColor ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.3)" }}></div>
        <button className="toast-close" onClick={handleClose} style={{ color: styles.textColor || "#FFFFFF" }}>
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  );
};

export default CustomToast;

