import React, { useState, useEffect } from "react";
import ModuleDetail from "../common/ModuleDetail";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import DataApi from "../../api/dataApi";

const ClassificationDetail = ({ timeZone, permissions }) => {
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [classificationType, setClassificationType] = useState("");

  const other = permissions?.allowEdit
   ? {
    other: [
    {
      key: "createdby_name",
      label: "Created By",
      type: "text",
      disabled: true,
      hidden: (formData, editingItem) =>
        !editingItem || !permissions?.allowEdit,
    },
    {
      key: "lastmodifiedby_name",
      label: "Last Modified By",
      type: "text",
      disabled: true,
      hidden: (formData, editingItem) =>
        !editingItem || !permissions?.allowEdit,
    },
    {
      key: "createddate",
      label: "Created Date",
      type: "date",
      hidden: (formData, editingItem) =>
        !editingItem || !permissions?.allowEdit,
      render: (value) => convertToUserTimezone(value, timeZone),
    },
    {
      key: "lastmodifieddate",
      label: "Last Modified Date",
      type: "date",
      hidden: (formData, editingItem) =>
        !editingItem || !permissions?.allowEdit,
      render: (value) => convertToUserTimezone(value, timeZone),
    },
  ],
  }:{};

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load classifications
        const api = new DataApi("classification");
        const response = await api.get("/");
        const classifications = response.data || [];

        const uniqueCategories = [
          ...new Set(classifications.map((item) => item.category).filter(Boolean)),
        ];

        setCategoryOptions(
          uniqueCategories.map((cat) => ({ value: cat, label: cat }))
        );

        // Load library settings for classification type
        const settingsApi = new DataApi("librarysettings");
        const settingsResponse = await settingsApi.get("/");
        const type =
          settingsResponse.data?.[0]?.config_classification || "";
        setClassificationType(type);
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
          if (!value?.trim()) {
            setFormData((prev) => ({
              ...prev,
              category: "",
              classification_from: "",
              classification_to: "",
            }));
            return;
          }

          try {
            const api = new DataApi("classification");

            // Fetch dynamic range (NEW LOGIC)
            const response = await api.get(
              `/last-by-category/${encodeURIComponent(
                value
              )}?type=${classificationType}`
            );

            const { min_from, max_to } = response.data || {};

            setFormData((prev) => ({
              ...prev,
              category: value,
              name: "",
              classification_from: min_from ?? "",
              classification_to: max_to ?? "",
              classification_type: classificationType,
            }));
          } catch (error) {
            console.error("Error fetching category range:", error);

            setFormData((prev) => ({
              ...prev,
              category: value,
              classification_from: "",
              classification_to: "",
            }));
          }
        },
      },

      {
        key: "classification_from",
        label: "Range From",
        type: "text",
        disabled: true, 
      },

      {
        key: "classification_to",
        label: "Range To",
        type: "text",
        disabled: true, 
      },

      { key: "name", label: "Name", type: "text" },

      { key: "code", label: "Code", type: "text" },

      { key: "is_active", label: "Status", type: "toggle" },
    ],

    ...other,
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
