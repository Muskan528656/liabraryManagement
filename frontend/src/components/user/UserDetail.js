import React, { useState, useEffect, useMemo } from "react";
import ModuleDetail from "../common/ModuleDetail";
import DataApi from "../../api/dataApi";
import { COUNTRY_TIMEZONE } from "../../constants/COUNTRY_TIMEZONE";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import { convertToUserTimezone } from "../../utils/convertTimeZone";

const UserDetail = ({ permissions }) => {

  const [isLoading, setIsLoading] = useState(true);
  const { timeZone } = useTimeZone();

  const [currentCountry, setCurrentCountry] = useState(null);
  const { companyInfo } = useTimeZone();
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

  const library_member_type = ["Boys", "Girls", "Other"];

  useEffect(() => {
    const fetchExternalData = async () => {
      try {
        const roleApi = new DataApi("user-role");
        const companyApi = new DataApi("company");
        const [roleRes, companyRes] = await Promise.all([
          roleApi.fetchAll(),
          companyApi.fetchAll(),
        ]);
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

  const handleCountryChange = (countryName, formValues, setFormValues) => {
    const countryData = COUNTRY_TIMEZONE.find(ct => ct.countryName === countryName);

    if (countryData) {

      setCurrentCountry(countryName);


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
      { key: "firstname", label: "First Name", type: "text" , required:true, },
      { key: "lastname", label: "Last Name", type: "text", required:true, },
      { key: "email", label: "Email", type: "text",  required:true, },
      {
        key: "country",
        label: "Country",
        type: "select",
        options: COUNTRY_TIMEZONE.map(c => ({
          value: c.countryName,
          label: `${c.flag} ${c.countryName}`
        })),
        onChange: handleCountryChange,
        render: (value) => {
          if (value) {
            const country = COUNTRY_TIMEZONE.find(c => c.countryName === value);
            return country ? `${country.flag} ${country.countryName}` : value;
          }
          if (companyInfo?.country) {
            const defaultCountry = COUNTRY_TIMEZONE.find(c =>
              c.countryName.toLowerCase() === companyInfo.country.toLowerCase()
            );
            return defaultCountry ? `${defaultCountry.flag} ${defaultCountry.countryName}` : companyInfo.country;
          }
          return "N/A";
        }
      },
      {
        key: "country_code",
        label: "Country Code",
        type: "text",
        readOnly: true,
        render: (value) => value || (companyInfo?.country_code ? companyInfo.country_code : "N/A")
      },
      { key: "phone", label: "Phone", type: "text", maxLength:"10", required:true },
      {
        key: "currency",
        label: "Currency",
        type: "text",
        options: currencyOptions,
        readOnly: true,
        disabled: true, 
        render: (value) => {
          if (value) return value;
          if (companyInfo?.currency) return companyInfo.currency;
          return "N/A";
        }
      },

      {
        key: "time_zone",
        label: "Time Zone",
        type: "text",
        options: timeZoneOptions,
        readOnly: true,
        disabled: true, 
        render: (value) => {
          if (value) {
            const country = COUNTRY_TIMEZONE.find(c => c.timezones.some(t => t.zoneName === value));
            const tz = country?.timezones.find(t => t.zoneName === value);
            return tz ? `${tz.zoneName} (${tz.gmtOffset})` : value;
          }
          if (companyInfo?.time_zone) {
            const country = COUNTRY_TIMEZONE.find(c => c.timezones.some(t => t.zoneName === companyInfo.time_zone));
            const tz = country?.timezones.find(t => t.zoneName === companyInfo.time_zone);
            return tz ? `${tz.zoneName} (${tz.gmtOffset})` : companyInfo.time_zone;
          }
          return "N/A";
        }
      },
      {
        key: "userrole",
        label: "User Role",
        type: "select",
        readOnly: true,
        required:true,

        options: externalData.userRoles.map(r => ({ value: r.id, label: r.role_name })),

        render: (value, data) => {
          if (!externalData.userRoles || externalData.userRoles.length === 0) {
            return "Loading...";
          }

          const role = externalData.userRoles.find(r =>
            String(r.id) === String(value) || String(r._id) === String(value)
          );
          return role ? role.role_name : (value || "N/A");
        }
      },
      {
        key: "library_member_type",
        label: "Gender",
        type: "select",
        required: false,
        options: library_member_type.map((item) => ({ label: item, value: item })),
        colSize: 6,
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

      { key: "createdbyid", label: "Created By", type: "text" },
      {
        key: "createddate", label: "Created Date", type: "date",
        render: (value) => convertToUserTimezone(value, timeZone)
      },
    ],


    validationRules: (formData, allUsers = [], editingUser) => {
        const errors = [];

        if (!formData.firstname?.trim()) errors.push("First name is required");
        if (!formData.lastname?.trim()) errors.push("Last name is required");
        if (!formData.email?.trim()) errors.push("Email is required");


        if (!formData.country) errors.push("Country is required");
        if (!formData.userrole) errors.push("Role is required");

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
          errors.push("Invalid email format");
        }

        // Phone validation (10 digit)
        if (formData.phone) {
          const phoneRegex = /^[0-9]{10}$/;
          if (!phoneRegex.test(formData.phone)) {
            errors.push("Phone number must be exactly 10 digits");
          }
        }

        //  Duplicate email check (safe handling)
        if (Array.isArray(allUsers)) {
          const duplicate = allUsers.find(
            user =>
              user.email === formData.email &&
              user.id !== editingUser?.id
          );
          if (duplicate) errors.push("Email already exists");
        }

        return errors;
      }

  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <ModuleDetail
      moduleName="user"
      moduleApi="user"
      moduleLabel="User"
      icon="fa-solid fa-users"
      fields={fields}
      validationRules={fields.validationRules}
      externalData={externalData}
      timeZone={timeZone}
      permissions={permissions || {}}
      onTempDataChange={(tempData) => {
        if (tempData?.country) {
          setCurrentCountry(tempData.country);
        }
      }}
    />
  );
};

export default UserDetail;