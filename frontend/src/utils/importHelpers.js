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
 
  try {
 
 
 
 

    const mainApi = new DataApi(apiEndpoint);

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0; // Track actual errors separate from duplicates if needed
    const successfulRecords = []; // Track successfully created records

    const relatedApiCache = {};
    const relatedIndex = {};

 
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
    const getOrCreateRelatedId = async (optionKey, labelValue, rowData = {}) => {
      if (!labelValue) return null;
      const norm = labelValue.toString().trim().toLowerCase();

      buildRelatedIndex(optionKey);
      const index = relatedIndex[optionKey];

      if (index.has(norm)) {
        return index.get(norm);
      }

      // Special handling for books and vendors - check for existing records first
      if (optionKey === 'books' || optionKey === 'vendors') {
 

        // For books, also check ISBN if available
        if (optionKey === 'books' && rowData.isbn) {
          const isbnNorm = rowData.isbn.toString().trim().toLowerCase();
 

          // Check if book exists by ISBN
          const existingBooks = relatedData[optionKey] || [];
          const bookByISBN = existingBooks.find(book =>
            book.isbn && book.isbn.toString().trim().toLowerCase() === isbnNorm
          );

          if (bookByISBN) {
 
            index.set(norm, bookByISBN.id);
            return bookByISBN.id;
          }
        }

        // Check if exists by name/title
        buildRelatedIndex(optionKey);
        if (index.has(norm)) {
          return index.get(norm);
        }

        // If not found, proceed to auto-create if configured
 
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

      // For books, also include ISBN if available in rowData
      if (optionKey === 'books') {
        // Check for ISBN in various possible column names
        const isbnValue = rowData.isbn || rowData.ISBN || rowData.Isbn || rowData['Book ISBN'] || rowData['book isbn'] || rowData['ISBN Number'] || rowData['isbn number'];
        if (isbnValue) {
          payload.isbn = isbnValue;
 
        }
      }

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
 
 
      }

      return null;
    };

 
    const transformedData = [];

 
 
 

    for (const row of data) {
      const transformed = {};
 

      for (const key of Object.keys(row)) {
        const rawValue = row[key];
 

        // Improved field mapping logic
        const formField = formFields.find((f) => {
          if (!f) return false;

          const csvKey = key.toLowerCase().trim();
          const fieldLabel = f.label?.toLowerCase().trim();
          const fieldName = f.name?.toLowerCase().trim();

          // Direct label match
          if (fieldLabel === csvKey) return true;

          // Direct name match (without _id suffix for select fields)
          if (fieldName === csvKey || fieldName === csvKey + '_id') return true;

          // Handle common variations
          if (f.type === 'select') {
            // For select fields, CSV might have "Vendor" but field name is "vendor_id"
            const baseName = fieldName.replace('_id', '');
            if (csvKey === baseName || csvKey.includes(baseName)) return true;
          }

          // Fuzzy matching for common cases
          if (csvKey.includes(fieldLabel) || fieldLabel?.includes(csvKey)) return true;
          if (csvKey.includes(fieldName.replace('_id', '')) || fieldName.replace('_id', '').includes(csvKey)) return true;

          return false;
        });

 

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
            const relatedId = await getOrCreateRelatedId(optionKey, rawValue, row);
            transformed[fieldName] = relatedId;
 

            // For required select fields, warn if ID is null
            if (formField.required && !relatedId) {
              console.warn(`Required field "${fieldName}" could not be resolved for value "${rawValue}". This may cause validation errors.`);
            }
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

 
    let finalData = transformedData;
    if (customHandlers.onImportDataTransform) {
      finalData = customHandlers.onImportDataTransform(transformedData);
    }

 
    for (const item of finalData) {
 
      const hasData = Object.values(item).some(
        (v) => v !== null && v !== undefined && v !== ""
      );
      if (!hasData) {
        skippedCount++;
        continue;
      }

 
 
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

 
      try {
        const result = await mainApi.create(item);
        createdCount++;
        successfulRecords.push({ ...item, id: result.data?.data?.id || result.data?.id }); // Add the created record with ID
      } catch (err) {
 
 
        if (err.response && (err.response.status === 400 || err.response.status === 409 || err.response.status === 422)) {
          console.warn("Skipping row due to server validation/duplicate:", item, err.response.data);
          skippedCount++;
        } else {
 
 
          console.error("Critical error saving row:", err);
          errorCount++;
        }
      }
    }

 

    let message = `Import Processed: ${createdCount} created.`;
    if (skippedCount > 0) message += ` ${skippedCount} skipped (duplicate/empty).`;
    if (errorCount > 0) message += ` ${errorCount} failed.`;

 
    if (createdCount > 0) {
      PubSub.publish("RECORD_SAVED_TOAST", {
        title: "Import Complete",
        message: message,
      });
    } else if (skippedCount > 0 && errorCount === 0) {
 
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