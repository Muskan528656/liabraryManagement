import React from "react";
import ModuleDetail from "../common/ModuleDetail";
import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import moment from "moment";
const statusBadges = {
  active: { variant: "success", label: "Active" },
  inactive: { variant: "secondary", label: "Inactive" },
  suspended: { variant: "warning", label: "Suspended" },
};
const countryCodeOptions = COUNTRY_CODES.map((country) => ({
  value: country.country_code,
  label: `${country.country_code} - ${country.country}`,
}));

const VendorDetail = () => {
  const { timeZone } = useTimeZone();
  const fields = {
    title: "name",
    subtitle: "company_name",
    status: "status",
    details: [
      { key: "name", label: "Vendor Name", type: "text" },
      { key: "company_name", label: "Company Name", type: "text" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "gst_number", label: "GST Number", type: "text" },
      { key: "pan_number", label: "PAN Number", type: "text" },
      {
        key: "status",
        label: "Status",
        type: "toggle",
        badgeConfig: {
          true_label: "Active",
          false_label: "Inactive",
        },
      },

      {
        key: "country_code",
        label: "Country Code",
        type: "select", // Changed from "text" to "select"
        options: countryCodeOptions, // Added options
        render: (value) => {
          const cleanValue = value ? String(value).split(/[—\-]/)[0].trim() : value;
          const country = COUNTRY_CODES.find(c => c.country_code === cleanValue);
          return country ? `${country.country_code} (${country.country})` : value || 'N/A';
        },
      },
    ],
    address: [
      { key: "country", label: "Country", type: "text" },
      { key: "pincode", label: "Pincode", type: "text" },
      { key: "state", label: "State", type: "text" },
      { key: "address", label: "Address", type: "text" },
      { key: "city", label: "City", type: "text" },

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
      moduleLabel="Vendor Management"
      icon="fa-solid fa-store"
      fields={fields}
    />
  );
};

export default VendorDetail;

