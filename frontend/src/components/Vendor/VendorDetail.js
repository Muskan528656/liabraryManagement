// import React from "react";
// import ModuleDetail from "../common/ModuleDetail";
// import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";
// import { convertToUserTimezone } from "../../utils/convertTimeZone";
// import { useTimeZone } from "../../contexts/TimeZoneContext";
// import { Country, State, City } from "country-state-city";

// const statusBadges = {
//   active: { variant: "success", label: "Active" },
//   inactive: { variant: "secondary", label: "Inactive" },
//   suspended: { variant: "warning", label: "Suspended" },
// };
// const countryCodeOptions = COUNTRY_CODES.map((country) => ({
//   value: country.country_code,
//   label: `${country.country_code} - ${country.country}`,
// }));

// const VendorDetail = ({ permissions }) => {
//   console.log("VendorDetail permissions:", permissions);
//   const { timeZone } = useTimeZone();
//   // console.log( "!permissions?.allowEdit", !permissions?.allowEdit);
//   const other = permissions?.allowEdit
//     ? {
//         other: [
//           { key: "createdbyid", label: "Created By", type: "text" },
//           { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },
//           {
//             key: "createddate",
//             label: "Created Date",
//             type: "date",
//             render: (value) =>
//               value ? convertToUserTimezone(value, timeZone) : "N/A",
//           },
//           {
//             key: "lastmodifieddate",
//             label: "Last Modified Date",
//             type: "date",
//             render: (value) =>
//               value ? convertToUserTimezone(value, timeZone) : "N/A",
//           },
//         ],
//       }
//     : {};


//     const countryOptions = Country.getAllCountries().map(country => ({
//         value: country.name,
//         label: `${country.flag} ${country.name}`,
//         isoCode: country.isoCode
//     }));


//   const fields = {
//     title: "name",
//     subtitle: "company_name",
//     details: [
//       { key: "name", label: "Vendor Name", type: "text" },
//       { key: "company_name", label: "Company Name", type: "text" },
//       { key: "email", label: "Email", type: "email" },
//       { key: "phone", label: "Phone", type: "text" },
//       { key: "gst_number", label: "GST Number", type: "text" },
//       { key: "pan_number", label: "PAN Number", type: "text" },
//       {
//         key: "country_code",
//         label: "Country Code",
//         type: "select",
//         options: countryCodeOptions,
//         render: (value) => {
//           const cleanValue = value ? String(value).split(/[—\-]/)[0].trim() : value;
//           const country = COUNTRY_CODES.find(c => c.country_code === cleanValue);
//           return country ? `${country.country_code} (${country.country})` : value || 'N/A';
//         },
//       },
//       {
//         key: "status",
//         label: "Status",
//         type: "toggle",
//       }

//     ],
//     address: [
//       { key: "country", label: "Country", type: "select", options: countryOptions },
//       // { key: "state", label: "State", type: "text" },
//       // { key: "city", label: "City", type: "text" },
//       {
//                 key: "state",
//                 label: "State",
//                 type: "select",
           
//                 options: (value) => {
//                     if (!value?.country) return [];

//                       const selectedCountry = Country.getAllCountries()
//                        .find(c => c.name === value.country);

//                         if (!selectedCountry) return [];
//                         return State.getStatesOfCountry(selectedCountry.isoCode)
//                         .map(state => ({
//                             value: state.name,         
//                             label: state.name,
//                             isoCode: state.isoCode
//                         }));
//                    }
//             },
//             {
//                     key: "city",
//                     label: "City",
//                     type: "select",
                  
//                     options: (value) => {
//                         if (!value?.country || !value?.state) return [];

//                         const selectedCountry = Country.getAllCountries()
//                             .find(c => c.name === value.country);

//                         if (!selectedCountry) return [];

//                         const selectedState = State.getStatesOfCountry(selectedCountry.isoCode)
//                             .find(s => s.name === value.state);

//                         if (!selectedState) return [];

//                         return City.getCitiesOfState(
//                             selectedCountry.isoCode,
//                             selectedState.isoCode
//                         ).map(city => ({
//                             value: city.name,     
//                             label: city.name
//                         }));
//                     }

//             },

//       { key: "pincode", label: "Pincode", type: "text" },
//       { key: "address", label: "Address", type: "text" },

