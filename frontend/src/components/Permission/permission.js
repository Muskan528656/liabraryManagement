

import React, { useState, useEffect } from 'react';
import AddPermissionModal from './addPermissionmodule';
import DataApi from '../../api/dataApi';
import { AuthHelper } from '../../utils/authHelper';
import PubSub from "pubsub-js";
import { Button, OverlayTrigger, Tooltip, Form } from "react-bootstrap";
import ConfirmationModal from "../common/ConfirmationModal";
import { useNavigate } from "react-router-dom";

const TooltipButton = ({ title, children }) => (
    <OverlayTrigger placement="top" overlay={<Tooltip>{title}</Tooltip>}>
        <span className="d-inline-block">{children}</span>
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

    const [isExpanded, setIsExpanded] = useState(false);

    const [roles, setRoles] = useState([]);

    // For delete
    const [roleId, setRoleId] = useState(null)
    const [roleName, setRoleName] = useState(null)
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // State for Permissions Editing (The "Dirty" State)
    // Structure: { [roleId]: { [moduleId]: { allow_view: bool, ... } } }
    const [editingPermissions, setEditingPermissions] = useState({});

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


    // --- DATA GROUPING ---
    const groupPermissionsByRole = () => {
        const grouped = {};
        const filteredPermissions = permissions.filter(perm => {
            const roleInfo = roles.find(r => r.id === perm.role_id);
            if (!roleInfo) return true;
            const roleName = roleInfo.role_name || roleInfo.name;
            return !roleName || roleName.toUpperCase() !== "SYSTEM ADMIN";
        });

        filteredPermissions.forEach(perm => {
            const roleId = perm.role_id || 'null';
            const roleInfo = roles.find(r => r.id === perm.role_id);

            let roleName;
            if (roleInfo) {
                roleName = roleInfo.role_name || roleInfo.name || `Role ${roleId}`;
                if (roleName.toUpperCase() === "SYSTEM ADMIN") return;
            } else {
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

        return Object.values(grouped);
    };

    const rolePermissions = groupPermissionsByRole();

    // --- HELPER: Initialize Edit State for a specific role ---
    // We populate 'editingPermissions' with DB data so checkboxes appear correctly
    const initializeEditStateForRole = (roleId, currentEditState) => {
        const rolePermsList = permissions.filter(p => (p.role_id || 'null') === roleId);
        const editingData = {};

        rolePermsList.forEach(perm => {
            editingData[perm.module_id] = {
                allow_view: perm.allow_view || false,
                allow_create: perm.allow_create || false,
                allow_edit: perm.allow_edit || false,
                allow_delete: perm.allow_delete || false
            };
        });

        // Return updated state object
        return {
            ...currentEditState,
            [roleId]: editingData
        };
    };

    // --- TOGGLE LOGIC (GLOBAL) ---
    const handleGlobalToggle = () => {
        if (isExpanded) {
            // Turning OFF: Collapse all
            setExpandedRoles({});
            setIsExpanded(false);
            // Note: We don't clear editingPermissions here so that if user collapses 
            // but forgets to save, the "Save All" button still has the data.
        } else {
            // Turning ON: Expand all & Initialize data
            const newExpanded = {};
            let newEditingState = { ...editingPermissions };

            rolePermissions.forEach(role => {
                newExpanded[role.role_id] = true;
                // Only initialize if not already modified/loaded
                if (!newEditingState[role.role_id]) {
                    newEditingState = initializeEditStateForRole(role.role_id, newEditingState);
                }
            });

            setExpandedRoles(newExpanded);
            setEditingPermissions(newEditingState);
            setIsExpanded(true);
        }
    };

    // --- TOGGLE LOGIC (INDIVIDUAL ROW) ---
    const handleRowToggle = (roleId) => {
        setExpandedRoles(prev => {
            const isCurrentlyOpen = !!prev[roleId];
            const newExpandedState = { ...prev, [roleId]: !isCurrentlyOpen };

            // 1. Sync the Visual Switch
            const totalRolesCount = rolePermissions.length;
            const openRolesCount = Object.values(newExpandedState).filter(isOpen => isOpen).length;

            if (openRolesCount === totalRolesCount && totalRolesCount > 0) {
                setIsExpanded(true);
            } else if (openRolesCount === 0) {
                setIsExpanded(false);
            } else {
                // Mixed state (some open, some closed) -> usually switch is OFF until all are open
                setIsExpanded(false);
            }

            // 2. Initialize Data if opening
            if (!isCurrentlyOpen) {
                // If we are opening it, ensure data is loaded into editingPermissions
                setEditingPermissions(current => {
                    if (current[roleId]) return current; // Already loaded/edited
                    return initializeEditStateForRole(roleId, current);
                });
            }

            return newExpandedState;
        });
    };

    // --- CHECKBOX / EDIT HANDLERS ---

    const handleInlineToggle = (roleId, moduleId, field) => {
        setEditingPermissions(prev => {
            const roleData = prev[roleId] || {};
            const moduleData = roleData[moduleId] || {
                allow_view: false, allow_create: false, allow_edit: false, allow_delete: false
            };

            const newValue = !moduleData[field];

            return {
                ...prev,
                [roleId]: {
                    ...roleData,
                    [moduleId]: {
                        ...moduleData,
                        [field]: newValue
                    }
                }
            };
        });
    };

    // Select All for a specific column within a specific role
    const handleSelectAllToggle = (roleId, permissionType) => {
        const rolePerms = permissions.filter(p => (p.role_id || 'null') === roleId);

        // Check current state in editingPermissions
        const currentRoleEditState = editingPermissions[roleId] || {};

        // Logic: If ALL are checked, we uncheck all. Otherwise, we check all.
        const allCurrentlyChecked = rolePerms.length > 0 && rolePerms.every(perm => {
            return currentRoleEditState[perm.module_id]?.[permissionType] === true;
        });

        const newValue = !allCurrentlyChecked;

        setEditingPermissions(prev => {
            const roleData = prev[roleId] ? { ...prev[roleId] } : {};

            rolePerms.forEach(perm => {
                const currentModule = roleData[perm.module_id] || { ...perm };
                roleData[perm.module_id] = {
                    ...currentModule,
                    [permissionType]: newValue
                };
            });

            return {
                ...prev,
                [roleId]: roleData
            };
        });
    };


    // --- GLOBAL SAVE LOGIC ---
    const handleGlobalSave = async () => {
        try {
            setLoading(true);
            // We only save roles that exist in editingPermissions
            const roleIdsToUpdate = Object.keys(editingPermissions);
            console.log("Roles to Update:", roleIdsToUpdate);

            if (roleIdsToUpdate.length === 0) {
                PubSub.publish("RECORD_ERROR_TOAST", { title: "Info", message: "No data loaded to save." });
                setLoading(false);
                return;
            }

            // Create promises for parallel saving
            const savePromises = roleIdsToUpdate.map(async (roleId) => {
                return saveRolePermissions(roleId, true); // true = silent mode (no individual toasts)
            });

            await Promise.all(savePromises);

            PubSub.publish("RECORD_SAVED_TOAST", {
                title: "Success",
                message: "All changes saved successfully!",
            });

            // Refresh User Context & UI
            refreshUserPermissions();
            setEditingPermissions({}); // Clear dirty state
            setExpandedRoles({}); // Collapse all after save (optional, cleaner UI)
            setIsExpanded(false);
            setRefreshKey(prev => prev + 1);

        } catch (err) {
            console.error("Global Save Error", err);
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Error",
                message: "One or more roles failed to update.",
            });
        } finally {
            setLoading(false);
        }
    };

    // Helper to save a single role logic
    const saveRolePermissions = async (roleId, silent = false) => {
        const roleData = editingPermissions[roleId];
        if (!roleData) return;

        const actualRoleId = roleId === 'null' ? null : roleId;
        const permissionsToSave = Object.keys(roleData).map(moduleId => ({
            module_id: moduleId,
            allow_view: roleData[moduleId].allow_view || false,
            allow_create: roleData[moduleId].allow_create || false,
            allow_edit: roleData[moduleId].allow_edit || false,
            allow_delete: roleData[moduleId].allow_delete || false
        }));

        try {
            if (actualRoleId === null) {
                // Handle NULL role
                const nullApi = new DataApi("permissions");
                const existingRolePerms = permissions.filter(p => (p.role_id || 'null') === 'null');

                for (const moduleId in roleData) {
                    const moduleData = roleData[moduleId];
                    const existingPerm = existingRolePerms.find(p => p.module_id === moduleId);

                    if (existingPerm && existingPerm.id) {
                        await nullApi.update(moduleData, existingPerm.id);
                    } else {
                        await nullApi.create({ role_id: null, module_id: moduleId, ...moduleData });
                    }
                }
            } else {
                // Standard Role Update
                const api = new DataApi("permissions/role");
                await api.update({
                    role_id: actualRoleId,
                    permissions: permissionsToSave
                }, actualRoleId);
            }
            return true;
        } catch (err) {
            throw err;
        }
    };

    const refreshUserPermissions = async () => {
        const userData = AuthHelper.getUser();
        if (userData && userData.userrole) {
            try {
                const api = new DataApi("permissions");
                const result = await api.fetchById(`role/${userData.userrole}`);
                if (result?.data?.success && result.data.data) {
                    sessionStorage.setItem("permissions", JSON.stringify(result.data.data));
                    window.dispatchEvent(new Event("permissionsUpdated"));
                }
            } catch (err) {
                console.error("Failed to refresh user permissions:", err);
            }
        }
    };

    // --- RENDER HELPERS ---

    const CustomHeader = () => (
        <div className="d-flex justify-content-between align-items-center p-2 my-4 mx-3"
            style={{
                color: "var(--primary-color)",
                background: "var(--primary-background-color)",
                borderRadius: "10px",
            }}>
            <h5 className="fw-bold mb-1">
                <i className="fa-solid fa-user-shield me-2 fs-6"></i> Role Permissions ({rolePermissions.length})
            </h5>
            <div className="d-flex align-items-center gap-3">
                {/* <span className='fw-bold' style={{fontSize: '0.9rem'}}>
                    {isExpanded ? "Collapse All" : "Expand All"}
                </span> */}
                <TooltipButton title={isExpanded ? "Collapse All" : "Expand All to Edit"}>
                    <Form.Check
                        type="switch"
                        id="expand-collapse-toggle"
                        checked={isExpanded}
                        onChange={handleGlobalToggle}
                        style={{
                            transform: "scale(1.8)",
                            transformOrigin: "left center",
                            cursor: "pointer",
                            marginRight: "10px",
                            accentColor: isExpanded ? "#198754" : "#6c757d"
                        }}
                    />
                </TooltipButton>

                <TooltipButton title="Add New Role">
                    <Button
                        className="custom-btn-table-header p-2"
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

    const PermissionCell = ({ roleId, moduleId, field, value }) => {
        // If editingPermissions has data, use it (Editable). 
        // If not, use 'value' from DB (Read-only, though we initialize on expand so it should be editable).
        let checked = value || false;
        const isEditable = true; // Always clickable if visible

        if (editingPermissions[roleId] && editingPermissions[roleId][moduleId]) {
            checked = editingPermissions[roleId][moduleId][field];
        }

        return (
            <div
                className="d-inline-block cursor-pointer"
                onClick={() => handleInlineToggle(roleId, moduleId, field)}
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

    const SelectAllHeader = ({ roleId, permissionType, label }) => {
        let isChecked = false;

        // Calculate state from editingPermissions
        if (editingPermissions[roleId]) {
            const roleData = editingPermissions[roleId];
            const roleModules = permissions.filter(p => (p.role_id || 'null') === roleId);
            if (roleModules.length > 0) {
                isChecked = roleModules.every(m => roleData[m.module_id]?.[permissionType] === true);
            }
        }

        return (
            <th width="17.5%" className="text-center">
                <div className="d-flex flex-column align-items-center justify-content-center">
                    <div
                        className="cursor-pointer"
                        onClick={() => handleSelectAllToggle(roleId, permissionType)}
                        title={isChecked ? "Deselect All" : "Select All"}
                    >
                        {isChecked ? (
                            <i className="fa-solid fa-check-square text-primary fs-6"></i>
                        ) : (
                            <i className="fa-regular fa-square text-secondary fs-6"></i>
                        )}
                    </div>
                    <span className="fw-semibold mb-1">{label}</span>
                </div>
            </th>
        );
    };

    const RoleAccordion = ({ role }) => {
        const isOpen = expandedRoles[role.role_id] || false;

        return (
            <div className="card mb-3 border shadow-sm mx-3">
                {/* Header is Clickable to Toggle */}
                <div className="card-header p-3 d-flex justify-content-between align-items-center bg-light">
                    <div className="d-flex align-items-center cursor-pointer w-100" onClick={() => handleRowToggle(role.role_id)}>
                        <h6 className="mb-0 fw-bold">
                            <i className="fa-solid fa-user-tag me-2 text-primary"></i>
                            {role.role_name}
                        </h6>
                    </div>

                    <div className="d-flex gap-2 align-items-center">
                        {/* Chevron Trigger */}
                        <i
                            className={`fa-solid ${isOpen ? "fa-chevron-down" : "fa-chevron-up"} me-2`}
                            style={{ cursor: "pointer" }}
                            onClick={() => handleRowToggle(role.role_id)}
                        ></i>

                        {/* Delete Button */}
                        {/* <i className="fa-solid fa-trash ms-2 text-danger cursor-pointer fs-5" onClick={(e) => {
                            e.stopPropagation(); // Prevent toggling accordion
                            handleDeleteRole(role.role_id, role.role_name);
                        }}></i> */}
                    </div>
                </div>

                {isOpen && (
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th width="30%" className="ps-4 pb-3">Module Name</th>
                                        <SelectAllHeader roleId={role.role_id} permissionType="allow_view" label="View" />
                                        <SelectAllHeader roleId={role.role_id} permissionType="allow_create" label="Create" />
                                        <SelectAllHeader roleId={role.role_id} permissionType="allow_edit" label="Edit" />
                                        {/* <SelectAllHeader roleId={role.role_id} permissionType="allow_delete" label="Delete" /> */}
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
                                                    <PermissionCell roleId={role.role_id} moduleId={perm.module_id} field="allow_view" value={perm.allow_view} />
                                                </td>
                                                <td className="text-center align-middle py-2">
                                                    <PermissionCell roleId={role.role_id} moduleId={perm.module_id} field="allow_create" value={perm.allow_create} />
                                                </td>
                                                <td className="text-center align-middle py-2">
                                                    <PermissionCell roleId={role.role_id} moduleId={perm.module_id} field="allow_edit" value={perm.allow_edit} />
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

    const handleDeleteRole = async (Id, Name) => {
        setRoleId(Id)
        setRoleName(Name)
        if (!showConfirmModal) {
            setShowConfirmModal(true)
        } else {
            try {
                const api = new DataApi("permissions");
                const rolePerms = permissions.filter(p => (p.role_id || 'null') === roleId);
                for (const perm of rolePerms) {
                    if (perm.id) {
                        await api.delete(perm.id);
                    }
                }
                setShowConfirmModal(false)
                PubSub.publish("RECORD_SAVED_TOAST", {
                    message: `Permissions for "${roleName}" deleted successfully!`,
                });
                setRefreshKey(prev => prev + 1);
            } catch (err) {
                console.error("Error deleting permissions:", err);
                PubSub.publish("RECORD_ERROR_TOAST", {
                    message: err.message || "Failed to delete permissions",
                });
            }
        }
    };
    const confirmDelete = async () => {
        handleDeleteRole()
    };

    // Handler for Add Modal (New Role)
    const handleSavePermission = async (formData) => {
        try {
            const permissionsToSave = formData.permissions.map(perm => ({
                module_id: perm.module_id,
                allow_view: perm.allow_view || false,
                allow_create: perm.allow_create || false,
                allow_edit: perm.allow_edit || false,
                allow_delete: perm.allow_delete || false
            }));

            const api = new DataApi("permissions/role");
            const response = await api.update({
                role_id: formData.role_id,
                permissions: permissionsToSave
            }, formData.role_id);

            if (response.data.success) {
                PubSub.publish("RECORD_SAVED_TOAST", {
                    title: "Success",
                    message: "Permissions saved successfully!",
                });
                refreshUserPermissions();
                setShowAddModal(false);
                setEditingRole(null);
                setRefreshKey(prev => prev + 1);
            }
        } catch (err) {
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Error",
                message: "Failed to save permissions: " + err.message,
            });
        }
    }

    if (loading && !permissions.length) {
        return <div className="text-center py-5"><span className="loader"></span></div>;
    }

    if (error) {
        return (
            <div className="alert alert-danger m-3">
                <h4>Failed to load permissions</h4>
                <p>{error}</p>
                <button className="btn btn-secondary mt-2" onClick={fetchPermissions}>Retry</button>
            </div>
        );
    }

    return (
        <div className="container-fluid permission-page">
            <CustomHeader />

            {/* Top Bar for Global Save */}
            <div className="mx-3 my-2 mt-0" >
                <div className='d-flex align-items-center justify-content-end p-2  rounded'>
                    {/* <Button
                        size="sm"
                        variant=""
                        onClick={handleGlobalSave}
                        className="btn-paper btn-paper-apply d-flex align-items-center gap-1 h-75 px-2"
                        style={{
                            background: 'var(--primary-color)',
                            color: '#fff',
                        }}
                    >
                        <i className="fa-solid fa-paper-plane"></i>
                        Save
                    </Button> */}
                </div>
            </div>



            {rolePermissions.length === 0 ? (
                <div className="alert alert-info text-center bg-info">
                    <i className="fa-solid fa-info-circle me-2 bg-info"></i>
                    No role permissions available. Click "Add New Role" to create one.
                </div>
            ) : (
                <div >
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

            <ConfirmationModal
                show={showConfirmModal}
                onHide={() => setShowConfirmModal(false)}
                onConfirm={confirmDelete}
                title="Delete Permissions"
                message="Are you sure you want to delete all permissions for this role?"
                confirmText="Delete"
                cancelText="Cancel"
            />

            <div className="mx-3 mt-0" >
                <div className='d-flex align-items-center justify-content-end p-2  rounded'>
                    <Button
                        size="sm"
                        variant=""
                        onClick={handleGlobalSave}
                        className="btn-paper btn-paper-apply d-flex align-items-center gap-1 h-75 px-2"
                        style={{
                            background: 'var(--primary-color)',
                            color: '#fff',
                        }}
                    >
                        <i className="fa-solid fa-paper-plane"></i>
                        Save
                    </Button>
                </div>
            </div>



        </div>
    );
};

export default Permission;