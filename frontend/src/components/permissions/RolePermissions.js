// import React, { useState, useEffect, useRef } from "react";
// import { Container, Row, Col, Card, Table, Button, Form, Alert, Badge } from "react-bootstrap";
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import * as constants from "../../constants/CONSTANT";
// import helper from "../common/helper";
// import PubSub from "pubsub-js";
// const RolePermissions = () => {
//   const [roles, setRoles] = useState(["ADMIN", "STUDENT"]);
//   const [modules, setModules] = useState([]);
//   const [permissions, setPermissions] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [selectedRole, setSelectedRole] = useState("ADMIN");

//   const selectAllModulesRef = useRef(null);
//   const selectAllCreateRef = useRef(null);
//   const selectAllReadRef = useRef(null);
//   const selectAllUpdateRef = useRef(null);
//   const selectAllDeleteRef = useRef(null);

//   useEffect(() => {
//     // Fetch available roles/modules first, then fetch selected role permissions
//     fetchAvailableRolesAndModules();
//   }, [selectedRole]);

//   const fetchAvailableRolesAndModules = async () => {
//     try {
//       setLoading(true);
//       const response = await helper.fetchWithAuth(
//         `${constants.API_BASE_URL}/api/role-permissions`,
//         "GET"
//       );
//       const result = await response.json();

//       if (result.success && Array.isArray(result.permissions)) {
//         // extract distinct roles and modules
//         const roleSet = new Set();
//         const moduleMap = new Map();
//         result.permissions.forEach(p => {
//           if (p.role) roleSet.add(p.role.toUpperCase());
//           if (p.module_name) {
//             const name = p.module_name;
//             if (!moduleMap.has(name)) {
//               moduleMap.set(name, { name, label: toLabel(name) });
//             }
//           }
//         });

//         // Filter to only show ADMIN and STUDENT roles (remove LIBRARIAN, SYS_ADMIN, etc.)
//         const allowedRoles = ["ADMIN", "STUDENT"];
//         const rolesArr = Array.from(roleSet).filter(role => allowedRoles.includes(role));

//         // If no roles found from DB, use hardcoded list
//         if (rolesArr.length === 0) {
//           setRoles(allowedRoles);
//         } else {
//           setRoles(rolesArr);
//         }

//         // sensible defaults to ensure admin can always see all common modules
//         const defaultModules = [
//           { name: "books", label: "Books" },
//           { name: "author", label: "Author" },
//           { name: "category", label: "Category" },
//           { name: "supplier", label: "Supplier" },
//           { name: "vendor", label: "Vendor" },
//           { name: "purchase", label: "Purchase" },
//           { name: "user", label: "User Management" },
//           { name: "librarycard", label: "Library Card" },
//           { name: "bookissue", label: "Book Issue" },
//           { name: "bookrequest", label: "Book Requests" },
//           { name: "penalty", label: "Penalty Master" },
//         ];

//         // Start with DB-provided modules (if any)
//         const dbModules = Array.from(moduleMap.values());

//         // If the selected role is ADMIN, ensure they can see all sensible modules
//         // by merging DB modules with the default set (no duplicates)
//         if (selectedRole && String(selectedRole).toUpperCase() === "ADMIN") {
//           const combined = [...dbModules];
//           const existingNames = new Set(combined.map(m => m.name));
//           defaultModules.forEach(def => {
//             if (!existingNames.has(def.name)) combined.push(def);
//           });
//           setModules(combined);
//         } else if (dbModules.length > 0) {
//           setModules(dbModules);
//         } else {
//           // fallback to sensible defaults if DB empty
//           setModules(defaultModules);
//         }

//         // Ensure selectedRole exists in roles list, default to ADMIN
//         const finalRoles = rolesArr.length > 0 ? rolesArr : allowedRoles;
//         if (!finalRoles.includes(selectedRole)) {
//           setSelectedRole("ADMIN");
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching available roles/modules:", error);
//       PubSub.publish("RECORD_SAVED_TOAST", {
//         title: "Error fetching roles/modules",
//         message: error.message || "Error fetching roles/modules",
//         type: "error"
//       });
//     } finally {
//       setLoading(false);
//       // fetch permissions for selectedRole after attempting to get modules
//       fetchPermissions();
//     }
//   };

