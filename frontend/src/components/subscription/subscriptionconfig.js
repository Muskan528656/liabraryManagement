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

export const getSubscriptionConfig = (externalData = {}, allowedBooks = 10, timeZone) => {
  console.log("Config Timezone:", timeZone);

  return {
    moduleName: "subscriptions",
    moduleLabel: "Subscription",
    apiEndpoint: "subscriptions",

    initialFormData: {
      renewal: "",
      plan_name: "",
      start_date: "",
      end_date: "",
      allowed_books: allowedBooks,
      status: "active",
    },

    columns: [
      { field: "plan_name", label: "Plan Name" },
      { field: "renewal", label: "Renewal" },
      {
        // Changed to raw field 'start_date' so the renderer gets the ISO string
        field: "start_date", 
        label: "Start Date",
        render: (value) => {
          return convertToUserTimezone(value, timeZone);
        }
      },
      {
        // Changed to raw field 'end_date'
        field: "end_date",
        label: "End Date",
        render: (value) => {
          return convertToUserTimezone(value, timeZone);
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
        defaultValue: allowedBooks,
        disabled: true,
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
        type: "toggle",
        options: [
          { value: true, label: "Active" },
          { value: false, label: "Inactive" }
        ],
        colSize: 6,
      }
    ],

    validationRules: (formData) => {
      const errors = [];
      if (!formData.plan_name?.trim()) errors.push("Plan name is required");
      if (!formData.start_date) errors.push("Start date is required");
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
      allowDelete: false,
      allowEdit: true,
    },

    details: [
      { key: "plan_name", label: "Plan Name" },
      { key: "allowed_books", label: "Allowed Books", disabled: true },
      { key: "start_date_display", label: "Start Date" },
      { key: "end_date_display", label: "End Date" },
      { key: "status", label: "Status" },
    ],

    customHandlers: {
      beforeSave: (formData) => {
        if (formData.plan_name === "") formData.plan_name = null;
        if (formData.allowed_books === "") formData.allowed_books = null;

        if (formData.status !== undefined) {
          formData.is_active = formData.status === "active" || formData.status === true;
          delete formData.status;
        }

        return true;
      },

      onDataLoad: (data) => {
        const processItem = (item) => {
          
          item.start_date_display = item.start_date
            ? convertToUserTimezone(item.start_date, timeZone)
            : "";

          item.end_date_display = item.end_date
            ? convertToUserTimezone(item.end_date, timeZone)
            : "";
         console.log("start_date_display",convertToUserTimezone(item.start_date, timeZone))
          if (item.hasOwnProperty("is_active")) {
            item.status = item.is_active ? "active" : "inactive";
          }
          
          if (!item.plan_name) item.plan_name = "";
          if (!item.allowed_books) item.allowed_books = "";
        };
        
        if (Array.isArray(data)) {
          data.forEach(processItem);
        } else if (data && typeof data === "object") {
          processItem(data);
        }
      },
    },
  };
};