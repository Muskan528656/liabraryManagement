import React from "react";
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

  const renderField = (field) => {
    const value = formData[field.name] || "";
    const error = validationErrors[field.name];
    const isRequired = field.required;
    const fieldId = `field-${field.name}`;

    switch (field.type) {
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

      case "custom":
        return field.render ? field.render(value, formData, setFormData, error) : null;

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

