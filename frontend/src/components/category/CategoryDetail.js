import React from "react";
import ModuleDetail from "../common/ModuleDetail";

const CategoryDetail = () => {
  const fields = {
    title: "name",
    subtitle: null,
    status: null,
    overview: [
      { key: "name", label: "Category Name", type: "text" },
      { key: "description", label: "Description", type: "text" },
    ],
    details: [
      { key: "name", label: "Category Name", type: "text" },
      { key: "description", label: "Description", type: "text" },
      { key: "created_at", label: "Created At", type: "date" },
      { key: "updated_at", label: "Updated At", type: "date" },
    ],
  };

  return (
    <ModuleDetail
      moduleName="category"
      moduleApi="category"
      moduleLabel="Category"
      fields={fields}
      relatedModules={[]}
    />
  );
};

export default CategoryDetail;

