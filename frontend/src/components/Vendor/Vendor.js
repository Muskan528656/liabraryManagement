import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form, Modal, InputGroup, Badge, Dropdown } from "react-bootstrap";
import * as XLSX from "xlsx";
import { useNavigate, useLocation } from "react-router-dom";
import ResizableTable from "../common/ResizableTable";
import ScrollToTop from "../common/ScrollToTop";
import Loader from "../common/Loader";
import TableHeader from "../common/TableHeader";
import FormModal from "../common/FormModal";
import DataApi from "../../api/dataApi";
import PubSub from "pubsub-js";
import { exportToExcel } from "../../utils/excelExport";
import CityState from "../../constants/CityState.json";
import CityPincode from "../../constants/CityPincode.json";
import Select from "react-select";
const Vendor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [vendors, setVendors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [duplicateCheck, setDuplicateCheck] = useState({ email: false });
  const [selectedItems, setSelectedItems] = useState([]);
  const recordsPerPage = 10;

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [pincodes, setPincodes] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [filteredPincodes, setFilteredPincodes] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    gst_number: "",
    pan_number: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    status: "active",
  });

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    company_name: true,
    email: true,
    phone: true,
    gst_number: true,
    pan_number: true,
    address: true,
    city: true,
    state: true,
    status: true,
  });


  const cityOptions = (formData.state ? filteredCities : cities).map((city) => ({
    value: city.value,
    label: city.label || city.value,
  }));

  useEffect(() => {
    fetchVendors();
    initializeCityStateData();
  }, []);
  // const handleChange = (selectedOption) => {
  //   setFormData({
  //     ...formData,
  //     state: selectedOption ? selectedOption.value : "",
  //   });
  // };

  const handleStateChange = (selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      state: selectedOption ? selectedOption.value : "",
      city: "", // Reset city when state changes
    }));
  };

  const handleCityChange = (selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      city: selectedOption ? selectedOption.value : "",
    }));
  };
  // Initialize states and cities data
  const initializeCityStateData = () => {
    // Get unique states
    const uniqueStates = [...new Set(CityState.map(item => item.state))].map(state => ({
      value: state,
      label: state
    }));
    setStates(uniqueStates);

    // Get all cities
    const allCities = CityState.map(item => ({
      value: item.name,
      label: item.name,
      state: item.state
    }));
    setCities(allCities);

    // Get all pincodes
    const allPincodes = CityPincode.map(item => ({
      value: item.pincode,
      label: `${item.pincode} - ${item.city}, ${item.state}`,
      city: item.city,
      state: item.state
    }));
    setPincodes(allPincodes);
  };

  // Update cities when state changes
  useEffect(() => {
    if (formData.state && cities.length > 0) {
      const stateCities = cities.filter(city => city.state === formData.state);
      setFilteredCities(stateCities);

      // If city doesn't match the selected state, clear it
      if (formData.city) {
        const cityExists = stateCities.find(c => c.value === formData.city);
        if (!cityExists) {
          setFormData(prev => ({ ...prev, city: "", pincode: "" }));
        }
      }
    } else {
      setFilteredCities(cities);
    }
  }, [formData.state, cities]);

  // Auto-fill pincode and state when city is selected/typed (only if not already set)
  useEffect(() => {
    if (formData.city && cities.length > 0) {
      const cityData = CityPincode.find(item =>
        item.city.toLowerCase() === formData.city.toLowerCase()
      );
      if (cityData) {
        // Only auto-fill if pincode is empty or doesn't match
        if (!formData.pincode || formData.pincode !== cityData.pincode) {
          setFormData(prev => ({
            ...prev,
            pincode: cityData.pincode,
            state: prev.state || cityData.state
          }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.city]);

  // Auto-fill city and state when pincode is typed (only if city/state not set)
  useEffect(() => {
    if (formData.pincode && formData.pincode.length >= 6 && pincodes.length > 0) {
      const pincodeData = CityPincode.find(item =>
        item.pincode === formData.pincode
      );
      if (pincodeData) {
        // Only auto-fill if city/state is empty or doesn't match
        if (!formData.city || formData.city !== pincodeData.city) {
          setFormData(prev => ({
            ...prev,
            city: pincodeData.city,
            state: prev.state || pincodeData.state
          }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.pincode]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Check for edit query parameter and open edit modal
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get("edit");
    if (editId && vendors.length > 0 && !editingVendor) {
      const vendorToEdit = vendors.find((v) => v.id === editId);
      if (vendorToEdit) {
        setEditingVendor(vendorToEdit);
        setFormData({
          name: vendorToEdit.name || "",
          company_name: vendorToEdit.company_name || "",
          email: vendorToEdit.email || "",
          phone: vendorToEdit.phone || "",
          gst_number: vendorToEdit.gst_number || "",
          pan_number: vendorToEdit.pan_number || "",
          address: vendorToEdit.address || "",
          city: vendorToEdit.city || "",
          state: vendorToEdit.state || "",
          pincode: vendorToEdit.pincode || "",
          country: vendorToEdit.country || "India",
          status: vendorToEdit.status || "active",
        });
        setDuplicateCheck({ email: false });
        setShowModal(true);
        params.delete("edit");
        navigate(`/vendor?${params.toString()}`, { replace: true });
      }
    }
  }, [location.search, vendors]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const vendorApi = new DataApi("purchasevendor");
      const response = await vendorApi.fetchAll();
      if (response.data) {
        setVendors(response.data);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to fetch vendors",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "email" && value) {
      checkDuplicateEmail(value, editingVendor?.id);
    } else {
      setDuplicateCheck({ email: false });
    }
  };

  const checkDuplicateEmail = async (email, excludeId = null) => {
    if (!email) {
      setDuplicateCheck({ email: false });
      return;
    }

    try {
      const vendorApi = new DataApi("purchasevendor");
      const allVendors = await vendorApi.fetchAll();
      const duplicate = allVendors.data.find((v) => {
        return v.email && v.email.toLowerCase() === email.toLowerCase() && v.id !== excludeId;
      });
      setDuplicateCheck({ email: !!duplicate });
    } catch (error) {
      console.error("Error checking duplicate:", error);
    }
  };

  const handleAdd = () => {
    setEditingVendor(null);
    setFormData({
      name: "",
      company_name: "",
      email: "",
      phone: "",
      gst_number: "",
      pan_number: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      status: "active",
    });
    setDuplicateCheck({ email: false });
    setShowModal(true);
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name || "",
      company_name: vendor.company_name || "",
      email: vendor.email || "",
      phone: vendor.phone || "",
      gst_number: vendor.gst_number || "",
      pan_number: vendor.pan_number || "",
      address: vendor.address || "",
      city: vendor.city || "",
      state: vendor.state || "",
      pincode: vendor.pincode || "",
      country: vendor.country || "India",
      status: vendor.status || "active",
    });
    setDuplicateCheck({ email: false });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      const vendorApi = new DataApi("purchasevendor");
      const response = await vendorApi.delete(deleteId);
      if (response.data && response.data.success) {
        PubSub.publish("RECORD_SAVED_TOAST", {
          title: "Success",
          message: "Vendor deleted successfully",
        });
        fetchVendors();
        setShowDeleteModal(false);
        setDeleteId(null);
      } else {
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Error",
          message: response.data?.errors || "Failed to delete vendor",
        });
      }
    } catch (error) {
      console.error("Error deleting vendor:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to delete vendor",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.name.trim()) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Validation Error",
        message: "Name is required",
      });
      return;
    }

    // Check for duplicate name
    const duplicateName = vendors.find(
      (vendor) =>
        vendor.name &&
        vendor.name.toLowerCase().trim() === formData.name.toLowerCase().trim() &&
        vendor.id !== editingVendor?.id
    );
    if (duplicateName) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Duplicate Error",
        message: "Vendor with this name already exists",
      });
      return;
    }

    // Check for duplicate email
    if (formData.email && formData.email.trim()) {
      const duplicateEmail = vendors.find((vendor) => {
        if (vendor.id === editingVendor?.id) return false;
        return vendor.email && vendor.email.toLowerCase().trim() === formData.email.toLowerCase().trim();
      });
      if (duplicateEmail) {
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Duplicate Error",
          message: "Vendor with this email already exists",
        });
        return;
      }
    }

    try {
      setLoading(true);
      const vendorApi = new DataApi("purchasevendor");

      const vendorData = {
        name: formData.name.trim(),
        company_name: formData.company_name.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        gst_number: formData.gst_number.trim() || null,
        pan_number: formData.pan_number.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        pincode: formData.pincode.trim() || null,
        country: formData.country.trim() || "India",
        status: formData.status || "active",
      };

      let response;
      if (editingVendor) {
        response = await vendorApi.update(vendorData, editingVendor.id);
        if (response.data && response.data.success) {
          PubSub.publish("RECORD_SAVED_TOAST", {
            title: "Success",
            message: "Vendor updated successfully",
          });
          fetchVendors();
          setShowModal(false);
          setEditingVendor(null);
          setFormData({
            name: "",
            company_name: "",
            email: "",
            phone: "",
            gst_number: "",
            pan_number: "",
            address: "",
            city: "",
            state: "",
            pincode: "",
            country: "India",
            status: "active",
          });
        } else {
          const errorMsg = Array.isArray(response.data?.errors)
            ? response.data.errors.map((e) => e.msg || e).join(", ")
            : response.data?.errors || "Failed to update vendor";
          PubSub.publish("RECORD_ERROR_TOAST", {
            title: "Error",
            message: errorMsg,
          });
        }
      } else {
        response = await vendorApi.create(vendorData);
        if (response.data && response.data.success) {
          PubSub.publish("RECORD_SAVED_TOAST", {
            title: "Success",
            message: "Vendor created successfully",
          });
          fetchVendors();
          setShowModal(false);
          setFormData({
            name: "",
            company_name: "",
            email: "",
            phone: "",
            gst_number: "",
            pan_number: "",
            address: "",
            city: "",
            state: "",
            pincode: "",
            country: "India",
            status: "active",
          });
        } else {
          const errorMsg = Array.isArray(response.data?.errors)
            ? response.data.errors.map((e) => e.msg || e).join(", ")
            : response.data?.errors || "Failed to create vendor";
          PubSub.publish("RECORD_ERROR_TOAST", {
            title: "Error",
            message: errorMsg,
          });
        }
      }
    } catch (error) {
      console.error("Error saving vendor:", error);
      const errorMsg =
        error.response?.data?.errors
          ? Array.isArray(error.response.data.errors)
            ? error.response.data.errors.map((e) => e.msg || e).join(", ")
            : error.response.data.errors
          : error.message || "Failed to save vendor";
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle individual checkbox toggle
  const toggleSelectItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectedItems.length === filteredVendors.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredVendors.map(vendor => vendor.id));
    }
  };

  const handleExport = async () => {
    try {
      // If items are selected, export only selected items; otherwise export all filtered items
      const exportList = (selectedItems && selectedItems.length > 0)
        ? filteredVendors.filter(v => (selectedItems || []).includes(v.id))
        : filteredVendors;

      if (exportList.length === 0) {
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Error",
          message: "No vendors to export. Please select vendors or clear search filter.",
        });
        return;
      }

      const exportData = exportList.map((vendor, index) => {
        return {
          "Sr. No": index + 1,
          Name: vendor.name || "",
          "Company Name": vendor.company_name || "",
          Email: vendor.email || "",
          Phone: vendor.phone || "",
          "GST Number": vendor.gst_number || "",
          "PAN Number": vendor.pan_number || "",
          Address: vendor.address || "",
          City: vendor.city || "",
          State: vendor.state || "",
          Pincode: vendor.pincode || "",
          Country: vendor.country || "",
          Status: vendor.status || "",
        };
      });

      const columns = [
        { key: 'Sr. No', header: 'Sr. No', width: 10 },
        { key: 'Name', header: 'Name', width: 30 },
        { key: 'Company Name', header: 'Company Name', width: 30 },
        { key: 'Email', header: 'Email', width: 30 },
        { key: 'Phone', header: 'Phone', width: 20 },
        { key: 'GST Number', header: 'GST Number', width: 20 },
        { key: 'PAN Number', header: 'PAN Number', width: 20 },
        { key: 'Address', header: 'Address', width: 40 },
        { key: 'City', header: 'City', width: 20 },
        { key: 'State', header: 'State', width: 20 },
        { key: 'Pincode', header: 'Pincode', width: 15 },
        { key: 'Country', header: 'Country', width: 20 },
        { key: 'Status', header: 'Status', width: 15 }
      ];

      await exportToExcel(exportData, 'vendors', 'Vendors', columns);

      PubSub.publish("RECORD_SAVED_TOAST", {
        title: "Export Successful",
        message: `Exported ${exportList.length} vendor${exportList.length > 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error('Error exporting vendors:', error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Export Error",
        message: "Failed to export vendors",
      });
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log("Imported data:", jsonData);
      PubSub.publish("RECORD_SAVED_TOAST", {
        title: "Import",
        message: `${jsonData.length} records imported`,
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredVendors = vendors.filter((vendor) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      String(vendor.name || "").toLowerCase().includes(searchLower) ||
      String(vendor.company_name || "").toLowerCase().includes(searchLower) ||
      String(vendor.email || "").toLowerCase().includes(searchLower) ||
      String(vendor.phone || "").toLowerCase().includes(searchLower) ||
      String(vendor.gst_number || "").toLowerCase().includes(searchLower) ||
      String(vendor.pan_number || "").toLowerCase().includes(searchLower) ||
      String(vendor.address || "").toLowerCase().includes(searchLower) ||
      String(vendor.city || "").toLowerCase().includes(searchLower) ||
      String(vendor.state || "").toLowerCase().includes(searchLower)
    );
  });

  const allColumns = [
    {
      field: "checkbox",
      label: (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Form.Check
            type="checkbox"
            checked={selectedItems.length === filteredVendors.length && filteredVendors.length > 0}
            indeterminate={selectedItems.length > 0 && selectedItems.length < filteredVendors.length}
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
      label: "SR.NO",
      render: (value, record) => {
        const idx = filteredVendors.findIndex(r => r.id === record.id);
        return idx >= 0 ? idx + 1 : "";
      },
      sortable: false,
      width: 80,
    },
    {
      field: "name",
      label: "Name",
      sortable: true,
      render: (value, record) => (
        <a
          href={`/vendor/${record.id}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/vendor/${record.id}`);
          }}
          style={{ color: "#6f42c1", textDecoration: "none", fontWeight: "500" }}
          onMouseEnter={(e) => {
            try { localStorage.setItem(`prefetch:purchasevendor:${record.id}`, JSON.stringify(record)); } catch (err) { }
            e.target.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
        >
          {value || "N/A"}
        </a>
      ),
    },
    { field: "company_name", label: "Company Name", sortable: true },
    { field: "email", label: "Email", sortable: true },
    { field: "phone", label: "Phone", sortable: true },
    { field: "gst_number", label: "GST Number", sortable: true },
    { field: "pan_number", label: "PAN Number", sortable: true },
    { field: "address", label: "Address", sortable: true },
    { field: "city", label: "City", sortable: true },
    { field: "state", label: "State", sortable: true },
    {
      field: "status",
      label: "Status",
      sortable: true,
      render: (value, record) => {
        const status = record?.status || value || 'active';
        return (
          <Badge bg={status === 'active' ? 'success' : status === 'inactive' ? 'secondary' : 'warning'}>
            {status}
          </Badge>
        );
      }
    },
  ];

  // Filter columns based on visibility (always include checkbox and SR.NO)
  const columns = [
    allColumns[0], // Always include checkbox
    allColumns[1], // Always include SR.NO
    ...allColumns.slice(2).filter(col => visibleColumns[col.field] !== false)
  ];

  // Columns for visibility toggle (exclude checkbox and SR.NO)
  const columnsForVisibilityToggle = allColumns.slice(2);

  // Toggle column visibility
  const toggleColumnVisibility = (field) => {
    setVisibleColumns(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const actionsRenderer = (vendor) => (
    <>
      <Button
        variant="link"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(vendor);
        }}
        style={{ padding: "0.25rem 0.5rem" }}
      >
        <i className="fas fa-edit text-primary"></i>
      </Button>
      <Button
        variant="link"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(vendor.id);
        }}
        style={{ padding: "0.25rem 0.5rem" }}
      >
        <i className="fas fa-trash text-danger"></i>
      </Button>
    </>
  );

  return (
    <Container fluid>
      <ScrollToTop />
      <Row className="mb-3" style={{ marginTop: "0.5rem" }}>
        <Col>
          <TableHeader
            className="table-header"
            title="Vendor Management"
            icon="fa-solid fa-store"
            totalCount={filteredVendors.length}
            totalLabel={filteredVendors.length === 1 ? "Vendor" : "Vendors"}
            filteredCount={filteredVendors.length}
            showFiltered={!!searchTerm}
            searchPlaceholder="Search vendors..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            showColumnVisibility={true}
            allColumns={columnsForVisibilityToggle}
            visibleColumns={visibleColumns}
            onToggleColumnVisibility={toggleColumnVisibility}
            actionButtons={[
              {
                variant: "outline-primary",
                size: "sm",
                icon: "fa-solid fa-upload",
                label: "Import",
                onClick: () => document.getElementById("importFile").click(),
                style: { borderColor: "#6f42c1", color: "#6f42c1" },
              },
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
                label: "Add Vendor",
                onClick: handleAdd,
                style: {
                  background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                  border: "none",
                },
              },
            ]}
          />
          <input
            type="file"
            id="importFile"
            accept=".xlsx,.xls,.csv"
            onChange={handleImport}
            style={{ display: "none" }}
          />
        </Col>
      </Row>


      <Row style={{ margin: 0, width: "100%", maxWidth: "100%" }}>
        <Col style={{ padding: 0, width: "100%", maxWidth: "100%" }}>
          <Card style={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "4px", overflow: "hidden", width: "100%", maxWidth: "100%" }}>
            <Card.Body className="p-0" style={{ overflow: "hidden", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
              {loading ? (
                <Loader />
              ) : (
                <ResizableTable
                  data={filteredVendors}
                  columns={columns}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  currentPage={currentPage}
                  totalRecords={filteredVendors.length}
                  recordsPerPage={recordsPerPage}
                  onPageChange={setCurrentPage}
                  headerActions={[]}
                  actionsRenderer={actionsRenderer}
                  loading={loading}
                  showSerialNumber={false}
                  showCheckbox={false}
                  showActions={true}
                  showSearch={false}
                  emptyMessage="No vendors found"
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <input
        type="file"
        id="importFile"
        accept=".xlsx,.xls,.csv"
        style={{ display: "none" }}
        onChange={handleImport}
      />

      {/* Add/Edit Modal */}
      <FormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title={editingVendor ? "Edit Vendor" : "Add Vendor"}
        icon="fa-solid fa-store"
        formData={formData}
        setFormData={setFormData}
        size="xl"
        fields={[
          {
            name: "name",
            label: "Name",
            type: "text",
            required: true,
            placeholder: "Enter vendor name",
            colSize: 6,
          },
          {
            name: "company_name",
            label: "Company Name",
            type: "text",
            placeholder: "Enter company name",
            colSize: 6,
          },
          {
            name: "email",
            label: "Email",
            type: "custom",
            colSize: 6,
            render: (value) => (
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={value}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, email: val });
                    if (val) {
                      checkDuplicateEmail(val, editingVendor?.id);
                    } else {
                      setDuplicateCheck({ email: false });
                    }
                  }}
                  placeholder="Enter email address"
                  isInvalid={duplicateCheck.email}
                />
                {duplicateCheck.email && (
                  <Form.Control.Feedback type="invalid">
                    Vendor with this email already exists
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            ),
          },
          {
            name: "phone",
            label: "Phone",
            type: "tel",
            placeholder: "Enter phone number",
            colSize: 6,
          },
          {
            name: "gst_number",
            label: "GST Number",
            type: "text",
            placeholder: "Enter GST number",
            colSize: 6,
          },
          {
            name: "pan_number",
            label: "PAN Number",
            type: "text",
            placeholder: "Enter PAN number",
            colSize: 6,
          },
          {
            name: "address",
            label: "Address",
            type: "textarea",
            rows: 3,
            placeholder: "Enter address",
            colSize: 12,
          },
          {
            name: "state",
            label: "State",
            type: "custom",
            colSize: 4,
            render: (value) => (
              <Form.Group className="mb-3">
                <Form.Label>State</Form.Label>
                <Select
                  name="state"
                  value={states.find((s) => s.value === formData.state) || null}
                  onChange={handleStateChange}
                  options={states}
                  placeholder="Select State"
                  isClearable
                  styles={{
                    control: (base) => ({
                      ...base,
                      border: "2px solid #c084fc",
                      borderRadius: "8px",
                      boxShadow: "none",
                      "&:hover": { borderColor: "#a855f7" },
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isFocused ? "#f3e8ff" : "white",
                      color: "#4c1d95",
                      cursor: "pointer",
                    }),
                  }}
                />
              </Form.Group>
            ),
          },
          {
            name: "city",
            label: "City",
            type: "custom",
            colSize: 4,
            render: (value) => (
              <Form.Group className="mb-3">
                <Form.Label>City</Form.Label>
                <Select
                  name="city"
                  value={cityOptions.find((c) => c.value === formData.city) || null}
                  onChange={handleCityChange}
                  options={cityOptions}
                  placeholder="Type or select city"
                  isClearable
                  isSearchable
                  styles={{
                    control: (base) => ({
                      ...base,
                      border: "2px solid #c084fc",
                      borderRadius: "8px",
                      boxShadow: "none",
                      "&:hover": { borderColor: "#a855f7" },
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isFocused ? "#f3e8ff" : "white",
                      color: "#4c1d95",
                      cursor: "pointer",
                    }),
                  }}
                />
              </Form.Group>
            ),
          },
          {
            name: "pincode",
            label: "Pincode",
            type: "custom",
            colSize: 4,
            render: (value) => (
              <Form.Group className="mb-3">
                <Form.Label>Pincode</Form.Label>
                <Form.Control
                  type="text"
                  name="pincode"
                  list="pincodes-list"
                  value={value}
                  onChange={(e) => handleInputChange(e)}
                  placeholder="Type or select pincode"
                  autoComplete="off"
                  maxLength={6}
                />
                <datalist id="pincodes-list">
                  {pincodes
                    .filter(p =>
                      !formData.city || p.city.toLowerCase() === formData.city.toLowerCase()
                    )
                    .map((pincode) => (
                      <option key={pincode.value} value={pincode.value}>
                        {pincode.label}
                      </option>
                    ))}
                </datalist>
              </Form.Group>
            ),
          },
          {
            name: "country",
            label: "Country",
            type: "text",
            placeholder: "Enter country",
            colSize: 6,
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "suspended", label: "Suspended" },
            ],
            colSize: 6,
          },
        ]}
        onSubmit={handleSave}
        loading={loading}
        editingItem={editingVendor}
        customFooter={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={loading || duplicateCheck.email}
              style={{
                background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                border: "none",
              }}
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </>
        }
      />

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this vendor?</Modal.Body>
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

export default Vendor;

