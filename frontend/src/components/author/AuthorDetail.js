import React from "react";
import ModuleDetail from "../common/ModuleDetail";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import moment from "moment";
const AuthorDetail = () => {
  const { timeZone } = useTimeZone();
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
      moduleName="author"
      moduleApi="author"
      moduleLabel="Author"
      icon="fa-solid fa-user-pen"
      fields={fields}
    />
  );
};

export default AuthorDetail;
