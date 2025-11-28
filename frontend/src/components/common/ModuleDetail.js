import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Form,
  Modal,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import DataApi from "../../api/dataApi";
import Loader from "./Loader";
import ScrollToTop from "./ScrollToTop";
import PubSub from "pubsub-js";
import { useLocation } from "react-router-dom";
import ConfirmationModal from "./ConfirmationModal";

const LOOKUP_ENDPOINT_MAP = {
  authors: "author",
  author: "author",
  categories: "category",
  category: "category",
  users: "user",
  user: "user",
  states: "state",
  state: "state",
  cities: "city",
  city: "city",
  vendors: "vendor",
  vendor: "vendor",
  roles: "user-role",
  "user-role": "user-role",
  "userroles": "user-role",
  modules: "module",
  module: "module",
  departments: "department",
  department: "department",
  libraries: "library",
  library: "library",
  subscriptions: "subscriptions",
  subscription: "subscriptions",
};

const normalizeListResponse = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data?.data) {
    return Array.isArray(payload.data.data) ? payload.data.data : [];
  }
  if (Array.isArray(payload.rows)) return payload.rows;
  if (payload.records && Array.isArray(payload.records)) return payload.records;
  return [];
};

const getOptionValue = (option = {}) => {
  return (
    option.id ??
    option.value ??
    option.code ??
    option.uuid ??
    option.email ??
    option.key ??
    option.slug ??
    option.name ??
    option.label ??
    option.firstname ??
    option.lastname ??
    ""
  );
};

const getOptionDisplayLabel = (option = {}) => {
  if (option.label) return option.label;
  if (option.name) return option.name;
  if (option.title) return option.title;
  if (option.firstname || option.lastname) {
    const composed = `${option.firstname || ""} ${option.lastname || ""}`.trim();
    if (composed) return composed;
  }
  if (option.email) return option.email;
  if (option.value) return option.value;
  if (option.id) return option.id;
  return "Item";
};

const toStringSafe = (value) => {
  if (value === undefined || value === null) return "";
  return value.toString();
};

