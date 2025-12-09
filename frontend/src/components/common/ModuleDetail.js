import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Form,
  InputGroup // Import InputGroup for the password field structure
} from "react-bootstrap";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import DataApi from "../../api/dataApi";
import ScrollToTop from "./ScrollToTop";
import PubSub from "pubsub-js";
import ConfirmationModal from "./ConfirmationModal";
import { convertToUserTimezone } from "../../utils/convertTimeZone";

const normalizeListResponse = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data?.data) {
    return Array.isArray(payload.data.data) ? payload.data.data : [];
  }
  return [];
};

const getOptionValue = (option = {}) => {
  return (
    option.id ??
    option.value ??
    option.code ??
    option.uuid ??
    option.key ??
    ""
  );
};

const getOptionDisplayLabel = (option = {}) => {
  if (!option) return "";
  if (option.role_name) return option.role_name;
  if (option.label) return option.label;
  if (option.name) return option.name;
  if (option.firstname || option.lastname) {
    return `${option.firstname || ""} ${option.lastname || ""}`.trim();
  }
  if (option.email) return option.email;
  return option.value || option.id || "Item";
};

const ModuleDetail = ({
  moduleName,
  moduleApi,
  moduleLabel,
  icon,
  fields,
  relatedModules = [],
  lookupNavigation = {},
  externalData = {},
  onEdit = null,
  timeZone
}) => {
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  // --- State ---
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [relatedData, setRelatedData] = useState({});
  const [isEditing, setIsEditing] = useState(location?.state?.isEdit || false);
  const [tempData, setTempData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lookupOptions, setLookupOptions] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // --- NEW: Password Visibility State ---
  const [passwordVisibility, setPasswordVisibility] = useState({});

  // Name Resolution State
  const [userNames, setUserNames] = useState({});
  const [userAvatars, setUserAvatars] = useState({});

  const nonEditableFields = useMemo(() => [
    'createdbyid', 'createddate', 'lastmodifiedbyid', 'lastmodifieddate',
    'created_by', 'created_at', 'modified_by', 'modified_at',
    'createdby', 'createdat', 'lastmodifiedby', 'lastmodifiedat',
  ], []);

  // --- Helper to toggle password visibility ---
  const togglePasswordVisibility = (key) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // --- 1. User Avatar Component ---
  const UserAvatar = ({ userId, size = 32, clickable = true }) => {
    const userName = userNames[userId];
    const displayLabel = userName || `User ${userId}`; 
    const userAvatar = userAvatars[userId] || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || "User")}&background=6f42c1&color=fff&size=${size}`;

    const handleUserClick = (e) => {
      e.stopPropagation();
      if (clickable && userId) {
        navigate(`/user/${userId}`);
      }
    };

    return (
      <div
        className={`d-flex align-items-center ${clickable ? 'cursor-pointer' : ''}`}
        onClick={clickable ? handleUserClick : undefined}
        style={{ gap: '8px', width: 'fit-content' }}
      >
        <img
          src={userAvatar}
          alt={displayLabel}
          className="rounded-circle"
          style={{
            width: size,
            height: size,
            objectFit: 'cover',
            border: '2px solid #e9ecef'
          }}
        />
        <span
          className="fw-medium"
          style={{
            color: clickable ? 'var(--primary-color)' : '#495057',
            cursor: clickable ? 'pointer' : 'default',
            textDecoration: 'none'
          }}
          onMouseEnter={(e) => { if(clickable) e.target.style.textDecoration = 'underline'; }}
          onMouseLeave={(e) => { if(clickable) e.target.style.textDecoration = 'none'; }}
        >
          {userName || <span className="text-muted small fst-italic">Loading...</span>}
        </span>
      </div>
    );
  };

  // --- 2. Fetch User Names Logic ---
  const fetchUserNames = async (idsToFetch) => {
    if (!idsToFetch.length) return;

    try {
      const userApi = new DataApi("user");
      const fetchedNames = {};
      const fetchedAvatars = {};

      const uniqueIds = [...new Set(idsToFetch.filter(item => item.id && !userNames[item.id]))];

      await Promise.all(uniqueIds.map(async (item) => {
        const { id, type } = item;
        try {
          if (type === 'user') {
            const response = await userApi.fetchById(id);
            let userData = null;
            
            if (response?.data?.success && response.data.data) userData = response.data.data;
            else if (response?.data) userData = response.data;

            if (userData) {
              const fullName = `${userData.firstname || ''} ${userData.lastname || ''}`.trim();
              fetchedNames[id] = fullName || userData.email || `User ${id}`;
              if (userData.profile_picture) {
                fetchedAvatars[id] = userData.profile_picture;
              }
            } else {
              fetchedNames[id] = `User ${id}`;
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch name for ${id}`);
          fetchedNames[id] = `User ${id}`; 
        }
      }));

      setUserNames(prev => ({ ...prev, ...fetchedNames }));
      setUserAvatars(prev => ({ ...prev, ...fetchedAvatars }));
    } catch (error) {
      console.error("Error fetching user names:", error);
    }
  };

  // --- 3. Main Data Fetching ---
  const fetchData = async () => {
    try {
      const api = new DataApi(moduleApi);
      const response = await api.fetchById(id);
      
      let finalData = null;
      if (response?.data?.success) finalData = response.data.data;
      else if (response?.data?.data) finalData = response.data.data;
      else if (response?.data) finalData = response.data;
      else finalData = response;

      setData(finalData);

      if (fields?.onLoad && typeof fields.onLoad === 'function') {
        fields.onLoad(finalData);
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
        for (const mod of relatedModules) {
            const key = typeof mod === 'string' ? mod : mod.key;
            const apiName = typeof mod === 'string' ? mod : mod.api;
            if(!apiName) continue;
            const api = new DataApi(apiName);
            try {
                const res = await api.get(`/${id}`);
                const list = normalizeListResponse(res?.data || res);
                relatedDataObj[key] = list;
            } catch(e) { console.warn("Related fetch failed", key); }
        }
        setRelatedData(relatedDataObj);
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchData();
      if(relatedModules.length) await fetchRelatedData();
      setLoading(false);
    };
    if (id && moduleApi) loadData();
  }, [id, moduleApi]);

  // --- 4. Trigger Name Resolution ---
  useEffect(() => {
    if (data) {
      const idsToFetch = [];
      if (data.createdbyid) idsToFetch.push({ id: data.createdbyid, type: 'user' });
      if (data.lastmodifiedbyid) idsToFetch.push({ id: data.lastmodifiedbyid, type: 'user' });
      if (data.created_by) idsToFetch.push({ id: data.created_by, type: 'user' });

      Object.keys(data).forEach(key => {
        const val = data[key];
        if (val && (typeof val === 'string' || typeof val === 'number')) {
          if ((key.includes('byid') || key.includes('user_id')) && !key.includes('role')) {
             idsToFetch.push({ id: val, type: 'user' });
          }
        }
      });

      if (idsToFetch.length > 0) fetchUserNames(idsToFetch);
    }
  }, [data]);

  useEffect(() => {
      // Lookups logic (omitted as per context)
  }, []);

  // --- Actions ---
  const handleEdit = () => {
    if (onEdit) onEdit(data);
    else {
      setIsEditing(true);
      setTempData({ ...data });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const api = new DataApi(moduleApi);
      const response = await api.update(tempData, id);
      if (response) {
        await fetchData();
        setIsEditing(false);
        setTempData(null);
        PubSub.publish("RECORD_SAVED_TOAST", { title: "Success", message: "Updated successfully" });

        if (moduleName === "user") {
          PubSub.publish("USER_UPDATED", { user: response.data });
        }
      }
    } catch (error) {
      PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    setDeleteId(id);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    try {
      const api = new DataApi(moduleApi);
      await api.delete(id);
      PubSub.publish("RECORD_SAVED_TOAST", { title: "Success", message: "Deleted successfully" });
      navigate(`/${moduleName}`);
    } catch (error) {
      PubSub.publish("RECORD_ERROR_TOAST", { title: "Error", message: error.message });
    }
  };

  const handleFieldChange = (key, value) => {
    setTempData(prev => ({ ...prev, [key]: value }));
  };

  const getSelectOptions = useCallback((field) => {
    if (Array.isArray(field.options)) return field.options;
    return externalData?.[field.options] || lookupOptions?.[field.options] || [];
  }, [externalData, lookupOptions]);


  // --- Render Field Logic ---
  const renderField = (field, index, currentData) => {
    if (!field || !field.key) return null;
    const isNonEditable = nonEditableFields.includes(field.key);
    const isReadOnlyMode = !isEditing || isNonEditable;
    const rawValue = currentData?.[field.key];

    // 1. Toggle (Status)
    if (field.type === "toggle") {
      const boolVal = Boolean(rawValue);
      return (
        <Form.Group key={index} className="mb-3">
          <Form.Label className="fw-semibold d-flex justify-content-between align-items-center">
            <span>{field.label}</span>
            {!isEditing && (
              <Badge bg={boolVal ? "success" : "danger"}>
                {boolVal ? "Active" : "Inactive"}
              </Badge>
            )}
          </Form.Label>
          {isEditing && !isNonEditable ? (
             <div 
               className="form-check form-switch" 
               style={{fontSize: '1.2rem'}}
             >
               <input 
                 className="form-check-input" 
                 type="checkbox" 
                 checked={boolVal}
                 onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                 style={{cursor: 'pointer'}}
               />
             </div>
          ) : (
             !isEditing ? null : <Form.Control readOnly value={boolVal ? "Active" : "Inactive"} size="sm" />
          )}
        </Form.Group>
      );
    }

    // 2. User/Creator Fields (Auto-detect Name)
    if (isReadOnlyMode && (field.key.includes('user') || field.key.includes('byid'))) {
         if (!field.key.includes('role')) {
             if (rawValue) {
                return (
                    <Form.Group key={index} className="mb-3">
                        <Form.Label className="fw-semibold">{field.label}</Form.Label>
                        <div className="form-control-plaintext p-0">
                            <UserAvatar userId={rawValue} />
                        </div>
                    </Form.Group>
                );
             }
         }
    }

    // 3. Select / Dropdowns (Role, Country, etc)
    if (field.type === "select") {
        const options = getSelectOptions(field);
        
        if (isReadOnlyMode) {
            let displayValue = "—";
            if (field.render && typeof field.render === 'function') {
                displayValue = field.render(rawValue, currentData);
            } else {
                const selectedOption = options.find(opt => 
                    String(getOptionValue(opt)) === String(rawValue)
                );
                if (selectedOption) {
                    displayValue = getOptionDisplayLabel(selectedOption);
                } else {
                    displayValue = rawValue || "—";
                }
            }
            return (
                <Form.Group key={index} className="mb-3">
                    <Form.Label className="fw-semibold">{field.label}</Form.Label>
                    <div className="form-control-plaintext" style={{color: '#495057'}}>
                        {displayValue}
                    </div>
                </Form.Group>
            );
        }

        return (
            <Form.Group key={index} className="mb-3">
                <Form.Label className="fw-semibold">{field.label}</Form.Label>
                <Form.Select
                    value={rawValue || ""}
                    onChange={(e) => {
                        handleFieldChange(field.key, e.target.value);
                        if(field.onChange) field.onChange(e.target.value, tempData, setTempData);
                    }}
                    disabled={isNonEditable}
                >
                    <option value="">Select {field.label}</option>
                    {options.map((opt, i) => (
                        <option key={i} value={getOptionValue(opt)}>
                            {getOptionDisplayLabel(opt)}
                        </option>
                    ))}
                </Form.Select>
            </Form.Group>
        );
    }

    // 4. Handle PASSWORD Fields (Fix for Eye Icon)
    if (field.type === "password") {
      const isVisible = passwordVisibility[field.key] || false;
      return (
        <Form.Group key={index} className="mb-3">
          <Form.Label className="fw-semibold">{field.label}</Form.Label>
          {isReadOnlyMode ? (
            <div className="form-control-plaintext">******</div>
          ) : (
            <InputGroup>
              <Form.Control
                type={isVisible ? "text" : "password"}
                value={rawValue || ""}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                readOnly={isNonEditable}
                style={{
                  backgroundColor: isNonEditable ? "#f8f9fa" : "#fff",
                  borderRight: "none",
                }}
              />
              <InputGroup.Text
                style={{
                  backgroundColor: isNonEditable ? "#f8f9fa" : "#fff",
                  borderLeft: "none",
                  cursor: isNonEditable ? "default" : "pointer",
                }}
                onClick={() => !isNonEditable && togglePasswordVisibility(field.key)}
              >
                <i className={isVisible ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"}></i>
              </InputGroup.Text>
            </InputGroup>
          )}
        </Form.Group>
      );
    }

    // 5. Standard Fields (Text, Date, Number)
    let displayVal = rawValue;

    if (isReadOnlyMode) {
        if (field.render && typeof field.render === 'function') {
            displayVal = field.render(rawValue, currentData);
        } else if (field.type === 'date' && rawValue) {
            try {
                const converted = convertToUserTimezone(rawValue, timeZone);
                displayVal = converted.split(' ')[0]; 
            } catch { /* fallback */ }
        } else if (field.type === 'currency' && rawValue) {
            displayVal = `₹${parseFloat(rawValue).toFixed(2)}`;
        }
    }

    const inputType = field.type === 'number' ? 'number' : 
                      field.type === 'date' ? 'date' : 'text';

    return (
      <Form.Group key={index} className="mb-3">
        <Form.Label className="fw-semibold">{field.label}</Form.Label>
        {isReadOnlyMode ? (
            <div className="form-control-plaintext" style={{ wordBreak: 'break-word' }}>
                {displayVal ?? "—"}
            </div>
        ) : (
            <Form.Control
                type={inputType}
                value={displayVal || ""}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                readOnly={isNonEditable}
                style={{ backgroundColor: isNonEditable ? '#f8f9fa' : '#fff' }}
            />
        )}
      </Form.Group>
    );
  };

  const splitInto3 = (arr = []) => {
    const col1 = [], col2 = [], col3 = [];
    arr.forEach((item, index) => {
      if (index % 3 === 0) col1.push(item);
      else if (index % 3 === 1) col2.push(item);
      else col3.push(item);
    });
    return [col1, col2, col3];
  };

  if (loading) return <Container fluid><ScrollToTop /><div className="p-4">Loading...</div></Container>;
  if (!data) return <Container fluid><div className="p-4 text-center">No Data Found</div></Container>;

  // Prepare Columns
  const [col1, col2, col3] = splitInto3(fields.details || []);
  const [colAdd1, colAdd2, colAdd3] = splitInto3(fields.address || []);
  const [colOther1, colOther2, colOther3] = splitInto3(fields.other || []);

  const dataToUse = isEditing ? tempData : data;

  return (
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
                    onClick={() => navigate(`/${moduleName}`)}
                    className="shadow-sm d-flex align-items-center justify-content-center custom-btn-back"
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                  </button>
                  <h5 className="fw-bold mb-0" style={{ color: "var(--primary-color)" }}>
                    {icon && <i className={`${icon} me-2 fs-6`}></i>}
                    {moduleLabel} Details
                  </h5>
                </div>

                <div className="d-flex gap-2">
                  {!isEditing ? (
                    <>
                      <button className="custom-btn-primary" onClick={handleEdit}>
                        <i className="fa-solid fa-edit me-2"></i>Edit
                      </button>
                      <button className="custom-btn-delete-detail" onClick={handleDelete}>
                        <i className="fa-solid fa-trash me-2"></i>Delete
                      </button>
                    </>
                  ) : (
                    <div className="d-flex gap-2">
                      <button className="custom-btn-primary" onClick={handleSave} disabled={saving}>
                        <i className="fa-solid fa-check me-2"></i>
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button className="custom-btn-secondary" onClick={() => { setIsEditing(false); setTempData(null); }} disabled={saving}>
                        <i className="fa-solid fa-times me-2"></i>Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* --- MAIN DETAILS --- */}
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
                   <Col md={4}>{col1.map((field, i) => renderField(field, i, dataToUse))}</Col>
                   <Col md={4}>{col2.map((field, i) => renderField(field, i, dataToUse))}</Col>
                   <Col md={4}>{col3.map((field, i) => renderField(field, i, dataToUse))}</Col>
                </Row>
              </Row>

              {/* --- ADDRESS (Optional) --- */}
              {fields.address && fields.address.length > 0 && (
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
                        <Col md={4}>{colAdd1.map((field, i) => renderField(field, i, dataToUse))}</Col>
                        <Col md={4}>{colAdd2.map((field, i) => renderField(field, i, dataToUse))}</Col>
                        <Col md={4}>{colAdd3.map((field, i) => renderField(field, i, dataToUse))}</Col>
                    </Row>
                </Row>
              )}

              {/* --- OTHERS (System Info) --- */}
              {fields.other && fields.other.length > 0 && (
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
                        <Col md={4}>{colOther1.map((field, i) => renderField(field, i, dataToUse))}</Col>
                        <Col md={4}>{colOther2.map((field, i) => renderField(field, i, dataToUse))}</Col>
                        <Col md={4}>{colOther3.map((field, i) => renderField(field, i, dataToUse))}</Col>
                    </Row>
                </Row>
              )}

              {/* --- RELATED MODULES --- */}
              {relatedModules.length > 0 && (
                <Row className="mt-4 mb-4">
                    <Col>
                        <Card style={{ border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", borderRadius: "12px" }}>
                            <Card.Body className="p-0">
                                <div style={{ padding: "20px 24px", borderBottom: "1px solid #e9ecef", background: "#f8f9fa" }}>
                                    <h6 style={{ margin: 0, color: "var(--primary-color)", fontWeight: "700" }}>
                                        <i className="fa-solid fa-link me-2"></i>Related Records
                                    </h6>
                                </div>
                                <div className="p-4">
                                    {relatedModules.map((mod, idx) => {
                                        const modKey = typeof mod === 'string' ? mod : mod.key;
                                        const modLabel = typeof mod === 'string' ? mod : mod.label;
                                        const list = relatedData[modKey] || [];
                                        
                                        return (
                                            <div key={idx} className="mb-4">
                                                <h6 className="text-uppercase text-muted fw-bold small mb-3">{modLabel}</h6>
                                                {list.length > 0 ? (
                                                    <div className="table-responsive">
                                                        <table className="table table-hover">
                                                            <thead className="table-light">
                                                                <tr>
                                                                    {Object.keys(list[0]).slice(0, 5).map(k => <th key={k}>{k}</th>)}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {list.map((item, i) => (
                                                                    <tr key={i}>
                                                                         {Object.keys(item).slice(0, 5).map(k => <td key={k}>{item[k]}</td>)}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="text-center p-3 border rounded bg-light text-muted">No records found.</div>
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
        title={`Delete ${moduleLabel}`}
        message={`Are you sure you want to delete this ${moduleLabel}?`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </Container>
  );
};

export default ModuleDetail;