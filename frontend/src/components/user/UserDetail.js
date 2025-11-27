import React, { useState, useEffect } from "react";
import jwt_decode from "jwt-decode";
import ModuleDetail from "../common/ModuleDetail";

const UserDetail = () => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const token = sessionStorage.getItem("token");
      if (token) {
        const decoded = jwt_decode(token);
        setCurrentUser(decoded);
      }
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }, []);

  const fields = {
    title: "firstname",
    subtitle: "email",
    status: "isactive",
    // overview: [
    //   { key: "firstname", label: "First Name", type: "text" },
    //   { key: "lastname", label: "Last Name", type: "text" },
    //   { key: "email", label: "Email", type: "text" },
    //   { key: "phone", label: "Phone", type: "text" },
    // ],
    details: [
      { key: "firstname", label: "First Name", type: "text" },
      { key: "lastname", label: "Last Name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "userrole", label: "Role", type: "select", options: "roles" },
      { key: "isactive", label: "Status", type: "toggle" }
    

    ],

    other: [
      { key: "createdbyid", label: "Created By", type: "select", options: "users", displayKey: "createdbyname" },
      { key: "lastmodifiedbyname", label: "Last Modified By", type: "select", options: "users", displayKey: "lastmodifiedbyname" },
      { key: "createddate", label: "Created Date", type: "date" },
      { key: "lastmodifieddate", label: "Last Modified Date", type: "date" },
     ],
  };


//get current id from url  
  const pathParts = window.location.pathname.split("/");
  const id = pathParts.length >= 3 ? pathParts[2] : null;
  // console.log('id ---> ',id);
  
  const externalData = currentUser ? {
    createdbyid: currentUser.id,
    lastmodifiedbyid: currentUser.id
  } : {};

  return (
    <ModuleDetail
      moduleName="user"
      moduleApi="user"
      moduleLabel="User Management"
      icon="fa-solid fa-users"
      fields={fields}
      relatedModules={[]}
      recordId={id}
      externalData={externalData}
    />
  );
};

export default UserDetail;

