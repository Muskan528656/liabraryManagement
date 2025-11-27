import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form, Modal, InputGroup, Badge, Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import ResizableTable from "../common/ResizableTable";
import ScrollToTop from "../common/ScrollToTop";
import Loader from "../common/Loader";
import TableHeader from "../common/TableHeader";
import DataApi from "../../api/dataApi";
import PubSub from "pubsub-js";
import { exportToExcel } from "../../utils/excelExport";
import { FaGalacticSenate } from "react-icons/fa";

import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import the eye icons

const User = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [roleOptions, setRoleOptions] = useState([]);

  const recordsPerPage = 10;

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    userrole: "USER",
    phone: "",
    whatsapp_number: "",
    country_code: "+91",
    isactive: true,
    blocked: false,
  });

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    firstname: true,
    lastname: true,
    email: true,
    userrole: true,
    phone: true,
    isactive: true,
  });
  const [selectedItems, setSelectedItems] = useState([]);

  // Password visibility state
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchUserRoles();
  }, []);
  const fetchUserRoles = async () => {
    try {
      const userRoleApi = new DataApi("user-role");
      const response = await userRoleApi.fetchAll();
      console.log("user roles response ", response)
      if (response.data && Array.isArray(response.data)) {
        setRoleOptions(response.data);
      }
    } catch (error) {
      console.error("Error fetching user roles:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to fetch user roles",
      });
    }
  };
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const userApi = new DataApi("user");
      const response = await userApi.fetchAll();

      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to fetch users",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({
      firstname: "",
      lastname: "",
      email: "",
      password: "",
      userrole: "USER",
      phone: "",
      whatsapp_number: "",
      country_code: "+91",
      isactive: true,
      blocked: false,
    });
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      firstname: user.firstname || "",
      lastname: user.lastname || "",
      email: user.email || "",
      password: "", // Don't show password
      userrole: user.userrole || "USER",
      phone: user.phone || "",
      whatsapp_number: user.whatsapp_number || "",
      country_code: user.country_code || "+91",
      isactive: user.isactive !== undefined ? user.isactive : true,
      blocked: user.blocked !== undefined ? user.blocked : false,
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      const userApi = new DataApi("user");
      const response = await userApi.delete(deleteId);
      if (response.data && response.data.success) {
        PubSub.publish("RECORD_SAVED_TOAST", {
          title: "Success",
          message: "User deleted successfully",
        });
        fetchUsers();
        setShowDeleteModal(false);
        setDeleteId(null);
      } else {
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Error",
          message: response.data?.errors || "Failed to delete user",
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: error.response?.data?.errors || "Failed to delete user",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.firstname || !formData.lastname) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Validation Error",
        message: "First name and Last name are required",
      });
      return;
    }

    if (!editingUser && !formData.password) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Validation Error",
        message: "Password is required for new users",
      });
      return;
    }

    // Check for duplicate email
    if (formData.email && formData.email.trim()) {
      const duplicateEmail = users.find(
        (user) =>
          user.email &&
          user.email.toLowerCase().trim() === formData.email.toLowerCase().trim() &&
          user.id !== editingUser?.id
      );
      if (duplicateEmail) {
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Duplicate Error",
          message: "User with this email already exists",
        });
        return;
      }
    }

    // Check for duplicate phone
    if (formData.phone && formData.phone.trim()) {
      const duplicatePhone = users.find(
        (user) =>
          user.phone &&
          user.phone.trim() === formData.phone.trim() &&
          user.id !== editingUser?.id
      );
      if (duplicatePhone) {
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Duplicate Error",
          message: "User with this phone number already exists",
        });
        return;
      }
    }

    try {
      setLoading(true);
      const userApi = new DataApi("user");

      const userData = {
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email || null,
        userrole: formData.userrole,
        phone: formData.phone || null,
        // whatsapp_number: formData.whatsapp_number || "null",
        country_code: formData.country_code || null,
        isactive: formData.isactive,
        blocked: formData.blocked,
      };

      console.log("userdatais ", userData)

      // Only include password if it's provided (for new users or password change)
      if (formData.password) {
        userData.password = formData.password;
      }

      let response;
      if (editingUser) {
        response = await userApi.update(userData, editingUser.id);
        if (response.data && response.data.success) {
          PubSub.publish("RECORD_SAVED_TOAST", {
            title: "Success",
            message: "User updated successfully",
          });
          console.log("res" + response)
          fetchUsers();
          setShowModal(false);
          setEditingUser(null);
        } else {
          const errorMsg = typeof response.data?.errors === 'string'
            ? response.data.errors
            : Array.isArray(response.data.errors)
              ? response.data.errors.map((e) => e.msg || e).join(", ")
              : response.data?.errors || "Failed to update user";
          PubSub.publish("RECORD_ERROR_TOAST", {
            title: "Error",
            message: errorMsg,
          });
        }
      } else {
        response = await userApi.create(userData);
        if (response.data && response.data.success) {
          PubSub.publish("RECORD_SAVED_TOAST", {
            title: "Success",
            message: "User created successfully",
          });
          fetchUsers();
          setShowModal(false);
        } else {
          const errorMsg = typeof response.data?.errors === 'string'
            ? response.data.errors
            : Array.isArray(response.data.errors)
              ? response.data.errors.map((e) => e.msg || e).join(", ")
              : response.data?.errors || "Failed to create user";
          PubSub.publish("RECORD_ERROR_TOAST", {
            title: "Error",
            message: errorMsg,
          });
        }
      }
    } catch (error) {
      console.error("Error saving user:", error);
      const errorMsg =
        error.response?.data?.errors
          ? typeof error.response.data.errors === 'string'
            ? error.response.data.errors
            : Array.isArray(error.response.data.errors)
              ? error.response.data.errors.map((e) => e.msg || e).join(", ")
              : error.response.data.errors
          : error.message || "Failed to save user";
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredUsers.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredUsers.map(item => item.id));
    }
  };

  const handleExport = async () => {
    try {
      const itemsToExport = selectedItems.length > 0
        ? filteredUsers.filter(user => selectedItems.includes(user.id))
        : filteredUsers;
      const exportData = itemsToExport.map((user) => ({
        "First Name": user.firstname || "",
        "Last Name": user.lastname || "",
        "Email": user.email || "",
        "Role": user.userrole || "",
        "Phone": user.phone || "",
        // "WhatsApp": user.whatsapp_number || "",
        "Status": user.isactive ? "Active" : "Inactive",
        "Blocked": user.blocked ? "Yes" : "No",
      }));

      const columns = [
        { key: 'First Name', header: 'First Name', width: 20 },
        { key: 'Last Name', header: 'Last Name', width: 20 },
        { key: 'Email', header: 'Email', width: 30 },
        { key: 'Role', header: 'Role', width: 15 },
        { key: 'Phone', header: 'Phone', width: 18 },
        // { key: 'WhatsApp', header: 'WhatsApp', width: 18 },
        { key: 'Status', header: 'Status', width: 12 },
        { key: 'Blocked', header: 'Blocked', width: 12 }
      ];

      await exportToExcel(exportData, 'users', 'Users', columns);
      PubSub.publish("RECORD_SAVED_TOAST", {
        title: "Success",
        message: `Exported ${exportData.length} user(s)`,
      });
    } catch (error) {
      console.error('Error exporting users:', error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Export Error",
        message: "Failed to export users",
      });
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      String(user.firstname || "").toLowerCase().includes(searchLower) ||
      String(user.lastname || "").toLowerCase().includes(searchLower) ||
      String(user.email || "").toLowerCase().includes(searchLower) ||
      String(user.userrole || "").toLowerCase().includes(searchLower) ||
      String(user.phone || "").toLowerCase().includes(searchLower)
    );
  });

  const handleNameClick = (e, record, navigate, isRightClick = false, isEdit) => {
    e.preventDefault();
    e.stopPropagation();

    const userId = record.id;

    try {
      localStorage.setItem(`prefetch:user:${userId}`, JSON.stringify(record));
    } catch (err) { }

    if (isRightClick) {
      window.open(`/user/${userId}`, "_blank");
    } else {
      if (isEdit) {
        navigate(`/user/${userId}`, { state: { isEdit: true, rowData: record }, });
      } else {
        navigate(`/user/${userId}`, { state: record });
      }

    }
  };


  const allColumns = [
    {
      field: "checkbox",
      label: (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Form.Check
            type="checkbox"
            checked={selectedItems.length === filteredUsers.length && filteredUsers.length > 0}
            indeterminate={selectedItems.length > 0 && selectedItems.length < filteredUsers.length}
            onChange={handleSelectAll}
            title="Select all"
            style={{ margin: 0 }}
          />
        </div>
      ),
      render: (value, record) => (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Form.Check
            type="checkbox"
            checked={selectedItems.includes(record.id)}
            onChange={() => toggleSelectItem(record.id)}
            onClick={(e) => e.stopPropagation()}
            style={{ margin: 0 }}
          />
        </div>
      ),
      sortable: false,
      width: 50,
    },
    {
      field: "sr_no",
      label: "Sr.No",
      render: (value, record) => {
        const idx = filteredUsers.findIndex(r => r.id === record.id);
        return idx >= 0 ? idx + 1 : "";
      },
      sortable: false,
      width: 80,
    },
    // { field: "id", label: "User ID", sortable: true },
    {
      field: "firstname",
      label: "First Name",
      sortable: true,
      render: (value, record) => {
        const userId = record.id;
        const userName = value || record.lastname || "N/A";

        return (
          <a
            href={`/user/${userId}`}
            style={{
              color: "var(--primary-color)",
              textDecoration: "none",
              fontWeight: "500",
              cursor: "pointer"
            }}
            onClick={(e) => handleNameClick(e, record, navigate, false)}
            onContextMenu={(e) => handleNameClick(e, record, navigate, true)}
            onMouseEnter={(e) => {
              e.target.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
          >
            {userName}
          </a>
        );
      },
    },

    { field: "lastname", label: "Last Name", sortable: true },
    { field: "email", label: "Email", sortable: true },
    { field: "userrole", label: "Role", sortable: true },
    { field: "phone", label: "Phone", sortable: true },
    {
      field: "isactive",
      label: "Status",
      sortable: true,
      render: (value) => (
        <Badge bg={value ? "success" : "secondary"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  // Filter columns based on visibility (always include checkbox and SR.NO)
  const columns = [
    allColumns[0], // Always include checkbox
    allColumns[1], // Always include SR.NO
    ...allColumns.slice(2).filter(col => visibleColumns[col.field] !== false)
  ];
  const columnsForVisibilityToggle = allColumns.slice(2);

  // Toggle column visibility
  const toggleColumnVisibility = (field) => {
    setVisibleColumns(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const headerActions = [
    {
      label: "Export",
      icon: "fas fa-download",
      variant: "outline-success",
      onClick: handleExport,
    },
    {
      label: "Add",
      icon: "fas fa-plus",
      variant: "primary",
      onClick: handleAdd,
    },
  ];

  const actionsRenderer = (user) => (
    <>
      <button
        // variant="link"
        // size="sm"
        className="custom-btn-edit"
        // onClick={(e) => {
        //   e.stopPropagation();
        //   handleEdit(user);
        // }}
        onClick={(e) => {
          handleNameClick(e, user, navigate, false, true);
        }}
      // style={{ padding: "0.25rem 0.5rem" }}
      >
        <i className="fs-7 fa-solid fa-pen-to-square"></i>
      </button>
      <button
        // variant="link"
        // size="sm"
        className="custom-btn-delete"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(user.id);
        }}
      // style={{ padding: "0.25rem 0.5rem" }}
      >
        <i className="fs-7 fa-solid fa-trash"></i>
      </button>
    </>
  );


  // Toggle password visibility
  const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);

  return (
    <Container fluid className="py-4">
      <ScrollToTop />
      {/* User Management Header - Top Position */}
      <Row className="justify-content-center">
        <Col lg={12} xl={12}>
          <Card style={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "4px", overflow: "hidden" }}>
            <Card.Body className="">
              {loading ? (
                <Loader />
              ) : (
                <>
                  <TableHeader
                    title="User Management"
                    icon="fa-solid fa-users"
                    totalCount={filteredUsers.length}
                    totalLabel={filteredUsers.length === 1 ? "User" : "Users"}
                    filteredCount={filteredUsers.length}
                    showFiltered={!!searchTerm}
                    searchPlaceholder="Search users..."
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    showColumnVisibility={true}
                    allColumns={columnsForVisibilityToggle}
                    visibleColumns={visibleColumns}
                    onToggleColumnVisibility={toggleColumnVisibility}
                    actionButtons={[
                      {
                        variant: "outline-success",
                        size: "sm",
                        icon: "fa-solid fa-download",
                        label: "Export",
                        onClick: handleExport,
                      },
                      {
                        size: "sm",
                        icon: "fa-solid fa-plus",
                        label: "Add User",
                        onClick: handleAdd,
                      },
                    ]}
                  />
                  <ResizableTable
                    data={filteredUsers}
                    columns={columns}
                    loading={loading}
                    currentPage={currentPage}
                    totalRecords={filteredUsers.length}
                    recordsPerPage={recordsPerPage}
                    onPageChange={setCurrentPage}
                    showSerialNumber={false}
                    showCheckbox={false}
                    showActions={true}
                    actionsRenderer={actionsRenderer}
                    showSearch={false}
                    emptyMessage="No users found"
                  />
                </>

              )}

            </Card.Body>
          </Card>
        </Col>
      </Row>



      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingUser ? "Edit User" : "Add User"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="firstname"
                    placeholder="Enter The First Name"
                    value={formData.firstname}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="lastname"
                    value={formData.lastname}
                    placeholder="Enter The Last Name"
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    placeholder="Enter The Email"
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password {!editingUser && <span className="text-danger">*</span>}</Form.Label>
                  <InputGroup className="mb-3">
                    <Form.Control
                      type={passwordVisible ? "text" : "password"} // Toggle between text and password type
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder={editingUser ? "Leave blank to keep current password" : "Enter password"}
                      required={!editingUser}
                    />
                    <InputGroup.Text
                      // style={{
                      //   cursor: "pointer",
                      //   border: "none",
                      //   backgroundColor: "transparent",
                      //   position: "absolute",
                      //   right: "10px",
                      //   top: "10px",
                      //   padding: "0",
                      // }}
                      onClick={togglePasswordVisibility}
                    >
                      {passwordVisible ? <FaEyeSlash /> : <FaEye />}  {/* Switch between Eye and EyeSlash */}
                    </InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
            <Row>


              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    required
                    name="userrole"
                    value={formData.userrole}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Role</option>
                    {roleOptions.map((role) => (
                      <option key={role.id} value={role.role_name}>
                        {role.role_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    placeholder="Enter the phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              {/* <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>WhatsApp Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col> */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Country Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="country_code"
                    value={formData.country_code}
                    onChange={handleInputChange}
                    placeholder="+91"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="isactive"
                    label="Active"
                    checked={formData.isactive}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              {/* <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="blocked"
                    label="Blocked"
                    checked={formData.blocked}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col> */}
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this user?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default User;

