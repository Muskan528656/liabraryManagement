import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Modal, Alert } from "react-bootstrap";
import DynamicCRUD from "../common/DynaminCrud";
import { getLibraryCardConfig } from "./librarycardconfig";
import JsBarcode from "jsbarcode";
import DataApi from "../../api/dataApi";
import { API_BASE_URL, MODULES } from "../../constants/CONSTANT";
import { handleDownloadBarcode } from './LibraryCardDownload';
import { handlePrintBarcode } from './LibrarycardPrint';
import { useTimeZone } from "../../contexts/TimeZoneContext";
import LibraryImportModal from "./LibraryImportModal";
import { AuthHelper } from "../../utils/authHelper";
import PermissionDenied from "../../utils/permission_denied";
import "../../App.css";

const LibraryCard = ({ permissions, ...props }) => {
  const { timeZone } = useTimeZone();

  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [barcodeError, setBarcodeError] = useState(null);
  const [baseConfig, setBaseConfig] = useState(null);
  const [finalConfig, setFinalConfig] = useState(null);
  const [subscriptionsData, setSubscriptionsData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState(null);
  const [showLibraryImportModal, setShowLibraryImportModal] = useState(false);

  const [modulePermissions, setModulePermissions] = useState({
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    loading: true
  });

  const normalizedApiBaseUrl = useMemo(() => {
    return typeof API_BASE_URL === "string"
      ? API_BASE_URL.replace(/\/ibs$/, "")
      : "";
  }, []);

  useEffect(() => {
    const fetchPermissions = async () => {
      const canView = await AuthHelper.hasModulePermission(MODULES.LIBRARY_MEMBERS, MODULES.CAN_VIEW);
      const canCreate = await AuthHelper.hasModulePermission(MODULES.LIBRARY_MEMBERS, MODULES.CAN_CREATE);
      const canEdit = await AuthHelper.hasModulePermission(MODULES.LIBRARY_MEMBERS, MODULES.CAN_EDIT);
      const canDelete = await AuthHelper.hasModulePermission(MODULES.LIBRARY_MEMBERS, MODULES.CAN_DELETE);

      setModulePermissions({ canView, canCreate, canEdit, canDelete, loading: false });
    };

    fetchPermissions();
    window.addEventListener("permissionsUpdated", fetchPermissions);
    return () => window.removeEventListener("permissionsUpdated", fetchPermissions);
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const response = await new DataApi("subscriptions").fetchAll();
      const data = Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.data)
          ? response.data
          : [];
      setSubscriptionsData(data);
      return data;
    } catch {
      setConfigError("Failed to load subscription data");
      return [];
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await new DataApi("user").fetchAll();
      const data = Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.data)
          ? response.data
          : [];
      setUsersData(data);
      return data;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        setLoadingConfig(true);
        const [subscriptions, users] = await Promise.all([fetchSubscriptions(), fetchUsers()]);
        const config = await getLibraryCardConfig(
          { subscriptions, users, ...props },
          timeZone,
          {
            canCreate: permissions.allowCreate,
            canEdit: permissions.allowEdit,
            canDelete: permissions.allowDelete
          }
        );
        setBaseConfig(config);
      } catch {
        setConfigError("Failed to load configuration");
      } finally {
        setLoadingConfig(false);
      }
    };

    if (timeZone) init();
  }, [fetchSubscriptions, fetchUsers, timeZone]);


  useEffect(() => {
    if (showBarcodeModal && selectedCard) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => initializeModalBarcode(), 300);
      return () => clearTimeout(timer);
    }
  }, [showBarcodeModal, selectedCard]);


  const initializeModalBarcode = () => {
    if (!selectedCard || !showBarcodeModal) return;

    const cardNumber = selectedCard.card_number || selectedCard?.card_no || "N/A";
    if (!cardNumber || cardNumber === "N/A") {
      setBarcodeError("Cannot generate barcode: card number missing");
      return;
    }

    const barcodeElement = document.getElementById(`barcode-modal-${selectedCard.id || selectedCard._id}`);
    if (!barcodeElement) return;

    try {
      barcodeElement.innerHTML = '';
      JsBarcode(barcodeElement, cardNumber, {
        width: 2,
        height: 80,
        displayValue: true,
        text: cardNumber,
        fontSize: 14,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000",
        flat: true
      });
      setBarcodeError(null);
    } catch (error) {
      console.error("Barcode generation error:", error);
      setBarcodeError("Failed to generate barcode");
    }
  };


  const handleModalOpen = (card) => {
    setSelectedCard(card);
    setBarcodeError(null);
    setShowBarcodeModal(true);
  };

  const handleModalClose = () => {
    setShowBarcodeModal(false);
    setSelectedCard(null);
    setBarcodeError(null);
  };


  const generateCardNumber = (card) => {
    return card?.card_number || card?.card_no || 'N/A';
  };


  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return 'Invalid Date';
    }
  };

  if (permissions.loading || loadingConfig) return <span className="loader"></span>;
  if (!permissions.allowView) return <PermissionDenied />;
  if (configError) return <div className="alert alert-danger m-3">{configError}</div>;
  if (!baseConfig) return <span className="loader"></span>;


  if (!finalConfig) {
    const config = {
      ...baseConfig,
      permissions: {
        canCreate: modulePermissions.allowCreate,
        canEdit: modulePermissions.allowEdit,
        canDelete: modulePermissions.allowDelete
      },
      // Add customHandlers for barcode preview
      customHandlers: {
        ...baseConfig.customHandlers,
        handleBarcodePreview: handleModalOpen,
        formatDateToDDMMYYYY: formatDate,
        generateCardNumber: generateCardNumber
      }
    };
    setFinalConfig(config);
    return <span className="loader"></span>;
  }

  return (
    <>
      <DynamicCRUD
        {...finalConfig}
        icon="fa-solid fa-id-card"
        permissions={permissions}
        subscriptionsData={subscriptionsData}
        usersData={usersData}
        headerActions={[
          {
            variant: "outline-primary",
            size: "sm",
            icon: "fa-solid fa-arrow-down",
            key: "import-member",
            onClick: () => setShowLibraryImportModal(true),
          },
        ]}
      />

      <LibraryImportModal
        show={showLibraryImportModal}
        onClose={() => setShowLibraryImportModal(false)}
        onImport={(data) => alert(`Importing ${data.file.name}`)}
      />


      <Modal show={showBarcodeModal} onHide={handleModalClose} size="lg" centered>
        <Modal.Header
          closeButton
          style={{
            background: "var(--primary-color)",
            color: "white",
            borderBottom: "none"
          }}
        >
          <Modal.Title style={{ color: "white" }}>
            <i className="fa-solid fa-id-card me-2"></i> Member Information
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ padding: "20px", background: "#f8f9fa" }}>
          {selectedCard && (
            <div style={{
              background: "white",
              border: "2px solid var(--primary-color)",
              borderRadius: "10px",
              padding: "20px",
              maxWidth: "500px",
              margin: "0 auto"
            }}>
              {/* User Image Section - ADDED */}
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                {selectedCard.image ? (
                  <img
                    src={selectedCard.image.startsWith("http") ? selectedCard.image : `${API_BASE_URL}${selectedCard.image}`}
                    alt={selectedCard.first_name || 'User'}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--primary-color)'
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `
                        <div style="width:80px;height:80px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;margin:0 auto;border:3px solid var(--primary-color)">
                          <i class="fa-solid fa-user" style="font-size:32px;color:var(--primary-color)"></i>
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    border: '3px solid var(--primary-color)'
                  }}>
                    <i className="fa-solid fa-user" style={{ fontSize: "32px", color: "var(--primary-color)" }}></i>
                  </div>
                )}
              </div>

              {barcodeError && (
                <Alert variant="warning" className="mb-3">
                  {barcodeError}
                </Alert>
              )}

              <div style={{
                border: "1px solid #ddd",
                padding: "15px",
                background: "white",
                textAlign: "center",
                marginBottom: "15px",
                borderRadius: "8px"
              }}>
                <svg
                  id={`barcode-modal-${selectedCard.id || selectedCard._id}`}
                  style={{ width: '100%', height: '80px', display: 'block' }}
                ></svg>
                <div style={{
                  marginTop: "10px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "var(--primary-color)",
                  fontFamily: "monospace"
                }}>
                  {generateCardNumber(selectedCard)}
                </div>
              </div>

              {/* User Information */}
              <div style={{
                background: "#f8f9fa",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "15px"
              }}>
                <p className="mb-1"><strong>Card No:</strong> {generateCardNumber(selectedCard)}</p>
                <p className="mb-1"><strong>Name:</strong> {selectedCard.first_name || selectedCard.user_name || 'N/A'} {selectedCard.last_name || ''}</p>
                <p className="mb-1"><strong>Email:</strong> {selectedCard.email || 'N/A'}</p>
                <p className="mb-1"><strong>Registration Date:</strong> {formatDate(selectedCard.registration_date)}</p>
                <p className="mb-1"><strong>Subscription:</strong> {selectedCard.subscription_name || 'No Subscription'}</p>
                <p className="mb-1"><strong>Allowed Books:</strong> {selectedCard.allowed_books_effective || selectedCard.allowed_book || '5'}</p>
                <p className="mb-1"><strong>Status:</strong>
                  <span style={{
                    color: selectedCard.is_active ? "green" : "gray",
                    fontWeight: "bold",
                    marginLeft: "5px"
                  }}>
                    {selectedCard.is_active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>

              {/* Footer Note */}
              <div style={{
                textAlign: "center",
                fontSize: "12px",
                color: "#666"
              }}>
                <p className="mb-0">Scan barcode to verify membership</p>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="d-flex justify-content-between">
          <div>
            <Button
              variant="outline-success"
              onClick={() => handleDownloadBarcode(selectedCard, normalizedApiBaseUrl, generateCardNumber, setBarcodeError, formatDate)}
              className="me-2"
            >
              <i className="fa-solid fa-download me-1"></i> Download
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => handlePrintBarcode(selectedCard, normalizedApiBaseUrl, generateCardNumber, formatDate, setBarcodeError)}
              className="me-2"
            >
              <i className="fa-solid fa-print me-1"></i> Print
            </Button>
          </div>
          <Button variant="secondary" onClick={handleModalClose}>
            <i className="fa-solid fa-times me-1"></i> Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default LibraryCard;