//     ],
//     ...other
    
//   };


//   console.log("Rendering VendorDetail with permissions:", permissions.allowCreate, permissions.allowEdit, permissions.allowDelete);



//   return (
//     <ModuleDetail
//       moduleName="vendor"
//       moduleApi="vendor"
//       moduleLabel="Vendor"
//       icon="fa-solid fa-store"
//       permissions={permissions || {}}
//       fields={fields}
//     />
//   );
// };

// export default VendorDetail;

import React from "react";
import ModuleDetail from "../common/ModuleDetail";
import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import { Country, State, City } from "country-state-city";

const statusBadges = {
  active: { variant: "success", label: "Active" },
  inactive: { variant: "secondary", label: "Inactive" },
  suspended: { variant: "warning", label: "Suspended" },
};

const countryCodeOptions = COUNTRY_CODES.map((country) => ({
  value: country.country_code,
  label: `${country.country_code} - ${country.country}`,
}));

const VendorDetail = ({ permissions }) => {
  const { timeZone } = useTimeZone();

  const other = permissions?.allowEdit
    ? {
        other: [
          { key: "createdbyid", label: "Created By", type: "text" },
          { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },
          {
            key: "createddate",
            label: "Created Date",
            type: "date",
            render: (value) =>
              value ? convertToUserTimezone(value, timeZone) : "N/A",
          },
          {
            key: "lastmodifieddate",
            label: "Last Modified Date",
            type: "date",
            render: (value) =>
              value ? convertToUserTimezone(value, timeZone) : "N/A",
          },
        ],
      }
    : {};

const countryOptions = Country.getAllCountries().map((country) => ({
  value: country.isoCode, 
  label: `${country.flag} ${country.name}`,
}));


console.log("countryOptions =>"+countryOptions);

  const  StateOptions =  State.getStatesOfCountry('IN').map((State) => ({
    value: State.isoCode,
    label: `${State.name}`,
  }));

  console.log("StateOptions",StateOptions)


  const fields = {
    title: "name",
    subtitle: "company_name",
    onChange: (key, value, formData, setFormData) => {
  if (key === "country") {
    setFormData((prev) => ({
      ...prev,
      country: value,
      state: "",
      city: "",
    }));
  }

  if (key === "state") {
    setFormData((prev) => ({
      ...prev,
      state: value,
      city: "",
    }));
  }

  if (key === "city") {
    setFormData((prev) => ({
      ...prev,
      city: value,
    }));
  }
},

details: [
      { key: "name", label: "Vendor Name", type: "text" },
      { key: "company_name", label: "Company Name", type: "text" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "gst_number", label: "GST Number", type: "text" },
      { key: "pan_number", label: "PAN Number", type: "text" },

      {
        key: "country_code",
        label: "Country Code",
        type: "select",
        options: countryCodeOptions,
        render: (value) => {
          const cleanValue = value
            ? String(value).split(/[—\-]/)[0].trim()
            : value;
          const country = COUNTRY_CODES.find(
            (c) => c.country_code === cleanValue
          );
          return country
            ? `${country.country_code} `
            : value || "N/A";
        },
      },

      {
        key: "status",
        label: "Status",
        type: "toggle",
      },
    ],
    address: [
      {
        key: "country",
        label: "Country",
        type: "select",
        options: countryOptions,

      },
      {
        key: "state",
        label: "State",
        type: "select",
        options: (formData) => {
          if (!formData?.country) return [];

          return State.getStatesOfCountry(formData.country).map((s) => ({
            value: s.isoCode,
            label: s.name,
          }));
        },
      },

      {
        key: "city",
        label: "City",
        type: "select",
        options: (formData) => {
          if (!formData?.country || !formData?.state) return [];

          return City.getCitiesOfState(formData.country, formData.state).map((c) => ({
            value: c.name,
            label: c.name,
          }));
        },
      },
      { key: "pincode", label: "Pincode", type: "text" },
      { key: "address", label: "Address", type: "text" },
    ],

    ...other,
  };

  return (
    <ModuleDetail
      moduleName="vendor"
      moduleApi="vendor"
      moduleLabel="Vendor"
      icon="fa-solid fa-store"
      permissions={permissions || {}}
      fields={fields}
    />
  );
};

export default VendorDetail;
