import React, { useState, useEffect } from "react";
import PubSub from "pubsub-js";
import CustomToast from "./CustomToast";

const ToastManager = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
 
    const savedToken = PubSub.subscribe("RECORD_SAVED_TOAST", (msg, data) => {
      addToast(data.message || "Record saved successfully", "success");
    });

    const errorToken = PubSub.subscribe("RECORD_ERROR_TOAST", (msg, data) => {
      addToast(data.message || "An error occurred", "error");
    });

    const warningToken = PubSub.subscribe("RECORD_WARNING_TOAST", (msg, data) => {
      addToast(data.message || "Warning", "warning");
    });

 
    return () => {
      PubSub.unsubscribe(savedToken);
      PubSub.unsubscribe(errorToken);
      PubSub.unsubscribe(warningToken);
    };
  }, []);

  const addToast = (message, type = "success") => {
    // Ensure message is always a string
    let safeMessage = message;
    if (typeof message === 'object' && message !== null) {
      // If it's an error object with specific keys, extract meaningful info
      if (message.message) {
        safeMessage = message.message;
      } else if (message.error) {
        safeMessage = message.error;
      } else if (message.name && message.code) {
        safeMessage = `${message.name}: ${message.code}`;
      } else {
        // Fallback: stringify the object
        safeMessage = JSON.stringify(message);
      }
    } else if (typeof message !== 'string') {
      safeMessage = String(message);
    }

    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message: safeMessage, type, show: true }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 10000 }}>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            marginBottom: index > 0 ? "10px" : "0",
          }}
        >
          <CustomToast
            show={toast.show}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
            duration={3000}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastManager;

