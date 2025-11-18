import React from "react";
import ModuleDetail from "../common/ModuleDetail";

const AuthorDetail = () => {
  const fields = {
    title: "name",
    subtitle: "email",
    status: null,
    overview: [
      { key: "name", label: "Name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "bio", label: "Bio", type: "text" },
    ],
    details: [
      { key: "name", label: "Name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "bio", label: "Bio", type: "text" },
      { key: "created_at", label: "Created At", type: "date" },
      { key: "updated_at", label: "Updated At", type: "date" },
    ],
  };

  return (
    <ModuleDetail
      moduleName="author"
      moduleApi="author"
      moduleLabel="Author"
      fields={fields}
      relatedModules={[]}
    />
  );
};

export default AuthorDetail;

