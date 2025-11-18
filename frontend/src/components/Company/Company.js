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

const Company = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [companies, setCompanies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const recordsPerPage = 10;
  const [formData, setFormData] = useState({
    name: "",
    userlicenses: 0,
    isactive: true,
    systememail: "admin@spark.indicrm.io",
    adminemail: "admin@spark.indicrm.io",
    logourl: "https://spark.indicrm.io/logos/client_logo.png",
    sidebarbgurl: "https://spark.indicrm.io/logos/sidebar_background.jpg",
    sourceschema: "",
    city: "",
    street: "",
    pincode: "",
    state: "",
    country: "",
    platform_name: "",
    platform_api_endpoint: null,
    is_external: false,
    has_wallet: false,
    currency: ""
  });

  // States for dropdown options
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    userlicenses: true,
    isactive: true,
    systememail: true,
    adminemail: true,
    city: true,
    country: true,
    platform_name: true,
    currency: true
  });
  const [selectedItems, setSelectedItems] = useState([]);

  // Fetch companies from API on mount
  useEffect(() => {
    fetchCompanies();
    loadDropdownData();
  }, []);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Load states when country changes
  useEffect(() => {
    if (formData.country) {
      loadStatesByCountry(formData.country);
    } else {
      setStates([]);
    }
  }, [formData.country]);

  // Check for edit query parameter and open edit modal
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get("edit");
    if (editId && companies.length > 0 && !editingCompany) {
      const companyToEdit = companies.find((c) => c.id === editId);
      if (companyToEdit) {
        setEditingCompany(companyToEdit);
        setFormData({
          name: companyToEdit.name || "",
          userlicenses: companyToEdit.userlicenses || 0,
          isactive: companyToEdit.isactive !== undefined ? companyToEdit.isactive : true,
          systememail: companyToEdit.systememail || "admin@spark.indicrm.io",
          adminemail: companyToEdit.adminemail || "admin@spark.indicrm.io",
          logourl: companyToEdit.logourl || "https://spark.indicrm.io/logos/client_logo.png",
          sidebarbgurl: companyToEdit.sidebarbgurl || "https://spark.indicrm.io/logos/sidebar_background.jpg",
          sourceschema: companyToEdit.sourceschema || "",
          city: companyToEdit.city || "",
          street: companyToEdit.street || "",
          pincode: companyToEdit.pincode || "",
          state: companyToEdit.state || "",
          country: companyToEdit.country || "",
          platform_name: companyToEdit.platform_name || "",
          platform_api_endpoint: companyToEdit.platform_api_endpoint || null,
          is_external: companyToEdit.is_external || false,
          has_wallet: companyToEdit.has_wallet || false,
          currency: companyToEdit.currency || ""
        });
        setShowModal(true);
        // Remove edit parameter from URL
        params.delete("edit");
        navigate(`/company?${params.toString()}`, { replace: true });
      }
    }
  }, [location.search, companies]);

  // Listen for PubSub event to open add company modal
  useEffect(() => {
    const token = PubSub.subscribe("OPEN_ADD_COMPANY_MODAL", () => {
      handleAdd();
    });
    return () => {
      PubSub.unsubscribe(token);
    };
  }, []);

  // Load dropdown data
  const loadDropdownData = () => {
    // Countries data
    const countryList = [
      { value: "US", label: "United States" },
      { value: "IN", label: "India" },
      { value: "UK", label: "United Kingdom" },
      { value: "CA", label: "Canada" },
      { value: "AU", label: "Australia" },
      { value: "DE", label: "Germany" },
      { value: "FR", label: "France" },
      { value: "JP", label: "Japan" },
      { value: "SG", label: "Singapore" },
      { value: "AE", label: "United Arab Emirates" }
    ];
    setCountries(countryList);

    // Currencies data
    const currencyList = [
      { value: "USD", label: "USD - US Dollar" },
      { value: "INR", label: "INR - Indian Rupee" },
      { value: "EUR", label: "EUR - Euro" },
      { value: "GBP", label: "GBP - British Pound" },
      { value: "CAD", label: "CAD - Canadian Dollar" },
      { value: "AUD", label: "AUD - Australian Dollar" },
      { value: "JPY", label: "JPY - Japanese Yen" },
      { value: "SGD", label: "SGD - Singapore Dollar" },
      { value: "AED", label: "AED - UAE Dirham" }
    ];
    setCurrencies(currencyList);
  };

  // Load states based on selected country
  const loadStatesByCountry = (countryCode) => {
    const stateData = {
      US: [
        { value: "CA", label: "California" },
        { value: "TX", label: "Texas" },
        { value: "NY", label: "New York" },
        { value: "FL", label: "Florida" },
        { value: "IL", label: "Illinois" }
      ],
      IN: [
        { value: "MH", label: "Maharashtra" },
        { value: "DL", label: "Delhi" },
        { value: "KA", label: "Karnataka" },
        { value: "TN", label: "Tamil Nadu" },
        { value: "UP", label: "Uttar Pradesh" }
      ],
      UK: [
        { value: "ENG", label: "England" },
        { value: "SCT", label: "Scotland" },
        { value: "WLS", label: "Wales" },
        { value: "NIR", label: "Northern Ireland" }
      ],
      CA: [
        { value: "ON", label: "Ontario" },
        { value: "QC", label: "Quebec" },
        { value: "BC", label: "British Columbia" },
        { value: "AB", label: "Alberta" }
      ],
      AU: [
        { value: "NSW", label: "New South Wales" },
        { value: "VIC", label: "Victoria" },
        { value: "QLD", label: "Queensland" },
        { value: "WA", label: "Western Australia" }
      ]
    };

    setStates(stateData[countryCode] || []);
  };

  // Fetch companies from API
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const companyApi = new DataApi("company");
      const response = await companyApi.fetchAll();
      if (response.data && Array.isArray(response.data)) {
        setCompanies(response.data);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to fetch companies",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAdd = () => {
    setEditingCompany(null);
    setFormData({
      name: "",
      userlicenses: 0,
      isactive: true,
      systememail: "admin@spark.indicrm.io",
      adminemail: "admin@spark.indicrm.io",
      logourl: "https://spark.indicrm.io/logos/client_logo.png",
      sidebarbgurl: "https://spark.indicrm.io/logos/sidebar_background.jpg",
      sourceschema: "",
      city: "",
      street: "",
      pincode: "",
      state: "",
      country: "",
      platform_name: "",
      platform_api_endpoint: null,
      is_external: false,
      has_wallet: false,
      currency: ""
    });
    setShowModal(true);
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name || "",
      userlicenses: company.userlicenses || 0,
      isactive: company.isactive !== undefined ? company.isactive : true,
      systememail: company.systememail || "admin@spark.indicrm.io",
      adminemail: company.adminemail || "admin@spark.indicrm.io",
      logourl: company.logourl || "https://spark.indicrm.io/logos/client_logo.png",
      sidebarbgurl: company.sidebarbgurl || "https://spark.indicrm.io/logos/sidebar_background.jpg",
      sourceschema: company.sourceschema || "",
      city: company.city || "",
      street: company.street || "",
      pincode: company.pincode || "",
      state: company.state || "",
      country: company.country || "",
      platform_name: company.platform_name || "",
      platform_api_endpoint: company.platform_api_endpoint || null,
      is_external: company.is_external || false,
      has_wallet: company.has_wallet || false,
      currency: company.currency || ""
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
      const companyApi = new DataApi("company");
      const response = await companyApi.delete(deleteId);
      if (response.data && response.data.success) {
        PubSub.publish("RECORD_SAVED_TOAST", {
          title: "Success",
          message: "Company deleted successfully",
        });
        fetchCompanies(); // Refresh the list
        setShowDeleteModal(false);
        setDeleteId(null);
      } else {
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Error",
          message: response.data?.errors || "Failed to delete company",
        });
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: error.response?.data?.errors || "Failed to delete company",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkDuplicateCompany = (name, excludeId = null) => {
    return companies.some(
      (company) =>
        company.name &&
        company.name.toLowerCase().trim() === name.toLowerCase().trim() &&
        company.id !== excludeId
    );
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name || formData.name.trim() === "") {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Validation Error",
        message: "Company name is required",
      });
      return;
    }

    if (!formData.systememail || !formData.adminemail) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Validation Error",
        message: "System email and admin email are required",
      });
      return;
    }

    // Check for duplicate name
    if (checkDuplicateCompany(formData.name.trim(), editingCompany?.id)) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Duplicate Error",
        message: "Company with this name already exists",
      });
      return;
    }

    try {
      setLoading(true);
      const companyApi = new DataApi("company");
      let response;

      const saveData = {
        ...formData,
        userlicenses: parseInt(formData.userlicenses) || 0
      };

      if (editingCompany) {
        response = await companyApi.update(saveData, editingCompany.id);
      } else {
        response = await companyApi.create(saveData);
      }

      if (response && response.data && response.data.success) {
        PubSub.publish("RECORD_SAVED_TOAST", {
          title: "Success",
          message: editingCompany ? "Company updated successfully" : "Company created successfully",
        });
        fetchCompanies();
        setShowModal(false);
        setFormData({
          name: "",
          userlicenses: 0,
          isactive: true,
          systememail: "admin@spark.indicrm.io",
          adminemail: "admin@spark.indicrm.io",
          logourl: "https://spark.indicrm.io/logos/client_logo.png",
          sidebarbgurl: "https://spark.indicrm.io/logos/sidebar_background.jpg",
          sourceschema: "",
          city: "",
          street: "",
          pincode: "",
          state: "",
          country: "",
          platform_name: "",
          platform_api_endpoint: null,
          is_external: false,
          has_wallet: false,
          currency: ""
        });
        setEditingCompany(null);
      } else if (response && response.data && response.data.errors) {
        const errorMessage = typeof response.data.errors === 'string'
          ? response.data.errors
          : Array.isArray(response.data.errors)
            ? response.data.errors.map(e => e.msg || e).join(", ")
            : response.data.errors;
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Error",
          message: errorMessage,
        });
      } else {
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Error",
          message: "Failed to save company",
        });
      }
    } catch (error) {
      console.error("Error saving company:", error);
      let errorMessage = "Failed to save company";

      if (error.response && error.response.data) {
        if (error.response.data.errors) {
          if (typeof error.response.data.errors === 'string') {
            errorMessage = error.response.data.errors;
          } else if (Array.isArray(error.response.data.errors)) {
            errorMessage = error.response.data.errors.map(e => e.msg || e).join(", ");
          } else if (typeof error.response.data.errors === 'object') {
            errorMessage = error.response.data.errors.message || JSON.stringify(error.response.data.errors);
          }
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          const importedCompanies = jsonData
            .filter((item) => item.Name || item.name)
            .map((item) => ({
              name: String(item.Name || item.name || "").trim(),
              userlicenses: parseInt(item.UserLicenses || item.userlicenses || 0),
              isactive: item.IsActive !== undefined ? Boolean(item.IsActive) : true,
              systememail: String(item.SystemEmail || item.systememail || "admin@spark.indicrm.io").trim(),
              adminemail: String(item.AdminEmail || item.adminemail || "admin@spark.indicrm.io").trim(),
              city: String(item.City || item.city || "").trim(),
              country: String(item.Country || item.country || "").trim(),
              currency: String(item.Currency || item.currency || "").trim(),
            }))
            .filter((company) => company.name);

          const companyApi = new DataApi("company");
          let successCount = 0;
          let errorCount = 0;

          for (const company of importedCompanies) {
            try {
              await companyApi.create(company);
              successCount++;
            } catch (error) {
              console.error("Error importing company:", company.name, error);
              errorCount++;
            }
          }

          PubSub.publish("RECORD_SAVED_TOAST", {
            title: "Import Complete",
            message: `Successfully imported ${successCount} company(s)${errorCount > 0 ? `. ${errorCount} failed.` : ""}`,
          });

          fetchCompanies();
        } catch (error) {
          console.error("Error importing file:", error);
          PubSub.publish("RECORD_ERROR_TOAST", {
            title: "Import Error",
            message: "Failed to import file",
          });
        } finally {
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredCompanies.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredCompanies.map(item => item.id));
    }
  };

  const handleExport = async () => {
    try {
      const itemsToExport = selectedItems.length > 0
        ? filteredCompanies.filter(company => selectedItems.includes(company.id))
        : filteredCompanies;
      const exportData = itemsToExport.map((company) => ({
        Name: company.name || "",
        UserLicenses: company.userlicenses || 0,
        IsActive: company.isactive ? "Yes" : "No",
        SystemEmail: company.systememail || "",
        AdminEmail: company.adminemail || "",
        City: company.city || "",
        State: company.state || "",
        Country: company.country || "",
        PlatformName: company.platform_name || "",
        Currency: company.currency || "",
        IsExternal: company.is_external ? "Yes" : "No",
        HasWallet: company.has_wallet ? "Yes" : "No"
      }));

      const columns = [
        { key: 'Name', header: 'Name', width: 25 },
        { key: 'UserLicenses', header: 'User Licenses', width: 15 },
        { key: 'IsActive', header: 'Is Active', width: 12 },
        { key: 'SystemEmail', header: 'System Email', width: 25 },
        { key: 'AdminEmail', header: 'Admin Email', width: 25 },
        { key: 'City', header: 'City', width: 15 },
        { key: 'Country', header: 'Country', width: 15 },
        { key: 'Currency', header: 'Currency', width: 12 }
      ];

      await exportToExcel(exportData, 'Companies', 'Companies', columns);
      PubSub.publish("RECORD_SAVED_TOAST", {
        title: "Success",
        message: `Exported ${exportData.length} company(ies)`,
      });
    } catch (error) {
      console.error('Error exporting companies:', error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Export Error",
        message: "Failed to export companies",
      });
    }
  };

  const filteredCompanies = companies.filter(
    (company) =>
      (company.name && String(company.name).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (company.systememail && String(company.systememail).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (company.adminemail && String(company.adminemail).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (company.city && String(company.city).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (company.country && String(company.country).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (company.platform_name && String(company.platform_name).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const allColumns = [
    {
      field: "checkbox",
      label: (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Form.Check
            type="checkbox"
            checked={selectedItems.length === filteredCompanies.length && filteredCompanies.length > 0}
            indeterminate={selectedItems.length > 0 && selectedItems.length < filteredCompanies.length}
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
        const idx = filteredCompanies.findIndex(r => r.id === record.id);
        return idx >= 0 ? idx + 1 : "";
      },
      sortable: false,
      width: 80,
    },
    {
      field: "name",
      label: "Company Name",
      render: (value, record) => (
        <div className="d-flex align-items-center">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center me-2"
            style={{
              width: "32px",
              height: "32px",
              background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
              color: "white",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            {value.charAt(0)}
          </div>
          <a
            href={`/company/${record.id}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/company/${record.id}`);
            }}
            style={{ color: "#6f42c1", textDecoration: "none", fontWeight: "500" }}
            onMouseEnter={(e) => {
              try { localStorage.setItem(`prefetch:company:${record.id}`, JSON.stringify(record)); } catch (err) {}
              e.target.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
          >
            {value}
          </a>
        </div>
      ),
    },
    {
      field: "userlicenses",
      label: "User Licenses",
      render: (value) => <Badge bg="primary">{value}</Badge>,
    },
    {
      field: "isactive",
      label: "Status",
      render: (value) => (
        <Badge bg={value ? "success" : "secondary"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      field: "systememail",
      label: "System Email",
      render: (value) => <span style={{ color: "#6c757d" }}>{value}</span>,
    },
    {
      field: "adminemail",
      label: "Admin Email",
      render: (value) => <span style={{ color: "#6c757d" }}>{value}</span>,
    },
    {
      field: "city",
      label: "City",
    },
    {
      field: "country",
      label: "Country",
      render: (value) => {
        const country = countries.find(c => c.value === value);
        return country ? country.label : value;
      }
    },
    {
      field: "platform_name",
      label: "Platform",
    },
    {
      field: "currency",
      label: "Currency",
      render: (value) => value ? <Badge bg="info">{value}</Badge> : "-",
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

  const actionsRenderer = (company) => (
    <div className="d-flex gap-2">
      <Button
        variant="link"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(company);
        }}
        className="action-btn"
        style={{ color: "#6f42c1", padding: "4px 8px" }}
      >
        <i className="fa-solid fa-edit"></i>
      </Button>
      <Button
        variant="link"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(company.id);
        }}
        className="action-btn"
        style={{ color: "#dc3545", padding: "4px 8px" }}
      >
        <i className="fa-solid fa-trash"></i>
      </Button>
    </div>
  );

  return (
    <Container fluid>
      <ScrollToTop />
      <Row className="mb-4">
        <Col>
          <TableHeader
            title="Company Management"
            icon="fa-solid fa-building"
            totalCount={companies.length}
            totalLabel={companies.length === 1 ? "Company" : "Companies"}
            searchPlaceholder="Search companies..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            showColumnVisibility={true}
            allColumns={columnsForVisibilityToggle}
            visibleColumns={visibleColumns}
            onToggleColumnVisibility={toggleColumnVisibility}
            actionButtons={[
              {
                variant: "outline-primary",
                icon: "fa-solid fa-upload",
                label: "Import",
                onClick: () => document.getElementById("importCompanyFile").click(),
                style: { borderColor: "#6f42c1", color: "#6f42c1" },
              },
              {
                variant: "outline-success",
                icon: "fa-solid fa-download",
                label: "Export",
                onClick: handleExport,
              },
              {
                icon: "fa-solid fa-plus",
                label: "Add Company",
                onClick: handleAdd,
              },
            ]}
          />
          <input
            type="file"
            id="importCompanyFile"
            accept=".xlsx,.xls,.csv"
            onChange={handleImport}
            style={{ display: "none" }}
          />
        </Col>
      </Row>

      <Row className="mb-3">
        <Col>
          <InputGroup>
            <InputGroup.Text style={{ background: "#f3e9fc", borderColor: "#e9ecef" }}>
              <i className="fa-solid fa-search" style={{ color: "#6f42c1" }}></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Search companies by name, email, city, country, or platform..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ borderColor: "#e9ecef" }}
            />
          </InputGroup>
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
                  data={filteredCompanies}
                  columns={columns}
                  loading={loading}
                  currentPage={currentPage}
                  totalRecords={filteredCompanies.length}
                  recordsPerPage={recordsPerPage}
                  onPageChange={setCurrentPage}
                  showSerialNumber={false}
                  showCheckbox={false}
                  showActions={true}
                  actionsRenderer={actionsRenderer}
                  showSearch={false}
                  emptyMessage="No companies found"
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add/Edit Modal */}
      <FormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title={editingCompany ? "Edit Company" : "Add New Company"}
        icon="fa-solid fa-building"
        formData={formData}
        setFormData={setFormData}
        fields={[
          {
            name: "name",
            label: "Company Name",
            type: "text",
            required: true,
            placeholder: "Enter company name",
            colSize: 12,
          },
          {
            name: "userlicenses",
            label: "User Licenses",
            type: "number",
            required: true,
            placeholder: "Enter number of user licenses",
            colSize: 6,
          },
          {
            name: "currency",
            label: "Currency",
            type: "select",
            options: currencies,
            placeholder: "Select currency",
            colSize: 6,
          },
          {
            name: "systememail",
            label: "System Email",
            type: "email",
            required: true,
            placeholder: "Enter system email",
            colSize: 6,
          },
          {
            name: "adminemail",
            label: "Admin Email",
            type: "email",
            required: true,
            placeholder: "Enter admin email",
            colSize: 6,
          },
          {
            name: "platform_name",
            label: "Platform Name",
            type: "text",
            placeholder: "Enter platform name",
            colSize: 6,
          },
          {
            name: "isactive",
            label: "Active Status",
            type: "checkbox",
            colSize: 6,
            customRender: (
              <Form.Check
                type="checkbox"
                label="Company is active"
                name="isactive"
                checked={formData.isactive}
                onChange={handleInputChange}
              />
            )
          },
          {
            name: "country",
            label: "Country",
            type: "select",
            options: countries,
            placeholder: "Select country",
            colSize: 4,
          },
          {
            name: "state",
            label: "State",
            type: "select",
            options: states,
            placeholder: states.length === 0 ? "Select country first" : "Select state",
            disabled: states.length === 0,
            colSize: 4,
          },
          {
            name: "city",
            label: "City",
            type: "text",
            placeholder: "Enter city",
            colSize: 4,
          },


          {
            name: "street",
            label: "Street Address",
            type: "text",
            placeholder: "Enter street address",
            colSize: 12,
          },
          {
            name: "pincode",
            label: "Pincode",
            type: "text",
            placeholder: "Enter pincode",
            colSize: 6,
          },
          {
            name: "sourceschema",
            label: "Source Schema",
            type: "text",
            placeholder: "Enter source schema",
            colSize: 6,
          },
          {
            name: "logourl",
            label: "Logo URL",
            type: "url",
            placeholder: "Enter logo URL",
            colSize: 6,
          },
          {
            name: "sidebarbgurl",
            label: "Sidebar Background URL",
            type: "url",
            placeholder: "Enter sidebar background URL",
            colSize: 6,
          },
          {
            name: "is_external",
            label: "External Company",
            type: "checkbox",
            colSize: 6,
            customRender: (
              <Form.Check
                type="checkbox"
                label="Is external company"
                name="is_external"
                checked={formData.is_external}
                onChange={handleInputChange}
              />
            )
          },
          {
            name: "has_wallet",
            label: "Has Wallet",
            type: "checkbox",
            colSize: 6,
            customRender: (
              <Form.Check
                type="checkbox"
                label="Company has wallet"
                name="has_wallet"
                checked={formData.has_wallet}
                onChange={handleInputChange}
              />
            )
          },
        ]}
        onSelectChange={handleSelectChange}
        onSubmit={handleSave}
        loading={loading}
        editingItem={editingCompany}
      />

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this company?</Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Company;