//   const toLabel = (name) => {
//     // convert module_name like 'librarycard' to 'Library Card'
//     return name
//       .replace(/_/g, " ")
//       .replace(/\b\w/g, c => c.toUpperCase());
//   };

//   useEffect(() => {
//     const setIndeterminate = (ref, value) => {
//       if (ref.current) {
//         const input = ref.current.querySelector('input[type="checkbox"]') || ref.current.input;
//         if (input) {
//           input.indeterminate = value;
//         }
//       }
//     };

//     setIndeterminate(selectAllModulesRef, areSomeModulesFullyEnabled());
//     setIndeterminate(selectAllCreateRef, areSomePermissionsEnabled("can_create"));
//     setIndeterminate(selectAllReadRef, areSomePermissionsEnabled("can_read"));
//     setIndeterminate(selectAllUpdateRef, areSomePermissionsEnabled("can_update"));
//     setIndeterminate(selectAllDeleteRef, areSomePermissionsEnabled("can_delete"));
//   }, [permissions, modules]);

//   const fetchPermissions = async () => {
//     try {
//       setLoading(true);
//       const response = await helper.fetchWithAuth(
//         `${constants.API_BASE_URL}/api/role-permissions/role/${selectedRole}`,
//         "GET"
//       );
//       const result = await response.json();

