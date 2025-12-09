import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Accordion,
  Form,
  Badge,
  Alert,
  Spinner
} from 'react-bootstrap';
import DataApi from '../../api/dataApi';
import PubSub from 'pubsub-js';
import Loader from '../common/Loader';

const PermissionCollapsible = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedRole, setExpandedRole] = useState(null);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [localChanges, setLocalChanges] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchRoles(),
          fetchPermissions(),
          fetchModules()
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Error",
          message: "Failed to load permissions data",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const fetchRoles = async () => {
    try {
      const api = new DataApi("user-role");
      const response = await api.fetchAll();
      const rolesList = Array.isArray(response?.data) ? response.data : [];
      setRoles(rolesList);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const api = new DataApi("permissions");
      const response = await api.fetchAll();
      let permsList = [];
      if (response?.data?.data) {
        permsList = response.data.data;
      } else if (Array.isArray(response?.data)) {
        permsList = response.data;
      }
      setPermissions(permsList);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const fetchModules = async () => {
    try {
      const api = new DataApi("module");
      const response = await api.fetchAll();
      const modulesList = Array.isArray(response?.data) ? response.data : [];
      setModules(modulesList);
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  const getRolePermissions = (roleId) => {
    return permissions.filter(p => p.role_id === roleId);
  };

  const getPermissionForModule = (roleId, moduleId) => {
    const key = `${roleId}-${moduleId}`;
    if (localChanges[key]) {
      return localChanges[key];
    }
    return permissions.find(p => p.role_id === roleId && p.module_id === moduleId) || {
      allow_view: false,
      allow_create: false,
      allow_edit: false,
      allow_delete: false
    };
  };

  const handlePermissionChange = (roleId, moduleId, permissionType, value) => {
    const key = `${roleId}-${moduleId}`;
    setLocalChanges(prev => ({
      ...prev,
      [key]: {
        ...getPermissionForModule(roleId, moduleId),
        [permissionType]: value
      }
    }));
  };

  const handleSavePermissions = async (roleId) => {
    try {
      setSaving(true);
      const api = new DataApi("permissions");

      const changedPerms = Object.keys(localChanges)
        .filter(key => key.startsWith(roleId))
        .map(key => ({
          moduleId: key.split('-')[1],
          ...localChanges[key]
        }));

      for (const perm of changedPerms) {
        const existingPerm = permissions.find(p => p.role_id === roleId && p.module_id === perm.moduleId);
        
        if (existingPerm) {
          await api.update(existingPerm.id, perm);
        } else {
          await api.create({
            role_id: roleId,
            module_id: perm.moduleId,
            allow_view: perm.allow_view,
            allow_create: perm.allow_create,
            allow_edit: perm.allow_edit,
            allow_delete: perm.allow_delete
          });
        }
      }


      const newChanges = { ...localChanges };
      Object.keys(newChanges).forEach(key => {
        if (key.startsWith(roleId)) delete newChanges[key];
      });
      setLocalChanges(newChanges);

      await fetchPermissions();
      setEditingRoleId(null);

      PubSub.publish("RECORD_SAVED_TOAST", {
        title: "Success",
        message: "Permissions updated successfully",
      });
    } catch (error) {
      console.error("Error saving permissions:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to save permissions",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (roleId) => {
    const keysToRemove = Object.keys(localChanges).filter(key => key.startsWith(roleId));
    const newChanges = { ...localChanges };
    keysToRemove.forEach(key => delete newChanges[key]);
    setLocalChanges(newChanges);
    setEditingRoleId(null);
  };

  if (loading) return <Loader message="Loading permissions..." />;

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-between p-3 border rounded" style={{
            background: "var(--primary-background-color)",
            borderColor: "var(--primary-color)"
          }}>
            <h4 className="mb-0 fw-bold" style={{ color: "var(--primary-color)" }}>
              <i className="fa-solid fa-lock me-2"></i>
              Role Permissions Management
            </h4>
          </div>
        </Col>
      </Row>

      {roles.length === 0 ? (
        <Alert variant="warning">
          <i className="fa-solid fa-exclamation-circle me-2"></i>
          No roles found
        </Alert>
      ) : (
        <Accordion activeKey={expandedRole} onSelect={(k) => setExpandedRole(k)}>
          {roles.map((role) => {
            const rolePerms = getRolePermissions(role.id);
            const isEditing = editingRoleId === role.id;
            const hasChanges = Object.keys(localChanges).some(key => key.startsWith(role.id));

            return (
              <Accordion.Item eventKey={role.id} key={role.id}>
                <Accordion.Header>
                  <div className="d-flex align-items-center justify-content-between w-100" onClick={(e) => e.stopPropagation()}>
                    <div className="d-flex align-items-center gap-3">
                      <i className="fa-solid fa-user-shield" style={{ fontSize: "18px", color: "var(--primary-color)" }}></i>
                      <div>
                        <h6 className="mb-0 fw-bold">{role.role_name || role.name}</h6>
                        <small className="text-muted">{rolePerms.length} modules configured</small>
                      </div>
                    </div>
                    {hasChanges && (
                      <Badge bg="warning" className="ms-2">
                        <i className="fa-solid fa-circle-exclamation me-1"></i>
                        Unsaved Changes
                      </Badge>
                    )}
                  </div>
                </Accordion.Header>
                <Accordion.Body className="bg-light">
                  {modules.length === 0 ? (
                    <Alert variant="info">No modules available</Alert>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover table-borderless">
                        <thead style={{ background: "var(--primary-background-color)" }}>
                          <tr>
                            <th style={{ color: "var(--primary-color)" }}>
                              <i className="fa-solid fa-cube me-2"></i>
                              Module
                            </th>
                            <th className="text-center" style={{ color: "var(--primary-color)", width: "80px" }}>View</th>
                            <th className="text-center" style={{ color: "var(--primary-color)", width: "100px" }}>Create</th>
                            <th className="text-center" style={{ color: "var(--primary-color)", width: "80px" }}>Edit</th>
                            <th className="text-center" style={{ color: "var(--primary-color)", width: "90px" }}>Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modules.map((module) => {
                            const perm = getPermissionForModule(role.id, module.id);
                            const isChanged = localChanges[`${role.id}-${module.id}`];

                            return (
                              <tr key={`${role.id}-${module.id}`} style={{
                                background: isChanged ? "rgba(255, 193, 7, 0.1)" : "white"
                              }}>
                                <td className="fw-medium">
                                  <i className={`fa-solid fa-${module.icon || 'box'} me-2`} style={{ color: "var(--primary-color)" }}></i>
                                  {module.name || module.module_name}
                                  {isChanged && <Badge bg="warning" className="ms-2" style={{ fontSize: "10px" }}>Modified</Badge>}
                                </td>
                                <td className="text-center">
                                  <Form.Check
                                    type="checkbox"
                                    checked={perm.allow_view}
                                    disabled={!isEditing}
                                    onChange={(e) => {
                                      if (isEditing) {
                                        handlePermissionChange(role.id, module.id, 'allow_view', e.target.checked);
                                      }
                                    }}
                                    className="d-flex justify-content-center"
                                  />
                                </td>
                                <td className="text-center">
                                  <Form.Check
                                    type="checkbox"
                                    checked={perm.allow_create}
                                    disabled={!isEditing || !perm.allow_view}
                                    onChange={(e) => {
                                      if (isEditing && perm.allow_view) {
                                        handlePermissionChange(role.id, module.id, 'allow_create', e.target.checked);
                                      }
                                    }}
                                    className="d-flex justify-content-center"
                                  />
                                </td>
                                <td className="text-center">
                                  <Form.Check
                                    type="checkbox"
                                    checked={perm.allow_edit}
                                    disabled={!isEditing || !perm.allow_view}
                                    onChange={(e) => {
                                      if (isEditing && perm.allow_view) {
                                        handlePermissionChange(role.id, module.id, 'allow_edit', e.target.checked);
                                      }
                                    }}
                                    className="d-flex justify-content-center"
                                  />
                                </td>
                                <td className="text-center">
                                  <Form.Check
                                    type="checkbox"
                                    checked={perm.allow_delete}
                                    disabled={!isEditing || !perm.allow_view}
                                    onChange={(e) => {
                                      if (isEditing && perm.allow_view) {
                                        handlePermissionChange(role.id, module.id, 'allow_delete', e.target.checked);
                                      }
                                    }}
                                    className="d-flex justify-content-center"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="d-flex gap-2 mt-4 justify-content-end">
                    {isEditing ? (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => handleCancel(role.id)}
                          disabled={saving}
                        >
                          <i className="fa-solid fa-times me-2"></i>
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => handleSavePermissions(role.id)}
                          disabled={saving || !hasChanges}
                        >
                          {saving ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-save me-2"></i>
                              Save Changes
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline-primary"
                        onClick={() => setEditingRoleId(role.id)}
                      >
                        <i className="fa-solid fa-edit me-2"></i>
                        Edit Permissions
                      </Button>
                    )}
                  </div>
                </Accordion.Body>
              </Accordion.Item>
            );
          })}
        </Accordion>
      )}
    </Container>
  );
};

export default PermissionCollapsible;
