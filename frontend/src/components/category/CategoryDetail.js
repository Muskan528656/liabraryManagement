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


import React, { useState, useEffect } from "react";
import ModuleDetail from "../common/ModuleDetail";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import DataApi from "../../api/dataApi";

const ClassificationDetail = ({ timeZone, permissions }) => {
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [librarySettings, setLibrarySettings] = useState(null);

  // Load categories and library settings on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load categories
        const api = new DataApi('classification');
        const response = await api.get('/');
        const classifications = response.data || [];
        const uniqueCategories = [...new Set(classifications.map(item => item.category).filter(Boolean))];
        setCategoryOptions(uniqueCategories.map(cat => ({ value: cat, label: cat })));

        // Load library settings
        const settingsApi = new DataApi('library-settings');
        const settingsResponse = await settingsApi.get('/');
        setLibrarySettings(settingsResponse.data);
      } catch (e) {
        console.error("Error loading data:", e);
      }
    };
    loadData();
  }, []);

  const fields = {
    title: "name",

    details: [
      {
        key: "category",
        label: "Category",
        type: "select",
        options: categoryOptions,
        creatable: true,
        onChange: async (value, formData, setFormData) => {
          if (value?.trim()) {
            try {
              const api = new DataApi('classification');
              // Fetch last range for auto-fill
              const lastResponse = await api.get(`/last-by-category/${encodeURIComponent(value)}`);
              // Fetch names for this category
              const namesResponse = await api.get(`/suggestions?field=name&category=${encodeURIComponent(value)}&limit=50`);
              const nameOptions = namesResponse.data?.map(item => ({ value: item, label: item })) || [];

              if (lastResponse.data) {
                const lastItem = lastResponse.data;
                const from = lastItem.classification_to ? parseInt(lastItem.classification_to) + 1 : 1;
                const to = from + 9;
                setFormData(prev => ({
                  ...prev,
                  category: value,
                  name: '',
                  _nameOptions: nameOptions,
                  classification_from: from.toString(),
                  classification_to: to.toString(),
                  classification_type: lastItem.classification_type || prev.classification_type
                }));
              } else {
                setFormData(prev => ({
                  ...prev,
                  category: value,
                  name: '',
                  _nameOptions: nameOptions,
                  classification_from: '',
                  classification_to: ''
                }));
              }
            } catch (error) {
              console.error("Error fetching category data:", error);
              setFormData(prev => ({ ...prev, category: value, name: '' }));
            }
          } else {
            setFormData(prev => ({ ...prev, category: value, name: '', _nameOptions: [] }));
          }
        }
      },
      { key: "classification_from", label: "Range From", type: "text" },
      { key: "classification_to", label: "Range To", type: "text" },
      { key: "name", label: "Name", type: "text" },
      // {
      //   key: "name",
      //   label: "Name",
      //   type: "select",
      //   options: (formData) => formData?._nameOptions || [],
      //   creatable: true,
      //   dependsOn: "category",
      //   disabled: (formData) => !formData?.category,
      // },

      { key: "code", label: "Code", type: "text" },
      { key: "is_active", label: "Status", type: "toggle" },

      // {
      //   key: "is_active",
      //   label: "Status",
      //   type: "badge",
      //   render: (value) => (
      //     <span className={`badge ${value ? 'bg-success' : 'bg-secondary'}`}>
      //       {value ? 'Active' : 'Inactive'}
      //     </span>
      //   )
      // },

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