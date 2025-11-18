import React from "react";
import ModuleDetail from "../common/ModuleDetail";

const UserDetail = () => {
  const fields = {
    title: "firstname",
    subtitle: "email",
    status: "isactive",
    overview: [
      { key: "firstname", label: "First Name", type: "text" },
      { key: "lastname", label: "Last Name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
    ],
    details: [
      { key: "firstname", label: "First Name", type: "text" },
      { key: "lastname", label: "Last Name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "isactive", label: "Status", type: "badge" },
    ],
  };

  return (
    <ModuleDetail
      moduleName="user"
      moduleApi="user"
      moduleLabel="User"
      fields={fields}
      relatedModules={[]}
    />
  );
};

export default UserDetail;

