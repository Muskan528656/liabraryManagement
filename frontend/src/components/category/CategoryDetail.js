// import React from "react";
// import ModuleDetail from "../common/ModuleDetail";
// import { convertToUserTimezone } from "../../utils/convertTimeZone";

// const CategoryDetail = ({ timeZone, permissions}) => {
//   const fields = {
//     title: "name",

//     details: [
//       { key: "name", label: "Name", type: "text" },
//       { key: "description", label: "Description", type: "text" },
//     ],
//     other: [
//       { key: "createdbyid", label: "Created By", type: "text" },
//       { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },

//       {
//         key: "createddate", label: "Created Date", type: "date", render: (value) => {
//           return convertToUserTimezone(value, timeZone)
//         },
//       },
//       {
//         key: "lastmodifieddate", label: "Last Modified Date", type: "date", render: (value) => {
//           return convertToUserTimezone(value, timeZone)
//         },
//       },
//     ],
//   };

//   return (
//     <ModuleDetail
//       moduleName="category"
//       moduleApi="category"
//       moduleLabel="Category"
//       icon="fa-solid fa-tags"
//       fields={fields}
//       initialIsEditable={false}
//       permissions={permissions}
//     />
//   );
// };

// export default CategoryDetail;


import React from "react";
import ModuleDetail from "../common/ModuleDetail";
import { convertToUserTimezone } from "../../utils/convertTimeZone";

const ClassificationDetail = ({ timeZone, permissions }) => {
  const fields = {
    title: "name",

    details: [
      { key: "classification_type", label: "Classification Type", type: "text" },
      { key: "code", label: "Code", type: "text" },
      { key: "name", label: "Name", type: "text" },
      { key: "category", label: "Category", type: "text" },
      { key: "classification_from", label: "Range From", type: "text" },
      { key: "classification_to", label: "Range To", type: "text" },
      {
        key: "is_active",
        label: "Status",
        type: "badge",
        render: (value) => (
          <span className={`badge ${value ? 'bg-success' : 'bg-secondary'}`}>
            {value ? 'Active' : 'Inactive'}
          </span>
        )
      },
    ],

    other: [
      { key: "createdbyid", label: "Created By", type: "text" },
      { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },
      {
        key: "createddate",
        label: "Created Date",
        type: "date",
        render: (value) => {
          return convertToUserTimezone(value, timeZone);
        },
      },
      {
        key: "lastmodifieddate",
        label: "Last Modified Date",
        type: "date",
        render: (value) => {
          return convertToUserTimezone(value, timeZone);
        },
      },
    ],
  };

  return (
    <ModuleDetail
      moduleName="classification"
      moduleApi="classification"
      moduleLabel="Classification"
      icon="fa-solid fa-book"
      fields={fields}
      initialIsEditable={false}
      permissions={permissions}
    />
  );
};

export default ClassificationDetail;