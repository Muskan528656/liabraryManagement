import React from "react";
import ModuleDetail from "../common/ModuleDetail";
// import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import { useTimeZone } from "../../contexts/TimeZoneContext";

import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";
import City_State from "../../constants/CityState.json";

const statusBadges = {
  active: { variant: "success", label: "Active" },
  inactive: { variant: "secondary", label: "Inactive" },
  suspended: { variant: "warning", label: "Suspended" },
};


// dropdown---------------------
const countryCodeOptions = COUNTRY_CODES.map((country) => ({
  value: country.country_code,
  label: `${country.country_code} - ${country.country}`,
}));

const VendorDetail = ({ permissions }) => {
  console.log("VendorDetail permissions:", permissions);
  const { timeZone } = useTimeZone();
  const fields = {
    title: "name",
    subtitle: "company_name",
    details: [
      { key: "name", label: "Vendor Name", type: "text", required: true },
      { key: "company_name", label: "Company Name", type: "text" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "gst_number", label: "GST Number", type: "text" },
      { key: "pan_number", label: "PAN Number", type: "text" },
      // { key: "is_active", label: "Active", type: "toggle" },
      {
        key: "status",
        label: "Status",
        type: "toggle",
      },

      {
        key: "country_code",
        label: "Country Code",
        type: "select",
        options: countryCodeOptions,
        render: (value) => {
          const cleanValue = value ? String(value).split(/[—\-]/)[0].trim() : value;
          const country = COUNTRY_CODES.find(c => c.country_code === cleanValue);
          return country ? `${country.country_code} (${country.country})` : value || 'N/A';
        },
      },
    ],
    address: [
      {
        key: "country",
        label: "Country",
        type: "select",
        options: countryName,
      
      },
      {
        key: "pincode",
        label: "Pincode",
        type: "text"
      },
      {
        key: "state",
        label: "State",
        type: "select",
        options: stateName,
      },
      {
        key: "address",
        label: "Address",
        type: "text"
      },
      {
      
         key: "city",
        label: "City",
        type: "select",
        options: cityName,
        // options: City_State.map(item => ({
        //   value: item.name,
        //   label: `${item.name} `
        // })),
      },

    ],
    other: [
      { key: "createdbyid", label: "Created By", type: "text" },
      { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },
      { key: "createddate", label: "Created Date", type: "date", render: (value) => convertToUserTimezone(value, timeZone) },
      { key: "lastmodifieddate", label: "Last Modified Date", type: "date", render: (value) => convertToUserTimezone(value, timeZone) },
    ],
  };



  return (
    <ModuleDetail
      moduleName="vendor"
      moduleApi="vendor"
      moduleLabel="Vendor"
      icon="fa-solid fa-store"
      permissions={permissions}
      fields={fields}
    />
  );
};

export default VendorDetail;

