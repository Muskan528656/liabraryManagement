import React from "react";
import ModuleDetail from "../common/ModuleDetail";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import { useTimeZone } from "../../contexts/TimeZoneContext";

const AuthorDetail = ({permissions}) => {
  const { timeZone } = useTimeZone();
   const other = permissions?.allowEdit
    ? {
        other: [
                { key: "createdbyid", label: "Created By", type: "text" },
                {
                key: "createddate",
                label: "Created Date",
                type: "date",
                },

                { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },
                {
                    key: "lastmodifieddate",
                    label: "Last Modified Date",
                    type: "date",   
                },
            ],
      }
    : {};
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

    ...other,
    

    // ✅ Custom validation like your book module
    validationRules: (formData, allAuthors, editingAuthor) => {

      console.log("allauthor",allAuthors)
      const errors = [];

      if (!formData.name?.trim()) {
        errors.push("Author Name is required");
      } else {
        if (!formData.email?.trim()) {
          errors.push("Author Email is required");
        } else {
          // Email format validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(formData.email)) {
            errors.push("Invalid email format");
          } else {
           let duplicateEmail;

            if (Array.isArray(allAuthors)) {
              duplicateEmail = allAuthors.find(
                (author) =>
                  author.email?.toLowerCase() === formData.email?.toLowerCase() &&
                  author.id !== editingAuthor?.id
              );
            }

            if (duplicateEmail) {
              errors.push("Author with this email already exists");
            }
          }
        }
      }

      return errors;
    }
  };




  return (
    <ModuleDetail
      moduleName="author"
      moduleApi="author"
      moduleLabel="Author"
      icon="fa-solid fa-user-pen"
      fields={fields}
      validationRules ={fields.validationRules}
      permissions={ permissions || {}}
    />
  );
};

export default AuthorDetail;
