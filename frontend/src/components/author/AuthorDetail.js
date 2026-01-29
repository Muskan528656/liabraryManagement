import React from "react";
import ModuleDetail from "../common/ModuleDetail";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import moment from "moment";
const AuthorDetail = ({permissions}) => {
  const { timeZone } = useTimeZone();
  const fields = {
    title: "name",
    subtitle: "email",

    details: [
      { key: "name", label: "Name", type: "text" },
      { key: "email", label: "Email", type: "text" },

      {
        key: "bio",
        label: "Bio",
        type: "textarea",
        render: (value) => (
          <div
            style={{
              whiteSpace: "pre-wrap",
              background: "#f8f9fa",
              padding: "8px",
              borderRadius: "6px",
              minHeight: "60px",
              maxHeight: "140px",
              overflowY: "auto",
              fontSize: "14px",
              border: "1px solid #ddd",
            }}
          >
            {value || "-"}
          </div>
        ),
      },
    ],

    other: [
      { key: "createdbyid", label: "Created By", type: "text" },
      { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },

      {
        key: "createddate",
        label: "Created Date",
        type: "date",
        render: (value) => convertToUserTimezone(value, timeZone),
      },

      {
        key: "lastmodifieddate",
        label: "Last Modified Date",
        type: "date",
        render: (value) => convertToUserTimezone(value, timeZone),
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
      permissions={ permissions || {}}
    />
  );
};

export default AuthorDetail;
