import React, { useState, useEffect } from "react";
import ModuleDetail from "../common/ModuleDetail";
import DataApi from "../../api/dataApi";
import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";

const UserDetail = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [externalData, setExternalData] = useState({
    userRoles: [],
    companies: [],
    defaultCountryCode: "+91",
  });

  useEffect(() => {
    const fetchExternalData = async () => {
      try {
        const roleApi = new DataApi("user-role");
        const companyApi = new DataApi("company");

        const [roleRes, companyRes] = await Promise.all([
          roleApi.fetchAll(),
          companyApi.fetchAll(),
        ]);

        console.log("Role Response:", roleRes);
        console.log("Company Response:", companyRes);

        const userRoles = roleRes?.data?.data || roleRes?.data || [];
        const companies = companyRes?.data?.data || companyRes?.data || [];

        console.log("Fetched userRoles:", userRoles);
        console.log("Fetched companies:", companies);


        let defaultCountryCode = "+91";
        if (Array.isArray(companies) && companies.length > 0) {
          const company = companies.find((c) => c.country_code);
          if (company) {
            const countryCodeStr = String(company.country_code).trim();
            console.log("Country code string:", countryCodeStr);

            const codePart = countryCodeStr.split(/[—\-]/)[0].trim();
            console.log("Code part:", codePart);

            if (codePart && !codePart.startsWith('+')) {
              defaultCountryCode = '+' + codePart;
            } else if (codePart) {
              defaultCountryCode = codePart;
            }
          }
        }

        console.log("Final defaultCountryCode:", defaultCountryCode);

        setExternalData({
          userRoles: Array.isArray(userRoles) ? userRoles : [],
          companies: Array.isArray(companies) ? companies : [],
          defaultCountryCode,
        });
      } catch (error) {
        console.error("Error fetching user roles or companies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExternalData();
  }, []);


  const countryCodeOptions = COUNTRY_CODES.map((country) => ({
    value: country.country_code,
    label: `${country.country_code} - ${country.country}`,
  }));


  const userRoleOptions = externalData.userRoles.map((role) => ({
    value: role.id,
    label: role.role_name,
  }));


  const companyOptions = externalData.companies.map((company) => ({
    value: company.id,
    label: company.name,
  }));

  const fields = {
    title: "firstname",
    subtitle: "email",
    status: "isactive",

    details: [
      { key: "firstname", label: "First Name", type: "text" },
      { key: "lastname", label: "Last Name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      {
        key: "country_code",
        label: "Country Code",
        type: "select",
        options: countryCodeOptions,
        render: (value) => {
          const cleanValue = value ? String(value).split(/[—\-]/)[0].trim() : value;
          const country = COUNTRY_CODES.find(c => c.country_code === cleanValue);
          return country ? `${country.country_code} (${country.country})` : value || 'N/A';
        },
      },
      { key: "phone", label: "Phone", type: "text" },


















      {
        key: "userrole",
        label: "User Role",
        type: "select",
        options: userRoleOptions,
        displayKey: "role_name",
        render: (value, data) => {

          const roleName = data.role_name ||
            data.userrole_name ||
            data.user_role_name;
          if (roleName) return roleName;


          const role = externalData.userRoles.find((r) => r.id === value);
          return role ? role.role_name : value || 'N/A';
        },
      },
      {
        key: "isactive",
        label: "Status",
        type: "toggle",
        render: (value) => {
          const isActive = value === true || value === "active" || value === 1;
          return isActive ? "Active" : "Inactive";
        },
        options: [
          { value: true, label: "Active" },
          { value: false, label: "Inactive" },
        ],
      },
    ],

    other: [
      { key: "createdbyid", label: "Created By", type: "text" },
      { key: "createddate", label: "Created Date", type: "date" },
    ],
  };

  const lookupNavigation = {
    userrole: {
      path: "user-role",
      idField: "id",
      labelField: "role_name",
    },
    companyid: {
      path: "company",
      idField: "id",
      labelField: "name",
    },
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-2">Loading user details...</span>
      </div>
    );
  }

  return (
    <ModuleDetail
      moduleName="user"
      moduleApi="user"
      moduleLabel="User"
      icon="fa-solid fa-users"
      fields={fields}
      lookupNavigation={lookupNavigation}
      externalData={externalData}
    />
  );
};

export default UserDetail;