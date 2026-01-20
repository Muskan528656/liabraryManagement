import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Table } from "react-bootstrap";
import DataApi from "../../api/dataApi";

const AddPermissionModal = ({ show, handleClose, onSave, editingItem }) => {
    const [modules, setModules] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);

    const [selectAll, setSelectAll] = useState({
        view: false,
        create: false,
        edit: false,
        delete: false,
    });

    const [formData, setFormData] = useState({
        role_id: "",
        role_name: "",
        permissions: [],
    });


    useEffect(() => {
        if (!show) {
            setFormData({ role_id: "", role_name: "", permissions: [] });
            setSelectAll({ view: false, create: false, edit: false, delete: false });
        }
    }, [show]);

    useEffect(() => {
        if (show) {
            loadModules();
            loadRoles();
        }
    }, [show]);

    useEffect(() => {
        if (modules.length === 0) return;

        if (editingItem && roles.length > 0) {
            const selectedRole = roles.find((r) => r.id === editingItem.role_id);
            if (!selectedRole) return;

            const mergedPermissions = modules.map((module) => {
                const existing = editingItem.permissions?.find(
                    (p) => p.module_id === module.id
                );
                return {
                    module_id: module.id,
                    module_name: module.name,
                    allow_view: existing?.allow_view || false,
                    allow_create: existing?.allow_create || false,
                    allow_edit: existing?.allow_edit || false,
                    allow_delete: existing?.allow_delete || false,
                };
            });

            setFormData({
                role_id: editingItem.role_id,
                role_name: editingItem.role_name || selectedRole.role_name || selectedRole.name,
                permissions: mergedPermissions,
            });

            updateSelectAllState(mergedPermissions);
        } else {
            const defaultPermissions = modules.map((m) => ({
                module_id: m.id,
                module_name: m.name,
                allow_view: false,
                allow_create: false,
                allow_edit: false,
                allow_delete: false,
            }));
            setFormData({ role_id: "", role_name: "", permissions: defaultPermissions });
            updateSelectAllState(defaultPermissions);
        }
    }, [editingItem, modules, roles]);

    // Update select all checkboxes
    const updateSelectAllState = (permissions) => {
        if (!permissions.length) return;
        setSelectAll({
            view: permissions.every((p) => p.allow_view),
            create: permissions.every((p) => p.allow_create),
            edit: permissions.every((p) => p.allow_edit),
            delete: permissions.every((p) => p.allow_delete),
        });
    };

    // Load modules from API
    const loadModules = async () => {
        try {
            setLoading(true);
            const api = new DataApi("module");
            const res = await api.fetchAll();
            const modulesArray = Array.isArray(res?.data?.records) ? res.data.records : [];
            setModules(modulesArray.sort((a, b) => (a.order_no || 999) - (b.order_no || 999)));
            setLoading(false);
        } catch (err) {
            console.error("Error loading modules:", err);
            setLoading(false);
        }
    };


    const loadRoles = async () => {
        try {
            const api = new DataApi("user-role");
            const res = await api.fetchAll();
            const rolesArray = Array.isArray(res?.data) ? res.data : [];

            const filteredRoles = rolesArray.filter(
                (role) => (role.role_name || role.name).toUpperCase() !== "SYSTEM ADMIN"
            );

            setRoles(filteredRoles);
        } catch (err) {
            console.error("Error loading roles:", err);
        }
    };

    const handleRoleChange = (e) => {
        const roleId = e.target.value;
        const selectedRole = roles.find((r) => r.id === roleId);
        if (!selectedRole) return;

        const resetPermissions = modules.map((m) => ({
            module_id: m.id,
            module_name: m.name,
            allow_view: false,
            allow_create: false,
            allow_edit: false,
            allow_delete: false,
        }));

        setFormData({
            role_id: roleId,
            role_name: selectedRole.role_name || selectedRole.name || "",
            permissions: resetPermissions,
        });

        updateSelectAllState(resetPermissions);
    };

    const handlePermissionChange = (moduleId, permissionType, value) => {
        setFormData((prev) => {
            const updatedPermissions = prev.permissions.map((perm) =>
                perm.module_id === moduleId ? { ...perm, [permissionType]: value } : perm
            );
            updateSelectAllState(updatedPermissions);
            return { ...prev, permissions: updatedPermissions };
        });
    };

    const handleSelectAll = (permissionType, value) => {
        setFormData((prev) => {
            const updatedPermissions = prev.permissions.map((perm) => ({
                ...perm,
                [permissionType]: value,
            }));
            setSelectAll((prev) => ({ ...prev, [permissionType]: value }));
            return { ...prev, permissions: updatedPermissions };
        });
    };

    const handleSubmit = () => {
        console.log("formdata->>>>>>>>>>", formData)
        if (!formData.role_id) {
            alert("Please select a role");
            return;
        }
        onSave(formData);
    };

    const getPermissionValue = (moduleId, permissionType) => {
        const perm = formData.permissions.find((p) => p.module_id === moduleId);
        return perm ? perm[permissionType] : false;
    };

    const renderPermissionCell = (moduleId, permissionType) => {
        const isChecked = getPermissionValue(moduleId, permissionType);
        return (
            <td className="text-center align-middle py-2">
                <div
                    className="d-inline-block cursor-pointer"
                    onClick={() => handlePermissionChange(moduleId, permissionType, !isChecked)}
                    title={isChecked ? "Remove permission" : "Add permission"}
                >
                    {isChecked ? (
                        <i className="fa-solid fa-check text-success fs-6"></i>
                    ) : (
                        <i className="fa-solid fa-times text-danger fs-6"></i>
                    )}
                </div>
            </td>
        );
    };

    const renderSelectAllCheckbox = (permissionType, label) => {
        const isChecked = selectAll[permissionType];
        return (
            <th width="15%" className="text-center py-2">
                <div className="d-flex flex-column align-items-center justify-content-center">
                    <span className="fw-semibold mb-1">{label}</span>
                    <div
                        className="cursor-pointer"
                        onClick={() => handleSelectAll(`allow_${permissionType}`, !isChecked)}
                        title={isChecked ? "Deselect All" : "Select All"}
                    >
                        {isChecked ? (
                            <i className="fa-solid fa-check-square text-primary fs-6"></i>
                        ) : (
                            <i className="fa-regular fa-square text-muted fs-6"></i>
                        )}
                    </div>
                </div>
            </th>
        );
    };

    return (
        <Modal backdrop="static" show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header style={{ backgroundColor: "var(--secondary-color)", color: "var(--primary-color)", }} closeButton>
                <Modal.Title className="fw-bold fs-6">
                    {editingItem ? `Edit - ${editingItem.role_name}` : "Add Role Permissions"}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="p-3">
                <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold mb-1 fs-6">User Role</Form.Label>
                    <Form.Select
                        value={formData.role_id}
                        disabled={!!editingItem}
                        onChange={handleRoleChange}
                        className="py-1 fs-6"
                        size="sm"
                    >
                        <option value="">Select a role...</option>
                        {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.role_name || r.name}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>

                {loading ? (
                    <div className="text-center py-3">
                        <i className="fa-solid fa-spinner fa-spin fs-5 me-2"></i>
                        <small>Loading modules...</small>
                    </div>
                ) : (
                    <div className="table-responsive" style={{ maxHeight: "300px", overflowY: "auto" }}>
                        <Table bordered hover className="mb-0 table-sm">
                            <thead className="table-light sticky-top" style={{ top: 0 }}>
                                <tr>
                                    <th width="40%" className="py-1 fw-bold fs-6">Module</th>
                                    {renderSelectAllCheckbox("view", "View")}
                                    {renderSelectAllCheckbox("create", "Create")}
                                    {renderSelectAllCheckbox("edit", "Edit")}
                                    {renderSelectAllCheckbox("delete", "Delete")}
                                </tr>
                            </thead>
                            <tbody>
                                {modules.length > 0 ? (
                                    modules.map((module) => (
                                        <tr key={module.id} className="fs-6">
                                            <td className="py-1 fw-medium">
                                                <div className="d-flex align-items-center">
                                                    <span
                                                        className="text-truncate"
                                                        style={{ maxWidth: "150px" }}
                                                        title={module.name}
                                                    >
                                                        {module.name || "Unnamed"}
                                                    </span>
                                                </div>
                                            </td>
                                            {renderPermissionCell(module.id, "allow_view")}
                                            {renderPermissionCell(module.id, "allow_create")}
                                            {renderPermissionCell(module.id, "allow_edit")}
                                            {renderPermissionCell(module.id, "allow_delete")}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-3 text-muted">
                                            <i className="fa-solid fa-spinner fa-spin me-1"></i>
                                            <small>Loading modules...</small>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer className="border-top pt-2 pb-2">
                <Button variant="outline-secondary" onClick={handleClose} className="px-3 py-1 fs-6">
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn-custom d-flex align-items-center justify-content-center"
                // variant="primary"
                // onClick={handleSubmit}
                // disabled={!formData.role_id || loading}
                // className="px-3 py-1 fs-6"
                >
                    <i className="fa-solid fa-save me-1"></i>
                    {editingItem ? "Update" : "Save"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AddPermissionModal;
