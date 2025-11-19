import React from "react";
import ModuleDetail from "../common/ModuleDetail";

const VendorDetail = () => {
  const fields = {
    title: "name",
    subtitle: "company_name",
    status: "status",
    overview: [
      { key: "name", label: "Name", type: "text" },
      { key: "company_name", label: "Company Name", type: "text" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "tel" },
    ],
    details: [
      { key: "name", label: "Name", type: "text" },
      { key: "company_name", label: "Company Name", type: "text" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "tel" },
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
        badgeConfig: {
          active: "success",
          active_label: "Active",
          inactive: "secondary",
          inactive_label: "Inactive",
          suspended: "warning",
          suspended_label: "Suspended",
        },
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
      relatedModules={[]}
    />
  );
};

export default VendorDetail;

