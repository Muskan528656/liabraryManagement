import React from "react";
import ModuleDetail from "../common/ModuleDetail";

const AuthorDetail = () => {
  const fields = {
    title: "name",
    subtitle: "email",
    details: [
      { key: "name", label: "Name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "bio", label: "Bio", type: "text" },
      
    ],
    other: [
      { key: "createdbyid", label: "Created By", type: "text" },
      { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },
      { key: "createddate", label: "Created Date", type: "date" },
      // { key: "lastmodifieddate", label: "Last Modified Date", type: "date" },
     ],
  };

  return (
    <ModuleDetail
      moduleName="author"
      moduleApi="author"
      moduleLabel="Author Management"
      icon="fa-solid fa-user-pen"
      fields={fields}
    />
  );
};

export default AuthorDetail;
