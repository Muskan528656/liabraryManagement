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
    const [roles, setRoles] = useState([]);
    const [roleId, setRoleId] = useState(null)
    const [roleName, setRoleName] = useState(null)
    const [editingRow, setEditingRow] = useState(null);
    const [editingPermissions, setEditingPermissions] = useState({});
    const [selectAllStates, setSelectAllStates] = useState({
        allow_view: false,
        allow_create: false,
        allow_edit: false,
        allow_delete: false
    });

    //accordion
    const [open, setOpen] = useState(false);
    const [openRowId, setOpenRowId] = useState(null);
    const [check, setCheck] = useState(1);

    //toggle
    const [isExpanded, setIsExpanded] = useState(false);
    const handleToggleRoles = () => {
        if (isExpanded) {
            collapseAllRoles();
        } else {
            expandAllRoles();
        }
        setIsExpanded(!isExpanded);
    };


    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const navigate = useNavigate();
    const confirmDelete = async () => {
        handleDeleteRole()
    };
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


    useEffect(() => {
        if (editingRow) {
            const rolePerms = permissions.filter(p => (p.role_id || 'null') === editingRow);

            const newSelectAllStates = {};

            ['allow_view', 'allow_create', 'allow_edit', 'allow_delete'].forEach(permissionType => {

                const allChecked = rolePerms.every(perm => {
                    const modulePerms = editingPermissions[perm.module_id];
                    return modulePerms && modulePerms[permissionType] === true;
                });


                const hasModules = rolePerms.length > 0;

                newSelectAllStates[permissionType] = hasModules && allChecked;
            });

            setSelectAllStates(newSelectAllStates);
        }
    }, [editingPermissions, editingRow, permissions]);

    // const confirmDelete = async () => {
    //     try {
    //         const api = new DataApi("permissions");
    //         await api.delete(deleteId);

    //         PubSub.publish("RECORD_SAVED_TOAST", {
    //             title: "Success",
    //             message: "Deleted successfully",
    //         });

    //         setRefreshKey(prev => prev + 1);
    //     } catch (error) {
    //         PubSub.publish("RECORD_ERROR_TOAST", {
    //             title: "Error",
    //             message: `Failed to delete: ${error.message}`,
    //         });
    //     }

    //     setShowConfirmModal(false);
    //     setDeleteId(null);
    // };

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
                window.dispatchEvent(new Event("permissionsUpdated"));

                PubSub.publish("RECORD_SAVED_TOAST", {
                    title: "Success",
                    message: "Permissions saved successfully!",
                });

                // Refresh current user's permissions
                const userData = AuthHelper.getUser();
                if (userData && userData.userrole) {
                    try {
                        const api = new DataApi("permissions");
                        const result = await api.fetchById(`role/${userData.userrole}`);
                        if (result && result.data && result.data.success && result.data.data) {
                            const permissions = result.data.data;
                            sessionStorage.setItem("permissions", JSON.stringify(permissions));
                        }
                    } catch (err) {
                        console.error("Failed to refresh permissions after save:", err);
                    }
                }

                setShowAddModal(false);
                setEditingRole(null);
                setRefreshKey(prev => prev + 1);
            }

        } catch (err) {
            console.error("Permission save error", err);
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Error",
                message: "Failed to save permissions: " + err.message,
            });
        }
    };

    const handleInlineSave = async (roleId, roleName) => {
        try {
            setIsExpanded(false)
            const actualRoleId = roleId === 'null' ? null : roleId;

            const permissionsToSave = Object.keys(editingPermissions).map(moduleId => ({
                module_id: moduleId,
                allow_view: editingPermissions[moduleId].allow_view || false,
                allow_create: editingPermissions[moduleId].allow_create || false,
                allow_edit: editingPermissions[moduleId].allow_edit || false,
                allow_delete: editingPermissions[moduleId].allow_delete || false
            }));

            const api = new DataApi("permissions/role");

            const payload = {
                role_id: actualRoleId,
                permissions: permissionsToSave
            };

            let response;
            if (actualRoleId === null || actualRoleId === undefined || actualRoleId === 'null') {
                const nullApi = new DataApi("permissions");
                const rolePerms = permissions.filter(p => (p.role_id || 'null') === roleId);

                for (const moduleId in editingPermissions) {
                    const moduleData = editingPermissions[moduleId];
                    const existingPerm = rolePerms.find(p => p.module_id === moduleId);

                    if (existingPerm && existingPerm.id) {
                        await nullApi.update({
                            allow_view: moduleData.allow_view,
                            allow_create: moduleData.allow_create,
                            allow_edit: moduleData.allow_edit,
                            allow_delete: moduleData.allow_delete
                        }, existingPerm.id);
                    } else {
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
                response = await api.update(payload, actualRoleId);
            }

            if (response.data && response.data.success) {
                setExpandedRoles(prev => ({
                    ...prev,
                    [roleId]: false
                }));

                window.dispatchEvent(new Event("permissionsUpdated"));

                PubSub.publish("RECORD_SAVED_TOAST", {
                    title: "Success",
                    message: `Permissions updated for ${roleName}`,
                });

                // Refresh current user's permissions
                const userData = AuthHelper.getUser();
                if (userData && userData.userrole) {
                    try {
                        const api = new DataApi("permissions");
                        const result = await api.fetchById(`role/${userData.userrole}`);
                        if (result && result.data && result.data.success && result.data.data) {
                            const permissions = result.data.data;
                            sessionStorage.setItem("permissions", JSON.stringify(permissions));
                        }
                    } catch (err) {
                        console.error("Failed to refresh permissions after save:", err);
                    }
                }

                setEditingRow(null);
                setEditingPermissions({});
                setSelectAllStates({
                    allow_view: false,
                    allow_create: false,
                    allow_edit: false,
                    allow_delete: false
                });
                setExpandedRoles({});
                setRefreshKey(prev => prev + 1);
            }

        } catch (err) {
            console.error("Error saving inline permissions:", err);
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Error",
                message: err.message || "Failed to save permissions",
            });
        }
    };
    const groupPermissionsByRole = () => {
        const grouped = {};

        // SYSTEM ADMIN ko completely filter out karo
        const filteredPermissions = permissions.filter(perm => {
            const roleInfo = roles.find(r => r.id === perm.role_id);
            if (!roleInfo) return true; // Agar role nahi mila to include karo

            const roleName = roleInfo.role_name || roleInfo.name;
            // SYSTEM ADMIN ko completely skip karo
            return !roleName || roleName.toUpperCase() !== "SYSTEM ADMIN";
        });

        filteredPermissions.forEach(perm => {
            const roleId = perm.role_id || 'null';
            const roleInfo = roles.find(r => r.id === perm.role_id);

            // Dobara check karo SYSTEM ADMIN nahi hai na
            let roleName;
            if (roleInfo) {
                roleName = roleInfo.role_name || roleInfo.name || `Role ${roleId}`;
                if (roleName.toUpperCase() === "SYSTEM ADMIN") {
                    return; // Skip this permission
                }
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

    // const groupPermissionsByRole = () => {
    //     const grouped = {};

    //     const filteredPermissions = permissions.filter(perm => {
    //         const roleInfo = roles.find(r => r.id === perm.role_id);
    //         const roleName = roleInfo ? (roleInfo.role_name || roleInfo.name) : perm.role_name;
    //         return !roleName || roleName.toUpperCase() !== "SYSTEM ADMIN";
    //     });

    //     filteredPermissions.forEach(perm => {
    //         const roleId = perm.role_id || 'null';
    //         const roleInfo = roles.find(r => r.id === perm.role_id);

    //         let roleName;
    //         if (roleInfo) {
    //             roleName = roleInfo.role_name || roleInfo.name || `Role ${roleId}`;
    //         } else {
    //             roleName = perm.role_name || `Role ${roleId}`;
    //         }

    //         if (!grouped[roleId]) {
    //             grouped[roleId] = {
    //                 role_id: roleId,
    //                 role_name: roleName,
    //                 permissions: [],
    //                 modules_count: 0
    //             };
    //         }

    //         grouped[roleId].permissions.push({
    //             ...perm,
    //             module_id: perm.module_id,
    //             module_name: perm.module_name || `Module ${perm.module_id}`,
    //             allow_view: perm.allow_view || false,
    //             allow_create: perm.allow_create || false,
    //             allow_edit: perm.allow_edit || false,
    //             allow_delete: perm.allow_delete || false
    //         });

    //         grouped[roleId].modules_count++;
    //     });

    //     return Object.values(grouped);
    // };

    const rolePermissions = groupPermissionsByRole();

    const handle = (roleId) => {
        console.log("role id", roleId);
        console.log("check", check)
        const newCheck = 2;
        setCheck(newCheck)
        console.log("check", check)

        handleInlineEditStart(roleId, newCheck)
    }
    const handleInlineEditStart = (roleId, checkValue) => {
        //toggle open and close
        // important (text click se bachata hai)
        //    console.log("editing",isEditing)
        if (checkValue == 2) {
            setOpen(false)
            console.log("check is work", check)
            setCheck(1)
        }
        else {

            setOpen(true);
            // setCheck(1)

        }
        console.log("open", open)
        setEditingRow(roleId);
        setOpenRowId(roleId)
        // Expand the role
        setExpandedRoles(prev => ({
            ...prev,
            [roleId]: true
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

        // Initialize select all states
        const newSelectAllStates = {};
        ['allow_view', 'allow_create', 'allow_edit', 'allow_delete'].forEach(permissionType => {
            const allChecked = rolePerms.every(perm => editingData[perm.module_id]?.[permissionType] === true);
            const hasModules = rolePerms.length > 0;
            newSelectAllStates[permissionType] = hasModules && allChecked;
        });

        setSelectAllStates(newSelectAllStates);
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

            const newValue = !currentData[field];

            const updated = {
                ...prev,
                [moduleId]: {
                    ...currentData,
                    [field]: newValue
                }
            };

            // Update select all states after toggling
            if (editingRow) {
                const rolePerms = permissions.filter(p => (p.role_id || 'null') === editingRow);

                // Check if all modules have this permission true after the toggle
                const allChecked = rolePerms.every(perm => {
                    const modulePerms = updated[perm.module_id];
                    return modulePerms && modulePerms[field] === true;
                });

                const hasModules = rolePerms.length > 0;

                setSelectAllStates(prevStates => ({
                    ...prevStates,
                    [field]: hasModules && allChecked
                }));
            }

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

    const handleInlineCancel = () => {
        setOpenRowId("")
        setIsExpanded(false)
        setExpandedRoles(prev => ({
            ...prev,
            [editingRow]: false
        }));
        setEditingRow(null);
        setEditingPermissions({});
        setSelectAllStates({
            allow_view: false,
            allow_create: false,
            allow_edit: false,
            allow_delete: false
        });
        setExpandedRoles({});
    };

    const toggleRoleAccordion = (roleId) => {
        setExpandedRoles(prev => ({
            ...prev,
            [roleId]: !prev[roleId]
        }));

        // If we're collapsing a role that's being edited, cancel edit
        if (editingRow === roleId && expandedRoles[roleId]) {
            handleInlineCancel();
        }
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
        handleInlineCancel();
    };

    const handleEditRole = (role) => {
        setEditingRole({
            role_id: role.role_id === 'null' ? null : role.role_id,
            role_name: role.role_name,
            permissions: role.permissions
        });
        setShowAddModal(true);
    };

    const handleDeleteRole = async (Id, Name) => {


        setRoleId(Id)
        setRoleName(Name)


        console.log("roleId", roleId)
        console.log("roleName", roleName)

        if (!showConfirmModal) {
            setShowConfirmModal(true)
        } else {

            console.log("roleId", roleId);
            console.log("showmodel", showConfirmModal);
            console.log("roleName", roleName);

            // if (!window.confirm(Are you sure you want to delete all permissions for "${roleNamee}"?)) {
            //     return;
            // }



            try {
                const api = new DataApi("permissions");
                const rolePerms = permissions.filter(p => (p.role_id || 'null') === roleId);

                console.log("api", api)
                console.log("rolePerms", rolePerms)

                for (const perm of rolePerms) {
                    if (perm.id) {
                        const response = await api.delete(perm.id);
                        console.log("response", response)
                    }
                }
                setShowConfirmModal(false)
                // alert(Permissions for ${roleName} deleted successfully!);
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
                <TooltipButton title={isExpanded ? "Collapse All" : "Expand All"}>
                    <Form.Check
                        type="switch"
                         id="expand-collapse-toggle"
                        checked={isExpanded}
                        onChange={handleToggleRoles}
                        style={{
                            transform: "scale(1.8)",
                            transformOrigin: "left center",
                            cursor: "pointer",
                            marginRight:"10px",
                            accentColor: isExpanded ? "#198754" : "#6c757d" // green ON, gray OFF
                        }}
                    />
                </TooltipButton>


                <TooltipButton title="Add Role Permission">
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
            {/* <div>
                <TooltipButton title={isExpanded ? "Collapse All" : "Expand All"}>
                    <Button
                        variant="outline-secondary"
                        className="custom-btn-table-header p-2 me-2"
                        onClick={handleToggleRoles}
                    >
                        <i
                            className={`fa-solid ${isExpanded ? "fa-compress" : "fa-expand"
                                } fs-6 my-1`}
                        ></i>
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
            </div> */}



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

    const SelectAllHeader = ({ permissionType, label }) => {
        const isEditing = editingRow !== null;
        const isChecked = selectAllStates[permissionType] || false;

        return (
            <th width="17.5%" className="text-center">
                <div className="d-flex flex-column align-items-center justify-content-center">

                    {isEditing ? (
                        <div
                            className="cursor-pointer"
                            onClick={() => handleSelectAllToggle(permissionType)}
                            title={isChecked ? "Deselect All" : "Select All"}
                            style={{ cursor: 'pointer' }}
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
                    <span className="fw-semibold mb-1">{label}</span>
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
            <div className="card mb-3 border shadow-sm mx-3">
                <div className="card-header p-3 d-flex justify-content-between align-items-center bg-light">
                    <div className="d-flex align-items-center">

                        {/* ICON — only this is clickable */}
                        {/* <i
                            className={`fa-solid ${open ? "fa-minus" : "fa-plus"
                                } me-2 text-primary`}
                            style={{ cursor: "pointer" }}
                            onClick={handleToggle}
                        ></i> */}
                        {/* <i
                            className={`fa-solid ${open ? "fa-chevron-down" : "fa-chevron-up"
                                } me-2`}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                                if (!open) {
                                    // accordion open hoga
                                    handleInlineEditStart(role.role_id);
                                } else {
                                    // accordion close hoga
                                    handleInlineCancel();
                                }
                                setOpen(!open); // toggle accordion
                            }}
                        ></i> */}



                        {/* <i
                            className={`fa-solid ${openRowId === role.role_id
                                ? "fa-chevron-down"
                                : "fa-chevron-up"
                                } me-2`}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                                if (openRowId === role.role_id) {
                                    // close same row
                                    handleInlineCancel();
                                    setOpenRowId(null);
                                } else {
                                    // open selected row only
                                    handleInlineEditStart(role.role_id);
                                    // setOpenRowId(role.role_id);
                                }
                            }}
                        ></i> */}






                        {/* <i className="fa-solid fa-edit me-1 text-primary cursor-pointer fs-5" onClick={() => handleInlineEditStart(role.role_id)}></i> */}

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

                    <div className="d-flex gap-2">


                        <i
                            className={`fa-solid ${openRowId === role.role_id
                                ? ""
                                : "fa-chevron-up"
                                } me-2`}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                                if (openRowId === role.role_id) {
                                    // close same row
                                    handleInlineCancel();
                                    setOpenRowId(null);
                                } else {
                                    // open selected row only
                                    handleInlineEditStart(role.role_id);
                                    // setOpenRowId(role.role_id);
                                }
                            }}
                        ></i>


                        {isEditing && open ? (
                            <>

                                <Button
                                    size="sm"
                                    variant=""
                                    onClick={() => handleInlineSave(role.role_id, role.role_name)}
                                    className="btn-paper btn-paper-clear d-flex align-items-center gap-1 h-75 px-2"
                                    style={{
                                        color: 'var(--primary-color)',
                                        border: '1px solid var(--primary-color)',
                                    }}
                                >
                                    {/* <i className="fa-solid fa-check me-1"></i>  */}
                                    Save
                                </Button>




                                <Button
                                    size="sm"
                                    variant=""
                                    // className="btn btn-sm btn-secondary"
                                    onClick={handleInlineCancel}
                                    style={{
                                        background: 'var(--primary-color)',
                                        color: '#fff',
                                    }}
                                >
                                    {/* <i className="fa-solid fa-times me-1"></i>  */}
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <>

                                {/* <i className="fa-solid fa-edit me-1 text-primary cursor-pointer fs-5" onClick={() => handle(role.role_id)}></i> */}

                                {/* <i className="fa-solid fa-trash me-1 text-danger cursor-pointer fs-5" onClick={() => handleDeleteRole(role.role_id, role.role_name)}></i> */}

                            </>
                        )}
                    </div>
                </div>

                {isExpanded && (
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                             
                                    <thead className="table-light">
                                        <tr>
                                            <th width="30%" className="ps-4  pb-3">Module Name</th>
                                            <SelectAllHeader permissionType="allow_view" label="View" />
                                            <SelectAllHeader permissionType="allow_create" label="Create" />
                                            <SelectAllHeader permissionType="allow_edit" label="Edit" />
                                            {/* <SelectAllHeader permissionType="allow_delete" label="Delete" /> */}
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
                                                {/* <td className="text-center align-middle py-2">
                                                    <PermissionCell
                                                        isEditing={isEditing}
                                                        moduleId={perm.module_id}
                                                        field="allow_delete"
                                                        value={perm.allow_delete}
                                                        onToggle={handleInlineToggle}
                                                    />
                                                </td> */}
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
        return <div className="text-center py-5"><span className="loader"></span></div>;
    }

    if (error) {
        return (
            <div className="alert alert-danger m-3">
                <h4>Failed to load permissions</h4>
                <p>{error}</p>
                <button className="btn btn-secondary mt-2" onClick={fetchPermissions}>
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

            <ConfirmationModal
                show={showConfirmModal}
                onHide={() => setShowConfirmModal(false)}
                onConfirm={confirmDelete}
                title="Delete Permissions"
                message="Are you sure you want to delete all permissions for this role?"
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
};

export default Permission;