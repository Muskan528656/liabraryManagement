/**
 * Created : Aabid
 * Date : Dec-10-25
 */

/**
 * 
 * data              = parsed CSV/Excel rows (UniversalCSVXLSXImporter se)
 * apiEndpoint       = main table ka API endpoint (e.g. "book")
 * formFields        = module ka formFields (DynamicCRUD config se)
 * relatedData       = dropdown data (authors, categories, etc.)
 * moduleLabel       = UI title (Book, Student, etc.)
 * afterSave         = callback after import (fetchData + modal close)
 * existingRecords   = main table ke current records (DynamicCRUD ka data state)
 * importMatchFields = kin DB fields par duplicate check karna hai (e.g. ["isbn"])
 * autoCreateRelated = { optionsKey: { endpoint, labelField, extraPayload } }
 *                     e.g. { categories: { endpoint: "category", labelField: "name" } }
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
}) => {
  try {


    console.log("data =>",data)
    console.log("relatedData =>",relatedData)
    const mainApi = new DataApi(apiEndpoint);

    let createdCount = 0;
    let skippedCount = 0;

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
      const extraPayload = cfg.extraPayload || {}; // e.g. { status: "active" }
      const payload = {
        ...extraPayload,
        [labelField]: labelValue,
      };

      const res = await api.create(payload);
      const created =
        res.data?.data || res.data?.record || res.data || null;
      const newId = created?.id;

      if (newId) {
        index.set(norm, newId);
        return newId;
      }

      return null;
    };

 
    const transformedData = [];

    for (const row of data) {
      const transformed = {};

      for (const key of Object.keys(row)) {
        const rawValue = row[key];

       
        const formField = formFields.find(
          (f) =>
            f.label?.toLowerCase() === key.toLowerCase() ||
            f.name
              ?.toLowerCase()
              .replace(/[^a-z0-9]/g, "") ===
              key.toLowerCase().replace(/[^a-z0-9]/g, "")
        );

        if (!formField) {
         
          const safeKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
          transformed[safeKey] = rawValue;
          continue;
        }

        const fieldName = formField.name;

        console.log("formField", formField.type)

       
        if (formField.type === "select" && formField.options) {
          const optionKey =
            typeof formField.options === "string"
              ? formField.options
              : null;

          if (optionKey) {
            const relatedId = await getOrCreateRelatedId(
              optionKey,
              rawValue
            );
            transformed[fieldName] = relatedId;
          } else {
            transformed[fieldName] = null;
          }
        }
      
        else if (formField.type === "number") {
          const num = parseInt(rawValue, 10);
          transformed[fieldName] = isNaN(num) ? 0 : num;
        }
       
        else {
          transformed[fieldName] = rawValue;
        }
      }

      transformedData.push(transformed);
    }

    
    for (const item of transformedData) {
      // empty row skip
      const hasData = Object.values(item).some(
        (v) => v !== null && v !== undefined && v !== ""
      );
      if (!hasData) {
        skippedCount++;
        continue;
      }

      // duplicate?
      const isDuplicate =
        importMatchFields.length > 0 &&
        existingRecords.some((record) =>
          importMatchFields.every(
            (field) =>
              normalizeText(record[field]) === normalizeText(item[field])
          )
        );

      if (isDuplicate) {
        skippedCount++;
        continue;
      }

      await mainApi.create(item);
      createdCount++;
    }

    PubSub.publish("RECORD_SAVED_TOAST", {
      title: "Import Complete",
      message: `${createdCount} ${moduleLabel.toLowerCase()} record(s) created, ${skippedCount} skipped.`,
    });

    if (afterSave) afterSave();
  } catch (error) {
    console.error("Import error:", error);
    PubSub.publish("RECORD_ERROR_TOAST", {
      title: "Error",
      message: `Failed to import ${moduleLabel} data`,
    });
    throw error;
  }
};
