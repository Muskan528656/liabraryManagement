import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import PubSub from "pubsub-js";
import * as constants from "../constants/CONSTANT";
import helper from "../components/common/helper";

const BookSubmissionContext = createContext();

export const useBookSubmission = () => {
  const context = useContext(BookSubmissionContext);
  // console.log("context=>", context);
  if (!context) {
    throw new Error("useBookSubmission must be used within a BookSubmissionProvider");
  }
  return context;
};

export const BookSubmissionProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoadingNotifications(true);
      const response = await helper.fetchWithAuth(
        `${constants.API_BASE_URL}/api/notifications/due-tomorrow`,
        "GET"
      );
      const result = await response.json();
      console.log("result=>", result)
      if (result.success) {
        console.log("unreadcount");
        setNotifications(result.notifications || []);
        setUnreadCount(result.unread_count || 0);
      } else {
        console.error("Error fetching notifications:", result.message);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, []);
  const updateNotificationsAfterSubmission = useCallback(async (submissionData) => {
    try {

      const submitDate = new Date();
      const dueDate = new Date(submissionData.due_date);


      const tomorrow = new Date(submitDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isDueTomorrow = dueDate.toDateString() === tomorrow.toDateString();

      if (isDueTomorrow) {

        await fetchNotifications();


        PubSub.publish("NOTIFICATIONS_UPDATED", {
          type: "book_submitted_due_tomorrow",
          submissionData
        });
      }
    } catch (error) {
      console.error("Error updating notifications after submission:", error);
    }
  }, [fetchNotifications]);


  const updateNotificationsFromAPI = useCallback((apiNotifications) => {
    setNotifications(apiNotifications);
    const unread = apiNotifications.filter(n => !n.is_read).length;
    setUnreadCount(unread);
  }, []);

  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const handleNotificationClick = useCallback((notification) => {
    if (notification.type === "due_reminder") {
      markNotificationAsRead(notification.id);
      return "/booksubmit";
    }
    return null;
  }, [markNotificationAsRead]);

  useEffect(() => {
    fetchNotifications();

    const refreshToken = PubSub.subscribe("REFRESH_NOTIFICATIONS", () => {
      fetchNotifications();
    });

    const newNotificationToken = PubSub.subscribe("NOTIFICATIONS_UPDATED", (msg, data) => {
      if (data.type === "new_notification") {

        setUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      PubSub.unsubscribe(refreshToken);
      PubSub.unsubscribe(newNotificationToken);
    };
  }, [fetchNotifications]);

  const value = {
    notifications,
    unreadCount,
    isLoadingNotifications,
    fetchNotifications,
    updateNotificationsAfterSubmission,
    updateNotificationsFromAPI,
    markNotificationAsRead,
    handleNotificationClick
  };

  return (
    <BookSubmissionContext.Provider value={value}>
      {children}
    </BookSubmissionContext.Provider>
  );
};
