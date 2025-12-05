import React, { createContext, useContext, useEffect, useState } from 'react';
import DataApi from '../api/dataApi';

const TimeZoneContext = createContext();

export const useTimeZone = () => {
    const context = useContext(TimeZoneContext);
    if (!context) {
        throw new Error('useTimeZone must be used within a TimeZoneProvider');
    }
    return context;
};

export const TimeZoneProvider = ({ children }) => {
    const [timeZone, setTimeZone] = useState('UTC');

    function getCompanyIdFromToken() {
        const token = sessionStorage.getItem("token");
        if (!token) return null;

        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.companyid || payload.companyid || null;
    }

    const fetchCompany = async () => {
        try {
            const companyid = getCompanyIdFromToken();

            if (!companyid) {
                console.error("Company ID not found in token");
                return;
            }

            const companyApi = new DataApi("company");
            const response = await companyApi.fetchById(companyid);
            console.log(" response ", response);
            if (response.data) {
                setTimeZone(response.data.time_zone || 'UTC');
            }
        } catch (error) {
            console.error("Error fetching company by ID:", error);
        }
    };

    useEffect(() => {
        fetchCompany();
    }, []);

    return (
        <TimeZoneContext.Provider value={{ timeZone }}>
            {children}
        </TimeZoneContext.Provider>
    );
};
