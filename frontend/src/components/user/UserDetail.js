import React from "react";
import ModuleDetail from "../common/ModuleDetail";

const UserDetail = () => {
  const fields = {
    title: "firstname",
    subtitle: "email",
    status: "status",
    // overview: [
    //   { key: "firstname", label: "First Name", type: "text" },
    //   { key: "lastname", label: "Last Name", type: "text" },
    //   { key: "email", label: "Email", type: "text" },
    //   { key: "phone", label: "Phone", type: "text" },
    // ],
    details: [
      { key: "firstname", label: "First Name", type: "text" },
      { key: "lastname", label: "Last Name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { 
        key: "userrole", 
        label: "Role", 
        type: "select", 
        options: "user-role",
        displayKey: "role_name"
      },
      { key: "status", label: "Status", type: "badge" },
    ],
    other: [
      { key: "createdbyid", label: "Created By", type: "text" },
      { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },
      { key: "createddate", label: "Created Date", type: "date" },
      { key: "lastmodifieddate", label: "Last Modified Date", type: "date" },

    ],
  };

  return (
    <ModuleDetail
      moduleName="user"
      moduleApi="user"
      moduleLabel="User Management"
      icon="fa-solid fa-users"
      fields={fields}
      relatedModules={[]}
    />
  );
};

export default UserDetail;

