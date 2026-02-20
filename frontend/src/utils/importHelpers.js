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

    console.log('data = ', data);
    console.log('apiEndpoint = ', apiEndpoint);
    console.log('formFields = ', formFields);

    const mainApi = new DataApi(apiEndpoint);

    // For vendor imports, ensure we have existing vendors data for duplicate checking
    if (apiEndpoint === 'vendors' && (!relatedData.vendors || relatedData.vendors.length === 0)) {
      try {
        const vendorApi = new DataApi('vendors');
        const existingVendors = await vendorApi.fetchAll();
        relatedData.vendors = existingVendors.data?.data || existingVendors.data || [];
        console.log('Fetched existing vendors for duplicate checking:', relatedData.vendors.length);
      } catch (error) {
        console.warn('Failed to fetch existing vendors for duplicate checking:', error);
      }
    }

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

        // For vendors, also check email if available
        if (optionKey === 'vendors' && rowData.email) {
          const emailNorm = rowData.email.toString().trim().toLowerCase();
          const existingVendors = relatedData[optionKey] || [];
          const vendorByEmail = existingVendors.find(vendor =>
            vendor.email && vendor.email.toString().trim().toLowerCase() === emailNorm
          );
          if (vendorByEmail) {
            index.set(norm, vendorByEmail.id);
            return vendorByEmail.id;
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

      console.log("api",api);
      

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

      // For vendors, also include email if available in rowData
      if (optionKey === 'vendors') {
        // Check for email in various possible column names
        const emailValue = rowData.email || rowData.Email || rowData['Vendor Email'] || rowData['vendor email'] || rowData['Email Address'] || rowData['email address'];
        if (emailValue) {
          payload.email = emailValue;
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

    console.log('Starting transformation for data rows:', data.length);
    console.log('CSV headers found:', Object.keys(data[0] || {}));

    for (const row of data) {
      const transformed = {};

      console.log('Processing row:', row);

      for (const key of Object.keys(row)) {
        const rawValue = row[key];

        console.log(`Processing CSV key: "${key}", rawValue: "${rawValue}"`);

        // Field mapping logic - handle both array and object formats
        let fieldName = null;
        let fieldType = 'text';
        let optionKey = null;
        let isRequired = false;

        const csvKey = key.toLowerCase().trim();

        // if (Array.isArray(formFields)) {
        //   // Array format: [{ name, label, type, options, required }, ...] or [{ field, label, ... }]

        //   const formField = formFields.find((f) => {
        //     if (!f) return false;

        //     const fieldLabel = f.label?.toLowerCase().trim();
        //     const fieldNameCheck = (f.name || f.field)?.toLowerCase().trim(); // Support both 'name' and 'field' properties

        //     // Priority 1: Exact label match
        //     if (fieldLabel === csvKey) {
        //       return true;
        //     }

        //     // Priority 2: Exact name/field match (without _id suffix for select fields)
        //     if (fieldNameCheck === csvKey || fieldNameCheck === csvKey + '_id') {
        //       return true;
        //     }

        //     // Priority 3: Handle select fields with base name matching
        //     if (f.type === 'select') {
        //       const baseName = fieldNameCheck.replace('_id', '');
        //       if (csvKey === baseName) {
        //         return true;
        //       }
        //     }

        //     // Priority 4: Strict fuzzy matching - only if CSV header contains ALL words from field label
        //     const labelWords = fieldLabel?.split(/\s+/).filter(w => w.length > 0) || [];
        //     if (labelWords.length > 0) {
        //       const allLabelWordsInCsv = labelWords.every(word => csvKey.includes(word));
        //       if (allLabelWordsInCsv) {
        //         return true;
        //       }
        //     }

        //     // Priority 5: Check if CSV key words are all in field name (for compound field names)
        //     const csvWords = csvKey.split(/_+/).filter(w => w.length > 0);
        //     if (csvWords.length > 1) { // Only apply for compound CSV keys like 'company_name'
        //       const allCsvWordsInField = csvWords.every(word => fieldNameCheck.includes(word));
        //       if (allCsvWordsInField) {
        //         return true;
        //       }
        //     }

        //     return false;
        //   });

        //   if (formField) {
        //     fieldName = formField.name || formField.field; // Support both 'name' and 'field' properties
        //     fieldType = formField.type || 'text';
        //     optionKey = typeof formField.options === "string" ? formField.options : null;
        //     isRequired = formField.required || false;
        //   }
        // } else {
        //   // Object format: { fieldName: fieldLabel }
        //   // Find all possible matches, then pick the best one
        //   const possibleMatches = [];

        //   Object.keys(formFields).forEach(key => {
        //     const fieldLabel = formFields[key].toLowerCase().trim();

        //     // Priority 1: Exact label match (highest priority)
        //     if (fieldLabel === csvKey) {
        //       possibleMatches.push({ key, priority: 1, labelLength: fieldLabel.length });
        //       return;
        //     }

        //     // Priority 2: Exact name match
        //     if (key === csvKey) {
        //       possibleMatches.push({ key, priority: 2, labelLength: fieldLabel.length });
        //       return;
        //     }

        //     // Priority 3: Field label is fully contained in CSV header
        //     if (csvKey.includes(fieldLabel)) {
        //       possibleMatches.push({ key, priority: 3, labelLength: fieldLabel.length });
        //       return;
        //     }

        //     // Priority 4: CSV header is fully contained in field label
        //     if (fieldLabel.includes(csvKey)) {
        //       possibleMatches.push({ key, priority: 4, labelLength: fieldLabel.length });
        //       return;
        //     }

        //     // Priority 5: All words from field label are in CSV header
        //     const labelWords = fieldLabel.split(/\s+/).filter(w => w.length > 0);
        //     if (labelWords.length > 0) {
        //       const allLabelWordsInCsv = labelWords.every(word => csvKey.includes(word));
        //       if (allLabelWordsInCsv) {
        //         possibleMatches.push({ key, priority: 5, labelLength: fieldLabel.length });
        //       }
        //     }

        //     // Debug logging for company_name field
        //     if (key === 'company_name') {
        //       console.log('Debug company_name mapping (object format):', {
        //         csvKey,
        //         fieldLabel,
        //         key,
        //         exactLabelMatch: fieldLabel === csvKey,
        //         exactNameMatch: key === csvKey,
        //         csvContainsLabel: csvKey.includes(fieldLabel),
        //         labelContainsCsv: fieldLabel.includes(csvKey)
        //       });
        //     }
        //   });

        //   // Sort by priority (lower number = higher priority), then by label length (longer = better)
        //   possibleMatches.sort((a, b) => {
        //     if (a.priority !== b.priority) return a.priority - b.priority;
        //     return b.labelLength - a.labelLength; // Prefer longer labels for same priority
        //   });

        //   const matchingFieldName = possibleMatches.length > 0 ? possibleMatches[0].key : null;

        //   // Additional debug for company_name
        //   if (matchingFieldName === 'company_name' || csvKey.includes('company')) {
        //     console.log('Company name mapping result:', {
        //       csvKey,
        //       matchingFieldName,
        //       possibleMatches: possibleMatches.map(m => ({ key: m.key, priority: m.priority }))
        //     });
        //   }

        //   if (matchingFieldName) {
        //     fieldName = matchingFieldName;
        //     // Determine type based on field name patterns
        //     if (matchingFieldName.includes('status') || matchingFieldName.includes('country_code') ||
        //         matchingFieldName.includes('state') || matchingFieldName.includes('city')) {
        //       fieldType = 'select';
        //     } else {
        //       fieldType = 'text';
        //     }
        //     // For object format, assume no related entities (optionKey = null)
        //     optionKey = null;
        //     isRequired = false;
        //   }
        // }

        if (Array.isArray(formFields)) {
  // ============================
  // ARRAY FORMAT (SAFE VERSION)
  // ============================

  const formField = formFields.find((f) => {
    if (!f) return false;

    const fieldLabel = f.label?.toLowerCase().trim();
    const fieldNameCheck = (f.name || f.field)?.toLowerCase().trim();

    // ✅ STRICT EXACT LABEL MATCH
    if (fieldLabel === csvKey) return true;

    // ✅ STRICT EXACT NAME MATCH
    if (fieldNameCheck === csvKey) return true;

    // ✅ Allow name_id match (for select fields)
    if (fieldNameCheck === csvKey.replace("_id", "")) return true;

    return false; // 🚫 No fuzzy matching
  });

  if (formField) {
    fieldName = formField.name || formField.field;
    fieldType = formField.type || "text";
    optionKey =
      typeof formField.options === "string" ? formField.options : null;
    isRequired = formField.required || false;
  }

} else {
  // ============================
  // OBJECT FORMAT (SAFE VERSION)
  // ============================

  const possibleMatches = [];

  Object.keys(formFields).forEach((key) => {
    const fieldLabel = formFields[key]?.toLowerCase().trim();
    const fieldKey = key?.toLowerCase().trim();

    // ✅ STRICT EXACT LABEL MATCH
    if (fieldLabel === csvKey) {
      possibleMatches.push({
        key,
        priority: 1,
        labelLength: fieldLabel.length,
      });
      return;
    }

    // ✅ STRICT EXACT FIELD NAME MATCH
    if (fieldKey === csvKey) {
      possibleMatches.push({
        key,
        priority: 2,
        labelLength: fieldLabel.length,
      });
      return;
    }

    // 🚫 REMOVED ALL FUZZY MATCHING
    // No includes()
    // No partial word match
    // No word-every-match logic
  });

  // Sort by priority only
  possibleMatches.sort((a, b) => a.priority - b.priority);

  const matchingFieldName =
    possibleMatches.length > 0 ? possibleMatches[0].key : null;

  if (matchingFieldName) {
    fieldName = matchingFieldName;

    // Safe type detection
    if (
      matchingFieldName.includes("status") ||
      matchingFieldName.includes("country_code") ||
      matchingFieldName.includes("state") ||
      matchingFieldName.includes("city")
    ) {
      fieldType = "select";
    } else {
      fieldType = "text";
    }

    optionKey = null;
    isRequired = false;
  }
}


        if (!fieldName) {
          const safeKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
          transformed[safeKey] = rawValue;
          continue;
        }

        if (fieldType === "select" && optionKey) {
          // This is a related entity select field (e.g., vendor_id, company_id)
          console.log("optionKey =>",optionKey);
          console.log("rawValue =>",);
          console.log("row =>",row);
          
          const relatedId = await getOrCreateRelatedId(optionKey, rawValue, row);
          transformed[fieldName] = relatedId;

          // For required select fields, warn if ID is null
          if (isRequired && !relatedId) {
            console.warn(`Required field "${fieldName}" could not be resolved for value "${rawValue}". This may cause validation errors.`);
          }
        } else if (fieldType === "select") {
          // This is a direct value select field (e.g., country_code, status)
          // Set the value directly from CSV
          transformed[fieldName] = rawValue;
        } else if (fieldType === "number") {
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

    // For vendor imports, deduplicate by email to prevent duplicates within the same import batch
    if (apiEndpoint === 'vendors') {
      const emailMap = new Map();
      finalData = finalData.filter(item => {
        if (!item.email) return true; // Keep items without email
        const emailKey = item.email.toString().trim().toLowerCase();
        if (emailMap.has(emailKey)) {
          console.log('Skipping duplicate vendor in import batch:', item.email);
          return false; // Skip duplicate
        }
        emailMap.set(emailKey, true);
        return true; // Keep first occurrence
      });
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

      // Special duplicate check for vendor imports using email
      const isVendorDuplicateByEmail =
        apiEndpoint === 'vendors' &&
        item.email &&
        Array.isArray(relatedData.vendors) &&
        relatedData.vendors.some(vendor =>
          vendor.email && vendor.email.toString().trim().toLowerCase() === item.email.toString().trim().toLowerCase()
        );

      if (isClientSideDuplicate || isVendorDuplicateByEmail) {
        skippedCount++;
        continue; // Skip without hitting API
      }

 
      try {
        const result = await mainApi.create(item);
        createdCount++;
        successfulRecords.push({ ...item, id: result.data?.data?.id || result.data?.id }); // Add the created record with ID
      } catch (err) {

        console.log("Error response details:", {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
          fullError: err
        });

        // Check for any error status that might indicate a duplicate
        if (err.response) {
          const status = err.response.status;
          const errorMessage = err.response.data?.message || err.response.data?.error || '';
          const errorData = JSON.stringify(err.response.data || {});
          const fullErrorText = errorData + ' ' + errorMessage;

          console.log("Full error analysis:", {
            status,
            errorMessage,
            errorData,
            fullErrorText
          });

          // Check for duplicate indicators in any status code
          const isDuplicate = fullErrorText.toLowerCase().includes('duplicate') ||
                             fullErrorText.toLowerCase().includes('already exists') ||
                             fullErrorText.toLowerCase().includes('unique constraint') ||
                             fullErrorText.toLowerCase().includes('already exist') ||
                             fullErrorText.toLowerCase().includes('exists');

          console.log("Duplicate detection result:", {
            isDuplicate,
            status,
            fullErrorText: fullErrorText.substring(0, 200) // First 200 chars
          });

          if (isDuplicate) {
            console.warn("Skipping duplicate row:", item);
            PubSub.publish("RECORD_ERROR_TOAST", {
              title: "Duplicate Entry",
              message: "This record already exists and was skipped.",
            });
            skippedCount++;
          } else if (status === 400 || status === 409 || status === 422) {
            console.warn("Skipping row due to validation error:", item, err.response.data);
            skippedCount++;
          } else {
            console.error("Unexpected error status:", status, err.response.data);
            errorCount++;
          }
        } else {
          console.error("Critical error saving row (no response):", err);
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