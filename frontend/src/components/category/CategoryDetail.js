import React from "react";
import ModuleDetail from "../common/ModuleDetail";

const CategoryDetail = () => {
  const fields = {
    title: "name",
    overview: [
      { key: "name", label: "Name", type: "text" },
    ],
    details: [
      { key: "name", label: "Name", type: "text" },
      { key: "description", label: "Description", type: "text" },
    ],
  };

  return (
    <ModuleDetail
      moduleName="category"
      moduleApi="category"
      moduleLabel="Category"
      fields={fields}
    />
  );
};

export default CategoryDetail;

