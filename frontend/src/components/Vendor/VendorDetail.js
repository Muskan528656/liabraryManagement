import React from "react";
import ModuleDetail from "../common/ModuleDetail";

const statusBadges = {
  active: { variant: "success", label: "Active" },
  inactive: { variant: "secondary", label: "Inactive" },
  suspended: { variant: "warning", label: "Suspended" },
};

const VendorDetail = () => {
  const fields = {
    title: "name",
    subtitle: "company_name",
    status: "status",
    overview: [
      { key: "phone", label: "Phone", type: "text" },
      { key: "email", label: "Email", type: "email" },
      { key: "city", label: "City", type: "text" },
    ],
    details: [
      { key: "name", label: "Vendor Name", type: "text" },
      { key: "company_name", label: "Company Name", type: "text" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "gst_number", label: "GST Number", type: "text" },
      { key: "pan_number", label: "PAN Number", type: "text" },
      { key: "address", label: "Address", type: "text" },
      { key: "city", label: "City", type: "text" },
      { key: "state", label: "State", type: "text" },
      { key: "pincode", label: "Pincode", type: "text" },
      { key: "country", label: "Country", type: "text" },
      {
        key: "status",
        label: "Status",
        type: "badge",
        badgeConfig: statusBadges
      },
      { key: "created_at", label: "Created At", type: "datetime" },
      { key: "updated_at", label: "Updated At", type: "datetime" },
    ],
  };

  return (
    <ModuleDetail
      moduleName="vendor"
      moduleApi="purchasevendor"
      moduleLabel="Vendor"
      fields={fields}
    />
  );
};

export default VendorDetail;

