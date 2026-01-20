import React, { useState, useEffect } from 'react';
import AddPermissionModal from './addPermissionmodule';
import DataApi from '../../api/dataApi';
import Loader from '../common/Loader';
import PubSub from "pubsub-js";
import { Badge, InputGroup, Form, Button, Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import ConfirmationModal from "../common/ConfirmationModal";
import { useParams, useNavigate } from "react-router-dom";



//toolpit button
const TooltipButton = ({ title, children }) => (
    <OverlayTrigger
        placement="top"
        overlay={<Tooltip>{title}</Tooltip>}
    >
        <span className="d-inline-block">
            {children}
        </span>
    </OverlayTrigger>
);


const Permission = () => {
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [expandedRoles, setExpandedRoles] = useState({});
    const [roles, setRoles] = useState([]);
    const [editingRow, setEditingRow] = useState(null);
    const [editingPermissions, setEditingPermissions] = useState({});
    const [selectAllStates, setSelectAllStates] = useState({});

    const [deleteId, setdeleteId] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const[setCheck,check] = useState(" ")
    const navigate = useNavigate();
    const { id } = useParams();

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
            } else if (result && Array.isArray(result)) {
                permissionsData = result;
            }

            console.log("Fetched permissions data:", permissionsData);

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
            console.log("Fetched roles:", rolesArray);
            setRoles(rolesArray);
        } catch (err) {
            console.error("Error loading roles:", err);
        }
    };

    useEffect(() => {
        fetchPermissions();
        fetchRoles();
    }, [refreshKey]);

    // Update select all states when editing starts or permissions change
    useEffect(() => {
        if (editingRow) {
            const rolePerms = permissions.filter(p => (p.role_id || 'null') === editingRow);
            const newSelectAllStates = {};

            // Check all four permission types
            ['allow_view', 'allow_create', 'allow_edit', 'allow_delete'].forEach(permissionType => {
                const allModulesHavePerm = rolePerms.every(perm =>
                    editingPermissions[perm.module_id]?.[permissionType] || false
                );
                newSelectAllStates[permissionType] = allModulesHavePerm && rolePerms.length > 0;
            });

            setSelectAllStates(newSelectAllStates);
        }
    }, [editingPermissions, editingRow, permissions]);

    const confirmDelete = async () => {

        console.log("deletingid", deleteId);
        check = 1;
        // try {
        //     const api = new DataApi("permissions");
        //     const reponse = await api.delete(deleteId);
        //     console.log("response", reponse);

        //     PubSub.publish("RECORD_SAVED_TOAST", {
        //         title: "Success",
        //         message: ` deleted successfully`,
        //     });
        //     navigate(`/permissions`);
        // } catch (error) {
        //     PubSub.publish("RECORD_ERROR_TOAST", {
        //         title: "Error",
        //         message: `Failed to delete ${error.message}`,
        //     });
        // }

        // setShowConfirmModal(false);
        // if (!window.confirm(`Are you sure you want to delete all permissions for "${roleName}"?`)) {
        //     return;
        // }

        // try {
        //     const api = new DataApi("permissions");
        //     const rolePerms = permissions.filter(p => (p.deleteId || 'null') === deleteId);

        //     for (const perm of rolePerms) {
        //         if (perm.id) {
        //             await api.delete(perm.id);
        //         }
        //     }

        //     // alert(`Permissions for ${roleName} deleted successfully!`);
        //     PubSub.publish("RECORD_SAVED_TOAST", {
        //         message: `Permissions for "${roleName}" deleted successfully!`,
        //     });
        //     setRefreshKey(prev => prev + 1);
        // } catch (err) {
        //     console.error("Error deleting permissions:", err);
        //     // alert("Failed to delete permissions");
        //     PubSub.publish("RECORD_ERROR_TOAST", {
        //         message: err.message || "Failed to delete permissions",
        //     });

        // }
    };

    const handleSavePermission = async (formData) => {
        try {
            console.log("Saving permissions for role:", formData.role_id);

            // Prepare permissions array
            const permissionsToSave = formData.permissions.map(perm => ({
                module_id: perm.module_id,
                allow_view: perm.allow_view || false,
                allow_create: perm.allow_create || false,
                allow_edit: perm.allow_edit || false,
                allow_delete: perm.allow_delete || false
            }));

            // Use the bulk update API
            const api = new DataApi("permissions/role");

            const response = await api.update({
                role_id: formData.role_id,
                permissions: permissionsToSave
            }, formData.role_id); // Pass role_id as second parameter

            // if (response.data.success) {
            //     alert("Permissions saved successfully!");
            //     setShowAddModal(false);
            //     setEditingRole(null);
            //     setRefreshKey(prev => prev + 1);
            // } else {
            //     throw new Error(response.data.error || "Failed to save permissions");
            // }
            if (response.data.success) {

                sessionStorage.setItem(
                    "permissions",
                    JSON.stringify(permissionsToSave.map(p => ({
                        ...p,
                        role_id: formData.role_id
                    })))
                );


                window.dispatchEvent(new Event("permissionsUpdated"));

                alert("Permissions saved successfully!");
                setShowAddModal(false);
                setEditingRole(null);
                setRefreshKey(prev => prev + 1);
            }

        } catch (err) {
            console.error("Permission save error", err);
            alert("Failed to save permissions: " + err.message);
        }
    };

    const handleInlineSave = async (roleId, roleName) => {
        try {
            const actualRoleId = roleId === 'null' ? null : roleId;

            const permissionsToSave = Object.keys(editingPermissions).map(moduleId => ({
                module_id: moduleId,
                allow_view: editingPermissions[moduleId].allow_view || false,
                allow_create: editingPermissions[moduleId].allow_create || false,
                allow_edit: editingPermissions[moduleId].allow_edit || false,
                allow_delete: editingPermissions[moduleId].allow_delete || false
            }));

            console.log("Saving inline permissions for role:", actualRoleId, permissionsToSave);

            // Check if roleId is null or undefined
            const api = new DataApi("permissions/role");

            const payload = {
                role_id: actualRoleId,
                permissions: permissionsToSave
            };

            // For null role_id, use a different endpoint or handle specially
            let response;
            if (actualRoleId === null || actualRoleId === undefined || actualRoleId === 'null') {
                // For null role, update each permission individually
                const nullApi = new DataApi("permissions");
                const rolePerms = permissions.filter(p => (p.role_id || 'null') === roleId);

                for (const moduleId in editingPermissions) {
                    const moduleData = editingPermissions[moduleId];
                    const existingPerm = rolePerms.find(p => p.module_id === moduleId);

                    if (existingPerm && existingPerm.id) {
                        // Update existing permission
                        await nullApi.update({
                            allow_view: moduleData.allow_view,
                            allow_create: moduleData.allow_create,
                            allow_edit: moduleData.allow_edit,
                            allow_delete: moduleData.allow_delete
                        }, existingPerm.id);
                    } else {
                        // Create new permission for null role
                        await nullApi.create({
                            role_id: null,
                            module_id: moduleId,
                            allow_view: moduleData.allow_view,
                            allow_create: moduleData.allow_create,
                            allow_edit: moduleData.allow_edit,
                            allow_delete: moduleData.allow_delete
                        });
                    }
                }

                response = { data: { success: true } };
            } else {
                // For regular role_id, use the bulk update endpoint
                // Note: The update method expects (data, id)
                response = await api.update(payload, actualRoleId);
            }

            // if (response.data && response.data.success) {
            //     alert(`Permissions updated successfully for ${roleName}!`);
            //     setEditingRow(null);
            //     setEditingPermissions({});
            //     setSelectAllStates({});
            //     setRefreshKey(prev => prev + 1);
            // } else {
            //     throw new Error(response.data?.error || "Failed to save permissions");
            // }
            if (response.data && response.data.success) {

                // 🔥 sessionStorage sync
                sessionStorage.setItem(
                    "permissions",
                    JSON.stringify(permissionsToSave.map(p => ({
                        ...p,
                        role_id: actualRoleId
                    })))
                );

                // 🔥 fire global event
                window.dispatchEvent(new Event("permissionsUpdated"));

                // alert(`Permissions updated successfully for ${roleName}!`);

                PubSub.publish("RECORD_SAVED_TOAST", {
                    title: "Success",
                    message: `Permissions updated for ${roleName}`,
                });

                setExpandedRoles("");

                setEditingRow(null);
                setEditingPermissions({});
                setSelectAllStates({});
                setRefreshKey(prev => prev + 1);
            }

        } catch (err) {
            console.error("Error saving inline permissions:", err);
            PubSub.publish("RECORD_SAVED_TOAST", {
                title: "fasle",
                message: err.message || "Failed to save permissions",
            });
        }
    };

    const groupPermissionsByRole = () => {
        const grouped = {};

        permissions.forEach(perm => {
            // Use null check for role_id
            const roleId = perm.role_id || 'null';
            const roleInfo = roles.find(r => r.id === perm.role_id);

            let roleName;
            if (roleInfo) {
                roleName = roleInfo.role_name || roleInfo.name || `Role ${roleId}`;
            } else {
                // If role not found, check if permission has role_name
                roleName = perm.role_name || `Role ${roleId}`;
            }

            if (!grouped[roleId]) {
                grouped[roleId] = {
                    role_id: roleId,
                    role_name: roleName,
                    permissions: [],
                    modules_count: 0
                };
            }

            // Add all permission data to the group
            grouped[roleId].permissions.push({
                ...perm,
                module_id: perm.module_id,
                module_name: perm.module_name || `Module ${perm.module_id}`,
                allow_view: perm.allow_view || false,
                allow_create: perm.allow_create || false,
                allow_edit: perm.allow_edit || false,
                allow_delete: perm.allow_delete || false
            });

            grouped[roleId].modules_count++;
        });

        const result = Object.values(grouped);
        console.log("Grouped permissions:", result);
        return result;
    };

    const rolePermissions = groupPermissionsByRole();

    const handleInlineEditStart = (roleId, roleName) => {
        setEditingRow(roleId);

        setExpandedRoles(prev => ({
            ...prev,
            [roleId]: !prev[roleId]
        }));

        // Initialize editing permissions with current permissions
        const rolePerms = permissions.filter(p => (p.role_id || 'null') === roleId);
        const editingData = {};

        rolePerms.forEach(perm => {
            editingData[perm.module_id] = {
                allow_view: perm.allow_view || false,
                allow_create: perm.allow_create || false,
                allow_edit: perm.allow_edit || false,
                allow_delete: perm.allow_delete || false
            };
        });

        console.log("Starting inline edit for role:", roleId, editingData);
        setEditingPermissions(editingData);
    };

    const handleInlineToggle = (moduleId, field) => {
        setEditingPermissions(prev => {
            const currentData = prev[moduleId] || {
                allow_view: false,
                allow_create: false,
                allow_edit: false,
                allow_delete: false
            };

            const updated = {
                ...prev,
                [moduleId]: {
                    ...currentData,
                    [field]: !currentData[field]
                }
            };

            console.log("Toggled:", moduleId, field, !currentData[field]);
            return updated;
        });
    };

    // Handle select all for a specific permission type
    const handleSelectAllToggle = (permissionType) => {
        if (!editingRow) return;

        const rolePerms = permissions.filter(p => (p.role_id || 'null') === editingRow);
        const currentState = selectAllStates[permissionType] || false;
        const newValue = !currentState;

        setEditingPermissions(prev => {
            const updated = { ...prev };

            rolePerms.forEach(perm => {
                if (perm.module_id) {
                    const currentData = updated[perm.module_id] || {
                        allow_view: false,
                        allow_create: false,
                        allow_edit: false,
                        allow_delete: false
                    };

                    updated[perm.module_id] = {
                        ...currentData,
                        [permissionType]: newValue
                    };
                }
            });

            return updated;
        });

        setSelectAllStates(prev => ({
            ...prev,
            [permissionType]: newValue
        }));
    };

    const handleInlineCancel = (roleId) => {
        setExpandedRoles("");
        setEditingRow(null);
        setEditingPermissions({});
        setSelectAllStates({});
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

    const handleEditRole = (role) => {
        setEditingRole({
            role_id: role.role_id === 'null' ? null : role.role_id,
            role_name: role.role_name,
            permissions: role.permissions
        });
        setShowAddModal(true);
    };

    const handleDeleteRole = async (roleId, roleName) => {

        // setShowConfirmModal(true);
        // setdeleteId(roleId);
        if(roleId){
            setShowConfirmModal(true)
        }else if(check == 1){
              console.log("setdelteid", deleteId);
        console.log("roleId", roleId);
        console.log("showmodel", showConfirmModal);
        console.log("roleName", roleName);

        if (!window.confirm(`Are you sure you want to delete all permissions for "${roleName}"?`)) {
            return;
        }
      
      

        try {
            const api = new DataApi("permissions");
            const rolePerms = permissions.filter(p => (p.role_id || 'null') === roleId);

            for (const perm of rolePerms) {
                if (perm.id) {
                    const response = await api.delete(perm.id);
                    console.log("response",response)
                }
            }

            // alert(`Permissions for ${roleName} deleted successfully!`);
            PubSub.publish("RECORD_SAVED_TOAST", {
                message: `Permissions for "${roleName}" deleted successfully!`,
            });
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            console.error("Error deleting permissions:", err);
            // alert("Failed to delete permissions");
            PubSub.publish("RECORD_ERROR_TOAST", {
                message: err.message || "Failed to delete permissions",
            });

        }
        }
      
        
      
    };

    const CustomHeader = () => (
        <div className="d-flex justify-content-between align-items-center  p-2 my-4 mx-3"
            style={{
                color: "var(--primary-color)",
                background: "var(--primary-background-color)",
                borderRadius: "10px",
            }}>
            <h5 className="fw-bold mb-1">
                <i className="fa-solid fa-lock me-2 fs-6"></i> Role Permissions ({rolePermissions.length})
            </h5>
            <div>
                <TooltipButton title="Expand All">
                    <Button
                        variant="outline-secondary"
                        className="custom-btn-table-header p-2 me-2"
                        onClick={expandAllRoles}
                    >
                        <i className="fa-solid fa-expand fs-6 my-1"></i>
                    </Button>
                </TooltipButton>


                <TooltipButton title="Collapse All">
                    <Button
                        variant="outline-secondary"
                        className="custom-btn-table-header p-2 me-2"
                        onClick={collapseAllRoles}
                    >
                        <i className="fa-solid fa-compress fs-6 my-1"></i>
                    </Button>
                </TooltipButton>

                <TooltipButton title="Add Role Permission">
                    <Button

                        className="custom-btn-table-header p-2 me-2"
                        onClick={() => {
                            setEditingRole(null);
                            setShowAddModal(true);
                        }}
                    >
                        <i className="fa-solid fa-plus fs-6 my-1"></i>
                    </Button>
                </TooltipButton>
            </div>
        </div>
    );

    const PermissionCell = ({ isEditing, moduleId, field, value, onToggle }) => {
        let checked;

        if (isEditing) {
            const editingData = editingPermissions[moduleId];
            checked = editingData ? editingData[field] : false;
        } else {
            checked = value || false;
        }

        const handleClick = () => {
            if (isEditing && onToggle) {
                onToggle(moduleId, field);
            }
        };

        return (
            <div
                className="d-inline-block cursor-pointer"
                onClick={handleClick}
                style={{ pointerEvents: isEditing ? 'auto' : 'none' }}
                title={checked ? "Enabled" : "Disabled"}
            >
                {checked ? (
                    <i className="fa-solid fa-check-square text-primary fs-6"></i>
                ) : (
                    <i className="fa-regular fa-square text-secondary fs-6"></i>
                )}
            </div>
        );
    };

    // Component for select all checkbox header
    const SelectAllHeader = ({ permissionType, label }) => {
        const isEditing = editingRow !== null;
        const isChecked = selectAllStates[permissionType] || false;

        return (
            <th width="17.5%" className="text-center">
                <div className="d-flex flex-column align-items-center justify-content-center">
                    <span className="fw-semibold mb-1">{label}</span>
                    {isEditing ? (
                        <div
                            className="cursor-pointer"
                            onClick={() => handleSelectAllToggle(permissionType)}
                            title={isChecked ? "Deselect All" : "Select All"}
                        >
                            {isChecked ? (
                                <i className="fa-solid fa-check-square text-primary fs-6"></i>
                            ) : (
                                <i className="fa-regular fa-square text-secondary fs-6"></i>
                            )}
                        </div>
                    ) : (
                        <div className="text-muted">
                            <i className="fa-regular fa-square fs-6"></i>
                        </div>
                    )}
                </div>
            </th>
        );
    };

    const RoleAccordion = ({ role }) => {
        const isExpanded = expandedRoles[role.role_id] || false;
        const isEditing = editingRow === role.role_id;

        const viewCount = role.permissions.filter(p => p.allow_view).length;
        const createCount = role.permissions.filter(p => p.allow_create).length;
        const editCount = role.permissions.filter(p => p.allow_edit).length;
        const deleteCount = role.permissions.filter(p => p.allow_delete).length;

        return (
            <div className="card mb-3 border shadow-sm mx-3 ">
                <div className="card-header p-3 d-flex justify-content-between align-items-center bg-light ">
                    <div className="d-flex align-items-center">
                        {/* <button
                            className="btn btn-sm btn-outline-secondary me-3"
                        // onClick={() => toggleRoleAccordion(role.role_id)}
                        // title={isExpanded ? "Collapse" : "Expand"}
                        >
                            <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'}`}></i> */}
                        {/* <i className="fa-solid fa-chevron-down"></i>
                        </button> */}
                        <div>
                            <h6 className="mb-0 fw-bold">
                                <i className="fa-solid fa-user-tag me-2 text-primary"></i>
                                {role.role_name}
                            </h6>
                            {/* <small className="text-muted">
                                {role.modules_count} module{role.modules_count !== 1 ? 's' : ''} •
                                <span className="ms-1">
                                    {viewCount} view, {createCount} create, {editCount} edit, {deleteCount} delete
                                </span>
                            </small> */}
                        </div>
                    </div>
                    <div className="d-flex gap-1 ">
                        {isEditing ? (
                            <>
                                {/* <button
                                    className="btn btn-sm btn-success me-2"
                                    onClick={() => handleInlineSave(role.role_id, role.role_name)}
                                > */}
                                <i className="fa-solid fa-check me-1 fs-6 text-success me-3"
                                    onClick={() => handleInlineSave(role.role_id, role.role_name)}
                                ></i>
                                {/* Save
                                </button> */}
                                {/* <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => handleInlineCancel(role.role_id)}
                                > */}
                                <i className="fa-solid fa-times me-1 fs-6 text-secondary me-4"
                                    onClick={() => handleInlineCancel(role.role_id)}
                                ></i>
                                {/* Cancel
                                </button> */}
                            </>
                        ) : (
                            <>
                                {/* <button
                                    className="btn btn-sm btn-outline-primary"
                                     onClick={() => handleInlineEditStart(role.role_id, role.role_name)}
                                    //  onClick={() => toggleRoleAccordion(role.role_id)}
                                    title="Quick Edit permissions"
                                > */}
                                <i className="fa-solid fa-edit me-1 fs-6 text-primary me-3"
                                    onClick={() => handleInlineEditStart(role.role_id, role.role_name)}
                                ></i>
                                {/* Edit
                                 } */}

                                {/* <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDeleteRole(role.role_id, role.role_name)}
                                    title="Delete all permissions for this role"
                                > */}
                                <i className="fa-solid fa-trash me-1 me-4 fs-6 text-danger"
                                    onClick={() => handleDeleteRole(role.role_id, role.role_name)}
                                ></i>
                                {/* Delete
                                </button> */}
                            </>
                        )}
                    </div>
                </div>

                {isExpanded && (
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0 ">
                                <thead className="table-light bg-primary">
                                    <tr>
                                        <th width="30%" className="ps-4">Module Name</th>
                                        <SelectAllHeader permissionType="allow_view" label="View" />
                                        <SelectAllHeader permissionType="allow_create" label="Create" />
                                        <SelectAllHeader permissionType="allow_edit" label="Edit" />
                                        <SelectAllHeader permissionType="allow_delete" label="Delete" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {role.permissions && role.permissions.length > 0 ? (
                                        role.permissions.map(perm => (
                                            <tr key={`${role.role_id}-${perm.module_id}`}>
                                                <td className="ps-4 py-2">
                                                    {perm.module_name || `Module ${perm.module_id}`}
                                                </td>
                                                <td className="text-center align-middle py-2">
                                                    <PermissionCell
                                                        isEditing={isEditing}
                                                        moduleId={perm.module_id}
                                                        field="allow_view"
                                                        value={perm.allow_view}
                                                        onToggle={handleInlineToggle}
                                                    />
                                                </td>
                                                <td className="text-center align-middle py-2">
                                                    <PermissionCell
                                                        isEditing={isEditing}
                                                        moduleId={perm.module_id}
                                                        field="allow_create"
                                                        value={perm.allow_create}
                                                        onToggle={handleInlineToggle}
                                                    />
                                                </td>
                                                <td className="text-center align-middle py-2">
                                                    <PermissionCell
                                                        isEditing={isEditing}
                                                        moduleId={perm.module_id}
                                                        field="allow_edit"
                                                        value={perm.allow_edit}
                                                        onToggle={handleInlineToggle}
                                                    />
                                                </td>
                                                <td className="text-center align-middle py-2">
                                                    <PermissionCell
                                                        isEditing={isEditing}
                                                        moduleId={perm.module_id}
                                                        field="allow_delete"
                                                        value={perm.allow_delete}
                                                        onToggle={handleInlineToggle}
                                                    />
                                                </td>
                                            </tr>
                                        ))
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
            {console.log("showConfirmModal", showConfirmModal)}
            {showConfirmModal &&
                <ConfirmationModal
                    show={showConfirmModal}
                    onHide={() => setShowConfirmModal(false)}
                    onConfirm={confirmDelete}
                    title={`Delete `}
                    message={`Are you sure you want to delete this ?`}
                    confirmText="Delete"
                    cancelText="Cancel"
                />
            }
        </div>
    );
};

export default Permission;