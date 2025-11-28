import React, { useState, useEffect } from "react";
import jwt_decode from "jwt-decode";
import ModuleDetail from "../common/ModuleDetail";
import DataApi from "../../api/dataApi";

const UserDetail = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [roles, setRoles] = useState([]);

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

  useEffect(() => {
    // Fetch all roles and keep as externalData so select shows role_name
    const loadRoles = async () => {
      try {
        const api = new DataApi("user-role");
        const response = await api.fetchAll();
        const payload = response?.data ?? [];
        let list = [];
        if (Array.isArray(payload)) list = payload;
        else if (payload && payload.success && Array.isArray(payload.data)) list = payload.data;
        else if (payload && Array.isArray(payload.data)) list = payload.data;
        setRoles(list || []);
      } catch (err) {
        console.error("Error loading roles:", err);
        setRoles([]);
      }
    };

    loadRoles();
  }, []);

  const fields = {
    title: "firstname",
    subtitle: "email",
    status: "status",
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
      { 
        key: "userrole", 
        label: "Role", 
        type: "select", 
        options: "user-role",
        displayKey: "role_name"
      },
      { key: "status", label: "Status", type: "badge" },
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

  // attach roles array so ModuleDetail's select can use externalData.roles
  if (roles && roles.length > 0) {
    externalData.roles = roles;
  }

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

