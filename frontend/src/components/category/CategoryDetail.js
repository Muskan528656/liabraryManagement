import React from "react";
import { useParams } from "react-router-dom";
import ModuleDetail from "../common/ModuleDetail";

const CategoryDetail = () => {
  const { id } = useParams();
  console.log("AuthorDetail id:", id);
  return (
    <div className="container-fluid py-4">
      <ModuleDetail
        moduleName="author"
        moduleApi="author"
        moduleLabel="Author"
        recordId={id}
        fields={[
          { key: "name", label: "Name", type: "text" },
          { key: "email", label: "Email", type: "text" },
          { key: "bio", label: "Bio", type: "text" },
        ]}
      />
    </div>
  );
};

export default CategoryDetail;

