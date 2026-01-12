import React, { useState, useEffect } from 'react';
import AddPermissionModal from './addPermissionmodule';
import DataApi from '../../api/dataApi';
import Loader from '../common/Loader';

const Permission = () => {
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [expandedRoles, setExpandedRoles] = useState({});
    const [roles, setRoles] = useState([]);
    const [editingRow, setEditingRow] = useState(null); // Track which row is being edited
    const [inlineFormData, setInlineFormData] = useState({});

    const fetchPermissions = async () => {
        try {
            setLoading(true);
            const api = new DataApi("permissions");
            const result = await api.fetchAll();


            let permissionsData = [];

            if (result && result.data && result.data.data) {
                permissionsData = result.data.data;
            } else if (result && Array.isArray(result.data)) {
                permissionsData = result.data;
            }


            setPermissions(permissionsData || []);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching permissions:", err);
            setError(err.message || "Failed to fetch permissions");
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const api = new DataApi("user-role");
            const res = await api.fetchAll();


            const rolesArray = Array.isArray(res?.data) ? res.data : [];
            setRoles(rolesArray);
        } catch (err) {
            console.error("Error loading roles:", err);
        }
    };

    useEffect(() => {
        fetchPermissions();
        fetchRoles();
    }, [refreshKey]);

    const handleSavePermission = async (formData) => {
        try {


            const api = new DataApi("permissions");
            const savedPermissions = [];
            const errors = [];

            const existingPermissions = permissions.filter(p => p.role_id === formData.role_id);

            for (const permission of formData.permissions) {
                const permissionData = {
                    role_id: formData.role_id,
                    role_name: formData.role_name,
                    module_id: permission.module_id,
                    module_name: permission.module_name,
                    allow_view: permission.allow_view,
                    allow_create: permission.allow_create,
                    allow_edit: permission.allow_edit,
                    allow_delete: permission.allow_delete
                };

                const existingPerm = existingPermissions.find(p => p.module_id === permission.module_id);

                try {
                    if (existingPerm) {

                        await api.update(existingPerm.id, permissionData);
                        savedPermissions.push({ ...permissionData, id: existingPerm.id });
                    } else {

                        const response = await api.create(permissionData);
                        savedPermissions.push({ ...permissionData, id: response.data?.id });
                    }
                } catch (err) {
                    console.error(`Error saving permission for module ${permission.module_name}:`, err);
                    errors.push(permission.module_name);
                }
            }

            if (errors.length > 0) {
                alert(`Permissions saved with some errors. Failed modules: ${errors.join(', ')}`);
            } else {
                alert(`${savedPermissions.length} permissions saved successfully!`);
            }

            setShowAddModal(false);
            setEditingRole(null);
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            console.error("Error saving permission:", err);
            alert("Error saving permission: " + err.message);
        }
    };


    const groupPermissionsByRole = () => {
        const grouped = {};

        permissions.forEach(perm => {
            const roleId = perm.role_id;
            const roleInfo = roles.find(r => r.id === roleId);
            const roleName = roleInfo ? (roleInfo.role_name || roleInfo.name || `Role ${roleId}`)
                : (perm.role_name || `Role ${roleId}`);

            if (!grouped[roleId]) {
                grouped[roleId] = {
                    role_id: roleId,
                    role_name: roleName,
                    permissions: [],
                    modules_count: 0
                };
            }
            grouped[roleId].permissions.push(perm);
            grouped[roleId].modules_count++;
        });

        return Object.values(grouped);
    };

    const rolePermissions = groupPermissionsByRole();




    const handleInlineEdit = (roleId, moduleId, permissionType, value) => {
        setInlineFormData(prev => ({
            ...prev,
            [moduleId]: {
                ...prev[moduleId],
                [permissionType]: value
            }
        }));

    }
    const handleInlineSave = async (roleId, roleName) => {
        try {
            const api = new DataApi("permissions");
            const rolePerms = permissions.filter(p => p.role_id === roleId);
            const savedPermissions = [];
            const errors = [];

            for (const moduleId in inlineFormData) {
                const moduleData = inlineFormData[moduleId];
                const existingPerm = rolePerms.find(p => p.module_id === parseInt(moduleId));

                const permissionData = {
                    role_id: roleId,
                    role_name: roleName,
                    module_id: parseInt(moduleId),
                    module_name: existingPerm?.module_name || `Module ${moduleId}`,
                    allow_view: moduleData.allow_view,
                    allow_create: moduleData.allow_create,
                    allow_edit: moduleData.allow_edit,
                    allow_delete: moduleData.allow_delete
                };

                try {
                    if (existingPerm) {
                        await api.update(existingPerm.id, permissionData);
                        savedPermissions.push({ ...permissionData, id: existingPerm.id });
                    } else {
                        const response = await api.create(permissionData);
                        savedPermissions.push({ ...permissionData, id: response.data?.id });
                    }
                } catch (err) {
                    console.error(`Error saving permission for module ${moduleId}:`, err);
                    errors.push(moduleId);
                }
            }

            if (errors.length > 0) {
                alert(`Permissions saved with some errors. Failed modules: ${errors.length}`);
            } else {
                alert(`Permissions updated successfully for ${roleName}!`);
            }

            setEditingRow(null);
            setInlineFormData({});
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            console.error("Error saving inline permissions:", err);
            alert("Error saving permissions: " + err.message);
        }
    };

    const handleInlineCancel = () => {
        setEditingRow(null);
        setInlineFormData({});
    };

    const toggleRoleAccordion = (roleId) => {
        setExpandedRoles(prev => ({
            ...prev,
            [roleId]: !prev[roleId]
        }));
    };


    const expandAllRoles = () => {
        const expanded = {};
        rolePermissions.forEach(role => {
            expanded[role.role_id] = true;
        });
        setExpandedRoles(expanded);
    };

    const collapseAllRoles = () => {
        setExpandedRoles({});
    };

    const CustomHeader = () => (
        <div className="d-flex justify-content-between align-items-center mb-4 p-2"
            style={{
                color: "var(--primary-color)",
                background: "var(--primary-background-color)",
                borderRadius: "10px",
            }}>
            <h5 className="fw-bold mb-1">
                <i className="fa-solid fa-lock me-2 fs-6"></i> Role Permissions ({rolePermissions.length})
            </h5>
            <div>
                <button
                    className="btn btn-outline-secondary btn-sm me-2"
                    onClick={expandAllRoles}
                    title="Expand All"
                >
                    <i className="fa-solid fa-expand me-1"></i> Expand All
                </button>
                <button
                    className="btn btn-outline-secondary btn-sm me-2"
                    onClick={collapseAllRoles}
                    title="Collapse All"
                >
                    <i className="fa-solid fa-compress me-1"></i> Collapse All
                </button>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                        setEditingRole(null);
                        setShowAddModal(true);
                    }}
                >
                    <i className="fa-solid fa-plus me-1"></i> Add Role Permission
                </button>
            </div>
        </div>
    );

    const RoleAccordion = ({ role }) => {
        const isExpanded = expandedRoles[role.role_id] || false;
        const isEditing = editingRow === role.role_id;


        const viewCount = role.permissions.filter(p => p.allow_view).length;
        const createCount = role.permissions.filter(p => p.allow_create).length;
        const editCount = role.permissions.filter(p => p.allow_edit).length;
        const deleteCount = role.permissions.filter(p => p.allow_delete).length;

        return (
            <div className="card mb-3 border shadow-sm">
                <div className="card-header bg-light p-3 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                        <button
                            className="btn btn-sm btn-outline-secondary me-3"
                            onClick={() => toggleRoleAccordion(role.role_id)}
                        >
                            <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                        </button>
                        <div>
                            <h6 className="mb-0 fw-bold">
                                <i className="fa-solid fa-user-tag me-2 text-primary"></i>
                                {role.role_name}
                            </h6>
                            <small className="text-muted">
                                {role.modules_count} module{role.modules_count !== 1 ? 's' : ''} •
                                <span className="ms-1">
                                    {viewCount} view, {createCount} create, {editCount} edit, {deleteCount} delete
                                </span>
                            </small>
                        </div>
                    </div>
                    <div>
                        {isEditing ? (
                            <>
                                <button
                                    className="btn btn-sm btn-success me-2"
                                    onClick={() => handleInlineSave(role.role_id, role.role_name)}
                                >
                                    <i className="fa-solid fa-check me-1"></i> Save
                                </button>
                                <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={handleInlineCancel}
                                >
                                    <i className="fa-solid fa-times me-1"></i> Cancel
                                </button>
                            </>
                        ) : (
                            <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleInlineEdit(role.role_id, role.role_name)}
                                title="Edit permissions inline"
                            >
                                <i className="fa-solid fa-edit me-1"></i> Edit
                            </button>
                        )}
                    </div>
                </div>

                {isExpanded && (
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th width="30%" className="ps-4">Module Name</th>
                                        <th width="17.5%" className="text-center">View</th>
                                        <th width="17.5%" className="text-center">Create</th>
                                        <th width="17.5%" className="text-center">Edit</th>
                                        <th width="17.5%" className="text-center">Delete</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {role.permissions.length > 0 ? (
                                        role.permissions.map(perm => {
                                            return (
                                                <tr key={`${role.role_id}-${perm.module_id}`}>
                                                    <td className="ps-4 py-2">
                                                        {perm.module_name}
                                                    </td>
                                                    {/* View Permission */}
                                                    <td className="text-center align-middle py-2">
                                                        {isEditing ? (
                                                            <div
                                                                className="d-inline-block cursor-pointer"
                                                                onClick={() => handleInlineEdit(
                                                                    role.role_id,
                                                                    perm.module_id,
                                                                    'allow_view',
                                                                    !inlineFormData[perm.module_id]?.allow_view
                                                                )}
                                                            >
                                                                {inlineFormData[perm.module_id]?.allow_view ? (
                                                                    <i className="fa-solid fa-check-square text-primary fs-5"></i>
                                                                ) : (
                                                                    <i className="fa-solid fa-times-square text-danger fs-5"></i>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            perm.allow_view ? (
                                                                <i className="fa-solid fa-check-square text-primary fs-5"></i>
                                                            ) : (
                                                                <i className="fa-solid fa-times-square text-danger fs-5"></i>
                                                            )
                                                        )}
                                                    </td>
                                                    {/* Create Permission */}
                                                    <td className="text-center align-middle py-2">
                                                        {isEditing ? (
                                                            <div
                                                                className="d-inline-block cursor-pointer"
                                                                onClick={() => handleInlineEdit(
                                                                    role.role_id,
                                                                    perm.module_id,
                                                                    'allow_create',
                                                                    !inlineFormData[perm.module_id]?.allow_create
                                                                )}
                                                            >
                                                                {inlineFormData[perm.module_id]?.allow_create ? (
                                                                    <i className="fa-solid fa-check-square text-primary fs-5"></i>
                                                                ) : (
                                                                    <i className="fa-solid fa-times-square text-danger fs-5"></i>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            perm.allow_create ? (
                                                                <i className="fa-solid fa-check-square text-primary fs-5"></i>
                                                            ) : (
                                                                <i className="fa-solid fa-times-square text-danger fs-5"></i>
                                                            )
                                                        )}
                                                    </td>
                                                    {/* Edit Permission */}
                                                    <td className="text-center align-middle py-2">
                                                        {isEditing ? (
                                                            <div
                                                                className="d-inline-block cursor-pointer"
                                                                onClick={() => handleInlineEdit(
                                                                    role.role_id,
                                                                    perm.module_id,
                                                                    'allow_edit',
                                                                    !inlineFormData[perm.module_id]?.allow_edit
                                                                )}
                                                            >
                                                                {inlineFormData[perm.module_id]?.allow_edit ? (
                                                                    <i className="fa-solid fa-check-square text-primary fs-5"></i>
                                                                ) : (
                                                                    <i className="fa-solid fa-times-square text-danger fs-5"></i>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            perm.allow_edit ? (
                                                                <i className="fa-solid fa-check-square text-primary fs-5"></i>
                                                            ) : (
                                                                <i className="fa-solid fa-times-square text-danger fs-5"></i>
                                                            )
                                                        )}
                                                    </td>
                                                    {/* Delete Permission */}
                                                    <td className="text-center align-middle py-2">
                                                        {isEditing ? (
                                                            <div
                                                                className="d-inline-block cursor-pointer"
                                                                onClick={() => handleInlineEdit(
                                                                    role.role_id,
                                                                    perm.module_id,
                                                                    'allow_delete',
                                                                    !inlineFormData[perm.module_id]?.allow_delete
                                                                )}
                                                            >
                                                                {inlineFormData[perm.module_id]?.allow_delete ? (
                                                                    <i className="fa-solid fa-check-square text-primary fs-5"></i>
                                                                ) : (
                                                                    <i className="fa-solid fa-times-square text-danger fs-5"></i>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            perm.allow_delete ? (
                                                                <i className="fa-solid fa-check-square text-primary fs-5"></i>
                                                            ) : (
                                                                <i className="fa-solid fa-times-square text-danger fs-5"></i>
                                                            )
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center py-3 text-muted">
                                                No permissions set for this role
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return <Loader message="Loading permissions..." />;
    }

    if (error) {
        return (
            <div className="alert alert-danger m-3">
                <h4>Failed to load permissions</h4>
                <p>{error}</p>
                <button
                    className="btn btn-secondary mt-2"
                    onClick={fetchPermissions}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="container-fluid permission-page">
            <CustomHeader />

            {rolePermissions.length === 0 ? (
                <div className="alert alert-info text-center">
                    <i className="fa-solid fa-info-circle me-2"></i>
                    No role permissions available. Click "Add Role Permission" to create one.
                </div>
            ) : (
                <div>
                    {rolePermissions.map(role => (
                        <RoleAccordion key={role.role_id} role={role} />
                    ))}
                </div>
            )}

            <AddPermissionModal
                show={showAddModal}
                handleClose={() => {
                    setShowAddModal(false);
                    setEditingRole(null);
                }}
                editingItem={editingRole}
                onSave={handleSavePermission}
            />
        </div>
    );
};

export default Permission;