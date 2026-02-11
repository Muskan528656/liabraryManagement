


import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Modal, Alert } from "react-bootstrap";
import DynamicCRUD from "../common/DynaminCrud";
import { getLibraryCardConfig } from "./librarycardconfig";
import JsBarcode from "jsbarcode";
import DataApi from "../../api/dataApi";
import { API_BASE_URL, MODULES } from "../../constants/CONSTANT";

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
      }
    };
    setFinalConfig(config);
    return <span className="loader"></span>;
  }

  const handleModalOpen = (card) => {
    setSelectedCard(card);
    setShowBarcodeModal(true);
  };

  const handleModalClose = () => {
    setShowBarcodeModal(false);
    setSelectedCard(null);
  };

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

      <Modal show={showBarcodeModal} onHide={handleModalClose} centered>
        <Modal.Body className="text-center">
          {selectedCard && <h5>Card No: {selectedCard.card_number}</h5>}
          {barcodeError && <Alert variant="warning">{barcodeError}</Alert>}
        </Modal.Body>
      </Modal>

    </>
  );
};

export default LibraryCard;
