import React from "react";
import { convertToUserTimezone } from "../../utils/convetTimeZone";

/* -------------------------
   TIMEZONE HELPERS
------------------------- */

const getOffsetHours = (tzString) => {
  const match = tzString.match(/GMT([+-]\d{2}):(\d{2})/);
  if (!match) return 0;
  return Number(match[1]);
};

const convertUTCToTZ = (utcDate, tzString) => {
  if (!utcDate) return "";
  const offset = getOffsetHours(tzString);

  const date = new Date(utcDate);
  date.setHours(date.getHours() + offset);

  const iso = date.toISOString().replace("Z", "");
  const [d, t] = iso.split("T");
  const time = t.substring(0, 5);
  return `${d} ${time} (${tzString})`;
};

const convertTZToUTC = (localDate, tzString) => {
  if (!localDate) return null;
  const offset = getOffsetHours(tzString);

  const date = new Date(localDate);
  date.setHours(date.getHours() - offset);

  return date.toISOString();
};

/* -------------------------
   DEPENDENCY CONFIG
------------------------- */

export const subscriptionDataDependencies = {
  company: "company",
};

/* -------------------------
   STATUS BADGE
------------------------- */

const statusBadge = (value) => (
  <span className={`badge ${value ? "bg-success" : "bg-secondary"}`}>
    {value ? "Active" : "Inactive"}
  </span>
);

/* -------------------------
   MAIN CONFIG EXPORT
------------------------- */

export const getSubscriptionConfig = (externalData = {}) => {
  let companies = [];

  if (externalData && externalData.company) {
    companies = externalData.company;
  }

  const COMPANY_TIMEZONE =
    Array.isArray(companies) &&
    companies.length > 0 &&
    companies[0].time_zone
      ? companies[0].time_zone
      : "GMT-05:00";

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

    /* -------------------------
       TABLE COLUMNS
    ------------------------- */

    columns: [
      { field: "plan_name", label: "Plan Name" },
      { field: "renewal", label: "Renewal" },
      {
        field: "start_date_display",
        label: "Start Date",
        render: (value) => {
          console.log("0-iujkkk",value)
          return convertToUserTimezone(value,"GMT-04:00");
        }
      },
      {
        field: "end_date_display",
        label: "End Date",
        
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

    /* -------------------------
       FORM FIELDS
    ------------------------- */

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

    /* -------------------------
       VALIDATION RULES
    ------------------------- */

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

    /* -------------------------
       FEATURES
    ------------------------- */

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

    /* -------------------------
       DETAILS VIEW
    ------------------------- */

    details: [
      { key: "plan_name", label: "Plan Name" },
      { key: "allowed_books", label: "Allowed Books" },
      { key: "start_date_display", label: "Start Date" },
      { key: "end_date_display", label: "End Date" },
      { key: "status", label: "Status" },
    ],

    /* -------------------------
       CUSTOM HANDLERS
    ------------------------- */

    customHandlers: {
      beforeSave: (formData) => {
        // Convert to UTC before API posting
        formData.start_date = convertTZToUTC(formData.start_date, COMPANY_TIMEZONE);
        formData.end_date = convertTZToUTC(formData.end_date, COMPANY_TIMEZONE);

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
            item.start_date_display = item.start_date
              ? convertUTCToTZ(item.start_date, COMPANY_TIMEZONE)
              : "";

            item.end_date_display = item.end_date
              ? convertUTCToTZ(item.end_date, COMPANY_TIMEZONE)
              : "";

            if (item.hasOwnProperty("is_active")) {
              item.status = item.is_active ? "active" : "inactive";
            }
          });
        } else if (data && typeof data === "object") {
          data.start_date_display = data.start_date
            ? convertUTCToTZ(data.start_date, COMPANY_TIMEZONE)
            : "";

          data.end_date_display = data.end_date
            ? convertUTCToTZ(data.end_date, COMPANY_TIMEZONE)
            : "";

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
