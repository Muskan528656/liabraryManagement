import React, { useState, useEffect, useMemo } from "react";
import ModuleDetail from "../common/ModuleDetail";
import DataApi from "../../api/dataApi";
import { COUNTRY_TIMEZONE } from "../../constants/COUNTRY_TIMEZONE";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import { convertToUserTimezone } from "../../utils/convertTimeZone";

const UserDetail = () => {
  
  const [isLoading, setIsLoading] = useState(true);
  const {timeZone} = useTimeZone();

  console.log("0439534",timeZone);

  // State for current country to compute options
  const [currentCountry, setCurrentCountry] = useState(null);

  // Get Company Defaults
  const { companyInfo } = useTimeZone();

  // Compute options based on current country
  const currencyOptions = useMemo(() => {
    if (!currentCountry) return [];
    const countryData = COUNTRY_TIMEZONE.find(ct => ct.countryName === currentCountry);
    if (countryData) {
      return [{
        value: countryData.currency.code,
        label: `${countryData.currency.code} - ${countryData.currency.name}`
      }];
    }
    return [];
  }, [currentCountry]);

  const timeZoneOptions = useMemo(() => {
    if (!currentCountry) return [];
    const countryData = COUNTRY_TIMEZONE.find(ct => ct.countryName === currentCountry);
    if (countryData) {
      return countryData.timezones.map(tz => ({
        value: tz.zoneName,
        label: `${tz.zoneName} (${tz.gmtOffset})`
      }));
    }
    return [];
  }, [currentCountry]);

  const [externalData, setExternalData] = useState({
    userRoles: [],
    companies: [],
  });

  useEffect(() => {
    const fetchExternalData = async () => {
      try {
        const roleApi = new DataApi("user-role");
        const companyApi = new DataApi("company");

        const [roleRes, companyRes] = await Promise.all([
          roleApi.fetchAll(),
          companyApi.fetchAll(),
        ]);

        // Handle various API response structures
        const userRoles = roleRes?.data?.data || roleRes?.data || [];
        const companies = companyRes?.data?.data || companyRes?.data || [];

        setExternalData({
          userRoles: Array.isArray(userRoles) ? userRoles : [],
          companies: Array.isArray(companies) ? companies : [],
        });
      } catch (error) {
        console.error("Error fetching external data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExternalData();
  }, []);

  // --- Dynamic Handler for Country Change ---
  const handleCountryChange = (countryName, formValues, setFormValues) => {
    const countryData = COUNTRY_TIMEZONE.find(ct => ct.countryName === countryName);

    if (countryData) {
      // Set current country to trigger options recomputation
      setCurrentCountry(countryName);

      // Update Form Values
      if (setFormValues) {
        setFormValues({
          ...formValues,
          country: countryName,
          country_code: countryData.phoneCode,
          currency: countryData.currency.code,
          time_zone: countryData.timezones[0]?.zoneName || ""
        });
      }
    }
  };

  const fields = {
    title: "firstname",
    subtitle: "email",
    status: "isactive",
    
    // --- LOAD HANDLER ---
    onLoad: (record, setFormValues) => {
        let countryToUse = record?.country;

        if (!countryToUse && companyInfo?.country) {
            countryToUse = companyInfo.country;
            if(setFormValues) {
                 const cData = COUNTRY_TIMEZONE.find(c => c.countryName === countryToUse);
                 if(cData) {
                    setFormValues({
                        ...record,
                        country: cData.countryName,
                        country_code: cData.phoneCode,
                        currency: cData.currency.code,
                        time_zone: cData.timezones.some(t => t.zoneName === companyInfo.time_zone)
                            ? companyInfo.time_zone
                            : cData.timezones[0].zoneName
                    });
                 }
            }
        }

        if (countryToUse) {
            setCurrentCountry(countryToUse);
        }
    },

    // --- LOAD HANDLER ---
    onLoad: (record, setFormValues) => {
      let countryToUse = record?.country;

      if (!countryToUse && companyInfo?.country) {
        countryToUse = companyInfo.country;
        if (setFormValues) {
          const cData = COUNTRY_TIMEZONE.find(c => c.countryName === countryToUse);
          if (cData) {
            setFormValues({
              ...record,
              country: cData.countryName,
              country_code: cData.phoneCode,
              currency: cData.currency.code,
              time_zone: cData.timezones.some(t => t.zoneName === companyInfo.time_zone)
                ? companyInfo.time_zone
                : cData.timezones[0].zoneName
            });
          }
        }
      }

      if (countryToUse) {
        setCurrentCountry(countryToUse);
      }
    },

    details: [
      { key: "firstname", label: "First Name", type: "text" },
      { key: "lastname", label: "Last Name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      {
        key: "country",
        label: "Country",
        type: "select",
        options: COUNTRY_TIMEZONE.map(c => ({ 
            value: c.countryName, 
            label: `${c.flag} ${c.countryName}` 
        })),
        onChange: handleCountryChange
      },
      {
        key: "country_code",
        label: "Country Code",
        type: "text",
        readOnly: true
      },
      { key: "phone", label: "Phone", type: "text" },
      {
        key: "currency",
        label: "Currency",
        type: "select",
        options: currencyOptions,
        readOnly: true
      },
      {
        key: "time_zone",
        label: "Time Zone",
        type: "select",
        options: timeZoneOptions,
        readOnly: false
      },
      {
        key: "userrole",
        label: "User Role",
        type: "select",
        // Map options for the edit dropdown
        options: externalData.userRoles.map(r => ({ value: r.id, label: r.role_name })),
        // Custom Render to ensure Name is shown in View Mode
        render: (value, data) => {
             if (!externalData.userRoles || externalData.userRoles.length === 0) {
               return <span className="text-muted">Loading...</span>;
             }
             // Handle both string and number ID comparison
             const role = externalData.userRoles.find(r => 
                 String(r.id) === String(value) || String(r._id) === String(value)
             );
             return role ? role.role_name : (value || <span className="text-muted">N/A</span>);
        }
      },
      {
        key: "isactive",
        label: "Status",
        type: "toggle",
        options: [
          { value: true, label: "Active" },
          { value: false, label: "Inactive" },
        ],
      },
    ],
    other: [
      // The type "text" here combined with the key containing "byid" 
      // will trigger ModuleDetail to fetch the user name automatically.
      { key: "createdbyid", label: "Created By", type: "text" },
      { key: "createddate", label: "Created Date", type: "date",
        render: (value) => convertToUserTimezone(value, timeZone)
       },
    ],
  };

  const lookupNavigation = {
    userrole: { path: "user-role", idField: "id", labelField: "role_name" },
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <ModuleDetail
      moduleName="user"
      moduleApi="user"
      moduleLabel="User"
      icon="fa-solid fa-users"
      fields={fields}
      lookupNavigation={lookupNavigation}
      externalData={externalData}
      timeZone={timeZone}
    />
  );
};

export default UserDetail;