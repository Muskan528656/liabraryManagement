

import React from "react";
import ModuleDetail from "../common/ModuleDetail";
import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";
import { COUNTRY_TIMEZONE } from "../../constants/COUNTRY_TIMEZONE"; 

const CompanyDetail = () => { 
  
  const currencySymbolOptions = COUNTRY_TIMEZONE.map((item) => ({
    id: item.currency.symbol, 
    name: `${item.currency.name} (${item.currency.symbol}) - ${item.countryName}` 
  }));

  const fields = {
    title: "name",
    subtitle: "systememail",
    status: "isactive",
    overview: [
      { key: "name", label: "Company Name", type: "text" },
      { key: "systememail", label: "System Email", type: "email" },
      { key: "adminemail", label: "Admin Email", type: "email" },
      { key: "userlicenses", label: "User Licenses", type: "number" },
      { 
        key: "currency_symbol", 
        label: "Currency Symbol", 
        type: "select", 
        options: currencySymbolOptions 
      },
      { key: "currency", label: "Currency Code", type: "text" }, 
    ],
    details: [
      { key: "name", label: "Company Name", type: "text" },
      { key: "tenantcode", label: "Tenant Code", type: "text" },
      { key: "userlicenses", label: "User Licenses", type: "number" },
      { key: "isactive", label: "Active Status", type: "boolean" },
      { key: "systememail", label: "System Email", type: "email" },
      { key: "adminemail", label: "Admin Email", type: "email" },
      { key: "logourl", label: "Logo URL", type: "url" },
      { key: "sidebarbgurl", label: "Sidebar Background URL", type: "url" },
      { key: "sourceschema", label: "Source Schema", type: "text" },
      { key: "city", label: "City", type: "text" },
      { key: "street", label: "Street", type: "text" },
      { key: "pincode", label: "Pincode", type: "text" },
      { key: "state", label: "State", type: "text" },
      { key: "country", label: "Country", type: "text" },
      {
        key: "country_code",
        label: "Country Code",
        type: "select",
        options: COUNTRY_CODES.map(item => ({
          id: item.country_code,
          name: `${item.country} (${item.country_code})`
        }))
      },
      { key: "platform_name", label: "Platform Name", type: "text" },
      {
        key: "platform_api_endpoint",
        label: "Platform API Endpoint",
        type: "json"
      },
      { key: "is_external", label: "External Company", type: "boolean" },
      { key: "has_wallet", label: "Has Wallet", type: "boolean" },
      
      { 
        key: "currency_symbol", 
        label: "Currency Symbol", 
        type: "select", 
        options: currencySymbolOptions 
      },
      { key: "currency", label: "Currency Code", type: "text" },
      
      { key: "created_at", label: "Created At", type: "datetime" },
      { key: "updated_at", label: "Updated At", type: "datetime" },
    ],
    address: [
      { key: "street", label: "Street", type: "text" },
      { key: "city", label: "City", type: "text" },
      { key: "state", label: "State", type: "text" },
      { key: "country", label: "Country", type: "text" },
      { key: "pincode", label: "Pincode", type: "text" },
      {
        key: "country_code",
        label: "Country Code",
        type: "select",
        options: COUNTRY_CODES.map(item => ({
          id: item.value,
          name: `${item.label} (${item.value})`
        }))
      },
    ],
    contact: [
      { key: "systememail", label: "System Email", type: "email" },
      { key: "adminemail", label: "Admin Email", type: "email" },
    ],
    settings: [
      { key: "userlicenses", label: "User Licenses", type: "number" },
      { key: "isactive", label: "Active Status", type: "boolean" },
      { key: "is_external", label: "External Company", type: "boolean" },
      { key: "has_wallet", label: "Has Wallet", type: "boolean" },
      
      { 
        key: "currency_symbol", 
        label: "Currency Symbol", 
        type: "select", 
        options: currencySymbolOptions 
      },
      { key: "currency", label: "Currency Code", type: "text" },
      { key: "platform_name", label: "Platform Name", type: "text" },
    ]
  };

  return (
    <ModuleDetail
      moduleName="company"
      moduleApi="company"
      moduleLabel="Company"
      fields={fields}
      relatedModules={[
        {
          label: "Users",
          api: "user",
          filterKey: "company_id",
          columns: ["name", "email", "role"]
        },
        {
          label: "Departments",
          api: "department",
          filterKey: "company_id",
          columns: ["name", "code", "head"]
        }
      ]}
    />
  );
};

export default CompanyDetail;