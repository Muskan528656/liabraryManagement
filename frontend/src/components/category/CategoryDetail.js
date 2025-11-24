import React from "react";
import ModuleDetail from "../common/ModuleDetail";

const CategoryDetail = () => {
  const fields = {
    title: "name",
    // overview: [
    //   { key: "name", label: "Name", type: "text" },
    // ],
    details: [
      { key: "name", label: "Name", type: "text" },
      { key: "description", label: "Description", type: "text" },
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
      moduleName="category"
      moduleApi="category"
      moduleLabel="Category"
      fields={fields}
    />
  );
};

export default CategoryDetail;