//       if (result.success) {
//         const permMap = {};
//         result.permissions.forEach(perm => {
//           permMap[perm.module_name] = {
//             id: perm.id,
//             can_create: perm.can_create,
//             can_read: perm.can_read,
//             can_update: perm.can_update,
//             can_delete: perm.can_delete
//           };
//         });
//         setPermissions(permMap);
//       }
//     } catch (error) {
//       console.error("Error fetching permissions:", error);
//       PubSub.publish("RECORD_SAVED_TOAST", {
//         title: "Error fetching permissions",
//         message: error.message || "Error fetching permissions",
//         type: "error"
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePermissionChange = (moduleName, permissionType, value) => {
//     setPermissions(prev => ({
//       ...prev,
//       [moduleName]: {
//         ...prev[moduleName],
//         [permissionType]: value
//       }
//     }));
//   };

//   // Check if all modules have a specific permission enabled
//   const areAllPermissionsEnabled = (permissionType) => {
//     return modules.every(module => permissions[module.name]?.[permissionType] === true);
//   };

//   // Check if some (but not all) modules have a specific permission enabled
//   const areSomePermissionsEnabled = (permissionType) => {
//     const enabledCount = modules.filter(module => permissions[module.name]?.[permissionType] === true).length;
//     return enabledCount > 0 && enabledCount < modules.length;
//   };

//   // Handle select all for a specific permission type
//   const handleSelectAll = (permissionType, checked) => {
//     const updatedPermissions = { ...permissions };
//     modules.forEach(module => {
//       if (!updatedPermissions[module.name]) {
//         updatedPermissions[module.name] = {
//           can_create: false,
//           can_read: false,
//           can_update: false,
//           can_delete: false
//         };
//       }
//       updatedPermissions[module.name][permissionType] = checked;
//     });
//     setPermissions(updatedPermissions);
//   };

//   const handleSelectAllModules = (checked) => {
//     const updatedPermissions = {};
//     modules.forEach(module => {
//       updatedPermissions[module.name] = {
//         can_create: checked,
//         can_read: checked,
//         can_update: checked,
//         can_delete: checked
//       };
//     });
//     setPermissions(updatedPermissions);
//   };

//   // Check if all modules have all permissions enabled
//   const areAllModulesFullyEnabled = () => {
//     return modules.every(module => {
//       const perm = permissions[module.name];
//       return perm?.can_create && perm?.can_read && perm?.can_update && perm?.can_delete;
//     });
//   };

//   // Check if some modules have all permissions enabled
//   const areSomeModulesFullyEnabled = () => {
//     const fullyEnabledCount = modules.filter(module => {
//       const perm = permissions[module.name];
//       return perm?.can_create && perm?.can_read && perm?.can_update && perm?.can_delete;
//     }).length;
//     return fullyEnabledCount > 0 && fullyEnabledCount < modules.length;
//   };

//   const savePermissions = async () => {
//     try {
//       setLoading(true);
//       const permissionsArray = modules.map(module => ({
//         module_name: module.name,
//         can_create: permissions[module.name]?.can_create || false,
//         can_read: permissions[module.name]?.can_read || false,
//         can_update: permissions[module.name]?.can_update || false,
//         can_delete: permissions[module.name]?.can_delete || false
//       }));

//       const response = await helper.fetchWithAuth(
//         `${constants.API_BASE_URL}/api/role-permissions/role/${selectedRole}/bulk`,
//         "PUT",
//         JSON.stringify({ permissions: permissionsArray })
//       );
//       const result = await response.json();

//       if (result.success) {

//         PubSub.publish("RECORD_SAVED_TOAST", {
//           title: "Permissions saved successfully",

//         });

//         fetchPermissions();
//       } else {
//         PubSub.publish("RECORD_SAVED_TOAST", {
//           title: "Error saving permissions",
//           message: result.message || "Error saving permissions",
//           type: "error"
//         });
//       }
//     } catch (error) {
//       console.error("Error saving permissions:", error);
//       PubSub.publish("RECORD_SAVED_TOAST", {
//         title: "Error saving permissions",
//         message: error.message || "Error saving permissions",
//         type: "error"
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const resetPermissionsToDefaults = async () => {
//     // Prepare a sensible default: ADMIN => all true, STUDENT => read-only for books
//     const updatedPermissions = {};
//     modules.forEach(module => {
//       if (selectedRole && selectedRole.toUpperCase() === "ADMIN") {
//         updatedPermissions[module.name] = {
//           can_create: true,
//           can_read: true,
//           can_update: true,
//           can_delete: true
//         };
//       } else {
//         // STUDENT or others: read-only for 'books', everything false otherwise
//         updatedPermissions[module.name] = {
//           can_create: false,
//           can_read: module.name === "books",
//           can_update: false,
//           can_delete: false
//         };
//       }
//     });
//     setPermissions(updatedPermissions);
//     // Persist defaults to backend
//     try {
//       setLoading(true);
//       const permissionsArray = modules.map(module => ({
//         module_name: module.name,
//         can_create: updatedPermissions[module.name].can_create,
//         can_read: updatedPermissions[module.name].can_read,
//         can_update: updatedPermissions[module.name].can_update,
//         can_delete: updatedPermissions[module.name].can_delete
//       }));

//       const response = await helper.fetchWithAuth(
//         `${constants.API_BASE_URL}/api/role-permissions/role/${selectedRole}/bulk`,
//         "PUT",
//         JSON.stringify({ permissions: permissionsArray })
//       );
//       const result = await response.json();
//       if (result.success) {
//         PubSub.publish("RECORD_SAVED_TOAST", {
//           title: "Default permissions applied",
//         });
//         fetchPermissions();
//       } else {
//         PubSub.publish("RECORD_SAVED_TOAST", {
//           title: "Error applying defaults",
//           message: result.message || "Error applying defaults",
//           type: "error"
//         });
//       }
//     } catch (error) {
//       console.error("Error applying default permissions:", error);
//       PubSub.publish("RECORD_SAVED_TOAST", {
//         title: "Error applying defaults",
//         message: error.message || "Error applying defaults",
//         type: "error"
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Container className="mt-4">
//       <Row className="mb-3" style={{ marginTop: "0.5rem" }}>
//         <Col>
//           <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.1)" }}>

//             <Card.Body className="p-3">
//               <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
//                 <div className="d-flex align-items-center gap-3">
//                   <h4 className="mb-0 fw-bold" style={{ color: "#6f42c1" }}>
//                     Role & Permission Management
//                   </h4>
//                   <div className="d-flex align-items-center gap-3">
//                     <Form.Select
//                       value={selectedRole}
//                       onChange={(e) => setSelectedRole(e.target.value)}
//                       style={{ width: "200px" }}
//                     >
//                       {roles.map(role => (
//                         <option key={role} value={role}>{role}</option>
//                       ))}
//                     </Form.Select>
//                     <Button
//                       variant="primary"
//                       onClick={savePermissions}
//                       disabled={loading}
//                     >
//                       <i className="fa-solid fa-save me-2"></i>
//                       Save Permissions
//                     </Button>
//                     <Button
//                       variant="outline-secondary"
//                       onClick={resetPermissionsToDefaults}
//                       disabled={loading}
//                       className="ms-2"
//                     >
//                       <i className="fa-solid fa-rotate-left me-2"></i>
//                       Reset to Defaults
//                     </Button>
//                   </div>
//                 </div>

//               </div>

//             </Card.Body>
//           </Card>
//           <div className="table-responsive mt-3">
//             <Table striped bordered hover>
//               <thead>
//                 <tr>
//                   <th style={{ width: "200px" }}>
//                     <div className="d-flex align-items-center gap-2">
//                       <Form.Check
//                         type="checkbox"
//                         checked={areAllModulesFullyEnabled()}
//                         ref={selectAllModulesRef}
//                         onChange={(e) => handleSelectAllModules(e.target.checked)}
//                         title="Select All Modules (All Permissions)"
//                       />
//                       <span>Module</span>
//                     </div>
//                   </th>
//                   <th className="text-center" style={{ width: "120px" }}>
//                     <div className="d-flex flex-column align-items-center">
//                       <Form.Check
//                         type="checkbox"
//                         checked={areAllPermissionsEnabled("can_create")}
//                         ref={selectAllCreateRef}
//                         onChange={(e) => handleSelectAll("can_create", e.target.checked)}
//                         className="mb-1"
//                         title="Select All Create"
//                       />
//                       <i className="fa-solid fa-plus text-success"></i>
//                       <span>Create</span>
//                     </div>
//                   </th>
//                   <th className="text-center" style={{ width: "120px" }}>
//                     <div className="d-flex flex-column align-items-center">
//                       <Form.Check
//                         type="checkbox"
//                         checked={areAllPermissionsEnabled("can_read")}
//                         ref={selectAllReadRef}
//                         onChange={(e) => handleSelectAll("can_read", e.target.checked)}
//                         className="mb-1"
//                         title="Select All Read"
//                       />
//                       <i className="fa-solid fa-eye text-primary"></i>
//                       <span>Read</span>
//                     </div>
//                   </th>
//                   <th className="text-center" style={{ width: "120px" }}>
//                     <div className="d-flex flex-column align-items-center">
//                       <Form.Check
//                         type="checkbox"
//                         checked={areAllPermissionsEnabled("can_update")}
//                         ref={selectAllUpdateRef}
//                         onChange={(e) => handleSelectAll("can_update", e.target.checked)}
//                         className="mb-1"
//                         title="Select All Update"
//                       />
//                       <i className="fa-solid fa-pen text-warning"></i>
//                       <span>Update</span>
//                     </div>
//                   </th>
//                   <th className="text-center" style={{ width: "120px" }}>
//                     <div className="d-flex flex-column align-items-center">
//                       <Form.Check
//                         type="checkbox"
//                         checked={areAllPermissionsEnabled("can_delete")}
//                         ref={selectAllDeleteRef}
//                         onChange={(e) => handleSelectAll("can_delete", e.target.checked)}
//                         className="mb-1"
//                         title="Select All Delete"
//                       />
//                       <i className="fa-solid fa-trash text-danger"></i>
//                       <span>Delete</span>
//                     </div>
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {modules.map(module => (
//                   <tr key={module.name}>
//                     <td>
//                       <strong>{module.label}</strong>
//                     </td>
//                     <td className="text-center">
//                       <Form.Check
//                         type="checkbox"
//                         checked={permissions[module.name]?.can_create || false}
//                         onChange={(e) => handlePermissionChange(module.name, "can_create", e.target.checked)}
//                       />
//                     </td>
//                     <td className="text-center">
//                       <Form.Check
//                         type="checkbox"
//                         checked={permissions[module.name]?.can_read || false}
//                         onChange={(e) => handlePermissionChange(module.name, "can_read", e.target.checked)}
//                       />
//                     </td>
//                     <td className="text-center">
//                       <Form.Check
//                         type="checkbox"
//                         checked={permissions[module.name]?.can_update || false}
//                         onChange={(e) => handlePermissionChange(module.name, "can_update", e.target.checked)}
//                       />
//                     </td>
//                     <td className="text-center">
//                       <Form.Check
//                         type="checkbox"
//                         checked={permissions[module.name]?.can_delete || false}
//                         onChange={(e) => handlePermissionChange(module.name, "can_delete", e.target.checked)}
//                       />
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </Table>
//           </div>

//           {modules.length === 0 && (
//             <div className="text-center py-5">
//               <p className="text-muted">No modules found</p>
//             </div>
//           )}
//         </Col>
//       </Row>
//       <ToastContainer />
//     </Container>
//   );
// };

// export default RolePermissions;

