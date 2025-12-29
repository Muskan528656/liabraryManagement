import React, { useState } from "react";
import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
import Select from "react-select";

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
    style={{ color: "#6c757d" }}
  >
    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
    style={{ color: "#6c757d" }}
  >
    <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z" />
    <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z" />
    <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z" />
  </svg>
);

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
  const [passwordVisibility, setPasswordVisibility] = useState({});

  const togglePasswordVisibility = (fieldName) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

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
      handleInputChange(fieldName, null);
      setFilePreviews((prev) => ({ ...prev, [fieldName]: null }));
      return;
    }

    if (field.maxSize && file.size > field.maxSize) {
      alert(`File size must be less than ${field.maxSize / 1024 / 1024}MB`);
      event.target.value = "";
      return;
    }

    if (field.accept) {
      const allowedTypes = field.accept.split(",").map((type) => type.trim());
      const isFileValid = isFileTypeValid(file, allowedTypes);

      if (!isFileValid) {
        alert(`Only ${field.accept} files are allowed`);
        event.target.value = "";
        return;
      }
    }

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreviews((prev) => ({
          ...prev,
          [fieldName]: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }

    handleInputChange(fieldName, file);
  };

  const isFileTypeValid = (file, allowedTypes) => {
    for (const allowedType of allowedTypes) {
      if (allowedType.includes("/*")) {
        const [category] = allowedType.split("/*");
        if (category === "*" || file.type.startsWith(`${category}/`)) {
          return true;
        }
      } else if (file.type === allowedType) {
        return true;
      } else if (allowedType.startsWith(".")) {
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith(allowedType.toLowerCase())) {
          return true;
        }
      } else if (allowedType.includes("/")) {
        if (file.type === allowedType) {
          return true;
        }
      }
    }
    return false;
  };

  const removeFile = (fieldName) => {
    handleInputChange(fieldName, null);
    setFilePreviews((prev) => ({ ...prev, [fieldName]: null }));
    const fileInput = document.getElementById(`file-${fieldName}`);
    if (fileInput) fileInput.value = "";
  };

  const renderField = (field) => {
    const value = formData[field.name] || "";
    const error = validationErrors[field.name];
    const isRequired = field.required;
    const fieldId = `field-${field.name}`;

    switch (field.type) {
      case "file":
        const hasExistingFile = editingItem && typeof value === "string" && value;
        const showPreview = filePreviews[field.name] || hasExistingFile;

        return (
          <Form.Group className="mb-3" key={field.name}>
            <Form.Label>
              {field.label} {isRequired && <span className="text-danger">*</span>}
            </Form.Label>
            {showPreview && (
              <div className="mb-3 text-center">
                {field.accept?.includes("image") ? (
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <img
                      src={filePreviews[field.name] || value}
                      alt="Preview"
                      style={{
                        width: "150px",
                        height: "150px",
                        objectFit: "cover",
                        borderRadius: "50%",
                        border: "4px solid var(--primary-color)",
                        boxShadow: "0 4px 12px rgba(111, 66, 193, 0.3)",
                      }}
                    />
                    <div
                      style={{
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
                        cursor: "pointer",
                      }}
                      onClick={() => removeFile(field.name)}
                    >
                      <i className="fa-solid fa-times" style={{ color: "#dc3545", fontSize: "16px" }}></i>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-light rounded">
                    <i className="fa-solid fa-file me-2"></i>
                    {hasExistingFile ? "Existing file" : "File selected"}
                    <div className="mt-2">
                      <Button variant="outline-danger" size="sm" onClick={() => removeFile(field.name)}>
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
            {field.helperText && <Form.Text className="text-muted">{field.helperText}</Form.Text>}
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

      case "password":
        const isVisible = passwordVisibility[field.name];
        return (
          <Form.Group className="mb-3" key={field.name}>
            <Form.Label>
              {field.label} {isRequired && <span className="text-danger">*</span>}
            </Form.Label>
            <InputGroup>
              <Form.Control
                type={isVisible ? "text" : "password"}
                name={field.name}
                id={fieldId}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                value={value}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                disabled={field.disabled}
                isInvalid={!!error}
                style={{ borderRight: "none" }}
                {...field.props}
              />
              <InputGroup.Text
                onClick={() => togglePasswordVisibility(field.name)}
                style={{
                  backgroundColor: "white",
                  borderLeft: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isVisible ? <EyeSlashIcon /> : <EyeIcon />}
              </InputGroup.Text>
              {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
            </InputGroup>
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
              readOnly={field.readOnly}         // ⭐ Added
              style={
                field.readOnly
                  ? {
                    background: "#f8f9fa",
                    resize: "none",
                    border: "1px solid #ddd",
                    padding: "8px",
                  }
                  : {}
              }
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
                {field.placeholder && <option value="">{field.placeholder}</option>}
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
            <Form.Label className="d-flex justify-content-between">
              <span>
                {field.label} {field.required && <span className="text-danger">*</span>}
              </span>
              <span className="fw-bold">{formData[field.name] ? " " : " "}</span>
            </Form.Label>

            <div
              className="custom-toggle"
              onClick={() => handleFieldChange(field, !formData[field.name])}
              style={{
                width: "55px",
                height: "28px",
                borderRadius: "20px",
                background: formData[field.name] ? "var(--primary-color)" : "#d1d5db",
                position: "relative",
                cursor: "pointer",
                transition: "0.3s",
              }}
            >
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  background: "#fff",
                  borderRadius: "50%",
                  position: "absolute",
                  top: "3px",
                  left: formData[field.name] ? "29px" : "3px",
                  transition: "0.3s",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              ></div>
            </div>
            {field.helpText && <Form.Text className="text-muted">{field.helpText}</Form.Text>}
          </Form.Group>
        );
      default:
        return null;
    }
  };

  return (
    <Modal show={show} onHide={onHide} size={size} centered>
      <Modal.Header style={{ backgroundColor: "var(--secondary-color)", color: "var(--primary-color)", }} closeButton>
        <Modal.Title>
          {icon && <i className={`${icon} me-2`}></i>}
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {fields.length > 0 ? (
            fields.some((field) => field.section) ? (
              Object.entries(
                fields.reduce((acc, field) => {
                  const sectionName = field.section || "default";
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
                      backgroundColor: "var(--secondary-color)",

                      marginBottom: "20px",
                      borderRadius: "6px",
                    }}
                  >
                    <h6
                      style={{
                        margin: 0,
                        color: "var(--primary-color)",
                        fontSize: "16px",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
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
            <Button onClick={onCancel || onHide} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={loading}
              className="btn-custom d-flex align-items-center justify-content-center"

            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  {editingItem ? "Updating..." : "Saving..."}
                </>
              ) : editingItem ? (
                "Update"
              ) : (
                "Save"
              )}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default FormModal;