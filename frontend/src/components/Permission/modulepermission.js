import React from "react";
import { Form, Row, Col, Table } from "react-bootstrap";

const ModulePermissionMatrix = ({ modules, formData, setFormData }) => {

    const handleToggle = (module_id, key) => {
        const updated = formData.permissions.map(p =>
            p.module_id === module_id
                ? { ...p, [key]: !p[key] }
                : p
        );
        setFormData({ ...formData, permissions: updated });
    };

    return (
        <Table bordered hover size="sm">
            <thead>
                <tr>
                    <th>Module</th>
                    <th>View</th>
                    <th>Create</th>
                    <th>Edit</th>
                    <th>Delete</th>
                </tr>
            </thead>
            <tbody>
                {modules.map(m => {
                    const row = formData.permissions.find(p => p.module_id === m.id);
                    return (
                        <tr key={m.id}>
                            {m.module_name || m.name || "Unknown"}

                            {["allow_view", "allow_create", "allow_edit", "allow_delete"].map(key => (
                                <td key={key}>
                                    <Form.Check
                                        type="switch"
                                        checked={row?.[key] ?? false}
                                        onChange={() => handleToggle(m.id, key)}
                                    />
                                </td>
                            ))}
                        </tr>
                    );
                })}
            </tbody>
        </Table>
    );
};

export default ModulePermissionMatrix;
