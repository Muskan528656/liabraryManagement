import React, { useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import Select from "react-select";

const FormModal = ({
  show,
  onHide,
  title,
  icon,
  formData,
  setFormData,
  fields = [],
  onSubmit,
  onCancel,
  loading = false,
  editingItem = null,
  size = "lg",
  validationErrors = {},
  customFooter = null,
  children,
}) => {
  const [filePreviews, setFilePreviews] = useState({});

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleFieldChange = (field, value) => {
    if (field.onChange) {
      field.onChange(value, formData, setFormData);
    } else {
      handleInputChange(field.name, value);
    }
  };

  const handleFileChange = (field, event) => {
    const file = event.target.files[0];
    const fieldName = field.name;

    if (!file) {
      // File remove karna hai
      handleInputChange(fieldName, null);
      setFilePreviews(prev => ({
        ...prev,
        [fieldName]: null
      }));
      return;
    }

    // File validation
    if (field.maxSize && file.size > field.maxSize) {
      alert(`File size must be less than ${field.maxSize / 1024 / 1024}MB`);
      event.target.value = ''; // Clear file input
      return;
    }

    // ✅ FIXED: File type validation
    if (field.accept) {
      const allowedTypes = field.accept.split(',').map(type => type.trim());
      const isFileValid = isFileTypeValid(file, allowedTypes);

      if (!isFileValid) {
        alert(`Only ${field.accept} files are allowed`);
        event.target.value = ''; // Clear file input
        return;
      }
    }

    // Preview generate karen (images ke liye)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreviews(prev => ({
          ...prev,
          [fieldName]: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }

    // Form data mein file set karen
    handleInputChange(fieldName, file);
  };

  // ✅ NEW: File type validation function
  const isFileTypeValid = (file, allowedTypes) => {
    for (const allowedType of allowedTypes) {
      // Case 1: Wildcard match (image/*, */*)
      if (allowedType.includes('/*')) {
        const [category] = allowedType.split('/*');
        if (category === '*' || file.type.startsWith(`${category}/`)) {
          return true;
        }
      }

      // Case 2: Exact MIME type match
      else if (file.type === allowedType) {
        return true;
      }

      // Case 3: File extension match (.pdf, .jpg, etc.)
      else if (allowedType.startsWith('.')) {
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith(allowedType.toLowerCase())) {
          return true;
        }
      }

      // Case 4: Specific type patterns (application/pdf, etc.)
      else if (allowedType.includes('/')) {
        if (file.type === allowedType) {
          return true;
        }
      }
    }

    return false;
  };

  const removeFile = (fieldName) => {
    handleInputChange(fieldName, null);
    setFilePreviews(prev => ({
      ...prev,
      [fieldName]: null
    }));
    // File input reset karen
    const fileInput = document.getElementById(`file-${fieldName}`);
    if (fileInput) fileInput.value = '';
  };

  const renderField = (field) => {
    const value = formData[field.name] || "";
    const error = validationErrors[field.name];
    const isRequired = field.required;
    const fieldId = `field-${field.name}`;

    switch (field.type) {
      case "file":
        const hasExistingFile = editingItem && typeof value === 'string' && value;
        const showPreview = filePreviews[field.name] || hasExistingFile;

        return (
          <Form.Group className="mb-3" key={field.name}>
            <Form.Label>
              {field.label} {isRequired && <span className="text-danger">*</span>}
            </Form.Label>

            {/* File Preview */}
            {showPreview && (
              <div className="mb-3 text-center">
                {field.accept?.includes('image') ? (
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <img
                      src={filePreviews[field.name] || value}
                      alt="Preview"
                      style={{
                        width: '150px',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '50%',
                        border: '4px solid #6f42c1',
                        boxShadow: '0 4px 12px rgba(111, 66, 193, 0.3)'
                      }}
                    />
                    <div style={{
                      position: "absolute",
                      bottom: "5px",
                      right: "5px",
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                      cursor: "pointer"
                    }} onClick={() => removeFile(field.name)}>
                      <i className="fa-solid fa-times" style={{ color: "#dc3545", fontSize: "16px" }}></i>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-light rounded">
                    <i className="fa-solid fa-file me-2"></i>
                    {hasExistingFile ? 'Existing file' : 'File selected'}
                    <div className="mt-2">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeFile(field.name)}
                      >
                        <i className="fa-solid fa-trash me-1"></i>
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Form.Control
              type="file"
              id={`file-${field.name}`}
              accept={field.accept}
              onChange={(e) => handleFileChange(field, e)}
              isInvalid={!!error}
              {...field.props}
            />
            {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
            {field.helperText && (
              <Form.Text className="text-muted">
                {field.helperText}
              </Form.Text>
            )}
          </Form.Group>
        );

      case "text":
      case "email":
      case "number":
      case "tel":
        return (
          <Form.Group className="mb-3" key={field.name}>
            <Form.Label>
              {field.label} {isRequired && <span className="text-danger">*</span>}
            </Form.Label>
            <Form.Control
              type={field.type}
              name={field.name}
              id={fieldId}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              value={value}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              disabled={field.disabled}
              isInvalid={!!error}
              {...field.props}
            />
            {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
            {field.helpText && <Form.Text className="text-muted">{field.helpText}</Form.Text>}
          </Form.Group>
        );

      case "textarea":
        return (
          <Form.Group className="mb-3" key={field.name}>
            <Form.Label>
              {field.label} {isRequired && <span className="text-danger">*</span>}
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={field.rows || 3}
              name={field.name}
              id={fieldId}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              value={value}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              disabled={field.disabled}
              isInvalid={!!error}
              {...field.props}
            />
            {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
            {field.helpText && <Form.Text className="text-muted">{field.helpText}</Form.Text>}
          </Form.Group>
        );

      case "select":
        return (
          <Form.Group className="mb-3" key={field.name}>
            <Form.Label>
              {field.label} {isRequired && <span className="text-danger">*</span>}
            </Form.Label>
            {field.asyncSelect ? (
              <Select
                value={field.options?.find((opt) => opt.value === value) || null}
                onChange={(selected) => handleFieldChange(field, selected?.value || "")}
                options={field.options || []}
                isClearable={field.clearable !== false}
                isDisabled={field.disabled}
                placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`}
                loadOptions={field.loadOptions}
                defaultOptions={field.defaultOptions}
                {...field.selectProps}
              />
            ) : (
              <Form.Select
                name={field.name}
                id={fieldId}
                value={value}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                disabled={field.disabled}
                isInvalid={!!error}
                {...field.props}
              >
                {field.placeholder && (
                  <option value="">{field.placeholder}</option>
                )}
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            )}
            {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
            {field.helpText && <Form.Text className="text-muted">{field.helpText}</Form.Text>}
          </Form.Group>
        );

      case "date":
        return (
          <Form.Group className="mb-3" key={field.name}>
            <Form.Label>
              {field.label} {isRequired && <span className="text-danger">*</span>}
            </Form.Label>
            <Form.Control
              type="date"
              name={field.name}
              id={fieldId}
              value={value}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              disabled={field.disabled}
              isInvalid={!!error}
              {...field.props}
            />
            {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
            {field.helpText && <Form.Text className="text-muted">{field.helpText}</Form.Text>}
          </Form.Group>
        );

      case "checkbox":
        return (
          <Form.Group className="mb-3" key={field.name}>
            <Form.Check
              type="checkbox"
              label={field.label}
              checked={!!value}
              onChange={(e) => handleFieldChange(field, e.target.checked)}
              disabled={field.disabled}
              id={fieldId}
              {...field.props}
            />
            {field.helpText && <Form.Text className="text-muted">{field.helpText}</Form.Text>}
          </Form.Group>
        );

      case "custom":
        return field.render ? field.render(value, formData, setFormData, error) : null;

      case "toggle":
        return (
          <Form.Group className="mb-3" key={field.name}>
            <Form.Check
              type="switch"
              id={fieldId}
              label={field.label}
              checked={!!value}
              onChange={(e) => handleFieldChange(field, e.target.checked)}
              disabled={field.disabled}
              {...field.props}  
            />
            {field.helpText && <Form.Text className="text-muted">{field.helpText}</Form.Text>}
          </Form.Group>
        );

      default:
        return null;
    }
  };

  return (
    <Modal show={show} onHide={onHide} size={size} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {icon && <i className={`${icon} me-2`}></i>}
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {fields.length > 0 ? (
            // Check if fields have sections
            fields.some(field => field.section) ? (
              // Render with sections
              Object.entries(
                fields.reduce((acc, field) => {
                  const sectionName = field.section || 'default';
                  if (!acc[sectionName]) {
                    acc[sectionName] = [];
                  }
                  acc[sectionName].push(field);
                  return acc;
                }, {})
              ).map(([sectionName, sectionFields]) => (
                <div key={sectionName} className="mb-4">
                  <div
                    style={{
                      padding: "12px 16px",
                      background: "linear-gradient(to right, #f3e9fc, #ffffff)",
                      borderLeft: "4px solid #6f42c1",
                      marginBottom: "20px",
                      borderRadius: "6px"
                    }}
                  >
                    <h6 style={{
                      margin: 0,
                      color: "#6f42c1",
                      fontSize: "16px",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <i className="fa-solid fa-info-circle"></i>
                      {sectionName}
                    </h6>
                  </div>
                  <Row>
                    {sectionFields.map((field) => {
                      const colSize = field.colSize || 12;
                      return (
                        <Col md={colSize} key={field.name}>
                          {renderField(field)}
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              ))
            ) : (
              // Render without sections (default behavior)
              <Row>
                {fields.map((field) => {
                  const colSize = field.colSize || 12;
                  return (
                    <Col md={colSize} key={field.name}>
                      {renderField(field)}
                    </Col>
                  );
                })}
              </Row>
            )
          ) : (
            children
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        {customFooter ? (
          customFooter
        ) : (
          <>
            <Button variant="secondary" onClick={onCancel || onHide} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={onSubmit}
              disabled={loading}
              style={{
                background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                border: "none",
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {editingItem ? "Updating..." : "Saving..."}
                </>
              ) : (
                editingItem ? "Update" : "Save"
              )}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default FormModal;