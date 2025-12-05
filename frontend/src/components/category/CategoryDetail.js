import React from "react";
import ModuleDetail from "../common/ModuleDetail";
import { convertToUserTimezone } from "../../utils/convertTimeZone";

const CategoryDetail = (timeZone) => {
  const fields = {
    title: "name",

    details: [
      { key: "name", label: "Name", type: "text" },
      { key: "description", label: "Description", type: "text" },
    ],
    other: [
      { key: "createdbyid", label: "Created By", type: "text" },
      { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },

      {
        key: "createddate", label: "Created Date", type: "date", render: (value) => {
          return convertToUserTimezone(value, timeZone)
        },
      },
      {
        key: "lastmodifieddate", label: "Last Modified Date", type: "date", render: (value) => {
          return convertToUserTimezone(value, timeZone)
        },
      },
    ],
  };

  return (
    <ModuleDetail
      moduleName="category"
      moduleApi="category"
      moduleLabel="Category"
      icon="fa-solid fa-tags"
      fields={fields}
    />
  );
};

export default CategoryDetail;