const ModuleDetail = ({
  moduleName,
  moduleApi,
  moduleLabel,
  icon,
  fields,
  relatedModules = [],
  customHeader = null,
  customSections = [],
  bookStatistics = [],
  customActions = [],
  onEdit = null,
  onDelete = null,
  imageField = null,
  imageUrl = null,
  lookupNavigation = {},
  externalData = {},
  setIsEditable,
}) => {
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [relatedData, setRelatedData] = useState({});
  const [isEditing, setIsEditing] = useState(location?.state?.isEdit ? location?.state?.isEdit : false);
  const [tempData, setTempData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lookupOptions, setLookupOptions] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [userNames, setUserNames] = useState({});
  const [userAvatars, setUserAvatars] = useState({});

  const moduleNameFromUrl = window.location.pathname.split("/")[1];

  const nonEditableFields = useMemo(() => [
    'createdbyid', 'createddate', 'lastmodifiedbyid', 'lastmodifieddate',
    'created_by', 'created_at', 'modified_by', 'modified_at',
    'createdby', 'createdat', 'lastmodifiedby', 'lastmodifiedat'
  ], []);

  const allFieldGroups = useMemo(() => {
    const groups = [];
    const appendFields = (list) => {
      if (Array.isArray(list)) {
        groups.push(...list);
      }
    };
    appendFields(fields?.overview);
    appendFields(fields?.details);
    appendFields(fields?.other);
    appendFields(fields?.address);
    return groups;
  }, [fields]);

  const selectOptionKeys = useMemo(() => {
    const keys = new Set();
    allFieldGroups.forEach((field) => {
      if (field?.type === "select" && typeof field.options === "string") {
        keys.add(field.options);
      }
    });
    return Array.from(keys);
  }, [allFieldGroups]);

  const UserAvatar = ({ userId, size = 32, showName = true, clickable = true }) => {
    const userName = userNames[userId] || `User ${userId}`;
    const userAvatar = userAvatars[userId] || `https://ui-avatars.com/api/?name=User&background=6f42c1&color=fff&size=${size}`;

    const handleUserClick = () => {
      if (clickable && userId) {
        navigate(`/user/${userId}`);
      }
    };

    return (
      <div
        className={`d-flex align-items-center ${clickable ? 'cursor-pointer' : ''}`}
        onClick={handleUserClick}
        style={{
          cursor: clickable ? 'pointer' : 'default',
          textDecoration: 'none',
          gap: '8px'
        }}
      >
        <img
          src={userAvatar}
          alt={userName}
          className="rounded-circle"
          style={{
            width: size,
            height: size,
            objectFit: 'cover',
            border: '2px solid #e9ecef'
          }}
        />
        {showName && (
          <span
            className="fw-medium"
            style={{
              color: clickable ? 'var(--primary-color)' : '#495057',
              textDecoration: clickable ? 'none' : 'none'
            }}
            onMouseEnter={(e) => {
              if (clickable) e.target.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              if (clickable) e.target.style.textDecoration = 'none';
            }}
          >
            {userName}
          </span>
        )}
      </div>
    );
  };

  const fetchUserNames = async (userIds) => {
    try {
      const userApi = new DataApi("user");
      const names = {};
      const avatars = {};

      const uniqueUserIds = [...new Set(userIds.filter(id => id && id !== ''))];

      for (const userId of uniqueUserIds) {
        try {
          const response = await userApi.fetchById(userId);
          if (response && response.data) {
            const user = response.data.success ? response.data.data : response.data;
            if (user) {
              const fullName = `${user.firstname || ''} ${user.lastname || ''}`.trim();
              names[userId] = fullName || user.email || `User ${userId}`;

              if (user.profile_picture) {
                avatars[userId] = user.profile_picture;
              } else {
                const initials = fullName
                  ? fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                  : 'U';
                avatars[userId] = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'User')}&background=6f42c1&color=fff&size=32`;
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
          names[userId] = `User ${userId}`;
          avatars[userId] = `https://ui-avatars.com/api/?name=User&background=6f42c1&color=fff&size=32`;
        }
      }

      setUserNames(prev => ({ ...prev, ...names }));
      setUserAvatars(prev => ({ ...prev, ...avatars }));
    } catch (error) {
      console.error("Error fetching user names:", error);
    }
  };

  const fetchData = async () => {
    try {
      const api = new DataApi(moduleApi);
      const response = await api.fetchById(id);
      console.log(`Fetched `, response);
      if (response && response.data) {
        const responseData = response.data;
        if (responseData.success && responseData.data) {
          setData(responseData.data);
        } else if (
          responseData.data &&
          responseData.data.success &&
          responseData.data.data
        ) {
          setData(responseData.data.data);
        } else if (responseData.data) {
          setData(responseData.data);
        } else if (responseData.id) {
          setData(responseData);
        } else if (Array.isArray(responseData) && responseData.length > 0) {
          setData(responseData[0]);
        } else {
          setData(responseData);
        }
      } else {
        throw new Error("No response received from API");
      }
    } catch (error) {
      console.error(`Error fetching ${moduleLabel}:`, error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: `Failed to fetch ${moduleLabel} details`,
      });
    }
  };

  const fetchRelatedData = async () => {
    try {
      const relatedDataObj = {};
      const normalizedModules = relatedModules.map((module) => {
        if (typeof module === "string") {
          return {
            key: module,
            api: module,
            label: module.charAt(0).toUpperCase() + module.slice(1),
          };
        }
        return module;
      });

      for (const relatedModule of normalizedModules) {
        try {
          if (!relatedModule.api) continue;
          const api = new DataApi(relatedModule.api);
          const response = await api.get(
            relatedModule.endpoint ? relatedModule.endpoint(id) : `/${id}`
          );
          if (response && response.data) {
            const responseData = response.data.success
              ? response.data.data
              : response.data;
            relatedDataObj[relatedModule.key] = Array.isArray(responseData)
              ? responseData
              : [responseData];
          }
        } catch (error) {
          console.error(
            `Error fetching related ${relatedModule.label || relatedModule.key}:`,
            error
          );
          relatedDataObj[relatedModule.key] = [];
        }
      }
      setRelatedData(relatedDataObj);
    } catch (error) {
      console.error("Error fetching related data:", error);
    }
  };

  useEffect(() => {
    console.log("ModuleDetail useEffect running with:", {
      id,
      moduleApi,
      moduleName,
    });

    const loadData = async () => {
      try {
        setLoading(true);
        await fetchData();

        if (relatedModules.length > 0) {
          await fetchRelatedData();
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id && moduleApi) {
      loadData();
    } else {
      console.error("Missing id or moduleApi:", { id, moduleApi });
      setLoading(false);
    }
  }, [id, moduleApi, moduleLabel]);

  useEffect(() => {
    if (data) {
      const userIds = [];

      if (data.createdbyid) userIds.push(data.createdbyid);
      if (data.lastmodifiedbyid) userIds.push(data.lastmodifiedbyid);
      if (data.created_by) userIds.push(data.created_by);
      if (data.modified_by) userIds.push(data.modified_by);

      Object.keys(data).forEach(key => {
        if (key.includes('user') || key.includes('byid') || key.includes('by_id')) {
          const value = data[key];
          if (value && typeof value === 'string' && value.trim() !== '') {
            userIds.push(value);
          }
        }
      });

      if (userIds.length > 0) {
        fetchUserNames(userIds);
      }
    }
  }, [data]);

  useEffect(() => {
    let isMounted = true;

    const loadLookupData = async () => {
      if (selectOptionKeys.length === 0) {
        return;
      }

      const fetchedOptions = {};
      for (const key of selectOptionKeys) {
        if (externalData && Array.isArray(externalData[key])) {
          continue;
        }
        try {
          const endpoint = LOOKUP_ENDPOINT_MAP[key] || key;
          const api = new DataApi(endpoint);
          const response = await api.fetchAll();
          const payload = response?.data ?? [];
          fetchedOptions[key] = normalizeListResponse(payload);
        } catch (error) {
          console.error(`Error fetching lookup data for ${key}:`, error);
          fetchedOptions[key] = [];
        }
      }

      if (isMounted && Object.keys(fetchedOptions).length > 0) {
        setLookupOptions((prev) => ({ ...prev, ...fetchedOptions }));
      }
    };

    loadLookupData();

    return () => {
      isMounted = false;
    };
  }, [selectOptionKeys, externalData]);

  const normalizeLookupPath = (path = "") => {
    return path.replace(/^\/+|\/+$/g, "");
  };

  const getLookupTargetId = (lookupConfig = {}, record = {}) => {
    if (typeof lookupConfig.idResolver === "function") {
      return lookupConfig.idResolver(record);
    }

    if (
      lookupConfig.idField &&
      Object.prototype.hasOwnProperty.call(record, lookupConfig.idField)
    ) {
      return record[lookupConfig.idField];
    }

    if (
      lookupConfig.moduleIdField &&
      Object.prototype.hasOwnProperty.call(record, lookupConfig.moduleIdField)
    ) {
      return record[lookupConfig.moduleIdField];
    }

    if (lookupConfig.module) {
      const fallbackField = `${lookupConfig.module.replace(/s$/, "")}_id`;
      if (Object.prototype.hasOwnProperty.call(record, fallbackField)) {
        return record[fallbackField];
      }
    }

    return record.id;
  };

  const getLookupLabel = (value, record, lookupConfig = {}) => {
    if (typeof lookupConfig.labelResolver === "function") {
      return lookupConfig.labelResolver(record);
    }

    if (
      lookupConfig.labelField &&
      Object.prototype.hasOwnProperty.call(record, lookupConfig.labelField)
    ) {
      return record[lookupConfig.labelField] ?? value;
    }

    return value ?? "—";
  };

  const getSelectOptions = useCallback(
    (field) => {
      if (!field || field.type !== "select" || !field.options) {
        return [];
      }
      if (Array.isArray(field.options)) {
        return field.options;
      }
      return (
        externalData?.[field.options] ||
        lookupOptions?.[field.options] ||
        []
      );
    },
    [externalData, lookupOptions]
  );

  const handleLookupNavigation = (lookupConfig, record, event = null) => {
    if (event) {
      event.preventDefault();
    }

    if (!lookupConfig) return;

    const targetId = getLookupTargetId(lookupConfig, record);
    if (!targetId) return;

    const basePath = lookupConfig.path || lookupConfig.module;
    if (!basePath) return;

    const finalPath = normalizeLookupPath(basePath);
    if (!finalPath) return;

    const targetUrl = `/${finalPath}/${targetId}`;

    if (lookupConfig.newTab) {
      window.open(targetUrl, "_blank");
      return;
    }

    navigate(targetUrl);
  };

  const formatValue = (value, field) => {
    if (value === null || value === undefined || value === "") return "—";

    console.log(
      `Formatting field: ${field.key}, value:`,
      value,
      "type:",
      field.type
    );

    if (field.key.includes('user') || field.key.includes('byid') || field.key.includes('by_id')) {
      const userId = value;
      if (userId && userNames[userId]) {
        return (
          <UserAvatar
            userId={userId}
            size={32}
            showName={true}
            clickable={true}
          />
        );
      }
    }

    const lookupConfig = lookupNavigation && lookupNavigation[field.key];
    if (lookupConfig && data) {
      const targetId = getLookupTargetId(lookupConfig, data);
      if (targetId) {
        const label = getLookupLabel(value, data, lookupConfig);
        return (
          <a
            href="#"
            onClick={(e) => handleLookupNavigation(lookupConfig, data, e)}
            style={{
              color: "var(--primary-color)",
              textDecoration: "none",
              fontWeight: "500",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
          >
            {label}
          </a>
        );
      }
    }

    if (field.type === "date") {
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return value;
      }
    }
    if (field.type === "datetime") {
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    }
    if (field.type === "boolean") {
      return value ? "Yes" : "No";
    }
    if (field.type === "badge") {
      const badgeConfig = field.badgeConfig || {};
      const bgColor = badgeConfig[value] || (value ? "success" : "secondary");
      const label =
        badgeConfig[`${value}_label`] || (value ? "Active" : "Inactive");
      return <Badge bg={bgColor}>{label}</Badge>;
    }
    if (field.type === "currency") {
      return `₹${parseFloat(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    if (field.type === "number") {
      return parseFloat(value).toLocaleString("en-IN");
    }
    if (field.render && typeof field.render === "function") {
      return field.render(value, data);
    }
    return String(value);
  };

  console.log("Location state:", location?.state);
  useEffect(() => {
    setTempData(location?.state?.rowData);
  }, [location?.state?.isEdit]);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(data);
    } else {
      setIsEditing(true);
      setTempData({ ...data });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const api = new DataApi(moduleApi);
      const response = await api.update(tempData, id);

      if (response && response.data) {
        await fetchData();
        PubSub.publish("RECORD_SAVED_TOAST", {
          title: "Success",
          message: `${moduleLabel} updated successfully`,
        });

        setIsEditing(false);
        setTempData(null);
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      console.error(`Error updating ${moduleLabel}:`, error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: `Failed to update ${moduleLabel}: ${error.message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempData(null);
  };

  const handleFieldChange = (fieldKey, value) => {
    if (isEditing && tempData) {
      let updatedData = {
        ...tempData,
        [fieldKey]: value,
      };

      if (moduleName === 'purchase') {
        if (fieldKey === 'quantity' || fieldKey === 'unit_price') {
          const quantity = parseFloat(updatedData.quantity) || 0;
          const unitPrice = parseFloat(updatedData.unit_price) || 0;
          const totalAmount = quantity * unitPrice;

          updatedData.total_amount = totalAmount.toFixed(2);
        }
      }

      setTempData(updatedData);
    }
  };

  const getFieldValue = (field, currentData) => {
    if (!currentData) return "";
    const value = currentData[field.key];

    if (isEditing) {
      if (field.type === "date" && value) {
        try {
          const date = new Date(value);
          return date.toISOString().split("T")[0]; 
        } catch {
          return value;
        }
      }
      if (field.type === "datetime" && value) {
        try {
          const date = new Date(value);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch {
          return value;
        }
      }
      return value || "";
    } else {
      return formatValue(value, field) || "—";
    }
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    try {
      const api = new DataApi(moduleApi);
      await api.delete(id);
      PubSub.publish("RECORD_SAVED_TOAST", {
        title: "Success",
        message: `${moduleLabel} deleted successfully`,
      });
      navigate(`/${moduleName}`);
    } catch (error) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: `Failed to delete ${moduleLabel} ${error.message}`,
      });
    }
  };

  const confirmDeleteRecord = async () => {
    try {
      setDeleteLoading(true);
      const api = new DataApi(moduleApi);
      await api.delete(id);
      PubSub.publish("RECORD_SAVED_TOAST", {
        title: "Success",
        message: `${moduleLabel} deleted successfully`,
      });
      navigate(`/${moduleName}`);
    } catch (error) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: `Failed to delete ${moduleLabel} ${error.message}`,
      });
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };
  const handleBack = () => {
    navigate(`/${moduleName}`);
  };

  if (loading) {
    return (
      <Container fluid>
        <ScrollToTop />
      </Container>
    );
  }

  if (!data) {
    return (
      <Container fluid>
        <ScrollToTop />
        <Card>
          <Card.Body className="text-center">
            <h4>No Data Found</h4>
            <p>Unable to load {moduleLabel} details.</p>
            <Button
              variant="primary"
              onClick={() => navigate(`/${moduleName}`)}
            >
              Back to List
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  console.log("Fields before normalization:", fields);
  const normalizedFields = {
    details: fields?.details || [],
  };

  const normalizedOtherFields = {
    other: fields?.other || [],
  };

  const normalizedAddressFields = {
    address: fields?.address || [],
  };

  const splitInto3 = (arr = []) => {
    const col1 = [];
    const col2 = [];
    const col3 = [];

    arr.forEach((item, index) => {
      if (index % 3 === 0) col1.push(item);
      else if (index % 3 === 1) col2.push(item);
      else col3.push(item);
    });

    return [col1, col2, col3];
  };

  const [col1, col2, col3] = splitInto3(normalizedFields.details);
  const [colother1, colother2, colother3] = splitInto3(normalizedOtherFields.other);
  const [coladd1, coladd2, coladd3] = splitInto3(normalizedAddressFields?.address);

  const renderField = (field, index, currentData) => {
    const isNonEditableField = nonEditableFields.includes(field.key);

    const shouldShowAsReadOnly = isEditing && isNonEditableField;

    if ((!isEditing || shouldShowAsReadOnly) && (field.key.includes('user') || field.key.includes('byid') || field.key.includes('by_id'))) {
      const userId = currentData ? currentData[field.key] : null;
      if (userId) {
        return (
          <Form.Group key={index} className="mb-3">
            <Form.Label className="fw-semibold">
              {field.label}
            </Form.Label>
            <div className="form-control-plaintext p-0 border-0">
              <UserAvatar
                userId={userId}
                size={36}
                showName={true}
                clickable={true}
              />
            </div>
          </Form.Group>
        );
      }
    }

    if (field.type === "select" && field.options) {
      const options = getSelectOptions(field);
      const rawValue = currentData ? currentData[field.key] : null;
      const currentValue = rawValue === undefined || rawValue === null ? "" : rawValue.toString();

      return (
        <Form.Group key={index} className="mb-3">
          <Form.Label className="fw-semibold">
            {field.label}
          </Form.Label>
          {isEditing && !isNonEditableField ? (
            <Form.Select
              value={currentValue}
              onChange={(e) => handleFieldChange(field.key, e.target.value || null)}
            >
              <option value="">Select {field.label}</option>
              {options.map((option) => {
                const optionId = getOptionValue(option);
                const optionLabel = getOptionDisplayLabel(option);
                return (
                  <option key={optionId} value={optionId}>
                    {optionLabel}
                  </option>
                );
              })}
            </Form.Select>
          ) : (
            <Form.Control
              type="text"
              readOnly
              value={(() => {
                if (field.displayKey && data) return data[field.displayKey] || "—";
                const selected = options.find((opt) => {
                  const optionValue = toStringSafe(getOptionValue(opt));
                  const optValue = opt.id || opt.value || opt.role_name || opt.name;
                  return optionValue === currentValue || toStringSafe(optValue) === currentValue;
                });
                return selected ? getOptionDisplayLabel(selected) : (field.displayKey && data ? (data[field.displayKey] || "—") : "—");
              })()}
              style={{
                pointerEvents: "none",
                opacity: 0.9,
              }}
            />
          )}
        </Form.Group>
      );
    }

    const fieldValue = getFieldValue(field, currentData);
    const isElementValue = React.isValidElement(fieldValue);
    const controlType = (isEditing && !isNonEditableField)
      ? field.type === "number"
        ? "number"
        : field.type === "date"
          ? "date"
          : field.type === "datetime"
            ? "datetime-local"
            : "text"
      : "text";

    if ((!isEditing || shouldShowAsReadOnly) && isElementValue) {
      return (
        <Form.Group key={index} className="mb-3">
          <Form.Label className="fw-semibold">
            {field.label}
          </Form.Label>
          <div className="form-control-plaintext">
            {fieldValue}
          </div>
        </Form.Group>
      );
    }

    return (
      <Form.Group key={index} className="mb-3">
        <Form.Label className="fw-semibold">
          {field.label}
        </Form.Label>
        <Form.Control
          type={controlType}
          value={isElementValue ? "" : fieldValue ?? ""}
          readOnly={!isEditing || isNonEditableField}
          onChange={(e) => {
            if (!isEditing || isNonEditableField) return;

            let newValue = e.target.value;
            if (field.type === "number")
              newValue = newValue ? parseFloat(newValue) : null;
            if (field.type === "datetime")
              newValue = new Date(newValue).toISOString();

            handleFieldChange(field.key, newValue);
          }}
          style={{
            pointerEvents: (isEditing && !isNonEditableField) ? "auto" : "none",
            opacity: (isEditing && !isNonEditableField) ? 1 : 0.9,
            backgroundColor: isNonEditableField && isEditing ? '#f8f9fa' : 'white',
          }}
        />
        {isNonEditableField && isEditing && (
          <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
            This field cannot be edited
          </Form.Text>
        )}
      </Form.Group>
    );
  };

  return (
    <>
      <Container fluid className="py-4">
        <ScrollToTop />

        <Row className="justify-content-center">
          <Col lg={12} xl={12}>
            <Card className="border-0 shadow-sm detail-h4">
              <Card.Body>

                <div
                  className="d-flex justify-content-between align-items-center mb-4 p-2"
                  style={{
                    color: "var(--primary-color)",
                    background: "var(--primary-background-color)",
                    borderRadius: "10px",
                  }}
                >

                  <div className="d-flex align-items-center gap-3">
                    <button
                      onClick={handleBack}
                      className="shadow-sm d-flex align-items-center justify-content-center custom-btn-back"
                    >
                      <i className="fa-solid fa-arrow-left"></i>
                    </button>

                    <h5 className="fw-bold mb-0" style={{ color: "var(--primary-color)" }}>
                      {icon && <i className={`${icon} me-2 fs-6`}></i>}
                      {moduleLabel} Details
                    </h5>
                  </div>

                  {/* Right Side - Action Buttons */}
                  <div className="d-flex gap-2">
                    {!isEditing ? (
                      <>
                        <button className="custom-btn-primary" onClick={handleEdit}>
                          <i className="fa-solid fa-edit me-2"></i>
                          Edit {moduleLabel}
                        </button>
                        <button className="custom-btn-delete-detail" onClick={handleDelete}>
                          <i className="fa-solid fa-trash me-2"></i>
                          Delete
                        </button>
                      </>
                    ) : (
                      <div className="d-flex gap-2">
                        <button className="custom-btn-primary" onClick={handleSave} disabled={saving}>
                          <i className="fa-solid fa-check me-2"></i>
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button className="custom-btn-secondary" onClick={handleCancel} disabled={saving}>
                          <i className="fa-solid fa-times me-2"></i>
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {/* Details Section */}
                <Row className="mt-4">
                  <Col md={12} className="mb-4">
                    <h6 className="fw-bold mb-0 d-flex align-items-center justify-content-between p-3 border rounded"
                      style={{
                        color: "var(--primary-color)",
                        background: "var(--header-highlighter-color)",
                        borderRadius: "10px",
                      }}>
                      {moduleLabel} Information
                    </h6>
                  </Col>
                  <Row className="px-5">
                    {normalizedFields && normalizedFields.details && (
                      <Row>
                        {[col1, col2, col3].map((columnFields, colIndex) => (
                          <Col md={4} key={colIndex}>
                            {columnFields.map((field, index) =>
                              renderField(field, index, isEditing ? tempData : data)
                            )}
                          </Col>
                        ))}
                      </Row>
                    )}
                  </Row>
                </Row>

                {/* Address Section */}
                {normalizedAddressFields && normalizedAddressFields?.address?.length > 0 && (
                  <Row className="mt-4">
                    <Col md={12} className="mb-4">
                      <h6 className="fw-bold mb-0 d-flex align-items-center justify-content-between p-3 border rounded"
                        style={{
                          color: "var(--primary-color)",
                          background: "var(--header-highlighter-color)",
                          borderRadius: "10px",
                        }}>
                        Address Information
                      </h6>
                    </Col>
                    <Row className="px-5">
                      {normalizedAddressFields && normalizedAddressFields.address && (
                        <Row>
                          {[coladd1, coladd2, coladd3].map((columnFields, colIndex) => (
                            <Col md={4} key={colIndex}>
                              {columnFields.map((field, index) =>
                                renderField(field, index, isEditing ? tempData : data)
                              )}
                            </Col>
                          ))}
                        </Row>
                      )}
                    </Row>
                  </Row>
                )}

                {/* Other Section */}
                {normalizedOtherFields.other.length > 0 && (
                  <Row className="mt-4">
                    <Col md={12} className="mb-4">
                      <h6 className="fw-bold mb-0 d-flex align-items-center justify-content-between p-3 border rounded"
                        style={{
                          color: "var(--primary-color)",
                          background: "var(--header-highlighter-color)",
                          borderRadius: "10px",
                        }}>
                        Others
                      </h6>
                    </Col>
                    <Row className="px-5">
                      {normalizedOtherFields && normalizedOtherFields.other && (
                        <Row>
                          {[colother1, colother2, colother3].map((columnFields, colIndex) => (
                            <Col md={4} key={colIndex}>
                              {columnFields.map((field, index) =>
                                renderField(field, index, isEditing ? tempData : data)
                              )}
                            </Col>
                          ))}
                        </Row>
                      )}
                    </Row>
                  </Row>
                )}

                {/* Related Modules */}
                {relatedModules.length > 0 && (
                  <Row className="mb-4">
                    <Col>
                      <Card style={{
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                        borderRadius: "12px",
                        overflow: "hidden",
                      }}>
                        <Card.Body style={{ padding: 0 }}>
                          <div style={{
                            padding: "20px 24px",
                            borderBottom: "1px solid #e9ecef",
                            background: "linear-gradient(to right, #f8f9fa, #ffffff)",
                          }}>
                            <h6 style={{
                              margin: 0,
                              color: "var(--primary-color)",
                              fontSize: "16px",
                              fontWeight: "700",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}>
                              <i className="fa-solid fa-link"></i>
                              Related Records
                            </h6>
                          </div>

                          <div style={{ padding: "24px" }}>
                            {relatedModules.map((relatedModule, idx) => {
                              const normalizedModule = typeof relatedModule === "string"
                                ? {
                                  key: relatedModule,
                                  label: relatedModule.charAt(0).toUpperCase() + relatedModule.slice(1),
                                }
                                : relatedModule;

                              const moduleKey = normalizedModule.key || normalizedModule;
                              const moduleLabel = normalizedModule.label ||
                                (typeof normalizedModule === "string"
                                  ? normalizedModule.charAt(0).toUpperCase() + normalizedModule.slice(1)
                                  : "Related");

                              return (
                                <div key={idx} className={idx > 0 ? "mt-4 pt-4" : ""}
                                  style={idx > 0 ? { borderTop: "1px solid #e9ecef" } : {}}>
                                  <h6 style={{
                                    marginBottom: "16px",
                                    color: "#495057",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                  }}>
                                    {moduleLabel}
                                  </h6>
                                  {relatedData[moduleKey] && relatedData[moduleKey].length > 0 ? (
                                    normalizedModule.render ? (
                                      normalizedModule.render(relatedData[moduleKey], data)
                                    ) : (
                                      <div className="table-responsive">
                                        <table style={{
                                          width: "100%",
                                          fontSize: "14px",
                                          borderCollapse: "collapse",
                                        }}>
                                          <thead>
                                            <tr style={{
                                              background: "#f8f9fa",
                                              borderBottom: "2px solid #e9ecef",
                                            }}>
                                              {normalizedModule.columns?.map((col, colIdx) => (
                                                <th key={colIdx} style={{
                                                  padding: "12px 16px",
                                                  textAlign: "left",
                                                  fontWeight: "600",
                                                  color: "#495057",
                                                }}>
                                                  {col.label}
                                                </th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {relatedData[moduleKey].map((item, itemIdx) => (
                                              <tr key={itemIdx} style={{
                                                borderBottom: "1px solid #e9ecef",
                                                transition: "background-color 0.2s",
                                              }}
                                                onMouseEnter={(e) => e.target.parentElement.style.background = "#f8f9fa"}
                                                onMouseLeave={(e) => e.target.parentElement.style.background = "transparent"}>
                                                {normalizedModule.columns?.map((col, colIdx) => (
                                                  <td key={colIdx} style={{ padding: "12px 16px", color: "#6c757d" }}>
                                                    {item[col.key] || "N/A"}
                                                  </td>
                                                ))}
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )
                                  ) : (
                                    <div style={{
                                      padding: "32px 16px",
                                      textAlign: "center",
                                      background: "#f8f9fa",
                                      borderRadius: "8px",
                                      border: "1px dashed #dee2e6",
                                    }}>
                                      <i className="fa-solid fa-inbox" style={{
                                        fontSize: "32px",
                                        color: "#adb5bd",
                                        marginBottom: "8px",
                                        display: "block",
                                      }}></i>
                                      <p style={{ color: "#6c757d", margin: 0, fontSize: "14px" }}>
                                        No {moduleLabel.toLowerCase()} found.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <ConfirmationModal
          show={showConfirmModal}
          onHide={() => setShowConfirmModal(false)}
          onConfirm={confirmDelete}
          title={`Delete ${moduleName}`}
          message={`Are you sure you want to delete this ${moduleName}?`}
          confirmText="Delete"
          cancelText="Cancel"
        />
      </Container>
    </>
  );
};

export default ModuleDetail;