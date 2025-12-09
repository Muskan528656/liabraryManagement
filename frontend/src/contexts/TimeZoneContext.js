

import React, { createContext, useContext, useEffect, useState } from "react";
import DataApi from "../api/dataApi";
import { useUser } from "./UserContext";

const TimeZoneContext = createContext();

export const useTimeZone = () => {
  const context = useContext(TimeZoneContext);
  if (!context) {
    throw new Error("useTimeZone must be used within a TimeZoneProvider");
  }
  return context;
};

export const TimeZoneProvider = ({ children }) => {
  const [timeZone, setTimeZone] = useState("UTC");
  const [companyInfo, setCompanyInfo] = useState(null);
  const { userInfo } = useUser();

  const setCompanyTimeZone = (tz) => {
    console.log("setCompanyTimeZone called =", tz);
    setTimeZone(tz);
  };

  const fetchCompanyDetails = async () => {
    try {
      if (!userInfo?.companyid) {
        console.error("Company ID not found in user info");
        return;
      }

      const UserApi = new DataApi("user");
      const response = await UserApi.fetchById(userInfo.id);
      if (response?.data) {
        console.log("resposne ===", response.data?.time_zone)
        setTimeZone(response.data?.time_zone || "UTC");
        setCompanyInfo(response.data);
      }
    } catch (error) {
      console.error("Error fetching company by ID:", error);
    }
  };

  useEffect(() => {
    if (userInfo) {
      console.log("FETCH COMPANY");
      fetchCompanyDetails();
    }
  }, [userInfo]);

  return (
    <TimeZoneContext.Provider
      value={{ timeZone, fetchCompanyDetails, setCompanyTimeZone, companyInfo }}
    >
      {children}
    </TimeZoneContext.Provider>
  );
};
