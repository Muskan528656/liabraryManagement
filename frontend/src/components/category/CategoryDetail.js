import React from "react";
import ModuleDetail from "../common/ModuleDetail";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import { useTimeZone } from "../../contexts/TimeZoneContext";

const CategoryDetail = () => {
  const {timeZone} = useTimeZone()
  const fields = {
    title: "name",

    details: [
      { key: "name", label: "Name", type: "text" },
      { key: "description", label: "Description", type: "text" },
    ],
    other: [
      { key: "createdbyid", label: "Created By", type: "text" },
      { key: "lastmodifieddate", label: "Last Modified Date", type: "date", render: (value) => convertToUserTimezone(value, timeZone)},
      { key: "createddate", label: "Created Date", type: "date", render: (value) => convertToUserTimezone(value, timeZone) },
      { key: "lastmodifieddate", label: "Last Modified Date", type: "date" },
    ],
  };

  return (
    <ModuleDetail
      moduleName="category"
      moduleApi="category"
      moduleLabel="Category Management"
      icon="fa-solid fa-tags"
      fields={fields}
    />
  );
};

export default CategoryDetail;
