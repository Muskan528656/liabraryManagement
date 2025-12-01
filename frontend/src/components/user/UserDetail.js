import React, { useState, useEffect } from "react";
import ModuleDetail from "../common/ModuleDetail";
import DataApi from "../../api/dataApi";
import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";

const UserDetail = () => {
  const [externalData, setExternalData] = useState({
    userRoles: []
  });

  useEffect(() => {
    const fetchExternalData = async () => {
      try {

        const api = new DataApi("user-role");
        const response = await api.fetchAll();
        const userRoles = response?.data?.data || response?.data || [];

        setExternalData({
          userRoles: Array.isArray(userRoles) ? userRoles : []
        });

      } catch (error) {
        console.error("Error fetching user roles:", error);
      }
    };

    fetchExternalData();
  }, []);


  const fields = {
    title: "firstname",
    subtitle: "email",

    details: [
      { key: "firstname", label: "First Name", type: "text" },
      { key: "lastname", label: "Last Name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },


      {
        key: "country_code",
        label: "Country Code",
        type: "select",
        options: COUNTRY_CODES.map(country => ({
          value: country.country_code,
          label: `${country.country_code} - ${country.country}`
        })),
        render: (value) => {
          const country = COUNTRY_CODES.find(c => c.country_code === value);
          return country ? `${country.country_code} (${country.country})` : value;
        }
      },


      {
        key: "userrole",
        label: "User Role",
        type: "select",
        options: "userRoles",
        optionLabel: "role_name",  
        optionValue: "id",        
        displayKey: "role_name", 
        render: (value, record, externalData) => {

          const userRoles = externalData?.userRoles || [];
          const role = userRoles.find(role => role.id === value || role.id === record.userrole);
          return role ? role.role_name : value;
        }
      },

      {
        key: "isactive",
        label: "Status",
        type: "toggle",
        options: [
          { value: true, label: "Active" },
          { value: false, label: "Inactive" }
        ]
      }
    ],

    other: [
      { key: "createdbyid", label: "Created By", type: "text" },
      { key: "createddate", label: "Created Date", type: "date" },
      { key: "lastmodifieddate", label: "Last Modified Date", type: "date" },
      { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" }
    ]
  };

  const lookupNavigation = {
    userrole: {
      path: "user-role",
      idField: "id",
      labelField: "role_name"
    }
  };

  return (
    <ModuleDetail
      moduleName="user"
      moduleApi="user"
      moduleLabel="User Management"
      icon="fa-solid fa-users"
      fields={fields}
      lookupNavigation={lookupNavigation}
      externalData={externalData}
    />
  );
};

export default UserDetail;