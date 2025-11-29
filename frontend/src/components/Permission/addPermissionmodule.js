import React, { useEffect, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import ModulePermissionMatrix from "./modulepermission";
import DataApi from "../../api/dataApi";

const AddPermissionModal = ({ show, handleClose, onSave, editingItem }) => {
    const [modules, setModules] = useState([]);
    const [roles, setRoles] = useState([]);

    const [formData, setFormData] = useState({
        role_id: "",
        permissions: []
    });

    useEffect(() => {
        loadModules();
        loadRoles();
    }, []);

    useEffect(() => {
        if (editingItem && modules.length > 0) {
            const mergedPermissions = modules.map(m => {
                const existing = (editingItem.module_permissions || []).find(
                    p => p.module_id === m.id
                );
                return existing || {
                    module_id: m.id,
                    allow_view: false,
                    allow_create: false,
                    allow_edit: false,
                    allow_delete: false
                };
            });
            setFormData({
                role_id: editingItem.role_id,
                permissions: mergedPermissions
            });
        }
    }, [editingItem, modules]);

    const loadModules = async () => {
        try {
            const api = new DataApi("module");
            const response = await api.fetchAll();
            console.log("Modules API response:", response);


            const modulesArray = Array.isArray(response?.data?.records) ? response.data.records : [];
            setModules(modulesArray);


            if (!editingItem) {
                setFormData(prev => ({
                    ...prev,
                    permissions: modulesArray.map(m => ({
                        module_id: m.id,
                        allow_view: false,
                        allow_create: false,
                        allow_edit: false,
                        allow_delete: false
                    }))
                }));
            }
        } catch (err) {
            console.error("Error loading modules:", err);
        }
    };

    const loadRoles = async () => {
        try {
            const api = new DataApi("user-role");
            console.log("Api->>>", api)
            const res = await api.fetchAll();
            console.log("Roles API response:", res);

            const rolesArray = Array.isArray(res?.data) ? res.data : [];
            setRoles(rolesArray);
        } catch (err) {
            console.error("Error loading roles:", err);
        }
    };

    const handleSubmit = () => {
        if (!formData.role_id) {
            alert("Please select a role");
            return;
        }
        onSave(formData);
        handleClose();
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    {editingItem ? "Edit Permission" : "Add Permission"}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form.Group className="mb-3">
                    <Form.Label>User Role</Form.Label>
                    <Form.Select
                        value={formData.role_id}
                        disabled={!!editingItem}
                        onChange={(e) =>
                            setFormData({ ...formData, role_id: e.target.value })
                        }
                    >
                        <option value="">Select Role</option>
                        {roles.map(r => (
                            <option key={r.id} value={r.id}>
                                {r.role_name}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>

                <ModulePermissionMatrix
                    modules={modules}
                    formData={formData}
                    setFormData={setFormData}
                />
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit}>
                    {editingItem ? "Update" : "Save Permission"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AddPermissionModal;
