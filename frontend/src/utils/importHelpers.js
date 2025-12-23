/**
 * Created : Aabid
 * Date : Dec-10-25
 */

import DataApi from "../api/dataApi";
import PubSub from "pubsub-js";

const normalizeText = (v) =>
  v === null || v === undefined ? "" : String(v).trim().toLowerCase();

export const saveImportedData = async ({
  data,
  apiEndpoint,
  formFields,
  relatedData = {},
  moduleLabel = "Record",
  afterSave,
  existingRecords = [],
  importMatchFields = [],
  autoCreateRelated = {},
  customHandlers = {},
}) => {
  // We wrap the whole process in a try/catch for critical setup errors
  try {
    console.log("data =>", data);
    console.log("relatedData =>", relatedData);

    const mainApi = new DataApi(apiEndpoint);

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0; // Track actual errors separate from duplicates if needed
    const successfulRecords = []; // Track successfully created records

    const relatedApiCache = {};
    const relatedIndex = {};

    // --- Helper: Build Index for Lookup ---
    const buildRelatedIndex = (optionKey) => {
      if (relatedIndex[optionKey]) return;

      const map = new Map();
      const list = Array.isArray(relatedData[optionKey])
        ? relatedData[optionKey]
        : [];

      list.forEach((r) => {
        const label =
          r.name ||
          r.title ||
          r.email ||
          r.plan_name ||
          r.role_name ||
          r.category_name ||
          r.author_name ||
          `Item ${r.id}`;

        if (label) {
          map.set(label.toString().trim().toLowerCase(), r.id);
        }
      });

      relatedIndex[optionKey] = map;
    };

    // --- Helper: Get or Create ID ---
    const getOrCreateRelatedId = async (optionKey, labelValue) => {
      if (!labelValue) return null;
      const norm = labelValue.toString().trim().toLowerCase();

      buildRelatedIndex(optionKey);
      const index = relatedIndex[optionKey];

      if (index.has(norm)) {
        return index.get(norm);
      }

      const cfg = autoCreateRelated[optionKey];
      if (!cfg) {
        return null;
      }

      if (!relatedApiCache[optionKey]) {
        const endpoint = cfg.endpoint || optionKey;
        relatedApiCache[optionKey] = new DataApi(endpoint);
      }

      const api = relatedApiCache[optionKey];

      const labelField = cfg.labelField || "name";
      const extraPayload = cfg.extraPayload || {};
      const payload = {
        ...extraPayload,
        [labelField]: labelValue,
      };

      try {
        const res = await api.create(payload);
        const created = res.data?.data || res.data?.record || res.data || null;
        const newId = created?.id;

        if (newId) {
          index.set(norm, newId);
          return newId;
        }
      } catch (err) {
        console.warn(`Failed to auto-create related item: ${labelValue}`, err);
        // We return null if creation fails so the main record might still import (with null relation)
        // or you can choose to throw here to skip the row entirely.
      }

      return null;
    };

    // --- 1. Transform Data ---
    const transformedData = [];

    for (const row of data) {
      const transformed = {};

      for (const key of Object.keys(row)) {
        const rawValue = row[key];

        const formField = formFields.find(
          (f) =>
            f.label?.toLowerCase() === key.toLowerCase() ||
            f.name?.toLowerCase().replace(/[^a-z0-9]/g, "") ===
            key.toLowerCase().replace(/[^a-z0-9]/g, "")
        );

        if (!formField) {
          const safeKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
          transformed[safeKey] = rawValue;
          continue;
        }

        const fieldName = formField.name;

        if (formField.type === "select" && formField.options) {
          const optionKey =
            typeof formField.options === "string" ? formField.options : null;

          if (optionKey) {
            const relatedId = await getOrCreateRelatedId(optionKey, rawValue);
            transformed[fieldName] = relatedId;
          } else {
            transformed[fieldName] = null;
          }
        } else if (formField.type === "number") {
          const num = parseInt(rawValue, 10);
          transformed[fieldName] = isNaN(num) ? 0 : num;
        } else {
          transformed[fieldName] = rawValue;
        }
      }

      transformedData.push(transformed);
    }

    // Apply custom import data transformation if provided
    let finalData = transformedData;
    if (customHandlers.onImportDataTransform) {
      finalData = customHandlers.onImportDataTransform(transformedData);
    }

    // --- 2. Process & Save Rows ---
    for (const item of finalData) {
      // Check Empty
      const hasData = Object.values(item).some(
        (v) => v !== null && v !== undefined && v !== ""
      );
      if (!hasData) {
        skippedCount++;
        continue;
      }

      // Client-side Duplicate Check (Optimization)
      // This catches duplicates if they exist in the loaded 'existingRecords' array
      const isClientSideDuplicate =
        importMatchFields.length > 0 &&
        existingRecords.some((record) =>
          importMatchFields.every(
            (field) =>
              normalizeText(record[field]) === normalizeText(item[field])
          )
        );

      if (isClientSideDuplicate) {
        skippedCount++;
        continue; // Skip without hitting API
      }

      // --- SERVER-SIDE SAVE WITH ERROR HANDLING ---
      try {
        const result = await mainApi.create(item);
        createdCount++;
        successfulRecords.push({ ...item, id: result.data?.data?.id || result.data?.id }); // Add the created record with ID
      } catch (err) {
        // Here is the fix: Check for 400 (Bad Request) or 409 (Conflict)
        // These codes usually mean Validation Failed or Duplicate Entry on server
        if (err.response && (err.response.status === 400 || err.response.status === 409 || err.response.status === 422)) {
          console.warn("Skipping row due to server validation/duplicate:", item, err.response.data);
          skippedCount++;
        } else {
          // If it's a critical error (500), strictly speaking, we might want to stop.
          // But for imports, usually better to skip and continue.
          console.error("Critical error saving row:", err);
          errorCount++;
        }
      }
    }

    // --- 3. Final Toast & Callback ---

    let message = `Import Processed: ${createdCount} created.`;
    if (skippedCount > 0) message += ` ${skippedCount} skipped (duplicate/empty).`;
    if (errorCount > 0) message += ` ${errorCount} failed.`;

    // Determine toast type based on results
    if (createdCount > 0) {
      PubSub.publish("RECORD_SAVED_TOAST", {
        title: "Import Complete",
        message: message,
      });
    } else if (skippedCount > 0 && errorCount === 0) {
      // If nothing created but duplicates found
      PubSub.publish("RECORD_SAVED_TOAST", { // Using saved toast color (usually green/blue) or warning if you have one
        title: "Import Finished",
        message: "No new records created. All data were duplicates or empty.",
      });
    } else {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Import Failed",
        message: "Could not import data. Please check file format.",
      });
    }

    if (afterSave) afterSave();

    // Call custom import complete handler if provided
    if (customHandlers && customHandlers.onImportComplete) {
      try {
        await customHandlers.onImportComplete(successfulRecords, apiEndpoint);
      } catch (error) {
        console.error("Error in onImportComplete handler:", error);
      }
    }

  } catch (globalError) {
    console.error("Critical Import error:", globalError);
    PubSub.publish("RECORD_ERROR_TOAST", {
      title: "System Error",
      message: `Failed to initialize import for ${moduleLabel}`,
    });
    throw globalError;
  }
};