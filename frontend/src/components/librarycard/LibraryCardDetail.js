import React from "react";
import ModuleDetail from "../common/ModuleDetail";

const LibraryCardDetail = () => {
  const fields = {
    title: "card_number",
    subtitle: "user_name",
    status: "is_active",
    overview: [
      { key: "card_number", label: "Card Number", type: "text" },
      { key: "user_name", label: "User Name", type: "text" },
      { key: "user_email", label: "Email", type: "text" },
      { key: "issue_date", label: "Issue Date", type: "date" },
      { key: "expiry_date", label: "Expiry Date", type: "date" },
    ],
    details: [
      { key: "card_number", label: "Card Number", type: "text" },
      { key: "user_name", label: "User Name", type: "text" },
      { key: "user_email", label: "Email", type: "text" },
      { key: "issue_date", label: "Issue Date", type: "date" },
      { key: "expiry_date", label: "Expiry Date", type: "date" },
      { key: "is_active", label: "Status", type: "badge" },
    ],
  };

  return (
    <ModuleDetail
      moduleName="librarycard"
      moduleApi="librarycard"
      moduleLabel="  Library Member"
      fields={fields}
      relatedModules={[]}
    />
  );
};

export default LibraryCardDetail;

