import React from "react";
import { convertToUserTimezone } from "../../utils/convertTimeZone";

export const subscriptionDataDependencies = {
  company: "company",
};

const statusBadge = (value) => (
  <span className={`badge ${value ? "bg-success" : "bg-secondary"}`}>
    {value ? "Active" : "Inactive"}
  </span>
);

export const getSubscriptionConfig = (data, time_zone) => {
  
  
 
  const currentTz = time_zone;
  console.log("currentTz", currentTz);
  
  
  
  return {
    moduleName: "subscriptions",
    moduleLabel: "Subscription",
    apiEndpoint: "subscriptions",
    initialFormData: {
      renewal: "",
      plan_name: "",
      start_date: "",
      end_date: "",
      allowed_books: "",
      status: "active",
    },

    columns: [
      { field: "plan_name", label: "Plan Name" },
      { field: "renewal", label: "Renewal" },
      {
        field: "start_date",
        label: "Start Date",
        render: (value) => {
       
          console.log("currentZ", currentTz)
          return convertToUserTimezone(value, currentTz);
        }
      },
      {
        field: "end_date",
        label: "End Date",
        render: (value) => {
    
          return convertToUserTimezone(value, currentTz);
        },
      },
      {
        field: "allowed_books",
        label: "Allowed Books",
        render: (value) => value || "—",
      },
      {
        field: "status",
        label: "Status",
        render: (value) => {
          const statusValue =
            value ||
            (typeof value === "boolean" ? (value ? "active" : "inactive") : "inactive");
          return statusBadge(statusValue === "active" || statusValue === true);
        },
      },
    ],

    formFields: [
      {
        name: "plan_name",
        label: "Plan Name",
        type: "text",
        required: true,
        placeholder: "Enter plan name",
        colSize: 12,
      },
      {
        name: "allowed_books",
        label: "Allowed Books",
        type: "number",
        min: 0,
        placeholder: "Number of books allowed",
        colSize: 6,
      },
      {
        name: "start_date",
        label: "Start Date",
        type: "date",
        required: true,
        colSize: 6,
      },
      {
        name: "end_date",
        label: "End Date",
        type: "date",
        colSize: 6,
        helpText: "Keep empty for never ending plans",
      },
      {
        name: "renewal",
        label: "Renewal",
        type: "text",
        colSize: 6,
        helpText: "Keep empty for never ending plans",
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ],
        colSize: 6,
      },
    ],

    validationRules: (formData) => {
      const errors = [];
      if (!formData.plan_name?.trim()) {
        errors.push("Plan name is required");
      }
      if (!formData.start_date) {
        errors.push("Start date is required");
      }
      if (
        formData.start_date &&
        formData.end_date &&
        new Date(formData.end_date) < new Date(formData.start_date)
      ) {
        errors.push("End date cannot be before start date");
      }
      if (formData.allowed_books && Number(formData.allowed_books) < 0) {
        errors.push("Allowed books must be positive");
      }
      return errors;
    },

    features: {
      showBulkInsert: false,
      showImportExport: true,
      showDetailView: true,
      showSearch: true,
      showColumnVisibility: true,
      showCheckbox: true,
      allowDelete: true,
      allowEdit: true,
    },

    details: [
      { key: "plan_name", label: "Plan Name" },
      { key: "allowed_books", label: "Allowed Books" },
      { key: "start_date", label: "Start Date" },
      { key: "end_date", label: "End Date" },
      { key: "status", label: "Status" },
    ],

    customHandlers: {
      beforeSave: (formData) => {
        if (formData.plan_name === "") formData.plan_name = null;
        if (formData.allowed_books === "") formData.allowed_books = null;

        if (formData.status) {
          formData.is_active = formData.status === "active";
          delete formData.status;
        }

        return true;
      },

      onDataLoad: (data) => {
        if (Array.isArray(data)) {
          data.forEach((item) => {
            if (item.hasOwnProperty("is_active")) {
              item.status = item.is_active ? "active" : "inactive";
            }

            if (!item.plan_name) item.plan_name = "";
            if (!item.allowed_books) item.allowed_books = "";
          });
        } else if (data && typeof data === "object") {
          if (data.hasOwnProperty("is_active")) {
            data.status = data.is_active ? "active" : "inactive";
          }

          if (!data.plan_name) data.plan_name = "";
          if (!data.allowed_books) data.allowed_books = "";
        }
      },
    },
  };
};