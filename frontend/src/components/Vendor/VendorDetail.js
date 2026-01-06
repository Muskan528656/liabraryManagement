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
      // { key: "is_active", label: "Active", type: "toggle" },
      {
        key: "status",
        label: "Status",
        type: "toggle",
        // badgeConfig: {
        //   true_label: "Active",
        //   false_label: "Inactive",
        // },
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

  //validation 
  // validationRules: (formData, allVendors, editingVendor) => {

  //   console.log("Validating formData:", formData);
  //   console.log("All vendors:", allVendors);
  //   console.log("Editing vendor:", editingVendor);

  //   const errors = [];
  //   if (!formData.name?.trim()) {
  //     errors.push("Name is required");
  //   }

  //   if (!formData.email?.trim()) {
  //     errors.push("Email is required");
  //   } else {
  //     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //     if (!emailRegex.test(formData.email)) {
  //       errors.push("Please enter a valid email address");
  //     }
  //   }

  //   if (!formData.phone?.trim()) {
  //     errors.push("Phone is required");
  //   } else {
  //     const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
  //     if (!phoneRegex.test(formData.phone)) {
  //       errors.push("Please enter a valid phone number");
  //     }
  //   }

  //   const duplicateName = allVendors.find(
  //     vendor => vendor.name?.toLowerCase() === formData.name?.toLowerCase() &&
  //       vendor.id !== editingVendor?.id
  //   );
  //   if (duplicateName) {
  //     errors.push("Vendor with this name already exists");
  //   }

  //   const duplicateEmail = allVendors.find(
  //     vendor => vendor.email?.toLowerCase() === formData.email?.toLowerCase() &&
  //       vendor.id !== editingVendor?.id
  //   );
  //   if (duplicateEmail) {
  //     errors.push("Vendor with this email already exists");
  //   }

  //   return errors;
  // },

  return (
    <ModuleDetail
      moduleName="vendor"
      moduleApi="vendor"
      moduleLabel="Vendor"
      icon="fa-solid fa-store"
      fields={fields}
    />
  );
};

export default VendorDetail;

