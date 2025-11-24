import React from "react";
import ModuleDetail from "../common/ModuleDetail";

const AuthorDetail = () => {
  const fields = {
    title: "name",
    subtitle: "email",
    overview: [
      { key: "name", label: "Name", type: "text" },
      { key: "email", label: "Email", type: "text" },
    ],
    details: [
      { key: "name", label: "Name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "bio", label: "Bio", type: "text" },
    ],
  };

  return (
    <ModuleDetail
      moduleName="author"
      moduleApi="author"
      moduleLabel="Author"
      fields={fields}
    />
  );
};

export default AuthorDetail;
